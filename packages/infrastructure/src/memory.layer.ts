import {
  Array,
  Context,
  Effect,
  Layer,
  Match,
  Option,
  pipe,
  Ref,
  Schema,
} from "effect";

import {
  SyntheticResourceDeleteError,
  SyntheticResourceWriteError,
} from "./errors.js";
import {
  DeletedSyntheticResource,
  InfrastructureStateRevision,
  ListedSyntheticResources,
  ProductionInfrastructureStateRevision,
  ReconciledSyntheticResource,
  SyntheticDesiredValue,
  SyntheticPhysicalResourceId,
  SyntheticResourceAttributes,
  SyntheticResourceObservation,
  PreviewInfrastructureStateRevision,
} from "./schemas.js";
import type {
  DeleteSyntheticResource,
  ListSyntheticResources,
  ObserveSyntheticResource,
  ReconcileSyntheticResource,
  SyntheticResourceAttributes as SyntheticResourceAttributesType,
} from "./schemas.js";
import { SyntheticResources } from "./service.js";

const createdResult = Schema.Literal("created").make("created");
const eventualConsistencyMode = Schema.Literal("eventualConsistency").make(
  "eventualConsistency"
);
const noOpResult = Schema.Literal("no_op").make("no_op");
const noFailureMode = Schema.Literal("none").make("none");
const updatedResult = Schema.Literal("updated").make("updated");

export const SyntheticMemoryFailureMode = Schema.Literals([
  "none",
  "timeoutBeforeWrite",
  "timeoutAfterWrite",
  "timeoutAfterWriteEventualConsistency",
  "eventualConsistency",
]);
export type SyntheticMemoryFailureMode = typeof SyntheticMemoryFailureMode.Type;
export type SyntheticMemoryFailureModeEncoded =
  typeof SyntheticMemoryFailureMode.Encoded;

export const SyntheticMemoryConfig = Schema.Struct({
  resources: Schema.Array(SyntheticResourceAttributes),
  failureMode: SyntheticMemoryFailureMode,
});
export type SyntheticMemoryConfig = typeof SyntheticMemoryConfig.Type;
export type SyntheticMemoryConfigEncoded = typeof SyntheticMemoryConfig.Encoded;

export const SyntheticMemoryDrift = Schema.Struct({
  physicalId: SyntheticPhysicalResourceId,
  observedValue: SyntheticDesiredValue,
});
export type SyntheticMemoryDrift = typeof SyntheticMemoryDrift.Type;
export type SyntheticMemoryDriftEncoded = typeof SyntheticMemoryDrift.Encoded;

export const SyntheticMemoryWriteCount = Schema.Struct({
  count: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
});
export type SyntheticMemoryWriteCount = typeof SyntheticMemoryWriteCount.Type;
export type SyntheticMemoryWriteCountEncoded =
  typeof SyntheticMemoryWriteCount.Encoded;

export interface SyntheticResourcesMemoryControlContract {
  readonly setFailureMode: (
    mode: SyntheticMemoryFailureMode
  ) => Effect.Effect<void>;
  readonly setDrift: (input: SyntheticMemoryDrift) => Effect.Effect<void>;
  readonly seedResource: (
    input: SyntheticResourceAttributesType
  ) => Effect.Effect<void>;
  readonly snapshot: Effect.Effect<ListedSyntheticResources>;
  readonly writeCount: Effect.Effect<SyntheticMemoryWriteCount>;
}

export class SyntheticResourcesMemoryControl extends Context.Service<
  SyntheticResourcesMemoryControl,
  SyntheticResourcesMemoryControlContract
>()("@bundjil/infrastructure/SyntheticResourcesMemoryControl") {}

