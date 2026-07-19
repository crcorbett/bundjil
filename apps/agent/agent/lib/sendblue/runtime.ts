import {
  UpstashPersistenceLive,
  UpstashPersistenceOptions,
} from "@bundjil/store/upstash";
import { Effect, Layer, Schema } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

import { SendblueChannelLive } from "./channel.js";
import { SendblueClientLive } from "./client.js";
import { SendblueConfigLive, SendblueConfigService } from "./config.js";
import { SendblueConfigError } from "./errors.js";
import { SendblueIdentityDirectoryLive } from "./identity-directory.js";
import { SendblueReplayStoreLive } from "./replay-store.js";
import { SendblueSessionRouterLive } from "./session-router.js";
import { SendblueWebhookVerifierLive } from "./webhook-verifier.js";

const SendbluePersistenceLive = Layer.unwrap(
  Effect.gen(function* makeSendbluePersistenceLive() {
    const config = yield* SendblueConfigService;
    const keyPrefix = yield* Schema.decodeEffect(
      UpstashPersistenceOptions.fields.keyPrefix
    )(config.replayStore.prefix).pipe(
      Effect.mapError(
        () =>
          new SendblueConfigError({
            message: "Unable to load Sendblue configuration.",
          })
      )
    );
    const options = {
      keyPrefix,
      restToken: config.replayStore.token,
      restUrl: config.replayStore.url,
    } satisfies UpstashPersistenceOptions;
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
