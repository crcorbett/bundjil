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

`implement-live-oauth-client-and-proxy-routes` is blocked. The accepted
revalidation evidence still does not establish a supported hosted
ChatGPT-account OAuth grant with a registered Vercel redirect URI.

Parent preflight evidence, 2026-07-11:

- `which -a codex` found `~/.local/bin/codex`, `~/Library/pnpm/codex`, and
  the ChatGPT-app bundled binary;
- the shell-selected CLI reports `codex-cli 0.136.0`;
- the local auth cache exists, but only its top-level field names were
  inspected; no token values were read or recorded;
- the official Codex-manual helper failed because the response omitted the
  required `x-content-sha256` integrity header, so task research must use the
  narrow official-doc fallback and local CLI/source inspection.

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
