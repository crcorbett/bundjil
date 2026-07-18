# Effect Persistence

> Historical specification. The accepted implementation was subsequently
> renamed to `@bundjil/store` by
> [Repository Naming And Structure Cleanup](./repo-naming-cleanup.md). Names and
> evidence below are preserved as originally accepted.

- Status: Implemented
- Proposed owner: `@bundjil/effect-persistence`
- Consumers: `@bundjil/codex-oauth`, `apps/agent`
- Last reviewed: 2026-07-17

## Decision

Create a small provider- and channel-agnostic workspace package named
`@bundjil/effect-persistence`. The package will provide:

1. an Upstash Redis adapter for Effect v4's native
   `effect/unstable/persistence/KeyValueStore` service;
2. a supplemental `AtomicKeyValueStore` Effect service for atomic
   condition-and-mutation transactions that the native service cannot express;
3. one deterministic memory Layer plus mocked-provider adapter tests that
   implement and prove the same semantics; and
4. explicit provider subpaths so importing the package contract does not
   construct or transitively select Upstash.

The shared package must not become a generic replay, OAuth, messaging, lock, or
workflow framework. Domain services continue to own their policies:

- `CodexOAuthRefreshLock` owns Codex lock identity and acquisition policy.
- `CodexOAuthProfileCommit` owns encrypted profile revisions and fencing.
- `SendblueReplayStore` owns Sendblue message handles, Eve event coordinates,
  and complete/retryable/uncertain delivery decisions.

Those services will express their atomic persistence requirements through the
generic `AtomicKeyValueStore` contract. Provider SDK calls, Redis command
syntax, Lua, key-prefix application, provider response decoding, and generic
storage failures move out of those consumers.

## Problem

Bundjil currently has two separate Upstash implementations:

- `packages/codex-oauth/src/upstash-key-value-store.layer.ts` adapts Upstash to
  Effect `KeyValueStore`, but also owns Codex-specific refresh-lock and
  multi-key profile-commit Lua.
- `apps/agent/agent/lib/sendblue/replay-store.service.ts` imports
  `@upstash/redis` directly and implements atomic replay claims inside an
  app-owned domain service.

Both implementations are Effect-wrapped, but provider ownership is duplicated
and only the Codex path exposes the native Effect `KeyValueStore` contract. The
duplication also encourages future integrations to add another SDK wrapper or
to misuse `KeyValueStore.modify` for coordination.

Effect v4's default `KeyValueStore.modify` is implemented as `get` followed by
`set`. It is not a portable atomic compare-and-set operation. The native
contract also has no create-if-absent, per-write TTL, multi-key precondition, or
compare-and-remove operation. Replacing the current Redis operations with plain
`KeyValueStore` calls would introduce races; retaining provider-specific calls
inside every consumer would preserve correctness but not ownership.

The improvement therefore needs both layers:

```text
Effect KeyValueStore
  ordinary schema-backed persistence

AtomicKeyValueStore
  atomic conditions + mutations + TTL
```

## Authorities

Implementation and review must use these sources in priority order:

1. `.local/references/effect-v4/packages/effect/src/unstable/persistence/KeyValueStore.ts`
   for the installed Effect v4 service, constructors, schema store, and
   non-atomic default `modify` behavior;
2. `docs/architecture/effect-patterns.md` for Schema, service, Layer, Config,
   linear Effect, JSON, helper-admission, and three-pass audit rules;
3. `docs/architecture/repo-structure.md` for package ownership and explicit
   provider subpaths;
4. `docs/architecture/testing-and-quality.md` for focused and root
   verification;
5. the existing Codex Upstash, refresh-lock, profile-commit, and Sendblue
   replay tests as behavioral compatibility authority; and
6. official provider documentation for Redis command behavior and deployment
   configuration. Provider docs do not override the Effect-facing contract.

The installed Effect import path is unstable. The package must keep that import
centralized and pin its behavior with contract tests so a future Effect upgrade
fails visibly instead of changing persistence semantics silently.

## Goals

- Make Effect `KeyValueStore` the ordinary string/binary persistence contract
  for every Upstash-backed Bundjil consumer.
- Add one narrow Effect-native atomic transaction service for coordination and
  fenced mutation.
- Keep the shared contract independent of Sendblue, Codex, Eve, Vercel,
  messaging, OAuth, and workflow terminology.
- Make `@upstash/redis` a dependency of only the provider adapter package.
- Preserve all current physical Redis keys, encoded values, namespace
  isolation, TTLs, leases, owner fencing, and conflict outcomes.
- Reuse one configured Upstash client when a composition needs both native
  `KeyValueStore` and `AtomicKeyValueStore`.
