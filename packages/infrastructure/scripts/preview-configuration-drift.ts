import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import * as BunRuntime from "@effect/platform-bun/BunRuntime";
import { Console, Effect, Layer, Schema } from "effect";

import {
  layerVercelPreviewConfigurationLive,
  loadVercelPreviewConfigurationInput,
  ObserveVercelPreviewFeedback,
  SetVercelPreviewFeedback,
  VercelPreviewConfiguration,
} from "../src/vercel/index.js";

const PreviewConfigurationDriftFailureReason = Schema.Literals([
  "preconditionFailed",
  "readbackFailed",
]);
class PreviewConfigurationDriftError extends Schema.TaggedErrorClass<PreviewConfigurationDriftError>()(
  "PreviewConfigurationDriftError",
  { reason: PreviewConfigurationDriftFailureReason }
) {}

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
      const mutation = yield* configuration.setPreviewFeedback(
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
      return yield* Console.log({
        operation: "direct-preview-feedback-drift",
        before: before.attributes,
        mutation,
        after: after.attributes,
      });
    })
  ),
  Effect.provide(
    Layer.merge(layerVercelPreviewConfigurationLive, BunFileSystem.layer)
  )
);

BunRuntime.runMain(runPreviewConfigurationDrift);
