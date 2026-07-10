# Hosted Codex Live OAuth Storage

Status: Draft  
Owner: Bundjil  
Created: 2026-07-07

## Purpose

Complete the next Codex provider slice: hosted live Codex mode for the private
proxy, live OAuth refresh and storage, and encrypted token-profile persistence
for Vercel preview and eventual production.

This is the continuation of
`docs/product-specs/codex-oauth-eve-model-provider.md`. The current repo has a
mock Vercel preview, direct Codex Responses proof services, an
OpenAI-compatible proxy contract, and an opt-in Upstash `KeyValueStore`
adapter. It does not yet have hosted live OAuth endpoint exchange, refresh
coordination, or encrypted hosted profile storage.

The target runtime remains:

```text
apps/agent Eve runtime
  -> AI SDK OpenAI-compatible LanguageModel when codex-proxy is opted in
  -> private apps/codex-proxy Vercel deployment
  -> @bundjil/codex-oauth OpenAICompatibleProxy
  -> @bundjil/codex-oauth CodexDirectProvider
  -> @bundjil/codex-oauth CodexOAuthService
  -> encrypted CodexProfileStore over Effect KeyValueStore
  -> Upstash Redis in Cooper's personal Vercel project
  -> https://chatgpt.com/backend-api/codex/responses
```

## Goals

- Revalidate the current Codex OAuth surface before writing live endpoint
  exchange code.
- Fix or explicitly bypass local Codex CLI duplicate-install/login issues so
  OAuth behavior can be inspected without stale tooling.
- Add application-side envelope encryption for stored Codex OAuth profiles.
- Store only encrypted token profiles in hosted KV.
- Add refresh coordination so rotating refresh tokens are not raced by
  concurrent Vercel invocations.
- Wire `apps/codex-proxy` live mode to real profile storage and direct Codex
  calls behind private bearer-token auth.
- Prove hosted live mode in a Vercel preview deployment under Cooper's
  personal Vercel account before considering production.
- Keep `apps/agent` on Gateway by default until the hosted live path has
  storage, refresh, deployment protection, and documented rollback.

## Non-Goals

- Do not adopt OpenClaw, Goose, Hermes, or Pi code.
- Do not introduce WorkOS, Better Auth, or app-user login for this slice.
- Do not treat Codex OAuth tokens as OpenAI Platform API keys.
- Do not route Codex OAuth through Vercel AI Gateway credentials.
- Do not expose `apps/codex-proxy` as a public gateway.
- Do not store raw access or refresh tokens in Upstash, Vercel KV, logs, test
  snapshots, proof files, or docs.
- Do not make Codex proxy the default Eve model provider in this slice.

## Current Foundations

Reuse these existing boundaries instead of creating parallel DTOs:

- `CodexOAuthSubject`
- `CodexOAuthProfile`
- `CodexOAuthService`
- `CodexOAuthClient`
- `CodexProfileStore`
- `CodexResponsesFetch`
- `CodexHttpClient`
- `CodexDirectProvider`
- `OpenAICompatibleProxy`
- `OpenAICompatibleChatCompletionRequest`
- `OpenAICompatibleProxyInput`
- `CodexProxyConfig`
- `CodexProxyRoutesLive`
- `CodexProfileStoreKeyValueLive`
- `UpstashKeyValueStoreLive`

The new implementation should add focused contracts beside these existing
owners:

- `EncryptedCodexOAuthProfileV1`
- `CodexOAuthProfileCipher`
- `CodexOAuthProfileCipherError`
- `CodexProfileStoreEncryptedKeyValueLive`
- `CodexOAuthRefreshLock`
- `CodexOAuthRefreshLockError`
- `CodexOAuthStateStore`
- `CodexOAuthStateStoreError`
- `CodexOAuthClientLive`
- `CodexProxyLiveLayers`

