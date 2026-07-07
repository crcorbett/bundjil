# @bundjil/codex-proxy

Private Effect HTTP proxy for Bundjil Codex subscription model access.

This app exposes the first deployable HTTP boundary for the Codex provider
work. It is private by bearer token, starts in mock mode, and does not call the
live Codex backend yet. Eve is not wired to this app in the current slice.

## Routes

- `GET /health`: returns JSON service status and current mode.
- `POST /v1/chat/completions`: private OpenAI-compatible streaming endpoint.
  It requires `Authorization: Bearer <BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN>`.

In `mock` mode, `/v1/chat/completions` returns deterministic
`text/event-stream` SSE:

```text
data: {"id":"chatcmpl-bundjil-codex-proxy-mock",...}

data: [DONE]
```

In `live` mode, this implementation slice returns HTTP 503. Live Codex calls
remain gated on the deployment and storage tasks in the spec.

## Environment

Config is parsed in `src/env.ts` with Effect `Config`, `Config.schema`,
`Config.redacted`, and `ConfigProvider.fromEnv()`.

- `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`: required private bearer token.
- `BUNDJIL_CODEX_PROXY_MODE`: optional, `mock` or `live`, defaults to `mock`.
- `BUNDJIL_CODEX_PROFILE_ID`: optional, defaults to `default`.
- `BUNDJIL_CODEX_CONNECTOR_ID`: optional, defaults to
  `bundjil-codex-proxy`.
- `BUNDJIL_CODEX_INSTALLATION_ID`: optional, defaults to `local`.
- `BUNDJIL_CODEX_SUBJECT_ID`: optional, defaults to `default`.
- `BUNDJIL_CODEX_ACCOUNT_ID`: optional Codex account id.
- `PORT`: optional local dev port, defaults to `8787`.

Do not commit `.env` files or token values.

## Commands

Run from the repo root:

```bash
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
```

Start local dev with an ignored token source:

```bash
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=dev-only-token \
  bun run --filter @bundjil/codex-proxy dev
```

Local probes:

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

## Call Graph

```text
Request
  -> apps/codex-proxy/src/index.ts fetch wrapper
  -> HttpRouter.toWebHandler(...)
  -> apps/codex-proxy/src/server.ts routes
  -> CodexProxyConfig
  -> OpenAICompatibleProxy.handleChatCompletions(input)
  -> app-owned CodexDirectProvider mock layer
  -> OpenAI-compatible SSE Response
```

The package-owned live path remains:

```text
OpenAICompatibleProxy
  -> CodexDirectProvider
  -> CodexOAuthService / CodexProfileStore
  -> CodexHttpClient
  -> chatgpt.com/backend-api/codex/responses
```

That live path is not used by this app until the hosted storage and deployment
tasks are completed.

## Vercel Deployment

Deployment is a later task. The project must be named `bundjil-codex-proxy`
and linked under Cooper's personal Vercel account, not the Tilt Legal team.

Required hosted checks before production:

```text
preview deploy
  -> GET /health returns 200
  -> unauthenticated POST /v1/chat/completions returns 401
  -> invalid token POST /v1/chat/completions returns 401
  -> authenticated mock POST /v1/chat/completions streams SSE
  -> logs contain no token values, authorization codes, prompts, or raw bodies
```

Production deployment is allowed only after preview evidence is recorded in
the task ledger.

## Rollback

Until Eve is wired to the proxy, rollback is simply to leave
`apps/agent` on its existing AI Gateway model config and avoid deploying this
app. After deployment, roll back by promoting the previous Vercel deployment or
removing the future Eve proxy provider env vars. Do not rotate or print the
internal token in rollback notes; rotate it through Vercel env management if a
secret exposure is suspected.
