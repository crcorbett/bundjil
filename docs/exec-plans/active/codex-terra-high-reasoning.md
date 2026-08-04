---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-08-04
review_trigger: task status, provider effort, Preview proof, authority, or rollback change
spec: ../../product-specs/codex-terra-high-reasoning.md
task_ledger: ../../product-specs/codex-terra-high-reasoning.tasks.json
started: 2026-07-21
---

# Codex Proxy GPT-5.6 Terra High Reasoning

## Current trajectory

The authorized Preview rollout uses the existing agent-bound Upstash resource
only for physical storage. Preview and Production retain distinct subject,
profile, prefix, cipher, access, deployment, and proof boundaries. The
encrypted Preview profile, live Terra/high subscription SSE, and protected Eve
session/replay have been proven without a Production action.

The agent now targets Eve `0.29.5` with AI SDK `^7.0.38` and keeps
`EVE_TRACES_CONTENT=off` as the Preview privacy requirement. The existing
OpenTelemetry hooks remain restricted observability; the replay oracle is the
framework-owned Agent Runs/Workflow-tag surface.

## Current task

Task `authorized-preview-subscription-proof` remains open on the hosted
per-session proxy correlation. Eve `0.29.5` is installed and the local agent
Build Output/package checks pass after updating the AI SDK peer range. The
short-lived project OIDC protected-call path remains the session entry point;
the hosted proof must now read the exact Preview team's Agent Runs and
framework-owned `$eve.*` Workflow tags to show one model attempt before replay
and an unchanged count after `startIndex=0`. Process-global, async-local,
wrapper, static-header, time-window, and CLI-trace substitutes remain rejected.
Production remains out of scope.

## Evidence record

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ownership and call graph | `@bundjil/codex` owns the Responses effort vocabulary, decoded policy, mapper, proof policy, and request encoding; `apps/codex-proxy` owns effort Config, live/local Layer injection, and safe health observation; `apps/agent` owns Eve `0.29.5` model/context selection, instrumentation, and the protected session entry point.         |
| Implementation quality   | The upgrade keeps the existing Effect/schema/provider boundaries unchanged, aligns the AI SDK peer range, keeps `recordInputs`/`recordOutputs` disabled, and adds only the Turbo build-environment contract for `EVE_TRACES_CONTENT`. Packaging assertions now target stable ownership signals rather than minifier-specific bundle paths. |
| Verification coverage    | Local agent build/package tests pass with the upgraded Eve line. Existing Preview receipts prove proxy high/Terra and protected Eve info/session/replay, but the hosted Agent Runs model-attempt count before/after replay remains unproved.                                                                                               |

## Downstream-impact ledger

| Surface                                       | Status          | Reason                                                                                                                                           |
| --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture/product docs                     | Change required | The SPEC/task state now records the installed-Eve API limit and forbids unsafe substitutes. Retain historical gpt-5.5 labels.                    |
| Root, package, and app READMEs/runbooks       | Change required | Eve version, the Preview trace-content setting, and the Agent Runs proof route changed; app and deployment owners now carry the current pointer. |
| `AGENTS.md` and skills                        | Preserve        | Existing Effect/provider and helper-admission rules reject an unowned bridge or wrapper; no instruction conflict was found.                      |
| Schemas, types, services, Layers, exports     | Preserve        | Eve remains a framework boundary; no new service, raw client, schema, or adapter was introduced by the version upgrade.                          |
| Lint, diagnostics, boundary rules, CI/scripts | Change required | The Turbo build contract and version-aware packaging assertions changed; existing Effect and boundary controls remain applicable.                |
| Tests, fixtures, HTTP/provider evidence       | Change required | Packaging tests now match the current Eve bundle shape; hosted proof must use Agent Runs/Workflow tags rather than CLI trace counts.             |
| Observability, rollout, migration, rollback   | Change required | `EVE_TRACES_CONTENT=off`, the framework-owned Agent Runs readback, and the old CLI-trace non-claim are now explicit.                             |
| SPEC, task ledger, active-plan index          | Change required | These current owners record the investigation outcome and future admission predicate.                                                            |

## Preview receipts

The bounded result is
[`codex-terra-preview-blocked-2026-08-03.json`](../../evidence/verification/packets/codex-terra-preview-blocked-2026-08-03.json).
It records the exact Preview deployment IDs, safe configuration metadata,
protected Eve model/context readback, and the blocked proxy readiness predicate.
It does not establish Codex subscription acceptance. A successor authority
must first name the isolated Preview profile, persistence namespace, cipher,
and proof-only Vercel protection path; it must then rerun the proxy proof and
minimal Eve session/replay under a new packet identity.

