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

No task is currently in progress. `implement-sendblue-contracts-and-client`
has passed parent acceptance and awaits its coherent commit before
`implement-sendblue-security-identity-replay` begins.

Scope:

- app-owned Effect Schema contracts under `apps/agent/agent/lib/sendblue`;
- distinct redacted Effect Config;
- one named `SendblueClient.sendMessage` operation;
- live Effect HTTP and deterministic test Layers;
- focused config/client tests.

Provider account mutation and webhook provisioning are deferred until the
authenticated route exists and its automated checks pass.

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

## Audit Log

`implement-sendblue-contracts-and-client` completed three parent passes. The
first pass corrected Config literal order, provider service values, raw-cause
leakage, and the transport test failure channel. The second corrected request
proof, allowlist/E.164 coverage, provider 2xx rejection handling, and Eve file
ownership. The third removed a redundant second provider-response decode and
confirmed the final verification surface.
