# Codex OAuth Eve Model Provider

Status: Implementation resumed; preview proxy is live and local Eve-to-preview proof is recorded; hosted Eve deployment remains pending
Owner: Bundjil  
Created: 2026-07-07

## Current Evidence Boundary

The app-owned opt-in `codex-proxy` LanguageModel adapter and Gateway-default
selection are implemented and covered by focused configuration/fetch tests.
The refresh-capable proxy is deployed in Cooper's personal Vercel preview and
has a sanitized authenticated live-SSE proof.

On 2026-07-13, a local Eve runtime configured with the fresh preview
environment selected `bundjil-codex-proxy/gpt-5.5`, created a session, and
streamed a minimal Codex response through the deployed proxy. This proves the
combined application call graph below, but it is not a hosted Eve deployment
proof and does not authorize production use:

```text
local Eve runtime
  -> private deployed preview Codex proxy
  -> encrypted Upstash subscription profile
  -> Codex Responses endpoint
  -> OpenAI-compatible SSE
  -> Eve session stream
```

The original preview proof command exposed a verification defect: it emitted a
result object but exited successfully even when the authenticated request was
not `200` or SSE completion/leak predicates failed. The first resumed task
makes those predicates hard pass/fail assertions and adds deterministic test
coverage before the current source is redeployed.

Hosted Eve deployment, its personal Vercel project, its environment binding,
and an external Eve request remain unproven. Gateway remains the default until
that deployment task is accepted.

## Purpose

Create a Bundjil-owned Codex OAuth provider boundary that can use a ChatGPT /
Codex subscription identity as a model credential source for the personal
agent, without adopting OpenClaw or copying its implementation.

The intended direction is:

```text
apps/agent Eve runtime
  -> Bundjil model provider selection
  -> AI SDK OpenAI-compatible provider
  -> private Bundjil Codex proxy
  -> @bundjil/codex-oauth direct Codex provider services
  -> Effect KeyValueStore-backed profile storage
  -> https://chatgpt.com/backend-api/codex/responses
```

This spec is deliberately split into a proof-first implementation. Bundjil can
own OAuth profiles, token refresh, and Codex Responses request mapping, but it
must not claim that a Codex OAuth token is a general OpenAI API key or a
Vercel AI Gateway credential.

## Research Evidence

### Official OpenAI / Codex docs

- OpenAI documents two Codex sign-in paths: ChatGPT sign-in for subscription
  access and API keys for usage-based access. Codex cloud requires ChatGPT
  sign-in; CLI and IDE support both paths.
- OpenAI says ChatGPT sign-in causes Codex usage to follow ChatGPT workspace
  permissions, RBAC, and applicable workspace data-handling policies. API key
  sign-in follows the OpenAI Platform organization.
- OpenAI documents that Codex CLI and IDE browser sign-in return an access
  token, and that `CODEX_ACCESS_TOKEN | codex login --with-access-token` can
  seed CLI auth.
- OpenAI documents local credential caching in `~/.codex/auth.json` or an OS
  credential store and warns that file-backed auth contains access tokens.
- OpenAI documents Codex access tokens for trusted automation when ChatGPT
  Business / Enterprise workspaces need ChatGPT-managed Codex entitlements.
  Those tokens are for Codex local workflows, not general OpenAI API calls.
- OpenAI documents custom Codex model providers with
  `requires_openai_auth = true`; that is relevant for Codex using an LLM proxy,
  but does not by itself prove Eve can use the same token as a model provider.
- OpenAI documents the Codex SDK as a server-side way to control local Codex
  agents from TypeScript and Python. The SDK is explicitly for coding-focused
  Codex threads and requires a local Codex runtime.

Source URLs:

- <https://developers.openai.com/codex/auth>
- <https://developers.openai.com/codex/enterprise/access-tokens>
- <https://developers.openai.com/codex/sdk>

### OpenClaw reference pattern

OpenClaw is useful as prior art only. Bundjil must not adopt OpenClaw code,
package structure, state files, or runtime gateway.

The pattern worth investigating is:

- OAuth provider id normalized to one provider namespace.
- PKCE browser login with `openid profile email offline_access`.
- Loopback callback with a manual paste fallback for remote/headless cases.
- Token profile as a "token sink" so one owner refreshes a rotating refresh
  token instead of racing multiple local tools.
- Stored profile fields similar to access token, refresh token, expiry, and
  account id.
- Runtime refresh under a lock before model calls.
- Multiple profiles supported by explicit profile ids, with the simpler
  personal-agent default being one profile per agent.

Risk: OpenClaw says OpenAI Codex OAuth is supported outside Codex CLI, but that
claim is not a substitute for Bundjil proving the exact supported runtime path
against current OpenAI / Codex surfaces.

Source URL:

- <https://docs.openclaw.ai/concepts/oauth>

### Eve and AI SDK integration

Installed `eve@0.20.0` declares `PublicAgentDefinition.model` as an AI
SDK-compatible `LanguageModel` or a Gateway model string. The installed type
documentation says an authored Eve agent model accepts "an AI Gateway model ID
or any AI SDK-compatible language model."

This gives Bundjil two candidate integration seams:

1. Keep `apps/agent/agent/agent.ts` on an AI Gateway model string until Codex
   auth is proven.
2. If Codex OAuth can be presented through an OpenAI-compatible model endpoint,
   construct an AI SDK `LanguageModel` using `@ai-sdk/openai-compatible` and
   pass it to Eve.

The AI SDK OpenAI-compatible provider supports `createOpenAICompatible({
name, baseURL, apiKey, headers, fetch })` and returns provider models that can
be used with `generateText` and other AI SDK runtime calls. This is a likely
adapter shape if Bundjil hosts a private model endpoint, but it must not be
exposed publicly.

Local files inspected:

- `node_modules/eve/dist/src/shared/agent-definition.d.ts`
- `node_modules/eve/dist/src/internal/runtime-model.d.ts`
- `apps/agent/agent/agent.ts`
- `apps/agent/agent/config.ts`

Source URL:

- <https://ai-sdk.dev/providers/openai-compatible-providers>

### Effect v4 KeyValueStore

The public Effect docs describe `@effect/platform/KeyValueStore` as an
effectful key-value service with string / binary operations, in-memory and file
implementations, and schema-backed stores for non-string values.

Bundjil's local Effect v4 reference uses the current effect-smol path:

```ts
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";
```

The local source exposes `KeyValueStore`, `KeyValueStoreError`,
`makeStringOnly`, `prefix`, `layerMemory`, `layerFileSystem`, `layerSql`, and
`toSchemaStore`. The spec and implementation should follow the local v4 source
for imports while citing the public docs for the concept.

Local files inspected:

- `.local/references/effect-v4/packages/effect/src/unstable/persistence/KeyValueStore.ts`

Source URL:

- <https://effect.website/docs/platform/key-value-store/>

### Effect HTTP API and Mobius API reference

Executor personal DeepWiki on `Effect-TS/effect` confirmed the current Effect
HTTP stack can expose a web-standard handler suitable for Vercel-style
serverless entrypoints:

