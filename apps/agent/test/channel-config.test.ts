import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Redacted, Schema } from "effect";

import {
  loadChannelConfig,
  loadPhotonConfig,
  loadSendblueConfig,
} from "../agent/lib/channel/config.js";
import {
  ChannelIdentityRecords,
  ChannelReplayOptions,
  ChannelRoutingSecret,
} from "../agent/lib/channel/schemas.js";

const configLayer = (env: Readonly<Record<string, string>>) =>
  ConfigProvider.layer(ConfigProvider.fromEnv({ env }));

const currentEnvironment = {
  BUNDJIL_CHANNEL_REPLAY_KV_REST_API_TOKEN: "synthetic-replay-token",
  BUNDJIL_CHANNEL_REPLAY_KV_REST_API_URL: "https://example.invalid/replay",
  BUNDJIL_CHANNEL_ROUTING_IDENTITIES:
    '[{"participantId":"+61400000001","principalId":"principal-1"}]',
  BUNDJIL_CHANNEL_ROUTING_SECRET: "synthetic-routing-secret",
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
    assert.strictEqual(config.replay.prefix, "v1:");
    assert.strictEqual(config.store.keyPrefix, "bundjil:channel:v1:");
  })
);

it.effect("loads provider credentials only from their composition root", () =>
  Effect.gen(function* testProviderConfig() {
    const sendblue = yield* loadSendblueConfig.pipe(
      Effect.provide(
        configLayer({
          BUNDJIL_CHANNEL_SENDBLUE_API_KEY: "synthetic-api-key",
          BUNDJIL_CHANNEL_SENDBLUE_API_SECRET: "synthetic-api-secret",
          BUNDJIL_CHANNEL_SENDBLUE_LINE: "+61400000002",
          BUNDJIL_CHANNEL_SENDBLUE_WEBHOOK_SECRET:
            "synthetic-sendblue-webhook-secret",
        })
      )
    );
    const photon = yield* loadPhotonConfig.pipe(
      Effect.provide(
        configLayer({
          BUNDJIL_CHANNEL_PHOTON_PROJECT_ID: "synthetic-project",
          BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET: "synthetic-project-secret",
          BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID:
            "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c",
          BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET:
            "synthetic-photon-webhook-secret",
        })
      )
    );

    assert.strictEqual(Redacted.value(sendblue.apiKey), "synthetic-api-key");
    assert.strictEqual(sendblue.line, "+61400000002");
    assert.strictEqual(photon.projectId, "synthetic-project");
    assert.strictEqual(
      Redacted.value(photon.projectSecret),
      "synthetic-project-secret"
    );
    assert.strictEqual(photon.webhookToleranceSeconds, 300);
  })
);

it.effect("does not fall back to the legacy Sendblue environment", () =>
  Effect.gen(function* testLegacyChannelConfigRejection() {
    const exit = yield* loadSendblueConfig.pipe(
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

it.effect("does not accept copied replay credential aliases", () =>
  Effect.gen(function* testLegacyReplayConfigRejection() {
    const exit = yield* loadChannelConfig.pipe(
      Effect.provide(
        configLayer({
          BUNDJIL_CHANNEL_REPLAY_REST_TOKEN: "copied-replay-token",
          BUNDJIL_CHANNEL_REPLAY_REST_URL:
            "https://example.invalid/copied-replay",
          BUNDJIL_CHANNEL_ROUTING_IDENTITIES:
            '[{"participantId":"+61400000001","principalId":"principal-1"}]',
          BUNDJIL_CHANNEL_ROUTING_SECRET: "synthetic-routing-secret",
        })
      ),
      Effect.exit
    );

    assert.strictEqual(exit._tag, "Failure");
  })
);
