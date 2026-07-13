import { Schema } from "effect";

export class SendblueDeliveryUncertainError extends Schema.TaggedErrorClass<SendblueDeliveryUncertainError>()(
  "SendblueDeliveryUncertainError",
  {
    message: Schema.NonEmptyString,
    operation: Schema.Literal("sendMessage"),
    reason: Schema.Literals(["timeout", "transport"]),
  }
) {}
