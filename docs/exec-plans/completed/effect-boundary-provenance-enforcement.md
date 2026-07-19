# Effect Boundary Provenance Enforcement Execution Plan

- Status: Completed
- Started: 2026-07-18
- SPEC: `docs/product-specs/effect-boundary-provenance-enforcement.md`
- Tasks: `docs/product-specs/effect-boundary-provenance-enforcement.tasks.json`
- Goal: implement four tasks sequentially with one Terra Medium subagent per
  task; the parent reviews, audits, verifies, accepts, and commits each task
  before delegating the next.

## Baseline

- Branch: `main`
- Starting commit: `650e9bc`
- Initial working tree: only the new SPEC and sibling task ledger were
  untracked.
- Current audit candidates: 35 explicit raw `string` annotations, 22
  `unknown` occurrences, 147 direct string Schema references, 98 decode calls,
  41 encode calls, and three synchronous Schema decodes in production package
  source.
- Candidate strict Effect diagnostics found five global-fetch occurrences and
  one nested `Effect.gen` occurrence. `deterministicKeys` is outside scope.
- Baseline verification passed with the ignored Preview-local environment
  loaded. No secret values are retained here.

## Task 1 - Establish Boundary Provenance Audit

- Status: Completed
- Subagent: Rawls (`019f75f4-f967-7923-bb06-d4854be00466`)
- Commit: `55ca64f`

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Completed
- Evidence: Root `tooling/boundary-audit.ts` owns the compiler-API check and
  imports only TypeScript plus the root registry; it never imports app/package
  runtime modules. `tooling/boundary-exceptions.ts` records only exact
  file/symbol/occurrence/rule adapter entries. Production source and operator scripts flow
  through `bun run check:boundaries`; fixture source flows through
  `bun run test:boundaries`.

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Completed
- Evidence: Reviewed `tooling/boundary-audit.ts` and
  `tooling/boundary-exceptions.ts`: no runtime behavior or provider wiring
  changed, no package/helper layer was added, and exception matching is exact
  on file, symbol, occurrence, and rule. The audit uses a TypeScript `Program`
  and type checker for public signatures and codec Type/Encoded provenance; its
  rule-sized checks report codec remediation and fail stale or duplicate
  registry entries. The Effectful CLI uses one tagged error and handles it in
  the outer pipe.

### Parent Audit Pass 3 - Verification And Evidence

- Status: Completed
- Evidence: `bun run test:boundaries` passed 22 positive/negative fixture,
  occurrence, codec-side, and stale/duplicate-exception tests;
  `bun run check:boundaries`, `tsc --project tooling/tsconfig.json`, Ultracite,
  Knip, all seven workspace typechecks, and 223 existing package/app tests
  passed. `bun --env-file=apps/agent/.env.preview.local run verification`
  passed. No live or browser proof is required because runtime output did not
  change. A standalone production-style agent build still requires its full
  runtime configuration and is tracked for the later app/config migration.

## Task 2 - Migrate Codex Boundaries End To End

- Status: Completed
- Subagent: Halley (`019f7621-76df-75b0-a2f0-99b65fdd614b`)
- Commit: `a4728c4`

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Completed
- Evidence: `@bundjil/codex-oauth` owns OAuth, profile, filesystem, provider
  HTTP, SSE, and tagged-error contracts. `apps/codex-proxy` retains one exact
  host-facing unknown config adapter. Requests now flow from decoded Codex
  contracts through Effect `HttpClientRequest` and `HttpClient`, while
  responses are decoded before domain use. All Codex-specific registry entries
  were removed; no raw provider value crosses a service boundary.

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Completed
- Evidence: Reviewed the complete Codex and proxy diff. Semantic paths,
  runtime platforms, callback request fields, provider codes, config values,
  and errors use owner Schemas. Operator scripts have one
  `Effect.runPromise` entrypoint, the profile cipher is flat, and decoded
  `response.completed` events use `Match`. Production and operator scans found
  no sync Schema codec, global fetch, direct JSON API, unsafe cast, nested
  generator, DTO mirror, or new helper/common/utils module.

### Parent Audit Pass 3 - Verification And Evidence

- Status: Completed
- Evidence: `bun --env-file=apps/agent/.env.preview.local run verification`
  passed the boundary audit, 23 audit fixtures, Effect language-service setup,
  ten-surface skill policy, Ultracite, Knip, seven workspace typechecks, 103
  OAuth tests, 24 proxy tests, 60 agent tests, and all other workspace tests.
  Package builds and a direct non-secret gateway-configured Eve build passed.
  The proxy smoke test returned health 200, stream 200, and five SSE lines.
  `git diff --check` and task-ledger JSON parsing passed. The preview env file's
  intentionally redacted proxy URL cannot be used for a standalone Codex-mode
  build, so no secret or live provider state was read or changed.

## Task 3 - Migrate Channel, Proxy, Config, And Persistence Boundaries

