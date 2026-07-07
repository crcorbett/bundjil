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

`deploy-codex-proxy-vercel`

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

### prove-codex-auth-runtime-path

Accepted: 2026-07-07

Changed files:

- `packages/codex-oauth/src/codex-responses*.ts`
- `packages/codex-oauth/src/codex-http-client.service.ts`
- `packages/codex-oauth/src/errors/codex-http-*.ts`
- `packages/codex-oauth/src/errors/codex-responses-*.ts`
- `packages/codex-oauth/scripts/prove-codex-responses.ts`
- `packages/codex-oauth/test/codex-responses-proof.test.ts`
- `packages/codex-oauth/test/codex-oauth.test.ts`
- `packages/codex-oauth/README.md`
- repo architecture/docs/spec/task ledger updates

Evidence:

- Added `CodexResponsesFetch`, `CodexHttpClient`, and
  `CodexResponsesProof` as the package-owned direct proof path.
- Added schema-owned Codex Responses request/proof input/proof result
  contracts plus safe tagged HTTP/request/stream errors.
- Added `proof:codex-responses`, which reads `CODEX_ACCESS_TOKEN` through
  Effect Config and prints only sanitized metadata.
- Ran the live proof by injecting the local Codex auth cache access token into
  `CODEX_ACCESS_TOKEN` for one process. It returned HTTP 200 from
  `https://chatgpt.com/backend-api/codex/responses`, 5528 response bytes,
  18 stream lines, and `usedAccountHeader: true`. No token, prompt,
  authorization code, raw OAuth response, or response body was printed.
- `codex mcp login executor-personal` completed, but
  `mcp__executor_personal.skills({ name: "execute" })` still returned
  `OAuth authorization required`; parent proof used current Goose source plus
  previously recorded DeepWiki/Parallel evidence.

Parent audit:

1. Ownership and call graph: `@bundjil/codex-oauth` owns the direct proof
   boundary only. `apps/agent` and `apps/codex-proxy` were not changed; Eve
   remains on AI Gateway until later proxy/provider tasks.
2. Effect implementation quality: primary operations use flat `Effect.gen`,
   `Context.Service`, `Layer`, `Config.redacted`, `Config.schema`,
   `Schema.RedactedFromValue`, schema-derived types, and safe tagged errors.
   Mocked fetch is injected through a service boundary. No `OPENAI_API_KEY`
   fallback was added.
3. Verification coverage: tests cover token refresh, request mapping, bearer
   and `chatgpt-account-id` headers, safe status/network error mapping, stream
   body shape counting, and no API-key fallback. Live proof output was
   sanitized.

Verification:

