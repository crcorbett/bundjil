---
document_type: execution-plan
lifecycle: implemented
authority: supporting
owner: bundjil-architecture-owner
successor: ../../architecture/effect-patterns.md
last_reviewed: 2026-07-20
---

# Effect Schema String Contracts Implementation Plan

Status: Completed

Spec: `docs/product-specs/effect-schema-string-contracts.md`
Task ledger: `docs/product-specs/effect-schema-string-contracts.tasks.json`

## Execution Rule

Implement the ledger sequentially. The parent reviews the actual diff, runs
focused and repository verification, performs ownership/call-graph,
implementation-quality/helper-admission, and verification/evidence audits, and
records at least three accepted passes before completing each task.

## Baseline

- Started 2026-07-17 on `main` at `ea511a4`.
- Worktree was clean.
- Initial broad scan returned 541 production-source candidate occurrences.
- Existing string brands are concentrated in Sendblue and Codex OAuth;
  persistence, Eve operations, and the proxy have none.
- Installed Eve authority:
  `.local/references/eve/packages/eve/src/protocol/message.ts` defines
  `message.completed` and finish reasons `content-filter`, `error`, `length`,
  `other`, `stop`, and `tool-calls`.

## Classification Ledger

| Owner                         | Contract family                                                                 | Current state                        | Required category                                                      |
| ----------------------------- | ------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `@bundjil/core`               | workspace/package identities and `WorkspaceSummary`                             | raw cross-package strings            | brand; fixed package vocabulary literal                                |
| `@bundjil/effect-persistence` | atomic key, serialized value                                                    | anonymous string                     | brand                                                                  |
| `@bundjil/effect-persistence` | outcome, operation, condition/mutation tags                                     | literals/tags                        | literal                                                                |
| `@bundjil/codex-oauth`        | profile, connector, installation, revision, key ID, model, endpoint, prefix     | existing brands                      | brand; retain                                                          |
| `@bundjil/codex-oauth`        | principal ID/issuer, subject hash, redirect URI, scope, function/call/chunk IDs | anonymous strings                    | brand or named semantic Schema                                         |
| `@bundjil/codex-oauth`        | tokens, verifier, state, account, authorization                                 | redacted strings                     | secret; consolidate canonical owner Schemas                            |
| `@bundjil/codex-oauth`        | roles, modes, operations, event kinds, finish reasons                           | literals plus broad provider strings | literal with forward-compatible transport fallback                     |
| `@bundjil/codex-oauth`        | prompt, instructions, message/tool output, arguments, deltas                    | anonymous strings                    | named content/transport                                                |
| `@bundjil/eve-effect`         | question, workspace/package names, summary                                      | anonymous strings                    | named content or brand according to interchange risk                   |
| `apps/agent`                  | phone, handle, principal, conversation/replay keys, claim ID                    | existing brands                      | brand; retain                                                          |
| `apps/agent`                  | Eve session/turn coordinates                                                    | anonymous strings                    | brand at projected event boundary                                      |
| `apps/agent`                  | `message.completed`, finish reason, replay/result/status/ignored reason         | map key/plain/literals               | canonical literal vocabulary                                           |
| `apps/agent`                  | inbound/outbound message content                                                | anonymous strings                    | named checked content                                                  |
| `apps/agent`                  | API/routing/webhook/store credentials                                           | redacted strings                     | named secret                                                           |
| `apps/agent`                  | replay prefix/provider URL/media/group/status payload                           | anonymous strings                    | brand, named transport, or literal per provider authority              |
| `apps/codex-proxy`            | mode/error/service                                                              | literals                             | literal; retain                                                        |
| `apps/codex-proxy`            | local directory                                                                 | anonymous string                     | brand or named path contract                                           |
| `@bundjil/effect-start`       | no Bundjil string-domain contract                                               | generic middleware glue              | none; import an owner contract when needed                             |
| all owners                    | tagged error message/cause text                                                 | anonymous checked strings            | diagnostic; do not brand                                               |
| parsers/adapters              | header values, JSON/SSE lines, serialized bytes                                 | strings                              | named boundary Schema where exported; parser-local transport otherwise |

## Task 1 - Establish Audit And Rules

Status: Completed

### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- The ledger assigns each boundary family to the package or app that gives the
  string meaning. It does not move Eve protocol ownership into Bundjil or
  create a cross-package common-schema owner.
