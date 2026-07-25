---
document_type: execution-plan
lifecycle: historical
authority: supporting
owner: bundjil-agent-architecture-owner
created: 2026-07-24
last_reviewed: 2026-07-24
review_trigger: runtime task status, Eve adapter, ManagedRuntime, Fiber, Scope, waitUntil, provider composition, proof, or rollback change
spec: ../../product-specs/eve-channel-runtime-ownership.md
task_ledger: ../../product-specs/eve-channel-runtime-ownership.tasks.json
started: 2026-07-24
completed: 2026-07-24
---

# Eve Channel runtime ownership and supervision

## Completed closeout

The three accepted tasks were implemented serially:

1. prove independent provider-runtime build, concurrency, failure, disposal,
   and fresh-runtime recovery behavior without changing production code;
2. replace accepted global-Scope dispatch with the concrete provider
   runtime's supervised Fiber and native Eve `waitUntil` completion; and
3. reconcile durable architecture, app, SPEC/task, plan, fixture, proof, and
   lifecycle owners before repository closeout.

The implementation remains repository-only. Closeout was reopened after
`cb10720e1eb43396f4b3351143c11002a2e96cf8` because the prior receipt recorded
one generic adversarial review instead of the mandatory five explicit
post-implementation passes. All five passes are now separately accepted. Pass
4 corrections are committed as
`b849b3025e14ae31fcc09bcfd819c72ee9ce6097`; Pass 5 and final verification are
retained in the closeout commit containing this completed plan. The work does
not include optional Preview readback and grants no deployment, provider,
credential, message, or Production authority.

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

## Implementation outcome

`prove-provider-runtime-behavior` is accepted in commit
`0c9082c8685a0fdd2512ea92222fad8022b86941`.
`supervise-accepted-eve-background-work` is accepted in commit
`a97d80d5943fa596cc09535a71a7d7e2b5414f54`.
`reconcile-runtime-docs-and-repository-closeout` is accepted. Pass 4 reopened
and corrected the provider-runtime proof; Pass 5 reconciled durable owners,
authority/non-claims, terminal lifecycle, docs inventory, and rollback.

## Accepted-finding boundary

Only `FINDING-001` through `FINDING-004` enter required implementation.
Optional `FINDING-005` remains outside the required task array and is not
authorised. The primary trajectory remains accountable for all four accepted
findings and `EVE-RUNTIME-REQ-001` through `EVE-RUNTIME-REQ-004`.

## Task progress

