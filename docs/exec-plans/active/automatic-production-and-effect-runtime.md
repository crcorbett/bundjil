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

The Production inventory, SPEC review, exact-SHA workflow and Effect deployment
boundary are complete and locally verified. Hosted GitHub/Vercel configuration
is next. No external mutation has occurred under this plan yet.

## Grounding receipt

| Surface         | Observation                                                                                                                                                                              | Claim limit                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| GitHub identity | `crcorbett`, admin of `crcorbett/bundjil`; workflow token scopes were read without retaining its value                                                                                   | Capability and metadata only.                                                 |
| Main controls   | no branch protection/ruleset read back; `Production` has no reviewers; drift environment has zero secrets                                                                                | Point-in-time state, not accepted desired state.                              |
| Vercel identity | `crcorbett`; Personal team `team_1LX7ZujbijowTv8J9k0aU7nD`; Tilt team exists and is rejected for this work                                                                               | Identity gate only.                                                           |
| Agent target    | Personal project `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`; Production `dpl_C7xHMKGmR5KwAC7oq1xEvEKMRAaA`, READY, source `6cc0936d502a7b5f0fa32994929fac7f396eb200`                             | Metadata only.                                                                |
| Proxy target    | Personal project `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`; Production `dpl_AunVp2kRvSnuB1FsGoKUGYQMcQm4`, READY, same source                                                                   | Metadata only.                                                                |
| Agent rollback  | `dpl_ewqr5pW1RBZZz54j6auxKuYecu93`, READY, Production-targeted, project `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`, source `7ec2fd198d76e9809a2441fecd0faf3dba9197b1`                            | Fresh fallback identity only; it is not selected unless rollback is required. |
| Proxy rollback  | `dpl_5UDNJzC3RJ3A3PCSYCeiUpJuxidC`, READY, Production-targeted, project `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`, source `924d9fb3d82f222c1a721606a499d94b99833f13`                            | Fresh fallback identity only; it is not selected unless rollback is required. |
| Vercel Git      | both provider projects have no current Git repository connection; app configs disable Git deployment                                                                                     | Does not prove future absence.                                                |
| Proxy health    | stable `200`, live, reasoning `low`                                                                                                                                                      | Directly proves the mismatch only.                                            |
| Effect runtime  | manifest range `^4.0.0-beta.100`; lock/install resolve `effect@4.0.0-beta.101`, `@effect/vitest@beta.101`, platform packages beta.100, language service `0.86.6`; Eve `0.29.5`           | Installed APIs and lock are implementation authority.                         |
| Site comparison | `/Users/cooper/Projects/site` local main `4f98b6c` is 117 commits behind `origin/main` `dd5d015879a82630127adfe044e4352deff72332`; current comparison uses files read from `origin/main` | Read-only rule-shape comparison only.                                         |

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

## Commit and integration ledger

No commit, push, pull request, merge, hosted run, provider mutation, secret
mutation, OAuth grant, message, or deployment has occurred under this plan yet.

## PRD review receipt

Accepted on 2026-08-10 before implementation. The review traced every
Production task to a direct observable, expected postcondition, rejected false
green, evidence owner, rollback and limitation. It compared direct Vercel Git,
post-CI GitHub deployment and merge-queue gating; only the separate post-CI
exact-main writer prevents pre-verification alias movement without adding a
queue dependency. Negative workflow eligibility, two-candidate readiness,
stale-main no-op, partial-promotion rollback, secret-negative output and stable
alias readback are mandatory tests. Documentation policy and skill policy pass.
No blocking or unclear requirement remains.

## Terminal audit

Pending. It runs once after both task ledgers are otherwise complete and covers:

1. Effect contracts, Schemas, branded boundaries, errors, Config and Layers;
2. call graph, topology, exports, helper sprawl and dead paths;
3. behaviour, replay/idempotency, workflows, tests, lint, typecheck and failure paths;
4. docs, SPEC, task, runbook, authority, control and proof consistency; and
5. provider/deployment/secret safety, rollback, observability, live evidence
   and explicit non-claims.
