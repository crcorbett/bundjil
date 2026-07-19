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
} from "./schemas.js";
import type { SendblueConfig as SendblueConfigType } from "./schemas.js";

const apiKeyConfig = Config.schema(
  SendblueConfig.fields.apiKey,
  "BUNDJIL_SENDBLUE_API_KEY"
);
const apiSecretConfig = Config.schema(
  SendblueConfig.fields.apiSecret,
  "BUNDJIL_SENDBLUE_API_SECRET"
);
const webhookSecretConfig = Config.schema(
  SendblueConfig.fields.webhookSecret,
  "BUNDJIL_SENDBLUE_WEBHOOK_SECRET"
);
const routingKeyConfig = Config.schema(
  SendblueConfig.fields.routingKey,
  "BUNDJIL_SENDBLUE_ROUTING_KEY"
);
const fromNumberConfig = Config.schema(
  E164PhoneNumber,
  "BUNDJIL_SENDBLUE_FROM_NUMBER"
);
const senderIdentitiesConfig = Config.schema(
  Schema.RedactedFromValue(Schema.fromJsonString(SendblueSenderIdentities)),
  "BUNDJIL_SENDBLUE_SENDER_IDENTITIES"
);
const replayStoreUrlConfig = Config.schema(
  SendblueConfig.fields.replayStore.fields.url,
  "BUNDJIL_SENDBLUE_REPLAY_STORE_URL"
).pipe(
  Config.orElse(() =>
    Config.schema(
      SendblueConfig.fields.replayStore.fields.url,
      "KV_REST_API_URL"
    )
  )
);
const replayStoreTokenConfig = Config.schema(
  SendblueConfig.fields.replayStore.fields.token,
  "BUNDJIL_SENDBLUE_REPLAY_STORE_TOKEN"
).pipe(
  Config.orElse(() =>
    Config.schema(
      SendblueConfig.fields.replayStore.fields.token,
      "KV_REST_API_TOKEN"
    )
  )
);
const replayStorePrefixConfig = Config.schema(
  SendblueConfig.fields.replayStore.fields.prefix,
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
      webhookSecret: webhookSecretConfig,
    });
    const senderIdentities = Redacted.value(values.senderIdentities);
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

    return {
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
      webhookSecret: values.webhookSecret,
    } satisfies SendblueConfigType;
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
