import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Effect, Layer, Option } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexOAuthClient,
  CodexOAuthClientUnsupported,
} from "./auth/client.js";
import type { CodexOAuthSubject } from "./auth/credentials.js";
import { CodexOAuthService, makeCodexOAuthService } from "./auth/service.js";
import {
  CodexOAuthProfileCipher,
  makeCodexOAuthProfileCipher,
} from "./profiles/cipher.js";
import { CodexOAuthProfileCommitUnsupported } from "./profiles/commit.js";
import {
  CodexOAuthProfile,
  EncryptedCodexOAuthProfile,
} from "./profiles/contracts.js";
import type { CodexAccessTokenImportProfile as CodexAccessTokenImportProfileType } from "./profiles/contracts.js";
import {
  CodexOAuthProfileCipherError,
  CodexProfileNotFound,
  CodexProfileSchemaError,
  CodexProfileStorageError,
} from "./profiles/errors.js";
import {
  codexOAuthProfileStorageKey,
  codexOAuthProfileSubjectHash,
} from "./profiles/keys.js";
import {
  CodexStoredProfileProof,
  makeCodexStoredProfileProof,
} from "./profiles/proof.js";
import { CodexProfileStore } from "./profiles/store.js";
import {
  CodexDirectProvider,
  makeCodexDirectProvider,
  makeCodexLegacyDirectProvider,
} from "./provider/direct.js";
import {
  CodexResponsesFetch,
  makeCodexResponsesFetch,
} from "./provider/fetch.js";
import {
  CodexHttpClient,
  makeCodexHttpClient,
} from "./provider/http-client.js";
import {
  makeOpenAICompatibleProxy,
  OpenAICompatibleProxy,
} from "./provider/openai-compatible-proxy.js";
import {
  CodexResponsesProof,
  makeCodexResponsesProof,
} from "./provider/proof.js";
import {
  CodexRequestMapper,
  makeCodexRequestMapper,
} from "./provider/request-mapper.js";
import {
  CodexStreamMapper,
  makeCodexStreamMapper,
} from "./provider/stream-mapper.js";

export { CodexOAuthProfileCipherConfigLive } from "./profiles/cipher-config.js";
export { CodexOAuthHttpClientLive } from "./auth/http-client.js";
export { CodexOAuthRefreshClientLive } from "./auth/refresh-client.js";
export { CodexOAuthRefreshPolicyLive } from "./auth/refresh-config.js";
export { CodexSubscriptionAuthProtocolConfigLive } from "./auth/protocol.js";
export { CodexSubscriptionLoginConfigLive } from "./auth/login-config.js";
export {
  CodexOAuthProfileCommitAtomicLive,
  CodexOAuthRefreshLockAtomicLive,
} from "./storage/atomic.js";
export { CodexUpstashPersistenceLive } from "./storage/upstash.js";

export const CodexOAuthProfileCipherLive = Layer.effect(
  CodexOAuthProfileCipher,
  makeCodexOAuthProfileCipher()
);

export const CodexStoredProfileProofLive = Layer.effect(
  CodexStoredProfileProof,
  makeCodexStoredProfileProof
);

