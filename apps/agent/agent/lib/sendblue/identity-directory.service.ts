import { Context, Effect, Layer, Option, Record } from "effect";

import { SendblueConfigService } from "./config.js";
import { SendblueSenderNotAllowedError } from "./errors.js";
import type {
  E164PhoneNumber,
  SendblueSenderIdentity,
  SendblueSenderIdentities,
} from "./schemas.js";

export interface SendblueIdentityDirectoryShape {
  readonly resolve: (
    phoneNumber: E164PhoneNumber
  ) => Effect.Effect<SendblueSenderIdentity, SendblueSenderNotAllowedError>;
}

export class SendblueIdentityDirectory extends Context.Service<
  SendblueIdentityDirectory,
  SendblueIdentityDirectoryShape
>()("@bundjil/agent/SendblueIdentityDirectory") {}

export const makeSendblueIdentityDirectory = (
  senderIdentities: SendblueSenderIdentities
) =>
  SendblueIdentityDirectory.of({
    resolve: Effect.fn("SendblueIdentityDirectory.resolve")(
      function* (phoneNumber) {
        return yield* Option.match(Record.get(senderIdentities, phoneNumber), {
          onNone: () =>
            Effect.fail(
              new SendblueSenderNotAllowedError({
                message: "The Sendblue sender is not allowed.",
              })
            ),
          onSome: (principalId) => Effect.succeed({ phoneNumber, principalId }),
        });
      }
    ),
  });

export const SendblueIdentityDirectoryLive = Layer.effect(
  SendblueIdentityDirectory,
  Effect.gen(function* makeSendblueIdentityDirectoryLive() {
    const config = yield* SendblueConfigService;
    return makeSendblueIdentityDirectory(config.senderIdentities);
  })
);
