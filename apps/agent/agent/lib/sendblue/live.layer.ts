import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

import { SendblueChannelLive } from "./channel.service.js";
import { SendblueClientLive } from "./client.service.js";
import { SendblueConfigLive } from "./config.js";
import { SendblueIdentityDirectoryLive } from "./identity-directory.service.js";
import { SendblueReplayStoreUpstashLive } from "./replay-store.service.js";
import { SendblueSessionRouterLive } from "./session-router.service.js";
import { SendblueWebhookVerifierLive } from "./webhook-verifier.service.js";

const sendblueServicesLive = Layer.mergeAll(
  SendblueWebhookVerifierLive,
  SendblueIdentityDirectoryLive,
  SendblueSessionRouterLive,
  SendblueReplayStoreUpstashLive,
  SendblueClientLive
).pipe(
  Layer.provideMerge(SendblueConfigLive),
  Layer.provideMerge(FetchHttpClient.layer)
);

export const SendblueChannelRuntimeLive = SendblueChannelLive.pipe(
  Layer.provideMerge(sendblueServicesLive)
);
