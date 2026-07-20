# Sendblue Typing Indicators Implementation Plan

Status: Complete

Spec: `docs/product-specs/sendblue-typing-indicators.md`
Task ledger: `docs/product-specs/sendblue-typing-indicators.tasks.json`

## Execution Rule

Implement the ledger sequentially. After each working end-to-end slice, review
the actual diff, run focused checks, perform the required ownership/call-graph,
Effect-quality/helper-admission, and verification/evidence audits, record at
least three accepted passes in `passEvidence`, and commit only after the slice
passes.

Credentials stay in provider/operator stores, Vercel encrypted bindings,
gitignored local operator configuration, and the existing Sendblue Config
boundary. Plans, tests, output, commits, logs, and proof retain no message
content, full phone number, credential, protected URL, provider handle, raw
provider body, or raw exception.

## Baseline

- Started 2026-07-18 in the Bundjil worktree.
- The tracked worktree was clean before spec authoring.
- `apps/agent` owns the current Production-verified Sendblue custom channel,
  typed client, identity/routing policy, replay store, and live/memory Layers.
- The shared account has exactly one active receive webhook at the stable
  Production route; Preview has no active shared-line ingress or dedicated
  Sendblue bypass.
- Baseline behavior sent only terminal visible `message.completed` text. The
  completed rollout now starts one bounded indicator at accepted inbound,
  adopts it on `turn.started`, and attempts cleanup before final delivery.
- Installed Eve is `0.20.0`; its typed channel events include the complete
  lifecycle required by the SPEC.

## Research Record

DeepWiki research was run against:

- `vercel/eve` for channel events, turn timing, state persistence, and
  serverless callback durability;
- `vercel/chat` for the adapter-level `startTyping()` contract and Eve's Chat
  SDK behavior;
- `Effect-TS/effect` for scoped resource, fiber, Layer, Schema, and tagged-error
  patterns; and
- `sendblue-api/sendblue-ts` for the typing resource.

Direct source review then pinned the exact installed Eve tag and corrected the
provider details from the current generated SDK/OpenAPI. Review queries also
rejected stale DeepWiki claims that Eve's Chat SDK channel begins after the
installed version, channel callbacks share one process, Sendblue omits
`from_number`/`state`/`max_duration_ms`, or Effect `DurableQueue` should replace
Eve durable state. The accepted facts and query links are recorded in the
SPEC. Sendblue supports explicit start and stop, the pinned generated contract
requires the sending line and recipient, and duration is bounded to 1..300000.

The third review query was also reconciled against installed/pinned source: its
claims that `session.failed` state persists, Effect Structs reject excess keys
by default, and the current Sendblue typing request has only `number` are
incorrect for the pinned versions. The plan relies on Eve's actual terminal
failure path, Effect's default excess-key stripping, and the generated
Sendblue request/response types recorded in the SPEC.

The Effect design conclusion is deliberate: a typing bubble is not a single
scoped resource in Bundjil because Eve invokes lifecycle handlers as separate
durable callbacks that can cross Vercel processes. Eve durable channel state
and Sendblue's expiring provider state span those callbacks; each callback runs
one ordinary typed Effect command.

## Planned Slices

### 1. Reproducible CI fixture

Status: Completed

- Add only the public synthetic model-mode Executor endpoint to the CI job so
  existing `build` and `verification` commands can import the Eve connection.
- Add no Executor API key, application fallback, or hosted configuration
  mutation.
- Prove root build and verification with the exact public fixture before typing
  implementation starts.

### 2. Typed provider operation

Status: Completed

- Add the discriminated start/stop request Schemas, provider response Schema,
  duration Config, existing error-operation extension, and live/memory client
  operation with a separate two-second timeout and no retry.
- Prove the HTTP boundary independently before changing Eve events.
- Record compatibility and leak-safe evidence.
- Full verification discovered three other tests that decode the canonical
  `SendblueConfig`; their synthetic fixtures add only the required `120000`
  duration. No second Schema default or runtime scope was introduced.

### 3. Durable Eve lifecycle and observations

Status: Completed

- Split core conversation state from auxiliary channel typing state so corrupt
  typing data cannot block final-message delivery.
- Add `Idle | Pending | Active(turnId)` with an encoded-side Effect decoding
  default for existing continuations and keep the raw Eve adapter explicitly
  typed as the Schema encoded form.
- Treat `Active` as a conservative cleanup obligation: failed start/stop
  outcomes remain eligible for later terminal cleanup, and only a successful
  stop records `Idle`.
- Project events through one public typed event-map seam and one exhaustive
  `StartInbound | StartTurn | ResumeTurn | StopTurn` domain transition Effect.
