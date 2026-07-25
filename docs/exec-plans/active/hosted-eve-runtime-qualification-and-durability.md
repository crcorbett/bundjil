---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-agent-architecture-owner
created: 2026-07-25
last_reviewed: 2026-07-25
review_trigger: hosted Eve task status, handoff contract, timeout owner, generated Build Output, Preview or Production authority, proof, or rollback change
spec: ../../product-specs/hosted-eve-runtime-qualification-and-durability.md
task_ledger: ../../product-specs/hosted-eve-runtime-qualification-and-durability.tasks.json
started: 2026-07-25
---

# Hosted Eve runtime qualification and durable handoff

## Outcome and authority boundary

Implement the accepted task ledger serially while preserving Eve `0.20.0` as
the sole Workflow lifecycle owner. Local implementation, tests, generated
Build Output inspection, documentation, and Git commits are authorised.
Deployment, provider read/write, message, webhook, credential, Preview
interruption, Production, promotion, rollback, and revocation operations are
not authorised by this plan or repository source.

The primary trajectory owns the complete outcome. Hosted tasks stop at their
target-owned authority envelope when an exact principal, operation, resource,
environment, duration, approval receipt, immutable candidate, readback,
rollback, or escalation owner is missing.

## Baseline and immutable source observations

- Worktree:
  `/Users/cooper/.codex/worktrees/1ed4/bundjil`.
- Starting revision:
  `e92f8d2508dd927c09cb63eddb50c6ca09904b95`.
- Starting state: detached HEAD at local `main`, clean tracked worktree.
- Starting commit: `docs(agent): specify durable Eve handoff`.
- Lock-resolved dependency: `eve@0.20.0`.
- Pinned ignored reference:
  `/Users/cooper/Projects/bundjil/.local/references/eve` at
  `79e9959a95393d8644ab17364769513858f77228`.
- Installed comparison source:
  `/Users/cooper/Projects/bundjil/node_modules/eve`.
- Generated comparison output:
  `/Users/cooper/Projects/bundjil/apps/agent/.vercel/output`.

These are point-in-time local source observations. Committed tests reconstruct
and inspect the lock-resolved installed package plus the current generated
output. Neither class establishes a hosted deployment.

## Accepted finding and task boundary

Only accepted findings `HEQ-F001` through `HEQ-F007` and requirements
`HEQ-REQ-001` through `HEQ-REQ-018` enter implementation. Tasks remain in the
accepted dependency order:

| Task                           | Status    | Current owner and next direct proof                                                                          |
| ------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------ |
| `prove-eve-owned-handoff`      | Completed | Installed Eve source plus Schema-decoded generated output; all direct and repository gates passed            |
| `add-handoff-observability`    | Pending   | Safe Schema-owned acceptance/Exit observations and leak fixtures                                             |
| `correct-202-ordering`         | Pending   | Await exact Eve `send()` acceptance and continuity convergence before `202`                                  |
| `set-and-readback-timeouts`    | Pending   | Generated-output owner proof, measured local handoff policy, then authority-gated immutable Preview readback |
| `qualify-final-preview`        | Pending   | Target-owned Vercel/provider/Workflow/interruption authority and immutable Preview packet                    |
| `qualify-production-candidate` | Pending   | Accepted identical Preview plus separate target-owned Production/provider authority                          |
| `terminal-five-pass-audit`     | Pending   | One audit only after every dependency is terminal; blocked hosted outcomes retain exact gates and non-claims |

## Implementation decisions

- Preserve webhook → `EveChannelDispatch` → Eve `send()` →
  `deliver/resumeHook` or `run/startWorkflowPreferLatest` → session workflow →
  turn child workflow.
- Add no app-owned Workflow, raw Workflow client, queue fallback, mirrored
  runtime service, generated-output patch, or guessed `vercel.json` function
  glob.
- Keep raw Eve `Session` values inside the live adapter. Public app services
  return only Schema-decoded acceptance classifications and keyed safe
  fingerprints.
- Keep replay and continuity fencing app-owned. A returned different run for
  an established continuation is uncertainty, not successful resumption.
- Apply Effect retry only to an explicitly transient, idempotent or
  read-back-safe operation. Do not blind-retry outcome-uncertain writes.
- Preserve Eve's generated Workflow `maxDuration: "max"`. Pinned Eve exposes no
  Bundjil-facing Nitro `vercel.functions` seam for `__server`; retain the
  effective default unless measured need and a supported owner both exist.

## Accepted task receipts

### `prove-eve-owned-handoff`

- The lock-resolved installed Eve distribution directly proves `send()` awaits
  `deliver()`, every deliver rejection currently falls through to `run()`,
  `deliver()` awaits `resumeHook()`, no-active-session is identified from
  `HookNotFoundError`, and `run()` awaits `startWorkflowPreferLatest()` before
  the session workflow dispatches its turn child workflow.
- The app test command now builds both normal Nitro output and Vercel Build
  Output. The focused fixture Schema-decodes routing and function config and
  asserts the two Channel routes, `__server` catch-all, Node 24 functions, Eve
  queue trigger, Workflow `maxDuration: "max"`, and no authored `__server`
  duration.
