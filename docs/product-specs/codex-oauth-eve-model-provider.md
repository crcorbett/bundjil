# Codex OAuth Eve Model Provider

Status: Draft  
Owner: Bundjil  
Created: 2026-07-07

## Purpose

Create a Bundjil-owned Codex OAuth provider boundary that can use a ChatGPT /
Codex subscription identity as a model credential source for the personal
agent, without adopting OpenClaw or copying its implementation.

The intended direction is:

```text
apps/agent Eve runtime
  -> Bundjil model provider selection
  -> @bundjil/codex-oauth token service
  -> Effect KeyValueStore-backed profile storage
  -> verified Codex-authenticated runtime path
```

This spec is deliberately split into a proof-first implementation. Bundjil can
own OAuth profiles and token refresh, but it must not claim that a Codex OAuth
token is a general OpenAI API key or a supported general-purpose model endpoint
until a live, documented runtime path is proven.

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
  architecture: run Codex's own runtime, especially `codex app-server`, or a
  pinned OpenAI-compatible proxy that wraps Codex subscription access.
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
    -> Bundjil Codex app-server runner service
      -> isolated CODEX_HOME / auth profile store
      -> codex app-server subprocess or sandbox sidecar
      -> AI SDK-compatible adapter or private OpenAI-compatible bridge
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
   app-server or a pinned Codex-to-OpenAI-compatible bridge. The spec now
   treats Codex app-server embedding as the preferred proof target.

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
    token.service.ts
    oauth-client.service.ts
    live.layer.ts
    mock.layer.ts
  test/
    schemas.test.ts
    storage-keys.test.ts
    profile-store.test.ts
    token-service.test.ts
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

Add a Codex runtime package only after the app-server proof is accepted:

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
- `apps/agent` owns Eve model selection, deployment config, and deciding when
  to use AI Gateway versus Codex OAuth.
- Use Effect `KeyValueStore` as the persistence contract. Start with memory and
  file-backed layers; add Upstash Redis through a separate adapter once the
  service contract is stable and hosted token encryption is defined.
- Treat OpenClaw as prior art only. Do not import OpenClaw packages, copy code,
  copy state file formats, or expose a general OpenClaw-style gateway.
- The first implementation must prove the runtime path before changing the
  default Eve model from Vercel AI Gateway.
- Research conclusion: Codex OAuth is not a generic Platform API key and does
  not plug into Vercel AI Gateway as subscription billing. The viable path is
  Codex runtime embedding: first prove `codex app-server` with isolated
  `CODEX_HOME`, then adapt that runtime into Eve through either a direct AI SDK
  `LanguageModel` adapter or a private OpenAI-compatible bridge.
- Do not expose a public OpenAI-compatible endpoint in the first iteration. If
  a compatibility endpoint is required for Eve, bind it to loopback or private
  Vercel protection only, then document the security model.
- Store no token values in source, logs, task ledgers, docs, error messages, or
  test snapshots.

## OAuth Flow

The service should support two credential sources, in this order:

1. **Codex CLI/app-server owned login:** prefer `codex login`, Codex
   device-code login, or `codex app-server` auth modes over reimplementing
   OAuth endpoints in TypeScript. The Codex binary should own fragile auth
   details whenever possible.
2. **Supported Codex token path:** use `CODEX_ACCESS_TOKEN` or
   `codex login --with-access-token` when the user has a Business /
   Enterprise Codex access token or another officially documented token source.
3. **Interactive browser login spike:** investigate a PKCE loopback login flow
   only if `codex app-server` cannot satisfy the Bundjil runtime requirement.
   This may resemble OpenClaw's pattern, but must be implemented independently
   and verified against current OpenAI docs/source.

Candidate interactive steps for the spike:

