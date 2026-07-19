# Sendblue Typing Indicators

- Status: In progress
- Owner: `apps/agent`
- Last reviewed: 2026-07-19

## Decision

Add an app-owned, Effect-typed Sendblue typing-indicator lifecycle to the
existing Production-verified custom Eve channel.

Start the indicator on Eve `turn.started`, after the inbound message has passed
Sendblue authentication, Schema decoding, sender allowlisting, durable replay
claiming, and Eve dispatch. Stop it immediately before a terminal visible reply
is sent. Also stop it on terminal, failed, waiting, and user-input-required Eve
events as a fail-safe. A provider maximum duration guarantees eventual cleanup
when a stop callback cannot run.

Do not start on the raw webhook and do not wait for the first
`message.appended` delta:

- raw-webhook start would expose activity to ignored, duplicate, malformed, or
  unapproved senders before Bundjil policy accepts the message;
- first-delta start is too late for a channel that sends only completed text;
- `turn.started` is Eve's earliest typed event after accepted dispatch and is
  the hook used by Eve's own Chat SDK channel in installed Eve `0.20.0`.

Keep the existing custom channel and `SendblueClient`. Chat SDK is a verified
behavioral reference, not a runtime dependency. Adding `chat` or
`chat-adapter-sendblue` would duplicate the existing authentication, identity,
replay, Config, HTTP, and Effect service boundaries. The vendor adapter's
current `startTyping()` also omits Sendblue's explicit `state: "stop"` and
`max_duration_ms` controls, which this lifecycle requires.

## Problem, User, And Success

Today the allowlisted personal iMessage user sees no activity while an
accepted Bundjil turn is running model or tool work. The only visible signal is
the completed reply, so a healthy long-running turn is indistinguishable from
a stalled webhook.

This slice succeeds when an accepted turn begins one bounded typing indicator
near `turn.started`, waiting events remove it, an authorized continuation
restarts it, and terminal delivery attempts a stop before the existing final
message. Duplicate events must not create a typing storm, stale events must not
stop a newer turn, and typing work may delay final delivery by at most the
separate two-second auxiliary-request timeout.

## Research And Authority

DeepWiki was used in three review passes to inspect `vercel/eve`, `vercel/chat`,
`Effect-TS/effect`, and `sendblue-api/sendblue-ts`. Its synthesis correctly
identified Eve `turn.started`, Chat SDK `startTyping()`, and the Sendblue typing
resource, but direct pinned source is authoritative where details differ. The
review pass also exposed stale or incorrect DeepWiki claims: Eve's Chat SDK
channel is already present in installed `0.20.0`, Eve persists channel state
between durable callbacks rather than relying on one process, the pinned
Sendblue request does include `from_number`, `state`, and `max_duration_ms`,
and an Effect `DurableQueue` is neither necessary nor preferable to Eve's
existing durable channel state.

The third pass repeated the same version-skew warning. It incorrectly claimed
that `session.failed` mutations are persisted, that Effect Struct decoding
rejects excess fields by default, and that the current Sendblue typing request
contains only `number`. Installed Eve's terminal-failure implementation has no
state reserialization after the handler, installed Effect `4.0.0-beta.74`
defaults `onExcessProperty` to `ignore`, and the pinned generated Sendblue
request includes `from_number`, `number`, optional `state`, and optional
`max_duration_ms`. The pinned/local sources win.

Confirmed source facts:

- installed Eve `0.20.0` at tag commit
  `c61ea67b02f1f308c0df40934c47566b76f082e2` exposes typed handlers for
  `turn.started`, `message.appended`, `message.completed`, `turn.completed`,
  `turn.failed`, `session.waiting`, `session.completed`, `session.failed`,
  `input.requested`, and authorization events;
- Eve `0.20.0`'s Chat SDK channel calls `thread.startTyping("Working...")` on
  `turn.started`;
- Eve writes mutations made through the channel context back to durable adapter
  state between event callbacks;
- Chat SDK defines `startTyping()` as an adapter capability and its vendor
  Sendblue adapter supports direct 1:1 conversations only;
- Sendblue `POST /api/send-typing-indicator` requires `number` and
  `from_number`, accepts `state: "start" | "stop"`, accepts
  `max_duration_ms` from `1` through `300000`, and returns provider status
  `SENT | ERROR`;
- Sendblue documents a stop against no active indicator as a safe no-op, and
  describes delivery as best effort even when the response says `SENT`;
- typing is available only for recent, existing iMessage conversations and not
  for groups, SMS, or RCS.

One narrative Sendblue page describes `from_number` as optional, while the
current generated method, pinned SDK, and OpenAPI contract require it. Bundjil
follows the generated contract and always sends the configured line.

The account-level Sendblue auto-typing setting is rejected for this slice. It
fires before Bundjil's allowlist/replay policy for every eligible inbound on the
shared account and is not controlled by the repository's typed lifecycle.

## Goals

- Show the iMessage typing bubble as soon as an accepted Eve turn starts.
- Stop the bubble before the final visible Sendblue reply is sent.
- Ensure the indicator expires even if Eve, Vercel, or Sendblue loses a later
  callback.
