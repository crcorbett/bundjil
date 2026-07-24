import { Schema } from "effect";

import { SyntheticResourceFailureFields } from "./failure-fields.js";

export class SyntheticResourceWriteError extends Schema.TaggedErrorClass<SyntheticResourceWriteError>()(
  "SyntheticResourceWriteError",
  SyntheticResourceFailureFields
) {}
