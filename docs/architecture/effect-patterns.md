---
document_type: architecture-standard
lifecycle: current
authority: canonical
owner: bundjil-effect-owner
last_reviewed: 2026-08-13
review_trigger: Effect, Schema, Config, service, Layer, provider, error, resource, helper, lint, or boundary-control change
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

This guide applies Bundjil's Effect service rules to its smaller Eve-first repo
shape.

## Default Rule

Use Effect-native primitives first when working in packages, tools, app
runtime config, or provider boundaries:

- `Schema` for payloads, config values, tool inputs, tool outputs, and domain
  contracts.
- `Schema.TaggedErrorClass` or `Data.TaggedError` for expected failures.
- `Context.Service` and `Layer` for dependency-injected operations.
- `Config` and `ConfigProvider` for runtime config.
- Object-form `Effect.tryPromise({ try, catch })` for Promise or SDK calls,
  with rejection mapped at the owning boundary.
- `Effect.all`, `Effect.race`, fibers, and other Effect primitives for owned
  concurrency. Raw `Promise.all` and `Promise.race` are forbidden in production
  app/package source even inside a `tryPromise` callback.
- `Clock.currentTimeMillis`, `Effect.sleep`, schedules, and timeouts for
  runtime time so `TestClock` can control Effect-owned tests.
- `Effect.fn` and `Effect.withSpan` for named operations that need readable
  traces.
- `Match`, `Result`, and `Exit` for tagged branching and program outcomes.
- Effect collection modules such as `Chunk`, `HashMap`, and `HashSet` when
  persistent concatenation, Effect equality/hash, typed lookup absence, or
  set algebra materially carries the domain. Ordinary immutable arrays,
  records, and local native collections remain valid when those semantics do
  not apply. A native `Map`, `Set`, `WeakMap`, or `WeakSet` constructor in owned
  app/package source requires an exact occurrence-checked lint exception that
  names its local algorithm, ordered diagnostic, host, or test-backend owner.

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
3. Wrap only the Promise call with object-form
   `Effect.tryPromise({ try, catch })` and map raw failure once to an
   owner-named, safe `Schema.TaggedErrorClass` failure.
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

When one provider service needs credentials selected by an already-decoded
resource identity, expose a named semantic lookup over a Schema-owned tagged
scope and return a closed safe error. Decode the complete credential set once
inside the live operation, store it in Effect `HashMap` when keyed lookup is
the domain operation, and fail on duplicate, unavailable, or unadmitted scope.
Do not expose a raw Config effect as the service, accept primitive project IDs,
or select credentials from their encoded wire representation. Keep broader
inventory credentials and exact-resource automation credentials in distinct
Layers when their authority differs.

Compose dynamic already-decoded redacted config with the owning Schema's
`.makeEffect` constructor so Type-side validation stays in the typed error
channel; reserve `.make` for trusted static construction. Do not call
`Redacted.value` merely to feed the
plaintext into `Schema.decodeEffect` or `Schema.decodeUnknownEffect` and create
another redacted wrapper. `redacted-schema-roundtrip` enforces this while
preserving immediate boundary reveals. When an external representation really
must change, encode the owning redacted Schema at that exact egress before
decoding the target wire/crypto representation; do not reveal and re-wrap it as
an internal shortcut.

Alchemy custom providers follow the same boundary. `Resource` props and
attributes are canonical decoded Schema types; `Provider.succeed` delegates
named `read`/`diff`/`reconcile`/`delete`/`list` operations to injected services
and exposes no provider client. Reconciliation is observe-first and idempotent,
adoption requires an exact reviewed metadata digest, uncertain writes recover
by stable physical identity with bounded readback, and native Alchemy `sync`
remains the drift engine. Provider credentials remain lazy `Context.Service`
Effects backed by `Config.schema` and `Redacted` so Layer construction performs
no credential read.

Report-only drift wraps that native engine rather than remapping provider
state through a parallel service. The adapter decodes the native desired plan
and sync result once, fingerprints physical identities before persistence,
classifies each observation through `Match`, and encodes only its owned report
and bounded receipt at the file boundary. Native fields that do not expose
attempts or duration stay explicitly `NotExposed`; missing observation data is
not invented. The protected environment supplies a static, fingerprinted
read-only policy artifact; it is not misrepresented as one-run identity. Each
execution separately decodes a branded GitHub repository/run/attempt identity,
the checked-out source SHA, and the already-decoded adoption-manifest digest,
then carries all three through the report and receipt. A source-only actor or
an unbound manifest is not accepted as hosted execution evidence.

The Vercel read/import boundary applies this per operation: encode one
owner-qualified request immediately before team/project/query assignment,
decode the complete status/header/body envelope immediately after
`HttpClient`, and map the private provider DTO once to a state-safe observation
or list result. Every collection exhausts pagination. Sensitive environment
observations contain metadata and an explicit sensitivity flag, never the
value. Read/import reconcile re-observes without a provider write and all
delete handlers fail closed.

