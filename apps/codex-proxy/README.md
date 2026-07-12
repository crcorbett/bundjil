# @bundjil/codex-proxy

Private Effect HTTP proxy for Bundjil Codex subscription model access.

The app owns the HTTP routes, Vercel entrypoint, app config, mode selection,
private bearer authentication, local host, and deployment runbook. It composes
the canonical Effect Schema contracts and explicit Layers from
[`@bundjil/codex-oauth`](../../packages/codex-oauth/README.md). It does not
own a browser OAuth flow, a public gateway, or Eve model selection.

## Operating Modes

`BUNDJIL_CODEX_PROXY_MODE` selects one complete composition:

| Mode    | Purpose                               | Storage                                        | Deployment rule                                     |
| ------- | ------------------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `mock`  | Default smoke test and rollback state | None                                           | Local or personal Vercel preview; never calls Codex |
| `local` | Trusted Bun-only proof                | Encrypted filesystem `KeyValueStore`           | Vercel rejects it                                   |
| `live`  | Explicit personal Vercel preview path | Encrypted profile over Upstash `KeyValueStore` | Preview only; never silently falls back to mock     |

All modes expose `GET /health`. `POST /v1/chat/completions` is private and
requires `Authorization: Bearer ${BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN}`.

`live` reads an encrypted refresh-capable subscription profile. It returns one
atomic access-token/account-id/revision credential, refreshes inside the
configured skew under the distributed lock, and commits every rotated
generation through the Upstash fenced-CAS boundary. It never accepts an API
key fallback or returns mock output after a live failure.

Permanent credential failure returns HTTP 502 with
`codex_reauthentication_required`. Transient auth transport, timeout,
rate-limit, lock, or provider-5xx failure returns HTTP 503 with
`codex_auth_temporarily_unavailable` and does not mutate the profile. Other
upstream failures remain sanitized HTTP 502 responses. A non-constructible
live layer reports `ok: false` from `GET /health` with HTTP 503.

## Scope And State

- `mock` is the safe default and supports the ordinary local and preview
  smoke-test path.
- `local` exercises the real encrypted profile path on a trusted machine. It
  is not shared, durable hosted storage, or Vercel evidence.
- `live` is the personal Vercel preview/Upstash composition. The trusted-local
  subscription login writes the refresh-capable encrypted profile before the
  proxy can use it.
- The linked project is `bundjil-codex-proxy` under Cooper's personal Vercel
  account, not Tilt Legal.
- Bundjil configured and deployed **preview only**. It did not set a
  production Bundjil proxy mode, cipher key, profile subject, or profile, and
  it did not deploy production. A Vercel Marketplace Upstash resource may
  auto-bind provider credentials to production; that is not a production
  activation or approval.
- OAuth browser and loopback handling remains trusted-local only. Vercel
  exposes no OAuth start or callback route and never persists an ID token.
- Eve remains on AI Gateway by default. Pointing Eve at this proxy is a later
  integration slice and is out of scope for this workaround.

## Configuration

`src/env.ts` decodes app config with Effect `Config`, `Config.schema`,
`Config.redacted`, and `ConfigProvider.fromEnv()`. Keep values in ignored local
env files or encrypted Vercel environment settings; never place them in a
browser bundle, committed file, command transcript, or docs.

- `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`: required private bearer token.
- `BUNDJIL_CODEX_PROXY_MODE`: `mock`, `local`, or `live`; default `mock`.
- `BUNDJIL_CODEX_PROFILE_ID`, `BUNDJIL_CODEX_CONNECTOR_ID`,
  `BUNDJIL_CODEX_INSTALLATION_ID`, and `BUNDJIL_CODEX_SUBJECT_ID`: explicit
  non-secret profile subject fields shared by importer and proxy.
- `BUNDJIL_CODEX_ACCOUNT_ID`: optional legacy `local` provider account header;
  `live` uses the account id from its atomic stored credential.
- `BUNDJIL_CODEX_REFRESH_SKEW_MILLIS`: proactive refresh skew; default five
  minutes.
- `BUNDJIL_CODEX_REFRESH_LOCK_TTL_MILLIS`: distributed refresh lease; default
  five seconds. The profile revision fence remains authoritative after lease
  expiry.
