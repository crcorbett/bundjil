# Codex Local Profile Import Workaround

Status: Draft  
Owner: Bundjil  
Created: 2026-07-11  
Supersedes: the hosted-live proof path only while
`codex-hosted-live-oauth-storage.md` remains blocked

## Purpose

Provide a narrow, operator-controlled route to test the private Bundjil Codex
proxy without pretending that the Codex CLI's localhost login is a supported
hosted OAuth grant.

The operator runs a local command on the same trusted machine that holds an
active Codex ChatGPT login. The command reads the local Codex cache in memory,
validates only its required fields with Effect Schema, writes an **access-token
only** `CodexOAuthProfile` through the existing encrypted profile store, and
emits sanitized confirmation metadata. The deployed proxy reads that encrypted
profile and calls the already-proven Codex Responses endpoint until the access
token expires. It then fails closed and requires another local import.

This is a temporary operational workaround, not a replacement OAuth design.

## Decision And Boundaries

- The original hosted account-link flow remains blocked. Bundjil must not
  register, emulate, or reuse the Codex CLI public client, redirect URI, PKCE
  exchange, refresh exchange, browser session, or `auth.json` format as a
  hosted OAuth protocol.
- The importer runs only as an explicit local operator command. It is never
  part of the Vercel function, proxy HTTP routes, Eve runtime, CI, or a
  browser-delivered bundle.
- The importer imports `access_token` and `account_id` only. It deliberately
  does not persist `refresh_token` or `id_token`, and sets
  `requiresReauthentication: true`.
- The local cache is an untrusted boundary: unknown versions, missing fields,
  non-ChatGPT auth modes, malformed expiry data, and expired tokens produce
  safe tagged errors. Diagnostics may name fields and schema boundaries but
  never values, raw cache JSON, token lengths, prompts, request bodies, or
  account identifiers.
- The hosted profile is encrypted by the completed AES-GCM envelope before it
  reaches Upstash through Effect `KeyValueStore`. Only redacted values cross
  the package service contracts.
- `apps/codex-proxy` stays private and internal-token protected. It is not a
  public OpenAI-compatible service. The Eve app remains on AI Gateway; a later
  Eve model-provider integration requires its own SPEC.
- The proxy does not refresh imported access tokens. `CodexOAuthService` may
  retain its generic refresh operation for future supported OAuth work, but
  this profile kind has no refresh token and the live route must never invoke
  refresh as a fallback.

## Existing Evidence

- The shell-selected Codex CLI has a working ChatGPT login. Its local cache
  exposes the field names `auth_mode`, `tokens.access_token`,
  `tokens.account_id`, `tokens.id_token`, and `tokens.refresh_token`; no value
  was printed or recorded.
- The direct `https://chatgpt.com/backend-api/codex/responses` proof already
  returned a sanitized HTTP 200 from a local, opt-in process. That proves a
  short-lived direct provider path, not an arbitrary hosted OAuth grant.
- `@bundjil/codex-oauth` already owns Effect Schema profile contracts,
  `CodexProfileStoreEncryptedKeyValueLive`, AES-GCM cipher layers, the Upstash
  `KeyValueStore` adapter, refresh locks, the direct provider, and private
  OpenAI-compatible proxy contract.
- The original blocked work is recorded in
  `docs/product-specs/codex-hosted-live-oauth-storage.md`. This workaround does
  not change its conclusion.

## Call Graphs

### Local operator import

```text
bun run --filter @bundjil/codex-oauth import:local-profile
  -> packages/codex-oauth/scripts/import-local-profile.ts
  -> CodexLocalProfileImportService.importProfile(config)
  -> CodexLocalAuthCacheSource.readProfile(sourcePath)
  -> Schema.decodeUnknownEffect(CodexCliAuthCache)
  -> CodexProfileStore.putProfile(access-token-only profile)
  -> CodexProfileStoreEncryptedKeyValueLive
  -> CodexOAuthProfileCipherLive + KeyValueStore.toSchemaStore
  -> UpstashKeyValueStoreLive
  -> personal Vercel-linked Upstash Redis
```

