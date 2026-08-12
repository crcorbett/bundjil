---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-implementation-owner
last_reviewed: 2026-08-10
review_trigger: task status, scope, source SHA, workflow, provider, secret, deployment, channel, Effect inventory, lint, proof, rollback, or verification change
spec: ../../product-specs/automatic-production-and-operational-closeout.md
---

# Automatic Production and Effect-native runtime execution plan

## Objective and trajectory

Implement verified automatic Production deployment from main, close Bundjil's
remaining Production control and channel-proof gaps, then refresh and implement
the Effect-native runtime patterns and lint-enforcement SPEC through audited
completion.

One primary trajectory owns both serial ledgers. The operational ledger closes
first. The Effect/lint ledger follows. One terminal five-pass audit runs only
after every implementation and live-proof task is terminal. A later correction
invalidates affected evidence and the audit status.

## Starting identity

- Worktree:
  `/Users/cooper/.codex/worktrees/d4b4e069-1303-427d-957e-756d18e049a9/bundjil`
- Branch: `codex/automatic-production-effect-runtime`
- Starting HEAD and `origin/main`:
  `5c3c7db240a7abd9bb57ad560bdd8958af4ea701`
- Previous retained closeout branch:
  `codex/runtime-boundary-streaming-proof` at
  `cedcca273bbdc9409b6a6cbbe43ee994624e3471`; preserved, not reset or
  overwritten.
- Starting main CI: run `31341341435`, successful for the exact starting SHA.

## Current phase

The Production workflow and Effect/lint implementation are complete and
verified at branch SHA `928623a8f95131528d3eb850ec22c85826533f4a`. Hosted
main/environment controls and the three Terra High metadata changes are read
back. Credential custody, hosted drift, merge, automatic Production, Terra High
runtime proof and Sendblue remain pending. One pre-deployment Photon probe is
retained only as a bounded channel observation, not candidate-specific
Production proof.

## Grounding receipt

| Surface         | Observation                                                                                                                                                                                                   | Claim limit                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| GitHub identity | `crcorbett`, admin of `crcorbett/bundjil`; workflow token scopes were read without retaining its value                                                                                                        | Capability and metadata only.                                                 |
| Main controls   | active ruleset `20616946` requires pull request, strict `verify` and non-fast-forward with no bypass; `Production` is protected-branch-only with no reviewer/wait; both hosted environments have zero secrets | Current settings readback; no hosted deployment or drift claim.               |
| Vercel identity | `crcorbett`; Personal team `team_1LX7ZujbijowTv8J9k0aU7nD`; Tilt team exists and is rejected for this work                                                                                                    | Identity gate only.                                                           |
| Agent target    | Personal project `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`; Production `dpl_C7xHMKGmR5KwAC7oq1xEvEKMRAaA`, READY, source `6cc0936d502a7b5f0fa32994929fac7f396eb200`                                                  | Metadata only.                                                                |
| Proxy target    | Personal project `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`; Production `dpl_AunVp2kRvSnuB1FsGoKUGYQMcQm4`, READY, same source                                                                                        | Metadata only.                                                                |
| Agent rollback  | `dpl_ewqr5pW1RBZZz54j6auxKuYecu93`, READY, Production-targeted, project `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`, source `7ec2fd198d76e9809a2441fecd0faf3dba9197b1`                                                 | Fresh fallback identity only; it is not selected unless rollback is required. |
| Proxy rollback  | `dpl_5UDNJzC3RJ3A3PCSYCeiUpJuxidC`, READY, Production-targeted, project `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`, source `924d9fb3d82f222c1a721606a499d94b99833f13`                                                 | Fresh fallback identity only; it is not selected unless rollback is required. |
| Vercel Git      | both provider projects have no current Git repository connection; app configs disable Git deployment                                                                                                          | Does not prove future absence.                                                |
| Proxy health    | stable `200`, live, reasoning `low`                                                                                                                                                                           | Directly proves the mismatch only.                                            |
| Effect runtime  | manifest range `^4.0.0-beta.100`; lock/install resolve `effect@4.0.0-beta.101`, `@effect/vitest@beta.101`, platform packages beta.100, language service `0.86.6`; Eve `0.29.5`                                | Installed APIs and lock are implementation authority.                         |
| Site comparison | `/Users/cooper/Projects/site` local main `4f98b6c` is 117 commits behind `origin/main` `dd5d015879a82630127adfe044e4352deff72332`; current comparison uses files read from `origin/main`                      | Read-only rule-shape comparison only.                                         |

