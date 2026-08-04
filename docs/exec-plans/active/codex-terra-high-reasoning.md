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

## Current task

Task `authorized-preview-subscription-proof` is now blocked only on the
SPEC-required per-session proxy correlation. Vercel's short-lived project OIDC
token plus CLI protected-call path reached the immutable Preview agent without
weakening Eve auth. The direct session completed and its durable replay reached
waiting, but the retained receipt has no per-session proxy request counter to
independently prove replay did not trigger a second upstream call. A
version-matched review of installed Eve `0.20.0` found no supported
session/turn-derived model transport header resolver: its instrumentation
runtime context is telemetry-only and hooks are post-durable, observe-only
callbacks. The reviewed replacement candidate is the native Vercel
OpenTelemetry trace chain, with W3C propagation restricted to the private
proxy and inbound context continuation at its HTTP boundary. Process-global,
async-local, wrapper, static-header, and time-window substitutes are rejected.
Production remains out of scope.

## Evidence record

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | `@bundjil/codex` owns the Responses effort vocabulary, decoded policy, mapper, proof policy, and request encoding; `apps/codex-proxy` owns effort Config, live/local Layer injection, and safe health observation; `apps/agent` owns Eve model/context selection.                                                                                             |
| Implementation quality   | Tasks 1–3 use schema-derived Type/Encoded contracts, named policy/config services, typed errors, and explicit live/local/test Layers. Proxy configuration is decoded solely in `apps/codex-proxy/src/env.ts`; a fallback provider preserves absent-key `low` without masking invalid input.                                                                   |
| Verification coverage    | The source-built Preview proxy proves `live`/ready/high, Terra mapping, both `401` controls, completed subscription SSE, and leak predicates. The corrected source-built agent proves protected Terra/1050000 info, session `202`, and `startIndex=0` replay through completion/waiting without failure. Only per-session proxy correlation remains unproved. |

## Downstream-impact ledger

| Surface                                       | Status          | Reason                                                                                                                                                        |
| --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture/product docs                     | Change required | The SPEC/task state now records the installed-Eve API limit and forbids unsafe substitutes. Retain historical gpt-5.5 labels.                                 |
| Root, package, and app READMEs/runbooks       | Preserve        | No executable proxy/agent or operator procedure changed. Existing README/runbook owners already route this proof; none may claim an unsupported correlation.  |
| `AGENTS.md` and skills                        | Preserve        | Existing Effect/provider and helper-admission rules reject an unowned bridge or wrapper; no instruction conflict was found.                                   |
| Schemas, types, services, Layers, exports     | Change required | The trace continuation/config boundary must use owning schemas and named Vercel/Effect adapter operations; it may not leak a raw OTel client.                 |
| Lint, diagnostics, boundary rules, CI/scripts | Change required | Add focused trace propagation and no-input/output-export tests. Existing rules must reject raw configuration and client escape hatches.                       |
| Tests, fixtures, HTTP/provider evidence       | Change required | Prove local W3C propagation and one completion span; Preview proof then compares one model attempt before replay with the unchanged trace count after replay. |
| Observability, rollout, migration, rollback   | Change required | Define restricted propagation, no third-party drain/exporter, CLI trace readback, sanitized receipt, halt/revocation, and no-Production boundary.             |
| SPEC, task ledger, active-plan index          | Change required | These current owners record the investigation outcome and future admission predicate.                                                                         |

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

## Terminal audit

1. **Ownership and call graph.** This slice changes only evidence owners: the
   product SPEC and task ledger own the target and lifecycle, the active plan
   owns execution status, and the verification packet/detail own dated
   provider observation. No provider, Effect service, Layer, schema, request
   mapper, app route, or component ownership moved.
2. **Implementation quality.** No TypeScript implementation changed. The
   retained JSON is schema-validated by the existing verification gate, uses
   opaque deployment IDs and safe enum/status fields, and deliberately omits
   variable values, endpoints, bearer material, profiles, prompts, bodies,
   responses, tool data, and reasoning. There is no new helper, wrapper,
   manual codec, unsafe cast, raw configuration read, or lint exception.
3. **Verification coverage.** Vercel readback proves source-built Preview
   candidates, high configuration, and the protected Eve model/context. The
   proxy health/readiness and bounded probe prove the stop before upstream
   completion. Repository documentation, authority, control, verification,
   Effect setup, boundary, focused package, build, smoke, agent, and harness
   checks are rerun at closeout; live subscription SSE and Eve replay remain
   explicit blocked predicates, not inferred coverage.

## Remaining external work

- Add the reviewed native Vercel OpenTelemetry trace boundary: restricted
  agent-to-proxy propagation, proxy incoming-context continuation, safe
  completion span, and a trace-count proof before and after `startIndex=0`
  replay. Do not log prompts, responses, tokens, tool data, raw session/turn
  IDs, or reasoning to satisfy this gate.
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
