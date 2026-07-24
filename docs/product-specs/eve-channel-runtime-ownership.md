---
document_type: product-specification
lifecycle: proposed
authority: canonical
owner: bundjil-product-owner
created: 2026-07-24
last_reviewed: 2026-07-24
review_trigger: Eve, Effect, ManagedRuntime, Channel provider, Fiber, Scope, waitUntil, Photon SDK, deployment topology, or lifecycle change
---

# Eve Channel runtime ownership and supervision

## Decision

Keep exactly one `ManagedRuntime` for each loaded Channel provider composition
root within each JavaScript module instance:

- `apps/agent/agent/channels/sendblue.ts` owns one runtime built from
  `SendblueChannelRuntimeLive`;
- `apps/agent/agent/channels/photon.ts` owns one runtime built from
  `PhotonChannelRuntimeLive`; and
- `apps/agent/agent/lib/channel/eve.ts` remains the shared Eve adapter that
  receives the concrete provider runtime and performs the minimum unavoidable
  Effect-to-Promise interpretation at Eve routes and callbacks.

Installed `eve@0.20.0` and the current local build place both static Channel
modules in one application server output, so that output creates two runtimes
when both modules are loaded. That is current build evidence, not a standing
claim that every future function bundle loads both modules. If Eve or Vercel
later splits the routes, each function instance owns only the provider roots it
loads. Runtime cardinality is therefore provider-composition-root-based, not
one for the whole Eve backend and not mechanically one per discovered route.
If one provider later owns multiple Eve routes using the same provider Layer
graph, those routes use the one provider runtime in that module instance.

Do not add `ChannelEffectRunner`, a generic runner callback, a runtime service,
or another wrapper around `runPromise` and `runFork`. The existing concrete
`ManagedRuntime<Channel, E>` parameter is the honest framework-edge dependency
and deterministic test seam. Domain services must never receive or yield a
runtime.

Replace accepted webhook work detached into Effect's global scope with a
background `Effect` returned to the adapter edge and started directly with the
owning `ManagedRuntime.runFork`. Convert `Fiber.await(fiber).pipe(Effect.asVoid)`
to the Promise passed to Eve `waitUntil`. Use `Fiber.await`, not `Fiber.join`,
because the current HTTP contract acknowledges accepted work with `202` and
observes/logs its typed failure without turning the already-returned response
into a second failure path. Runtime disposal must interrupt that supervised
fiber and run its finalizers.

Photon Spectrum remains per-operation `Effect.acquireUseRelease`. Moving a
Spectrum app into the Photon runtime scope is a separate resource-lifetime
decision and is forbidden by this SPEC.

## Evidence base and current repository truth

This SPEC was drafted from fetched `origin/main` commit
`c8c5d53f71b9a8b9ac81bbc44a20c6fd1ecea90f` on 2026-07-24. The Channel runtime,
adapter, provider, test, and dependency-lock paths are unchanged from the
earlier immutable audit commit
`7ddcdc514af5d3edee1b151575a3ce18226268bb`; current `main` adds an HGI-307
repository verification gate but does not change the runtime graph.

Committed dependency truth is:

- `effect@4.0.0-beta.74` from the Effect v4/effect-smol lineage;
- `eve@0.20.0` with `nitro@3.0.260610-beta`; and
- `@spectrum-ts/core@12.3.0` plus `@spectrum-ts/imessage@12.3.0`.

Installed Effect beta source establishes that `ManagedRuntime.make`:

- creates a fresh `Layer.MemoMap` unless one is supplied explicitly;
- builds the Layer lazily on first use and retains the build fiber;
- caches the successful Context;
- registers every root execution in the runtime Scope;
- runs calls concurrently rather than serialising them;
- closes the runtime Scope on `dispose`/`disposeEffect`; and
- retains a failed Layer build, so subsequent calls observe the same failure.

Effect's installed `forkDetach` source attaches work to the global Scope.
`ManagedRuntime.runFork` instead starts the root fiber with
`Fiber.runIn(runtime.scope)`. `Fiber.await` observes its `Exit` without
propagating failure, while `Fiber.join` would propagate failure and
`Fiber.interrupt` requests cancellation and waits for finalizers.

Eve discovers and statically imports both authored Channel modules, caches the
compiled module graph, invokes the selected route, and collects the Promise
given to `waitUntil`. Eve does not define Effect runtime cardinality. Earlier
exact Production and Preview deployment readbacks showed both Channel routes
in the same deployment function bundle, but that is dated deployment evidence,
not a standing lifecycle guarantee. Vercel may reuse one warm instance,
execute concurrent invocations in it, create multiple instances during
scale-out, freeze it, or terminate it without a repository-observable
per-instance shutdown hook.

Installed Eve's `dispatchChannelRequest` catches an authored route handler
rejection, logs it through Eve's channel logger, and returns a generic
`{"error":"Channel handler failed.","errorId":...,"ok":false}` response with
status `500`. A `ManagedRuntime.runPromise` rejection caused by initial Layer
construction therefore follows that framework-owned `500` path in the hosted
adapter. Direct unit calls to `route.handler` observe the rejected Promise
because they intentionally bypass Eve's dispatcher. This SPEC does not remap a
cached Layer-build failure to the app's `503` routing/replay contract and does
not encode the tagged build error outward.