| Task                                             | Status    | Acceptance receipt                                                                                                                                                                                                                               |
| ------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prove-provider-runtime-behavior`                | Completed | Commit `0c9082c8685a0fdd2512ea92222fad8022b86941`; Pass 4 reopened its proof, added explicit Sendblue and Photon shared-tag identity assertions, then passed 6 focused tests, agent typechecking, Effect setup, and boundary checks              |
| `supervise-accepted-eve-background-work`         | Completed | Commit `a97d80d5943fa596cc09535a71a7d7e2b5414f54`; direct provider `runFork`, native `Fiber.await` waitUntil completion, five focused route tests, 62 agent tests, 25 Photon tests, direct policy gates, and full repository verification passed |
| `reconcile-runtime-docs-and-repository-closeout` | Completed | Five explicit passes accepted; Pass 4 proof/format corrections committed as `b849b3025e14ae31fcc09bcfd819c72ee9ce6097`; Pass 5 lifecycle/claim corrections and final verification retained in this plan's closeout commit                        |

## Mandatory five-pass audit

Baseline: `cb10720e1eb43396f4b3351143c11002a2e96cf8`.

| Pass                                      | Status | Evidence                                                                                                                                                                                                      |
| ----------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Ownership and call graph               | Passed | Two provider-owned production runtimes, one shared interpretation edge, separate Layer/config graphs, test-owned disposal, and installed Eve/HMR limits confirmed.                                            |
| 2. Effect implementation quality          | Passed | Direct native runtime/Fiber interpretation, flat request/background programs, outer typed handling, admitted test fixtures, and unchanged Photon lifetime confirmed.                                          |
| 3. Boundary and lifecycle correctness     | Passed | Type/Encoded and Config/error ownership, runtime-Scope supervision, Exit observation, cached failure/recovery, concurrency, cancellation, and finalizers confirmed.                                           |
| 4. Verification and adversarial coverage  | Passed | A missing direct Sendblue shared-tag assertion and active-plan formatting drift were corrected; focused, provider/app, boundary, Effect, lint, type, build, docs, harness, and negative-source checks passed. |
| 5. Documentation, authority, and closeout | Passed | Durable behavior owners, authority/non-claims, lifecycle/indexes, HGI-307 inventory, exact Git/rollback identity, and archive pointers were inspected and reconciled.                                         |

### Pass 1 — ownership and call graph

- Files inspected: `apps/agent/agent/agent.ts`,
  `apps/agent/agent/channels/{sendblue,photon}.ts`,
  `apps/agent/agent/lib/channel/{eve,channel,config,runtime,sendblue.runtime,photon.runtime}.ts`,
  `packages/channel/src/{service,memory.layer}.ts`,
  `packages/sendblue/src/live.layer.ts`,
  `packages/photon/src/{client,transport.layer,live.layer}.ts`,
  `apps/agent/test/{channel-config,channel-runtime,sendblue-channel,sendblue-build-route}.test.ts`,
  and installed Eve's `compiled-agent-cache.js`,
  `dev-authored-source-watcher.js`, `start-development-server.js`, and
  `dev-client.js`.
- Commands: exact `rg` scans for `ManagedRuntime.make`, `runPromise`,
  `runFork`, `disposeEffect`, `MemoMap`, `forkDetach`, provider-root symbols,
  package imports, and test-only runtime ownership, followed by direct reads
  of every listed source.
- Findings: production owns exactly two module-level runtimes and one shared
  `runFork` edge; provider Layers/config remain separate; tests alone own test
  disposal; no request creates/disposes a runtime; no cross-runtime `MemoMap`
  exists. Eve reloads its compiled bundle cache and owns watcher/Nitro/sandbox
  close, but exposes no authored Channel runtime teardown hook. Build evidence
  proves the current local bundle only.
- Corrections: none. Task 1 and task 2 remain accepted.
- Evidence: source searches returned two production `ManagedRuntime.make`
  sites, one production `runFork`, and zero production `disposeEffect`,
  `MemoMap`, or `forkDetach` sites.

### Pass 2 — Effect implementation quality

- Files inspected: the complete TypeScript implementation diff plus
  `eve.ts`, Channel service/dispatch/errors/schemas/config/replay/identity/router
  owners, both runtime Layers, Channel transport Service/memory Layer,
  Sendblue live Layer, Photon client/transport/live Layers, and both changed
  test files.
- Commands: full baseline-to-closeout TypeScript diff; exact scans for Effect,
  Layer, Service, Fiber, Scope/lifecycle primitives and forbidden runners,
  casts, manual transforms, native-class or switch policy, generic helpers,
  observers, `forkDetach`, and `MemoMap`; `bun run check:effect-setup`;
  `bun run check:boundaries`; and the agent typecheck.
- Findings: the production slice directly uses `ManagedRuntime.runFork`,
  `Fiber.await`, and `Effect.runPromise`; expected ingress errors remain in the
  outer `catchTags` pipeline; request-local dispatch stays at the framework
  edge. Test programs use native Effect primitives. The reused
  `makeSupervisionRuntime` is a four-call-site test fixture, not a production
  runner seam. No forbidden abstraction or construct was added, and no Photon
  package source or Spectrum lifetime changed.
- Corrections: none. Task 1 and task 2 remain accepted.
- Evidence: the added-line forbidden-pattern scan returned no matches; Effect
  setup, the boundary audit, and agent typecheck passed; the provider/package
  diff is empty.

### Pass 3 — boundary and lifecycle correctness

- Files inspected: Channel app Schemas, config, errors, Service, dispatch and
  Eve edge; Channel package Schemas/Service/errors; Sendblue Schemas/live
  Layer; Photon Schemas/client/transport; four focused agent fixtures; and
  installed Effect `ManagedRuntime.ts` and `Fiber.ts`.
- Commands: exact Schema Type/Encoded, decode/encode, Config/redaction,
  tagged-error, host-value, `waitUntil`, request-signal, MemoMap/build-fiber,
  Scope/disposal, `runFork`, and `Fiber.await` scans; direct source reads; and
  `bun run --cwd apps/agent vitest run test/channel-config.test.ts
