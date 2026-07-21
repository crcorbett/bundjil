import type { ChannelParticipantIdType } from "@bundjil/channel";
import { Array, Context, Effect, Layer, Option } from "effect";

import { ChannelIdentityError } from "./errors.js";
import type { ChannelIdentityRecords, ChannelPrincipalId } from "./schemas.js";

export interface ChannelIdentityShape {
  readonly resolve: (
    participantId: ChannelParticipantIdType
  ) => Effect.Effect<ChannelPrincipalId, ChannelIdentityError>;
}

export class ChannelIdentity extends Context.Service<
  ChannelIdentity,
  ChannelIdentityShape
>()("@bundjil/agent/ChannelIdentity") {}

const makeLayer = (records: ChannelIdentityRecords) =>
  Layer.succeed(
    ChannelIdentity,
    ChannelIdentity.of({
      resolve: Effect.fn("ChannelIdentity.resolve")(function* (participantId) {
        return yield* Option.match(
          Array.findFirst(
            records,
            (record) => record.participantId === participantId
          ),
          {
            onNone: () =>
              Effect.fail(new ChannelIdentityError({ reason: "notAllowed" })),
            onSome: (record) => Effect.succeed(record.principalId),
          }
        );
      }),
    })
  );

export const layerMemory = (records: ChannelIdentityRecords) =>
  makeLayer(records);

export const layerLive = (records: ChannelIdentityRecords) =>
  makeLayer(records);
