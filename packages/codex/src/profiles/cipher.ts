import { Context, Effect, Redacted, Schema } from "effect";

import { CodexOAuthCredentialRevision } from "../auth/credentials.js";
import { CodexOAuthProfileCipherConfigService } from "./cipher-config.js";
import {
  CodexOAuthProfile,
  EncryptedCodexOAuthProfileV2,
  LegacyCodexOAuthProfileV1,
} from "./contracts.js";
import type {
  CodexAccessTokenImportProfile as CodexAccessTokenImportProfileType,
  CodexOAuthProfile as CodexOAuthProfileType,
  EncryptedCodexOAuthProfile,
  EncryptedCodexOAuthProfileV2 as EncryptedCodexOAuthProfileV2Type,
  LegacyCodexOAuthProfileV1 as LegacyCodexOAuthProfileV1Type,
} from "./contracts.js";
import { CodexOAuthProfileCipherError } from "./errors.js";
import type { CodexOAuthProfileCipherFailure } from "./errors.js";
import { codexOAuthProfileSubjectHash } from "./keys.js";

const codexOAuthProfileJson = Schema.fromJsonString(CodexOAuthProfile);
const legacyCodexOAuthProfileJson = Schema.fromJsonString(
  LegacyCodexOAuthProfileV1
);

const toArrayBuffer = (value: Uint8Array) => {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
};

const migrateLegacyCodexOAuthProfile = (
  profile: LegacyCodexOAuthProfileV1Type
): CodexAccessTokenImportProfileType => ({
  profileVersion: 2,
  profileKind: "access-token-import",
  subject: profile.subject,
  accessToken: profile.accessToken,
  expiresAtEpochMillis: profile.expiresAtEpochMillis,
  scopes: profile.scopes,
  createdAtEpochMillis: profile.createdAtEpochMillis,
  updatedAtEpochMillis: profile.updatedAtEpochMillis,
  requiresReauthentication: profile.requiresReauthentication,
});

export interface CodexOAuthProfileCipherShape {
  readonly encrypt: (
    profile: CodexOAuthProfileType
  ) => Effect.Effect<
    EncryptedCodexOAuthProfileV2Type,
    CodexOAuthProfileCipherFailure
  >;
  readonly decrypt: (
    encryptedProfile: EncryptedCodexOAuthProfile
  ) => Effect.Effect<CodexOAuthProfileType, CodexOAuthProfileCipherFailure>;
}

export class CodexOAuthProfileCipher extends Context.Service<
  CodexOAuthProfileCipher,
  CodexOAuthProfileCipherShape
>()("@bundjil/codex/CodexOAuthProfileCipher") {}

