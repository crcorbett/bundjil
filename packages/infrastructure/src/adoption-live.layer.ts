import {
  PhotonManagementCredentials,
  PhotonManagementLive,
} from "@bundjil/photon/management";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Layer } from "effect";

import type { AdoptionProviderScopes } from "./adoption-manifest.js";
import { loadInfrastructurePhotonCredentials } from "./config.js";
import { layerPhotonReadOnlyProviders } from "./photon/providers.js";
import { VercelLive, VercelCredentialsLive } from "./vercel/live.layer.js";
import { layerVercelReadOnlyProviders } from "./vercel/providers.js";
import {
  VercelPreviewPhotonBindingValuesDenied,
  VercelStableEnvironmentBindingsDenied,
} from "./vercel/stable-environment.js";

export const layerLiveReadOnlyAdoptionProviders = (
  scopes: AdoptionProviderScopes
) => {
  const photonCredentials = Layer.succeed(
    PhotonManagementCredentials,
    loadInfrastructurePhotonCredentials(scopes.photon.stage)
  );
  const liveProviderServices = Layer.merge(
    VercelLive.pipe(
      Layer.provide(VercelCredentialsLive),
      Layer.provide(BunHttpClient.layer)
    ),
    PhotonManagementLive.pipe(
      Layer.provide(photonCredentials),
      Layer.provide(BunHttpClient.layer)
    )
  );

  const readOnlyProviders = Layer.merge(
    layerVercelReadOnlyProviders(scopes.vercel).pipe(
      Layer.provide(VercelPreviewPhotonBindingValuesDenied),
      Layer.provide(VercelStableEnvironmentBindingsDenied),
      Layer.provide(liveProviderServices)
    ),
    layerPhotonReadOnlyProviders(scopes.photon).pipe(
      Layer.provide(liveProviderServices)
    )
  );

  return Layer.merge(readOnlyProviders, liveProviderServices);
};