- Stop for authorization wait, force a same-turn resume only after an
  `authorized` completion, and treat `session.failed` cleanup as best effort
  without a durable-state assertion.
- Prove replay behavior, stale-event protection, stop-before-send ordering, and
  fail-open delivery.
- Recover malformed auxiliary typing state to encoded `Idle` without provider
  work or final-delivery coupling; prove new-to-old rollback decoding.
- Emit exactly one Schema-valid sanitized Effect log observation for each
  provider attempt and none for replay no-ops.

### 4. Preview workflow version boundary

Status: Completed

- The first immutable Preview attempt resumed a workflow pinned to its
  pre-feature deployment. The turn and final outbound completed, but its
  four-field adapter snapshot and one Sendblue external-API call prove the
  fixture exercised old code rather than the candidate deployment.
- Pinned Eve `0.20.0` source routes nested turns to `deploymentId: "latest"`
  only in Production. Current Vercel Workflow documentation independently says
  existing runs continue on their original deployment.
- Prove the literal four-field legacy state through `makeSendblueEveEvents`.
  For the next immutable Preview, derive a fresh continuation namespace with an
  ephemeral Preview-only routing key, restore the exact prior project value
  immediately after deployment, and retain all provider topology.
- Run no second fixture on the rejected deployment. A new clean source commit,
  full verification, and new immutable deployment are required before another
  acceptance attempt.

### 5. Immutable Preview proof

Status: Completed

- Deploy from the root with the canonical `vercel deploy` command, never
  `eve deploy` or `--prebuilt`.
- Use fresh protected access and one ephemeral stdin fixture; retain no text or
  replay handle.
- Accept exact event/observation/provider counts without registering Preview
  ingress.

### 6. Bounded Production proof

Status: Completed

- The first Production deployment failed during `eve build` before traffic
  replacement because the existing Codex proxy path decoded a redacted token
  with a cross-package Effect Schema and read it through the app bundle's
  separate `Redacted` registry. The retained prior Production deployment
  remains live and no handset fixture has been sent.
- The inserted `stabilize-production-codex-proxy-build` remediation is
  complete. The redacted non-empty token contract is app-owned, both Gateway
  and Codex proxy builds pass, and clean revision `057e77b` produced READY
  Production deployment `dpl_JpF6mZqGXK1q4Dyd3L9Pf5xdccKi` under the existing
  provider/config topology.
- The first confirmed handset turn is rejected only as visible-bubble evidence.
  It produced one received iMessage, one webhook acceptance, successful typed
  start and stop attempts in 65 ms and 75 ms, one delivered outbound, and a
  visible final reply at about 21.9 seconds with zero runtime/provider errors.
  The UI observer sampled around +1 second and again at final reply, leaving the
  transient bubble interval unobserved. Runtime success is not being used as a
  substitute for direct handset visibility.
- `establish-production-handset-observation-window` records the no-rollback
  decision and requires a fresh user-confirmed message with continuous UI
  observation from Return through final reply. The READY deployment, sole
  Production webhook, and retained rollback candidate remain unchanged.
- The continuously observed retry is a failed Product acceptance case. From
  about +1.1 seconds through the final reply at about +19.7 seconds, 31 fresh
  Messages samples and direct user observation showed no typing bubble even
  though Sendblue recorded one RECEIVED inbound and one DELIVERED outbound and
  Production recorded successful 65 ms start and 72 ms stop attempts with zero
  provider/runtime errors.
- `diagnose-production-sendblue-typing-visibility` now owns rollback and
  provider-boundary diagnosis. Restore retained deployment
  `dpl_AzkNzhmEYL78PGcFUont8gVSjN4Y` at the stable Production alias before any
  fix-forward work; keep the sole Production webhook and all account, routing,
  identity, replay, model, secret, and Preview topology unchanged.
- The initial diagnosis is complete. Production was restored to the retained READY
  deployment and its health probe returns 200 ready; Sendblue still has one
  unique signed receive webhook at the stable alias and no Preview or immutable
  target. A direct legacy start, omitting both `state` and `max_duration_ms`,
  also returned `SENT` but showed no handset bubble across 16 continuous samples
  through about +12.1 seconds; its explicit cleanup stop returned `SENT`.
  Sendblue independently evaluates the recipient and recent one-to-one message
  as iMessage with no downgrade. Its current documentation defines `SENT` as
  best-effort acceptance that may not deliver a bubble. At that point no
  evidence-backed correction was available, so Production proof paused without
  claiming handset support.
