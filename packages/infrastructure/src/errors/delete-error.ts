import { Schema } from "effect";

import { SyntheticResourceFailureFields } from "./failure-fields.js";

export class SyntheticResourceDeleteError extends Schema.TaggedError<SyntheticResourceDeleteError>()(
  "SyntheticResourceDeleteError",
  SyntheticResourceFailureFields
) {}
