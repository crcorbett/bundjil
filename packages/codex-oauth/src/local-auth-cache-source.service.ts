import { Context, Effect, Layer, Schema } from "effect";

import { CodexLocalProfileImportError } from "./errors.js";
import { CodexLocalProfileImportConfigService } from "./local-profile-import.config.js";
import { CodexCliAuthCache } from "./schemas.js";
import type { CodexCliAuthCache as CodexCliAuthCacheType } from "./schemas.js";

declare const Bun: {
  readonly file: (path: string) => {
    readonly text: () => Promise<string>;
  };
};

const codexCliAuthCacheJson = Schema.fromJsonString(CodexCliAuthCache);

const decodeCodexCliAuthCache = (input: unknown) =>
  Schema.decodeUnknownEffect(CodexCliAuthCache)(input).pipe(
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

    return CodexLocalAuthCacheSource.of({
      readCache: Effect.fn("CodexLocalAuthCacheSource.readCache")(
        function* readCache() {
          const content = yield* Effect.tryPromise({
            try: () => Bun.file(config.localAuthFile).text(),
            catch: () =>
              new CodexLocalProfileImportError({
                operation: "readCache",
                message: "Unable to read the local Codex auth cache.",
              }),
          });

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
);

export const CodexLocalAuthCacheSourceMemory = (cache: unknown) =>
  Layer.succeed(CodexLocalAuthCacheSource, {
    readCache: () => decodeCodexCliAuthCache(cache),
  });