Installed `eve@0.20.0` local-development source exposes
`createDevelopmentServer.close()` to the Eve CLI owner. That close path stops
the authored-source watcher, development listener, Nitro instance, and
development sandboxes. The watcher rebuild path clears Eve's compiled runtime
agent bundle cache and can call Nitro's `rollup:reload`, but neither path is
given to an authored Channel module and neither calls `ManagedRuntime.dispose`.
Eve's internal sandbox shutdown plugin uses Nitro's `close` hook only for
sandbox handles and explicitly excludes Eve development and Vercel. This is
evidence of Eve-owned host cleanup, not a public authored-module teardown hook.

The linked worktree has no local `node_modules`. Installed dependency evidence
was read from the canonical Bundjil checkout after confirming its `bun.lock`
matches this worktree for the relevant packages. Exact installed anchors are:

- `node_modules/effect/src/ManagedRuntime.ts` and
  `node_modules/effect/src/internal/effect.ts`;
- `node_modules/eve/dist/src/channel/routes.d.ts`;
- `node_modules/eve/dist/src/internal/nitro/host/dev-authored-source-watcher.js`;
- `node_modules/eve/dist/src/internal/nitro/host/start-development-server.js`;
  and
- `node_modules/eve/dist/src/internal/nitro/host/sandbox-shutdown-plugin.d.ts`
  and `.js`.

Repository anchors are `apps/agent/agent/channels/{sendblue,photon}.ts`,
`apps/agent/agent/lib/channel/{channel,config,dispatch,eve,identity,photon.runtime,replay,router,runtime,schemas,sendblue.runtime}.ts`,
`packages/channel/src/{service,schemas,memory.layer}.ts`,
`packages/sendblue/src/{live.layer,memory.layer,schemas}.ts`,
`packages/photon/src/{client,live.layer,memory.layer,schemas,transport.layer}.ts`,
and their focused tests. Upstream repository identities remain routed through
`docs/reference-repositories.md`; installed beta behavior wins where upstream
main differs.

## Goals

- Preserve independent Sendblue and Photon provider Layer composition roots.
- Supervise every accepted background dispatch under its owning provider
  runtime Scope.
- Preserve Eve's `202`, `204`, `400`, `401`, and `503` route contract and the
  existing provider-retry proof path.
- Preserve decode-once/encode-once Schema boundaries, canonical branded
  identities, `Config.schema` ownership, safe tagged errors, named operations,
  and explicit live/memory Layers.
- Make runtime build caching, failure isolation, concurrency, disposal, and
  recovery explicit and deterministic in tests.
- Keep repository, local-process, Preview, Production, and platform-inferred
  lifecycle claims separate.

## Non-goals

- One combined Eve backend runtime.
- Explicit cross-runtime `Layer.MemoMap` sharing.
- A generic runtime/runner service, callback interface, façade, helper module,
  or `common`/`utils` abstraction.
- Per-request runtime construction or disposal.
- A provider registry or runtime selection inside `Channel`.
- Changing the `ChannelTransport`, `Channel`, `ChannelReplay`,
  `ChannelIdentity`, `ChannelRouter`, or `EveChannelDispatch` public service
  contracts.
- Changing any provider wire Schema, branded identity, tagged error, Config
  name, persisted replay value, outward response, or Eve state encoding.
- Moving Photon Spectrum acquisition into a runtime-scoped Layer.
- Adding guessed Eve, Nitro, HMR, process-signal, or Vercel shutdown hooks.
- Deployment, provider mutation, credential change, message send, Production
  promotion, or current-provider claim as part of implementation.

## Ownership and Layer composition

### Provider composition roots

`sendblue.ts` and `photon.ts` are executable Eve module edges. Each creates its
provider runtime once at module evaluation and passes that concrete runtime to
`makeChannelEveChannel`. The runtime interprets Effects that require the
app-owned `Channel` service; it is not itself a domain dependency.

```text
SendblueChannelRuntimeLive
  -> ChannelConfigLive
  -> loadSendblueConfig
  -> @bundjil/sendblue layerLive
       -> FetchHttpClient.layer
  -> ChannelLive
       -> ChannelReplayLive
            -> UpstashPersistenceLive
       -> ChannelIdentityLive
       -> ChannelRouterLive
```

```text
PhotonChannelRuntimeLive
  -> ChannelConfigLive
  -> loadPhotonConfig
  -> @bundjil/photon layerLive
       -> PhotonClient layer
  -> ChannelLive
       -> ChannelReplayLive
            -> UpstashPersistenceLive
       -> ChannelIdentityLive
       -> ChannelRouterLive
```

The graphs share canonical Service tags, Schema contracts, constructors, and
Layer composition functions through ordinary imports. They intentionally do
not share live Context values, Scopes, build fibers, or MemoMaps. Both
Upstash clients may target the same external replay namespace, but that is
shared external state rather than a shared in-process service instance.

### Why the graphs remain separate

Both roots provide the same `Channel` Service tag with different
`ChannelTransport` implementations and provider config. A single combined
Context cannot hold two values for that tag without replacing one or
introducing new provider-qualified service tags or a provider registry. That
redesign would make provider selection domain-visible, eagerly couple config
and Layer acquisition, widen the failure and disposal boundary, and add an
abstraction with no consumer need.

Provider-specific runtime separation also contains Layer-build failure. A
missing Photon config or failed Photon acquisition must not poison the
Sendblue runtime, and vice versa. Common Channel config can still fail both
independently when each provider is first used; it must not be hidden behind
automatic fallback.

