import {
  Array as EffectArray,
  Clock,
  Context,
  Effect,
  Redacted,
  Schema,
} from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import type { CodexProfileStoreFailure } from "./errors.js";
import { OAuthProfileSchemaError, OAuthProfileStorageError } from "./errors.js";
import { CodexProfileStore } from "./profile-store.service.js";
import {
  CodexStoredProfileProofResult,
  EncryptedCodexOAuthProfile,
} from "./schemas.js";
import type {
  CodexOAuthSubject,
  CodexStoredProfileProofResult as CodexStoredProfileProofResultType,
} from "./schemas.js";
import { codexOAuthProfileStorageKey } from "./storage-keys.js";

const encryptedProfileJson = Schema.fromJsonString(
  Schema.toCodecJson(EncryptedCodexOAuthProfile)
);

const persistedSecretMarkers = [
  '"accessToken"',
  '"refreshToken"',
  '"accountId"',
  '"authorizationCode"',
  '"codeVerifier"',
  '"idToken"',
  '"state"',
  "authorization_code",
  "code_verifier",
  "chatgpt_account_id",
  "id_token",
  "/auth/callback",
  "localhost:1455",
  "localhost:1457",
] as const;

export interface CodexStoredProfileProofShape {
  readonly prove: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<
    CodexStoredProfileProofResultType,
    CodexProfileStoreFailure
  >;
}

export class CodexStoredProfileProof extends Context.Service<
  CodexStoredProfileProof,
  CodexStoredProfileProofShape
>()("@bundjil/codex-oauth/CodexStoredProfileProof") {}

export const makeCodexStoredProfileProof = Effect.gen(
  function* makeCodexStoredProfileProofService() {
    const keyValueStore = yield* KeyValueStore.KeyValueStore;
    const profileStore = yield* CodexProfileStore;

    return CodexStoredProfileProof.of({
      prove: Effect.fn("CodexStoredProfileProof.prove")(function* (
        subject: CodexOAuthSubject
      ) {
        const key = yield* codexOAuthProfileStorageKey(subject);
        const encodedEnvelope = yield* keyValueStore.get(key).pipe(
          Effect.mapError(
            (cause) =>
              new OAuthProfileStorageError({
                operation: "getProfile",
                key,
                message:
                  "Unable to read the encrypted Codex OAuth profile proof.",
                cause,
              })
          )
        );

        if (encodedEnvelope === undefined) {
          return CodexStoredProfileProofResult.make({
            found: false,
            envelopeVersion2: false,
            ciphertextPresent: false,
            profileKindSubscription: false,
            refreshCapable: false,
            expiryValid: false,
            requiresReauthenticationFalse: false,
            markerLeakFalse: true,
          });
        }

        const encryptedProfile = yield* Schema.decodeUnknownEffect(
          encryptedProfileJson
        )(encodedEnvelope).pipe(
          Effect.mapError(
            (cause) =>
              new OAuthProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message:
                  "Unable to decode the encrypted profile proof envelope.",
                cause,
              })
          )
        );
        const profile = yield* profileStore.getProfile(subject);
        const now = yield* Clock.currentTimeMillis;
        const credentialMarkers =
          profile.profileKind === "subscription"
            ? [
                Redacted.value(profile.accessToken),
                Redacted.value(profile.refreshToken),
                Redacted.value(profile.accountId),
              ]
            : [Redacted.value(profile.accessToken)];
        const markerLeak = EffectArray.some(
          [...persistedSecretMarkers, ...credentialMarkers],
          (marker) => encodedEnvelope.includes(marker)
        );
        const subscription = profile.profileKind === "subscription";

        return CodexStoredProfileProofResult.make({
          found: true,
          envelopeVersion2: encryptedProfile.version === 2,
          ciphertextPresent: encryptedProfile.ciphertext.length > 0,
          profileKindSubscription: subscription,
          refreshCapable: subscription,
          expiryValid: profile.expiresAtEpochMillis > now,
          requiresReauthenticationFalse: !profile.requiresReauthentication,
          markerLeakFalse: !markerLeak,
        });
      }),
    });
  }
);

export const proveCodexStoredProfile = (
  subject: CodexOAuthSubject
): Effect.Effect<
  CodexStoredProfileProofResultType,
  CodexProfileStoreFailure,
  CodexStoredProfileProof
> =>
  Effect.gen(function* proveCodexStoredProfileOperation() {
    const proof = yield* CodexStoredProfileProof;

    return yield* proof.prove(subject);
  });
