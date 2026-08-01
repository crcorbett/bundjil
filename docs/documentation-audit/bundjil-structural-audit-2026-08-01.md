---
document_type: repository-structure-audit
lifecycle: evidence
authority: supporting
owner: bundjil-repository-owner
created: 2026-08-01
last_reviewed: 2026-08-01
review_trigger: finding decision, target revision change, or accepted correction
target_revision: 4fc8ba1750524581c281ad97351bf0b1e6e29631
---

# Bundjil structural audit — 2026-08-01

## Result

The target was structurally stronger than its documentation lifecycle
suggested, but the audited revision did **not yet meet** the requested outcome
of a smaller, cleaner, more legible repository with one tight semantic owner
per concept.

The source foundations are good: package direction is disciplined, export maps
and source conditions are consistent, Vercel and Photon clients remain private
to decoded Effect adapters, Alchemy is stage-guarded, and the merged
ChannelHandoff/Eve path is coherent. Those are explicit preserve findings.

The audit identified six findings:

- four proposed important corrections before the repository can honestly be
  described as having one coherent continuation and tight semantic ownership;
- two optional consolidation improvements that reduce carrying cost without
  changing provider behavior; and
- five foundations that later work must preserve.

Cooper's later 2026-08-01 implementation delegation accepted
`FINDING-001` through `FINDING-004` and the count-free routing correction in
`FINDING-006`. The `FINDING-005` investigation is complete with an
[evidence-backed defer decision](structural-audit-authority-artifact-decision-2026-08-01.json):
current capability-local security boundaries remain preserved until its exact
resume trigger is met. The machine-readable crosswalk remains the current
implementation-scope owner and deliberately excludes the deferred finding.

Structured artifacts:

- [audit scope](bundjil-structural-audit-2026-08-01.scope.json)
- [findings and preserve foundations](bundjil-structural-audit-2026-08-01.findings.json)
- [accepted-finding crosswalk](bundjil-structural-audit-2026-08-01.accepted-findings.json)

## Bound target and authority

| Field                                             | Bound value                                              |
| ------------------------------------------------- | -------------------------------------------------------- |
| Repository                                        | `crcorbett/bundjil`                                      |
| Final target                                      | `4fc8ba1750524581c281ad97351bf0b1e6e29631`               |
| Parent 1                                          | `f30172290a83bd7ce39dedf9ce57ef88883867d6`               |
| Parent 2                                          | `a270116f30aeb20d2087484c4f3fd4051f442897`               |
| Common ancestor used for the infrastructure delta | `ff73113524fa63ce8d9951a215f6f56c33660f2e`               |
| Branch/upstream at scope capture                  | local `main` and `origin/main`, both at the final target |
| External access                                   | none                                                     |
| Local mutation                                    | these four uncommitted audit artifacts only              |
| Finding decisions                                 | awaiting Cooper                                          |

The review made no provider, deployment, message, credential, billing,
Production, Preview, GitHub-setting, or external-workflow observation. Repository
claims and retained external/provider claims remain separate throughout.

## Corpus accounting

The whole target revision was accounted from the Git object, not from the
working-directory search path. The groups below overlap deliberately where a
path belongs to more than one audit lens.

