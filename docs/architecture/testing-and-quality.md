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
bun run --filter @bundjil/codex-oauth proof:codex-responses
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

## Scope Rules

- Docs-only change: run `bun run check` and targeted `rg` checks for links,
  paths, and renamed files.
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
  and must verify preview before production.
- Codex documentation task: update root, architecture, app, package, SPEC, and
  task-ledger docs as needed, then run `bun run check` and
  `bun run verification`.

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
   proof, preview-before-production evidence, leak scans, and docs updates.

Do not mark a task accepted just because three entries exist. If an audit pass
finds a gap, fix it and record another pass.

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

For Codex proxy mode, start the local proxy in mock mode first:

```bash
PORT=8788 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_MODE=mock \
bun run --filter @bundjil/codex-proxy dev
```

Then start Eve with the private provider selected:

```bash
PORT=2101 \
BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy \
BUNDJIL_AGENT_MODEL=codex-default-model \
BUNDJIL_CODEX_PROXY_BASE_URL=http://127.0.0.1:8788/v1 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=123456 \
bun run --filter @bundjil/agent dev:no-ui
```

Required local proof:

- `GET /eve/v1/health` returns ready.
- `GET /eve/v1/info` reports `bundjil-codex-proxy/...` and the configured
  context window.
- `POST /eve/v1/session` plus the stream endpoint emits a completed message.
- Output is sanitized and excludes bearer tokens, OAuth tokens, authorization
  codes, raw upstream responses, and full private prompts.

## Codex Proxy Verification

Local proxy checks use mock mode and must not call Codex:

```bash
bun run --filter @bundjil/codex-proxy smoke-test
```

The smoke test starts a local Bun server on an ephemeral port, checks
`GET /health`, and checks authenticated mock SSE from
`POST /v1/chat/completions`.

Manual local probes:

```bash
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=dev-only-token \
  bun run --filter @bundjil/codex-proxy dev
```

```bash
curl -sS http://127.0.0.1:8787/health
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.5","stream":true,"messages":[{"role":"user","content":"Say OK."}]}'
```

```bash
curl -N \
  -X POST http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer ${BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.5","stream":true,"messages":[{"role":"user","content":"Say OK."}]}'
```

Hosted checks must run against a Vercel preview deployment before production
and must inspect logs for absence of token values, authorization codes, raw
OAuth payloads, prompts, and full response bodies.

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

Preview direct HTTP checks:

```bash
PROXY_URL=<preview-url>

curl -sS "${PROXY_URL}/health"

curl -i -sS \
  -X POST "${PROXY_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.5","stream":true,"messages":[{"role":"user","content":"Say OK."}]}'

curl -i -sS \
  -X POST "${PROXY_URL}/v1/chat/completions" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.5","stream":true,"messages":[{"role":"user","content":"Say OK."}]}'

curl -N \
  -X POST "${PROXY_URL}/v1/chat/completions" \
  -H "Authorization: Bearer ${BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.5","stream":true,"messages":[{"role":"user","content":"Say OK."}]}'
```

Sanitized proof shape:

```text
healthStatus: 200
healthMode: mock
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

Production deployment is allowed only after preview proof is recorded:

```bash
vercel deploy --prod
```

Rollback:

```bash
vercel rollback <deployment-id-or-url>
vercel rollback status
```

Application rollback is also valid: remove
`BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy` and related
`BUNDJIL_CODEX_PROXY_*` env vars from the agent so Eve returns to Gateway.
Rotate the proxy token through Vercel env management if a secret exposure is
suspected; never print the old value in rollback notes.

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
