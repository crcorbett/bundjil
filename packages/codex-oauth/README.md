# @bundjil/codex-oauth

Effect contracts for Bundjil-owned Codex OAuth profiles and the direct Codex
Responses proof path.

This package owns reusable profile, token, trusted-local subscription login,
and proof boundaries. It performs OAuth exchange only from its local Bun login
command; it does not expose hosted OAuth routes, own Vercel deployment, or
change the Eve app model. The deployable private proxy app lives in
`apps/codex-proxy` and composes this package's service contracts.

## Current State

Implemented:

- Effect Schema contracts for Codex subjects, profiles, token values,
  OpenAI-compatible chat-completion requests, Codex Responses requests, and
  sanitized proof results.
- `CodexProfileStore`, `CodexOAuthService`, `CodexOAuthClient`,
  `CodexResponsesFetch`, `CodexHttpClient`, `CodexResponsesProof`,
  `CodexDirectProvider`, and `OpenAICompatibleProxy` service contracts.
- Explicit `CodexAccessTokenImportProfile` and `CodexSubscriptionProfile`
  variants. Existing encrypted V1 plaintext decodes only as the access-token
  fallback; refresh-capable profiles use V2 envelopes.
- Versioned `EncryptedCodexOAuthProfileV1` and
  `EncryptedCodexOAuthProfileV2` envelopes and a
  `CodexOAuthProfileCipher` service using authenticated AES-GCM encryption.
  The cipher has explicit live and test layers, keeps key material redacted
  until WebCrypto key import, and uses Effect Schema for profile and envelope
  JSON boundaries.
- Memory/mock layers for automated tests.
- Opt-in direct Codex Responses proof with sanitized output.
- Opt-in Vercel Marketplace Upstash Redis adapter behind Effect
  `KeyValueStore`.
- `CodexOAuthProfileCommit` with atomic create, replacement, refresh, and
  reauthentication fences. Memory and Upstash layers reject stale profile
  generations without exposing revision values through observer events.
- Explicit trusted-local filesystem `KeyValueStore` adapter backed by
  `KeyValueStore.layerFileSystem(...)` and `BunServices.layer`. It is a
  persistent development/proof store, never a Vercel or multi-instance store.
- Trusted-local, access-token-only import for an already authenticated Codex
  ChatGPT CLI cache. The command is package-owned, reads the cache only on the
  operator machine, validates the minimal cache shape with Effect Schema, and
  writes an encrypted profile through `CodexProfileStore`. It deliberately
  excludes the local refresh token and ID token, sets
  `requiresReauthentication: true`, and never runs in Vercel, Eve, routes, CI,
  or browser code.
- Trusted-local Codex subscription login through the first-party loopback PKCE
  protocol. `CodexSubscriptionLogin` composes package-owned protocol config,
  callback, browser, OAuth HTTP, token-metadata, encrypted-store, and fenced
  commit services. The Bun command binds only `127.0.0.1`, tries registered
  callback ports `1455` then `1457`, opens the system browser, exchanges the
  authorization code, discards the ID token after decoding canonical account
  metadata, and stores a refresh-capable encrypted profile.
- The loopback listener is owned by Effect Platform through
  `BunHttpServer.make` and `HttpServer.serveEffect`. It does not create a raw
  Bun server, enable request logging, or outlive the scoped login operation.
- Separate form-url-encoded authorization-code exchange and JSON refresh
  transports through Effect Platform `HttpClient`. Response schemas do not
  assume `expires_in`; access-token expiry comes from the JWT `exp` claim.
- Successful and non-success token responses have separate narrow Schemas.
  Provider error values are decoded only to validate the boundary, then
  discarded in favor of stable sanitized errors. An exchanged access token
  whose JWT expiry is not in the future is rejected before persistence.
- `CodexOAuthProfileCommit.replaceLegacy` atomically migrates an observed
  access-token import. Memory fencing compares the observed generation;
  Upstash verifies the encrypted legacy envelope and fences the Lua swap
  against its exact ciphertext while installing the first subscription
  revision. Concurrent or delayed migrations cannot replace the winner.
- Memory layers for callback, browser, and OAuth HTTP boundaries. Automated
  login tests do not open a browser, contact OpenAI, or require credentials.

Future:

- Hosted refresh policy, bounded `401` recovery, and preview verification.
- Integration of the refresh-capable profile into the private proxy live path.
- The proxy continues to use the unsupported commit layer until the dedicated
  refresh-capable live-proxy task is accepted.

Unsupported:

- Treating Codex OAuth tokens as OpenAI Platform API keys or Vercel AI Gateway
  credentials.
- Reading `OPENAI_API_KEY` or `CODEX_API_KEY` for subscription-provider mode.
- Importing Eve, Vercel deployment code, OpenClaw code, or Goose code.
- Storing raw refresh tokens in hosted KV.
- Importing, persisting, or refreshing the Codex CLI's local `refresh_token`
  or `id_token` through the local-import workaround.

## Contracts

- `CodexOAuthSubject` identifies one Codex profile by provider, principal,
  connector id, installation id, and profile id.
- `CodexOAuthProfile` stores redacted access and refresh token wrappers,
  expiry timestamps, scopes, and reauthentication state.
- `CodexProfileStore` is the profile persistence service.
- `CodexOAuthProfileCommit` is the only subscription-profile mutation service;
  `initialWrite`, revision-based `replace`, and legacy `replaceLegacy` have
  distinct atomic preconditions. `CodexProfileStore.putProfile` remains
  restricted to the legacy import path.
- `CodexOAuthService` is the token lifecycle service.
- `CodexOAuthClient` is the future provider-client boundary.
- `CodexSubscriptionAuthProtocolConfigService` owns the reviewed first-party
  public OAuth endpoints, client id, scopes, authorization parameters, and
  callback ports. These are package constants, not process configuration.
- `CodexLoopbackCallback` owns the scoped callback resource and strict callback
  validation. `CodexBrowserLauncher` is the only boundary that reveals the
  redacted authorization URL to an operating-system command.
- `CodexOAuthHttpClient` owns code exchange and refresh transport only.
  `CodexSubscriptionLogin` owns the local orchestration and fenced save.
- `CodexOAuthProfileCipher` encrypts and decrypts canonical
  `CodexOAuthProfile` values into versioned encrypted envelopes. It does not
  persist profiles or implement OAuth endpoint exchange.
- `CodexResponsesFetch` wraps the fetch boundary used by direct Codex
  Responses calls.
- `CodexHttpClient` posts sanitized proof requests to the direct Codex
  Responses endpoint.
- `CodexResponsesProof` builds the minimal proof request and returns only safe
  status metadata.
- `CodexRequestMapper` maps OpenAI-compatible chat completion requests into
  Codex Responses payloads.
- `CodexStreamMapper` maps Codex Responses stream events into
  OpenAI-compatible SSE chunks.
- `CodexDirectProvider` resolves a stored Codex access token, calls the direct
  Codex Responses client, and returns an OpenAI-compatible stream.
- `OpenAICompatibleProxy` is a package-level private proxy contract that
  enforces an internal bearer token before delegating to the direct provider.
- `UpstashKeyValueStoreLive` is an opt-in Vercel Marketplace / Upstash Redis
  adapter for Effect `KeyValueStore`.
- `CodexFileSystemKeyValueStoreLive(directory)`, exported from
  `@bundjil/codex-oauth/filesystem-key-value-store.layer`, is an explicit
  local Bun filesystem adapter. The caller supplies its directory; the layer
  does not read app environment variables or make deployment decisions.

Token schemas use Effect `Schema.RedactedFromValue`. Decoded values print and
serialize as redacted placeholders, while the KeyValueStore JSON codec can
persist the token value inside the approved storage boundary.

## Schema JSON Boundaries

Provider request bodies, provider stream chunks, proof output, smoke-test
payloads, and leak checks must stay tied to Effect Schema contracts. Use
`Schema.fromJsonString(...)` for JSON string boundaries and
`Schema.UnknownFromJsonString` for safe rendering of unknown diagnostic values.
Do not add manual JSON string assembly in package code.

## Storage Keys

Profiles are stored under:

```text
bundjil/oauth/v1/provider/codex/profile/{subjectHash}
```

`subjectHash` is a SHA-256 hash over the canonical subject fields. Raw emails,
token values, prompts, and OAuth responses are not included in storage keys.

## Layers

- `CodexProfileStoreKeyValueLive`, exported from
  `@bundjil/codex-oauth/live.layer`, wires `CodexProfileStore` to
  `effect/unstable/persistence/KeyValueStore`.
- `CodexOAuthClientLive` and `CodexOAuthServiceLive`, also exported from the
  live subpath, are deterministic and non-networked in this slice. Client
  operations fail with `CodexOAuthUnsupportedRuntimePath` until the live OAuth
  task implements endpoint exchange.
