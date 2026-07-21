---
document_type: product-specification
lifecycle: implemented
authority: canonical
owner: bundjil-product-owner
created: 2026-07-21
last_reviewed: 2026-07-21
review_trigger: channel contract, provider implementation, Photon SDK/API, deployment, or proof change
---

# Schema-Driven Channels And Photon Preview Proof

## Implementation outcome

Implemented on `codex/photon-channel-provider-spec` as a clean replacement:
`@bundjil/channel` owns the nominal contract, `@bundjil/sendblue` and
`@bundjil/photon` provide independent Effect Layers, and `apps/agent` owns Eve
adaptation, identity, routing, replay, dispatch, and composition. The legacy
Sendblue source tree, configuration namespace, state, replay, typing lifecycle,
and callback graph were not migrated.

Deterministic local conformance and application journeys pass for both
providers. An authorised, bounded Photon provider lifecycle proof created,
read back, and deleted exactly one reserved webhook and exercised the scoped
SDK lifecycle, restoring the observed zero-webhook topology. This is provider
proof only: no Vercel Preview, handset delivery, Sendblue, or Production action
was authorised or performed. Production provider selection and promotion
remain gated by a new SPEC with fresh provider and deployment readback.

## Decision

Build a clean Channel architecture from canonical Effect Schemas,
`Context.Service` contracts, and explicit live/memory Layers:

```text
@bundjil/channel
  <- @bundjil/sendblue
  <- @bundjil/photon
```

`@bundjil/channel` owns the provider-neutral direct-message contracts and the
single nominal `ChannelTransport` service. `@bundjil/sendblue` and
`@bundjil/photon` implement that service through independent Layers. The agent
owns its Eve adapter, identity policy, fresh replay service, and orchestration
Layer.

This is a clean replacement, not an extraction or compatibility migration.
The current `apps/agent/agent/channels/sendblue.ts` and
`apps/agent/agent/lib/sendblue/**` implementation is repository truth about
what is deployed today, but it is not a design source for the replacement.
Implementation must not wrap, move, re-export, preserve, or generalize its
control flow, callback surface, persisted state, replay keys, typing state
machine, service graph, or error handling.

The previous immutable Production deployment and Git history are the rollback
artifact. No `legacy/`, `compat`, adapter bridge, dual decoder, old-state
importer, or old replay namespace belongs in the new source tree. Existing
Production remains unchanged until a separately authorized promotion.

The package boundary requires three packages. Two provider packages that each
declare a similar interface are not nominally substitutable. The neutral
contract must not live in `@bundjil/eve`, and it must not become a generic
`core`, `common`, `shared`, `helpers`, or `utils` package.

Implementation begins only after an active plan is created under
[`../exec-plans/active/`](../exec-plans/active/) and linked from its index.
Provider infrastructure remains outside this runtime SPEC and requires a
separate `prd-writer` then `prd-implementer` flow.

## PRD re-review: rejected legacy patterns

The 2026-07-21 `prd-review` inspected the current adapter and rejected these as
replacement inputs:

| Current pattern                                                                                             | Evidence                                                                                     | Replacement requirement                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Decode already typed values with `Schema.decodeUnknownEffect(...).pipe(Effect.orDie)`                       | `channels/sendblue.ts` typing and completion callbacks                                       | Decode unknown only at host/provider ingress; decode statically encoded values with `Schema.decodeEffect`; map every expected failure                              |
| Mutate an encoded state object through `Object.assign`                                                      | `channels/sendblue.ts` typing callbacks                                                      | Domain operations return a complete immutable decoded next state; the Eve adapter performs one exact framework-required encoded snapshot assignment                |
| Re-enter `ManagedRuntime.runPromise` throughout callbacks and inside `waitUntil` work                       | `channels/sendblue.ts` route/events                                                          | One module-edge runtime and one `runPromise` per Eve callback; domain code returns Effects                                                                         |
| Swallow arbitrary failures with `catchCause(() => Effect.void)`                                             | `channels/sendblue.ts` failed-session cleanup and `lib/sendblue/channel.ts` dispatch cleanup | Model expected failure with safe tagged errors or explicit best-effort outcome; retain sanitized failure observation                                               |
| Pass Eve's `send` callback through `SendblueChannel.dispatchAcceptedInbound`                                | `lib/sendblue/channel.ts` public service shape                                               | Wrap the framework callback once in an app-owned named `EveChannelDispatch` service at the route edge; no callback escape hatch                                    |
| Combine webhook auth, identity, routing, replay, typing, delivery, and framework state in `SendblueChannel` | `lib/sendblue/channel.ts`                                                                    | Separate provider transport, app orchestration, identity, replay, and Eve gateway service owners                                                                   |
| Capture dependencies then re-provide them method by method                                                  | `SendblueChannelLive`                                                                        | Express dependencies through `Context.Service` requirements and one composition-root Layer graph                                                                   |
| Hand-write provider-specific attempt/outcome unions and persist a provider-specific typing lifecycle        | `lib/sendblue/channel.ts`                                                                    | Use canonical Schemas/tagged errors for boundary and durable values; make typing a stateless best-effort transport effect unless evidence proves state is required |
| Derive new behavior from the old route/status/state/replay tests                                            | completed Sendblue implementation                                                            | Write tests from this SPEC, upstream protocol contracts, and installed framework types; retain old tests only until the replacement owns equivalent user journeys  |

