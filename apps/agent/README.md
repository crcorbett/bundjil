# @bundjil/agent

Committed Vercel Eve app for the first Bundjil agent slice.

## What Lives Here

- `agent/agent.ts`: root Eve definition.
- `agent/config.ts`: app-owned runtime config. The model is loaded through Effect
  `Config`, `ConfigProvider.fromEnv()`, and Effect Schema.
- `agent/model-provider.ts`: app-owned provider selector. It keeps AI Gateway
  as the default and can build an AI SDK OpenAI-compatible `LanguageModel` for
  the private Bundjil Codex proxy.
- `agent/instructions.md`: operational instructions for the minimal local
  agent.
- `agent/tools/workspace_status.ts`: Eve tool that delegates to
  `@bundjil/eve-effect`.
- `test/workspace-status-tool.test.ts`: app-level proof that the Eve tool
  execute path runs through the live Effect operation without starting Eve or
  calling a model.
- `test/model-provider.test.ts`: app-level proof that provider config selects
  Gateway by default and that Codex proxy mode sends private bearer auth only
  to the proxy.

## Provider State

Implemented:

- Gateway mode is the default model path.
- Codex proxy mode is opt-in with
  `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`.
- Local Codex proxy mode has been verified against `apps/codex-proxy` in mock
  mode.
- Hosted preview proof exists for `apps/codex-proxy`, but production and live
  Codex mode remain gated.

Future:

- Hosted live Codex proxy mode.
- Live OAuth endpoint exchange and refresh.
- Hosted token-profile storage after envelope encryption is implemented in the
  provider/storage boundary.

Unsupported:

- The Eve app must not import `CodexOAuthService`, `CodexProfileStore`, direct
  Codex HTTP clients, or hosted token storage adapters.
- Codex OAuth tokens are not OpenAI Platform API keys or AI Gateway
  credentials.
- The private proxy is not a public gateway.

## Commands

Run from the repository root:

```bash
bun run --filter @bundjil/agent dev:no-ui
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

`dev:no-ui` starts `eve dev --no-ui`. For installed `eve@0.20.0`, the default
local port is `2000`, so the app normally serves at:

```text
http://127.0.0.1:2000
```

## HTTP Endpoints

Default Eve channel routes:

- `GET /eve/v1/info`
- `POST /eve/v1/session`
- `POST /eve/v1/session/:sessionId`
- `GET /eve/v1/session/:sessionId/stream`

Useful local probes:

```bash
curl -sS http://127.0.0.1:2000/eve/v1/info
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:2000/eve/v1/session \
  -H "Content-Type: application/json" \
  -d '{"message":"Use the workspace_status tool to tell me what packages are available in the Bundjil repo. Keep the answer short."}'
```

Stream the returned session:

```bash
curl -N http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

## Environment

Gateway mode is the default:

- `BUNDJIL_AGENT_MODEL_PROVIDER`: optional provider mode. Defaults to
  `gateway`. Supported values are `gateway` and `codex-proxy`.
- `BUNDJIL_AGENT_MODEL`: optional non-empty Gateway model override. Defaults
  to `google/gemini-2.5-flash`.
- `AI_GATEWAY_API_KEY`: local or hosted AI Gateway credential.
- `VERCEL_OIDC_TOKEN`: credential normally pulled by `eve link`.

Codex proxy mode is opt-in:

- `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`: selects the private proxy
  provider.
- `BUNDJIL_CODEX_PROXY_BASE_URL`: required proxy base URL, including `/v1`.
  Example: `http://127.0.0.1:8788/v1`.
- `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`: required internal bearer token.
- `BUNDJIL_CODEX_PROXY_MODEL`: optional proxy model id override. If omitted,
  `BUNDJIL_AGENT_MODEL` is used as the proxy model id.
- `BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS`: optional positive integer.
  Defaults to `200000`.

The Eve app does not know about Codex OAuth profiles, refresh tokens, or the
direct `chatgpt.com` Responses endpoint. In Codex proxy mode it only receives
an AI SDK `LanguageModel` created with `@ai-sdk/openai-compatible`, and that
model calls the private Bundjil proxy with the internal bearer token.

