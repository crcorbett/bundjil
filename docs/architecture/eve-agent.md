---
document_type: architecture
lifecycle: current
authority: canonical
owner: bundjil-agent-owner
last_reviewed: 2026-07-21
review_trigger: Eve app, channel, model-provider, config, route, runtime, or proof-boundary change
---

# Eve Agent Architecture

## Codex Provider Proof Boundary

Gateway remains the default Eve provider. `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`
selects an app-owned Effect Config path that builds a private
OpenAI-compatible `LanguageModel`. Production evidence verifies one deployed
Eve request through the private live proxy. The isolated Preview evidence and
Task 4's accepted bounded Production handset evidence are historical rollout
records, not standing provider probes. Earlier adapter proofs remain distinct
historical evidence for their own environments.

This guide documents the committed Bundjil Eve app and the Effect package
boundaries it uses. The repository contains one clean provider-neutral Channel
path with Sendblue and Photon transport implementations. Both build and conform
locally; neither clean route is standing Production truth or authorised for
deployment. The bounded Photon provider-only proof is dated evidence, not a
hosted Preview or messaging proof. Cloudflare email, Vercel Connect, and Notion
remain future boundaries.

## Filesystem Layout

Committed source:

```text
apps/agent/
  package.json
  tsconfig.json
  vitest.config.ts
  agent/
    agent.ts
    config.ts
    instructions.md
    model-provider.ts
    channels/
      eve.ts
      sendblue.ts
      photon.ts
    lib/channel/
      channel.ts
      config.ts
      dispatch.ts
      eve.ts
      identity.ts
      photon.runtime.ts
      replay.ts
      router.ts
      runtime.ts
      schemas.ts
      sendblue.runtime.ts
    tools/
      workspace_status.ts
  test/
    model-provider.test.ts
    workspace-status-tool.test.ts

packages/
  channel/
  sendblue/
  photon/
  eve/
    src/
      schemas.ts
      errors.ts
      schema.ts
      workspace-status.ts
      services/
        workspace-operations.ts
    test/
      error-contracts.test.ts
      workspace-operations.test.ts
      schema.test.ts
```

Ignored local/runtime files:

```text
node_modules/
.local/
.env
.env.*
!.env.example
apps/agent/.eve/
apps/agent/.workflow-data/
apps/agent/.output/
```

`.local/references/*` checkouts are local-only references. The committed
`eve@0.20.0` package docs under `node_modules/eve/docs` are the authoritative
lookup for the installed Eve API. Secrets belong in ignored env files or
Vercel-managed runtime configuration, never in committed source.

## Package Boundary

`apps/agent` owns the Eve filesystem runtime:

- `agent/agent.ts` defines the Eve agent and reads app config from
  `agent/config.ts`.
- `agent/config.ts` defines the model-provider config through Effect Config,
  `Config.redacted`, `Config.url`, Effect Schema, and
  `ConfigProvider.fromEnv()`.
- `agent/model-provider.ts` owns the provider selector. It returns either the
  default Vercel AI Gateway model string or an AI SDK `LanguageModel` created
  with `@ai-sdk/openai-compatible` for the private Bundjil Codex proxy.
- `agent/instructions.md` tells the agent to use `workspace_status` for
  current repo/package questions and not to claim live channels or integrations.
- `agent/tools/workspace_status.ts` is the model-facing Eve tool slug.
- `agent/channels/sendblue.ts` and `agent/channels/photon.ts` are thin
  composition edges. Each owns one module-edge `ManagedRuntime`, one absolute
  route identity, and one provider Layer selection; neither contains provider
  or domain policy.
- `agent/lib/channel/eve.ts` owns the shared Eve adapter, status mapping,
  `waitUntil` completion, typed `ChannelEvents` projection, one runtime
  execution per callback, and the exact encoded snapshot assignment.
- `agent/lib/channel/` owns canonical app Schemas, tagged errors,
  `Config.schema` environment binding names, identity, HMAC continuation
  routing, atomic replay, immutable `ChannelStateV1`, outbound/presence policy,
  request-scoped dispatch, and provider composition roots.
- `@bundjil/channel` owns the nominal provider-neutral transport service and
  direct-text contracts; `@bundjil/sendblue` and `@bundjil/photon` own only
  their private wire/client boundaries and live/memory transport Layers.
