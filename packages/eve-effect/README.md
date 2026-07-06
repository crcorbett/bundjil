# @bundjil/eve-effect

Effect Schema contracts and named operation layers for the Bundjil Eve agent.

This package owns the reusable operation boundary that `apps/agent` will call
from Eve tools. Eve filesystem runtime files, channels, model configuration,
and provider secrets stay app-owned.

## Exports

- `WorkspaceStatusInput` and `WorkspaceStatusSuccess` are canonical Effect
  Schema contracts with schema-derived TypeScript types for tool edges.
- `BundjilAgentOperationError`, `BundjilAgentSchemaError`, and
  `BundjilAgentGatewayConfigError` are schema-backed tagged errors.
- `BundjilAgentOperationsLive` delegates deterministic workspace status data to
  `@bundjil/core`.
- `BundjilAgentOperationsMemory` provides a mock layer for tests without Eve or
  model access.
- `toEveSchema(schema)` combines Effect's Standard JSON Schema and Standard
  Schema adapters for Eve `defineTool` boundaries.
