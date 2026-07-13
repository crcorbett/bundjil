# Hosted Codex Live OAuth Storage Implementation Plan

Status: Active
Spec: `docs/product-specs/codex-hosted-live-oauth-storage.md`
Task ledger: `docs/product-specs/codex-hosted-live-oauth-storage.tasks.json`

## Execution Rule

Implement the task ledger sequentially. One subagent implements exactly one
task at a time. The parent reviews the diff, runs verification, performs the
required three-pass Effect TS audit, records evidence here and in the task
ledger, accepts and commits the slice, and only then delegates the next task.

The `prd-implementer` references `docs/exec-plans/implementing-specs.md` and
`docs/PLANS.md`, but neither file exists in this repository. This plan and the
repo architecture guides are the active local execution authority.

## Current Task

`run-hosted-refresh-preview-proof` is the next task. The real owner login,
encrypted V2 subscription-profile readback, and refresh-capable proxy
implementation are accepted as preceding gates. This task may create personal
preview-only proof evidence; Vercel still exposes no OAuth browser route, and
production remains inactive.

Parent preflight evidence, 2026-07-11:

- `which -a codex` found `~/.local/bin/codex`, `~/Library/pnpm/codex`, and
  the ChatGPT-app bundled binary;
- the shell-selected CLI reports `codex-cli 0.136.0`;
- the local auth cache exists, but only its top-level field names were
  inspected; no token values were read or recorded;
- the official Codex-manual helper failed because the response omitted the
  required `x-content-sha256` integrity header, so task research must use the
  narrow official-doc fallback and local CLI/source inspection.

Revision evidence, 2026-07-12:

- OpenAI's current authentication documentation states that Sign in with
  ChatGPT provides subscription access and returns browser credentials to a
  local Codex client.
- Executor Personal DeepWiki research checked against local `openai/codex`
  snapshot `9e552e9d15ba52bed7077d5357f3e18e330f8f38` confirms
  authorization-code PKCE S256, a loopback callback, current authorization and
  token endpoints, public client category, official scope set, ID/access/refresh
  token response, access-token expiry derivation, account metadata, and rotating
  refresh persistence. The direct source check resolved a DeepWiki expiry
  conflict in favor of access-token JWT `exp`.
- Local reference
  `.local/references/opencode-openai-codex-auth` is pinned at
  `bec2ad69b252ef4ad7dd33b9532ff8b4fdb6d016`. It demonstrates personal external
  client interoperability, but its manual JSON, unsafe casts, response-body
  logging, `expires_in` assumption, and weak manual fallback are explicitly
  rejected.
- The revised architecture has no Vercel OAuth start/callback routes and no
  hosted PKCE state store. A scoped local Effect command owns browser/loopback
  interaction and writes only a minimum encrypted refresh-capable profile to
  personal Upstash.
- The completed encrypted profile, KeyValueStore persistence, Upstash adapter,
  distributed refresh lock, direct provider, and private preview proxy remain
  accepted foundations. The access-token-only workaround remains the active
  operational fallback until refresh-capable proof passes.
- Spec review pass 1 corrected the auth boundary. Independent review pass 2
  removed the `expires_in` assumption, required access-JWT expiry decoding,
  distinguished official/community scope sets, and separated permanent
  reauthentication failures from transient failures that must not mutate the
  stored profile.
- Independent review pass 3 found that the existing short lease plus
  unconditional profile write could still allow stale overwrite. The revised
  SPEC now requires legacy/subscription profile variants, an opaque credential
  revision, fenced compare-and-set mutation for every login/refresh/failure
  write, revision-aware one-time 401 recovery, exact first-party transports and
  loopback ports, concrete Effect service/layer call graphs, safe refresh
  observation, progressive `dependsOn` gates, and explicit route/readiness
  errors.

## Task Log

### revalidate-codex-oauth-surface-and-cli-login

Status: Accepted 2026-07-11
Assigned subagent: tracer bullet completed 2026-07-11

Required acceptance evidence:

- sanitized current CLI paths and versions;
- current issuer/client category/scopes/PKCE/redirect/token-shape findings, or
  a clear implementation block;
- explicit hosted redirect decision;
- three parent audit passes: ownership and call graph, implementation quality,
  and verification coverage;
- task-ledger update, focused verification, `bun run verification`, and a
  coherent commit.

Subagent evidence, 2026-07-11:

- `~/.local/bin/codex` is the shell-selected standalone binary, reports
  `codex-cli 0.136.0`, and has an active ChatGPT login. The pnpm shim and
  ChatGPT-app binary report newer versions, so this task records the selected
  binary explicitly rather than assuming the binaries are equivalent.
- The cache was inspected only for top-level field names; no credentials or
  payload values were read. The earlier localhost callback problem is bypassed
  for local CLI status, not treated as proof that Vercel can receive a
  callback.
- Executor Personal DeepWiki source research on `openai/codex` confirms a
  fixed public CLI client, `auth.openai.com` issuer category, documented scope
  names, S256 PKCE, and a localhost account-login callback. It also separates
  `mcp_oauth_callback_url` as remote-MCP OAuth configuration only.
- Hosted account OAuth is explicitly blocked/deferred: no supported arbitrary
  Vercel redirect is established for the CLI's ChatGPT account flow. The next
  encryption/schema/storage/lock tasks remain independently valid; do not
  delegate live OAuth client/routes or hosted proof until a supported hosted
  grant or account-link mechanism is added to the SPEC.

This 2026-07-11 hosted-route conclusion is historical and superseded by the
2026-07-12 local-loopback design. It remains useful only as evidence for why
Vercel must not expose OAuth start/callback routes.

Parent audit:

1. Ownership and call graph: confirmed this is documentation-only. The
   existing `@bundjil/codex-oauth` unsupported live client remains the only
   package-level OAuth-exchange surface, and `apps/codex-proxy` is unchanged.
   The conclusion does not fabricate a hosted account-login path or alter the
   Gateway-default Eve call graph.
2. Implementation quality: confirmed the evidence refuses to reuse the public
   CLI client, localhost callback, or account tokens. No Effect program,
   service, schema, layer, DTO, helper, cast, raw token, or storage behavior
   changed. The existing requirements for flat `Effect.gen`, typed error
   handling, canonical schemas, and no helper/DTO sprawl remain explicit for
   later tasks.
3. Verification coverage: parent independently confirmed the selected CLI
   login-status command succeeds without emitting account output, rechecked all
   three local CLI versions, and passed `jq empty`, `git diff --check`,
   `bun run check`, and `bun run verification`.

Verification:

- `codex login status` exit status: `0`, with output suppressed.
- `jq empty docs/product-specs/codex-hosted-live-oauth-storage.tasks.json`:
  passed.
- `git diff --check`: passed.
- `bun run check`: passed.
- `bun run verification`: passed.

Commit: pending parent commit of the accepted tracer-bullet documentation
slice.

### define-encrypted-profile-contract

Status: Accepted 2026-07-11

Scope:

- add versioned encrypted-profile schemas, safe tagged cipher errors, and
  package-owned cipher service/live-test layers in `@bundjil/codex-oauth`;
- use Effect Config and a WebCrypto-compatible AES-GCM boundary;
- add focused tests and package documentation;
- do not add hosted OAuth start/callback routes, real token exchange, Upstash
  persistence composition, refresh locking, or proxy live mode.

Implementation and parent review:

- The assigned subagent produced a partial shared-worktree implementation but
  did not report completion after repeated waits and was closed. The parent
  reviewed and completed only the remaining Task 2 integration and verification
  work; no separate task was delegated.
- Added `EncryptedCodexOAuthProfileV1`, `CodexOAuthProfileCipher` with
  AES-GCM WebCrypto encryption/decryption, a redacted config service, tagged
  safe cipher errors, explicit live/test layers, root exports, and focused
  tests. All profile and envelope JSON boundaries use Effect Schema codecs.
- Package documentation now distinguishes the completed cipher contract from
  the still-pending encrypted `CodexProfileStore` composition.

Parent audit:

1. Ownership and call graph: the package owns encryption contracts and service
   layers. `CodexProfileStore`, proxy routes, app config, Vercel deployment,
   OAuth exchange, and Eve selection were not changed.
2. Implementation quality: reviewed Context.Service tags, explicit layers,
   `Config.redacted`, named `Effect.fn` generator operations, tagged errors,
   and schema-owned codec boundaries. `Redacted.value` appears only at key
   import. Targeted scans found no JSON.stringify, process.env, unsafe casts,
   DTO mirrors, stringly switches, or helper sprawl.