- Installed `createApplicationNitro()` and `createEveVercelOptions()` prove Eve
  owns Nitro construction and exposes no `vercel.functions` seam in `0.20.0`.
  No runtime code or app-owned Workflow abstraction changed.
- Focused agent typechecking, 4 packaging tests, 65 agent tests, all direct
  policy gates, HGI-307 evaluation, and a fresh `bun run verification` passed.
  The first full run found only formatter drift; `bun run fix` corrected it
  before the passing rerun.
- This is source and local generated-output proof only. It makes no deployment,
  provider, Preview, Production, Workflow readback, or current-plan-limit claim.
- Rollback identity is the coherent commit containing this receipt, reverting
  toward starting revision
  `e92f8d2508dd927c09cb63eddb50c6ca09904b95`.

## Requirement-to-proof and risk-lens loop

At each task closeout:

1. replay its `requirementProof` rows against the exact assertions and reject
   broad-suite proof by proxy;
2. inspect ownership/call graph, Effect quality, boundary/lifecycle behavior,
   and direct adversarial coverage;
3. reconcile this plan and the sibling ledger with the actual diff;
4. run focused tests/typechecks/build plus direct Effect, boundary, docs, and
   skill gates;
5. run `bun run verification` before accepting and committing the coherent
   slice; and
6. record exact Git identity, rollback identity, limitations, and non-claims.

The mandatory five-pass audit is not this per-task loop. It runs once only
after all implementation and hosted tasks have a terminal state.

## Downstream-impact ledger

| Surface                                             | Decision           | Earliest owner, action, proof, limitation, and non-claim                                                                                   |
| --------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| SPEC, task ledger, indexes, and active plan         | Change required    | Exact SPEC/tasks and active-plan indexes own current intent and task status; `check:docs` proves routing only                              |
| Documentation audit inventory                       | Change required    | Refresh `HGI-307-impact-ledger.json` path count/digest after this plan path is added; preserve the historical epoch                        |
| Agent/Eve architecture                              | Change required    | `docs/architecture/eve-agent.md` will own corrected acceptance, Workflow, timeout, and non-claim boundaries                                |
| Agent README                                        | Change required    | Route the corrected handoff and supported configuration owners without embedding procedures                                                |
| Channel and Eve package READMEs/exports             | Preserve           | App-owned handoff changes no package public boundary; package checks and diff review verify preservation                                   |
| Schemas, services, Layers, config, and errors       | Change required    | Narrow `apps/agent/agent/lib/channel/**` owners; decode/encode once, branded identities, safe errors, explicit live/memory Layers          |
| Provider adapters and SDK clients                   | Preserve initially | Inspect both call graphs; no provider transport change is admitted without its own direct retry/uncertainty proof                          |
| Runbooks                                            | Change required    | Deploy, Sendblue, Photon, and incident owners add Workflow acceptance, timeout, interruption, monitoring, rollback, and authority gates    |
| Authority model/register                            | Preserve rationale | Change a static envelope only if a real supported read/control operation changes; no app Workflow resource is added                        |
| Critical journeys, command map, and proof templates | Change required    | Add the durable-handoff/interruption journey and bounded packet contract; repository validation makes no hosted claim                      |
| Dated evidence                                      | Conditional        | Add only exact attempted local/Preview/Production receipts; retain blocked/inconclusive outcomes and never fabricate hosted evidence       |
| Tests and fixtures                                  | Change required    | Installed Eve/build output, acceptance/Exit/leak, ordering, duplicate, timeout, continuity, retry, uncertainty, and failure-state fixtures |
| Monitoring and terminal failure                     | Change required    | Safe phases/fingerprints, bounded latency/outcome, terminal state, alert threshold, repair route, and forbidden-marker assertions          |
| Lint, boundary rules, CI, and commands              | Preserve initially | Existing gates remain sufficient unless a direct fixture exposes an unenforced recurring pattern                                           |
| Skills and `AGENTS.md`                              | Preserve           | Current `prd-implementer`, `docs-maintainer`, `effect-client-wrapper`, authority, and component routing already cover the work             |
| Rollout and rollback                                | Change required    | Exact candidate/config/deployment identities, retry drain, quarantine, compatible in-flight Eve runs, stop conditions, and readback        |
| Frontend/browser/accessibility                      | N/A                | Inspected app call graph contains no React, visible UI, URL state, accessibility, or browser rendering change                              |
| Release/publication/push/merge                      | N/A                | The request authorises local coherent commits only; no tag, package publication, push, merge, or release                                   |

## Current limitations and stop conditions

- No current one-run Preview deployment, provider journey, Workflow read,
  interruption, rollback, or Production authority receipt is attached.
- No immutable hosted candidate exists until the accepted local commits are
  pushed and deployed under separate authority; local Git commits are not a
  hosted candidate.
- Current Vercel plan/project defaults, function mapping, provider deadlines,
  and run state require fresh target-owned readback at execution time.
- Stop rather than infer on missing identity, approval, immutable deployment,
  supported timeout seam, provider exact-result readback, interruption owner,
  rollback target, or bounded evidence path.

Repository rollback is ordered Git reversion of the coherent task commits to
`e92f8d2508dd927c09cb63eddb50c6ca09904b95`. It does not clear replay state,
retry an uncertain write, terminate an Eve run, mutate a provider, or restore
an alias.
