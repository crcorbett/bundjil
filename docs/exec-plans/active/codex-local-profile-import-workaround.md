# Codex Local Profile Import Workaround Plan

Status: Active  
Spec: `docs/product-specs/codex-local-profile-import-workaround.md`  
Task ledger: `docs/product-specs/codex-local-profile-import-workaround.tasks.json`

## Execution Rule

Implement the ledger sequentially. One subagent owns exactly one task at a
time. The parent reviews the shared-worktree diff, runs focused and root
verification, completes the three required Effect TS audit passes, records the
evidence here and in the ledger, commits the accepted slice, and only then
delegates the next task.

`docs/product-specs/writing-specs.md`,
`docs/product-specs/writing-task-lists.md`, `docs/PLANS.md`,
`docs/exec-plans/implementing-specs.md`, and the two legacy architecture paths
named by repo skills do not exist in this repository. The target SPEC, ledger,
`AGENTS.md`, and current architecture guides are the active local authority.

## Current Task

`document-workaround-operations`

The personal preview workaround is accepted. The final documentation task is
accepted and ready to commit. The original hosted OAuth conclusion remains
blocked; the access-token-only preview proof does not create a hosted
account-link or durable refresh path.

## Baseline Evidence

- The original hosted OAuth task remains blocked because no supported arbitrary
  Vercel redirect grant has been established.
- The current local Codex cache was inspected only for top-level and token field
  names; it reports `auth_mode: chatgpt` and contains the expected token-key
  labels. No values were printed or persisted as evidence.
- Encrypted profile storage, the Upstash adapter, refresh lock, direct provider,
  private proxy contract, local mock proxy, and personal Vercel mock preview
  already exist. The importer must reuse them rather than recreate their
  contracts.

## Task Log

### implement-local-access-token-profile-import

Status: Accepted 2026-07-11

Parent acceptance requirements:

- package-owned config, cache source, importer service, tagged errors, fixture
  layer, sanitized command output, tests, and docs;
- no real cache read in tests and no refresh/id token persistence;
- three parent audits: ownership/call graph, Effect implementation quality, and
  verification coverage;
- task ledger/plan evidence, full verification, and a coherent commit.

Implementation and parent review:

- Added minimal `CodexCliAuthCache`, local import config/result schemas, tagged
  import error, `CodexLocalAuthCacheSource`, and
  `CodexLocalProfileImportService` in `@bundjil/codex-oauth`.
- The Bun command reads only `auth_mode`, `last_refresh`, and `access_token`
  from the local cache. It accepts only `chatgpt` mode, derives expiry from a
  configurable local TTL, constructs a profile with no `refreshToken`, and
  sets `requiresReauthentication: true` before writing through the encrypted
  store.
- The command requires explicit profile identity config and emits schema-backed
  success metadata or a generic safe failure. It does not print token values,
  token field values, cache contents, cache paths, account ids, prompts, or raw
  provider responses.
- Fixture tests cover valid import, encrypted storage without access/refresh/ID
  token leakage, missing access token, unsupported mode, malformed/expired
  timestamps, and a live invalid-file path. The bare command was also run with
  no configuration; it exited 1 with the generic safe blocked response without
  reading a cache.

Parent audit:

1. Ownership and call graph: local cache access is package-local and absent
   from apps, Eve, routes, and non-codex packages. The import graph matches the
   SPEC and reuses the existing encrypted store; no hosted OAuth or refresh
   behavior was introduced.
2. Implementation quality: reviewed flat named `Effect.gen` programs,
   `Config`/`ConfigProvider.fromEnv`, canonical schema-derived contracts,
   Context services, memory/live layers, tagged failures, and Schema JSON
   codecs. No `process.env`, manual JSON parser/stringifier, unsafe cast, DTO
   mirror, or trivial wrapper was introduced in the runtime path.
3. Verification coverage: package typecheck, 44 tests, build, invalid-path
   source test, safe no-config command output, `git diff --check`, Ultracite,
   Knip, workspace typechecks, workspace tests, and `bun run verification`
   passed. The final tests prove fixture refresh/ID tokens are not present in
   ciphertext or result output.

Verification:

- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth test`: passed, 44 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run --filter @bundjil/codex-oauth import:local-profile`: exits 1 with a
  sanitized no-config response; no cache/token/account marker appeared.
- `bun run verification`: passed.

Commit: pending parent commit.

### compose-access-only-live-proxy-mode

Status: Accepted 2026-07-11

Parent acceptance requirements:

- explicit live layer composition for encrypted Upstash profile storage and
  direct provider requests; mock mode must remain default;
