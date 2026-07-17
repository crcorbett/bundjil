# Effect Persistence Implementation Plan

Status: Active - task 1 accepted

Spec: `docs/product-specs/effect-persistence.md`
Task ledger: `docs/product-specs/effect-persistence.tasks.json`

## Execution Rule

Implement the ledger sequentially. One Terra Medium subagent implements exactly
one task at a time. The parent agent reviews the actual diff, runs focused and
repository verification, performs and records the ownership/call-graph,
implementation-quality/helper-admission, and verification/evidence audits,
commits the accepted slice, and only then delegates the next task.

Three parent audit passes are the minimum. A finding keeps the task open until
it is corrected and another pass accepts the result. Subagent reports are review
inputs, not acceptance evidence.

## Evidence Policy

Record only source paths, test names, safe operation names, counts, booleans,
status families, sanitized deployment/source references, and rollback facts.
Never record credentials, Redis keys or values, transaction arguments, OAuth
subjects, phone numbers, message content, protected URLs, provider payloads, or
execution identifiers.

Use mock providers and deterministic memory Layers for automated proof. Live
Preview and Production work follows the SPEC's environment isolation,
clean-source, explicit approval, bounded proof, and rollback requirements.

## Ordered Tasks

1. `implement-effect-persistence-contract-and-adapters`: completed.
2. `migrate-codex-oauth-to-effect-persistence`: pending.
3. `migrate-agent-delivery-idempotency-to-effect-persistence`: pending.
4. `verify-persistence-preview-and-production-rollout`: pending.
5. `reconcile-persistence-documentation-and-final-audit`: pending.

## Baseline

- Rollout started 2026-07-17 on `main` at `0210de2`.
- The reviewed SPEC and task ledger were the only untracked files.
- Root verification passed when the documented ignored local Executor
  environment was loaded. A first environment-free run failed closed during
  `eve build` because the required Executor endpoint was absent; no source fix
  was needed.
- Existing provider ownership is split between the Codex Upstash adapter and
  the app-owned Sendblue replay store. Task 1 introduces only the provider-
  neutral contract, coherent memory implementation, and explicit Upstash
  adapter; consumer migrations remain tasks 2 and 3.
- No frontend, route, visible text, URL state, provider routing, OAuth protocol,
  model, Executor policy, or Vercel binding change is in task 1.

## Task Evidence

### implement-effect-persistence-contract-and-adapters

Status: Completed

Subagent: one Terra Medium implementation worker; parent acceptance followed
three correction rounds for provider-protocol parity, service-boundary
revalidation, and one-use Schema alias removal.

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- Package ownership is limited to provider-neutral atomic contracts, coherent
  memory persistence, and an explicit Upstash adapter; no consumer, app,
  route, React, OAuth, channel, or deployment code changed.
- The root export contains only provider-neutral contracts. Memory and Upstash
  are explicit subpaths; Redis client, provider error, command serializer, and
  static transaction program remain internal.
- Each Layer build allocates one backing state/client and provides native
  `KeyValueStore` plus `AtomicKeyValueStore` over the same backing store.

#### Parent Audit Pass 2 - Effect Quality And Helper Admission

Status: Passed

- Canonical Schemas own keys, values, positive whole-millisecond TTL,
  conditions, mutations, bounded transactions, outcomes, operations, safe
  errors, provider options, and provider response decoding.
- Public transactions are revalidated before state mutation or provider I/O;
  memory transactions use one `SynchronizedRef.modify`, while Upstash uses one
  static positional transaction program and one decoded response.
- Symbol admission confirmed that expiry normalization, physical prefixing,
  transaction decoding, command serialization, scan pagination, error mapping,
  client construction, and public Layers each have multiple call sites or own
  a material boundary. The one-use positive-millisecond alias was removed.
- Production scans found no raw JSON, process environment reads, local Effect
  execution, Promise construction, unsafe cast, suppression, raw tag branch,
  `switch`, broad catch, native mutable `Map`/`Set`, or hidden expected failure.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Frozen install passed and confirmed the Effect language-service patch; changed
  TypeScript files typechecked without actionable language-service diagnostics.
- Package check-types/build passed and all 23 contract tests passed, including
  bounds, duplicate rejection, concurrency, stale fencing, TTL behavior,
  coherent state, provider failures, pagination, batching, and a stateful
  Upstash positional-protocol parity test.
- Root `check`, Knip, full `verification`, and full build passed across all seven
  workspaces with the existing ignored Executor environment loaded.
- Static boundary scans and whitespace checks passed; mutable `Map` usage is
  confined to the stateful provider-protocol test double.

### migrate-codex-oauth-to-effect-persistence

Status: Pending

### migrate-agent-delivery-idempotency-to-effect-persistence

Status: Pending

### verify-persistence-preview-and-production-rollout

Status: Pending

### reconcile-persistence-documentation-and-final-audit

Status: Pending
