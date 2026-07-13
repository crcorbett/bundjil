# Sendblue Eve Channel Implementation Plan

Status: Complete

Spec: `docs/product-specs/sendblue-eve-channel.md`  
Task ledger: `docs/product-specs/sendblue-eve-channel.tasks.json`

## Execution Rule

Implement the task ledger sequentially. A Terra Medium subagent implements
exactly one task at a time. The parent agent reviews the diff, runs focused and
repository verification, performs the required three-pass Effect TS audit,
records evidence here and in the task ledger, commits the accepted slice, and
only then delegates the next task.

Credentials remain in 1Password, executor-managed provider connections, and
encrypted Vercel environment variables. Plans, tests, command output, commits,
and proof artifacts contain only variable names and sanitized metadata.

## Rollout Status

All five tasks are accepted. The Sendblue channel remains Preview-only;
Production promotion remains gated by the Vercel Production Promotion SPEC.

Completed scope:

- reconcile root, app, architecture, SPEC, task-ledger, and operator docs with
  the verified Preview behavior;
- run the final three-pass ownership, Effect/helper-admission, and verification
  audit;
- run all repository, leak, stale-pattern, and task-ledger consistency gates.

Production resources and environment variables remain untouched.

Documentation reconciliation is complete. The root, app, architecture, and
SPEC surfaces now describe the accepted Preview-only route/auth/status/replay
behavior, exact app-owned Config names and KV fallback, supported/ignored
matrix, opaque identity/routing, failure/uncertainty semantics, and
rotation/disable procedure. The final parent audits and repository gates pass.

## Provider Discovery

Recorded: 2026-07-13

- The personal executor Sendblue connection is available.
- At discovery time, no receive, outbound, or typing webhook was configured.
- The account has an active iMessage line and recent message history.
- API credentials exist in the `SendBlue API` 1Password item; values were not
  copied into repository files or command output.
- The existing personal Upstash resource is connected to `bundjil-agent` for
  Preview only. The app-owned replay Config prefers its dedicated names and
  falls back to the provider-owned `KV_REST_API_URL` and `KV_REST_API_TOKEN`
  inputs when those dedicated values are unavailable.
- All required Sendblue config inputs are Preview-only; Production has zero
  Sendblue variables.
- A dedicated Vercel automation bypass existed, but its first generated value
  was intentionally treated as unknown and later replaced by an operator-owned
  value saved in 1Password before webhook registration.

## Preview Build Log

Recorded: 2026-07-13

- Accepted commits through `5061a86` were pushed to `origin/main`.
- Clean Git deployment `dpl_E1Pu7XEF6NG458yS4JPwJGQrqX12` cloned exact commit
  `5061a86a47a1a1b3c8742fd3b442a24c3cb235c8` with `dirty=false` and made no
  Production change.
- The deployment failed before runtime in `buildStep`: Vercel's optimized Turbo
  scope ran the package-specific `@bundjil/agent#build`, whose override had
  dropped the root `dependsOn: ["^build"]`; Eve therefore could not resolve the
  unbuilt `@bundjil/eve-effect` workspace output.
- The package-specific build task now restores the upstream build edge and
  declares the Sendblue config names plus the two provider-owned KV fallback
  inputs. A forced clean local build executed
  `@bundjil/core -> @bundjil/eve-effect -> @bundjil/agent` with zero cached
  tasks, followed by full repository verification.
- The failed deployment is retained as diagnostic evidence. A new clean commit
  and immutable Preview deployment were used for route and webhook proof.

## Preview Proof Log

Recorded: 2026-07-13

- Clean Preview deployment `dpl_C2Xg1F8H8KFiARopc59WeDwKV7tQ` is `READY`
  from exact pushed commit `fdb71a87e930899aea1e75dd1f7a417f6c7a307e`.
  Its immutable host is recorded in the operator-owned 1Password item; the
  protected URL and credential values are not recorded here.
- The agent route is the public Eve path
  `POST /eve/v1/sendblue/webhook`. A build-output test rejects accidental
  exposure at root `/webhook`.
- Replay Config prefers the app-owned names and falls back to Vercel
  Marketplace's Preview-only `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
  Preferred app variables retain precedence and missing storage fails closed.