## Documentation impact ledger

The two SPEC ledgers own detailed rows. Before and after each material slice,
reconcile docs, READMEs, exports, workflows, authority, controls, runbooks,
proof, fixtures, SPEC/tasks, this plan and lifecycle as `Change required`,
`Preserve`, or evidenced `N/A`. `bun run check:docs` and
`bun run check:skills` are slice acceptance gates.

## Evidence log

### 2026-08-10 grounding

- Created the goal with the exact delegated objective and confirmed it active.
- Fetched `origin` and created this branch non-destructively from exact
  `origin/main`.
- Read AGENTS, the required repository-local PRD/docs/provider/package skills,
  global repo-structure skill, the embedded harness invariant/ownership/proof/
  authority contracts, routed architecture, current SPEC/tasks, runbooks,
  workflows, registers, affected READMEs, installed versions, Site comparison,
  GitHub metadata, Vercel metadata and stable proxy health.
- Confirmed the proposed Effect SPEC's beta.74 and pre-integration branch epoch
  is stale. Refresh is required before implementation.
- Confirmed the accepted automatic approach is a separate post-CI workflow,
  not direct Vercel Git deployment and not a secret-bearing CI verify job.
- Re-read the two newest READY Production deployments for each Personal
  project. The current and fallback deployment IDs, project IDs, targets and
  source identities are now frozen without reading any secret value.

### 2026-08-10 Effect inventory refresh

- Current implementation source is merged main `5c3c7db`; the retired Eve
  integration branch is not an owner.
- Installed runtime authority is Effect and `@effect/vitest` beta.101, Oxlint
  `1.61.0`, Effect language service `0.86.6` and Eve `0.29.5`; Site comparison
  is read-only `origin/main@dd5d015`.
- Accepted rule set remains exactly four. Ambient time has two runtime owners:
  Photon candidate inventory migrates to Effect Clock, while the drift CLI's
  elapsed wall-time receipt remains an exact process-boundary exception.
  Effect-clock-owned Codex/proxy tests migrate to fixed/TestClock epochs;
  subprocess live proof remains an exact host exception.
- All current `Effect.tryPromise` production calls use object form with an
  owning `catch`; fixtures retain positive and negative forms.
- Runtime execution is allowed in tests, scripts, app entrypoints and the exact
  Eve/channel/framework adapters. `workspace_status` and Executor remain exact
  framework callback owners with focused lifecycle tests; service code gets no
  general exception.
- The nested channel dispatch generator is the only accepted flat-flow source
  migration. Independent observation/counter Refs, current memory Layer state,
  native test maps/sets and decoded arrays are Preserve: no cohesive-state,
  collection, Atom, `SubscriptionRef`, `ScopedRef` or helper extraction has
  domain evidence.

### 2026-08-10 automatic Production control slice

- Added the separate successful-CI `workflow_run` writer with exact
  same-repository/main/push/SHA gates, read-only repository permission,
  credential-free checkout, protected `Production` environment, global
  non-cancelling concurrency and a 30-minute bound.
- Added the infrastructure-owned Config, Schema, service, live/memory Layers,
  safe errors and orchestration. Both candidates stage with domains skipped;
  project/source/target/readiness are decoded before a fresh main read; proxy
  and agent promote in order; stable targets and proxy health are re-read; an
  uncertain or partial failure restores the exact captured agent then proxy
  identities as applicable.
- Added ten orchestration tests and seven independent authority false-green
  fixtures. They cover happy, already-current, stale, build/inspection,
  partial-promotion, health and rollback-failure behavior without exposing
  provider output or credentials.
- Reconciled the automation/authority/control owners, deployment and proxy
  proof runbooks, infrastructure README, testing architecture, verification
  router, boundary exception inventory and exact HGI-307 docs inventory.