- `CodexResponsesFetchLive`, `CodexHttpClientLive`, and
  `CodexResponsesProofLive`, exported from the live subpath, own the opt-in
  direct Codex Responses proof path. Tests can replace `CodexResponsesFetch`
  with a mock layer.
- `CodexRequestMapperLive`, `CodexStreamMapperLive`,
  `CodexDirectProviderLive`, and `OpenAICompatibleProxyLive`, exported from
  the live subpath, own the package-level provider/proxy contract. They do not
  start an HTTP server or change Eve.
- `CodexOAuthMemory` and `CodexProfileStoreMemory`, exported from
  `@bundjil/codex-oauth/mock.layer`, use
  `KeyValueStore.layerMemory` for deterministic tests and optional seeded
  profiles.
- `CodexOAuthProfileCipherConfigLive` reads
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY`,
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`, and the optional
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_ALGORITHM` through Effect Config.
  `CodexOAuthProfileCipherLive` consumes that config through the package-owned
  cipher service. `CodexOAuthProfileCipherTest` supplies a schema-owned test
  config without reading the process environment.
- `CodexHttpClientMock` and `CodexDirectProviderMock`, exported from the mock
  subpath, replace provider boundaries in tests without network calls.
- `CodexSubscriptionAuthProtocolConfigLive`,
  `CodexLoopbackCallbackBunLive`, `CodexBrowserLauncherCommandLive`,
  `CodexOAuthHttpClientLive`, and `CodexSubscriptionLoginLive` form the local
  production graph. Their `Test` or `Memory` counterparts form the mock graph.
- `UpstashKeyValueStoreLive`, exported from
  `@bundjil/codex-oauth/upstash-key-value-store.layer`, provides only the
  Effect `KeyValueStore` service. It is not composed into `CodexOAuthLive` by
  default.

The root export is reserved for schemas, errors, service tags, and pure
operation helpers. Import live and mock layers from their explicit subpaths.

## Local Filesystem Proof

The filesystem path is for a trusted local development/proof process. It writes
the same encrypted profile envelope as the preview path but is not deployable
and must not be pointed at a shared, synced, or committed directory.

Use an ignored directory and explicit profile fields in an ignored local env
source, then run:

```bash
BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR=/absolute/ignored/bundjil-codex-store \
  bun run --filter @bundjil/codex-oauth import:local-profile:filesystem
```

The filesystem importer needs the existing local importer configuration and
encryption key material, plus `BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR`. It does
not read Upstash configuration, does not print the store path or token data,
and stores only the current access token. Delete the directory to revoke the
local profile.

## Upstash Redis KeyValueStore Adapter

Use Vercel Marketplace Upstash Redis for hosted KV. Do not use `@vercel/kv`;
new storage work should use the Upstash SDK directly behind Effect
`KeyValueStore`.

The adapter parses config through Effect `Config`:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

For compatibility with Vercel-provisioned aliases, the layer also accepts:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

The token is loaded with `Config.redacted`, decoded through
`UpstashRedisConfig`, and passed to `new Redis(...)` with
`automaticDeserialization: false` so Effect Schema remains the JSON boundary.
Automated tests use a mocked Redis-like client and never require live Upstash
credentials.

Provisioning flow:

```bash
cd apps/codex-proxy
vercel link --project bundjil-codex-proxy
vercel env pull .env.preview.local --environment=preview
```

Link an Upstash Redis Marketplace resource to the Vercel project, then pull
the linked env vars locally. If Vercel injects only `KV_REST_API_*` aliases,
either keep those aliases or map them to `UPSTASH_REDIS_REST_*` in project env
settings.

The adapter prefixes Redis keys before storage. The default prefix is:

```text
bundjil:codex-oauth:
```

Override it with `BUNDJIL_UPSTASH_REDIS_KEY_PREFIX` only when migrating or
isolating another environment. Effect `KeyValueStore.clear` and `size` are
implemented by scanning this prefix, so they operate on Bundjil-owned keys
rather than the whole Redis database.

The proxy's explicit preview `live` composition applies the package-owned
AES-GCM cipher before this adapter receives an imported access-token-only
profile. Upstash TLS and provider-managed at-rest encryption are still not
enough to make unsupported refresh-token use safe, so this workaround never
imports, stores, or refreshes refresh tokens.

Marketplace provisioning can auto-bind Upstash credentials to Vercel
production as well as preview. Bundjil's proxy mode, cipher key, profile
subject, import, and deploy are configured for preview only; a marketplace
binding is not a production activation or approval.

Rollback for storage experiments:

- Remove the `UpstashKeyValueStoreLive` layer from the app composition.
- Return tests and local proof to `CodexOAuthMemory` or
  `KeyValueStore.layerMemory`.
- Leave Vercel/Upstash credentials in ignored env files or rotate them through
  provider dashboards; do not print values in rollback notes.

## Safe Secret Handling

Do not log, snapshot, or include access tokens, refresh tokens, authorization
codes, raw OAuth responses, or private prompts in errors. Public tagged errors
only include safe fields such as operation names, profile ids, hashed subject
keys, timestamps, and sanitized messages.

## Trusted-Local Subscription Login

Run the broker only on the trusted owner machine. It requires the personal
Upstash and profile-encryption configuration documented above, plus the
non-secret subject identifier:

```bash
BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID=personal-owner \
  bun run --filter @bundjil/codex-oauth login:subscription