- Use `effect/unstable/httpapi` (`HttpApi`, `HttpApiGroup`,
  `HttpApiEndpoint`, `HttpApiBuilder`, `HttpApiScalar`, `OpenApi`) for typed
  JSON management endpoints, schema-backed request/response validation, and
  OpenAPI generation.
- Use `effect/unstable/http/HttpRouter` for raw routes that need exact body
  and streaming control. The Codex proxy's `/v1/chat/completions` route should
  be an `HttpRouter.add(...)` route, not a fully buffered typed JSON endpoint.
- Use `HttpRouter.toWebHandler(...)` at the app boundary to produce a
  web-standard `Request -> Response` handler for Vercel and tests.
- Use `HttpServerRequest.toWeb(...)` or request body access at the route edge
  when a raw proxy route must preserve headers/body semantics.
- Use `HttpServerResponse.raw(...)` or the current Effect streaming response
  constructor for SSE so the proxy does not buffer Codex response streams.

`~/Projects/Mobius/apps/api` provides the local deployment reference:

- `apps/api/src/index.ts` composes live layers once at module scope and exports
  a web-standard `fetch` handler for Vercel.
- `apps/api/src/dev.ts` runs the same Effect routes locally with
  `HttpRouter.serve(...)` and a Bun HTTP server layer.
- `packages/backend/http-api/src/server.ts` keeps the app boundary thin by
  exporting `HttpRouter.toWebHandler`.
- `packages/backend/http-api/src/live.layer.ts` composes typed
  `HttpApiBuilder.layer(...)` routes, raw `HttpRouter.add(...)` routes, docs,
  middleware, and infrastructure layers.

Bundjil should copy this architecture, not the Mobius domain code: packages
own reusable Effect services and route layers; `apps/codex-proxy` owns Vercel
deployment, env binding names, local dev, and smoke-test scripts.

### Vercel storage research

Vercel KV is no longer the right target for new work. Vercel storage docs and
Marketplace docs point new key-value workloads to Marketplace storage,
especially Upstash Redis. Vercel Marketplace storage can provision resources
and inject environment variables into linked projects. Upstash Redis exposes a
free / pay-as-you-go path and is appropriate for lightweight key-value state.

Bundjil should define its OAuth profile store against Effect `KeyValueStore`
and add a Vercel / Upstash adapter only after the pure service is proven with
memory and file-backed layers. Hosted KV storage must not store raw refresh
tokens until the implementation defines and verifies an encryption-at-rest
strategy owned by Bundjil or by the provider account boundary.

Source URLs:

- <https://vercel.com/docs/storage>
- <https://vercel.com/docs/marketplace-storage>
- <https://vercel.com/docs/redis>
- <https://vercel.com/marketplace/upstash>

### Executor / DeepWiki research

The user requested DeepWiki research through `mcp__executor_personal`.

Initial attempts made on 2026-07-07:

1. `mcp__executor_personal.skills({ name: "execute" })` returned
   `OAuth authorization required`.
2. `mcp__executor_personal.execute(...)` returned the same OAuth requirement.
3. `codex mcp get executor-personal` confirmed the server is enabled at
   `https://executor.sh/personal-3548/mcp` with OAuth auth.
4. `codex mcp login executor-personal` opened a browser authorization flow and
   waited on the loopback callback, then timed out with
   `timed out waiting for OAuth callback`.

After the forked thread was started and executor personal OAuth was completed,
the DeepWiki tool became available at:

```text
deepwiki_mcp.user.personaldeepwikimcp.ask_question
```

DeepWiki queries completed on 2026-07-07:

- `vercel/eve`: Eve accepts either a Vercel AI Gateway model string or an AI
  SDK `LanguageModel` object in `agent.ts`. Gateway strings get Gateway
  attribution/caching behavior; direct `LanguageModel` objects route through
  their own `provider` and `modelId` and do not get Eve's Gateway attribution
  headers or automatic Gateway caching behavior. This confirms the integration
  seam for a custom provider, but also confirms Bundjil must own provider
  caching/headers/security when bypassing Gateway.
- `openai/codex`: Codex supports auth modes including API key, ChatGPT-managed
  OAuth, device-code login, personal access token, agent identity, and
  host-provided `ChatgptAuthTokens`. DeepWiki identified `ChatgptAuthTokens` as
  unstable and "FOR OPENAI INTERNAL USE ONLY - DO NOT USE." The supported
  public path is therefore Codex workflow auth, not arbitrary chat completions
  for another app. Bundjil must not treat Codex OAuth as a generic Eve model
  credential unless a separate supported endpoint is proven.
- `Effect-TS/effect`: DeepWiki confirmed the platform `KeyValueStore` concept,
  schema-backed stores, memory and filesystem layers, and error mapping with
  `mapError` / tagged boundaries. Its answer referenced the older
  `@effect/platform` package path, so Bundjil's local Effect v4 source remains
  authoritative for implementation imports:
  `effect/unstable/persistence/KeyValueStore`.
- `aaif-goose/goose`: DeepWiki confirmed Goose's `chatgpt_codex` provider is
  direct HTTP, not `codex app-server`, ACP, or a Codex CLI subprocess. Goose
  performs PKCE OAuth against `https://auth.openai.com`, uses client id
  `app_EMoamEEZ73f0CkXaXp7hrann`, scopes `openid profile email offline_access`,
  a localhost callback on port `1455`, and token cache fields for access token,
  refresh token, id token, expiry, and account id. It posts directly to
  `https://chatgpt.com/backend-api/codex/responses` with bearer auth,
  `Content-Type: application/json`, and `chatgpt-account-id` when available.
  This makes the Goose-style direct provider the preferred first proof for
  Bundjil.

### Implementation proof evidence

On 2026-07-07, `@bundjil/codex-oauth` added a direct Codex Responses proof
surface:

- `CodexResponsesFetch` owns the fetch boundary.
- `CodexHttpClient.postResponses(input)` posts to
  `https://chatgpt.com/backend-api/codex/responses` with
  `Authorization: Bearer <redacted>` and optional `chatgpt-account-id`.
- `CodexResponsesProof.run(input)` builds a minimal streaming proof request
  with `store: false` and returns only sanitized metadata.
- `proof:codex-responses` reads `CODEX_ACCESS_TOKEN` through Effect Config and
  Schema, then prints status, endpoint, HTTP status, content type, response
  byte count, stream-line count, and account-header usage only.

The live proof was run by injecting the local Codex cache access token into
`CODEX_ACCESS_TOKEN` for a single process. The command returned HTTP 200 from
the direct Codex Responses endpoint with 5528 response bytes and 18 stream
lines. No token, prompt, authorization code, raw OAuth response, or response
body was printed. This proves the direct backend path, but it does not approve
Eve model replacement until the private proxy and Eve model-provider tasks pass.

In this implementation thread, `codex mcp login executor-personal` completed
successfully, but `mcp__executor_personal.skills({ name: "execute" })` still
returned `OAuth authorization required`. The implementation therefore used the
previously recorded DeepWiki/Parallel findings plus current Goose source
inspection for the parent proof baseline.

On 2026-07-07, `@bundjil/codex-oauth` added the package-level direct provider
and private proxy contract:

- `OpenAICompatibleChatCompletionRequest` and related chunk/stream schemas
  model the private OpenAI-compatible boundary.