```text
CLI command or private app route
  -> generate state + PKCE verifier/challenge
  -> open OpenAI auth URL
  -> receive loopback callback or pasted redirect URL
  -> exchange authorization code
  -> decode account metadata without logging token values
  -> store CodexOAuthProfile through OAuthProfileStore
  -> run getAccessToken(profile)
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
- `transport`: `"codex-sdk" | "openai-compatible-private-endpoint"`
- optional context-window override for Eve if Gateway metadata lookup is not
  available

Candidate runtime paths:

1. **Codex app-server path:** preferred proof target. Spawn or sandbox
   `codex app-server`, isolate `CODEX_HOME` per agent/profile, scrub
   `OPENAI_API_KEY` when subscription auth is selected, speak the documented
   app-server protocol, and adapt the result to Eve.
2. **Pinned private OpenAI-compatible bridge:** acceptable as a spike when it
   wraps Codex app-server or a pinned Codex subscription proxy and is kept
   loopback/private. It can make Eve integration easier through
   `@ai-sdk/openai-compatible`, but it is a high-risk surface if exposed.
3. **Codex SDK/CLI workflow path:** useful for coding-focused subagent tasks
   even if it cannot become Eve's primary turn model immediately.
4. **AI Gateway fallback:** keep current `google/gemini-2.5-flash` or another
   cheap Gateway model while Codex subscription access is being proven.

The spec does not approve replacing the default Eve model until a live proof
shows a prompt can complete through the Codex-authenticated provider.

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
CodexAppServerAuthStrategy;
CodexAppServerConfig;
CodexAppServerRequest;
CodexAppServerResponse;
CodexAppServerSession;
OAuthPrincipal;
CodexOAuthSubject;
CodexOAuthProfileId;
CodexOAuthProfile;
CodexOAuthAccessToken;
CodexOAuthTokenRefreshResult;
CodexOAuthLoginStart;
CodexOAuthLoginCallback;
CodexOAuthRuntimeProviderConfig;
CodexModelProviderConfig;
```

Initial service tags:

```ts
CodexAppServerClient;
CodexAppServerProcess;
OAuthProfileStore;
CodexOAuthTokenService;
CodexOAuthClient;
CodexModelProvider;
```

Initial named operations:

```ts
CodexAppServerProcess.start(input);
CodexAppServerProcess.stop(session);
CodexAppServerClient.initialize(session);
CodexAppServerClient.startThread(input);
CodexAppServerClient.startTurn(input);
CodexAppServerClient.interruptTurn(input);

OAuthProfileStore.getProfile(subject);
OAuthProfileStore.putProfile(profile);
OAuthProfileStore.removeProfile(subject);
OAuthProfileStore.hasProfile(subject);

CodexOAuthTokenService.getAccessToken(subject);
CodexOAuthTokenService.refreshAccessToken(subject);
CodexOAuthTokenService.revokeToken(subject);

CodexOAuthClient.startLogin(input);
CodexOAuthClient.completeLogin(input);
CodexOAuthClient.refresh(input);

CodexModelProvider.createLanguageModel(input);
```

Initial errors:

```ts
CodexAppServerAuthError;
CodexAppServerProtocolError;
CodexAppServerProcessError;
OAuthProfileSchemaError;
OAuthProfileStorageError;
OAuthProfileNotFound;
CodexOAuthConfigError;
CodexOAuthLoginError;
CodexOAuthTokenMissing;
CodexOAuthTokenExpired;
CodexOAuthTokenRefreshRequired;
CodexOAuthTokenProviderError;
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
  -> CodexModelProvider
    -> CodexAppServerClient
      -> CodexAppServerProcess
        -> isolated CODEX_HOME / env scrubber
        -> codex app-server subprocess or sandbox sidecar
      -> JSON-RPC initialize / thread / turn protocol
    -> AI SDK LanguageModel adapter or private bridge
```

Token/profile storage path:

```ts
CodexAppServerProcess
  -> CodexOAuthTokenService
    -> OAuthProfileStore
      -> KeyValueStore.KeyValueStore layer
        -> memory | filesystem | Upstash Redis adapter
  -> CODEX_HOME seed or Codex app-server auth mode
```

