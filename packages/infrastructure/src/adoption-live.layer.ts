import {
  PhotonManagementCredentialsLive,
  PhotonManagementLive,
} from "@bundjil/photon/management";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Layer } from "effect";

import type { AdoptionProviderScopes } from "./adoption-manifest.js";
import { layerPhotonReadOnlyProviders } from "./photon/providers.js";
import { VercelLive, VercelCredentialsLive } from "./vercel/live.layer.js";
import { layerVercelReadOnlyProviders } from "./vercel/providers.js";

export const layerLiveReadOnlyAdoptionProviders = (
  scopes: AdoptionProviderScopes
) => {
  const liveProviderServices = Layer.merge(
    VercelLive.pipe(
      Layer.provide(VercelCredentialsLive),
      Layer.provide(BunHttpClient.layer)
    ),
    PhotonManagementLive.pipe(
      Layer.provide(PhotonManagementCredentialsLive),
      Layer.provide(BunHttpClient.layer)
    )
  );

  const readOnlyProviders = Layer.merge(
    layerVercelReadOnlyProviders(scopes.vercel).pipe(
      Layer.provide(liveProviderServices)
    ),
    layerPhotonReadOnlyProviders(scopes.photon).pipe(
      Layer.provide(liveProviderServices)
    )
  );

  return Layer.merge(readOnlyProviders, liveProviderServices);
};