- Focused infrastructure verification passed 80 Vitest tests and 21 Alchemy
  tests. Authority, controls, docs, skills and verification audits passed. The
  complete repository gate passed with the same public synthetic Executor
  fixture used by CI: HGI-307 12 scenarios/9 impact areas, 115 tooling tests,
  lint fixture, Knip, nine typechecks and all fifteen Turbo test tasks.
- An initial full-gate run correctly found the TypeScript indexed-access and
  docs-inventory drift, then a Knip binary-custody exception; all were repaired.
  A subsequent local run without CI's synthetic Executor fixture stopped at
  agent build configuration and is not represented as a test failure or pass.

### 2026-08-10 live Vercel boundary correction

- A fresh read-only call to the exact Personal agent and proxy project endpoint
  confirmed that `targets.production` carries deployment/source/readiness data
  but omits `projectId`; the verified outer project owns that identity. The
  original mock repeated `projectId` and would have let the hosted command fail
  before staging despite repository tests passing.
- The live decoder now validates the outer project against the configured
  branded project ID, binds that ID to the nested target and preserves the
  stricter deployment-inspection requirement that the deployment response
  itself names the expected project. One focused live-shape regression fixture
  covers the provider payload. No Vercel mutation, credential or alias action
  occurred.
- Documentation impact: task ledger and active evidence owner **Change
  required**; SPEC, runbook, authority/control registers, package README,
  architecture, public exports and rollback **Preserve** because the accepted
  behavior and operating procedure did not change.

### 2026-08-13 strict Effect process-boundary correction

- A fresh audit found that the Production live Layer still used `Bun.spawn`,
  raw Promise orchestration and ambient `process.env` copying even though its
  public service and provider codecs were otherwise closed. This finding was
  possible because the boundary audit enforced Config primitives and raw
  response readers, but not direct host-environment acquisition.
- The exact installed authority is `effect@4.0.0-beta.101` plus
  `@effect/platform-bun@4.0.0-beta.100` and
  `@effect/platform-node-shared@4.0.0-beta.101` from the frozen lockfile. The
  installed `ChildProcess`/`ChildProcessSpawner` sources were used for the API
  shape. The local Effect reference clone was also inspected at
  `1caab3cc30f626efbf15e59d74f539a487e5c85c`; its files differ from the
  installed package, so it is comparison evidence only and the installed
  beta.101 source controls.
- The Layer now captures the scoped Effect process service, extends the host
  environment only inside the platform implementation, exposes only the
  redacted token override at process creation, consumes stdout through
  `Stream`, ignores stderr without buffering it, and preserves the existing
  typed command/output failure boundary. `automatic-production.ts` is the
  application root and supplies `BunServices.layer`.
- A controlled `ChildProcessSpawner` Layer replaces the global Bun stub in the
  live-shape test. The boundary audit now rejects direct
  `Bun.spawn`/`Bun.spawnSync` process ownership plus `process.env`,
  `globalThis.process.env`, `Bun.env`, and `import.meta.env`; six negative
  fixtures prevent regression. The two obsolete raw-response exceptions were
  retired, reducing the exact retained registry from 19 to 17.
- Documentation impact: Effect architecture, boundary tooling/fixtures,
  HGI-306 decision/control owners, this task result and active plan **Change
  required**. Workflow behavior, runbooks, package exports/README, authority,
  Production proof, rollback and provider state **Preserve**. Frontend and
  generated API references are **N/A** because the call graph has neither.

### 2026-08-13 exit-aware rollback correction

- The next strict Effect pass found that the ordered promotion state machine
  compensated only through `Effect.catch`. That covered its typed
  `ProductionDeploymentError` channel but not fiber interruption or defects,
  so an after-write non-success exit could bypass the documented restoration.
- The installed `effect@4.0.0-beta.101` `Effect.onExit` implementation was
  inspected directly. Its finalizer observes every `Exit`, is uninterruptible
  by default, and preserves the source exit unless the finalizer fails. The
  promotion sequence now uses that primitive: successful exits do nothing;
  every non-success exit restores and reads back agent then proxy as applicable;
  successful restoration preserves the original exit; failed restoration
  surfaces the existing safe rollback error.
- The deterministic memory Layer now simulates an interruption and a defect
  immediately after the agent write. Both fixtures prove the two writes were
  observed, both rollback operations ran in reverse order, and both stable
  identities returned to their recorded source SHA. Infrastructure typecheck,
  83 Vitest tests and 21 Alchemy tests passed for the slice.
