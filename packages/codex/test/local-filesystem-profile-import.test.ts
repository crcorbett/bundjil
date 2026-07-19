import * as BunServices from "@effect/platform-bun/BunServices";
import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";

import { CodexLocalProfileImportConfig } from "../src/auth/contracts.js";
import type { CodexCliAuthCache } from "../src/auth/contracts.js";
import { CodexFileSystemDirectory } from "../src/auth/credentials.js";
import { CodexLocalAuthCacheSourceMemory } from "../src/auth/local-cache.js";
import { CodexLocalProfileImportConfigService } from "../src/auth/local-import-config.js";
import {
  CodexLocalProfileImportServiceLive,
  importCodexLocalProfile,
} from "../src/auth/local-import.js";
import { CodexOAuthProfileCipherConfig } from "../src/profiles/contracts.js";
import { codexOAuthProfileStorageKey } from "../src/profiles/keys.js";
import { getProfile } from "../src/profiles/store.js";
import { CodexProfileStoreEncryptedKeyValueLive } from "../src/runtime.js";
import { CodexFileSystemKeyValueStoreLive } from "../src/storage/filesystem.js";
import { CodexOAuthProfileCipherTest } from "../src/testing/index.js";

const fixtureAccessToken = "filesystem-fixture-access-token";
const fixtureRefreshToken = "filesystem-fixture-refresh-token";
const fixtureIdToken = "filesystem-fixture-id-token";

const importConfig = Schema.decodeUnknownEffect(CodexLocalProfileImportConfig)({
  localAuthFile: "/fixture/codex-auth.json",
  subject: {
    provider: "codex",
    principal: {
      type: "chatgpt-user",
      id: "filesystem-proof-subject",
      issuer: "https://auth.openai.com",
    },
    connectorId: "bundjil-local",
    installationId: "filesystem-proof",
    profileId: "default",
  },
  accessTokenTtlMillis: 60 * 60 * 1000,
});

const cipherConfig = Schema.decodeUnknownEffect(CodexOAuthProfileCipherConfig)({
  algorithm: "AES-GCM",
  keyId: "filesystem-test-key-v1",
  keyMaterial: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
});

const validCache: typeof CodexCliAuthCache.Encoded = {
  auth_mode: "chatgpt",
  last_refresh: "2099-01-01T00:00:00.000Z",
  tokens: {
    access_token: fixtureAccessToken,
    refresh_token: fixtureRefreshToken,
    id_token: fixtureIdToken,
  },
};

const filesystemStoreLayer = (directory: string) =>
  Effect.gen(function* makeFilesystemStoreLayer() {
    const cipher = yield* cipherConfig;

    return CodexProfileStoreEncryptedKeyValueLive.pipe(
      Layer.provideMerge(
        Layer.merge(
          CodexOAuthProfileCipherTest(cipher),
          CodexFileSystemKeyValueStoreLive(
            CodexFileSystemDirectory.make(directory)
          )
        )
      )
    );
  }).pipe(Effect.runSync);

const filesystemImportLayer = (directory: string) =>
  Effect.gen(function* makeFilesystemImportLayer() {
    const config = yield* importConfig;

    return CodexLocalProfileImportServiceLive.pipe(
      Layer.provideMerge(
        Layer.mergeAll(
          Layer.succeed(
            CodexLocalProfileImportConfigService,
            CodexLocalProfileImportConfigService.of(config)
          ),
          CodexLocalAuthCacheSourceMemory(validCache),
          filesystemStoreLayer(directory)
        )
      )
    );
  }).pipe(Effect.runSync);

const withTemporaryDirectory = <A, E, R>(
  use: (directory: string) => Effect.Effect<A, E, R>
) =>
  Effect.acquireUseRelease(
    Effect.sync(
      () =>
        `/tmp/bundjil-codex-filesystem-proof-${globalThis.crypto.randomUUID()}`
    ),
    use,
    (directory) =>
      Effect.gen(function* removeTemporaryDirectory() {
        const fileSystem = yield* FileSystem.FileSystem;

        yield* fileSystem
          .remove(directory, { recursive: true })
          .pipe(Effect.catchTag("PlatformError", () => Effect.void));
      })
  ).pipe(Effect.provide(BunServices.layer));

it.effect(
  "persists an encrypted imported profile across fresh filesystem layer construction",
  () =>
    withTemporaryDirectory((directory) =>
      Effect.gen(function* testPersistentEncryptedFilesystemProfile() {
        const config = yield* importConfig;

        yield* importCodexLocalProfile.pipe(
          Effect.provide(filesystemImportLayer(directory))
        );
        const profile = yield* getProfile(config.subject).pipe(
          Effect.provide(filesystemStoreLayer(directory))
        );

        assert.strictEqual(
          Redacted.value(profile.accessToken),
          fixtureAccessToken
        );
        assert.strictEqual(profile.profileKind, "access-token-import");
        assert.strictEqual(profile.requiresReauthentication, true);
      })
    )
);

it.effect(
  "writes ciphertext-only filesystem content without access, refresh, or ID tokens",
  () =>
    withTemporaryDirectory((directory) =>
      Effect.gen(function* testEncryptedFilesystemContent() {
        const config = yield* importConfig;

        yield* importCodexLocalProfile.pipe(
          Effect.provide(filesystemImportLayer(directory))
        );
        const key = yield* codexOAuthProfileStorageKey(config.subject);
        const fileSystem = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const stored = yield* fileSystem.readFileString(
          path.join(directory, encodeURIComponent(key))
        );

        assert.notInclude(stored, fixtureAccessToken);
        assert.notInclude(stored, fixtureRefreshToken);
        assert.notInclude(stored, fixtureIdToken);
      })
    )
);
