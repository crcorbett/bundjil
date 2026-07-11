# @bundjil/codex-proxy

Private Effect HTTP proxy for Bundjil Codex subscription model access.

This app exposes the deployable HTTP boundary for the Codex provider work. It
is private by bearer token and starts in mock mode. Its live composition can
read only an encrypted, access-token-only profile supplied by the trusted-local
import command; it has not received a hosted Vercel preview proof yet. Eve can
opt into this app through
`BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`, while Gateway remains the default
model path.

## Current State

Implemented:

- Local Effect HTTP handler for `GET /health` and
  `POST /v1/chat/completions`.
- Mock OpenAI-compatible SSE for local tests, local smoke tests, and Vercel
  preview proof.
- Vercel preview deployment for project `bundjil-codex-proxy` under Cooper's
  personal Vercel account, not Tilt Legal.
- Eve app opt-in model-provider wiring through an AI SDK OpenAI-compatible
  `LanguageModel`.
- Explicit live composition of the encrypted profile store, cipher, Upstash
  KeyValueStore, refresh lock, OAuth service, direct provider, and private
  proxy contract.
- Fail-closed live handling: missing configuration, profile storage failures,
  missing profiles, and expired profiles return a sanitized 502 that tells the
  operator to re-import the local profile. Imported profiles have no refresh
  token, so the proxy never refreshes them.

Future:

- Personal Vercel preview proof for access-token-only live calls.
- Live OAuth endpoint exchange and token refresh.
- Hosted token-profile storage after `@bundjil/codex-oauth` adds
  application-side envelope encryption.

Unsupported:

- Public gateway use.
- `OPENAI_API_KEY` or `CODEX_API_KEY` fallback for subscription mode.
- Treating Codex OAuth as a Vercel AI Gateway credential.
- Deploying this project to Tilt Legal.

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

In `live` mode, the app composes the direct Codex Responses provider through
encrypted Upstash profile storage. A valid imported profile can stream a
response. Any unavailable configuration, missing profile, expiry, or storage
failure returns a generic HTTP 502 with a re-import instruction; it never
falls back to mock mode, an API key, or token refresh.

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

Live mode also needs the profile cipher and Upstash configuration documented in
[`@bundjil/codex-oauth`](../../packages/codex-oauth/README.md):
`BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY`,
`BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`, and either
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` or the Vercel-provided
`KV_REST_API_URL` / `KV_REST_API_TOKEN` aliases. Run the local importer before
starting live mode; do not set any of these values in a browser bundle, CI, or
committed file.

Do not commit `.env` files or token values.

## Schema JSON Boundaries

Route request bodies, route responses, smoke-test payloads, SSE chunks, and
proof/leak-check output must stay tied to Effect Schema contracts. Use
`Schema.fromJsonString(...)` for request/response string boundaries and
`Schema.UnknownFromJsonString` for unknown diagnostic values. Do not add manual
JSON string assembly in route or script code.

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

Sanitized local proof shape:

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
rawPayloadLeak: false
```

Record only statuses, modes, content type, stream-line counts, model ids, and
leak booleans. Do not record bearer tokens, OAuth tokens, refresh tokens,
authorization codes, raw OAuth payloads, prompts, or full model responses.

## Call Graph

Production target path:

```text
Eve codex-proxy mode
  -> @ai-sdk/openai-compatible LanguageModel
  -> apps/codex-proxy /v1/chat/completions
  -> OpenAICompatibleProxy.handleChatCompletions(input)
  -> CodexDirectProvider.streamChatCompletion(input.completion)
  -> CodexOAuthService.getValidToken(subject)
  -> CodexHttpClient.postResponsesStream(input)
  -> chatgpt.com/backend-api/codex/responses
```

Current local and preview path:

```text
Request
  -> apps/codex-proxy/src/index.ts fetch wrapper
  -> HttpRouter.toWebHandler(...)
  -> apps/codex-proxy/src/server.ts routes
  -> CodexProxyConfig
  -> CodexProxyConfig selects mock or live layer
  -> mock: app-owned deterministic CodexDirectProvider
  -> live: encrypted profile -> CodexOAuthService.getValidToken
      -> direct Codex Responses provider
  -> OpenAI-compatible SSE Response
```

Test path:

```text
bun run --filter @bundjil/codex-proxy test
  -> direct Request/Response tests
  -> GET /health
  -> unauthenticated POST returns 401
  -> invalid-token POST returns 401
  -> authenticated mock POST streams SSE
  -> live mode with unavailable config returns a re-import-safe 502
  -> imported access-only profile streams through mocked Codex fetch
  -> expired imported profile returns a re-import-safe 502

bun run --filter @bundjil/codex-proxy smoke-test
  -> ephemeral local Bun server
  -> /health
  -> authenticated mock OpenAI-compatible SSE
```

The live composition is code- and test-proven only. Do not call it a hosted
integration until the separate personal Vercel preview proof task completes.

## Vercel Deployment

The project is linked as `bundjil-codex-proxy` under Cooper's personal Vercel
scope, `Cooper Corbett's projects`, not the Tilt Legal team. The project root
directory is `apps/codex-proxy`, the framework preset is `Other`, the Node.js
version is `24.x`, and the output directory is `.`.

The app deploys through `api/index.ts`, which routes Vercel rewrites back to
the existing Effect web handler. `apps/codex-proxy/vercel.json` rewrites all
paths to that function so public paths such as `/health` and
`/v1/chat/completions` reach the same handler used by local tests.

Use the Vercel CLI from this app directory:

```bash
cd apps/codex-proxy
vercel link --project bundjil-codex-proxy
vercel env pull .env.preview.local --environment=preview
bun run --filter @bundjil/codex-proxy build
vercel deploy
```

The link step must select Cooper's personal Vercel account. If the CLI is
scoped to Tilt Legal, stop and switch scopes before linking or deploying.

Set preview env vars through the Vercel dashboard or CLI. Do not print values
in docs or command logs:

```bash
vercel env add BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN preview
vercel env add BUNDJIL_CODEX_PROXY_MODE preview
```

Production deploy is allowed only after preview evidence is recorded:

```bash
vercel deploy --prod
```

Preview deployment proof recorded on 2026-07-07:

- Preview URL:
  `https://bundjil-codex-proxy-llqa9rwss-cooper-corbetts-projects.vercel.app`.
- Vercel project owner: `Cooper Corbett's projects`
  (`team_1LX7ZujbijowTv8J9k0aU7nD`), not Tilt Legal
  (`team_G8r6j3RIfXPtqb3j71bNQMbO`).
- Preview env vars are set as encrypted Vercel env vars:
  `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN` and
  `BUNDJIL_CODEX_PROXY_MODE=mock`.
- Vercel SSO deployment protection is disabled for this project so direct
  preview HTTP probes can reach the app routes. The model route remains
  protected by `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`. This is acceptable only
  for the current mock-mode preview; live Codex mode or production must
  re-enable Vercel protection or an equivalent private network/control
  boundary.
- `GET /health`: HTTP 200, `mode: mock`.
- Unauthenticated `POST /v1/chat/completions`: HTTP 401.
- Invalid-token `POST /v1/chat/completions`: HTTP 401.
- Authenticated mock `POST /v1/chat/completions`: HTTP 200,
  `text/event-stream`, 2 `data:` lines, final line `[DONE]`.
- Preview request logs scanned clean for bearer values, OAuth/token terms,
  probe text, invalid-token text, and full mock response text.
- Production deployment was skipped. Hosted live Codex proof remains pending
  and opt-in.

Required hosted checks before production:

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

vercel logs "${PROXY_URL}" --since 30m
```

Expected result:

```text
GET /health returns HTTP 200 and mode mock.
Unauthenticated POST returns HTTP 401.
Invalid-token POST returns HTTP 401.
Authenticated mock POST returns HTTP 200 and text/event-stream.
Stream has data lines and a final [DONE].
Logs contain no token values, authorization codes, raw OAuth payloads, prompts,
or full model responses.
```

## Rollback

Gateway is still the default model path. App-level rollback is to remove the
agent proxy env vars so Eve returns to Gateway:

```bash
unset BUNDJIL_AGENT_MODEL_PROVIDER
unset BUNDJIL_CODEX_PROXY_BASE_URL
unset BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN
```

Production deployment rollback:

```bash
vercel rollback <deployment-id-or-url>
vercel rollback status
```

Preview deployment cleanup, when a bad preview should no longer be reachable:

```bash
vercel remove <preview-deployment-url>
```

Do not rotate or print the internal token in rollback notes. Rotate it through
Vercel env management if a secret exposure is suspected.
