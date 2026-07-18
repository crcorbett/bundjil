import { Schema } from "effect";

import { WorkspaceSchemaBoundary } from "./contracts.js";

export class WorkspaceSchemaError extends Schema.TaggedErrorClass<WorkspaceSchemaError>()(
  "WorkspaceSchemaError",
  {
    boundary: WorkspaceSchemaBoundary,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}
