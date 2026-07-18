import * as BunServices from "@effect/platform-bun/BunServices";
import { Context, Effect, Layer, Schema } from "effect";
import * as FileSystem from "effect/FileSystem";

import { CodexLocalProfileImportError } from "./errors.js";
import { CodexLocalProfileImportConfigService } from "./local-profile-import.config.js";
import { CodexCliAuthCache } from "./schemas.js";
import type {
  CodexCliAuthCache as CodexCliAuthCacheType,
  CodexCliAuthCacheEncoded,
} from "./schemas.js";

const codexCliAuthCacheJson = Schema.fromJsonString(CodexCliAuthCache);

const decodeCodexCliAuthCache = (input: CodexCliAuthCacheEncoded) =>
  Schema.decodeEffect(CodexCliAuthCache)(input).pipe(
    Effect.mapError(
      () =>
        new CodexLocalProfileImportError({
          operation: "decodeCache",
          message: "Unable to decode the local Codex auth cache.",
        })
    )
  );

export interface CodexLocalAuthCacheSourceShape {
  readonly readCache: () => Effect.Effect<
    CodexCliAuthCacheType,
    CodexLocalProfileImportError
  >;
}

export class CodexLocalAuthCacheSource extends Context.Service<
  CodexLocalAuthCacheSource,
  CodexLocalAuthCacheSourceShape
>()("@bundjil/codex-oauth/CodexLocalAuthCacheSource") {}

export const CodexLocalAuthCacheSourceLive = Layer.effect(
  CodexLocalAuthCacheSource,
  Effect.gen(function* makeCodexLocalAuthCacheSource() {
    const config = yield* CodexLocalProfileImportConfigService;
    const fileSystem = yield* FileSystem.FileSystem;

    return CodexLocalAuthCacheSource.of({
      readCache: Effect.fn("CodexLocalAuthCacheSource.readCache")(
        function* readCache() {
          const content = yield* fileSystem
            .readFileString(config.localAuthFile)
            .pipe(
              Effect.mapError(
                () =>
                  new CodexLocalProfileImportError({
                    operation: "readCache",
                    message: "Unable to read the local Codex auth cache.",
                  })
              )
            );

          return yield* Schema.decodeUnknownEffect(codexCliAuthCacheJson)(
            content
          ).pipe(
            Effect.mapError(
              () =>
                new CodexLocalProfileImportError({
                  operation: "decodeCache",
                  message: "Unable to decode the local Codex auth cache.",
                })
            )
          );
        }
      ),
    });
  }).pipe(Effect.withSpan("CodexLocalAuthCacheSourceLive"))
).pipe(Layer.provide(BunServices.layer));

export const CodexLocalAuthCacheSourceMemory = (
  cache: CodexCliAuthCacheEncoded
) =>
  Layer.succeed(CodexLocalAuthCacheSource, {
    readCache: () => decodeCodexCliAuthCache(cache),
  });
