# Codex OAuth Eve Model Provider Implementation Plan

Status: Complete
Spec: `docs/product-specs/codex-oauth-eve-model-provider.md`  
Task ledger: `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`

## Execution Rule

Implement the task ledger sequentially. A subagent implements exactly one task
at a time. The parent agent reviews the diff, runs verification, performs the
required three-pass Effect TS audit, records evidence here and in the task
ledger, commits the accepted slice, and only then delegates the next task.

## Current Task

`final-verification` is complete in the ledger. No task remains in the sibling
task list. Parent acceptance, commit, and push are complete through the latest
`main` push.

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

### deploy-codex-proxy-vercel

Accepted: 2026-07-07

Changed files:

- `apps/codex-proxy/api/index.ts`
- `apps/codex-proxy/src/vercel.ts`
- `apps/codex-proxy/src/index.ts`
- `apps/codex-proxy/test/proxy-handler.test.ts`
- `apps/codex-proxy/tsconfig.json`
- `apps/codex-proxy/vercel.json`
- `apps/codex-proxy/README.md`
- `docs/product-specs/codex-oauth-eve-model-provider.md`
- `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`
- `docs/exec-plans/active/codex-oauth-eve-model-provider.md`
- `knip.json`

Evidence:

- Linked `bundjil-codex-proxy` to Cooper's personal Vercel scope,
  `Cooper Corbett's projects` (`team_1LX7ZujbijowTv8J9k0aU7nD`), not Tilt
  Legal (`team_G8r6j3RIfXPtqb3j71bNQMbO`).
- Project settings are root directory `apps/codex-proxy`, framework `Other`,
  Node.js `24.x`, output directory `.`, and build command
  `bun run --filter @bundjil/codex-proxy build`.
- Added app-owned Vercel entrypoint and config:
  `api/index.ts`, `src/vercel.ts`, and `vercel.json`. Vercel rewrites route
  public paths back to the existing Effect web handler.
- Preview env vars are encrypted Vercel Preview variables:
  `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN` and
  `BUNDJIL_CODEX_PROXY_MODE=mock`. `vercel env pull --environment=preview`
  wrote only ignored env files and did not print secret values.
- Vercel SSO deployment protection was disabled on this proxy project so
  direct preview HTTP checks can reach app routes. The model route remains
  protected by the internal bearer token. This exception applies only to the
  current mock-mode preview; live Codex mode or production must re-enable
  Vercel protection or provide an equivalent private network/control boundary.
- Preview deployment `dpl_38aC4YSWLkCESQiJATs5JqHsSn4X` is READY at
  `https://bundjil-codex-proxy-llqa9rwss-cooper-corbetts-projects.vercel.app`
  with target `preview`.
- Direct preview checks returned `healthStatus: 200`, `healthMode: "mock"`,
  `unauthenticatedStatus: 401`, `invalidTokenStatus: 401`,
  `streamStatus: 200`, `streamContentType: "text/event-stream"`,
  `streamDataLines: 2`, `streamDone: true`, and all secret-leak booleans
  `false`.
- Preview logs contained 4 request lines and the sanitized pattern scan was
  clean for bearer values, OAuth/token terms, probe text, invalid-token text,
  and full mock response text. Deploy/env CLI logs were checked for the
  generated internal token value and were clean.
- Production deployment was skipped. Hosted live Codex proof remains pending
  and opt-in. `apps/agent` was not changed.

Parent audit:

1. Ownership and call graph: `apps/codex-proxy` owns Vercel project settings,
   env binding names, Vercel function entrypoint, rewrite adapter, hosted
   proof, and README evidence. `@bundjil/codex-oauth` contracts remain
   unchanged, and `apps/agent` was not touched.
2. Effect implementation quality: deployment-specific code is thin
   app-owned framework glue delegating to the existing
   `HttpRouter.toWebHandler` boundary. Existing flat `Effect.gen`
   route/config flow, schema-derived contracts, `Config.redacted`, and typed
   `catchTags` error mapping remain intact. No live Codex calls, DTO mirrors,
   unsafe casts, or API-key fallback were introduced.
3. Verification coverage: account/project metadata, encrypted preview env
   vars, local typecheck/test/build, preview deploy, direct HTTP probes,
   runtime-log scan, CLI-output token scan, docs updates, and production-skip
   state prove the deployment task.

Verification:

- `bun run --filter @bundjil/codex-proxy check-types`: passed.
- `bun run --filter @bundjil/codex-proxy test`: passed, 5 tests.
- `bun run --filter @bundjil/codex-proxy build`: passed.
- Local Vercel entrypoint probe: `GET /health` through
  `api/index.ts?path=health` returned HTTP 200 with `mode: mock`.
