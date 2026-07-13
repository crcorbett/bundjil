import { Schema } from "effect";

export class SendblueResponseError extends Schema.TaggedErrorClass<SendblueResponseError>()(
  "SendblueResponseError",
  {
    message: Schema.NonEmptyString,
    operation: Schema.Literal("sendMessage"),
    reason: Schema.Literals([
      "clientRejected",
      "malformedResponse",
      "providerRejected",
      "rateLimited",
      "serverRejected",
      "unauthorized",
    ]),
    status: Schema.Int.check(Schema.isBetween({ maximum: 599, minimum: 100 })),
  }
) {}