- profile-missing, expired-profile, unavailable-live-config, authorization,
  and upstream failures must map to safe responses;
- no refresh of imported profiles and no API-key fallback;
- three parent audits, package/app checks, smoke test, full verification, and a
  coherent commit.

Implementation and parent review:

- Added `apps/codex-proxy/src/live.layer.ts`, which composes the existing
  encrypted profile store, cipher config/cipher, Upstash KeyValueStore, Upstash
  refresh lock, unsupported OAuth client, OAuth service, Responses fetch/HTTP
  client, direct provider, and OpenAI-compatible proxy.
- `makeCodexProxyAppLayer` now selects a complete mock or live proxy layer only
  after `CodexProxyConfig` is decoded. Mock remains the default; it has no
  Upstash/config dependency.
- Live setup failures use an unavailable proxy service rather than falling back
  to mock. Missing/expired/storage/OAuth-unavailable profile failures map to a
  generic 502 that tells the operator to re-import; the direct provider calls
  only `getValidToken` and imported profiles have no refresh token.
- Expanded handler tests cover unavailable live configuration, an imported
  access-only live profile streaming through a mocked Responses fetch, expired
  live profile failure, and response leak checks. The app README now separates
  code/test proof from the still-pending hosted preview proof.

Parent audit:

1. Ownership and call graph: app-owned configuration selects app-owned layers;
   `@bundjil/codex-oauth` remains the owner of profile/cipher/storage/provider
   contracts. Eve, browser code, OAuth start/callback, and local cache access
   are unchanged. The implemented graph matches the workaround SPEC.
2. Implementation quality: reviewed complete layer composition, flat route
   `Effect.gen`, typed `catchTags`, canonical schemas, and safe unavailable
   service. No token refresh call, API-key fallback, direct environment read,
   manual JSON parser/stringifier, unsafe cast, DTO mirror, or helper sprawl is
   present in the new app code.
3. Verification coverage: app typecheck, 8 handler tests, app build, smoke
   test, fallback scans, `git diff --check`, Ultracite, Knip, workspace
   typechecks/tests, and `bun run verification` passed. Tests prove the
   imported profile route uses mocked fetch, preserves the live mode header,
   fails closed on expiry/config absence, and does not leak internal or access
   tokens.

Verification:

- `bun run --filter @bundjil/codex-proxy check-types`: passed.
- `bun run --filter @bundjil/codex-proxy test`: passed, 8 tests.
- `bun run --filter @bundjil/codex-proxy build`: passed.
- `bun run --filter @bundjil/codex-proxy smoke-test`: passed.
- `bun run verification`: passed.

Commit: pending parent commit.

### implement-local-encrypted-filesystem-proof

Status: Accepted 2026-07-12

Parent acceptance requirements:

- explicit package-owned filesystem `KeyValueStore` layer using Effect v4
  `KeyValueStore.layerFileSystem` plus Bun platform services;
- separate filesystem importer command with the existing access-token-only
  importer contracts and AES-GCM envelope;
- app-owned `local` mode and `local.layer.ts`, with Vercel rejection,
  no Upstash composition, no refresh, and no fallback;
- fixture tests, real local proof with sanitized-only evidence, three parent
  Effect audits, focused checks, root verification, and a coherent commit.

Implementation and parent review:

- Added the opt-in
  `@bundjil/codex-oauth/filesystem-key-value-store.layer` subpath. It accepts
  a caller-supplied directory and composes Effect
  `KeyValueStore.layerFileSystem` with `@effect/platform-bun` services; it
  owns no app env names or Vercel behavior.
- Added `import:local-profile:filesystem`. It reuses the existing trusted-local
  cache source, importer service, canonical profile schemas, AES-GCM cipher,
  and encrypted profile store. It requires an explicit ignored store directory
  and does not compose Upstash. Its blocked response is Schema JSON with a
  fixed operation category only; it contains no path, account, token, cache,
  prompt, or provider response value.
- Added app-owned `local` mode and `local.layer.ts`. It composes the encrypted
  filesystem store, cipher config, memory refresh lock, unsupported OAuth
  client, OAuth service, HTTP client, direct provider, and private proxy. It
  calls `getValidToken` only. `VERCEL` is decoded through Effect Config and
  makes `local` fail closed; `live` remains Upstash-only and mock remains the
  default.
- Corrected both importer scripts to use graceful `process.exitCode` failure
  handling. `Bun.exit` is unavailable in the pinned Bun runtime and had hidden
  the intended sanitized output behind a `TypeError`.

Parent audit:

1. Ownership and call graph: the package owns the reusable filesystem adapter
   and importer script, while the proxy app owns mode selection, Vercel guard,
   and HTTP behavior. The local graph reuses canonical encrypted profile,
   cipher, token, direct-provider, and proxy contracts; it has no Upstash or
   local-cache import in app code.
2. Implementation quality: reviewed `Config`/`ConfigProvider.fromEnv`,
   `Config.redacted` cipher key material, `KeyValueStore.layerFileSystem`,
   `BunServices.layer`, Context services, explicit local/live/mock layers,
   schema-derived contracts, and typed error mapping. No `process.env`, manual
   JSON parser/stringifier, unsafe cast, DTO mirror, raw secret storage,
   automatic refresh, platform API-key fallback, or hosted OAuth route was
   introduced.
3. Verification coverage: package typecheck, 46 package tests, package build,
   proxy typecheck, 11 proxy tests, proxy build, mock smoke test, invalid
   filesystem-import command, real local proof, static leak scans, root
   verification, and diff checks were run. The real proof used ephemeral
   in-process encryption/internal-token values and a removed ignored store;
   it recorded only the sanitized outcomes below.

Sanitized local proof, 2026-07-12:

- the filesystem importer returned `status: imported` for a ChatGPT-mode cache
  with an explicit temporary profile directory;
- `GET /health` returned HTTP 200 with `mode: local`;
- unauthenticated and invalid-internal-token completion requests returned HTTP
  401;
- one authenticated short request returned HTTP 200, `text/event-stream`, two
  data lines, and the SSE completion marker;
- response and server-log scans found no access/refresh/ID token, auth-cache,
  or account-header markers; stored profile files had no access/refresh/ID
  token field markers; and the store plus captured response were deleted;
- the default one-hour import window reported the safe `validateExpiry`
  category for the existing cache. A controlled local-only retry used Effect's
  documented `"720 hours"` duration syntax; the direct provider stream was
  still the authority for the successful live request.

Verification:

- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth test`: passed, 46 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run --filter @bundjil/codex-proxy check-types`: passed.
- `bun run --filter @bundjil/codex-proxy test`: passed, 11 tests.
- `bun run --filter @bundjil/codex-proxy build`: passed.
- `bun run --filter @bundjil/codex-proxy smoke-test`: passed.
- `bun run --filter @bundjil/codex-oauth import:local-profile:filesystem`
  without configuration: exits 1 with only the Schema JSON safe blocked output.
- `bun run verification`: passed after formatting and documentation checks.

Commit: pending parent commit.

### prove-personal-preview-workaround

Status: Accepted 2026-07-12

Parent acceptance requirements:

- confirm personal Vercel project/scope and preview-only env names without
  printing values; do not use Tilt Legal or production;
- validate an invalid import source first, then optionally run the local
  importer with an active user-approved local Codex session;
- verify ciphertext-only Upstash storage, live health/auth/profile failure
  probes, authenticated live stream, and Vercel log leak scans;
- record sanitized proof evidence or a precise external-state blocker, then
  complete the three audit passes and commit the documentation slice.

Historical pre-provisioning evidence:

- Executor Personal Vercel API confirms project `bundjil-codex-proxy` belongs
  to the personal team `team_1LX7ZujbijowTv8J9k0aU7nD`, has root directory
  `apps/codex-proxy`, Node `24.x`, and preview-ready deployments. No Tilt Legal
  project or resource was selected.
- Its preview environment currently contains only
  `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN` and `BUNDJIL_CODEX_PROXY_MODE`, both
  marked sensitive. It does not contain a cipher key/id or any
  `UPSTASH_REDIS_REST_*` / `KV_REST_API_*` variable.
- The local Vercel CLI is not installed and no `apps/codex-proxy/.vercel`
  project link exists. The Executor Personal Vercel API was used instead; no
  environment value was requested or displayed.
- Without an explicitly personal Upstash resource and preview-only cipher
  configuration, an importer run cannot store an encrypted profile and a live
  proxy deployment must remain unavailable. The task is therefore blocked on
  provider configuration, not on code, tests, or an OAuth redirect grant.

Follow-up evidence, 2026-07-12:

- With the user's approval, preview-only
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY` and
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID` were created as sensitive personal
  Vercel environment variables. Values were not committed or included in this
  plan.
- The first current-code preview returned `FUNCTION_INVOCATION_FAILED` because
  Vercel built `apps/codex-proxy` without its workspace runtime dependency.
  Commit `91a4e84` fixes `vercel.json` to build `@bundjil/codex-oauth` before
  the proxy. Focused package/app checks and `bun run verification` passed.
