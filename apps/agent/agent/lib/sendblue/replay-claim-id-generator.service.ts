import { Context, Effect, Layer, Schema } from "effect";

import { SendblueReplayStoreError } from "./errors.js";
import { SendblueReplayClaimId } from "./schemas.js";
import type { SendblueReplayClaimId as SendblueReplayClaimIdType } from "./schemas.js";

export interface SendblueReplayClaimIdGeneratorShape {
  readonly next: Effect.Effect<
    SendblueReplayClaimIdType,
    SendblueReplayStoreError
  >;
}

export class SendblueReplayClaimIdGenerator extends Context.Service<
  SendblueReplayClaimIdGenerator,
  SendblueReplayClaimIdGeneratorShape
>()("@bundjil/agent/SendblueReplayClaimIdGenerator") {}

export const SendblueReplayClaimIdGeneratorLive = Layer.succeed(
  SendblueReplayClaimIdGenerator,
  SendblueReplayClaimIdGenerator.of({
    next: Effect.try({
      try: () => globalThis.crypto.randomUUID(),
      catch: () =>
        new SendblueReplayStoreError({
          message: "Unable to create the Sendblue replay claim.",
        }),
    }).pipe(
      Effect.flatMap(Schema.decodeEffect(SendblueReplayClaimId)),
      Effect.mapError(
        () =>
          new SendblueReplayStoreError({
            message: "Unable to create the Sendblue replay claim.",
          })
      )
    ),
  })
);
