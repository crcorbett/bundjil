import {
  ChannelDeliveryUncertainError,
  ChannelProviderRejectedError,
  ChannelUnavailableError,
} from "@bundjil/channel";
import type {
  ChannelConversationIdType,
  ChannelOutboundTextType,
  ChannelPresenceActionType,
} from "@bundjil/channel";
import { Spectrum } from "@spectrum-ts/core";
import { imessage } from "@spectrum-ts/imessage";
import { Context, Effect, Layer, Redacted, Schema } from "effect";

import { PhotonLifecycleError } from "./errors.js";
import { PhotonSdkSendResult } from "./schemas.js";
import type {
  PhotonConfig,
  PhotonSdkSendResult as PhotonSdkSendResultType,
  PhotonSdkSendResultEncoded,
} from "./schemas.js";

export interface PhotonClientShape {
  readonly sendMessage: (
    conversationId: ChannelConversationIdType,
    text: ChannelOutboundTextType
  ) => Effect.Effect<
    PhotonSdkSendResultType,
    | ChannelUnavailableError
    | ChannelDeliveryUncertainError
    | ChannelProviderRejectedError
  >;
  readonly setPresence: (
    conversationId: ChannelConversationIdType,
    action: ChannelPresenceActionType
  ) => Effect.Effect<void, ChannelUnavailableError>;
}

export class PhotonClient extends Context.Service<
  PhotonClient,
  PhotonClientShape
>()("@bundjil/photon/PhotonClient") {}

export interface PhotonSdkSpace {
  readonly sendMessage: (
    text: ChannelOutboundTextType
  ) => Promise<PhotonSdkSendResultEncoded | undefined>;
  readonly setPresence: (action: ChannelPresenceActionType) => Promise<void>;
}

export interface PhotonSdkResource {
  readonly resolveSpace: (
    conversationId: ChannelConversationIdType
  ) => Promise<PhotonSdkSpace>;
  readonly stop: () => Promise<void>;
}

export interface PhotonSdkFactory {
  readonly acquire: (config: PhotonConfig) => Promise<PhotonSdkResource>;
}

const liveFactory: PhotonSdkFactory = {
  acquire: async (config) => {
    const app = await Spectrum({
      projectId: config.projectId,
      projectSecret: Redacted.value(config.projectSecret),
      // @ts-expect-error Spectrum 12.2.0 models an absent events property as
      // incompatible with its own AnyPlatformDef under exact optional types.
      providers: [imessage.config()],
      telemetry: false,
      options: { logLevel: "warn" },
    });
    const provider = imessage(app);
    return {
      resolveSpace: async (conversationId) => {
        const space = await provider.space.get(conversationId);
        return {
          sendMessage: (text) => space.send(text),
          setPresence: (action) =>
            action === "start" ? space.startTyping() : space.stopTyping(),
        };
      },
      stop: () => app.stop(),
    };
  },
};

export const provePhotonSdkLifecycle = (config: PhotonConfig) =>
  Effect.acquireUseRelease(
    Effect.tryPromise({
      try: () => liveFactory.acquire(config),
      catch: () =>
        new PhotonLifecycleError({
          operation: "acquire",
          reason: "unavailable",
        }),
    }),
    () => Effect.void,
    (resource) =>
      Effect.tryPromise({
        try: () => resource.stop(),
        catch: () =>
          new PhotonLifecycleError({
            operation: "release",
            reason: "unavailable",
          }),
      })
  );

const releasePhotonResource = (resource: PhotonSdkResource) =>
  Effect.tryPromise({
    try: () => resource.stop(),
    catch: () =>
      new PhotonLifecycleError({
        operation: "release",
        reason: "unavailable",
      }),
  }).pipe(
    Effect.tapError(() =>
      Effect.logError("PhotonLifecycleError", {
        operation: "release",
        reason: "unavailable",
      })
    ),
    Effect.ignore
  );

const withPhotonResource = <A, E>(
  config: PhotonConfig,
  factory: PhotonSdkFactory,
  operation: "sendMessage" | "setPresence",
  use: (resource: PhotonSdkResource) => Effect.Effect<A, E>
) =>
  Effect.acquireUseRelease(
    Effect.tryPromise({
      try: () => factory.acquire(config),
      catch: () =>
        new ChannelUnavailableError({
          provider: "photon",
          operation,
          reason: "transport",
          retry: "backoff",
        }),
    }),
    use,
    releasePhotonResource
  );

export const layerClient = (config: PhotonConfig, factory: PhotonSdkFactory) =>
  Layer.succeed(
    PhotonClient,
    PhotonClient.of({
      sendMessage: Effect.fn("PhotonClient.sendMessage")(
        (conversationId, text) =>
          withPhotonResource(config, factory, "sendMessage", (resource) =>
            Effect.gen(function* sendPhotonMessage() {
              const space = yield* Effect.tryPromise({
                try: () => resource.resolveSpace(conversationId),
                catch: () =>
                  new ChannelUnavailableError({
                    provider: "photon",
                    operation: "sendMessage",
                    reason: "transport",
                    retry: "backoff",
                  }),
              });
              const result = yield* Effect.tryPromise({
                try: () => space.sendMessage(text),
                catch: () =>
                  new ChannelDeliveryUncertainError({
                    provider: "photon",
                    operation: "sendMessage",
                    reason: "uncertain",
                    retry: "readbackRequired",
                  }),
              });
              return yield* Schema.decodeUnknownEffect(PhotonSdkSendResult)(
                result
              ).pipe(
                Effect.mapError(
                  () =>
                    new ChannelProviderRejectedError({
                      provider: "photon",
                      operation: "sendMessage",
                      reason: "invalidPayload",
                      retry: "never",
                    })
                )
              );
            })
          )
      ),
      setPresence: Effect.fn("PhotonClient.setPresence")(
        (conversationId, action) =>
          withPhotonResource(config, factory, "setPresence", (resource) =>
            Effect.gen(function* setPhotonPresence() {
              const space = yield* Effect.tryPromise({
                try: () => resource.resolveSpace(conversationId),
                catch: () =>
                  new ChannelUnavailableError({
                    provider: "photon",
                    operation: "setPresence",
                    reason: "transport",
                    retry: "backoff",
                  }),
              });
              yield* Effect.tryPromise({
                try: () => space.setPresence(action),
                catch: () =>
                  new ChannelUnavailableError({
                    provider: "photon",
                    operation: "setPresence",
                    reason: "transport",
                    retry: "backoff",
                  }),
              });
            })
          )
      ),
    })
  );

export const layerClientLive = (config: PhotonConfig) =>
  layerClient(config, liveFactory);