| Group                              | Selection                                                                    | Count | Disposition                                                |
| ---------------------------------- | ---------------------------------------------------------------------------- | ----: | ---------------------------------------------------------- |
| Entire tracked target              | Every `git ls-tree -r` path at the final target                              |   863 | Accounted                                                  |
| Agent guidance and skills          | `AGENTS.md`, `CLAUDE.md`, `.agents/**`, `.claude/**`                         |   199 | Accounted                                                  |
| READMEs                            | Every tracked `README.md`                                                    |    23 | Accounted                                                  |
| Documentation                      | Every tracked `docs/**` path                                                 |   216 | Accounted; current/affected/contradictory owners deep-read |
| Planning and decisions             | Product specs, task ledgers, active plans, decisions                         |    41 | Accounted                                                  |
| Governance, proof, controls        | Verification, documentation-audit, standards, operations                     |   132 | Accounted                                                  |
| Completed history and evidence     | Completed plans and retained evidence                                        |    32 | Accounted; targeted deep reads only                        |
| Manifests, config, schemas, stacks | Package/TS/Turbo/Vercel manifests, JSON Schemas, Alchemy entrypoints, stacks |    53 | Accounted                                                  |
| Quality, CI, release               | Workflows, tooling, tests, test-alchemy, quality/build/deployment config     |   152 | Accounted                                                  |
| TypeScript representative pool     | `apps/**`, `packages/**`, `stacks/**` TS/TSX                                 |   324 | Statically scanned; risk-based deep reads                  |
| Infrastructure-owned final surface | Infrastructure, Photon, stacks, Alchemy entrypoints, drift workflow          |   138 | Accounted                                                  |
| Exact infrastructure branch delta  | Common ancestor to infrastructure parent                                     |   198 | Accounted                                                  |

The exact 198-file change contains 36,676 insertions and 495 deletions:
128 added paths, 68 modified paths, one deleted path, and one exact rename. The
final merge reconciles a further 62 files over the infrastructure parent, with
7,141 insertions and 344 deletions. Both diffs pass `git diff --check`.

All 189 tracked `.json`/JSONC paths were parsed at the appropriate boundary:
188 strict JSON files passed `jq empty`; `tsconfig.base.json` was excluded
from strict JSON parsing because it is intentional JSONC.

The scope artifact records 55 risk-based deep reads. Completed rollout history
was never treated as current policy or as proof of the final merge.

## Audit method and lenses

The review followed the existing-repository workflow from the required
repo-structure skill and used its canonical schemas and validator. The
package-structure profile was applied to package purpose, ownership, dependency
direction, exports, source conditions, tests, and documentation. The
docs-maintainer full harness contract supplied the impact ledger, invariant
IDs, truth-layer separation, lifecycle checks, authority boundaries, accepted
outcomes, critical-journey oracles, limitations, and non-claims.

Every requested lens was applied:

1. repository shape and semantic ownership;
2. package names, `@bundjil` boundaries, exports, source conditions, and import direction;
3. Effect service/error/Layer layout and helper admission;
4. provider and framework adapter isolation;
5. Schema decoding, branded identities, encoded boundaries, and public primitives;
6. Config and redacted secret custody;
7. tests, fixtures, generated output, and false-green rejection;
8. scripts, stacks, entrypoints, paths, state, and stage isolation;
9. duplicated helpers, wrappers, authority machinery, and carrying cost;
10. READMEs, architecture, runbooks, proof, skills, policies, CI, SPEC/tasks/plans, and lifecycle routing;
11. critical-journey and verification-policy coherence;
12. release, rollback, stopping, and evidence identity; and
13. compatibility with current ChannelHandoff and Eve runtime ownership.

## Job traces

### Infrastructure adoption, convergence, drift, and rollback

Representative journeys:
`BND-J13-preview-infrastructure-convergence` and
`BND-J14-preview-infrastructure-drift-report`.

```text
Config.schema + fixed authority file
  -> adoption/inventory input Schema
  -> stage-scoped manifest and digest
  -> root Alchemy entrypoint
  -> exact Vercel/Photon provider scopes
  -> manifest stage equals CLI Stage
  -> sequential resource composition
  -> observe/diff/reconcile or report-only native sync
  -> bounded mode-0600 receipt
  -> direct readback or explicit inconclusive result
  -> exact source/provider rollback route
```

The final source preserves the important boundaries:

- `alchemy.run.ts` rejects managed environment values from the read-only
  adoption path;
- `alchemy.preview.run.ts` composes only the Preview configuration providers;
- `alchemy.stable.run.ts` validates stable authority before constructing the
  stack;
- `stacks/bundjil.ts` rejects a Stage/manifest mismatch and deploys resources
  sequentially;
- `@bundjil/infrastructure` depends on the decoded
  `@bundjil/photon/management` boundary rather than exposing a Photon client;
- report-only drift remains separate from apply/repair/deploy/promotion; and
- Vercel Git remains deployment owner.

