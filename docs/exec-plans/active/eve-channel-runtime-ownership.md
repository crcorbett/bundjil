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

`prove-provider-runtime-behavior` is accepted in commit
`0c9082c8685a0fdd2512ea92222fad8022b86941`.
`supervise-accepted-eve-background-work` is accepted and awaiting its coherent
commit. It changes only the shared Eve framework adapter, focused route tests,
and the now-implemented durable architecture/app owners; provider Services,
Layers, Schemas, Config, exports, runtime roots, replay policy, timeouts, and
Photon SDK lifetime remain preserved.

## Accepted-finding boundary

Only `FINDING-001` through `FINDING-004` enter required implementation.
Optional `FINDING-005` remains outside the required task array and is not
authorised. The primary trajectory remains accountable for all four accepted
findings and `EVE-RUNTIME-REQ-001` through `EVE-RUNTIME-REQ-004`.

## Task progress

| Task                                             | Status    | Acceptance receipt                                                                                                                                                                                                          |
| ------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prove-provider-runtime-behavior`                | Completed | Commit `0c9082c8685a0fdd2512ea92222fad8022b86941`; two focused runtime tests, 59 agent tests, direct policy gates, docs-inventory reconciliation, and a fresh full repository verification passed                           |
| `supervise-accepted-eve-background-work`         | Completed | Direct provider `runFork`, native `Fiber.await` waitUntil completion, five focused route tests, 62 agent tests, 25 Photon tests, direct policy gates, and full repository verification passed; coherent task commit pending |
| `reconcile-runtime-docs-and-repository-closeout` | Pending   | Must not begin until both code tasks are accepted and committed                                                                                                                                                             |

## Risk-lens evidence

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Tasks 1–2 keep production `ManagedRuntime.make` only in the Sendblue and Photon module edges. The shared Eve adapter receives the concrete runtime, returns accepted work from request preparation, and alone calls `runFork`; the runtime Scope owns the Fiber and Eve receives its native completion. Test runtimes/disposal remain test-owned. Separate provider roots, Config acquisition, Service tags, and Photon SDK lifetime remain unchanged.                       |
| Implementation quality   | The implementation uses direct `ManagedRuntime.runFork` plus `Effect.runPromise(Fiber.await(fiber).pipe(Effect.asVoid))`. Tests use canonical decoded Schemas, explicit Layers, `Deferred`, `Ref`, `Effect.acquireRelease`, `Exit`, `Cause`, and `Option`. Review found no unsafe cast, manual codec/mapper, DTO, runtime/runner wrapper, helper module, generic callback, shared `MemoMap`, suppression, boundary exception, request-signal coupling, or new timeout/retry. |
| Verification coverage    | Task 1 passed 2 runtime tests. Task 2 passed 5 route tests covering success, typed failure, defect, interruption/finalizer, waitUntil ordering, abort independence, exact dispatch count, and preserved statuses; 18 affected tests, 62 agent tests, and 25 Photon tests passed. Effect-enabled typechecking, all direct policy gates, HGI-307 evaluation, and fresh full repository verification passed. These are repository/local-build claims only.                      |

## Downstream-impact ledger

| Surface                                                           | Decision before first slice                                                             | Earliest owner, action, verification, proof, limitations, and non-claims                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and durable docs                                     | Change required for `docs/architecture/eve-agent.md`; other standards Preserve          | The Eve architecture now owns provider-root cardinality, concrete runtime interpretation, supervised Fiber/waitUntil, disposal limits, local/deployment proof separation, and test call graphs. `effect-patterns.md`, `repo-structure.md`, and `testing-and-quality.md` already own the unchanged general rules. Local checks prove repository source only.                              |
| Root, app, and package READMEs                                    | Change required for `apps/agent/README.md`; all other READMEs Preserve                  | The agent README now states the implemented provider runtime and waitUntil boundary without external actuality. Channel, Sendblue, Photon, Store, Eve, Codex, and proxy public contracts do not change. Photon continues to own per-operation `acquireUseRelease`.                                                                                                                       |
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