3. Verification coverage: tests cover round trip, leak checks, wrong key,
   wrong key id, malformed ciphertext, unsupported version, missing config,
   and live Config/WebCrypto composition. Package check-types, 33 package
   tests, package build, jq/diff checks, and full verification passed.

Verification:

- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth test`: passed, 33 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `jq empty docs/product-specs/codex-hosted-live-oauth-storage.tasks.json`:
  passed.
- `git diff --check`: passed.
- `bun run verification`: passed.

Commit: pending parent commit of the accepted encrypted-profile contract slice.

### implement-encrypted-profile-store-and-refresh-lock

Status: Accepted 2026-07-11

Scope:

- compose `CodexProfileStore` over the completed encrypted profile envelope
  and Effect `KeyValueStore`;
- add a package-owned refresh-lock service with explicit live/test layers;
- keep atomic Upstash commands behind the package boundary;
- add race, expiry, owner-release, adapter, and leak tests;
- do not add OAuth start/callback routes, a live OAuth client, proxy live mode,
  deployment configuration, or app changes.

Parent audit: encrypted profile persistence uses `KeyValueStore.toSchemaStore`
with the completed cipher; lock acquisition/release is package-owned and
atomic for Upstash; `refreshAccessToken` now runs under the lock and returns a
fresh winner profile rather than rotating twice. Package check-types, 37 tests,
build, diff check, and full verification passed. Commit pending.

### define-subscription-profile-and-fenced-commit

Status: Accepted 2026-07-12

Scope and implementation:

- replaced the ambiguous profile struct with explicit
  `CodexAccessTokenImportProfile` and `CodexSubscriptionProfile` variants;
- retained encrypted V1 decode only as a legacy access-token fallback and
  added encrypted V2 subscription round trips;
- added `CodexOAuthProfileCommit` with create-only initial writes and
  expected-revision replacement, refresh, and reauthentication operations;
- added one atomic shared-state memory layer and one Upstash Lua CAS layer so
  delayed login, refresh, and failure writers cannot replace a newer winner;
- added sanitized observer events/counters without token, account, or revision
  values;
- kept the current local and hosted proxy on
  `CodexOAuthProfileCommitUnsupported`; the named Upstash commit layer is not
  composed into the live proxy until the later enablement task.

Parent audit:

1. Ownership and call graph: profile schemas, migration, cipher, commit
   service, observer, memory implementation, and Upstash implementation remain
   package-owned. App layers only preserve the current unsupported runtime
   path, and Eve remains unchanged.
2. Implementation quality: canonical Effect Schemas and tagged errors,
   Context services, explicit Layers, named flat Effects, Schema JSON codecs,
   AES-GCM, shared atomic memory state, and atomic Lua create/CAS were reviewed.
   The parent removed duplicate operation-schema ownership and one-use adapter
   helpers. Ultracite and stale-pattern scans found no raw JSON calls,
   `process.env`, unsafe casts, stringly switches, or unresolved helper sprawl.
3. Verification coverage: focused tests prove legacy-only migration, required
   subscription fields, V2 encryption, create-only writes, matching
   replacement/refresh, stale-writer rejection after a newer winner,
   concurrent login replacement, stale reauthentication rejection, observer
   redaction, and mocked Upstash CAS behavior.

Verification:

- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth test`: passed, 60 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run --filter @bundjil/codex-proxy check-types`: passed.
- `bun run --filter @bundjil/codex-proxy test`: passed, 11 tests.
- `bun run --filter @bundjil/codex-proxy build`: passed.
- `bun run --filter @bundjil/codex-proxy smoke-test`: passed with HTTP 200
  health/stream and five SSE lines.
- `bun run verification`: passed.
- `git diff --check`: passed.

Commit: pending parent commit of this accepted slice.

### implement-local-subscription-login-broker

Status: Accepted 2026-07-12

Scope and implementation:

- added exact first-party authorization protocol config, 32-byte state and
  PKCE material, canonical redacted session/callback/token contracts, and
  narrow success/error response schemas;
- added a scoped Effect Platform Bun loopback listener on `127.0.0.1` with
  approved port fallback, Deferred callback completion, strict validation,
  request-log suppression, timeout, and cleanup on every scoped exit;
- added the Platform ChildProcess browser launcher, separate form-encoded code
  exchange and Schema-encoded JSON refresh transports, JWT expiry/account
  metadata decoding, expired-token rejection, and ID-token disposal;
- added a sanitized trusted-local CLI whose TypeScript compilation is part of
  package `check-types`;
- added legacy-to-subscription replacement using an exact encrypted-profile
  Lua CAS fence, while preserving revision CAS for subscription replacement;
- kept all app, Eve, hosted callback, and CI surfaces unchanged.

Parent audit:

1. Ownership and call graph: protocol, loopback, browser command, HTTP
   transport, metadata, login, and fenced commit remain package-owned. Only the
   local CLI composes browser/loopback live layers; no app or Vercel route does.
2. Implementation quality: reviewed Effect Platform HTTP/ChildProcess,
   scoped resource ownership, Deferred completion, canonical Schema and
   Redacted boundaries, tagged sanitized errors, flat named Effects, explicit
   Layers, exact protocol fields, narrow provider response schemas, and atomic
   legacy/revision fences. Stale scans found no raw server/fetch/JSON,
   `process.env`, unsafe casts, generic Redacted contracts, or helper sprawl.
3. Verification coverage: focused tests cover protocol generation, callback
   validation and cleanup, HTTP encodings and safe provider errors, expiry and
   account metadata, ID-token disposal, and initial/subscription/legacy race
   winners. The missing-config CLI proof emitted only a sanitized blocked
   object and could not launch a browser.

Verification:

- `bun run --filter @bundjil/codex-oauth check-types`: passed, including
  `scripts/**/*.ts`.
- `bun run --filter @bundjil/codex-oauth test`: passed, 78 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run check`: passed with no warnings or errors.
- `bun run verification`: passed across all six workspaces.
- `git diff --check`: passed.
- sanitized missing-config `login:subscription`: exited blocked without a
  callback URL, code, state, verifier, token, account id, or provider payload.