- The production and test call graphs in the SPEC identify decode, Match,
  persistence, and encode boundaries before source migration.

### Parent Audit Pass 2 - Effect Quality And Helper Admission

Status: Passed

- The six-category rule distinguishes brands, literals, content, secrets,
  transport, and diagnostics and explicitly forbids mechanical branding.
- No constructor, helper, DTO, unsafe assertion, runtime execution, or source
  abstraction was added. The only architecture change is the canonical rule.

### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Root type-aware formatting/lint passed across 421 files with zero findings.
- The task JSON parses, authority scan found 38 relevant declarations/source
  references, `git diff --check` passed, and no production source changed.

## Task 2 - Persistence And Codex

Status: Completed

### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- `@bundjil/effect-persistence` owns branded atomic keys and serialized values;
  the native upstream `KeyValueStore` contract remains unchanged.
- `@bundjil/codex-oauth` owns principal, URI, scope, subject-hash, protocol,
  function/call, event, completion, content, secret, and transport Schemas.
- Codex and Sendblue consumers construct branded atomic values by decoding the
  complete canonical transaction. Encoded Redis keys, values, TTL
  milliseconds, OAuth payloads, and SSE frames remain unchanged.

### Parent Audit Pass 2 - Effect Quality And Helper Admission

Status: Passed after two correction rounds

- Parent review removed an attempted lint suppression and closed anonymous
  completion ID, event kind, output-item kind, finish-reason, stream-body,
  protocol URI/path/challenge/header, and cipher-material gaps.
- Known stream and output-item literals are decoded through canonical Schemas
  and handled with `Match`; broad branded provider kinds retain
  forward-compatible ignore behavior.
- Static diff scans found no unsafe cast, suppression, raw JSON, `switch`,
  production `decodeSync`, manual DTO, or new helper/common/utils module.
  Nested stream branch Effects own fallible multi-step event decoding.

### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- With the protected mode-`0600` local Executor environment loaded, focused
  checks, tests, and builds passed: 23 persistence, 103 Codex OAuth, and 57
  agent tests.
- Root `check`, Knip, seven-workspace typecheck, full verification, and full
  build passed; proxy verification included 24 tests. `git diff --check`
  passed.
- No frontend, route, deployment, provider, webhook, OAuth-profile, namespace,
  or Vercel configuration changed, so Browser and live-provider proof are not
  applicable.

## Task 3 - Eve, Sendblue, And Proxy

Status: Completed

### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed

- `@bundjil/eve-effect` owns reusable Eve session, turn, completion-event,
  finish-reason, workspace, package, question, summary, and message-content
  contracts without mirroring Eve's complete protocol.
- `apps/agent` owns Sendblue provider identities, content constraints, replay
  coordinates, statuses, secrets, and channel decisions. `apps/codex-proxy`
  owns only its mode, health service, diagnostics, and local profile-store path
  while reusing Codex account, principal, subject, and token contracts.
- Unknown HTTP, webhook, Eve callback, config, and provider values decode into
  complete canonical structures before service logic. Encoded Sendblue and
  proxy wire values remain unchanged.

### Parent Audit Pass 2 - Effect Quality And Helper Admission

Status: Passed after one correction round

- The canonical `message.completed` literal remains a framework event-map key;
  decoded finish reasons, provider responses, replay outcomes, channel
  decisions, status classification, and provider-mode selection use `Match`
  where they materially direct behavior.
- A correction round restored trimmed outbound content, separated unrestricted
  inbound content from Sendblue's 18,996-character outbound limit, typed the
  Eve authentication attributes, and closed anonymous workspace/package,
  model, status, secret, path, and replay contracts.
- Static diff scans found no unsafe cast, suppression, raw JSON helper,
  `switch`, production `decodeSync`, manual DTO, or new helper/common/utils
  module. Content and diagnostic strings remain intentionally named checked
  Schemas rather than nominal brands.

### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Focused checks, tests, and builds passed for `@bundjil/eve-effect` (4 tests),
  `@bundjil/agent` (60 tests), and `@bundjil/codex-proxy` (24 tests).
- Root type-aware check passed across 421 files with zero findings; Knip,
  seven-workspace typecheck, full verification, full build, and
  `git diff --check` passed with the protected local Executor environment.
