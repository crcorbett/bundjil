---
document_type: architecture
lifecycle: current
authority: canonical
owner: bundjil-effect-owner
last_reviewed: 2026-07-21
review_trigger: Effect, Schema, Config, service, Layer, error, resource, or boundary pattern change
---

# Effect Patterns

## Codex Provider Boundaries

For the Codex subscription path, canonical schemas, tagged errors, Context
services, explicit Layers, `Config`/`Redacted`, scoped loopback resources,
native `KeyValueStore` composition, refresh locking, and fenced commits remain
package-owned in `@bundjil/codex`; provider-neutral persistence contracts
and adapters belong to `@bundjil/store`. `apps/codex-proxy` owns
only app config and private HTTP composition. Do not recreate profile DTOs,
token mappers, or OAuth routes in either app; Vercel must not host browser OAuth
or account linking.

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

Bundjil currently keeps the small `@bundjil/eve` service in
`src/services/workspace-operations.ts`. Split to the layout above when new
operations or providers make the combined file harder to scan.

Root `index.ts` should export stable contracts and default operation helpers.
Implementation layers can be exported from the root while the package is small,
but provider-heavy packages should eventually expose live/mock layers from
explicit subpaths so callers choose the implementation deliberately.

## Provider And SDK Client Boundaries

A provider wrapper is a named adapter, not a general SDK capability. Its public
service exposes owner-specific operations and only Schema-derived decoded
inputs and outputs. The SDK instance, Promise API, raw failure, provider DTO,
and any unavoidable primitive remain private to `*.live.layer.ts` or the exact
owner adapter. A generic callback operation or exported raw client defeats the
boundary and is forbidden.

For every operation:

1. Accept the canonical domain codec's `typeof Contract.Type`, including
   owner-branded identifiers rather than raw semantic strings.
2. Encode the outbound provider request with `Schema.encodeEffect` or the
   framework-native `HttpClient` Schema body API immediately before the call.
   Keep `typeof Contract.Encoded` inside the adapter.
3. Wrap only the Promise call with `Effect.tryPromise` and map raw failure once
   to an owner-named, safe `Schema.TaggedErrorClass` failure.
4. Decode the complete provider response immediately with
   `Schema.decodeUnknownEffect`; use `Schema.decodeEffect` instead when the SDK
   statically returns the codec's `Encoded` type.
5. Return only the decoded domain result. Never return an unconstrained generic
   or provider-owned response type.

Semantic config uses `Config.schema`; secrets use owner-named redacted Schemas
and are revealed only at immediate SDK construction or header assignment.
Tests use a scoped `ConfigProvider` when proving configuration and a
deterministic mock/memory Layer for service behavior. Every provider service
exports explicit live and mock/memory Layers.

Keep each named operation flat and sequential. Keep its one-use encoding,
decoding, and error mapping visible at the call site. A retry Schedule or other
helper is justified only when reused or when it owns a non-trivial tested
policy. Use `Match` and Effect tagged-error operators for typed branching;
native-class error checks, unsafe casts, public raw causes, duplicated DTOs,
and generic wrapper/helper modules are forbidden.

If a third-party signature unavoidably requires a primitive, register the exact
adapter symbol in `tooling/boundary-exceptions.ts`. Do not widen a public
service contract or add a cast to satisfy it. Follow
`.agents/skills/effect-client-wrapper/SKILL.md` when creating or reviewing the
wrapper.

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

Runtime execution with `Effect.runSync`, `Effect.runPromise`, or
`ManagedRuntime` belongs at executable app, adapter, test, or CLI edges. Domain
services return Effects and depend on service tags. Keep live Layer composition
in `*.layer.ts` or the executable composition root rather than constructing it
inside operations.

## Helper Admission

Helper sprawl is an architecture failure, not merely a style preference. Keep
one-off Effect pipelines and transformations inline. Add a helper, mapper,
wrapper, service, or adapter only when it has at least one defensible reason:

- multiple real call sites;
- ownership of a package/provider/serialization/resource/security boundary;
- isolation of a non-trivial policy or algorithm that becomes directly
  testable;
- conformance with an established repo abstraction at the same ownership
  level.

Do not add one-line wrappers, property-reader helpers, single-use aliases,
local DTO converters, pass-through services, or generic `utils`, `helpers`,
`common`, and `shared` modules. Do not abstract for possible future reuse. The
implementation audit must inspect new abstractions and inline those without a
clear owner and concrete value.

