import { Effect, Layer, Option } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexHttpClient,
  makeCodexHttpClient,
} from "./codex-http-client.service.js";
import {
  CodexResponsesFetch,
  makeCodexResponsesFetch,
} from "./codex-responses-fetch.service.js";
import {
  CodexResponsesProof,
  makeCodexResponsesProof,
} from "./codex-responses-proof.service.js";
import {
  OAuthProfileNotFound,
  OAuthProfileSchemaError,
  OAuthProfileStorageError,
} from "./errors.js";
import {
  CodexOAuthClient,
  CodexOAuthClientUnsupported,
} from "./oauth-client.service.js";
import { CodexOAuthService, makeCodexOAuthService } from "./oauth.service.js";
import { CodexProfileStore } from "./profile-store.service.js";
import { CodexOAuthProfile } from "./schemas.js";
import type {
  CodexOAuthProfile as CodexOAuthProfileType,
  CodexOAuthSubject,
} from "./schemas.js";
import {
  codexOAuthProfileStorageKey,
  codexOAuthProfileSubjectHash,
} from "./storage-keys.js";

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
              new OAuthProfileStorageError({
                operation: "getProfile",
                key,
                message: "Unable to read Codex OAuth profile.",
                cause,
              })
            )
          ),
          Effect.catchTag("SchemaError", (cause) =>
            Effect.fail(
              new OAuthProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message: "Unable to decode Codex OAuth profile.",
                cause,
              })
            )
          )
        );

        if (Option.isNone(profile)) {
          return yield* new OAuthProfileNotFound({
            profileId: subject.profileId,
            subjectHash,
            message: "Codex OAuth profile was not found.",
          });
        }

        return profile.value;
      }),
      putProfile: Effect.fn("CodexProfileStore.putProfile")(function* (
        profile: CodexOAuthProfileType
      ) {
        const key = yield* codexOAuthProfileStorageKey(profile.subject);

        yield* schemaStore.set(key, profile).pipe(
          Effect.catchTag("KeyValueStoreError", (cause) =>
            Effect.fail(
              new OAuthProfileStorageError({
                operation: "putProfile",
                key,
                message: "Unable to store Codex OAuth profile.",
                cause,
              })
            )
          ),
          Effect.catchTag("SchemaError", (cause) =>
            Effect.fail(
              new OAuthProfileSchemaError({
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
              new OAuthProfileStorageError({
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
              new OAuthProfileStorageError({
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
    Layer.merge(CodexProfileStoreKeyValueLive, CodexOAuthClientLive)
  )
);

export const CodexOAuthMemoryKeyValueLive = CodexOAuthLive.pipe(
  Layer.provide(KeyValueStore.layerMemory)
);

export const CodexResponsesFetchLive = Layer.succeed(
  CodexResponsesFetch,
  makeCodexResponsesFetch
);

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
