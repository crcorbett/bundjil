# @bundjil/eve-effect

Effect Schema contracts and named operation layers for the Bundjil Eve agent.

This package owns the reusable operation boundary that `apps/agent` calls from
Eve tools. Eve filesystem runtime files, channels, model configuration, and
provider secrets stay app-owned.

## Exports And Contracts

- `WorkspaceStatusInput` and `WorkspaceStatusSuccess` are canonical Effect
  Schema contracts with schema-derived TypeScript types for tool edges.
- `WorkspaceStatusFailure` is the tagged error union for the current operation.
- `BundjilAgentOperationError`, `BundjilAgentSchemaError`, and
  `BundjilAgentGatewayConfigError` are schema-backed tagged errors.
- `BundjilAgentOperations` is the named `Context.Service` boundary.
- `getWorkspaceStatus(input)` is the current named operation.
- `BundjilAgentOperationsLive` delegates deterministic workspace status data to
  `@bundjil/core`.
- `BundjilAgentOperationsMemory` provides a mock layer for tests without Eve or
  model access.
- `toEveSchema(schema)` combines Effect's Standard JSON Schema and Standard
  Schema adapters for Eve `defineTool` boundaries.

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

## String Contracts

`@bundjil/core` owns and this package re-exports the exact
`BundjilWorkspaceName` and `BundjilPackageName` brands. `EveSessionId` and
`EveTurnId` remain Eve-boundary brands. Questions, summaries, and assistant
message content are named checked content Schemas, while completed-event and
finish-reason values are named literals. Decode the complete tool or projected
Eve payload once at the edge, encode outward, and use `Match` for material
decoded-union branches. Keep Eve's typed event map framework-owned; do not add
raw discriminant dispatch, helper/common schema modules, unsafe brand
assertions, or production `decodeSync` constructors.

## Tagged Errors

Current tagged errors:

- `BundjilAgentOperationError`: operation-level failures.
- `BundjilAgentSchemaError`: schema decode/encode failures, including the
  `WorkspaceStatusSuccess` encode boundary used by the live layer.
- `BundjilAgentGatewayConfigError`: Gateway configuration failures available to
  the package boundary. The current `workspace_status` operation is
  deterministic and does not read credentials.

`WorkspaceStatusFailure` is the union of those tagged errors.

## Service Layers

`BundjilAgentOperations` is a `Context.Service` with one named method:

```text
getWorkspaceStatus(input)
  -> Effect<WorkspaceStatusSuccess, WorkspaceStatusFailure>
```

The live layer:

```text
BundjilAgentOperationsLive
  -> @bundjil/core makeWorkspaceSummary
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
```

The memory layer:

```text
BundjilAgentOperationsMemory(workspaceStatus)
  -> returns caller-provided WorkspaceStatusSuccess for tests
```

## Eve Schema Bridge

Eve accepts Standard Schema or plain JSON Schema at `defineTool` boundaries.
Bundjil keeps Effect Schema as the source of truth and bridges it with:

```ts
Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema));
```

`toEveSchema(schema)` wraps that composition and returns a value with both:

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
  -> Effect.provide(BundjilAgentOperationsLive)
  -> @bundjil/core makeWorkspaceSummary
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
```

## Test Call Graph

```text
packages/eve-effect/test/bundjil-agent-operations.test.ts
  -> getWorkspaceStatus(...).pipe(Effect.provide(BundjilAgentOperationsLive))
  -> getWorkspaceStatus(...).pipe(Effect.provide(BundjilAgentOperationsMemory(...)))

packages/eve-effect/test/tool-adapter.test.ts
  -> toEveSchema(WorkspaceStatusInput)
  -> toEveSchema(WorkspaceStatusSuccess)
  -> validate Standard Schema behavior
  -> inspect Standard JSON Schema metadata
```

The tests do not require Eve dev server, AI Gateway credentials, or provider
model access.

## Verification

Run from the repo root:

```bash
bun run --filter @bundjil/eve-effect test
bun run --filter @bundjil/eve-effect build
bun run check-types
bun run verification
```

Run the app-level consumer proof with:

```bash
bun run --filter @bundjil/agent test
```
