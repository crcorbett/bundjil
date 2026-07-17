# Effect Persistence Implementation Plan

Status: Active - task 4 Preview SSE proof correction

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
2. `migrate-codex-oauth-to-effect-persistence`: completed.
3. `migrate-agent-delivery-idempotency-to-effect-persistence`: completed.
4. `verify-persistence-preview-and-production-rollout`: in progress.
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

Status: Completed

Subagent: one Terra Medium implementation worker; parent acceptance required a
correction pass for exhaustive commit-condition selection, legacy error-message
compatibility, config safety coverage, and concurrent atomic replacement proof.

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- Codex retains config names and aliases, default namespace, encrypted codecs,
  storage-key derivation, revision policy, lock policy, observer behavior, and
  domain errors. The shared package owns Redis construction, prefixing, scans,
  provider responses, and atomic command execution.
- The old Codex Upstash adapter subpath, SDK dependency, provider client
  interfaces, Lua programs, scans, and provider-mock test suite were removed;
  no compatibility alias remains.
- Proxy and trusted-local hosted scripts reuse one configured persistence Layer
  for encrypted native storage, atomic profile commits, and refresh locks.
  Filesystem mode and Vercel bindings are unchanged.

#### Parent Audit Pass 2 - Effect Quality And Helper Admission

Status: Passed

- Initial, legacy, revision replacement, refresh, reauthentication, lock
  acquire, and owner release are linear named Effects over canonical Schemas
  and `AtomicKeyValueStore.transact`; commit-condition selection is exhaustive
  Effect `Match` without mutable control flow.
- Encryption and canonical Schema string codecs remain before persistence.
  Generic persistence failures map at the Codex boundary, while legacy
  precondition and atomic-race conflicts preserve their distinct messages.
- Codec aliases own serialization boundaries; conflict/error constructors have
  repeated domain call sites; the shared commit operation owns all five fenced
  commit paths; the two public Layers own distinct commit and lock capabilities.
  The obsolete lock-provider abstraction and custom mutable lock store were
  removed because all live and memory paths now share the atomic contract.
- Changed production scans found no direct SDK import, raw JSON, unsafe cast,
  suppression, dynamic provider command, raw tag branch, local Effect runner,
  Promise construction, or generic helper module.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Persistence tests passed 23/23; Codex OAuth passed typecheck, build, and
  103/103 tests; proxy passed typecheck, build, 21/21 tests, and smoke proof
  with health 200, stream 200, and five stream lines.
- Tests cover config aliases/redaction/errors, encrypted legacy migration,
  initial and revision fences, direct concurrent atomic replacement, stale
  rejection, shared native/atomic state, and atomic lock contention,
  ownership, expiry, and release through the existing contract suites.
- Root check, Knip, full verification, full seven-workspace build, static
  ownership/privacy scans, and whitespace checks passed with no actionable
  Effect language-service diagnostics.

### migrate-agent-delivery-idempotency-to-effect-persistence

Status: Completed

Subagent: one Terra Medium implementation worker; parent acceptance required a
correction pass to preserve historical prefixed claim keys and byte-exact
stored replay records while using logical atomic keys.

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- Replay keys, digests, claim IDs, record codecs, and delivery policy remain
  app-owned. Redis construction, prefixing, provider commands, and failures now
  belong only to the shared adapter composed once in `sendblue/live.layer.ts`.
- Direct Redis imports, client interfaces, Lua, response decoders, and the
  process-local production implementation were removed. Channel, route,
  identity, webhook, model, Executor, and provider behavior did not change.

#### Parent Audit Pass 2 - Effect Quality And Helper Admission

Status: Passed

- Claims and transitions are named linear Effects using exhaustive `Match`,
  canonical Schema string encoding, positive Duration TTLs, and atomic
  absent/equals plus set/remove transactions.
- Historical full prefixed claim/record keys are preserved byte-for-byte;
  validated logical suffixes alone cross into atomic persistence, so the shared
  adapter applies the prefix exactly once.