Tests, package:

```ts
@bundjil/codex-oauth tests
  -> OAuthProfileStoreMemory
    -> KeyValueStore.layerMemory
  -> CodexOAuthTokenServiceMemory
  -> mock CodexOAuthClient
  -> schema, key, expiry, redaction, storage-error tests
```

Tests, app integration:

```ts
@bundjil/agent tests
  -> apps/agent/agent/model-provider.ts
  -> CodexModelProvider mock layer
  -> Eve agent config
  -> no provider network calls
```

Opt-in live proof:

```ts
local/private env
  -> Codex OAuth profile exists
  -> isolated CODEX_HOME exists or is created
  -> codex app-server starts
  -> app-server JSON-RPC handshake succeeds
  -> Eve /eve/v1/session
  -> streamed model response through Codex-authenticated provider
```

## Verification Requirements

Before implementation starts:

- Keep the completed DeepWiki and Parallel Task findings in this spec current.
- Confirm the exact installed Codex CLI / app-server version and protocol docs.
- Confirm whether the first proof is direct app-server JSON-RPC,
  a direct AI SDK `LanguageModel` adapter, or a private OpenAI-compatible bridge
  over app-server.

Per implementation task:

- Run targeted package/app tests.
- Run `bun run check-types`.
- Run `bun run verification` before commit/handoff unless the task explicitly
  records a narrower reasoned exception.
- Record implementation evidence in the task ledger.

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
- `packages/codex-oauth/README.md`: schemas, service tags, layers, storage
  backends, verification, and secret handling.

Docs must distinguish:

- Implemented behavior.
- Opt-in local-only proof scripts.
- Future hosted/Vercel storage work.
- Unsupported or unproven Codex runtime paths.
- Difference between AI Gateway billing, OpenAI API-key billing, and ChatGPT /
  Codex subscription-backed runtime access.

## Risks And Tradeoffs

- Codex OAuth is not an OpenAI Platform API key and should not be treated as
  one. The subscription-backed path must route through Codex runtime surfaces
  such as app-server or a pinned bridge.
- PKCE endpoints inferred from OpenClaw may drift or may be unsupported for
  Bundjil. Do not hard-code them without current source/doc verification.
- A direct dependency on `chatgpt.com/backend-api/codex/*` style endpoints is
  brittle. Prefer `codex app-server`; if a proxy is used, pin it and treat it
  as a replaceable sidecar.
- If `OPENAI_API_KEY` and Codex subscription auth are both present, the runtime
  can silently bill the wrong path. Subscription mode must scrub API-key env
  from child processes and prove auth precedence in tests.
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

## Out Of Scope

- Better Auth / WorkOS user-login integration.
- Sendblue, Cloudflare Email Routing, Notion, or Vercel Connect channel work.
- A public OpenAI-compatible gateway.
- Multi-user web UI for managing profiles.
- Migration of existing Codex CLI auth files.
- Copying OpenClaw implementation code or state formats.
- Replacing AI Gateway as the default Eve model before live proof.

## Open Questions

- Can Bundjil run `codex app-server` reliably inside the local Eve dev process
  and later inside a Vercel Sandbox or equivalent hosted sidecar?
- Is a direct AI SDK `LanguageModel` adapter practical over the app-server
  protocol, or should the first proof expose a private OpenAI-compatible bridge?
- If Eve requires an AI SDK `LanguageModel`, should Bundjil implement a custom
  provider or a private OpenAI-compatible adapter?
- What exact auth precedence rules does Codex app-server apply when API key and
  ChatGPT subscription auth are both visible, and how do we enforce subscription
  mode without accidental API billing?
- What is the right hosted token encryption layer before using Upstash Redis
  on Vercel?
- Should the first login UX be CLI-only, local web-only, or a Vercel-protected
  private route?
- Can Vercel OIDC / Marketplace secrets safely provision Upstash credentials
  for this package without coupling package code to Vercel?
