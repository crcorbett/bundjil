# Repository Naming And Structure Cleanup Implementation Plan

Status: Completed

Branch: `codex/repo-naming-cleanup`

Spec: `docs/product-specs/repo-naming-cleanup.md`
Task ledger: `docs/product-specs/repo-naming-cleanup.tasks.json`

## Execution Rule

Implement the ledger sequentially. One implementation subagent owns exactly one
task at a time. The parent reviews the actual diff, runs focused and repository
verification, completes and records the ownership/call-graph,
implementation-quality/helper-admission, and verification/evidence audits,
commits the accepted slice, and only then delegates the next task.

Three parent audit passes are the minimum. Any finding keeps the task open until
it is corrected and another pass accepts the result. Subagent reports are review
inputs, not acceptance evidence.

## Evidence Policy

Record source paths, package names, test names, safe operation names, counts,
booleans, and compatibility conclusions only. Never record credentials, stored
values, physical personal-data keys, OAuth subjects, message content, protected
URLs, provider payloads, or execution identifiers.

This rollout performs no provider mutation, deployment, publication, stored-data
rewrite, frontend change, or Browser proof. Automated provider boundaries use
mock or deterministic memory Layers.

## Ordered Tasks

1. `capture-compatibility-baseline-and-remove-effect-start`: completed.
2. `rename-effect-persistence-to-store`: completed.
3. `rename-codex-oauth-to-codex`: completed.
4. `organize-codex-source-by-owned-feature`: completed.
5. `rename-eve-effect-and-remove-core`: completed.
6. `clarify-agent-integration-ownership`: completed.
7. `reconcile-documentation-and-final-verification`: completed.

## Baseline

- Rollout started 2026-07-18 from `ea511a4` on
  `codex/repo-naming-cleanup`.
- The reviewed SPEC and task ledger were untracked, and `docs/README.md` contained
  their current-spec navigation entry before implementation began.
- Initial workspace packages are `@bundjil/agent`, `@bundjil/codex-oauth`,
  `@bundjil/codex-proxy`, `@bundjil/core`,
  `@bundjil/effect-persistence`, `@bundjil/effect-start`, and
  `@bundjil/eve-effect`.
- The final reusable package set must be exactly `@bundjil/store`,
  `@bundjil/codex`, and `@bundjil/eve`; both apps retain their current names.
- No task may change environment-variable names, stored values, routes, tool or
  discovery slugs, provider endpoints, Vercel project identities, webhooks,
  deployments, or secrets.

## Task Evidence

### capture-compatibility-baseline-and-remove-effect-start

Status: Completed

Subagent: one implementation worker; parent acceptance required one correction
to restore exact historical package names in two proof records while labeling
them as historical rather than current architecture.

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- `packages/effect-start` had no production import outside its own package; its
  only external references were current documentation/configuration and the
  self-describing workspace package list.
- Removing the package also removed its TanStack dependency catalog, root
  TypeScript reference, workspace/lockfile closure, and current documentation
  without a forwarding package or replacement boundary.
- Six workspaces remain. `workspace_status` now reports only the still-current
  `@bundjil/core` and `@bundjil/eve-effect` entries; later ledger tasks own the
  final three-package output migration.
- All selected Codex, Eve, and Executor error files and consumers remain
  unchanged. Persistence encodes profile/replay contracts, while the proxy
  translates internal errors to the stable `CodexProxyErrorResponse` boundary.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- `bundjil/tagged-error-name` is a root-owned Oxlint rule scoped to TypeScript
  source under `apps/**` and `packages/**`; it checks only the mechanical class,
  self-type, and literal-tag equality invariant.
- The rule uses the installed Oxlint 1.61 plugin AST and RuleTester boundaries,
  does not encode capability vocabulary or migration-specific forbidden names,
  and leaves historical documents and negative compatibility assertions out of
  scope.
- Focused cases cover a valid tagged error, an ordinary class, and independent
  declaration, self-type, and literal-tag mismatches. The isolated Vitest config
  exists only to make the root lint-rule suite executable.