- `@bundjil/store` supplies `AtomicKeyValueStore`; the app owns Channel keys,
  records, lease/TTL, and transitions. No clean owner reads the removed legacy
  Sendblue state, replay key, continuation, typing lifecycle, or config names.

`@bundjil/eve` owns the reusable operation boundary:

- `WorkspaceStatusInput` and `WorkspaceStatusSuccess` are canonical Effect
  Schema contracts.
- `WorkspaceSchemaError` is the schema-backed workspace-status failure.
- `WorkspaceOperations` is the named Effect service.
- `WorkspaceOperationsLive` uses the package-owned deterministic workspace
  summary.
- `WorkspaceOperationsMemory` lets tests replace the operation without Eve
  or model access.
- `@bundjil/eve/schema` exports `toEveSchema(schema)` for Eve's tool schema
  boundary.

`@bundjil/store`, `@bundjil/codex`, and
`apps/codex-proxy` now participate in the optional Codex proxy model path:

- `@bundjil/store` owns native `KeyValueStore` composition,
  `AtomicKeyValueStore`, and the explicit Upstash adapter. Native `modify` is
  not used for coordination.
- `@bundjil/codex` owns the direct Codex Responses package contracts,
  OpenAI-compatible request/stream schemas, direct provider service, private
  proxy service, and redacted internal-token schema.
- `apps/codex-proxy` owns the deployable private Effect HTTP proxy app,
  Vercel entrypoint, local dev host, app config, internal bearer-token auth,
  mock/local/live composition, and proxy proof.
- `apps/agent` owns only provider selection. It does not import Codex OAuth
  profile services, token refresh services, or direct Codex Responses clients.

Current Codex provider state:

- Implemented: Gateway default, opt-in Codex proxy `LanguageModel`, default
  mock proof, trusted-local encrypted filesystem proof, direct Codex Responses
  package proof, and personal-Vercel Production/Preview `live` compositions
  over encrypted Upstash storage.
- The `live` composition is refresh-capable. It reads the encrypted subscription
  profile, refreshes inside skew under a distributed lock, fenced-CAS commits
  each generation, and performs one revision-aware replay after a provider 401.
  It persists no ID token.
- The trusted-local browser/loopback PKCE login writes that encrypted profile.
  Vercel exposes no OAuth start or callback route. `local` remains the separate
  access-token-only filesystem proof and never refreshes.
- Proven in Production: one deployed Eve -> hosted-live-proxy completion.
  Sanitized hosted Preview and adapter proofs remain historical. Gateway
  remains the Eve default.
- Unsupported: treating Codex OAuth as an OpenAI Platform API key, routing
  Codex OAuth through Vercel AI Gateway credentials, deploying
  `bundjil-codex-proxy` to Tilt Legal, or exposing the proxy publicly.

## Schema Boundary

Eve tools accept Standard Schema or JSON Schema. Bundjil keeps Effect Schema as
the source of truth and bridges it once at the Eve edge:

```ts
Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema));
```

`toEveSchema(schema)` wraps that pattern. The result gives Eve both:

- Standard Schema validation via `~standard.validate`.
- Standard JSON Schema metadata via `~standard.jsonSchema`.

The app does not define Zod mirrors or standalone DTOs for tool input/output.
The `workspace_status` tool imports `WorkspaceStatusInput`,
`WorkspaceStatusSuccess`, `getWorkspaceStatus`, and
`WorkspaceOperationsLive` from `@bundjil/eve`.

## Executor MCP Approval Boundary

`apps/agent/agent/lib/executor/config.ts` owns the canonical Effect Schema for
the Executor endpoint's explicit `elicitation_mode`: only `model` and
`browser` are accepted. The app rejects an absent, duplicate, native, unknown,
legacy model-resume, root, non-HTTPS, wrong-host, port, userinfo, fragment, or
extra-query endpoint rather than inheriting Executor's default-to-model
behavior. `ExecutorConfigError` is the sanitized schema-backed config failure,
with `loadEndpoint` and `loadApiKey` as its exact operations.
`apps/agent/agent/lib/executor/` remains the import-only implementation slot;
`apps/agent/agent/connections/executor.ts` remains the thin direct Eve adapter
and exposes only `skills`, `execute`, and `resume`.