- Status: Completed
- Subagent: Singer (`019f765c-6317-7473-9279-20503b363620`)
- Commit: `07af417`

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Completed
- Evidence: Eve's channel adapter now owns unknown `message.completed` decoding
  and the framework Promise bridge. `SendblueChannel` accepts decoded owner
  values and Effects. App-owned `Config.schema` contracts feed decoded config;
  `@bundjil/effect-persistence` owns transaction codecs and the private Upstash
  facade; the proxy factory accepts only `CodexProxyRuntimeConfig.Encoded`.
  Eighteen exact constraints remain: two Fetch/Web Crypto adapter entries,
  fourteen private Upstash SDK primitive entries, and two Eve Standard Schema
  generic entries.

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Completed
- Evidence: The first parent review found known values still using
  `decodeUnknownEffect`; the correction round moved config, message, replay,
  transaction, preflight, Eve-success, and Upstash-command values to direct
  decoded construction or `decodeEffect`. Reviewed owner diagnostics,
  Redacted config flow, `Match` branches, and primary Effect operations. No
  unsafe cast, sync production codec, DTO mirror, or helper/common/utils
  module was introduced.

### Parent Audit Pass 3 - Verification And Evidence

- Status: Completed
- Evidence: Root verification passed the boundary audit, 23 fixtures, Effect
  setup, ten-surface skill policy, Ultracite, Knip, seven workspace
  typechecks, and 223 tests. All seven workspace builds passed with safe
  non-secret Gateway/Executor build configuration. Proxy smoke returned
  health 200, stream 200, and five SSE lines. `git diff --check` and task-ledger
  JSON parsing passed. Webhook settings, credentials, namespaces, TTLs,
  serialized bytes, deployment state, and visible UI were unchanged.

## Task 4 - Enable Hard Gates And Reconcile Documentation And Skills

- Status: Completed
- Subagent: Descartes (`019f767a-578d-7943-8138-fcdcbbbc8cf1`)
- Commit: `322909f`

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Completed
- Evidence: Root tooling owns Effect language-service setup, the compiler-API
  boundary audit and exact 18-entry external-constraint registry, and the
  ten-surface skill-policy audit. Domain packages own canonical codecs while
  named host, framework, SDK, and persistence adapters alone own unknown or
  encoded representations. Architecture docs and skills teach this same call
  graph. `CLAUDE.md` remains the symlinked view of `AGENTS.md`.

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Completed
- Evidence: Reviewed all selected diagnostics, policy tooling, architecture
  docs, and skills. Two parent correction rounds made the skill audit a named
  Effect operation with a tagged error and outer-pipe handling, described the
  registry as final external constraints, added `decodeEffect` and
  Effect-wrapped SDK initialization to wrapper guidance, removed the final
  synchronous codec example, and broadened the contradictory-guidance scan.
  The final diff has no unsafe cast, suppression expansion, DTO mirror,
  generic helper package, or helper/common/utils sprawl.

### Parent Audit Pass 3 - Verification And Evidence

- Status: Completed
- Evidence: Root verification passed Effect language-service patch checks,
  the zero-finding boundary audit with 18 exact external constraints, the
  ten-surface skill audit, 23 boundary fixtures, Ultracite, Knip, seven
  workspace typechecks, and 223 tests. All seven workspace builds passed with
  safe non-secret configuration. Proxy smoke returned health 200, stream 200,
  and five SSE lines. `git diff --check`, task-ledger JSON parsing, and the
  synchronous-codec guidance scan passed. Browser and live-provider proof were
  not applicable because the task changed no visible route, runtime
  composition, provider state, credential, webhook, or deployment.

## Final Closeout

- Status: Completed
- Boundary audit: passed with zero unexplained findings and 18 exact
  external/framework constraints.
- Effect language-service setup and diagnostics: patch checks passed; eleven
  selected diagnostics are errors, `deterministicKeys` remains excluded, and
  the repository reports zero findings.
- Root verification: passed 23 boundary fixtures, the ten-surface skill audit,
  Ultracite, Knip, seven workspace typechecks, and 223 tests.
- Root build: all seven workspace builds passed with safe non-secret
  configuration; proxy smoke returned HTTP 200/200 and five SSE lines.
- Diff and task-ledger validation: `git diff --check`, JSON parsing, and the
  synchronous-codec guidance scan passed.
- Frontend/Browser proof: not applicable; no visible route or React surface
  changed.
- Live provider proof: not applicable; runtime composition, wire output,
  credentials, webhooks, provider state, and deployments were unchanged.

## Post-Implementation Repository Integration

- Date: 2026-07-19
- Remote baseline: `d9e1b54`
- Reason: reconcile the completed provenance work with the parallel repository
  naming cleanup without altering the original worktree's unrelated skill
  edits.
- Ownership: historical `@bundjil/effect-persistence`,
  `@bundjil/codex-oauth`, and `@bundjil/eve-effect` paths now map to
  `@bundjil/store`, `@bundjil/codex`, and `@bundjil/eve`.
- Integration audit: retained the renamed package/error ownership, ported the
  Effect HttpClient, Config/Schema, encoded/decoded, and flat-control-flow
  changes, and taught the compiler audit to resolve live workspace exports
  without admitting aliases to raw primitives.
- Verification: zero-finding boundary audit with 18 exact external
  constraints; 24 boundary fixtures; ten-surface skill policy; repository
  tagged-error lint test; Ultracite; Knip; five workspace typechecks; 228
  workspace tests; five workspace builds; proxy smoke HTTP 200/200 with five
  SSE lines; task-ledger parse; and `git diff --check` all passed.