- Make invalid provider commands unrepresentable with Effect Schema unions.
- Preserve the existing authenticated inbound, replay-protected outbound, and
  single-active-Production-webhook behavior.
- Treat typing as auxiliary best-effort UX: its failure never blocks Eve work
  or the final reply.
- Keep failures observable through sanitized typed outcomes and structured
  Effect log annotations without retaining content, phone numbers, credentials,
  provider bodies, or raw errors.

## Non-goals

- Do not stream partial assistant text over Sendblue.
- Do not enable Sendblue's account-level auto-typing setting.
- Do not add inbound user-typing behavior, group typing, SMS/RCS typing, read
  receipts, delivery-status callbacks, media, or HITL reply handling.
- Do not migrate the custom channel to Chat SDK or add Chat SDK dependencies.
- Do not add a generic cross-channel presence package or move Sendblue
  contracts into `@bundjil/core` or `@bundjil/eve-effect`.
- Do not promise that provider `SENT` proves the handset rendered the bubble.
- Do not add a dashboard, React route, provider-admin CLI, or webhook mutation.

## Governing Architecture

Implementation follows:

- `docs/architecture/effect-patterns.md` for Schema ownership, flat named
  Effects, tagged errors, Config, Context services, Layers, and helper
  admission;
- `docs/architecture/repo-structure.md` for the existing app-owned Sendblue
  boundary;
- `docs/architecture/eve-agent.md` for the custom-channel event and
  `ManagedRuntime` edge; and
- `docs/architecture/testing-and-quality.md` for focused, hosted, Production,
  and leak-safe verification.

## Canonical Contracts

Reuse these existing owners:

- `E164PhoneNumber`, the existing Sendblue routing fields, and provider Config from
  `apps/agent/agent/lib/sendblue/schemas.ts`;
- `EveTurnId` from `@bundjil/eve-effect`;
- `SendblueClient`, `SendblueChannel`, their live/memory Layers, and the
  module-owned `ManagedRuntime`;
- current message delivery and replay contracts unchanged.

Add app-owned Schemas with domain types derived through
`typeof SchemaName.Type`:

- `SendblueTypingIndicatorState = Schema.Literals(["start", "stop"])`;
- `SendblueTypingIndicatorDurationMillis`, a branded integer constrained to
  `1..300000`;
- `SendblueTypingIndicatorStart`, requiring `state: "start"`, both E.164
  numbers, and `max_duration_ms`;
- `SendblueTypingIndicatorStop`, requiring `state: "stop"` and both E.164
  numbers, with no duration field;
- `SendblueTypingIndicatorInput`, the discriminated union of start and stop;
- `SendblueTypingIndicatorProviderResponse`, requiring a decoded
  `SENT | ERROR` status while safely accepting the documented optional number
  and nullable error message;
- `SendblueTypingIdle` and `SendblueTypingActive`, tagged structs combined as
  `SendblueTypingLifecycle`;
- `SendblueTypingUnavailableReason`, composed from the existing Sendblue client
  reason Schemas plus `stateInvalid` rather than mirroring their literals;
- `SendblueTypingTransition`, a tagged result carrying the next lifecycle, one
  finite outcome (`started | stopped | unchanged | unavailable`), and a safe
  reason only when unavailable;
- `SendblueTypingLifecycleCommand`, an exhaustive tagged union of
  `StartTurn { turnId }`, `ResumeTurn { turnId }`, and
  `StopTurn { expectedTurnId?: turnId }`; and
- `SendblueTypingTransitionInput`, carrying raw Eve state as `Schema.Unknown`
  and one lifecycle command. The domain service separately decodes the core
  conversation state and the complete channel state, so it has the recipient
  required for the provider request while retaining control of migration and
  corruption recovery. Provider start/stop request values are constructed
  inside the matching branch, so a caller cannot pass `Stop` to a start
  operation.

Extend the existing `SendblueClientOperation` Schema with
`setTypingIndicator` and reuse `SendblueRequestError`,
`SendblueResponseError`, and `SendblueDeliveryUncertainError`. Their existing
finite safe reasons already distinguish encoding, transport, timeout, HTTP
rejection, provider rejection, and malformed response. Do not add a parallel
typing-specific error taxonomy.

The provider request union deliberately makes these states impossible:

- start without a duration;
- stop with a duration;
- an arbitrary state string;
- unvalidated phone numbers; or
- duration outside the published provider range.

Split the existing four routing fields into a named
`SendblueConversationState` Schema. `SendblueCompletedMessage.state` uses this
narrow core Schema so malformed auxiliary typing state can never prevent final
reply decoding. `SendblueChannelState` extends the core state with
`typing: SendblueTypingLifecycle`.

To preserve existing durable sessions, the encoded channel-state form accepts
a missing typing key and decodes it to `Idle` with Effect v4:

```ts
typing: SendblueTypingLifecycle.pipe(
  Schema.withDecodingDefaultTypeKey(Effect.succeed(SendblueTypingIdle.make({})))
);
```

The Eve adapter is the narrow exception to the usual domain-Type rule because
Eve supplies and persists raw channel state. Type that boundary as
`Schema.Codec.Encoded<typeof SendblueChannelState>`; domain services decode
unknown/encoded state to `typeof SendblueChannelState.Type`. After a
transition, Schema-encode its next lifecycle and mutate only
`channel.state.typing` in place. New inbound decisions always construct an
explicit `Idle`. Do not use a cast, manual fallback, optional domain field, or
duplicate DTO for this migration.

