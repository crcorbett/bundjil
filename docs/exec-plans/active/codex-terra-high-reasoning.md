---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-08-09
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
OpenTelemetry hooks remain restricted observability. The accessible replay
metadata is the Vercel Agent Runs model/deployment/lifecycle/step/hook surface;
the strict no-second-upstream-call oracle is reopened as a new implementation
slice requiring both a supported Eve/provider correlation seam and a durable
atomic proxy receipt.

## Current task

Task `authorized-preview-subscription-proof` remains blocked at the lower
metadata ceiling. Its first successor, `eve-supported-provider-correlation`,
is now also blocked: installed Eve `0.29.5` has no public per-step value that a
dynamic `LanguageModel` resolver can carry to the proxy. The dated local
receipt records the exact limitation without a speculative bridge. The atomic
receipt and correlated Preview replay tasks must not start. Eve `0.29.5` is
installed and the local agent Build Output/package checks pass after updating
the AI SDK peer range. The short-lived project OIDC protected-call path proved
the upgraded Preview info, session, and replay; Agent Runs metadata proved
Terra, immutable deployment, run lifecycle, and stable step/hook counts before
and after replay. Process-global, async-local, wrapper, static-header,
time-window, internal harness, generic-KV, and CLI-trace substitutes remain
rejected. Production remains out of scope.

## Reopened correlation and receipt slice

The implementation order is deliberately narrow:

1. `eve-supported-provider-correlation` is blocked by
   [`codex-terra-eve-correlation-blocked-2026-08-09.json`](../../evidence/verification/packets/codex-terra-eve-correlation-blocked-2026-08-09.json).
   `runtimeContext`, the post-emission stream `meta.id`, and internal
   `InstrumentationAttemptScope` are not a public pre-egress correlation seam.
2. `proxy-atomic-attempt-receipt` remains pending and must not start without
   the supported correlation value. It would otherwise reuse
   `AtomicKeyValueStore` with `Effect.Clock`, explicit live/memory Layers, and
   safe `Effect.logInfo` diagnostics.
3. `correlated-preview-replay-proof-and-closeout` remains pending and must not
   start. It requires both preceding tasks before it can read a receipt before
   and after `startIndex=0` replay or run the terminal five-pass audit.

The prior 2026-08-04 Preview packet and terminal audit remain valid lower-bound
evidence for the Eve upgrade and hosted session/replay metadata. They do not
close this reopened strict predicate and must not be rewritten as proof of a
second-request absence.

## Evidence record

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | `@bundjil/codex` owns Responses effort, correlation, provider-egress, and receipt contracts; `@bundjil/store` owns AtomicKeyValueStore; `apps/codex-proxy` owns ingress, receipt composition, and safe logs; `apps/agent` owns Eve `0.29.5` model/context selection, public correlation seam, instrumentation, and protected session entry. |
| Implementation quality   | The upgrade keeps the existing Effect/schema/provider boundaries, and the reopened slice must add no internal Eve import, generic KV mutation, route-only counter, raw identifier, or helper/wrapper sprawl. It must use schema-derived contracts, explicit Layers, Effect Clock, and stream-finalization lifecycle observation.            |
| Verification coverage    | The new Preview receipt proves Terra/1050000 info, protected session completion, identical replay event counts, and accessible Agent Runs metadata only as lower-bound evidence. The pending tasks must add correlation, atomic receipt transitions, provider-egress observation, and new protected replay proof.                           |

## Downstream-impact ledger

| Surface                                       | Status          | Reason                                                                                                                                                                                        |
| --------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture/product docs                     | Change required | The SPEC/task state now records the installed-Eve API limit and forbids unsafe substitutes. Retain historical gpt-5.5 labels.                                                                 |
| Root, package, and app READMEs/runbooks       | Change required | Eve version, the Preview trace-content setting, and the Agent Runs proof route changed; app and deployment owners now carry the current pointer.                                              |
| `AGENTS.md` and skills                        | Preserve        | Existing Effect/provider and helper-admission rules reject an unowned bridge or wrapper; no instruction conflict was found.                                                                   |
| Schemas, types, services, Layers, exports     | Change required | The reopened slice adds branded correlation/receipt schemas and reuses AtomicKeyValueStore with explicit live/memory Layers; no generic persistence service is permitted.                     |
| Lint, diagnostics, boundary rules, CI/scripts | Change required | The Turbo build contract and version-aware packaging assertions changed; the reopened tasks must enforce public Eve imports, Effect Clock, boundary decoding, and no helper/KV/process joins. |
| Tests, fixtures, HTTP/provider evidence       | Change required | Packaging tests match the current Eve bundle shape; new fixtures must prove actual provider correlation, atomic transitions, stream interruption, duplicate replay, and safe logs.            |
| Observability, rollout, migration, rollback   | Change required | `EVE_TRACES_CONTENT=off`, Agent Runs lower-bound evidence, receipt retention/recovery, safe logs, unknown-state handling, and the old CLI-trace non-claim are explicit.                       |
| SPEC, task ledger, active-plan index          | Change required | These current owners record the new task sequence and invalidate the prior terminal status for the reopened strict predicate.                                                                 |

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