- After the user explicitly approved that scope change, a reversible direct-API
  auto-typing experiment also failed. Sendblue accepted the setting, then
  recorded one healthy `RECEIVED` iMessage and one `DELIVERED` reply on the same
  contact and line with no error or downgrade, but the complete 36-frame handset
  window from about +1.2 seconds through +28.7 seconds showed no bubble. The
  account setting was immediately restored to `false`; generated screenshots
  and the temporary contact sheet were moved to Trash. This rules out the
  provider-native auto path as a rollout substitute.
- A later user-run long-response test visibly proved that the manual indicator
  works. Sendblue recorded one RECEIVED iMessage at
  `2026-07-19T21:26:06.168Z` and one DELIVERED reply at
  `2026-07-19T21:26:50.126Z`; runtime recorded StartTurn at
  `2026-07-19T21:26:16.559Z` and StopTurn at
  `2026-07-19T21:26:48.082Z`. This supersedes the provider-failure hypothesis:
  the visible bubble needed a longer window, and the current start waits about
  10.4 seconds after provider receipt for Workflow turn startup.
- `start-typing-at-accepted-inbound` is in progress. It moves the first request
  to the authenticated, allowlisted, routed, replay-claimed boundary and uses
  `Idle -> Pending -> Active(turnId) -> Idle` so `turn.started` adopts the
  provider obligation without a duplicate request. Eve 0.20.0 emits
  `turn.started` before model resolution and streaming, so the old behavior was
  not first-token-triggered; it was Workflow-startup-triggered.
- The first hosted draft on READY deployment
  `dpl_HxM6y9A53XZEHj7C4Wy5NPrTPDJ3` proved `StartInbound` about 0.85 seconds
  after direct authenticated ingress, but also exposed one duplicate
  `StartTurn` provider request about 6.2 seconds later because the existing Eve
  continuation retained its prior `Idle` state. That deployment is rejected.
- The corrected transition makes `turn.started` provider-silent for
  `Pending`, retained `Idle`, and older `Active` states. Clean commit `5baa362`
  produced READY deployment `dpl_F4YP4B1keHZU6raPgBmtwbqSyqKb`, which is now
  the stable Production target. A direct authenticated fixture returned 202 at
  `2026-07-19T21:53:54.944Z`; `StartInbound` started in 60 ms at
  `21:53:55.746Z`, no `StartTurn` provider observation appeared, and
  `StopTurn` stopped in 78 ms at `21:54:25.548Z`. Sendblue readback shows one
  final `DELIVERED` iMessage with no downgrade or error.
- The user directly confirmed that the earlier typing bubble was visible on the
  handset. This closes the distinct rendering gate; visibility is not inferred
  from provider `SENT`.
- Provider inventory retained one signed receive webhook at the stable
  Production route, zero Preview or immutable targets, and account-level auto
  typing remained false. The retained prior READY deployment remains the
  rollback target.

### 7. Documentation and closure

Status: Completed

- Update `ARCHITECTURE.md`, root/app READMEs, docs index, Eve architecture, and
  historical Sendblue SPEC only after Production acceptance.
- Reconcile the root/app/docs indexes, architecture and historical SPEC docs,
  ledger, and active plan; the Turbo binding belongs to provider slice 2.
- Explicitly retain N/A decisions for package/proxy READMEs, rule docs,
  lint/static configs, skills, production preflight, Vercel variable mutation,
  manifests/lock/changesets, generated output, React, database, webhook, and
  provider-account surfaces.
- Final Effect review found no production `any`, unsafe cast, DTO mirror,
  manual JSON, direct `process.env`, raw `fetch`, `instanceof`, timer, Ref,
  module Map, provider SDK leakage, broad suppression, pass-through service, or
  unowned helper. The app-owned Schema/Context/Layer/Config/Match boundaries
  remain the only implementation owners.

## Production Call Graph Target

```text
accepted Sendblue inbound
  -> SendblueChannel.transitionTyping(StartInbound)
  -> SendblueClient.setTypingIndicator(Start, bounded duration)
  -> channel.state.typing = Pending
  -> Eve send(...)
  -> Eve turn.started
  -> SendblueChannel.transitionTyping(StartTurn)
  -> provider-silent adoption as Active(turnId)
  -> Eve model/tool work
  -> terminal message.completed
  -> SendblueChannel.transitionTyping(StopTurn)
  -> SendblueClient.setTypingIndicator(Stop)
  -> existing replay-protected Sendblue final message delivery
```

