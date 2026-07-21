---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-product-owner
spec: ../../product-specs/codex-terra-high-reasoning.md
task_ledger: ../../product-specs/codex-terra-high-reasoning.tasks.json
started: 2026-07-21
---

# Codex Proxy GPT-5.6 Terra High Reasoning

## Current trajectory

Implement the package contract and proxy configuration first, then align the
agent's build-time model metadata and local proof contract. The live Preview
subscription-endpoint proof is deliberately pending: this execution authority
does not authorize Vercel deployment or environment mutation.

## Current task

Repository tasks 1–3 and 5 are complete. Task
`authorized-preview-subscription-proof` remains pending explicit deployment
authority.

## Evidence record

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | `@bundjil/codex` owns the Responses effort vocabulary, decoded policy, mapper, proof policy, and request encoding; `apps/codex-proxy` owns effort Config, live/local Layer injection, and safe health observation; `apps/agent` owns Eve model/context selection.                                                                                                                                                                                        |
| Implementation quality   | Tasks 1–3 use schema-derived Type/Encoded contracts, named policy/config services, typed errors, and explicit live/local/test Layers. Proxy configuration is decoded solely in `apps/codex-proxy/src/env.ts`; a fallback provider preserves absent-key `low` without masking invalid input.                                                                                                                                                              |
| Verification coverage    | Task 1 passed store build, focused Codex typecheck/tests (110), Effect setup, boundary, skill, and full verification gates. Task 2 passed proxy typechecking/tests (31), including captured Terra/high outbound payload. Task 3 passed agent tests (79) with synthetic explicit Executor mode, proxy build/smoke checks, and proof fixtures. Task 5 reran full `bun run verification`; Live Preview proof remains pending explicit deployment authority. |

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

## Deferred external work

- No Vercel environment write, deployment, provider request, credential
  rotation, or Production action has been performed.
- Task `authorized-preview-subscription-proof` remains pending explicit
  target-owned deployment authority after repository acceptance.
