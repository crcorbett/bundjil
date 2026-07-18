import {
  Config,
  Context,
  Effect,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";

import { SendblueConfigError } from "./errors.js";
import {
  E164PhoneNumber,
  SendblueConfig,
  SendblueSenderIdentities,
  SendblueService,
  SendblueTypingIndicatorDurationMillis,
} from "./schemas.js";
import type { SendblueConfig as SendblueConfigType } from "./schemas.js";

const apiKeyConfig = Config.redacted("BUNDJIL_SENDBLUE_API_KEY");
const apiSecretConfig = Config.redacted("BUNDJIL_SENDBLUE_API_SECRET");
const webhookSecretConfig = Config.redacted("BUNDJIL_SENDBLUE_WEBHOOK_SECRET");
const routingKeyConfig = Config.redacted("BUNDJIL_SENDBLUE_ROUTING_KEY");
const fromNumberConfig = Config.schema(
  E164PhoneNumber,
  "BUNDJIL_SENDBLUE_FROM_NUMBER"
);
const senderIdentitiesConfig = Config.redacted(
  "BUNDJIL_SENDBLUE_SENDER_IDENTITIES"
);
const replayStoreUrlConfig = Config.redacted(
  "BUNDJIL_SENDBLUE_REPLAY_STORE_URL"
).pipe(Config.orElse(() => Config.redacted("KV_REST_API_URL")));
const replayStoreTokenConfig = Config.redacted(
  "BUNDJIL_SENDBLUE_REPLAY_STORE_TOKEN"
).pipe(Config.orElse(() => Config.redacted("KV_REST_API_TOKEN")));
const replayStorePrefixConfig = Config.nonEmptyString(
  "BUNDJIL_SENDBLUE_REPLAY_STORE_PREFIX"
);
const replayStoreTtlSecondsConfig = Config.schema(
  Schema.Int.check(Schema.isGreaterThan(0)),
  "BUNDJIL_SENDBLUE_REPLAY_STORE_TTL_SECONDS"
);
const replayStoreLeaseSecondsConfig = Config.schema(
  Schema.Int.check(Schema.isGreaterThan(0)),
  "BUNDJIL_SENDBLUE_REPLAY_STORE_LEASE_SECONDS"
);
const allowedServicesConfig = Config.schema(
  Schema.Array(SendblueService),
  "BUNDJIL_SENDBLUE_ALLOWED_SERVICES"
).pipe(Config.withDefault(["iMessage"]));
const typingMaxDurationMillisConfig = Config.schema(
  SendblueTypingIndicatorDurationMillis,
  "BUNDJIL_SENDBLUE_TYPING_MAX_DURATION_MILLIS"
).pipe(Config.withDefault(120_000));
const testModeConfig = Config.option(
  Config.literal("true", "BUNDJIL_SENDBLUE_TEST_MODE")
);
const testApiBaseUrlConfig = Config.option(
  Config.url("BUNDJIL_SENDBLUE_TEST_API_BASE_URL")
);

export class SendblueConfigService extends Context.Service<
  SendblueConfigService,
  SendblueConfigType
>()("@bundjil/agent/SendblueConfig") {}

export const loadSendblueConfig = Effect.gen(
  function* loadSendblueConfigFromProvider() {
    const values = yield* Effect.all({
      allowedServices: allowedServicesConfig,
      apiKey: apiKeyConfig,
      apiSecret: apiSecretConfig,
      fromNumber: fromNumberConfig,
      replayStoreLeaseSeconds: replayStoreLeaseSecondsConfig,
      replayStorePrefix: replayStorePrefixConfig,
      replayStoreToken: replayStoreTokenConfig,
      replayStoreTtlSeconds: replayStoreTtlSecondsConfig,
      replayStoreUrl: replayStoreUrlConfig,
      routingKey: routingKeyConfig,
      senderIdentities: senderIdentitiesConfig,
      testApiBaseUrl: testApiBaseUrlConfig,
      testMode: testModeConfig,
      typingMaxDurationMillis: typingMaxDurationMillisConfig,
      webhookSecret: webhookSecretConfig,
    });
    const senderIdentities = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(SendblueSenderIdentities)
    )(Redacted.value(values.senderIdentities));
    const apiBaseUrl = yield* Option.match(values.testApiBaseUrl, {
      onNone: () => Effect.succeed(new URL("https://api.sendblue.com")),
      onSome: (url) =>
        Option.match(values.testMode, {
          onNone: () =>
            Effect.fail(
              new SendblueConfigError({
                message: "The Sendblue test API URL requires test mode.",
              })
            ),
          onSome: () => Effect.succeed(url),
        }),
    });

    return yield* Schema.decodeUnknownEffect(SendblueConfig)({
      allowedServices: values.allowedServices,
      apiBaseUrl,
      apiKey: values.apiKey,
      apiSecret: values.apiSecret,
      fromNumber: values.fromNumber,
      replayStore: {
        leaseSeconds: values.replayStoreLeaseSeconds,
        prefix: values.replayStorePrefix,
        token: values.replayStoreToken,
        ttlSeconds: values.replayStoreTtlSeconds,
        url: values.replayStoreUrl,
      },
      routingKey: values.routingKey,
      senderIdentities,
      typingMaxDurationMillis: values.typingMaxDurationMillis,
      webhookSecret: values.webhookSecret,
    });
  }
).pipe(
  Effect.mapError(
    () =>
      new SendblueConfigError({
        message: "Unable to load Sendblue configuration.",
      })
  ),
  Effect.withSpan("SendblueConfig.load")
);

export const SendblueConfigLive = Layer.effect(
  SendblueConfigService,
  loadSendblueConfig
);
