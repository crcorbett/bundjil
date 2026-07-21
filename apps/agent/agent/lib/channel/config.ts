import { SendblueConfig } from "@bundjil/sendblue";
import { UpstashPersistenceOptions } from "@bundjil/store/upstash";
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

import { ChannelConfigError } from "./errors.js";
import {
  ChannelIdentityRecords,
  ChannelReplayOptions,
  ChannelRoutingSecret,
} from "./schemas.js";
import type {
  ChannelIdentityRecords as ChannelIdentityRecordsType,
  ChannelReplayOptions as ChannelReplayOptionsType,
  ChannelRoutingSecret as ChannelRoutingSecretType,
} from "./schemas.js";

export interface ChannelConfigShape {
  readonly identities: ChannelIdentityRecordsType;
  readonly replay: ChannelReplayOptionsType;
  readonly routingSecret: ChannelRoutingSecretType;
  readonly sendblue: typeof SendblueConfig.Type;
  readonly store: typeof UpstashPersistenceOptions.Type;
}

export class ChannelConfig extends Context.Service<
  ChannelConfig,
  ChannelConfigShape
>()("@bundjil/agent/ChannelConfig") {}

const identitiesConfig = Config.schema(
  Schema.RedactedFromValue(Schema.fromJsonString(ChannelIdentityRecords)),
  "BUNDJIL_CHANNEL_ROUTING_IDENTITIES"
);

export const loadChannelConfig = Effect.gen(function* loadChannelConfig() {
  const values = yield* Effect.all({
    identities: identitiesConfig,
    replayLeaseMilliseconds: Config.schema(
      ChannelReplayOptions.fields.leaseMilliseconds,
      "BUNDJIL_CHANNEL_REPLAY_LEASE_MILLISECONDS"
    ).pipe(Config.withDefault(60_000)),
    replayPrefix: Config.schema(
      ChannelReplayOptions.fields.prefix,
      "BUNDJIL_CHANNEL_REPLAY_PREFIX"
    ).pipe(Config.withDefault(ChannelReplayOptions.fields.prefix.make("v1:"))),
    replayRestToken: Config.schema(
      UpstashPersistenceOptions.fields.restToken,
      "BUNDJIL_CHANNEL_REPLAY_REST_TOKEN"
    ),
    replayRestUrl: Config.schema(
      UpstashPersistenceOptions.fields.restUrl,
      "BUNDJIL_CHANNEL_REPLAY_REST_URL"
    ),
    replayStorePrefix: Config.schema(
      UpstashPersistenceOptions.fields.keyPrefix,
      "BUNDJIL_CHANNEL_REPLAY_STORE_PREFIX"
    ).pipe(Config.withDefault("bundjil:channel:v1:")),
    replayTtlMilliseconds: Config.schema(
      ChannelReplayOptions.fields.ttlMilliseconds,
      "BUNDJIL_CHANNEL_REPLAY_TTL_MILLISECONDS"
    ).pipe(Config.withDefault(604_800_000)),
    routingSecret: Config.schema(
      ChannelRoutingSecret,
      "BUNDJIL_CHANNEL_ROUTING_SECRET"
    ),
    sendblueAllowedServices: Config.schema(
      SendblueConfig.fields.allowedServices,
      "BUNDJIL_CHANNEL_SENDBLUE_ALLOWED_SERVICES"
    ).pipe(Config.withDefault(["iMessage"])),
    sendblueApiKey: Config.schema(
      SendblueConfig.fields.apiKey,
      "BUNDJIL_CHANNEL_SENDBLUE_API_KEY"
    ),
    sendblueApiSecret: Config.schema(
      SendblueConfig.fields.apiSecret,
      "BUNDJIL_CHANNEL_SENDBLUE_API_SECRET"
    ),
    sendblueLine: Config.schema(
      SendblueConfig.fields.line,
      "BUNDJIL_CHANNEL_SENDBLUE_LINE"
    ),
    sendblueTypingDurationMillis: Config.schema(
      SendblueConfig.fields.typingDurationMillis,
      "BUNDJIL_CHANNEL_SENDBLUE_TYPING_DURATION_MILLIS"
    ).pipe(
      Config.withDefault(
        SendblueConfig.fields.typingDurationMillis.make(120_000)
      )
    ),
    sendblueWebhookSecret: Config.schema(
      SendblueConfig.fields.webhookSecret,
      "BUNDJIL_CHANNEL_SENDBLUE_WEBHOOK_SECRET"
    ),
  });

  return ChannelConfig.of({
    identities: Redacted.value(values.identities),
    replay: {
      leaseMilliseconds: values.replayLeaseMilliseconds,
      prefix: values.replayPrefix,
      ttlMilliseconds: values.replayTtlMilliseconds,
    },
    routingSecret: values.routingSecret,
    sendblue: {
      allowedServices: values.sendblueAllowedServices,
      apiKey: values.sendblueApiKey,
      apiSecret: values.sendblueApiSecret,
      line: values.sendblueLine,
      typingDurationMillis: values.sendblueTypingDurationMillis,
      webhookSecret: values.sendblueWebhookSecret,
    },
    store: {
      keyPrefix: values.replayStorePrefix,
      restToken: values.replayRestToken,
      restUrl: values.replayRestUrl,
    },
  });
}).pipe(Effect.mapError(() => new ChannelConfigError({ reason: "invalid" })));

export const layerLive = Layer.effect(ChannelConfig, loadChannelConfig);
