# Testing And Quality

Use the smallest check that proves the changed behavior, then broaden before
handoff when a change touches package contracts, runtime config, app tools, or
docs navigation.

## Standard Commands

Run from the repo root:

```bash
bun run check
bun run knip
bun run check-types
bun run test
bun run build
bun run verification
```

`bun run verification` is the standard closeout gate. It runs Ultracite,
dependency hygiene, workspace typechecks, and tests.

Package-focused commands:

```bash
bun run --filter @bundjil/core test
bun run --filter @bundjil/effect-start test
bun run --filter @bundjil/eve-effect test
bun run --filter @bundjil/codex-oauth test
bun run --filter @bundjil/codex-oauth build
bun run --filter @bundjil/effect-persistence test
bun run --filter @bundjil/effect-persistence build
bun run --filter @bundjil/codex-oauth proof:codex-responses
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

## Scope Rules

- Docs-only change: run `bun run fix`, `bun run check`, focused link/path and
  stale-ownership scans, and `git diff --check`. When a SPEC mandates the
  repository closeout gate, also run `knip`, `verification`, and `build` with
  the required ignored local environment loaded.
- Package schema or export change: run that package's `check-types`, tests, and
  build, then root `bun run verification`.
- Eve tool change: run `@bundjil/eve-effect` tests when contracts change,
  `@bundjil/agent` tests, `@bundjil/agent build`, then verification.
- Runtime config change: run app typecheck, app tests, app build, and
  verification.
- Channel/provider integration change: add or update a SPEC first, then include
  mock tests, live-boundary proof where safe, and docs.
- Codex subscription proof change: run `@bundjil/codex-oauth` tests,
  typecheck/build, and the opt-in `proof:codex-responses` command only with a
  private `CODEX_ACCESS_TOKEN` source. Proof output must contain only status,
  endpoint, byte/line counts, and safe booleans.
- Codex proxy app change: run `@bundjil/codex-proxy` check-types, tests,
  build, and smoke-test. Hosted deployment proof belongs in the deployment task
  and must verify isolated Preview before Production changes.
- Codex documentation task: update root, architecture, app, package, SPEC, and
  task-ledger docs as needed. Documentation-only verification must include
  stale-claim scans and `git diff --check`; run broader checks only when the
  parent acceptance task requires them.

## Mandatory Effect Audit

SPEC implementation tasks that touch Effect runtime, provider, storage, app
config, deployment, or durable docs must record the 3-pass Effect TS audit:

1. Ownership and call graph: right app/package owner, stable imports/exports,
   production call graph, test call graph, and unsupported paths.
2. Implementation quality: flat primary `Effect.gen` programs, Effect Schema
   contracts, schema-derived types, tagged errors, `Config.redacted` for
   secrets, explicit layers, and no unsafe casts, DTO mirrors, manual object
   readers, or helper sprawl.
3. Verification coverage: targeted commands, root commands, local/proxy/live
   proof, preview-before-production evidence, leak scans, docs updates, and
   deliberately skipped checks with their reasons.

Do not mark a task accepted just because three entries exist. If an audit pass
finds a gap, fix it and record another pass.

For persistence work, verify native `KeyValueStore` and
`AtomicKeyValueStore.transact` independently, scan for
`KeyValueStore.modify`/get-then-set coordination and consumer SDK imports, and
assert physical-key, encoded-value, TTL, privacy, replay, and rollback claims.
Replay records are not conversation/session/Workflow storage. Deployment proof
and monitoring may retain only safe statuses, counts, source correlation, and
leak booleans; do not use `clear` or `size` as coordination or recovery.

## Effect Test Patterns

Use `@effect/vitest` for Effect programs:

```ts
it.effect("does the thing", () =>
  Effect.gen(function* testThing() {
    const result = yield* program;
    assert.strictEqual(result.ok, true);
  })
);
```

Rules:

- Test live deterministic layers without external credentials.
- Provide memory/mock layers for service boundaries.
- Keep provider-network tests explicit and opt-in.
- Validate schema failures, not only success paths, when a schema owns a public
  edge.
- For Eve tools, test both `execute(...)` behavior and the Standard Schema /
  Standard JSON Schema metadata produced by `toEveSchema(...)`.

## Eve Runtime Verification

The app test suite proves tool execution without starting Eve or calling a
model. For local HTTP proof, start Eve:

```bash
bun run --filter @bundjil/agent dev:no-ui
```

For installed `eve@0.20.0`, the default local URL is:

```text
http://127.0.0.1:2000
```

Useful probes:

```bash
curl -sS http://127.0.0.1:2000/eve/v1/info
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:2000/eve/v1/session \
  -H "Content-Type: application/json" \
  -d '{"message":"Use the workspace_status tool to tell me what packages are available in the Bundjil repo. Keep the answer short."}'
