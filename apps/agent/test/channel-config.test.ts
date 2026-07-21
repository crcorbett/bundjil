import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Redacted, Schema } from "effect";

import { loadChannelConfig } from "../agent/lib/channel/config.js";
import {
  ChannelIdentityRecords,
  ChannelReplayOptions,
  ChannelRoutingSecret,
} from "../agent/lib/channel/schemas.js";

const configLayer = (env: Readonly<Record<string, string>>) =>
  ConfigProvider.layer(ConfigProvider.fromEnv({ env }));

const currentEnvironment = {
  BUNDJIL_CHANNEL_REPLAY_REST_TOKEN: "synthetic-replay-token",
  BUNDJIL_CHANNEL_REPLAY_REST_URL: "https://example.invalid/replay",
  BUNDJIL_CHANNEL_ROUTING_IDENTITIES:
    '[{"participantId":"+61400000001","principalId":"principal-1"}]',
  BUNDJIL_CHANNEL_ROUTING_SECRET: "synthetic-routing-secret",
  BUNDJIL_CHANNEL_SENDBLUE_API_KEY: "synthetic-api-key",
  BUNDJIL_CHANNEL_SENDBLUE_API_SECRET: "synthetic-api-secret",
  BUNDJIL_CHANNEL_SENDBLUE_LINE: "+61400000002",
  BUNDJIL_CHANNEL_SENDBLUE_WEBHOOK_SECRET: "synthetic-webhook-secret",
};

it.effect("loads only the fresh redacted channel environment", () =>
  Effect.gen(function* testChannelConfig() {
    const config = yield* loadChannelConfig.pipe(
      Effect.provide(configLayer(currentEnvironment))
    );

    assert.strictEqual(
      Schema.is(ChannelIdentityRecords)(config.identities),
      true
    );
    assert.strictEqual(Schema.is(ChannelReplayOptions)(config.replay), true);
    assert.strictEqual(
      Schema.is(ChannelRoutingSecret)(config.routingSecret),
      true
    );
    assert.strictEqual(
      Redacted.value(config.sendblue.apiKey),
      "synthetic-api-key"
    );
    assert.strictEqual(config.sendblue.line, "+61400000002");
    assert.strictEqual(config.replay.prefix, "v1:");
    assert.strictEqual(config.store.keyPrefix, "bundjil:channel:v1:");
  })
);

it.effect("does not fall back to the legacy Sendblue environment", () =>
  Effect.gen(function* testLegacyChannelConfigRejection() {
    const exit = yield* loadChannelConfig.pipe(
      Effect.provide(
        configLayer({
          BUNDJIL_SENDBLUE_API_KEY: "legacy-api-key",
          BUNDJIL_SENDBLUE_API_SECRET: "legacy-api-secret",
          BUNDJIL_SENDBLUE_FROM_NUMBER: "+61400000002",
          BUNDJIL_SENDBLUE_WEBHOOK_SECRET: "legacy-webhook-secret",
        })
      ),
      Effect.exit
    );

    assert.strictEqual(exit._tag, "Failure");
  })
);
