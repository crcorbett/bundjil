# @bundjil/agent

Committed Vercel Eve app for the first Bundjil agent slice.

## What Lives Here

- `agent/agent.ts`: root Eve definition.
- `agent/channels/eve.ts`: explicit Vercel OIDC route policy with localhost-only development fallback.
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
- Hosted Eve preview has been verified with model id
  `bundjil-codex-proxy/gpt-5.5` through the private live proxy. Gateway remains
  the default when the opt-in preview configuration is absent.

Future:

- Production promotion, a stable production proxy URL, and separate production
  credential/profile provisioning require explicit approval.

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

`/eve/v1/session*` routes require Vercel OIDC when deployed. `localDev()` is
the final fallback for loopback development only; anonymous deployed callers
are rejected. `GET /eve/v1/health` remains the public Eve health probe.

## Production Preflight

The read-only promotion gate consumes a mode-`0600`, ignored Vercel metadata
snapshot produced by a read-only operator adapter. Its `stage` is a strict,
ordered discriminant: `before-first-mutation`, `proxy-provisioned`,
`proxy-accepted-agent-configured`, `agent-accepted-rollback-ready`, or
`sendblue-final-promotion`. Each stage accepts only facts available at that
point; later bindings, profiles, aliases, deployments, rollback references,
and Sendblue controls are rejected as premature evidence.

`before-first-mutation` requires granted approval, the exact personal team id
`team_1LX7ZujbijowTv8J9k0aU7nD`, linked projects and stable domains, Deployment
Protection, a clean pushed SHA, absent Bundjil Production activation, no
Preview identity reuse, and read-only inventory. The inventory then advances
exactly through proxy provisioned/agent absent, proxy accepted/agent configured,
and both accepted. Later stages add proxy binding/profile proof, accepted proxy
and agent configuration with Eve OIDC, immutable agent and rollback references,
then completed soak/rollback proof with Sendblue still unactivated. The command
does not read values and cannot deploy, alias, set variables, provision storage,
or write profiles.

```bash
BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT="$PWD/.local/production-preflight.json" \
  bun run --filter @bundjil/agent preflight:production
```

It emits only Schema-encoded sanitized go/no-go evidence, including the
checkpoint stage. A non-`0600` file, non-read-only adapter, unexpected field,
non-Production variable target, plain-text secret, Preview/branch proxy host,
mock/local mode, missing auth/protection, shared identity, or invalid immutable
reference fails closed. The accepted proxy and agent source references must
match the clean pushed SHA, and current rollback deployment/config references
must match the accepted deployments. The proxy URL is exactly
`https://bundjil-codex-proxy.vercel.app/v1`, without user info, port, query, or
fragment. Write-only Vercel `sensitive` variables are required for both internal
bearer bindings, the cipher key, and Upstash credentials; only non-secret
identifiers may remain `plain`.

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

## Sendblue Preview Channel

The app has an app-owned Sendblue custom channel. It is verified on one
immutable Vercel Preview deployment only; it is not enabled in Production.

- Route: `POST /eve/v1/sendblue/webhook`. The build test rejects `/webhook`.
- Authentication: Sendblue sends the configured shared secret in the
  `sb-signing-secret` header. It is compared in constant time before the body
  is read. This is a shared header secret, not a body HMAC.
- Deployment Protection: the Vercel bypass is an independent platform-auth
  credential. It lets Sendblue reach the Preview deployment but does not
  replace the route's `sb-signing-secret` authentication.
- Sender identity: only the redacted, schema-decoded
  `BUNDJIL_SENDBLUE_SENDER_IDENTITIES` allowlist may start a conversation. The
  sender and configured line produce an opaque keyed continuation token; raw
  phone numbers are not used as the Eve principal or routing key.
- Supported inbound event: direct, text-bearing, non-typing, `RECEIVED`
  iMessage from an allowlisted sender, addressed to the configured Sendblue
  line. The default allowed service is `iMessage`.
- Ignored with `200`: typing, outbound/direction-outbound, non-`RECEIVED`,
  group, media, blank, non-allowed-service, wrong-line, loopback, unknown
  sender, and duplicate events. Ignored events do not create an Eve session.
- Rejections: absent or invalid header returns `401`; authenticated malformed
  input returns `400`; an unavailable replay store or routing failure returns
  `503`; an accepted dispatch returns `202`.

