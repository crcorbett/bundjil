import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import {
  Clock,
  Console,
  Config,
  ConfigProvider,
  Data,
  Effect,
  Exit,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { HttpClient, HttpClientRequest } from "effect/unstable/http";

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
import {
  OpenAICompatibleProxyInternalToken,
  CodexResponsesModelId,
  CodexSubscriptionProfile,
  OpenAICompatibleChatCompletionRequest,
} from "../src/schemas.js";
import {
  CodexSubscriptionLoginConfigLive,
  CodexSubscriptionLoginConfigService,
} from "../src/subscription-login.config.js";
import { CodexUpstashPersistenceLive } from "../src/upstash-persistence.layer.js";

declare const process: {
  exitCode: number | undefined;
};

const previewUrlConfig = Config.url("BUNDJIL_CODEX_PROXY_PREVIEW_URL");
const internalTokenConfig = Config.schema(
  OpenAICompatibleProxyInternalToken,
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

class HostedProofRequestError extends Data.TaggedError(
  "HostedProofRequestError"
)<{ readonly cause: unknown }> {}

const program = Effect.gen(function* proveHostedStagedRefresh() {
  const input = yield* CodexSubscriptionLoginConfigService;
  const previewUrl = yield* previewUrlConfig;
  const internalToken = yield* internalTokenConfig;
  const requestBody = yield* Schema.encodeEffect(
    Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
  )(
    OpenAICompatibleChatCompletionRequest.make({
      messages: [{ content: "Reply only: OK.", role: "user" }],
      model: CodexResponsesModelId.make("gpt-5.5"),
      stream: true,
    })
  );
  const store = yield* CodexProfileStore;
  const commit = yield* CodexOAuthProfileCommit;
  const client = yield* HttpClient.HttpClient;
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
  const stagedProfile = CodexSubscriptionProfile.make({
    ...profile,
    accessToken: profile.accessToken,
    accountId: profile.accountId,
    credentialRevision: stagedRevision,
    expiresAtEpochMillis: now - 1,
    refreshToken: profile.refreshToken,
    updatedAtEpochMillis: now,
  });

  yield* commit.replace({
    expectedRevision: profile.credentialRevision,
    profile: stagedProfile,
  });

  const completionUrl = new URL("/v1/chat/completions", previewUrl);
  const request = HttpClientRequest.post(completionUrl).pipe(
    HttpClientRequest.setHeaders({
      authorization: `Bearer ${Redacted.value(internalToken)}`,
      "content-type": "application/json",
    }),
    HttpClientRequest.bodyText(requestBody, "application/json")
  );
  const responses = yield* Effect.all(
    [client.execute(request), client.execute(request)].map((response) =>
      response.pipe(
        Effect.mapError((cause) => new HostedProofRequestError({ cause }))
      )
    ),
    { concurrency: "unbounded" }
  );
  const bodies = yield* Effect.all(
    responses.map((response) => response.text),
    {
      concurrency: "unbounded",
    }
  );
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
      (response) => response.headers["content-type"] === "text/event-stream"
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
      ConfigProvider.layer(ConfigProvider.fromEnv()),
      BunHttpClient.layer
    )
  )
);

const main = Effect.gen(function* renderHostedStagedRefreshProof() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(HostedStagedRefreshProofSuccess)
    )({ result: exit.value, status: "proved" });
    return yield* Console.log(output);
  }

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(HostedStagedRefreshProofBlocked)
  )({ status: "blocked" });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);