- Give tests a shared in-memory backing state so ordinary reads and atomic
  transactions observe one coherent store.
- Keep consumer operations flat, named Effects with domain errors translated
  at the consumer boundary.
- Remove duplicate Redis client interfaces, Lua, scans, response decoders, and
  provider error wrappers from consumers where the generic contract can own
  them.
- Document when native `KeyValueStore` is sufficient and when the atomic
  service is mandatory.

## Non-goals

- Do not replace Eve or Vercel Workflow persistence.
- Do not move conversation history, Sendblue provider records, OAuth profiles,
  or domain schemas into the new package.
- Do not promise distributed exactly-once delivery. The atomic store provides
  durable idempotency/fencing primitives, not a cross-provider transaction.
- Do not expose raw Redis `eval`, command strings, pipelines, clients, or Lua
  through the public package API.
- Do not create `ReplayStore`, `MessageStore`, `OAuthStore`, `LockManager`,
  `Repository`, `StorageUtils`, or generic workflow abstractions in the shared
  package.
- Do not move app-owned environment-variable names into the shared package.
- Do not migrate the trusted-local filesystem profile adapter; it already uses
  Effect's native filesystem `KeyValueStore` and has no second provider caller.
- Do not change Sendblue routing, webhook registration, sender policy, model
  selection, Executor scope, Codex OAuth protocol, or Vercel project bindings.
- Do not add a dashboard, route, React component, or visible operator UI.

## Governing Effect Rules

Use Effect TS native approaches first. Prefer Data, Schema, Array, Chunk,
HashSet, HashMap, Match, Context, Layer, Config, Service, Record, Result, Exit,
Bun/Platform Command, and ManagedRuntime over plain TypeScript helpers when the
code is fallible, async, runtime-owned, collection-heavy, or crosses a package,
RPC, SSR, command, config, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as `id: string`, `slug: string`, status, or metadata
outside their canonical schema/type owner.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, `instanceof` checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema, Match, Result, Exit, or
owning service contract should carry the behavior.

Primary operations must be named `Effect.fn` or flat `Effect.gen` programs.
Expected errors are translated once in the outer `.pipe(...)` with
`catchTag`, `catchTags`, or `mapError`. Runtime execution and Layer construction
stay at package constructors, app composition roots, scripts, and tests.
Nested `Effect.gen` blocks are forbidden unless the nested program owns a real
scope or has multiple call sites. Domain operations request service tags and
return composable Effects; they do not provide their own Layers. Tagged
branching uses `Match`, `Result`, `Exit`, `Option`, or the owning Schema union
rather than `switch`, raw `_tag` checks, boolean flag matrices, or exceptions as
ordinary control flow.

## Required Implementation Shape

The implementation must follow the repo's existing Effect v4 service shape.
The following is the required structural pattern, not a second contract to
copy into consumers:

```ts
export const AtomicKeyValueStoreCondition = Schema.Union([
  Schema.TaggedStruct("Absent", {
    key: AtomicKeyValueStoreKey,
  }),
  Schema.TaggedStruct("Equals", {
    key: AtomicKeyValueStoreKey,
    value: AtomicKeyValueStoreValue,
  }),
]);

export const AtomicKeyValueStoreOutcome = Schema.Literals([
  "applied",
  "conflict",
]);

export interface AtomicKeyValueStoreShape {
  readonly transact: (
    transaction: typeof AtomicKeyValueStoreTransaction.Type
  ) => Effect.Effect<
    typeof AtomicKeyValueStoreOutcome.Type,
    AtomicKeyValueStoreError
  >;
}

export class AtomicKeyValueStore extends Context.Service<
  AtomicKeyValueStore,
  AtomicKeyValueStoreShape
>()("@bundjil/effect-persistence/AtomicKeyValueStore") {}
```

The tagged error owns its safe operation/message contract:

```ts
export class AtomicKeyValueStoreError extends Schema.TaggedErrorClass<AtomicKeyValueStoreError>()(
  "AtomicKeyValueStoreError",
  {
    operation: AtomicKeyValueStoreOperation,
    message: Schema.NonEmptyString,
  }
) {}
```

Provider operations keep one visible success path. Schema encoding, provider
I/O, response decoding, error translation, and the span belong to one linear
program:

```ts
const transact = (transaction: AtomicKeyValueStoreTransactionType) =>
  Effect.gen(function* transactAtomicKeyValueStore() {
    const payload = yield* Schema.encodeEffect(
      Schema.fromJsonString(AtomicKeyValueStoreTransaction)
    )(transaction);
    const response = yield* Effect.tryPromise({
      try: () => client.eval(atomicTransactionScript, [], [payload]),
      catch: (cause) => new UpstashPersistenceProviderError({ cause }),
    });
    return yield* Schema.decodeUnknownEffect(UpstashTransactionResponse)(
      response
    );
  }).pipe(
    Effect.mapError(
      () =>
        new AtomicKeyValueStoreError({
          operation: "transact",
          message: "Unable to apply the atomic key-value transaction.",
        })
    ),
    Effect.withSpan("AtomicKeyValueStore.transact")
  );
```

The final code may use positional arguments rather than a Schema JSON payload,
but it must retain this linear shape. Provider `unknown` is decoded exactly
once. Do not split the operation into `encodeTransaction`, `runTransaction`,
`decodeTransaction`, or `mapTransactionError` helpers used by one call site.

This get-then-set pattern is explicitly forbidden for coordination:

```ts
const current = yield * keyValueStore.get(key);
if (current === undefined) {
  yield * keyValueStore.set(key, value);
}
```

`KeyValueStore.modify` is also forbidden for coordination because its default
implementation has the same non-atomic read/write shape. Claims, locks, and
fences must make one `AtomicKeyValueStore.transact` call.

Layer composition must construct one backing state/client and feed both
services from it. Use one `Layer.effectContext` that constructs both services,
or one private backing-client/state service provided once to both public
service Layers. A `Layer.merge` of two constructors that each allocate their
own client or state is invalid even if the public types compile. The accepted
public Layer names are:

```text
PersistenceMemory
UpstashPersistenceLive(options)
```

Do not create one Upstash client per service, build Layers inside operations,
or hide `Effect.runPromise` in package code. `Redacted.value` is permitted only
at the final provider-client constructor boundary. Tests must prove that one
Layer build allocates exactly one client/state and that native and atomic
operations see each other's writes.

## Static Analysis And Helper Admission

The root `oxlint.config.ts`, `oxfmt.config.ts`, `tsconfig.base.json`, and
`knip.json` are the authorities. The new package inherits the root strict
TypeScript and Effect language-service configuration. It must not add a local
lint config, local formatter config, broad ignore, or weakened compiler option.

Every code task must run `bun run fix` before its final `bun run check`, then
run Knip, focused typechecks/tests/builds, and `bun run verification`. The
implementation must not add `eslint-disable`, `oxlint-disable`, `@ts-ignore`,
`@ts-nocheck`, unexplained `@ts-expect-error`, `as any`, double assertions,
non-null assertions that bypass boundary validation, or catch-all lint
exclusions. A genuinely necessary narrow suppression requires an adjacent
reason and another audit pass; suppressions around Effect, promises, Schema,
security, or provider I/O are not acceptable.

The root lint configuration intentionally does not make every Promise rule an
error, so the manual audit must enforce the stronger package invariant: every
provider Promise is returned from `Effect.tryPromise`, no Promise is floated or
discarded, no domain operation is `async`, and no `new Promise` coordination
primitive bypasses Effect. `waitUntil`, `ManagedRuntime.runPromise`, and other
Promise execution remain at existing framework/executable edges only. Provider,
Schema, and persistence failures must not be hidden with `Effect.orDie`,
`Effect.ignore`, an untyped `catchAll`, or a fallback success value.

Helper admission is reviewed per symbol, not per file. A non-test helper,
factory, mapper, adapter, service, Schema alias, or wrapper is admitted only
when it has multiple real call sites, owns a provider/serialization/atomicity/
security boundary, or isolates a material algorithm with direct tests. The
following are forbidden:

- generic `utils`, `helpers`, `common`, `repository`, or `manager` modules;
- one-line property readers, aliases, and pass-through services;
- a wrapper around one `Effect.map`, `Effect.flatMap`, Schema encode/decode, or
  provider call;
- generic factories that only rename `Context.Service`, `Layer.effect`, or
  `Effect.fn`;
- local DTO converters between structurally identical owning Schemas; and
- convenience methods for hypothetical future stores or providers.

Each implementation-quality audit must enumerate new non-test abstractions and
record their owner/admission reason or inline/remove them before acceptance.

## Frontend Exclusion And Future Admission

This SPEC changes no React, TSX, TanStack route, browser bundle, visible text,
typography, URL state, or operator interface. Persistence status and proof stay
in tests, CLI output, logs, and deployment evidence. No component, hook,
frontend state store, route-local dashboard, or client-side persistence wrapper
may be added under this task ledger.

If implementation discovers a real need for visible persistence management,
stop and amend through a separate frontend SPEC governed by
`docs/architecture/frontend-composition.md`. That SPEC must require:

```text
primitive -> composite -> layout -> route
```

- leaf components owning their exact query/mutation, command, loading, empty,
  error, retry, skeleton, and fallback states;
- no prop-drilling of query results, ids, loading flags, commands, or derived
  options through unrelated ancestors;
- no nested feature wrappers that merely shorten route JSX, generic hooks that
  hide business workflows, or boolean-prop matrices;
- Schema-owned serializable server contracts with Effect services, Layers,
  Config, secrets, Upstash clients, and `Effect.runPromise` excluded from render
  functions and browser bundles;
- canonical app typography roles and accessible focus/keyboard semantics; and
- Browser screenshots at desktop and mobile widths for loading, empty, error,
  success, long-content, overflow, and responsive states, plus direct HTTP
  evidence for machine-readable routes.

Any TSX, route, component, hook, visible text, or browser dependency in the
implementation diff is therefore a stop condition until that separate SPEC is
accepted.

## Canonical Contracts

### Native KeyValueStore

The package must not mirror or wrap Effect's complete `KeyValueStore` API.
Consumers import the native service directly:

```ts
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";
```

The Upstash provider layer supplies `KeyValueStore.KeyValueStore` through
`KeyValueStore.makeStringOnly(...)`. `get`, `set`, `remove`, prefix-scoped
`clear`, and prefix-scoped `size` preserve the accepted Codex behavior.
Schema-backed consumers continue using `KeyValueStore.toSchemaStore(...)`.

The package documentation must explicitly state that native
`KeyValueStore.modify` is not a coordination primitive unless a selected
backend explicitly documents stronger behavior. Bundjil code must use
`AtomicKeyValueStore` for claims, locks, fenced commits, and concurrent state
transitions.

### AtomicKeyValueStore

`@bundjil/effect-persistence` owns these canonical Effect Schema contracts and
derives all TypeScript types from them:

- `AtomicKeyValueStoreKey`: a non-empty logical key;
- `AtomicKeyValueStoreValue`: a string value suitable for canonical
  Schema-encoded persistence;
- `AtomicKeyValueStoreTtl`: a positive finite whole-millisecond `Duration`
  encoded from a positive finite integer;
- `AtomicKeyValueStoreCondition`: tagged `Absent` and `Equals` variants;
- `AtomicKeyValueStoreMutation`: tagged `Set` and `Remove` variants;
- `AtomicKeyValueStoreTransaction`: bounded non-empty conditions and mutations;
- `AtomicKeyValueStoreOutcome`: `"applied" | "conflict"`; and
- `AtomicKeyValueStoreOperation`: the stable operation names used in errors and
  spans.

The service exposes one meaningful operation:

```ts
AtomicKeyValueStore.transact(transaction)
  -> Effect<AtomicKeyValueStoreOutcome, AtomicKeyValueStoreError>
```

Every live and memory implementation re-decodes the value with
`Schema.decodeUnknownEffect(AtomicKeyValueStoreTransaction)` at the public
operation boundary even though the parameter is schema-derived. TypeScript does
not enforce runtime maximum-length or uniqueness checks, so trusting the static
type alone is invalid. A narrowly scoped internal constructor may centralize
this decode and safe error mapping for both Layers because it owns the canonical
service boundary; it must be used by both implementations, directly tested,
and must not become a generic service factory.

Semantics:

1. All conditions are evaluated against one atomic snapshot.
2. `Absent` succeeds only when the logical key has no live value.
3. `Equals` compares the exact stored string with the expected string.
4. If any condition fails, no mutation occurs and the result is `conflict`.
5. If all conditions pass, every mutation is committed atomically and the
   result is `applied`.
6. `Set` may attach a positive TTL; absence of TTL means no expiry.
7. A `Set` without TTL clears any prior expiry for that key, matching Redis
   `SET` behavior; expired values are treated as absent and excluded from
   ordinary `get`, `has`, and `size` observations.
8. `Remove` deletes only as part of the successful transaction.
9. Conditions and mutations use logical keys. The adapter applies its prefix
   exactly once.
10. Duplicate condition keys, duplicate mutation keys, empty transactions,
    invalid TTLs, and transactions with more than 32 conditions or more than
    32 mutations fail Schema validation before provider I/O.
11. Conflicts are expected outcomes, not defects or provider errors.

The first implementation caps each condition and mutation collection at 32
entries. It must use `Schema.NonEmptyArray(...).check(Schema.isMaxLength(32))`
plus a Schema-level uniqueness check, or an equivalently explicit Effect
Schema contract. It must not add convenience methods for claim, lock,
compare-and-set, or compare-and-remove unless two real call sites remain
substantially clearer after migration and the abstraction passes helper
admission.