- `CodexRequestMapper.toCodexResponses(input)` maps OpenAI-compatible
  messages into the direct Codex Responses payload shape.
- `CodexStreamMapper.toOpenAICompatibleStream(input)` maps Codex stream
  deltas into OpenAI-compatible SSE chunks.
- `CodexDirectProvider.streamChatCompletion(input)` resolves the Codex OAuth
  token from `CodexOAuthService`, posts to the Codex Responses client, and
  returns OpenAI-compatible SSE.
- `OpenAICompatibleProxy.handleChatCompletions(input)` enforces an internal
  bearer token before delegating to the direct provider.

On 2026-07-07, `apps/codex-proxy` added the first deployable Effect HTTP app
boundary:

- `src/env.ts` parses app-owned config with Effect `Config`,
  `Config.schema`, `Config.redacted`, and `ConfigProvider.fromEnv()`.
- `src/server.ts` registers `GET /health` and
  `POST /v1/chat/completions` with Effect `HttpRouter`, exports a
  `HttpRouter.toWebHandler` app boundary, and maps typed tagged errors into
  safe JSON responses.
- `src/mock.layer.ts` provides an app-owned mock `CodexDirectProvider` behind
  the package service tag so local proof streams OpenAI-compatible SSE without
  a Codex network call.
- `src/index.ts` exports a one-argument Vercel-compatible fetch wrapper.
- `src/dev.ts` starts the same handler through Bun for local development.
- `scripts/smoke-test.ts` starts an ephemeral local Bun server and proves
  health plus authenticated mock SSE.

On 2026-07-07, `apps/codex-proxy` was linked to the
`bundjil-codex-proxy` Vercel project under Cooper's personal Vercel scope,
`Cooper Corbett's projects` (`team_1LX7ZujbijowTv8J9k0aU7nD`), not Tilt
Legal (`team_G8r6j3RIfXPtqb3j71bNQMbO`), and deployed as a preview
deployment.

Preview proof:

- URL:
  `https://bundjil-codex-proxy-llqa9rwss-cooper-corbetts-projects.vercel.app`.
- Project settings: root directory `apps/codex-proxy`, framework `Other`,
  Node.js `24.x`, build command
  `bun run --filter @bundjil/codex-proxy build`, output directory `.`.
- Preview env vars are encrypted in Vercel:
  `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN` and
  `BUNDJIL_CODEX_PROXY_MODE=mock`.
- Vercel SSO deployment protection is disabled for this proxy project so
  direct preview HTTP checks reach the app-level routes. The model route
  remains protected by the internal bearer token. This exception applies only
  to the current mock-mode preview; live Codex mode or production must
  re-enable Vercel protection or provide an equivalent private
  network/control boundary.
- Direct preview checks returned: `/health` HTTP 200 with `mode: mock`,
  unauthenticated chat completions HTTP 401, invalid-token chat completions
  HTTP 401, and authenticated mock chat completions HTTP 200 with
  `text/event-stream`, 2 `data:` lines, and `[DONE]`.
- Preview logs and CLI output were checked for token values, OAuth/token
  terms, probe text, invalid-token text, and full mock response text; the
  sanitized scans were clean.

At this 2026-07-07 checkpoint, production deployment was skipped and hosted
live Codex proof remained pending. The successor hosted OAuth-storage SPEC has
since accepted personal preview proof; production remains inactive and opt-in.

On 2026-07-07, `apps/agent` added app-owned Eve model-provider wiring:

- `agent/model-provider.ts` defines Gateway and Codex proxy provider config
  schemas and creates either the Gateway model string or an AI SDK
  OpenAI-compatible `LanguageModel`.
- `agent/config.ts` loads provider config through Effect `Config`,
  `ConfigProvider.fromEnv()`, `Config.url`, `Config.redacted`, and Effect
  Schema. Gateway remains the default provider.
- Codex proxy mode requires `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`,
  `BUNDJIL_CODEX_PROXY_BASE_URL`, and
  `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`. The proxy model id defaults to
  `BUNDJIL_AGENT_MODEL` unless `BUNDJIL_CODEX_PROXY_MODEL` is set.
- The Eve app does not import Codex OAuth profile storage, token refresh, or
  direct Codex HTTP clients. It only calls the private OpenAI-compatible proxy.
- Provider request bodies, mock responses, smoke-test output, proof output, and
  leak checks now use Effect Schema JSON encoders such as
  `Schema.fromJsonString(...)` and `Schema.UnknownFromJsonString`.

Local Eve proof:

- The local codex proxy ran in mock mode on `http://127.0.0.1:8788`.
- Eve ran on `http://127.0.0.1:2101` with
  `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`,
  `BUNDJIL_AGENT_MODEL=codex-default-model`,
  `BUNDJIL_CODEX_PROXY_BASE_URL=http://127.0.0.1:8788/v1`, and
  `BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=123456`.
- `GET /eve/v1/health` returned `ok: true` and `status: ready`.
- `GET /eve/v1/info` reported model id
  `bundjil-codex-proxy/codex-default-model`, provider
  `bundjil-codex-proxy`, and context window `123456`.
- `POST /eve/v1/session` and
  `GET /eve/v1/session/<sessionId>/stream` emitted `session.started`,
  `message.appended`, `message.completed`, `step.completed`,
  `turn.completed`, and `session.waiting`.
- The stream completed with the mock proxy response, proving Eve used the
  private proxy `LanguageModel`.
- The proof output contained no bearer token, OAuth token, refresh token,
  authorization code, or raw upstream response body.

### Executor / Parallel Task research

The user challenged the DeepWiki framing because OpenClaw, Hermes-style
proxies, Pi-adjacent agent ecosystems, and Codex CLI automation demonstrate
subscription-backed model use in practice.

Parallel Task run `trun_e43fa758cfba40c3bf5ad5cddb1b7196` completed on
2026-07-07 and refined the conclusion. The full report is committed at
[Parallel Research: Codex OAuth For Third-Party Agent Model Access](./codex-oauth-subscription-model-access.parallel-research.md).

- Do not treat a ChatGPT / Codex OAuth token as an OpenAI Platform API key or
  as a Vercel AI Gateway credential. AI Gateway remains the official Eve /
  AI SDK path for provider billing, BYOK, OIDC, observability, and routing.
- The subscription-backed path used by OpenClaw-style systems is a different
  architecture: use a Codex-specific runtime surface or pinned
  OpenAI-compatible proxy that wraps Codex subscription access. The original
  Parallel recommendation preferred app-server because Goose direct-provider
  evidence had not yet been reviewed.
- OpenClaw's OpenAI provider documentation says embedded agent turns on OpenAI
  models run through the native Codex app-server runtime by default. Its Codex
  harness reference documents app-server setup and per-agent isolation
  patterns. Bundjil can copy the architecture, not the code.
- Codex app-server exposes a JSON-RPC-style integration seam for host apps.
  Promptfoo and other ecosystem docs treat it as a provider surface. This is a
  better first proof target than reimplementing PKCE / refresh in TypeScript.
