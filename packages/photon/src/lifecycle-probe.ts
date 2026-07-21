import { Context, Effect, Layer } from "effect";

import { provePhotonSdkLifecycle } from "./client.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import type { PhotonConfig } from "./schemas.js";

interface PhotonLifecycleProbeShape {
  readonly run: (
    config: PhotonConfig
  ) => Effect.Effect<void, PhotonProviderProofError>;
}

export class PhotonLifecycleProbe extends Context.Service<
  PhotonLifecycleProbe,
  PhotonLifecycleProbeShape
>()("@bundjil/photon/PhotonLifecycleProbe") {}

export const layerPhotonLifecycleProbeLive = Layer.succeed(
  PhotonLifecycleProbe,
  PhotonLifecycleProbe.of({
    run: Effect.fn("PhotonLifecycleProbe.run")((config) =>
      provePhotonSdkLifecycle(config).pipe(
        Effect.timeoutOrElse({
          duration: "20 seconds",
          orElse: () =>
            Effect.fail(
              new PhotonProviderProofError({
                operation: "sdkLifecycle",
                reason: "lifecycleUnavailable",
              })
            ),
        }),
        Effect.mapError(
          () =>
            new PhotonProviderProofError({
              operation: "sdkLifecycle",
              reason: "lifecycleUnavailable",
            })
        )
      )
    ),
  })
);