### Why explicit MemoMap sharing is rejected

Each `ManagedRuntime.make` currently receives its own default MemoMap. Layer
memoisation is keyed by exact Layer identity and its entries are tied to
reference-counted Scope finalization. The provider roots use distinct
`Layer.unwrap` values and create `channelServices(config)` dynamically.
Supplying one MemoMap to both runtimes would therefore offer little reuse,
would not make their Contexts inherit from one another, and would couple
otherwise independent Scope/disposal ownership.

If a future resource has a demonstrated need for one process-wide instance, it
requires its own accepted ownership and lifetime design. Cross-runtime
MemoMap sharing is not the default mechanism for that decision.

## Effect, Fiber, Scope, and waitUntil design

### Request preparation

The webhook handler continues to call the concrete provider runtime's
`runPromise` for the synchronous request decision:

1. decode `ChannelWebhookQuery` from the unknown URL query;
2. yield `Channel`;
3. authenticate and decode the provider request through
   `Channel.decodeWebhook`;
4. resolve identity, route, and replay claim with `prepareInbound`;
5. return `204` for ignored or duplicate ingress;
6. preserve the inline Photon provider-retry proof path; or
7. return the accepted background `Effect` and a `202` response to the
   JavaScript adapter edge.

The returned background value is an Effect value, not a DTO or helper
abstraction. It closes over the already-decoded `Channel` service and
prepared canonical values, provides the request-local
`EveChannelDispatchEve(send)` Layer, dispatches, and completes the replay claim.

### Accepted background work

At the Eve adapter edge:

```ts
const result = await channelRuntime.runPromise(prepareRequest);

if ("background" in result) {
  const fiber = channelRuntime.runFork(result.background);
  waitUntil(Effect.runPromise(Fiber.await(fiber).pipe(Effect.asVoid)));
}

return result.response;
```

This is illustrative shape, not a requirement to create `prepareRequest`,
`awaitFiber`, a response union Schema, or another helper. Keep the one-use
logic inline when implementation is clearer that way.

`runFork` is preferred because it starts a root fiber registered in the
provider runtime Scope. `forkChild` or `forkScoped` would bind work to the
short request-preparation scope and interrupt it when that Effect returns.
`forkDetach` binds it to the global Scope and escapes provider-runtime
disposal. `Fiber.join` would propagate a background failure into the
waitUntil Promise, changing the existing observation contract.
`Fiber.await(...).pipe(Effect.asVoid)` waits for success, typed failure, defect,
or interruption and resolves the waitUntil Promise after the Exit is observed.
The existing `tapError` remains the typed-failure observation. Do not claim it
logs defects or interruption, and do not add a telemetry wrapper merely to make
that claim. Tests must exercise all four completion classes.

Moving the fork to the JavaScript edge creates a bounded interval after the
replay claim is acquired and before `runFork` is called. Keep that interval
inline and synchronous: start the Fiber and register its completion with
`waitUntil` before returning the `202`. If the process terminates in that
interval, no in-memory design can recover the work; the existing replay lease
and provider retry path are the recovery boundary. Do not complete or release
the claim before dispatch, create a nested runtime invocation to disguise the
interval, or add a runner abstraction. Tests must prove ordering within a live
process without claiming to simulate process death.

Do not pass `request.signal` to the accepted background `runFork`: once the
provider event is authenticated, claimed, and acknowledged for asynchronous
dispatch, a client disconnect must not cancel the accepted work. Vercel
timeout or runtime disposal may still interrupt it. Eve `waitUntil` extends
request work only within the host's configured lifetime; it is not durable
execution.

This SPEC adds no adapter-level timeout or retry. Sendblue currently owns
30-second message and 2-second presence HTTP timeouts; Photon transport owns
30-second message and 15-second presence timeouts. Eve's `send` Promise has no
additional app-owned timeout in this adapter, and `waitUntil` is a host-lifetime
extension rather than a timer. Adding a Channel-wide timeout could interrupt
after an uncertain external side effect and requires a separately accepted
delivery/replay policy. Tests use Effect synchronization, not scheduling
sleeps, and retain the existing provider timeout coverage.

### Concurrency and duplicate invocation

`ManagedRuntime` does not serialise executions. Webhook routes and Eve event
callbacks may run concurrently against one cached provider Context. Existing
services must remain concurrency-safe:

- replay coordination uses `AtomicKeyValueStore.transact`;
- identity values and the router's imported HMAC key are immutable;
- Sendblue uses the Effect `HttpClient` façade;
- Photon brackets a separate Spectrum resource per operation; and
- Eve dispatch remains request-local because its Layer captures the exact
  `send` callback.

A duplicate provider invocation races through the same atomic replay claim and
must not create a second Eve dispatch. Runtime supervision does not replace
replay/idempotency. Interruption after an external side effect but before a
fenced completion remains an existing delivery-uncertainty boundary; no code
may blindly retry an uncertain provider send to make a runtime test pass.

### Disposal and recovery

