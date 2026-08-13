---
document_type: product-spec
lifecycle: implemented
authority: canonical
owner: bundjil-product-owner
implementation_owner: bundjil-effect-architecture-owner
verification_owner: bundjil-verification-owner
last_reviewed: 2026-08-14
review_trigger: Effect version, language-service diagnostic, Oxlint plugin, runtime-state ownership, timing, collection, or eve-runtime-qualification integration change
task_ledger: effect-native-runtime-patterns-and-lint-enforcement.tasks.json
---

# Effect-native runtime patterns and lint enforcement

## Status and decision

The implementation and terminal audit are complete under
`docs/exec-plans/completed/effect-native-runtime-patterns-and-lint-enforcement.md`.
Cooper's
2026-08-10 delegated authority covers the exact runtime, lint, documentation,
commit, push and merge work in its sibling ledger. Provider and Production
authority remains governed separately by
`automatic-production-and-operational-closeout.md`; repository lint success is
not provider or deployment proof.

Bundjil will strengthen Effect-native code through targeted migrations and four
narrow lint rules:

1. deterministic ambient-time enforcement in Effect-owned source and tests;
2. Promise/`async`/`await` confinement in Effect service code;
3. explicit rejection mapping at `Effect.tryPromise` boundaries; and
4. Effect runtime execution confined to named runtime, adapter, CLI, and test
   boundaries.

The implementation extends Bundjil's existing Oxlint JavaScript plugin while
preserving the language-service diagnostics and boundary audit. It does not
import Site's policy wholesale, add a second lint runner, or create a generic
policy wrapper.

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

No implementation task may rewrite clear working code merely to increase
the count of Effect APIs.

## Exact evidence epoch

| Evidence                    | Exact identity                                                                                                                              | Use and claim limit                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Bundjil implementation base | clean `main`/`origin/main` at `5c3c7db240a7abd9bb57ad560bdd8958af4ea701`; implementation branch `codex/automatic-production-effect-runtime` | Canonical source inventory and starting identity; final proof must name the ending candidate.    |
| Bundjil Effect dependency   | manifest `^4.0.0-beta.100`; lock/install resolve `effect@4.0.0-beta.101` and `@effect/vitest@4.0.0-beta.101`                                | The installed beta.101 API controls implementation until a dependency change reopens review.     |
| Site read-only comparison   | `/Users/cooper/Projects/site`; local `main` `4f98b6c` is behind; inspected `origin/main` `dd5d015879a82630127adfe044e4352deff72332`         | Rule/config source comparison only; Site policy and exceptions are not Bundjil policy.           |
| Eve runtime integration     | runtime/handoff/channel work is merged into current Bundjil main                                                                            | Current merged source, not the retired integration branch, controls every finding and migration. |
| Bundjil lint/runtime tools  | Oxlint `1.61.0`, Effect language service `0.86.6`, Eve `0.29.5`                                                                             | Installed behaviour and fixtures control; package ranges alone are not proof.                    |
| Research date               | 2026-08-10                                                                                                                                  | Provider actuality and the operational ledger remain separate claims.                            |

## Research method and source priority

The investigation:

1. inspected Bundjil's current architecture, READMEs, lint configuration,
   language-service configuration, custom checks, source, tests and merged
   runtime owners;
2. inspected Site's actual rule implementations, config scopes, exceptions,
   unit tests, and installed-Oxlint fixtures read-only;
3. queried Executor Personal DeepWiki against `Effect-TS/effect-smol` for
   discovery; and
4. reconciled every API decision against Bundjil's installed beta.101 source;
   and
5. re-read the merged Eve channel/runtime call graph rather than the retired
   integration branch.

DeepWiki is supporting discovery only. The lock-resolved installed source
controls. Current upstream or Site APIs that beta.101 does not expose are
unresolved upgrade questions, not implementation instructions.

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

| Surface                 | Concrete evidence                          | Finding                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root scripts            | `package.json:42-68`                       | `check:effect-setup`, `check:boundaries`, `check:docs`, `test:lint`, and terminal `verification` already provide the extension path.                                                                                                           |
| Oxlint config           | `oxlint.config.ts`                         | One local JavaScript plugin enables tagged-error plus time, `tryPromise`, and runtime rules in app/package TypeScript, extends ambient-time enforcement to owned tooling, and restricts async confinement to production service/source scopes. |
| Local plugin            | `lint/oxlint-plugin.ts`                    | Six stable `bundjil/*` rules share import-aware tracking and exact path/symbol/count exception staleness without a second runner or autofix.                                                                                                   |
| Effect language service | `tsconfig.base.json:1-19`                  | Existing errors already cover `newPromise`, `nestedEffectGenYield`, `floatingEffect`, global fetch, sync Schema in Effects, unsafe assertions, and related boundary failures.                                                                  |
| Boundary audit          | `tooling/boundary-audit.ts:528-575`        | Type-aware enforcement already rejects raw public semantic primitives and unsafe boundary syntax; new Oxlint rules must not duplicate it.                                                                                                      |
| Architecture            | `docs/architecture/effect-patterns.md`     | Current policy already prefers Effect collections when semantics matter and explicitly permits plain TypeScript glue.                                                                                                                          |
| Verification            | `docs/architecture/testing-and-quality.md` | The repository already distinguishes focused direct proof from the terminal aggregate gate.                                                                                                                                                    |

### Bundjil code exemplars and migration candidates

| Candidate                        | Concrete citation                                                                                                                                                                                                                               | Decision                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cohesive atomic memory state     | `packages/store/src/memory.layer.ts:22-125`                                                                                                                                                                                                     | Preserve as a positive exemplar: one `SynchronizedRef<HashMap<...>>`, Clock-owned expiry, atomic modify, typed absence, and one state invariant.                                                                            |
| Deterministic store tests        | `packages/store/test/atomic-key-value-store.test.ts:120-251`                                                                                                                                                                                    | Preserve as a positive `TestClock.adjust` pattern.                                                                                                                                                                          |
| Clock-owned OAuth runtime        | `packages/codex/src/auth/service.ts:128-168`, `228-447`                                                                                                                                                                                         | Preserve Clock reads; review only the remaining fixed polling sleep against its deadline/lock contract.                                                                                                                     |
| Wall-clock OAuth fixtures        | `packages/codex/test/refresh-capable.test.ts`                                                                                                                                                                                                   | Implemented: named fixed decoded epochs replace host-time defaults while existing TestClock-controlled contention remains deterministic.                                                                                    |
| Other ambient fixture time       | `packages/codex/test/codex-oauth.test.ts`, `packages/codex/test/codex-direct-provider.test.ts`, `packages/codex/test/profile-commit.test.ts`, `packages/codex/test/stored-profile-proof.test.ts`, `apps/codex-proxy/test/proxy-handler.test.ts` | Implemented: profile-validity fixtures use named fixed future epochs; genuine host-boundary proof remains exact and stale-checked.                                                                                          |
| Genuine live process timing      | `apps/codex-proxy/test/prove-preview.test.ts:120-143`, `475-497`                                                                                                                                                                                | Preserve via exact lint scope/exception: child-process deadline proof intentionally observes host time and raw timers.                                                                                                      |
| Policy audit receipt time        | `tooling/*-policy-audit.ts`, `tooling/skill-policy-audit.ts`, `tooling/evals/harness-evaluation-audit.ts`                                                                                                                                       | Implemented: each Effect-owned CLI reads one epoch from `Clock.currentTimeMillis` and formats it only at the receipt boundary; the verification fallback owns a separate Effect-clock path.                                 |
| Test memory map                  | `packages/codex/src/testing/index.ts:167-225`, `228-340`                                                                                                                                                                                        | Review target, not automatic defect. `HashMap` may improve immutable updates and typed absence; native `Map` may remain if JS-key identity and familiar fixture code are clearer.                                           |
| Adjacent independent counters    | `apps/agent/test/channel-runtime.test.ts:90-105`, `230-243`                                                                                                                                                                                     | Preserve unless a shared invariant is proved; build/disposal counters are independently observed test probes.                                                                                                               |
| Adjacent request transcript refs | `packages/codex/test/subscription-login.test.ts:445-466`                                                                                                                                                                                        | Review whether body and content type form one atomic transcript record; no syntax-only lint decision.                                                                                                                       |
| Runtime execution                | `apps/agent/agent/channels/sendblue.ts:1-8`, `apps/agent/agent/channels/photon.ts:1-8`, app scripts, and package scripts                                                                                                                        | Named app/runtime/CLI boundaries are allowed. `apps/agent/agent/tools/workspace_status.ts` and `apps/agent/agent/connections/executor.ts` are explicit audit targets because they execute Effects inside adapter callbacks. |
| Helper sprawl                    | no `helper`, `helpers`, `util`, `utils`, or `common` directories under current `apps`, `packages`, `tooling`, or `lint`                                                                                                                         | Preserve through review and ownership policy; there is no current debt baseline that justifies a name heuristic.                                                                                                            |
| Production domain membership     | `packages/infrastructure/src/adoption-manifest.ts`, `inventory.ts`, `state/preview-state-migration.ts`, `scripts/migrate-state.ts`, and `packages/photon/src/candidate-inventory.ts`                                                            | Implemented: immutable `HashSet` owns eight managed-key, authorized-project, candidate-identity, migration-path, desired-resource, stale-resource, and backup-resource membership/uniqueness operations.                    |
| Ordered diagnostic/test backend  | `packages/infrastructure/src/adoption-manifest.ts` logical-ID Schema check; `packages/codex/src/testing/index.ts`                                                                                                                               | Preserve native collections: the Schema check incrementally owns first-duplicate index paths; the test `Map` is a mutable fixture backend already isolated behind `Ref`.                                                    |