- Community projects such as `codex-proxy`, `codex-bridge`, and
  `llm-openai-via-codex` show OpenAI-compatible HTTP wrappers over Codex
  subscription access. These are useful research artifacts but should be
  treated as pinned sidecars or spike references, not as a stable primary
  contract.
- Goose now provides stronger open-source prior art for a direct in-process
  provider: implement OAuth, token refresh, request mapping, and streaming
  response mapping directly, then expose that through a private
  OpenAI-compatible proxy for Eve.
- Hermes Agent exposes an OpenAI-compatible API server, but the research did
  not establish Hermes as a Codex-subscription OAuth implementation. It is
  relevant as a local OpenAI-compatible backend pattern, not as evidence that
  Eve can directly spend a ChatGPT plan through AI Gateway.
- Pi appears to be a flexible coding-agent toolkit with provider configuration
  and local/OpenAI-compatible model support; the research did not establish a
  first-class Codex OAuth subscription path inside Pi.

This changes the implementation direction:

```text
Eve agent
  -> AI Gateway model string by default
  -> optional Codex subscription provider
    -> AI SDK OpenAI-compatible provider
      -> private Bundjil Codex proxy
        -> CodexDirectProvider service
        -> CodexOAuthService / CodexProfileStore
        -> chatgpt.com/backend-api/codex/responses
```

Source URLs:

- <https://developers.openai.com/codex/cli>
- <https://developers.openai.com/codex/auth>
- <https://developers.openai.com/codex/app-server>
- <https://docs.openclaw.ai/providers/openai>
- <https://docs.openclaw.ai/plugins/codex-harness-reference>
- <https://docs.openclaw.ai/plugins/codex-harness>
- <https://www.promptfoo.dev/docs/providers/openai-codex-app-server>
- <https://github.com/icebear0828/codex-proxy>
- <https://github.com/xiaoshaoning/codex-bridge>
- <https://simonwillison.net/2026/Apr/23/llm-openai-via-codex>
- <https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server>
- <https://github.com/earendil-works/pi>
- <https://goose-docs.ai/blog/2026/03/19/use-goose-with-your-ai-subscription/>
- <https://github.com/aaif-goose/goose/blob/main/crates/goose/src/providers/chatgpt_codex.rs>

### Subagent review passes

Two subagents reviewed the direction before this draft:

- Pass 1, repo/spec shape: recommended this spec path,
  `docs/product-specs/codex-oauth-eve-model-provider.md`, a sibling task
  ledger, explicit OAuth / token / provider sections, app-owned Eve wiring, and
  a narrow package boundary only after the service is stable.
- Pass 2, Effect storage shape: recommended `@bundjil/codex-oauth`, two
  service tags (`OAuthProfileStore`, `CodexOAuthTokenService`), Effect
  `KeyValueStore` with schema-backed profiles, versioned hashed keys, live and
  memory layers, and tests for schema/storage/token expiry/error redaction.

## Iteration Log

This spec was intentionally iterated before acceptance:

1. Baseline draft: current repo architecture, installed Eve types, OpenAI
   Codex docs, Effect KeyValueStore docs/source, Vercel storage docs, and
   OpenClaw prior-art docs.
2. Review iteration 1: subagent repo/spec review tightened the required spec
   sections, docs updates, and repo ownership constraints.
3. Review iteration 2: subagent Effect storage review tightened service tags,
   profile schemas, key derivation, KeyValueStore import path, and verification
   gates.
4. Executor iteration: personal executor / DeepWiki was attempted twice through
   MCP, then through `codex mcp login`. It is blocked on user OAuth completion
   and remains a pre-implementation gate in the task list.
5. Forked-thread DeepWiki iteration: executor personal OAuth succeeded after
   thread refresh. DeepWiki findings tightened the plan away from "Codex OAuth
   as generic Eve model access" and toward "Codex OAuth for Codex workflows;
   keep Eve on Gateway until a supported `LanguageModel` path is proven."
6. Parallel Task correction: deeper ecosystem research showed the viable
   subscription-backed model path is not "OAuth token as API key"; it is Codex
   app-server, direct Codex Responses, or a pinned Codex-to-OpenAI-compatible
   bridge. This kept implementation gated until stronger prior art was found.
7. Goose / DeepWiki correction: Goose's `chatgpt_codex` provider proves a
   direct provider path without app-server. It owns PKCE OAuth, token refresh,
   Codex Responses request mapping, and stream decoding, then calls
   `chatgpt.com/backend-api/codex/responses` directly. The spec now treats a
   private Bundjil OpenAI-compatible proxy over direct Codex HTTP as the
   preferred proof target.
8. Effect HTTP / Vercel proxy iteration: executor personal DeepWiki on
   `Effect-TS/effect` and the local Mobius `apps/api` reference confirmed the
   proxy should be a separate deployable app. `apps/codex-proxy` owns Vercel
   deployment and Effect HTTP route composition; `@bundjil/codex-oauth` owns
   reusable OAuth, profile, direct Codex provider, and stream-mapping services.

## Target Shape

Add a new package only after the research gate confirms the boundary is stable:

```text
packages/codex-oauth/
  package.json
  README.md
  src/
    index.ts
    schemas.ts
    errors.ts
    storage-keys.ts
    profile-store.service.ts
    oauth.service.ts
    codex-direct-provider.service.ts
    codex-http-client.service.ts
    codex-request-mapper.ts
    codex-stream-mapper.ts
    oauth-client.service.ts
    openai-compatible-proxy.service.ts
    live.layer.ts
    mock.layer.ts
  test/
    schemas.test.ts
    storage-keys.test.ts
    profile-store.test.ts
    oauth-service.test.ts
    codex-direct-provider.test.ts
    codex-request-mapper.test.ts
    codex-stream-mapper.test.ts
    openai-compatible-proxy.test.ts
```

Add app-owned Eve provider wiring only after a model runtime path is proven:

```text
apps/agent/
  agent/
    config.ts
    agent.ts
    model-provider.ts
  test/
    model-provider.test.ts
```

The deployable proxy app currently has this shape:

```text
apps/codex-proxy/
  package.json
  README.md
  src/
    index.ts                      # Vercel fetch handler
    dev.ts                        # local Bun HTTP host
    env.ts                        # Effect ConfigProvider / Config schema
    errors.ts                     # app-owned tagged route/config errors
    mock.layer.ts                 # app-owned mock direct provider
    schemas.ts                    # app-owned route/config schemas
    server.ts                     # HttpRouter routes and toWebHandler adapter
  scripts/
    smoke-test.ts
  test/
    proxy-handler.test.ts
```

The first deployment target is a separate Vercel project named
`bundjil-codex-proxy` under Cooper's personal Vercel account, not the Tilt
Legal Vercel team. The first version should deploy as a Bun or Node Vercel
Function rather than Vercel Edge Runtime. Edge Runtime can be reconsidered only
after token storage, crypto, streaming, and Effect runtime behavior are proven
compatible.

Do not add a Codex app-server runtime package for the first proof. Keep this as
fallback research only if the direct Goose-style provider fails:

```text
packages/codex-runtime/
  package.json
  README.md
  src/
    index.ts
    app-server-client.service.ts
    app-server-process.layer.ts
    app-server-protocol.ts
    auth-strategy.ts
    errors.ts
    schemas.ts
  test/
    app-server-protocol.test.ts
    auth-strategy.test.ts
```

