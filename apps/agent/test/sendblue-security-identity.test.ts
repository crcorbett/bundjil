import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Ref, Schema } from "effect";

import { SendblueConfigService } from "../agent/lib/sendblue/config.js";
import {
  SendblueSenderNotAllowedError,
  SendblueWebhookAuthenticationError,
} from "../agent/lib/sendblue/errors.js";
import {
  makeSendblueIdentityDirectory,
  SendblueIdentityDirectory,
  SendblueIdentityDirectoryLive,
} from "../agent/lib/sendblue/identity-directory.js";
import {
  E164PhoneNumber,
  SendblueConfig,
  SendblueSenderIdentities,
} from "../agent/lib/sendblue/schemas.js";
import {
  makeSendblueSessionRouter,
  SendblueSessionRouter,
  SendblueSessionRouterLive,
} from "../agent/lib/sendblue/session-router.js";
import {
  makeSendblueWebhookVerifier,
  SendblueWebhookVerifier,
  SendblueWebhookVerifierLive,
} from "../agent/lib/sendblue/webhook-verifier.js";

const senderNumber = Schema.decodeUnknownSync(E164PhoneNumber)("+14155550100");
const otherSenderNumber =
  Schema.decodeUnknownSync(E164PhoneNumber)("+14155550101");
const sendblueLine = Schema.decodeUnknownSync(E164PhoneNumber)("+14155550177");
const configLayer = Layer.succeed(
  SendblueConfigService,
  Schema.decodeUnknownSync(SendblueConfig)({
    allowedServices: ["iMessage"],
    apiBaseUrl: new URL("https://api.sendblue.test"),
    apiKey: Redacted.make("test-api-key"),
    apiSecret: Redacted.make("test-api-secret"),
    fromNumber: sendblueLine,
    replayStore: {
      leaseSeconds: 60,
      prefix: "sendblue:test:",
      token: Redacted.make("test-replay-token"),
      ttlSeconds: 86_400,
      url: Redacted.make("https://example.test/redis"),
    },
    routingKey: Redacted.make("routing-secret"),
    senderIdentities: { "+14155550100": "owner" },
    typingMaxDurationMillis: 120_000,
    webhookSecret: Redacted.make("expected-secret"),
  })
);

it.effect("fails closed before a webhook body decoder can run", () =>
  Effect.gen(function* testWebhookVerificationOrder() {
    const decoderCalls = yield* Ref.make(0);
    const verifier = makeSendblueWebhookVerifier(
      Redacted.make("expected-secret")
    );
    const decodeBody = Ref.update(decoderCalls, (calls) => calls + 1);
    const missing = yield* verifier
      .verify(new Headers())
      .pipe(Effect.andThen(decodeBody), Effect.flip);
    const malformed = yield* verifier
      .verify(new Headers({ "sb-signing-secret": "wrong" }))
      .pipe(Effect.andThen(decodeBody), Effect.flip);
    const equalLengthMismatch = yield* verifier
      .verify(new Headers({ "sb-signing-secret": "wrong-secret-xx" }))
      .pipe(Effect.andThen(decodeBody), Effect.flip);
    const decodedBeforeAuthentication = yield* Ref.get(decoderCalls);

    assert.strictEqual(
      Schema.is(SendblueWebhookAuthenticationError)(missing),
      true
    );
    assert.strictEqual(
      Schema.is(SendblueWebhookAuthenticationError)(malformed),
      true
    );
    assert.strictEqual(
      Schema.is(SendblueWebhookAuthenticationError)(equalLengthMismatch),
      true
    );
    assert.strictEqual(decodedBeforeAuthentication, 0);

    yield* verifier
      .verify(new Headers({ "sb-signing-secret": "expected-secret" }))
      .pipe(Effect.andThen(decodeBody));
    assert.strictEqual(yield* Ref.get(decoderCalls), 1);
  })
);

it.effect("maps only configured senders to stable non-phone principals", () =>
  Effect.gen(function* testIdentityDirectory() {
    const directory = makeSendblueIdentityDirectory(
      Schema.decodeUnknownSync(SendblueSenderIdentities)({
        "+14155550100": "owner",
      })
    );
    const identity = yield* directory.resolve(senderNumber);
    const unknown = yield* directory
      .resolve(otherSenderNumber)
      .pipe(Effect.flip);

    assert.strictEqual(identity.principalId, "owner");
    assert.notInclude(identity.principalId, senderNumber);
    assert.strictEqual(Schema.is(SendblueSenderNotAllowedError)(unknown), true);
    assert.notInclude(String(unknown), otherSenderNumber);
  })
);

it.effect(
  "derives stable opaque session keys partitioned by Sendblue line",
  () =>
    Effect.gen(function* testSessionRouting() {
      const router = makeSendblueSessionRouter(Redacted.make("routing-secret"));
      const sameRoute = yield* router.route(senderNumber, sendblueLine);
      const repeatedRoute = yield* router.route(senderNumber, sendblueLine);
      const otherLine = yield* router.route(
        senderNumber,
        Schema.decodeUnknownSync(E164PhoneNumber)("+13472760578")
      );

      assert.strictEqual(sameRoute, repeatedRoute);
      assert.notStrictEqual(sameRoute, otherLine);
      assert.notInclude(sameRoute, senderNumber);
      assert.notInclude(sameRoute, sendblueLine);
    })
);

it.effect(
  "composes config-backed security, identity, and routing live layers",
  () =>
    Effect.gen(function* testLiveServiceLayers() {
      const verifier = yield* SendblueWebhookVerifier;
      const identities = yield* SendblueIdentityDirectory;
      const router = yield* SendblueSessionRouter;

      yield* verifier.verify(
        new Headers({ "sb-signing-secret": "expected-secret" })
      );
      assert.strictEqual(
        (yield* identities.resolve(senderNumber)).principalId,
        "owner"
      );
      assert.notInclude(
        yield* router.route(senderNumber, sendblueLine),
        senderNumber
      );
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          SendblueWebhookVerifierLive,
          SendblueIdentityDirectoryLive,
          SendblueSessionRouterLive
        ).pipe(Layer.provide(configLayer))
      )
    )
);