The job is weakened after execution by FINDING-002: the final source-integration
receipt is not bound to the merge object it purports to describe. Its package
surface is weakened by FINDING-003 and its operational documentation is
duplicated by FINDING-004.

### Channel ingress, Eve acceptance, outbound delivery, and recovery

Representative journeys:
`BND-J11-photon-accepted-message-typing`,
`BND-J12-dual-channel-production`, and
`BND-J13-hosted-eve-durability`.

```text
authenticated Sendblue/Photon Request
  -> provider-owned complete webhook decode
  -> provider-neutral Channel message
  -> identity + HMAC route + atomic replay claim
  -> ChannelHandoff prepared
  -> Eve send starts inside the concrete runtime
  -> Eve Session.id decodes to EveSessionId
  -> accepted fingerprint recorded
  -> atomic intended-session continuity convergence
  -> 202 only for converged acceptance
  -> Eve event decodes Channel state
  -> provider outbound/presence operation
  -> terminal session settlement and replay retirement
  -> runbook-owned retry, rollback, or escalation
```

This trace is coherent at the target:

- raw provider input and SDK values remain inside provider adapters;
- the request is not acknowledged through a background Fiber;
- timeout/uncertain acceptance retains the inbound claim and returns `503`;
- exact duplicate ingress returns `204`;
- continuity uncertainty does not become `202`;
- outbound delivery has its own replay coordinates; and
- safe observations contain HMAC fingerprints and bounded phases, not raw
  content, provider identities, errors, causes, or secrets.

No finding proposes changing this path. It is PRESERVE-003.

### Maintainer navigation, planning, execution, and closure

```text
AGENTS.md
  -> docs/README.md
  -> product-specs/index.md
  -> SPEC + task ledger
  -> active or completed plan index
  -> target-owned runbook
  -> critical-journey registry + command map
  -> bounded receipt and lifecycle closure
```

This job fails the one-coherent-continuation outcome:

- the Alchemy ledger root is `in_progress` while all ten tasks, its SPEC, and
  both history indexes say terminal/implemented;
- the Hosted Eve ledger root is `in_progress` and its SPEC is `current`,
  while all seven tasks and the completed-plan index say terminal;
- Hosted Eve has no active plan despite the product index stating that current
  intent requires one; and
- the top documentation router says twelve journeys while the registry,
  verification router, and executable policy own fifteen.

That is FINDING-001, with the literal count isolated as optional FINDING-006.

## Proposed important corrections

### FINDING-001 — lifecycle owners teach incompatible continuations

Consequence: a maintainer can restart completed work, load historical evidence as
current intent, or attach a correction to the wrong owner. This is the highest
consequence because every later planning and implementation decision depends on
the current route.

Earliest correction:

- decide the terminal ledger/SPEC state for Alchemy and Hosted Eve;
- reconcile each ledger root, SPEC status, product-spec index, and active/completed
  plan route;
- add one property that rejects a current SPEC without one active plan and a
  terminal plan whose ledger root remains `in_progress`; and
- keep historical provider proof unchanged.

Duplicated or stale machinery to retire:

- both stale `in_progress` root statuses;
- simultaneous current-SPEC/completed-plan routing for Hosted Eve; and
- narrative lifecycle-success claims without cross-owner enforcement.

Decision needed: Cooper chooses each terminal lifecycle label. No provider
authority is involved.

### FINDING-002 — final integration evidence is not revision-bound

Consequence: candidate checks can be read as proof of the final merge even
though the receipt contains no final SHA or ordered parent identities.

Earliest correction:

- make the dated integration receipt name
  `4fc8ba1750524581c281ad97351bf0b1e6e29631` and its two parents;
- distinguish pre-merge checks from any post-merge observation;
- make the completed plan route to the receipt instead of duplicating its green
  verification prose; and
- preserve all external/provider non-claims.

Duplicated or stale machinery to retire:

- the false statement that exact parents are already recorded;
- duplicated integration-verification prose in completed history; and
- any implication that a pre-merge candidate check automatically binds to a
  later merge object.