- `vercel env pull apps/codex-proxy/.env.preview.local --environment=preview`:
  passed; values were not printed and the file is ignored.
- `vercel inspect` confirmed preview deployment
  `dpl_38aC4YSWLkCESQiJATs5JqHsSn4X` target `preview`, status `Ready`, and
  function `api/index`.
- Direct preview HTTP probes passed with sanitized evidence:
  `{"healthStatus":200,"healthMode":"mock","unauthenticatedStatus":401,"invalidTokenStatus":401,"streamStatus":200,"streamContentType":"text/event-stream","streamDataLines":2,"streamDone":true,"healthSecretLeak":false,"invalidSecretLeak":false,"streamSecretLeak":false}`.
- `vercel logs ... --since 30m --json`: 4 request log lines, sanitized scan
  clean.
- Production deploy: skipped.

### wire-eve-model-provider

Accepted: 2026-07-07

Changed files:

- `apps/agent/agent/agent.ts`
- `apps/agent/agent/config.ts`
- `apps/agent/agent/model-provider.ts`
- `apps/agent/test/model-provider.test.ts`
- `apps/agent/README.md`
- `apps/agent/package.json`
- `packages/codex-oauth/src/schemas.ts`
- `packages/codex-oauth/src/index.ts`
- Schema JSON encoder updates across `packages/codex-oauth` and
  `apps/codex-proxy`
- root and architecture docs
- `docs/product-specs/codex-oauth-eve-model-provider.md`
- `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`
- `docs/exec-plans/active/codex-oauth-eve-model-provider.md`
- `bun.lock`

Evidence:

- Added `apps/agent/agent/model-provider.ts` with Effect Schema provider
  contracts for `gateway` and `codex-proxy`.
- Gateway mode remains the default and returns the model string
  `google/gemini-2.5-flash` unless `BUNDJIL_AGENT_MODEL` overrides it.
- Codex proxy mode creates an AI SDK OpenAI-compatible `LanguageModel` named
  `bundjil-codex-proxy` and points it at the configured private proxy `/v1`
  base URL with the internal bearer token.
- `apps/agent/agent/config.ts` loads provider mode, model id, proxy base URL,
  redacted internal token, optional proxy model id, and context-window tokens
  through Effect Config and Effect Schema.
- `apps/agent/agent/agent.ts` passes `modelContextWindowTokens` to Eve only
  when codex-proxy mode is selected.
- The Eve app still does not import Codex OAuth profile storage, token refresh,
  hosted storage, or direct Codex HTTP clients.
- Manual JSON boundary handling was replaced with Effect Schema JSON encoders
  for request bodies, SSE chunks, smoke output, proof output, and leak checks.

Runtime proof:

- Gateway mode `/eve/v1/info` reported model
  `google/gemini-2.5-flash`, Gateway endpoint connected by API key,
  `workspace_status`, and `diagnosticCount: 0`.
- Local proxy mode ran `apps/codex-proxy` in mock mode on port `8788` and Eve
  in codex-proxy mode on port `2101`.
- Proxy mode `/eve/v1/info` reported model id
  `bundjil-codex-proxy/codex-default-model`, provider
  `bundjil-codex-proxy`, and context window `123456`.
- Proxy mode session streaming emitted `session.started`, `message.appended`,
  `message.completed`, `step.completed`, `turn.completed`, and
  `session.waiting` with the mock proxy response.
- No bearer token, OAuth token, refresh token, authorization code, or raw
  upstream response body was printed in proof output.

Parent audit:

1. Ownership and call graph: `apps/agent` owns provider selection, app config,
   Eve model wiring, and app tests. `@bundjil/codex-oauth` owns reusable
   schemas and proxy contracts. `apps/codex-proxy` owns the HTTP proxy. The
   Eve app only calls the proxy through an AI SDK `LanguageModel`.
2. Effect implementation quality: config uses `Config`, `ConfigProvider`,
   `Config.redacted`, `Config.url`, Schema literals/unions, redacted token
   schemas, `Match`, `Effect.all`, flat `Effect.gen`, `Effect.fn`, spans, and
   tagged config errors. JSON boundary encoding uses Effect Schema
   `fromJsonString` and `UnknownFromJsonString`.
3. Verification coverage: targeted app/package checks passed, local Gateway
   and local Codex proxy Eve runtime proofs passed, and scans found no raw
   manual JSON boundary calls, unsafe casts, local DTO mirrors, direct package env
   reads, or API-key fallback.

