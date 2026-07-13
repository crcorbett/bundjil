import { assert, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Layer, Redacted, Schema } from "effect";
import { TestClock } from "effect/testing";
import { HttpClient } from "effect/unstable/http";

import {
  CodexOAuthHttpClient,
  CodexSubscriptionAuthError,
} from "../src/index.js";
import {
  CodexOAuthHttpClientLive,
  CodexSubscriptionAuthProtocolConfigLive,
} from "../src/live.layer.js";

const makeTimeoutLayer = (started: Deferred.Deferred<null>) =>
  CodexOAuthHttpClientLive.pipe(
    Layer.provideMerge(
      Layer.merge(
        Layer.succeed(
          HttpClient.HttpClient,
          HttpClient.make(() =>
            Deferred.succeed(started, null).pipe(Effect.andThen(Effect.never))
          )
        ),
        CodexSubscriptionAuthProtocolConfigLive
      )
    )
  );

it.effect("classifies authorization-code exchange execution timeouts", () =>
  Effect.gen(function* testAuthorizationCodeExchangeTimeout() {
    const started = yield* Deferred.make<null>();
    const fiber = yield* Effect.forkChild(
      Effect.gen(function* runExchange() {
        const client = yield* CodexOAuthHttpClient;

        return yield* client.exchangeAuthorizationCode({
          code: Redacted.make("code-secret"),
          codeVerifier: Redacted.make("verifier-secret"),
          redirectUri: "http://localhost:1455/auth/callback",
        });
      }).pipe(Effect.provide(makeTimeoutLayer(started)))
    );

    yield* Deferred.await(started);
    yield* TestClock.adjust("31 seconds");
    const error = yield* Fiber.join(fiber).pipe(Effect.flip);

    assert.strictEqual(Schema.is(CodexSubscriptionAuthError)(error), true);
    if (!Schema.is(CodexSubscriptionAuthError)(error)) {
      return;
    }
    assert.strictEqual(error.operation, "exchangeAuthorizationCode");
    assert.strictEqual(error.reason, "timeout");
    assert.strictEqual(error.status, undefined);
  })
);

it.effect("classifies refresh execution timeouts", () =>
  Effect.gen(function* testRefreshTimeout() {
    const started = yield* Deferred.make<null>();
    const fiber = yield* Effect.forkChild(
      Effect.gen(function* runRefresh() {
        const client = yield* CodexOAuthHttpClient;

        return yield* client.refresh({
          refreshToken: Redacted.make("refresh-secret"),
        });
      }).pipe(Effect.provide(makeTimeoutLayer(started)))
    );

    yield* Deferred.await(started);
    yield* TestClock.adjust("31 seconds");
    const error = yield* Fiber.join(fiber).pipe(Effect.flip);

    assert.strictEqual(Schema.is(CodexSubscriptionAuthError)(error), true);
    if (!Schema.is(CodexSubscriptionAuthError)(error)) {
      return;
    }
    assert.strictEqual(error.operation, "refreshToken");
    assert.strictEqual(error.reason, "timeout");
    assert.strictEqual(error.status, undefined);
  })
);
