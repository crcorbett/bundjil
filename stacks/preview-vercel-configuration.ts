// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */

import type { VercelPreviewConfigurationInput } from "@bundjil/infrastructure/vercel";
import {
  VercelPreviewEnvironmentMetadata,
  VercelPreviewFeedback,
} from "@bundjil/infrastructure/vercel";
import { adopt } from "alchemy/AdoptPolicy";
import { destroy } from "alchemy/RemovalPolicy";
import { Stage } from "alchemy/Stage";
import { Config, Effect, Schema } from "effect";

const PreviewStage = Schema.Literal("preview");

const failStage = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

export const BundjilPreviewVercelConfigurationStack = (
  input: VercelPreviewConfigurationInput
) =>
  Effect.gen(function* bundjilPreviewVercelConfigurationStack() {
    const rawStage = yield* Stage;
    const stage = yield* Schema.decodeUnknownEffect(PreviewStage)(
      rawStage
    ).pipe(
      Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
    );
    if (stage !== "preview") {
      return yield* failStage(
        "The Vercel configuration spike is restricted to Preview."
      );
    }
    const feedback = yield* VercelPreviewFeedback("PreviewFeedback", {
      stage,
      teamId: input.teamId,
      projectId: input.projectId,
      desired: input.phase === "desired" ? true : null,
      productionGuard: null,
    }).pipe(adopt(true));
    if (input.phase === "rollback") {
      return {
        stage,
        phase: input.phase,
        feedback,
        environmentMetadata: null,
      } as const;
    }
    const environmentMetadata = yield* VercelPreviewEnvironmentMetadata(
      "PreviewEnvironmentMetadata",
      {
        stage,
        teamId: input.teamId,
        projectId: input.projectId,
        key: input.environmentKey,
        value: input.environmentValue,
        destructivePolicy: input.destructivePolicy,
      }
    ).pipe(destroy());
    return {
      stage,
      phase: input.phase,
      feedback,
      environmentMetadata,
    } as const;
  });