Verification:

- `bun run --filter @bundjil/agent check-types`: passed.
- `bun run --filter @bundjil/agent test`: passed, 4 tests.
- `bun run --filter @bundjil/agent build`: passed.
- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth test`: passed, 20 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run --filter @bundjil/codex-proxy check-types`: passed.
- `bun run --filter @bundjil/codex-proxy test`: passed, 5 tests.
- `bun run --filter @bundjil/codex-proxy smoke-test`: passed with
  `{"healthStatus":200,"streamStatus":200,"streamLines":5}`.
- Local Gateway and local Codex proxy Eve HTTP proofs passed.
- Repo scan for manual JSON boundary calls: passed.
- `bun run verification`: passed.
- `bun run build`: passed.

### add-vercel-kv-adapter

Accepted: 2026-07-07

Changed files:

- `packages/codex-oauth/package.json`
- `packages/codex-oauth/src/upstash-key-value-store.layer.ts`
- `packages/codex-oauth/src/errors/upstash-key-value-store-config-error.ts`
- `packages/codex-oauth/src/errors.ts`
- `packages/codex-oauth/src/errors/contracts.ts`
- `packages/codex-oauth/src/index.ts`
- `packages/codex-oauth/src/schemas.ts`
- `packages/codex-oauth/test/upstash-key-value-store.test.ts`
- `packages/codex-oauth/README.md`
- `docs/product-specs/codex-oauth-eve-model-provider.md`
- `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`
- `docs/exec-plans/active/codex-oauth-eve-model-provider.md`
- `bun.lock`

Evidence:

- Delegated worker `019f3e29-854a-7a92-9ae0-e503fd287885` was assigned this
  exact task but timed out and was closed without a final response. Parent
  reviewed, refined, verified, and accepted the resulting worktree changes.
- Added `@upstash/redis` and the
  `@bundjil/codex-oauth/upstash-key-value-store.layer` subpath export.
- Added canonical Upstash Redis config schemas, a tagged config error, and
  `UpstashKeyValueStoreLive` behind Effect `KeyValueStore`.
- Config is parsed through Effect `Config` with `Config.redacted` secrets and
  supports `UPSTASH_REDIS_REST_*` plus Vercel `KV_REST_API_*` aliases.
- The live layer constructs `new Redis(...)` from decoded config rather than
  using `Redis.fromEnv()` or direct package `process.env` reads.
- `automaticDeserialization: false` keeps Effect Schema as the JSON boundary.
  No manual JSON boundary calls were introduced.
- `clear` and `size` scan only the configured Bundjil key prefix instead of
  operating on the whole Redis database.
- Hosted token-profile storage remains blocked until a future
  application-side envelope encryption task decides and implements refresh
  token encryption.

Parent audit:

1. Ownership and call graph: `@bundjil/codex-oauth` owns the reusable
   Upstash-to-KeyValueStore adapter, schemas, config error, subpath export, and
   mocked tests. `apps/agent` and `apps/codex-proxy` were not changed. The
   adapter provides only Effect `KeyValueStore`; it is not composed into
   `CodexOAuthLive` by default.
2. Effect implementation quality: adapter config uses `Config`,
   `ConfigProvider.fromEnv`, `Config.schema`, `Config.redacted`, `Schema.URL`,
   `Schema.RedactedFromValue`, branded key-prefix schemas, flat `Effect.gen`,
   named `Effect.fn`, `Layer.effect`, safe tagged config errors, and
   `KeyValueStoreError` mapping. Parent scans found no manual JSON boundary calls,
   `Redis.fromEnv`, direct package `process.env`, `@vercel/kv`, unsafe casts,
   DTO mirrors, manual object readers, `flushdb` / `dbsize`, or API-key
   fallback.
3. Verification coverage: mocked tests cover config loading, Vercel env
   aliases, missing-config tagged errors, KeyValueStore operations, prefix
   isolation, profile-store compatibility, and provider failure mapping. Live
   Upstash remains opt-in and was not required.

Verification:

- `bun install --frozen-lockfile`: passed.
- `bun run --filter @bundjil/codex-oauth test`: passed, 26 tests.
- `bun run --filter @bundjil/codex-oauth check-types`: passed.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run check`: passed.
- `bun run knip`: passed.
- `bun run check-types`: passed.
- `bun run verification`: passed.
- `bun run build`: passed.
- Schema JSON / unsafe-boundary scan: passed; only deliberate docs prohibitions
  for `Redis.fromEnv()` and direct `process.env` remained.
- `git diff --check`: passed.

### document-codex-oauth-provider

Accepted: 2026-07-07

Changed files:

- `README.md`
- `ARCHITECTURE.md`
- `docs/README.md`
- `docs/architecture/effect-patterns.md`
- `docs/architecture/eve-agent.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/testing-and-quality.md`
- `apps/agent/README.md`
- `apps/codex-proxy/README.md`
- `packages/codex-oauth/README.md`
- `docs/product-specs/codex-oauth-eve-model-provider.md`
- `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`
- `docs/exec-plans/active/codex-oauth-eve-model-provider.md`

Evidence:

- Updated durable docs with the current Codex provider boundary:
  `apps/agent` owns Gateway/default and opt-in private-proxy model selection,
  `apps/codex-proxy` owns the private Effect HTTP/Vercel boundary, and
  `@bundjil/codex-oauth` owns reusable OAuth/profile/provider/storage
  contracts.
- Distinguished implemented behavior from opt-in proof, Vercel preview mock
  proof, future hosted live Codex/storage work, and unsupported paths.
- Added production and test call graphs for Eve provider selection, proxy
  routing, package provider/storage paths, Vercel preview proof, and app /
  package tests.
- Added exact local commands, Vercel preview-before-production commands,
  direct HTTP checks, sanitized proof shapes, rollback instructions, and the
  rule that `bundjil-codex-proxy` belongs in Cooper's personal Vercel account,
  not Tilt Legal.
- Documented Effect Schema JSON boundaries with `Schema.fromJsonString(...)`
  and `Schema.UnknownFromJsonString`.
- Worker `019f3e3f-858c-7a91-a047-63731a433c76` completed the docs edit and
  left commit/push to the parent. Parent removed residual direct runtime JSON
  API audit wording, reran verification, and accepted the slice for commit.
- No code, package, runtime, deployment, or env files were changed.

Parent audit:

1. Ownership and call graph: docs now align on app/package ownership, current
   mock/proof behavior, future live behavior, and unsupported paths. The
   production and test graphs match the accepted implementation slices.
2. Effect implementation quality: docs reinforce flat Effect `gen`, Effect
   Schema contracts, typed errors, `Config.redacted`, explicit layers,
   subpath-owned provider/storage adapters, and the mandatory 3-pass Effect TS
   audit. No implementation code changed.
3. Verification coverage: `bun run check` passed, `bun run verification`
   passed, and scans found no direct runtime JSON API names, stale manual
   serialization wording, obsolete proxy script guidance, or committed token
   values.

Verification:

- `bun run check`: passed.
- `bun run verification`: passed across Ultracite, knip, typechecks for
  6 packages, and tests for 6 packages.
- Docs scan for stale manual serialization wording and direct runtime JSON API
  names:
  passed.
- Docs scan for updated Vercel deployment, rollback, and Schema JSON boundary
  references: passed.

### final-verification

Accepted: 2026-07-07

Changed files:

- `docs/product-specs/codex-oauth-eve-model-provider.tasks.json`
- `docs/exec-plans/active/codex-oauth-eve-model-provider.md`

Evidence:

- Ran the final required verification sequence from the repo root.
- Confirmed all previously completed tasks have implementation notes, at least
  3 completed audit passes, and at least 3 audit evidence entries.
- Confirmed the product surface has no forbidden runtime JSON API names, stale
  Eve wiring text, stale proxy-start guidance, raw OAuth payload assignments,
  private-key/provider-secret shapes, or real secret-shaped token values.
- A full tracked-file secret-shaped scan also found no token, authorization
  code, provider secret, or private-key matches. Product-surface stale-pattern
  scans intentionally remained scoped to Bundjil runtime and product docs.
- Parent initially ran `@bundjil/codex-oauth` build and `@bundjil/codex-proxy`
  test in parallel, which raced on the codex-oauth dist entrypoint. After the
  codex-oauth build completed, parent reran the proxy test sequentially and it
  passed.
- Parent also ran `bun run build`; it passed across all 6 packages/apps.
- No code, package, runtime, deployment, or env files were changed.
- Worker `019f3e50-f6f3-7b42-91af-77b12cb7b0c1` ran final verification,
  updated evidence, and left commit/push to the parent. Parent reviewed the
  evidence, reran decisive checks, and accepted the slice for commit.

Parent audit:

1. Ownership and call graph: final verification touched only the task ledger and
   active execution plan. `apps/agent`, `apps/codex-proxy`,
   `@bundjil/codex-oauth`, and the accepted provider/proxy/storage call graphs
   were not changed.
2. Effect implementation quality: no implementation code changed. The audit
   confirmed prior tasks retain implementation notes and 3-pass evidence, and
   docs still describe Effect Schema JSON codecs with
   `Schema.fromJsonString(...)` and `Schema.UnknownFromJsonString`.
3. Verification coverage: every required command passed, prior task evidence was
   checked with `jq`, pre-edit `git status --short` was clean, final
   product-surface stale scans were clean, and the full tracked-file
   secret-shaped scan found no reportable findings.

Verification:

- `bun install --frozen-lockfile`: passed, no install changes.
- `bun run --filter @bundjil/codex-oauth test`: passed, 4 files and 26 tests.
- `bun run --filter @bundjil/codex-oauth build`: passed.
- `bun run --filter @bundjil/codex-proxy test`: passed, 1 file and 5 tests
  after a sequential rerun. The first parent parallel run raced the
  `@bundjil/codex-oauth` dist rebuild.
- `bun run --filter @bundjil/codex-proxy build`: passed.
- `bun run --filter @bundjil/codex-proxy smoke-test`: passed with
  `{"healthStatus":200,"streamStatus":200,"streamLines":5}`.
- `bun run verification`: passed across Ultracite, knip, 6 package typechecks,
  and 6 package test targets.
- `bun run build`: passed across 6 packages/apps.
- `git status --short`: clean before final evidence edits; after edits only the
  task ledger and active plan are modified.
- Completed-task audit check: passed.
- Product-surface stale scans: passed.
- Full tracked-file secret-shaped scan: passed.

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
- 2026-07-07: `deploy-codex-proxy-vercel` worker
  `019f3d68-663f-74b2-835c-9e3bfdf5eaaf` returned a committed slice after a
  delayed wait. Parent reviewed the commit and audited Vercel ownership,
  app-owned deployment glue, preview proof, log hygiene, and production-skip
  state.
- 2026-07-07: `add-vercel-kv-adapter` worker
  `019f3e29-854a-7a92-9ae0-e503fd287885` timed out and was closed without a
  final response. Parent reviewed, refined, verified, and accepted the
  worktree changes with the required three-pass audit.
- 2026-07-07: `document-codex-oauth-provider` was implemented as a
  documentation-only slice in the current thread. Commit and push were
  explicitly skipped by user instruction.
- 2026-07-07: `final-verification` was implemented as an evidence-only slice in
  the current thread. The worker did not commit or push; parent acceptance,
  commit, and push are handled in this closeout.

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
- 2026-07-07: `deploy-codex-proxy-vercel` accepted after Vercel project
  metadata confirmed Cooper personal scope, encrypted preview env vars were
  set, preview deployment `dpl_38aC4YSWLkCESQiJATs5JqHsSn4X` reached READY,
  direct preview health/auth/mock-SSE checks passed, Vercel runtime-log and
  CLI-output scans were clean, and production deployment was skipped.
- 2026-07-07: `wire-eve-model-provider` accepted after app-owned provider
  wiring, Schema JSON encoder cleanup, local Gateway proof, local Codex proxy
  Eve session proof, targeted app/package verification, and the mandatory
  three-pass Effect audit. Final `bun run verification` and `bun run build`
  both passed.
- 2026-07-07: `add-vercel-kv-adapter` accepted after adding the Upstash Redis
  KeyValueStore adapter, Effect Config/Schema contracts, mocked adapter tests,
  package docs, spec/ledger updates, and the mandatory three-pass Effect
  audit. `bun install --frozen-lockfile`, targeted package checks, repo
  `check`, `knip`, `check-types`, `verification`, `build`, diff check, and
  Schema JSON/secret-boundary scans passed.
- 2026-07-07: `document-codex-oauth-provider` accepted after durable docs were
  updated across root, architecture, app, package, spec, task ledger, and
  active plan docs. `bun run check` and `bun run verification` passed; stale
  manual serialization wording, direct runtime JSON API names, obsolete proxy
  script guidance, and secret/token-value scans were clean.
- 2026-07-07: `final-verification` accepted after frozen install, targeted
  `@bundjil/codex-oauth` test/build, targeted `@bundjil/codex-proxy`
  test/build/smoke-test, root `bun run verification`, `git status --short`,
  completed-task audit checks, and product-surface stale/secret scans passed.
  Parent reviewed the evidence, committed it, and pushed it to `origin/main`.