export const CodexProfileStoreKeyValueLive = Layer.effect(
  CodexProfileStore,
  Effect.gen(function* makeCodexProfileStoreKeyValue() {
    const keyValueStore = yield* KeyValueStore.KeyValueStore;
    const schemaStore = KeyValueStore.toSchemaStore(
      keyValueStore,
      CodexOAuthProfile
    );

    return CodexProfileStore.of({
      getProfile: Effect.fn("CodexProfileStore.getProfile")(function* (
        subject: CodexOAuthSubject
      ) {
        const key = yield* codexOAuthProfileStorageKey(subject);
        const subjectHash = yield* codexOAuthProfileSubjectHash(subject);
        const profile = yield* schemaStore.get(key).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new CodexProfileStorageError({
                operation: "getProfile",
                key,
                message: "Unable to read Codex OAuth profile.",
                cause,
              })
            )
          ),
          Effect.catchTag("SchemaError", (cause) =>
            Effect.fail(
              new CodexProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message: "Unable to decode Codex OAuth profile.",
                cause,
              })
            )
          )
        );

        if (Option.isNone(profile)) {
          return yield* new CodexProfileNotFound({
            profileId: subject.profileId,
            subjectHash,
            message: "Codex OAuth profile was not found.",
          });
        }

        return profile.value;
      }),
      putProfile: Effect.fn("CodexProfileStore.putProfile")(function* (
        profile: CodexAccessTokenImportProfileType
      ) {
        const key = yield* codexOAuthProfileStorageKey(profile.subject);

        yield* schemaStore.set(key, profile).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new CodexProfileStorageError({
                operation: "putProfile",
                key,
                message: "Unable to store Codex OAuth profile.",
                cause,
              })
            )
          ),
          Effect.catchTag("SchemaError", (cause) =>
            Effect.fail(
              new CodexProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message: "Unable to encode Codex OAuth profile.",
                cause,
              })
            )
          )
        );
      }),
      removeProfile: Effect.fn("CodexProfileStore.removeProfile")(function* (
        subject: CodexOAuthSubject
      ) {
        const key = yield* codexOAuthProfileStorageKey(subject);

        yield* schemaStore.remove(key).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new CodexProfileStorageError({
                operation: "removeProfile",
                key,
                message: "Unable to remove Codex OAuth profile.",
                cause,
              })
            )
          )
        );
      }),
      hasProfile: Effect.fn("CodexProfileStore.hasProfile")(function* (
        subject: CodexOAuthSubject
      ) {
        const key = yield* codexOAuthProfileStorageKey(subject);

        return yield* schemaStore.has(key).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new CodexProfileStorageError({
                operation: "hasProfile",
                key,
                message: "Unable to check Codex OAuth profile.",
                cause,
              })
            )
          )
        );
      }),
    });
  }).pipe(Effect.withSpan("CodexProfileStoreKeyValueLive"))
);

export const CodexProfileStoreEncryptedKeyValueLive = Layer.effect(
  CodexProfileStore,
  Effect.gen(function* makeCodexProfileStoreEncryptedKeyValue() {
    const cipher = yield* CodexOAuthProfileCipher;
    const keyValueStore = yield* KeyValueStore.KeyValueStore;
    const encryptedProfileStore = KeyValueStore.toSchemaStore(
      keyValueStore,
      EncryptedCodexOAuthProfile
    );

    return CodexProfileStore.of({
      getProfile: Effect.fn("CodexProfileStoreEncrypted.getProfile")(function* (
        subject: CodexOAuthSubject
      ) {
        const key = yield* codexOAuthProfileStorageKey(subject);
        const subjectHash = yield* codexOAuthProfileSubjectHash(subject);
        const encryptedProfile = yield* encryptedProfileStore.get(key).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new CodexProfileStorageError({
                operation: "getProfile",
                key,
                message: "Unable to read encrypted Codex OAuth profile.",
                cause,
              })
            )
          ),
          Effect.catchTag("SchemaError", (cause) =>
            Effect.fail(
              new CodexProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message: "Unable to decode encrypted Codex OAuth profile.",
                cause,
              })
            )
          )
        );

        if (Option.isNone(encryptedProfile)) {
          return yield* new CodexProfileNotFound({
            profileId: subject.profileId,
            subjectHash,
            message: "Codex OAuth profile was not found.",
          });
        }

        if (encryptedProfile.value.subjectHash !== subjectHash) {
          return yield* new CodexOAuthProfileCipherError({
            operation: "integrityMismatch",
            keyId: encryptedProfile.value.keyId,
            version: encryptedProfile.value.version,
            message:
              "Encrypted Codex OAuth profile belongs to another subject.",
          });
        }

        return yield* cipher.decrypt(encryptedProfile.value);
      }),
      putProfile: Effect.fn("CodexProfileStoreEncrypted.putProfile")(function* (
        profile: CodexAccessTokenImportProfileType
      ) {
        const key = yield* codexOAuthProfileStorageKey(profile.subject);
        const encryptedProfile = yield* cipher.encrypt(profile);

        yield* encryptedProfileStore.set(key, encryptedProfile).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new CodexProfileStorageError({
                operation: "putProfile",
                key,
                message: "Unable to store encrypted Codex OAuth profile.",
                cause,
              })
            )
          ),
          Effect.catchTag("SchemaError", (cause) =>
            Effect.fail(
              new CodexProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message: "Unable to encode encrypted Codex OAuth profile.",
                cause,
              })
            )
          )
        );
      }),
      removeProfile: Effect.fn("CodexProfileStoreEncrypted.removeProfile")(
        function* (subject: CodexOAuthSubject) {
          const key = yield* codexOAuthProfileStorageKey(subject);

          yield* encryptedProfileStore.remove(key).pipe(
            Effect.catchTag("KeyValueStoreError", (cause) =>
              Effect.fail(
                new CodexProfileStorageError({
                  operation: "removeProfile",
                  key,
                  message: "Unable to remove encrypted Codex OAuth profile.",
                  cause,
                })
              )
            )
          );
        }
      ),
      hasProfile: Effect.fn("CodexProfileStoreEncrypted.hasProfile")(function* (
        subject: CodexOAuthSubject
      ) {
        const key = yield* codexOAuthProfileStorageKey(subject);

        return yield* encryptedProfileStore.has(key).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new CodexProfileStorageError({
                operation: "hasProfile",
                key,
                message: "Unable to check encrypted Codex OAuth profile.",
                cause,
              })
            )
          )
        );
      }),
    });
  }).pipe(Effect.withSpan("CodexProfileStoreEncryptedKeyValueLive"))
);