- Retained helpers own repeated record/key construction or the persisted-claim
  compatibility boundary. Custom mutable memory state and provider helpers were
  removed; static scans found no SDK, Lua, raw JSON, unsafe cast, suppression,
  raw tag branch, switch, or local Effect execution in the changed domain.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Persistence passed 23/23 tests; agent passed typecheck, build, and 56/56
  tests, including exact record strings, concurrent claims, lease/retention
  expiry, retryable removal, uncertain retention, stale fencing, invalid-prefix
  rejection, and unchanged channel/route outcomes.
- Root check, Knip, full verification across seven workspaces, static ownership
  scans, and whitespace checks passed with no actionable language-service
  diagnostics. The direct environment-free agent test failed closed only on
  required Executor config and passed with the ignored environment loaded.

### verify-persistence-preview-and-production-rollout

Status: In progress

Subagent: one Terra Medium verification worker; parent review required three
correction rounds before a new clean Preview source could be accepted.

#### Corrected Preview Source Gate

Status: Passed; clean commit and redeploy pending.

- The first clean Preview deployments reached `READY`, but Vercel Deployment
  Protection redirected the public health probe. No authenticated stream,
  provider write, Production promotion, handset turn, webhook change, or
  synthetic replay was accepted from that attempt.
- The Preview proof now loads the existing optional Vercel bypass through
  redacted Effect Config, forwards it on every request, and records only the
  existing Schema-encoded sanitized result. Success and blocked fixtures prove
  that neither the internal bearer nor the bypass value is emitted.
- The agent-specific Turbo test task now retains its upstream-build dependency
  and declares both Executor configuration names. This prevents Eve from
  resolving workspace output while those outputs are being rebuilt.
- Parent review found a scheduler race in the contended-refresh test after the
  graph fix. One Effect scheduler yield now lets the follower reach its
  TestClock sleep before clock advancement; no timeout increase or live sleep
  was added.
- Parent verification passed the focused Preview proof suite with `22/22`
  tests, the contended-refresh case ten consecutive times, the forced uncached
  Turbo graph twice with `11/11` tasks, root verification, full build, Knip,
  static scans, and whitespace checks.
- A fresh isolated Preview at the first correction SHA was rejected before
  authentication because the Vercel function artifact omitted the transitive
  `@bundjil/effect-persistence` workspace runtime. Hosted Node resolution failed
  from the emitted Codex OAuth adapter while local tests remained green.
- The proxy now declares that deployment-owned runtime as a direct dependency,
  and its Vercel build command emits persistence, OAuth, then proxy output in
  dependency order. A structured Schema test owns both packaging assertions;
  the Knip exception is scoped to this dependency because Vercel tracing, not a
  source import, is its direct app-level consumer.
- Parent verification passed frozen install, the `23/23` proxy suite, package
  typecheck/build, root check and Knip, full verification, full build, static
  scans, and whitespace checks. The next action is a fresh isolated Preview
  from the pushed packaging-fix SHA. Production and the shared Sendblue webhook
  remain unchanged.
- The packaging-fix Preview then returned the expected `200` health and live
  authenticated statuses plus both expected `401` bearer rejections. The proof
  still blocked because the hosted response used the valid parameterized SSE
  media type while the proof required byte-exact `text/event-stream`.
- The proof now compares the normalized media-type essence and retains its
  existing redacted Config, Schema-owned result, response-body privacy, and
  complete-stream assertions. A parameterized-content-type fixture brings the
  proxy suite to `24/24` tests.
- Parent review found no runtime/provider, route, request, credential, model,
  or environment change in this correction. Proxy typecheck/test/build, root
  verification, full build, Knip, and whitespace checks pass. A new clean
  Preview from the correction SHA is required before any agent Preview or
  Production action.
- A later clean agent Preview redeploy did not auto-detect Turbo and instead
  ran the app-local build, where Eve could not resolve an upstream workspace
  artifact. An immediately preceding source-equivalent Preview that did detect
  Turbo succeeded, so platform detection is not a reliable deployment graph.
  The agent now owns an explicit Vercel build command that enters the workspace
  root and runs the filtered Turbo build, preserving the existing upstream
  dependency graph and Eve `.vercel/output` behavior. A Schema-decoded agent
  packaging test protects that command. No deployment, binding, provider,
  webhook, or Production state changed during this correction.

### reconcile-persistence-documentation-and-final-audit

Status: Pending
