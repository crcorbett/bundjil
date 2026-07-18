import {
  Cause,
  Clock,
  Console,
  ConfigProvider,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";

import { CodexOAuthProfileCommit } from "../src/commit.service.js";
import { CodexSubscriptionAuthError } from "../src/errors.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexOAuthProfileCommitAtomicLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/live.layer.js";
import { generateCodexOAuthCredentialRevision } from "../src/profile-cipher.service.js";
import { CodexProfileStore } from "../src/profile-store.service.js";
import { CodexSubscriptionProfile } from "../src/schemas.js";
import {
  CodexSubscriptionLoginConfigLive,
  CodexSubscriptionLoginConfigService,
} from "../src/subscription-login.config.js";
import { CodexUpstashPersistenceLive } from "../src/upstash-persistence.layer.js";

declare const process: {
  exitCode: number | undefined;
};

const configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv());
const cipherConfigLayer = CodexOAuthProfileCipherConfigLive.pipe(
  Layer.provide(configProviderLayer)
);
const cipherLayer = CodexOAuthProfileCipherLive.pipe(
  Layer.provide(cipherConfigLayer)
);
const persistenceLayer = CodexUpstashPersistenceLive;
const profileStoreLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
  Layer.provideMerge(Layer.merge(cipherLayer, persistenceLayer))
);
const profileCommitLayer = CodexOAuthProfileCommitAtomicLive.pipe(
  Layer.provideMerge(Layer.merge(cipherLayer, persistenceLayer))
);
const loginConfigLayer = CodexSubscriptionLoginConfigLive.pipe(
  Layer.provide(configProviderLayer)
);

const NearExpiryProfileStageResult = Schema.Struct({
  expiryForced: Schema.Boolean,
  profileKindSubscription: Schema.Boolean,
  stagedWithNewRevision: Schema.Boolean,
});

const NearExpiryProfileStageSuccess = Schema.Struct({
  result: NearExpiryProfileStageResult,
  status: Schema.Literal("staged"),
});

const NearExpiryProfileStageBlocked = Schema.Struct({
  errorTag: Schema.NonEmptyString,
  status: Schema.Literal("blocked"),
});

const program = Effect.gen(function* stageNearExpiryProfile() {
  const input = yield* CodexSubscriptionLoginConfigService;
  const store = yield* CodexProfileStore;
  const commit = yield* CodexOAuthProfileCommit;
  const profile = yield* store.getProfile(input.subject);

  if (profile.profileKind !== "subscription") {
    return yield* new CodexSubscriptionAuthError({
      message: "Only an isolated subscription profile can be staged.",
      operation: "completeLogin",
      reason: "tokenMetadataInvalid",
    });
  }

  const now = yield* Clock.currentTimeMillis;
  const credentialRevision = yield* generateCodexOAuthCredentialRevision();
  const stagedProfile = yield* Schema.decodeUnknownEffect(
    CodexSubscriptionProfile
  )({
    ...profile,
    accessToken: Redacted.value(profile.accessToken),
    accountId: Redacted.value(profile.accountId),
    credentialRevision,
    expiresAtEpochMillis: now - 1,
    refreshToken: Redacted.value(profile.refreshToken),
    updatedAtEpochMillis: now,
  });

  yield* commit.replace({
    expectedRevision: profile.credentialRevision,
    profile: stagedProfile,
  });

  return NearExpiryProfileStageResult.make({
    expiryForced: true,
    profileKindSubscription: true,
    stagedWithNewRevision: true,
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(profileStoreLayer, profileCommitLayer, loginConfigLayer)
  )
);

const main = Effect.gen(function* renderNearExpiryProfileStage() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(NearExpiryProfileStageSuccess)
    )({
      result: exit.value,
      status: "staged",
    });
    return yield* Console.log(output);
  }

  const failure = Cause.findErrorOption(exit.cause);
  const errorTag = Option.match(failure, {
    onNone: () => "UnknownCause",
    onSome: (error) =>
      typeof error === "object" &&
      error !== null &&
      "_tag" in error &&
      typeof error._tag === "string"
        ? error._tag
        : "UnknownFailure",
  });

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(NearExpiryProfileStageBlocked)
  )({
    errorTag,
    status: "blocked",
  });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);
