---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-agent-architecture-owner
created: 2026-07-24
last_reviewed: 2026-07-24
review_trigger: runtime task status, Eve adapter, ManagedRuntime, Fiber, Scope, waitUntil, provider composition, proof, or rollback change
spec: ../../product-specs/eve-channel-runtime-ownership.md
task_ledger: ../../product-specs/eve-channel-runtime-ownership.tasks.json
started: 2026-07-24
---

# Eve Channel runtime ownership and supervision

## Current trajectory

Implement the three accepted tasks serially:

1. prove independent provider-runtime build, concurrency, failure, disposal,
   and fresh-runtime recovery behavior without changing production code;
2. replace accepted global-Scope dispatch with the concrete provider
   runtime's supervised Fiber and native Eve `waitUntil` completion; and
3. reconcile durable architecture, app, SPEC/task, plan, fixture, proof, and
   lifecycle owners before repository closeout.

The implementation remains repository-only. It does not include the optional
Preview readback and grants no deployment, provider, credential, message, or
Production authority.

## Baseline and Git identity

- Worktree:
  `/Users/cooper/.codex/worktrees/cb3f2a4d-d866-420e-a3f8-5d4c76e5c9c8/bundjil`.
- Starting revision:
  `61992a2fa220313530dc7a8b3d54ec970a7483ec`.
- Git state: detached HEAD with a clean tracked worktree before implementation.
- Starting commit:
  `docs: align Eve runtime spec with harness contract`.
- The starting revision contains
  `docs/product-specs/eve-channel-runtime-ownership.md` and
  `docs/product-specs/eve-channel-runtime-ownership.tasks.json`.
- The worktree `bun.lock` matches the canonical checkout used to inspect
  installed `effect@4.0.0-beta.74` and `eve@0.20.0` source.

## Current task

`prove-provider-runtime-behavior` is accepted and awaiting its required
coherent commit. The accepted slice creates the test-owned runtime fixture and
changes no production Service, Layer, Schema, Config, export, provider adapter,
or Photon SDK lifetime. `supervise-accepted-eve-background-work` starts only
after that commit.

## Accepted-finding boundary

Only `FINDING-001` through `FINDING-004` enter required implementation.
Optional `FINDING-005` remains outside the required task array and is not
authorised. The primary trajectory remains accountable for all four accepted
findings and `EVE-RUNTIME-REQ-001` through `EVE-RUNTIME-REQ-004`.

## Task progress