The successor
[`codex-terra-preview-isolation-blocked-2026-08-04.json`](../../evidence/verification/packets/codex-terra-preview-isolation-blocked-2026-08-04.json)
confirms that no Preview-only writable REST store is currently bound. It makes
no OAuth, deployment, proxy, Eve, or Production claim.

The further successor
[`codex-terra-preview-upstash-billing-blocked-2026-08-04.json`](../../evidence/verification/packets/codex-terra-preview-upstash-billing-blocked-2026-08-04.json)
records the Marketplace direct-store rejection without creating a billing
relationship. It is historical only after the approved shared-store decision.

The current successor
[`codex-terra-preview-shared-upstash-binding-2026-08-04.json`](../../evidence/verification/packets/codex-terra-preview-shared-upstash-binding-2026-08-04.json)
records the approved sensitive REST binding and its metadata readback. It
does not prove reachability, OAuth, an encrypted profile, a deployment, SSE,
or Eve replay.

## Implementation-slice audit

1. **Ownership and call graph.** Eve remains the framework-owned runtime;
   `apps/agent` owns its dependency/build contract and test fixtures, while
   `apps/codex-proxy` and `@bundjil/codex` remain unchanged provider owners.
   The package, lockfile, Turbo allowlist, agent runbooks, SPEC, task ledger,
   and active plan are the affected durable owners. No service, Layer, schema,
   route, provider client, or Production ownership moved.
2. **Effect/config/schema/error boundary.** No runtime adapter or provider
   boundary was widened. The upgrade is dependency and framework-contract
   work only; typed tests now satisfy Eve's `Session`, `RouteHandlerArgs`, and
   `ToolContext` requirements without casts, raw SDK clients, manual codecs,
   or helper abstractions in production code. Existing Effect language-service,
   boundary, and policy checks remain the applicable controls.
3. **Async SSE/resource lifetime and durable replay.** The local Build Output
   assertions still verify Eve-owned channel/workflow construction and all
   agent channel tests pass. This does not claim hosted subscription SSE,
   worker execution, or replay idempotency; those remain gated on the exact
   Preview Agent Runs/Workflow-tag readback.
4. **Privacy/telemetry/evidence retention.** `EVE_TRACES_CONTENT=off` is an
   encrypted Preview build variable and is included in the Turbo contract.
   Existing OTel hooks remain restricted observability with input/output
   capture disabled. No prompt, response, token, credential, raw tag, session
   identifier, or trace payload is retained by this slice.
5. **Verification/docs/rollback/deployment.** Agent and proxy focused tests,
   typecheck, docs/skills/effect/boundary/authority/control/verification
   policy gates, and `git diff --check` pass locally. The source-built Preview
   deployment and Agent Runs proof still need a fresh readback after commit;
   Production remains excluded. Rollback is the prior pinned Eve package and
   prior source deployment, with the Preview-only trace variable removable by
   the target-owned runbook.

## Remaining external work

- Commit and source-deploy the Eve `0.29.5` agent with the encrypted Preview
  `EVE_TRACES_CONTENT=off` variable, then read back the exact Preview team's
  Agent Runs and `$eve.*` Workflow-tag availability. Use only the accessible
  safe model, lineage, completion, and attempt-count predicates to compare the
  original session with `startIndex=0` replay. Do not log prompts, responses,
  tokens, tool data, raw session/turn IDs, or reasoning to satisfy this gate.
- Production is excluded. Do not promote, rotate the accepted Preview profile,
  or change channel ingress as part of the correlation work.

## Superseded 2026-08-04 terminal audit

1. **Ownership and call graph.** The app-owned provider turns its configured
   proxy origin into the fixed `/v1` API root; the proxy still owns its
   OpenAI-compatible route and `@bundjil/codex` owns Responses mapping. No
   authentication, channel, profile, or Production boundary moved.
2. **Implementation quality.** The fix is a single provider-boundary URL
   normalization plus a focused test from an origin input. Evidence retains
   only opaque deployment IDs, statuses, event counts, and booleans; it omits
   values, credentials, profiles, payloads, session IDs, and reasoning.
3. **Verification coverage.** The complete `bun run verification` contract
   passes with the documented synthetic Executor configuration. The new receipt
   proves protected Preview info/session/replay, while the prior proxy receipt
   proves subscription SSE/high. The missing per-session proxy counter remains
   blocked rather than inferred from replay semantics.

The trace-correlation implementation supersedes this three-lens audit. Do not
close the active task until the mandatory five-pass audit in the task ledger is
run against the exact deployed Preview artifact and its sanitized receipt.
