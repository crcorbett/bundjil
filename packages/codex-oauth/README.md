# @bundjil/codex-oauth

Effect contracts for Bundjil-owned Codex OAuth profiles and the direct Codex
Responses proof path.

This package owns reusable profile, token, and proof boundaries. It does not
perform live OAuth endpoint exchange, deploy the private proxy, or change the
Eve app model.

## Contracts

- `CodexOAuthSubject` identifies one Codex profile by provider, principal,
  connector id, installation id, and profile id.
- `CodexOAuthProfile` stores redacted access and refresh token wrappers,
  expiry timestamps, scopes, and reauthentication state.
- `CodexProfileStore` is the profile persistence service.
- `CodexOAuthService` is the token lifecycle service.
- `CodexOAuthClient` is the future provider-client boundary.
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

Token schemas use Effect `Schema.RedactedFromValue`. Decoded values print and
serialize as redacted placeholders, while the KeyValueStore JSON codec can
persist the token value inside the approved storage boundary.

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
- `CodexHttpClientMock` and `CodexDirectProviderMock`, exported from the mock
  subpath, replace provider boundaries in tests without network calls.

The root export is reserved for schemas, errors, service tags, and pure
operation helpers. Import live and mock layers from their explicit subpaths.

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
gateway, and it is not a deployed HTTP route yet. `apps/codex-proxy` will own
the Vercel HTTP route, smoke tests, and deployment in a later task.

Subscription mode does not read `OPENAI_API_KEY` or `CODEX_API_KEY`. BYOK or
AI Gateway fallback is future work and needs a separate spec update.

## Verification

Run from the repo root:

```bash
bun run --filter @bundjil/codex-oauth test
bun run --filter @bundjil/codex-oauth build
bun run --filter @bundjil/codex-oauth proof:codex-responses
bun run check-types
```