Commit: pending parent commit of this accepted slice.

### revalidate-personal-preview-configuration

Status: Accepted 2026-07-12.

Remote evidence:

- Executor Personal Vercel API resolved `bundjil-codex-proxy` without a team
  override. The project remains in the personal connection, with root directory
  `apps/codex-proxy`, framework `Other` (`null` in the API), Node `24.x`, build
  command `bun run --filter @bundjil/codex-proxy build`, and output directory
  `.`. The local Vercel CLI identity is `crcorbett`; linked project identifiers
  were not read or recorded.
- Preview contains sensitive, preview-only entries for
  `BUNDJIL_CODEX_PROXY_MODE`, `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`,
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY`, and
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`. Values were not decrypted, printed,
  or persisted.
- Executor Personal Vercel API upserted exactly four non-secret preview entries:
  `BUNDJIL_CODEX_PROFILE_ID=default`,
  `BUNDJIL_CODEX_CONNECTOR_ID=bundjil-local`,
  `BUNDJIL_CODEX_INSTALLATION_ID=agent-dev`, and
  `BUNDJIL_CODEX_SUBJECT_ID=personal-owner`. These are the canonical proxy-side
  equivalents of the trusted-local login command's profile, connector,
  installation, and principal subject fields. The API acknowledged all four
  writes with no failures.
- A separate metadata-only API readback confirmed all four subject entries are
  `plain` and target preview only. None targets development or production; no
  environment value was returned by the readback.
