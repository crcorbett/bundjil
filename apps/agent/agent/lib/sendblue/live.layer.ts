import {
  UpstashPersistenceLive,
  UpstashPersistenceOptions,
} from "@bundjil/effect-persistence/upstash";
import { Effect, Layer, Schema } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

import { SendblueChannelLive } from "./channel.service.js";
import { SendblueClientLive } from "./client.service.js";
import { SendblueConfigLive, SendblueConfigService } from "./config.js";
import { SendblueConfigError } from "./errors.js";
import { SendblueIdentityDirectoryLive } from "./identity-directory.service.js";
import { SendblueReplayStoreLive } from "./replay-store.service.js";
import { SendblueSessionRouterLive } from "./session-router.service.js";
import { SendblueWebhookVerifierLive } from "./webhook-verifier.service.js";

const SendbluePersistenceLive = Layer.unwrap(
  Effect.gen(function* makeSendbluePersistenceLive() {
    const config = yield* SendblueConfigService;
    const options = yield* Schema.decodeUnknownEffect(
      UpstashPersistenceOptions
    )({
      keyPrefix: config.replayStore.prefix,
      restToken: config.replayStore.token,
      restUrl: config.replayStore.url,
    }).pipe(
      Effect.mapError(
        () =>
          new SendblueConfigError({
            message: "Unable to load Sendblue configuration.",
          })
      )
    );
    return UpstashPersistenceLive(options);
  })
).pipe(Layer.provide(SendblueConfigLive));

const sendblueServicesLive = Layer.mergeAll(
  SendblueWebhookVerifierLive,
  SendblueIdentityDirectoryLive,
  SendblueSessionRouterLive,
  SendblueReplayStoreLive,
  SendblueClientLive
).pipe(
  Layer.provideMerge(SendblueConfigLive),
  Layer.provideMerge(SendbluePersistenceLive),
  Layer.provideMerge(FetchHttpClient.layer)
);

export const SendblueChannelRuntimeLive = SendblueChannelLive.pipe(
  Layer.provideMerge(sendblueServicesLive)
);
