import { Context, Effect, Schema } from "effect";

import { OAuthProfileSchemaError } from "./errors.js";
import type { CodexProfileStoreFailure } from "./errors.js";
import { CodexOAuthProfile } from "./schemas.js";
import type {
  CodexOAuthProfile as CodexOAuthProfileType,
  CodexOAuthSubject,
} from "./schemas.js";

export interface CodexProfileStoreShape {
  readonly getProfile: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<CodexOAuthProfileType, CodexProfileStoreFailure>;
  readonly putProfile: (
    profile: CodexOAuthProfileType
  ) => Effect.Effect<void, CodexProfileStoreFailure>;
  readonly removeProfile: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<void, CodexProfileStoreFailure>;
  readonly hasProfile: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<boolean, CodexProfileStoreFailure>;
}

export class CodexProfileStore extends Context.Service<
  CodexProfileStore,
  CodexProfileStoreShape
>()("@bundjil/codex-oauth/CodexProfileStore") {}

export const getProfile = (subject: CodexOAuthSubject) =>
  Effect.gen(function* getProfileOperation() {
    const store = yield* CodexProfileStore;

    return yield* store.getProfile(subject);
  });

export const putProfile = (profile: CodexOAuthProfileType) =>
  Effect.gen(function* putProfileOperation() {
    const store = yield* CodexProfileStore;

    yield* Schema.encodeEffect(CodexOAuthProfile)(profile).pipe(
      Effect.mapError(
        (cause) =>
          new OAuthProfileSchemaError({
            boundary: "CodexOAuthProfile",
            message: "Unable to encode Codex OAuth profile.",
            cause,
          })
      )
    );

    return yield* store.putProfile(profile);
  });

export const removeProfile = (subject: CodexOAuthSubject) =>
  Effect.gen(function* removeProfileOperation() {
    const store = yield* CodexProfileStore;

    return yield* store.removeProfile(subject);
  });

export const hasProfile = (subject: CodexOAuthSubject) =>
  Effect.gen(function* hasProfileOperation() {
    const store = yield* CodexProfileStore;

    return yield* store.hasProfile(subject);
  });
