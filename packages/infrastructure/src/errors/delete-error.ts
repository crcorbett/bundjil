import { Schema } from "effect";

import { SyntheticResourceFailureFields } from "./failure-fields.js";

export class SyntheticResourceDeleteError extends Schema.TaggedErrorClass<SyntheticResourceDeleteError>()(
  "SyntheticResourceDeleteError",
  SyntheticResourceFailureFields
) {}
