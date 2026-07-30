import {
  Array,
  Effect,
  Layer,
  Match,
  Option,
  Redacted,
  Ref,
  Schema,
} from "effect";

import { VercelMemoryControl } from "./memory.layer.js";
import { VercelEnvironmentVariableId, VercelProjectId } from "./schemas.js";
import type {
  ResolveVercelPreviewPhotonValue,
  UpdateVercelStableEnvironmentVariable,
} from "./stable-environment.js";
import {
  VercelManagedEnvironmentValue,
  VercelPreviewPhotonBindingValues,
  VercelPreviewPhotonEnvironmentKey,
  VercelStableEnvironmentBindings,
  VercelStableEnvironmentReadError,
  VercelStableEnvironmentValue,
  VercelStableEnvironmentWriteError,
} from "./stable-environment.js";

export const VercelStableEnvironmentMemoryFailureMode = Schema.Literals([
  "none",
  "timeoutBeforeWrite",
  "timeoutAfterWrite",
]);
export type VercelStableEnvironmentMemoryFailureMode =
  typeof VercelStableEnvironmentMemoryFailureMode.Type;

export const VercelStableEnvironmentMemoryValue = Schema.Struct({
  environmentVariableId: VercelEnvironmentVariableId,
  key: VercelPreviewPhotonEnvironmentKey,
  valueOwnership: VercelManagedEnvironmentValue,
  value: VercelStableEnvironmentValue,
});
export type VercelStableEnvironmentMemoryValue =
  typeof VercelStableEnvironmentMemoryValue.Type;

export const VercelStableEnvironmentMemoryConfig = Schema.Struct({
  values: Schema.Array(VercelStableEnvironmentMemoryValue),
  failureMode: VercelStableEnvironmentMemoryFailureMode,
  failureProjectIds: Schema.Array(VercelProjectId),
});
export type VercelStableEnvironmentMemoryConfig =
  typeof VercelStableEnvironmentMemoryConfig.Type;

const readFailure = (message: string) =>
  new VercelStableEnvironmentReadError({
    operation: "resolvePreviewPhotonValue",
    reason: "identityMismatch",
    retry: "never",
    certainty: { _tag: "Known" },
    message,
  });

const writeFailure = (
  message: string,
  uncertain: boolean,
  reason: "transient" | "uncertainOutcome" | "requestFailed"
) => {
  const retry = uncertain
    ? "readbackRequired"
    : Match.value(reason).pipe(
        Match.when("transient", () => "backoff" as const),
        Match.orElse(() => "never" as const)
      );
  return new VercelStableEnvironmentWriteError({
    operation: "updateStableEnvironmentVariable",
    reason,
    retry,
    certainty: uncertain
      ? { _tag: "Uncertain", recovery: "operatorReview" }
      : { _tag: "Known" },
    message,
  });
};

export const layerVercelStableEnvironmentMemory = (
  config: VercelStableEnvironmentMemoryConfig
) => {
  const resolvePreviewPhotonValue = Effect.fn(
    "VercelPreviewPhotonBindingValuesMemory.resolvePreviewPhotonValue"
  )(function* (input: typeof ResolveVercelPreviewPhotonValue.Type) {
    const match = Array.findFirst(
      config.values,
      (candidate) =>
        candidate.environmentVariableId === input.environmentVariableId &&
        candidate.key === input.key &&
        candidate.valueOwnership.reference.owner ===
          input.valueOwnership.reference.owner &&
        candidate.valueOwnership.reference.reference ===
          input.valueOwnership.reference.reference &&
        candidate.valueOwnership.reference.revision ===
          input.valueOwnership.reference.revision
    );
    return yield* Option.match(match, {
      onNone: () =>
        Effect.fail(
          readFailure(
            "The memory value does not match the managed Preview Photon reference."
          )
        ),
      onSome: (candidate) => Effect.succeed(candidate.value),
    });
  });
  const values = Layer.succeed(
    VercelPreviewPhotonBindingValues,
    VercelPreviewPhotonBindingValues.of({
      resolvePreviewPhotonValue,
    })
  );
  const bindings = Layer.effect(
    VercelStableEnvironmentBindings,
    Effect.gen(function* makeVercelStableEnvironmentBindingsMemory() {
      const control = yield* VercelMemoryControl;
      const pendingProjectFailures = yield* Ref.make(config.failureProjectIds);
      const updateStableEnvironmentVariable = Effect.fn(
        "VercelStableEnvironmentBindingsMemory.updateStableEnvironmentVariable"
      )(function* (input: typeof UpdateVercelStableEnvironmentVariable.Type) {
        yield* control.recordStableEnvironmentAttempt;
        if (config.failureMode === "timeoutBeforeWrite") {
          return yield* writeFailure(
            "The memory stable environment write timed out before mutation.",
            false,
            "transient"
          );
        }
        const pendingFailures = yield* Ref.get(pendingProjectFailures);
        if (pendingFailures.includes(input.projectId)) {
          yield* Ref.set(
            pendingProjectFailures,
            pendingFailures.filter((projectId) => projectId !== input.projectId)
          );
          return yield* writeFailure(
            "The memory stable environment project failed before mutation.",
            false,
            "requestFailed"
          );
        }
        const configured = Array.findFirst(
          config.values,
          (candidate) =>
            candidate.environmentVariableId === input.environmentVariableId &&
            candidate.key === input.key &&
            candidate.valueOwnership.reference.owner ===
              input.valueOwnership.reference.owner &&
            candidate.valueOwnership.reference.reference ===
              input.valueOwnership.reference.reference &&
            candidate.valueOwnership.reference.revision ===
              input.valueOwnership.reference.revision
        );
        if (
          configured._tag === "None" ||
          Redacted.value(configured.value.value) !== Redacted.value(input.value)
        ) {
          return yield* writeFailure(
            "The memory writer received a value outside exact managed custody.",
            false,
            "transient"
          );
        }
        const updated = yield* control.updateEnvironmentVariable(input);
        if (config.failureMode === "timeoutAfterWrite") {
          return yield* writeFailure(
            "The memory stable environment write completed without a response.",
            true,
            "uncertainOutcome"
          );
        }
        return updated;
      });
      return VercelStableEnvironmentBindings.of({
        updateStableEnvironmentVariable,
      });
    })
  );
  return Layer.merge(values, bindings);
};
