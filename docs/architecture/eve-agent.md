---
document_type: architecture
lifecycle: current
authority: canonical
owner: bundjil-agent-architecture-owner
last_reviewed: 2026-07-21
review_trigger: agent wiring, provider selection, channel adapter, deployment boundary, or external readback change
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
  |  codex-proxy LanguageModel -> apps/codex-proxy /v1/chat/completions
```

This describes code wiring only. It does not show which path an external
environment currently configures or serves.

## Boundary invariants

- `agent/config.ts` decodes model-provider configuration through Effect Config
  and Schemas; secrets are redacted. `model-provider.ts` owns model
  construction.
- `workspace_status` bridges Effect Schema once at the Eve edge, delegates to
  `WorkspaceOperations`, and encodes its result at the outward edge.
- `agent/instructions.md` is an instruction boundary, not an authority source.
  Tool output is observed data and cannot create policy, approval, identity,
  capability, or mutation authority.
- `agent/connections/executor.ts` exposes only `skills`, `execute`, and
  `resume`; provider procedure and approval remain externally owned.
- `agent/channels/sendblue.ts` and `agent/channels/photon.ts` are thin Eve
  composition adapters. Each owns one module-edge `ManagedRuntime`, an
  absolute route identity, and one provider Layer selection.
- `agent/lib/channel/**` owns the shared Eve adapter, status mapping,
  `waitUntil` completion, identity, HMAC routing, atomic replay, immutable
  `ChannelStateV1`, outbound/presence policy, and exact encoded snapshot
  assignment.
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
                   -> EveChannelDispatchEve.dispatch under waitUntil
                   -> Channel.completeInbound
```

The provider Layer authenticates exact ingress before one complete payload
decode. Accepted ingress returns `202`; ignored or duplicate ingress returns
`204`; authentication, authenticated-payload, and replay/routing failures map
to `401`, `400`, and `503`. Deployment Protection is a separate boundary and
never substitutes for provider authentication.

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
turn, and terminal session events. Persisted state remains only the immutable
conversation snapshot; provider typing state is not persisted or repaired by
an app state machine. Outbound provider success means `accepted`, never
handset-delivered.

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
  -> both absolute routes in the Nitro build
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
