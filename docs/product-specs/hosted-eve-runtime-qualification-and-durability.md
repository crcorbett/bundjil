---
document_type: product-spec
lifecycle: proposed
authority: canonical
owner: bundjil-product-owner
implementation_owner: bundjil-agent-architecture-owner
verification_owner: bundjil-agent-operator
last_reviewed: 2026-07-25
review_trigger: Eve, Workflow SDK, Vercel build output, Channel acknowledgement, timeout, provider, or authority change
task_ledger: hosted-eve-runtime-qualification-and-durability.tasks.json
---

# Hosted Eve runtime qualification and durable handoff

## Status and decision

This SPEC is proposed implementation and qualification intent. It authorises no
runtime change, deployment, provider operation, credential use, message,
promotion, or rollback.

Fresh review of pinned Eve `0.20.0` corrects the earlier architecture premise:
Eve already owns the Workflow SDK lifecycle. Eve starts a durable session
workflow, resumes it through a workflow hook, and starts every turn as a child
workflow. Bundjil must not wrap an Eve turn in a second app-owned Vercel
Workflow unless future pinned-source evidence proves a missing boundary.

The remaining acknowledgement defect is narrower:

1. the Bundjil webhook prepares and claims inbound work;
2. it starts an Effect Fiber that calls Eve `send()`;
3. it registers `Fiber.await` with Eve/Nitro `waitUntil`; and
4. it returns `202` before that Fiber has necessarily reached Eve's awaited
   workflow start or hook-resume acceptance.

`waitUntil` protects that in-process handoff only until the ordinary webhook
function reaches its own invocation duration. It does not move the `202`
boundary. The required correction is to return `202` only after the exact Eve
`send()` call has resolved, its opaque session/run identity is observable, and
an existing-session delivery has not silently become a different new session.
The later Eve turn, tools, model calls, pauses, and replies remain Eve-owned
durable workflow work.

## Exact candidate and evidence epoch

| Field                | Value                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| Repository           | `https://github.com/crcorbett/bundjil.git`                                              |
| Draft base           | `origin/main`                                                                           |
| Exact draft SHA      | `ff73113524fa63ce8d9951a215f6f56c33660f2e`                                              |
| Eve dependency       | `eve@0.20.0`                                                                            |
| Pinned Eve reference | `vercel/eve@79e9959a95393d8644ab17364769513858f77228`                                   |
| Local source owners  | `/Users/cooper/Projects/bundjil/.local/references/eve` and installed `node_modules/eve` |
| Research date        | 2026-07-25                                                                              |
| Hosted actuality     | Not read in this drafting slice                                                         |

Repository and generated-build observations are source evidence only. A
Preview deployment must read back its own immutable source, configuration,
function mapping, effective duration, workflow run, provider state, and logs.

## Research method

This review used Executor Personal to question DeepWiki against `vercel/eve`
and to search/fetch primary Vercel and Workflow SDK documentation. DeepWiki was
discovery evidence only. Every architectural conclusion below was reconciled
against the pinned Eve source, the lock-resolved installed `eve@0.20.0`
distribution, Bundjil source, installed Nitro types/preset code, and current
generated Build Output. Where upstream summaries and pinned code differed, the
pinned code controls this SPEC.

## Upstream and repository evidence

