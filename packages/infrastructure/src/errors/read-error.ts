import { Schema } from "effect";

import { SyntheticResourceFailureFields } from "./failure-fields.js";

export class SyntheticResourceReadError extends Schema.TaggedError<SyntheticResourceReadError>()(
  "SyntheticResourceReadError",
  SyntheticResourceFailureFields
) {}