Potential Vercel storage adapter after local service proof:

```text
packages/codex-oauth/
  src/
    upstash-key-value-store.layer.ts
  test/
    upstash-key-value-store.test.ts
```

Do not put Codex OAuth, provider secrets, Eve filesystem files, or provider
SDK clients in `@bundjil/core`.

## Decisions

- Codex OAuth is its own Effect service boundary, separate from Better Auth,
  WorkOS, user app sessions, channel authentication, and Eve tool contracts.
- `@bundjil/codex-oauth` owns reusable Codex OAuth schemas, tagged errors,
  storage keys, profile storage, token refresh, and memory/live layers.
- `apps/codex-proxy` owns the Vercel-deployed proxy edge: Effect HTTP route
  composition, web-standard `fetch` entrypoint, local dev server, smoke-test
  scripts, Vercel project/env binding names, and internal bearer-token auth.
- The proxy app must use Effect HTTP APIs from platform: typed JSON endpoints
  use `HttpApiBuilder.layer(...)`; streaming OpenAI-compatible model routes use
  raw `HttpRouter.add(...)` and `HttpServerResponse.raw(...)` or the current
  Effect streaming response primitive.
- `apps/agent` owns Eve model selection, deployment config, and deciding when
  to use AI Gateway versus Codex OAuth.
- Use Effect `KeyValueStore` as the persistence contract. Start with memory and
  file-backed layers; add Upstash Redis through a separate adapter once the
  service contract is stable and hosted token encryption is defined.
- Treat OpenClaw as prior art only. Do not import OpenClaw packages, copy code,
  copy state file formats, or expose a general OpenClaw-style gateway.
- Treat Goose as the stronger implementation precedent for the first proof.
  Do not copy Goose code, but model Bundjil's architecture on the direct
  provider shape: PKCE OAuth, token refresh, Codex Responses request mapping,
  streaming response mapping, and a private OpenAI-compatible proxy boundary.
- The first implementation must prove the direct Codex backend path before
  changing the default Eve model from Vercel AI Gateway.
- Research conclusion: Codex OAuth is not a generic Platform API key and does
  not plug into Vercel AI Gateway as subscription billing. The viable path for
  Bundjil is a private proxy that translates Eve / AI SDK requests into Codex
  Responses calls backed by ChatGPT / Codex OAuth.
- Do not expose a public OpenAI-compatible endpoint in the first iteration. If
  a compatibility endpoint is required for Eve, bind it to loopback or private
  Vercel protection only, then document the security model. The mock-mode
  preview can be network-reachable for direct HTTP proof only while
  `/v1/chat/completions` is guarded by the internal bearer token and live
  Codex mode remains unavailable.
- Deploy the proxy as a separate Vercel project so it can be protected,
  rolled back, logged, and scaled independently from the Eve app.
- Store no token values in source, logs, task ledgers, docs, error messages, or
  test snapshots.

## OAuth Flow

The service should support two credential sources, in this order:

1. **Direct ChatGPT / Codex OAuth login:** implement the Goose-style PKCE
   loopback flow in an Effect service. The known research values are issuer
   `https://auth.openai.com`, client id `app_EMoamEEZ73f0CkXaXp7hrann`, scopes
   `openid profile email offline_access`, and localhost callback port `1455`.
   These constants must be isolated in config/schemas and verified in the live
   proof.
2. **Supported Codex token path:** use `CODEX_ACCESS_TOKEN` or
   `codex login --with-access-token` when the user has a Business /
   Enterprise Codex access token or another officially documented token source.
3. **Imported local Codex auth file:** optional later work may import
   `~/.codex/auth.json` for a local-only operator flow, but the first proof
   should own its token sink instead of racing the Codex CLI refresh owner.

Interactive login steps:

```text
CLI command or private app route
  -> generate state + PKCE verifier/challenge
  -> open OpenAI auth URL
  -> receive loopback callback or pasted redirect URL
  -> exchange authorization code
  -> decode id/access token account metadata without logging token values
  -> store CodexOAuthProfile through CodexProfileStore
  -> run CodexOAuthService.getValidToken(profile)
```

The implementation must treat the exact authorization and token endpoints as
research outputs, not guessed constants, unless they are confirmed by current
OpenAI / Codex documentation or source.

## Token Lifecycle

The service must act as the token sink for Bundjil:

- One profile owner refreshes a rotating refresh token.
- Access tokens are reused while valid.
- Expired tokens are refreshed under a lock.
- Refresh failures mark the profile as requiring re-authentication.
- Token values are redacted in logs and errors.
- Multiple profiles are allowed by schema but not required in the first UI.

Initial key format:

```text
bundjil/oauth/v1/provider/codex/profile/{subjectHash}
```

`subjectHash` should be derived from a stable canonical representation of:

```text
principal.type
principal.id
principal.issuer
connectorId
installationId
profileId
```

Do not include raw emails, user ids, access tokens, refresh tokens, or prompt
content in keys. Do not design profile listing as a first-class operation until
there is a real UI or administration need; the local Effect v4
`KeyValueStore` surface has no list operation.

## Model Provider Contract

The first provider contract should be narrow:

```ts
CodexModelProvider.createLanguageModel(input);
```

where `input` is schema-owned and includes:

- `modelId`
- `profileId`
- `transport`: `"direct-codex-responses" | "openai-compatible-private-proxy"`
- optional context-window override for Eve if Gateway metadata lookup is not
  available

Candidate runtime paths:

1. **Direct Codex Responses path:** preferred proof target. Convert
   OpenAI-compatible chat/completion requests into Codex Responses payloads,
   call `https://chatgpt.com/backend-api/codex/responses`, and map stream
   events back to OpenAI-compatible SSE chunks.
2. **Private OpenAI-compatible proxy:** preferred Eve integration shape. Keep
   the proxy internal-only, authenticated, and bound to loopback/private Vercel
   surfaces while Eve consumes it through `@ai-sdk/openai-compatible`.
3. **Codex SDK/CLI/app-server workflow path:** fallback research only. Useful
   for coding-focused subagent tasks or if the direct Responses path stops
   working, but not the first implementation target.
4. **AI Gateway fallback:** keep current `google/gemini-2.5-flash` or another
   cheap Gateway model while Codex subscription access is being proven.

The spec does not approve making Codex proxy mode the default until a hosted
live proof shows a prompt can complete through the Codex-authenticated provider
with durable token storage, refresh handling, and production protection.

## Proxy HTTP API And Vercel Deployment

`apps/codex-proxy` should be a small deployable Effect HTTP service. It should
not own Codex domain behavior; it should compose package-owned services from
`@bundjil/codex-oauth` and adapt them to HTTP/Vercel.

Initial routes:

```text
GET  /health
  -> public or low-risk health check with no secret data

GET  /openapi.json
  -> optional local/preview typed API description for management endpoints
  -> never include secret defaults or token examples

POST /auth/start
  -> private/local-only OAuth start route, if CLI-only auth is not enough

POST /auth/callback
  -> private/local-only OAuth callback route, if browser auth is app-hosted

POST /v1/chat/completions
  -> private OpenAI-compatible streaming route for Eve / AI SDK
  -> requires internal bearer token
```

