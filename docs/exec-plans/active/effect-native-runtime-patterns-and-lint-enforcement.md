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
