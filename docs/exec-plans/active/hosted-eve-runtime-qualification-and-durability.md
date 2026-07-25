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

| Task                           | Status    | Current owner and next direct proof                                                                                         |
| ------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `prove-eve-owned-handoff`      | Completed | Commit `bcf59bb`; installed source/generated output proof and all local gates passed                                        |
| `add-handoff-observability`    | Completed | Commit `5c67398`; safe observations and 19 focused leak/ordering/lifecycle tests passed                                     |
| `correct-202-ordering`         | Completed | Coherent task commit; exact send ordering, continuity fencing, timeout quarantine, terminal repair and local gates passed   |
| `set-and-readback-timeouts`    | Blocked   | Local owner decision retained; no exact candidate Preview, effective duration, plan, latency, Workflow, or Photon bound     |
| `qualify-final-preview`        | Blocked   | No immutable candidate or target-owned deploy/provider/Workflow/interruption/rollback authority                             |
| `qualify-production-candidate` | Blocked   | No accepted identical Preview or separate target-owned Production/provider/monitoring/rollback authority                    |
| `terminal-five-pass-audit`     | Completed | Single five-pass audit accepted local closeout after correcting one stale docs-inventory claim; hosted gates remain blocked |

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

### `add-handoff-observability`

- `ChannelHandoff` is a named app Service with live and memory Layers. It
  imports the redacted Channel secret once and produces domain-separated,
  branded HMAC work/session fingerprints plus Schema-owned attempts,
  acceptance, timestamp, latency, phase, outcome, response, and Exit values.
- The live `EveChannelDispatch` keeps Eve's raw `Session` private, decodes its
  ID once with `EveSessionId`, and returns only safe acceptance after the exact
  `send()` Promise resolves. No Workflow/runtime client or raw identity is
  added to an app service.
- The route records prepared, send-started, send-accepted/rejected, response,
  and native Fiber Exit phases. Exit is preclassified as success, typed
  failure, defect, or interruption; errors, Causes, and stacks are never
  passed to the observer.
- A delayed-send fixture directly records the existing false ordering:
  `Prepared`, `SendStarted`, and `Response` exist while `send()` remains
  pending; `SendAccepted` and `Exit` appear only after release. Separate
  rejection, defect, and runtime-disposal fixtures prove their exact outcomes.
- HMAC fixtures prove same-key determinism, cross-key separation, and
  work/session domain separation. Schema encoding, forbidden-marker, and
  excess-property fixtures reject retained replay/session IDs, content,
  continuation/hook tokens, Causes, and stacks.
- Nineteen focused handoff/route/vertical tests, 68 full agent tests, agent
  typechecking, Effect diagnostics, and all direct repository policy gates
  passed. The final repository verification is recorded after this receipt is
  formatted.
- Evidence is local only. No hosted log, metric, deployment, provider,
  credential, message, Preview, Production, or Workflow readback exists.
- Rollback identity is the coherent commit containing this receipt, reverting
  after `bcf59bb` toward
  `e92f8d2508dd927c09cb63eddb50c6ca09904b95`.

### `correct-202-ordering`

- The route awaits the exact Eve `send()` operation and returns `202` only
  after a safe acceptance identity atomically converges as `New` or `Resumed`.
  Rejection, timeout, continuity fork, replay/observation failure, defect, or
  interruption produces no `202`; no critical work remains under `waitUntil`.
- An app-owned continuity record fences the accepted session fingerprint per
  continuation. A different accepted fingerprint while the owner is active is
  quarantined as `ContinuityUncertain`. Only a matching terminal event retires
  the owner; a stale event cannot clear its successor.
- The app Config decodes a positive Effect `Duration` for the handoff wait.
  The 15-second `constants.ts` value is a conservative product default below
  Sendblue's last documented 45-second response deadline. It is not a Photon
  deadline, measured hosted latency, Vercel plan/default/function duration,
  Workflow step duration, Sandbox timeout, or session lifetime. Those fresh
  measurements and readbacks remain task 4.
- Timeout and rejected-Promise outcomes are uncertain writes: they return
  `503`, retain the exact inbound identity, suppress redelivery, and are never
  blindly retried. No new `Effect.retry` policy is admitted; the proposed
  three-attempt/backoff/jitter values remain pending operation-specific
  evidence.
