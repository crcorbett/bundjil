import {
  Clock,
  Config,
  ConfigProvider,
  Data,
  Effect,
  Exit,
  Layer,
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
import { OpenAICompatibleChatCompletionRequest } from "../src/provider/contracts.js";
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

const previewUrlConfig = Config.url("BUNDJIL_CODEX_PROXY_PREVIEW_URL");
const internalTokenConfig = Config.redacted(
  "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
);

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

const requestBody = Schema.encodeSync(
  Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
)(
  Schema.decodeUnknownSync(OpenAICompatibleChatCompletionRequest)({
    messages: [{ content: "Reply only: OK.", role: "user" }],
    model: "gpt-5.5",
    stream: true,
  })
);

const HostedStagedRefreshProof = Schema.Struct({
  concurrentAuthenticatedSuccess: Schema.Boolean,
  finalExpiryValid: Schema.Boolean,
  finalProfileSubscription: Schema.Boolean,
  finalRevisionChanged: Schema.Boolean,
  responsesAreSse: Schema.Boolean,
  responsesComplete: Schema.Boolean,
  stagedExpiry: Schema.Boolean,
});

const HostedStagedRefreshProofSuccess = Schema.Struct({
  result: HostedStagedRefreshProof,
  status: Schema.Literal("proved"),
});

const HostedStagedRefreshProofBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const encodeProofSuccess = Schema.encodeSync(
  Schema.fromJsonString(HostedStagedRefreshProofSuccess)
);
const encodeProofBlocked = Schema.encodeSync(
  Schema.fromJsonString(HostedStagedRefreshProofBlocked)
);

class HostedProofRequestError extends Data.TaggedError(
  "HostedProofRequestError"
)<{ readonly cause: unknown }> {}

const fetchResponse = (request: Request) =>
  Effect.tryPromise({
    catch: (cause) => new HostedProofRequestError({ cause }),
    try: () => fetch(request),
  });

const readResponse = (response: Response) =>
  Effect.tryPromise({
    catch: (cause) => new HostedProofRequestError({ cause }),
    try: () => response.text(),
  });

const program = Effect.gen(function* proveHostedStagedRefresh() {
  const input = yield* CodexSubscriptionLoginConfigService;
  const previewUrl = yield* previewUrlConfig;
  const internalToken = yield* internalTokenConfig;
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
  const stagedRevision = yield* generateCodexOAuthCredentialRevision();
  const stagedProfile = yield* Schema.decodeUnknownEffect(
    CodexSubscriptionProfile
  )({
    ...profile,
    accessToken: Redacted.value(profile.accessToken),
    accountId: Redacted.value(profile.accountId),
    credentialRevision: stagedRevision,
    expiresAtEpochMillis: now - 1,
    refreshToken: Redacted.value(profile.refreshToken),
    updatedAtEpochMillis: now,
  });

  yield* commit.replace({
    expectedRevision: profile.credentialRevision,
    profile: stagedProfile,
  });

  const completionUrl = new URL("/v1/chat/completions", previewUrl);
  const request = () =>
    new Request(completionUrl, {
      body: requestBody,
      headers: {
        authorization: `Bearer ${Redacted.value(internalToken)}`,
        "content-type": "application/json",
      },
      method: "POST",
    });
  const responses = yield* Effect.all(
    [fetchResponse(request()), fetchResponse(request())],
    { concurrency: "unbounded" }
  );
  const bodies = yield* Effect.all(responses.map(readResponse), {
    concurrency: "unbounded",
  });
  const finalProfile = yield* store.getProfile(input.subject);
  const after = yield* Clock.currentTimeMillis;

  return HostedStagedRefreshProof.make({
    concurrentAuthenticatedSuccess: responses.every(
      (response) => response.status === 200
    ),
    finalExpiryValid: finalProfile.expiresAtEpochMillis > after,
    finalProfileSubscription: finalProfile.profileKind === "subscription",
    finalRevisionChanged:
      finalProfile.profileKind === "subscription" &&
      finalProfile.credentialRevision !== stagedRevision,
    responsesAreSse: responses.every(
      (response) => response.headers.get("content-type") === "text/event-stream"
    ),
    responsesComplete: bodies.every((body) => body.includes("data: [DONE]")),
    stagedExpiry: stagedProfile.expiresAtEpochMillis <= now,
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      profileStoreLayer,
      profileCommitLayer,
      loginConfigLayer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(
    encodeProofSuccess({
      result: exit.value,
      status: "proved",
    })
  );
} else {
  console.error(encodeProofBlocked({ status: "blocked" }));
  process.exitCode = 1;
}