- Marketplace-provided `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and
  `KV_REST_API_READ_ONLY_TOKEN` aliases remain integration-backed for
  development, preview, and production. No direct `UPSTASH_REDIS_REST_*` aliases
  are required because the package accepts the `KV_REST_API_*` fallback.
- A temporary preview env pull followed by the package-owned
  `UpstashKeyValueStoreLive` namespace `size` operation confirmed connectivity
  and at least one namespaced entry. The probe returned only booleans, read no
  stored value, printed no key or credential, and deleted the temporary env
  file.
- The latest preview deployment was `READY` at 2026-07-12 13:03:24 CEST and was
  created by the CLI. No deployment was created by this task. The latest
  production-target deployment in the returned history was already `ERROR` at
  2026-07-07 18:37:40 CEST.
- No `BUNDJIL_*` entry targets production. Production therefore has no Bundjil
  mode, bearer, cipher, subject, profile, or live-deployment activation. The
  Marketplace Upstash production aliases alone are not Bundjil production
  activation.

Configuration readiness:

- Preview now has matching explicit subject names for the real local login
  tracer. This task changed only the four approved non-secret preview entries;
  it altered no existing secret, started no login, created no deployment, and
  made no development or production change.

Parent audit:

1. Ownership and call graph: the personal project remains rooted at
   `apps/codex-proxy` with the expected build/runtime settings. Bundjil mode,
   bearer, cipher, and subject configuration target preview only; no production
   Bundjil activation or runtime call graph changed.
2. Implementation quality: only four approved non-secret preview subject
   entries and sanitized documentation changed. Effect Config/Schema ownership
   remains intact; no secret or stored value, code, DTO, cast, manual reader,
   helper, deployment, login, development, or production behavior changed.
3. Verification coverage: independent Executor Personal readback confirmed all
   eight Bundjil entries target preview only, zero target production, KV aliases
   are integration-backed, project settings match, and the latest preview is
   `READY`. The namespace-only Upstash probe confirmed connectivity without
   reading a key or value.

Verification:

- Executor Personal preview env metadata readback: passed without decryption.
- Upstash namespace `size` connectivity probe: passed without value access.
- `bun run check`: passed with no warnings or errors.
- `jq empty docs/product-specs/codex-hosted-live-oauth-storage.tasks.json`:
  passed.
- temporary preview credential file removal: confirmed.
- `git diff --check`: passed.

Commit: pending parent commit of this accepted configuration slice.

### run-real-local-login-tracer

Status: Accepted 2026-07-12.

Sanitized implementation evidence:

- The personal Vercel CLI identity was confirmed before any write. A fresh
  32-byte cipher key and key id were generated only inside one private shell
  program and retained in an ignored mode-`0600` temporary env file; neither
  value appeared in command arguments or output.
- The cipher key and key id were rotated as sensitive preview-only variables.
  A separate encrypted preview-only key prefix isolates the subscription
  profile from every earlier profile and revision. Metadata-only API readback
  confirmed all three entries target preview only and were not decrypted.
- The package-owned Effect `KeyValueStore.size` probe confirmed the selected
  namespace was empty before the preview prefix was written. It read no key or
  value and emitted only `namespaceEmpty`.
- Added a package-owned stored-profile proof service and CLI. It reads the raw
  envelope through Effect `KeyValueStore`, decodes the canonical encrypted
  profile Schema, decrypts only through the package profile-store/cipher
  boundary, and emits only the eight approved booleans. Focused tests include
  valid, absent, expired, and deliberately contaminated envelope cases.
- The first live callback attempt timed out without a callback and emitted only
  the sanitized blocked result. Investigation showed the authorization page
  was absent from the installed browsers.
- The macOS launcher now constructs a parameterized `osascript` command through
  Effect ChildProcess. The authorization URL is only the final argv item and is
  never interpolated into AppleScript source. A focused non-spawning test
  confirms the static macOS executable/argument shape and preserves the
  existing Windows and Linux commands.
- The corrected parameterized AppleScript retry opened an `auth.openai.com`
  tab, confirmed by host only without reading or printing its path or query.
  Owner sign-in completed through localhost and emitted only
  `stored`/`chatgpt`/`valid`/refresh-capable/encrypted-store categories.
- The trusted readback returned all eight approved booleans as true:
  `found`, `envelopeVersion2`, `ciphertextPresent`,
  `profileKindSubscription`, `refreshCapable`, `expiryValid`,
  `requiresReauthenticationFalse`, and `markerLeakFalse`. Persisted-envelope
  and emitted-output marker scans passed without printing raw data.
- All temporary env/proof files were removed after readback. No loopback,
  login, or proof process remains.

Production boundary:

- The fresh cipher and isolated key prefix remain preview-only. No deployment,
  production/development mutation, model call, or Eve wiring occurred.

Verification to date:

- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- focused subscription-login tests: passed, 17 tests.
- full OAuth package tests: passed, 83 tests across 9 files.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run verification`: passed across all six workspaces.
- `git diff --check`: passed.
- live encrypted V2 subscription readback and marker scan: passed with all
  eight approved booleans true.
- temporary runtime files, localhost listeners, and trusted proof processes:
  absent.

Parent audit:

1. Ownership and call graph: `@bundjil/codex-oauth` owns the parameterized
   browser command, loopback callback, stored-profile proof service, canonical
   result Schema, encrypted profile store, cipher, storage-key derivation, and
   Upstash `KeyValueStore` composition. Only trusted-local package scripts
   compose browser, loopback, and proof live layers; apps, Eve, Vercel routes,
   and CI import none of those local boundaries.
