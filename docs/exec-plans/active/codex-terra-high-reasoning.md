---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-08-03
review_trigger: task status, provider effort, Preview proof, authority, or rollback change
spec: ../../product-specs/codex-terra-high-reasoning.md
task_ledger: ../../product-specs/codex-terra-high-reasoning.tasks.json
started: 2026-07-21
---

# Codex Proxy GPT-5.6 Terra High Reasoning

## Current trajectory

Repository implementation is complete. The authorized 2026-08-03 Preview
rollout deployed both source-built candidates from `f1b11907c29464423ddcb3ffabac6bf9f0694770`,
set the proxy high-effort and agent Terra/context configuration, and read back
the protected Eve model identity. The live subscription proof is blocked: the
proxy is `live` and `high` but not ready because its Preview profile,
persistence, and cipher are not provisioned as an isolated configuration.

## Current task

Repository tasks 1–3 and 5 are complete. Task
`authorized-preview-subscription-proof` is blocked after its authorized
Preview stage; see the dated packet before any further provider mutation.

## Evidence record

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | `@bundjil/codex` owns the Responses effort vocabulary, decoded policy, mapper, proof policy, and request encoding; `apps/codex-proxy` owns effort Config, live/local Layer injection, and safe health observation; `apps/agent` owns Eve model/context selection.                                                                                                 |
| Implementation quality   | Tasks 1–3 use schema-derived Type/Encoded contracts, named policy/config services, typed errors, and explicit live/local/test Layers. Proxy configuration is decoded solely in `apps/codex-proxy/src/env.ts`; a fallback provider preserves absent-key `low` without masking invalid input.                                                                       |
| Verification coverage    | Tasks 1–5 retain their focused/local gates. The authorized Preview readback proves source-built READY deployments, proxy `live`/`high`, and protected Eve `bundjil-codex-proxy/gpt-5.6-terra` with `1050000`; the bounded proxy proof exited `1` as `request_failed` because health was `503` not-ready. It did not reach subscription SSE or Eve session/replay. |

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

## 2026-08-03 Preview receipt

The bounded result is
[`codex-terra-preview-blocked-2026-08-03.json`](../../evidence/verification/packets/codex-terra-preview-blocked-2026-08-03.json).
It records the exact Preview deployment IDs, safe configuration metadata,
protected Eve model/context readback, and the blocked proxy readiness predicate.
It does not establish Codex subscription acceptance. A successor authority
must first name the isolated Preview profile, persistence namespace, cipher,
and proof-only Vercel protection path; it must then rerun the proxy proof and
minimal Eve session/replay under a new packet identity.

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

## Deferred external work

- No Vercel environment write, deployment, provider request, credential
  rotation, or Production action has been performed.
- Task `authorized-preview-subscription-proof` remains pending explicit
  target-owned deployment authority after repository acceptance.