export const layerMemory = (config: SyntheticMemoryConfig) =>
  Layer.effectContext(
    Effect.gen(function* makeSyntheticResourcesMemory() {
      const resources = yield* Ref.make(config.resources);
      const failureMode = yield* Ref.make(config.failureMode);
      const writes = yield* Ref.make(0);

      const observeResource = Effect.fn(
        "SyntheticResourcesMemory.observeResource"
      )(function* (input: ObserveSyntheticResource) {
        const mode = yield* Ref.get(failureMode);
        if (mode === "eventualConsistency") {
          return SyntheticResourceObservation.make({
            _tag: "Missing",
            stage: input.stage,
            physicalId: input.physicalId,
          });
        }
        const current = yield* Ref.get(resources);
        const found = Array.findFirst(
          current,
          (resource) =>
            resource.physicalId === input.physicalId &&
            resource.stage === input.stage
        );
        return Option.match(found, {
          onNone: () =>
            SyntheticResourceObservation.make({
              _tag: "Missing",
              stage: input.stage,
              physicalId: input.physicalId,
            }),
          onSome: (attributes) =>
            SyntheticResourceObservation.make({
              _tag: "Found",
              attributes,
            }),
        });
      });

      const reconcileResource = Effect.fn(
        "SyntheticResourcesMemory.reconcileResource"
      )(function* (input: ReconcileSyntheticResource) {
        const mode = yield* Ref.get(failureMode);
        if (mode === "timeoutBeforeWrite") {
          return yield* new SyntheticResourceWriteError({
            operation: "reconcile",
            resourceKind: "syntheticResource",
            retry: "backoff",
            certainty: { _tag: "Known" },
            message: "Synthetic write timed out before the operation began.",
          });
        }
        if (
          input.observed._tag === "Found" &&
          input.observed.attributes.observedValue === input.desired.desiredValue
        ) {
          return ReconciledSyntheticResource.make({
            attributes: input.observed.attributes,
            result: "no_op",
          });
        }

        const writeNumber = yield* Ref.updateAndGet(
          writes,
          (count) => count + 1
        );
        const revision = yield* Match.value(input.desired.stage).pipe(
          Match.when("preview", () =>
            Schema.decodeUnknownEffect(PreviewInfrastructureStateRevision)(
              `memory-preview-${writeNumber}`
            ).pipe(
              Effect.map((value) =>
                InfrastructureStateRevision.make({
                  _tag: "Preview",
                  revision: value,
                })
              )
            )
          ),
          Match.when("prod", () =>
            Schema.decodeUnknownEffect(ProductionInfrastructureStateRevision)(
              `memory-prod-${writeNumber}`
            ).pipe(
              Effect.map((value) =>
                InfrastructureStateRevision.make({
                  _tag: "Production",
                  revision: value,
                })
              )
            )
          ),
          Match.exhaustive,
          Effect.mapError(
            () =>
              new SyntheticResourceWriteError({
                operation: "reconcile",
                resourceKind: "syntheticResource",
                retry: "never",
                certainty: { _tag: "Known" },
                message: "Unable to encode the synthetic state revision.",
              })
          )
        );
        const attributes = SyntheticResourceAttributes.make({
          stage: input.desired.stage,
          physicalId: input.desired.physicalId,
          observedValue: input.desired.desiredValue,
          observedMetadataDigest: input.desired.adoptionManifestDigest,
          ownership: "Owned",
          stateRevision: revision,
        });
        const result = Match.value(input.observed).pipe(
          Match.tag("Missing", () => createdResult),
          Match.tag("Found", ({ attributes: observed }) =>
            observed.observedValue === input.desired.desiredValue
              ? noOpResult
              : updatedResult
          ),
          Match.exhaustive
        );
        yield* Ref.update(resources, (current) =>
          Array.append(
            pipe(
              current,
              Array.filter(
                (resource) =>
                  resource.physicalId !== input.desired.physicalId ||
                  resource.stage !== input.desired.stage
              )
            ),
            attributes
          )
        );
        yield* Ref.set(
          failureMode,
          Match.value(mode).pipe(
            Match.when(
              "timeoutAfterWriteEventualConsistency",
              () => eventualConsistencyMode
            ),
            Match.orElse(() => noFailureMode)
          )
        );

        if (
          mode === "timeoutAfterWrite" ||
          mode === "timeoutAfterWriteEventualConsistency"
        ) {
          return yield* new SyntheticResourceWriteError({
            operation: "reconcile",
            resourceKind: "syntheticResource",
            retry: "readbackRequired",
            certainty: {
              _tag: "Uncertain",
              recovery: "observeByPhysicalIdentity",
            },
            message: "Synthetic write completed without a response.",
          });
        }
        return ReconciledSyntheticResource.make({ attributes, result });
      });

      const deleteResource = Effect.fn(
        "SyntheticResourcesMemory.deleteResource"
      )(function* (input: DeleteSyntheticResource) {
        if (input.destructivePolicy._tag === "Protected") {
          return yield* new SyntheticResourceDeleteError({
            operation: "delete",
            resourceKind: "syntheticResource",
            retry: "never",
            certainty: { _tag: "Known" },
            message: "Synthetic resource deletion is protected.",
          });
        }
        const before = yield* Ref.get(resources);
        const exists = pipe(
          before,
          Array.some(
            (resource) =>
              resource.physicalId === input.attributes.physicalId &&
              resource.stage === input.attributes.stage
          )
        );
        yield* Ref.update(resources, (current) =>
          pipe(
            current,
            Array.filter(
              (resource) =>
                resource.physicalId !== input.attributes.physicalId ||
                resource.stage !== input.attributes.stage
            )
          )
        );
        return DeletedSyntheticResource.make({
          stage: input.attributes.stage,
          physicalId: input.attributes.physicalId,
          result: exists ? "deleted" : "alreadyMissing",
        });
      });

      const listResources = Effect.fn("SyntheticResourcesMemory.listResources")(
        function* (input: ListSyntheticResources) {
          const current = yield* Ref.get(resources);
          return ListedSyntheticResources.make({
            resources: pipe(
              current,
              Array.filter((resource) => resource.stage === input.stage)
            ),
          });
        }
      );

      const services = Context.empty().pipe(
        Context.add(
          SyntheticResources,
          SyntheticResources.of({
            observeResource,
            reconcileResource,
            deleteResource,
            listResources,
          })
        ),
        Context.add(
          SyntheticResourcesMemoryControl,
          SyntheticResourcesMemoryControl.of({
            setFailureMode: (mode) => Ref.set(failureMode, mode),
            seedResource: (input) =>
              Ref.update(resources, (current) =>
                Array.append(
                  pipe(
                    current,
                    Array.filter(
                      (resource) =>
                        resource.physicalId !== input.physicalId ||
                        resource.stage !== input.stage
                    )
                  ),
                  input
                )
              ),
            setDrift: Effect.fn("SyntheticResourcesMemoryControl.setDrift")(
              function* (input: SyntheticMemoryDrift) {
                yield* Ref.update(resources, (current) =>
                  pipe(
                    current,
                    Array.map((resource) =>
                      resource.physicalId === input.physicalId
                        ? SyntheticResourceAttributes.make({
                            ...resource,
                            observedValue: input.observedValue,
                          })
                        : resource
                    )
                  )
                );
              }
            ),
            snapshot: Ref.get(resources).pipe(
              Effect.map((current) =>
                ListedSyntheticResources.make({ resources: current })
              )
            ),
            writeCount: Ref.get(writes).pipe(
              Effect.map((count) => SyntheticMemoryWriteCount.make({ count }))
            ),
          })
        )
      );
      return services;
    })
  );

export const emptyMemoryConfig = SyntheticMemoryConfig.make({
  resources: [],
  failureMode: "none",
});