## Persistence

Use Effect's native `effect/unstable/persistence/KeyValueStore` for ordinary
string and binary persistence. Treat its unstable import path as a contract
tested by `@bundjil/store`; `KeyValueStore.modify` is not an
atomic coordination operation. Claims, leases, fencing, compare-and-remove,
and multi-key transitions use the canonical
`AtomicKeyValueStore.transact` service instead.

The root persistence contract is provider-neutral. Consumers opt into
`@bundjil/store/memory` for deterministic tests or
`@bundjil/store/upstash` for hosted storage. The `/upstash`
subpath alone owns the SDK, prefix application, command syntax, response
decoding, and safe provider errors. Composition owners decode bindings through
Effect `Config`/`Config.redacted`: `@bundjil/codex` owns Codex
profile/Upstash composition, `apps/codex-proxy` owns runtime mode/private HTTP
config, and `apps/agent` owns replay/provider config. The shared persistence
adapter receives schema-decoded redacted options and never reads process
environment values.

Logical key derivation belongs to the domain owner, while the adapter owns its
prefix. Compatibility changes must prove the final physical key, canonical
encoded value, and TTL before rollout. Persistence values are encrypted
profiles or minimal opaque replay records, never conversation history, session
streams, or Workflow state. Logs and proof output contain only safe metadata;
rollback restores the retained deployment or provider binding and never uses
namespace clearing as a coordination or recovery mechanism.

## Static Analysis

`bun run check` runs the root Ultracite/Oxlint formatting and type-aware lint
configuration. `bun run knip` enforces dead-code, export, file, and dependency
hygiene. Package/app typechecks and the configured Effect language service are
also required.

Do not weaken the root lint config, add broad suppressions, introduce unsafe
casts, or expand ignore patterns to land a change. A narrow suppression needs
an adjacent reason and cannot hide Effect, promise, hook, accessibility, or
Schema failures. Lint does not prove ownership, linear Effect control flow, or
helper quality, so the manual 3-pass audit remains mandatory.

## Schemas

Schemas are the integration contract.

- Define the schema in the package that owns the concept.
- Derive TypeScript types from the schema with `typeof SchemaName.Type`.
- Decode untrusted input at the boundary before domain decisions run.
- Encode success payloads before returning from package-owned operations when
  the output crosses a tool, HTTP, persistence, or provider boundary.
- Reuse the owning schema from other packages instead of copying the shape.

For Eve tools, keep Effect Schema as the source of truth and use
`toEveSchema(schema)` from `@bundjil/eve/schema`:

```ts
Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema));
```

This provides both Standard Schema validation and Standard JSON Schema metadata
for Eve `defineTool` boundaries.

### String Contracts

Do not treat every string-shaped value as the same TypeScript `string`, and do
not mechanically brand every string. Every exported, configured, persisted, or
provider-facing string field must reference a canonical owner-named Schema and
use the category that matches its semantics:

- **Open semantic values** such as IDs, keys, opaque handles, model names, and
  event coordinates use a checked string Schema plus `Schema.brand`.
- **Closed vocabularies** such as event kinds, statuses, modes, roles, and
  operations use a named `Schema.Literal` or `Schema.Literals` contract. Use
  `Match` over the decoded discriminant for material control flow.
- **Secrets** use owner-named `Schema.Redacted` or
  `Schema.RedactedFromValue` contracts. Do not reveal a secret merely to add a
  brand.
- **Content** such as prompts, messages, instructions, descriptions, and tool
  output uses an owner-named checked text Schema. Brand content only when two
  independently valid content domains cross the same call boundary and mixing
  them would be a real defect.
- **Transport primitives** such as headers, serialized JSON, SSE lines,
  provider payload fragments, and filesystem paths use named boundary Schemas
  when exported. Parser-local strings may remain `string` inside the one
  operation that decoded their enclosing boundary.
- **Diagnostics** such as safe tagged-error messages remain checked strings.
  They are not identifiers and must not require unsafe brand construction.

Decode the complete canonical request, event, config, or persisted record once
at the incoming boundary and encode it at the outgoing boundary. Do not add
`decodeSync` constructors, assertions, DTO mirrors, or generic brand/schema
helpers merely to satisfy nominal types. A consumer imports the owner's Schema
instead of redefining `id: string`, `type: string`, `status: string`, or an
equivalent field.