- No Effect operation, domain Schema, selected error, DTO, wrapper, mapper,
  unsafe cast, suppression, provider boundary, runtime policy, or external
  identifier changed.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- One `bun install` regenerated `bun.lock`; parent frozen install confirmed 508
  installs across 693 packages with no changes and no TanStack/effect-start
  entry remaining.
- `bun run test:lint` passed the focused rule suite; `bun run check`, Knip, and
  all six workspace typechecks passed.
- Parent `bun run verification` passed with the SPEC's non-secret synthetic
  Executor URL and key. All 212 workspace tests passed: persistence 23, core 2,
  Codex 103, Eve 3, proxy 24, and agent 57.
- Static current-source/configuration scans found no effect-start or TanStack
  reference. The two retained package-name lists are explicitly historical
  Gateway proof; historical product specs and ledgers remain unchanged.
- `git diff --check` passed. No Browser, live provider, deployment,
  publication, or stored-data proof was applicable or performed.

### rename-effect-persistence-to-store

Status: Passed

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- The package, manifest identity, repository directory, root contract, `/memory`
  and `/upstash` exports, and the sole `AtomicKeyValueStore` Context identity
  moved atomically to `@bundjil/store`.
- Memory and Upstash providers, Codex persistence consumers, and Sendblue replay
  consumers all use the same new service tag; no old/new identities coexist.
- The proxy's unused direct dependency and Knip ignore were removed while its
  explicit Vercel build closure remains store, Codex, then proxy.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- A byte-level comparison against the prior package found no implementation,
  Schema, error, test, or configuration change beyond package metadata, README
  naming, and the required Context identity.
- Root, `/memory`, and `/upstash` export maps remain synchronized with
  `publishConfig.exports`; no alias, wrapper, DTO, unsafe cast, helper, or
  suppression was introduced.
- `@upstash/redis` remains confined to the store manifest and Upstash
  implementation; provider commands, prefixes, decoding, keys, values, TTLs,
  transactions, locks, fences, and replay behavior remain unchanged.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Parent frozen install passed with 508 installs across 693 packages and no
  changes.
- Parent focused verification passed: store 23 tests plus build, Codex 103
  tests, proxy 24 tests including packaging, and agent 57 tests.
- Parent `bun run verification` passed: Ultracite, the tagged-error lint test,
  Knip, six workspace typechecks, ten Turbo tasks, and all 212 workspace tests.
- Current-source/configuration scans contain no old persistence package/path;
  remaining occurrences are classified historical or migration evidence.
- `git diff --check` passed. No Browser, live provider, deployment,
  publication, or stored-data action was applicable or performed.

### rename-codex-oauth-to-codex

Status: Passed

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- The complete integration moved to `@bundjil/codex`, with intentional root,
  `/runtime`, `/local`, `/testing`, and `/filesystem-store` exports and no
  forwarding aliases.
- All proxy, script, manifest, test, current-documentation, and Vercel consumers
  use the new package and public subpaths; the build closure is store, Codex,
  then proxy.
- All 27 `Context.Service` identifiers changed only by package prefix, with
  declarations, providers, and consumers migrated together; storage keys remain
  independently defined.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- Rename-aware review found all 24 error contract/barrel files and the canonical
  Schema, storage-key, response-config, and token-metadata modules byte-identical.
- Selected old tagged-error classes, self-types, literal tags, fields, unions,
  catchers, and mappings remain unchanged for the following atomic migration;
  every non-selected error remains exact.
- Export and `publishConfig.exports` keys and paths are symmetric. No wrapper,
  alias, dual decoder, DTO, unsafe cast, helper, broad barrel, or runtime/provider
  behavior change was introduced.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Parent frozen install passed with 508 installs across 693 packages and no
  changes.
- Parent focused gates passed: Codex check-types/build and 103 tests; proxy
  check-types/build and 24 tests; mock smoke health/stream 200 with five SSE
  lines; store 23 tests; agent 57 tests; and Knip.
