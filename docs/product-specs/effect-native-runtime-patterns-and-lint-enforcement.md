---
document_type: product-spec
lifecycle: proposed
authority: canonical
owner: bundjil-product-owner
implementation_owner: bundjil-effect-architecture-owner
verification_owner: bundjil-verification-owner
last_reviewed: 2026-07-26
review_trigger: Effect version, language-service diagnostic, Oxlint plugin, runtime-state ownership, timing, collection, or eve-runtime-qualification integration change
task_ledger: effect-native-runtime-patterns-and-lint-enforcement.tasks.json
---

# Effect-native runtime patterns and lint enforcement

## Status and decision

This SPEC is implementation-ready proposed intent. It authorises no runtime or
lint change, deployment, provider mutation, credential operation, release,
commit, push, or merge. An active execution plan must be created before future
implementation starts.

Bundjil will strengthen Effect-native code through targeted migrations and four
narrow lint rules:

1. deterministic ambient-time enforcement in Effect-owned source and tests;
2. Promise/`async`/`await` confinement in Effect service code;
3. explicit rejection mapping at `Effect.tryPromise` boundaries; and
4. Effect runtime execution confined to named runtime, adapter, CLI, and test
   boundaries.

The implementation will extend Bundjil's existing Oxlint JavaScript plugin,
language-service diagnostics, and boundary audit. It will not import Site's
policy wholesale, add a second lint runner, or create a generic policy wrapper.

Collections, optionality, state cells, and helper extraction remain
domain-visible decisions:

- ordinary immutable arrays remain the default ordered in-memory sequence;
- `Chunk` is chosen for a measured persistent concatenation/streaming need, not
  because code imports Effect;
- `HashMap` and `HashSet` are chosen when immutable updates, Effect
  `Equal`/`Hash`, typed absence, or set algebra materially carry the domain;
- `Ref` variants are selected by transition, observation, resource, and
  lifetime semantics;
- Atom is not a backend/runtime state primitive for Bundjil;
- `Option`, `Match`, decoded optional fields, and ordinary conditional
  composition each retain distinct jobs; and
- one cohesive state value is used only when fields share an invariant and must
  transition atomically.

No future implementation task may rewrite clear working code merely to increase
the count of Effect APIs.

## Exact evidence epoch

| Evidence                          | Exact identity                                                                                                            | Use and claim limit                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Bundjil draft                     | clean detached `main`/`origin/main` at `e92f8d2508dd927c09cb63eddb50c6ca09904b95`                                         | Canonical repository evidence for this draft only.                                                                     |
| Bundjil Effect dependency         | lock-resolved `effect@4.0.0-beta.74`; `package.json:30-35`                                                                | The beta.74 API controls implementation until a separate upgrade changes it.                                           |
| Site read-only comparison         | `/Users/cooper/Projects/site`; local `main` `ed4306f1`, existing `origin/main` `a827c7deb90f40b14abe225c4e460fe5c2e560ba` | Rule/config source comparison only; the four remote commits beyond local `main` do not alter the inspected lint files. |
| Eve runtime integration candidate | `origin/codex/eve-runtime-qualification` at `238f0334a69b0d4b9cd1d449322c7f31195504be`                                    | Read-only future integration evidence, not current `main` and not authority to modify that branch.                     |
| Effect primary current source     | `Effect-TS/effect-smol` local clean `main` at `1caab3cc30f626efbf15e59d74f539a487e5c85c`                                  | API-drift discovery only where it differs from beta.74.                                                                |
| Research date                     | 2026-07-26                                                                                                                | External or provider actuality was not read and is not claimed.                                                        |

## Research method and source priority

The investigation:

1. inspected Bundjil's current architecture, READMEs, lint configuration,
   language-service configuration, custom checks, source, tests, and proposed
   runtime branch;
2. inspected Site's actual rule implementations, config scopes, exceptions,
   unit tests, and installed-Oxlint fixtures read-only;
3. queried Executor Personal DeepWiki against `Effect-TS/effect-smol` for
   discovery; and
4. reconciled every API decision against Bundjil's installed beta.74 source and
   current upstream Effect source.

DeepWiki is supporting discovery only. The pinned dependency, installed source,
and primary upstream source control. Current upstream APIs that beta.74 does not
expose are unresolved upgrade questions, not implementation instructions.

Primary references:

- [Effect `Ref`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/Ref.ts)
- [Effect `SynchronizedRef`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/SynchronizedRef.ts)
- [Effect `SubscriptionRef`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/SubscriptionRef.ts)
- [Effect `ScopedRef`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/ScopedRef.ts)
- [Effect `Clock`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/Clock.ts)
- [Effect `TestClock`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/testing/TestClock.ts)
- [Effect `Layer`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/Layer.ts)
- [Effect `HashMap`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/HashMap.ts)
- [Effect `HashSet`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/HashSet.ts)
- [Effect `Chunk`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/Chunk.ts)
- [Effect `Schema`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/Schema.ts)
- [Effect unstable reactivity `Atom`](https://github.com/Effect-TS/effect-smol/blob/1caab3cc30f626efbf15e59d74f539a487e5c85c/packages/effect/src/unstable/reactivity/Atom.ts)
- [`@effect-atom/atom`](https://www.npmjs.com/package/@effect-atom/atom)

## Current-state inventory

### Bundjil enforcement owners

| Surface                 | Concrete evidence                          | Finding                                                                                                                                                                       |
| ----------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root scripts            | `package.json:42-68`                       | `check:effect-setup`, `check:boundaries`, `check:docs`, `test:lint`, and terminal `verification` already provide the extension path.                                          |
| Oxlint config           | `oxlint.config.ts:1-40`                    | One local JavaScript plugin is loaded; only `bundjil/tagged-error-name` is enabled in app/package TypeScript.                                                                 |
| Local plugin            | `lint/oxlint-plugin.ts:34-122`             | The plugin already uses a small AST visitor and stable `bundjil/*` rule IDs.                                                                                                  |
| Effect language service | `tsconfig.base.json:1-19`                  | Existing errors already cover `newPromise`, `nestedEffectGenYield`, `floatingEffect`, global fetch, sync Schema in Effects, unsafe assertions, and related boundary failures. |
| Boundary audit          | `tooling/boundary-audit.ts:528-575`        | Type-aware enforcement already rejects raw public semantic primitives and unsafe boundary syntax; new Oxlint rules must not duplicate it.                                     |
| Architecture            | `docs/architecture/effect-patterns.md`     | Current policy already prefers Effect collections when semantics matter and explicitly permits plain TypeScript glue.                                                         |
| Verification            | `docs/architecture/testing-and-quality.md` | The repository already distinguishes focused direct proof from the terminal aggregate gate.                                                                                   |

### Bundjil code exemplars and migration candidates

| Candidate                        | Concrete citation                                                                                                                                                                                                                               | Decision                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cohesive atomic memory state     | `packages/store/src/memory.layer.ts:22-125`                                                                                                                                                                                                     | Preserve as a positive exemplar: one `SynchronizedRef<HashMap<...>>`, Clock-owned expiry, atomic modify, typed absence, and one state invariant.                                                                            |
| Deterministic store tests        | `packages/store/test/atomic-key-value-store.test.ts:120-251`                                                                                                                                                                                    | Preserve as a positive `TestClock.adjust` pattern.                                                                                                                                                                          |
| Clock-owned OAuth runtime        | `packages/codex/src/auth/service.ts:128-168`, `228-447`                                                                                                                                                                                         | Preserve Clock reads; review only the remaining fixed polling sleep against its deadline/lock contract.                                                                                                                     |
| Wall-clock OAuth fixtures        | `packages/codex/test/refresh-capable.test.ts:47-97`, `178-220`, `451-463`                                                                                                                                                                       | Targeted migration: the file imports `TestClock` yet fixture defaults use `Date.now()`, so results depend on host time.                                                                                                     |
| Other ambient fixture time       | `packages/codex/test/codex-oauth.test.ts`, `packages/codex/test/codex-direct-provider.test.ts`, `packages/codex/test/profile-commit.test.ts`, `packages/codex/test/stored-profile-proof.test.ts`, `apps/codex-proxy/test/proxy-handler.test.ts` | Inventory and migrate only tests whose assertions are Effect-clock-owned. Do not convert fixed timestamps or genuine host-boundary proof.                                                                                   |
| Genuine live process timing      | `apps/codex-proxy/test/prove-preview.test.ts:120-143`, `475-497`                                                                                                                                                                                | Preserve via exact lint scope/exception: child-process deadline proof intentionally observes host time and raw timers.                                                                                                      |
| Test memory map                  | `packages/codex/src/testing/index.ts:167-225`, `228-340`                                                                                                                                                                                        | Review target, not automatic defect. `HashMap` may improve immutable updates and typed absence; native `Map` may remain if JS-key identity and familiar fixture code are clearer.                                           |
| Adjacent independent counters    | `apps/agent/test/channel-runtime.test.ts:90-105`, `230-243`                                                                                                                                                                                     | Preserve unless a shared invariant is proved; build/disposal counters are independently observed test probes.                                                                                                               |
| Adjacent request transcript refs | `packages/codex/test/subscription-login.test.ts:445-466`                                                                                                                                                                                        | Review whether body and content type form one atomic transcript record; no syntax-only lint decision.                                                                                                                       |
| Runtime execution                | `apps/agent/agent/channels/sendblue.ts:1-8`, `apps/agent/agent/channels/photon.ts:1-8`, app scripts, and package scripts                                                                                                                        | Named app/runtime/CLI boundaries are allowed. `apps/agent/agent/tools/workspace_status.ts` and `apps/agent/agent/connections/executor.ts` are explicit audit targets because they execute Effects inside adapter callbacks. |
| Helper sprawl                    | no `helper`, `helpers`, `util`, `utils`, or `common` directories under current `apps`, `packages`, `tooling`, or `lint`                                                                                                                         | Preserve through review and ownership policy; there is no current debt baseline that justifies a name heuristic.                                                                                                            |

### Read-only Eve runtime branch targets

The branch is not current `main`. Future implementation must integrate only
after the runtime branch lands or is rebased, and must re-inventory the merged
source rather than applying line-based edits blindly.

| Branch evidence at `238f0334`                              | Finding and future action                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/agent/agent/lib/channel/handoff.ts:27-80`, `122-160` | A named service owns acceptance observations, uses a test-only `Ref` capture, and reads time through Effect Clock. Preserve its safe boundary and review whether observation storage should remain a test concern rather than a production reactive state abstraction. |
| `apps/agent/agent/lib/channel/dispatch.ts:53-141`          | Provider Promise ingress is correctly wrapped and timed, but the nested yielded `Effect.gen` at lines 87-122 is a concrete flat-flow review target after integration; do not pre-judge it independently of the configured language-service result.                     |
| `apps/agent/test/channel-handoff.test.ts:31-104`           | Two observation Refs represent two deliberately independent environment/secret owners; do not collapse them. The local `Set` at lines 96-102 is a small uniqueness assertion, not a runtime collection migration.                                                      |
| `apps/agent/test/channel-continuity.test.ts:18-69`         | The fixture decodes ordinary arrays, then assumes exactly six messages and three acceptances. `Schema.NonEmptyArray` alone would not prove those cardinalities; a tuple/exact-length contract or explicit fixture construction is the relevant migration.              |
| Branch commit and completed qualification docs             | This SPEC follows the branch; it does not edit, supersede, or reactivate its completed proof.                                                                                                                                                                          |

## Research findings

### Deterministic time

Bundjil beta.74 exposes `Clock.currentTimeMillis`; sleeps, timeouts, schedules,
and retries are Clock-driven. `TestClock` controls those semantics with
`adjust`, `setTime`, and `withLive`. The correct test shape is:

1. construct time-dependent work lazily;
2. fork it when it semantically sleeps;
3. advance or set the test clock;
4. join or inspect the Fiber; and
5. assert attempts, timestamps, deadline result, and final state.

`TestClock.withLive` is reserved for an explicitly named host integration. A
test that calls `Effect.sleep` is not a real sleep merely because it names a
duration; under `@effect/vitest` it is driven by `TestClock`. Lint must target
ambient host primitives and explicit live-clock escape, not ban
`Effect.sleep`, `Effect.timeout`, or `Schedule`.

### Ref family, context, and Atom

| Primitive                             | Use in Bundjil                                                                                                                                 | Do not use when                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Ref<A>`                              | One in-process value with pure atomic `update`/`modify`; test captures and simple service state.                                               | Several values must change transactionally; a separate get/set pair derives the next value; updates perform Effects. |
| `SynchronizedRef<A>`                  | Effectful or serialized transitions over one state value; a semaphore-protected transition is the actual domain invariant.                     | Pure `Ref.modify` is sufficient, or long I/O under its semaphore would serialize unrelated work.                     |
| `SubscriptionRef<A>`                  | A real consumer needs the current value followed by a replaying stream of committed changes.                                                   | The only consumer reads once or tests inspect a final capture. Publication is observable behavior and cost.          |
| `ScopedRef<A>`                        | A current resource-backed client, connection, subscription, or handle must be replaced with correct acquisition/finalization.                  | The value is plain data; ordinary Layer scope already owns one stable resource.                                      |
| v4 `Context.Reference` / `References` | Fiber-local or dynamically scoped context with a default, supplied through Effect context.                                                     | Shared mutable process state is intended. v4 removed the v3 `FiberRef` API.                                          |
| `effect/unstable/reactivity` Atom     | A future reactive presentation/server-state owner has an `AtomRegistry`, subscriptions, invalidation, cache/disposal, and hydration semantics. | Backend runtime state, provider adapters, locks, replay state, or test captures.                                     |
| Separate `@effect-atom/atom`          | Not admitted by this SPEC. It is a separate work-in-progress reactive frontend package and Bundjil has no dependency or owner for it.          | All current Bundjil backend/runtime work.                                                                            |

`Ref` operations are atomic per reference; multiple Refs are not transactional
as a group. Therefore a cohesive immutable state record is preferred when
fields share one invariant, transition, serialization boundary, or observation
snapshot. Separate Refs remain correct for independent ownership, lifetime,
contention, or failure domains.

### Layer-owned shared state

A stateful service must be created by its owning Layer, not a module-global
mutable value. In beta.74 Layers are lazy, scoped, and memoized by Layer
identity:

- reusing the same Layer value shares one acquired service/state instance;
- constructing the same Layer expression twice can create independent state;
- `Layer.fresh` deliberately disables sharing; and
- scoped resource state finalizes with the owning Layer scope.

Every future state service must name:

- the state Schema/type and owner;
- Layer identity and intended sharing graph;
- scope and finalizer;
- concurrency/atomicity mechanism;
- serialization boundary, if any;
- safe observability surface; and
- live and memory/mock Layers.

No Layer or Ref makes state cross-process durable. Durable state still belongs
to the owning store/provider and its encoded Schema.

### Collections, absence, and matching

`HashMap` and `HashSet` are immutable and use Effect `Equal`/`Hash`. `HashMap`
lookup returns `Option`. Their iteration order is not an insertion or display
order; sort an array at a presentation/serialization boundary when order is a
contract.

`Chunk` is a persistent ordered sequence optimised for structural sharing,
append/prepend, and concatenation. It is not the universal Effect collection.
In v4, common APIs such as `Stream.runCollect` return `Array`, so converting an
ordinary bounded array into a `Chunk` and immediately back is rejected.

`Schema.NonEmptyArray(S)` decodes to `readonly [S, ...S[]]` and proves at least
one element at ingress. It does not prove exact length, stable ordering,
uniqueness, or a particular indexed element beyond the first. Those need an
owning tuple/check/set/order contract.

Use `Option` for absence that is part of an internal API or collection lookup.
Use a decoded optional Schema field when absence is part of an external or
persisted representation. Use `Option.match` when both branches are value
transformations; use `Match` for a material decoded literal/tagged union. Use
ordinary `if` composition when it is the clearest local presentation or
sequential control flow.

There is no `Effect.onNone` export in Bundjil's beta.74. Its
`Effect.fromOption` always fails with `NoSuchElementError`. Current upstream
beta source adds a customizable `onNone` callback to `Effect.fromOption`; that
API must not enter implementation guidance until Bundjil's dependency is
upgraded and re-researched.

## Decision matrix

| Decision                                        | Choose the first option when                                                                                                                      | Choose the alternative when                                                                                                                                                                                        | Rejected dogma / required proof                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `Array` vs `Chunk`                              | Use immutable `readonly` Array for bounded ordered data, DTO/Schema boundaries, test fixtures, iteration, and v4 APIs that already return arrays. | Use `Chunk` for measured persistent concatenation, repeated append/prepend, structural sharing, or an API that natively owns `Chunk`.                                                                              | No `Array` ban. Prove allocation/operation semantics or native API ownership before migration.                |
| Empty vs non-empty Array                        | Use `Schema.NonEmptyArray` when ingress guarantees at least one domain item and downstream legitimately uses the first.                           | Use `Schema.Array` for legitimately empty collections; use tuple/exact-length checks for cardinality greater than one.                                                                                             | No unchecked `[0]`, destructuring, or non-null assertion as a substitute for the owning contract.             |
| `HashMap`/`HashSet` vs native `Map`/`Set`       | Use Effect collections for immutable updates, Effect equality/hash, typed lookup absence, set algebra, or cohesive state stored in a Ref.         | Use native collections for local mutable algorithms, SDK/framework ownership, weak identity, or a tiny test assertion where conversion obscures intent. Use records/arrays for small serializable string-key data. | No constructor ban. Name the semantic value and verify iteration/order assumptions.                           |
| `Ref` vs `SynchronizedRef`                      | Use `Ref` for pure atomic transitions on one value.                                                                                               | Use `SynchronizedRef` only for serialized/effectful transitions; keep long I/O outside unless the invariant requires the lock.                                                                                     | A separate get/set that depends on the old value is rejected.                                                 |
| `SubscriptionRef`                               | Use only when a real stream subscriber consumes current and future state.                                                                         | Use `Ref`/`SynchronizedRef` for read/update state without publication.                                                                                                                                             | Do not add reactive publication for observability alone.                                                      |
| `ScopedRef`                                     | Use for replaceable resource-backed values with acquisition/finalization.                                                                         | Use Layer scope for a stable resource or ordinary Ref for data.                                                                                                                                                    | State replacement must prove resource lifetime and failure semantics.                                         |
| v4 context reference                            | Use `Context.Reference`/`References` for dynamically scoped, fiber-local defaults.                                                                | Use a state service for shared mutable state.                                                                                                                                                                      | Do not specify removed v3 `FiberRef` APIs.                                                                    |
| Atom vs Ref family                              | Use Atom only in a separately approved reactive UI/server-state surface with registry/cache/subscriber ownership.                                 | Use the Ref family for backend process state.                                                                                                                                                                      | Atom is rejected for current backend/runtime work; no `@effect-atom` dependency.                              |
| `Option` vs decoded optional field              | `Option` owns internal absence and collection lookup.                                                                                             | A Schema optional field owns encoded/decoded boundary representation.                                                                                                                                              | Do not wrap every optional field in another `Option` after decoding without a service-contract reason.        |
| `Option.match` / `Effect.fromOption` vs `Match` | Use `Option.match` for value branching; beta.74 `Effect.fromOption` only when `NoSuchElementError` is intentionally translated at the owner.      | Use `Match` for decoded closed unions; use ordinary `if` for clear local sequential/presentation composition.                                                                                                      | No nonexistent `Effect.onNone`; no global `switch` ban.                                                       |
| One state record vs several Refs                | Use one immutable record when fields share invariants, atomic transitions, snapshots, serialization, and lifetime.                                | Separate independently owned lifetimes, contention, failure, observation, or environments.                                                                                                                         | Syntax adjacency is not proof. Require a transition table demonstrating torn-state risk before consolidation. |

## Boundary and service implications

The repository's existing boundary policy remains unchanged:

```text
unknown host/provider value
  -> one owning Schema decode at ingress
    -> typeof Contract.Type
      -> named service operation
        -> flat lazy Effect program
          -> typeof Contract.Encoded
            -> one owning Schema encode at egress
              -> provider/host
```

Provider/SDK Promises and DTOs remain private to the live adapter. The adapter
uses `Effect.tryPromise({ try, catch })`, validates SDK output once, maps
expected failures to safe `Schema.TaggedErrorClass` errors, and exposes no raw
client or generic callback. Semantic identities are branded Schema-derived
types. Configuration uses `Config.schema`, with secrets redacted. Every service
has explicit live and memory/mock Layers.

State introduced inside a provider Layer must not leak provider DTOs into its
Ref. Store only decoded domain state. If state crosses a process, persistence,
log, or provider boundary, encode the owning Schema at that exact egress.
Never use `instanceof`, unchecked casts, manual object readers, or `switch`
over unvalidated provider strings as policy.

## Site rule inventory and disposition

Site implements all rules in
`tools/oxlint/effect-rules.js:95-1594`, enables a broad base at
`oxlint.config.ts:15-65`, then narrows collection/service/runtime scopes and
adds explicit exceptions at `oxlint.config.ts:67-280`. It verifies visitors in
`tools/oxlint/effect-rules.test.js` and actual installed Oxlint behaviour in
`tools/oxlint/fixtures.test.ts:14-92`. That test architecture is reusable; its
repository policy is not.

| Exact Site rule ID                                            | Implementation invariant                                                                                         | Bundjil classification              | Concrete reason                                                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `effect/no-ambient-time-or-random`                            | Flags `Date.now`, `Math.random`, and every `new Date` (`effect-rules.js:1428-1471`).                             | Copy/adapt                          | Split time from randomness; allow `new Date(explicitEpoch)`; scope host-time exceptions exactly.                                         |
| `effect/no-async-await-promise`                               | Flags async functions, `await`, and `new Promise` except direct Effect Promise-boundary callbacks (`1250-1352`). | Copy/adapt                          | Adds async/await confinement beyond existing `newPromise`; scope only Effect-owned services.                                             |
| `effect/no-bare-effect-try-promise`                           | Import-aware flag for non-object `Effect.tryPromise` (`1354-1384`).                                              | Copy/adapt                          | Enforces typed rejection mapping at SDK/host boundaries.                                                                                 |
| `effect/no-runtime-execution-outside-boundaries`              | Flags `Effect.run*`, `ManagedRuntime.make`, and `BunRuntime.runMain` outside filename conventions (`1168-1217`). | Copy/adapt                          | Prevents nested runtime ownership; Bundjil needs its own exact runtime/adapter/CLI scopes.                                               |
| `effect/no-effect-run-in-adapter-without-boundary`            | Similar runtime-execution check with a second filename policy (`1219-1248`).                                     | Reject duplicate                    | One Bundjil rule and one owner registry are sufficient.                                                                                  |
| `effect/no-host-api-in-service`                               | Regex-scoped service filenames and host import list with layer/runtime exceptions (`1009-1051`).                 | Documentation/review-only initially | Import ownership is valuable, but Site's provider list and filename taxonomy do not map to Bundjil; collect corpus before adding a rule. |
| `effect/no-unknown-service-contract`                          | Flags `unknown` in interface/type signatures in service files (`645-697`).                                       | Existing rule sufficient            | Bundjil's type-aware boundary audit already covers exported raw contracts and exact exceptions.                                          |
| `effect/no-unknown-tagged-error-payload`                      | Flags unknown payload members in tagged errors.                                                                  | Existing rule sufficient            | Boundary audit plus Schema tagged-error policy and tagged-error-name rule own this failure.                                              |
| `effect/no-schema-decoder-outside-ingress`                    | Import-aware decode call outside configured ingress files.                                                       | Existing rule sufficient            | Bundjil's type-aware provenance audit owns exact codecs and exceptions; filename-only duplication would conflict.                        |
| `effect/no-schema-encoder-outside-egress`                     | Import-aware encode call outside configured egress files.                                                        | Existing rule sufficient            | Same provenance owner.                                                                                                                   |
| `effect/no-throwing-schema-sync-codec`                        | Flags throwing sync Schema codecs.                                                                               | Existing rule sufficient            | Effect language service `schemaSyncInEffect` plus boundary audit and existing sync-codec review cover production.                        |
| `effect/no-non-throwing-schema-sync-decoder-outside-consumer` | Restricts remaining sync decoders by filename.                                                                   | Documentation/review-only           | Tests and decoded constant construction require context; no new failure evidence.                                                        |
| `effect/no-json-parse-stringify`                              | Flags direct JSON parse/stringify.                                                                               | Existing rule sufficient            | Effect language service `preferSchemaOverJson` and boundary provenance audit already own it.                                             |
| `effect/no-instanceof`                                        | Flags every `instanceof`.                                                                                        | Existing rule sufficient            | Existing boundary policy forbids it for policy; a global syntactic ban would also catch host interoperability.                           |
| `effect/no-in-operator`                                       | Flags every `in`.                                                                                                | Reject                              | Too broad; Schema decoding does not replace ordinary object/prototype operations everywhere.                                             |
| `effect/no-typeof`                                            | Flags every `typeof`.                                                                                            | Reject                              | Too broad and unrelated to decoded ownership in many host/tooling paths.                                                                 |
| `effect/no-undefined-comparison`                              | Flags direct undefined comparisons.                                                                              | Reject                              | Decoded optional fields legitimately use undefined; Option is not mandatory presentation syntax.                                         |
| `effect/no-nullish-comparison`                                | Flags nullish equality checks.                                                                                   | Reject                              | External protocols and decoded optional composition require exact local handling.                                                        |
| `effect/no-nullable-boundary-leak`                            | Flags raw null properties and `Option.getOrNull`, except tests (`957-1007`).                                     | Documentation/review-only           | Boundary Schemas, not a null syntax ban, own protocol representation.                                                                    |
| `effect/no-conditional-object-spread`                         | Flags conditional object spread.                                                                                 | Reject                              | Bundjil uses clear optional encoded-request composition; Schema owns validation.                                                         |
| `effect/no-manual-tag`                                        | Flags every object-literal `_tag` (`171-200`).                                                                   | Reject                              | Bundjil constructs decoded Schema-owned tagged records directly; banning construction would add wrappers.                                |
| `effect/no-throw`                                             | Flags every throw statement.                                                                                     | Documentation/review-only           | Effect services forbid throws, but host/library callbacks and defects need scoped evidence before lint.                                  |
| `effect/no-switch`                                            | Flags every switch (`1473-1493`).                                                                                | Reject                              | `Match` is preferred for decoded unions; ordinary validated algorithms are not prohibited.                                               |
| `effect/no-result-exit-reencoding`                            | Flags local result-like object tags.                                                                             | Existing rule sufficient            | Tagged Schema/Result/Exit policy and boundary review own the semantic failure; `_tag` heuristics would conflict.                         |
| `effect/no-native-array-methods`                              | Flags native `.map`, `.filter`, and related methods outside Effect namespace (`699-817`).                        | Reject                              | Arrays are a first-class v4 result and remain correct for bounded sequences.                                                             |
| `effect/no-effect-array-data-first`                           | Enforces curried/pipe-first collection calls.                                                                    | Reject                              | Style-only; data-first is a supported API and can be clearer locally.                                                                    |
| `effect/no-native-collections`                                | Flags `new Map/Set/WeakMap/WeakSet` (`921-955`).                                                                 | Reject                              | Semantic value cannot be inferred from constructors; native identity/mutation/test use remains legitimate.                               |
| `effect/no-nested-wrapper-calls`                              | Flags nested call arguments and mapper-name heuristics (`819-888`).                                              | Reject                              | Call nesting and names do not prove wrapper sprawl or obscure data flow.                                                                 |
| `effect/no-route-loader-mappers`                              | Flags mapper-name arguments (`890-919`).                                                                         | Reject                              | Site route policy has no Bundjil owner; false positives are name-based.                                                                  |
| `effect/no-layer-exports-in-service-files`                    | Restricts Layer exports by filename.                                                                             | Documentation/review-only           | Bundjil already separates most service/layer owners, but exact package public surfaces need an import-graph audit before lint.           |
| `effect/no-console-outside-runtime`                           | Flags console by file scope.                                                                                     | Existing rule sufficient            | Existing logging and app-boundary review is adequate; no concrete missed failure in this slice.                                          |
| `effect/no-process-boundary-outside-config`                   | Flags process environment access outside config scopes.                                                          | Existing rule sufficient            | Effect language-service `processEnv` and `processEnvInEffect` are already errors.                                                        |
| `effect/no-effect-test-global-mix`                            | Detects mixing Effect and ordinary Vitest globals.                                                               | Documentation/review-only           | Useful but outside this SPEC's timing/state failure set; reconsider separately with current test corpus.                                 |

## Proposed lint contracts

All new rules live in `lint/oxlint-plugin.ts`, retain `bundjil/*` IDs, use
import-aware matching where an Effect API is involved, have direct visitor unit
tests, and have positive/negative installed-Oxlint fixtures. No rule is enabled
until its migration task has classified every current finding.

| Proposed rule                                   | AST-detectable invariant                                                                                                                                                                                                                                                                                                                                                                                                          | Ownership and scope                                                                                                                                             | Positive and negative fixtures                                                                                                                                                                                                                                 | Migration and autofix                                                                                                                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundjil/no-ambient-time-in-effect`             | Flag `Date.now()`, zero-argument `new Date()`, global or imported `setTimeout`/`setInterval`, and `Bun.sleep` in configured Effect-owned production/test scopes; in `@effect/vitest` tests also flag exact `TestClock.withLive` time escapes unless the file is a registered host-boundary proof. Do not flag `new Date(explicitEpoch)`, fixed numeric fixtures, `Clock.currentTimeMillis`, `Effect.sleep`, timeout, or Schedule. | App/package Effect source and `@effect/vitest` tests; exact path/symbol exceptions for subprocess/live-host proof.                                              | Negative: Date.now fixture, zero-arg Date, global and `node:timers`/`node:timers/promises` timer aliases, `Bun.sleep`, live-clock escape. Positive: Clock read, fork/adjust/join, explicit-epoch Date formatting, fixed epoch, registered subprocess boundary. | Replace ambient fixture values with fixed decoded epochs or Clock/TestClock programs. No autofix: adding `yield*`, selecting an epoch, or changing clock ownership is semantic. |
| `bundjil/no-async-await-in-effect-service`      | Flag `async` functions and `await` in configured Effect service/source files unless the function is the direct callback of `Effect.promise`, or the `try` callback of object-form `Effect.tryPromise`; flag `new Promise` as defence in depth.                                                                                                                                                                                    | `packages/**/src` and Effect-owned app service modules; explicit host/runtime/CLI exclusions. Language-service `newPromise` remains the type-aware owner.       | Negative: async service operation, nested await, new Promise, aliased local async callback outside boundary. Positive: flat Effect.gen, direct `Effect.tryPromise({ try: async, catch })`, direct `Effect.promise`, external host adapter exclusion.           | Inline Effects or move Promise ingress to the live adapter. No autofix: error mapping, laziness, cancellation, and owner selection are semantic.                                |
| `bundjil/require-try-promise-catch`             | Import-aware `Effect.tryPromise` or `effect/Effect` direct import must receive one object expression containing both `try` and `catch`; shorthand function overload and missing catch fail.                                                                                                                                                                                                                                       | All app/package production TypeScript; tests included when they model a fallible boundary.                                                                      | Negative: namespace/direct/aliased bare function overload, object missing catch. Positive: object with try/catch, unrelated local `tryPromise`, `Effect.promise` for documented infallible boundary.                                                           | Add canonical safe tagged error mapping at the adapter. No autofix: a tool cannot invent the owning error or safe diagnostic.                                                   |
| `bundjil/no-runtime-execution-outside-boundary` | Import-aware calls to `Effect.runPromise`, `runPromiseExit`, `runFork`, `runSync`, `runSyncExit`, `ManagedRuntime.make`, and `BunRuntime.runMain` fail outside exact runtime/main/server/CLI/script/test adapter scopes.                                                                                                                                                                                                          | App entrypoints, named channel/framework adapters, scripts, and tests are allowed by configured globs or exact owner registry; package/service logic is denied. | Negative: service/module `runPromise`, nested runtime creation, aliased direct import. Positive: app main, package CLI script, test-owned runtime, named channel adapter, unrelated method name.                                                               | Return Effect values or inject a Layer/ManagedRuntime owned by the boundary. No autofix: moving execution changes lifetime and error handling.                                  |

### False-positive matrix

| Rule              | Plausible false positive                                                                                                     | Required response                                                                                                | Broad suppression forbidden                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ambient time      | Process deadline, child-process timeout, benchmark, certificate/system-clock integration, explicit host response-time proof. | Keep it in a named boundary test and register exact path/symbol, owner, reason, observable, and removal trigger. | No `**/test/**` or app-wide disable.                                    |
| async/await       | SDK callback that must return a Promise, framework lifecycle, CLI top-level boundary.                                        | Move or retain in the live/framework adapter; direct Effect Promise boundary callback is accepted.               | No package-wide disable or async helper wrapper.                        |
| tryPromise catch  | A Promise is documented never to reject.                                                                                     | Use `Effect.promise` and document the invariant at the boundary; otherwise map a safe tagged error.              | No dummy `catch: (error) => error`, unknown payload, or defect erasure. |
| runtime execution | Framework callback cannot return Effect and must bridge through a module-scoped ManagedRuntime.                              | Register the exact adapter symbol, Layer owner, disposal path, and test; retain runtime execution there.         | No generic `adapter/**` wildcard without exact lifecycle ownership.     |

The exception registry may reuse the exact file/symbol/reason/staleness shape of
Bundjil's boundary exceptions, but must remain owned by the lint rule module or
one root lint-policy file. It must not become a generic exemption framework.

### Lint fixture lifecycle

| Artifact                                                                                     | Lifecycle         | Owner and required coverage                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint/oxlint-plugin.test.ts`                                                                 | Update            | Retain `bundjil/tagged-error-name` RuleTester coverage and add visitor/RuleTester positive and negative cases for every new rule, import alias, unrelated identifier, and exception branch. |
| `lint/oxlint-plugin.integration.test.ts`                                                     | Create            | Spawn the installed Oxlint binary against the exact fixture config and assert stable diagnostic IDs, non-zero negative exit, and zero-diagnostic positive exit.                             |
| `lint/fixtures/effect-native.config.json`                                                    | Create            | Load the repository plugin and enable only the four proposed rules against the fixture files.                                                                                               |
| `lint/fixtures/effect-native-positive.ts` and `lint/fixtures/effect-native-positive.test.ts` | Create            | Cover Clock/TestClock, explicit epoch formatting, object-form `tryPromise`, Effect-returning service flow, and named runtime/test boundaries.                                               |
| `lint/fixtures/effect-native-negative.ts` and `lint/fixtures/effect-native-negative.test.ts` | Create            | Cover each exact AST invariant, namespace/direct/aliased imports, global/imported timers, `Bun.sleep`, bare/missing-catch `tryPromise`, and misplaced runtime execution.                    |
| `lint/vitest.config.ts`                                                                      | Update            | Discover the existing unit test and new installed-plugin integration test only; no broad repository test discovery.                                                                         |
| Existing boundary, Effect-language-service, and package fixtures                             | Retain            | They remain the compatibility owners for type-aware boundary provenance, nested generators, Promise construction, provider wires, persistence bytes, and state behaviour.                   |
| Obsolete exceptions/fixtures                                                                 | Retire when stale | Removal requires the staleness test and all positive/negative coverage to remain; no fixture is deleted merely to make the rule pass.                                                       |

## Review-only invariants and rejected lint proposals

The following are mandatory implementation-review questions but are not lint
rules in this SPEC:

- Does indexed access rely on a Schema non-empty or exact-cardinality contract?
- Would one cohesive state record prevent a demonstrated torn transition?
- Are separate Refs intentionally independent by owner, lifetime, or
  contention?
- Does a native `Map`/`Set` depend on identity/mutation, or would immutable
  `HashMap`/`HashSet` and typed absence make the domain clearer?
- Does `Chunk` carry a measured persistent-sequence property, or is conversion
  ceremony?
- Is absence part of the boundary representation, an internal lookup, or local
  conditional composition?
- Is a helper reused, an independently tested policy, real I/O, or a resource
  lifetime owner?
- Does a service operation add domain policy, or merely pass through another
  service with the same arguments and result?
- Is an Effect program flat and lazy, without yielding a nested generator or
  executing a runtime inside a service?

Rejected lint proposals:

- no rule for “multiple adjacent Refs” because syntax cannot prove shared
  invariants or ownership;
- no native collection or array-method ban;
- no universal `Option`, `Match`, `Chunk`, or `HashMap` preference;
- no unchecked-index rule without type/data-flow evidence;
- no helper-directory/name or pass-through-wrapper heuristic;
- no `switch`, `if`, `undefined`, `typeof`, `in`, `_tag`, or object-spread ban;
  and
- no autofix in the first rollout.

## Accepted investigation findings

These findings are accepted into implementation scope. The Site-table
`Reject`, `Existing rule sufficient`, and `Documentation/review-only`
classifications are not hidden implementation work.

| Finding                                                                                     | Evidence                                                                                                                            | Accepted decision                                                                                                          | Owning requirements                         | Owning tasks                                                                                              |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ENP-FND-001` — Effect-clock tests still read ambient host time                             | `packages/codex/test/refresh-capable.test.ts:1-3`, `47-97`, and `217`; related candidates in the current-state table                | Add the narrow time/timer rule and migrate only tests whose assertions are Clock-owned; preserve exact host-process proof. | `ENP-REQ-002`, `ENP-REQ-006`, `ENP-REQ-007` | `add-narrow-lint-rules-disabled`, `migrate-targeted-effect-patterns`                                      |
| `ENP-FND-002` — Promise ingress has a durable AST boundary beyond existing type diagnostics | Site `effect-rules.js:1250-1384`; Bundjil has `newPromise` but no async/await or bare-`tryPromise` custom rule                      | Add scoped async/await confinement and object-form `tryPromise` with safe catch; retain framework Promise owners.          | `ENP-REQ-001`, `ENP-REQ-005`, `ENP-REQ-006` | `add-narrow-lint-rules-disabled`, `migrate-targeted-effect-patterns`                                      |
| `ENP-FND-003` — Runtime execution ownership is documented but not locally linted            | Current `run*`/`ManagedRuntime` inventory and Site `effect-rules.js:1168-1248`                                                      | Add one import-aware Bundjil rule with exact runtime/CLI/test/framework owners; reject Site's duplicate second rule.       | `ENP-REQ-005`, `ENP-REQ-006`, `ENP-REQ-007` | `refresh-integrated-inventory`, `add-narrow-lint-rules-disabled`, `migrate-targeted-effect-patterns`      |
| `ENP-FND-004` — State/collection syntax does not prove domain semantics                     | Store memory positive exemplar, Codex test Map, adjacent independent counter/observation Refs, and exact-cardinality branch fixture | Use transition/semantic decision records and focused proof; do not add adjacency/native-collection/index/helper-name lint. | `ENP-REQ-003`, `ENP-REQ-004`, `ENP-REQ-007` | `refresh-integrated-inventory`, `review-state-and-collection-targets`                                     |
| `ENP-FND-005` — Site's strict plugin is not a portable Bundjil baseline                     | Site's 33 exported IDs at `effect-rules.js:1552-1594`, broad base scope at `oxlint.config.ts:15-65`, and many path exceptions       | Copy/adapt four rules, reuse installed-plugin fixture design, and classify every other rule explicitly.                    | `ENP-REQ-006`, `ENP-REQ-010`                | `refresh-integrated-inventory`, `add-narrow-lint-rules-disabled`                                          |
| `ENP-FND-006` — Effect v4 beta APIs drift across pinned and current source                  | beta.74 `Effect.fromOption` vs current upstream custom `onNone`; v4 `Context.Reference`; unstable Atom                              | Pin implementation decisions to the lock-resolved API and reopen research on dependency changes.                           | `ENP-REQ-003`, `ENP-REQ-004`, `ENP-REQ-009` | `refresh-integrated-inventory`, `review-state-and-collection-targets`, `enable-rules-and-reconcile-docs`  |
| `ENP-FND-007` — The runtime branch adds concrete targets but is not current source          | `origin/codex/eve-runtime-qualification@238f0334` handoff, dispatch, and tests cited above                                          | Sequence after integration, refresh the inventory, preserve independent state and completed hosted proof.                  | `ENP-REQ-008`, `ENP-REQ-010`                | `refresh-integrated-inventory`, `migrate-targeted-effect-patterns`, `review-state-and-collection-targets` |

## Requirements

### `ENP-REQ-001` — preserve boundary provenance

Unknown values decode exactly once at ingress with the owning Effect Schema;
services receive `typeof Contract.Type`; outbound adapters encode
`typeof Contract.Encoded`. Branded semantic identities, safe tagged errors,
redacted Schema-backed config, and explicit live/mock Layers remain mandatory.

### `ENP-REQ-002` — deterministic time

Runtime deadlines, retries, timestamps, and sleeps use Effect Clock semantics.
Effect-clock tests use TestClock without wall-clock waiting. Genuine host-time
proof is exact, named, bounded, and excepted rather than disguised.

### `ENP-REQ-003` — state ownership

Every state cell has a named service/Layer owner, immutable state type,
transition/lifetime/concurrency decision, serialization boundary, safe
observation, and live/mock construction. Cohesive fields transition through one
atomic state value; independent owners remain independent.

### `ENP-REQ-004` — pragmatic collection semantics

Array, Chunk, HashMap, HashSet, native collections, records, Option, and Schema
non-empty contracts are chosen by the decision matrix. Working code is not
rewritten for API-count goals.

### `ENP-REQ-005` — flat Effect control flow

Primary Effects remain lazy, linear, sequential, composable, and readable.
Provider Promises enter once through a typed adapter. Runtime execution,
pass-through services, nested Effect execution, tiny one-use mappers, and
helper/common/utils sprawl do not enter service code.

### `ENP-REQ-006` — narrow lint infrastructure

The four proposed rules extend Bundjil's existing plugin and command path.
Every rule has one AST invariant, owner/scope, positive and negative unit and
installed-plugin fixtures, current-finding classification, false-positive
matrix, migration plan, exact exceptions with staleness proof, and no unsafe
autofix.

### `ENP-REQ-007` — targeted migrations

Future implementation migrates only current findings mapped to a concrete
failure mode. It preserves clear exemplars, genuine host boundaries, provider
wire behaviour, persistent bytes/keys/TTLs, error tags, service identities, and
test intent.

### `ENP-REQ-008` — runtime branch sequencing

The `origin/codex/eve-runtime-qualification@238f0334` candidate is read-only.
Implementation begins after its actual integration state is known, refreshes
all citations/findings, and reviews handoff timing, nested flow, observation
Refs, exact-cardinality fixtures, and Layer sharing without changing its
accepted hosted proof by assumption.

### `ENP-REQ-009` — documentation and skills

Implementation updates the earliest durable owners:
`effect-patterns.md`, `testing-and-quality.md`, root lint documentation, and
affected app/package READMEs only when public commands or boundaries change.
`AGENTS.md`, `prd-writer`, `prd-review`, `prd-implementer`,
`effect-client-wrapper`, or other skills change only when the final
implementation establishes a durable missing policy; no duplicated handbook
text.

### `ENP-REQ-010` — direct proof

Every requirement and lint rule retains a direct observable, expected
postcondition, plausible false green, focused command/procedure, evidence owner,
and limitation. Broad-suite success is terminal regression proof, not a proxy
for rule semantics or runtime ownership.

### `ENP-REQ-011` — terminal verification

Each implementation slice runs its focused tests and affected package checks.
The final accepted candidate runs the repository's required
`bun run verification` gate and `git diff --check`.

### `ENP-REQ-012` — one terminal five-pass audit

After all future implementation tasks are complete, run one mandatory audit in
this order:

1. architecture, ownership, call graphs, and boundary provenance;
2. Effect semantics, time, state, collections, Layers, concurrency, and scope;
3. lint AST invariants, fixtures, exception staleness, migration findings, and
   false positives;
4. focused tests, adversarial proof, package checks, and terminal verification;
5. docs, skills, READMEs, dead exceptions, helper cleanup, and lifecycle
   closeout.

A finding reopens its owning task, invalidates stale evidence, and requires the
affected focused proof plus a new terminal audit after correction. Do not run
this five-pass audit after each task.

## Requirement-to-proof crosswalk

The sibling ledger is the full machine-readable owner.

| Requirement   | Direct observable and expected postcondition                                                                      | False green rejected                                             | Focused procedure / evidence owner                                           | Limitation                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `ENP-REQ-001` | Boundary audit and focused adapter tests show one owning decode/encode and decoded service types.                 | Typecheck or lint alone.                                         | `bun run check:boundaries`; affected provider tests; boundary owner receipt. | Repository proof, not provider actuality.                |
| `ENP-REQ-002` | TestClock attempt/time/deadline traces complete without live waiting; exact host exceptions remain bounded.       | Fast CI, fixed sleep, or a Date comparison that happens to pass. | Lint fixtures and affected Clock tests; test owner receipt.                  | One tested schedule and virtual clock.                   |
| `ENP-REQ-003` | Transition tables and concurrency tests show atomic cohesive state and independent owners remain separate.        | Counting Refs or passing sequential tests.                       | State-owner focused tests; Layer/transition receipt.                         | In-process state is not durable.                         |
| `ENP-REQ-004` | Each migrated collection records the semantic property and order/absence/cardinality proof.                       | Fewer native constructors.                                       | Package tests and migration decision receipt.                                | No universal performance claim.                          |
| `ENP-REQ-005` | Language service and focused call-graph review show no nested runtime/Effect execution or wrapper-only operation. | Pretty pipelines or lower line count.                            | `check:effect-setup`, lint rule, affected service tests.                     | Readability retains reviewer judgment.                   |
| `ENP-REQ-006` | Each rule's unit and installed-Oxlint fixtures reject/accept exact syntax and stale exceptions fail.              | Testing visitor objects only or linting current source only.     | `bun run test:lint`; lint fixture receipt.                                   | AST rules are intentionally not type/data-flow complete. |
| `ENP-REQ-007` | Finding inventory maps every edit to a named failure and preserves recorded wire/state fixtures.                  | Bulk formatter or codemod success.                               | Targeted package tests and compatibility receipt.                            | Untouched code is not re-proved.                         |
| `ENP-REQ-008` | Refreshed merged-base inventory names exact final SHA and resolves each branch target.                            | Applying old branch line numbers.                                | Git identity/read-only diff plus affected agent checks.                      | Does not re-qualify hosted runtime.                      |
| `ENP-REQ-009` | Docs-maintainer ledger has Change required, Preserve, or evidenced N/A for every surface and policy checks pass.  | Updating only AGENTS or only a README.                           | `bun run check:docs`, `bun run check:skills`; docs receipt.                  | Docs checks prove consistency, not runtime.              |
| `ENP-REQ-010` | Ledger contains complete proof fields for every requirement and rule.                                             | Broad verification alone.                                        | PRD review and task-ledger parse.                                            | Traceability is not behaviour.                           |
| `ENP-REQ-011` | Focused commands and final `bun run verification` pass on one exact candidate.                                    | Old green output or partial workspace checks.                    | Verification owner terminal receipt.                                         | No external/provider claim.                              |
| `ENP-REQ-012` | One ordered five-pass receipt is newer than all dependency evidence; findings reopen owners.                      | Per-task ritual or pre-implementation review.                    | Terminal audit task and closeout receipt.                                    | Audit grants no deployment authority.                    |

## Phased implementation and sequencing

The sibling ledger owns exact dependencies. The future sequence is:

1. refresh the inventory on the actual integrated base and freeze rule
   invariants, scopes, exceptions, and fixtures;
2. add the four disabled rules and their unit plus installed-Oxlint fixtures;
3. classify current findings and migrate deterministic timing/Promise/runtime
   boundaries narrowly;
4. review state and collection candidates with transition/semantic evidence,
   changing only accepted targets;
5. enable rules at error after zero unexplained findings and reconcile durable
   docs/skills;
6. run focused package proof and terminal repository verification; and
7. run the one terminal five-pass implementation audit.

There is no active plan in this draft. Implementation must create one only when
Cooper authorises implementation.

## Focused verification commands

During future implementation, use the smallest affected subset first:

```bash
bun run check:effect-setup
bun run test:lint
bun run check:boundaries
bun run --filter @bundjil/store test
bun run --filter @bundjil/codex test
bun run --filter @bundjil/agent test
bun run check:docs
bun run check:skills
bun run check
bun run verification
git diff --check
```

The exact package commands are conditional on changed owners. Provider proof,
deployments, credentials, webhooks, and hosted operations are outside this SPEC
and cannot be inferred from these commands.

For this documentation-only draft, the acceptance commands are:

```bash
bun run fix
bun run check:docs
bun run check:skills
bun run check
git diff --check
```

`bun run verification` is the mandatory future implementation terminal gate,
not a requirement for widening this draft into runtime validation.

## Docs-maintainer impact ledger

| Surface                          | Decision                                  | Earliest owner, future action, proof, and non-claim                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical SPEC/tasks/index       | Change required now                       | This SPEC, sibling ledger, and `docs/product-specs/index.md` own proposed intent and lifecycle. `check:docs` proves routing only.                                                                                                                                   |
| Documentation audit              | Change required now                       | `docs/documentation-audit/HGI-307-impact-ledger.json` records the two new docs paths, count, and sorted-path digest while preserving the original accepted epoch and validation as historical evidence. Future authoritative path changes refresh it again.         |
| Effect architecture              | Change required during implementation     | `docs/architecture/effect-patterns.md` must own accepted Clock/TestClock, state/ref, collection, Layer, absence, and lint policy after code exists.                                                                                                                 |
| Testing/quality architecture     | Change required during implementation     | `docs/architecture/testing-and-quality.md` must own exact rule IDs, fixtures, exception staleness, finding migration, focused commands, and terminal gate.                                                                                                          |
| Other architecture               | Preserve; conditional Change required     | `docs/architecture/README.md`, `docs/architecture/repo-structure.md`, `docs/architecture/eve-agent.md`, and `docs/architecture/frontend-composition.md` remain sufficient unless implementation proves a missing owner.                                             |
| Root README / docs index         | Preserve now; conditional Change required | `README.md` and `docs/README.md` add public command/owner routing only if it changes; do not copy the decision matrix into an index.                                                                                                                                |
| App READMEs                      | Preserve now; conditional Change required | `apps/agent/README.md` and `apps/codex-proxy/README.md` change only if a public boundary or command changes.                                                                                                                                                        |
| Package READMEs                  | Preserve now; conditional Change required | `packages/channel/README.md`, `packages/codex/README.md`, `packages/eve/README.md`, `packages/photon/README.md`, `packages/sendblue/README.md`, and `packages/store/README.md` change only for public purpose, export, boundary, or command changes.                |
| AGENTS.md                        | Preserve now; conditional Change required | `AGENTS.md` already requires flat Effect flow, Schema boundaries, no helper sprawl, provider wrapper review, and docs maintenance. Add only durable missing defaults proven by implementation.                                                                      |
| `prd-writer`                     | Preserve now; conditional Change required | `.agents/skills/prd-writer/SKILL.md` already requires Effect call graphs, proof, and impact ledgers. Add a decision-matrix prompt only if future PRDs repeatedly miss state/time/collection ownership.                                                              |
| `prd-review` / `prd-implementer` | Preserve now; conditional Change required | `.agents/skills/prd-review/SKILL.md` and `.agents/skills/prd-implementer/SKILL.md` change only if final lint/state proof establishes a reusable review invariant not already present.                                                                               |
| `effect-client-wrapper`          | Preserve now; conditional Change required | `.agents/skills/effect-client-wrapper/SKILL.md` already owns named service, typed provider boundary, Config, error, and Layer rules. Add state/lifetime guidance only if provider adapters actually own such state.                                                 |
| Lint plugin/config/tests         | Change required during implementation     | Extend `lint/oxlint-plugin.ts`, `lint/oxlint-plugin.test.ts`, `lint/vitest.config.ts`, and `oxlint.config.ts`; create the exact `lint/oxlint-plugin.integration.test.ts` and `lint/fixtures/effect-native*` owners above without a second runner or plugin package. |
| Boundary/effect checks           | Preserve and reuse                        | `tooling/boundary-audit.ts`, its exact exception owner, and `tsconfig.base.json` already own type-aware provenance and Effect diagnostics. Change only for a demonstrated uncovered invariant.                                                                      |
| Schemas/services/Layers          | Targeted Change required                  | Only named migration targets; preserve decoded boundary types, service identities, safe errors, wire values, state bytes, and explicit live/mock Layers.                                                                                                            |
| Tests/fixtures                   | Change required                           | Deterministic time, AST positive/negative, integration, state concurrency, cardinality, order, and exception-staleness fixtures.                                                                                                                                    |
| Verification/evidence/research   | Preserve now; conditional Change required | `docs/verification/README.md`, `docs/evidence/README.md`, and `docs/research/README.md` change only if a critical journey, retained proof owner, or supporting research route changes; lint fixtures remain code-owned.                                             |
| Standards/operations/runbooks    | Evidenced N/A now                         | `docs/standards/controls.md`, `docs/operations/**`, and `apps/{agent,codex-proxy}/runbooks/**` own automation/operations, but this SPEC authorises no automation or operation. Reclassify only if implementation changes a runtime command or control.              |
| Active/completed execution plans | Preserve now                              | `docs/exec-plans/active/README.md` and `docs/exec-plans/completed/README.md` remain unchanged; create an active plan only after implementation authority and close it only after the terminal audit.                                                                |
| Runtime branch history/evidence  | Preserve                                  | Refresh against its integrated state; do not rewrite completed proof or infer hosted actuality.                                                                                                                                                                     |
| Provider/runbooks/authority      | Evidenced N/A                             | This SPEC grants no provider operation and changes no target-owned operational procedure.                                                                                                                                                                           |
| Frontend/browser/accessibility   | Evidenced N/A                             | Atom is rejected for backend use and no visible React/browser surface changes.                                                                                                                                                                                      |
| Release/version/publication      | Evidenced N/A                             | No tag, package release, publication, deployment, commit, push, or merge.                                                                                                                                                                                           |

## Non-goals

- Do not convert every array to `Chunk`, every object to `HashMap`, every
  optional value to `Option`, or every branch to `Match`.
- Do not ban native `Map`, `Set`, array methods, `if`, `switch`, object spread,
  `undefined`, `typeof`, `_tag`, or explicit `new Date(epoch)` repository-wide.
- Do not adopt Atom or add `@effect-atom` for backend/runtime state.
- Do not combine Refs because they are adjacent; require a shared transition
  invariant and torn-state proof.
- Do not introduce `StateUtils`, `EffectHelpers`, `CollectionCommon`, lint
  wrappers, pass-through services, generic collection transforms, DTO mirrors,
  manual readers, or helper/common/utils directories.
- Do not move provider/framework code out of its owning adapter before a stable
  shared contract has proven consumers.
- Do not change provider requests, webhooks, credentials, persistent keys,
  encoded bytes, TTLs, error tags, service identities, public exports, or
  hosted behaviour merely to satisfy style.
- Do not use raw Promise/timers inside Effect services, but do preserve a named
  host callback boundary when the framework contract requires it.
- Do not claim current upstream beta APIs exist in pinned beta.74.
- Do not modify `origin/codex/eve-runtime-qualification` or rerun its hosted
  qualification.
- Do not deploy, mutate providers, commit, push, merge, release, or implement
  runtime/lint changes in this drafting task.

## Rejected alternatives

| Alternative                                           | Rejection reason                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copy Site's entire Effect plugin/config               | Site's filename taxonomy, frontend scope, provider set, and exception corpus are different; broad rules conflict with Bundjil's type-aware owners. |
| Add an ESLint/custom TypeScript wrapper beside Oxlint | Duplicates the existing plugin/check architecture and adds another lifecycle owner.                                                                |
| Enforce all design guidance with lint                 | Cohesion, semantic collection value, readability, ownership, and pass-through policy require type/data-flow/domain evidence.                       |
| Use only documentation/review                         | Ambient time, async/await escape, bare `tryPromise`, and runtime execution have narrow durable AST invariants worth automating.                    |
| Enable rules before migration                         | Creates a debt baseline or broad suppression pressure and makes current false positives part of policy.                                            |
| Autofix first                                         | Clock, error, Layer, state, and boundary choices change semantics; no proposed transformation is provably safe.                                    |
| Start on the runtime branch                           | Violates exact-main drafting and risks conflicting with active integration work.                                                                   |

## Open questions and upgrade triggers

1. Does the final integrated runtime branch still contain the nested dispatch
   generator and exact-cardinality fixtures cited here?
2. Which `Date.now` tests are genuinely Effect-clock-owned after an exact
   assertion/call-graph review, and which are fixed/live host fixtures?
3. Can the runtime-execution rule use only import-aware AST and exact config
   scopes, or does Bundjil need a small checked owner registry for framework
   callbacks?
4. Does a real provider service acquire replaceable resource state that
   justifies `ScopedRef`, or is ordinary Layer scope sufficient?
5. Does any current consumer require `SubscriptionRef.changes`, or should the
   type remain absent?
6. After a future Effect upgrade, did `Effect.fromOption` gain the current
   upstream custom `onNone` form, did reactivity leave `unstable`, and did
   Stream collection return types change?
7. Do future repeated review findings justify a typed compiler audit for
   non-empty/index or Layer exports? This SPEC does not pre-authorise one.

## Draft acceptance

This artifact is implementation-ready when:

- its sibling JSON parses and every requirement maps to tasks and proof;
- product-spec index lifecycle agrees;
- PRD review has no unresolved blocking finding;
- docs-maintainer records every surface above;
- documentation-only checks pass; and
- the worktree contains no runtime/lint implementation or provider mutation.