Terminal fallback events call `transitionTyping(StopTurn)` but never block Eve.
Same-turn start replay, idle stop replay, and stale prior-turn terminal events
perform no provider call. Authorization completion with `authorized` calls
`ResumeTurn` and reissues start even for the same conservatively active turn.
Any typing attempt is capped at two seconds, so final delivery proceeds after
that bound. `session.failed` attempts provider cleanup but cannot promise a
durable `Idle` write.

## Verification Target

- Focused Schema, Config, client, lifecycle, ordering, replay, authorization
  resume, corrupt-auxiliary-state recovery, runtime observation, failure,
  bidirectional migration, and exact TestClock timeout tests.
- Agent and Eve Effect typechecks/tests/builds.
- Root check, Knip, verification, build, JSON parse, stale scans, leak scans,
  language-service diagnostics, and diff checks.
- Agent/root commands use the repository-documented gitignored Executor config
  or a sanitized CI-safe synthetic fixture; missing binding is reported as an
  environment precondition and no protected value is printed or committed.
- Immutable Preview direct proof with zero registered Preview webhook.
- Clean Production rollout plus one bounded handset observation and zero
  Preview/duplicate side effects.
- Current architecture/README/index reconciliation with stale-graph, link,
  status, and `passEvidence` scans.

## Rollback Target

If Preview typing proof fails, do not deploy Production. If Production typing
fails but final replies remain healthy, restore the retained prior immutable
agent deployment; do not change the webhook topology, replay store, identity
map, model provider, or Sendblue account setting. A failed stop is bounded by
`max_duration_ms`. If final reply behavior regresses, restore immediately and
verify one normal Production message without typing before further work.

## Audit Log

- 2026-07-19: `stabilize-agent-ci-fixture` completed three parent passes.
  Ownership confirmed the job-level public endpoint is the only required
  prerequisite and reaches the existing Build and Verify steps. Quality and
  security review found exactly one non-secret binding with no API key,
  fallback, or hosted mutation. Verification with the API key explicitly
  absent passed the focused Executor Config suite, 7/7 root builds, formatting,
  Knip, 7/7 workspace typechecks, 11/11 test tasks, 13 agent test files and 60
  agent tests, plus `git diff --check`.
- 2026-07-19: `implement-typed-sendblue-indicator-client` completed three
  parent passes. Ownership remains in the app-owned Sendblue Schema, Config,
  named client, and live/memory Layer boundary. Effect review accepted the
  discriminated request union, explicit `Never` stop-duration prohibition,
  branded bounds, redacted Config default, Schema HTTP codecs, existing tagged
  errors, and separate two-second no-retry timeout; it rejected a generic raw
  client wrapper. Verification restored all prior `sendMessage` coverage and
  expanded three canonical test fixtures after the first root run exposed their
  missing required Config field. Focused tests passed 14/14; frozen install,
  formatting, Knip, 7/7 typechecks, 11/11 test tasks, 66/66 agent tests, 7/7
  builds, static scans, and diff checks passed with no Executor API key.
- 2026-07-19: `wire-durable-eve-typing-lifecycle` completed three parent
  passes. Ownership remains in the app-owned Sendblue Schemas, channel policy,
  encoded Eve adapter, and tests; all 15 installed Eve event keys are projected
  without changing live Layer composition, shared packages, dependencies, or
  provider topology. Effect review accepted the missing-key-only migration,
  separate core/full state decoding, exhaustive command/lifecycle matching,
  conservative cleanup obligation, encoded in-place state mutation, and
  Schema-valid Clock/logger observations. Parent review rejected a mutable DTO
  mirror, unknown command input, raw lifecycle branching, synchronous
  production decoding, one unreachable nested test, and incomplete corrupt
  adapter proof; all findings were corrected. Focused lifecycle/build-route
  tests passed 27/27, all 75 agent tests passed, fresh Eve discovery passed,
  and formatting, Knip, 7/7 typechecks, 11/11 root test tasks, 7/7 builds,
  static/leak/JSON/diff checks passed with the Executor API key absent.
- 2026-07-19: the first `prove-sendblue-typing-preview` attempt was rejected.
  Deployment `dpl_58yvrpZMntTL6124tfduq3rqfoYo` completed one accepted Eve
  workflow and delivered exactly one final outbound with no duplicate, but its
  decrypted adapter snapshots retained the pre-feature four-field state and
  Preview external-API telemetry recorded one Sendblue call rather than the
  required start, stop, and message calls. Production remained untouched, no
  Preview webhook was registered, and remediation task
  `establish-preview-workflow-version-boundary` was inserted before a new
  immutable Preview attempt. Pinned Eve source then confirmed that Preview
  nested turns remain on the originating deployment while Production opts into
  latest-deployment routing; the failed attempt is therefore invalid proof
  against old code, not a typing transition failure.