These findings are acceptance failures, not refactoring suggestions. The new
implementation must include narrow negative scans for their recurrence in the
replacement channel slice.

## Goals

- Establish one provider-neutral, Schema-derived channel contract fulfilled by
  Sendblue and Photon Layers.
- Rewrite the Eve channel edge around one runtime, one decode per boundary,
  named services, immutable domain values, and explicit error mappings.
- Build `@bundjil/sendblue` from the Sendblue protocol contract rather than
  moving the current app implementation.
- Build `@bundjil/photon` around exact published Spectrum packages without
  leaking SDK or Zod types.
- Start with a new versioned channel state and replay namespace; import no old
  state or claims.
- Prove the entire new application path locally through memory Layers before
  any provider access.
- Prove Photon only in an isolated Vercel Preview and Photon project under
  separate authority.
- Keep content, identities, provider bodies, credentials, and protected
  resource values out of errors, logs, spans, tests, and proof.

## Non-goals

- Preserving legacy Sendblue continuation tokens, encoded state, replay
  physical keys, typing transitions, HTTP status choices, internal error tags,
  module names, or test structure.
- Reading old session/replay data or keeping a compatibility decoder.
- Production Photon promotion, Sendblue retirement, or Production deployment.
- Photon or Sendblue account, project, line, phone, webhook, billing, platform,
  secret, or alert infrastructure ownership.
- A provider registry, dynamic plugins, rich-message framework, generic SDK
  client/callback, or universal messaging abstraction.
- Group messages, media, reactions, replies, read receipts, voice, WhatsApp,
  Slack, or a React/operator UI.

## Truth and authority

Repository code defines the current legacy implementation. This SPEC defines
replacement intent. The supporting
[Alchemy, Vercel, Sendblue, and Photon report](../research/alchemy-vercel-sendblue-decision-report.md)
is research-time evidence. Photon and Sendblue documentation defines published
protocol capability. Only dated readback can establish Preview or Production
provider state.

No live provider, Vercel, DNS, secret, webhook, line, storage, or deployment
mutation is authorized by this SPEC. The current Production Sendblue route
continues to be served by its retained deployment until a later promotion
SPEC and runbook authorize a maintenance-window cutover.