Decision needed: Cooper accepts the revision-bound receipt class. Read-only Git
evidence is sufficient.

### FINDING-003 — Vercel project and deployment IDs have two public Schema owners

Consequence: consumers can choose incompatible root and `/vercel` brands for
the same provider identity, undermining nominal boundary safety and making the
private package API harder to understand.

Earliest correction:

- keep `packages/infrastructure/src/vercel/schemas.ts` and
  `@bundjil/infrastructure/vercel` as the sole owners;
- remove the duplicate root brands and root exports;
- update compile fixtures to assert the remaining provider brands; and
- preserve all package export conditions and encoded representations.

Duplicated machinery to retire:

- root `VercelProjectId` and `VercelDeploymentId` brands;
- their root barrel exports; and
- the compile fixture that canonises those root duplicates.

Decision needed: Cooper accepts a private public-surface correction. No provider
resource or state change is involved.

### FINDING-004 — package READMEs duplicate target-owned operator procedures

Consequence: two package READMEs and two 470-line runbooks all appear to own
authority, environment, apply, Production staging, retry, cutover, cleanup, and
rollback instructions. Any later safety correction must be reconciled across
multiple plausible owners.

Earliest correction:

- diff the package READMEs against the Alchemy and Photon runbooks;
- move genuinely unique operational knowledge to the runbook;
- reduce each README to package purpose, exports, repository-safe checks, public
  command names, claim boundaries, and one runbook pointer; and
- only promote a narrow documentation control if the stable recurrence justifies
  its carrying cost.

Duplicated machinery to retire:

- README-level environment inventories and authority-path instructions;
- apply, migration, Production staging, cutover, retry-drain, and cleanup
  procedures; and
- repeated proof/authority prose once the canonical owner is linked.

Decision needed: Cooper accepts documentation consolidation and separately
decides whether a new control is worthwhile. No listed command is authorised by
this finding.

## Optional improvements

### FINDING-005 — authority-artifact consolidation deferred after investigation

At least eleven paths repeat part or all of the mode-`0600` stat check,
safe-path Schema, JSON decode, harness-envelope compilation, task-policy
validation, bounded receipt validation, write, and chmod sequence. The code
already varies in maximum size, AJV options, absolute-path policy, and error
mapping.

The completed reinspection found common mode, JSON, envelope, and safe-output
policy, but it also found two distinct size classes, a raw-byte drift
fingerprint, capability-specific task Schemas, path-conflict sets, return
shapes, and error mappings. A shared API would need callbacks for fingerprint,
policy selection, result projection, write topology, and error translation,
widening the security surface beyond any current caller. The adjacent Photon
boundary also requires an absolute output path and create-only-secret custody,
so it remains package-local.

The dated
[decision artifact](structural-audit-authority-artifact-decision-2026-08-01.json)
therefore defers consolidation, preserves all seven call-site owners, forbids a
`utils`, `common`, or `shared` module and new public export, and records the
exact resume trigger. No current caller was shown to accept invalid authority.

### FINDING-006 — remove the duplicated literal journey count

`docs/README.md` says twelve journeys; the registry and executable policy own
fifteen. Prefer count-free router text, or enforce any retained literal against
the registry. Keep all fifteen complete IDs unchanged. The two complete IDs
that share the `BND-J13` numeric prefix remain distinct; this audit does not
propose renumbering retained evidence.

## Foundations to preserve

### PRESERVE-001 — package direction, subpaths, and source conditions

Keep private `@bundjil` packages, provider-heavy opt-in subpaths, local
NodeNext `.js` imports, and ordered `@bundjil/source`, `types`, `default`
conditions. Keep infrastructure depending on Photon management; do not invert
the dependency or turn infrastructure into an app service locator.

### PRESERVE-002 — Effect provider boundaries

Keep owner-branded Schema input, immediate outward encoding, complete response
envelope decoding, Config.schema/redacted credential Effects, safe tagged
failures, flat named operations, and explicit live/memory Layers. Do not export
raw Vercel/Photon clients, SDK callbacks, provider DTOs, or generic operations.