- 2026-07-19: `establish-preview-workflow-version-boundary` completed three
  parent passes. Pinned Eve source and current Vercel Workflow documentation
  independently confirmed Preview version pinning and the Production-only
  latest-deployment branch. A direct legacy encoded-state event test proved
  start, stop, final delivery, and Active-to-Idle persistence through the typed
  Eve seam without a runtime workaround. Focused tests passed 27/27, all 76
  agent tests passed, and formatting, Knip, 7/7 typechecks, 11/11 test tasks,
  7/7 builds, JSON, and diff checks passed. The next Preview deployment will
  snapshot a fresh ephemeral Preview routing key, after which the exact prior
  project value is restored before the single fixture.
- 2026-07-19: `prove-sendblue-typing-preview` completed three parent passes.
  Clean pushed revision `cc2265f99a23ce8999aa5def7a4a4eb32239b07b`
  produced READY deployment `dpl_J5mAzdxh5gxfGV4xV9x1tgfobYk7` with a fresh
  Preview-only conversation namespace; all temporary shared Preview values were
  restored and Production/provider topology remained untouched. One protected
  health request returned 200 and the sole accepted-route fixture returned 202.
  Candidate Workflow run `wrun_01KXX9DNGCX7QCQRHFAYJ7RHB0` completed with the
  canonical five-field adapter state at every inspected boundary and exactly
  one successful `StartTurn` plus one successful `StopTurn` observation.
  Sendblue readback found one DELIVERED outbound, zero inbound, zero duplicate,
  and zero error; candidate logs had zero warning/error/fatal records and the
  Production proof window had zero webhook/error records. No protected or
  generated artifact remained in the tracked worktree.
- 2026-07-19: `stabilize-production-codex-proxy-build` completed three parent
  passes after a pre-traffic Eve build exposed a cross-bundle Effect Redacted
  registry boundary. The app now owns the redacted proxy-token Schema; both
  model modes, focused tests, all root gates, and a clean READY Production
  deployment passed without provider, credential, or Sendblue topology change.
- 2026-07-19: `establish-production-handset-observation-window` and
  `diagnose-production-sendblue-typing-visibility` completed three passes each.
  Two short observations and one reversible account-auto-typing experiment did
  not show a bubble even though runtime/provider/final delivery were healthy;
  all were correctly rejected as handset proof. A later long user-run turn
  visibly showed the bubble, proving that delayed Workflow startup and short
  observation duration—not first-token timing or provider incompatibility—were
  the relevant boundary. Account auto typing was restored to false and the
  ignored support packet was superseded.
- 2026-07-19: `start-typing-at-accepted-inbound` completed three parent passes.
  The first hosted draft exposed one duplicate provider start when an existing
  Eve continuation retained `Idle`; that deployment was rejected. The corrected
  exhaustive transition makes accepted inbound the sole initial start owner and
  makes `turn.started` provider-silent for `Pending`, retained `Idle`, and older
  `Active`. Root verification passed with 78 agent tests. Clean revision
  `5baa362` produced READY deployment `dpl_F4YP4B1keHZU6raPgBmtwbqSyqKb`;
  one authenticated `202` produced `StartInbound` in 60 ms about 0.8 seconds
  after ingress, no `StartTurn` provider attempt, `StopTurn` in 78 ms, and one
  final `DELIVERED` iMessage without error or downgrade.
- 2026-07-20: `prove-sendblue-typing-production` completed three parent passes.
  The user directly confirmed that the earlier handset bubble was visible,
  closing the evidence gate independently of Sendblue `SENT`. Provider
  inventory retained exactly one signed stable Production receive webhook,
  zero Preview targets, and account-level auto typing disabled. The retained
  prior READY deployment remains the rollback candidate.
- 2026-07-20: `reconcile-sendblue-typing-documentation` completed its ownership
  Effect-quality, and verification passes. Current architecture, root/app
  READMEs, docs index, historical channel SPEC, this SPEC, ledger, and plan agree on
  accepted-inbound start, encoded `Idle | Pending | Active` state,
  provider-silent turn adoption, authorization resume, sanitized observations,
  two-second fail-open operations, stop-before-send ordering, and distinct
  provider/runtime/handset evidence. Focused typecheck, 43 Sendblue tests, and
  an Eve build passed; final check and Knip passed, verification passed 7/7
  typechecks plus 11/11 test tasks including 78 agent tests, and build passed
  7/7 workspaces. JSON/status/stale/static/leak/code-fence/diff checks passed.
