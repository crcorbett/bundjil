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
| all owners                    | tagged error message/cause text                                                 | anonymous checked strings            | diagnostic; do not brand                                               |
| parsers/adapters              | header values, JSON/SSE lines, serialized bytes                                 | strings                              | named boundary Schema where exported; parser-local transport otherwise |

## Task 1 - Establish Audit And Rules

Status: In progress

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

Status: Pending

## Task 4 - Documentation And Final Audit

Status: Pending