The first implementation should treat `/v1/chat/completions` as the only
model route. `/v1/responses` is future work unless AI SDK compatibility
requires it during proof.

Proxy config belongs to `apps/codex-proxy/src/env.ts` and must use Effect
Config:

```text
BUNDJIL_CODEX_PROXY_MODE=mock | live
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=<redacted>
BUNDJIL_CODEX_PROXY_PUBLIC_BASE_URL=<url>
BUNDJIL_CODEX_PROFILE_ID=<profile id>
BUNDJIL_CODEX_MODEL=<model id>
```

Hosted storage config for the accepted Upstash / KeyValueStore adapter lives
in `@bundjil/codex-oauth`, not in `apps/codex-proxy`. The adapter reads
Vercel Marketplace / Upstash Redis credentials through Effect `Config`:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
BUNDJIL_UPSTASH_REDIS_KEY_PREFIX
```

For Vercel compatibility, the adapter also accepts the SDK-documented aliases:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

`UPSTASH_REDIS_REST_TOKEN` / `KV_REST_API_TOKEN` must be loaded with
`Config.redacted`. The Upstash SDK must be constructed from decoded Effect
config and must not use `Redis.fromEnv()` or direct `process.env` reads in
package logic. The adapter disables Upstash automatic deserialization so
Effect Schema remains the JSON encoding boundary.

The adapter prefixes Redis keys before storage. The default prefix is
`bundjil:codex-oauth:`. `KeyValueStore.clear` and `KeyValueStore.size` scan
that prefix instead of using whole-database Redis commands, so the adapter can
share a Redis database without clearing unrelated keys.

Raw refresh tokens must not be stored in hosted KV before an application-side
envelope-encryption layer for `CodexOAuthProfile` payloads is implemented and
tested. Provider TLS and provider-managed at-rest encryption do not satisfy the
operator-access constraint because Vercel / Upstash operators and project env
readers must not be able to inspect stored refresh-token values. Until that
future encryption task exists, the Upstash adapter is an opt-in
`KeyValueStore` primitive and is not composed into `CodexOAuthLive`.

Vercel deployment rules:

- Link `apps/codex-proxy` to a separate Vercel project named
  `bundjil-codex-proxy` in Cooper's personal Vercel account.
- Do not link or deploy this app to the Tilt Legal Vercel team.
- Use preview deployments for proof before production.
- Keep `/v1/chat/completions` private by internal bearer token at minimum.
- Prefer a Bun or Node Vercel Function for the first implementation; do not use
  Edge Runtime until streaming, crypto, token storage, and Effect runtime
  behavior are proven in that runtime.
- Vercel logs, deployment output, and smoke-test output must not include access
  tokens, refresh tokens, authorization codes, raw OAuth responses, private
  prompts, or full upstream response bodies.

Implemented `apps/codex-proxy/package.json` scripts:

```text
dev: bun --conditions=@bundjil/source src/dev.ts
build: rm -rf dist && tsc -p tsconfig.build.json
check-types: tsc --noEmit
test: vitest run
smoke-test: bun --conditions=@bundjil/source scripts/smoke-test.ts
```

The accepted implementation uses direct Vercel Functions through
`apps/codex-proxy/api/index.ts`, `apps/codex-proxy/src/vercel.ts`, and
`apps/codex-proxy/vercel.json`. It does not use Nitro. Vercel CLI operations
remain operational commands, not package scripts:

```bash
cd apps/codex-proxy
vercel link --project bundjil-codex-proxy
vercel env pull .env.preview.local --environment=preview
vercel deploy
vercel deploy --prod
```

## Effect Boundary Requirements

Use Effect TS native approaches first. Prefer Data, Schema, Array, Chunk,
HashSet, HashMap, Match, Context, Layer, Config, Service, Record, Result, Exit,
Bun/Platform Command, and ManagedRuntime over plain TypeScript helpers when the
code is fallible, async, runtime-owned, collection-heavy, or crosses a package,
RPC, SSR, command, config, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as id: string, slug: string, status, or post metadata
outside their canonical schema/type owner.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, instanceof checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema/RPC/Match/Result/Exit
primitive or owning service contract should carry the behavior.

Package code must:

- Use `Config.redacted` for secrets and `Config.schema` for non-secret runtime
  values.
- Use flat meaningful `Effect.gen` for primary operations.
- Keep tagged error handling in `.pipe(...)` with `catchTag`, `catchTags`, or
  `mapError`.
- Use `Schema.TaggedErrorClass` or `Data.TaggedError` for expected failures.
- Use `Effect.tryPromise` for SDK/fetch calls.
- Add operation names with `Effect.withSpan` or `Effect.fn`.
- Provide memory/mock layers for tests.
- Map `KeyValueStoreError`, provider response errors, parse errors, and auth
  errors into package-owned tagged errors.

## Canonical Schemas And Errors

Initial schemas:

```ts
CodexOAuthConfig;
OAuthPrincipal;
CodexOAuthSubject;
CodexOAuthProfileId;
CodexOAuthProfile;
CodexOAuthAccessToken;
CodexOAuthTokenRefreshResult;
CodexOAuthLoginStart;
CodexOAuthLoginCallback;
CodexResponsesRequest;
CodexResponsesStreamEvent;
CodexResponsesUsage;
OpenAICompatibleChatCompletionRequest;
OpenAICompatibleChatCompletionChunk;
BundjilCodexProxyConfig;
BundjilCodexProxyInternalAuth;
BundjilCodexProxyHealth;
BundjilCodexProxyRouteError;
CodexModelProviderConfig;
```

Initial service tags:

```ts
CodexProfileStore;
CodexOAuthService;
CodexOAuthClient;
CodexHttpClient;
CodexRequestMapper;
CodexStreamMapper;
CodexDirectProvider;
OpenAICompatibleProxy;
BundjilCodexProxyHttpApi;
BundjilCodexProxyRuntime;
CodexModelProvider;
```

Initial named operations:

```ts
CodexProfileStore.getProfile(subject);
CodexProfileStore.putProfile(profile);
CodexProfileStore.removeProfile(subject);
CodexProfileStore.hasProfile(subject);

CodexOAuthService.startLogin(input);
CodexOAuthService.completeLogin(input);
CodexOAuthService.getValidToken(subject);
CodexOAuthService.refreshAccessToken(subject);
CodexOAuthService.revokeToken(subject);

CodexOAuthClient.startLogin(input);
CodexOAuthClient.completeLogin(input);
CodexOAuthClient.refresh(input);

