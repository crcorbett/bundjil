---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-effect-architecture-owner
last_reviewed: 2026-08-10
review_trigger: Effect version, source inventory, lint rule, fixture, exception, migration, task status, verification, or terminal-audit change
spec: ../../product-specs/effect-native-runtime-patterns-and-lint-enforcement.md
---

# Effect-native runtime patterns and lint enforcement plan

## Objective and dependency

Implement the refreshed four-rule Effect-native runtime and lint ledger against
exact current main, then participate in the single terminal five-pass audit.
Implementation follows the operational closeout tasks owned by
[`automatic-production-and-effect-runtime.md`](automatic-production-and-effect-runtime.md).
The Effect terminal-audit task also depends on the operational channel-proof
task, so neither plan can close independently.

## Starting identity and inventory

- Starting Bundjil main: `5c3c7db240a7abd9bb57ad560bdd8958af4ea701`.
- Branch: `codex/automatic-production-effect-runtime`.
- Installed Effect and `@effect/vitest`: `4.0.0-beta.101`.
- Oxlint: `1.61.0`; Effect language service: `0.86.6`; Eve: `0.29.5`.
- Site comparison: read-only `origin/main` at
  `dd5d015879a82630127adfe044e4352deff72332`.
- Runtime source: merged current main; the retired Eve integration branch is
  not an owner.

## Frozen implementation decisions

1. Add exactly the four lint rules in the SPEC with unit and installed-plugin
   fixtures, exact scopes/exceptions, staleness proof and no autofix.
2. Migrate Effect-clock-owned Codex/proxy test fixtures and Photon candidate
   observation time. Preserve drift CLI and subprocess live timing as exact
   process-boundary exceptions.
3. Preserve existing object-form `Effect.tryPromise` production calls; the
   rule protects this zero-debt state.
4. Flatten the nested channel dispatch generator. Keep runtime execution only
   in scripts, tests, app entrypoints and exact Eve/framework callback owners.
5. Preserve state and collection owners. No cohesive-state, native collection,
   Atom, `SubscriptionRef`, `ScopedRef` or helper migration has domain evidence.

## Slice ledger

The sibling JSON is authoritative. `refresh-integrated-inventory` completed
after current-source review, JSON traceability, documentation policy and skill
policy passed on 2026-08-10. `add-narrow-lint-rules-disabled` completed on the
same date: the local plugin now exposes exactly the four accepted rules, exact
host/runtime exceptions are count-checked for staleness, and `bun run
test:lint` passed seven direct and installed-Oxlint tests across two test files.
The positive installed fixture exited zero; the negative fixture exited
non-zero and exposed all four stable `bundjil/*` diagnostic IDs. The rules
remain disabled against repository source, so this receipt does not claim
production enforcement. Later slices run serially: targeted migrations; state
and collection Preserve review; zero-debt enablement and docs reconciliation;
then the one terminal audit after the operational ledger is also complete.

## Targeted migration receipt

`migrate-targeted-effect-patterns` completed on 2026-08-10. Photon candidate
inventory now reads `Clock.currentTimeMillis`; its focused test fixes
`TestClock`, asserts the exact encoded observation timestamp and retains the
provider-read and fingerprint contracts. Effect-owned Codex and proxy profile
fixtures use named fixed epochs instead of host time. The Eve dispatch owner is
one flat `tryPromise`/decode/handoff Effect under the existing acceptance
timeout, rejection mapping and timeout branch.

The disabled production rules reported zero findings across 330 app/package
files for ambient time, object-form `tryPromise` and runtime execution. The
service-source async/await rule reported zero across 306 files. The only
ambient-time findings left in source are the registered subprocess deadline
proof and drift CLI process receipt; the only non-generic runtime owners are
the exact registered Eve/framework adapters. Focused tests passed 117
assertions, then complete owner tests and type checks passed: Photon 41, Codex
115, codex-proxy 41 and agent 80. The agent build/test requires the same public
synthetic Executor CI configuration as repository CI; an unconfigured first
invocation stopped at `ExecutorConfigError: loadEndpoint`, and the configured
rerun passed. `check:effect-setup` and `check:boundaries` passed.

`review-state-and-collection-targets` also completed as a Preserve decision.
No candidate demonstrated a torn shared invariant, replaceable resource,
subscriber, Effect equality/hash requirement, exact non-empty cardinality, or
measured persistent-concatenation need. The store's
`SynchronizedRef<HashMap<...>>`, the channel observation Refs, decoded arrays,
Codex testing map, request transcript captures and framework runtime bridges
therefore retain their current owners. No state, collection, Atom, Option,
Match, helper or package-topology edit was admitted.

## Evidence and non-claims

Repository tests and lint prove only source contracts. They do not prove
GitHub settings, deployment, provider behaviour, delivery, handset typing or
strict replay. Corrections reopen the owning task and invalidate downstream
receipts.

## PRD review receipt

Accepted on 2026-08-10 before code changes. All twelve requirements and four
rules have direct observables, expected postconditions, rejected false greens,
procedure/evidence owners and limitations. The review rejected stale beta.74,
retired-branch and wholesale-Site assumptions; it also rejected cosmetic
state/collection/API migrations. Exact exceptions require a current framework
or process owner and staleness proof. No blocking or unclear requirement
remains.