The Photon read/import boundary applies the same rule while preserving its
provider owner. `@bundjil/photon/management` resolves a redacted, project-scoped
credential Effect only inside an operation; encodes one owner-named request;
decodes one complete status/header/body envelope; exhausts shared-user
pagination; and projects phone, assigned-number, callback-query,
subscription/customer, signing-secret, provider-body, and SDK data out of
state-safe results. A reused bounded exponential retry policy handles only
rate-limited and transient reads. `@bundjil/infrastructure/photon` consumes the
decoded services and exposes retained read/import Resources whose reconcile
re-observes and whose deletes fail closed.

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

Runtime time follows the same ownership rule. Read the current epoch through
`Clock.currentTimeMillis`, then construct `Date` from that explicit value only
at the formatting boundary. Tests of sleeps, retries, schedules, deadlines or
timeouts fork the lazy Effect, use `TestClock.adjust` or `TestClock.setTime`,
then join or inspect the Fiber. Fixed decoded epochs are appropriate for
fixtures that merely need a valid future timestamp. Host `Date.now`, raw
timers and `TestClock.withLive` are reserved for exact registered process or
framework proofs; they are not a shortcut around deterministic test time.

Non-cryptographic runtime identities follow the same rule. Generate them from
fiber-local `Random` and prove reproducibility with `Random.withSeed`; do not
call ambient `Math.random` or `globalThis.crypto.randomUUID`. Keep Web Crypto
entropy only at explicit cryptographic boundaries such as PKCE material and
AES-GCM IVs, where cryptographic security is the observable requirement.

Choose state and collections by their observable semantics. Use one cohesive
immutable Ref value only when fields share an invariant and must transition
atomically. Keep independent Refs for independent observation or lifetime;
use `SynchronizedRef` for serialized or effectful transitions,
`SubscriptionRef` for a real subscriber stream, and `ScopedRef` for a
replaceable resource. Use `Schema.NonEmptyArray` only for an at-least-one
boundary, not as proof of exact cardinality. Atom is not a backend runtime
state primitive.

An Effect traversal callback returns its immutable observation; it does not
mutate outer counters or collections that the caller later relies on. Derive
counts and `HashSet`/`HashMap` domain invariants after the traversal. Local
mutable state remains valid inside one synchronous parser, byte copy,
single-fiber sequential pagination loop, or host-owned callback when it is not
captured across traversal callbacks, concurrent work, or a later finalizer.
`bundjil/no-unregistered-native-collection` makes that review fail closed for
owned app/package source; its exceptions are exact by file, constructor, and
occurrence count, and stale exceptions fail lint.

Control state that is written before one Effect and observed by a later
finalizer is runtime state, even when it is scoped to one operation. Keep
fields that share one compensation invariant in a single immutable `Ref`
value, update eligibility before an outcome-uncertain external write, and read
one snapshot in the finalizer. Do not carry compensation policy across Effects
with closure-mutated booleans or split one rollback snapshot into adjacent
Refs.

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

Compensation for an external state machine must observe the whole Effect
`Exit`, not only the typed error channel. Use an exit-aware finalizer for any
write sequence that must restore state after failure, interruption, or defect;
the finalizer must read back the restored state, preserve the original
unsuccessful exit when restoration succeeds, and surface a safe rollback error
when restoration fails. Deterministic memory-Layer fixtures must cover an
after-write interruption and defect, not only expected provider failures.

## Static Analysis

`bun run check` runs the root Ultracite/Oxlint formatting and type-aware lint
configuration. In app/package TypeScript, the local plugin rejects ambient
time, bare or catchless `Effect.tryPromise`, and runtime execution outside
named edges. It also rejects ambient host time in owned `tooling/**`
TypeScript, including policy receipt generation. In package `src`, agent
service code, and codex-proxy `src`, it confines `async`, `await`, and
`new Promise` to direct Effect Promise ingress callbacks. The stable rule IDs
are
`bundjil/no-ambient-time-in-effect`,
`bundjil/no-async-await-in-effect-service`,
`bundjil/require-try-promise-catch`, and
`bundjil/no-runtime-execution-outside-boundary`. Exact process/framework
exceptions live in the plugin as path, symbol, and occurrence-count records;
removing or adding a matching occurrence fails lint as stale or unexplained.

`bun run knip` enforces dead-code, export, file, and dependency hygiene.
Package/app typechecks and the configured Effect language service are also
required.

`bun run check:boundaries` also rejects raw Promise coordination in owned
production source. A framework callback may return one Promise at its exact
host edge, but parallelism, racing, interruption, and failure composition stay
inside the application-owned Effect runtime.

Do not weaken the root lint config, add broad suppressions, introduce unsafe
casts, or expand ignore patterns to land a change. A narrow suppression needs
an adjacent reason and cannot hide Effect, promise, hook, accessibility, or
Schema failures. Lint does not prove ownership, linear Effect control flow, or
helper quality, so review those risks in proportion to the changed boundary and
retain the evidence that establishes the specific acceptance claim.

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