```

```bash
curl -N http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

Do not fake model output when Gateway credentials are missing. A session may
start and then fail during streaming with `MODEL_CALL_FAILED`; document that
boundary rather than pretending the model path completed.

## Executor MCP Verification

For an Executor endpoint or instruction change, run focused agent check-types,
tests, and build with an explicit synthetic toolkit URL for each supported
`elicitation_mode=model` and `elicitation_mode=browser`. Config tests must
reject missing, duplicate, unknown, native, legacy model-resume, root,
non-HTTPS, wrong-host, port, userinfo, fragment, and extra-query forms through
the sanitized tagged config error. Instruction assertions must prove that a
paused model-mode turn makes no same-turn resume, only a later unambiguous
authenticated or allowlisted owner decision maps to one resume, ordinary
resume uses default empty content, and ambiguous/non-owner/quoted/provider/
tool/third-party/missing/multiple/mismatched/settled/replayed state fails
closed without a resume attempt.

The temporary model protocol is instruction-level and weaker than native or
browser authorization. Keep destructive and authority-management operations
blocked and the first Production acceptance operation read-only. Do not claim
browser rollback from a paused result or source review: change the
target-scoped URL only after clean Preview proof of the hosted page, approve,
decline, settled replay, and Sendblue delivery, then redeploy from a clean SHA
before Production promotion. The earlier implementation slice ran no provider,
browser, Vercel, or Sendblue operation; the separately owned Task 6 promotion
record below is the exception and retains only sanitized operator evidence.

For Production Executor promotion, retain evidence in three
separate states: reviewed intended policy, Preview-verified behavior, and
Production-verified behavior. The reviewed state proves that an independent
Production toolkit has one selected connection and five ordered policy rules
matching accepted Preview intent. The accepted promotion record proves
Production-only Sensitive Vercel bindings, clean-source current and rollback
deployments, protected health, exact MCP discovery, and read-only execution.
The replacement bearer matches exactly one current Executor inventory row by
unique provider name and masked value, is durably stored in the labeled Personal
item, and matches the replaced Production-only Sensitive binding. The temporary
handoff file is removed. Since Executor keys are account-level, a dedicated
environment key is an operational isolation control and toolkit scope comes
from endpoint/policy. The accepted current and rollback agent deployments are
`READY` at `e1f33e8`; the refreshed live proxy is also `READY` and healthy at
that revision. Direct MCP proof and a deployed OIDC-authenticated Eve session
both completed the exact approved GitHub PR read. The Eve run discovered the
connection, loaded the execute skill, invoked the read, completed the turn, and
reached `session.waiting`; no write or approval path ran.

Before accepting Production, verify without retaining values: labeled Personal
1Password storage before key handoff; exact unique-name/masked-value correlation
for the dedicated environment key; both Vercel variables targeted only to
Production and marked Sensitive; clean pushed source plus immutable current and
rollback deployment references; protected health; exactly `skills`, `execute`,
and `resume`; one authenticated read-only execution; zero Production writes;
and log/evidence scans with zero credential, protected-URL, prompt, provider
result, OAuth, message-content, and execution-id retention. Dry-run or
read-only inventory must prove policy block, key revocation, deployment restore,
and post-revocation rejection procedures while leaving the accepted Production
key active until an incident or planned rotation.

Codex proxy mode is not an ordinary Eve test requirement. Gateway remains the
default. Accepted Production proof verifies a deployed Eve request through the
live private proxy; Preview proof is historical. The access-token-only `local`
workaround is deprecated and must never be used as hosted auth. Source ignored
env values rather than printing them:

```bash
PORT=<local-port> \
BUNDJIL_CODEX_PROXY_MODE=mock \
bun run --filter @bundjil/codex-proxy dev
```

