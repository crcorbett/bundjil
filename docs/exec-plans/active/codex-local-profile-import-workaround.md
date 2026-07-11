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

`prove-personal-preview-workaround`

The code path is accepted. The next task is external-state proof only: confirm
the personal Vercel scope and preview-only Upstash/cipher configuration, run
the local importer intentionally, deploy a preview in live mode, then record
sanitized HTTP, ciphertext, and log evidence. Production remains untouched.

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

### prove-personal-preview-workaround

Status: Pending

Parent acceptance requirements:

- confirm personal Vercel project/scope and preview-only env names without
  printing values; do not use Tilt Legal or production;
- validate an invalid import source first, then optionally run the local
  importer with an active user-approved local Codex session;
- verify ciphertext-only Upstash storage, live health/auth/profile failure
  probes, authenticated live stream, and Vercel log leak scans;
- record sanitized proof evidence or a precise external-state blocker, then
  complete the three audit passes and commit the documentation slice.
