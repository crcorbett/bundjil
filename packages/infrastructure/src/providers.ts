import type { Resource } from "alchemy";
import { Unowned } from "alchemy/AdoptPolicy";
import { isResolved } from "alchemy/Diff";
import * as Provider from "alchemy/Provider";
import { Resource as makeResource } from "alchemy/Resource";
import { Effect, Match, Schedule, Schema } from "effect";

import {
  SyntheticResourceReadError,
  SyntheticResourceWriteError,
} from "./errors.js";
import type {
  SyntheticResourceAttributes as SyntheticResourceAttributesType,
  SyntheticResourceProps as SyntheticResourcePropsType,
} from "./schemas.js";
import {
  DeleteSyntheticResource,
  ListSyntheticResources,
  ObserveSyntheticResource,
  ReconcileSyntheticResource,
} from "./schemas.js";
import { SyntheticResources } from "./service.js";

const missingSyntheticResource = undefined;
const SyntheticResourceNoopDiff = Schema.Struct({
  action: Schema.Literal("noop"),
});
const SyntheticResourceReplaceDiff = Schema.Struct({
  action: Schema.Literal("replace"),
});
const SyntheticResourceUpdateDiff = Schema.Struct({
  action: Schema.Literal("update"),
});

export type SyntheticResource = Resource<
  "Bundjil.Infrastructure.SyntheticResource",
  SyntheticResourcePropsType,
  SyntheticResourceAttributesType
>;

export const SyntheticResource = makeResource<SyntheticResource>(
  "Bundjil.Infrastructure.SyntheticResource",
  { defaultRemovalPolicy: "retain" }
);

export const SyntheticResourceProvider = Provider.succeed(
  SyntheticResource,
  SyntheticResource.Provider.of({
    read: Effect.fn("SyntheticResourceProvider.read")(function* ({
      olds,
      output,
    }) {
      const resources = yield* SyntheticResources;
      const observation = yield* resources.observeResource(
        ObserveSyntheticResource.make({
          stage: olds.stage,
          physicalId: output?.physicalId ?? olds.physicalId,
        })
      );
      return yield* Match.value(observation).pipe(
        Match.tag("Missing", () => Effect.succeed(missingSyntheticResource)),
        Match.tag("Found", ({ attributes }) =>
          Match.value({
            hasPriorOutput: output !== undefined,
            ownership: attributes.ownership,
            manifestMatches:
              attributes.observedMetadataDigest === olds.adoptionManifestDigest,
          }).pipe(
            Match.when(
              {
                hasPriorOutput: false,
                ownership: "Unowned",
                manifestMatches: false,
              },
              () =>
                Effect.fail(
                  new SyntheticResourceReadError({
                    operation: "read",
                    resourceKind: "syntheticResource",
                    retry: "never",
                    certainty: { _tag: "Known" },
                    message:
                      "Observed resource metadata does not match the adoption manifest.",
                  })
                )
            ),
            Match.when(
              {
                hasPriorOutput: false,
                ownership: "Unowned",
                manifestMatches: true,
              },
              () => Effect.succeed(Unowned(attributes))
            ),
            Match.orElse(() => Effect.succeed(attributes))
          )
        ),
        Match.exhaustive
      );
    }),
    diff: Effect.fn("SyntheticResourceProvider.diff")(({ news, olds }) =>
      Effect.sync(() => {
        if (!isResolved(news)) {
          return missingSyntheticResource;
        }
        if (news.physicalId !== olds.physicalId || news.stage !== olds.stage) {
          return SyntheticResourceReplaceDiff.make({ action: "replace" });
        }
        return news.desiredValue === olds.desiredValue
          ? SyntheticResourceNoopDiff.make({ action: "noop" })
          : SyntheticResourceUpdateDiff.make({ action: "update" });
      })
    ),
    reconcile: Effect.fn("SyntheticResourceProvider.reconcile")((input) =>
      Effect.gen(function* reconcileSyntheticResource() {
        const resources = yield* SyntheticResources;
        const observation = yield* resources.observeResource(
          ObserveSyntheticResource.make({
            stage: input.news.stage,
            physicalId: input.news.physicalId,
          })
        );
        const reconciled = yield* resources.reconcileResource(
          ReconcileSyntheticResource.make({
            desired: input.news,
            observed: observation,
          })
        );
        return reconciled.attributes;
      }).pipe(
        Effect.catchTag("SyntheticResourceWriteError", (failure) =>
          Match.value(failure.certainty).pipe(
            Match.tag("Known", () => Effect.fail(failure)),
            Match.tag("Uncertain", () =>
              Effect.gen(function* recoverSyntheticResourceWrite() {
                const resources = yield* SyntheticResources;
                const recovered = yield* resources.observeResource(
                  ObserveSyntheticResource.make({
                    stage: input.news.stage,
                    physicalId: input.news.physicalId,
                  })
                );
                return yield* Match.value(recovered).pipe(
                  Match.tag("Missing", () =>
                    Effect.fail(
                      new SyntheticResourceWriteError({
                        operation: "read",
                        resourceKind: "syntheticResource",
                        retry: "backoff",
                        certainty: {
                          _tag: "Uncertain",
                          recovery: "observeByPhysicalIdentity",
                        },
                        message:
                          "Synthetic write readback has not become consistent.",
                      })
                    )
                  ),
                  Match.tag("Found", ({ attributes }) =>
                    attributes.observedValue === input.news.desiredValue
                      ? Effect.succeed(attributes)
                      : Effect.fail(
                          new SyntheticResourceWriteError({
                            operation: "reconcile",
                            resourceKind: "syntheticResource",
                            retry: "never",
                            certainty: {
                              _tag: "Uncertain",
                              recovery: "operatorReview",
                            },
                            message:
                              "Synthetic write readback did not match the desired state.",
                          })
                        )
                  ),
                  Match.exhaustive
                );
              }).pipe(
                Effect.retry({
                  times: 2,
                  schedule: Schedule.exponential("1 millis").pipe(
                    Schedule.jittered
                  ),
                  while: (readbackFailure) =>
                    readbackFailure.retry === "backoff",
                })
              )
            ),
            Match.exhaustive
          )
        )
      )
    ),
    delete: Effect.fn("SyntheticResourceProvider.delete")(function* ({
      olds,
      output,
    }) {
      const resources = yield* SyntheticResources;
      yield* resources.deleteResource(
        DeleteSyntheticResource.make({
          attributes: output,
          destructivePolicy: olds.destructivePolicy,
        })
      );
    }),
    list: Effect.fn("SyntheticResourceProvider.list")(function* () {
      const resources = yield* SyntheticResources;
      const preview = yield* resources.listResources(
        ListSyntheticResources.make({ stage: "preview" })
      );
      const production = yield* resources.listResources(
        ListSyntheticResources.make({ stage: "prod" })
      );
      return [...preview.resources, ...production.resources];
    }),
    stables: ["physicalId"],
  })
);