Inbound handles are atomically claimed before Eve dispatch. On a rejected
dispatch, the owner-fenced retryable transition compare-and-deletes the claim,
releasing it for a later provider retry; an accepted dispatch is marked
complete. `message.completed` claims stable Eve coordinates before calling
Sendblue. Known provider rejections become retryable, while timeout,
transport, malformed-response, or completion-persistence failures become
uncertain and are not automatically resent. This protects against duplicate
personal messages; it does not promise exactly-once delivery after an
indeterminate provider outcome.

### Sendblue Configuration

All values are app-owned Effect `Config`; secrets use `Config.redacted` and
missing required configuration fails closed. Configure only Preview for the
accepted channel:

```text
BUNDJIL_SENDBLUE_API_KEY
BUNDJIL_SENDBLUE_API_SECRET
BUNDJIL_SENDBLUE_WEBHOOK_SECRET
BUNDJIL_SENDBLUE_FROM_NUMBER
BUNDJIL_SENDBLUE_SENDER_IDENTITIES
BUNDJIL_SENDBLUE_ROUTING_KEY
BUNDJIL_SENDBLUE_REPLAY_STORE_URL
BUNDJIL_SENDBLUE_REPLAY_STORE_TOKEN
BUNDJIL_SENDBLUE_REPLAY_STORE_PREFIX
BUNDJIL_SENDBLUE_REPLAY_STORE_TTL_SECONDS
BUNDJIL_SENDBLUE_REPLAY_STORE_LEASE_SECONDS
BUNDJIL_SENDBLUE_ALLOWED_SERVICES
```

Replay storage prefers the two `BUNDJIL_SENDBLUE_REPLAY_STORE_*` credentials
and otherwise uses the Preview-only Marketplace `KV_REST_API_URL` and
`KV_REST_API_TOKEN` fallback. `BUNDJIL_SENDBLUE_TEST_MODE=true` plus
`BUNDJIL_SENDBLUE_TEST_API_BASE_URL` is restricted to tests/local fixtures.
Never put values in commands, docs, test fixtures, or commits.

### Local Verification And Operations

```bash
bun run --filter @bundjil/agent check-types
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

The Preview proof recorded an authenticated `401`/`400`/`200`/`202` route
matrix, a fail-closed `503` replay-store fixture, one provider-originated
inbound to one delivered outbound, and sequential plus concurrent replay
suppression. It retained only deployment/status/count/digest metadata and had
no error or fatal runtime logs. It did not alter Production.

Rotate the Vercel bypass and Sendblue webhook secret independently in their
provider/operator stores, update the corresponding encrypted Preview values,
redeploy, then update the provider webhook. To disable the channel, remove the
Preview receive webhook first and then remove or revoke the Preview Sendblue
configuration; do not use a Production rollback as a substitute. Production
promotion remains gated by the separate Vercel Production Promotion SPEC.

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

## Hosted Preview

`bundjil-agent` is a personal Vercel preview project with root directory
`apps/agent`. Its Preview environment contains only the agent-owned provider
values above. It must not receive Codex OAuth profiles, access/refresh tokens,
Upstash credentials, or envelope cipher keys.

The root [`turbo.json`](../../turbo.json) declares those five provider values
only for `@bundjil/agent#build`. Eve resolves the model manifest during
`eve build`; without that scoped Turbo environment contract, a Vercel build can
silently compile the Gateway default instead of the selected proxy model.

Deploy preview from the repository root so Vercel uploads the workspace while
the project root remains `apps/agent`:

```bash
vercel deploy . --project bundjil-agent --scope cooper-corbetts-projects --yes
```

Use the encrypted Preview values already bound to the Vercel project. Do not
pass bearer values through shell history, commit them, or add them to source.
`eve deploy` targets production and `vercel deploy --prebuilt` skips Eve's
sandbox-template prewarm, so neither is the preview deployment command.

Hosted `/eve/v1/*` routes are intentionally fail-closed and accept a Vercel
OIDC bearer. Use a fresh `vercel project token` and `vercel curl` for private
preview checks. Replaying an existing session requires `startIndex=0`; record
only the resulting HTTP status, model id, event kinds, and counts.

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
hosted Vercel live-proxy request in isolation. The accepted hosted-preview
proof adds that boundary: authenticated Eve info selected
`bundjil-codex-proxy/gpt-5.5`, one minimal session replayed nine durable events
through `session.waiting`, and the private proxy logged one authenticated 200
chat-completions request. This is preview evidence only, not production
approval. Refresh, fencing, and proxy ownership remain in `apps/codex-proxy`
and `@bundjil/codex-oauth`.

## Runtime Artifacts

The app ignores Eve and Nitro runtime output:

```text
.eve/
.workflow-data/
.output/
```

These are local/generated artifacts and should not be committed.