State recovery is deterministic. A missing encoded `typing` key is the valid
legacy case and decodes to `Idle`. If the core conversation fields are valid
but the auxiliary typing value is malformed, `transitionTyping` performs no
provider call for that event, returns `Unavailable(stateInvalid, Idle)`, and
the adapter replaces only the malformed field with encoded `Idle`. Final
delivery still decodes the core conversation state independently. If the core
conversation fields are also malformed, typing likewise returns the same
fail-open recovery without a provider call; final delivery may then reject for
its own existing routing reason, but never because of auxiliary typing.

Rollback compatibility is bidirectional: the new decoder accepts legacy state
without `typing`, and `SendblueConversationState`—the same four-field shape
owned by the prior deployment—decodes newly encoded state while ignoring the
extra typing key under installed Effect's default Struct parse options.

`Active` means that Bundjil owes the provider a matching cleanup attempt; it
does not claim that the best-effort bubble is visible. After a start request is
attempted, both `started` and `unavailable` transitions conservatively carry
`Active(turnId)`. A failed matching stop returns `unavailable` and retains that
same `Active` lifecycle so later terminal Eve events can retry. Only a
successful stop returns `Idle`. `StartTurn` is replay-safe for the same active
turn. `ResumeTurn` deliberately reissues a bounded start for the same turn,
including after a failed authorization stop, while stale `StopTurn` commands
remain no-ops. This removes false certainty at the network
boundary while the provider duration still bounds cleanup if every retry is
lost.

## Effect Lifecycle Design

This lifecycle crosses separate durable Eve event callbacks and may cross
Vercel process invocations. Therefore it is not one scoped Effect resource.

Do not use `Effect.acquireRelease`, `Effect.acquireUseRelease`,
`Resource.auto`, `Effect.forkScoped`, `Ref`, a module-level `Map`, a timer, or
an in-memory Fiber to span `turn.started` through completion. A scope created
for the start callback closes when that callback returns; a fiber or Ref can be
lost before the stop callback. Those primitives remain appropriate only for
resources whose acquire/use/release lifetime is contained in one execution.

Instead:

1. Eve durable `channel.state.typing` owns replay-safe lifecycle intent.
2. Sendblue owns the externally visible, expiring typing bubble.
3. Each Eve event invokes one explicit Effect command against that external
   state.
4. `max_duration_ms` is the crash/redeploy safety bound.
5. `state: "stop"` performs early cleanup and is safe to repeat.

Primary operations remain flat named Effects:

```text
SendblueClient.setTypingIndicator
  -> decode SendblueTypingIndicatorInput
  -> Schema HTTP body encode
  -> POST /api/send-typing-indicator with existing redacted credentials
  -> separate two-second auxiliary timeout with no automatic retry
  -> decode SendblueTypingIndicatorProviderResponse
  -> Match SENT | ERROR
  -> typed success or existing operation-discriminated SendblueClientError

SendblueChannel.transitionTyping
  -> decode SendblueTypingTransitionInput
  -> decode SendblueConversationState and migrated SendblueChannelState
  -> repair malformed auxiliary state to Idle without provider work
  -> Match StartTurn | ResumeTurn | StopTurn exhaustively
  -> Match Idle | Active lifecycle inside the command branch
  -> construct the only valid provider start or stop request for that branch
  -> no-op for same-turn StartTurn, Idle StopTurn, or stale StopTurn
  -> always reissue start for ResumeTurn when its turn is current
  -> SendblueClient.setTypingIndicator
  -> return Active on start attempt, Idle on successful stop, or retain Active
     on fail-open Unavailable stop
```

The client exposes the typed provider failure. The channel policy converts it
once in an outer `.pipe(...)` into an `Unavailable` transition. Every real
provider attempt emits exactly one sanitized structured runtime observation at
the channel boundary using the installed Effect logger and log annotations.
The observation contains only `operation=setTypingIndicator`, command,
transition outcome, safe reason when unavailable, optional HTTP status, and
elapsed milliseconds measured through Effect `Clock`. State-decode recovery
emits the same safe shape with `providerAttempted=false` and
`reason=stateInvalid`; replay no-ops emit no provider-attempt observation.
Never annotate a session id, turn id, number, content, handle, URL, credential,
provider body, or raw cause. This produces countable Preview/Production
evidence even though no tracer exporter or dashboard exists. Failure logging
uses warning level and success uses info level. This is fail-open for the agent
and message delivery, not silent error swallowing.

Define the observation as an app-owned `SendblueTypingObservation` Schema and
construct it at the policy boundary before logging. Tests replace the Effect
logger, capture decoded observations, and assert one observation per provider
attempt, zero for replay no-ops, exact safe fields/timing, and absence of
protected values. Do not add an observability service, exporter, dashboard, or
generic logging helper.

No typing call receives message content, provider handles, replay records,
credentials, or full error bodies. Phone numbers are required in the private
provider request but are never span attributes, logs, snapshots, or proof
output.