| Evidence                                                                                           | Finding                                                                                                                                                           | Claim limit                                                                                                     |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/agent/agent/lib/channel/eve.ts`                                                              | The route starts `background` with `ManagedRuntime.runFork`, registers `Fiber.await` with `waitUntil`, then returns `202`.                                        | Proves repository ordering, not hosted execution.                                                               |
| `apps/agent/agent/lib/channel/dispatch.ts`                                                         | `EveChannelDispatch.layerEve` awaits the route-owned Eve `send()` Promise and maps rejection to a tagged error.                                                   | Proves the adapter waits for `send()`, not what Vercel persisted.                                               |
| Pinned and installed Eve `channel/send` and `execution/workflow-runtime`                           | `send()` awaits `runtime.deliver()`/`resumeHook`; if delivery throws, it can then await `runtime.run()`/`startWorkflowPreferLatest()`.                            | Resolution proves an accepted resume or start, but not by itself that an intended existing session was resumed. |
| Eve `channel/send.ts` delivery catch                                                               | The pinned `0.20.0` code falls through to new-session start after every delivery error; only the warning differs for `RuntimeNoActiveSessionError`.               | A transient or uncertain resume failure can resolve through a different new run; Preview must reject that fork. |
| Eve `execution/workflow-entry.ts`, `turn-dispatch.ts`, `workflow-steps.ts`, and `turn-workflow.ts` | The session driver is a durable workflow and every turn is dispatched as a child workflow.                                                                        | Does not make arbitrary provider side effects exactly once.                                                     |
| Eve execution-model documentation                                                                  | Sessions survive process restart/redeploy; interrupted steps replay from checkpoints; non-idempotent effects still require idempotency.                           | Upstream contract for the pinned release, not Bundjil Production proof.                                         |
| Generated `flow.func/.vc-config.json`                                                              | Node 24, `maxDuration: "max"`, and queue topic `__eve6167656e74_wkf_workflow_*`.                                                                                  | Local generated output only; the immutable Preview deployment must read it back.                                |
| Eve `workflow-bundle/builder.ts`                                                                   | Eve deliberately patches the generated workflow function with the queue trigger and `maxDuration: "max"`.                                                         | Eve owns this output; Bundjil must not override it speculatively.                                               |
| Generated `__server.func/.vc-config.json`                                                          | Node 24 with no `maxDuration`; `config.json` routes Channel HTTP paths to `__server`.                                                                             | The ordinary function uses the effective project/platform default until a supported owner says otherwise.       |
| Eve `createApplicationNitro` and `createEveVercelOptions`                                          | Eve directly creates Nitro with the Vercel preset; its current Vercel options set only Build Output framework metadata and expose no app duration input.          | Pinned Eve `0.20.0` has no supported Bundjil-facing `__server` duration seam.                                   |
| Installed Nitro Vercel preset                                                                      | `vercel.functions.maxDuration` is a typed Nitro option and the preset spreads it into the generated catch-all `.vc-config.json`.                                  | This proves the framework owner Eve would need to expose, not that Bundjil can configure it today.              |
| `apps/agent/vercel.json`                                                                           | Contains only the root filtered build command and no `functions` entry. Nitro reads it for selected project settings but Eve does not establish a source glob.    | A guessed source glob against generated `__server` is unsupported.                                              |
| Vercel Workflows documentation                                                                     | Workflows persist and resume for minutes to months; Vercel Functions execute workflow/step code, Queues dispatch it, and managed persistence stores state/events. | Overall workflow lifetime is distinct from each function/step invocation duration.                              |
| Vercel `waitUntil` documentation                                                                   | The Promise shares the enclosing function timeout and is cancelled when that function times out.                                                                  | `waitUntil` is not cross-process durable ownership.                                                             |
| Vercel Build Output API                                                                            | Each `.func/.vc-config.json` owns that generated function's `maxDuration` when present.                                                                           | Does not prove a source `vercel.json` glob targets Eve's generated `__server`.                                  |
| Vercel function-duration documentation                                                             | Nitro uses `vercel.functions.maxDuration`; other frameworks can use source-entrypoint globs. Effective defaults and plan maxima vary.                             | The generic mechanism does not create a missing Eve application configuration seam.                             |
| Workflow SDK observability documentation                                                           | Preview runs can be inspected by run ID through the Vercel backend/dashboard.                                                                                     | Readback requires the exact hosted run and authority; local inspection is not hosted proof.                     |

Primary references:

- [Eve `createSendFn`](https://github.com/vercel/eve/blob/79e9959a95393d8644ab17364769513858f77228/packages/eve/src/channel/send.ts)
- [Eve workflow runtime](https://github.com/vercel/eve/blob/79e9959a95393d8644ab17364769513858f77228/packages/eve/src/execution/workflow-runtime.ts)
- [Eve workflow entry](https://github.com/vercel/eve/blob/79e9959a95393d8644ab17364769513858f77228/packages/eve/src/execution/workflow-entry.ts)
- [Eve workflow bundle builder](https://github.com/vercel/eve/blob/79e9959a95393d8644ab17364769513858f77228/packages/eve/src/internal/workflow-bundle/builder.ts)
- [Eve Nitro application builder](https://github.com/vercel/eve/blob/79e9959a95393d8644ab17364769513858f77228/packages/eve/src/internal/nitro/host/create-application-nitro.ts)
- [Eve Vercel Build Output options](https://github.com/vercel/eve/blob/79e9959a95393d8644ab17364769513858f77228/packages/eve/src/internal/nitro/host/vercel-build-output-config.ts)
- [Vercel Workflows](https://vercel.com/docs/workflows)
- [Vercel `waitUntil`](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#waituntil)
- [Vercel function duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [Vercel Build Output function configuration](https://vercel.com/docs/build-output-api/v3/primitives#serverless-function-configuration)
- [Vercel `vercel.json` functions](https://vercel.com/docs/project-configuration/vercel-json#functions)
- [Workflow SDK observability](https://workflow-sdk.dev/docs/observability)
- [Workflow SDK Vercel world](https://workflow-sdk.dev/worlds/vercel)

## Ownership model

| Boundary                     | Owner                                       | Accepted responsibility                                                                                      | Explicit non-owner                                                                             |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Provider webhook/auth/decode | Bundjil provider adapter                    | Authenticate and decode once; establish stable provider event identity.                                      | Eve and Vercel do not define provider replay semantics.                                        |
| Replay claim                 | Bundjil Channel service/store               | Atomic claim, duplicate disposition, completion/uncertainty, fencing and retention.                          | A Workflow run alone does not prevent duplicate provider effects.                              |
| Eve handoff                  | `EveChannelDispatch` adapter                | Encode canonical state, call `send()`, retain returned safe session/run fingerprint, classify rejection.     | It must not wrap or mirror Eve's workflow runtime.                                             |
| Durable session/turn         | Eve `0.20.0`                                | `resumeHook`, `startWorkflowPreferLatest`, session workflow, turn child workflows and checkpoint replay.     | Bundjil must not prescribe a second Workflow.                                                  |
| Workflow infrastructure      | Vercel Workflow/Queues/persistence          | Durable dispatch, state/event persistence, pause/resume, run observability.                                  | Platform availability is not ordinary process lifetime and not exactly-once provider delivery. |
| In-step retry/failure        | Eve plus Bundjil Effect/provider operations | Eve replays interrupted steps; Effect owns typed bounded retry only inside the running operation where safe. | An Effect retry does not prove process recovery.                                               |
| Provider side effects        | Bundjil provider adapter                    | Stable operation identity, exact-result observation, idempotency where supported, quarantine otherwise.      | Workflow replay never licenses blind resend after uncertain outcome.                           |
| Hosted proof                 | Bundjil agent operator                      | Immutable deployment/readback, run/dashboard proof, bounded logs, duplicate oracle, rollback.                | Repository checks do not prove Preview or Production.                                          |

## Exact custom-channel call graph

```text
Sendblue or Photon webhook
  -> Eve Nitro generated __server function
  -> Eve authored-channel dispatch
  -> Bundjil Channel decodeWebhook
  -> Bundjil Channel prepareInbound
  -> atomic replay claim
  -> Bundjil EveChannelDispatch
  -> Eve route-owned send()
     -> createSendFn
        -> existing continuation: createWorkflowRuntime.deliver
           -> await resumeHook
           -> return owner session/run id
        -> any deliver error: fallback to createWorkflowRuntime.run
           -> await startWorkflowPreferLatest(workflowEntryReference)
           -> return new session/run id
           -> deliberate only when no active hook; otherwise continuity risk
  -> Bundjil completeInbound
  -> 202 only after accepted identity and intended-session convergence

