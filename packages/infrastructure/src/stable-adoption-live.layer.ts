import {
  PhotonManagementCredentials,
  PhotonManagementLive,
} from "@bundjil/photon/management";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Layer } from "effect";

import type { AdoptionProviderScopes } from "./adoption-manifest.js";
import { loadInfrastructurePhotonCredentials } from "./config.js";
import { layerPhotonReadOnlyProviders } from "./photon/providers.js";
import {
  VercelLive,
  VercelCredentialsLive,
  VercelProjectCredentialsLive,
} from "./vercel/live.layer.js";
import { layerVercelReadOnlyProviders } from "./vercel/providers.js";
import {
  VercelPreviewPhotonBindingValuesLive,
  VercelStableEnvironmentBindingsLive,
} from "./vercel/stable-environment-live.layer.js";

const makeLiveStableAdoptionProviders = (
  scopes: AdoptionProviderScopes,
  vercelCredentials: typeof VercelCredentialsLive
) => {
  const photonCredentials = Layer.succeed(
    PhotonManagementCredentials,
    loadInfrastructurePhotonCredentials(scopes.photon.stage)
  );
  const transport = Layer.merge(BunHttpClient.layer, vercelCredentials);
  const vercelReads = VercelLive.pipe(Layer.provide(transport));
  const stableBindings = VercelStableEnvironmentBindingsLive.pipe(
    Layer.provide(transport)
  );
  const photonReads = PhotonManagementLive.pipe(
    Layer.provide(photonCredentials),
    Layer.provide(BunHttpClient.layer)
  );
  const providerServices = Layer.mergeAll(
    vercelReads,
    stableBindings,
    VercelPreviewPhotonBindingValuesLive,
    photonReads
  );
  const providers = Layer.merge(
    layerVercelReadOnlyProviders(scopes.vercel).pipe(
      Layer.provide(VercelPreviewPhotonBindingValuesLive),
      Layer.provide(stableBindings),
      Layer.provide(vercelReads)
    ),
    layerPhotonReadOnlyProviders(scopes.photon).pipe(Layer.provide(photonReads))
  );
  return Layer.merge(providers, providerServices);
};

export const layerLiveStableAdoptionProviders = (
  scopes: AdoptionProviderScopes
) => makeLiveStableAdoptionProviders(scopes, VercelCredentialsLive);

export const layerLiveStableAdoptionDriftProviders = (
  scopes: AdoptionProviderScopes
) => makeLiveStableAdoptionProviders(scopes, VercelProjectCredentialsLive);
