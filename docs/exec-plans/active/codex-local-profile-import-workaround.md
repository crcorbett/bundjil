# Codex Local Profile Import Workaround Plan

Status: Active  
Spec: `docs/product-specs/codex-local-profile-import-workaround.md`  
Task ledger: `docs/product-specs/codex-local-profile-import-workaround.tasks.json`

## Execution Rule

Implement the ledger sequentially. One subagent owns exactly one task at a
time. The parent reviews the shared-worktree diff, runs focused and root
verification, completes the three required Effect TS audit passes, records the
evidence here and in the ledger, commits the accepted slice, and only then
delegates the next task.

`docs/product-specs/writing-specs.md`,
`docs/product-specs/writing-task-lists.md`, `docs/PLANS.md`,
`docs/exec-plans/implementing-specs.md`, and the two legacy architecture paths
named by repo skills do not exist in this repository. The target SPEC, ledger,
`AGENTS.md`, and current architecture guides are the active local authority.

## Current Task

`implement-local-access-token-profile-import`

The first tracer bullet is package-only. It must add a command-only local cache
source and access-token-only import service without changing the proxy or Eve.
No real token/cache values may be viewed, written, or included in test fixtures.

## Baseline Evidence

- The original hosted OAuth task remains blocked because no supported arbitrary
  Vercel redirect grant has been established.
- The current local Codex cache was inspected only for top-level and token field
  names; it reports `auth_mode: chatgpt` and contains the expected token-key
  labels. No values were printed or persisted as evidence.
- Encrypted profile storage, the Upstash adapter, refresh lock, direct provider,
  private proxy contract, local mock proxy, and personal Vercel mock preview
  already exist. The importer must reuse them rather than recreate their
  contracts.

## Task Log

### implement-local-access-token-profile-import

Status: Pending

Parent acceptance requirements:

- package-owned config, cache source, importer service, tagged errors, fixture
  layer, sanitized command output, tests, and docs;
- no real cache read in tests and no refresh/id token persistence;
- three parent audits: ownership/call graph, Effect implementation quality, and
  verification coverage;
- task ledger/plan evidence, full verification, and a coherent commit.