```

Optional non-secret settings are:

- `BUNDJIL_CODEX_PROFILE_CONNECTOR_ID`, default `bundjil-local`
- `BUNDJIL_CODEX_PROFILE_INSTALLATION_ID`, default `agent-dev`
- `BUNDJIL_CODEX_PROFILE_ID`, default `default`
- `BUNDJIL_CODEX_LOGIN_CALLBACK_TIMEOUT`, default `5 minutes`

The command prints only a Schema-encoded result containing the profile id,
ChatGPT mode, valid-expiry category, refresh capability, and encrypted-store
confirmation. It never prints the authorization URL, callback query, code,
state, verifier, tokens, ID token, account id, provider response, prompt, or
model output.

Package typechecking includes `src`, `test`, and `scripts`, so the executable
composition is checked alongside its service contracts. The build remains
source-only and does not emit CLI entrypoints into the package library output.

The callback is local-only. There is deliberately no `/oauth/start`,
`/oauth/callback`, Vercel callback, Eve callback, or browser-bundle import.
Hosted code reads the resulting encrypted profile in later tasks; it never
conducts the interactive login.

## Trusted-Local Profile Import

The temporary local-import workaround is documented in
[`docs/product-specs/codex-local-profile-import-workaround.md`](../../docs/product-specs/codex-local-profile-import-workaround.md).
It is not a supported hosted OAuth flow: it does not reuse the Codex CLI
client, redirect URI, browser session, PKCE exchange, or refresh token.

Run it only on the trusted machine with an active local Codex ChatGPT login:

```bash
bun run --filter @bundjil/codex-oauth import:local-profile
```

That command remains the Upstash importer for the personal-Vercel preview
path. For the separate local filesystem proof, use
`import:local-profile:filesystem` instead; it never composes Upstash.

The command reads configuration through Effect `Config` and
`ConfigProvider.fromEnv()`. It needs the existing encryption and Upstash
configuration plus these explicit, non-secret profile fields:

- `BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID`
- `BUNDJIL_CODEX_PROFILE_CONNECTOR_ID`
- `BUNDJIL_CODEX_PROFILE_INSTALLATION_ID`
- `BUNDJIL_CODEX_PROFILE_ID`

`BUNDJIL_CODEX_LOCAL_AUTH_FILE` is optional and defaults to
`$HOME/.codex/auth.json` for this command only. The importer uses
`BUNDJIL_CODEX_LOCAL_ACCESS_TOKEN_TTL` to calculate the short-lived profile
expiry; it defaults to one hour from Codex's local `last_refresh` timestamp.
When overriding it, use Effect duration syntax such as `"1 hour"` or
`"720 hours"`, not abbreviated values such as `1h`.
Set `BUNDJIL_CODEX_ACCOUNT_ID` only in proxy configuration when the direct
provider needs its optional account header; the importer never reads it from
the Codex cache.

Success output is schema-backed metadata only: the profile id, `chatgpt` mode,
the re-import-required state, valid-expiry status, and encrypted-store
confirmation. Filesystem-import failure output additionally includes a fixed
safe operation category such as `decodeCache`, `validateExpiry`,
`profileCipher`, or `storage`; it names no cache path, account id, cache
contents, token, prompt, or model response.

The profile contains only the current access token. When it expires, the
proxy must fail closed; renew the local Codex login if needed and run the
import command again. Do not add automatic refresh around this workaround.

### Operator Modes

- `mock` is app-owned and the default. It needs no imported profile and never
  calls Codex.
- `local` is a trusted Bun-only proof. The filesystem importer and proxy use
  `BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR`; Vercel rejects this mode.
- `live` is the personal Vercel preview path. The Upstash importer and proxy
  require preview-only cipher, internal-token, subject, and KV configuration.
  The package never chooses the mode or deploys Vercel.

Local and preview import commands return schema-backed, sanitized status only:

```text
status: imported
mode: chatgpt
requiresReauthentication: true
expiryStatus: valid
encryptedStore: stored
```

That output does not establish durable authentication. It records an
access-token-only profile which must be re-imported after expiry or upstream
authorization failure. The package deliberately does not implement hosted
OAuth start/callback routes, browser account linking, or an Eve integration.

## Direct Codex Responses Proof

The proof command is opt-in and local/private:

```bash
bun run --filter @bundjil/codex-oauth proof:codex-responses
```

It reads config through Effect `Config` and `ConfigProvider.fromEnv()`:

- `CODEX_ACCESS_TOKEN` is required and is decoded into a redacted schema value.
- `BUNDJIL_CODEX_ACCOUNT_ID` is optional and becomes `chatgpt-account-id`.
- `BUNDJIL_CODEX_MODEL` defaults to `gpt-5.5`.
- `BUNDJIL_CODEX_PROOF_PROMPT` defaults to a short confirmation prompt.
- `BUNDJIL_CODEX_RESPONSES_ENDPOINT` defaults to
  `https://chatgpt.com/backend-api/codex/responses`.

