/* oxlint-disable promise/prefer-await-to-callbacks -- Effect test combinators preserve typed failures without Promise escape. */
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Schema } from "effect";

import {
  loadVercelPreviewConfigurationInput,
  loadVercelStableEnvironmentAuthority,
  VercelPreviewConfigurationAuthorityError,
  VercelStableEnvironmentAuthorityError,
} from "../src/vercel/index.js";

const previewConfig = (authorityPath: string) =>
  ConfigProvider.fromUnknown({
    BUNDJIL_PREVIEW_CONFIGURATION_AUTHORITY_PATH: authorityPath,
    BUNDJIL_PREVIEW_VERCEL_PROJECT_ID: "project-preview",
    BUNDJIL_PREVIEW_VERCEL_TEAM_ID: "team-preview",
  });

const stableConfig = (authorityPath: string) =>
  ConfigProvider.fromUnknown({
    BUNDJIL_INFRASTRUCTURE_STAGE: "preview",
    BUNDJIL_STABLE_ENVIRONMENT_AUTHORITY_PATH: authorityPath,
  });

it.effect("closes Preview authority loader failures", () =>
  Effect.forEach(
    [
      {
        config: previewConfig(""),
        reason: "configurationInvalid",
      },
      {
        config: previewConfig("tmp/missing-preview-authority.json"),
        reason: "authorityUnreadable",
      },
      {
        config: previewConfig("package.json"),
        reason: "authorityInvalid",
      },
    ] as const,
    ({ config, reason }) =>
      loadVercelPreviewConfigurationInput.pipe(
        Effect.provideService(ConfigProvider.ConfigProvider, config),
        Effect.provide(BunFileSystem.layer),
        Effect.flip,
        Effect.flatMap((error) =>
          Schema.decodeUnknownEffect(VercelPreviewConfigurationAuthorityError)(
            error
          )
        ),
        Effect.tap((error) =>
          Effect.sync(() => {
            assert.strictEqual(error.reason, reason);
          })
        )
      ),
    { discard: true }
  )
);

it.effect("closes stable-environment authority loader failures", () =>
  Effect.forEach(
    [
      {
        config: stableConfig(""),
        reason: "configurationInvalid",
      },
      {
        config: stableConfig("tmp/missing-stable-authority.json"),
        reason: "authorityUnreadable",
      },
      {
        config: stableConfig("package.json"),
        reason: "authorityInvalid",
      },
    ] as const,
    ({ config, reason }) =>
      loadVercelStableEnvironmentAuthority.pipe(
        Effect.provideService(ConfigProvider.ConfigProvider, config),
        Effect.provide(BunFileSystem.layer),
        Effect.flip,
        Effect.flatMap((error) =>
          Schema.decodeUnknownEffect(VercelStableEnvironmentAuthorityError)(
            error
          )
        ),
        Effect.tap((error) =>
          Effect.sync(() => {
            assert.strictEqual(error.reason, reason);
          })
        )
      ),
    { discard: true }
  )
);