| Host boundary                | Required ownership                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests                        | Create the concrete test runtime at the test boundary and register `runtime.disposeEffect` in the surrounding test Scope. Disposal must interrupt a supervised background fiber and allow its finalizers to complete.                                                                                                                                                                                                     |
| Local Eve development/HMR    | Do not dispose per request. Installed `eve@0.20.0` closes its watcher, listener, Nitro instance, and sandboxes, but exposes no authored-Channel teardown hook and does not dispose module-owned runtimes during cache clear or reload. Document that replaced module instances may be abandoned. Re-open this decision only after a pinned Eve lifecycle API change; do not invent process listeners or an HMR framework. |
| Conventional long-lived host | A future executable host must create and own the provider runtimes at its composition root, stop intake, wait for tracked accepted work within its shutdown budget, then dispose the runtimes it loaded. Do not export a disposal registry or wrapper from the current Channel modules. Re-review module-local ownership only when the repository owns a real host lifecycle hook.                                        |
| Vercel                       | Do not depend on `dispose` running at freeze, scale-down, or termination and do not claim a per-instance shutdown hook. Each loaded provider module owns one runtime in a warm function instance; current local output loads both, while future bundle splitting may not. Scale-out multiplies only the loaded roots. Never dispose after a request.                                                                      |
| Preview versus Production    | Each immutable deployment has separate function identities and module memory. A runtime cannot cross Preview/Production. Dated readback may prove a particular bundle topology but not future instance reuse or shutdown.                                                                                                                                                                                                 |

A failed Layer build remains cached in that runtime. Do not catch and recreate
the module singleton automatically: concurrent replacement would require a
real state owner and could hide invalid config. Recovery is:

1. classify and correct the typed config/acquisition cause;
2. create a fresh runtime through the owning module/process/HMR/deployment
   lifecycle; and
3. prove the unaffected provider continued independently.

Operation-level transient failure belongs in the named service operation's
typed retry/error policy, not in runtime recreation. Tests must establish both
same-runtime failure retention and fresh-runtime recovery.

## Photon Spectrum lifetime

`packages/photon/src/client.ts` currently wraps each `sendMessage` and
`setPresence` operation in `Effect.acquireUseRelease`:

```text
operation
  -> Spectrum(config) acquire
  -> imessage(app)
  -> resolve direct Space
  -> send or presence
  -> app.stop() release
```

Webhook authentication and decoding do not acquire Spectrum. Concurrent
outbound/presence operations may temporarily own separate SDK applications,
connections, listeners, and finalizers. Runtime disposal interrupts a
supervised operation and permits its `acquireUseRelease` finalizer to run,
subject to cooperative interruption and the host lifetime.

This SPEC preserves that behavior. A runtime-scoped Spectrum Layer would trade
per-operation acquisition for shared concurrent client state, cold-start and
freeze/reconnect behavior, signal-listener ownership, and dependence on a
shutdown hook that Vercel does not promise. It requires separate upstream
concurrency/reconnect research, isolated Preview evidence, failure-recovery
policy, and an accepted SPEC amendment or successor.

## Canonical contracts and codecs

This change introduces no Schema, public type, Service tag, Config field,
tagged error, Layer export, or DTO.

| Boundary                         | Existing owner and codec                                                                                              | Required preservation                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Eve webhook path/proof selection | `ChannelWebhookPath.Type`, `ChannelWebhookProofPolicy.Type` in `apps/agent/agent/lib/channel/schemas.ts`              | Keep decoded module-owned literals; no semantic primitive widening.                                                    |
| Unknown query ingress            | `ChannelWebhookQuery.Type` / `.Encoded`                                                                               | `Schema.decodeUnknownEffect` once in the Eve route.                                                                    |
| Unknown provider webhook         | `ChannelTransport.decodeWebhook(Request)` returning `ChannelWebhookResult.Type`                                       | Provider package authenticates exact bytes/headers and decodes once; provider DTOs stay private.                       |
| App prepared work                | `ChannelPreparedInbound.Type`, `ChannelPrepareInboundResult.Type`                                                     | Pass decoded values only; do not invent a background-work DTO mirror.                                                  |
| Eve callback input               | `ChannelEvent.Type` / `.Encoded` using `ChannelConversation`, `ChannelOutboundText`, `EveSessionId`, and `EveTurnId`  | Construct at the framework edge and decode with `Schema.decodeUnknownEffect`.                                          |
| Eve state ingress/egress         | `ChannelAdapterState.Type` / `.Encoded`                                                                               | `Schema.decodeEffect` on encoded callback state and `Schema.encodeEffect` once before assigning/sending outward state. |
| Eve dispatch                     | `EveChannelDispatch.dispatch(ChannelPreparedInbound.Type)`                                                            | Request-local live Layer captures only Eve's typed `send`; encode `ChannelAdapterState` before the Promise call.       |
| Provider operations              | `ChannelSendMessageInput.Type`, `ChannelSendAccepted.Type`, `ChannelPresenceInput.Type`, `ChannelPresenceResult.Type` | Preserve named `ChannelTransport` operations and immediate provider encode/decode.                                     |
| Configuration                    | `ChannelConfig`, `SendblueConfig`, `PhotonConfig`, `UpstashPersistenceOptions` owner Schemas                          | Preserve `Config.schema`, redacted secrets, and provider-specific config acquisition.                                  |
| Errors                           | Existing app and `@bundjil/channel` `Schema.TaggedErrorClass` values                                                  | Preserve safe tags and route `catchTags`; no raw Layer/SDK cause or generic runtime error crosses outward.             |

Primary Effect programs remain flat and meaningful. Typed expected failures
are handled in `.pipe(...)` with `catchTag`, `catchTags`, or `mapError`. The
implementation must contain no unsafe cast, manual object reader/mapper,
duplicate DTO, synchronous production codec, trivial runtime wrapper, generic
callback escape hatch, or helper/common/utils sprawl.

