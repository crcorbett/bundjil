import { Clock, Context, Effect, Layer, Redacted, Schema } from "effect";

import { CodexLocalProfileImportError } from "./errors.js";
import type { CodexLocalProfileImportFailure } from "./errors.js";
import { CodexLocalAuthCacheSource } from "./local-auth-cache-source.service.js";
import { CodexLocalProfileImportConfigService } from "./local-profile-import.config.js";
import { CodexProfileStore } from "./profile-store.service.js";
import { CodexLocalProfileImportResult, CodexOAuthProfile } from "./schemas.js";
import type { CodexLocalProfileImportResult as CodexLocalProfileImportResultType } from "./schemas.js";

export interface CodexLocalProfileImportServiceShape {
  readonly importProfile: () => Effect.Effect<
    CodexLocalProfileImportResultType,
    CodexLocalProfileImportFailure
  >;
}

export class CodexLocalProfileImportService extends Context.Service<
  CodexLocalProfileImportService,
  CodexLocalProfileImportServiceShape
>()("@bundjil/codex-oauth/CodexLocalProfileImportService") {}

export const makeCodexLocalProfileImportService = Effect.gen(
  function* makeCodexLocalProfileImportService() {
    const config = yield* CodexLocalProfileImportConfigService;
    const source = yield* CodexLocalAuthCacheSource;
    const profileStore = yield* CodexProfileStore;

    return CodexLocalProfileImportService.of({
      importProfile: Effect.fn("CodexLocalProfileImportService.importProfile")(
        function* importProfile() {
          const cache = yield* source.readCache();
          const refreshedAtEpochMillis = cache.last_refresh.getTime();
          const expiresAtEpochMillis =
            refreshedAtEpochMillis + config.accessTokenTtlMillis;
          const nowEpochMillis = yield* Clock.currentTimeMillis;

          if (
            !Number.isFinite(refreshedAtEpochMillis) ||
            !Number.isFinite(expiresAtEpochMillis) ||
            expiresAtEpochMillis <= nowEpochMillis
          ) {
            return yield* new CodexLocalProfileImportError({
              operation: "validateExpiry",
              message:
                "The local Codex access token is expired or has an invalid refresh timestamp.",
            });
          }

          const profile = yield* Schema.decodeUnknownEffect(CodexOAuthProfile)({
            subject: config.subject,
            accessToken: Redacted.value(cache.tokens.access_token),
            expiresAtEpochMillis,
            scopes: [],
            createdAtEpochMillis: nowEpochMillis,
            updatedAtEpochMillis: nowEpochMillis,
            requiresReauthentication: true,
          }).pipe(
            Effect.mapError(
              () =>
                new CodexLocalProfileImportError({
                  operation: "buildProfile",
                  message:
                    "Unable to construct the local Codex access profile.",
                })
            )
          );

          yield* profileStore.putProfile(profile).pipe(
            Effect.mapError(
              () =>
                new CodexLocalProfileImportError({
                  operation: "putProfile",
                  message: "Unable to store the local Codex access profile.",
                })
            )
          );

          return yield* Schema.decodeUnknownEffect(
            CodexLocalProfileImportResult
          )({
            profileId: config.subject.profileId,
            mode: cache.auth_mode,
            requiresReauthentication: true,
            expiryStatus: "valid",
            encryptedStore: "stored",
          }).pipe(
            Effect.mapError(
              () =>
                new CodexLocalProfileImportError({
                  operation: "encodeResult",
                  message: "Unable to encode the local Codex import result.",
                })
            )
          );
        }
      ),
    });
  }
).pipe(Effect.withSpan("CodexLocalProfileImportServiceLive"));

export const CodexLocalProfileImportServiceLive = Layer.effect(
  CodexLocalProfileImportService,
  makeCodexLocalProfileImportService
);

export const importCodexLocalProfile = Effect.gen(
  function* importCodexLocalProfileOperation() {
    const service = yield* CodexLocalProfileImportService;

    return yield* service.importProfile();
  }
);