## Implementation review

Use risk-matched review, not a fixed audit-pass or subagent ritual. For work
that changes Effect runtime, provider, storage, app config, or deployment
behavior, assess the applicable ownership/call graph, implementation quality,
and verification coverage risks. Evidence belongs in the task ledger and active
execution plan for SPEC-driven work. A finding requires a repair and the
smallest check that proves it; a count of passes or reviewers is never
acceptance evidence.

## Errors

Expected failures should be typed and tagged:

```ts
export class WorkspaceSchemaError extends Schema.TaggedErrorClass<WorkspaceSchemaError>()(
  "WorkspaceSchemaError",
  {
    boundary: WorkspaceSchemaBoundary,
    message: Schema.NonEmptyString,
  }
) {}
```

Rules:

- Production service/source Effects must not fail with primitive values. Use
  an owner-named tagged error so callers can match a closed vocabulary and the
  boundary can be Schema encoded. `bundjil/no-primitive-effect-failure`
  rejects direct primitive `Effect.fail`, `Effect.failSync`, and
  `Effect.mapError` constructions in approved production source and
  infrastructure operator scripts. A CLI may collapse its owner-tagged error
  to a stable exit code or bounded receipt reason only in the final renderer;
  the Effect program itself must retain the typed error.
- Fallible live Layers retain their typed construction errors. Provide the
  complete runtime before the final command `Effect.exit` or catch so Config
  and acquisition failures reach the same bounded renderer as foreground
  failures. `bundjil/no-layer-or-die-in-service` rejects `Layer.orDie` in owned
  service/package source and infrastructure scripts. A defect conversion is
  allowed only at an exact host-framework edge whose API requires an
  infallible Layer, with that constraint documented beside the composition.
- An exported `Schema.TaggedErrorClass` declaration name, generic self-type,
  and literal `_tag` must be the same capability-owned error name. The root
  `bundjil/tagged-error-name` rule enforces this mechanical invariant.
- Every exported yieldable typed error must use `Schema.TaggedErrorClass`, not
  `Data.TaggedError`, so its encoded contract can be checked and round-tripped.
  The `public-data-tagged-error` boundary rule owns this invariant. Private
  adapter and operator-only errors may use `Data.TaggedError` when they do not
  cross a public or durable boundary.
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
- Keep arbitrary host and provider causes inside the owning adapter. Exported
  error Schemas must expose only bounded owner-named diagnostics; never add a
  `Schema.Defect` cause field. The `public-raw-cause` boundary rule enforces
  this for every field in an exported structure, including optional or renamed
  causes.
- Owner-named fields remain mandatory when a tagged error reuses a shared field
  object. Do not hide `Schema.String` or `Schema.NonEmptyString` in an aliased
  object passed to `Schema.TaggedErrorClass`; define one bounded Schema named
  for that error family. `inline-string-schema` resolves local and imported
  field-object identifiers as well as inline object literals. Brand identities
  and values used for routing, equality, lookup, or persistence. A bounded
  diagnostic message does not need a nominal brand merely to force `.make` at
  every static constructor.
- Operator scripts must classify failures before retaining them in a tagged
  error. A script-local `Data.TaggedError` may carry a bounded classification,
  operation, status, or digest, but not an arbitrary `unknown` value. The
  `operator-raw-cause` boundary rule enforces this across app and package
  `scripts/` directories. A private adapter may retain an SDK rejection only
  for immediate safe error translation; it must not log, encode, return, or
  place that value in an operator receipt.
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
- The boundary provenance gate rejects direct `process.env`,
  `globalThis.process.env`, `Bun.env`, and `import.meta.env` access throughout
  owned app and package production source. Add no broad host exception: acquire
  semantic values with `Config.schema`, and let an application root provide a
  platform Layer when a live service needs filesystem, process, or network
  capabilities.
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
- Keep `Layer.orDie` out of reusable live Layers. A CLI provides its runtime
  inside its final error/exit boundary; otherwise Layer acquisition can bypass
  the command's typed failure vocabulary and leak a raw runtime Cause.
- A mutating operator or workflow CLI must also capture authority, Config, Layer,
  foreground operation, readback, and receipt encoding in that final
  `Effect.exit` boundary. Do not pass expected failure directly to
  `BunRuntime.runMain`: its default reporter can expose error tags, source
  paths, and stack frames. Schema-encode one bounded success or blocked result
  at the process edge and keep the underlying typed errors private.
- Child processes are scoped platform resources. A live Layer captures the
  installed Effect `ChildProcessSpawner`, models argv and environment overrides
  explicitly, consumes bounded output through `Stream`, and maps platform
  failure once. The Bun/CLI root provides `BunServices.layer`; package logic
  must not own `Bun.spawn`, raw Promise orchestration, or ambient environment
  copying. `check:boundaries` rejects direct Bun process spawning and direct
  ambient environment reads in owned source.

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