Temporary model mode supports chat channels only through instructions. A
`user_approval_required` execute result ends its turn without a resume call;
one later unambiguous direct decision from the authenticated or allowlisted
owner may resume the single matching pending execution using default empty
content. Ambiguous, quoted, forwarded, provider, tool, or third-party text,
non-owner input, and missing, multiple, mismatched, settled, or replayed state
must not resume. This is weaker than Executor native or browser authorization,
not a hard authorization boundary. Executor policy still blocks destructive
and authority-management operations, and the first Production acceptance
operation remains read-only.

Browser mode remains the rollback target. Change the target-scoped URL only
after clean Preview proof renders the hosted page, covers approve, decline,
settled replay, and delivery through the separately selected/promoted Channel,
then redeploys from a clean SHA before Production promotion. No Bundjil
approval service, persistence store, state machine, MCP client, proxy, or SDK
is introduced: Eve owns session continuity and Executor owns the paused
execution state.

Production authority is therefore an app-owned configuration binding, not a
shared package or a second policy engine. The independent Production toolkit
holds the reviewed connection and ordered policy intent; the app may receive
only its dedicated endpoint and redacted environment bearer through
Production-only Sensitive Vercel variables. Executor keys are account-level,
while the endpoint and policy are toolkit-scoped. The accepted promotion proves
the Sensitive binding inventory, clean-source deployment correlation, protected
health, exact `skills`/`execute`/`resume` discovery, direct read-only MCP proof,
and a deployed OIDC-authenticated Eve read through the Codex proxy. The current
and rollback agent deployments are `READY` at revision `e1f33e8`; the refreshed
private proxy is also `READY` and healthy in `live` mode at that revision. The
deployed turn called `connection_search`, `executor__skills`, and
`executor__execute`, returned `succeeded`, and reached `session.waiting` with no
write or approval request. Revocation remains provider-owned: block the toolkit
policy and revoke the dedicated key, then remove the app binding and restore the
retained immutable deployment. Executor and Vercel inventories may provide
sanitized status evidence, but no raw provider result, execution identifier, or
credential belongs in Bundjil. A mode-`0600` ignored local credential copy is a
trusted-workstation recovery aid only, never a package or runtime owner.

The removed Sendblue implementation and its dated Production/Preview provider
observations remain in completed SPECs and plans as historical rollback
provenance. They are not the call graph of the clean source, do not establish
current webhook topology, and must not be copied into new state/config/replay
owners. A later provider-selection and Production-promotion SPEC must obtain
fresh external readback before it changes any deployment or webhook.

## Production Call Graph

The default Gateway runtime path is:

```text
Eve HTTP/API
  -> apps/agent/agent/agent.ts
  -> agentConfig
  -> loadAgentConfigFromEnv
  -> loadAgentModelProviderConfig
  -> provider: "gateway"
  -> model string google/gemini-2.5-flash or BUNDJIL_AGENT_MODEL
  -> Eve AI Gateway model runtime
```

The optional Codex proxy model path is:

```text
Eve HTTP/API
  -> apps/agent/agent/agent.ts
  -> agentConfig
  -> loadAgentConfigFromEnv
  -> loadAgentModelProviderConfig
  -> provider: "codex-proxy"
  -> createAgentModel(...)
  -> @ai-sdk/openai-compatible LanguageModel
  -> apps/codex-proxy /v1/chat/completions
  -> OpenAICompatibleProxy.handleChatCompletions
  -> CodexDirectProvider.streamChatCompletion
  -> CodexOAuthService / CodexHttpClient / CodexStreamMapper
  -> chatgpt.com/backend-api/codex/responses
```

Tests prove all three compositions without provider credentials. `mock` remains
the default. `local` is a trusted Bun-only proof, while `live` is a personal
Vercel preview composition that must be exercised through the sanitized
operator runbook before it is described as a live-provider proof. No production
mode or deployment was set by Bundjil, and the refresh-capable live path is not
wired into Eve.

The `workspace_status` tool runtime path is:

```text
Eve HTTP/API
  -> /eve/v1/info, /eve/v1/session, /eve/v1/session/:sessionId/stream
  -> apps/agent/agent/agent.ts
  -> apps/agent/agent/instructions.md
  -> apps/agent/agent/tools/workspace_status.ts
  -> toEveSchema(WorkspaceStatusInput / WorkspaceStatusSuccess)
  -> getWorkspaceStatus(input)
  -> WorkspaceOperationsLive
  -> makeWorkspaceSummary
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
  -> Eve tool result
```

