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
independently prove replay did not trigger a second upstream call. Production
remains out of scope.

## Evidence record

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | `@bundjil/codex` owns the Responses effort vocabulary, decoded policy, mapper, proof policy, and request encoding; `apps/codex-proxy` owns effort Config, live/local Layer injection, and safe health observation; `apps/agent` owns Eve model/context selection.                                                                                             |
| Implementation quality   | Tasks 1–3 use schema-derived Type/Encoded contracts, named policy/config services, typed errors, and explicit live/local/test Layers. Proxy configuration is decoded solely in `apps/codex-proxy/src/env.ts`; a fallback provider preserves absent-key `low` without masking invalid input.                                                                   |
| Verification coverage    | The source-built Preview proxy proves `live`/ready/high, Terra mapping, both `401` controls, completed subscription SSE, and leak predicates. The corrected source-built agent proves protected Terra/1050000 info, session `202`, and `startIndex=0` replay through completion/waiting without failure. Only per-session proxy correlation remains unproved. |

## Downstream-impact ledger

| Surface                                       | Status          | Reason                                                                                                                                                                                            |
| --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture/product docs                     | Change required | Update the SPEC/task state and current runbooks as implementation completes; retain historical gpt-5.5 proof labels.                                                                              |
| Root, package, and app READMEs/runbooks       | N/A by HGI-300  | Current app README owners intentionally exclude provider actuality and operator runbooks; the SPEC, task ledger, environment sample, and architecture owner retain the target and proof boundary. |
| `AGENTS.md` and skills                        | N/A             | Current instructions already own this provider/config pattern; no contradiction found.                                                                                                            |
| Schemas, types, services, Layers, exports     | Change required | Add the provider effort/policy contract and explicit live/test wiring.                                                                                                                            |
| Lint, diagnostics, boundary rules, CI/scripts | Change required | Test the new source with the existing language-service, boundary, skill, and verification gates; change Turbo/proof script in later slices.                                                       |
| Tests, fixtures, HTTP/provider evidence       | Change required | Add deterministic mapper/config/handler tests; Preview proof requires separate authority.                                                                                                         |
| Observability, rollout, migration, rollback   | Change required | Define safe policy observation and target/rollback documentation before any deployment task.                                                                                                      |
| SPEC, task ledger, active-plan index          | Change required | This active plan and the sibling ledger record accepted task evidence.                                                                                                                            |

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

- Add a reviewed, safe per-session correlation between an Eve session and the
  proxy completion boundary, then rerun the bounded replay proof. Do not log
  prompts, responses, tokens, tool data, or reasoning to satisfy this gate.
- Production is excluded. Do not promote, rotate the accepted Preview profile,
  or change channel ingress as part of the correlation work.

## 2026-08-04 terminal audit

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
