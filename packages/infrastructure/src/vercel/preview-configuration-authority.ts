import { isAbsolute } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import { Config, Effect, FileSystem, Schema } from "effect";

import authorityEnvelopeSchema from "../../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import previewConfigurationAuthorityPolicy from "../../schemas/preview-vercel-configuration-authority.schema.json" with { type: "json" };
import { InfrastructureDestructivePolicy } from "../schemas.js";
import { VercelPreviewEnvironmentValue } from "./configuration.js";
import {
  VercelEnvironmentVariableKey,
  VercelProjectId,
  VercelTeamId,
} from "./schemas.js";

export const VercelPreviewConfigurationPhase = Schema.Literals([
  "desired",
  "rollback",
]);
export type VercelPreviewConfigurationPhase =
  typeof VercelPreviewConfigurationPhase.Type;
export type VercelPreviewConfigurationPhaseEncoded =
  typeof VercelPreviewConfigurationPhase.Encoded;

export const VercelPreviewConfigurationAuthorityPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "The Preview configuration authority path must be safe and repository-relative."
    )
  ),
  Schema.brand(
    "@bundjil/infrastructure/vercel/VercelPreviewConfigurationAuthorityPath"
  )
);
export type VercelPreviewConfigurationAuthorityPath =
  typeof VercelPreviewConfigurationAuthorityPath.Type;
export type VercelPreviewConfigurationAuthorityPathEncoded =
  typeof VercelPreviewConfigurationAuthorityPath.Encoded;

export const VercelPreviewConfigurationInput = Schema.Struct({
  phase: VercelPreviewConfigurationPhase,
  authorityPath: VercelPreviewConfigurationAuthorityPath,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  environmentKey: VercelEnvironmentVariableKey,
  environmentValue: VercelPreviewEnvironmentValue,
  destructivePolicy: InfrastructureDestructivePolicy,
});
export type VercelPreviewConfigurationInput =
  typeof VercelPreviewConfigurationInput.Type;
export type VercelPreviewConfigurationInputEncoded =
  typeof VercelPreviewConfigurationInput.Encoded;

const phaseConfig = Config.schema(
  VercelPreviewConfigurationPhase,
  "BUNDJIL_PREVIEW_CONFIGURATION_PHASE"
).pipe(Config.withDefault("desired"));
const authorityPathConfig = Config.schema(
  VercelPreviewConfigurationAuthorityPath,
  "BUNDJIL_PREVIEW_CONFIGURATION_AUTHORITY_PATH"
);
const teamIdConfig = Config.schema(
  VercelTeamId,
  "BUNDJIL_PREVIEW_VERCEL_TEAM_ID"
);
const projectIdConfig = Config.schema(
  VercelProjectId,
  "BUNDJIL_PREVIEW_VERCEL_PROJECT_ID"
);
const environmentKeyConfig = Config.schema(
  VercelEnvironmentVariableKey,
  "BUNDJIL_PREVIEW_VERCEL_ENVIRONMENT_KEY"
).pipe(
  Config.withDefault(
    VercelEnvironmentVariableKey.make("BUNDJIL_ALCHEMY_PREVIEW_SPIKE")
  )
);
const environmentValueConfig = Config.schema(
  VercelPreviewEnvironmentValue,
  "BUNDJIL_PREVIEW_VERCEL_ENVIRONMENT_VALUE"
).pipe(
  Config.withDefault(
    VercelPreviewEnvironmentValue.make("alchemy-preview-spike")
  )
);

const validateAuthority = Effect.fn(
  "VercelPreviewConfigurationAuthority.validate"
)(function* (path: VercelPreviewConfigurationAuthorityPath) {
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(path);
  if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
    return yield* Effect.fail("preview-configuration-authority-invalid");
  }
  const text = yield* fileSystem.readFileString(path);
  const authority = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(Schema.Unknown)
  )(text);
  const options = {
    allErrors: true,
    strict: false,
    validateFormats: false,
  } as const;
  if (
    !new Ajv2020(options).compile(authorityEnvelopeSchema)(authority) ||
    !new Ajv2020(options).compile(previewConfigurationAuthorityPolicy)(
      authority
    )
  ) {
    return yield* Effect.fail("preview-configuration-authority-invalid");
  }
  return path;
});

export const loadVercelPreviewConfigurationInput = Effect.gen(
  function* loadVercelPreviewConfigurationInputOperation() {
    const phase = yield* phaseConfig;
    const authorityPath = yield* authorityPathConfig;
    yield* validateAuthority(authorityPath);
    const teamId = yield* teamIdConfig;
    const projectId = yield* projectIdConfig;
    const environmentKey = yield* environmentKeyConfig;
    const environmentValue = yield* environmentValueConfig;
    const destructivePolicy = yield* Schema.decodeUnknownEffect(
      InfrastructureDestructivePolicy
    )({
      _tag: "Permitted",
      approvalReceipt: authorityPath,
    });
    return VercelPreviewConfigurationInput.make({
      phase,
      authorityPath,
      teamId,
      projectId,
      environmentKey,
      environmentValue,
      destructivePolicy,
    });
  }
).pipe(Effect.withSpan("VercelPreviewConfigurationInput.load"));