- Documentation impact: the SPEC outcome/call graph, task verification/result,
  Effect architecture, infrastructure README and this active evidence owner
  **Change required**. Workflow eligibility, Config, public services, package
  exports, provider commands, authority, secrets, runbooks, live proof and
  rollback procedure **Preserve**. Frontend and generated API references are
  **N/A** because this slice has neither.

### 2026-08-13 strict Effect pre-terminal audit

This is an iterative repository audit, not the mandatory terminal audit. The
terminal task remains pending until hosted control, automatic exact-main, and
channel-proof dependencies are complete.

1. **Architecture and boundaries:** the pass found and corrected twelve
   exported Eve, Codex, and proxy error Schemas whose `Schema.Defect` fields
   could encode arbitrary causes. It also replaced one validated-but-impossible
   adoption-manifest `Effect.die` with `AdoptionManifestBuildError`. The
   existing provenance audit now rejects required, optional, or renamed
   exported `Schema.Defect` fields through `public-raw-cause`; 124 boundary
   tests pass and the exception registry remains at 17 exact external or
   framework occurrences.
2. **Call graph and topology:** package export, cross-import, runtime-root,
   async/Promise, environment/process, generated-output, deep-import, dead
   export, and helper-directory scans found no additional actionable defect.
   Large Photon/Vercel provider files remain capability-cohesive owners rather
   than generic helpers. Channel `ManagedRuntime` instances remain exact Eve
   framework adapters with test disposal; no authored hosted teardown hook was
   found, so inventing a service wrapper or speculative lifecycle is rejected.
3. **Behavior and gates:** focused proof passed Eve 7, Codex 115,
   codex-proxy 41, infrastructure 83 Vitest plus 21 Alchemy, and boundary 124
   tests. The complete repository gate passed with the public synthetic
   Executor CI fixture: HGI-307 12 scenarios/9 impact areas, 10 lint tests,
   Knip, nine typechecks, and all fifteen Turbo test tasks. Deliberate memory
   Layer defects remain only as rollback and missing-fixture test instruments.
4. **Documentation and proof:** the Effect architecture, SPEC/task ledger and
   active plans now agree on closed error channels, exact Effect beta.101
   authority, focused evidence, preserved surfaces, and external non-claims.
   Docs, skills, authority, controls, verification policy, formatting, task
   JSON parse, and `git diff --check` pass.
5. **Provider, deployment, and secret safety:** no provider, deployment,
   credential, webhook, alias, environment, or production mutation occurred.
   The branch diff contains no credential material. Draft PR `#5` remains
   blocked from acceptance: CI `verify` passed at prior head `33b4c4d`, while
   Infrastructure Drift `preview-report` failed closed before source execution
   because required hosted custody is absent. Repository proof does not
   establish Production, automatic-main, Photon replay, typing, or handset
   behavior.

Documentation impact: this parent plan, the Effect SPEC/task/plan, Effect
architecture, public error contracts/constructors, adoption cardinality branch,
encoded error fixtures, and boundary tooling **Change required**. App/package
READMEs, exports, services, Layers, provider requests, persistent keys/bytes,
operations, runbooks, authority/control envelopes, live proof and provider
state **Preserve**. Frontend, browser, accessibility, generated API references,
release and publication are **N/A**.

The next non-terminal pass closed the same invariant for operator commands.
The hosted staged-refresh proof no longer retains an arbitrary HTTP rejection
inside its tagged error, and the existing provenance audit now rejects unknown
fields on script-local `Data.TaggedError` classes through
`operator-raw-cause`. Bounded classifications and immediate private adapter
translation remain admitted. Boundary proof passes 126 tests with no new
exception, and the complete repository verification gate passes with the
public synthetic Executor CI configuration. This is repository proof only and
does not satisfy the missing hosted staged-refresh, automatic-main, channel, or
handset dependencies.