Photon documents HMAC-signed, at-least-once webhooks with opaque stable space
and message IDs. The Spectrum TypeScript SDK exposes webhook handling and
Space send/typing operations. See [webhook events](https://photon.codes/docs/webhooks/events),
[webhook overview](https://photon.codes/docs/webhooks/overview), and
[Spectrum TypeScript getting started](https://photon.codes/docs/spectrum-ts/getting-started).

Implementation must inspect and pin the exact published npm tarballs. The
official [Spectrum repository](https://github.com/photon-hq/spectrum-ts) and
[Vercel Chat SDK adapter](https://github.com/photon-hq/vercel-chat-adapter-imessage)
are upstream reference only. GitHub `main`, the Chat SDK adapter, SDK-owned Zod
types, and callback APIs are not Bundjil contracts.

## Package boundaries

### `@bundjil/channel`

```text
packages/channel/
  README.md
  package.json
  src/
    schemas.ts
    errors.ts
    service.ts
    memory.layer.ts
    index.ts
  test/
```

This package owns only provider-neutral direct-text transport concepts. It has
no provider, Eve, Vercel, environment, identity-directory, persistence, or
deployment dependency.

### `@bundjil/sendblue`

```text
packages/sendblue/
  README.md
  package.json
  src/
    schemas.ts
    errors.ts
    live.layer.ts
    memory.layer.ts
    index.ts
  test/
```

The package owns Sendblue header/body/request/response codecs, constant-time
webhook authentication, Effect HTTP operations, provider error translation,
and `ChannelTransport` Layers. It is written fresh from upstream protocol
documentation and installed Effect APIs. It does not import any old
`apps/agent/agent/lib/sendblue/**` source.

### `@bundjil/photon`

```text
packages/photon/
  README.md
  package.json
  src/
    schemas.ts
    errors.ts
    live.layer.ts
    memory.layer.ts
    index.ts
  test/
```

The package owns Photon signature/body codecs, the private Spectrum SDK and
Space lifecycle, SDK result decoding, safe provider errors, and
`ChannelTransport` Layers. It exposes no SDK client, Zod type, raw callback,
management operation, or unchecked SDK result.

All three packages use `@bundjil/source` plus explicit `types` and `default`
exports. Provider packages depend inward on `@bundjil/channel`; none depends on
`@bundjil/eve` or an app. No deep imports are allowed.

## Canonical channel Schemas

The following names define the initial contract. Every public Schema exports
separately named `typeof Contract.Type` and `typeof Contract.Encoded` aliases.

```ts
export const ChannelProvider = Schema.Literals(["sendblue", "photon"]);

export const ChannelConversationId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelConversationId")
);
export const ChannelParticipantId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelParticipantId")
);
export const ChannelInboundMessageId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelInboundMessageId")
);
export const ChannelProviderMessageId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelProviderMessageId")
);

export const ChannelConversation = Schema.Struct({
  provider: ChannelProvider,
  conversationId: ChannelConversationId,
  participantId: ChannelParticipantId,
  providerAgentId: Schema.optional(ChannelParticipantId),
});

export const ChannelInboundTextMessage = Schema.Struct({
  messageId: ChannelInboundMessageId,
  conversation: ChannelConversation,
  text: ChannelInboundText,
});

export const ChannelWebhookResult = Schema.Union(
  Schema.TaggedStruct("Accepted", { message: ChannelInboundTextMessage }),
  Schema.TaggedStruct("Ignored", { reason: ChannelIgnoreReason })
);
```

Provider-native identities remain opaque and branded. The common package does
not assert E.164 semantics. Provider Layers validate their native forms before
constructing common values.

`ChannelIgnoreReason` is a closed transport vocabulary: unsupported event,
unsupported service, unsupported conversation, non-inbound, empty text, or
self-message. Identity policy and replay decisions are app outcomes.

Outbound success is `ChannelSendAccepted`, never `delivered`. Presence uses a
closed `start | stop` action and returns `accepted | no-op`. It is stateless in
the first version. The replacement does not reproduce `Idle | Pending |
Active(turnId)` or persist a provider-specific presence state.

## Service and Layer contracts

### Provider transport

```ts
export class ChannelTransport extends Context.Service<
  ChannelTransport,
  {
    readonly decodeWebhook: (
      request: Request
    ) => Effect.Effect<ChannelWebhookResult, ChannelWebhookError>;

    readonly sendMessage: (
      input: ChannelSendMessageInput
    ) => Effect.Effect<ChannelSendAccepted, ChannelSendError>;

    readonly setPresence: (
      input: ChannelPresenceInput
    ) => Effect.Effect<ChannelPresenceResult, ChannelPresenceError>;
  }
>()("@bundjil/channel/ChannelTransport") {}
```

The raw `Request` is one explicit host-boundary exception because signature
verification needs exact headers and bytes. `decodeWebhook` immediately
verifies and decodes it. No raw header/body/provider DTO/callback leaves the
operation.

Provider Layers accept decoded config values. Apps own environment variable
names and load them through `Config.schema`; secrets use owner-named
`Schema.Redacted` contracts and are revealed only at immediate HTTP header or
SDK construction. Provider packages never read `process.env`.

`@bundjil/channel` owns the safe public error vocabulary used by the service:
webhook authentication/schema failure, request encoding failure, known
provider rejection, unavailable/timeout, uncertain delivery, and unsupported
operation. Each `Schema.TaggedErrorClass` contains only provider, operation,
sanitized reason, and optional safe status/retry classification. Provider
packages may use private errors internally, but each live Layer maps them once
to the common service error before returning. This keeps both Layers genuinely
substitutable.

Each live operation is one named, flat, sequential `Effect.fn`/`Effect.gen`:
encode the provider request, make one HTTP/Promise call, immediately decode the
complete provider result, then return a decoded common result. Raw failures
map once to safe `Schema.TaggedErrorClass` values. Live and deterministic
memory Layers are explicit exports.

### Agent orchestration

`apps/agent/agent/lib/channel/` is a new owner, not a renamed copy of
`lib/sendblue/`. It defines canonical Schemas and these services:

- `Channel`: prepare authenticated decoded inbound messages, apply
  identity policy, claim fresh replay coordinates, produce immutable dispatch
  instructions, complete/release claims, and handle decoded Eve events.
- `ChannelReplay`: claim/complete/retry/uncertain operations over a new
  namespace through `AtomicKeyValueStore`.
- `ChannelIdentity`: map a decoded participant identity to an Eve
  principal through app-owned decoded config.
- `ChannelRouter`: derive a fresh branded Eve continuation token from a
  decoded `ChannelConversation` using an app-owned redacted routing secret and
  a new versioned algorithm.
- `EveChannelDispatch`: one named operation wrapping Eve's request-scoped
  `send` callback. Its Layer is constructed only at the executable route edge.

`Channel.layerLive` declares service requirements through the Layer graph.
It does not capture dependencies and repeatedly `provideService` them inside
method implementations. Tests replace transport, replay, identity, dispatch,
Clock, and config with deterministic Layers.

### Eve adapter

`apps/agent/agent/channels/sendblue.ts` is rewritten, not migrated. It may own:

- `defineChannel`, the route and framework event map;
- one module-edge `ManagedRuntime`;
- one `runPromise` call per route/event callback;
- `waitUntil` registration at the route edge;
- `Schema.decodeEffect` from statically encoded Eve values;
- `Schema.encodeEffect` immediately before the framework state write; and
- one exact assignment of a complete encoded `snapshot` field because Eve
  persists mutations made through its channel context.

It may not own domain branching, provider calls, identity, replay, typing
state, raw callback propagation, `Effect.orDie`, `catchCause`, nested
`runPromise`, `Object.assign`, or manual partial-state merging.

Eve event callbacks project framework events into one canonical
`ChannelEvent` tagged Schema and call `Channel.handleEvent`. The domain
operation returns an immutable complete `ChannelStateV1.Type` and
an explicit provider outcome. The adapter encodes and replaces the single
snapshot. Best-effort presence failures are returned/logged as sanitized
outcomes; they are never discarded causes.

The replacement HTTP acknowledgement contract is defined afresh:

| Outcome                                                            | Status |
| ------------------------------------------------------------------ | -----: |
| Authenticated accepted message with background dispatch registered |  `202` |
| Authenticated ignored event or fresh replay duplicate              |  `204` |
| Invalid authenticated provider payload                             |  `400` |
| Missing or invalid provider authentication                         |  `401` |
| Replay, identity, or routing unavailable before a safe claim       |  `503` |

The adapter maps these safe tagged failures once in its outer route pipeline.
It returns empty responses and exposes no diagnostics or provider data. These
statuses are a new contract; passing old route tests is not acceptance.

## Fresh configuration, state, and replay

The replacement uses fresh app-owned environment names:

```text
BUNDJIL_CHANNEL_SENDBLUE_*
BUNDJIL_CHANNEL_PHOTON_*
BUNDJIL_CHANNEL_REPLAY_*
BUNDJIL_CHANNEL_ROUTING_*
```

The exact fields are derived from the provider Layer inputs and documented in
the app/package READMEs during implementation. The replacement never reads
legacy `BUNDJIL_SENDBLUE_*` bindings. Existing secret values may be re-entered
under the new contract only in a separately authorized environment operation;
they are never printed, committed, copied by a migration script, or inferred
from the old process environment.

The sole new Eve state is a versioned snapshot:

```ts
export const ChannelStateV1 = Schema.TaggedStruct("V1", {
  conversation: ChannelConversation,
});

export const ChannelAdapterState = Schema.Struct({
  snapshot: ChannelStateV1,
});
```

Do not add a legacy union member. Do not persist principal IDs, content,
typing state, provider DTOs, secrets, replay claims, or duplicated routing
fields in Eve channel state.

Replay uses new domain-owned schemas and a new versioned physical prefix. The
logical inbound key derives from provider plus `ChannelInboundMessageId`; the
outbound key derives from provider plus canonical Eve event coordinates.
Claims use `AtomicKeyValueStore.transact`. Old keys are neither read nor
rewritten. Namespace clearing is forbidden.

This creates an intentional continuity break: existing conversations do not
resume through old continuation tokens, and old replay records do not suppress
new-path events. A future Production cutover must disable ingress, drain the
provider retry window, deploy/verify the new path, then re-enable ingress. A
rollback after new traffic must disable ingress and quarantine/drain new-path
retries before restoring the retained old deployment. No compatibility bridge
is permitted to reduce that operational cost.

## Boundary ledger

| Boundary               | Codec and decoded owner                          | Adapter                                                                     |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| App environment        | app config plus provider config Schemas          | `Config.schema`; decoded Type to composition Layer; secrets remain Redacted |
| Sendblue webhook       | private `@bundjil/sendblue` header/body Schemas  | `ChannelTransport.decodeWebhook`; verify first, decode unknown once         |
| Photon webhook         | private `@bundjil/photon` signature/body Schemas | `ChannelTransport.decodeWebhook`; exact raw HMAC then decode unknown once   |
| Common provider result | `ChannelWebhookResult.Type`                      | provider Layer returns decoded common value only                            |
| Identity policy        | app-owned identity input/result Schemas          | `ChannelIdentity.resolve` accepts decoded branded participant ID            |
| Session routing        | app-owned conversation/token Schemas             | `ChannelRouter.route` returns a new branded continuation token              |
| Replay                 | app-owned claim/key/value Schemas                | encode before `AtomicKeyValueStore`; decode stored unknown immediately      |
| Eve dispatch           | app-owned dispatch input/result Schemas          | request-scoped `EveChannelDispatch` wraps typed framework callback          |
| Eve event              | app-owned `ChannelEvent`                         | adapter projects typed framework fields then `Schema.decodeEffect`          |
| Eve state read         | `ChannelAdapterState`                            | `Schema.decodeEffect` once in the event adapter                             |
| Eve state write        | `ChannelAdapterState.Encoded`                    | `Schema.encodeEffect` then exact `state.snapshot = encoded.snapshot`        |
| Provider request       | provider-private request Schema                  | `Schema.encodeEffect`/Schema HTTP body immediately before call              |
| Provider response      | provider-private complete response Schema        | immediate `Schema.decodeUnknownEffect` or schema HTTP body decode           |

## Call graphs

### Sendblue runtime after a separately authorized cutover

```text
POST /eve/v1/sendblue/webhook
  -> rewritten Eve adapter
  -> one Channel ManagedRuntime
       -> Channel.layerLive
       -> @bundjil/sendblue ChannelTransport.layerLive
       -> ChannelIdentity.layerLive
       -> ChannelRouter.layerLive
       -> ChannelReplay.layerLive -> AtomicKeyValueStore
  -> ChannelTransport.decodeWebhook(Request)
  -> Channel.prepareInbound(ChannelInboundTextMessage.Type)
  -> waitUntil(one Effect program)
       -> EveChannelDispatch.layerRequest(send).dispatch
       -> Channel.completeInbound
```

```text
Eve framework event callback
  -> Schema.decodeEffect(ChannelEvent)
  -> one runtime.runPromise(Channel.handleEvent)
       -> optional ChannelTransport.setPresence/sendMessage
       -> ChannelReplay transition
       -> immutable ChannelStateV1.Type
  -> Schema.encodeEffect(ChannelAdapterState)
  -> exact Eve snapshot assignment
```

### Photon Preview runtime

```text
POST /eve/v1/photon/webhook
  -> equivalent thin Eve adapter
  -> Channel.layerLive
       -> @bundjil/photon ChannelTransport.layerLive
       -> same app identity/replay/orchestration services
  -> decoded common message -> claim -> Eve dispatch -> provider send
```

Provider choice exists only in the composition-root Layer. Domain operations
contain no provider switch, registry, string-indexed service map, or raw SDK
branch.

### Automated tests

```text
HTTP/Eve adapter fixture
  -> Channel.layerLive
       -> ChannelTransport.layerMemory
       -> ChannelIdentity.layerMemory
       -> ChannelRouter.layerMemory
       -> ChannelReplay.layerMemory
       -> EveChannelDispatch.layerMemory
  -> decoded decisions, immutable state, encoded snapshot, observations

provider contract suite
  -> Sendblue or Photon live Layer
       -> Effect HTTP/SDK fake at private boundary
  -> same ChannelTransport decoded outputs and safe tagged failures
```

### CLI and proof

```text
local fixture command
  -> no credentials -> memory Layers -> sanitized contract receipt

authorized isolated Preview proof
  -> Preview-only encrypted new config
  -> isolated Photon project/webhook
  -> signed inbound -> replay -> Eve -> outbound accepted
  -> sanitized Vercel/Photon/runtime readback

Production
  -> no change under this SPEC
```

## Progressive proof spikes

### Spike 1: clean vertical channel with no provider

Build `@bundjil/channel`, app Schemas/services, and an HTTP-to-Eve journey using
only memory Layers. Prove one boundary decode, immutable state, fresh replay,
request-scoped dispatch service, one runtime execution per callback, and
explicit presence/send outcomes. Reject any import from legacy Sendblue code.

### Spike 2: clean Sendblue transport

Implement `@bundjil/sendblue` from provider documentation and new contract
fixtures. Prove webhook authentication, complete decoding, outbound encoding,
timeouts/uncertain delivery, and malformed response handling. Rewrite the Eve
adapter and remove `apps/agent/agent/lib/sendblue/**` only after the clean
vertical path passes. Do not port old tests; replace them with tests derived
from the new contracts and accepted user journeys.

### Spike 3: pinned Photon transport

Inspect the exact npm tarball and record package/version/integrity/exports,
dependency weight, Promise behavior, and resource release. Compare the SDK
webhook callback helper with direct documented HMAC verification. Retain one
deterministic implementation. Fault-test malformed output, rejection,
timeout/uncertain send, Space lookup, line ambiguity, presence no-op, and Layer
release without credentials.

### Spike 4: dual conformance

Run the same `ChannelTransport` contract suite and app vertical journey against
both provider Layers. Prove provider-specific types remain private and provider
selection occurs only in Layer composition.

### Spike 5: isolated Photon Preview

Only with separate provider/deployment authority, use new Preview-only config,
a separate replay namespace, and an isolated Photon project. Prove one signed
inbound, one fresh claim, one Eve turn, one outbound accepted result, retry
suppression, cold Space resolution, presence outcome, `waitUntil` completion,
and resource release. Do not create/delete a dedicated line without additional
authority and confirmed lifecycle semantics.

## Acceptance criteria

- The three packages use explicit exports, canonical Schemas, named Types and
  Encoded forms, `Context.Service`, and explicit live/memory Layers.
- The current Sendblue source is rewritten rather than extracted; accepted
  replacement source imports nothing from `agent/lib/sendblue`.
- No legacy state decoder, replay prefix, continuation algorithm, typing state
  machine, compatibility bridge, old environment namespace, or copied legacy
  test is present.
- The old `apps/agent/agent/lib/sendblue/**` tree is removed after replacement
  tests pass; Git and the immutable deployment remain the rollback source.
- The Eve adapter has one module-edge runtime, one `runPromise` per callback,
  one exact encoded snapshot assignment, and no domain/provider policy.
- No replacement code contains `Effect.orDie`, swallowed `catchCause`,
  `Object.assign` state updates, nested runtime execution, public callbacks,
  method-local dependency re-provisioning, or provider-specific hand-written
  attempt/outcome unions.
- Unknown host/provider data is decoded exactly once; statically encoded data
  uses `Schema.decodeEffect`; provider requests/state are encoded only at their
  outward boundary.
- Provider clients, DTOs, Zod types, Promises, raw errors, secrets, and
  primitive semantic identities do not cross service boundaries.
- Fresh state/replay behavior and the intentional continuity break are tested
  and documented; no old data is read or modified.
- Photon uses exact published dependency pins and passes local lifecycle,
  signature, failure, and conformance tests.
- Any live Preview proof is isolated, separately authorized, sanitized, and
  does not mutate Production or Sendblue provider state.
- `bun run check:boundaries`, `bun run check:effect-setup`,
  `bun run check:skills`, focused package/app checks, negative legacy-pattern
  scans, `bun run verification`, and `git diff --check` pass.

## Downstream impact ledger

| Surface                                              | Decision                                         | Reason and implementation owner                                                                      |
| ---------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| This SPEC and task ledger                            | Change required now                              | Replace compatibility/extraction intent with clean replacement and rejection gates                   |
| Product SPEC index                                   | Change required now                              | Use the revised clean-architecture title and proposed status                                         |
| Active plan/index                                    | N/A until implementation                         | Create before code edits; own branch, progress, proof, failures, and removal sequence                |
| Root `README.md`                                     | Preserve now; change required in implementation  | Update package tree/capabilities only after source exists                                            |
| `apps/agent/README.md`                               | Preserve now; change required in implementation  | Own new env, routes, state, replay, proof, continuity break, cutover/rollback pointer                |
| New package READMEs                                  | Change required in implementation                | Own exports, config Type, operations, layers, commands, limitations, and doc routes                  |
| `docs/architecture/repo-structure.md`                | Preserve now; change required in implementation  | Replace app-owned Sendblue tree with verified package/app owners and import direction                |
| `docs/architecture/eve-agent.md`                     | Preserve now; change required in implementation  | Own new production/test call graphs and exact Eve mutation boundary                                  |
| `docs/architecture/effect-patterns.md`               | Preserve                                         | Already rejects the reviewed anti-patterns; implementation must conform                              |
| `docs/architecture/testing-and-quality.md`           | Preserve now; change if commands/journeys change | Add package commands and clean-channel negative/conformance proof when real                          |
| Other architecture/frontend docs                     | N/A                                              | No frontend or unrelated architecture change; legacy atlas/history remains historical                |
| Completed Sendblue SPECs/plans                       | Preserve                                         | Historical evidence of the old implementation, not current replacement guidance                      |
| Supporting research/README                           | Preserve                                         | Management-plane research remains supporting and makes no runtime acceptance claim                   |
| Schemas/types/services/Layers/exports                | Change required in implementation                | Add three package surfaces plus app orchestration/identity/replay/dispatch owners                    |
| Package manifests/lock/Turbo                         | Change required in implementation                | Add packages, exact Photon pins, workspace tasks, and new app env declarations                       |
| Boundary exceptions/lint/Knip/CI                     | Review and narrow change                         | Register only exact Request/Eve assignment/SDK primitives; reject broad exemptions                   |
| Tests and fixtures                                   | Change required in implementation                | New contract, vertical, provider, failure, state, replay, and negative legacy-pattern suites         |
| Provider/HTTP/Preview proof                          | N/A now; conditional in implementation           | Local first; live only under isolated authority and target-owned runbook                             |
| Runbook/monitoring/rollback                          | N/A now; required before Preview/promotion       | Own secret rotation, isolated enable/disable, uncertainty, continuity break, retry drain, and alerts |
| `AGENTS.md` and repo skills                          | Preserve unless routing/commands change          | Amend only when new owners are otherwise undiscoverable; validate skill policy                       |
| Documentation audit receipts/generated files         | N/A                                              | This SPEC is hand-owned; do not hand-edit HGI-300 generated receipts                                 |
| Codex/store/eve package READMEs and codex-proxy docs | N/A                                              | No public contract or command change in those owners                                                 |
| Frontend/browser proof                               | N/A                                              | No React or visible browser surface                                                                  |

## Risks and unresolved questions

- Does a new provider-neutral transport need `providerAgentId`, or can the
  conversation identity alone reopen every provider thread?
- Can Eve's installed channel API safely persist one complete encoded snapshot
  assignment without partial mutation? If not, register only the exact
  framework-required mutation and keep it outside domain code.
- Which precise new Sendblue config values are required, and can an isolated
  Preview account/line prove them without touching the shared Production line?
- Can Photon deterministically finish webhook work under Eve `waitUntil`, and
  does its SDK release resources in the Vercel runtime?
- What stable Space/line identity is required after cold start, and how is an
  ambiguous send prevented from being retried?
- What provider retry horizon must the later Production runbook drain before
  cutover or rollback when old replay data is deliberately ignored?
- Should Production adopt Photon or clean Sendblue after both conform locally?
  That provider-selection decision belongs to a later promotion SPEC.

Any unresolved SDK lifecycle, cold-Space, line, uncertain-send, isolated
resource, or framework state-write question is a stop condition. Public docs
do not prove tenant state. No write, deployment, secret, webhook, DNS, line,
storage, or provider operation is authorized here.
