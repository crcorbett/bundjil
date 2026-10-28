import { Schema } from "effect";

import { SyntheticResourceFailureFields } from "./failure-fields.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class SyntheticResourceDeleteError extends Schema.TaggedError<SyntheticResourceDeleteError>()(
  "SyntheticResourceDeleteError",
  SyntheticResourceFailureFields
) {}
