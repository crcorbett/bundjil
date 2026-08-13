import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { Console, Effect, Exit, Layer, Schema } from "effect";

import {
  layerVercelPreviewConfigurationLive,
  loadVercelPreviewConfigurationInput,
  ObserveVercelPreviewFeedback,
  SetVercelPreviewFeedback,
  VercelPreviewConfiguration,
} from "../src/vercel/index.js";

declare const process: {
  exitCode: number | undefined;
};

const PreviewConfigurationDriftFailureReason = Schema.Literals([
  "preconditionFailed",
  "readbackFailed",
]);
class PreviewConfigurationDriftError extends Schema.TaggedErrorClass<PreviewConfigurationDriftError>()(
  "PreviewConfigurationDriftError",
  { reason: PreviewConfigurationDriftFailureReason }
) {}

const PreviewConfigurationDriftCompleted = Schema.Struct({
  operation: Schema.Literal("direct-preview-feedback-drift"),
  status: Schema.Literal("completed"),
  beforeEnabled: Schema.Literal(true),
  afterEnabled: Schema.Literal(false),
});
const PreviewConfigurationDriftBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});
const encodeCompleted = Schema.encodeEffect(
  Schema.fromJsonString(PreviewConfigurationDriftCompleted)
);
const encodeBlocked = Schema.encodeEffect(
  Schema.fromJsonString(PreviewConfigurationDriftBlocked)
);

const runPreviewConfigurationDrift = loadVercelPreviewConfigurationInput.pipe(
  Effect.flatMap((input) =>
    Effect.gen(function* runPreviewConfigurationDriftOperation() {
      const configuration = yield* VercelPreviewConfiguration;
      const before = yield* configuration.observePreviewFeedback(
        ObserveVercelPreviewFeedback.make({
          stage: "preview",
          teamId: input.teamId,
          projectId: input.projectId,
        })
      );
      if (
        before._tag !== "Found" ||
        before.attributes.enabled !== true ||
        before.attributes.productionEnabled !== null
      ) {
        return yield* new PreviewConfigurationDriftError({
          reason: "preconditionFailed",
        });
      }
      yield* configuration.setPreviewFeedback(
        SetVercelPreviewFeedback.make({
          stage: "preview",
          teamId: input.teamId,
          projectId: input.projectId,
          desired: false,
          productionGuard: null,
        })
      );
      const after = yield* configuration.observePreviewFeedback(
        ObserveVercelPreviewFeedback.make({
          stage: "preview",
          teamId: input.teamId,
          projectId: input.projectId,
        })
      );
      if (
        after._tag !== "Found" ||
        after.attributes.enabled !== false ||
        after.attributes.productionEnabled !== null
      ) {
        return yield* new PreviewConfigurationDriftError({
          reason: "readbackFailed",
        });
      }
      return PreviewConfigurationDriftCompleted.make({
        operation: "direct-preview-feedback-drift",
        status: "completed",
        beforeEnabled: true,
        afterEnabled: false,
      });
    })
  )
);

const runtime = Layer.merge(
  layerVercelPreviewConfigurationLive,
  BunFileSystem.layer
);

const main = Effect.gen(function* renderPreviewConfigurationDrift() {
  const exit = yield* Effect.exit(
    runPreviewConfigurationDrift.pipe(
      Effect.flatMap(encodeCompleted),
      Effect.provide(runtime)
    )
  );
  if (Exit.isSuccess(exit)) {
    return yield* Console.log(exit.value);
  }
  const blockedOutput = yield* encodeBlocked(
    PreviewConfigurationDriftBlocked.make({ status: "blocked" })
  ).pipe(Effect.orDie);
  yield* Console.error(blockedOutput);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);