- Regression coverage proves trimmed outbound delivery, inbound messages above
  the outbound provider limit, every installed Eve finish reason, invalid
  model rejection, canonical workspace output, and branded local profile paths.
- No frontend, deployment, provider, webhook, OAuth-profile, persistence
  namespace, or Vercel configuration changed, so live-provider proof is not
  applicable.

## Task 4 - Documentation And Final Audit

Status: Completed

### Final Inventory (2026-07-18)

Inventory method: scanned actual non-test TypeScript Schema declarations,
service/persistence structures, and app-owned config boundaries in the seven
scoped owners. This is an ownership inventory, not a claim that every local
prose or parser variable is branded.

| Owner                         | Canonical contract families found                                                                                                                                                                                           | Categories                                             | Boundary treatment                                                                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@bundjil/effect-persistence` | `AtomicKeyValueStoreKey`/`Value`; transaction outcome and operation; Upstash prefix/options                                                                                                                                 | brand, literal, secret, transport, diagnostic          | Complete atomic transactions decode before native/Upstash work; encoded key/value bytes remain unchanged.                                                                                           |
| `@bundjil/codex-oauth`        | OAuth/profile/principal/URI/scope/cipher/model/function/call/completion identities; profile/request/stream vocabularies; redacted OAuth/cipher/proxy/Upstash credentials; response content, bodies, headers, and SSE values | brand, literal, content, secret, transport, diagnostic | Complete OAuth, provider, persistence, and proxy structures decode at their package boundary; recognized literal unions use `Match`; unknown provider kinds remain forward-compatible transport.    |
| `@bundjil/core`               | workspace/package identities; `WorkspaceSummary`; fixed current package vocabulary                                                                                                                                          | brand, literal                                         | `makeWorkspaceSummary` decodes the complete default/custom-name summary; its parse failure crosses to Eve as the existing schema error.                                                             |
| `@bundjil/effect-start`       | None                                                                                                                                                                                                                        | n/a                                                    | Generic TanStack Start middleware glue owns no Bundjil string-domain contract.                                                                                                                      |
| `@bundjil/eve-effect`         | re-exported core workspace/package identities; session/turn identities; completed event and finish reasons; question, summary, and assistant content                                                                        | brand, literal, content, diagnostic                    | Complete tool and projected Eve payloads decode once; core summary parse failures translate to `BundjilAgentSchemaError`; the framework event map remains Eve-owned and decoded unions use `Match`. |
| `apps/agent`                  | Sendblue phone/handle/principal/conversation/claim/replay/media/status values; channel/replay/result/status vocabularies; inbound/outbound content; webhook/API/replay/routing credentials                                  | brand, literal, content, secret, transport, diagnostic | Complete webhook, config, and Eve-completed projections decode before delivery/replay work; outbound provider values encode through their owner Schema and decoded unions use `Match`.              |
| `apps/codex-proxy`            | local profile-store directory; mode/health/error vocabulary; diagnostic message; imported Codex subject/account/token/model/request/stream contracts                                                                        | brand, literal, diagnostic                             | Complete HTTP/config structures decode at the app boundary and canonical HTTP/SSE values encode outward; Codex semantics remain package-owned.                                                      |

### Intentional Anonymous `Schema.String` Exceptions

These are the remaining direct anonymous string declarations in scoped
non-test code. They are deliberately local/private fields, not missing public
semantic contracts.

| Owner                         | Location / field family                                                                                                                                | Category              | Reason                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `@bundjil/core`               | None                                                                                                                                                   | n/a                   | Workspace/package contracts are owner-named Schemas; the fixed package input is decoded through the named literal vocabulary.                |
| `@bundjil/effect-start`       | None                                                                                                                                                   | n/a                   | Generic middleware glue owns no Bundjil string-domain contract.                                                                              |
| `@bundjil/effect-persistence` | `src/upstash-layer.internal.ts`: `UpstashGetResponse`, scan cursor/keys, atomic command `keys`/`args`                                                  | transport             | Private Upstash wire/script fragments after the enclosing atomic transaction has decoded; no exported domain identity exists.                |
| `@bundjil/effect-persistence` | `src/errors.ts`: tagged-error `message`                                                                                                                | diagnostic            | Safe error text is checked but is not an identifier.                                                                                         |
| `@bundjil/codex-oauth`        | `src/errors/*.ts`: tagged-error `message`; HTTP `statusText`/`contentType`; subscription `providerCode`                                                | diagnostic, transport | Sanitized failure text and provider response metadata are not reusable domain identities.                                                    |
| `@bundjil/codex-oauth`        | `src/schemas.ts`: OAuth provider error response `error`, `error_description`, nested `code`/`message`                                                  | transport, diagnostic | Narrow provider-error decode is used only to validate/sanitize the wire response.                                                            |
| `@bundjil/codex-oauth`        | `src/oauth-token-metadata.ts`: JWT compact-token segments                                                                                              | transport             | Parser-local JWT framing is decoded inside token metadata processing; token ownership remains redacted at the outer boundary.                |
| `@bundjil/codex-oauth`        | `scripts/*.ts`: proof/import result `message` and `errorTag` fields                                                                                    | diagnostic            | Operator-only sanitized CLI result output is neither persisted nor part of a package service contract.                                       |
| `@bundjil/eve-effect`         | `src/errors/schema-error.ts`, `gateway-config-error.ts`, and `operation-error.ts`: `message` and config `setting`                                      | diagnostic            | Tagged-error context is safe checked text, not a cross-boundary semantic value.                                                              |
| `apps/agent`                  | `agent/lib/executor/config.ts` and `agent/lib/sendblue/errors/*.ts`: `message`, `reason`, and webhook `boundary`                                       | diagnostic            | Sanitized config/channel failure context is intentionally not branded.                                                                       |
| `apps/agent`                  | `agent/production-preflight.ts`: read-only Vercel variable `name`, cipher key id, report `checks`/`rejected`; deployment/source/fingerprint validators | transport, diagnostic | Local proof/report parsing has no application service or persisted contract; checked values remain within the read-only preflight operation. |
| `apps/codex-proxy`            | None                                                                                                                                                   | n/a                   | Its remaining direct string Schemas are owner-named `CodexProxyLocalProfileStoreDirectory` and `CodexProxyDiagnosticMessage`.                |

The named but unbranded content, transport, secret, and diagnostic Schemas are
intentional. The rule is owner-named checked contracts at exported or
cross-boundary surfaces, not nominal brands for prose, encrypted values, wire
fragments, or errors.

### Parent Audit Pass 1 - Ownership And Call Graph

Status: Passed after one correction round

- The repository-wide review expanded the original five-owner scope to all
  seven workspaces. It found `@bundjil/core` exporting raw workspace/package
  strings, corrected ownership there, and confirmed `@bundjil/effect-start`
  owns no Bundjil string-domain contract.
- Core now owns `BundjilWorkspaceName`, `BundjilPackageName`, the fixed package
  literal vocabulary, and schema-derived `WorkspaceSummary`. Eve re-exports
  and reuses those exact contracts and translates core parse failure into its
  existing `BundjilAgentSchemaError` boundary.
- Every remaining direct anonymous string declaration is listed above as a
  private transport fragment or safe diagnostic, with no unexplained exported
  or persisted semantic field.

### Parent Audit Pass 2 - Effect Quality And Helper Admission

Status: Passed after one correction round

- `makeWorkspaceSummary` decodes the closed default package vocabulary and the
  complete branded summary through Effect Schema. The existing exported
  `defaultWorkspacePackages` API remains readonly and typed from the named
  literal Schema.
- Owner READMEs and architecture rules require boundary decode/encode,
  canonical imports, and `Match` for material decoded unions while forbidding
  constructor/helper sprawl, DTO mirrors, unsafe brands, production
  `decodeSync`, and manual framework dispatch.
- Final static scans found no new assertion, suppression, `as const`, raw JSON
  helper, `switch`, production synchronous decoder, Promise escape, or
  helper/common/utils module.

### Parent Audit Pass 3 - Verification And Evidence

Status: Passed

- Focused checks, tests, and builds passed for all changed owners: 3 core, 6
  Effect Start, 23 persistence, 103 Codex OAuth, 4 Eve Effect, 60 agent, and 24
  proxy tests.
- Root formatting/type-aware check passed across 421 files with zero findings;
  Knip, seven-workspace typecheck, full verification, full build, task-ledger
  JSON parse, static scans, and `git diff --check` passed.
- No frontend, route, deployment, provider, webhook, OAuth-profile,
  persistence namespace, or Vercel configuration changed. Live-provider and
  browser proof are therefore not applicable.