export const CodexOAuthClientLive = Layer.succeed(
  CodexOAuthClient,
  CodexOAuthClientUnsupported
);

export const CodexOAuthServiceLive = Layer.effect(
  CodexOAuthService,
  makeCodexOAuthService
);

export const CodexOAuthLive = CodexOAuthServiceLive.pipe(
  Layer.provideMerge(
    Layer.mergeAll(
      CodexProfileStoreKeyValueLive,
      CodexOAuthClientLive,
      CodexOAuthProfileCommitUnsupported
    )
  )
);

export const CodexOAuthMemoryKeyValueLive = CodexOAuthLive.pipe(
  Layer.provide(KeyValueStore.layerMemory)
);

export const CodexResponsesFetchLive = Layer.effect(
  CodexResponsesFetch,
  makeCodexResponsesFetch
).pipe(Layer.provide(BunHttpClient.layer));

export const CodexHttpClientLive = Layer.effect(
  CodexHttpClient,
  makeCodexHttpClient
);

export const CodexResponsesProofLive = Layer.effect(
  CodexResponsesProof,
  makeCodexResponsesProof
).pipe(Layer.provide(CodexHttpClientLive));

export const CodexResponsesProofFetchLive = CodexResponsesProofLive.pipe(
  Layer.provide(CodexResponsesFetchLive)
);

export const CodexRequestMapperLive = Layer.succeed(
  CodexRequestMapper,
  makeCodexRequestMapper
);

export const CodexStreamMapperLive = Layer.succeed(
  CodexStreamMapper,
  makeCodexStreamMapper
);

export const CodexDirectProviderLive = Layer.effect(
  CodexDirectProvider,
  makeCodexDirectProvider
).pipe(
  Layer.provideMerge(Layer.merge(CodexRequestMapperLive, CodexStreamMapperLive))
);

export const CodexLegacyDirectProviderLive = Layer.effect(
  CodexDirectProvider,
  makeCodexLegacyDirectProvider
).pipe(
  Layer.provideMerge(Layer.merge(CodexRequestMapperLive, CodexStreamMapperLive))
);

export const OpenAICompatibleProxyLive = Layer.effect(
  OpenAICompatibleProxy,
  makeOpenAICompatibleProxy
);