Names may change during implementation, but equivalent package-owned schemas,
service tags, layers, and tagged errors must exist before hosted live mode is
enabled.

## Design

### OAuth Revalidation

Codex OAuth behavior is not a stable public model-provider API. Before
implementation, re-run the research against the current Codex CLI and current
auth surface, then record sanitized findings in this spec or a dated research
appendix.

The first implementation task must verify:

- `which -a codex` and `codex --version` are not masking an older binary.
- The local managed Codex sign-in flow works or the blocker is documented.
- Current issuer, client id, scopes, PKCE behavior, redirect behavior, and
  token response shape are confirmed without recording secret values.
- The hosted redirect URI can be registered or otherwise accepted by the
  current Codex OAuth flow.

The screenshot failure from 2026-07-07 showed a managed login attempting a
localhost callback and failing after duplicate CLI installs were suspected.
That must be resolved or intentionally bypassed before hosted OAuth work.

#### Revalidation Evidence, 2026-07-11

This tracer bullet inspected only executable metadata, CLI status, cache field
names, and source-level protocol facts. It did not start an interactive login
or read, print, persist, or commit credentials, authorization codes, cookies,
or OAuth payloads.

- The shell-selected CLI is the standalone binary at
  `~/.local/bin/codex`, symlinked to the Codex-managed standalone install, and
  reports `codex-cli 0.136.0`. `codex login status` reports a ChatGPT login.
  Two other local binaries exist: the pnpm shim reports `0.142.0`, and the
  ChatGPT-app bundled binary reports `0.144.0-alpha.4`. The duplicate-install
  concern is therefore bypassed for this implementation by pinning all manual
  investigation to the shell-selected standalone CLI; nothing should infer
  behavior from the pnpm or bundled binary.
- The local auth cache was inspected only for top-level field names:
  `OPENAI_API_KEY`, `auth_mode`, `last_refresh`, and `tokens`. No values were
  read. This confirms that the prior local callback failure is not a current
  prerequisite for the already authenticated standalone CLI, but it does not
  establish a hosted redirect flow.
- Source-level research against `openai/codex` via Executor Personal DeepWiki
  identifies `https://auth.openai.com` as the account-login issuer category,
  a fixed public Codex CLI client identifier, scopes `openid`, `profile`,
  `email`, `offline_access`, `api.connectors.read`, and
  `api.connectors.invoke`, and PKCE `S256`. The CLI account login uses a
  local loopback callback at `http://localhost:<port>/auth/callback`.
- The relevant response/cache shape contains identity, access, refresh, and
  expiry fields. The source names include `id_token`, `access_token`,
  `refresh_token`, `expires_at`, `client_id`, and `token_response`. These
  names establish the later schema boundary only; their values must never be
  logged, stored unencrypted, or added to fixtures.
- `mcp_oauth_callback_url` is not a hosted-account-login escape hatch. The
  Codex source uses it only when Codex authenticates to a configured remote
  MCP server. It does not provide an arbitrary hosted redirect setting for the
  CLI's ChatGPT account authorization flow.

**Decision: hosted account OAuth routes are blocked/deferred.** The current
CLI/source evidence does not support implementing `/codex/oauth/start` and
`/codex/oauth/callback` against the CLI's ChatGPT OAuth client from a Vercel
deployment. Do not emulate or reuse that public client, localhost redirect,
or its account tokens. Encryption, schema, storage, and lock work may proceed
in `@bundjil/codex-oauth`; `CodexOAuthClientLive`, operator OAuth routes, and
hosted live proof remain blocked until OpenAI provides a supported hosted grant
with a registered Vercel redirect URI, or a separately supported account-link
mechanism is verified and specified.

### Encrypted Profile Storage

`@bundjil/codex-oauth` owns encryption contracts because token profiles are a
provider concern, not a Vercel route concern. The live deployment supplies key
material through app-owned Effect Config.

The encrypted profile shape should be versioned and schema-backed:

```text
EncryptedCodexOAuthProfileV1
  version
  algorithm
  keyId
  nonce
  ciphertext
  subjectHash
  createdAtEpochMillis
  updatedAtEpochMillis
```

The stored value must be encoded through an owning Effect Schema before it
crosses the `KeyValueStore` boundary. Prefer `KeyValueStore.toSchemaStore`
when the boundary stores schema-owned values, and keep any lower-level
string-only storage adapter behind a package-owned layer.

`CodexOAuthProfileCipher` should use WebCrypto-compatible AES-GCM or an
equivalent platform-supported authenticated encryption primitive. The key must
come from `Config.redacted`, with a separate non-secret key id for rotation.
The implementation must prove that stored values do not contain raw access
tokens, refresh tokens, authorization codes, or full OAuth payloads.

`Redacted.value(...)` may only appear at the final provider boundary that needs
the raw bytes, such as WebCrypto key import or an outbound authorization
header. It must not appear in diagnostics, errors, JSON proof output, task
evidence, test snapshots, or route responses.

Hosted storage should compose as:

```text
CodexProfileStore
  -> CodexProfileStoreEncryptedKeyValueLive
  -> CodexOAuthProfileCipher
  -> effect/unstable/persistence/KeyValueStore
  -> UpstashKeyValueStoreLive
  -> @upstash/redis
```

The existing raw `CodexProfileStoreKeyValueLive` remains valid for local tests
and non-hosted proof, but it must not be composed with Upstash for hosted
refresh-token storage.

### Refresh Coordination

Refresh tokens can rotate, so hosted live mode needs an explicit lock before
refresh. Add a `CodexOAuthRefreshLock` service with typed acquisition,
contention, release, and expiry errors.

The lock key should derive from the existing canonical subject hash. The
owner value should be per invocation. The TTL must be short enough to recover
from crashed serverless invocations, and tests must prove stale lock expiry.

Preferred hosted implementation:

```text
CodexOAuthRefreshLock
  -> Upstash Redis atomic lock command
  -> set-if-absent with expiry
  -> compare-owner release
```

If the current Upstash SDK cannot express the required atomic operation through
the generic `KeyValueStore`, add a narrow package-owned Upstash lock adapter
behind the service tag rather than leaking Redis commands into app route code.

### OAuth Routes

`apps/codex-proxy` owns the deployable route boundary because it owns Vercel
entrypoints, app config, and private operator access.

Add private/operator routes:

```text
GET /codex/oauth/start
GET /codex/oauth/callback
POST /codex/oauth/logout
```

`/codex/oauth/start` must create PKCE/state values, store short-lived state in
`CodexOAuthStateStore`, and redirect to the current OpenAI/Codex authorization
URL. `/codex/oauth/callback` must validate state, exchange the code, build a
canonical `CodexOAuthProfile`, encrypt it, persist it, and return a minimal
success page or schema-encoded JSON response that contains no token values.
`/codex/oauth/logout` must remove the stored encrypted profile for the
configured subject.

These routes are private operational routes, not public app-login routes.
Production must either keep them behind deployment protection, an internal
admin token, or another explicit operator-only guard.

### Live Proxy Mode

`BUNDJIL_CODEX_PROXY_MODE=mock` remains the local and default preview proof
mode. `BUNDJIL_CODEX_PROXY_MODE=live` may only compose live layers after
encrypted storage, refresh coordination, and Vercel preview env are verified.

The live chat route should:

- validate the internal bearer token;
- decode the OpenAI-compatible request through canonical Effect Schema;
- resolve the configured Codex subject/profile;
- refresh under lock when the access token is near expiry;
- call the direct Codex Responses backend;
- stream OpenAI-compatible SSE chunks;
- record only sanitized diagnostics.

The app must compose live mode through explicit layers rather than hidden
globals:

```text
CodexProxyLiveLayers
  -> CodexProxyConfig
  -> CodexOAuthClientLive
  -> CodexOAuthService
  -> CodexOAuthRefreshLockLive
  -> CodexProfileStoreEncryptedKeyValueLive
  -> CodexOAuthProfileCipherLive
  -> UpstashKeyValueStoreLive
  -> CodexDirectProviderLive
```

`apps/agent` should remain unchanged except for docs and optional local
configuration notes. It should still treat the private proxy as a normal AI SDK
OpenAI-compatible provider.

### Vercel and Upstash

The Vercel project is `bundjil-codex-proxy` in Cooper's personal Vercel
account. Do not deploy or configure this under Tilt Legal.

Required preview environment categories:

- proxy auth: `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`
- mode: `BUNDJIL_CODEX_PROXY_MODE`
- subject/profile ids: the existing `BUNDJIL_CODEX_*` profile identifiers
- Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, optional
  key prefix
- encryption: `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY`,
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`
- OAuth: verified Codex OAuth client, issuer, redirect, and scope settings if
  they cannot be safely derived from the current implementation

All secret values belong in Vercel env vars or ignored local env files. The
earlier preview env pull showed the internal token value was effectively empty;
that must be rotated and verified before authenticated preview proof.

## Call Graphs

Production hosted OAuth start:

```text
GET /codex/oauth/start
  -> apps/codex-proxy CodexOAuthRoutesLive
  -> CodexOAuthClientLive.startLogin
  -> CodexOAuthStateStore
  -> encrypted or short-lived Effect KeyValueStore state
  -> redirect to current Codex authorization URL
```

Production hosted OAuth callback:

```text
GET /codex/oauth/callback
  -> apps/codex-proxy CodexOAuthRoutesLive
  -> CodexOAuthStateStore.validate
  -> CodexOAuthClientLive.completeLogin
  -> CodexOAuthProfileCipher.encrypt
  -> CodexProfileStoreEncryptedKeyValueLive.save
  -> UpstashKeyValueStoreLive
```

Production live model path:

```text
apps/agent Eve runtime
  -> @ai-sdk/openai-compatible LanguageModel
  -> POST apps/codex-proxy /v1/chat/completions
  -> CodexProxyRoutesLive
  -> OpenAICompatibleProxy.handleChatCompletions
  -> CodexDirectProvider.streamChatCompletion
  -> CodexOAuthService.getValidAccessToken
  -> CodexOAuthRefreshLock.withLock when refresh is needed
  -> CodexProfileStoreEncryptedKeyValueLive
  -> CodexHttpClient
  -> chatgpt.com/backend-api/codex/responses
```

Package tests:

```text
Vitest
  -> CodexOAuthProfileCipher deterministic or WebCrypto test layer
  -> CodexProfileStoreEncryptedKeyValueLive
  -> KeyValueStore.layerMemory
  -> leak checks against encoded stored values

Vitest
  -> CodexOAuthRefreshLock memory and Upstash-like test layers
  -> concurrent refresh programs
  -> one refresh winner, retry/read followers
```

App tests:

```text
Vitest
  -> apps/codex-proxy server/router
  -> mock CodexOAuthClientLive
  -> memory CodexOAuthStateStore
  -> memory encrypted CodexProfileStore
  -> mocked CodexDirectProvider
```

Vercel proof:

```text
vercel deploy preview
  -> GET /health reports live mode when configured
  -> OAuth start/callback stores encrypted profile
  -> authenticated /v1/chat/completions streams live Codex result
  -> Vercel logs and Upstash readback show no secret leakage
