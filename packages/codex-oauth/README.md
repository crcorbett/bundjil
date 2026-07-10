# @bundjil/codex-oauth

Effect contracts for Bundjil-owned Codex OAuth profiles and the direct Codex
Responses proof path.

This package owns reusable profile, token, and proof boundaries. It does not
perform live OAuth endpoint exchange, own Vercel deployment, or change the Eve
app model. The deployable private proxy app now lives in `apps/codex-proxy`
and composes this package's service contracts.

## Current State

Implemented:

- Effect Schema contracts for Codex subjects, profiles, token values,
  OpenAI-compatible chat-completion requests, Codex Responses requests, and
  sanitized proof results.
- `CodexProfileStore`, `CodexOAuthService`, `CodexOAuthClient`,
  `CodexResponsesFetch`, `CodexHttpClient`, `CodexResponsesProof`,
  `CodexDirectProvider`, and `OpenAICompatibleProxy` service contracts.
- Versioned `EncryptedCodexOAuthProfileV1` envelopes and a
  `CodexOAuthProfileCipher` service using authenticated AES-GCM encryption.
  The cipher has explicit live and test layers, keeps key material redacted
  until WebCrypto key import, and uses Effect Schema for profile and envelope
  JSON boundaries.
- Memory/mock layers for automated tests.
- Opt-in direct Codex Responses proof with sanitized output.
- Opt-in Vercel Marketplace Upstash Redis adapter behind Effect
  `KeyValueStore`.

Future:

- Live OAuth endpoint exchange and refresh.
- Hosted live Codex proxy mode.
- Hosted token-profile storage composed through the application-side envelope
  cipher for refresh-token payloads.

Unsupported:

- Treating Codex OAuth tokens as OpenAI Platform API keys or Vercel AI Gateway
  credentials.
- Reading `OPENAI_API_KEY` or `CODEX_API_KEY` for subscription-provider mode.
- Importing Eve, Vercel deployment code, OpenClaw code, or Goose code.
- Storing raw refresh tokens in hosted KV.

## Contracts

- `CodexOAuthSubject` identifies one Codex profile by provider, principal,
  connector id, installation id, and profile id.
- `CodexOAuthProfile` stores redacted access and refresh token wrappers,
  expiry timestamps, scopes, and reauthentication state.
- `CodexProfileStore` is the profile persistence service.
- `CodexOAuthService` is the token lifecycle service.
- `CodexOAuthClient` is the future provider-client boundary.
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
- `UpstashKeyValueStoreLive`, exported from
  `@bundjil/codex-oauth/upstash-key-value-store.layer`, provides only the
  Effect `KeyValueStore` service. It is not composed into `CodexOAuthLive` by
  default.

The root export is reserved for schemas, errors, service tags, and pure
operation helpers. Import live and mock layers from their explicit subpaths.

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

Hosted token-profile storage remains blocked until a separate task composes
this application-side cipher with `CodexProfileStore` and documents the
operator-access model. Upstash TLS and provider-managed at-rest encryption are
not enough for raw refresh tokens because Vercel / Upstash operators and
project env readers must not be able to inspect stored refresh-token values.
Until that encrypted persistence layer exists, use the Upstash adapter only as
a storage primitive or for non-token test data.

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
