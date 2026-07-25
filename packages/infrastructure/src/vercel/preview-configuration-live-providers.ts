import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Layer } from "effect";

import { VercelPreviewConfigurationLive } from "./configuration-live.layer.js";
import { layerVercelPreviewConfigurationProviders } from "./configuration-providers.js";
import type {
  VercelPreviewEnvironmentMetadataProps,
  VercelPreviewFeedbackProps,
} from "./configuration.js";
import { VercelCredentialsLive, VercelLive } from "./live.layer.js";

const transport = Layer.merge(BunHttpClient.layer, VercelCredentialsLive);
const reads = VercelLive.pipe(Layer.provide(transport));
const configuration = VercelPreviewConfigurationLive.pipe(
  Layer.provide(reads),
  Layer.provide(transport)
);
export const layerVercelPreviewConfigurationLive = Layer.merge(
  reads,
  configuration
);

export const layerVercelPreviewConfigurationLiveProviders = (scope: {
  readonly feedback: VercelPreviewFeedbackProps;
  readonly environmentMetadata: VercelPreviewEnvironmentMetadataProps;
}) =>
  Layer.merge(
    layerVercelPreviewConfigurationProviders(scope).pipe(
      Layer.provide(layerVercelPreviewConfigurationLive)
    ),
    layerVercelPreviewConfigurationLive
  );
