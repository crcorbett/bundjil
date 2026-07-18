import { Schema } from "effect";

import { CodexOAuthProfileSchemaBoundary } from "./contracts.js";

export class OAuthProfileSchemaError extends Schema.TaggedErrorClass<OAuthProfileSchemaError>()(
  "OAuthProfileSchemaError",
  {
    boundary: CodexOAuthProfileSchemaBoundary,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}