- Matching terminal failure retains a safe failure marker keyed by the same
  HMAC session fingerprint as its observation. The incident runbook assigns
  an immediate operator alert and permits only a fresh authenticated user
  event to establish a repaired owner.
- Twenty-eight focused tests, the final 73-test agent suite with ordinary/Vercel
  builds, 9 Sendblue tests, and 25 Photon tests passed. Agent typechecking,
  Effect diagnostics, direct policy gates, HGI-307, local skill validation,
  formatting, Knip, and diff checks passed in the fresh complete repository
  verification.
  The first full agent test stopped fail-closed on the missing Executor build
  endpoint; the accepted rerun used only the documented public synthetic
  endpoint and made no authenticated provider call.
- Evidence is local only. No hosted function, latency, provider, alert,
  deployment, Preview, Production, interruption/resumption, or Workflow run
  readback exists.
- Rollback identity is the coherent commit containing this receipt, reverting
  after `5c67398`, then `bcf59bb`, toward
  `e92f8d2508dd927c09cb63eddb50c6ca09904b95`.

### `set-and-readback-timeouts` — local owner decision

- The four-clock owner matrix now separates the Bundjil handoff deadline, Eve
  Workflow/model/tool invocation, Vercel ordinary `__server`, and Sandbox
  lifecycle. Durable session lifetime remains a separate product policy.
- Turbo admits `BUNDJIL_CHANNEL_HANDOFF_TIMEOUT_MILLISECONDS` to the agent
  build environment, and the Schema-owned packaging fixture verifies that
  admission while preserving generated Workflow `maxDuration: "max"` and its
  queue trigger.
- Vercel documentation identifies Nitro
  `vercel.functions.maxDuration` as the supported ordinary-function owner.
  Installed and pinned Eve `0.20.0` create Nitro internally and expose no
  Bundjil-facing input for that object. No guessed `vercel.json` source glob or
  generated-output patch is admitted.
- Read-only Vercel inventory observed at `2026-07-25T17:13:58Z` resolved
  project `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`. Its latest deployment
  `dpl_GtD9GPLZda5S2fqdCyUQCwkPbbKG` is Production source
  `2e798f7722d46bd8f1ba34ca75b14cebcdb2e30b`, older than this local
  candidate. The available project/deployment response exposes neither
  effective function duration nor account plan and is not candidate proof.
- Current Sendblue documentation retains a 45-second response window and up
  to three timeout or `5xx` retries. No numeric Photon webhook response
  deadline is established. The exact candidate still lacks cold/warm new and
  resume acceptance, model/tool/provider distributions, function/resource
  readback, plan/Fluid bounds, and Workflow run evidence.
- `BND-J13-hosted-eve-durability` now owns the isolated Preview proof. Its
  deployment, provider message, Workflow read, interruption, rollback, and
  exact-candidate evidence require target-owned authority and a pushed
  immutable candidate.
- The retained timeout packet is
  [`HEQ-timeout-readback-2026-07-25.json`](../../evidence/verification/packets/HEQ-timeout-readback-2026-07-25.json).
  It is `inconclusive/not_attempted`: supported local ownership is proved, but
  exact-candidate readback and measurements are unavailable.

### `qualify-final-preview` — blocked outcome

- No deployment for candidate
  `eb9fd67d7282e1d7675232ee4f440e8ddf76a696` exists in the returned Vercel
  inventory.
- No current receipt grants isolated Preview deploy, Sendblue/Photon message
  and readback, Workflow run read, deliberately slow bounded invocation,
  interruption, or rollback authority.
- Therefore no new/resume latency, intended/accepted run convergence,
  session/turn Workflow correlation, same-run interruption recovery, duplicate
  zero effects, hosted alert, or rollback result was attempted. The retained
  Preview packet remains inconclusive and no Production operation occurred.

### `qualify-production-candidate` — blocked outcome

- Production is inadmissible without an accepted identical Preview. No
  separate current Production deployment, provider, monitoring, promotion, or
  rollback authority exists.
- The latest read-only Production observation is older deployment
  `dpl_GtD9GPLZda5S2fqdCyUQCwkPbbKG` at source
  `2e798f7722d46bd8f1ba34ca75b14cebcdb2e30b`; it is neither the candidate nor
  rollback authority.
- The retained
  [`HEQ-production-qualification-blocked-2026-07-25.json`](../../evidence/verification/packets/HEQ-production-qualification-blocked-2026-07-25.json)
  packet records `inconclusive/not_attempted`. The 2026-07-23 Production
  receipt remains immutable historical evidence only.