## Call graphs

### Production source path

```text
Eve static module discovery and bundle
  -> apps/agent/agent/channels/sendblue.ts
       -> ManagedRuntime.make(SendblueChannelRuntimeLive)
  -> apps/agent/agent/channels/photon.ts
       -> ManagedRuntime.make(PhotonChannelRuntimeLive)
  -> makeChannelEveChannel(concrete provider ManagedRuntime)
       -> Eve POST callback
       -> providerRuntime.runPromise(request decision)
            -> Channel
            -> ChannelTransport
            -> ChannelIdentity
            -> ChannelRouter
            -> ChannelReplay -> AtomicKeyValueStore
            -> decoded response or accepted background Effect
       -> providerRuntime.runFork(accepted background)
            -> runtime Scope owns root Fiber
            -> EveChannelDispatchEve(send), request-local Layer
            -> Eve send Promise
            -> Channel.completeInbound
       -> Effect.runPromise(Fiber.await(fiber).pipe(Effect.asVoid))
       -> Eve waitUntil(completion Promise)
       -> HTTP 202
```

### Eve event callbacks

```text
Eve authorization / input / session / turn / message event
  -> makeChannelEveEvents(concrete provider ManagedRuntime)
  -> providerRuntime.runPromise
       -> Schema.decodeEffect(ChannelAdapterState)
       -> Schema.decodeUnknownEffect(ChannelEvent)
       -> Channel.handleEvent
            -> ChannelTransport.setPresence
            |  -> Photon per-operation Spectrum acquire/use/release
            |  -> Sendblue HttpClient
            -> ChannelReplay.claimOutbound
            -> ChannelTransport.sendMessage
            -> ChannelReplay complete / uncertain / retryable
       -> Schema.encodeEffect(ChannelAdapterState)
       -> assign Eve encoded state
```

### Automated test path

```text
@effect/vitest Effect.scoped
  -> decoded canonical fixtures
  -> provider-specific deterministic ChannelTransport Layer
  -> ChannelIdentityMemory
  -> ChannelRouterMemory
  -> ChannelReplayMemory -> PersistenceMemory
  -> ChannelLive
  -> ManagedRuntime.make(test Layer)
  -> makeChannelEveChannel(concrete test runtime)
  -> concurrent runPromise / runFork calls
  -> captured Eve send and waitUntil
  -> Fiber.await / interruption / finalizer assertions
  -> runtime.disposeEffect test finalizer
```

### Local development and HMR

```text
bun run --filter @bundjil/agent dev:no-ui
  -> installed eve@0.20.0 / Nitro local host
  -> authored Channel module evaluation
  -> current local output loads Sendblue + Photon modules
       -> one ManagedRuntime for each loaded provider root
  -> local requests/callbacks share cached provider Contexts
  -> authored-source rebuild
       -> clear compiled runtime-agent bundle cache
       -> optional Nitro rollup:reload
       -> no authored-Channel ManagedRuntime disposal hook
  -> Eve development-server close
       -> close watcher / listener / Nitro / development sandboxes
       -> still no authored-Channel ManagedRuntime disposal callback
  -> process exit/HMR replacement may abandon a module runtime instance
```

### Vercel deployment topology

```text
immutable Preview deployment                immutable Production deployment
  -> one or more function bundles             -> one or more function bundles
       -> one or more warm instances                -> one or more warm instances
            -> loaded provider modules                   -> loaded provider modules
                 -> one runtime per root                     -> one runtime per root
            -> concurrent invocations                    -> concurrent invocations

No Context, Scope, MemoMap, Fiber, module singleton, or secret value crosses
deployment identity or function-instance boundaries.
```

Repository build output and exact deployment readback can prove whether both
routes share one function bundle for a named deployment. They cannot prove
future Vercel bundling, the number of warm instances, reuse duration,
scale-down timing, finalizer execution, or a shutdown signal.

## Verification and acceptance

Implementation acceptance requires:

- each provider runtime builds independently and at most once per runtime;
- concurrent calls against one built runtime are not accidentally serialised;
- failure to acquire one provider Layer does not prevent the other runtime
  from building and running;
- the installed beta's retained build failure is tested, and recovery is
  demonstrated only by a fresh runtime;
- an initial Layer-build rejection remains a cached runtime failure; installed
  Eve maps an authored handler rejection to its sanitized `500`, while direct
  route unit calls observe the rejected Promise;
- accepted background work is started with the concrete provider
  `ManagedRuntime.runFork`;
- `Fiber.await(...).pipe(Effect.asVoid)` completion is passed exactly once to
  Eve `waitUntil`;
- the accepted Fiber is started and its completion is registered with
  `waitUntil` before the `202` handler Promise resolves;
- runtime disposal interrupts the supervised background fiber and its
  finalizer completes in tests;
- a regression test rejects `forkDetach`/global-Scope ownership in the
  accepted path;
- ignored, duplicate, authentication, schema, routing, replay, provider-retry,
  and accepted response behavior remains exact;
- no per-request `ManagedRuntime.make`, `dispose`, provider eager loading,
  cross-provider Service-tag collision, or explicit shared MemoMap exists;
- production `ManagedRuntime.make` remains owned only by
  `apps/agent/agent/channels/sendblue.ts` and `photon.ts`; the shared Eve
  adapter and request handlers create or dispose none;
