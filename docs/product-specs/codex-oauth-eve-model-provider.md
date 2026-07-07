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

### Executor / DeepWiki research status

The user requested DeepWiki research through `mcp__executor_personal`.

Attempts made on 2026-07-07:

1. `mcp__executor_personal.skills({ name: "execute" })` returned
   `OAuth authorization required`.
2. `mcp__executor_personal.execute(...)` returned the same OAuth requirement.
3. `codex mcp get executor-personal` confirmed the server is enabled at
   `https://executor.sh/personal-3548/mcp` with OAuth auth.
4. `codex mcp login executor-personal` opened a browser authorization flow and
   waited on the loopback callback, then timed out with
   `timed out waiting for OAuth callback`.

This spec therefore includes an implementation gate that must be completed
before code starts: rerun executor personal DeepWiki research after OAuth is
authorized and update this section with results for:

- OpenAI / Codex auth runtime and SDK boundaries.
- Eve model-provider / AI SDK `LanguageModel` wiring.
- Effect v4 `KeyValueStore` and Vercel-compatible storage adapters.

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
- Do not expose a public OpenAI-compatible endpoint in the first iteration. If
  a compatibility endpoint is required for Eve, bind it to loopback or private
  Vercel protection only, then document the security model.
- Store no token values in source, logs, task ledgers, docs, error messages, or
  test snapshots.

## OAuth Flow

The service should support two credential sources, in this order:

1. **Supported Codex token path:** use `CODEX_ACCESS_TOKEN` or
   `codex login --with-access-token` when the user has a Business /
   Enterprise Codex access token or another officially documented token source.
2. **Interactive browser login spike:** investigate a PKCE loopback login flow
   only after DeepWiki / source review confirms the current Codex auth flow and
   policy boundary. This may resemble OpenClaw's pattern, but must be
   implemented independently and verified against current OpenAI docs/source.

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

1. **Codex SDK path:** best for coding-focused subagent/workflow tasks. It may
   not be a drop-in Eve turn model because Eve expects an AI SDK
   `LanguageModel`.
2. **AI SDK custom provider path:** best fit for Eve if the implementation can
   present Codex-authenticated inference through a private OpenAI-compatible or
   custom AI SDK `LanguageModel`.
3. **AI Gateway fallback:** keep current `google/gemini-2.5-flash` or another
   cheap Gateway model while Codex OAuth is being proven.

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
OAuthProfileStore;
CodexOAuthTokenService;
CodexOAuthClient;
CodexModelProvider;
```

Initial named operations:

```ts
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
    -> CodexOAuthTokenService
      -> OAuthProfileStore
        -> KeyValueStore.KeyValueStore layer
          -> memory | filesystem | Upstash Redis adapter
    -> AI SDK LanguageModel
      -> verified Codex-authenticated runtime path
```

OAuth login CLI path:

```ts
bun run --filter @bundjil/codex-oauth login
  -> CodexOAuthClient.startLogin
    -> Config / PKCE / state
    -> Browser or printed URL
  -> CodexOAuthClient.completeLogin
    -> token exchange
    -> Schema.decodeUnknownEffect(CodexOAuthProfile)
    -> OAuthProfileStore.putProfile
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
  -> run provider smoke script
  -> Eve /eve/v1/session
  -> streamed model response through Codex-authenticated provider
```

## Verification Requirements

Before implementation starts:

- Complete personal executor OAuth authorization.
- Use executor personal DeepWiki to research Codex auth, Eve model provider
  integration, and Effect v4 KeyValueStore.
- Update this spec's research section with DeepWiki findings.
- Confirm whether the runtime path is Codex SDK, private OpenAI-compatible
  endpoint, custom AI SDK provider, or "not currently supported".

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

## Risks And Tradeoffs

- Codex OAuth may not be a supported general-purpose model credential for Eve.
  If so, use Codex SDK only for coding-specialist workflows and keep Eve on AI
  Gateway or another supported AI SDK provider.
- PKCE endpoints inferred from OpenClaw may drift or may be unsupported for
  Bundjil. Do not hard-code them without current source/doc verification.
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

- Does the current Codex TypeScript SDK expose enough hooks to run under a
  Bundjil-managed access token without shelling out?
- Is a ChatGPT/Codex OAuth token accepted by any supported OpenAI-compatible
  inference endpoint, or only by Codex local workflows?
- If Eve requires an AI SDK `LanguageModel`, should Bundjil implement a custom
  provider or a private OpenAI-compatible adapter?
- What is the right hosted token encryption layer before using Upstash Redis
  on Vercel?
- Should the first login UX be CLI-only, local web-only, or a Vercel-protected
  private route?
- Can Vercel OIDC / Marketplace secrets safely provision Upstash credentials
  for this package without coupling package code to Vercel?
