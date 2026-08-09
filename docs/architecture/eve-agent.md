---
document_type: architecture
lifecycle: current
authority: canonical
owner: bundjil-agent-architecture-owner
last_reviewed: 2026-08-09
review_trigger: agent wiring, provider selection, Channel runtime, Fiber, Scope, waitUntil, Eve Workflow lifecycle, generated Build Output, deployment boundary, or external readback change
---

# Eve agent architecture

This document owns the durable source-backed topology and invariants of the
Eve app. It does not assert a current Vercel deployment, provider connection,
webhook registration, credential binding, or handset outcome. External systems
own those facts at readback time. The dated reconciliation and its limitation
are in [`HGI-301-eve-reconciliation.json`](../documentation-audit/HGI-301-eve-reconciliation.json).

## Durable topology

`apps/agent` owns the Eve filesystem runtime, configuration, model selection,
channel orchestration, identity, routing, atomic replay, request-scoped
dispatch, instructions, tools, provider composition roots, and deployment
boundary. `@bundjil/channel` owns the nominal provider-neutral direct-text
transport contract. `@bundjil/sendblue` and `@bundjil/photon` own independent
provider wire/SDK adapters and live/memory Layers. `@bundjil/store` owns
provider-neutral persistence contracts and adapters.

`@bundjil/eve` owns reusable Eve-facing Effect Schema contracts and named
operations. `apps/codex-proxy` owns the private HTTP proxy boundary and
`@bundjil/codex` owns its provider/profile contracts. The agent selects a model
provider but does not import Codex OAuth/profile services or direct Codex
Responses clients.

The source supports two model selections:

- `gateway` is the default selected by `BUNDJIL_AGENT_MODEL_PROVIDER`.
- `codex-proxy` creates an OpenAI-compatible `LanguageModel` for the private
  proxy when the app-owned Config requirements decode successfully.

```text
Eve HTTP/API -> apps/agent/agent/agent.ts -> agent/config.ts
  -> gateway model string
  |  codex-proxy LanguageModel
       -> agent/instrumentation.ts records no inputs/outputs
       -> W3C trace context to the configured private proxy origin only
       -> apps/codex-proxy /v1/chat/completions
       -> proxy continues the trace until its SSE response settles
```

This describes code wiring only. It does not show which path an external
environment currently configures or serves.

Preview replay evidence currently uses Eve's framework-owned Agent Runs
surface as lower-bound metadata. `EVE_TRACES_CONTENT=off` is required for that
Preview proof so trace content is not captured. OpenTelemetry remains restricted
observability for safe application spans, but it is not the acceptance oracle
for a model-attempt count because a CLI admission trace does not necessarily
follow Eve's queued worker.

The optional strict replay enhancement is intentionally two-part: a supported public
Eve-to-provider correlation value must reach the private provider request, and
the proxy/provider boundary must record the correlated lifecycle through the
native `AtomicKeyValueStore` service. Native Effect logs support operations but
are not durable replay evidence. Eve's internal attempt scope, runtime context
as an HTTP header, process-local state, and generic KV read/modify/write are
not supported architecture paths. This enhancement is not required for the
completed Terra/high rollout; its future proof gate lives in the
[Codex Terra SPEC](../product-specs/codex-terra-high-reasoning.md).

As of the installed Eve `0.29.5`, that enhancement prerequisite is unavailable.
`defineDynamic` can select a live model at `step.started`, but the public
resolver receives `event: unknown` and a session-level context, not a stable
turn, step, or attempt identity. The documented stream `meta.id` exists only
after durable emission and cannot be repurposed as a pre-egress resolver input.
The [dated local receipt](../evidence/verification/packets/codex-terra-eve-correlation-blocked-2026-08-09.json)
retains this limitation. Do not add a fallback bridge from message contents,
telemetry, internal Eve source, process state, proxy-only counters, or a
standalone receipt that cannot meet the required correlation contract.

## Boundary invariants

- `agent/config.ts` decodes model-provider configuration through Effect Config
  and Schemas; secrets are redacted. `model-provider.ts` owns model
  construction.
- `agent/instrumentation.ts` is an Eve-owned telemetry boundary, not a model
  wrapper. It uses the already-decoded selected provider configuration to
  restrict Vercel OpenTelemetry fetch propagation to the private Codex proxy
  origin and disables AI SDK input/output capture. The trace exists for the
  operator's restricted observability only; Bundjil never retains raw session/turn IDs,
  prompts, responses, tokens, tools, or reasoning in a repository receipt.