`workspace_status.ts` keeps the one-off Effect execution inline at the consumer:

```ts
Effect.runPromise(
  getWorkspaceStatus(input).pipe(Effect.provide(WorkspaceOperationsLive))
);
```

## Channel Call Graphs

The provider-specific production-code paths differ only at composition and
transport boundaries:

```text
POST /eve/v1/sendblue/webhook              POST /eve/v1/photon/webhook
  -> SendblueChannelRuntimeLive              -> PhotonChannelRuntimeLive
  -> @bundjil/sendblue layerLive              -> @bundjil/photon layerLive
                  \                          /
                   -> shared makeChannelEveChannel
                   -> Channel.decodeWebhook(Request)
                   -> Channel.prepareInbound(decoded common message)
                   -> ChannelIdentity.resolve
                   -> ChannelRouter.route
                   -> ChannelReplay.claimInbound -> AtomicKeyValueStore.transact
                   -> EveChannelDispatchEve(send).dispatch under waitUntil
                   -> Channel.completeInbound
```

The provider Layer authenticates exact ingress before one complete payload
decode: Sendblue compares the documented shared header secret; Photon verifies
webhook ID, timestamp tolerance, event header, and raw-body HMAC. Provider wire
values become one decoded `ChannelInboundTextMessage` and do not cross into app
policy.

Accepted ingress returns `202`; ignored or duplicate ingress returns `204`.
Authentication failures return `401`, authenticated malformed input returns
`400`, and replay/routing failures return `503`. Deployment protection is a
separate platform boundary and never substitutes for provider authentication.

Eve events use the same Channel service:

```text
turn.started / authorization.completed
  -> makeChannelEveEvents
  -> Schema.decodeEffect(ChannelAdapterState)
  -> Channel.handleEvent(PresenceRequested start)
  -> ChannelTransport.setPresence
  -> Schema.encodeEffect(ChannelAdapterState)
  -> exact snapshot assignment

message.completed with non-empty final text
  -> Schema.decodeUnknownEffect(ChannelEvent.OutboundTextReady)
  -> ChannelReplay.claimOutbound(event coordinates)
  -> ChannelTransport.sendMessage
  -> accepted -> owner-fenced complete record
  -> uncertain send -> owner-fenced uncertain record, never auto-resend
  -> known rejection/unavailability/encoding/unsupported -> remove owned claim
  -> immutable ChannelStateV1
  -> exact encoded snapshot assignment
```

`authorization.required`, `input.requested`, terminal turn/session events, and
waiting request presence stop. Presence is stateless app policy: the provider
returns accepted/no-op/failure, while persisted state remains only
`ChannelAdapterState { snapshot: ChannelStateV1 }`. No legacy
`Idle | Pending | Active`, typing-repair state, provider attempt observation,
or compatibility decoder exists.

Outbound provider success means Channel `accepted`; it never means handset
delivered. The app issues no automatic provider retry after an ambiguous send.
The later promotion/monitoring owner must observe safe outcome/error-class and
latency counts without retaining content, identities, raw bodies, or provider
IDs.

## Test Call Graph

App test path:

```text
bun run --filter @bundjil/agent test
  -> apps/agent/test/workspace-status-tool.test.ts
  -> workspaceStatusTool.execute(...)
  -> getWorkspaceStatus(...).pipe(Effect.provide(WorkspaceOperationsLive))
  -> @bundjil/eve defaultWorkspacePackages
  -> @bundjil/eve makeWorkspaceSummary -> WorkspaceSummary decode

bun run --filter @bundjil/agent test
  -> apps/agent/test/model-provider.test.ts
  -> loadAgentConfig / loadAgentModelProviderConfig
  -> createAgentModel
  -> AI Gateway string or @ai-sdk/openai-compatible LanguageModel
  -> injected fetch proof for private bearer auth and no token body leak

bun run --filter @bundjil/agent test
  -> channel-config / channel-vertical / sendblue-channel suites
  -> Config.schema namespace and Redacted secret checks
  -> Channel memory Layers and typed Eve event factory
  -> identity, HMAC routing, atomic concurrent replay, immutable state encoding
  -> Sendblue and Photon provider substitution through composition roots
  -> both authored routes in the built Nitro output
  -> behavior without provider access
```