### Errors And Privacy

`AtomicKeyValueStoreError` is a Schema-backed tagged error. It carries only:

- the canonical operation;
- and a safe message.

It must not include stored values, Redis command arguments, tokens, message
handles, phone numbers, OAuth subjects, encrypted profiles, complete logical
keys, or raw provider responses. Provider errors map into this error inside the
adapter. Consumers map it into their existing domain errors without leaking
provider details.

An internal provider SDK error may use `Data.TaggedError` to preserve an
unknown cause until the adapter maps it. It is not exported, logged, serialized,
attached to `AtomicKeyValueStoreError`, or retained after mapping. Effect Schema
parse errors may contain rejected input, so they are also discarded when
mapping to the public safe error. Native adapter failures use Effect's required
`KeyValueStore.KeyValueStoreError` but omit its optional `key` and `cause`
fields; only a stable method and safe message cross the provider boundary.

### JSON And Encoding

Canonical records and transaction payloads cross JSON boundaries through
Effect Schema codecs only. `JSON.parse`, `JSON.stringify`, manual object
readers, and structural casts are forbidden in committed source, tests, smoke
scripts, and proof output.

The Upstash adapter may use one static Lua transaction program. Transaction
arguments must be encoded from the canonical Schema or passed as positional
arguments; dynamic Lua generation and user-controlled command interpolation
are forbidden. Automatic Upstash deserialization and provider telemetry remain
disabled.

## Package Ownership And Shape

Proposed shape:

```text
packages/effect-persistence/
  package.json
  tsconfig.json
  tsconfig.build.json
  README.md
  src/
    schemas.ts
    errors.ts
    atomic-key-value-store.service.ts
    index.ts
    memory.layer.ts
    upstash.layer.ts
  test/
    atomic-key-value-store.test.ts
    upstash-key-value-store.test.ts
    upstash-atomic-key-value-store.test.ts
```

Public exports:

```text
@bundjil/effect-persistence
@bundjil/effect-persistence/memory
@bundjil/effect-persistence/upstash
```

The root exports only provider-neutral schemas, schema-derived types, the
tagged error, and the `AtomicKeyValueStore` service. Memory and Upstash Layers
live on explicit subpaths. Do not add a root barrel for provider client types.

The Upstash constructor accepts a schema-decoded options value containing a
`Schema.Redacted(Schema.NonEmptyString)` REST token and REST URL plus the
canonical key prefix. It does not read `process.env`, construct an Effect
`ConfigProvider`, or own consumer env names. The resulting Layer provides both
native `KeyValueStore.KeyValueStore` and `AtomicKeyValueStore` from one backing
client and one prefix.

Consumer environment bindings stay in their existing distinct config modules:
`@bundjil/codex-oauth` owns its hosted persistence Config and
`apps/agent/agent/lib/sendblue/config.ts` owns agent delivery persistence
Config. They use `Config`, `Config.redacted`, and canonical Schemas, then pass
the redacted values unchanged to `UpstashPersistenceLive(options)`. Only that
provider Layer reveals them inside the final `Redis` constructor. No consumer,
provider package, script, or service operation reads `process.env` directly.

The Upstash subpath owns canonical `UpstashPersistenceOptions` and
`UpstashPersistenceKeyPrefix` Schemas. The prefix must be non-empty and reject
Redis glob metacharacters so prefix-scoped `clear` and `size` cannot escape
their namespace. The provider adapter must never call `FLUSHDB`, global
`DBSIZE`, or an unscoped scan.

Prefix-scoped `clear` and `size` must iterate every SCAN cursor, decode each
provider page through Effect Schema, and use an Effect `HashSet` so duplicate
SCAN results cannot overcount or trigger duplicate deletes. `clear` collects
the bounded namespace result before deletion so deleting a page cannot move the
cursor past remaining keys. These maintenance operations are weakly consistent
under concurrent writes and must not be used for claims, locks, commits, or
other coordination. Ordinary native `set` and atomic `Set` without TTL both
clear any previous expiry in memory and Upstash.

`@upstash/redis` moves to this package and is removed from `apps/agent` and
`@bundjil/codex-oauth` after all direct imports are gone. `effect` remains a
workspace catalog dependency. Tests use `@effect/vitest` and mocked narrow
provider clients; live credentials are never required by the package suite.

## Consumer Ownership

### Codex OAuth

`@bundjil/codex-oauth` retains:

- Upstash environment-name loading and the Codex default namespace;
- encrypted profile schemas and `KeyValueStore.toSchemaStore` composition;
- profile storage keys and subject hashes;
- refresh-lock lease identity and policy;
- profile-commit operation selection, encryption, revision creation, conflict
  mapping, and observer events; and
- filesystem and memory domain layers.

It consumes `UpstashPersistenceLive(options)` and
`AtomicKeyValueStore`. Its lock and commit services translate generic
`applied`/`conflict` outcomes into the existing Codex booleans and tagged domain
errors. It must not retain Redis Lua, SDK interfaces, direct `Redis`
construction, scan logic, or provider response schemas.

The generic transaction must support the existing multi-key profile commit:

- initial write: profile absent + revision absent -> set profile + revision;
- legacy replacement: encrypted profile equals expected + revision absent ->
  set profile + revision;
- ordinary replacement/refresh/reauthentication: revision equals expected ->
  set profile + revision; and
- refresh lock: lock absent -> set owner with TTL; owner equals expected ->
  remove lock.

### Agent Delivery Idempotency

`apps/agent` retains Sendblue config names, message-handle and event-coordinate
schemas, replay key derivation, claim identifiers, delivery state, and domain
error policy. The shared package must contain no Sendblue/Eve terminology.

The replay store migrates its atomic operations as follows:

- claim: key absent -> set canonical claimed record with lease TTL;
- complete/uncertain: key equals owner-fenced claimed record -> set canonical
  terminal record with retention TTL; and
- retryable: key equals owner-fenced claimed record -> remove key.

The domain service continues to return the existing claimed/duplicate and
transition outcomes. Physical Redis keys must remain byte-for-byte compatible:
the app derives the same logical suffix and the generic adapter applies the
existing prefix exactly once. Existing record JSON and TTL units must remain
compatible so a deployment cannot reopen retained duplicate-delivery windows.

## Compatibility Invariants

Before migration, tests must capture the accepted current behavior as fixtures
without secrets or production values. After migration they must prove:

- the same logical input produces the same physical Redis key;
- the same Schema record produces the same stored string;
- claim and lock TTLs have equivalent millisecond expiry behavior;
- namespace-scoped `clear` and `size` never affect another prefix;
- failed conditions perform zero mutations;
- concurrent claims have exactly one applied result;
- a stale owner cannot release or overwrite a newer value;
- multi-key profile commits are all-or-nothing;
- legacy profile replacement and revision fencing preserve current outcomes;
- provider malformed responses and failures become safe typed errors;
- ordinary `KeyValueStore` and atomic transactions share one backing state;
- no direct `@upstash/redis` import remains outside the provider adapter; and
- no consumer uses `KeyValueStore.modify` for coordination.

Completed historical SPEC/task evidence must not be rewritten as though the
new package existed at the time. Current architecture docs and READMEs should
add explicit supersession notes and point to this SPEC; historical execution
records remain factual.

## Call Graphs

### Production: Sendblue Ingress And Delivery

```text
Sendblue webhook
  -> apps/agent SendblueChannel
    -> SendblueReplayStore.claimInbound
      -> AtomicKeyValueStore.transact
        -> UpstashPersistenceLive(SendblueConfigService replay options)
          -> @upstash/redis
    -> Eve send(...)

Eve message.completed
  -> SendblueReplayStore.claimOutbound
    -> AtomicKeyValueStore.transact
      -> same UpstashPersistenceLive client/namespace
  -> SendblueClient.sendMessage
  -> SendblueReplayStore.complete | retryable | uncertain
    -> AtomicKeyValueStore.transact
```

### Production: Hosted Codex Profile And Refresh

```text
apps/codex-proxy live composition
  -> @bundjil/codex-oauth Config + cipher + domain services
    -> CodexProfileStore
      -> effect KeyValueStore.toSchemaStore
    -> CodexOAuthRefreshLock
      -> AtomicKeyValueStore.transact
    -> CodexOAuthProfileCommit
      -> AtomicKeyValueStore.transact
    -> UpstashPersistenceLive(Codex-owned persistence options)
      -> one @upstash/redis client
```

### Trusted-Local Codex Commands

```text
login/import/proof script
  -> trusted-local Codex operation
  -> Codex-owned Config and encryption
  -> KeyValueStore + AtomicKeyValueStore domain composition
  -> UpstashPersistenceLive(Codex-owned persistence options)
```

### Deterministic Consumer Tests

```text
SendblueReplayStore or Codex domain service
  -> native KeyValueStore + AtomicKeyValueStore
  -> PersistenceMemory
  -> one SynchronizedRef-backed state + TestClock/Clock
```

### Provider Adapter Tests

