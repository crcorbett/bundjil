import { Schema } from "effect";

export class SendblueReplayStoreError extends Schema.TaggedErrorClass<SendblueReplayStoreError>()(
  "SendblueReplayStoreError",
  { message: Schema.NonEmptyString }
) {}