### PRESERVE-003 — ChannelHandoff and Eve acceptance ownership

Keep the merged synchronous acceptance path, branded HMAC observations, atomic
continuity fence, uncertainty retention, and claim-matched HTTP dispositions.
Do not add a background Fiber, parallel app Workflow, fallback runtime, or
provider-agnostic wrapper around Eve.

### PRESERVE-004 — stage-isolated Alchemy composition

Keep command input decoding before stack construction, explicit authority,
manifest/Stage equality, sequential resource deployment, per-resource removal
policy, observe-first behavior, and Vercel Git deployment ownership.

### PRESERVE-005 — truth-layer and authority separation

Keep local checks, dated receipts, external readback, provider acceptance,
deployment, delivery, and Production as separate claims. Keep procedures in
runbooks, policy in current architecture/standards, proof in verification, and
history outside the default route.

## Package and infrastructure result

| Lens                             | Result                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Package ownership                | Strong, except duplicate Vercel brands at root and `/vercel`                                             |
| Namespace and export maps        | Strong; all private package exports inspected use the source/types/default pattern                       |
| Import direction                 | Strong; infrastructure depends on Photon management and apps do not import infrastructure                |
| Root versus subpath API          | Mostly strong; provider-heavy subpaths are explicit, with FINDING-003 the material ambiguity             |
| Effect service layout            | Strong; named services, tagged errors, live/memory Layers, flat operations                               |
| Adapter isolation                | Strong; raw provider clients/DTOs remain private                                                         |
| Schema and brands                | Strong at ingress/outward boundaries; duplicate Vercel brand ownership requires correction               |
| Config and secrets               | Strong; Config.schema and redacted secret types, no package-source process.env reads found               |
| Tests and fixtures               | Broad and boundary-specific; repository execution was dependency-blocked in this worktree                |
| Scripts and stacks               | Stage-guarded and readable, but authority-artifact handling is repeated                                  |
| Helper/wrapper admission         | No broad generic helper package found; optional consolidation has a real security owner and many callers |
| Documentation ownership          | Does not meet repository rule; package READMEs duplicate runbooks                                        |
| Journey/verification coherence   | Contracts and command map are strong; lifecycle routes and one router literal drift                      |
| ChannelHandoff/Eve compatibility | Strong and explicitly preserved                                                                          |
| Desired smaller/cleaner outcome  | Not presently met because semantic and documentation owners are duplicated                               |

## Documentation impact ledger

This is the docs-maintainer full-harness disposition across the audit, not an
implementation ledger.

| Surface                    | Audit disposition                                      | Evidence and earliest owner                                                             |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Documentation routers      | Change required if FINDING-001/006 are accepted        | Product, plan, and journey routes contradict terminal source state                      |
| READMEs                    | Change required if FINDING-004 is accepted             | Infrastructure and Photon READMEs exceed their package-map role                         |
| Architecture and standards | Preserve                                               | Current ownership, Effect, authority, and truth-layer rules are sound                   |
| Runbooks                   | Preserve, receiving only unique deduplicated knowledge | Alchemy and Photon runbooks remain exact procedure owners                               |
| Proof and evidence         | Change required if FINDING-002 is accepted             | Integration receipt needs final revision and ordered parent identity                    |
| Skills                     | Preserve                                               | Required skills already encode the correct audit, package, and documentation boundaries |
| Lint, config, and CI       | Targeted change only after acceptance                  | Add cross-owner lifecycle/receipt properties; avoid broad helper lint                   |
| SPEC and task ledgers      | Change required if FINDING-001 is accepted             | Two ledger roots and Hosted Eve current intent contradict terminal routing              |
| Tests and fixtures         | Change required for accepted findings                  | Add adversarial lifecycle, receipt-identity, export, and optional authority fixtures    |
| Config and exports         | Change required only for FINDING-003                   | Retire duplicate root Vercel brands; preserve source conditions                         |
| Lifecycle routing          | Change required if FINDING-001 is accepted             | One current continuation is not presently taught                                        |
| Release and rollback       | Preserve                                               | No release/provider action; later corrections use ordered source reversion              |
| Critical journeys          | Preserve exact IDs and oracles                         | Fifteen registry entries and command mappings remain; only router count text drifts     |
| External/provider claims   | Evidenced N/A                                          | No external access; historical claims remain bounded to their original receipts         |