test/channel-runtime.test.ts test/sendblue-channel.test.ts
test/channel-vertical.test.ts`.
- Findings: Eve state decodes from and encodes to the canonical adapter Schema;
  request/provider unknowns decode at their exact adapters; Services exchange
  decoded owner types; config is Schema-owned and redacted; public failures are
  safe tagged errors. ManagedRuntime owns a fresh MemoMap/Scope, caches its
  build fiber including failure, supervises `runFork`, and closes the Scope on
  disposal; `Fiber.await` observes every Exit without propagating it.
- Corrections: none. Task 1 and task 2 remain accepted.
- Evidence: 22 focused tests passed, covering config isolation, concurrency,
  failure poisoning/isolation/recovery, waitUntil success/failure/defect,
  disposal interruption/finalizer completion, request-abort independence, and
  vertical compatibility.

### Pass 4 — verification and adversarial coverage

- Files inspected: all focused agent fixtures under
  `apps/agent/test/{channel-runtime,channel-config,sendblue-channel,channel-vertical,sendblue-build-route}.test.ts`;
  Channel, Sendblue, and Photon transport/client fixtures; both provider
  discovery roots; the shared Eve edge; and this active plan.
- Commands: the corrected 6-test runtime/config focus; the 22-test
  boundary/lifecycle focus; Channel, Sendblue, Photon, and agent typecheck,
  test, and build matrices; `bun run test:boundaries`; `bun run check`;
  `bun run test:lint`; `bun run knip`; all direct Effect, boundary, docs,
  skills, authority, controls, verification, and HGI-307 gates; and
  `git diff --check`. Agent build commands used only the documented synthetic
  Executor URL and key.
- Findings: the runtime fixture proved distinct construction and Photon
  identity, but concurrent Sendblue calls did not directly assert that the
  shared `Channel` tag resolved to the Sendblue-backed value. The first full
  `bun run check` also found formatting drift in this reopened plan. All other
  accepted negative paths were already executable.
- Corrections: reopened `prove-provider-runtime-behavior`, resolved `Channel`
  from both concrete runtimes, decoded the same canonical inbound fixture, and
  asserted `sendblue` and `photon` provider values. Formatted this plan with
  the repository formatter. Reran the focused proof and each failed check.
- Evidence: 6 corrected focused tests and 22 lifecycle tests passed. Channel
  passed typecheck, 2 tests, and build; Sendblue passed typecheck, 9 tests, and
  build; Photon passed typecheck, 25 tests, and build; agent passed typecheck,
  62 tests, and Nitro build. The boundary harness passed 89 tests. Ultracite
  passed with zero warnings/errors after correction; lint policy, Knip, Effect
  setup, boundary, docs, skills, authority, controls, verification, HGI-307,
  and diff checks passed. Source/diff scans retain zero old detached path,
  per-request lifecycle, combined runtime, shared MemoMap, runner wrapper,
  unsafe cast, or Photon lifetime change.

### Pass 5 — documentation, authority, and closeout

- Files inspected: `docs/README.md`;
  `docs/architecture/{eve-agent,effect-patterns,repo-structure,testing-and-quality}.md`;
  `apps/agent/README.md`;
  `apps/agent/runbooks/{README,sendblue,photon}.md`;
  `docs/operations/{authority-model.md,authority-register.json}`;
  `docs/verification/README.md`; the SPEC, task ledger, product index, active
  and completed plan indexes, this plan, and the HGI-307 impact ledger.
- Commands: `git status --short`; `git rev-parse HEAD`; exact five-entry Git
  log; direct `sed`/`rg` owner, lifecycle, authority, proof, and rollback
  inspections; the Git-owned documentation path inventory; docs, skills,
  authority, controls, verification, HGI-307, Ultracite, and diff gates.
  Final acceptance ran the complete `bun run verification` with the documented
  synthetic Executor URL/key configuration.
- Findings: terminal lifecycle owners and the HGI docs digest required
  reconciliation after the audit. The SPEC's statement that the linked
  worktree had no local `node_modules` lacked a rereview-time qualifier and
  could become a false current workspace claim. The rollback chain did not yet
  include the Pass 4 correction commit.
- Corrections: qualified the dependency statement as point-in-time rereview
  evidence; set the SPEC/task/audit lifecycle to implemented/passed; moved this
  plan to completed history; reconciled product and plan indexes and the
  terminal HGI-307 digest; and added exact correction and ordered rollback
  identities. No provider/deployment rollback was invented.
- Evidence: architecture and agent README remain the earliest implemented
  behavior owners. Package READMEs, exports, Schemas, Services, Layers,
  runbooks, authority registers, verification journeys, skills/AGENTS,
  lint/config/CI, and Photon lifetime remain preserved as classified below.
  Authority and verification owners reject standing provider/deployment
  actuality or authority. Terminal docs, skills, authority, controls,
  verification, HGI-307, Ultracite, and diff checks passed. The complete final
  verification then passed Effect setup, every direct policy gate, 89 tooling
  tests, Ultracite, lint policy, Knip, eight workspace typechecks, and all
  eight workspace test tasks including the fresh 62-test agent run and Nitro
  build.

## Risk-lens evidence

| Lens                     | Current evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Tasks 1–2 keep production `ManagedRuntime.make` only in the Sendblue and Photon module edges. The shared Eve adapter receives the concrete runtime, returns accepted work from request preparation, and alone calls `runFork`; the runtime Scope owns the Fiber and Eve receives its native completion. Test runtimes/disposal remain test-owned. Separate provider roots, Config acquisition, Service tags, and Photon SDK lifetime remain unchanged.                       |
| Implementation quality   | The implementation uses direct `ManagedRuntime.runFork` plus `Effect.runPromise(Fiber.await(fiber).pipe(Effect.asVoid))`. Tests use canonical decoded Schemas, explicit Layers, `Deferred`, `Ref`, `Effect.acquireRelease`, `Exit`, `Cause`, and `Option`. Review found no unsafe cast, manual codec/mapper, DTO, runtime/runner wrapper, helper module, generic callback, shared `MemoMap`, suppression, boundary exception, request-signal coupling, or new timeout/retry. |
| Verification coverage    | Task 1's two runtime tests now assert both provider values; the corrected runtime/config focus passed 6 tests. Task 2 passed 5 route tests covering success, typed failure, defect, interruption/finalizer, waitUntil ordering, abort independence, exact dispatch count, and preserved statuses. Provider/app builds, direct gates, HGI-307, and the final full repository verification passed. These are repository/local-build claims only.                               |

## Downstream-impact ledger

| Surface                                                           | Decision before first slice                                                             | Earliest owner, action, verification, proof, limitations, and non-claims                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and durable docs                                     | Change required for `docs/architecture/eve-agent.md`; other standards Preserve          | The Eve architecture now owns provider-root cardinality, concrete runtime interpretation, supervised Fiber/waitUntil, disposal limits, local/deployment proof separation, and test call graphs. `effect-patterns.md`, `repo-structure.md`, and `testing-and-quality.md` already own the unchanged general rules. Local checks prove repository source only.                                                                      |
| Root, app, and package READMEs                                    | Change required for `apps/agent/README.md`; all other READMEs Preserve                  | The agent README now states the implemented provider runtime and waitUntil boundary without external actuality. Channel, Sendblue, Photon, Store, Eve, Codex, and proxy public contracts do not change. Photon continues to own per-operation `acquireUseRelease`.                                                                                                                                                               |
| API/generated references and exports                              | Preserve                                                                                | No Schema, Type/Encoded alias, Service tag, Layer export, package export, generated API, or command surface changes. Boundary/typecheck/Knip checks verify this; no hosted claim follows.                                                                                                                                                                                                                                        |
| Runbooks and authority                                            | Preserve                                                                                | `apps/agent/runbooks/**`, authority registers, controls, and provider procedures do not change. Repository implementation authority does not authorize Preview, Production, credentials, provider writes, messages, or deployment.                                                                                                                                                                                               |
| Verification journeys, proof, and dated evidence                  | Preserve current owners; Change required in focused fixtures and implementation receipt | `docs/verification/**` remains the owner for any separately authorised hosted packet. Repository journeys are proved by focused tests, build/source scans, and this plan; they do not prove Vercel lifecycle, provider state, or handset behavior.                                                                                                                                                                               |
| Skills and `AGENTS.md`                                            | Preserve                                                                                | The requested PRD implementer, docs maintainer, and effect-client-wrapper instructions already govern the slice. No skill, mirror, agent instruction, or harness profile source change is needed.                                                                                                                                                                                                                                |
| Lint, config, commands, CI, and workflows                         | Preserve executable rules; Change required for HGI-307 docs inventory                   | Existing Effect setup, boundary, docs, skills, authority, controls, verification, lint, Knip, typecheck, test, and build commands remain sufficient. The plan keeps the executable docs inventory at 180 paths; moving it between active and completed intent required exact digest reconciliation. `docs/documentation-audit/HGI-307-impact-ledger.json` owns the terminal count/digest. No exception or suppression was added. |
| Schemas, services, Layers, provider boundaries, and runtime roots | Preserve production owners                                                              | Task 1 creates test-local Layers only. Sendblue and Photon production composition roots remain separate; no shared `MemoMap`, combined runtime, provider eager loading, Config change, Service-tag redesign, or Photon lifetime change is allowed.                                                                                                                                                                               |
| Tests and fixtures                                                | Change required                                                                         | `apps/agent/test/channel-runtime.test.ts` owns runtime caching, concurrency, isolation, failure, recovery, and disposal proof. `sendblue-channel.test.ts` owns supervision and waitUntil proof. Config, vertical, build-route, Channel, Sendblue, Photon, preflight, and packaging fixtures remain retained; no fixture was retired.                                                                                             |
| SPEC, tasks, plan, and lifecycle pointers                         | Change required                                                                         | The SPEC and task ledger are implemented, this plan is retained under completed history, the product index routes the SPEC as implemented history, and the active/completed plan indexes now match the terminal lifecycle.                                                                                                                                                                                                       |
| Receipts and evidence artifacts                                   | Change required in plan; no new hosted packet                                           | Task receipts record exact revision, commands, postconditions, risk lenses, limitations, non-claims, and rollback identity here and in the task ledger. No provider/deployment receipt is created.                                                                                                                                                                                                                               |
| Migration, release, and rollback                                  | Preserve; no data migration or release                                                  | Repository rollback is exact Git reversion of each coherent task commit to starting revision `61992a2fa220313530dc7a8b3d54ec970a7483ec`. No replay clearing, provider retry, credential rebinding, deployment rollback, or release action occurs.                                                                                                                                                                                |
| Frontend/browser                                                  | N/A after inspecting the app call graph                                                 | No React route, visible text, client state, URL state, browser response, or accessibility surface changes. Browser screenshots are not applicable.                                                                                                                                                                                                                                                                               |

## Stop conditions

Stop acceptance on any failed or inconclusive required check, missing committed
owner, unaccounted boundary exception, unsafe cast, runner/helper abstraction,
global-Scope accepted work, per-request runtime lifecycle, combined provider
runtime, shared `MemoMap`, eager provider config, Photon lifetime change, or
unbounded external-state claim. Correct repository findings in the owning
slice; do not substitute optional hosted evidence for deterministic local
proof.

## Closeout receipt

- Starting revision:
  `61992a2fa220313530dc7a8b3d54ec970a7483ec`.
- Accepted task commits:
  `0c9082c8685a0fdd2512ea92222fad8022b86941` and
  `a97d80d5943fa596cc09535a71a7d7e2b5414f54`.
- Prior closeout and five-pass correction commits:
  `cb10720e1eb43396f4b3351143c11002a2e96cf8` and
  `b849b3025e14ae31fcc09bcfd819c72ee9ce6097`.
- Focused matrix: Channel typecheck and 2 tests; Sendblue typecheck and 9 tests;
  Photon typecheck and 25 tests; agent typecheck, 62 tests, and Nitro build.
- Repository matrix: Effect diagnostics; boundary, docs, skills, authority,
  controls, verification, and HGI-307 gates; 89 tooling tests; Ultracite; lint
  policy; Knip; eight workspace typechecks; all workspace tests; and
  `git diff --check`.
- Adversarial ownership scan: production `ManagedRuntime.make` remains only in
  the two provider module roots; `runFork` remains only in the shared Eve
  adapter; the accepted app path has no `forkDetach`, request-owned runtime
  disposal, combined runtime, shared `MemoMap`, runner abstraction, unsafe
  cast, or helper sprawl.
- Photon compatibility: no Photon package source changed, and its two
  per-operation `Effect.acquireUseRelease` call sites and 25 focused tests
  remain intact.

## Limitations, non-claims, and rollback

This receipt proves repository source, deterministic local tests, and a local
Nitro build only. It does not prove Vercel function topology, warm-instance or
scale-out cardinality, shutdown disposal, Preview or Production behavior,
provider state, credential validity, webhook delivery, handset receipt, or
host durability. Optional hosted readback remains unperformed and separately
authority-gated.

Rollback is Git-owned and ordered: revert the final closeout commit containing
this plan, then `b849b3025e14ae31fcc09bcfd819c72ee9ce6097`, then
`cb10720e1eb43396f4b3351143c11002a2e96cf8`, then
`a97d80d5943fa596cc09535a71a7d7e2b5414f54`, then
`0c9082c8685a0fdd2512ea92222fad8022b86941` to return to
`61992a2fa220313530dc7a8b3d54ec970a7483ec`. No deployment or
provider rollback identity exists because no external operation occurred.