- `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY` and
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`: required for `local` and `live`.
- `BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR`: required only for `local`; it is an
  ignored absolute directory and must never be supplied to Vercel.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, or Vercel-provided
  `KV_REST_API_URL` / `KV_REST_API_TOKEN`: required only for `live`.
- `PORT`: optional local port, default `8787`.

The shared profile, envelope, JSON codec, store, cipher, and error contracts
remain package-owned. Request bodies, SSE chunks, test payloads, and safe
diagnostics use the owning Effect Schema JSON codecs, including
`Schema.fromJsonString(...)` and `Schema.UnknownFromJsonString`; do not add
manual JSON parsing or stringification to this boundary.

## Operator Runbook

Run all commands from the repository root. Source an ignored env file that
defines the named variables above, but do not print it.

### 1. Local filesystem proof

Configure `BUNDJIL_CODEX_PROXY_MODE=local`,
`BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR`, the explicit profile fields, and the
cipher variables. On the trusted machine with an active Codex ChatGPT login:

```bash
bun run --filter @bundjil/codex-oauth import:local-profile:filesystem
BUNDJIL_CODEX_PROXY_MODE=local bun run --filter @bundjil/codex-proxy dev
```

Run the local automated self-test separately in its default `mock` composition:

```bash
bun run --filter @bundjil/codex-proxy smoke-test
```

The proof record contains sanitized fields only:

```text
status: imported
mode: chatgpt
requiresReauthentication: true
encryptedStore: stored
healthStatus: 200
healthMode: local
unauthenticatedStatus: 401
invalidTokenStatus: 401
streamStatus: 200
streamContentType: text/event-stream
streamDone: true
tokenLeak: false
rawPayloadLeak: false
```

Do not record a cache path, account identifier, credential, prompt, request
body, or model output. Delete `BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR` to revoke
the local profile.

### 2. Personal Vercel preview live mode

Link only the personal Vercel project and pull preview environment locally:

```bash
cd apps/codex-proxy
vercel link --project bundjil-codex-proxy
vercel env pull .env.preview.local --environment=preview
```

In that ignored preview env source, provide the explicit profile fields and
preview cipher/KV configuration. Complete subscription login on the trusted
local machine before a later preview deployment task selects `live` mode:

```bash
bun run --filter @bundjil/codex-oauth login:subscription
vercel env add BUNDJIL_CODEX_PROXY_MODE preview
vercel deploy
```

Set `BUNDJIL_CODEX_PROXY_MODE=live` for preview only. The login command writes
the encrypted subscription profile to Upstash and must not run inside a Vercel
function, CI, Eve, or browser runtime. This implementation task did not deploy
or run the later hosted preview proof.

For a direct preview check, set `PROXY_URL` to the preview deployment and use a
minimal request from a private shell. The server decodes it through the owning
Effect Schema boundary; record only the following
sanitized result shape:

```text
healthStatus: 200
healthMode: live
unauthenticatedStatus: 401
invalidTokenStatus: 401
streamStatus: 200
streamContentType: text/event-stream
streamDone: true
upstashValueEncrypted: true
tokenLeak: false
rawPayloadLeak: false
```

Inspect Vercel runtime logs after the probe. Logs and the Upstash readback must
not contain access, refresh, or ID token values, cache content, account
identifiers, prompts, request bodies, or model response bodies.

### 3. Reauthentication and rollback

The proxy refreshes proactively and may replay exactly once after a provider 401. On `codex_reauthentication_required`, run the trusted-local subscription
login again. On `codex_auth_temporarily_unavailable`, do not mutate credentials
or add an app retry loop; retry the original caller operation later.

To immediately stop live calls, set the preview mode back to `mock` and deploy
a new preview:

```bash
vercel env add BUNDJIL_CODEX_PROXY_MODE preview
vercel deploy
```

Delete the local filesystem directory when revoking a local proof. For preview
credential concerns, rotate the encrypted Vercel variables and Upstash
credentials through their provider controls; do not print them. Production
rollback and deployment remain out of scope because this workaround did not
deploy production.

## Verification

```bash
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
```

The app tests use explicit mock Layers and schema-owned fixtures. They cover
route authentication, mock streaming, unavailable live configuration, missing
or expired profiles, Vercel rejection of `local`, and encrypted local profile
composition. The hosted account-link OAuth flow and an Eve integration remain
separate SPEC-driven work.

## Call Graph

```text
POST /v1/chat/completions
  -> app-owned Effect HttpRouter route
  -> CodexProxyConfig.mode
  -> mock: deterministic provider Layer
  -> local: encrypted filesystem KeyValueStore
  -> live: encrypted Upstash KeyValueStore
  -> CodexOAuthService.getValidCredential(subject)
  -> optional Upstash refresh lock + OAuth refresh transport
  -> fenced profile CAS
  -> CodexDirectProvider.streamChatCompletion
  -> on first 401 only: recoverAfterUnauthorized + one replay
  -> OpenAI-compatible SSE response
```

The `local` branch remains access-import-only and never refreshes. The `live`
branch refuses legacy profiles and composes only refresh-capable credentials.
The app imports no browser, loopback, or Codex CLI cache-reading boundary.