- the accepted app path contains no `Effect.forkDetach`; its sole background
  `runFork` interpretation remains at the shared Eve framework edge;
- both absolute routes remain in the Eve/Nitro build;
- Photon per-operation acquire/use/release and its lifecycle tests remain
  unchanged;
- provider-operation timeouts remain owned by Sendblue and Photon, with no new
  Channel-wide adapter timeout or retry; and
- Preview, Production, bundle, warm-instance, and scale-out assertions remain
  bounded to their evidence class.

Every code task must separately verify:

- flat meaningful `Effect.gen` control flow;
- typed failures handled in `.pipe(...)` using `catchTag`, `catchTags`, or
  `mapError`;
- canonical Schema-derived contracts and exact `Type`/`Encoded` ownership;
- decode once at unknown ingress and encode once at outward boundaries;
- no unsafe casts, manual readers/mappers, DTO mirrors, synchronous production
  codecs, runner abstraction, trivial wrapper, generic callback, or
  helper/common/utils sprawl;
- correct Fiber, Scope, Layer, Service, and ManagedRuntime ownership;
- Effect language-server diagnostics for every changed TypeScript file;
- zero unexplained boundary findings and zero stale exact exceptions;
- focused tests plus `bun run check:boundaries`,
  `bun run check:effect-setup`, `bun run check:docs`,
  `bun run check:skills`, `bun run check:authority`,
  `bun run check:controls`, `bun run check:verification`; and
- final `bun run verification` and `git diff --check`.

## Rollout, evidence, and rollback

The implementation slice is repository-only until separately authorised.
Focused tests and builds prove source behavior, not Vercel lifecycle or current
provider state.

| Stage                                | Decision owner          | Operating owner                                                        | Entry trigger                                                                                             | Stop/rollback trigger                                                                                                                   |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Repository implementation acceptance | `bundjil-product-owner` | `bundjil-agent-architecture-owner`                                     | Every code task, focused test, source scan, and repository gate passes at one recorded Git identity       | Any failed or inconclusive gate, stale source anchor, or unresolved boundary finding                                                    |
| Optional isolated Preview            | `bundjil-product-owner` | `bundjil-agent-operator` under `apps/agent/runbooks/deploy-promote.md` | Explicit target authority, clean pushed SHA, immutable rollback deployment, and accepted repository slice | Missing authority/readback/rollback, route/function drift, secret exposure, duplicate dispatch, non-completion, or provider uncertainty |
| Production promotion                 | `bundjil-product-owner` | `bundjil-agent-operator` under the target-owned runbook                | Separate accepted product decision and authority after bounded Preview evidence                           | Any repository, deployment, runtime, provider, or rollback uncertainty                                                                  |

An optional later Preview task may deploy a clean pushed commit only after
target-owned authority. It should read back the immutable deployment, confirm
both routes' function identities, exercise only an approved synthetic Channel
journey, correlate exactly one waitUntil completion and zero duplicate
dispatch, and retain only sanitized statuses/counts. It must not infer a
shutdown hook from a successful request or quiet scale-down.

Production promotion is not granted by this SPEC. Its product decision owner is
`bundjil-product-owner`; its operating owner is `bundjil-agent-operator` under
`apps/agent/runbooks/deploy-promote.md`. Halt on failed source checks, missing
authority, missing immutable rollback deployment, route/function drift,
duplicate dispatch, background non-completion, secret exposure, unavailable
readback, or any provider uncertainty. Roll back by restoring the previous
immutable deployment and quarantining new traffic according to the runbook;
never clear replay storage or retry an uncertain outbound send.

No new proof packet is required for repository implementation. If an authorised
Preview or Production observation occurs, the existing
`docs/verification/**` journey/packet owners decide its retained evidence and
claim limits.

## Downstream impact ledger

