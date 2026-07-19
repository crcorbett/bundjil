# Sendblue Typing Indicators Implementation Plan

Status: In Progress

Spec: `docs/product-specs/sendblue-typing-indicators.md`
Task ledger: `docs/product-specs/sendblue-typing-indicators.tasks.json`

## Execution Rule

Implement the ledger sequentially. After each working end-to-end slice, review
the actual diff, run focused checks, perform the required ownership/call-graph,
Effect-quality/helper-admission, and verification/evidence audits, record at
least three accepted passes in `passEvidence`, and commit only after the slice
passes.

Credentials stay in 1Password, Vercel encrypted bindings, and the existing
Sendblue Config boundary. Plans, tests, output, commits, logs, and proof retain
no message content, full phone number, credential, protected URL, provider
handle, raw provider body, or raw exception.

## Baseline

- Started 2026-07-18 in the Bundjil worktree.
- The tracked worktree was clean before spec authoring.
- `apps/agent` owns the current Production-verified Sendblue custom channel,
  typed client, identity/routing policy, replay store, and live/memory Layers.
- The shared account has exactly one active receive webhook at the stable
  Production route; Preview has no active shared-line ingress or dedicated
  Sendblue bypass.
- Current behavior sends only terminal visible `message.completed` text and
  has no outbound typing operation.
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
- Add `Idle | Active(turnId)` with an encoded-side Effect decoding default for
  existing continuations and keep the raw Eve adapter explicitly typed as the
  Schema encoded form.
- Treat `Active` as a conservative cleanup obligation: failed start/stop
  outcomes remain eligible for later terminal cleanup, and only a successful
  stop records `Idle`.
- Project events through one public typed event-map seam and one exhaustive
  `StartTurn | ResumeTurn | StopTurn` domain transition Effect.
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

Status: In Progress

- Promote only from accepted clean Preview source.
- Retain the sole Production webhook and all existing routing/config policy.
- Reconcile one handset observation against sanitized provider/runtime counts;
  stop and record rollback if the window fails.

### 7. Documentation and closure

Status: Planned

- Update `ARCHITECTURE.md`, root/app READMEs, docs index, Eve architecture, and
  historical Sendblue SPEC only after Production acceptance.
- Reconcile the root/app/docs indexes, architecture and historical SPEC docs,
  ledger, and active plan; the Turbo binding belongs to provider slice 2.
- Explicitly retain N/A decisions for package/proxy READMEs, rule docs,
  lint/static configs, skills, production preflight, Vercel variable mutation,
  manifests/lock/changesets, generated output, React, database, webhook, and
  provider-account surfaces.

## Production Call Graph Target

```text
accepted Sendblue inbound
  -> Eve turn.started
  -> SendblueChannel.transitionTyping(StartTurn)
  -> SendblueClient.setTypingIndicator(Start, bounded duration)
  -> Sendblue provider expiring typing state
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