### `terminal-five-pass-audit` — completed local closeout

- The audit ran once at `2026-07-25T17:31:47Z`, after all implementation and
  hosted tasks were terminal, against dependency commit
  `865365d5529a388a312ce11c8183c06625f31241`.
- Ownership/call graph, Effect quality, boundary/lifecycle correctness,
  adversarial repository proof, and documentation/authority closeout were
  accepted. The only finding was stale HGI docs-path accounting: the
  documentation owner was reopened, the stale 187-path claim was invalidated,
  and focused repair reclosed it at 190 paths before the audit receipt.
- The retained audit detail and packet expand final docs accounting to 192
  paths. They do not change the inconclusive Preview or Production packets:
  [`HEQ-terminal-five-pass-audit-2026-07-25.json`](../../evidence/verification/packets/HEQ-terminal-five-pass-audit-2026-07-25.json)
  proves only the local closeout.

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

| Surface                                             | Decision           | Earliest owner, action, proof, limitation, and non-claim                                                                                                        |
| --------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger, indexes, and active plan         | Change required    | Exact SPEC/tasks and active-plan indexes own current intent and task status; `check:docs` proves routing only                                                   |
| Documentation audit inventory                       | Change required    | Timeout/Preview/Production evidence first expanded accounting to 190 paths; the retained terminal detail and packet expand it to 192 with a focused HGI recheck |
| Agent/Eve architecture                              | Change required    | `docs/architecture/eve-agent.md` will own corrected acceptance, Workflow, timeout, and non-claim boundaries                                                     |
| Agent README                                        | Change required    | Route the corrected handoff and supported configuration owners without embedding procedures                                                                     |
| Channel and Eve package READMEs/exports             | Preserve           | App-owned handoff changes no package public boundary; package checks and diff review verify preservation                                                        |
| Schemas, services, Layers, config, and errors       | Change required    | Narrow `apps/agent/agent/lib/channel/**` owners; decode/encode once, branded identities, safe errors, explicit live/memory Layers                               |
| Provider adapters and SDK clients                   | Preserve initially | Inspect both call graphs; no provider transport change is admitted without its own direct retry/uncertainty proof                                               |
| Runbooks                                            | Change required    | Deploy, Sendblue, Photon, and incident owners add Workflow acceptance, timeout, interruption, monitoring, rollback, and authority gates                         |
| Authority model/register                            | Preserve rationale | Change a static envelope only if a real supported read/control operation changes; no app Workflow resource is added                                             |
| Critical journeys, command map, and proof templates | Change required    | Add the durable-handoff/interruption journey and bounded packet contract; repository validation makes no hosted claim                                           |
| Dated evidence                                      | Conditional        | Add only exact attempted local/Preview/Production receipts; retain blocked/inconclusive outcomes and never fabricate hosted evidence                            |
| Tests and fixtures                                  | Change required    | Installed Eve/build output, acceptance/Exit/leak, ordering, duplicate, timeout, continuity, retry, uncertainty, and failure-state fixtures                      |
| Monitoring and terminal failure                     | Change required    | Safe phases/fingerprints, bounded latency/outcome, terminal state, alert threshold, repair route, and forbidden-marker assertions                               |
| Lint, boundary rules, CI, and commands              | Preserve initially | Existing gates remain sufficient unless a direct fixture exposes an unenforced recurring pattern                                                                |
| Skills and `AGENTS.md`                              | Preserve           | Current `prd-implementer`, `docs-maintainer`, `effect-client-wrapper`, authority, and component routing already cover the work                                  |
| Rollout and rollback                                | Change required    | Exact candidate/config/deployment identities, retry drain, quarantine, compatible in-flight Eve runs, stop conditions, and readback                             |
| Frontend/browser/accessibility                      | N/A                | Inspected app call graph contains no React, visible UI, URL state, accessibility, or browser rendering change                                                   |
| Release/publication/push/merge                      | N/A                | The request authorises local coherent commits only; no tag, package publication, push, merge, or release                                                        |

## Current limitations and stop conditions

- No current one-run Preview deployment, provider journey, Workflow read,
  interruption, rollback, or Production authority receipt is attached.
- Timeout, Preview, and Production have terminal blocked outcomes with retained
  inconclusive packets; they are not accepted hosted qualification.
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
