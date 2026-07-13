import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Redacted, Schema } from "effect";

import {
  SendblueConfigLive,
  SendblueConfigService,
  loadSendblueConfig,
} from "../agent/lib/sendblue/config.js";
import { SendblueConfigError } from "../agent/lib/sendblue/errors.js";
import { SendblueSenderIdentities } from "../agent/lib/sendblue/schemas.js";

const encodeSenderIdentities = Schema.encodeSync(
  Schema.fromJsonString(SendblueSenderIdentities)
);
const senderIdentities = Schema.decodeUnknownSync(SendblueSenderIdentities)({
  "+14155550100": "owner",
});

const environment = {
  BUNDJIL_SENDBLUE_API_KEY: "test-api-key",
  BUNDJIL_SENDBLUE_API_SECRET: "test-api-secret",
  BUNDJIL_SENDBLUE_FROM_NUMBER: "+13472760577",
  BUNDJIL_SENDBLUE_REPLAY_STORE_LEASE_SECONDS: "60",
  BUNDJIL_SENDBLUE_REPLAY_STORE_PREFIX: "sendblue:test",
  BUNDJIL_SENDBLUE_REPLAY_STORE_TOKEN: "test-replay-token",
  BUNDJIL_SENDBLUE_REPLAY_STORE_TTL_SECONDS: "86400",
  BUNDJIL_SENDBLUE_REPLAY_STORE_URL: "https://example.test/redis",
  BUNDJIL_SENDBLUE_ROUTING_KEY: "test-routing-key",
  BUNDJIL_SENDBLUE_SENDER_IDENTITIES: encodeSenderIdentities(senderIdentities),
  BUNDJIL_SENDBLUE_WEBHOOK_SECRET: "test-webhook-secret",
};

it.effect("loads required Sendblue config with redacted secrets", () =>
  Effect.gen(function* testSendblueConfig() {
    const config = yield* SendblueConfigService.pipe(
      Effect.provide(
        SendblueConfigLive.pipe(
          Layer.provide(
            ConfigProvider.layer(
              ConfigProvider.fromEnv({
                env: environment,
              })
            )
          )
        )
      )
    );

    assert.strictEqual(config.apiBaseUrl.href, "https://api.sendblue.com/");
    assert.deepStrictEqual(config.allowedServices, ["iMessage"]);
    assert.strictEqual(Redacted.value(config.apiKey), "test-api-key");
    assert.strictEqual(
      Schema.is(Schema.Redacted(Schema.NonEmptyString))(config.apiKey),
      true
    );
    assert.deepStrictEqual(
      Schema.encodeSync(SendblueSenderIdentities)(config.senderIdentities),
      { "+14155550100": "owner" }
    );
  })
);

it.effect("fails closed when a required Sendblue secret is missing", () =>
  Effect.gen(function* testMissingSecret() {
    const { BUNDJIL_SENDBLUE_WEBHOOK_SECRET: _, ...withoutWebhookSecret } =
      environment;
    const error = yield* loadSendblueConfig.pipe(
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromEnv({
            env: withoutWebhookSecret,
          })
        )
      ),
      Effect.flip
    );

    assert.strictEqual(Schema.is(SendblueConfigError)(error), true);
    assert.notInclude(String(error), "test-api-key");
    assert.notInclude(String(error), "test-webhook-secret");
  })
);

it.effect(
  "validates E.164 mappings and restricts the API override to test mode",
  () =>
    Effect.gen(function* testValidationAndOverride() {
      const invalidMappingError = yield* loadSendblueConfig.pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                ...environment,
                BUNDJIL_SENDBLUE_SENDER_IDENTITIES: '{"not-a-phone":"owner"}',
              },
            })
          )
        ),
        Effect.flip
      );
      assert.strictEqual(
        Schema.is(SendblueConfigError)(invalidMappingError),
        true
      );

      const unguardedOverrideError = yield* loadSendblueConfig.pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                ...environment,
                BUNDJIL_SENDBLUE_TEST_API_BASE_URL: "http://127.0.0.1:8787",
              },
            })
          )
        ),
        Effect.flip
      );
      assert.strictEqual(
        Schema.is(SendblueConfigError)(unguardedOverrideError),
        true
      );

      const testConfig = yield* loadSendblueConfig.pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                ...environment,
                BUNDJIL_SENDBLUE_TEST_API_BASE_URL: "http://127.0.0.1:8787",
                BUNDJIL_SENDBLUE_TEST_MODE: "true",
              },
            })
          )
        )
      );
      assert.strictEqual(testConfig.apiBaseUrl.href, "http://127.0.0.1:8787/");

      const allowedServicesConfig = yield* loadSendblueConfig.pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                ...environment,
                BUNDJIL_SENDBLUE_ALLOWED_SERVICES: "SMS,RCS",
              },
            })
          )
        )
      );
      assert.deepStrictEqual(allowedServicesConfig.allowedServices, [
        "SMS",
        "RCS",
      ]);

      const invalidFromNumberError = yield* loadSendblueConfig.pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                ...environment,
                BUNDJIL_SENDBLUE_FROM_NUMBER: "14155550100",
              },
            })
          )
        ),
        Effect.flip
      );
      assert.strictEqual(
        Schema.is(SendblueConfigError)(invalidFromNumberError),
        true
      );
    })
);