Do not create `common`, `utils`, or helper modules that collect unrelated
Schemas or manufacture brands. A named Schema belongs with the owner of the
concept; a parser-local transport fragment stays local to the one operation
that decoded its enclosing boundary. Production Effect programs use
`Schema.decodeUnknownEffect` or `Schema.decodeEffect`, not `decodeSync`.
When a decoded literal or tagged union already exists, use `Match` for
material branching rather than raw equality or discriminant checks. This does
not replace framework-owned typed event maps with a manual dispatcher.

Framework-owned event-map keys remain framework dispatch. For example,
`"message.completed"` is a literal event discriminant, not a branded string;
its projected payload and any persisted coordinates are decoded through the
owning Bundjil Schema before domain decisions run.

## Schema JSON Boundaries

Do not use ad hoc JSON string assembly in committed app or package code.
Boundary JSON must go through Effect Schema so encoded values stay tied to the
canonical contract:

```ts
const body =
  yield * Schema.encodeEffect(Schema.fromJsonString(RequestSchema))(request);
```

For unknown values rendered by an Effectful test, smoke script, or sanitized
diagnostic, use Effect's JSON schema rather than raw serialization:

```ts
const body = yield * Schema.encodeEffect(Schema.UnknownFromJsonString)(value);
```

Tests, smoke scripts, provider request bodies, SSE chunks, proof output, and
leak checks all follow this rule. If a framework hands you an already encoded
request body string, validate it with the owning schema at the receiving edge
instead of manually decoding it in domain code.

Synchronous Schema codec calls are prohibited in production code, operator
scripts, and canonical examples. The sole exception is test-only fixture
construction that deliberately supplies invalid source to prove the boundary
audit; keep that source inside the test fixture and never use it as a boundary
implementation pattern.

## Boundary Provenance Audit

`bun run check:boundaries` is the root TypeScript compiler-API audit for
handwritten app/package production source and operator scripts. It checks
exported boundary signatures and named adapters for raw primitives, primitive
semantic config, synchronous codecs, direct JSON, raw fetch/response readers,
and unsafe boundary assertions. Diagnostics name the file, line, rule, symbol,
and codec-based remediation.

Third-party or framework constraints belong only in
`tooling/boundary-exceptions.ts`. Every entry names one exact file and symbol,
its owner, boundary kind, canonical codec/service, admitted syntax, and reason.
The audit fails stale entries, so a change must remove an entry when its exact
external/framework constraint no longer exists rather than leave an obsolete
baseline behind. Do not add counts, line-number allowlists, globs, or directory
exemptions. `bun run test:boundaries` owns positive and negative source fixtures
for the audit.

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
export class WorkspaceSchemaError extends Schema.TaggedErrorClass<WorkspaceSchemaError>()(
  "WorkspaceSchemaError",
  {
    boundary: WorkspaceSchemaBoundary,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}
```

Rules:

- An exported `Schema.TaggedErrorClass` declaration name, generic self-type,
  and literal `_tag` must be the same capability-owned error name. The root
  `bundjil/tagged-error-name` rule enforces this mechanical invariant.
- Rename an exported tagged error as one atomic encoded-contract migration:
  update the declaration, self-type, literal tag, constructors, failure
  unions, `catchTag`/`catchTags` consumers, guards, Schema encode/decode tests,
  public-boundary mappings, and current documentation together. Stop and make
  an explicit compatibility decision before changing the tag when a persisted
  value, public payload, independently deployed consumer, or external decoder
  may observe it; do not add an alias or dual decoder without that plan.
- Do not export speculative errors. A public tagged error needs a real
  constructor or consumer in the owning capability; otherwise remove it until
  a concrete failure boundary exists.
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

Use `Config.schema(OwnerSchema, "ENV_NAME")` for semantic values, including
owner-named redacted secret Schemas. Primitive Config constructors are limited
to an exact adapter-private exception with a registered reason. Parse with
`ConfigProvider.fromEnv()` for process/import-meta environment variables.

Rules:

- Keep server-only secrets out of browser bundles and committed files.
- Use owner-named redacted Schemas for credentials.
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
  getWorkspaceStatus(input).pipe(Effect.provide(WorkspaceOperationsLive))
);
```

When multiple tools share the same live services, introduce an app runtime or
layer composition module instead of repeating provider wiring in every tool.

React and route composition follow
[`frontend-composition.md`](./frontend-composition.md). Keep Effect runtimes,
Layers, Config, secrets, and provider clients outside render functions and
browser bundles; expose Schema-owned serializable contracts at the server
boundary.