- A temporary Preview-only invalid preferred replay-store fixture returned
  `503` for an otherwise valid allowed-sender event with no downstream side
  effect. Both fixture variables were deleted immediately, and a clean restore
  deployment was verified before provider registration.
- An attempted provider mutation was cancelled before execution when its
  approval surface exposed the protected webhook URL. The affected Vercel
  bypass and independent Sendblue webhook secret were both revoked or rotated,
  saved back to the existing 1Password operator item, and deployed before any
  webhook was registered.
- Sendblue now has exactly one receive webhook. It targets the immutable
  Preview host and full Eve route, uses the Vercel bypass only at the platform
  boundary, and supplies the separate `sb-signing-secret` application secret.
- The post-rotation route matrix returned `401` for absent and wrong signing
  secrets, `400` for authenticated malformed JSON, `200` for an authenticated
  ignored outbound event, and `202` for a valid signed allowed-sender event.
- The accepted signed event produced one additional Sendblue provider message,
  whose final status was `DELIVERED`. One sequential and two concurrent replays
  of the same provider-shaped event all returned `200`; provider message count
  remained unchanged at five, with four outbound and one historical inbound.
- Vercel runtime evidence for the proof window contains no error or fatal logs.
  Evidence uses only deployment ids, status codes, counts, and a truncated
  SHA-256 handle digest. No message text, full number, handle, protected URL,
  credential, raw provider body, replay payload, or ciphertext is retained.
- A minimal outbound verification prompt was delivered to the allowlisted
  counterpart ending in `7386`. Its provider-originated reply traversed the
  registered Sendblue webhook and produced exactly one additional delivered
  outbound response, moving the conversation totals to seven messages: two
  inbound and five outbound.
- Replaying that real inbound provider handle returned `200`. After the
  observation window the totals remained seven, two inbound and five outbound,
  proving no duplicate Eve dispatch or provider reply. Only a 12-character
  SHA-256 digest prefix was used to correlate the handle.
- Production environment variables, storage connection, aliases, deployments,
  and webhooks remain untouched.

## Accepted Tasks

### implement-sendblue-contracts-and-client

Accepted: 2026-07-13

Changed files:

- `apps/agent/agent/lib/sendblue/**`
- `apps/agent/test/sendblue-config.test.ts`
- `apps/agent/test/sendblue-client.test.ts`
- Sendblue SPEC, task ledger, execution plan, and docs index

Evidence:

- Added branded E.164, provider handle, identity, conversation, replay, inbound,
  outbound, config, acknowledgement, and proof Schemas with derived types.
- Added distinct redacted Effect Config and an app-owned
  `SendblueConfigService` Layer with fail-closed required values and a guarded
  test-only API URL override.
- Added one named `SendblueClient.sendMessage` operation over Effect HTTP
  Schema codecs, with safe request, response, provider-rejection, transport,
  timeout, and uncertain-delivery errors.
- Added deterministic memory and injected-HTTP tests. No real credential,
  provider mutation, or Vercel environment change occurred in this slice.
- Moved the boundary from unsupported `agent/sendblue` to Eve's import-only
  `agent/lib/sendblue`, eliminating the build discovery warning.

Parent audit:

1. Ownership and call graph: behavior remains app-owned and the live path is
   `SendblueClient -> HttpClient`, with Config and HttpClient supplied through
   Layers. Tests replace both dependencies without provider access.
2. Implementation quality: primary operations are flat and named; canonical
   Schemas, Config, Context, Layer, Match, Redacted, and HTTP Schema codecs own
   the boundaries. Raw causes were removed after review to prevent secret,
   phone, content, header, and response-body leakage. No unsafe casts, manual
   JSON, direct env reads, raw fetch, DTO mirrors, or generic helpers remain.
3. Verification coverage: seven focused tests cover Config, exact synthetic
   headers/body, provider statuses including HTTP 2xx `ERROR`, malformed
   responses, transport/timeout uncertainty, leak safety, and memory-layer
   behavior. Agent and repository gates pass.

### implement-sendblue-security-identity-replay

Accepted: 2026-07-13

Changed files:

- `apps/agent/agent/lib/sendblue/{webhook-verifier,identity-directory,session-router,replay-store,replay-claim-id-generator}.service.ts`
- `apps/agent/agent/lib/sendblue/schemas.ts`
- `apps/agent/test/sendblue-security-identity.test.ts`
- `apps/agent/test/sendblue-replay-store.test.ts`
- `apps/agent/package.json`

Evidence:

- Added platform constant-time `sb-signing-secret` verification before any
  body-derived operation.
- Added allowlisted sender identity and HMAC-based opaque conversation routing
  services.
- Added discriminated replay claims, synchronized atomic memory behavior, and
  Upstash `SET NX EX` claims with owner-fenced compare/set and compare/delete
  Lua transitions.
- Added injectable secure claim ids so concurrency tests are deterministic.
- Reused the already locked `@upstash/redis` dependency; frozen install made no
  lockfile changes.

Parent audit:

1. Ownership and call graph: security, identity, routing, and replay policy are
   independent app-owned services. The live replay path is
   `SendblueReplayStore -> Upstash Redis`; tests replace both persistence and
   claim-id resources.
2. Implementation quality: the final implementation uses Schema, Redacted,
   Context, Layer, Effect, Match, Encoding, Clock, HashMap, SynchronizedRef,
   Effect HTTP-adjacent provider boundaries, and named operations. Every
   retained helper has multiple concrete call sites or owns cryptography,
   serialization, key derivation, atomic state, or Layer construction.
3. Verification coverage: ten focused tests prove auth-before-decode, sender
   policy, opaque line-partitioned routing, inbound/outbound contention, key
   independence, lease expiry, completed/uncertain duplicate protection,
   retryable immediate release, stale-owner failure, exact Upstash command
   shape, and leak-safe failures. Agent and repository gates pass.

### implement-sendblue-eve-channel

Accepted: 2026-07-13

Changed files:

- `apps/agent/agent/channels/sendblue.ts`
- `apps/agent/agent/lib/sendblue/{channel.service,live.layer,schemas}.ts`
- `apps/agent/test/sendblue-channel.test.ts`
- `knip.json`

Evidence:

- Added a stateful Eve custom channel discovered as `sendblue` with public
  `POST /eve/v1/sendblue/webhook` routing.
- Added authenticated inbound classification and durable claim decisions,
  opaque continuation routing, minimal Eve auth/state, and background dispatch
  through `waitUntil`.
- Added visible completed-message delivery with stable Eve coordinates,
  outbound replay claims, provider-handle completion, known-failure release,
  and uncertainty quarantine.
- Added an injectable channel factory for direct framework-edge tests while the
  default export owns one app-level live `ManagedRuntime`.
- Registered Eve filesystem channels as Knip entrypoints.

Parent audit:

1. Ownership and call graph: the thin Eve file owns framework adaptation only;
   provider, config, authentication, identity, routing, replay, and delivery
   policy remain in app-owned Effect services. No package or generic channel
   abstraction was introduced.
2. Implementation quality: primary operations are named linear Effects over
   canonical Schema, Match, Context, Layer, and ManagedRuntime boundaries.
   Claims precede all side effects; accepted dispatch and provider send paths
   complete or quarantine owner-fenced claims. Review corrected duplicate
   service injection, direction handling, length validation, and completion
   failure semantics. No manual JSON, unsafe casts, raw fetch, direct env reads,
   or helper sprawl remains.
3. Verification coverage: fifteen channel tests prove direct HTTP statuses and
   side effects, auth-before-decode, ignored classes, sequential/concurrent
   replay, Eve rejection release, stable outbound coordinates, visible-only
   delivery, over-limit/provider failure behavior, and uncertain no-resend.
   Agent checks/build, all repository verification, diff checks, Knip, and Eve
   discovery with zero diagnostics pass.

### document-and-audit-sendblue-channel

Accepted: 2026-07-14

Changed files:

- `README.md`
- `ARCHITECTURE.md`
- `apps/agent/README.md`
- `docs/architecture/eve-agent.md`
- `docs/architecture/repo-structure.md`
- Sendblue SPEC, task ledger, and execution plan

Evidence:

- Reconciled every durable documentation surface from future/draft language to
  the actual Preview-verified, Production-gated state.
