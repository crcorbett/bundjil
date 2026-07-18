# Repository Naming And Structure Cleanup Implementation Plan

Status: In Progress

Branch: `codex/repo-naming-cleanup`

Spec: `docs/product-specs/repo-naming-cleanup.md`
Task ledger: `docs/product-specs/repo-naming-cleanup.tasks.json`

## Execution Rule

Implement the ledger sequentially. One implementation subagent owns exactly one
task at a time. The parent reviews the actual diff, runs focused and repository
verification, completes and records the ownership/call-graph,
implementation-quality/helper-admission, and verification/evidence audits,
commits the accepted slice, and only then delegates the next task.

Three parent audit passes are the minimum. Any finding keeps the task open until
it is corrected and another pass accepts the result. Subagent reports are review
inputs, not acceptance evidence.

## Evidence Policy

Record source paths, package names, test names, safe operation names, counts,
booleans, and compatibility conclusions only. Never record credentials, stored
values, physical personal-data keys, OAuth subjects, message content, protected
URLs, provider payloads, or execution identifiers.

This rollout performs no provider mutation, deployment, publication, stored-data
rewrite, frontend change, or Browser proof. Automated provider boundaries use
mock or deterministic memory Layers.

## Ordered Tasks

1. `capture-compatibility-baseline-and-remove-effect-start`: completed.
2. `rename-effect-persistence-to-store`: pending.
3. `rename-codex-oauth-to-codex`: pending.
4. `organize-codex-source-by-owned-feature`: pending.
5. `rename-eve-effect-and-remove-core`: pending.
6. `clarify-agent-integration-ownership`: pending.
7. `reconcile-documentation-and-final-verification`: pending.

## Baseline

- Rollout started 2026-07-18 from `ea511a4` on
  `codex/repo-naming-cleanup`.
- The reviewed SPEC and task ledger were untracked, and `docs/README.md` contained
  their current-spec navigation entry before implementation began.
- Initial workspace packages are `@bundjil/agent`, `@bundjil/codex-oauth`,
  `@bundjil/codex-proxy`, `@bundjil/core`,
  `@bundjil/effect-persistence`, `@bundjil/effect-start`, and
  `@bundjil/eve-effect`.
- The final reusable package set must be exactly `@bundjil/store`,
  `@bundjil/codex`, and `@bundjil/eve`; both apps retain their current names.
- No task may change environment-variable names, stored values, routes, tool or
  discovery slugs, provider endpoints, Vercel project identities, webhooks,
  deployments, or secrets.

## Task Evidence

### capture-compatibility-baseline-and-remove-effect-start

Status: Completed

Subagent: one implementation worker; parent acceptance required one correction
to restore exact historical package names in two proof records while labeling
them as historical rather than current architecture.

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- `packages/effect-start` had no production import outside its own package; its
  only external references were current documentation/configuration and the
  self-describing workspace package list.
- Removing the package also removed its TanStack dependency catalog, root
  TypeScript reference, workspace/lockfile closure, and current documentation
  without a forwarding package or replacement boundary.
- Six workspaces remain. `workspace_status` now reports only the still-current
  `@bundjil/core` and `@bundjil/eve-effect` entries; later ledger tasks own the
  final three-package output migration.
- All selected Codex, Eve, and Executor error files and consumers remain
  unchanged. Persistence encodes profile/replay contracts, while the proxy
  translates internal errors to the stable `CodexProxyErrorResponse` boundary.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- `bundjil/tagged-error-name` is a root-owned Oxlint rule scoped to TypeScript
  source under `apps/**` and `packages/**`; it checks only the mechanical class,
  self-type, and literal-tag equality invariant.
- The rule uses the installed Oxlint 1.61 plugin AST and RuleTester boundaries,
  does not encode capability vocabulary or migration-specific forbidden names,
  and leaves historical documents and negative compatibility assertions out of
  scope.
- Focused cases cover a valid tagged error, an ordinary class, and independent
  declaration, self-type, and literal-tag mismatches. The isolated Vitest config
  exists only to make the root lint-rule suite executable.
- No Effect operation, domain Schema, selected error, DTO, wrapper, mapper,
  unsafe cast, suppression, provider boundary, runtime policy, or external
  identifier changed.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- One `bun install` regenerated `bun.lock`; parent frozen install confirmed 508
  installs across 693 packages with no changes and no TanStack/effect-start
  entry remaining.
- `bun run test:lint` passed the focused rule suite; `bun run check`, Knip, and
  all six workspace typechecks passed.
- Parent `bun run verification` passed with the SPEC's non-secret synthetic
  Executor URL and key. All 212 workspace tests passed: persistence 23, core 2,
  Codex 103, Eve 3, proxy 24, and agent 57.
- Static current-source/configuration scans found no effect-start or TanStack
  reference. The two retained package-name lists are explicitly historical
  Gateway proof; historical product specs and ledgers remain unchanged.
- `git diff --check` passed. No Browser, live provider, deployment,
  publication, or stored-data proof was applicable or performed.