```text
KeyValueStore / AtomicKeyValueStore contract test
  -> internal provider adapter constructor
  -> narrow mocked Upstash client
  -> scripted provider responses and failures
```

## Implementation Sequence

1. Add the new package, canonical atomic schemas/service/error, coherent memory
   Layer, and Upstash Layer with contract tests.
2. Migrate Codex ordinary storage, refresh lock, and fenced profile commit while
   preserving domain services and all existing tests/proofs.
3. Migrate agent replay persistence while preserving physical keys, records,
   TTLs, HTTP behavior, and domain service names.
4. Prove an isolated Preview build and storage contract without registering a
   second shared-line Sendblue webhook.
5. After explicit rollout approval, deploy from a clean pushed SHA, verify
   Production protected routes and one bounded handset turn, retain rollback
   evidence, and reconcile current documentation.

Each spike must leave the repo buildable and testable. The foundation package
may be committed on the implementation branch after its contract gate, but it
is not independently mergeable or deployable; the first mergeable state must
include at least one migrated production consumer. Do not merge a compatibility
re-export that only hides old ownership or a half-migrated composition with two
independent Upstash clients for one namespace.

## Verification

### Static And Local

Run at minimum:

```bash
bun install --frozen-lockfile
bun run --filter @bundjil/effect-persistence check-types
bun run --filter @bundjil/effect-persistence test
bun run --filter @bundjil/effect-persistence build
bun run --filter @bundjil/codex-oauth check-types
bun run --filter @bundjil/codex-oauth test
bun run --filter @bundjil/codex-oauth build
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
bun run --filter @bundjil/agent check-types
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
bun run check
bun run knip
bun run verification
git diff --check
```

Review Effect language-server diagnostics for every changed TypeScript file.
Do not weaken lint, add broad suppressions, expand ignore patterns, or accept
dead compatibility exports to make checks pass.

### Atomic Contract Tests

Tests must cover:

- absent/equal success and conflict;
- set/remove with no partial mutation;
- per-write TTL and expiry under controlled time;
- persistent `Set` clearing a prior TTL and expired values disappearing from
  ordinary observations;
- one `SynchronizedRef.modify` critical section for each memory transaction,
  with expiry cleanup, condition evaluation, and mutation performed against
  that same snapshot;
- bounded transaction validation and duplicate-key rejection;
- service-boundary revalidation proving 33-entry and duplicate-key typed values
  fail before memory mutation or mocked provider invocation;
- concurrent create-if-absent with one winner;
- stale-owner compare-and-remove rejection;
- stale-value compare-and-set rejection;
- multi-key all-or-nothing commit;
- shared ordinary/atomic state;
- namespace isolation for get/set/remove/clear/size/transactions;
- complete SCAN pagination, duplicate-page-key de-duplication, and
  delete-after-collection behavior for scoped `clear`/`size`;
- exactly one backing client/state allocation per Layer build;
- exact Schema JSON round trips;
- malformed provider responses;
- provider/network failures with no value leakage; and
- parity between memory and mocked Upstash outcomes.

### Live And Deployment Proof

The package itself requires no live credentials. Consumer rollout must use
existing encrypted Vercel bindings and preserve environment isolation.

Preview proof must establish:

- a clean build from the intended pushed SHA;
- the expected app/proxy environment and personal Vercel scope;
- protected health/auth behavior;
- safe Upstash read/write/condition/rollback against an isolated proof key or
  namespace;
- no plaintext credential or message data in storage/logs;
- no active Preview webhook on the shared Sendblue account/line; and
- no Production variable, webhook, profile, or stored replay mutation.

Production proof, only after rollout approval, must establish:

- unchanged encrypted binding names and namespace prefixes;
- old retained profile and replay records remain readable;
- one bounded inbound message, one Eve turn, and one delivered outbound;
- no duplicate inbound dispatch or outbound provider send appears in the
  bounded window;
- isolated contract proof, rather than a synthetic personal-message replay,
  demonstrates duplicate inbound/outbound claim suppression;
- one hosted Codex completion succeeds through the existing encrypted profile;
  if a refresh occurs naturally, its sanitized observer evidence is recorded,
  but Production proof must not force token expiry merely to exercise refresh;
- no error/fatal logs or credential/content leakage; and
- a documented immutable rollback deployment.

Evidence records only timestamps, counts, status codes, safe booleans, masked
identifiers, and immutable deployment references. Never retain Redis values,
tokens, phone numbers, message content, OAuth subjects, protected URLs, raw
provider bodies, or transaction arguments.

## Rollback

- Keep physical keys, namespace prefixes, and encoded values compatible so the
  previous deployment can resume immediately.