```

## Effect Requirements

Use Effect TS native approaches first. Prefer `Data`, `Schema`, `Array`,
`Chunk`, `HashSet`, `HashMap`, `Match`, `Context`, `Layer`, `Config`,
`Service`, `Record`, `Result`, `Exit`, `Bun/Platform Command`, and
`ManagedRuntime` over plain TypeScript helpers when the code is fallible,
async, runtime-owned, collection-heavy, or crosses a package, route, command,
config, provider, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as id, slug, status, or metadata outside their canonical
schema/type owner.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, unsafe casts, manual
encode/decode adapters, or trivial helpers when Effect Schema, `Match`,
`Result`, `Exit`, or an owning service contract should carry the behavior.

JSON string boundaries in committed app or package code must use Effect Schema
codecs such as `Schema.fromJsonString(...)` or `Schema.UnknownFromJsonString`.

Concrete requirements for this SPEC:

- New runtime capabilities must be exposed as `Context.Service` tags with
  live and memory/mock layers. Do not pass raw provider clients through domain
  functions.
- Primary operations must be named `Effect.gen` or `Effect.fn` programs with a
  readable success path and `Effect.withSpan(...)` where the operation crosses
  a provider, storage, route, or config boundary.
- Expected failures must be package-owned `Schema.TaggedErrorClass` or
  `Data.TaggedError` values. Translate provider/route failures once at the
  boundary and handle them with `Effect.catchTag`, `Effect.catchTags`,
  `Effect.mapError`, or `Match`.
- Config must live beside the runtime or package that consumes it and use
  `Config.schema(...)`, `Config.redacted(...)`, `Config.url(...)`, and
  `ConfigProvider.fromEnv()`. Package logic must not read `process.env`
  directly.
- Persistence must flow through `effect/unstable/persistence/KeyValueStore`
  and schema-backed stores. Raw Redis or Upstash commands are allowed only in a
  narrow adapter layer that implements an owning service contract such as
  `CodexOAuthRefreshLock`.
- Tests should use `@effect/vitest` and compose memory/mock layers at the test
  boundary.

Every implementation task must record the mandatory 3-pass audit, and the task
ledger must include a dedicated 3-pass audit sweep task after implementation:

1. Ownership and call graph.
2. Effect implementation quality.
3. Verification coverage.

## Verification

Before implementation can be marked complete:

- `bun install --frozen-lockfile`
- `bun run --filter @bundjil/codex-oauth test`
- `bun run --filter @bundjil/codex-oauth check-types`
- `bun run --filter @bundjil/codex-oauth build`
- `bun run --filter @bundjil/codex-proxy test`
- `bun run --filter @bundjil/codex-proxy check-types`
- `bun run --filter @bundjil/codex-proxy build`
- `bun run --filter @bundjil/codex-proxy smoke-test`
- `bun run --filter @bundjil/agent test` if agent wiring or docs examples
  change
- `bun run --filter @bundjil/agent build` if agent wiring changes
- `bun run check-types`
- `bun run verification`
- Vercel preview deploy and direct HTTP checks before production
- sanitized hosted live OAuth proof
- sanitized hosted live model proof
- Vercel log scan for absent token values, authorization codes, raw OAuth
  payloads, prompts, and full response bodies
- Upstash readback proof that hosted values are encrypted and prefixed
- dedicated 3-pass Effect TS audit sweep task completed with evidence

Production deployment remains a separate explicit approval gate after preview
proof.

## Risks

- Codex OAuth is not a general OpenAI API credential path and may change.
- Refresh-token rotation can corrupt a profile if concurrent invocations race.
- Hosted token storage can become a durable credential leak if encryption or
  logs are wrong.
- Vercel preview protection and project scope mistakes can expose a private
  provider endpoint.
- The Eve app could accidentally become coupled to Codex OAuth internals if
  provider selection logic crosses the app/package boundary.

## Rollback

- Set `BUNDJIL_CODEX_PROXY_MODE=mock` for the proxy.
- Remove `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy` so Eve returns to Gateway.
- Rotate `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN` if route auth is suspected to be
  exposed.
- Delete the encrypted Codex profile and short-lived OAuth state keys from
  Upstash.
- Roll back the Vercel preview or production deployment.