The upgraded Preview successor
[`codex-terra-preview-live-eve-upgraded-2026-08-04.json`](../../evidence/verification/packets/codex-terra-preview-live-eve-upgraded-2026-08-04.json)
records the Ready Eve `0.29.5` deployment, exact Terra/1050000 info, protected
session completion, identical `startIndex=0` replay event counts, and the
accessible Agent Runs metadata. It keeps the task blocked because the current
surface exposes no `$eve.*` Workflow tags or per-session model/proxy-attempt
counter.

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
   assertions still verify Eve-owned channel/workflow construction, and the
   hosted protected session plus replay each reached `message.completed` and
   `session.waiting` with matching safe event counts. The durable stream remains
   open after waiting by design. The accessible Agent Runs step/hook metadata
   is unchanged, but no per-session model/proxy-attempt counter exists, so
   replay idempotency at the private proxy remains unproved.
4. **Privacy/telemetry/evidence retention.** `EVE_TRACES_CONTENT=off` is an
   encrypted Preview build variable and is included in the Turbo contract.
   Existing OTel hooks remain restricted observability with input/output
   capture disabled. No prompt, response, token, credential, raw tag, session
   identifier, or trace payload is retained by this slice.
5. **Verification/docs/rollback/deployment.** Agent and proxy focused tests,
   typecheck, docs/skills/effect/boundary/authority/control/verification
   policy gates, and `git diff --check` pass locally. The source-built Preview
   deployment, encrypted-variable metadata, protected Eve proof, and Agent
   Runs metadata are freshly read back in the new detail/packet. Production
   remains excluded. Rollback is the prior pinned Eve package and prior source
   deployment, with the Preview-only trace variable removable by the
   target-owned runbook.

## Remaining external work

- The upgraded Preview proof remains complete only up to the accessible
  metadata ceiling. The new local receipt blocks the public correlation
  prerequisite: the exact Personal Eve `0.29.5` API exposes no pre-egress
  per-step identity. Do not call the strict predicate accepted.
- A future upstream Eve API may reopen the task sequence: public
  Eve/provider correlation, atomic provider-boundary receipt, and protected
  Preview replay proof. It must preserve the current OIDC/protection boundary
  and use the existing AtomicKeyValueStore, not a generic relay, static header,
  time-window join, raw trace capture, internal Eve import, or process-local
  bridge.
- The receipt must be attached to actual provider egress and stream finalization
  so provider-owned 401 refresh retries and lazy SSE consumption are not hidden
  by a route-level counter. Unknown crash state must remain fail-closed or use
  an explicitly owned recovery procedure.
- Production is excluded. Do not promote, rotate the accepted Preview profile,
  or change channel ingress as part of this correlation work.

## 2026-08-05 SPEC revision and audit lifecycle

This revision changes current implementation intent after the prior upgrade was
accepted. The 2026-08-04 five-pass audit remains retained historical evidence
for that earlier slice; it is not a terminal audit of the new correlation and
receipt tasks. The final successor task must refresh the proof packet, rollback
identity, docs-maintainer ledger, and all five lenses on the exact
receipt-bearing Preview artifact before the strict predicate can close.

## 2026-08-04 terminal five-pass audit

1. **Ownership and call graph.** The dependency upgrade remains owned by
   `apps/agent`; Eve owns durable session/turn/workflow execution, the proxy
   owns the private OpenAI-compatible boundary, and `@bundjil/codex` owns
   Responses mapping. The new packet/detail are verification owners. The
   source-built candidate is the immutable Preview deployment
   `dpl_EsvxWbAHM6NBCJ82rQYEP8Va7uC1`; no Production owner or channel route was
   changed.
2. **Effect/config/schema/error boundary.** The deployed slice introduced no
   new runtime service, Layer, provider client, DTO, manual codec, unsafe cast,
   or helper abstraction. Eve `0.29.5`, AI lock `7.0.51`, the Turbo
   `EVE_TRACES_CONTENT` allowlist, and the existing typed fixtures are the
   complete implementation surface. Local Effect, boundary, and type gates
   are the applicable controls.
3. **Async SSE/resource lifetime and durable replay.** A protected session
   returned `202`; both the initial and `startIndex=0` replay streams reached
   `message.completed` and `session.waiting` with identical safe counts and no
   failure. Agent Runs inventory and selected run lifecycle/step/hook metadata
   were unchanged. The missing per-session model/proxy-attempt counter is an
   explicit blocking finding, not an inferred pass.
4. **Privacy/telemetry/evidence retention.** Preview `EVE_TRACES_CONTENT=off`
   was read back as encrypted and undecrypted. No trace endpoint was called;
   only model, deployment, lifecycle, counts, event names, and booleans were
   retained. The packet contains no prompt, response, token, credential,
   session/run ID, raw tag, or trace payload.
5. **Verification/docs/rollback/deployment.** The new detail, packet, SPEC,
   task ledger, active plan, runbook, verification router, and HGI-307 impact
   owner are reconciled. The exact Ready Preview deployment and encrypted
   variable metadata were read back. Focused and full repository checks are
   rerun at closeout; rollback remains the prior Preview deployment/config and
   no Production action is claimed.

Audit result: repository, deployment, protected Eve session/replay, and
available Agent Runs metadata predicates pass; the strict independent
no-second-upstream-call predicate remains blocked because its required
per-session counter is unavailable.

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