Typing HTTP work must not inherit `sendMessage`'s current 30-second timeout.
Use one app-owned two-second duration constant for both typing commands. Each
call is attempted once: the provider command is state-setting, Eve terminal
events already provide cleanup opportunities, and an SDK-level retry would
obscure replay counts. Because Eve awaits event handlers, a failed pre-delivery
stop may delay the final reply by no more than this two-second bound before the
existing send continues.

## Eve Event Policy

The typed event map in `defineChannel` remains the dispatcher; do not create a
manual event-name parser or mirror Eve's full event protocol.

| Eve event                                     | Typing behavior                                                      |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `turn.started`                                | `StartTurn` once for decoded `turnId` with configured duration.      |
| `message.appended`                            | No provider call; per-token calls are forbidden.                     |
| `message.completed` with `tool-calls`         | Keep active; do not send intermediate text.                          |
| terminal visible `message.completed`          | Attempt `StopTurn`, persist returned state, then deliver regardless. |
| `turn.completed`                              | Stop as fallback if still active.                                    |
| `turn.failed`                                 | Stop the matching turn.                                              |
| `input.requested` or `authorization.required` | Stop because the agent is waiting on the user.                       |
| `authorization.completed` with `authorized`   | `ResumeTurn` for its matching turn before model continuation.        |
| other `authorization.completed` outcomes      | Remain stopped; no provider call.                                    |
| `session.waiting` or `session.completed`      | Stop any remaining active lifecycle.                                 |
| `session.failed`                              | Best-effort stop only; provider expiry is the persistence fallback.  |

Define one framework-boundary factory,
`makeSendblueEveEvents(runtime) satisfies ChannelEvents<...>`, pass that map to
`defineChannel`, and test the exported event map directly. Eve's returned
`Channel` exposes routes and receive behavior, not event handlers; do not use an
unsafe cast to reach private handlers. This single seam owns framework event
projection and is not a generic helper abstraction.

The transition result updates encoded `channel.state.typing` in the thin Eve
adapter after the Effect returns. Same-turn `StartTurn` replay and already-idle
`StopTurn` replay return `unchanged` without another provider call. A stale
terminal event for a different turn cannot stop the current active turn. A new
`turn.started` while an older cleanup obligation remains sends a fresh bounded
start and replaces the active turn id; later terminal events for the older turn
remain stale. An authorized completion uses `ResumeTurn`, which deliberately
reissues start even when an uncertain earlier stop left the matching lifecycle
conservatively Active.

`session.failed` is an Eve special-case callback without durable channel
writeback. It may decode available state and attempt a sanitized, non-throwing
provider stop, but acceptance must not claim that it persisted `Idle`. The
provider maximum duration is the final cleanup guarantee for that path.

The start duration is app-owned Effect Config:

```text
BUNDJIL_SENDBLUE_TYPING_MAX_DURATION_MILLIS
```

It defaults to `120000` and must decode through the canonical `1..300000`
Schema. The binding is non-secret but remains server-only and must be declared
in the agent build environment contract. This slice does not schedule refresh
calls: an unusually long turn may lose the bubble after the bounded duration,
which is safer than an unbounded indicator or a serverless timer.

## Call Graphs

### Production

```text
authenticated allowlisted Sendblue inbound
  -> existing replay claim and Eve send(...) under waitUntil
  -> Eve turn.started(event, channel, ctx)
  -> module-owned ManagedRuntime<SendblueChannel>
  -> SendblueChannel.transitionTyping(StartTurn)
  -> SendblueClient.setTypingIndicator(Start)
  -> Effect HttpClient POST /api/send-typing-indicator
  -> channel.state.typing = Active(turnId)
  -> Eve model/tool loop
  -> terminal message.completed
  -> SendblueChannel.transitionTyping(StopTurn)
  -> Effect HttpClient POST /api/send-typing-indicator state=stop
  -> channel.state.typing = returned Idle | Active
  -> existing SendblueChannel.deliverCompletedMessage
  -> existing outbound replay claim
  -> existing SendblueClient.sendMessage
```

Failure/waiting fallback:

```text
turn.failed | turn.completed | input.requested | authorization.required |
session.waiting | session.completed
  -> SendblueChannel.transitionTyping(StopTurn)
  -> Stopped | Unchanged | Unavailable
  -> never block the Eve lifecycle

authorization.completed(outcome=authorized)
  -> SendblueChannel.transitionTyping(ResumeTurn)
  -> reissue bounded start before model continuation

session.failed
  -> best-effort provider stop without durable-state acceptance
```

### Tests

```text
typed Eve event fixture
  -> makeSendblueEveEvents(test ManagedRuntime)
  -> public typed ChannelEvents map
  -> SendblueChannelLive
  -> SendblueClientMemory or injected Effect HttpClient
  -> captured ordered typing/message operations
  -> asserted durable lifecycle transition and sanitized outcome
```

### Hosted Proof

```text
clean immutable Preview deployment with no registered Sendblue webhook
  -> fresh Preview-only conversation namespace so no old pinned workflow resumes
  -> authenticated direct synthetic accepted event through the full Eve route
  -> one start, one stop, one final outbound, no Production inbound duplication
  -> Production deployment only after Preview acceptance
  -> one real handset inbound through the sole stable Production webhook
  -> handset confirmation plus sanitized provider/runtime counts
```