- Parent full verification passed the tagged-error lint test, six workspace
  typechecks, ten Turbo tasks, and all 212 workspace tests. One initial Codex
  contention timeout passed a focused 17-test rerun and later isolated/full
  103-test runs.
- Stale-reference, export-parity, Context-identity, error-preservation, and diff
  checks passed. No Browser OAuth, live provider, deployment, publication, or
  stored-data action was applicable or performed.

### organize-codex-source-by-owned-feature

Status: Passed

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- Implementation and canonical Schemas are owned by `auth`, `profiles`,
  `provider`, `storage`, and `testing`, with responsibility filenames and no
  forwarding old-path modules.
- Root and supported subpath exports remain the consumer API. All 27 internal
  `Context.Service` identifiers remain exact with matching providers and
  consumers.
- The six selected errors and three associated Schema/type contracts migrated
  atomically across declarations, unions, constructors, catchers, guards,
  scripts, proxy mappings, and tests.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- Rename-aware diff review separated path movement from the intentional encoded
  contract changes. Six table rows prove exact encoded fields, target decode and
  `Schema.is` success, and old-tag rejection.
- All 16 non-selected tagged-error bodies remain byte-identical; storage-key
  logic and every reason, boundary, operation, field, cause, and retry
  classification remain unchanged.
- No old alias, transform, dual decoder, unsafe cast, DTO, manual mapper,
  speculative factory, broad compatibility barrel, or trivial wrapper was
  introduced.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Parent frozen install passed with 508 installs across 693 packages and no
  changes.
- Parent focused gates passed: Codex check-types/build and 109 tests; proxy 28
  tests with byte-exact public responses; mock smoke health/stream 200 with five
  SSE lines; check, tagged-error lint, and Knip.
- Parent full verification passed six workspace typechecks, ten Turbo tasks,
  and all 222 tests. Selected-old names occur only in six rejection fixtures;
  non-selected tags, Context identities, storage keys, and diff checks passed.
- No external persisted decoder was found. No Browser, provider mutation,
  deployment, publication, or stored-data action was applicable or performed.

### rename-eve-effect-and-remove-core

Status: Passed

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- The Eve boundary moved to `@bundjil/eve` with root and `/schema` exports;
  workspace summary/status ownership moved into Eve and `@bundjil/core` was
  removed without a generic replacement.
- `WorkspaceOperations`, live/memory Layers, accessor, and app consumer use the
  atomic `@bundjil/eve/WorkspaceOperations` identity.
- Root TypeScript references now contain exactly store, Codex, Eve, proxy, and
  agent.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- `WorkspaceSchemaError` declaration/self-type/literal tag and
  `WorkspaceSchemaBoundary` migrated atomically with all four boundary literals
  intact; exact encode/decode and old-tag rejection tests pass.
- Dead gateway/operation errors, operation name, redundant failure union,
  duplicated adapter path, aliases, and the core package are absent.
- Input/success Schemas and adapter remain byte-equivalent; workspace output is
  exactly Codex, Eve, Store with no forwarding package or speculative error.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Parent frozen install passed with 506 installs across 692 packages and no
  changes.
- Parent focused gates passed: Eve check-types/build and 6 tests; agent
  check-types/build and 57 tests; tagged-error lint and Knip.
- Parent full verification passed five workspace typechecks, eight Turbo tasks,
  and all 223 tests. Export, tsconfig, package-list, stale-name, identity,
  discovery-path, and diff checks passed.
- No Browser, live provider, deployment, publication, or stored-data action was
  applicable or performed.

### clarify-agent-integration-ownership

Status: Passed

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- Direct Eve discovery remains at `channels/sendblue.ts` and
  `connections/executor.ts`; import-only Sendblue implementation files now use
  responsibility names without nested entrypoints or a shared channel package.
- Routes, slugs, runtime composition, endpoint policy, and provider ownership
  remain app-owned and unchanged.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- `ExecutorConfigError` declaration/self-type/literal tag and
  `ExecutorConfigOperation` migrated atomically with exact fields,
  `loadEndpoint`/`loadApiKey`, guards, sanitized messages, and redaction.