- `workspace_status` bridges Effect Schema once at the Eve edge, delegates to
  `WorkspaceOperations`, and encodes its result at the outward edge.
- `agent/instructions.md` is an instruction boundary, not an authority source.
  Tool output is observed data and cannot create policy, approval, identity,
  capability, or mutation authority.
- `agent/connections/executor.ts` exposes only `skills`, `execute`, and
  `resume`; provider procedure and approval remain externally owned.
- `agent/channels/sendblue.ts` and `agent/channels/photon.ts` are thin Eve
  composition adapters. Each owns one `ManagedRuntime` for its loaded provider
  composition root in that JavaScript module instance, an absolute route
  identity, and one provider Layer selection. They do not share a Context,
  Scope, build fiber, or `Layer.MemoMap`.
- `agent/lib/channel/**` owns the shared Eve adapter, status mapping, bounded
  acceptance wait, safe handoff/session observations, identity, HMAC routing,
  atomic replay and continuity fencing, immutable `ChannelStateV1`,
  outbound/presence policy, and exact encoded snapshot assignment. The adapter
  receives the concrete provider runtime and performs the minimum Effect
  interpretation at Eve's JavaScript boundary; no domain service receives a
  runtime.
- Provider input is authenticated and decoded once in its owning package.
  Only decoded `@bundjil/channel` values cross into app policy; provider DTOs,
  raw SDK values, callbacks, Promises, and secrets remain private.
- Sendblue and Photon typing are stateless `ChannelTransport.setPresence`
  operations. Provider acceptance is not evidence that a handset displayed a
  typing indicator.
- The clean path reads no legacy Sendblue config, state, replay keys,
  continuation algorithm, typing lifecycle, implementation modules, or tests.

## Source call graphs

```text
workspace_status
  -> apps/agent/agent/tools/workspace_status.ts
  -> toEveSchema(WorkspaceStatusInput / WorkspaceStatusSuccess)
  -> getWorkspaceStatus
  -> WorkspaceOperations
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
```

The provider-specific paths differ only at the route and transport Layer:

```text
POST /eve/v1/sendblue/webhook              POST /eve/v1/photon/webhook
  -> SendblueChannelRuntimeLive              -> PhotonChannelRuntimeLive
  -> @bundjil/sendblue layerLive              -> @bundjil/photon layerLive
                  \                          /
                   -> makeChannelEveChannel
                   -> Channel.decodeWebhook(Request)
                   -> Channel.prepareInbound(decoded message)
                   -> ChannelIdentity.resolve
                   -> ChannelRouter.route
                   -> ChannelReplay.claimInbound
                   -> AtomicKeyValueStore.transact
                   -> ChannelHandoff.prepared (safe work fingerprint)
                   -> EveChannelDispatchEve.dispatch
                   -> ChannelHandoff.sendStarted
                   -> await Eve send() within the handoff deadline
                   -> ChannelHandoff.sendAccepted/sendRejected
                   -> ChannelReplay.acceptInbound atomic continuity fence
                   -> new/resumed convergence or uncertain quarantine
                   -> ChannelHandoff.settled from native Effect Exit
                   -> ChannelHandoff.response
                   -> 202 only for converged acceptance
```

The provider Layer authenticates exact ingress before one complete payload
decode. Converged Eve acceptance returns `202`; ignored, exact duplicate, and
retained uncertain ingress returns `204`; authentication,
authenticated-payload, and replay/routing/acceptance failures map to `401`,
`400`, and `503`. Deployment Protection is a separate boundary and never
substitutes for provider authentication.

Request preparation and the exact Eve `send()` operation run with the concrete
provider runtime's `runPromise`. The route does not acknowledge in a
background Fiber and registers no critical `waitUntil` work. Its native Effect
`Exit` is classified as succeeded, typed failure, defect, or interruption
without retaining the error, Cause, or stack. Client abort does not cancel the
already-started acceptance operation; runtime disposal interrupts it and runs
cooperative finalizers without producing `202`. The adapter constructs or
disposes no runtime per request and adds no Channel-wide retry.

`ChannelHandoff` imports the redacted Channel routing secret once per concrete
runtime and uses domain-separated HMAC inputs to derive distinct branded work
and Eve-session fingerprints. Its Schema-owned prepared, send-started,
send-accepted/rejected, response, and Exit observations contain only those
fingerprints, bounded epoch/latency numbers, phases, outcomes, and response
status. Raw replay/session/run IDs, provider identity, content, continuation or
hook tokens, inputs/outputs, URLs, secrets, errors, Causes, and stacks do not
enter the observation contract. The memory Layer supplies deterministic phase
and leak fixtures without exposing a logger or Eve runtime client.