No committed provider-admin CLI is introduced. Preview must not register a
second shared-line webhook or recreate its revoked dedicated Sendblue bypass.
Deploy from the repository root with the canonical app runbook command:

```text
vercel deploy . --project bundjil-agent --scope cooper-corbetts-projects --yes
```

Do not use `eve deploy` or `vercel deploy --prebuilt`. Obtain a fresh project
token and use `vercel curl` for protected Preview `/eve/v1/*` checks. The one
direct accepted-route fixture necessarily contains minimal text and a unique
replay handle; create both ephemerally inside a trusted shell, pass the body via
stdin, discard it immediately, and never print, retain, commit, or place it in
shell history. Because Vercel Preview workflow resumes remain pinned to their
originating deployment and Eve `0.20.0` opts into latest-deployment nested turns
only in Production, the Preview proof must deploy with a fresh ephemeral
Preview-only routing key. Restore the exact prior project value immediately
after the immutable deployment snapshots it. Record only event kinds, counts,
statuses, safe typing
observations, timings, and leak booleans.

## Verification

Focused tests must prove:

- Config default, lower/upper bounds, and out-of-range rejection;
- exact Schema-encoded start and stop request shapes and existing auth headers;
- success, provider `ERROR`, malformed response, `400`, `401`, `429`, `5xx`,
  transport failure, and timeout classification;
- timeout tests use `@effect/vitest` and `TestClock.adjust("2 seconds")`, not
  wall-clock sleeps;
- start on one typed `turn.started` event only after accepted Eve dispatch;
- no typing for ignored, duplicate, malformed, unauthorized, unknown-sender,
  group, SMS/RCS, or media-only inbound events;
- same-turn start replay and idle stop replay make no second provider call;
- stale terminal events cannot stop a newer active turn;
- terminal reply ordering is `stop attempt -> sendMessage`, including after
  the two-second stop timeout;
- tool-call completion and message deltas make no typing stop/start storm;
- turn/session completion, waiting, failure, and input events perform their
  specified cleanup; `session.failed` proves only a best-effort stop attempt;
- `authorization.required -> authorization.completed(authorized)` stops then
  forces a bounded same-turn resume before continued model output, while
  declined, failed, and timed-out outcomes do not restart;
- start/stop provider failures return `Unavailable`, emit only sanitized
  telemetry, and never block the final reply;
- missing typing state in an old encoded `SendblueChannelState` decodes to
  `Idle`, explicit `undefined` is rejected, and newly encoded state includes
  the field;
- adapter state is typed as the Schema encoded form and persists an encoded
  transition without a cast;
- invalid or corrupt auxiliary typing state produces unavailable cleanup but
  cannot block decoding or attempting final delivery from valid core
  conversation state; and
- every provider attempt produces exactly one Schema-valid sanitized runtime
  observation, state-invalid recovery sets `providerAttempted=false`, replay
  no-ops produce none, and captured logs contain no protected field;
- legacy encoded state decodes through the new Schema and newly encoded state
  decodes through the four-field conversation Schema with the extra typing key
  stripped, proving forward and rollback compatibility; and
- no content, phone number, API secret, webhook secret, protected URL, raw
  provider response, or raw exception appears in logs, snapshots, spans, or
  proof artifacts.

Required commands:

```text
bun install --frozen-lockfile
bun run --filter @bundjil/eve-effect check-types
bun run --filter @bundjil/eve-effect test
bun run --filter @bundjil/agent check-types
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
bun run check
bun run knip
bun run verification
bun run build
git diff --check
```

Agent build/test and root verification require the repository-documented,
gitignored Executor configuration. Use the local protected configuration or a
sanitized CI-safe synthetic endpoint/key fixture supported by the test harness;
never print it or commit it. Report a missing Executor binding as an
environment precondition failure, not as a typing regression.

CI is part of this slice because the checked-in workflow currently supplies no
Executor endpoint even though Eve imports the endpoint synchronously during
build. Before feature implementation, set only the public synthetic model-mode
toolkit URL as job-level `BUNDJIL_EXECUTOR_MCP_URL` in
`.github/workflows/ci.yml`; do not add an API key or secret. Build and
verification must pass with that exact public fixture and still fail closed for
invalid endpoint shapes in focused Config tests.

Review Effect language-service diagnostics for every changed TypeScript file.
Static scans must find no unsafe casts, `any`, manual JSON, DTO mirrors, direct
`process.env`, raw fetch, `instanceof` branching, module timers/fibers/Refs,
provider SDK leakage, generic helpers, pass-through services, or broad lint
suppressions.

Hosted acceptance is Preview-first without a Preview provider webhook, followed
by one bounded Production handset proof. Record only environment, deployment
id, status, event kinds, counts, safe typing outcomes, timings, and leak
booleans. Provider `SENT` is API acceptance only; visible delivery requires an
explicit handset observation. The Production window must show one inbound,
one accepted turn, at least one start, at least one stop or bounded expiry, one
final outbound, and zero Preview ingress or duplicate outbound.

