/* oxlint-disable unicorn/no-array-method-this-argument -- Effect Array data-first combinators are not native Array methods with a thisArg. */

import { Array, Context, Effect, Layer, Option, Ref, Schema } from "effect";

import {
  VercelPreviewConfiguration,
  VercelPreviewConfigurationWriteError,
  VercelPreviewEnvironmentMetadataAttributes,
  VercelPreviewEnvironmentMetadataObservation,
  VercelPreviewFeedbackAttributes,
  VercelPreviewFeedbackObservation,
} from "./configuration.js";
import type {
  CreateVercelPreviewEnvironmentMetadata,
  DeleteVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewFeedback,
  SetVercelPreviewFeedback,
} from "./configuration.js";
import { VercelEnvironmentVariableId } from "./schemas.js";

export const VercelPreviewConfigurationMemoryFailureMode = Schema.Literals([
  "none",
  "timeoutBeforeWrite",
  "timeoutAfterWrite",
  "timeoutAfterWriteEventualConsistency",
  "eventualConsistency",
]);
export type VercelPreviewConfigurationMemoryFailureMode =
  typeof VercelPreviewConfigurationMemoryFailureMode.Type;
export type VercelPreviewConfigurationMemoryFailureModeEncoded =
  typeof VercelPreviewConfigurationMemoryFailureMode.Encoded;

export const VercelPreviewConfigurationMemoryConfig = Schema.Struct({
  feedback: Schema.Array(VercelPreviewFeedbackAttributes),
  environmentMetadata: Schema.Array(VercelPreviewEnvironmentMetadataAttributes),
  failureMode: VercelPreviewConfigurationMemoryFailureMode,
});
export type VercelPreviewConfigurationMemoryConfig =
  typeof VercelPreviewConfigurationMemoryConfig.Type;
export type VercelPreviewConfigurationMemoryConfigEncoded =
  typeof VercelPreviewConfigurationMemoryConfig.Encoded;

export const VercelPreviewConfigurationMemoryCount = Schema.Struct({
  count: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
});
export type VercelPreviewConfigurationMemoryCount =
  typeof VercelPreviewConfigurationMemoryCount.Type;

export const VercelPreviewFeedbackDrift = Schema.Struct({
  stage: Schema.Literal("preview"),
  teamId: VercelPreviewFeedbackAttributes.fields.teamId,
  projectId: VercelPreviewFeedbackAttributes.fields.projectId,
  enabled: VercelPreviewFeedbackAttributes.fields.enabled,
});
export type VercelPreviewFeedbackDrift = typeof VercelPreviewFeedbackDrift.Type;

export interface VercelPreviewConfigurationMemoryControlContract {
  readonly setFailureMode: (
    mode: VercelPreviewConfigurationMemoryFailureMode
  ) => Effect.Effect<void>;
  readonly setFeedbackDrift: (
    drift: VercelPreviewFeedbackDrift
  ) => Effect.Effect<void>;
  readonly snapshot: Effect.Effect<VercelPreviewConfigurationMemoryConfig>;
  readonly writeCount: Effect.Effect<VercelPreviewConfigurationMemoryCount>;
  readonly observationCount: Effect.Effect<VercelPreviewConfigurationMemoryCount>;
}

export class VercelPreviewConfigurationMemoryControl extends Context.Service<
  VercelPreviewConfigurationMemoryControl,
  VercelPreviewConfigurationMemoryControlContract
>()("@bundjil/infrastructure/vercel/VercelPreviewConfigurationMemoryControl") {}

const noFailure = VercelPreviewConfigurationMemoryFailureMode.make("none");