| Task                                             | Status    | Acceptance receipt                                                                                                                                                           |
| ------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prove-provider-runtime-behavior`                | Completed | Two focused runtime tests, 59 agent tests, direct policy gates, docs-inventory reconciliation, and a fresh full repository verification passed; coherent task commit pending |
| `supervise-accepted-eve-background-work`         | Pending   | Must not begin until the runtime-proof task is accepted and committed                                                                                                        |
| `reconcile-runtime-docs-and-repository-closeout` | Pending   | Must not begin until both code tasks are accepted and committed                                                                                                              |

## Risk-lens evidence

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Task 1 changes only `apps/agent/test/channel-runtime.test.ts` plus lifecycle docs. Production `ManagedRuntime.make` remains only in the Sendblue and Photon module edges; the new runtimes and disposal calls are test-owned. Separate provider roots, Service tags, Config acquisition, Scopes, and Photon per-operation SDK ownership remain unchanged.                                               |
| Implementation quality   | The focused fixture uses canonical decoded Schemas, provider memory Layers, separate `ManagedRuntime`s, `Deferred` concurrency gates, `Ref` acquisition/finalizer counts, `Effect.acquireRelease`, `Exit`, `Cause`, and `Option`. Review found no unsafe cast, manual codec/mapper, DTO, runtime/runner wrapper, helper module, generic callback, shared `MemoMap`, suppression, or boundary exception. |
| Verification coverage    | Task 1 passed 2 focused runtime tests, Effect-enabled agent typechecking without a language-service diagnostic, 59 agent tests, all direct policy gates, HGI-307 evaluation after its 180-path inventory reconciliation, and a fresh full `bun run verification`. Unit proof is deliberately not claimed as Vercel/function cardinality evidence.                                                       |

## Downstream-impact ledger

| Surface                                                           | Decision before first slice                                                             | Earliest owner, action, verification, proof, limitations, and non-claims                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and durable docs                                     | Preserve in task 1; Change required in tasks 2–3                                        | `docs/architecture/eve-agent.md` changes only after the supervised implementation exists. `docs/architecture/effect-patterns.md`, `repo-structure.md`, and `testing-and-quality.md` already own the applicable rules and remain Preserve unless the actual diff contradicts them. Local checks prove repository source only.                                                             |
| Root, app, and package READMEs                                    | Preserve in task 1; Change required for `apps/agent/README.md` in task 3                | No public app behavior changes in the test-only slice. Channel, Sendblue, Photon, Store, Eve, Codex, and proxy READMEs remain Preserve because their public contracts do not change. Photon continues to own per-operation `acquireUseRelease`.                                                                                                                                          |
| API/generated references and exports                              | Preserve                                                                                | No Schema, Type/Encoded alias, Service tag, Layer export, package export, generated API, or command surface changes. Boundary/typecheck/Knip checks verify this; no hosted claim follows.                                                                                                                                                                                                |
| Runbooks and authority                                            | Preserve                                                                                | `apps/agent/runbooks/**`, authority registers, controls, and provider procedures do not change. Repository implementation authority does not authorize Preview, Production, credentials, provider writes, messages, or deployment.                                                                                                                                                       |
| Verification journeys, proof, and dated evidence                  | Preserve current owners; Change required in focused fixtures and implementation receipt | `docs/verification/**` remains the owner for any separately authorised hosted packet. Repository journeys are proved by focused tests, build/source scans, and this plan; they do not prove Vercel lifecycle, provider state, or handset behavior.                                                                                                                                       |
| Skills and `AGENTS.md`                                            | Preserve                                                                                | The requested PRD implementer, docs maintainer, and effect-client-wrapper instructions already govern the slice. No skill, mirror, agent instruction, or harness profile source change is needed.                                                                                                                                                                                        |
| Lint, config, commands, CI, and workflows                         | Preserve executable rules; Change required for HGI-307 docs inventory                   | Existing Effect setup, boundary, docs, skills, authority, controls, verification, lint, Knip, typecheck, test, and build commands remain sufficient. Adding the required active-plan path changed the executable docs inventory from 179 to 180 paths; `docs/documentation-audit/HGI-307-impact-ledger.json` now owns the corrected count/digest. No exception or suppression was added. |
| Schemas, services, Layers, provider boundaries, and runtime roots | Preserve production owners                                                              | Task 1 creates test-local Layers only. Sendblue and Photon production composition roots remain separate; no shared `MemoMap`, combined runtime, provider eager loading, Config change, Service-tag redesign, or Photon lifetime change is allowed.                                                                                                                                       |
| Tests and fixtures                                                | Change required                                                                         | Create `apps/agent/test/channel-runtime.test.ts`; later update `sendblue-channel.test.ts`. Retain config, vertical, build-route, Channel, Sendblue, Photon, preflight, and packaging fixtures. Owner is the affected app/package test suite; no fixture is retired.                                                                                                                      |
| SPEC, tasks, active plan, and lifecycle pointers                  | Change required                                                                         | The SPEC/task ledger, this plan, product index, and active-plan index record current intent and per-task evidence. They move to implemented/completed routing only after every accepted task passes.                                                                                                                                                                                     |
| Receipts and evidence artifacts                                   | Change required in plan; no new hosted packet                                           | Task receipts record exact revision, commands, postconditions, risk lenses, limitations, non-claims, and rollback identity here and in the task ledger. No provider/deployment receipt is created.                                                                                                                                                                                       |
| Migration, release, and rollback                                  | Preserve; no data migration or release                                                  | Repository rollback is exact Git reversion of each coherent task commit to starting revision `61992a2fa220313530dc7a8b3d54ec970a7483ec`. No replay clearing, provider retry, credential rebinding, deployment rollback, or release action occurs.                                                                                                                                        |
| Frontend/browser                                                  | N/A after inspecting the app call graph                                                 | No React route, visible text, client state, URL state, browser response, or accessibility surface changes. Browser screenshots are not applicable.                                                                                                                                                                                                                                       |

## Stop conditions

Stop acceptance on any failed or inconclusive required check, missing committed
owner, unaccounted boundary exception, unsafe cast, runner/helper abstraction,
global-Scope accepted work, per-request runtime lifecycle, combined provider
runtime, shared `MemoMap`, eager provider config, Photon lifetime change, or
unbounded external-state claim. Correct repository findings in the owning
slice; do not substitute optional hosted evidence for deterministic local
proof.