Preview acceptance and Production acceptance are independent stop/go gates. A
clean Preview proves the protected route, typed event order, structured typing
observations, and absence of shared-line ingress. Only then may Production be
deployed. Production acceptance requires the one handset observation and
provider/runtime count reconciliation; a failed or unobservable Production
window blocks documentation closure and triggers the rollback decision.

## Risks And Tradeoffs

- Typing is best effort; API `SENT` can still mean no visible bubble.
- A process can fail after the provider start succeeds but before Eve persists
  `Active`. Replay may repeat start; this is safe because the provider command
  sets expiring state rather than delivering content.
- A stop can fail. The maximum duration bounds the stale bubble and final reply
  delivery continues.
- The explicit durable lifecycle adds one field to channel state. The decoding
  default is mandatory to avoid breaking existing continuations.
- Start and stop add up to two provider calls per normal turn. Per-token and
  scheduled refresh calls are intentionally excluded.
- A 120-second indicator may expire during a long tool workflow. This is an
  accepted UX fallback; later refresh policy requires measured evidence and a
  SPEC amendment.

## Downstream Impact Matrix

| Surface                                          | Decision        | Exact scope, order, and repository evidence                                                                                                                                                                                                                                                                                                                                                                                                    | Acceptance and proof                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                                               | Change required | First, update `.github/workflows/ci.yml` job env with only the public synthetic `BUNDJIL_EXECUTOR_MCP_URL`. `apps/agent/agent/connections/executor.ts` loads it synchronously; current CI runs build/verification without it. Task: `stabilize-agent-ci-fixture`.                                                                                                                                                                              | `env BUNDJIL_EXECUTOR_MCP_URL='https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=model' bun run build`; same env with `bun run verification`; inspect workflow for no API key.                                                                                             |
| Provider contracts and Config                    | Change required | In `apps/agent/agent/lib/sendblue/{schemas.ts,config.ts,client.service.ts,memory.layer.ts}`, extend the existing app-owned service and error operation. Do not edit the three established error classes unless their Schema-derived operation import forces a mechanical change. Task: `implement-typed-sendblue-indicator-client`.                                                                                                            | Focused Config/client tests plus agent typecheck/test/build; no new source module or dependency without recorded helper admission.                                                                                                                                                      |
| Provider tests and build env                     | Change required | In the same provider task, update `apps/agent/test/{sendblue-config.test.ts,sendblue-client.test.ts}` and `turbo.json` `@bundjil/agent#build.env`. Because `SendblueConfig` gains one required field, also update only the canonical synthetic Config fixtures in `sendblue-{channel,replay-store,security-identity}.test.ts`. This precedes every feature build.                                                                              | Default/bounds/request/error/`TestClock` tests pass; adjacent fixtures add only `typingMaxDurationMillis: 120_000`; `rg -n 'BUNDJIL_SENDBLUE_TYPING_MAX_DURATION_MILLIS' turbo.json apps/agent`; filtered agent build passes.                                                           |
| Eve lifecycle                                    | Change required | Then update `apps/agent/agent/lib/sendblue/{schemas.ts,channel.service.ts}`, `apps/agent/agent/channels/sendblue.ts`, and `apps/agent/test/{sendblue-channel.test.ts,sendblue-build-route.test.ts}`. `live.layer.ts` changes only if actual Layer composition changes. Task: `wire-durable-eve-typing-lifecycle`.                                                                                                                              | Directly assert exported event-map keys and ordered operations; prove encoded migration, corruption repair, authorization resume, `session.failed`, observation privacy, and stop-before-send; run agent checks/build.                                                                  |
| Preview operations                               | Change required | After local gates, follow `apps/agent/README.md` hosted runbook with the root `vercel deploy` command, fresh project token, and `vercel curl`. Use a fresh ephemeral Preview-only routing key for the immutable deployment so the fixture cannot resume an older pinned workflow, then restore the exact prior project value. No provider webhook. Tasks: `establish-preview-workflow-version-boundary`, then `prove-sendblue-typing-preview`. | Clean immutable Preview, protected route proof, exact start/stop/final counts and observations, zero Production inbound and zero retained fixture material; prior routing-key hash restored after deployment.                                                                           |
| Production operations                            | Change required | Only after Preview acceptance, deploy clean Production without changing webhook/config topology and run one bounded handset window. Task: `prove-sendblue-typing-production`.                                                                                                                                                                                                                                                                  | One inbound, accepted turn, start, stop-or-expiry, final outbound, zero Preview ingress/duplicates, provider acceptance separated from handset observation; rollback decision recorded.                                                                                                 |
| Canonical architecture                           | Change required | After Production acceptance, update root `ARCHITECTURE.md` and `docs/architecture/eve-agent.md` current Production/test graphs with the typed event seam, encoded state, authorization resume, observations, timeout, and delivery ordering. Task: `reconcile-sendblue-typing-documentation`.                                                                                                                                                  | Run `rg -n 'message\.completed.*outbound claim.*SendblueClient\|Preview.*active.*Sendblue' ARCHITECTURE.md README.md apps/agent/README.md docs/architecture/eve-agent.md docs/product-specs/sendblue-eve-channel.md`; every match is updated current behavior or explicitly historical. |
| Product docs and indexes                         | Change required | In the documentation task, index this SPEC and its final status in `docs/README.md`; add a later-extension note to `docs/product-specs/sendblue-eve-channel.md` without rewriting its historical first-slice non-goal; finalize this SPEC.                                                                                                                                                                                                     | Links resolve; current vs historical language agrees; `rg -n 'Sendblue Typing Indicators' docs/README.md docs/product-specs`; documentation checks pass.                                                                                                                                |
| Root/app READMEs                                 | Change required | In the documentation task, update root `README.md` Sendblue current state and `apps/agent/README.md` Config, lifecycle, structured observations, hosted proof, monitoring, and rollback only from accepted evidence.                                                                                                                                                                                                                           | Environment name/default and current call graph are findable; no stale terminal-only or Preview-live claim; `bun run check` and leak scan pass.                                                                                                                                         |
| Task ledger and active plan                      | Change required | This JSON ledger and `docs/exec-plans/active/sendblue-typing-indicators.md` are updated after every accepted task using `completedPasses` and `passEvidence`; documentation closure sets final statuses.                                                                                                                                                                                                                                       | `jq empty`, dependency/status audit, at least three distinct pass records per accepted task, and `git diff --check`.                                                                                                                                                                    |
| Runtime observations                             | Change required | Add only the app-owned Schema plus Effect logger/Clock behavior in the named Sendblue files; no new exporter or service. Dashboard remains N/A because bounded Vercel runtime logs are the acceptance source.                                                                                                                                                                                                                                  | Logger-substitution tests prove one safe observation per attempt, no observation for replay no-op, elapsed timing, and no protected fields; hosted log counts reconcile.                                                                                                                |
| Package and unrelated app READMEs                | N/A             | `packages/{core,effect-start,eve-effect,effect-persistence,codex-oauth}/README.md` and `apps/codex-proxy/README.md` own unchanged package/proxy APIs.                                                                                                                                                                                                                                                                                          | `git diff --name-only` shows none unless implementation demonstrates a real boundary change.                                                                                                                                                                                            |
| Other architecture rules                         | N/A             | `docs/architecture/{effect-patterns,repo-structure,testing-and-quality,frontend-composition}.md` already govern the work and no rule changes.                                                                                                                                                                                                                                                                                                  | Implementation diff conforms; no edits unless a rule itself changes.                                                                                                                                                                                                                    |
| Lint/static configuration                        | N/A             | `package.json`, `oxlint.config.ts`, `tsconfig.base.json`, `knip.json`, and Vitest configs already enforce the applicable rules. No disable, ignore, `any`, or `ts-ignore`.                                                                                                                                                                                                                                                                     | `bun run check`, `bun run knip`, focused typechecks/tests, and `bun run verification`.                                                                                                                                                                                                  |
| Skills and agent instructions                    | N/A             | `.agents/skills/{prd-writer,prd-implementer,effect-client-wrapper}/SKILL.md` already cover this flow. The ledger uses `passEvidence` as required by `prd-implementer`; there is no `agents/openai.yaml` or repository skill validator.                                                                                                                                                                                                         | Inspect skill contract and ledger keys; no skill files changed.                                                                                                                                                                                                                         |
| Production preflight                             | N/A             | `apps/agent/agent/production-preflight.ts` and `apps/agent/test/production-preflight.test.ts` describe the historical first activation and require `productionActivated:false`; they are not this rollout gate.                                                                                                                                                                                                                                | No diff in either file; Preview/Production task gates supply current evidence.                                                                                                                                                                                                          |
| Vercel environment mutation                      | Proof-only      | The accepted `120000` default means no new durable variable is required. Preview acceptance temporarily rotates the existing Preview routing key only to create a new workflow-version boundary; the immutable deployment snapshots it and the exact prior project value is restored before the fixture. Production variables remain untouched.                                                                                                | Before/after value hashes match; the candidate deployment uses the ephemeral Preview namespace; provider inventory has no new key and no value is printed or committed.                                                                                                                 |
| Manifests, lockfile, changesets, release notes   | N/A             | Private app behavior adds no dependency, package API, workspace, or release. `package.json`, workspace manifests, `bun.lock`, and `.changeset/*` remain unchanged.                                                                                                                                                                                                                                                                             | Frozen install succeeds; `git diff --name-only` and `bun run knip` confirm.                                                                                                                                                                                                             |
| Generated artifacts and metadata                 | N/A             | Do not commit `.output`, `.vercel/output`, generated Eve metadata/routes, snapshots, or provider fixtures. `eve build` is proof, not a source generator task.                                                                                                                                                                                                                                                                                  | Status/leak scan shows no generated or protected artifact.                                                                                                                                                                                                                              |
| React, accessibility, browser UI                 | N/A             | This is a server-side custom channel; no TSX, route, or visible web UI changes.                                                                                                                                                                                                                                                                                                                                                                | `git diff --name-only` contains no UI file; no browser evidence required.                                                                                                                                                                                                               |
| Database, migrations, webhook, provider settings | N/A             | No database migration, second ingress, webhook mutation, or account-level auto-typing. Sendblue's existing expiring provider state is the only external state change.                                                                                                                                                                                                                                                                          | Provider inventory remains one Production receive webhook; no migration or provider-admin artifact.                                                                                                                                                                                     |