The following public-contract pass migrated the sole exported production
`Data.TaggedError`, `PreviewStateMigrationError`, to
`Schema.TaggedErrorClass`, branded its optional non-negative counts, and added
an Effectful encoded-contract fixture. The existing boundary audit now rejects
future exported `Data.TaggedError` declarations through
`public-data-tagged-error`; boundary proof passes 127 tests with no exception.
Infrastructure typecheck, 84 Vitest tests and 21 Alchemy tests pass. No state
migration or provider command ran. The complete repository verification gate
also passes from a cold Turbo cache with the public synthetic Executor CI
configuration; this repository correction does not satisfy any hosted or
channel dependency.

The next provenance pass closed a shared-field bypass in
`inline-string-schema`: five public infrastructure/Photon error families now
use owner-named bounded diagnostic Schemas, and local or imported aliased field
objects are inspected. Boundary proof passes 129 tests; infrastructure 84
Vitest plus 21 Alchemy and Photon 41 tests pass. Diagnostic messages remain
ordinary bounded strings rather than nominal identities, and provider
wire/opaque state fields remain adapter-owned. The complete repository
verification gate also passes from a cold Turbo cache with the public synthetic
Executor CI configuration. No provider operation ran and no hosted dependency
is satisfied by this source correction.

The next concurrency pass removed the sole production `Promise.all` from the
private Sendblue Web Crypto verifier. Provider Promise ingress is translated
individually to the existing closed authentication error, independent key
imports use explicit `Effect.all` concurrency, and signing/verification remain
linear. Boundary proof now rejects `Promise.all` and `Promise.race` and passes
131 tests with no exception; Sendblue passes 10 tests including rejected Web
Crypto ingress. This source correction changes no Channel
contract, webhook, provider state, hosted evidence, or deployment dependency.

The following redaction pass removed 29 internal plaintext round-trips across
Codex proxy config, OAuth/session/profile composition, refresh-lock storage,
cipher-key conversion, proof config, and the infrastructure migration leak
scanner. Decoded values stay `Redacted` through internal composition; explicit
Schema encoding owns the two representation-changing crypto/persistence
boundaries. Boundary proof rejects reveals nested in Effectful Schema decoding
while accepting immediate outbound-boundary reveals, for 133 tests with no
exception. Public encoded config decoding, ciphertext, hosted secrets,
provider behavior, and deployment dependencies are unchanged.
The final synthetic-Executor repository gate passes 133 boundary tests, 10 lint
fixtures, all 9 package typechecks, and all 15 package test/build tasks. This is
repository proof only; it does not establish hosted secret or provider state.

The subsequent Random pass replaces ambient UUID generation for Codex
credential revisions and refresh-lock owners with fiber-local Effect Random.
Seeded proof is deterministic, sequential identities remain distinct, all 116
Codex tests pass, and 135 boundary tests reject global UUID/`Math.random`
regression without an exception. Web Crypto remains unchanged for PKCE and
AES-GCM cryptographic entropy; stored formats and hosted state are not proved
by this repository slice.

### 2026-08-13 GitHub action runtime correction

- Hosted CI for exact candidate
  `d84e2c2b4f40fa32614066cea2121e536b343d47` passed repository verification
  but emitted a deprecation annotation because the pinned checkout and
  setup-node v4 actions still target Node 20.
- Public upstream tag readback resolves `actions/checkout@v7.0.1` to
  `3d3c42e5aac5ba805825da76410c181273ba90b1` and
  `actions/setup-node@v7.0.0` to
  `820762786026740c76f36085b0efc47a31fe5020`; each reviewed `action.yml`
  declares `node24`.
- The corrective candidate changes only those exact pins in their admitted
  workflow locations plus the action lock, authority policy and fixtures.
  Workflow triggers, permissions, credentials, environments, targets,
  operations, concurrency and timeouts are preserved.
- Local authority, controls, docs, skills, formatting and full repository
  verification passed. Hosted CI run `31617632184` then passed at exact source
  `5a28c3bddfc6f1bdf21c82fca3aa90e1ec5458dc`; check `94184307855`
  returned zero annotations, closing the Node-20 action-runtime finding.
- Infrastructure Drift run `31617632131` used the replacement actions and then
  failed closed at `Prepare bounded read-only custody` because the three hosted
  artifacts remain absent. It performed no provider read or write and does not
  close the separately pending drift-custody task.