- `bun run --filter @bundjil/codex-oauth test`: passed, 14 tests.
- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run --filter @bundjil/codex-oauth proof:codex-responses`: passed with
  one-process `CODEX_ACCESS_TOKEN` from the local Codex auth cache and
  sanitized HTTP 200 metadata.
- `bun run verification`: passed.

### define-codex-direct-provider-contract

Accepted: 2026-07-07

Changed files:

- `packages/codex-oauth/src/codex-request-mapper.ts`
- `packages/codex-oauth/src/codex-stream-mapper.ts`
- `packages/codex-oauth/src/codex-direct-provider.service.ts`
- `packages/codex-oauth/src/openai-compatible-proxy.service.ts`
- `packages/codex-oauth/src/schemas.ts`
- `packages/codex-oauth/src/errors/**`
- `packages/codex-oauth/src/live.layer.ts`
- `packages/codex-oauth/src/mock.layer.ts`
- `packages/codex-oauth/test/codex-direct-provider.test.ts`
- docs/spec/task ledger updates

Evidence:

- Added OpenAI-compatible request/chunk/stream schemas and private proxy
  internal-token schema.
- Added `CodexRequestMapper`, `CodexStreamMapper`, `CodexDirectProvider`, and
  `OpenAICompatibleProxy` service contracts.
- Added live layers and mock layers for the provider/proxy boundaries.
- Kept the task package-only: no `apps/agent` or `apps/codex-proxy` changes.

Parent audit:

1. Ownership and call graph: `@bundjil/codex-oauth` owns only the package
   contract. The target call graph is
   `OpenAICompatibleProxy -> CodexDirectProvider -> CodexOAuthService /
CodexRequestMapper / CodexHttpClient / CodexStreamMapper`.
2. Effect implementation quality: services use `Context.Service`, `Layer`,
   schema-derived types, redacted internal tokens and upstream stream bodies,
   named `Effect.fn` operations, and flat `Effect.gen` composition. No
   `OPENAI_API_KEY` or `CODEX_API_KEY` fallback was added.
3. Verification coverage: tests prove OpenAI-compatible request decode, Codex
   payload mapping, stream chunk mapping, private proxy auth failure, upstream
   HTTP status failure redaction, and no API-key fallback.

Verification:

- `bun run --filter @bundjil/codex-oauth test`: passed, 20 tests.
- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run check-types`: passed.
- `bun run verification`: passed.

### create-codex-proxy-app

Accepted: 2026-07-07

Changed files:

- `apps/codex-proxy/**`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `README.md`
- `docs/README.md`
- `docs/architecture/eve-agent.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/testing-and-quality.md`
- `docs/product-specs/codex-oauth-eve-model-provider.md`
- `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`
- `packages/codex-oauth/README.md`
- `knip.json`
- `bun.lock`

Evidence:

- Delegated worker `019f3d51-aea6-7de3-88c6-8b98eea158d6` was assigned this
  exact task, but remained running after two waits and produced no worktree
  changes. Parent closed it and implemented the slice locally.
- Added `apps/codex-proxy` with package metadata, TypeScript configs, app-local
  Vitest config, app README, Effect Config service, app-owned route/config
  schemas, one schema-backed route error, app-owned mock
  `CodexDirectProvider` layer, Effect HTTP routes, `HttpRouter.toWebHandler`
  boundary, Vercel-compatible one-argument fetch export, local Bun dev host,
  direct Request/Response tests, and an ephemeral-server smoke test.
- The app composes `@bundjil/codex-oauth` `OpenAICompatibleProxy` and
  `CodexDirectProvider` service tags. It does not duplicate Codex request
  mapping or stream mapping.
- Live mode intentionally returns HTTP 503 in this slice. No Eve model change,
  hosted deployment, or Codex network call was introduced.

Parent audit:

1. Ownership and call graph: `apps/codex-proxy` owns the deployable HTTP app
   boundary, app config, Vercel fetch export, local dev host, private route
   auth, mock streaming, smoke tests, and README. `@bundjil/codex-oauth`
   continues to own reusable schemas, service tags, request mapping, stream
   mapping, and direct provider contracts. `apps/agent` was not changed.
2. Effect implementation quality: route handlers use flat `Effect.gen`,
   `Context.Service`, `Layer`, `Config.redacted`, `Config.schema`, package
   schema-derived types, app-owned route/config schemas, `HttpRouter`, and
   typed `catchTags` mapping. The one-argument fetch wrapper prevents Bun from
   passing its server object as an Effect context. Parent scans found no
   `OPENAI_API_KEY` / `CODEX_API_KEY` fallback and no committed token values.
3. Verification coverage: direct `Request`/`Response` tests cover
   `GET /health`, unauthenticated rejection, invalid-token rejection with
   redaction, and authenticated mock SSE. The smoke test proves local health
   and mock streaming through a real Bun server without a Codex network call.

Verification:

- `bun run --filter @bundjil/codex-proxy check-types`: passed.
- `bun run --filter @bundjil/codex-proxy test`: passed, 4 tests.
- `bun run --filter @bundjil/codex-proxy build`: passed.
- `bun run --filter @bundjil/codex-proxy smoke-test`: passed with
  `{"healthStatus":200,"streamStatus":200,"streamLines":5}`.
- `bun run check`: passed.
- `bun run knip`: passed.
- `bun run check-types`: passed across 6 packages.
- `bun run verification`: passed.
- `bun install --frozen-lockfile`: passed.
- Secret-pattern scan found only documented env var names and sanitized test
  placeholders, not real token values.

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
- 2026-07-07: create-codex-proxy-app worker
  `019f3d51-aea6-7de3-88c6-8b98eea158d6` was closed after no result and no
  filesystem changes. Parent implemented and audited the app locally.

## Verification Log

- 2026-07-07: pre-implementation repo state was clean on `main`.
- 2026-07-07: `define-codex-oauth-package-contract` accepted after
  `bun run verification` passed.
- 2026-07-07: `prove-codex-auth-runtime-path` accepted after package checks,
  sanitized live proof, and `bun run verification` passed.
- 2026-07-07: `define-codex-direct-provider-contract` accepted after package
  tests/build/typecheck, root typecheck, and `bun run verification` passed.
- 2026-07-07: `create-codex-proxy-app` accepted after app
  check-types/test/build/smoke-test, root `bun run verification`, frozen
  install, and secret-pattern scan passed.