- Preview deployment `dpl_2gnQwmyeFJXmXMyNgVYCYqWyv1kC` for commit `91a4e84`
  is `READY`. Direct probes recorded `GET /health` as HTTP 200 with `mode:
mock` and an unauthenticated completion request as HTTP 401. No credential
  value was requested or displayed.
- The Executor Personal Vercel API cannot create a Marketplace Upstash resource.
  The Vercel Marketplace Upstash page is reachable, but the available browser
  session is unauthenticated and the install flow requires an interactive
  personal Vercel sign-in. No `UPSTASH_REDIS_REST_*` or `KV_REST_API_*`
  preview variables exist yet.

Accepted preview evidence, 2026-07-12:

- Personal Vercel project `bundjil-codex-proxy` is linked to team
  `team_1LX7ZujbijowTv8J9k0aU7nD` with root directory `apps/codex-proxy` and
  Node `24.x`; no Tilt Legal resource was selected. Preview-only sensitive
  cipher, internal-token, live-mode, and Marketplace Upstash bindings were
  configured without displaying, committing, or recording any values.
- The trusted-local importer completed against the preview storage with only
  sanitized confirmation metadata. It imports an access token only and requires
  reauthentication; it does not import a refresh or ID token.
- Upstash readback returned HTTP 200. Its record was structurally an encrypted
  profile envelope with `version`, `algorithm`, `keyId`, `nonce`, `ciphertext`,
  `subjectHash`, and timestamps. Marker scans found no access, refresh, ID,
  cache, or account fields.
- A fresh personal `live` preview returned health HTTP 200, unauthenticated and
  invalid-internal-token HTTP 401, and authenticated SSE HTTP 200 with
  `text/event-stream`, nine `data:` lines, and `[DONE]`. Captured responses had
  no temporary internal-token or token/cache-field marker.
- Vercel logs show the expected health 200, authorization 401, and completion
  200 requests. Error/fatal log queries returned no entries. Prompts, provider
  responses, credentials, and raw storage values were not retained as evidence.
- Only preview deployments were created. Bundjil did not set a production mode,
  cipher key, profile, or deployment. Marketplace provider credentials may be
  auto-bound to production, but that is not a Bundjil production activation.

Parent audit:

1. Ownership and call graph: the proof uses the app-owned `live` composition
   and the existing package-owned encrypted-profile, Upstash, `KeyValueStore`,
   OAuth, direct-provider, and private-proxy contracts. It did not select local
   filesystem mode, Eve, a browser OAuth callback, Tilt Legal, or production.
2. Effect implementation quality: the deployed path exercises the accepted
   explicit Config/Layer composition. Its access-token-only profile is an
   Effect Schema-derived AES-GCM envelope and live requests use `getValidToken`
   only. No refresh, API-key fallback, raw credential store, direct env read,
   manual JSON boundary, DTO, or helper was added.
3. Verification coverage: personal scope, preview-only configuration names,
   encrypted Upstash shape, health/auth/live-SSE probes, response leak scans,
   and Vercel error-log scans were independently checked. The accepted code
   commit and the final documentation task both passed full repository
   verification.

### document-workaround-operations

Status: Accepted 2026-07-12

Implementation and parent review:

- Updated the root and docs indexes, `@bundjil/codex-oauth` package README,
  proxy README, and relevant Effect/Eve/repository/testing architecture guides.
  They now distinguish `mock`, trusted-local filesystem `local`, and
  personal-Vercel/Upstash preview `live` modes; provide local/preview import,
  sanitized self-test, expiry/re-import, and mock rollback steps; and keep
  hosted account-link OAuth plus Eve integration out of scope.
- Documentation examples name environment variables and expected status shapes
  only. They do not contain credentials, identifiers, cache paths, request
  content, model output, or raw storage values. They also state that Bundjil did
  not set a production mode/key/profile or deploy production, notwithstanding
  possible Marketplace credential auto-binding.

Parent audit:

1. Ownership and call graph: docs retain package ownership for trusted-local
   import, encryption, storage, and provider contracts; app ownership for mode
   selection, private routes, and Vercel; and agent ownership for future model
   selection. Hosted OAuth and Eve integration remain distinct boundaries.
2. Documentation quality: reviewed the runbook, README map, Effect pattern
   guidance, repository ownership, and testing guidance. They consistently
   describe Effect Schema JSON boundaries, access-token-only expiry/re-import,
   no refresh, and preview-only rollback without claiming production support.
3. Verification coverage: stale-claim scans and `git diff --check` passed.
   Parent corrected two inaccurate Schema wording phrases and one importer
   result-field label, then ran full `bun run verification`: formatting, Knip,
   workspace typechecks, and all workspace tests passed.

Commit: pending parent commit.