The handoff deadline is an app-owned product acknowledgement target, decoded
as a positive Effect `Duration` from
`BUNDJIL_CHANNEL_HANDOFF_TIMEOUT_MILLISECONDS`. Its documented local default
is 15 seconds: below Sendblue's last documented 45-second response deadline,
while leaving the provider retry path available. This is not a provider
requirement, hosted latency measurement, Vercel function-duration readback,
Workflow step duration, Sandbox idle timeout, or session lifetime. A timeout
interrupts only the local wait, records a safe timeout phase, retains the
inbound claim as outcome-uncertain, returns `503`, and never blind-retries the
possibly accepted Eve write.

The four clocks are intentionally separate:

| Clock                               | Owner                                                                         | Current repository value                                                     | Hosted/provider bound                                                                                       | Required readback                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Webhook-to-Eve acceptance           | Bundjil Channel config and `ChannelHandoff`                                   | Positive `Effect.Duration`; 15-second product default                        | Sendblue currently documents a 45-second response window; no numeric Photon requirement is established      | Cold/warm new and resume distributions for the immutable candidate |
| Eve Workflow/turn invocation        | Eve Workflow-generated function and the operation-specific model/tool adapter | Eve flow remains `maxDuration: "max"`; no app model/tool ceiling is accepted | Effective plan maximum and measured model/tool/provider distributions are unknown                           | Workflow run/function detail for the exact candidate               |
| Vercel ordinary `__server` function | Eve-created Nitro Build Output, then Vercel project/deployment precedence     | Local generated `.vc-config.json` omits `maxDuration`                        | Project default, Fluid setting, plan, and effective deployment value are unavailable from repository source | Exact immutable deployment resource/function readback              |
| Vercel Sandbox lifecycle            | Eve Sandbox invocation                                                        | Eve upstream default is 30 minutes of inactivity                             | Plan/runtime limits can change independently                                                                | Read only when a Sandbox-backed journey requires it                |

Session retention and closure form a fifth product lifecycle policy, not a
function timeout. No clock borrows the value of another. The 15-second handoff
default is passed through Turbo's agent build environment allowlist, but it is
not accepted as a hosted latency or function-duration value until the named
readbacks exist.

The atomic continuity record owns the last accepted session fingerprint per
continuation token. No prior owner is a deliberate new start. A matching
accepted fingerprint is a resume. A different fingerprint while an owner is
active is a continuity fork: the inbound claim is quarantined and the route
returns `503`, even though Eve `send()` resolved. A terminal session event
retires only its matching owner; a stale terminal event cannot clear a newer
owner. Failed terminal settlement additionally retains a safe failure marker
for the configured replay lifetime. The next authenticated event can create a
new owner after that matching failed session is retired.

Installed Eve exposes no authored Channel-module teardown hook during local
cache replacement or development-server close, and Vercel exposes no
repository-observable per-instance shutdown callback. `waitUntil` remains only
an ordinary-function lifetime extension and is not used for critical
acceptance or durable execution. Current local build proof loads both provider
roots; future bundle splitting, warm-instance reuse, scale-out, freeze, and
shutdown remain deployment readback questions.

Pinned and lock-resolved Eve `0.29.5` owns the durable boundary behind
the route-owned `send()` operation. `send()` first awaits
`runtime.deliver()`, whose Workflow runtime awaits `resumeHook` and returns the
owning run identity. On any delivery rejection, including but not limited to
Eve's no-active-session error, `send()` can fall through to `runtime.run()`;
that operation awaits `startWorkflowPreferLatest` for Eve's session
`workflowEntry`. The session driver dispatches each logical turn through
`startWorkflowPreferLatest(turnWorkflowReference)`.

```text
Channel webhook
  -> EveChannelDispatch
  -> Eve send()
     -> deliver() -> resumeHook -> existing owner run
     |  any delivery rejection -> run() -> startWorkflowPreferLatest
        -> workflowEntry session driver
        -> dispatchAndAwaitTurn
        -> startWorkflowPreferLatest(turnWorkflowReference)
```

Bundjil must not add an app-owned Workflow, raw Workflow client, queue
fallback, or mirrored runtime service around this call graph. Resolution of
`send()` is the earliest source-level Workflow acceptance boundary, but an
established continuation still requires intended/accepted run convergence:
Eve's all-error fallback can otherwise resolve through a different new run.
Source inspection alone does not prove that hosted convergence.

