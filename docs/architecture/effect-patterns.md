# Effect Patterns

Bundjil uses Effect for code that can fail, cross an async boundary, depend on
runtime services, read configuration, or form a durable integration contract.
Plain TypeScript is still fine for simple framework glue and local rendering,
but package and boundary code should stay in the Effect model.

This guide adapts the Effect service rules used in `~/Projects/site` and
`~/Projects/Mobius` to Bundjil's smaller Eve-first repo shape.

## Default Rule

Use Effect-native primitives first when working in packages, tools, app
runtime config, or provider boundaries:

- `Schema` for payloads, config values, tool inputs, tool outputs, and domain
  contracts.
- `Schema.TaggedErrorClass` or `Data.TaggedError` for expected failures.
- `Context.Service` and `Layer` for dependency-injected operations.
- `Config` and `ConfigProvider` for runtime config.
- `Effect.tryPromise` for Promise or SDK calls.
- `Effect.fn` and `Effect.withSpan` for named operations that need readable
  traces.
- `Match`, `Result`, and `Exit` for tagged branching and program outcomes.
- Effect collection modules such as `Array`, `Chunk`, `HashMap`, `HashSet`,
  and `Record` when transforming data in Effect-owned code.

Do not introduce Zod, local DTO mirrors, raw `unknown` readers, or hand-written
success/error unions when an owning Effect Schema or tagged error can express
the contract.

## Service Shape

Use this file layout when a package grows past one or two operations:

```text
src/
  schemas.ts        canonical Effect Schema contracts and derived types
  errors.ts         tagged error unions and public error exports
  service.ts        Context.Service tag and public operation API
  live.layer.ts     production layer and provider wiring
  mock.layer.ts     deterministic layer for tests
  index.ts          stable package contract
```

Bundjil currently keeps the small `@bundjil/eve-effect` service in
`src/services/bundjil-agent-operations.ts`. Split to the layout above when new
operations or providers make the combined file harder to scan.

Root `index.ts` should export stable contracts and default operation helpers.
Implementation layers can be exported from the root while the package is small,
but provider-heavy packages should eventually expose live/mock layers from
explicit subpaths so callers choose the implementation deliberately.

## Effect Control Flow

Primary operations should read as flat `Effect.gen` programs:

```ts
const program = Effect.gen(function* operationName() {
  const input = yield* Schema.decodeUnknownEffect(InputSchema)(unknownInput);
  const service = yield* SomeService;
  return yield* service.run(input);
}).pipe(Effect.withSpan("SomeService.operationName"));
```

Keep the success path visible. Put typed error handling in the `.pipe(...)`
after the main `Effect.gen` with `Effect.catchTag`, `Effect.catchTags`,
`Effect.mapError`, logging, and spans.

Avoid nested `Effect.gen` blocks unless a nested program is genuinely reusable
or scopes a resource. Do not add helpers whose only job is to rename one call,
hide a single property access, wrap one `Effect.map`, or shorten a clear
two-line operation.

## Schemas

Schemas are the integration contract.

- Define the schema in the package that owns the concept.
- Derive TypeScript types from the schema with `typeof SchemaName.Type`.
- Decode untrusted input at the boundary before domain decisions run.
- Encode success payloads before returning from package-owned operations when
  the output crosses a tool, HTTP, persistence, or provider boundary.
- Reuse the owning schema from other packages instead of copying the shape.

For Eve tools, keep Effect Schema as the source of truth and use
`toEveSchema(schema)` from `@bundjil/eve-effect`:

```ts
Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema));
```

This provides both Standard Schema validation and Standard JSON Schema metadata
for Eve `defineTool` boundaries.

## Schema JSON Boundaries

Do not use ad hoc JSON string assembly in committed app or package code.
Boundary JSON must go through Effect Schema so encoded values stay tied to the
canonical contract:

```ts
const encodeRequest = Schema.encodeSync(Schema.fromJsonString(RequestSchema));
const body = encodeRequest(request);
```

For Effect programs, keep encoding in the program and surface typed failures:

```ts
const body =
  yield * Schema.encodeEffect(Schema.fromJsonString(RequestSchema))(request);
```

For unknown values that are only being rendered for safe test assertions or
sanitized diagnostics, use Effect's JSON schema rather than raw serialization:

```ts
const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);
```

Tests, smoke scripts, provider request bodies, SSE chunks, proof output, and
leak checks all follow this rule. If a framework hands you an already encoded
request body string, validate it with the owning schema at the receiving edge
instead of manually decoding it in domain code.

## Implementation Audit

Every implementation task that touches Effect runtime, provider, storage, app
config, or deployment behavior must finish with the mandatory 3-pass Effect TS
audit before acceptance:

1. Ownership and call graph: confirm the right app or package owns the
   behavior, imports point inward through stable exports, and production/test
   call graphs match the SPEC.
2. Implementation quality: inspect the diff for flat primary `Effect.gen`
   programs, schema-derived types, tagged errors, `Config.redacted` for
   secrets, explicit layers, no unsafe casts, no DTO mirrors, no manual object
   readers, and no helper sprawl.
3. Verification coverage: record targeted checks, root verification, proof
   commands, log/leak scans, docs updates, and any deliberately skipped live
   proof with the reason.

The audit evidence belongs in the task ledger and active execution plan for
SPEC-driven work. If a pass finds an unresolved gap, do another pass after the
fix rather than treating the count as sufficient.

## Errors

Expected failures should be typed and tagged:

```ts
export class BundjilAgentOperationError extends Schema.TaggedErrorClass<BundjilAgentOperationError>()(
  "BundjilAgentOperationError",
  {
    operation: BundjilAgentOperationName,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}
```

Rules:

- Preserve useful provider context, but never include secrets, private message
  contents, raw documents, or long unredacted payloads in error fields.
- Translate provider/framework errors at the app boundary. Packages should not
  leak Eve, Sendblue, Cloudflare, Notion, or Vercel-specific exceptions unless
  that package explicitly owns the provider wrapper.
- Prefer `Match` or `Effect.catchTag` for tagged failures instead of
  `instanceof`, raw `_tag` string checks, or broad `catch` blocks.

## Config

Config belongs beside the runtime or package that consumes it.

Current app-owned config lives in:

```text
apps/agent/agent/config.ts
```

Use `Config.schema(...)` or the narrower `Config.nonEmptyString(...)`,
`Config.redacted(...)`, `Config.url(...)`, and related constructors. Parse with
`ConfigProvider.fromEnv()` for process/import-meta environment variables.

Rules:

- Keep server-only secrets out of browser bundles and committed files.
- Use `Config.redacted` for credentials.
- Do not read `process.env` directly in package logic.
- App bootstrap can read app-owned config, but provider packages should decode
  their own required config at their boundary.
- If multiple files need the same package config, expose a config module or
  service instead of duplicating env parsing.

## Layers

Live and mock layers should be explicit:

- `Live` layers wire real dependencies and provider clients.
- `Memory` or `Mock` layers provide deterministic behavior for tests.
- Test helpers should compose layers at the test boundary rather than relying
  on hidden globals.
- Provider SDK clients must be wrapped behind services before domain logic uses
  them.

For app tools, it is acceptable to provide a live layer directly at the tool
edge while the app is small:

```ts
Effect.runPromise(
  getWorkspaceStatus(input).pipe(Effect.provide(BundjilAgentOperationsLive))
);
```

When multiple tools share the same live services, introduce an app runtime or
layer composition module instead of repeating provider wiring in every tool.
