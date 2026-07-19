import { Schema } from "effect";

import {
  WorkspaceSchemaBoundary,
  WorkspaceSchemaErrorMessage,
} from "./contracts.js";

export class WorkspaceSchemaError extends Schema.TaggedErrorClass<WorkspaceSchemaError>()(
  "WorkspaceSchemaError",
  {
    boundary: WorkspaceSchemaBoundary,
    message: WorkspaceSchemaErrorMessage,
    cause: Schema.Defect,
  }
) {}
