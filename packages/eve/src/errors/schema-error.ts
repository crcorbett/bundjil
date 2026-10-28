import { Schema } from "effect";

import {
  WorkspaceSchemaBoundary,
  WorkspaceSchemaErrorMessage,
} from "./contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class WorkspaceSchemaError extends Schema.TaggedError<WorkspaceSchemaError>()(
  "WorkspaceSchemaError",
  {
    boundary: WorkspaceSchemaBoundary,
    message: WorkspaceSchemaErrorMessage,
  }
) {}