2. Implementation quality: reviewed the parameterized macOS `osascript`
   ChildProcess command with static AppleScript and the redacted URL only as
   final argv, unchanged Windows/Linux commands, Context services, explicit
   Layers, `ConfigProvider.fromEnv()` CLI boundaries, canonical encrypted
   envelope/profile/subject Schemas, Schema JSON codecs, Redacted credential
   comparisons confined to the trusted proof, Effect Clock and Array
   primitives, tagged storage/schema errors, and sanitized Schema outputs.
   Stale scans found no raw JSON, `process.env` package logic, raw Bun server,
   unsafe casts, DTO mirrors, switch/Object iteration, or helper sprawl.
3. Verification coverage: the real localhost login completed with sanitized
   stored/ChatGPT/valid/refresh-capable/encrypted-store output; the package
   proof returned all eight approved booleans true for the personal Upstash
   profile, its persisted-envelope and emitted-output marker scans passed, and
   temporary env/proof files plus loopback/proof processes were removed.
   Package typecheck, 83/83 tests, build, `git diff --check`, task JSON
   validation, and full six-workspace verification including 11 proxy tests
   passed; no deployment, production/development mutation, model call, or Eve
   wiring occurred.

Commit: `9b68998` (`feat: prove live codex subscription login`).

### enable-refresh-capable-live-proxy

Status: accepted; parent commit pending.

Sanitized implementation notes:

- `@bundjil/codex-oauth` now owns `CodexOAuthCredential`, refresh policy
  config, refresh-only OAuth client composition, proactive validity checks,
  distributed-lock refresh, fenced profile rotation, permanent
  reauthentication marking, and revision-aware unauthorized recovery.
- The refresh path re-reads under the lock, preserves omitted refresh/account
  fields only from the current subscription profile, validates access-token
  JWT expiry, rejects cross-account metadata, and uses the revision fence for
  every stored generation. Transient network, timeout, rate-limit, and
  provider-5xx failures leave the stored profile unchanged.
- `CodexDirectProvider` performs at most one replay after a provider 401. A
  newer credential revision wins; an unchanged rejected revision is force
  refreshed. A second 401 becomes a reauthentication requirement and unrelated
  failures are never replayed.
- `apps/codex-proxy` composes the encrypted store, Upstash profile commit,
  Upstash refresh lock, Effect Platform OAuth HTTP transport, refresh client,
  and direct provider only for `live`. `local` retains the legacy filesystem
  provider and `mock` remains the default.
- Live readiness is explicit. Unavailable live construction returns HTTP 503
  with `ok: false`; permanent credentials map to HTTP 502
  `codex_reauthentication_required`, temporary auth failures map to HTTP 503
  `codex_auth_temporarily_unavailable`, and other provider failures remain a
  sanitized HTTP 502.
- No OAuth browser route, API-key fallback, mock fallback, retry loop, Vercel
  mutation, deployment, production action, provider request, live browser,
  or Eve wiring was added or run.

Implementation verification:

- `@bundjil/codex-oauth`: typecheck and build passed; 99 tests passed across
  10 files.
- `@bundjil/codex-proxy`: typecheck and build passed; 16 tests passed; mock
  smoke test returned health 200 and stream 200.
- `bun run verification`: passed across all six workspaces, including
  Ultracite, Knip, typechecks, builds required by the task graph, and tests.
- `git diff --check`, task JSON validation, and stale/leak scans passed.

Call graph:

```text
POST /v1/chat/completions
  -> CodexProxyRoutesLive
  -> OpenAICompatibleProxy.handleChatCompletions
  -> CodexDirectProvider.streamChatCompletion
  -> CodexOAuthService.getValidCredential
  -> CodexProfileStoreEncryptedKeyValueLive
  -> optional UpstashCodexOAuthRefreshLockLive
  -> CodexOAuthRefreshClientLive
  -> CodexOAuthHttpClientLive
  -> UpstashCodexOAuthProfileCommitLive fenced CAS
  -> CodexHttpClient.postResponsesStream
  -> first 401 only: recoverAfterUnauthorized -> winner or forced refresh
  -> one replay -> stream or stable sanitized error
```

Parent audit:

1. Ownership and call graph: `@bundjil/codex-oauth` owns canonical
   credentials, refresh policy/client, encrypted profile lifecycle, lock,
   fenced-CAS commit, and bounded recovery. `apps/codex-proxy` owns app config,
   live composition, readiness, routes, and sanitized HTTP mapping. Legacy
   `local` remains separate and access-token-only; no browser OAuth boundary
   enters Vercel, Eve, routes, CI, or browser bundles.
2. Implementation quality: reviewed explicit Context services and Layers,
   Effect Config schemas, Redacted credential boundaries, canonical Schemas,
   tagged errors, named Effects, Effect Platform HTTP transport, revision-aware
   writes, and route response schemas. Targeted scans found no raw JSON,
   package `process.env`, unsafe casts, DTO mirrors, or stale live-mode claims.
   The reviewed provider protocol intentionally retains a form-encoded code
   exchange and JSON refresh request.
3. Verification coverage: parent independently ran OAuth 99/99 tests,
   typecheck, and build; proxy 16/16 tests, typecheck, build, and smoke
   (`healthStatus: 200`, `streamStatus: 200`); and `bun run verification`
   across all six workspaces. The tests cover proactive/forced refresh,
   fencing, no-mutation errors, legacy refusal, one 401 replay, readiness,
   error contracts, local/mock preservation, and leak safety. `git diff
--check` and task JSON validation passed.

Remaining gap: the later hosted preview proof task has not run. This accepted
implementation made no deployment, remote configuration change, production
action, provider request, or Eve wiring.

### run-hosted-refresh-preview-proof

Status: Accepted 2026-07-13.

Hosted preview evidence:

- A fresh isolated trusted-local ChatGPT subscription login completed and wrote
  only its own preview-prefixed Upstash profile. The sanitized stored-profile
  proof confirmed a V2 ciphertext envelope, subscription profile,
  refresh capability, valid expiry, false reauthentication marker, and no
  plaintext marker leak.
- The private preview basic probe returned live health `200`, missing/invalid
  bearer `401`, and authenticated SSE `200` with two data lines and `[DONE]`.
  Its Schema output confirmed no bearer, authorization-code, request-payload,
  or stream-payload marker leak.
- The reusable trusted-local staged-hosted proof atomically changed only the
  isolated profile to near expiry, retained the staged opaque revision in
  memory, and issued two concurrent private preview calls. It returned all
  approved booleans true: concurrent authenticated success, SSE content type,
  completed streams, staged expiry, changed final revision, valid final expiry,
  and final subscription profile.
- Initial hosted evidence exposed that a lock contender could receive `503`
  while the winner was still refreshing. `CodexOAuthService` now waits up to
  the configured refresh-lease TTL, re-reading the fenced winner every 50ms.
  A deterministic Effect test proves one refresh, one successful winner use,
  and identical winner/follower revisions. The corrected preview proof passed.
- Runtime logs for the corrected deployment contained only two
  `POST /v1/chat/completions 200` metadata lines. They contained no credential,
  callback query, revision, provider payload, prompt, request body, or model
  response body.

Isolation and production boundary:

- The proof-only cipher selector remains opt-in per deployment. Normal live
  configuration keeps the package-owned owner cipher; proof deployments use a
  separate preview-only cipher and unique Upstash key prefix.
- All browser login, near-expiry staging, and envelope inspection ran only on
  the trusted local machine. Their outputs are Schema-owned booleans/statuses.
  Temporary environment files and loopback listeners were removed after use.
- All deployments were personal Vercel previews. No production deployment,
  production Bundjil configuration, or Eve integration was created.

Parent audit:

1. Ownership and call graph: `@bundjil/codex-oauth` owns trusted-local staging,
   profile/cipher/commit operations, refresh coordination, and proof contracts;
   `apps/codex-proxy` owns private routing and the proof-only cipher selector.
   The public app contract and Eve remain unchanged.
2. Effect quality: reviewed the named recursive contender wait, bounded by the
   refresh lock TTL; canonical profile/schema decoding; explicit Config and
   Layers; `Redacted` boundaries; tagged errors; Schema JSON encoders; and
   boolean-only proof results. No raw JSON serialization, casts, DTO mirrors,
   `process.env` package logic, or secret-bearing logs were introduced.
3. Verification coverage: the deterministic contention test, full package and
   proxy suites, builds, smoke test, root verification, JSON validation,
   diff check, ciphertext proof, basic preview proof, staged hosted proof, and
   runtime-log readback passed. The hosted result proves final revision rotation
   and successful concurrent streaming without exposing the opaque revision.