- Encode/decode/`Schema.is` and old-tag rejection tests pass. All nine Sendblue
  error files and canonical Schemas remain byte-identical; implementation moves
  are import-path-only.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Parent agent check-types/build and 58 tests, tagged-error lint, Knip, five
  workspace typechecks, and full verification with 224 tests passed.
- Discovery, stale-name, mechanism-filename, Sendblue-tag, redaction, replay,
  and diff scans passed under the synthetic Executor configuration.
- No Browser, live provider, deployment, publication, or stored-data action was
  applicable or performed.

### reconcile-documentation-and-final-verification

Status: Passed

#### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- Root, architecture, app, package, command, package-inventory, and call-graph
  documentation now uses `@bundjil/store`, `@bundjil/codex`, and
  `@bundjil/eve`; `docs/README.md` separates current guidance from historical
  specifications and completed plans.
- Seven plans whose own headers declared Complete or Superseded moved to
  `docs/exec-plans/completed`. This cleanup plan remained the only active plan
  until final evidence was recorded.
- Package/export/TypeScript/Vercel scans prove three reusable packages,
  symmetric export maps, exactly five project references, and the store ->
  Codex -> proxy build closure. Direct Eve discovery remains
  `channels/sendblue.ts` and `connections/executor.ts` with provider-owned
  import-only children.

#### Parent Audit Pass 2 - Implementation Quality And Helper Admission

Status: Passed

- Canonical architecture now owns capability naming, tagged-error declaration/
  self-type/literal equality, atomic constructor/union/catcher/guard/encoded-
  test/mapping/docs migration, external-decoder compatibility stops, rejection
  of speculative errors, and current-versus-historical stale scans.
- Repository `prd-writer`, `prd-implementer`, and `effect-client-wrapper`
  skills link to those generic rules without duplicating the cleanup rename
  table. The unrelated user-global review skill and unrelated repo skills are
  unchanged; the stale site `create-package` skill was removed.
- The final 34 exported Schema-backed errors have matching declarations and
  tags: Store 1, Codex 22, Eve 1, Sendblue 9, and Executor 1. Eight selected
  old literals occur only in focused rejection fixtures; no alias or dual
  decoder exists. This task changed no Effect runtime operation, Schema,
  service, Layer, DTO, mapper, cast, helper, route, or provider composition.

#### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Frozen install passed with 506 installs across 692 packages and no changes.
  All five package/app focused typechecks and builds passed; Store 23, Codex
  109, Eve 6, proxy 28, and agent 58 tests passed, for 224 workspace tests.
  Proxy mock smoke returned health 200, stream 200, and five SSE lines.
- `bun run test:lint`, `bun run check`, Knip, root typechecks, root tests, root
  build, `bun run verification`, `bun run changeset:status`, both JSON parses,
  and `git diff --check` passed under the documented synthetic Executor
  configuration. An ephemeral fixture made normal `bun run check` report all
  three `bundjil/tagged-error-name` mismatch categories before removal.
- Current-source/config/runbook/architecture scans found no old package or
  path names. Selected old errors occur only in eight rejection assertions;
  historical matches are confined to product specs, ledgers, completed plans,
  and explicitly labeled historical proof. `bun pm ls` and `bun.lock` contain
  only the five target workspaces; direct Upstash imports remain confined to
  `packages/store/src/upstash.layer.ts`.
- Environment/secret-name, provider/external-URL, and physical-key-prefix sets
  are exact against the pre-cleanup baseline. Route, callback, webhook, tool,
  channel, connection, and discovery literals remain present; prior task
  compatibility audits prove encoded values, TTLs, transactions, fences,
  replay behavior, public HTTP mappings, Vercel project/alias identity, and all
  non-selected discriminants stayed exact.
- The CI verification job supplies only the two documented non-secret
  synthetic Executor build inputs. Build-time discovery made no provider call;
  Production remains fail-closed. No Browser, frontend, live provider,
  deployment, publication, package versioning/tagging, stored-data rewrite, or
  provider mutation occurred.
