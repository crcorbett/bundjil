---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-repository-owner
last_reviewed: 2026-08-10
review_trigger: accepted task, source, verification, provider, deployment, rollback, or closeout state change
spec: ../../product-specs/runtime-boundary-streaming-and-deployment-proof.md
task_ledger: ../../product-specs/runtime-boundary-streaming-and-deployment-proof.tasks.json
---

# Runtime boundary, streaming, and deployment proof execution plan

## Execution rule

Implement the sibling ledger serially. Each task begins from the accepted
predecessor, updates the earliest durable owner in the same slice, runs its
focused checks, records sanitized evidence, and commits only after acceptance.
No later task may use cached output from another worktree as its direct proof.

Provider and deployment operations use Personal-scope projects and the exact
target-owned runbooks. Read current state before every consequential write,
stop on target ambiguity, keep secret values out of output and tracked files,
and retain tested rollback identities before alias or provider mutation.

## Starting identity and baseline

- Starting `HEAD` and fetched `origin/main`:
  `7ec2fd198d76e9809a2441fecd0faf3dba9197b1`.
- Direct Agent test: 76 passed and one failed because the test reads the
  obsolete `.eve/compile/compiled-agent-manifest.json` path.
- Hosted CI run `31307868197` failed the same oracle.
- A root `bun run test` cache replay is not accepted as direct evidence because
  its Agent log came from another worktree.
- Current Production Agent is READY at the starting source, despite failed CI;
  this is the deployment-admission mismatch owned by the ledger.
- Photon inspect-only inventory succeeded without mutation. Strict
  candidate-specific replay proof remains unavailable from its current API.

## Ordered tasks

1. `repair-clean-agent-build-proof` — completed. The recoverably clean direct
   Agent run executed both build modes and passed 77 tests; full repository
   verification then passed with an Agent cache miss.
2. `close-codex-and-agent-boundary-escapes` — completed. The raw transport
   service and generic production callback were retired, owner Schemas now
   back semantic Agent Config, and focused plus full verification passed.
3. `stream-and-bound-codex-sse` — completed. The live provider path now
   incrementally maps a bounded Effect byte stream through the proxy response;
   deterministic tests prove early output, fragmentation, failure, size limits,
   cancellation, and the current request ingress ceiling.
4. `enforce-staged-deployment-and-reconcile-docs` — completed. Both app
   configs and negative fixtures enforce manual-only deployment admission;
   architecture, README, runbook, lifecycle, verification, authority and
   automation owners now agree, and full verification passed.
5. `integrate-and-prove-hosted-candidates` — in progress. The pre-stage review
   found that the runbook-required positive Channel handoff timeout was absent
   from both executable preflight admission and current Production metadata.
   The owner/test correction now fails closed, and the exact Personal project
   has a read-backed encrypted Production value of 15 seconds with single-key
   removal as rollback. The full inventory also upgraded the existing proxy
   namespace prefix from plain to encrypted metadata without changing its
   bounded value. A later current-state audit exposed a second false green:
   the alias-family check discarded bindings with an invalid metadata type
   before counting them, so two configured store aliases could pass as one.
   The executable owner now counts names first and directly rejects that exact
   mixed-type ambiguity. Hosted candidate proof and successor profile custody
   remain in progress.
6. `terminal-five-pass-audit` — pending and must run exactly once after all
   predecessors complete.

## Docs-maintainer impact ledger

The SPEC contains the full surface ledger. Task evidence must update each row
to `Change required`, `Preserve`, or evidenced `N/A` and name its earliest
owner. Historical packets and completed plans remain immutable evidence.

## Verification and closeout

Use the focused command in each task, then the AGENTS.md gates and
`bun run verification` for every accepted slice. The hosted task separately
proves CI, no Git auto-deploy, immutable candidates, aliases, provider state,
live behavior, rollback, and claim limits. Repository success is never used as
provider proof.

After the terminal audit and corrections, mark every task completed, change
the SPEC lifecycle to `implemented`, move this plan to `completed` with
`historical` lifecycle, update both indexes, rerun documentation and full
verification, commit/push exact paths, and read back final Git integration.
