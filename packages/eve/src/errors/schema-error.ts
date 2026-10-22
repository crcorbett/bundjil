import { Schema } from "effect";

import {
  WorkspaceSchemaBoundary,
  WorkspaceSchemaErrorMessage,
} from "./contracts.js";

export class WorkspaceSchemaError extends Schema.TaggedError<WorkspaceSchemaError>()(
  "WorkspaceSchemaError",
  {
    boundary: WorkspaceSchemaBoundary,
    message: WorkspaceSchemaErrorMessage,
  }
) {}