- Documented the full route/status matrix, independent Vercel and Sendblue
  authentication boundaries, Config names and KV fallback, sender policy,
  opaque routing, claim lifecycle, uncertain delivery semantics, local tests,
  proof constraints, rotation, disablement, and rollback boundary.
- Corrected stale call-graph and retry wording found during parent review; no
  frontend work was invented for this machine-channel slice.

Parent audit:

1. Ownership and call graph: root, app, architecture, repo-structure, SPEC, and
   plan docs now place the thin Eve adapter and provider-specific Effect
   services in `apps/agent`, describe the live Preview and test graphs, remove
   stale future-Sendblue claims, and keep Production separately gated.
2. Implementation quality: the documented rules match the accepted canonical
   Schema, Redacted Config, Context, Layer, ManagedRuntime, named linear Effect,
   tagged-error, claim-before-side-effect, and owner-fenced replay patterns.
   Runtime scans found no unsafe casts, manual JSON, direct process env/raw
   fetch, JavaScript replay Map/Set, lint suppressions, DTO mirrors, or helper
   sprawl. Frontend composition is correctly not applicable.
3. Verification coverage: agent typecheck and all 38 tests pass; root
   Ultracite, Knip, all workspace typechecks/tests, task-ledger checks, and diff
   checks pass. Leak/stale scans found no exact 32-hex credential, protected
   webhook URL, untracked runtime proof artifact, or stale Sendblue status; the
   only tracked env-like file is the empty `.env.example`, and all E.164 values
   are synthetic test fixtures.
4. Final consistency: a post-audit read corrected historical discovery/build
   entries that still used present or future tense and replaced the final
   ambiguous bounded-release phrase with the implemented owner-fenced release.
   Formatting and diff checks remained green.

## Audit Log

`implement-sendblue-contracts-and-client` completed three parent passes. The
first pass corrected Config literal order, provider service values, raw-cause
leakage, and the transport test failure channel. The second corrected request
proof, allowlist/E.164 coverage, provider 2xx rejection handling, and Eve file
ownership. The third removed a redundant second provider-response decode and
confirmed the final verification surface.

`implement-sendblue-security-identity-replay` completed three parent passes.
Corrections included replacing JavaScript secret comparison with
`timingSafeEqual`, replacing manual hex encoding, making claim results a valid
discriminated union, injecting claim ids, failing stale transitions, aligning
memory/Upstash retryable behavior through owner-fenced release, and extending
equal-length auth, outbound contention, and successful CAS verification.

`implement-sendblue-eve-channel` completed three parent passes. Corrections
included teaching Knip about Eve filesystem entrypoints, removing duplicate
service injection, adding literal direction and nullable line handling,
validating provider limits before send, quarantining accepted dispatch/send
completion failures, adding direct Eve route tests, and proving owner-fenced claim
release when Eve rejects before acceptance.

`prove-sendblue-preview` completed three parent passes. The ownership/call-graph
pass confirmed that Vercel owns platform protection and encrypted Preview
inputs, Sendblue owns webhook delivery, the Eve channel owns framework
adaptation, and app-owned Effect services own authentication, identity,
routing, replay, and provider delivery.
The implementation-quality pass confirmed the corrected absolute route,
Config fallback precedence, fail-closed storage path, independent secrets, and
absence of a provisioning helper layer or committed operator script. The final
verification pass proved the full direct route matrix, storage-failure fixture,
one provider-originated inbound to one delivered outbound, sequential and
concurrent synthetic replay suppression, real-handle replay suppression,
clean runtime logs, sanitized evidence, and no Production mutation.

`document-and-audit-sendblue-channel` completed four parent passes. Pass one
corrected stale ownership, future-boundary, roadmap, call-graph, and retry-state
claims. Pass two audited the actual Effect source and helper inventory, then
corrected rendered metadata and remaining retry prose; no runtime or frontend
composition defect remained. Pass three reran targeted agent checks, all root
quality gates, ledger consistency, diff checks, and sanitized leak/PII/artifact
scans before accepting the task. A fourth consistency pass corrected historical
tense and the final replay-release phrase, then reran formatting and diff
checks.
