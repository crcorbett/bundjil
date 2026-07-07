import { Schema } from "effect";

import { CodexHttpClientOperation } from "./contracts.js";

export class CodexHttpStatusError extends Schema.TaggedErrorClass<CodexHttpStatusError>()(
  "CodexHttpStatusError",
  {
    operation: CodexHttpClientOperation,
    status: Schema.Number.check(Schema.isFinite()),
    statusText: Schema.String,
    contentType: Schema.String,
    message: Schema.NonEmptyString,
  }
) {}