CodexRequestMapper.toCodexResponses(input);
CodexStreamMapper.toOpenAICompatibleStream(input);
CodexHttpClient.postResponses(input);
CodexDirectProvider.streamChatCompletion(input);
OpenAICompatibleProxy.handleChatCompletions(input);
BundjilCodexProxyHttpApi.health(input);
BundjilCodexProxyHttpApi.handleChatCompletions(request);
BundjilCodexProxyRuntime.makeWebHandler(input);
CodexModelProvider.createLanguageModel(input);
```

Initial errors:

```ts
OAuthProfileSchemaError;
OAuthProfileStorageError;
OAuthProfileNotFound;
CodexOAuthConfigError;
CodexOAuthLoginError;
CodexOAuthTokenMissing;
CodexOAuthTokenExpired;
CodexOAuthTokenRefreshRequired;
CodexOAuthTokenProviderError;
CodexResponsesRequestError;
CodexResponsesStreamError;
CodexHttpStatusError;
CodexHttpNetworkError;
OpenAICompatibleProxyAuthError;
OpenAICompatibleProxyRequestError;
BundjilCodexProxyConfigError;
BundjilCodexProxyDeploymentError;
CodexOAuthUnsupportedRuntimePath;
CodexModelProviderError;
CodexModelProviderVerificationError;
```

Every error must be safe to print. Error fields may include provider name,
profile id, operation name, status code, and redacted diagnostic messages. They
must not include token values, raw OAuth responses, personal email contents,
private prompts, or full request/response bodies.

## Call Graphs

Production, current fallback:

```ts
Eve HTTP /eve/v1/session
  -> apps/agent/agent/agent.ts
  -> apps/agent/agent/config.ts
  -> Vercel AI Gateway model string
  -> apps/agent/agent/tools/*
  -> @bundjil/eve-effect
```

Production, target Codex OAuth provider:

```ts
Eve HTTP /eve/v1/session
  -> apps/agent/agent/agent.ts
  -> apps/agent/agent/model-provider.ts
  -> AI SDK OpenAI-compatible LanguageModel
    -> private Bundjil proxy /v1/chat/completions
      -> OpenAICompatibleProxy
        -> CodexDirectProvider
          -> CodexOAuthService
          -> CodexRequestMapper
          -> CodexHttpClient
          -> CodexStreamMapper
```

Production, `apps/codex-proxy` Vercel request:

```ts
Vercel Function fetch(request)
  -> apps/codex-proxy/src/index.ts
  -> BundjilCodexProxyRuntime.makeWebHandler
    -> HttpRouter.toWebHandler(ProxyLive)
      -> HttpRouter.add("POST", "/v1/chat/completions", ...)
        -> OpenAICompatibleProxy.handleChatCompletions
          -> CodexDirectProvider.streamChatCompletion
            -> CodexOAuthService.getValidToken
            -> CodexRequestMapper.toCodexResponses
            -> CodexHttpClient.postResponses
            -> CodexStreamMapper.toOpenAICompatibleStream
        -> HttpServerResponse.raw | streaming response primitive
```

Production, typed proxy management routes:

```ts
Vercel Function fetch(request)
  -> apps/codex-proxy/src/index.ts
  -> BundjilCodexProxyRuntime.makeWebHandler
    -> HttpRouter.toWebHandler(ProxyLive)
      -> HttpApiBuilder.layer(BundjilCodexProxyApi)
        -> GET /health
        -> optional POST /auth/start
        -> optional POST /auth/callback
        -> optional GET /openapi.json
```

Token/profile storage path:

```ts
CodexOAuthService
  -> CodexProfileStore
    -> KeyValueStore.KeyValueStore layer
      -> memory | filesystem | Upstash Redis adapter
  -> CodexOAuthClient
    -> auth.openai.com/oauth/authorize
    -> auth.openai.com/oauth/token
  -> redacted CodexOAuthProfile
```

Tests, package:

```ts
@bundjil/codex-oauth tests
  -> CodexProfileStoreMemory
    -> KeyValueStore.layerMemory
  -> CodexOAuthServiceMemory
  -> mock CodexOAuthClient
  -> mock CodexHttpClient
  -> request mapper, stream mapper, schema, key, expiry, redaction tests
```

Tests, app integration:

```ts
@bundjil/agent tests
  -> apps/agent/agent/model-provider.ts
  -> CodexModelProvider mock layer
  -> Eve agent config
  -> no provider network calls
```

Tests, proxy app:

```ts
@bundjil/codex-proxy tests
  -> HttpRouter.toWebHandler(ProxyTestLayer)
    -> BundjilCodexProxyHttpApi test routes
      -> OpenAICompatibleProxy mock layer
      -> CodexDirectProvider mock layer
      -> CodexProfileStoreMemory
      -> KeyValueStore.layerMemory
  -> direct Request / Response assertions
  -> health, internal auth, streaming SSE, error redaction tests
```

Local dev path:

```ts
bun run --filter @bundjil/codex-proxy dev
  -> apps/codex-proxy/src/dev.ts
  -> HttpRouter.serve(ProxyLive)
  -> Bun HTTP server layer
  -> http://127.0.0.1:<port>/health
  -> http://127.0.0.1:<port>/v1/chat/completions
```

Vercel deployment path:

```ts
apps/codex-proxy
  -> vercel link --project bundjil-codex-proxy
  -> vercel env pull
  -> bun run --filter @bundjil/codex-proxy build
  -> vercel deploy
  -> preview URL direct HTTP checks
  -> vercel deploy --prod only after preview proof
```

Opt-in live proof:

```ts
local/private env
  -> Codex OAuth profile exists
  -> private Bundjil proxy starts
  -> POST /v1/chat/completions with internal auth
  -> CodexOAuthService refreshes or reuses token
  -> CodexHttpClient POSTs /backend-api/codex/responses
  -> streamed model response maps to OpenAI-compatible SSE
  -> Eve /eve/v1/session can consume the private proxy
```

## Verification Requirements

Before implementation starts:

- Keep the completed DeepWiki and Parallel Task findings in this spec current.
- Confirm Goose direct-provider findings against current source before coding.
- Confirm the exact direct Codex Responses request/stream shape with a local,
  sanitized live proof.
- Confirm the first Eve integration path is private OpenAI-compatible proxy via
  `@ai-sdk/openai-compatible`.

Per implementation task:

- Run targeted package/app tests.
- Run `bun run check-types`.
- Run `bun run verification` before commit/handoff unless the task explicitly
  records a narrower reasoned exception.
- Record implementation evidence in the task ledger.
- Run the required three parent Effect TS audit passes and record actual
  findings, not placeholder pass counts.

Proxy app verification:

- `bun run --filter @bundjil/codex-proxy test`
- `bun run --filter @bundjil/codex-proxy check-types`
- `bun run --filter @bundjil/codex-proxy build`
- `bun run --filter @bundjil/codex-proxy smoke-test`
- Direct HTTP: `GET /health` returns 200 and contains no secret data.
- Direct HTTP: unauthenticated `POST /v1/chat/completions` returns 401 or 403.
- Direct HTTP: invalid internal token returns 401 or 403.
- Direct HTTP: authenticated mock-mode `POST /v1/chat/completions` streams
  OpenAI-compatible SSE without contacting Codex.
- Direct HTTP: live-mode `POST /v1/chat/completions` is opt-in only and logs
  sanitized status/chunk shape, not prompt text, token values, or full model
  output.
- The preview proof command must exit non-zero when health, auth rejection,
  authenticated status, SSE content type/completion, or leak predicates do not
  meet the documented contract. A JSON result alone is not proof of success.

Vercel deployment verification:

- `vercel link` output shows the `bundjil-codex-proxy` project under Cooper's
  personal Vercel account, not Tilt Legal.
- `vercel env pull` for preview succeeds and does not write committed env
  files.
- Preview deploy succeeds before production deploy.
- Preview direct HTTP checks prove `/health`, unauthenticated rejection,
  invalid-token rejection, and authenticated mock-mode streaming.
- Production deploy is allowed only after preview proof is recorded in the task
  ledger.
- Vercel logs and CLI output are checked for absence of access tokens, refresh
  tokens, authorization codes, raw OAuth responses, private prompts, and full
  upstream response bodies.
- If live Codex credentials are unavailable, hosted verification must stop at
  mock-mode streaming plus auth/health proof and record that live model proof
  remains pending.

Hosted Eve deployment verification:

- Link or create the Eve project only under Cooper's personal Vercel scope.
- Bind the agent's `codex-proxy` configuration only as encrypted server-side
  values. The agent receives the private proxy bearer, never the Codex OAuth
  profile, access token, refresh token, or profile cipher key.
- Use the current proxy deployment URL only for preview evidence; production
  Eve requires an explicitly approved stable production proxy deployment and
  separate production credential/profile provisioning.
- Verify the hosted `/eve/v1/info` model metadata and one minimal Eve session
  stream. Record only provider/model id, status, event kinds, and safe counts.
- Inspect Vercel runtime logs for both the agent and proxy after the probe.
  Stop and rotate credentials if tokens, authorization codes, prompts, request
  bodies, or full model responses appear.

Mandatory 3-pass Effect TS audit after every implementation task:

1. Ownership and call graph audit: package/app ownership, imports, layers,
   service tags, and production/test call graphs are correct.
2. Effect implementation quality audit: flat primary `Effect.gen`, tagged
   errors in `.pipe(...)`, Schema-derived types, no unsafe casts, no DTO
   mirrors, no manual object readers/mappers, no helper sprawl.
3. Verification coverage audit: tests, typechecks, docs, live-boundary proof
   where relevant, and no secret leakage in output.

The implementer may require additional passes when ownership, Effect flow,
provider security, or evidence remains weak.

## Documentation Requirements

Implementation must update:

- `README.md`: current provider options and safe local setup.
- `ARCHITECTURE.md`: new package/app/provider boundaries and call graphs.
- `docs/README.md`: link the new spec, package docs, and architecture guide.
- `docs/architecture/eve-agent.md`: model-provider selection and fallback.
- `docs/architecture/effect-patterns.md`: KeyValueStore-backed secret profile
  pattern if it generalizes.
- `docs/architecture/repo-structure.md`: `@bundjil/codex-oauth` ownership if
  the package is added.
- `docs/architecture/testing-and-quality.md`: Codex OAuth verification and
  live proof rules.
- `apps/agent/README.md`: env vars, fallback model, Codex OAuth status.
- `apps/codex-proxy/README.md`: local dev, Effect HTTP routes, Vercel project,
  env vars, smoke tests, deployment, rollback, and secret-handling rules.
- `packages/codex-oauth/README.md`: schemas, service tags, layers, storage
  backends, direct Codex Responses mapping, private proxy setup, verification,
  and secret handling.

Docs must distinguish:

- Implemented behavior.
- Opt-in local-only proof scripts.
- Future hosted/Vercel storage work.
- Unsupported or unproven Codex runtime paths.
- Difference between AI Gateway billing, OpenAI API-key billing, and ChatGPT /
  Codex subscription-backed runtime access.
- Difference between the private Bundjil proxy and a public OpenAI-compatible
  gateway.

## Risks And Tradeoffs

- Codex OAuth is not an OpenAI Platform API key and should not be treated as
  one. The subscription-backed path must route through Codex-specific
  Responses surfaces and should remain private.
- PKCE endpoints inferred from Goose and Codex CLI may drift or may be
  unsupported for Bundjil. Keep constants isolated, documented, and covered by
  live proof rather than scattering them through implementation code.
- A direct dependency on `chatgpt.com/backend-api/codex/*` style endpoints is
  brittle. The proxy must isolate this dependency so Eve and app code do not
  care if the backend later changes to app-server, official SDK, or another
  supported route.
- If `OPENAI_API_KEY` and Codex subscription auth are both present, operator
  confusion can silently bill the wrong path. Subscription proxy mode must not
  read `OPENAI_API_KEY` or forward it to Codex Responses calls.
- Refresh token rotation can log out other tools if multiple owners refresh the
  same token. Bundjil needs one token sink per profile.
- Vercel serverless concurrency can race token refresh. The service needs a
  lock strategy before live hosted refresh.
- Upstash Redis is a good Vercel KV replacement, but token storage requires
  careful encryption, TTL, and access-control decisions. Do not put raw tokens
  in a broadly accessible store, and do not store raw hosted refresh tokens
  until encryption and operator access boundaries are documented and verified.
- Eve's model provider can be a `LanguageModel`, but not every Codex runtime
  path naturally implements the AI SDK `LanguageModel` contract.
- A private OpenAI-compatible endpoint can become a high-risk operator surface.
  Do not expose it publicly.
- Vercel Edge Runtime may not support the first implementation's required
  Effect runtime, crypto, storage, or streaming behavior. Start with a Bun or
  Node Vercel Function.
- Linking the proxy app to the wrong Vercel team can leak env/secrets into the
  wrong account boundary. Verification must prove the project is in Cooper's
  personal Vercel account.
- Hosted live proof can accidentally log sensitive request/response content.
  Smoke tests must assert shape and status rather than dumping full payloads.

## Out Of Scope

- Better Auth / WorkOS user-login integration.
- Sendblue, Cloudflare Email Routing, Notion, or Vercel Connect channel work.
- A public OpenAI-compatible gateway.
- Multi-user web UI for managing profiles.
- Migration of existing Codex CLI auth files.
- Copying OpenClaw implementation code or state formats.
- Replacing AI Gateway as the default Eve model before live proof.
- Treating a local Eve-to-preview proof as a hosted Eve or production proof.

## Open Questions

- Does the direct Codex Responses endpoint support the full AI SDK streaming
  shape Eve expects, including tool calls, tool results, image inputs, and
  usage metadata?
- Should Bundjil initially implement `/v1/chat/completions` only, or also
  support `/v1/responses` for AI SDK compatibility?
- If Eve requires an AI SDK `LanguageModel`, is `@ai-sdk/openai-compatible`
  sufficient over the private proxy, or does Bundjil need a custom provider?
- Does the Codex model family handle non-coding personal-agent conversations
  well enough for Bundjil's first user experience?
- Should the first hosted proxy use Nitro's Vercel Bun function output exactly
  like Mobius `apps/api`, or a simpler direct Vercel Function build?
- Can a hosted Vercel function safely perform OAuth callback handling, or
  should login remain local/CLI-driven until a real UI exists?
- What is the right hosted token encryption layer before using Upstash Redis
  on Vercel?
- Should the first login UX be CLI-only, local web-only, or a Vercel-protected
  private route?
- Can Vercel OIDC / Marketplace secrets safely provision Upstash credentials
  for this package without coupling package code to Vercel?