No new skill, runbook, proof packet, control record, SPEC, task, plan, release,
or provider document is created by this audit.

## Accepted implementation crosswalk

The structured crosswalk maps every accepted finding exactly once. Deferred
`FINDING-005` remains outside implementation scope; its dated decision requires
a new candidate to satisfy the exact resume trigger before reconsideration.

| Finding     | Current decision             | Consequence class              | Earliest owner if accepted                                        | Cooper decision required                                                                                   |
| ----------- | ---------------------------- | ------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| FINDING-001 | Accepted                     | Important correction           | Product-spec index plus the two SPEC/task owners and plan indexes | Implement terminal lifecycle states and the cross-owner control                                            |
| FINDING-002 | Accepted                     | Important correction           | Dated integration receipt                                         | Bind revision and ordered parents without broadening proof                                                 |
| FINDING-003 | Accepted                     | Important correction           | `@bundjil/infrastructure/vercel`                                  | Retire duplicate root brands                                                                               |
| FINDING-004 | Accepted                     | Important correction           | Package READMEs and app runbooks                                  | Consolidate README/runbook ownership without a broad prose control                                         |
| FINDING-005 | Deferred after investigation | Carrying-cost improvement      | Existing capability-local authority-artifact boundaries           | Resume only when two current callers share the complete callback-free contract named by the dated decision |
| FINDING-006 | Accepted                     | Router consistency improvement | Critical-journey registry and docs router                         | Remove current hardcoded journey-count prose                                                               |

Only accepted findings should later receive requirement IDs, task IDs, exact
owning paths, verification commands, and proof entries in the structured
crosswalk. Rejected, deferred, and optional-not-selected findings stay out of
that file.

## Verification

| Check                                       | Result                                   | Claim                                                                                        |
| ------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Target HEAD/local main/origin main identity | Passed                                   | All resolved to the supplied final target at scope capture                                   |
| Merge parent identity                       | Passed                                   | Git object has the two recorded parents                                                      |
| Target path inventory                       | Passed                                   | 863 tracked paths                                                                            |
| Docs/README inventory                       | Passed                                   | 216 docs paths and 23 READMEs                                                                |
| Exact infrastructure delta                  | Passed                                   | 198 files, 36,676 insertions, 495 deletions                                                  |
| Merge reconciliation delta                  | Passed                                   | 62 files, 7,141 insertions, 344 deletions                                                    |
| Strict JSON scan                            | Passed with one declared JSONC exclusion | 188 strict JSON files valid; `tsconfig.base.json` is JSONC                                   |
| Diff whitespace checks                      | Passed                                   | Both infrastructure and merge-reconciliation diffs pass                                      |
| Structured audit validator                  | Passed                                   | Scope, findings, and empty accepted crosswalk are coherent under the canonical audit schemas |
| Repository-owned Bun checks                 | Blocked locally                          | Target worktree has no dependency directory; `effect` cannot resolve                         |
| `bun run verification`                      | Not run                                  | Running would require a dependency-state mutation outside the four-file allowance            |

The dependency-resolution failure is not reported as a source defect. The
repository's earlier green receipts remain historical evidence only and are not
substituted for a fresh target-worktree run.

## Limitations and non-claims

- This is a static, revision-bound structural audit plus local read-only checks.
- No provider or hosted environment was accessed.
- No deployment, provider mutation, message, credential operation, commit, push,
  merge, or publication occurred.
- No finding was implemented or accepted.
- Path accounting does not prove semantics; representative jobs and deep reads
  supply the semantic evidence.
- Historical plans and packets were read only where they illuminate current
  ownership, lifecycle, compatibility, or proof.
- A validator pass proves artifact structure and crosswalk completeness only.
- Preserve findings do not claim that every repository line is defect-free.