Package test path:

```text
bun run --filter @bundjil/eve test
  -> packages/eve/test/workspace-operations.test.ts
  -> WorkspaceOperationsLive
  -> WorkspaceOperationsMemory
  -> packages/eve/test/schema.test.ts
  -> toEveSchema(WorkspaceStatusInput / WorkspaceStatusSuccess)

bun run --filter @bundjil/channel test
  -> canonical memory transport and common contract behavior

bun run --filter @bundjil/sendblue test
  -> shared ChannelTransport conformance
  -> authenticated webhook and complete HTTP codec failures

bun run --filter @bundjil/photon test
  -> shared ChannelTransport conformance
  -> signature/body/SDK/Space/presence/uncertain-send lifecycle fixtures
  -> provider-proof success, cleanup failure, and ambiguous-create recovery

bun run --filter @bundjil/codex test
  -> profile store, token service, request/stream mappers
  -> mocked Codex fetch/direct provider layers
  -> mocked Upstash-like client through Effect KeyValueStore

bun run --filter @bundjil/codex-proxy test
  -> direct Request/Response handler tests
  -> /health
  -> unauthorized and invalid-token rejection
  -> authenticated mock SSE
```

These tests prove the operation path without starting Eve or calling a model.

## Local Commands

Run commands from the repo root:

```bash
bun install --frozen-lockfile
bun run --filter @bundjil/eve test
bun run --filter @bundjil/channel test
bun run --filter @bundjil/sendblue test
bun run --filter @bundjil/photon test
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
bun run check
bun run check-types
bun run test
bun run verification
```

Start the Eve app without the interactive UI:

```bash
bun run --filter @bundjil/agent dev:no-ui
```

For `eve@0.20.0`, the installed CLI help and runtime constants default to
`$PORT`, then `2000`. The local URL is normally `http://127.0.0.1:2000`.

The Codex proxy app is verified separately:

```bash
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy smoke-test
```

When testing Eve against the local proxy, run the proxy first:

```bash
PORT=8788 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_MODE=mock \
bun run --filter @bundjil/codex-proxy dev
```

Then start Eve in Codex proxy mode:

```bash
PORT=2101 \
BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy \
BUNDJIL_AGENT_MODEL=codex-default-model \
BUNDJIL_CODEX_PROXY_BASE_URL=http://127.0.0.1:8788/v1 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=123456 \
bun run --filter @bundjil/agent dev:no-ui
```

## HTTP Endpoints

`agent/channels/eve.ts` exposes Eve routes with the app-owned Vercel OIDC and
local-development auth policy:

- `GET /eve/v1/health`
- `GET /eve/v1/info`
- `POST /eve/v1/session`
- `POST /eve/v1/session/:sessionId`
- `GET /eve/v1/session/:sessionId/stream`

The provider routes are separately authored and require provider
authentication in addition to any deployment boundary:

- `POST /eve/v1/sendblue/webhook`
- `POST /eve/v1/photon/webhook`

Local probes:

```bash
curl -sS http://127.0.0.1:2000/eve/v1/info
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:2000/eve/v1/session \
  -H "Content-Type: application/json" \
  -d '{"message":"Use the workspace_status tool to tell me what packages are available in the Bundjil repo. Keep the answer short."}'
```

Use the returned `sessionId` to stream events:

```bash
curl -N http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

Initial Task 4 evidence from this spike:

- `GET /eve/v1/info` returned HTTP 200.
- The agent model id was `google/gemini-2.5-flash`.
- Eve discovered `workspace_status` as an authored tool with `hasExecute: true`
  and `hasOutputSchema: true`.
- `POST /eve/v1/session` returned HTTP 202 with `ok`, `sessionId`, and
  `continuationToken`.
- Streaming that session emitted `session.started`, `turn.started`,
  `message.received`, `step.started`, `step.failed`, `turn.failed`, and
  `session.failed`.
- The failure code was `MODEL_CALL_FAILED`.
- Eve reported missing AI Gateway credentials and said the local run needs
  `VERCEL_OIDC_TOKEN` from `eve link` or `AI_GATEWAY_API_KEY`.
- No model response or `workspace_status` model-selected tool call was faked.

Follow-up live Gateway proof:

- A personal Vercel AI Gateway key was created under the
  `cooper-corbetts-projects` scope and stored only in ignored local file
  `apps/agent/.env.local`.
- `GET /eve/v1/info` then returned the same model id,
  `google/gemini-2.5-flash`, and reported Gateway endpoint
  `connected: true` with credential type `api-key`.
- `POST /eve/v1/session` returned `ok: true` for the workspace-status prompt.
- The stream emitted `actions.requested` for `workspace_status`, followed by a
  completed `action.result`.
- The historical tool output listed the then-current reusable packages:
  `@bundjil/core`, `@bundjil/effect-start`, and `@bundjil/eve-effect`.
- The model completed with a concise answer naming those three historical
  package names.

Follow-up local Codex proxy proof:

- `GET /eve/v1/health` returned `ok: true` and `status: ready`.
- `GET /eve/v1/info` reported model id
  `bundjil-codex-proxy/codex-default-model`, provider
  `bundjil-codex-proxy`, and context window `123456`.
- `GET /health` on the local proxy returned `ok: true` and `mode: mock`.
- `POST /eve/v1/session` returned a session id for a short probe prompt.
- `GET /eve/v1/session/<sessionId>/stream` emitted `session.started`,
  `message.appended`, `message.completed`, `step.completed`,
  `turn.completed`, and `session.waiting`.
- The streamed model text was the mock proxy response, proving Eve used the
  private proxy `LanguageModel`.
- The proof output contained no bearer token, OAuth token, refresh token,
  authorization code, or raw upstream response body.

## AI Gateway Setup

`apps/agent/agent/config.ts` validates the Gateway model id as a non-empty
Effect Schema string. The committed default is:

```text
google/gemini-2.5-flash
```

Override it locally when needed:

```bash
BUNDJIL_AGENT_MODEL=<gateway-model-id> bun run --filter @bundjil/agent dev:no-ui
```

Use one of the supported credential paths:

- Run `eve link` from `apps/agent` to link a Vercel project and pull
  `VERCEL_OIDC_TOKEN` or `AI_GATEWAY_API_KEY` into an ignored local env file.
- Or provide `AI_GATEWAY_API_KEY` through an ignored `.env.local`, shell
  environment, or Vercel project environment.

Do not commit `AI_GATEWAY_API_KEY`, `VERCEL_OIDC_TOKEN`, provider API keys, or
Vercel project secrets. For local Bundjil development, the current working
machine uses an ignored `apps/agent/.env.local` key from the personal Vercel
scope `cooper-corbetts-projects`. If credentials are missing, local sessions
can start but the streamed turn fails before the model can select tools.

## Codex Proxy Provider Setup

Codex proxy mode is configured with app-owned Effect Config values:

```text
BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy
BUNDJIL_AGENT_MODEL=<fallback-or-proxy-model-id>
BUNDJIL_CODEX_PROXY_BASE_URL=<private-proxy-base-url-including-/v1>
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=<redacted-internal-bearer-token>
BUNDJIL_CODEX_PROXY_MODEL=<optional-proxy-model-id>
BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=<optional-positive-integer>
```

Rules:

- Keep Gateway mode as the default. Implementing refresh-capable `live` proxy
  behavior does not authorize production. The accepted hosted-preview proof
  uses `bundjil-codex-proxy/gpt-5.5`; production still requires an explicit
  approval, stable production proxy URL, and separate credentials.
- Put the internal proxy token only in ignored env files or Vercel env vars.
- Keep `BUNDJIL_CODEX_PROXY_BASE_URL` pointed at the private proxy `/v1`
  prefix, not the direct `chatgpt.com` endpoint.
- The agent app must not import `CodexOAuthService`, `CodexProfileStore`, or
  direct Codex HTTP clients. Those remain package/proxy concerns.
- Provider request bodies, proof output, tests, smoke scripts, and leak checks
  must use Effect Schema JSON encoders such as
  `Schema.fromJsonString(...)`.
- Unknown diagnostic values that need safe rendering must use
  `Schema.UnknownFromJsonString`.

### Historical Hosted Eve Preview

The personal Vercel project `bundjil-agent` has root directory `apps/agent`.
It uses Vercel Preview variables for the five app-owned Codex-proxy settings
and Vercel OIDC route authentication. It must not receive the OAuth profile,
refresh token, Upstash credentials, or cipher key owned by the proxy/provider
boundary.

Eve records model metadata during `eve build`. Therefore
`turbo.json` declares the provider variables on `@bundjil/agent#build`; this is
both the least-privilege build contract and the Vercel strict-environment
requirement. That task is intentionally non-cacheable because each hosted
`eve build` must materialize `.vercel/output` and prewarm the deployment's
sandbox templates. A source preview deploy runs from the repository root:

```bash
vercel deploy . --project bundjil-agent --scope cooper-corbetts-projects --yes
```

Do not use `eve deploy` for preview because it targets production, and do not
use `vercel deploy --prebuilt` because Eve cannot prewarm sandbox templates
without Vercel's hosted build context. Hosted checks use a fresh Vercel OIDC
token and `vercel curl`; replaying a durable session stream includes
`?startIndex=0`. Record only status, model id, event kinds, counts, and leak
booleans.

On 2026-07-13, personal preview deployment
`dpl_7UoZs5PVmdtvK4Ee9RPmyaXzD6Lc` reported external model routing to
`bundjil-codex-proxy/gpt-5.5` with a 200000-token context window. One minimal
authenticated session replayed nine events including `message.completed`,
`turn.completed`, and `session.waiting`; the private proxy recorded one
authenticated `POST /v1/chat/completions` with HTTP 200. Agent and proxy logs
contained route/status metadata only and their runtime-error queries were
empty. This is preview proof, not production deployment evidence.

## Historical Preview Proxy Verification

The deployed proxy belongs to the `bundjil-codex-proxy` project in Cooper's
personal Vercel account, not Tilt Legal. At this historical Preview checkpoint,
the proxy setup was Preview-only and Bundjil had not configured or deployed
Production; Marketplace Upstash credentials did not activate it.

Preview deployment command shape:

```bash
cd apps/codex-proxy
vercel link --project bundjil-codex-proxy
vercel env pull .env.preview.local --environment=preview
bun run --filter @bundjil/codex-proxy build
vercel deploy
```

Direct preview checks use a minimal request from a private shell; the server
decodes it through the owning Effect Schema boundary.
do not paste the request body, bearer value, account identifier, or model output
into a terminal transcript or documentation:

```bash
PROXY_URL=<preview-url>
curl -sS "${PROXY_URL}/health"
```

Record only sanitized proof fields: HTTP statuses, `mode`, model id, content
type, SSE data-line count, `[DONE]` presence, and leak booleans. Do not record
bearer tokens, OAuth tokens, refresh tokens, authorization codes, raw OAuth
payloads, prompts, or full model responses.

For this historical Preview composition, rollback is a Preview mode change to
`mock` or an agent config rollback to Gateway. Production rollback is recorded
separately in the Production promotion plan:

```bash
vercel rollback <deployment-id-or-url>
vercel rollback status
```

Remove `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`,
`BUNDJIL_CODEX_PROXY_BASE_URL`, and
`BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN` from agent env to return Eve to the
Gateway model path.

Before starting new integrations such as Cloudflare email, Vercel Connect,
Notion, or a new deployed app boundary, draft a compact SPEC with
`prd-writer` and implement it through `prd-implementer` so call graphs,
ownership, verification gates, and Effect audit evidence are recorded before
code moves.

## Future Boundaries

The clean Sendblue and Photon routes are implementation candidates, not
Production selections. These integrations are also intentionally not
implemented in the current slice:

- Cloudflare Email Routing Workers and email handlers.
- Vercel Connect connection setup and token exchange.
- Notion tools and workflow-specific operations.
- Long-term memory persistence.

Add them in `apps/agent` first unless the contract has become stable enough to
move into a capability-owned package.

Any Production Channel promotion begins with `$prd-writer`, not a deployment
command. The new SPEC must select clean Sendblue or Photon and own fresh
provider/Vercel readback, isolated Preview configuration, new secret custody,
new routing/replay namespaces, ingress disable-and-drain, the provider retry
horizon, webhook cutover, monitoring/alerts, accepted-versus-delivered proof,
rollback traffic quarantine, retained deployment recovery, and old deployment
retirement. It must preserve the intentional continuity break and must not
reintroduce legacy Sendblue code, config, state, replay, typing, or tests.
