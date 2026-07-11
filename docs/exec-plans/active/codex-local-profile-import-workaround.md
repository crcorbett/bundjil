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

`compose-access-only-live-proxy-mode`

The next slice may compose `apps/codex-proxy` live mode around the accepted
access-token-only encrypted profile. It must preserve mock mode, use
`CodexOAuthService.getValidToken` only, and fail closed for missing or expired
profiles. It must not start hosted OAuth, refresh imported profiles, or change
Eve.

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

Status: Pending

Parent acceptance requirements:

- explicit live layer composition for encrypted Upstash profile storage and
  direct provider requests; mock mode must remain default;
- profile-missing, expired-profile, unavailable-live-config, authorization,
  and upstream failures must map to safe responses;
- no refresh of imported profiles and no API-key fallback;
- three parent audits, package/app checks, smoke test, full verification, and a
  coherent commit.
