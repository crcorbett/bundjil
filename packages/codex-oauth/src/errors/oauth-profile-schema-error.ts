import { Schema } from "effect";

import {
  CodexErrorMessage,
  CodexOAuthProfileSchemaBoundary,
} from "./contracts.js";

export class OAuthProfileSchemaError extends Schema.TaggedErrorClass<OAuthProfileSchemaError>()(
  "OAuthProfileSchemaError",
  {
    boundary: CodexOAuthProfileSchemaBoundary,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}