### Hosted proxy live mode

```text
POST /v1/chat/completions
  -> apps/codex-proxy HttpRouter route
  -> OpenAICompatibleProxy.handleChatCompletions
  -> CodexDirectProvider.streamChatCompletion
  -> CodexOAuthService.getValidToken(subject)
  -> CodexProfileStoreEncryptedKeyValueLive
  -> UpstashKeyValueStoreLive
  -> CodexHttpClient.postResponsesStream
  -> chatgpt.com/backend-api/codex/responses
```

### Expired or unavailable profile

```text
POST /v1/chat/completions
  -> CodexOAuthService.getValidToken(subject)
  -> CodexOAuthTokenExpired | OAuthProfileNotFound
  -> apps/codex-proxy safe error mapping
  -> non-streaming 502 with a generic re-import instruction
```

### Test paths

```text
@bundjil/codex-oauth tests
  -> fixture-only cache source
  -> CodexLocalProfileImportService
  -> CodexProfileStoreMemory or encrypted KeyValueStore test layer

@bundjil/codex-proxy tests
  -> Request -> HttpRouter.toWebHandler
  -> live composition with mock Codex HTTP fetch
  -> encrypted profile layer / profile expiry cases
```

## Implementation Requirements

### Package contracts

`@bundjil/codex-oauth` owns the importer because it already owns canonical
profile schemas, error taxonomy, persistence, encryption, and direct-provider
services. Add a real boundary, not a script-local parser:

- `CodexCliAuthCache` is an internal Effect Schema decoder for only the cache
  data necessary to construct an access-token-only profile. It must reject
  unknown auth modes and avoid deriving identity from opaque JWTs.
- `CodexLocalAuthCacheSource` is a Context service for the local file read. Its
  live layer reads an explicit config path; its fixture/memory layer powers
  deterministic tests. It must be unavailable from the hosted proxy layer.
- `CodexLocalProfileImportService` owns validation, expiry calculation, profile
  construction, and `CodexProfileStore.putProfile`. The primary operation is a
  flat, named `Effect.gen`, with tagged errors handled in its `.pipe(...)`.
- Import subject fields are explicit Effect Config values. Do not infer the
  profile subject from token claims or account ids. `accountId` may be
  configured separately for the provider request header and must not appear in
  logs or storage keys.
- The command returns a schema-backed, sanitized result: profile id, mode,
  re-import-required state, expiry status/category, and encrypted-store
  confirmation. It never returns credential material.

### Configuration

The package-owned importer config must use `Config` plus
`ConfigProvider.fromEnv()` and `Config.redacted` for secrets. Required shape:

- `BUNDJIL_CODEX_LOCAL_AUTH_FILE`: local cache path, defaulting to
  `~/.codex/auth.json` only in the local command.
- `BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID`,
  `BUNDJIL_CODEX_PROFILE_CONNECTOR_ID`,
  `BUNDJIL_CODEX_PROFILE_INSTALLATION_ID`, and
  `BUNDJIL_CODEX_PROFILE_ID`: explicit profile subject values.
- `BUNDJIL_CODEX_ACCOUNT_ID`: optional provider account header. It must not be
  read from the cache by default.
- Existing encryption and Upstash config. The local command must fail before
  reading the cache if they are absent.

The Vercel app config owns `BUNDJIL_CODEX_PROXY_MODE=live`, its internal token,
subject, optional account id, and its hosted Upstash/encryption config. It
must retain `mock` as the default.

### Proxy composition

Add an explicit live composition layer in `apps/codex-proxy`; do not select
layers through import-time `process.env` reads. It must compose app-owned
`CodexProxyConfig`, the package-owned encrypted profile/cipher/Upstash/lock,
the existing unsupported OAuth client, OAuth service, direct-provider chain,
and the existing raw `HttpRouter` routes.