New helper files require normal helper-admission evidence. The single
`makeSendblueEveEvents` factory is admitted as the independently testable
framework seam; all other one-use logic stays beside its owning service or
adapter.

## Implementation Delegation Prompt

```text
Use Effect TS native approaches first. Prefer Data, Schema, Array, Chunk,
HashSet, HashMap, Match, Context, Layer, Config, Service, Record, Result, Exit,
Bun/Platform Command, and ManagedRuntime over plain TypeScript helpers when the
code is fallible, async, runtime-owned, collection-heavy, or crosses a package,
RPC, SSR, command, config, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as id: string, slug: string, status, or post metadata
outside their canonical schema/type owner.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, instanceof checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema/RPC/Match/Result/Exit
primitive or owning service contract should carry the behavior.
```

## Sources

- [Eve `0.20.0` channel event types](https://github.com/vercel/eve/blob/c61ea67b02f1f308c0df40934c47566b76f082e2/packages/eve/src/public/definitions/defineChannel.ts).
- [Eve `0.20.0` Chat SDK typing hook](https://github.com/vercel/eve/blob/c61ea67b02f1f308c0df40934c47566b76f082e2/packages/eve/src/public/channels/chat-sdk/chatSdkChannel.ts).
- [Eve `0.20.0` message lifecycle contracts](https://github.com/vercel/eve/blob/c61ea67b02f1f308c0df40934c47566b76f082e2/packages/eve/src/protocol/message.ts).
- [Chat SDK thread typing API](https://chat-sdk.dev/docs/api/thread).
- [Chat SDK Sendblue adapter capability](https://chat-sdk.dev/adapters/vendor-official/sendblue).
- [Sendblue vendor Chat SDK adapter source](https://github.com/sendblue-api/chat-adapter-sendblue/blob/5125a9d018f5d05dca063cd4d7e554fdb92ecce8/src/adapter.ts).
- [Sendblue TypeScript typing resource](https://github.com/sendblue-api/sendblue-ts/blob/8da6e51c7eef459ec1e189f76e423c72c99ae10f/src/resources/typing-indicators.ts).
- [Sendblue typing API reference](https://docs.sendblue.com/api/resources/typing_indicators/methods/send/).
- [Sendblue typing behavior and auto-typing notes](https://docs.sendblue.com/api-v2/typing-indicators).
- [Effect scoped acquisition](https://github.com/Effect-TS/effect/blob/ce95d88603e9facbcd6c462c5444e391792dde6b/packages/effect/src/Effect.ts).
- [Effect refreshable scoped resources](https://github.com/Effect-TS/effect/blob/ce95d88603e9facbcd6c462c5444e391792dde6b/packages/effect/src/Resource.ts).
- [Effect Schema decoding defaults and encoded types](https://github.com/Effect-TS/effect/blob/ce95d88603e9facbcd6c462c5444e391792dde6b/packages/effect/src/Schema.ts).
- [Effect Schema excess-property decoding behavior](https://github.com/Effect-TS/effect/blob/ce95d88603e9facbcd6c462c5444e391792dde6b/packages/effect/src/SchemaAST.ts).
- [DeepWiki Eve lifecycle research](https://deepwiki.com/search/for-eve-custom-channels-in-the_d19a34e9-fe5e-420a-899b-84f7f42b9e99).
- [DeepWiki Chat SDK typing research](https://deepwiki.com/search/how-does-chat-sdk-model-typing_2906c66b-6201-4dd5-882e-9507808fe4ac).
- [DeepWiki Effect serverless-lifecycle research](https://deepwiki.com/search/assume-a-serverless-framework_5f4a0b0f-c873-490b-b5ca-867e64bcda0e).
- [DeepWiki Sendblue typing research](https://deepwiki.com/search/does-the-current-sendblue-type_80c44c4d-efca-40eb-b97d-5c3711904c9f).
- [DeepWiki Eve review query](https://deepwiki.com/search/for-a-custom-channel-in-eve-02_3157eaaa-ed15-455b-87f7-cade944be6c8).
- [DeepWiki Chat SDK review query](https://deepwiki.com/search/how-do-chat-sdk-threadstarttyp_d92a0bde-e36e-4b55-813d-d27f42d8903f).
- [DeepWiki Effect review query](https://deepwiki.com/search/for-effect-4-beta-how-should-a_81edddcc-6be6-4807-923b-28d6b601bf2f).
- [DeepWiki Sendblue review query](https://deepwiki.com/search/what-is-the-exact-typingindica_e0bb5b0f-9ee7-412e-9590-59c02459bc5e).
- [DeepWiki Eve third-pass query](https://deepwiki.com/search/for-custom-channelevents-and-d_7d38b35b-a98d-4e22-8052-a5fce6d8d26a).
- [DeepWiki Effect third-pass query](https://deepwiki.com/search/in-effect-4-beta-what-are-the_5f24f407-6221-4c3c-a265-056a066aae90).
- [DeepWiki Chat SDK third-pass query](https://deepwiki.com/search/what-guarantees-do-threadstart_740241d8-fd4e-4892-b968-4ea833497e46).
- [DeepWiki Sendblue third-pass query](https://deepwiki.com/search/for-the-current-typingindicato_c0e997ce-3ab2-4ded-840d-6cfbb5f2eb5b).