The command prints only `status`, endpoint, HTTP status, content type, response
byte count, stream-line count, and whether the account header was used. It
does not print tokens, prompts, authorization codes, raw OAuth responses, or
the response body.

On 2026-07-07, the proof was run by injecting the local Codex cache access
token into `CODEX_ACCESS_TOKEN` for one process. It returned HTTP 200 from the
direct Codex Responses endpoint with sanitized body metadata. This proves the
direct backend path, not the Eve integration. Eve replacement remains gated on
the private proxy and model-provider tasks in the spec.

## Direct Provider And Private Proxy Contract

The package-level provider path is:

```text
OpenAICompatibleProxy.handleChatCompletions(input)
  -> private internal bearer-token check
  -> CodexDirectProvider.streamChatCompletion(input.completion)
  -> CodexOAuthService.getValidToken(subject)
  -> CodexRequestMapper.toCodexResponses(request)
  -> CodexHttpClient.postResponsesStream(input)
  -> CodexStreamMapper.toOpenAICompatibleStream(stream)
```

The proxy contract is private/internal only. It is not a public OpenAI
gateway. `apps/codex-proxy` owns the Vercel-compatible HTTP route, local
mock-mode smoke tests, and future hosted deployment. This package keeps owning
the reusable direct-provider contract.

Subscription mode does not read `OPENAI_API_KEY` or `CODEX_API_KEY`. BYOK or
AI Gateway fallback is future work and needs a separate spec update.

## Production And Test Call Graphs

Production target graph:

```text
OpenAICompatibleProxy.handleChatCompletions(input)
  -> internal bearer-token check
  -> CodexDirectProvider.streamChatCompletion(input.completion)
  -> CodexOAuthService.getValidToken(subject)
  -> CodexRequestMapper.toCodexResponses(request)
  -> CodexHttpClient.postResponsesStream(input)
  -> CodexStreamMapper.toOpenAICompatibleStream(stream)
```

Hosted storage target graph after encryption work:

```text
CodexOAuthService
  -> CodexProfileStore
  -> CodexProfileStoreKeyValueLive
  -> encrypted profile codec
  -> UpstashKeyValueStoreLive
  -> Vercel Marketplace Upstash Redis
```

Current tests:

```text
bun run --filter @bundjil/codex-oauth test
  -> schemas and storage-key tests
  -> KeyValueStore memory profile-store tests
  -> mocked fetch/direct provider tests
  -> mocked Upstash-like client tests
```

## Verification

Run from the repo root:

```bash
bun run --filter @bundjil/codex-oauth test
bun run --filter @bundjil/codex-oauth build
bun run --filter @bundjil/codex-oauth check-types
bun run --filter @bundjil/codex-oauth proof:codex-responses
bun run check-types
```

The direct proof command is opt-in and must report only this kind of sanitized
shape:

```text
status: ok
endpoint: https://chatgpt.com/backend-api/codex/responses
httpStatus: 200
contentType: text/event-stream or application/json
responseBytes: positive integer
streamLineCount: positive integer
usedAccountHeader: true or false
tokenLeak: false
rawPayloadLeak: false
```

Do not run the proof in CI and do not commit proof env files.