export const makeCodexOAuthProfileCipher = Effect.fn(
  "CodexOAuthProfileCipherLive"
)(function* makeCodexOAuthProfileCipherService(
  crypto: Crypto = globalThis.crypto
) {
  const config = yield* CodexOAuthProfileCipherConfigService;
  const keyMaterial = yield* Schema.decodeUnknownEffect(
    Schema.Uint8ArrayFromBase64
  )(Redacted.value(config.keyMaterial)).pipe(
    Effect.mapError(
      () =>
        new CodexOAuthProfileCipherError({
          operation: "loadKey",
          keyId: config.keyId,
          message: "Codex OAuth profile encryption key material is invalid.",
        })
    )
  );
  const key = yield* Effect.tryPromise({
    try: () =>
      crypto.subtle.importKey(
        "raw",
        toArrayBuffer(keyMaterial),
        config.algorithm,
        false,
        ["encrypt", "decrypt"]
      ),
    catch: () =>
      new CodexOAuthProfileCipherError({
        operation: "loadKey",
        keyId: config.keyId,
        message: "Unable to import the Codex OAuth profile encryption key.",
      }),
  });

  return CodexOAuthProfileCipher.of({
    encrypt: Effect.fn("CodexOAuthProfileCipher.encrypt")(function* (
      profile: CodexOAuthProfileType
    ) {
      const subjectHash = yield* codexOAuthProfileSubjectHash(
        profile.subject
      ).pipe(
        Effect.mapError(
          () =>
            new CodexOAuthProfileCipherError({
              operation: "encrypt",
              keyId: config.keyId,
              message: "Unable to derive the encrypted profile subject hash.",
            })
        )
      );
      const plaintext = yield* Schema.encodeEffect(codexOAuthProfileJson)(
        profile
      ).pipe(
        Effect.mapError(
          () =>
            new CodexOAuthProfileCipherError({
              operation: "encode",
              keyId: config.keyId,
              message:
                "Unable to encode the Codex OAuth profile for encryption.",
            })
        )
      );
      const nonce = yield* Effect.try({
        try: () => crypto.getRandomValues(new Uint8Array(12)),
        catch: () =>
          new CodexOAuthProfileCipherError({
            operation: "encrypt",
            keyId: config.keyId,
            message: "Unable to generate a profile encryption nonce.",
          }),
      });
      const ciphertext = yield* Effect.tryPromise({
        try: () =>
          crypto.subtle.encrypt(
            {
              name: config.algorithm,
              iv: toArrayBuffer(nonce),
              tagLength: 128,
            },
            key,
            new TextEncoder().encode(plaintext)
          ),
        catch: () =>
          new CodexOAuthProfileCipherError({
            operation: "encrypt",
            keyId: config.keyId,
            message: "Unable to encrypt the Codex OAuth profile.",
          }),
      });

      return yield* Schema.decodeUnknownEffect(EncryptedCodexOAuthProfileV2)({
        version: 2,
        algorithm: config.algorithm,
        keyId: config.keyId,
        nonce,
        ciphertext: new Uint8Array(ciphertext),
        subjectHash,
        createdAtEpochMillis: profile.createdAtEpochMillis,
        updatedAtEpochMillis: profile.updatedAtEpochMillis,
      }).pipe(
        Effect.mapError(
          () =>
            new CodexOAuthProfileCipherError({
              operation: "encode",
              keyId: config.keyId,
              message: "Unable to encode the encrypted Codex OAuth profile.",
            })
        )
      );
    }),
    decrypt: Effect.fn("CodexOAuthProfileCipher.decrypt")(function* (
      encryptedProfile: EncryptedCodexOAuthProfile
    ) {
      if (encryptedProfile.version !== 1 && encryptedProfile.version !== 2) {
        return yield* new CodexOAuthProfileCipherError({
          operation: "unsupportedVersion",
          keyId: encryptedProfile.keyId,
          version: encryptedProfile.version,
          message: "The encrypted Codex OAuth profile version is unsupported.",
        });
      }

      if (encryptedProfile.keyId !== config.keyId) {
        return yield* new CodexOAuthProfileCipherError({
          operation: "keyMismatch",
          keyId: encryptedProfile.keyId,
          version: encryptedProfile.version,
          message:
            "The encrypted Codex OAuth profile was encrypted with another key.",
        });
      }

      const plaintext = yield* Effect.tryPromise({
        try: () =>
          crypto.subtle.decrypt(
            {
              name: encryptedProfile.algorithm,
              iv: toArrayBuffer(encryptedProfile.nonce),
              tagLength: 128,
            },
            key,
            toArrayBuffer(encryptedProfile.ciphertext)
          ),
        catch: () =>
          new CodexOAuthProfileCipherError({
            operation: "decrypt",
            keyId: encryptedProfile.keyId,
            version: encryptedProfile.version,
            message: "Unable to decrypt the Codex OAuth profile.",
          }),
      });
      const profile = yield* Effect.gen(function* decodeProfile() {
        const plaintextJson = new TextDecoder().decode(plaintext);

        if (encryptedProfile.version === 2) {
          return yield* Schema.decodeUnknownEffect(codexOAuthProfileJson)(
            plaintextJson
          ).pipe(
            Effect.mapError(
              () =>
                new CodexOAuthProfileCipherError({
                  operation: "decode",
                  keyId: encryptedProfile.keyId,
                  version: encryptedProfile.version,
                  message:
                    "Unable to decode the decrypted Codex OAuth profile.",
                })
            )
          );
        }

        const legacyProfile = yield* Schema.decodeUnknownEffect(
          legacyCodexOAuthProfileJson
        )(plaintextJson).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthProfileCipherError({
                operation: "decode",
                keyId: encryptedProfile.keyId,
                version: encryptedProfile.version,
                message:
                  "Unable to decode the legacy decrypted Codex OAuth profile.",
              })
          )
        );

        return migrateLegacyCodexOAuthProfile(legacyProfile);
      });
      const subjectHash = yield* codexOAuthProfileSubjectHash(
        profile.subject
      ).pipe(
        Effect.mapError(
          () =>
            new CodexOAuthProfileCipherError({
              operation: "integrityMismatch",
              keyId: encryptedProfile.keyId,
              version: encryptedProfile.version,
              message:
                "Unable to verify the encrypted Codex OAuth profile subject.",
            })
        )
      );

      if (subjectHash !== encryptedProfile.subjectHash) {
        return yield* new CodexOAuthProfileCipherError({
          operation: "integrityMismatch",
          keyId: encryptedProfile.keyId,
          version: encryptedProfile.version,
          message: "The encrypted Codex OAuth profile subject does not match.",
        });
      }

      return profile;
    }),
  });
});

export const encryptCodexOAuthProfile = (profile: CodexOAuthProfileType) =>
  Effect.gen(function* encryptCodexOAuthProfileOperation() {
    const cipher = yield* CodexOAuthProfileCipher;

    return yield* cipher.encrypt(profile);
  });

export const decryptCodexOAuthProfile = (
  encryptedProfile: EncryptedCodexOAuthProfile
) =>
  Effect.gen(function* decryptCodexOAuthProfileOperation() {
    const cipher = yield* CodexOAuthProfileCipher;

    return yield* cipher.decrypt(encryptedProfile);
  });

export const generateCodexOAuthCredentialRevision = Effect.fn(
  "CodexOAuthCredentialRevision.generate"
)(function* generateCodexOAuthCredentialRevisionOperation() {
  return yield* Schema.decodeUnknownEffect(CodexOAuthCredentialRevision)(
    globalThis.crypto.randomUUID()
  ).pipe(
    Effect.mapError(
      () =>
        new CodexOAuthProfileCipherError({
          operation: "encode",
          keyId: "generated",
          message: "Unable to generate a Codex OAuth credential revision.",
        })
    )
  );
});
