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

`proxy-config-and-layer-injection` — in progress.

## Evidence record

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Accepted Task 1 establishes `@bundjil/codex` as the owner of the Responses effort vocabulary, decoded request policy, mapper, proof policy, and request encoding. The current task adds app-owned config and provides that decoded policy into proxy live/local/mock composition; `apps/agent` retains model selection. |
| Implementation quality   | Task 1 uses schema-derived Type/Encoded contracts and a named policy service/layer; its mapper/proof operations remain flat and typed. Task 2 must keep Config parsing solely in `apps/codex-proxy/src/env.ts`, expose no raw option or environment read to the package, and preserve explicit Layer composition.       |
| Verification coverage    | Task 1 passed store build, focused Codex typecheck/tests (110), Effect setup, boundary, skill, and full verification gates. Task 2 adds config, handler, and proxy build/smoke checks. Live Preview proof is pending explicit deployment authority.                                                                     |

## Downstream-impact ledger

| Surface                                       | Status          | Reason                                                                                                                                      |
| --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture/product docs                     | Change required | Update the SPEC/task state and current runbooks as implementation completes; retain historical gpt-5.5 proof labels.                        |
| Root, package, and app READMEs/runbooks       | Change required | Target configuration, proof boundary, and rollback documentation changes in the agent/proxy alignment slice.                                |
| `AGENTS.md` and skills                        | N/A             | Current instructions already own this provider/config pattern; no contradiction found.                                                      |
| Schemas, types, services, Layers, exports     | Change required | Add the provider effort/policy contract and explicit live/test wiring.                                                                      |
| Lint, diagnostics, boundary rules, CI/scripts | Change required | Test the new source with the existing language-service, boundary, skill, and verification gates; change Turbo/proof script in later slices. |
| Tests, fixtures, HTTP/provider evidence       | Change required | Add deterministic mapper/config/handler tests; Preview proof requires separate authority.                                                   |
| Observability, rollout, migration, rollback   | Change required | Define safe policy observation and target/rollback documentation before any deployment task.                                                |
| SPEC, task ledger, active-plan index          | Change required | This active plan and the sibling ledger record accepted task evidence.                                                                      |

## Deferred external work

- No Vercel environment write, deployment, provider request, credential
  rotation, or Production action has been performed.
- Task `authorized-preview-subscription-proof` remains pending explicit
  target-owned deployment authority after repository acceptance.
