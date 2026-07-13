# Sendblue Eve Channel Implementation Plan

Status: In progress

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

## Current Task

No task is currently in progress. `implement-sendblue-eve-channel` has passed
parent acceptance and awaits its coherent commit before
`prove-sendblue-preview` begins.

Accepted scope:

- thin Eve channel route and framework runtime adapter;
- linear inbound auth, decode, classification, identity, routing, claim, and
  dispatch program;
- outbound completed-message filtering, replay claim, provider send, and
  complete/uncertain transition program;
- direct Request/Response and Eve event tests with injected Layers.

Provider account mutation and webhook provisioning are deferred until the
accepted channel slice is committed.

## Provider Discovery

Recorded: 2026-07-13

- The personal executor Sendblue connection is available.
- No receive, outbound, or typing webhook is currently configured.
- The account has an active iMessage line and recent message history.
- API credentials exist in the `SendBlue API` 1Password item; values were not
  copied into repository files or command output.

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

- Added a stateful Eve custom channel discovered as `sendblue` with
  `POST /webhook`, mounted by Eve at `/eve/v1/sendblue/webhook`.
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
completion failures, adding direct Eve route tests, and proving bounded claim
release when Eve rejects before acceptance.