| Surface                                                                                                                                | SPEC/review result                                                         | Implementation owner and observable postcondition                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/product-specs/eve-channel-runtime-ownership.md` and sibling tasks                                                                | Change required                                                            | Own proposed decision, progressive tasks, review findings, and acceptance.                                                                                                                                                                                                                                                              |
| `docs/product-specs/index.md`                                                                                                          | Change required                                                            | Route this proposed SPEC without claiming implementation has begun; no active plan yet.                                                                                                                                                                                                                                                 |
| `docs/README.md` and `docs/architecture/README.md`                                                                                     | Preserve                                                                   | Documentation lifecycle and architecture routing do not change; this SPEC and the product-spec index remain the narrow current-intent owners.                                                                                                                                                                                           |
| `docs/architecture/eve-agent.md`                                                                                                       | Preserve during SPEC; change required with code                            | Record provider-root cardinality, direct concrete runtime use, supervised accepted Fiber, waitUntil, disposal limits, and evidence/non-claims after implementation.                                                                                                                                                                     |
| `docs/architecture/effect-patterns.md`                                                                                                 | Preserve                                                                   | Already owns framework-edge runtime interpretation, Layer composition, native primitives, and helper rejection.                                                                                                                                                                                                                         |
| `docs/architecture/repo-structure.md`                                                                                                  | Preserve                                                                   | Existing module/package ownership remains unchanged; no new runtime/helper module or export.                                                                                                                                                                                                                                            |
| `docs/architecture/testing-and-quality.md`                                                                                             | Preserve unless implementation creates a durable new command/fixture class | Existing Channel/runtime, Effect diagnostics, docs, and root gates cover the slice.                                                                                                                                                                                                                                                     |
| `docs/architecture/frontend-composition.md`                                                                                            | N/A                                                                        | No visible UI, route composition, or client state changes.                                                                                                                                                                                                                                                                              |
| Root `README.md`                                                                                                                       | Preserve                                                                   | Repository shape, commands, and provider-state non-claims do not change.                                                                                                                                                                                                                                                                |
| `apps/agent/README.md`                                                                                                                 | Preserve during SPEC; change required with code                            | Clarify one runtime per provider composition root and supervised waitUntil behavior without provider/deployment actuality.                                                                                                                                                                                                              |
| `packages/channel/README.md`, `packages/sendblue/README.md`, `packages/store/README.md`                                                | Preserve                                                                   | No public package contract, provider operation, or persistence behavior changes.                                                                                                                                                                                                                                                        |
| `packages/photon/README.md`                                                                                                            | Preserve                                                                   | It already owns per-operation Spectrum acquire/use/release; runtime-scoped Spectrum remains forbidden.                                                                                                                                                                                                                                  |
| `packages/eve/README.md` and `packages/codex/README.md`                                                                                | Preserve                                                                   | No reusable Eve contract, Codex provider/profile contract, export, or command changes.                                                                                                                                                                                                                                                  |
| `apps/codex-proxy/README.md` and `apps/codex-proxy/runbooks/README.md`                                                                 | Preserve                                                                   | The proxy HTTP/auth/runtime and its operator routing are outside this agent Channel edge.                                                                                                                                                                                                                                               |
| `apps/agent/runbooks/README.md`                                                                                                        | Preserve                                                                   | Existing agent operator routing already points to local development, deploy/promote, provider, incident, rollback, and recovery owners.                                                                                                                                                                                                 |
| `apps/agent/runbooks/local-development.md`                                                                                             | Preserve                                                                   | Installed `eve@0.20.0` has no public authored-Channel teardown hook, so there is no executable runtime-disposal procedure to add. Reconsider only with a separately reviewed Eve lifecycle API change.                                                                                                                                  |
| Agent deployment/provider/incident runbooks                                                                                            | Preserve                                                                   | No operation, authority, provider, credential, rollout, or rollback procedure changes in the repository-only slice.                                                                                                                                                                                                                     |
| `.agents/skills/effect-client-wrapper/SKILL.md`                                                                                        | Preserve                                                                   | Its public-boundary rules already forbid generic SDK callbacks/raw clients and require canonical Schema, Config, safe tagged errors, named operations, and live/mock Layers. Photon's internal `withPhotonResource` has two real consumers and owns `acquireUseRelease`; it is not a public escape hatch or a runtime-runner precedent. |
| `AGENTS.md`, other repo-local skills, mirrors, and instruction surfaces                                                                | Preserve                                                                   | Current Effect boundary, helper admission, docs, PRD, authority, and verification rules already govern this work.                                                                                                                                                                                                                       |
| `.changeset/README.md`, `.agents/skills/vercel-composition-patterns/README.md`, `.agents/skills/vercel-react-best-practices/README.md` | Preserve                                                                   | No release/versioning or React composition work occurs. These remaining repository `README.md` paths do not become runtime owners.                                                                                                                                                                                                      |
| Schemas, Type/Encoded aliases, branded identities, Config, errors, Services, Layers, package exports                                   | Preserve                                                                   | Runtime/fiber ownership changes only; canonical boundaries above must remain byte/shape compatible.                                                                                                                                                                                                                                     |
| Lint rules, boundary exceptions, formatting, TypeScript config, CI/workflows, commands                                                 | Preserve                                                                   | No new exception or command is planned; implementation must pass existing diagnostics and remove any stale exception it encounters.                                                                                                                                                                                                     |
| `apps/agent/test/channel-runtime.test.ts`                                                                                              | Create                                                                     | Own independent provider-shaped Layer build-once, concurrency, failure isolation, cached-failure, fresh-runtime recovery, and scoped test disposal fixtures.                                                                                                                                                                            |
| `apps/agent/test/sendblue-channel.test.ts`                                                                                             | Update                                                                     | Own waitUntil registration ordering; success, typed-failure, defect, and interruption completion; runtime-disposal finalization; client-abort independence; and the `forkDetach` semantic regression. Retain exact route/status/duplicate behavior.                                                                                     |
| `apps/agent/test/channel-vertical.test.ts`                                                                                             | Retain; update only if the shared edge changes its fixture                 | Preserve concurrent replay, provider substitution, Photon retry proof, Sendblue proof-disabled, and duplicate behavior.                                                                                                                                                                                                                 |
| `apps/agent/test/channel-config.test.ts`                                                                                               | Retain                                                                     | Existing fixture already proves each provider root loads only its own provider credentials.                                                                                                                                                                                                                                             |
| `apps/agent/test/sendblue-build-route.test.ts`                                                                                         | Retain; update only if emitted output shape changes                        | Current local-build fixture proves both absolute routes and provider operations in one application server output. It is not Vercel readback.                                                                                                                                                                                            |
| `packages/channel/test/channel-transport.test.ts` and `packages/sendblue/test/sendblue-transport.test.ts`                              | Retain                                                                     | Public Channel and Sendblue transport compatibility remains unchanged.                                                                                                                                                                                                                                                                  |
| `packages/photon/test/photon-transport.test.ts` and other Photon package tests                                                         | Retain                                                                     | Existing per-operation acquisition/release, laziness, timeout, failure, interruption, and cleanup coverage must stay exact.                                                                                                                                                                                                             |
| Production preflight and Vercel packaging fixtures                                                                                     | Retain                                                                     | No environment binding, packaging rule, authority, or provider contract changes.                                                                                                                                                                                                                                                        |
| Browser verification                                                                                                                   | N/A                                                                        | No visible browser route or text changes.                                                                                                                                                                                                                                                                                               |
| Direct HTTP evidence                                                                                                                   | Repository/local only                                                      | Focused route tests preserve exact statuses; hosted HTTP evidence remains authority-gated and optional.                                                                                                                                                                                                                                 |
| Critical journeys, proof templates, dated evidence, observability                                                                      | Preserve for repository slice                                              | No provider/deployment observation occurs. Use existing verification owners only for a later authorised target.                                                                                                                                                                                                                         |
| Active execution plan                                                                                                                  | N/A now                                                                    | Create under `docs/exec-plans/active/` only when implementation actually begins; do not create one for SPEC/review alone.                                                                                                                                                                                                               |
| Migration/release/rollback                                                                                                             | No data/schema migration; optional later deployment                        | Code rollback restores the preceding immutable deployment. No replay clearing, secret rebinding, provider mutation, or Photon lifetime change.                                                                                                                                                                                          |

The full readable documentation inventory was considered. All 22 repository
`README.md` paths, `docs/reference-repositories.md`, and the seven
`docs/architecture/**` owners are accounted for above or preserved.
`docs/documentation-audit/**` (85 files), `docs/evidence/**` (3),
`docs/exec-plans/**` (16), `docs/operations/**` (4),
`docs/product-specs/**` (33 files: this two-file SPEC, the index, and 30
historical files), `docs/research/**` (2), `docs/standards/**` (3), and
`docs/verification/**` (24) are fully classified. Their audit/history,
authority/control, research, or retained proof members remain Preserve because
they do not become current intent for this repository-only runtime edge.

## Risks and remaining implementation questions

1. Keep the direct `Effect.runPromise(Fiber.await(fiber).pipe(Effect.asVoid))`
   value assignable to Eve's installed `waitUntil(task: Promise<unknown>)`
   callback without a helper or cast.
2. Make the focused test observe the background finalizer after
   `runtime.disposeEffect` using Effect synchronization rather than scheduling
   sleeps. The installed beta behavior was smoke-tested during review, but the
   repository test must retain the proof.
3. Decide during implementation whether typed-failure-only `tapError` logging
   is sufficient. `Fiber.await` observes defect and interruption completion but
   does not log them; do not overclaim observability or introduce a telemetry
   wrapper without an independently owned policy.
4. Re-read exact deployment function identities before any authorised hosted
   proof; the 2026-07-23 receipt is historical evidence only.
5. Re-review local/HMR disposal only if the pinned Eve version changes or Eve
   exposes an authored-module/application teardown API. Installed `eve@0.20.0`
   does not provide one to Channel modules.

## Formal review outcome

`prd-review` completed an initial pass and two adversarial in-place re-reviews
on 2026-07-24. The corrected SPEC is accepted for implementation planning. No
active execution plan was created because implementation has not begun.

The review made these decisions:

1. Reject `ChannelEffectRunner`, callback runners, runtime Services, and
   pass-through helpers. The concrete provider runtime already owns
   interpretation and is the narrow test seam.
2. Reject one combined Eve runtime and explicit cross-runtime MemoMap sharing.
   They create false sharing across same-tag provider values, config
   acquisition, failure, Scope, and disposal without a demonstrated consumer.
3. Replace accepted `forkDetach` with direct provider `runFork` plus
   `Effect.runPromise(Fiber.await(...).pipe(Effect.asVoid))` at the Eve edge.
   `forkChild`, `forkScoped`, and `join` have the wrong lifetime/failure
   semantics for the existing accepted-response contract.
4. Retain the installed beta's cached Layer-build failure and fresh-runtime
   recovery policy. Do not add automatic singleton replacement.
5. Add the claim-to-fork interval and replay-lease recovery boundary explicitly;
   require the Fiber and `waitUntil` registration before the handler resolves.
6. Replace speculative HMR-hook work with installed-source evidence:
   Eve-owned close/reload paths do not expose authored Channel runtime disposal.
7. Preserve Photon Spectrum's per-operation `acquireUseRelease`; a shared
   Spectrum application remains a separate lifecycle decision.
8. Keep every Vercel statement evidence-bounded and every code task
   independently gated for Effect shape, boundary rules, diagnostics, focused
   tests, documentation impact, and repository checks.
9. Scope cardinality to one runtime per loaded provider composition root per
   module instance. Current local output loads both roots, but future
   Eve/Vercel function splitting must be read back rather than assumed.
10. Replace stale source/reference anchors with exact current-main paths and
    add an explicit fixture lifecycle, effect-client-wrapper preservation
    decision, release owner/trigger table, and all-green acceptance gate.
11. Separate deterministic per-runtime behavior tests from source/build
    cardinality proof; a unit test cannot establish function-module loading.
12. Preserve installed Eve's sanitized `500` path for authored handler
    rejection, reject an unowned Channel-wide timeout/retry, account for every
    repository `README.md`, and ground repository acceptance to the named agent
    architecture owner.