export const layerVercelPreviewConfigurationMemory = (
  config: VercelPreviewConfigurationMemoryConfig
) =>
  Layer.effectContext(
    Effect.gen(function* makeVercelPreviewConfigurationMemory() {
      const feedback = yield* Ref.make(config.feedback);
      const environmentMetadata = yield* Ref.make(config.environmentMetadata);
      const failureMode = yield* Ref.make(config.failureMode);
      const eventualReadsRemaining = yield* Ref.make(0);
      const writes = yield* Ref.make(0);
      const observations = yield* Ref.make(0);

      const shouldHideObservation = Effect.gen(function* hideObservation() {
        yield* Ref.update(observations, (count) => count + 1);
        const mode = yield* Ref.get(failureMode);
        if (mode === "eventualConsistency") {
          return true;
        }
        const remaining = yield* Ref.get(eventualReadsRemaining);
        if (remaining === 0) {
          return false;
        }
        yield* Ref.set(eventualReadsRemaining, remaining - 1);
        return true;
      });

      const observePreviewFeedback = Effect.fn(
        "VercelPreviewConfigurationMemory.observePreviewFeedback"
      )(function* (input: ObserveVercelPreviewFeedback) {
        if (yield* shouldHideObservation) {
          return VercelPreviewFeedbackObservation.make({
            _tag: "Missing",
            stage: input.stage,
            teamId: input.teamId,
            projectId: input.projectId,
          });
        }
        const current = yield* Ref.get(feedback);
        return Option.match(
          Array.findFirst(
            current,
            (candidate) =>
              candidate.stage === input.stage &&
              candidate.teamId === input.teamId &&
              candidate.projectId === input.projectId
          ),
          {
            onNone: () =>
              VercelPreviewFeedbackObservation.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                projectId: input.projectId,
              }),
            onSome: (attributes) =>
              VercelPreviewFeedbackObservation.make({
                _tag: "Found",
                attributes,
              }),
          }
        );
      });

      const setPreviewFeedback = Effect.fn(
        "VercelPreviewConfigurationMemory.setPreviewFeedback"
      )(function* (input: SetVercelPreviewFeedback) {
        const mode = yield* Ref.get(failureMode);
        if (mode === "timeoutBeforeWrite") {
          return yield* new VercelPreviewConfigurationWriteError({
            operation: "setPreviewFeedback",
            reason: "transient",
            retry: "backoff",
            certainty: { _tag: "Known" },
            message: "The memory write timed out before it began.",
          });
        }
        const attributes = VercelPreviewFeedbackAttributes.make({
          stage: input.stage,
          teamId: input.teamId,
          projectId: input.projectId,
          enabled: input.desired,
          productionEnabled: input.productionGuard,
          ownership: "Owned",
        });
        yield* Ref.update(feedback, (current) =>
          Array.append(
            Array.filter(
              current,
              (candidate) =>
                candidate.teamId !== input.teamId ||
                candidate.projectId !== input.projectId
            ),
            attributes
          )
        );
        yield* Ref.update(writes, (count) => count + 1);
        yield* Ref.set(failureMode, noFailure);
        if (mode === "timeoutAfterWriteEventualConsistency") {
          yield* Ref.set(eventualReadsRemaining, 10);
        }
        if (
          mode === "timeoutAfterWrite" ||
          mode === "timeoutAfterWriteEventualConsistency"
        ) {
          return yield* new VercelPreviewConfigurationWriteError({
            operation: "setPreviewFeedback",
            reason: "uncertainOutcome",
            retry: "readbackRequired",
            certainty: {
              _tag: "Uncertain",
              recovery: "observeByPhysicalIdentity",
            },
            message: "The memory write completed without a response.",
          });
        }
        return attributes;
      });

      const observePreviewEnvironmentMetadata = Effect.fn(
        "VercelPreviewConfigurationMemory.observePreviewEnvironmentMetadata"
      )(function* (input: ObserveVercelPreviewEnvironmentMetadata) {
        if (yield* shouldHideObservation) {
          return VercelPreviewEnvironmentMetadataObservation.make({
            _tag: "Missing",
            stage: input.stage,
            teamId: input.teamId,
            projectId: input.projectId,
            key: input.key,
          });
        }
        const current = yield* Ref.get(environmentMetadata);
        return Option.match(
          Array.findFirst(
            current,
            (candidate) =>
              candidate.stage === input.stage &&
              candidate.teamId === input.teamId &&
              candidate.projectId === input.projectId &&
              candidate.key === input.key
          ),
          {
            onNone: () =>
              VercelPreviewEnvironmentMetadataObservation.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                projectId: input.projectId,
                key: input.key,
              }),
            onSome: (attributes) =>
              VercelPreviewEnvironmentMetadataObservation.make({
                _tag: "Found",
                attributes,
              }),
          }
        );
      });

      const createPreviewEnvironmentMetadata = Effect.fn(
        "VercelPreviewConfigurationMemory.createPreviewEnvironmentMetadata"
      )(function* (input: CreateVercelPreviewEnvironmentMetadata) {
        const mode = yield* Ref.get(failureMode);
        if (mode === "timeoutBeforeWrite") {
          return yield* new VercelPreviewConfigurationWriteError({
            operation: "createPreviewEnvironmentMetadata",
            reason: "transient",
            retry: "backoff",
            certainty: { _tag: "Known" },
            message: "The memory create timed out before it began.",
          });
        }
        const writeNumber = yield* Ref.updateAndGet(
          writes,
          (count) => count + 1
        );
        const environmentVariableId = yield* Schema.decodeUnknownEffect(
          VercelEnvironmentVariableId
        )(`preview-spike-${writeNumber}`).pipe(
          Effect.mapError(
            () =>
              new VercelPreviewConfigurationWriteError({
                operation: "createPreviewEnvironmentMetadata",
                reason: "requestFailed",
                retry: "never",
                certainty: { _tag: "Known" },
                message:
                  "The memory environment identity could not be decoded.",
              })
          )
        );
        const attributes = VercelPreviewEnvironmentMetadataAttributes.make({
          stage: input.stage,
          teamId: input.teamId,
          projectId: input.projectId,
          environmentVariableId,
          key: input.key,
          type: "plain",
          targets: ["preview"],
          sensitive: false,
          ownership: "Owned",
        });
        yield* Ref.update(environmentMetadata, (current) =>
          Array.append(current, attributes)
        );
        yield* Ref.set(failureMode, noFailure);
        if (mode === "timeoutAfterWriteEventualConsistency") {
          yield* Ref.set(eventualReadsRemaining, 10);
        }
        if (
          mode === "timeoutAfterWrite" ||
          mode === "timeoutAfterWriteEventualConsistency"
        ) {
          return yield* new VercelPreviewConfigurationWriteError({
            operation: "createPreviewEnvironmentMetadata",
            reason: "uncertainOutcome",
            retry: "readbackRequired",
            certainty: {
              _tag: "Uncertain",
              recovery: "observeByPhysicalIdentity",
            },
            message: "The memory create completed without a response.",
          });
        }
        return attributes;
      });

      const deletePreviewEnvironmentMetadata = Effect.fn(
        "VercelPreviewConfigurationMemory.deletePreviewEnvironmentMetadata"
      )(function* (input: DeleteVercelPreviewEnvironmentMetadata) {
        if (input.destructivePolicy._tag !== "Permitted") {
          return yield* new VercelPreviewConfigurationWriteError({
            operation: "deletePreviewEnvironmentMetadata",
            reason: "protected",
            retry: "never",
            certainty: { _tag: "Known" },
            message:
              "The memory Preview environment resource is deletion-protected.",
          });
        }
        yield* Ref.update(environmentMetadata, (current) =>
          Array.filter(
            current,
            (candidate) =>
              candidate.environmentVariableId !==
              input.attributes.environmentVariableId
          )
        );
        yield* Ref.update(writes, (count) => count + 1);
        return yield* Effect.void;
      });

      const setFeedbackDrift = Effect.fn(
        "VercelPreviewConfigurationMemoryControl.setFeedbackDrift"
      )(function* (drift: VercelPreviewFeedbackDrift) {
        yield* Ref.update(feedback, (current) =>
          Array.map(current, (candidate) =>
            candidate.teamId === drift.teamId &&
            candidate.projectId === drift.projectId
              ? VercelPreviewFeedbackAttributes.make({
                  ...candidate,
                  enabled: drift.enabled,
                })
              : candidate
          )
        );
      });

      const snapshot = Effect.all({
        feedback: Ref.get(feedback),
        environmentMetadata: Ref.get(environmentMetadata),
        failureMode: Ref.get(failureMode),
      }).pipe(
        Effect.map((current) =>
          VercelPreviewConfigurationMemoryConfig.make(current)
        )
      );

      return Context.empty().pipe(
        Context.add(
          VercelPreviewConfiguration,
          VercelPreviewConfiguration.of({
            observePreviewFeedback,
            setPreviewFeedback,
            observePreviewEnvironmentMetadata,
            createPreviewEnvironmentMetadata,
            deletePreviewEnvironmentMetadata,
          })
        ),
        Context.add(
          VercelPreviewConfigurationMemoryControl,
          VercelPreviewConfigurationMemoryControl.of({
            setFailureMode: (mode) =>
              Ref.set(failureMode, mode).pipe(
                Effect.andThen(
                  mode === "none"
                    ? Ref.set(eventualReadsRemaining, 0)
                    : Effect.void
                )
              ),
            setFeedbackDrift,
            snapshot,
            writeCount: Ref.get(writes).pipe(
              Effect.map((count) =>
                VercelPreviewConfigurationMemoryCount.make({ count })
              )
            ),
            observationCount: Ref.get(observations).pipe(
              Effect.map((count) =>
                VercelPreviewConfigurationMemoryCount.make({ count })
              )
            ),
          })
        )
      );
    })
  );

export const emptyVercelPreviewConfigurationMemory =
  VercelPreviewConfigurationMemoryConfig.make({
    feedback: [],
    environmentMetadata: [],
    failureMode: "none",
  });