When `VERCEL=1`, Eve directly creates Nitro with the Vercel preset. Eve
`0.29.5` supplies Build Output framework metadata but exposes no
Bundjil-facing `vercel.functions` option for the ordinary generated
`__server`. Eve separately patches the generated Workflow `flow` function to
Node 24, its namespaced queue trigger, and `maxDuration: "max"`. Bundjil
preserves those owners and does not guess a `vercel.json` source glob or patch
generated output. The agent test command creates both ordinary local output
and Vercel Build Output, then Schema-decodes the generated route/function
contracts. These are local artifact assertions only; an immutable hosted
deployment must read back its own mapping and effective durations.

Vercel's supported Nitro configuration owner is
`defineNitroConfig({ vercel: { functions: { maxDuration }}})`. Because Eve
creates Nitro internally and exposes no application input for that object in
`0.29.5`, Bundjil cannot use the supported seam without an upstream Eve
change. A source `vercel.json` glob must name a real source entrypoint and
therefore cannot safely target the generated `__server`. Until measurements
show a need and a supported Eve seam exists, retain the effective project
default as an explicit hosted blocker rather than patching Build Output.

Eve events use the same Channel service:

```text
turn.started / authorization.completed
  -> Schema.decodeEffect(ChannelAdapterState)
  -> Channel.handleEvent(PresenceRequested start)
  -> ChannelTransport.setPresence
  -> Schema.encodeEffect(ChannelAdapterState)

message.completed
  -> ChannelReplay.claimOutbound
  -> ChannelTransport.sendMessage
  -> accepted -> owner-fenced complete record
  -> uncertain -> owner-fenced uncertain record, never blind retry
  -> known rejection -> remove owned claim for an explicit retry
  -> immutable ChannelStateV1 -> encoded Eve snapshot
```

Presence stops on authorization-required, input-requested, waiting, terminal
turn, and terminal session events. Terminal session events also fingerprint
the Eve session identity and owner-fence continuity retirement. Persisted Eve
state remains only the immutable conversation snapshot; replay storage owns
the separate continuity/failure records. Provider typing state is not
persisted or repaired by an app state machine. Outbound provider success means
`accepted`, never handset-delivered.

## Test call graphs

```text
@bundjil/channel tests
  -> canonical contract and deterministic memory Layer

@bundjil/sendblue tests          @bundjil/photon tests
  -> shared conformance            -> shared conformance
  -> signed webhook/HTTP codecs    -> signed webhook/SDK lifecycle
  -> typing success/failure        -> typing success/failure/timeout

@bundjil/agent tests
  -> Config.schema and Redacted boundaries
  -> identity, routing, concurrent atomic replay, immutable state
  -> provider substitution through live/memory composition roots
  -> independent runtime build caching, concurrency, failure, and recovery
  -> deterministic HMAC separation and Schema/forbidden-marker fixtures
  -> delayed send withholding 202 plus concurrent exact-duplicate suppression
  -> new/resumed convergence and fallback continuity-fork quarantine
  -> send rejection/timeout plus Exit failure/defect/interruption observations
  -> terminal failure retention, matching repair, and stale-settlement fencing
  -> runtime-disposal interruption/finalizers and client-abort independence
  -> both absolute routes in the ordinary Nitro build
  -> installed Eve send/session/turn Workflow ownership
  -> Schema-decoded Vercel flow/__server route and duration output
```

Automated tests establish source behavior without provider credentials. They
do not prove current Preview or Production configuration, webhook topology,
typing display, message delivery, or handset outcome.

## Operations and evidence

The configured routes, webhook targets, deployment protection, environment
bindings, provider resources, and delivery results are deliberately absent.
Use [`apps/agent/runbooks/`](../../apps/agent/runbooks/README.md) for exact
operations, [`docs/operations/authority-model.md`](../operations/authority-model.md)
for the authority contract, and [`docs/verification/`](../verification/README.md)
for bounded journey packets.

Any Channel promotion requires fresh Vercel, provider, storage, and deployment
readback; isolated Preview; new secret and replay namespaces; ingress drain;
provider retry-horizon handling; webhook cutover; typed typing/message proof;
monitoring; rollback traffic quarantine; and retained immutable recovery
deployments. Unavailable readback is inconclusive, never healthy.

`docs/architecture/testing-and-quality.md` owns local command selection. A
runbook, authority register, proof template, old receipt, or source review does
not authorize or establish an external state.
