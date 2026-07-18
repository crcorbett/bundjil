import {
  Cause,
  Clock,
  ConfigProvider,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";

import { CodexSubscriptionAuthError } from "../src/auth/errors.js";
import {
  CodexSubscriptionLoginConfigLive,
  CodexSubscriptionLoginConfigService,
} from "../src/auth/login-config.js";
import { generateCodexOAuthCredentialRevision } from "../src/profiles/cipher.js";
import { CodexOAuthProfileCommit } from "../src/profiles/commit.js";
import { CodexSubscriptionProfile } from "../src/profiles/contracts.js";
import { CodexProfileStore } from "../src/profiles/store.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexOAuthProfileCommitAtomicLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/runtime.js";
import { CodexUpstashPersistenceLive } from "../src/storage/upstash.js";

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

const encodeStageSuccess = Schema.encodeSync(
  Schema.fromJsonString(NearExpiryProfileStageSuccess)
);
const encodeStageBlocked = Schema.encodeSync(
  Schema.fromJsonString(NearExpiryProfileStageBlocked)
);

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

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(
    encodeStageSuccess({
      result: exit.value,
      status: "staged",
    })
  );
} else {
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

  console.error(
    encodeStageBlocked({
      errorTag,
      status: "blocked",
    })
  );
  process.exitCode = 1;
}