`CodexProxyConfig.mode` selects a complete mock or live layer after config is
decoded. Missing live-only configuration must produce a safe unavailable error
at handler construction or request handling, never silently fall back to mock
and never consult platform API keys.

## Operational Flow

1. Keep the deployed proxy in `mock` mode until local importer and live-layer
   tests pass.
2. Configure a personal Vercel-linked Upstash database and preview-only
   encryption/internal-token settings. Do not use Tilt Legal scope or storage.
3. Pull preview environment into an ignored local file, add explicit local
   subject configuration, and run the importer locally. It writes only the
   encrypted access-token profile to the shared preview store.
4. Deploy a preview in `live` mode and run generic unauthenticated,
   invalid-internal-token, missing-profile, expired-profile, and authenticated
   short-prompt probes. Record only status, mode, content type, stream marker
   count, and leak booleans.
5. When the provider reports expiry or upstream authorization failure, switch
   the preview back to mock or re-run the trusted-local importer after renewing
   the local Codex login. Do not build automatic token refresh around this
   workaround.

## Verification And Security Gates

- Fixture tests cover a valid ChatGPT cache shape, missing token, wrong auth
  mode, malformed cache, expired import, and proof that refresh/id tokens are
  neither stored nor returned.
- Profile tests decrypt ciphertext only inside the test layer and prove it
  contains no refresh token or id token. Tests must not use the real cache.
- Proxy tests cover mock preservation, valid imported profile streaming through
  mocked fetch, missing profile, expiry, missing live config, no API-key
  fallback, and safe errors.
- The local command must be checked with a deliberately invalid fixture/path
  before any opt-in real import. Its real import output must be captured only
  as sanitized metadata.
- Preview proof checks personal Vercel scope, Upstash ciphertext-only readback,
  route authentication, live stream behavior, and Vercel logs free of access
  token, refresh token, id token, auth cache path/content, prompts, and raw
  response bodies.
- Run `bun run verification` before each accepted implementation task. Run
  `git diff --check`, JSON/Markdown checks, and package build/smoke gates as
  applicable.

## Mandatory 3-Pass Effect TS Audit

Each implementation task must record three parent passes before acceptance:

1. **Ownership and call graph:** confirm local cache access stays package-local,
   profile identity stays explicit, hosted code cannot read the cache, and the
   production/test graphs above match the implementation.
2. **Implementation quality:** inspect the diff for flat `Effect.gen` primary
   programs, `.pipe(...)` tagged error handling, canonical Effect Schema
   contracts, `Config`/`Config.redacted`, explicit live/mock layers, no unsafe
   casts, local DTO mirrors, manual JSON/object readers, or trivial helpers.
3. **Verification coverage:** record focused tests, build/typecheck, full
   verification, invalid-fixture proof, sanitized live proof when opted in,
   leak scans, docs, and any intentionally deferred hosted evidence.

Run another audit pass whenever one finds a defect. Three passes are the
minimum, not a substitute for resolving a finding.

## Non-Goals

- Hosted browser OAuth routes, arbitrary Vercel redirect URIs, device-code
  flows, or reuse of Codex CLI client credentials.
- Importing or storing refresh/id tokens, or refresh logic for imported profiles.
- General public proxy access, user login, Better Auth, WorkOS, Sendblue,
  Cloudflare Email, Vercel Connect, or Notion integration.
- Changing Eve away from its current Vercel AI Gateway configuration.
- Production deployment. Preview proof may proceed only with personal Vercel
  resources; production requires a subsequent explicit approval.

## Documentation Deliverables

Update the root README, `docs/README.md`, `packages/codex-oauth/README.md`,
`apps/codex-proxy/README.md`, and applicable architecture guides so they
clearly distinguish the supported mock mode, this access-token-only workaround,
the blocked hosted OAuth flow, safe self-testing, expiry/re-import operations,
and rollback. Documentation must never imply hosted OAuth or durable refresh
support exists.
