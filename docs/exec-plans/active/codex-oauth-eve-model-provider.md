# Codex OAuth Eve Model Provider Implementation Plan

Status: Active  
Spec: `docs/product-specs/codex-oauth-eve-model-provider.md`  
Task ledger: `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`

## Execution Rule

Implement the task ledger sequentially. A subagent implements exactly one task
at a time. The parent agent reviews the diff, runs verification, performs the
required three-pass Effect TS audit, records evidence here and in the task
ledger, commits the accepted slice, and only then delegates the next task.

## Current Task

`prove-codex-auth-runtime-path`

## Accepted Tasks

### define-codex-oauth-package-contract

Accepted: 2026-07-07

Changed files:

- `packages/codex-oauth/**`
- `bun.lock`
- `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`
- `docs/exec-plans/active/codex-oauth-eve-model-provider.md`

Evidence:

- Added `@bundjil/codex-oauth` schemas, safe tagged errors, storage-key
  derivation, `CodexProfileStore`, `CodexOAuthService`, `CodexOAuthClient`,
  KeyValueStore-backed live layer, memory/mock layers, tests, package README,
  and workspace lockfile registration.
- Kept live/mock layers behind explicit `./live.layer` and `./mock.layer`
  exports; the root export stays contract-focused.
- Did not add live OAuth endpoint exchange, Codex Responses HTTP calls,
  `apps/agent` model changes, or `apps/codex-proxy`.

Parent audit:

1. Ownership and call graph: package owns only the reusable OAuth/profile
   contract. No app boundary or provider network path changed.
2. Effect implementation quality: service operations use named `Effect.fn` /
   flat `Effect.gen`, `Context.Service`, `Layer`, `Schema.RedactedFromValue`,
   `Schema.TaggedErrorClass`, `KeyValueStore.toSchemaStore`, and tagged
   `catchTag` / `mapError` error mapping. Parent scans found no unsafe casts,
   local DTO mirrors, object-reader helpers, `Object.values`,
   `Object.entries`, `switch`, `process.env`, or API-key fallback.
3. Verification coverage: schema codec, storage-key stability, missing profile,
   KeyValueStore round trip, memory seeding, expired token redaction, revoke,
   and storage-error mapping are covered by tests. Targeted and root gates
   passed.

Verification:

- `bun install --frozen-lockfile`: passed.
- `bun run --filter @bundjil/codex-oauth test`: passed, 8 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run check-types`: passed across 5 packages.
- `bun run verification`: passed.

## Original Task Scope

`define-codex-oauth-package-contract`

Scope:

- Add `@bundjil/codex-oauth` package contract.
- Add canonical schemas, safe tagged errors, profile-store storage keys,
  `CodexProfileStore`, `CodexOAuthService`, and `CodexOAuthClient` service
  tags.
- Add memory/live layers backed by Effect v4
  `effect/unstable/persistence/KeyValueStore`.
- Add tests for schema decode/encode, stable key derivation, missing profile,
  expired token, remove/revoke, storage error mapping, memory layer seeding,
  and token redaction.
- Add package README.

Out of scope:

- Live OAuth endpoint exchange.
- Codex Responses HTTP calls.
- Eve model replacement.
- Vercel proxy app.

## Parent Audit Log

- 2026-07-07: worker subagent was shut down after an unresponsive partial
  scaffold. Parent completed the slice locally, reran verification, and
  recorded the required three audit passes.

## Verification Log

- 2026-07-07: pre-implementation repo state was clean on `main`.
- 2026-07-07: `define-codex-oauth-package-contract` accepted after
  `bun run verification` passed.