Provider call graph:

```text
apps/agent/agent/agent.ts
  -> loadAgentConfigFromEnv
  -> BUNDJIL_AGENT_MODEL_PROVIDER
  -> gateway model string or @ai-sdk/openai-compatible LanguageModel
  -> apps/codex-proxy /v1/chat/completions when codex-proxy is selected
```

Test call graph:

```text
bun run --filter @bundjil/agent test
  -> apps/agent/test/model-provider.test.ts
  -> Effect Config provider selection
  -> injected fetch proof for proxy bearer auth and no token body leak

bun run --filter @bundjil/agent test
  -> apps/agent/test/workspace-status-tool.test.ts
  -> workspace_status.execute(...)
  -> @bundjil/eve-effect BundjilAgentOperationsLive
```

The Task 4 local HTTP proof had none of `AI_GATEWAY_API_KEY`,
`VERCEL_OIDC_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` present.
`/eve/v1/info` worked and `/eve/v1/session` returned HTTP 202, but streaming
failed with `MODEL_CALL_FAILED` because Eve had no AI Gateway credentials. Do
not fake model output when this boundary is hit.

Follow-up local proof created a personal Vercel AI Gateway key under the
`cooper-corbetts-projects` scope and stored it only in ignored
`apps/agent/.env.local`. With that key present, `/eve/v1/info` reports Gateway
`connected: true`, the model selects `workspace_status`, the tool result
completes, and the model summarizes the current packages:
`@bundjil/core`, `@bundjil/effect-start`, and `@bundjil/eve-effect`.

Do not commit `.env.local` or any copied Gateway key. Before adding new
runtime integrations or deployed app boundaries, create a SPEC through
`prd-writer` and execute it through `prd-implementer`.

Codex proxy local proof:

```bash
PORT=8788 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_MODE=mock \
bun run --filter @bundjil/codex-proxy dev
```

```bash
PORT=2101 \
BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy \
BUNDJIL_AGENT_MODEL=codex-default-model \
BUNDJIL_CODEX_PROXY_BASE_URL=http://127.0.0.1:8788/v1 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=123456 \
bun run --filter @bundjil/agent dev:no-ui
```

With those two local processes running, `GET /eve/v1/info` reports model id
`bundjil-codex-proxy/codex-default-model` and context window `123456`.
`POST /eve/v1/session` plus `GET /eve/v1/session/<sessionId>/stream` emits a
mock model response through the private proxy. The proof output should include
event type, model id, and status only; do not print bearer tokens, OAuth
tokens, prompts beyond the probe prompt, or full upstream payloads.

Schema JSON boundaries:

- Provider request bodies and proof helpers must use
  `Schema.fromJsonString(...)`.
- Unknown diagnostic values must use `Schema.UnknownFromJsonString`.
- Do not add manual JSON string assembly in app code.

Rollback to Gateway:

```bash
unset BUNDJIL_AGENT_MODEL_PROVIDER
unset BUNDJIL_CODEX_PROXY_BASE_URL
unset BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN
bun run --filter @bundjil/agent dev:no-ui
```

Hosted rollback is handled in `apps/codex-proxy`; the app-level rollback is to
remove the `codex-proxy` env vars so Eve uses Gateway again.

## Proof Boundary

The `codex-proxy` adapter is opt-in and uses app-owned Effect Config to create
an OpenAI-compatible `LanguageModel`; Gateway is the default. Its
configuration and injected-fetch tests prove adapter construction, private
bearer handling, and Gateway fallback. They do not prove a combined Eve ->
hosted Vercel live-proxy request. Refresh, fencing, SSE, and preview proof
belong to `apps/codex-proxy` and the hosted OAuth-storage SPEC.

## Runtime Artifacts

The app ignores Eve and Nitro runtime output:

```text
.eve/
.workflow-data/
.output/
```

These are local/generated artifacts and should not be committed.