### Merged Eve runtime targets

| Current-main owner                                                                                                   | Decision                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/agent/agent/lib/channel/handoff.ts`                                                                            | Preserve the named service, Effect Clock ownership and test observation seam; no reactive-state conversion is justified.                                                           |
| `apps/agent/agent/lib/channel/dispatch.ts`                                                                           | Implemented: one flat `tryPromise`/decode/handoff Effect preserves acceptance timeout, rejection mapping and sequential handoff semantics.                                         |
| `apps/agent/test/channel-handoff.test.ts`                                                                            | Preserve independent environment/secret observation Refs and the local uniqueness assertion. No state or collection migration is justified.                                        |
| `apps/agent/test/channel-continuity.test.ts`                                                                         | Preserve decoded arrays unless focused proof demonstrates a cardinality defect; a non-empty contract would not prove an exact count.                                               |
| `apps/agent/agent/tools/workspace_status.ts`, `apps/agent/agent/connections/executor.ts`, channel framework adapters | Register only exact framework callbacks that must return Promises or eager values. Keep application execution out of services and require tested disposal for any managed runtime. |

## Research findings

### Deterministic time

Bundjil beta.101 exposes `Clock.currentTimeMillis`; sleeps, timeouts, schedules,
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
mutable value. In beta.101 Layers are lazy, scoped, and memoized by Layer
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

There is no `Effect.onNone` export in Bundjil's beta.101. Its
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
| `Option.match` / `Effect.fromOption` vs `Match` | Use `Option.match` for value branching; beta.101 `Effect.fromOption` only when its error is intentionally translated at the owner.                | Use `Match` for decoded closed unions; use ordinary `if` for clear local sequential/presentation composition.                                                                                                      | No nonexistent `Effect.onNone`; no global `switch` ban.                                                       |
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

| Exact Site rule ID                                            | Implementation invariant                                                                                         | Bundjil classification              | Concrete reason                                                                                                                                                                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `effect/no-ambient-time-or-random`                            | Flags `Date.now`, `Math.random`, and every `new Date` (`effect-rules.js:1428-1471`).                             | Copy/adapt                          | Split time from randomness; allow `new Date(explicitEpoch)`; scope host-time exceptions exactly.                                                                                                                  |
| `effect/no-async-await-promise`                               | Flags async functions, `await`, and `new Promise` except direct Effect Promise-boundary callbacks (`1250-1352`). | Copy/adapt                          | Adds async/await confinement beyond existing `newPromise`; scope only Effect-owned services.                                                                                                                      |
| `effect/no-bare-effect-try-promise`                           | Import-aware flag for non-object `Effect.tryPromise` (`1354-1384`).                                              | Copy/adapt                          | Enforces typed rejection mapping at SDK/host boundaries.                                                                                                                                                          |
| `effect/no-runtime-execution-outside-boundaries`              | Flags `Effect.run*`, `ManagedRuntime.make`, and `BunRuntime.runMain` outside filename conventions (`1168-1217`). | Copy/adapt                          | Prevents nested runtime ownership; Bundjil needs its own exact runtime/adapter/CLI scopes.                                                                                                                        |
| `effect/no-effect-run-in-adapter-without-boundary`            | Similar runtime-execution check with a second filename policy (`1219-1248`).                                     | Reject duplicate                    | One Bundjil rule and one owner registry are sufficient.                                                                                                                                                           |
| `effect/no-host-api-in-service`                               | Regex-scoped service filenames and host import list with layer/runtime exceptions (`1009-1051`).                 | Documentation/review-only initially | Import ownership is valuable, but Site's provider list and filename taxonomy do not map to Bundjil; collect corpus before adding a rule.                                                                          |
| `effect/no-unknown-service-contract`                          | Flags `unknown` in interface/type signatures in service files (`645-697`).                                       | Existing rule sufficient            | Bundjil's type-aware boundary audit already covers exported raw contracts and exact exceptions.                                                                                                                   |
| `effect/no-unknown-tagged-error-payload`                      | Flags unknown payload members in tagged errors.                                                                  | Existing rule sufficient            | Boundary audit plus Schema tagged-error policy and tagged-error-name rule own this failure.                                                                                                                       |
| `effect/no-schema-decoder-outside-ingress`                    | Import-aware decode call outside configured ingress files.                                                       | Existing rule sufficient            | Bundjil's type-aware provenance audit owns exact codecs and exceptions; filename-only duplication would conflict.                                                                                                 |
| `effect/no-schema-encoder-outside-egress`                     | Import-aware encode call outside configured egress files.                                                        | Existing rule sufficient            | Same provenance owner.                                                                                                                                                                                            |
| `effect/no-throwing-schema-sync-codec`                        | Flags throwing sync Schema codecs.                                                                               | Existing rule sufficient            | Effect language service `schemaSyncInEffect` plus boundary audit and existing sync-codec review cover production.                                                                                                 |
| `effect/no-non-throwing-schema-sync-decoder-outside-consumer` | Restricts remaining sync decoders by filename.                                                                   | Documentation/review-only           | Tests and decoded constant construction require context; no new failure evidence.                                                                                                                                 |
| `effect/no-json-parse-stringify`                              | Flags direct JSON parse/stringify.                                                                               | Existing rule sufficient            | Effect language service `preferSchemaOverJson` and boundary provenance audit already own it.                                                                                                                      |
| `effect/no-instanceof`                                        | Flags every `instanceof`.                                                                                        | Existing rule sufficient            | Existing boundary policy forbids it for policy; a global syntactic ban would also catch host interoperability.                                                                                                    |
| `effect/no-in-operator`                                       | Flags every `in`.                                                                                                | Reject                              | Too broad; Schema decoding does not replace ordinary object/prototype operations everywhere.                                                                                                                      |
| `effect/no-typeof`                                            | Flags every `typeof`.                                                                                            | Reject                              | Too broad and unrelated to decoded ownership in many host/tooling paths.                                                                                                                                          |
| `effect/no-undefined-comparison`                              | Flags direct undefined comparisons.                                                                              | Reject                              | Decoded optional fields legitimately use undefined; Option is not mandatory presentation syntax.                                                                                                                  |
| `effect/no-nullish-comparison`                                | Flags nullish equality checks.                                                                                   | Reject                              | External protocols and decoded optional composition require exact local handling.                                                                                                                                 |
| `effect/no-nullable-boundary-leak`                            | Flags raw null properties and `Option.getOrNull`, except tests (`957-1007`).                                     | Documentation/review-only           | Boundary Schemas, not a null syntax ban, own protocol representation.                                                                                                                                             |
| `effect/no-conditional-object-spread`                         | Flags conditional object spread.                                                                                 | Reject                              | Bundjil uses clear optional encoded-request composition; Schema owns validation.                                                                                                                                  |
| `effect/no-manual-tag`                                        | Flags every object-literal `_tag` (`171-200`).                                                                   | Reject                              | Bundjil constructs decoded Schema-owned tagged records directly; banning construction would add wrappers.                                                                                                         |
| `effect/no-throw`                                             | Flags every throw statement.                                                                                     | Documentation/review-only           | Effect services forbid throws, but host/library callbacks and defects need scoped evidence before lint.                                                                                                           |
| `effect/no-switch`                                            | Flags every switch (`1473-1493`).                                                                                | Reject                              | `Match` is preferred for decoded unions; ordinary validated algorithms are not prohibited.                                                                                                                        |
| `effect/no-result-exit-reencoding`                            | Flags local result-like object tags.                                                                             | Existing rule sufficient            | Tagged Schema/Result/Exit policy and boundary review own the semantic failure; `_tag` heuristics would conflict.                                                                                                  |
| `effect/no-native-array-methods`                              | Flags native `.map`, `.filter`, and related methods outside Effect namespace (`699-817`).                        | Reject                              | Arrays are a first-class v4 result and remain correct for bounded sequences.                                                                                                                                      |
| `effect/no-effect-array-data-first`                           | Enforces curried/pipe-first collection calls.                                                                    | Reject                              | Style-only; data-first is a supported API and can be clearer locally.                                                                                                                                             |
| `effect/no-native-collections`                                | Flags `new Map/Set/WeakMap/WeakSet` (`921-955`).                                                                 | Adapt as exact review gate          | Constructors alone do not prove a defect, but two successive missed domain sets justify fail-closed review with occurrence-checked ordered-diagnostic/test-backend exceptions rather than a universal conversion. |
| `effect/no-nested-wrapper-calls`                              | Flags nested call arguments and mapper-name heuristics (`819-888`).                                              | Reject                              | Call nesting and names do not prove wrapper sprawl or obscure data flow.                                                                                                                                          |
| `effect/no-route-loader-mappers`                              | Flags mapper-name arguments (`890-919`).                                                                         | Reject                              | Site route policy has no Bundjil owner; false positives are name-based.                                                                                                                                           |
| `effect/no-layer-exports-in-service-files`                    | Restricts Layer exports by filename.                                                                             | Documentation/review-only           | Bundjil already separates most service/layer owners, but exact package public surfaces need an import-graph audit before lint.                                                                                    |
| `effect/no-console-outside-runtime`                           | Flags console by file scope.                                                                                     | Existing rule sufficient            | Existing logging and app-boundary review is adequate; no concrete missed failure in this slice.                                                                                                                   |
| `effect/no-process-boundary-outside-config`                   | Flags process environment access outside config scopes.                                                          | Existing rule sufficient            | Effect language-service `processEnv` and `processEnvInEffect` are already errors.                                                                                                                                 |
| `effect/no-effect-test-global-mix`                            | Detects mixing Effect and ordinary Vitest globals.                                                               | Documentation/review-only           | Useful but outside this SPEC's timing/state failure set; reconsider separately with current test corpus.                                                                                                          |

## Proposed lint contracts

All new rules live in `lint/oxlint-plugin.ts`, retain `bundjil/*` IDs, use
import-aware matching where an Effect API is involved, have direct visitor unit
tests, and have positive/negative installed-Oxlint fixtures. No rule is enabled
until its migration task has classified every current finding.

| Proposed rule                                   | AST-detectable invariant                                                                                                                                                                                                                                                                                                                                                                                                                  | Ownership and scope                                                                                                                                             | Positive and negative fixtures                                                                                                                                                                                                                                 | Migration and autofix                                                                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundjil/no-ambient-time-in-effect`             | Flag `Date.now()`, zero-argument `new Date()`, global or imported `setTimeout`/`setInterval`, and `Bun.sleep` in configured Effect-owned production/test/tooling scopes; in `@effect/vitest` tests also flag exact `TestClock.withLive` time escapes unless the file is a registered host-boundary proof. Do not flag `new Date(explicitEpoch)`, fixed numeric fixtures, `Clock.currentTimeMillis`, `Effect.sleep`, timeout, or Schedule. | App/package Effect source, owned `tooling/**`, and `@effect/vitest` tests; exact path/symbol exceptions for subprocess/live-host proof.                         | Negative: Date.now fixture, zero-arg Date, global and `node:timers`/`node:timers/promises` timer aliases, `Bun.sleep`, live-clock escape. Positive: Clock read, fork/adjust/join, explicit-epoch Date formatting, fixed epoch, registered subprocess boundary. | Replace ambient fixture values with fixed decoded epochs or Clock/TestClock programs. No autofix: adding `yield*`, selecting an epoch, or changing clock ownership is semantic. |
| `bundjil/no-async-await-in-effect-service`      | Flag `async` functions and `await` in configured Effect service/source files unless the function is the direct callback of `Effect.promise`, or the `try` callback of object-form `Effect.tryPromise`; flag `new Promise` as defence in depth.                                                                                                                                                                                            | `packages/**/src` and Effect-owned app service modules; explicit host/runtime/CLI exclusions. Language-service `newPromise` remains the type-aware owner.       | Negative: async service operation, nested await, new Promise, aliased local async callback outside boundary. Positive: flat Effect.gen, direct `Effect.tryPromise({ try: async, catch })`, direct `Effect.promise`, external host adapter exclusion.           | Inline Effects or move Promise ingress to the live adapter. No autofix: error mapping, laziness, cancellation, and owner selection are semantic.                                |
| `bundjil/require-try-promise-catch`             | Import-aware `Effect.tryPromise` or `effect/Effect` direct import must receive one object expression containing both `try` and `catch`; shorthand function overload and missing catch fail.                                                                                                                                                                                                                                               | All app/package production TypeScript; tests included when they model a fallible boundary.                                                                      | Negative: namespace/direct/aliased bare function overload, object missing catch. Positive: object with try/catch, unrelated local `tryPromise`, `Effect.promise` for documented infallible boundary.                                                           | Add canonical safe tagged error mapping at the adapter. No autofix: a tool cannot invent the owning error or safe diagnostic.                                                   |
| `bundjil/no-runtime-execution-outside-boundary` | Import-aware calls to `Effect.runPromise`, `runPromiseExit`, `runFork`, `runSync`, `runSyncExit`, `ManagedRuntime.make`, and `BunRuntime.runMain` fail outside exact runtime/main/server/CLI/script/test adapter scopes.                                                                                                                                                                                                                  | App entrypoints, named channel/framework adapters, scripts, and tests are allowed by configured globs or exact owner registry; package/service logic is denied. | Negative: service/module `runPromise`, nested runtime creation, aliased direct import. Positive: app main, package CLI script, test-owned runtime, named channel adapter, unrelated method name.                                                               | Return Effect values or inject a Layer/ManagedRuntime owned by the boundary. No autofix: moving execution changes lifetime and error handling.                                  |
| `bundjil/no-layer-or-die-in-service`            | Import-aware `Layer.orDie` calls fail in configured owned source.                                                                                                                                                                                                                                                                                                                                                                         | App service/package production source and infrastructure operator scripts; exact root framework composition files remain outside the enabled scope.             | Negative: namespace, aliased direct import, and `effect/Layer` namespace calls. Positive: typed Layer recovery and unrelated local `orDie`. Installed negative fixture proves the stable rule ID.                                                              | Preserve the typed Layer construction error and move any unavoidable defect conversion to the exact documented host-framework composition edge. No autofix.                     |
| `bundjil/no-primitive-effect-failure`           | Import-aware direct primitive construction through `Effect.fail`, a primitive-returning `Effect.failSync` callback, or a primitive-returning `Effect.mapError` callback fails, including aliases, static templates and transparent TypeScript assertions.                                                                                                                                                                                 | App service/package production source and every infrastructure operator script; final CLI renderers alone retain bounded process-exit classification.           | Negative: string/number fail, static-template failSync, asserted literal mapError, namespace/direct/aliased imports. Positive: owner error instance and unrelated local `fail` identifier. Installed proof also creates an exact script-scope probe.           | Replace the primitive with an owner-named tagged error and bounded reason Schema. No autofix: the rule cannot invent ownership or error vocabulary.                             |
| `bundjil/no-exported-effect-gen-function`       | An exported arrow or function declaration directly returning import-aware `Effect.gen`, including an immediate `.pipe(...)`, fails. Top-level Effect values and local one-use generators remain valid.                                                                                                                                                                                                                                    | Owned app/package runtime and script source.                                                                                                                    | Negative: namespace/aliased/direct-import exported functions. Positive: named `Effect.fn`, `Effect.fnUntraced`, top-level Effect value, local generator and unrelated identifier. Installed fixtures prove the stable rule ID.                                 | Classify trace ownership, then use named `Effect.fn` for semantic work or `Effect.fnUntraced` for a leaf/delegate whose called service owns the trace. No autofix.              |

### False-positive matrix

| Rule               | Plausible false positive                                                                                                     | Required response                                                                                                                                   | Broad suppression forbidden                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| ambient time       | Process deadline, child-process timeout, benchmark, certificate/system-clock integration, explicit host response-time proof. | Keep direct host-time proof in a named boundary test with an exact registered owner; semantic command timestamps and durations use Clock/DateTime.  | No `**/test/**` or app-wide disable.                                        |
| async/await        | SDK callback that must return a Promise, framework lifecycle, CLI top-level boundary.                                        | Move or retain in the live/framework adapter; direct Effect Promise boundary callback is accepted.                                                  | No package-wide disable or async helper wrapper.                            |
| tryPromise catch   | A Promise is documented never to reject.                                                                                     | Use `Effect.promise` and document the invariant at the boundary; otherwise map a safe tagged error.                                                 | No dummy `catch: (error) => error`, unknown payload, or defect erasure.     |
| runtime execution  | Framework callback cannot return Effect and must bridge through a module-scoped ManagedRuntime.                              | Register the exact adapter symbol, Layer owner, disposal path, and test; retain runtime execution there.                                            | No generic `adapter/**` wildcard without exact lifecycle ownership.         |
| Layer defect       | A framework API requires `Layer<..., never, ...>` at its composition root.                                                   | Keep `Layer.orDie` at that exact host edge, document the type constraint beside it, and retain a typed reusable live Layer for all other consumers. | No package/source/script suppression or reusable live Layer defect erasure. |
| primitive failure  | A final CLI adapter must retain a bounded process-exit classification.                                                       | Keep the command Effect owner-tagged and collapse only at the final renderer; prove the exit and output with a pre-provider subprocess fixture.     | No primitive internal error, generic shared command error, or suppression.  |
| exported generator | A stable public accessor delegates to an already named service operation.                                                    | Keep the accessor only when a current consumer/public boundary justifies it and use `Effect.fnUntraced`; otherwise remove it.                       | No broad source exclusion or cosmetic `Effect.fn` span duplication.         |

The exception registry may reuse the exact file/symbol/reason/staleness shape of
Bundjil's boundary exceptions, but must remain owned by the lint rule module or
one root lint-policy file. It must not become a generic exemption framework.

### Lint fixture lifecycle

| Artifact                                                                                     | Lifecycle           | Owner and required coverage                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint/oxlint-plugin.test.ts`                                                                 | Update              | Retain `bundjil/tagged-error-name` RuleTester coverage and add visitor/RuleTester positive and negative cases for every new rule, import alias, unrelated identifier, and exception branch. |
| `lint/oxlint-plugin.integration.test.ts`                                                     | Create              | Spawn the installed Oxlint binary against the exact fixture config and assert stable diagnostic IDs, non-zero negative exit, and zero-diagnostic positive exit.                             |
| `lint/fixtures/effect-native.config.json`                                                    | Create, then update | Load the repository plugin and enable the original four rules plus evidence-backed corrections, including exported-generator trace ownership, against the fixture files.                    |
| `lint/fixtures/effect-native-positive.ts` and `lint/fixtures/effect-native-positive.test.ts` | Create              | Cover Clock/TestClock, explicit epoch formatting, object-form `tryPromise`, Effect-returning service flow, and named runtime/test boundaries.                                               |
| `lint/fixtures/effect-native-negative.ts` and `lint/fixtures/effect-native-negative.test.ts` | Create              | Cover each exact AST invariant, namespace/direct/aliased imports, global/imported timers, `Bun.sleep`, bare/missing-catch `tryPromise`, and misplaced runtime execution.                    |
| `lint/vitest.config.ts`                                                                      | Update              | Discover the existing unit test and new installed-plugin integration test only; no broad repository test discovery.                                                                         |
| Existing boundary, Effect-language-service, and package fixtures                             | Retain              | They remain the compatibility owners for type-aware boundary provenance, nested generators, Promise construction, provider wires, persistence bytes, and state behaviour.                   |
| Obsolete exceptions/fixtures                                                                 | Retire when stale   | Removal requires the staleness test and all positive/negative coverage to remain; no fixture is deleted merely to make the rule pass.                                                       |

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
- no universal native collection conversion or array-method ban; direct native
  constructors instead require an exact reviewed exception;
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

| Finding                                                                                     | Evidence                                                                                                                                  | Accepted decision                                                                                                                                              | Owning requirements                               | Owning tasks                                                                                              |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ENP-FND-001` — Effect-clock tests still read ambient host time                             | `packages/codex/test/refresh-capable.test.ts:1-3`, `47-97`, and `217`; related candidates in the current-state table                      | Add the narrow time/timer rule and migrate only tests whose assertions are Clock-owned; preserve exact host-process proof.                                     | `ENP-REQ-002`, `ENP-REQ-006`, `ENP-REQ-007`       | `add-narrow-lint-rules-disabled`, `migrate-targeted-effect-patterns`                                      |
| `ENP-FND-002` — Promise ingress has a durable AST boundary beyond existing type diagnostics | Site `effect-rules.js:1250-1384`; Bundjil has `newPromise` but no async/await or bare-`tryPromise` custom rule                            | Add scoped async/await confinement and object-form `tryPromise` with safe catch; retain framework Promise owners.                                              | `ENP-REQ-001`, `ENP-REQ-005`, `ENP-REQ-006`       | `add-narrow-lint-rules-disabled`, `migrate-targeted-effect-patterns`                                      |
| `ENP-FND-003` — Runtime execution ownership is documented but not locally linted            | Current `run*`/`ManagedRuntime` inventory and Site `effect-rules.js:1168-1248`                                                            | Add one import-aware Bundjil rule with exact runtime/CLI/test/framework owners; reject Site's duplicate second rule.                                           | `ENP-REQ-005`, `ENP-REQ-006`, `ENP-REQ-007`       | `refresh-integrated-inventory`, `add-narrow-lint-rules-disabled`, `migrate-targeted-effect-patterns`      |
| `ENP-FND-004` — State/collection syntax does not prove domain semantics                     | Store memory positive exemplar, Codex test Map, adjacent independent counter/observation Refs, and exact-cardinality branch fixture       | Use transition/semantic decision records and focused proof; do not add adjacency/native-collection/index/helper-name lint.                                     | `ENP-REQ-003`, `ENP-REQ-004`, `ENP-REQ-007`       | `refresh-integrated-inventory`, `review-state-and-collection-targets`                                     |
| `ENP-FND-005` — Site's strict plugin is not a portable Bundjil baseline                     | Site's 33 exported IDs at `effect-rules.js:1552-1594`, broad base scope at `oxlint.config.ts:15-65`, and many path exceptions             | Copy/adapt four rules, reuse installed-plugin fixture design, and classify every other rule explicitly.                                                        | `ENP-REQ-006`, `ENP-REQ-010`                      | `refresh-integrated-inventory`, `add-narrow-lint-rules-disabled`                                          |
| `ENP-FND-006` — Effect v4 beta APIs drift                                                   | Installed beta.101, package ranges, current upstream and Site can differ                                                                  | Pin implementation decisions to installed beta.101 and reopen research on dependency change.                                                                   | `ENP-REQ-003`, `ENP-REQ-004`, `ENP-REQ-009`       | `refresh-integrated-inventory`, `review-state-and-collection-targets`, `enable-rules-and-reconcile-docs`  |
| `ENP-FND-007` — The Eve runtime is now merged                                               | Current-main handoff, dispatch, runtime adapters and tests cited above                                                                    | Use merged source, preserve completed hosted proof, and migrate only current direct findings.                                                                  | `ENP-REQ-008`, `ENP-REQ-010`                      | `refresh-integrated-inventory`, `migrate-targeted-effect-patterns`, `review-state-and-collection-targets` |
| `ENP-FND-008` — Error channels retained raw defects                                         | Installed beta.101 `Schema.Defect` encoded arbitrary JSON in twelve public errors; adoption scope used `Effect.die` after validation      | Remove public causes, enforce the boundary, and keep adoption cardinality failure in its capability-owned typed channel.                                       | `ENP-REQ-001`, `ENP-REQ-007`, `ENP-REQ-009`–`011` | `close-public-error-cause-boundary`                                                                       |
| `ENP-FND-010` — Exported reusable generators hid trace ownership                            | 31 exported app/package functions directly returned `Effect.gen`; installed beta.101 distinguishes traced and untraced reusable functions | Classify semantic trace owners versus delegates, migrate without changing exports, and enforce the direct exported-generator shape with one import-aware rule. | `ENP-REQ-005`–`011`                               | `close-exported-effect-generator-ownership`                                                               |

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

The original four proposed rules and any later finding-backed correction extend
Bundjil's existing plugin and command path. Every rule has one AST invariant,
owner/scope, positive and negative unit and
installed-plugin fixtures, current-finding classification, false-positive
matrix, migration plan, exact exceptions with staleness proof, and no unsafe
autofix.

### `ENP-REQ-007` — targeted migrations

Implementation migrates only current findings mapped to a concrete
failure mode. It preserves clear exemplars, genuine host boundaries, provider
wire behaviour, persistent bytes/keys/TTLs, error tags, service identities, and
test intent.

### `ENP-REQ-008` — integrated runtime sequencing

Implementation uses the exact merged source, refreshes every citation/finding,
and reviews handoff timing, nested flow, observation Refs, exact-cardinality
fixtures and Layer sharing without changing completed hosted proof by
assumption.

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

After all implementation and operational-ledger tasks are complete, run one
mandatory audit in this order:

1. Effect contracts, Schemas, branded boundaries, errors, Config and Layers;
2. call graph, package/file ownership, exports, helper sprawl and dead paths;
3. behaviour, replay/idempotency, workflows, tests, lint, typecheck and failure
   paths;
4. docs, SPECs, task ledgers, runbooks, authority registers and proof
   consistency; and
5. provider/deployment/secret safety, rollback, observability, live evidence
   and explicit non-claims.

A finding reopens its owning task, invalidates stale evidence, and requires the
affected focused proof plus a new terminal audit after correction. Do not run
this five-pass audit after each task.

## Requirement-to-proof crosswalk

The sibling ledger is the full machine-readable owner.

| Requirement   | Direct observable and expected postcondition                                                                      | False green rejected                                             | Focused procedure / evidence owner                                           | Limitation                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `ENP-REQ-001` | Boundary audit and focused adapter tests show one owning decode/encode and decoded service types.                 | Typecheck or lint alone.                                         | `bun run check:boundaries`; affected provider tests; boundary owner receipt. | Repository proof, not provider actuality.                  |
| `ENP-REQ-002` | TestClock attempt/time/deadline traces complete without live waiting; exact host exceptions remain bounded.       | Fast CI, fixed sleep, or a Date comparison that happens to pass. | Lint fixtures and affected Clock tests; test owner receipt.                  | One tested schedule and virtual clock.                     |
| `ENP-REQ-003` | Transition tables and concurrency tests show atomic cohesive state and independent owners remain separate.        | Counting Refs or passing sequential tests.                       | State-owner focused tests; Layer/transition receipt.                         | In-process state is not durable.                           |
| `ENP-REQ-004` | Each migrated collection records the semantic property and order/absence/cardinality proof.                       | Fewer native constructors.                                       | Package tests and migration decision receipt.                                | No universal performance claim.                            |
| `ENP-REQ-005` | Language service and focused call-graph review show no nested runtime/Effect execution or wrapper-only operation. | Pretty pipelines or lower line count.                            | `check:effect-setup`, lint rule, affected service tests.                     | Readability retains reviewer judgment.                     |
| `ENP-REQ-006` | Each rule's unit and installed-Oxlint fixtures reject/accept exact syntax and stale exceptions fail.              | Testing visitor objects only or linting current source only.     | `bun run test:lint`; lint fixture receipt.                                   | AST rules are intentionally not type/data-flow complete.   |
| `ENP-REQ-007` | Finding inventory maps every edit to a named failure and preserves recorded wire/state fixtures.                  | Bulk formatter or codemod success.                               | Targeted package tests and compatibility receipt.                            | Untouched code is not re-proved.                           |
| `ENP-REQ-008` | Refreshed merged-base inventory names exact final SHA and resolves each branch target.                            | Applying old branch line numbers.                                | Git identity/read-only diff plus affected agent checks.                      | Does not re-qualify hosted runtime.                        |
| `ENP-REQ-009` | Docs-maintainer ledger has Change required, Preserve, or evidenced N/A for every surface and policy checks pass.  | Updating only AGENTS or only a README.                           | `bun run check:docs`, `bun run check:skills`; docs receipt.                  | Docs checks prove consistency, not runtime.                |
| `ENP-REQ-010` | Ledger contains complete proof fields for every requirement and rule.                                             | Broad verification alone.                                        | PRD review and task-ledger parse.                                            | Traceability is not behaviour.                             |
| `ENP-REQ-011` | Focused commands and final `bun run verification` pass on one exact candidate.                                    | Old green output or partial workspace checks.                    | Verification owner terminal receipt.                                         | No external/provider claim.                                |
| `ENP-REQ-012` | One ordered five-pass receipt is newer than all dependency evidence; findings reopen owners.                      | Per-task ritual or pre-implementation review.                    | Terminal audit task and closeout receipt.                                    | Missing live or replay oracles remain explicit non-claims. |

## Phased implementation and sequencing

The sibling ledger owns exact dependencies. The implementation sequence is:

1. refresh the inventory on the actual integrated base and freeze rule
   invariants, scopes, exceptions, and fixtures;
2. add the four disabled rules and their unit plus installed-Oxlint fixtures;
3. classify current findings and migrate deterministic timing/Promise/runtime
   boundaries narrowly;
4. review state and collection candidates with transition/semantic evidence,
   changing only accepted targets;
5. enable rules at error after zero unexplained findings and reconcile durable
   docs/skills;
6. close any iterative audit findings at their durable contract and
   enforcement owners;
7. run focused package proof and terminal repository verification; and
8. run the one terminal five-pass implementation audit.

The completed owner is
`docs/exec-plans/completed/effect-native-runtime-patterns-and-lint-enforcement.md`.
Its accepted terminal audit depends on the operational closeout ledger's
explicit terminal dispositions.

## Closed error-channel correction

The 2026-08-13 iterative audit inspected the installed
`effect@4.0.0-beta.101` `Schema.Defect` implementation. Its encoded side is
arbitrary JSON and can retain an `Error` message and nested cause, so it is not
a safe exported diagnostic field. Twelve exported Eve, Codex, and proxy tagged
errors contradicted the existing no-public-raw-cause policy.

The correction removes only those public `cause` fields and their constructor
inputs. Existing tags, operation and boundary discriminants, bounded messages,
status, subject/profile identity, and refresh-lock timing diagnostics remain.
The private Upstash provider error still captures its SDK rejection only long
enough to map it to the existing safe public persistence error.

The same pass found one `Effect.die` after an exact Photon project cardinality
check. Although the branch was unreachable under the preceding condition, it
escaped the operation's declared `AdoptionManifestBuildError` channel. It now
returns that capability-owned typed failure, preserving fail-closed behavior if
later control flow changes invalidate the current narrowing argument.

The existing provenance audit now owns `public-raw-cause` and rejects required,
optional, or renamed `Schema.Defect` fields in exported Schema structures. Its
three negative fixtures add no exception. Focused proof passed Eve 7, Codex 115,
codex-proxy 41, and boundary 124 tests. The first direct proxy run consumed a
stale built Codex package and failed at the old required cause field; rebuilding
`@bundjil/codex` made all 41 proxy tests pass. Root verification remains the
candidate gate and no provider request or deployment occurred.

The subsequent operator-observability pass found one private staged-refresh
proof error that retained the Effect HTTP rejection as `unknown`. Its renderer
already emitted only `{"status":"blocked"}`, so no leak was observed, but
secret-negative behavior depended on that later renderer. The error now carries
only its tag. The existing boundary audit adds `operator-raw-cause`, which
rejects arbitrary unknown fields on script-local `Data.TaggedError` classes and
accepts bounded script errors plus immediate private adapter translation. Two
direct fixtures raise the boundary suite to 126 tests without an exception.
The private Upstash SDK error remains unchanged because its cause is confined to
the adapter and immediately collapsed into the existing safe public persistence
errors.

The next exported-contract pass found the only remaining exported production
`Data.TaggedError`: `PreviewStateMigrationError`. It already carried a bounded
reason and message, but it had no Schema-owned encoded contract and its optional
counts were raw numbers. The error now uses `Schema.TaggedErrorClass`; both
counts use the branded `PreviewStateMigrationCount` Schema and are encoded only
as non-negative integers. The package root exports the count codec alongside
the existing migration contract. A direct encode/decode test preserves the
exact tag, reason, message, and optional counts.

The existing provenance audit adds `public-data-tagged-error` and rejects any
future exported `Data.TaggedError` while preserving private adapter and bounded
operator errors. One negative fixture raises the boundary suite to 127 tests
without an exception. This changes no migration state byte, provider command,
service operation, Layer, rollback path, or runbook.

The following field-provenance pass found that five public error families could
bypass `inline-string-schema` by passing a shared object containing
`Schema.NonEmptyString` to `Schema.TaggedErrorClass`. Synthetic infrastructure,
Vercel read, Vercel Preview configuration, Vercel stable-environment, and Photon
management errors now each use one owner-named diagnostic-message Schema bounded
to 300 characters. These messages remain ordinary encoded strings: they are
human-safe diagnostics, not identities used for routing, equality, lookup, or
persistence, so nominal branding and roughly 150 mechanical `.make` calls would
add ceremony without a semantic distinction.

The existing boundary audit now resolves local and imported identifier
arguments to their object-literal declaration before checking fields. Direct
same-file and cross-file shared-object fixtures raise the boundary suite to 129
tests. Focused infrastructure and Photon suites preserve all behavior, and no
provider wire Schema or opaque state field was reclassified as a domain value.

A subsequent concurrency pass found the sole production `Promise.all` inside
the Sendblue Web Crypto verifier. The private adapter now wraps each Web Crypto
Promise separately, maps every rejection to the existing closed authentication
error, runs only the independent key imports with explicit `Effect.all`
concurrency, and keeps signing and verification linear. The boundary audit now
rejects `Promise.all` and `Promise.race` in owned production source with no
exception; direct fixtures raise the boundary suite to 131 tests. A rejected
Web Crypto import proves the exact encoded safe error and no raw-cause leak.

The redaction pass then found 29 reveals nested inside Effectful Schema
decoders across Codex proxy config, OAuth/session/profile construction,
refresh-lock persistence, cipher-key conversion, proof config, and the
infrastructure migration leak scanner. Internal composition now passes decoded
`Redacted` values to the owning Schema `.makeEffect` constructor so Type-side
validation remains in the typed Effect channel. Actual representation changes use the owning
Schema encoder immediately before the crypto or persistence boundary, and the
leak scanner validates the existing redacted value directly. The boundary
audit rejects every reveal nested inside `Schema.decodeEffect` or
`Schema.decodeUnknownEffect` while accepting an immediate outbound-header
reveal; direct fixtures raise the suite to 133 tests without an exception or
behavioral contract change.

The following randomness pass found two non-cryptographic identity generators
using ambient `globalThis.crypto.randomUUID`: Codex credential revisions and
refresh-lock owners. Both now draw two safe integers from Effect's fiber-local
`Random` service, retain owner-specific Schema validation/redaction, and can be
replayed with `Random.withSeed` in tests. PKCE material and AES-GCM IVs continue
to use Web Crypto because they are cryptographic boundaries, not test identity
generation. `ambient-random-identity` rejects `Math.random` and direct global
UUID generation; two negative fixtures raise boundary proof to 135 tests
without an exception.

The next state-ownership pass found that automatic Production held proxy and
agent rollback eligibility in two closure-mutated booleans across provider
Effects and the exit finalizer. Both fields share one operation lifetime, one
compensation invariant and one finalizer snapshot, so they now live in one
immutable `Ref` value. Each field becomes eligible before its potentially
outcome-uncertain promotion call, and the uninterruptible finalizer reads one
snapshot before restoring agent then proxy. Existing deterministic fixtures
continue to prove proxy-only, reverse-order, interruption, defect and
rollback-failure behavior. No broad mutable-state lint rule is admitted because
syntax alone cannot distinguish local algorithms from cross-Effect state.

The subsequent stable-adoption pass found a count and two native sets mutated
inside `Effect.forEach` callbacks, then consumed as one exact manifest
invariant. Each callback now returns either no observation or one immutable
managed-binding observation. The caller derives an immutable Effect `HashSet`
for projects and keys and checks exact cardinality plus subset semantics after
the traversal. A duplicate-key fixture preserves distinct logical and physical
identities so it reaches this validator rather than failing the earlier
manifest Schema. Local parser, byte-copy, single-fiber sequential pagination
and host-callback mutation remain unchanged because their state is not captured
across traversal callbacks, concurrent work, or a later finalizer.

The next domain-collection pass corrected an omission in the original decision
inventory. Seven production sets perform immutable membership or uniqueness
algebra over managed Photon keys, authorized Vercel projects, Photon candidate
identities, desired/stale migration resources, and backup resources. They now
use installed Effect `HashSet.fromIterable`, `size`, and `has`. A later fresh
audit found an eighth omitted owner: uniqueness across the four branded state
migration paths. It now uses the same installed `HashSet` cardinality API.

Because two successive source audits missed domain-native sets, review alone
is no longer the accepted control. `bundjil/no-unregistered-native-collection`
rejects direct native constructors across owned app/package runtime and script
source. The ordered manifest Schema's one incremental `Set` and the Codex
test-memory backend's four `Map` constructors are exact occurrence-checked
exceptions; they fail lint if removed, expanded, or moved. This remains a
review gate rather than a universal collection conversion rule.

## Focused verification commands

During implementation, use the smallest affected subset first:

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

`bun run verification` is the mandatory implementation terminal gate. It does
not replace focused rule, migration, provider, deployment or channel proof.

### Drift execution identity correction

The iterative boundary audit found that report-only infrastructure drift
described its reusable protected-environment authority JSON as a one-run
envelope, while its encoded report retained only source SHA and authority
fingerprint. That could not prove which GitHub repository run/attempt produced
the artifact or which decoded adoption manifest it observed.

The corrected boundary keeps the authority JSON as static, fingerprinted
read-only policy custody. The host workflow constructs an exact-repository
`github-actions:crcorbett/bundjil:<run-id>:<attempt>` value; Effect
`Config.schema` decodes it into the branded
`InfrastructureDriftRunIdentity`. The already-validated adoption command owns
the decoded `AdoptionManifestDigest`. The report and bounded receipt retain
that dynamic identity, exact source SHA, static authority fingerprint, and
manifest digest. The existing authority policy rejects removal of the dynamic
workflow binding.

This decision uses installed `effect@4.0.0-beta.101` `Schema` branding/checks
and `Config.schema`, with primary v4 comparison revision
`1caab3cc30f626efbf15e59d74f539a487e5c85c`; Alchemy remains pinned at
`2.0.0-beta.64`. It adds no wrapper, helper, service, Layer, provider operation,
credential, alternate drift engine, or hosted-success claim.

### Operator Layer acquisition correction

The post-task audit reproduced a false green in the operator-command fixture:
synthetic R2 credentials allowed the foreground guard to pass, but absent R2
configuration caused the reusable state Layer's `Layer.orDie` to terminate the
fiber before the command renderer could emit its bounded result. Installed
Effect `4.0.0-beta.101` confirms that `Effect.provide` adds a Layer's typed
construction error to the Effect error channel, while `Layer.orDie` converts
that failure into a defect.

The correction keeps the R2 live Layer fallible, provides complete command
runtimes inside the final catch or `Effect.exit`, and maps adoption setup
failure to its existing `configuration-invalid` reason. Only the three root
Alchemy composition files retain `Layer.orDie`, because Alchemy
`2.0.0-beta.64` requires `Layer<State, never, StackServices>`; the exact host
constraint is documented beside each call. A narrow import-aware lint rule and
real-entrypoint missing-configuration fixtures now prevent the original false
green. No provider transport, state read, mutation, credential change,
deployment, or channel operation is part of this proof.

### Preview drift command output correction

A subsequent real-entrypoint probe found that the Preview configuration drift
command was the only infrastructure operator command whose negative fixture
asserted merely a nonzero exit. Missing authority flowed into
`BunRuntime.runMain`, whose installed Effect v4 reporter printed the tagged
authority error, absolute source paths, and stack frames. The operation now
returns a small Schema-owned completion receipt, while one final `Effect.exit`
captures authority, Config, Layer, provider operation, readback, and receipt
encoding. The process adapter Schema-encodes either that receipt or one fixed
blocked result and owns exit code 1.

The real missing-authority fixture now rejects the raw error tag,
`ConfigError`, stack markers, and repository path. It does not invoke Vercel or
prove the success branch, provider mutation, Preview state, deployment, or
hosted behavior. No helper, service, shared receipt module, provider operation,
authority change, or runtime wrapper was added.

### Automatic Production command output correction

The next consequential-entrypoint probe removed
`BUNDJIL_PRODUCTION_SOURCE_SHA` and reproduced the same default reporter leak
from the private post-CI Production command: raw `ConfigError`, absolute
worktree paths, and stack frames. Its deployment state machine, ordered
rollback finalizer, and successful `AutomaticProductionReceiptJson` contract
remain unchanged. One final `Effect.exit` now captures source Config,
deployment Layer acquisition, orchestration, rollback/health failure, and
success-receipt encoding. The process adapter emits either the existing
Schema-encoded success receipt or one fixed Schema-encoded blocked result and
owns exit code `1`.

The real missing-source fixture requires exactly `{"status":"blocked"}` and
rejects the raw deployment tag, `ConfigError`, stack markers, and repository
path. Because the source Config is decoded before the live deployment Layer is
provided, this negative oracle performs no Vercel transport. It does not prove
the success branch, rollback, hosted workflow, deployment, or provider state.
No generic command renderer, helper package, service, provider operation,
authority change, or wrapper was added.

### Exported Effect operation ownership correction

A fresh production-source AST inventory found 31 exported functions whose
body directly constructed `Effect.gen`. Their generator names made stack
output readable, but their declarations did not state whether the public
operation owned a semantic trace or merely delegated to an already named
service operation. Installed `effect@4.0.0-beta.101` documents this distinction:
`Effect.fn("Owner.operation")` owns a named span, while `Effect.fnUntraced`
reuses a generator body without adding a stack-frame or span. The reviewed v4
source revision is `1caab3cc30f626efbf15e59d74f539a487e5c85c`.

The four semantic boundary/orchestration operations now use named
`Effect.fn`; the remaining existing public service accessors use named
generator bodies inside `Effect.fnUntraced` because their called service
operations already own traces. The explicit signature exposed one raw public
workspace-name string; that helper now accepts its existing
`BundjilWorkspaceName` brand and decodes the default internally. Export names,
result contracts, service requirements, errors, Layers, provider requests and
wire behavior are unchanged. This does not authorize new pass-through
accessors: an accessor still requires a current public consumer or concrete
package-boundary reason.

`bundjil/no-exported-effect-gen-function` now rejects import-aware exported
arrow or function declarations that directly return `Effect.gen`, including
an immediate `.pipe(...)`. It accepts top-level Effect values, local one-use
generators, `Effect.fn`, `Effect.fnUntraced`, and unrelated identifiers. Direct
RuleTester and installed positive/negative fixtures own the rule. No autofix,
helper, wrapper service, exception registry, provider operation, credential,
deployment, or hosted claim was added.

## Terminal audit pass 1 boundary correction

The first ordered architecture-boundaries pass found four defects after the
earlier implementation checks: Photon logged provider-controlled SDK name/code
strings after only lexical filtering; Codex function-tool parameters used
`Schema.Unknown`; the supported package root exported the raw HTTP and byte
stream mapper services; and the direct Responses proof accepted any successful
body by transport counts. These survived because the previous checks observed
safe public errors, TypeScript assignability, transport-type signatures and
successful HTTP fixtures without directly asserting the structured logger
payload, recursive JSON contract, root export denylist, or semantic
`response.completed` event.

The correction removes all provider-controlled Photon strings from the
Schema-owned diagnostic and retains only closed operation/phase plus bounded
status/retry observations. Codex now owns object-root recursive JSON tool
parameters through an Effect Schema; raw HTTP and stream mapper
services remain private to package runtime composition; explicit `/testing`
Layers inject only the standard Effect HTTP client into refresh-capable or
legacy provider compositions. The direct proof decodes SSE data events through
the owning stream-event Schema and succeeds only after `response.completed`.
Negative fixtures now inspect encoded Photon logs, reject non-JSON and
non-object tool parameters, deny the raw root exports, and reject non-SSE or
incomplete successful responses.

The fresh pass-1 rerun then found four deeper false greens. Photon diagnostic
extraction used `Reflect.get`, so a hostile getter could throw before the safe
error existed. Codex live streaming appended `finish_reason` and `[DONE]`
without observing `response.completed`; proof parsing accepted an unterminated
completed line and a media-type parameter containing `text/event-stream`; and
`Layer.provideMerge` retained the private HTTP/mapper services in exported
Layer contexts even after their barrel exports were removed.

The root correction treats provider failures as hostile property containers:
only non-accessor own data properties are inspected through
`Option.liftThrowable`, with every descriptor/accessor failure collapsing to
the closed `unknown` observation. Codex proof and live streaming now share one
bounded package-private SSE line/event framer. It rejects unterminated lines or
events, matches the exact media type, decodes framed data through the owning
Schema, and requires `response.completed` before proof success or clean
OpenAI-compatible completion. Proof counts the incrementally consumed bytes in
an Effect `Ref` rather than materialising an unbounded response body. Private
HTTP/request/stream dependencies use
`Layer.provide`; a built-context test proves they are absent from exported live
and test Layers. New direct fixtures use throwing provider getters, misleading
media types, malformed and unterminated SSE, clean upstream termination before
completion, and built Layer context inspection.

The next pass-1 rerun found that separately bounded `data:` lines could still
form an unbounded multi-line event, proof retained all decoded events with
`runCollect`, the receipt named its event count `receivedStreamLines`, and the
request mapper remained reachable from root/runtime exports. The framer now
bounds both individual lines and the joined event at 1 MiB. Proof uses
`Stream.runFold` to retain only `{ count, completed }`, and its Schema field is
`receivedStreamEvents`. A valid multi-line JSON event proves one-event
counting; two sub-limit lines above the aggregate ceiling fail. The remaining
request-mapper service, constructor, accessor and Layer exports are removed and
added to the root denylist oracle.

The following pass-1 rerun found that comment and ignored-field bytes did not
contribute to the aggregate SSE event ceiling, legal CR-only framing was not
owned by a direct oracle, and Photon accepted any safe integer as a transport
status. The framer now counts every nonblank wire line toward its 1 MiB event
budget while preserving LF, CRLF and CR framing. Photon owns the closed
100-through-599 transport-status Schema and collapses every other numeric value
to `unknown`. Direct fixtures cover CR-only completion, aggregate ignored-field
overflow and out-of-range provider numbers. Pass 1 restarts from this candidate.

The next pass-1 rerun reproduced seven further false greens. A failed event
followed by completion became a clean stream; raw provider Content-Type escaped
into public receipts/errors; re-encoded line lengths undercounted CRLF wire
bytes; repeated array spreads admitted quadratic work below the byte ceiling;
an empty chunk split CRLF; finite-number Schemas admitted impossible statuses,
counts and indexes; and the export denylist inspected only the root barrel.

The correction introduces one package-private Schema and `Match` terminal-event
state owner shared by proof and live mapping. It rejects failed, incomplete,
error, malformed, duplicate and post-terminal input before clean finish or
`[DONE]`. Successful metadata emits only the closed `text/event-stream`
literal, while public HTTP errors retain bounded status and fixed application
messages. The SSE framer preserves exact delimiter and blank-line bytes across
empty chunks, uses persistent Effect `Chunk` accumulation, and enforces 4,096
line-fragment and event-field ceilings. HTTP status, counts, sequence numbers
and output indexes are bounded integers. Direct tests own terminal ordering,
header sentinels, exact LF/CRLF/CR byte thresholds, fragment/field limit-plus-one,
impossible numbers and every supported package subpath. Pass 1 restarts from
this candidate.

The latest pass-1 rerun found six related boundary failures plus one cold-gate
surface finding. Config could redirect the bearer credential to any non-empty
endpoint; malformed redacted token/account values could defect during platform
header construction; generic recursive JSON could overflow the JavaScript
stack; proof accepted malformed recognized events that live mapping rejected;
sequence numbers were decoded but not advanced; and Knip found an unused
private stream convenience accessor.

The corrected owner pins the credential-bearing endpoint to the exact ChatGPT
Responses HTTPS literal, constrains header values to bounded visible ASCII and
wraps platform `Headers` construction in a fixed secret-negative
`Effect.try`. One opaque depth-bounded Schema now validates arbitrary protocol
JSON for both object-root tool parameters and SSE input before event selection.
Proof and live mapping consume the same closed recognized-event union and one
`Match` state machine that requires exact zero-based sequence progression. The
unused accessor is removed. Config, network-negative header, exact-depth,
malformed-recognized-event and duplicate/regressing/skipped-sequence fixtures
own each recurrence path. Pass 1 restarts from this candidate.

The subsequent pass-1 rerun found five remaining boundary false greens. Photon
read a successful SDK result's `id` directly, so a hostile getter could still
escape the typed adapter. Codex function parameters reused the bounded JSON
predicate without preserving their object-root invariant; sparse arrays and
non-enumerable object fields could pass validation and then encode to a
different value; access tokens and account IDs were both assignable as
`Redacted<string>`; and a fresh decoder per SSE line stripped a BOM outside the
stream start while colonless `data` fields disappeared.

The corrected candidate reads Photon success identity through the same hostile
own-data-property boundary as failures and decodes a new application-owned
result. Codex function parameters explicitly require a non-null, non-array
object. Its opaque JSON contract accepts only dense arrays and enumerable own
data properties, so accepted values have stable outward encoding. Access-token
and account-ID strings have distinct brands before redaction. SSE framing owns
one first-line flag, strips a BOM only at stream start, and treats colonless
`data` as an empty data field. Direct fixtures cover the hostile success getter,
scalar parameter roots, sparse/non-enumerable JSON, credential
non-assignability, a valid first-line BOM, a later BOM, and colonless data. Pass
1 restarts from this candidate.

The next pass-1 rerun found five remaining boundary defects and one test
resolution false green. Expected proxy authorization was request-controlled
alongside presented authorization; a duplicate function-call output index
overwrote mapper state; accepted protocol JSON retained caller-owned mutable
references; the Responses transport had no header, idle-body, cumulative-body
or event budgets; and the SSE-only route accepted `stream: false` and silently
stripped unsupported fields. App Vitest could also externalise a workspace
package and execute stale ignored build output despite its source condition.

The accepted correction captures the expected token in the service Layer,
decodes the bounded presented authorization into `Redacted` at ingress, and
uses one fixed-width comparison loop. Duplicate output indexes fail before
state mutation. The canonical JSON Schema uses installed beta.101
`Schema.decodeTo` and fallible `SchemaGetter` transformations in both
directions, yielding detached deeply frozen bounded data. Positive transport
budgets come from `Config.schema`; Effect timeout and Stream operators own
headers, per-pull idleness, cumulative bytes, event cardinality, interruption
and finalisation. Exact HTTP decoding rejects excess properties and accepts
only omitted or literal-true stream mode. App Vitest inlines workspace packages
under the source export condition. Forged-token, duplicate-index,
source-mutation, deterministic timeout/finalizer, resource-limit, strict
ingress and source-resolution fixtures own the recurrence paths. Pass 1
restarts from this candidate.

The subsequent full boundary gate found one remaining type-surface false green:
the recursive canonical JSON unions were exported even though runtime values
were opaque, and the SSE accumulator used an assertion to recover its tuple
type. The implementation unions are now private, the public protocol value
types are derived only from opaque branded Effect Schemas, and the accumulator
uses checked Effect inference. The public-export fixture and boundary gate own
the recurrence path. Pass 1 restarts from this candidate.

The fresh terminal pass 1 then found that the declaration predicate validated
by creating and discarding a canonical copy. Effect type-side guards and
constructors could therefore brand the original mutable object without running
the detaching transformation. The declaration now accepts only recursively
frozen canonical containers, while decode and encode continue to produce new
deeply frozen ordinary data. Direct guard, shallow-freeze, type-side constructor
and nested request fixtures own the alternate entry path. The ordered terminal
audit restarts from pass 1.

The next fresh pass 1 found an oracle false green rather than another runtime
bypass: the nested request fixture used a plain access-token string and could
fail before reaching mutable tool parameters. The accepted correction reuses
valid decoded sibling fields and exercises both the type-side Schema and
`CodexResponsesPostInput.makeEffect`, asserting the exact
`request.tools[0].parameters` issue path. Negative boundary fixtures must
satisfy all earlier field and composition preconditions and prove the intended
failure owner. The ordered terminal audit restarts from pass 1.

The following fresh pass 1 found that deep freezing still did not establish
canonical ownership. A frozen `Proxy` can satisfy structural and freeze checks
while retaining caller-controlled own-key behavior. `ENP-FND-044` therefore
adds package-private weak-identity provenance to every transformed container;
the declaration type side requires that provenance recursively, while ordinary
decode still detaches a hostile proxy into stable deeply frozen data. The exact
one-constructor lint exception and its stale-count fixture own the native
`WeakSet`; guard, nested-constructor, detachment and repeated-encoding fixtures
own the boundary recurrence path. The ordered terminal audit restarts from
pass 1.

The first ordered audit attempt then exposed a lifecycle false green: the
product index retained the earlier 23-task count and the two accepted boundary
tasks remained `in_progress` after their completion evidence had passed. The
ledger now closes all 25 implementation tasks before the terminal task begins.
`ENP-FND-042` makes exact task-count and status agreement part of the terminal
proof; the ordered five-pass audit restarts after this documentation correction.

A later behavior pass found another lazy-stream oracle false green. The 401
recovery fixture counted two requests but did not identify the credential used
by either request and did not consume the returned mapped body. The corrected
fixture proves old-token rejection, refreshed-token replay, terminal
`finish_reason: stop`, and `[DONE]`. Request count alone is not credential or
stream-completion evidence. The earlier five-pass receipt is invalidated and
the ordered terminal audit restarts from pass 1.

The next restarted pass 1 found two resource/cause false greens. Live and local
proxy availability used `Layer.catchCause`, which could downgrade defects or
interruption into ordinary unavailability. They now use installed beta.101
`Layer.catch`, recovering typed acquisition failures only; deterministic live
and local defect plus interruption fixtures own the recurrence path. The same
pass found that periodic zero-length upstream chunks reset a per-pull idle
timeout without consuming byte, event or framing budgets. The bounded body
stream now filters empty chunks before the timeout, so only non-empty protocol
bytes count as progress; a `TestClock` fixture proves timeout and upstream
finalization. `ENP-FND-045` and `ENP-FND-046` reopen the Codex task and restart
the ordered audit from pass 1.

The following pass 1 identified a response-finalization proof gap. The
implementation already scopes proof requests through completion and transfers a
dedicated scope to accepted streaming bodies, but early status/media fixtures
proved only that body text did not leak. `ENP-FND-047` adds a four-case matrix
over proof/streaming and non-2xx/rejected-media paths. Each case observes the
`HttpClient.withScope` abort signal immediately, requires `Response.bodyUsed`
to remain false, and keeps a rejected-body sentinel out of the typed result.
The focused Codex suite passes 32 proof tests. The ordered audit restarts from
pass 1 after full verification.

The next pass 1 found the remaining ownership gap: accepted headers created a
dedicated response scope before return, but cleanup was attached only to body
subscription. A caller that discarded the successful result could therefore
leave transport open indefinitely. Fully lazy acquisition was rejected because
it would move upstream 401/media failures behind already-sent proxy headers.
`ENP-FND-048` instead adds one bounded Effect-clock ownership watchdog after
header validation. Body subscription claims the scope and the existing
per-pull/finalizer path takes over; otherwise the configured idle deadline
closes it. A scope-finalizer `Deferred` terminates the detached watchdog on
every earlier close. `TestClock` proves an accepted discarded stream aborts at
the deadline without reading its body. The ordered audit restarts from pass 1
after full verification.

The next pass 1 found that the first ownership watchdog started before header
acquisition, allowing a short stream-idle setting to abort a still-valid longer
header wait. `ENP-FND-049` moves watchdog startup until after accepted status,
media type and metadata validation. A `TestClock` regression configures a
five-second header deadline and one-second stream-idle deadline, delays valid
headers by two seconds, proves no premature abort, then drains the claimed body
and observes normal request closure. The never-subscribed expiry fixture remains
in place. The ordered audit restarts from pass 1 after full verification.

The later docs-and-proof pass found `ENP-FND-052`: the completed-history move
updated lifecycle state without advancing `last_reviewed` in owners whose
declared triggers included that exact transition. The prior terminal receipt
is invalidated, both SPECs and plans return to current routing, and review
metadata advances to 2026-08-14 before the ordered sequence restarts from pass

1. No runtime, provider, credential, deployment or channel behavior changes.

The restarted docs-and-proof pass then found `ENP-FND-053`: current summaries
still called the terminal audit accepted and its sibling plan completed while
the canonical task remained pending and both plans were active. Those current
claims now match the ledger; accepted wording remains only in the explicitly
invalidated receipt below. The ordered sequence restarts from pass 1.

The restarted pass 1 then found that the subscriber discarded the boolean
returned by `Deferred.succeed`. After watchdog expiry, or after one successful
subscription, a later subscriber could therefore continue to the same one-shot
upstream body instead of failing at the ownership boundary. `ENP-FND-050`
branches on that claim result: only the winner receives the bounded stream;
expired and duplicate claims return one fixed `CodexResponsesStreamError`
before reading the response. Deterministic fixtures prove both negative paths,
including unread body state after expiry. The ordered audit restarts from pass
1 after full verification.

Installed `effect@4.0.0-beta.101` remains execution authority; reviewed v4
source revision `1caab3cc30f626efbf15e59d74f539a487e5c85c` provides the
Schema declaration, Redacted, Config, Match and Layer APIs used here. This correction preserves public
domain services, OAuth recovery, request/stream mapping, cancellation, channel
error mapping, provider calls and wire behavior. It does not prove live Photon,
Codex subscription, hosted proxy, deployment, channel delivery or Production
behavior. The complete five-pass audit restarts after this correction and its
focused evidence was accepted.

## Docs-maintainer impact ledger

| Surface                          | Decision                            | Earliest owner, future action, proof, and non-claim                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical SPEC/tasks/index       | Change required; delivered          | This SPEC, sibling ledger, and `docs/product-specs/index.md` own current intent and lifecycle. `check:docs` proves routing only.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Documentation audit              | Preserve                            | Historical documentation-audit packets remain immutable; current policy is proved by `bun run check:docs`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Effect architecture              | Change required; delivered          | `docs/architecture/effect-patterns.md` owns accepted Clock/TestClock, Random, state/ref, collection, Layer, absence, lint scope, exact exceptions, public errors, shared field objects, identity-versus-diagnostic branding, recursive JSON protocol fields, closed provider telemetry, and dynamic drift execution provenance.                                                                                                                                                                                                                                                              |
| Testing/quality architecture     | Change required; delivered          | `docs/architecture/testing-and-quality.md` owns exact rule IDs, installed fixtures, exception staleness, focused commands, drift run/digest binding proof, and terminal gate.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Other architecture               | Targeted Change required; delivered | `docs/architecture/repo-structure.md` owns the Codex private transport/public domain-service split; `docs/architecture/README.md`, `docs/architecture/eve-agent.md`, and `docs/architecture/frontend-composition.md` remain sufficient because no route, Eve contract, or frontend changed.                                                                                                                                                                                                                                                                                                  |
| Root README / docs index         | Preserve                            | `README.md` and `docs/README.md` already route the unchanged public commands and owners; the decision matrix remains in its semantic owner.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| App READMEs                      | Targeted Change required; delivered | `apps/codex-proxy/README.md` records the Layer-owned credential and exact SSE-only ingress contract; `apps/agent/README.md` remains unchanged because model/channel behavior did not change.                                                                                                                                                                                                                                                                                                                                                                                                 |
| Package READMEs                  | Targeted Change required; delivered | The Codex README records private raw transport, explicit test injection, canonical JSON ownership and Config-owned resource limits; prior Sendblue/infrastructure guidance remains current. Photon public exports and commands are unchanged, so its README is preserved.                                                                                                                                                                                                                                                                                                                    |
| AGENTS.md                        | Preserve                            | `AGENTS.md` already requires flat Effect flow, Schema boundaries, no helper sprawl, provider wrapper review, and docs maintenance.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `prd-writer`                     | Change required; delivered          | The skill now requires explicit `Effect.fn` versus `Effect.fnUntraced` trace ownership and rejects exported functions that directly construct `Effect.gen`.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `prd-review` / `prd-implementer` | Change required; delivered          | Both skills now audit the same exported-operation invariant while preserving flat sequential flow, focused proof, docs reconciliation, and the single terminal audit.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `effect-client-wrapper`          | Change required; delivered          | The skill now distinguishes semantic `Effect.fn` trace owners from untraced delegates while retaining named services, typed provider boundaries, Config, errors, Layers, Promise confinement, and resource lifetime.                                                                                                                                                                                                                                                                                                                                                                         |
| Lint plugin/config/tests         | Change required; delivered          | The existing plugin now also owns exported reusable-generator trace ownership with direct and installed fixtures; the approved zero-debt scopes add no second runner, plugin package, autofix, broad ignore, or exception.                                                                                                                                                                                                                                                                                                                                                                   |
| Boundary/effect checks           | Change required; delivered          | The audit rejects raw defects, raw Promise coordination, redacted Schema round-trips, ambient random identities, operator unknown fields, exported `Data.TaggedError`, and inline primitive strings in shared error fields; exceptions remain unchanged.                                                                                                                                                                                                                                                                                                                                     |
| Schemas/services/Layers          | Targeted Change required; delivered | Existing trace ownership remains; Photon failures and successful message identity cross one hostile-property boundary, Codex function parameters and SSE use one canonical depth-bounded JSON Schema, credential domains remain distinct before redaction, recognized events share one sequence owner, and raw transport Layers remain behind runtime/testing composition.                                                                                                                                                                                                                   |
| Tests/fixtures                   | Change required; delivered          | Encoded Photon logger and hostile-success capture; endpoint/header/depth/canonical-JSON ownership including frozen-proxy rejection and stable detachment/encoding; typed Layer fallback with defect/interruption preservation; non-empty body-progress timeout/finalization; credential-type/sequence/BOM rejection; forged-token, duplicate-index, transport-budget, strict-ingress and source-resolution oracles; all-subpath export denial; and semantic SSE completion fixtures own the pass-1 recurrence paths. Existing command, lint, Random, and transition fixtures remain focused. |
| Verification/evidence/research   | Preserve                            | No critical journey, retained proof owner, or research route changed; repository lint and runtime evidence remains in the active plan and code-owned fixtures.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Standards/operations/runbooks    | Targeted Change required; delivered | Workflow, authority/control registers, Alchemy runbook, and automatic-Production SPEC distinguish static policy custody from dynamic run/source/manifest provenance. No provider procedure or authority scope changed.                                                                                                                                                                                                                                                                                                                                                                       |
| Active/completed execution plans | Change required                     | The dedicated active plan owns this ledger and closes only after the combined terminal audit; the active/completed indexes follow lifecycle.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Runtime branch history/evidence  | Preserve                            | Use merged current source; do not rewrite completed proof or infer hosted actuality.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Provider state and hosted proof  | Preserve                            | The automatic-Production SPEC and plan retain the external custody and hosted proof gates. This correction changes repository provenance contracts only.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Frontend/browser/accessibility   | Evidenced N/A                       | Atom is rejected for backend use and no visible React/browser surface changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Release/version/publication      | Evidenced N/A                       | No package version, tag, release, or publication; combined branch commit/push/merge and Production proof remain owned by the parent execution plan.                                                                                                                                                                                                                                                                                                                                                                                                                                          |

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
- Do not claim current upstream or Site APIs exist in installed beta.101.
- Do not modify the retired Eve integration branch or rerun its hosted proof as
  a substitute for current evidence.
- Do not treat lint, typecheck, or repository verification as provider or
  Production proof; those claims remain in the operational ledger.

## Rejected alternatives

| Alternative                                           | Rejection reason                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copy Site's entire Effect plugin/config               | Site's filename taxonomy, frontend scope, provider set, and exception corpus are different; broad rules conflict with Bundjil's type-aware owners. |
| Add an ESLint/custom TypeScript wrapper beside Oxlint | Duplicates the existing plugin/check architecture and adds another lifecycle owner.                                                                |
| Enforce all design guidance with lint                 | Cohesion, semantic collection value, readability, ownership, and pass-through policy require type/data-flow/domain evidence.                       |
| Use only documentation/review                         | Ambient time, async/await escape, bare `tryPromise`, and runtime execution have narrow durable AST invariants worth automating.                    |
| Enable rules before migration                         | Creates a debt baseline or broad suppression pressure and makes current false positives part of policy.                                            |
| Autofix first                                         | Clock, error, Layer, state, and boundary choices change semantics; no proposed transformation is provably safe.                                    |
| Reopen the retired runtime branch                     | Violates exact-main implementation and risks diverging from merged ownership.                                                                      |

## Open questions and upgrade triggers

1. Which `Date.now` tests are genuinely Effect-clock-owned after an exact
   assertion/call-graph review, and which are fixed/live host fixtures?
2. Can the runtime-execution rule use only import-aware AST and exact config
   scopes, or does Bundjil need a small checked owner registry for framework
   callbacks?
3. Does a real provider service acquire replaceable resource state that
   justifies `ScopedRef`, or is ordinary Layer scope sufficient?
4. Does any current consumer require `SubscriptionRef.changes`, or should the
   type remain absent?
5. After a future Effect upgrade, did `Effect.fromOption` gain a custom
   upstream `onNone` form, did reactivity leave `unstable`, and did
   Stream collection return types change?
6. Do future repeated review findings justify a typed compiler audit for
   non-empty/index or Layer exports? This SPEC does not pre-authorise one.

## Implementation acceptance

This refreshed artifact is implementation-ready when:

- its sibling JSON parses and every requirement maps to tasks and proof;
- product-spec index lifecycle agrees;
- PRD review has no unresolved blocking finding;
- docs-maintainer records every surface above;
- documentation-only checks pass; and
- the active plan records the exact integrated inventory and PRD review result
  before runtime/lint implementation begins.