- Do not delete old keys or run a migration that rewrites production values.
- Retain the current known-good Production deployment before promotion.
- If generic transaction parity, Codex refresh, webhook handling, replay
  suppression, or log safety fails, restore the previous deployment and leave
  provider webhooks and encrypted variables unchanged.
- Reverting source must not require restoring the old package dependency
  layout before traffic can resume; the immutable deployment is the first
  rollback control.

## Risks And Tradeoffs

### Generic Transaction Breadth

A multi-key conditional transaction is more capable than the Sendblue replay
store alone requires. It is justified by the already implemented Codex profile
commit and refresh lock. The public contract must remain bounded and declarative
instead of exposing a Redis-shaped escape hatch.

### Effect Unstable API

`KeyValueStore` is under Effect v4's unstable persistence path. Centralizing
the provider adapter reduces migration surface, but the package must retain
contract tests and review the local Effect source on every version upgrade.

### Provider Portability

The contract is provider-neutral; the first live adapter is Upstash. A future
SQL or other KV adapter must prove true atomic semantics for the complete
transaction contract. It must not emulate coordination with process-local
locks or get-then-set.

### Abstraction Creep

The package could become a dumping ground for storage helpers. Helper admission
is strict: add only native KV adaptation, the one atomic transaction service,
and explicit live/memory provider Layers. Domain state machines and key
derivation stay with their owners.

### Operational Regression

Moving prefix application from consumer code to the adapter can change physical
keys if performed twice or omitted. Exact compatibility fixtures and Preview
proof are release blockers.

## Documentation Deliverables

Implementation must update:

- root `README.md` and `ARCHITECTURE.md`;
- `docs/README.md`;
- `docs/architecture/effect-patterns.md`;
- `docs/architecture/repo-structure.md`;
- `docs/architecture/testing-and-quality.md`;
- `packages/effect-persistence/README.md`;
- `packages/codex-oauth/README.md`;
- `apps/codex-proxy/README.md`;
- `apps/agent/README.md`;
- `docs/architecture/eve-agent.md`;
- this SPEC and its task ledger; and
- active execution plans for Codex and Sendblue where current ownership claims
  or live evidence are superseded.

Documentation must explain native `KeyValueStore` versus
`AtomicKeyValueStore`, package/provider ownership, config ownership, physical
key compatibility, privacy, rollback, and the fact that replay/idempotency
storage is not conversation history or Workflow persistence.

## Acceptance Criteria

- `@bundjil/effect-persistence` exists with stable provider-neutral root
  contracts and explicit memory/Upstash subpaths.
- Ordinary Upstash persistence is provided through Effect's native
  `KeyValueStore` service.
- Atomic coordination uses the Schema-owned `AtomicKeyValueStore` transaction
  service, never `KeyValueStore.modify` or get-then-set.
- The Upstash SDK is imported only by the new provider adapter package.
- Codex and Sendblue domain services retain their names, policies, schemas, and
  tagged errors while depending on the shared persistence capabilities.
- Existing production Redis keys, values, TTLs, encrypted profiles, locks,
  fences, replay outcomes, and route behavior remain compatible.
- Memory and Upstash contract tests prove concurrency, fencing, expiry,
  namespace isolation, and all-or-nothing mutation.
- No raw JSON, unsafe casts, DTO mirrors, provider-client leakage, dynamic Lua,
  helper sprawl, broad lint suppression, or secret/content logging is added.
- Focused package/app checks and `bun run verification` pass.
- The mandatory three-pass Effect audit is recorded for every task, with extra
  passes for any unresolved ownership, implementation, or proof finding.
- Isolated Preview proof passes before any approved Production promotion, and
  Production acceptance includes rollback and bounded live evidence.

## Implementation Record

Tasks 1 through 4 are completed with their preserved rollout evidence in the
task ledger and active execution plan. Task 5 reconciles the current package
and app ownership after those migrations; earlier Codex-owned Upstash adapter
and pre-acceptance rollout statements are historical context, not current
architecture. The shared package now owns native `KeyValueStore` composition,
the atomic transaction contract, and its explicit `/memory` and `/upstash`
subpaths. Codex and Sendblue retain logical keys, codecs, retention policy,
and domain transitions.

Compatibility means retaining the final physical Redis key, canonical encoded
value, and TTL. Adapter prefixes are applied once at the provider boundary.
Codex encrypted profile state and Sendblue replay/idempotency state are private
durable records, not conversation history, Eve session streams, or Workflow
storage. Monitoring and deployment proof remain sanitized; rollback restores
the retained deployment or provider binding without namespace clearing.
