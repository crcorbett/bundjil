import {
  ChannelDeliveryUncertainError,
  ChannelProviderRejectedError,
  ChannelUnavailableError,
} from "@bundjil/channel";
import type {
  ChannelOutboundTextType,
  ChannelParticipantIdType,
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
import { PhotonSdkObservedFailure } from "./sdk-observed-failure.js";
import type {
  PhotonSdkOperation,
  PhotonSdkPhase,
} from "./sdk-observed-failure.js";

export interface PhotonClientShape {
  readonly sendMessage: (
    participantId: ChannelParticipantIdType,
    text: ChannelOutboundTextType
  ) => Effect.Effect<
    PhotonSdkSendResultType,
    | ChannelUnavailableError
    | ChannelDeliveryUncertainError
    | ChannelProviderRejectedError
  >;
  readonly setPresence: (
    participantId: ChannelParticipantIdType,
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
  readonly resolveDirectSpace: (
    participantId: ChannelParticipantIdType
  ) => Promise<PhotonSdkSpace>;
  readonly stop: () => Promise<void>;
}

export interface PhotonSdkFactory {
  readonly acquire: (config: PhotonConfig) => Promise<PhotonSdkResource>;
}

const safeSdkToken = (value: unknown) =>
  typeof value === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/u.test(value)
    ? value
    : "unknown";

const sdkProperty = (value: unknown, key: PropertyKey): unknown => {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const property: unknown = Reflect.get(value, key);
  return property;
};

const makeSdkObservedFailure = (
  operation: PhotonSdkOperation,
  phase: PhotonSdkPhase,
  failure: unknown
) => {
  const nestedCause = sdkProperty(failure, "cause");
  const transportStatus = sdkProperty(nestedCause, "code");
  const retryable = sdkProperty(failure, "retryable");
  return new PhotonSdkObservedFailure({
    operation,
    phase,
    errorName: safeSdkToken(sdkProperty(failure, "name")),
    providerCode: safeSdkToken(sdkProperty(failure, "code")),
    transportStatus:
      typeof transportStatus === "number" &&
      Number.isSafeInteger(transportStatus)
        ? transportStatus
        : "unknown",
    retryable: typeof retryable === "boolean" ? retryable : "unknown",
  });
};

const observeSdkFailure = (failure: PhotonSdkObservedFailure) =>
  Effect.logError("PhotonSdkOperationFailure", {
    provider: "photon",
    operation: failure.operation,
    phase: failure.phase,
    errorName: failure.errorName,
    providerCode: failure.providerCode,
    transportStatus: failure.transportStatus,
    retryable: failure.retryable,
  });

const liveFactory: PhotonSdkFactory = {
  acquire: async (config) => {
    const app = await Spectrum({
      projectId: config.projectId,
      projectSecret: Redacted.value(config.projectSecret),
      // @ts-expect-error Spectrum 12.3.0 models an absent events property as
      // incompatible with its own AnyPlatformDef under exact optional types.
      providers: [imessage.config()],
      telemetry: false,
      options: { logLevel: "warn" },
    });
    const provider = imessage(app);
    return {
      resolveDirectSpace: async (participantId) => {
        const participant = await provider.user(participantId);
        const space = await provider.space.create(participant);
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

const releasePhotonResource = (
  resource: PhotonSdkResource,
  operation: PhotonSdkOperation
) =>
  Effect.tryPromise({
    try: () => resource.stop(),
    catch: (failure) => makeSdkObservedFailure(operation, "release", failure),
  }).pipe(
    Effect.tapError(observeSdkFailure),
    Effect.mapError(
      () =>
        new PhotonLifecycleError({
          operation: "release",
          reason: "unavailable",
        })
    ),
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
  operation: PhotonSdkOperation,
  use: (resource: PhotonSdkResource) => Effect.Effect<A, E>
) =>
  Effect.acquireUseRelease(
    Effect.tryPromise({
      try: () => factory.acquire(config),
      catch: (failure) => makeSdkObservedFailure(operation, "acquire", failure),
    }).pipe(
      Effect.tapError(observeSdkFailure),
      Effect.mapError(
        () =>
          new ChannelUnavailableError({
            provider: "photon",
            operation,
            reason: "transport",
            retry: "backoff",
          })
      )
    ),
    use,
    (resource) => releasePhotonResource(resource, operation)
  );

export const layerClient = (config: PhotonConfig, factory: PhotonSdkFactory) =>
  Layer.succeed(
    PhotonClient,
    PhotonClient.of({
      sendMessage: Effect.fn("PhotonClient.sendMessage")(
        (participantId, text) =>
          withPhotonResource(config, factory, "sendMessage", (resource) =>
            Effect.gen(function* sendPhotonMessage() {
              const space = yield* Effect.tryPromise({
                try: () => resource.resolveDirectSpace(participantId),
                catch: (failure) =>
                  makeSdkObservedFailure(
                    "sendMessage",
                    "resolveDirectSpace",
                    failure
                  ),
              }).pipe(
                Effect.tapError(observeSdkFailure),
                Effect.mapError(
                  () =>
                    new ChannelUnavailableError({
                      provider: "photon",
                      operation: "sendMessage",
                      reason: "transport",
                      retry: "backoff",
                    })
                )
              );
              const result = yield* Effect.tryPromise({
                try: () => space.sendMessage(text),
                catch: (failure) =>
                  makeSdkObservedFailure("sendMessage", "send", failure),
              }).pipe(
                Effect.tapError(observeSdkFailure),
                Effect.mapError(
                  () =>
                    new ChannelDeliveryUncertainError({
                      provider: "photon",
                      operation: "sendMessage",
                      reason: "uncertain",
                      retry: "readbackRequired",
                    })
                )
              );
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
        (participantId, action) =>
          withPhotonResource(config, factory, "setPresence", (resource) =>
            Effect.gen(function* setPhotonPresence() {
              const space = yield* Effect.tryPromise({
                try: () => resource.resolveDirectSpace(participantId),
                catch: (failure) =>
                  makeSdkObservedFailure(
                    "setPresence",
                    "resolveDirectSpace",
                    failure
                  ),
              }).pipe(
                Effect.tapError(observeSdkFailure),
                Effect.mapError(
                  () =>
                    new ChannelUnavailableError({
                      provider: "photon",
                      operation: "setPresence",
                      reason: "transport",
                      retry: "backoff",
                    })
                )
              );
              yield* Effect.tryPromise({
                try: () => space.setPresence(action),
                catch: (failure) =>
                  makeSdkObservedFailure(
                    "setPresence",
                    action === "start" ? "startTyping" : "stopTyping",
                    failure
                  ),
              }).pipe(
                Effect.tapError(observeSdkFailure),
                Effect.mapError(
                  () =>
                    new ChannelUnavailableError({
                      provider: "photon",
                      operation: "setPresence",
                      reason: "transport",
                      retry: "backoff",
                    })
                )
              );
            })
          )
      ),
    })
  );

export const layerClientLive = (config: PhotonConfig) =>
  layerClient(config, liveFactory);