Eve durable execution after acceptance
  -> workflowEntry session driver
  -> create/own delivery hook
  -> dispatchAndAwaitTurn
  -> dispatchTurnStep
  -> startWorkflowPreferLatest(turnWorkflowReference)
  -> durable child workflow
  -> model/tool/provider steps and checkpoint replay
  -> waiting/completed/failed terminal observation
```

On the successful existing-session path, `send()` resolves after `resumeHook`
resolves with the owner run identity. For a new session, it resolves after
`startWorkflowPreferLatest` resolves with the new run identity. However, pinned
Eve `0.20.0` catches every `deliver()` error and falls through to the new-run
path; it does not restrict fallback to `RuntimeNoActiveSessionError`.
Therefore `send()` resolution is the minimum source-level durable acceptance
boundary, but an existing-session `202` additionally requires evidence that
the accepted run is the intended owner run rather than a continuity fork.
Preview must prove that identity and accepted delivery in Vercel Workflow
readback before this SPEC calls the hosted `202` durable.

The current `waitUntil` Promise covers `send()` and `completeInbound` because
both are inside the background Fiber. It preserves the ordinary webhook
invocation after the HTTP response, but only until `__server` times out. Once
the corrected route awaits durable acceptance before `202`, `waitUntil` may
remain only for explicitly named post-acceptance bookkeeping; it must not be
the acceptance oracle.

## Failure model

Cross-process recovery means recovery from ordinary function timeout, crash,
scale-down, and deployment replacement. It is distinct from Vercel regional or
service availability.

| Failure window                                   | Current consequence                                                                       | Required outcome                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Before auth/decode                               | No accepted work; `400`/`401`/`204` as owned.                                             | Preserve current boundary.                                                                           |
| After decode but before atomic claim             | No app-owned accepted work.                                                               | Do not return `202`; provider may retry the same identity.                                           |
| After claim but before Fiber start               | Lease exists; response may fail.                                                          | No `202`; same identity remains safely retryable.                                                    |
| After current `202` but before `send()` resolves | Provider sees acceptance although Eve may not have accepted a workflow start/hook signal. | Move `202` after awaited `send()` identity and Preview readback proof.                               |
| `send()` rejection                               | Current Fiber logs a tagged failure after `202`.                                          | Return a retryable non-2xx before acceptance; persist safe failure/uncertainty.                      |
| Process ends after durable Eve acceptance        | Eve owns session/turn resumption.                                                         | Same run resumes; no app-level Workflow wrapper.                                                     |
| Existing hook not found                          | Eve deliberately falls back from `deliver` to a new session start.                        | Prove continuation/replay identity cannot create a second user-visible result.                       |
| Existing hook resume has another error           | Eve logs the failure and can still fall through to a different new session.               | Do not accept a silent continuity fork; observe intended versus accepted run and fail/quarantine.    |
| Workflow step interrupted                        | Eve may replay the interrupted step.                                                      | Provider writes are idempotent or observed before retry; otherwise terminal uncertainty is retained. |
| Provider timeout after possible write            | Outcome is unknown.                                                                       | Read exact operation identity, converge, or fail visibly; never blind retry.                         |
| Duplicate provider delivery                      | Current replay claim can return `204`.                                                    | One Eve accepted delivery, one turn/result, one provider effect and zero second response.            |
| `__server` reaches its duration                  | Current `waitUntil` handoff is cancelled.                                                 | Correct handoff normally completes before deadline; timeout produces non-2xx and no accepted claim.  |
| Workflow/step invocation reaches its duration    | Current invocation stops while workflow state remains durable.                            | Eve/Vercel resume according to the pinned contract; direct interruption proof required.              |
| Sandbox idle timeout                             | Sandbox VM idles independently of function duration.                                      | Filesystem/session continuity is separately qualified only when required.                            |
| Session remains parked                           | Workflow may persist for minutes to months.                                               | Retention/product lifecycle remains explicit; no function-duration inference.                        |

## Timeout taxonomy and pending policy

These clocks must never be collapsed:

| Clock                                    | Current owner/evidence                                                                                                                           | Required decision                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider webhook response deadline       | Sendblue documents a 45-second wait and retries; Photon requires fast `2xx` but no numeric end-to-end deadline was established in this research. | Revalidate at execution time and set an acknowledgement target below every active provider deadline.                                                                    |
| Bundjil-to-Eve durable handoff           | Runs in generated `__server`; current `.vc-config.json` has no `maxDuration`. Eve directly owns Nitro creation and exposes no app duration seam. | Measure `send()` start/resume acceptance latency and read the effective project default. If an override is justified, use an Eve-supported seam or upstream Eve change. |
| Eve workflow flow function               | Generated `flow.func` has Eve-owned `maxDuration: "max"` and queue trigger.                                                                      | Preserve and Preview-read back. Do not replace with a Bundjil constant.                                                                                                 |
| Individual workflow/turn step invocation | Vercel Function/plan limit still applies to each invocation even though the workflow can resume for months.                                      | Change only through an Eve-supported step owner, justified by measured model/tool latency and plan maximum.                                                             |
| Vercel Sandbox idle timeout              | Eve's Vercel Sandbox default is 30 minutes of inactivity.                                                                                        | Keep separate; change only for a sandbox lifecycle requirement.                                                                                                         |
| Durable session lifetime                 | Eve/Workflow can persist across days, deployments, and long pauses.                                                                              | Define product retention/closure separately from all function timeouts.                                                                                                 |

No numeric `__server` or workflow-step duration is accepted yet. The timeout
task must:

1. capture the generated Build Output and immutable Preview function readback;
2. read the effective project default and plan maximum;
3. measure new-session `start` and existing-session `resumeHook` acceptance
   latency separately, including cold starts and a bounded failure sample;
4. measure model/tool/provider step latency separately;
5. preserve the established owner: Eve's `createApplicationNitro` passes
   `createEveVercelOptions` to Nitro, whose `vercel.functions` value writes
   `__server.func/.vc-config.json`;
6. reject a guessed `vercel.json` glob;
7. if an override is justified, require an Eve-supported application seam or a
   pinned upstream Eve change rather than editing generated output;
8. preserve Eve's generated workflow `"max"` unless pinned source changes; and
9. set and re-read only supported values with explicit safety margin,
   rollback, and owner.

Stable compile-time product policy with multiple real consumers belongs in the
narrow Channel feature's `constants.ts` using Effect `Duration`, branded
Schema values, and `Schedule`. Environment-, project-, plan-, deployment-, or
provider-specific values belong in the owning `config.ts` through
`Config.schema`; secrets remain redacted. `constants.ts` must not become a
generic timeout/retry dump, and generated Eve configuration is not copied into
Bundjil constants.

## Requirements

### `HEQ-REQ-001` — immutable qualification identity

Every Preview and Production packet must bind the exact Git SHA, dependency
lock, Eve version/reference, configuration fingerprint, immutable deployment,
environment, function/runtime identity, authority, observation window and
rollback deployment. Branch names, local output, aliases and old receipts
never substitute.

### `HEQ-REQ-002` — deployment-specific route/function evidence

Every hosted packet must read back the actual route-to-function mapping and
effective duration for the immutable deployment. The generated local mapping
is a preflight only. Topology is dated evidence, never an architecture
dependency.

### `HEQ-REQ-003` — pinned Eve lifecycle contract

Implementation and proof must retain the exact webhook → `EveChannelDispatch`
→ `send()` → `deliver/resumeHook` or `run/startWorkflowPreferLatest` → session
workflow → turn child workflow call graph. A second app-level Workflow, raw
Workflow client, copied DTO, or request closure is forbidden unless a future
pinned-source finding identifies and directly proves a missing Eve boundary.

### `HEQ-REQ-004` — `202` follows durable Eve acceptance

The route must return `202` only after the exact `send()` Promise resolves and
a provider-safe fingerprint of its session/run identity is observable. For an
existing continuation, the accepted identity must converge on the intended
owner run; a different new run after an uncertain `resumeHook` failure is not
successful continuation. A started Effect Fiber, registered `waitUntil`,
queue-trigger presence, workflow function existence, newly started fallback
run, or HTTP response alone is a false green. Rejection, continuity uncertainty
or handoff timeout before acceptance must return a provider-retryable non-2xx
or retained quarantine outcome, and must not mark inbound work complete.

### `HEQ-REQ-005` — bounded `waitUntil` claim

`waitUntil` must be described and tested only as ordinary-function lifetime
extension up to the `__server` timeout. The current Fiber's `Exit` must settle
and be classified, but it is not the durable oracle. After acknowledgement
ordering changes, every remaining post-acceptance `waitUntil` action must be
named, idempotent, observable, and non-critical to the accepted reply.

### `HEQ-REQ-006` — exact duplicate and replay oracle

Redelivery of the exact authenticated provider event identity must yield one
accepted work fingerprint, one Eve delivery/session transition, one logical
turn/result, one outbound provider effect, and zero second user-visible
response. `204`, a replay key, a different event ID, source inspection, or a
Workflow run count alone is a false green.

### `HEQ-REQ-007` — provider-safe observability

Logs, metrics and receipts must encode only Schema-owned phases, tagged
outcomes, bounded counts/latency, environment/source/config/deployment
fingerprints, and HMAC-derived work/session/run fingerprints. Content, phone
identity, raw provider/replay/session/run IDs, hook tokens, Workflow
inputs/outputs, secrets, URLs with query data, raw errors, Causes and stacks
must never enter retained evidence.

### `HEQ-REQ-008` — direct Preview workflow acceptance proof

The exact Preview deployment must show the controlled request's safe
fingerprint, acceptance mode, intended and accepted session/run identity,
`send()` acceptance, `202` ordering, matching Vercel Workflow run, session
workflow, turn child workflow, terminal/waiting outcome, and one provider
effect. Dashboard/run evidence must be bounded to the deployment, run, provider
and observation window. Local generated output or DeepWiki research is not
hosted proof.

### `HEQ-REQ-009` — interruption and durable-resumption proof

Under an approved Preview-only test hook, one deliberately slow but bounded
model/tool step must remain below the accepted invocation limit and be visible
in the Workflow run. Preview must interrupt that step after durable acceptance
and before it completes, then prove the same workflow/run resumes from the last
checkpoint and produces one terminal result with no duplicate outbound effect.
The proof must distinguish process timeout/crash/deployment replacement from
platform availability and reject a fast fixture, Effect retry, a new run, or
warm-instance reuse as the oracle.

### `HEQ-REQ-010` — timeout separation and supported configuration

Webhook handoff, workflow/turn step invocation, Sandbox idle timeout and
session lifetime must have separate owners, measurements, limits and
non-claims. Preserve generated workflow `"max"`. Pinned Eve is the Nitro
Build Output owner and exposes no application duration seam; set `__server` or
step durations only through a subsequently supported Eve source/framework
owner proven to change the exact generated function, then Preview-read back the
value. A 30-minute Sandbox default, project default, guessed source glob,
patched generated file, or local `.vc-config.json` is a false green.

### `HEQ-REQ-011` — Effect retry and uncertain side effects

Schema-tagged expected failures, `Effect.retry` and `Schedule` may apply only
to explicitly eligible transient failures inside a running Eve step/provider
operation. Attempt ceiling, backoff, jitter and per-attempt timeout must be
directly tested. An interrupted or outcome-uncertain non-idempotent provider
write must be observed by exact operation identity before convergence; absent
readback it fails visibly and is never blindly retried. An in-process Effect
retry does not prove workflow recovery.

### `HEQ-REQ-012` — terminal failure visibility

Accepted work that later fails must retain a safe terminal state, alert owner,
monitoring threshold and user repair/resend route. A terminal log without
retained state and alerting is a false green. Retention and idempotency/fencing
lifetime must cover the longest revalidated provider retry horizon.

### `HEQ-REQ-013` — Production qualification after Preview

Production qualification is allowed only after accepted Preview proof for the
same source, lock, Eve lifecycle, timeout contract and configuration. It must
repeat fresh source/deployment/provider/function/duration/Workflow readback and
one minimal controlled journey per active provider. The historical Production
receipt never proves a newer source.

### `HEQ-REQ-014` — rollback and monitoring

Preview and Production tasks must name previous deployment/configuration,
retry-horizon drain, replay/work quarantine, in-flight Eve run handling,
provider rollback, stop conditions, alert thresholds, recovery oracle and
post-operation readback. Rollback must not clear replay state, replay uncertain
provider writes, or terminate compatible Eve runs merely to restore an alias.

### `HEQ-REQ-015` — Effect and boundary quality

Unknown host/provider/platform values decode once at ingress through the
owning Effect Schema and outward values encode at their adapter. Use branded
identities, tagged errors, Config/Redacted, named services, explicit live/mock
Layers, Scope/Fiber/Exit/Match and flat lazy linear Effects. Raw clients,
generic callbacks, primitive semantic strings/config, unchecked data, manual
readers, DTO mirrors, casts, `instanceof` policy, pass-through wrappers and
helper/common/utils sprawl are forbidden.

### `HEQ-REQ-016` — direct requirement-to-proof traceability

Every material `must`, `required`, `never` and accepted finding must retain an
owning task, direct observable, expected postcondition, plausible false green,
focused command/procedure owner, evidence owner, limitation and non-claim.
Broad-suite success never proves a boundary by proxy.

### `HEQ-REQ-017` — one terminal five-pass audit

After all implementation and hosted tasks are terminal, run one audit in this
order: ownership/call graph; Effect quality; boundary/lifecycle correctness;
verification/adversarial coverage; documentation/authority/closeout. Findings
reopen their owning task, invalidate stale receipts, and require refreshed
focused proof plus a new terminal audit.

### `HEQ-REQ-018` — authority and explicit non-claims

Every deployment, provider journey, message, typing action, promotion,
rollback, revocation or provider mutation requires its target-owned runbook
and one-run authority. Warm reuse, route co-location, scale-out cardinality,
host shutdown/finalizer behavior, Sandbox lifetime, exactly-once external
effects, unobserved handset display and platform availability are explicit
non-claims unless a separate product SLO makes one directly testable.

## Requirement-to-proof crosswalk

The sibling task ledger is the full machine-readable owner. This compact view
routes every requirement to its direct proof:

| Requirement   | Direct observable and postcondition                                                    | False green rejected                        | Procedure/evidence owner                                  | Limitation                                |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| `HEQ-REQ-001` | Exact source/lock/Eve/config/deployment/rollback tuple matches the packet.             | Branch, alias or old receipt.               | Deploy runbook; dated packet.                             | Identity alone proves no behavior.        |
| `HEQ-REQ-002` | Immutable deployment maps Channel routes to read-back functions/durations.             | Local output or code layout.                | Vercel readback; packet detail.                           | Topology is deployment-specific.          |
| `HEQ-REQ-003` | Source/test call graph reaches Eve-owned workflow start/resume and turn child.         | App Workflow wrapper.                       | Agent tests/build; source receipt.                        | Local source is not hosted acceptance.    |
| `HEQ-REQ-004` | `sendAcceptedAt <= response202At`; acceptance mode and intended/accepted run converge. | Fiber, `waitUntil`, or fallback fork.       | Focused agent test and Preview run packet.                | Dashboard visibility is not turn success. |
| `HEQ-REQ-005` | Fiber `Exit` and remaining post-ack work settle within `__server` duration.            | Treating settlement as durability.          | Agent test and bounded function logs.                     | Only observed invocation is proved.       |
| `HEQ-REQ-006` | Exact duplicate yields one Eve turn/result/effect and zero second response.            | `204` alone.                                | Provider runbook and messaging packet.                    | One controlled identity only.             |
| `HEQ-REQ-007` | Schema round trip and leak fixtures; bounded logs have zero forbidden markers.         | Clean broad logs.                           | Agent tests and packet detail.                            | Cannot prove unqueried logs.              |
| `HEQ-REQ-008` | Matching intended Preview session plus workflow/turn readback follows `send()`.        | Any newly started run after resume failure. | Vercel Workflows dashboard/readback; Preview packet.      | One deployment/run only.                  |
| `HEQ-REQ-009` | Named interruption resumes same run/checkpoint to one terminal result.                 | In-process retry or warm reuse.             | Approved Preview interruption procedure; workflow packet. | Injected failure points only.             |
| `HEQ-REQ-010` | Four clocks are separate; Eve-owned Nitro output and hosted values are read back.      | Sandbox, guessed glob, or output patch.     | Timeout task, build output and Preview function readback. | Plan/provider limits may change.          |
| `HEQ-REQ-011` | Independent attempt/backoff/jitter/uncertainty/idempotency fixtures.                   | One retry test.                             | Agent/provider tests.                                     | Mocks require hosted confirmation.        |
| `HEQ-REQ-012` | Retained failed state, alert and user repair route share one safe identity.            | Error log only.                             | Monitoring/runbook and failure packet.                    | No guarantee user acts on alert.          |
| `HEQ-REQ-013` | Fresh Production readback plus one journey per active provider matches final Preview.  | Historical Production receipt.              | Deploy/provider runbooks; Production packet.              | Controlled window only.                   |
| `HEQ-REQ-014` | Rollback/drain/quarantine triggers and recovery readback are complete.                 | Previous alias only.                        | Runbooks and rollback packet.                             | No authority to execute.                  |
| `HEQ-REQ-015` | Focused Effect/boundary audit and tests show canonical contracts/layers.               | Typecheck alone.                            | Source/tests and policy gates.                            | Repository proof only.                    |
| `HEQ-REQ-016` | Every requirement/task row has all eight proof fields.                                 | Broad suite proxy.                          | Sibling ledger and PRD review.                            | Traceability is not runtime proof.        |
| `HEQ-REQ-017` | One five-pass receipt exists after all dependencies; reopened tasks refresh proof.     | Slice-by-slice review.                      | Terminal audit task.                                      | Audit cannot grant external authority.    |
| `HEQ-REQ-018` | One-run envelopes precede every consequence; non-claims remain in packets.             | Tool access or old approval.                | Authority register/runbooks/packets.                      | External readback owns actuality.         |

## Direct adversarial matrix

Focused fixtures and hosted procedures must prove separately:

- new-session `send()` awaits `startWorkflowPreferLatest` and returns the
  accepted run identity;
- existing-session `send()` awaits `resumeHook` and returns the owner identity;
- `resumeHook` not-found fallback starts one new session without producing a
  second result;
- a non-not-found `resumeHook` error cannot be treated as successful
  continuation merely because Eve's fallback starts a different run;
- `202` is absent when start/resume rejects or exceeds the handoff deadline;
- `202` follows accepted run identity and precedes later turn completion;
- function termination before acceptance yields provider retry, not an
  accepted claim;
- function termination after acceptance leaves Eve to resume the same run;
- interrupted Eve step resumes from the named checkpoint;
- concurrent and delayed exact-ID duplicates cannot start a second logical
  turn/result/provider effect;
- retry eligibility, three-attempt proposed ceiling, exponential backoff,
  bounded jitter and operation timeout are independent properties;
- timeout-before-side-effect differs from timeout-after-side-effect;
- uncertain provider outcome is observed or quarantined, never blindly sent;
- terminal failure produces retained state, alert and repair path;
- generated workflow function preserves Node 24, queue trigger and `"max"`;
- generated `__server` effective duration is measured/read back, not inferred;
- malformed SDK/provider output becomes a safe tagged error; and
- every forbidden log/receipt marker remains absent.

The three-attempt Effect ceiling is a proposed product default, not an
upstream mandate. Backoff, jitter and exact operation timeouts remain pending
measured provider/step evidence; no durable Workflow retry constant is copied
into Bundjil because Eve owns its Workflow lifecycle.

## Qualification stages

### Stage 1 — local call-graph and build-output proof

Update only the narrow Channel handoff/observability boundary. Run direct agent
tests, generated Build Output assertions and the exact repository gates. Prove
the current and corrected ordering with deterministic delayed/rejected
`send()` fixtures. This stage makes no hosted claim.

### Stage 2 — isolated Preview acceptance and interruption

Under one-run authority:

1. deploy an immutable Preview candidate;
2. read back exact source/config/Eve/runtime/function mapping and durations;
3. run one accepted message and capture its safe work/run fingerprint;
4. prove `202` follows the matching workflow acceptance;
5. inspect the Vercel Workflow run, session driver and turn child;
6. exercise one qualification-only, deliberately slow but bounded model/tool
   step below the accepted step limit and observe it in that same run;
7. redeliver the exact provider event and prove zero second effect;
8. inject one approved interruption during the slow step and prove same-run
   resumption without a duplicate outbound effect;
9. query bounded function/workflow/provider logs and monitoring;
10. exercise or rehearse rollback without touching Production; and
11. retain accepted, failed, blocked or inconclusive packets.

### Stage 3 — Production candidate

Only after final Preview acceptance for the identical candidate, repeat fresh
readback and one minimal controlled journey per active provider. Handset
evidence is required only for an explicitly named user-display claim. Any
promotion requires separate authority and fresh stable-alias readback. The
2026-07-23 Production receipt remains historical evidence only.

## Existing exact repository commands

Run from the repository root:

```bash
bun run --filter @bundjil/channel check-types
bun run --filter @bundjil/channel test
bun run --filter @bundjil/channel build
bun run --filter @bundjil/sendblue check-types
bun run --filter @bundjil/sendblue test
bun run --filter @bundjil/sendblue build
bun run --filter @bundjil/photon check-types
bun run --filter @bundjil/photon test
bun run --filter @bundjil/photon build
bun run --filter @bundjil/agent check-types
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
bun run --filter @bundjil/agent preflight:production
bun run check:boundaries
bun run check:effect-setup
bun run check:docs
bun run check:skills
bun run check:authority
bun run check:controls
bun run check:verification
bun run verification
git diff --check
```

`preflight:production` accepts only its existing sanitized snapshot. It grants
no external actuality or authority. New command names enter this list only
after their scripts and verification owners exist.

## Docs-maintainer impact ledger

| Surface                           | Decision                                                | Earliest owner, action, proof and non-claim                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical SPEC/tasks/index        | Change required                                         | This SPEC, sibling ledger and `docs/product-specs/index.md` record corrected Eve ownership. `bun run check:docs` proves routing only.                                                                |
| Documentation audit               | Change required                                         | Keep `docs/documentation-audit/HGI-307-impact-ledger.json` inventory/digest aligned with authoritative path membership.                                                                              |
| Architecture                      | Change required during implementation                   | `docs/architecture/eve-agent.md` must own the corrected handoff and timeout taxonomy. Preserve general Effect/repo/testing rules unless a real boundary changes.                                     |
| Root/app/package READMEs          | `apps/agent/README.md` Change required; others Preserve | Route the accepted Eve-owned workflow boundary and supported timeout owner. Do not expand root/package READMEs into runbooks.                                                                        |
| Runbooks                          | Change required before hosted proof                     | Update deploy, Sendblue, Photon and incident-revocation owners for Workflow run readback, handoff ordering, timeout readback, interruption, rollback and monitoring.                                 |
| Authority model/register          | Preserve rationale; conditional Change required         | Update static envelopes only when the actual Vercel read/control operation changes. No new app-level Workflow resource is added.                                                                     |
| Verification journeys/command map | Change required                                         | Add direct durable-handoff/interruption journey and command owner; preserve existing deployment/provider journeys.                                                                                   |
| Receipts/evidence index           | Change required per attempt                             | Add immutable Preview/Production packet/detail artifacts; retain failed/inconclusive and historical receipts.                                                                                        |
| Skills/`AGENTS.md`                | Preserve                                                | Existing PRD, docs, Effect boundary and authority rules are sufficient.                                                                                                                              |
| Lint/config/CI                    | Preserve now; conditional Change required               | Eve's Nitro builder owns `__server` output and exposes no app duration seam. Do not guess `vercel.json` globs or patch generated output; use a supported Eve change only if measurements justify it. |
| Schemas/services/Layers           | Change required during implementation                   | Narrow Channel handoff observation and safe run identity only; reuse Eve `send()`. No raw Workflow client or second Workflow service.                                                                |
| Tests/fixtures                    | Change required                                         | Add direct delayed/rejected send, 202 ordering, acceptance identity, duplicate, interruption, timeout and leak fixtures.                                                                             |
| Monitoring                        | Change required                                         | Add safe handoff latency/outcome, workflow-run correlation, terminal failure/alert and duplicate metrics.                                                                                            |
| Rollout/rollback                  | Change required                                         | Preserve compatible Eve runs, replay state and uncertain sends; define timeout/config rollback and fresh readback.                                                                                   |
| Active/completed plan lifecycle   | Preserve now                                            | Create an active plan only when implementation begins; terminal audit closes it after accepted receipts.                                                                                             |
| Frontend/browser/accessibility    | Evidenced N/A                                           | No React, browser rendering, URL state, visible UI or accessibility contract changes in this SPEC.                                                                                                   |
| Package release/publication       | Evidenced N/A                                           | No tag, npm publication, public release or package versioning is requested.                                                                                                                          |

## Recommended execution sequence

1. Add safe `send()` acceptance identity, handoff latency and Fiber `Exit`
   observability plus direct deterministic fixtures.
2. Correct the `202` ordering by awaiting Eve acceptance, without adding an
   app-owned Workflow.
3. Build and assert Eve's generated `flow` and `__server` entrypoints, including
   Eve/Nitro configuration ownership.
4. Measure/read back the four timeout classes; preserve Eve's workflow
   `"max"` and add an `__server` override only through a supported Eve seam if
   the measured default is insufficient.
5. Qualify the exact candidate in isolated Preview with Workflow dashboard/run,
   duplicate, interruption/resumption, logs, monitoring and rollback proof.
6. Qualify the identical Production candidate per active provider under fresh
   authority.
7. Run the single terminal five-pass audit; reopen owning tasks and invalidate
   stale receipts for every finding.

## Remaining product and implementation decisions

- Product owner: accepted webhook handoff target/deadline and safety margin
  below every active provider deadline.
- Product owner/operator: terminal failure alert threshold, retention and
  user repair/resend promise.
- Architecture/product owners: whether measured handoff latency and the
  effective hosted project default justify requesting/adding a supported Eve
  application seam for Nitro `vercel.functions.maxDuration`. Pinned Eve
  `0.20.0` exposes none; a guessed `vercel.json` glob is rejected.
- Architecture/product owner: individual model/tool step timeout values after
  measured latency and plan-limit readback. Overall Workflow/session lifetime
  is not that value.
- Provider owners: exact readback/idempotency contract for outcome-uncertain
  Sendblue and Photon writes.
- Operator: approved Preview interruption mechanism and Workflow run readback
  procedure that exposes no data-plane values.

No decision remains about adding an app-owned Workflow: current pinned evidence
rejects it. A future Eve upgrade can reopen that conclusion only with a new
pinned call-graph review.

## Review outcome

Repository-local `prd-review` accepted the corrected ownership model and the
continuity-fork correction subject to the decisions above. Repository-local
`docs-maintainer` requires the impact ledger and exact checks in this artifact.
Review acceptance proves document quality only; it does not prove hosted
durability, effective timeout, provider state or authority.
