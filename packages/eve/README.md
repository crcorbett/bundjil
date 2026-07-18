# @bundjil/eve

Eve-facing Effect Schema contracts and workspace-status operations for the
Bundjil agent.

This package owns the reusable operation boundary that `apps/agent` calls from
Eve tools. Eve filesystem runtime files, channels, model configuration, and
provider secrets stay app-owned.

## Exports And Contracts

- `WorkspaceStatusInput` and `WorkspaceStatusSuccess` are canonical Effect
  Schema contracts with schema-derived TypeScript types for tool edges.
- `WorkspaceSchemaError` is the schema-backed failure for output encoding.
- `WorkspaceOperations` is the named `Context.Service` boundary.
- `getWorkspaceStatus(input)` is the current named operation.
- `WorkspaceSummary`, `defaultWorkspacePackages`, and `makeWorkspaceSummary`
  own the deterministic workspace-status data in this feature.
- `WorkspaceOperationsLive` encodes that deterministic workspace status.
- `WorkspaceOperationsMemory` provides a mock layer for tests without Eve or
  model access.
- `@bundjil/eve/schema` exports `toEveSchema(schema)`, which combines Effect's
  Standard JSON Schema and Standard Schema adapters for Eve `defineTool`
  boundaries.

Current schemas:

```text
WorkspaceStatusInput
  question: NonEmptyString

WorkspaceStatusSuccess
  workspaceName: NonEmptyString
  packageNames: Array<NonEmptyString>
  agentSummary: NonEmptyString
```

The package exports schema-derived TypeScript types. Consumers should import
the schema or type from this package instead of defining DTO mirrors.

## Tagged Errors

`WorkspaceSchemaError` is the only workspace-status failure. Its `boundary`
schema retains the four input, success, tool-input, and tool-success literals.
The package does not export speculative operation or Gateway failures.

## Service Layers

`WorkspaceOperations` is a `Context.Service` with one named method:

```text
getWorkspaceStatus(input)
  -> Effect<WorkspaceStatusSuccess, WorkspaceSchemaError>
```

The live layer:

```text
WorkspaceOperationsLive
  -> makeWorkspaceSummary
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
```

The memory layer:

```text
WorkspaceOperationsMemory(workspaceStatus)
  -> returns caller-provided WorkspaceStatusSuccess for tests
```

## Eve Schema Bridge

Eve accepts Standard Schema or plain JSON Schema at `defineTool` boundaries.
Bundjil keeps Effect Schema as the source of truth and bridges it with:

```ts
Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema));
```

`@bundjil/eve/schema` exposes `toEveSchema(schema)` and returns a value with
both:

- `~standard.validate` for Standard Schema validation.
- `~standard.jsonSchema.input/output` for Standard JSON Schema metadata.

Do not add Zod mirrors for schemas owned by this package unless Eve requires a
new concrete edge contract that Effect Schema cannot provide.

## Production Call Graph

```text
apps/agent/agent/tools/workspace_status.ts
  -> toEveSchema(WorkspaceStatusInput)
  -> toEveSchema(WorkspaceStatusSuccess)
  -> getWorkspaceStatus(input)
  -> Effect.provide(WorkspaceOperationsLive)
  -> makeWorkspaceSummary
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
```

## Test Call Graph

```text
packages/eve/test/workspace-operations.test.ts
  -> getWorkspaceStatus(...).pipe(Effect.provide(WorkspaceOperationsLive))
  -> getWorkspaceStatus(...).pipe(Effect.provide(WorkspaceOperationsMemory(...)))

packages/eve/test/schema.test.ts
  -> toEveSchema(WorkspaceStatusInput)
  -> toEveSchema(WorkspaceStatusSuccess)
  -> validate Standard Schema behavior
  -> inspect Standard JSON Schema metadata

packages/eve/test/error-contracts.test.ts
  -> encode and decode WorkspaceSchemaError
  -> reject the historical tag
```

The tests do not require Eve dev server, AI Gateway credentials, or provider
model access.

## Verification

Run from the repo root:

```bash
bun run --filter @bundjil/eve test
bun run --filter @bundjil/eve build
bun run check-types
bun run verification
```

Run the app-level consumer proof with:

```bash
bun run --filter @bundjil/agent test
```