Use the dedicated proxy runbook in
[`apps/codex-proxy/README.md`](../../apps/codex-proxy/README.md) for mock,
access-token-only local filesystem, refresh-capable hosted live,
reauthentication, monitoring, and rollback operations.

## Codex Proxy Verification

Local proxy checks use mock mode and must not call Codex:

```bash
bun run --filter @bundjil/codex-proxy smoke-test
```

The smoke test starts a local Bun server on an ephemeral port, checks
`GET /health`, and checks authenticated mock SSE from
`POST /v1/chat/completions`.

Manual probes must use a minimal request from a private shell; the server
decodes it through the owning Effect Schema boundary.
Record no request body or model output. Checks must run against the isolated
personal Vercel environment before a Production change and must scan logs for
absence of token values, authorization codes, raw OAuth payloads, prompts, and
full response bodies. The refresh-capable code path, historical Preview proof,
and Production proof are accepted. Do not infer a future deployment change
from a prior proof record.

Hosted Eve verification requires the scoped `@bundjil/agent#build` environment
contract in `turbo.json`, a source deploy from the repository root, a fresh
Vercel OIDC bearer for `/eve/v1/*`, and a durable stream replay with
`startIndex=0`. Record provider/model id, HTTP status, event types/count, and
leak booleans only; never record the bearer, prompt, or full model response.
For future Production changes, establish the isolated Preview proof first.

`@bundjil/agent#build` must remain non-cacheable. `eve build` owns
deployment-local `.vercel/output` materialization and sandbox-template prewarm;
a replayed Turbo log is not proof that those artifacts were restored. A
deployment check must include one non-forced redeploy after this task contract
changes and fail if Vercel falls back to a configured static output directory.

The preview project is `bundjil-codex-proxy` in Cooper's personal Vercel
account. It must not be linked to Tilt Legal.

Preview deployment command shape:

```bash
cd apps/codex-proxy
vercel link --project bundjil-codex-proxy
vercel env pull .env.preview.local --environment=preview
bun run --filter @bundjil/codex-proxy build
vercel deploy
```

The linked Vercel project settings should remain:

```text
project: bundjil-codex-proxy
scope: Cooper Corbett's projects
root directory: apps/codex-proxy
framework: Other
node version: 24.x
build command: bun run --filter @bundjil/codex-proxy build
output directory: .
```

Preview direct HTTP checks start with the public health endpoint. Send the
private authenticated request only from an ignored local env source and record
the sanitized result shape below:

```bash
PROXY_URL=<preview-url>

curl -sS "${PROXY_URL}/health"
```

Sanitized proof shape:

```text
healthStatus: 200
healthMode: mock or live
unauthenticatedStatus: 401
invalidTokenStatus: 401
streamStatus: 200
streamContentType: text/event-stream
streamDataLines: 2 or greater
streamDone: true
tokenLeak: false
authorizationCodeLeak: false
rawPayloadLeak: false
```

Inspect hosted logs after preview checks:

```bash
vercel logs "${PROXY_URL}" --since 30m
```

Only status lines, route names, deployment ids, HTTP status codes, and sanitized
proof counters belong in docs. Do not record bearer values, OAuth token
values, refresh token values, authorization codes, raw OAuth payloads, full
prompts, or full model responses.

For the historical refresh-capable Preview composition, rollback is setting preview
`BUNDJIL_CODEX_PROXY_MODE` to `mock` and deploying another preview. The
access-token-only filesystem proof is revoked by deleting its ignored
directory. Rotate Vercel or Upstash credentials through provider controls if
exposure is suspected; never print the old value. Current Production rollback
is recorded in the Production promotion plan and is not performed by this
historical Preview runbook.

## Documentation Quality

Every durable feature should leave behind:

- a package README update when package behavior changes;
- an architecture doc update when ownership or patterns change;
- app README updates for commands, env vars, routes, and local proof;
- a SPEC and task ledger for new apps, channels, providers, or package
  boundaries.

Use `rg` for docs checks:

```bash
rg -n "old-path|old-package|old-command" README.md AGENTS.md docs apps packages
rg -n "docs/architecture/(effect-patterns|repo-structure|testing-and-quality)" README.md AGENTS.md docs ARCHITECTURE.md
```

Docs should describe current behavior and exact verification commands. Avoid
long aspirational sections unless they clearly mark future work.