- Documentation impact: workflow pins, action lock, automation register,
  automatic Production SPEC/task and this plan **Change required**. Provider
  settings, credentials, deployments, aliases, runbooks, authority envelopes,
  controls and live evidence **Preserve**. Effect service boundaries, channel
  behavior, frontend, browser, accessibility, generated references, release
  and publication are **N/A**.

## Commit and integration ledger

- `b4c67b1` — automatic Production workflow, Effect deployment boundary and
  reconciled owners.
- `3a106e8` — four narrow Effect lint rules and fixtures.
- `573ac6f` — deterministic Effect Clock/TestClock migrations and flat channel
  dispatch flow.
- `928623a` — installed-plugin lint integration and exact exception inventory.
- `d4c1888` — decoded live Vercel Production target ownership.
- `b323acb` — Effect platform process ownership and environment confinement.
- `d907985` — exit-aware rollback for interruption and defects.
- `33b4c4d` — Effect Clock/DateTime drift receipts.
- `c1b27b6` — closed public error channels and typed adoption failure.
- The operator error-retention correction is carried by the commit containing
  this receipt; exact branch/remote identity is read back after push rather
  than self-embedded.
- Draft PR `#5` is the branch integration owner. Its current exact head and
  checks must be read back from GitHub; prior `verify` runs succeeded while
  `preview-report` failed closed because required hosted drift custody is
  absent. That failure is negative custody evidence, not a drift result.
- GitHub ruleset `20616946` is active with pull-request, strict `verify` and
  non-fast-forward requirements and no bypass. The `Production` environment is
  protected-branch-only with no reviewer or wait, and owns the four exact
  non-secret deployment variables. Both hosted environments still have zero
  secrets.
- Personal Vercel Production metadata now owns agent model
  `gpt-5.6-terra`, context `1050000` and proxy reasoning `high`. No deployment
  or promotion has occurred, so stable proxy health remains `low`.
- Photon OAuth was granted in a separate Safari session and the Personal, not
  Tilt, profile was read back. The `bundjil` project reported shared iMessage
  connected and one of three channel types connected. The established visible
  Bundjil conversation was selected without entering or retaining a phone
  number. The single bounded probe received a handset reply containing only
  its requested boundary markers; the requested long body and visible typing
  start/stop were not observed. This pre-deployment probe does not prove the
  eventual automatic Production candidate, Eve completion, proxy completion,
  dispatch internals, provider delivery status or strict replay.

## Credential-boundary review correction

The current Vercel provider documentation disproves the draft assumption that
an access token for a Personal account can be provider-enforced to one project.
The reviewed replacement keeps two separately revocable Personal-scope tokens,
one in each project-bound workflow step, and requires exact configured project
IDs plus decoded project/source/readiness readback before promotion. The lack
of provider-enforced Personal-project scope is an explicit residual limitation,
not a passed least-privilege claim. Credential creation remains action-time
confirmation gated; no token or hosted secret has been created.

## PRD review receipt

Accepted on 2026-08-10 before implementation and re-reviewed after the current
Vercel token surface disproved Personal-project token scoping. The review traced every
Production task to a direct observable, expected postcondition, rejected false
green, evidence owner, rollback and limitation. It compared direct Vercel Git,
post-CI GitHub deployment and merge-queue gating; only the separate post-CI
exact-main writer prevents pre-verification alias movement without adding a
queue dependency. Negative workflow eligibility, two-candidate readiness,
stale-main no-op, partial-promotion rollback, secret-negative output and stable
alias readback are mandatory tests. Two separately revocable Personal-scope
credentials plus exact project-bound readback are the least available control;
provider-enforced project scope is a documented limitation. Documentation
policy and skill policy pass. Credential creation and the missing drift custody
remain external execution gates rather than unclear requirements.

## Terminal audit

Pending. It runs once after both task ledgers are otherwise complete and covers:

1. Effect contracts, Schemas, branded boundaries, errors, Config and Layers;
2. call graph, topology, exports, helper sprawl and dead paths;
3. behaviour, replay/idempotency, workflows, tests, lint, typecheck and failure paths;
4. docs, SPEC, task, runbook, authority, control and proof consistency; and
5. provider/deployment/secret safety, rollback, observability, live evidence
   and explicit non-claims.
