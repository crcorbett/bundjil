---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-07-25
review_trigger: task status, Alchemy/provider capability, state/secret decision, authority, rollout, rollback, or proof change
spec: ../../product-specs/alchemy-vercel-photon-infrastructure.md
task_ledger: ../../product-specs/alchemy-vercel-photon-infrastructure.tasks.json
started: 2026-07-24
---

# Alchemy Infrastructure For Vercel And Photon

## Current trajectory

Start with an offline Alchemy/custom-provider lifecycle proof using beta.64's
actual `read`/`diff`/`reconcile`/`delete`/`list` and native `sync` contracts.
Then implement read/import Vercel and Photon vertical slices with memory Layers.
Live provider reads occur only through a separately authorized task-scoped
command; no write occurs until exact adoption, state, secret binding, Preview
isolation, rollback, and proof gates pass.

The target is hybrid ownership:

- Alchemy owns stable configuration and drift;
- Vercel Git owns immutable deployments;
- app-owned runbooks own promotion, rollback, and runtime proof;
- existing Production resources are imported, retained, and
  delete-protected.
- single-bearer agent/proxy rotation and Photon webhook mutation remain blocked
  until their overlap/binding-sink cutover contracts are proved.

## Current task

`alchemy-offline-foundation` is implemented, locally accepted, and committed
as `0a08767` on `codex/alchemy-vercel-photon-infrastructure`.
`vercel-read-import-vertical` is implemented and locally accepted: its private
contracts, live and memory Layers, five retained custom Resources, complete
synthetic two-project inventory, and zero-write adoption path passed the full
repository gate. That vertical was accepted before its live Layer was used.
`photon-read-import-vertical` is implemented and locally accepted: Photon owns
the new read-only `/management`
boundary, infrastructure owns six retained observation Resources, and the
accepted memory topology is Free/shared with zero dedicated lines. At vertical
acceptance neither live Layer was wired or used. The full repository gate
passed, and the adversarial closeout extended the shared bounded retry policy
across every Photon HTTP read before focused Photon and infrastructure checks
passed again. `authorized-read-only-inventory` is now accepted at repository
identity
`86a1b9a341054ccfa5c00250adc473d1ed6bafa3`. A bounded read-only execution
produced matching double-read Preview and Production manifests, passed
receipts, exact stage-target isolation, customer Marketplace storage identity,
and a shared Free Photon observation with zero provider writes. The retained
ignored artifacts are mode `0600`, Schema-valid, fixed-contract compatible and
leak-scanned. Project-scoped domains/Marketplace identity and the sole shared
Photon project are not treated as separate stage resources; Vercel protection,
list-omitted deployment aliases and a separately created Preview Photon project
remain unknown. `remote-state-and-noop-adoption` is now accepted: the dedicated
R2 state store contains the exact 106 Preview and 69 Production logical
identities, both stages converge to no-op, and the read-only provider adapters
record zero transport writes. `preview-vercel-configuration-spike` is now the
current task.

On 2026-07-25, the clean feature branch preserved `0a08767`, `43af287` and
`65f4d7b`, committed the prepared inventory implementation as `c54c499`, and
merged current `origin/main` `ff73113` at `f81fba7`. The merged tree includes
the runtime-ownership and requirement-to-proof hardening, passes the complete
repository gate, and retains the task lifecycle above. The ignored
mode-`0600` authority file is structurally valid but expired with its one-run
2026-07-24 duration. Required Vercel and Photon project credential Config is
not available in the process environment; cached Vercel identity previously
returned `403`, while Photon CLI login is not the project ID/secret pair owned
by the management Layer. No provider call was made during resumption.

The owner approved the exact replacement read-only envelope on 2026-07-25,
including existing local and read-only 1Password credential custody. The
ignored mode-`0600` envelope validates against both fixed Schemas. Photon
principal readback succeeded and retained only an opaque fingerprint. The sole
Vercel CLI cache is expired and a fresh `/v2/user` read returned `403`.
Two bounded 1Password candidate-list attempts did not complete desktop
authorization and returned no item or field. The required two-principal gate
therefore did not pass, the 30-minute inventory window did not start, and no
resource inventory read, manifest, provider receipt, credential refresh or
mutation occurred.

### Approved identity-preflight requirement replay

| Requirement                               | Direct observable and expected postcondition                                                                                                                                                     | Plausible false green rejected                                                                                            | Focused command/readback                                                             | Evidence owner and result                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Fixed current authority                   | The mode-`0600` ignored envelope validates against the harness and task policy, names the approved resources/operations/stages, and starts its 30-minute duration only at the two-principal gate | Reusing the expired 2026-07-24 envelope or treating user approval as provider proof                                       | AJV validation of both fixed Schemas plus file mode/size readback                    | Ignored authority file and task `authorizedIdentityPreflight`; passed                      |
| Photon principal                          | `photon whoami` exits zero with one non-empty principal, retaining only SHA-256 fingerprint `4b150aa4b96f5234f56f61c22726d49def4751bce2669d54808f560e0590ac67`                                   | Treating CLI credential-file presence or project credentials as user authentication                                       | Bounded `photon whoami` with in-memory output hashing                                | Task ledger; passed                                                                        |
| Vercel principal                          | One non-expired personal Vercel credential returns a successful current user identity before any project read                                                                                    | Treating link metadata, token presence, an expired bearer, refresh-token presence or another provider's identity as proof | Expiry classification and `GET /v2/user`, emitting only status and fingerprint state | Task ledger; blocked: the sole cache is expired and readback returned `403`                |
| 1Password fallback                        | Exactly one matching existing Vercel record is read through unlocked CLI custody without emitting any item field                                                                                 | A hanging desktop authorization, multiple candidates or list-command construction being treated as a credential           | Two bounded sanitized `op item list` attempts                                        | Task ledger; blocked: desktop authorization did not complete and no candidate was returned |
| Inventory-window and zero-mutation policy | The timer begins only after both principals resolve and the first canonical inventory read is ready; before then there are zero resource reads and zero writes                                   | Starting the timer at approval-message time or promoting one successful principal into inventory acceptance               | Provider-action review and absence of artifact/receipt                               | This plan and task ledger; passed, window not started                                      |

### Approved identity-preflight impact ledger

| Surface                           | Status          | Decision and evidence boundary                                                                                                                                   |
| --------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan | Change required | Record the approved envelope, direct principal observables, rejected false greens, exact Vercel/1Password block and unchanged task lifecycle.                    |
| Architecture and docs router      | Preserve        | The read-only provider boundary and proof classes did not change.                                                                                                |
| Root, app and package READMEs     | Preserve        | No command, config name, package purpose or app operation changed.                                                                                               |
| Exports and generated references  | Preserve        | No export, codec or generated reference changed.                                                                                                                 |
| Runbooks and authority            | Preserve        | The approved ignored envelope instantiates the fixed authority contract; target runbooks remain operational owners. It grants no credential refresh or mutation. |
| Verification journeys and proof   | Change required | Preserve the inconclusive identity preflight in the canonical task/plan. No provider receipt or manifest exists.                                                 |
| Skills and `AGENTS.md`            | Preserve        | PRD implementer, docs-maintainer and Effect client-wrapper contracts were applied; no instruction gap was found.                                                 |
| Lint, config, commands and CI     | Preserve        | No repository config, workflow or command changed; existing secret Config names remain canonical.                                                                |
| Schemas, services and Layers      | Preserve        | No provider boundary changed. Photon and Vercel identity readbacks were preflight only; resource reads remain owned by the canonical inventory Layers.           |
| Tests and fixtures                | Preserve        | No executable behavior changed and no mock proof substitutes for the failed Vercel identity gate.                                                                |
| SPEC tasks, plan and lifecycle    | Change required | `authorized-read-only-inventory` remains pending and its dependent task remains blocked.                                                                         |
| Receipts and evidence             | Change required | Record only opaque Photon fingerprint, Vercel status, authority identity and non-claims. Retain no account data, secret, raw response or inventory artifact.     |
| Rollout, rollback and lifecycle   | Preserve        | No rollout occurred. External rollback is N/A; local ignored authority can be discarded if invalidated.                                                          |
| Archive pointers and formal audit | Preserve        | No archive transition and no terminal five-pass audit.                                                                                                           |

### Current-main integration and resumed authority boundary

| Requirement                                              | Direct observable and expected postcondition                                                                                                                                                                                     | Plausible false green rejected                                                                                              | Focused command or readback                                                                                                                | Evidence owner and result                                                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Preserve branch history while integrating current main   | `ff73113`, `0a08767`, `43af287` and `65f4d7b` are all ancestors of merge commit `f81fba7`; the current task remains pending                                                                                                      | Seeing the commit subjects in `git log` without proving ancestry, or selecting stale docs counts during conflict resolution | `git fetch origin`; `git merge-base --is-ancestor <sha> HEAD`; `git status --short`; normal merge of `origin/main`                         | Git graph and this plan; passed with no merge conflict                                                                                        |
| Recompute merged documentation lifecycle                 | The merged router resolves 262 documentation files with no lifecycle or inventory finding                                                                                                                                        | Reusing the pre-merge file count or accepting a conflict side verbatim                                                      | `bun run check:docs`                                                                                                                       | `tmp/docs-policy-report.json`; passed on `f81fba7`                                                                                            |
| Require current target-specific read authority           | The fixed harness and task Schemas accept an envelope whose principal, scope, operations, Preview/Production environments, duration, custody, readback and stops apply to this execution                                         | File mode `0600`, JSON validity or the 2026-07-24 approval being treated as perpetual authority                             | Inspect both fixed authority Schemas, ignored-file metadata/duration and `docs/operations/authority-register.json` without provider access | Task `resumptionBoundary`; blocked because the available envelope expired                                                                     |
| Require usable credential custody without disclosure     | `VERCEL_INFRASTRUCTURE_ACCESS_TOKEN`, `BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID` and `BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET` are supplied only to their redacted Config boundaries; both principals succeed before resource reads | Treating a cached bearer or Photon CLI session as proof of the exact credentials required by the inventory command          | Presence-only environment check; credential-file mode/key inspection; later authorized current-principal readback                          | Owning live Layers and future bounded receipt; blocked because command Config is absent and cached Vercel principal previously returned `403` |
| Preserve zero external mutation and honest proof classes | Resumption produces no provider request or write and makes no current-state claim; repository verification proves only the merged source state                                                                                   | A green full suite, old discovery or mock lifecycle matrix being promoted to current provider truth                         | Provider action log remains empty; `bun run verification` on the exact merged state                                                        | Task ledger and this plan; passed for repository scope only                                                                                   |

### Resumption impact ledger

| Surface                           | Status          | Decision and evidence boundary                                                                                                                                                                          |
| --------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan | Change required | Record exact merge identity, expired authority, credential custody, direct observables, rejected false greens and the unchanged downstream block. Keep the SPEC proposed, task pending and plan active. |
| Architecture and docs router      | Preserve        | Current-main architecture and runtime-ownership owners were merged intact. `check:docs` recomputed 262 routed files; no architecture contract changed in this recording slice.                          |
| Root, app and package READMEs     | Preserve        | The inventory command and non-claims were already documented by `c54c499`; no command, package purpose or app route changed after the merge.                                                            |
| Exports and generated references  | Preserve        | No public export, generated contract or boundary exception changed.                                                                                                                                     |
| Runbooks and authority            | Preserve        | Target-owned runbooks and fixed authority Schemas remain canonical. The expired ignored envelope and static records grant no current provider access.                                                   |
| Verification journeys and proof   | Preserve        | No provider receipt was produced or promoted. The future command must still perform two Schema-owned reads and emit the fixed bounded receipt.                                                          |
| Skills and `AGENTS.md`            | Preserve        | The merged PRD implementer, docs-maintainer and Effect client-wrapper contracts were reread and applied; no recurring instruction gap was found.                                                        |
| Lint, config, commands and CI     | Preserve        | No command, credential, workflow or CI admission changed. The process-only synthetic Executor values were used only to exercise the repository verification contract.                                   |
| Schemas, services and Layers      | Preserve        | No runtime boundary changed. The exact redacted Config owners remain `VERCEL_INFRASTRUCTURE_ACCESS_TOKEN`, `BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID` and `BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET`.       |
| Tests and fixtures                | Preserve        | Current-main tests and the existing inventory matrix passed; no direct provider requirement is accepted by proxy.                                                                                       |
| SPEC tasks, plan and lifecycle    | Change required | This task stays pending, its dependent task stays blocked and the plan stays active. No accepted-task count was changed.                                                                                |
| Receipts and evidence             | Change required | The ledger and plan own the repository/authority boundary. No external receipt, manifest or current provider-state evidence exists.                                                                     |
| Rollout, rollback and lifecycle   | Preserve        | No rollout occurred. Local rollback is reversion of the resumed-boundary documentation commit; external rollback is N/A because no provider operation occurred.                                         |
| Archive pointers and formal audit | Preserve        | No archive transition. The earlier audit remains interim; one fresh formal five-pass audit runs only at terminal full-SPEC closeout.                                                                    |

## Accepted planning evidence

| Lens                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Reviewed `origin/main` at `61992a2`, which contains Photon merge `23ae79b`, the harness-aligned proposed Eve runtime ownership SPEC, and the embedded structured harness contract. `@bundjil/infrastructure` is private tooling; `@bundjil/photon` remains the management transport owner; Vercel Git and app runbooks retain deployment authority.                                                                                |
| Implementation quality   | The SPEC requires actual Alchemy v2 reconcile semantics, lazy credential services, a complete boundary matrix naming each codec `Type`/`Encoded` and single decode/encode owner, owner-qualified branded identities, named literal discriminants, `Config.schema`/`Redacted`, named request/result services, safe errors, constant live/memory Layers, flat Effects, and no generic client/helper sprawl.                          |
| Verification coverage    | The sibling ledger requires codec round trips and malformed ingress, cross-brand compile failures, adoption, desired-state no-op, native sync drift, timeout-after-write, partial-failure, retain/delete-protection/leak tests, provider readback, deployment proof, Channel/handset proof separation, fixed structured artifact validation, stable invariant evidence, fixture lifecycle, and one fresh independent final review. |

## Per-task requirement proof replay

Every pending task must populate its `requirementProofReplay` record before
acceptance. Each material SPEC requirement and each independently falsifiable
property inside a compound policy receives one row with the direct observable,
expected postcondition, plausible false green, smallest focused
command/authorized readback, earliest evidence owner, observed result,
limitations/non-claims and any correction. Broad-suite success, typechecking,
a neighbouring assertion, command exit zero, Alchemy state, or another proof
class cannot satisfy a row by proxy.

For retry-capable operations, separate rows prove eligibility, bounded
attempts, backoff, provider rate-delay handling, jitter, idempotent/read versus
non-idempotent/billable/uncertain effects, and exact-identity observation after
timeout before replay. Apply the same property expansion to authority,
adoption, isolation, retain/delete protection, secret custody, pagination,
drift/no-op, partial failure, rollout and rollback.

The `authorized-read-only-inventory` replay is complete at `86a1b9a`.
Repository checks, authenticated readback and the ignored receipt owners remain
distinct: Preview digest
`e011bf3fa798142d3a23a5395b82765c5cb12d5673060af531498a10cdb56169`
and Production digest
`e8b25f3aab1b683775e722b8dc6f963402faea42d0cbec97b8dc3fb56138f3ce`
each came from two unchanged reads. The task ledger owns the full
property-level replay and explicit non-claims. The next task must not promote
these read receipts into remote-state, adoption, deployment, protection,
Channel or separately isolated Photon proof.

### Requirement-proof hardening impact ledger

| Surface                           | Status          | Decision, owner, observable and non-claim                                                                                                                                                                                                                                              |
| --------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan | Change required | The SPEC owns the proof-by-proxy prohibition and property expansion; every pending task owns a required replay record; this plan owns current execution status. `check:docs`, JSON decoding and exact task-record inspection must pass. This does not complete any provider task.      |
| Architecture and docs router      | Preserve        | `docs/README.md` and routed architecture already distinguish repository, provider, deployment and runtime proof. No durable executable boundary changes in this documentation-only hardening slice.                                                                                    |
| Root, app and package READMEs     | Preserve        | No command, export, package purpose, app route or public contract changes. Existing README pointers remain accurate.                                                                                                                                                                   |
| Exports and generated references  | Preserve        | No source, export, generated contract or boundary exception changes.                                                                                                                                                                                                                   |
| Runbooks and authority            | Preserve        | Target-owned procedures and authority envelopes remain the operation owners. The replay records evidence requirements and grants no read, write, credential, deployment, promotion or Production authority.                                                                            |
| Verification journeys and proof   | Preserve        | Existing journey/receipt Schemas remain canonical. Future task rows must point to their direct observable and owning receipt; this slice creates no provider, deployment, Channel or handset evidence.                                                                                 |
| Skills and `AGENTS.md`            | Preserve        | Current repository-local PRD implementer and docs-maintainer rules already route task acceptance and proof ownership. The prepared current-main hardening was applied to this SPEC's earliest intent owners without copying a second generic policy into skills or agent instructions. |
| Lint, config, commands and CI     | Preserve        | No executable check or workflow changes. Focused docs/JSON checks and the full repository gate verify source consistency only.                                                                                                                                                         |
| Schemas, services and Layers      | Preserve        | No runtime Schema, Service, Layer or provider implementation changes. Future proof rows must observe these owners directly when their requirement is exercised.                                                                                                                        |
| Tests and fixtures                | Preserve        | No fixture changes in this documentation-only slice. Future task acceptance must add or strengthen the smallest direct negative test when an existing assertion only proves a neighbour or compound summary.                                                                           |
| Receipts and evidence             | Change required | Task objects and matching plan sections become the acceptance-accounting owners. Actual external observations still require the fixed bounded receipt and repository proof owner; prose rows alone are not evidence.                                                                   |
| Rollout, rollback and lifecycle   | Preserve        | No rollout occurred. Local rollback is reversion of this documentation slice. Pending tasks and the active lifecycle remain unchanged.                                                                                                                                                 |
| Archive pointers and formal audit | Preserve        | No archive transition. The earlier repository checkpoint remains interim history. One fresh formal five-pass audit runs only in terminal closeout after all tasks reach honest dispositions; per-task replay and ordinary risk review do not multiply that audit.                      |

The supporting research and first implementation slice were revalidated
against the exact Alchemy
`2.0.0-beta.64` package, current Vercel and Photon primary contracts, and the
Site repository at `878d18d`. Site's manifest/lock pin beta.64, while its
existing installed resolution reports beta.63; the beta.64 package tarball,
not stale `node_modules`, established provider and sync APIs. The exact
beta.64 package requires Effect and platform peers at beta.100 or later, and
its CLI imports the declared-optional `@effect/platform-node` peer at startup;
the lockfile therefore records that exact root runtime peer. No tenant provider
was queried.

## Downstream-impact ledger

| Surface                           | Status          | Reason                                                                                                                                                                                                                                                         |
| --------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan | Change required | Mark the offline foundation honestly accepted, record exact dependency/runtime findings and three-lens evidence, and route the Vercel read/import task next. The SPEC remains proposed during implementation as its lifecycle owner requires.                  |
| Architecture and docs router      | Change required | Root stack/package ownership, Alchemy provider semantics, repository layout, verification commands, and the package README route are now executable current architecture.                                                                                      |
| Root, app and package READMEs     | Change required | Add the private infrastructure package to the root and docs routes and create its narrow boundary/command README. App READMEs are preserved because applications neither import nor execute this tooling.                                                      |
| Exports and generated references  | Change required | Add only root and `/testing` package exports with source/types/default conditions. No generated API or public website reference exists, so generated-reference work is evidenced N/A.                                                                          |
| Runbooks and authority            | Preserve        | The synthetic local stack is not a provider operation. No Vercel, Photon, deployment, credential, webhook, remote-state, release, or Production authority or repeatable target operation was added.                                                            |
| Verification journeys and proof   | Preserve        | Fixed receipt compatibility and synthetic lifecycle proof live in tests and ignored local state. No critical journey, retained provider packet, external readback, deployment, Channel, or handset claim changed.                                              |
| Skills and AGENTS                 | Preserve        | The invoked repository-local implementer, docs, Effect-client, and package-structure rules already route this slice; no skill bytes, mirrors, AGENTS instructions, worker identity, or harness epoch changed.                                                  |
| Lint, config, commands and CI     | Change required | Pin Alchemy and compatible Effect/platform peers, add package/root TypeScript ownership, ignore local Alchemy state, add focused package commands, and preserve CI/automation admission because no hosted workflow was added.                                  |
| Schemas, services and Layers      | Change required | Add canonical Type/Encoded contracts, branded identities, lazy redacted credential service, named lifecycle service, operation-specific safe errors, deterministic memory Layer, and private Alchemy provider Layer.                                           |
| Tests and fixtures                | Change required | Add codec, config, brand, fixed receipt, leak, provider lifecycle, native sync, failure/recovery, adoption, retain and deletion fixtures. They are repository proof only.                                                                                      |
| Receipts and evidence             | Preserve        | Tests validate the fixed bounded-receipt contract, but no dated retained receipt is needed for a deterministic local-only task. `.alchemy/` remains ignored and is not evidence or current state truth.                                                        |
| Rollout, rollback and lifecycle   | Preserve        | No rollout occurred. Recovery is removal of ignored local state and reversion of the exact task commit. Active plan and SPEC indexes remain current intent; no archive or completed-history pointer changes until the full sibling ledger reaches disposition. |
| Documentation audit inventory     | Change required | The new package README changes the tracked README corpus. Refresh only the inventory correction required by `check:docs`; do not rewrite the retained HGI-307 epoch, scenarios, reports, or acceptance claims.                                                 |

## Accepted offline-foundation evidence

- Starting identity: `origin/main` and local `HEAD` were
  `38a8a3f4cde7b6c519803f233b80b48f079a206d`; the canonical SPEC and task
  ledger were present and routed as current implementation intent.
- Ownership and call graph: applications have no infrastructure dependency;
  root `alchemy.run.ts` owns topology, `@bundjil/infrastructure` owns state-safe
  contracts and custom provider lifecycle, and Vercel Git/app runbooks retain
  deployment authority.
- Implementation quality: the public package boundary exposes no raw client,
  generic callback, SDK DTO, primitive semantic identity, synchronous codec,
  manual JSON reader, unsafe cast, `instanceof` policy, or common/helper
  module. Provider failures are safe tagged errors and uncertain writes recover
  through a bounded stable-identity readback.
- Dependency compatibility: the accepted Alchemy minimum moved the workspace
  to the beta.100 Effect peer line. The beta.101 resolution changed
  `Schema.Defect` from a Schema value to a constructor, so existing Codex,
  codex-proxy, and Eve safe error contracts now call `Schema.Defect()` without
  changing their encoded error shape or public ownership.
- Verification coverage: focused tests prove config/manifest/receipt codecs,
  malformed ingress, cross-brand compile failures, lazy redaction, all custom
  provider operations, create/update/replace/no-op, exact-digest adoption,
  retain/delete gates, timeout-before-write, timeout-after-write, eventual
  consistency exhaustion, lost-state recovery, idempotent deletion, native
  sync drift repair, and sentinel absence from state-safe outputs, plans,
  failures, and receipts.
- Executable-edge evidence: after the package build,
  `bun alchemy plan --stage preview` reported only
  `OfflineFoundation create`; both native sync commands reported no changes
  against ignored local state. No Alchemy deploy, provider credential, network
  request, remote state, Vercel resource, or Photon resource was used.
- Repository acceptance: full `bun run verification` passed with the documented
  public synthetic Executor endpoint and a process-only test credential. Effect
  setup, boundaries, docs, skills, authority, controls, verification policy,
  HGI-307, 89 tooling tests, format/lint, Knip, all nine package typechecks, and
  all fifteen Turbo build/test tasks passed. The synthetic endpoint was not
  contacted and this is not provider proof.
- Rollback identity: remove ignored `.alchemy/` local state if desired and
  revert the exact coherent task commit. No external rollback exists because
  no external operation occurred.

## Vercel read/import impact ledger

| Surface                           | Status          | Slice decision                                                                                                                                                                                                                                                                                |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan | Change required | Keep the SPEC proposed, mark the Vercel slice in progress until the complete gate passes, record the exact implementation/proof boundary, and route Photon next only after local acceptance.                                                                                                  |
| Architecture and docs router      | Change required | Record the implemented private Vercel subpath, full-envelope ingress, pagination, state-safe env metadata, read-only reconcile, and fail-closed deletion. The existing docs route remains canonical.                                                                                          |
| Root, app and package READMEs     | Change required | Update the infrastructure package boundary and explicit non-claims. Root/app commands and runtime ownership are preserved because no application or root stack imports the Vercel subpath.                                                                                                    |
| Exports and generated references  | Change required | Add only `@bundjil/infrastructure/vercel`; no raw client, DTO, token, value, generic callback, generated API reference, or second package is exported. Generated-reference work is evidenced N/A.                                                                                             |
| Runbooks and authority            | Preserve        | No live Layer wiring, tenant read, provider write, credential access, deployment, promotion, webhook, DNS, remote state, or Production operation occurred. Existing Vercel runbooks retain authority.                                                                                         |
| Verification journeys and proof   | Preserve        | Contract and memory fixtures are repository evidence only. No retained provider packet or critical-journey truth changes until separately authorised fresh readback.                                                                                                                          |
| Skills and AGENTS                 | Preserve        | The invoked implementer, docs, Effect-client, and package-structure guidance already owns this shape. No skill bytes, mirrors, AGENTS rule, worker identity, or harness epoch changed.                                                                                                        |
| Lint, config, commands and CI     | Change required | Add the explicit Vercel package export and focused fixtures. Hosted workflow, root command, automation admission, and CI authority remain unchanged.                                                                                                                                          |
| Schemas, services and Layers      | Change required | Add owner-qualified Vercel identities, Type/Encoded request/result/props/attributes contracts, five named services, operation-specific safe errors, lazy redacted credentials, private live Layer, deterministic memory Layer, and retained providers.                                        |
| Tests and fixtures                | Change required | Cover full-envelope decoding, malformed and rate-limited responses, exhaustive project pagination, outbound team/project scoping, sensitive env metadata, Marketplace/deployment identity, cross-brand rejection, two-project memory observation, adoption, zero writes, and deletion denial. |
| Receipts and evidence             | Preserve        | No dated receipt is valid for synthetic contract proof alone. Test output and ignored state are not provider truth and contain no secret/value sentinels.                                                                                                                                     |
| Rollout, rollback and lifecycle   | Preserve        | No rollout occurred. Rollback is reversion of the coherent local slice commit; there is no external rollback. The plan remains active and no archive/completed-history pointer changes.                                                                                                       |
| Documentation audit inventory     | Preserve        | No README file was added or removed; the existing inventory/digest remains current.                                                                                                                                                                                                           |

## Photon read/import impact ledger

| Surface                           | Status          | Slice decision                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan | Change required | Keep the SPEC proposed, mark the Photon task accepted after the full gate, record the exact local proof boundary, and route the authority-gated read-only inventory task next.                                                                                                                                        |
| Architecture and docs router      | Change required | Record Photon HTTP ownership, the public read-only management boundary, exhaustive user pagination, complete-envelope decoding, safe projections, retained Alchemy resources, and fail-closed mutation. The existing docs router remains canonical.                                                                   |
| Root, app and package READMEs     | Change required | Update the root, Photon and infrastructure package boundaries. App READMEs and runtime composition are preserved because neither application imports infrastructure and the existing Channel transport contract is unchanged.                                                                                         |
| Exports and generated references  | Change required | Add only `@bundjil/photon/management` and `@bundjil/infrastructure/photon` with source/types/default conditions. No raw client, Basic-auth function, URL builder, DTO, provider body, generic callback, SDK type, phone value, secret value, or generated API reference is exported; generated-reference work is N/A. |
| Runbooks and authority            | Preserve        | Internal operator commands and the target-owned Photon runbook remain the only mutation route. No live Layer wiring, credential access, provider read/write, webhook, billing, line, deployment, message, handset, Preview, Production, or remote-state operation occurred.                                           |
| Verification journeys and proof   | Preserve        | Contract and Alchemy memory fixtures are repository proof only. No retained provider packet, current Photon truth, deployment journey, Channel proof, or handset claim changed.                                                                                                                                       |
| Skills and AGENTS                 | Preserve        | The invoked implementer, docs, Effect-client, and package-structure guidance already owns the slice. No skill bytes, mirrors, AGENTS rule, worker identity, or harness epoch changed.                                                                                                                                 |
| Lint, config, commands and CI     | Change required | Add two explicit package subpaths, the infrastructure workspace dependency, and the Bun source condition for provider-harness tests. Root stack, hosted workflow, automation admission, credentials, and CI authority remain unchanged.                                                                               |
| Schemas, services and Layers      | Change required | Add owner-qualified Photon project/user/webhook/line/pagination/callback identities; request/result and resource Type/Encoded contracts; six named services/errors; lazy redacted credentials; live/memory Layers; and six retained read/import providers.                                                            |
| Tests and fixtures                | Change required | Cover project/platform/user/webhook/line/billing success, complete-envelope failure, exhaustive pagination, semantic ambiguity, `404`/`409`/`429`/`5xx`, unavailable billing, exact adoption, zero lines/writes, mutation denial, codec round trips, cross-brand rejection, and leak sentinels.                       |
| Receipts and evidence             | Preserve        | No dated receipt is valid for local contract proof alone. Test output and build artifacts are not provider truth; state-safe observations exclude project/signing secrets, phone/assigned values, callback query, raw bodies, Space/message identity, SDK failures, and billing/customer IDs.                         |
| Rollout and rollback              | Preserve        | No rollout occurred. Rollback is reversion of the coherent local task commit; no external rollback exists. Existing operator rollback procedures remain unchanged.                                                                                                                                                    |
| Lifecycle and archive pointers    | Preserve        | The plan remains active, the SPEC remains proposed, and no completed-history/archive pointer changes until the full sibling ledger reaches terminal disposition.                                                                                                                                                      |
| Documentation audit inventory     | Preserve        | No README file was added or removed; only existing README contents changed, so the tracked inventory/digest remains current.                                                                                                                                                                                          |

## Photon read/import risk review

| Lens                     | Evidence                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Runtime Spectrum and operator mutations remain inside `@bundjil/photon`; the exported `/management` surface owns only read transport/contracts; `@bundjil/infrastructure/photon` owns Alchemy props, state attributes and provider lifecycle; root stack and apps remain disconnected.                                                                                              |
| Implementation quality   | Every public operation takes one Schema-decoded owner request and returns one Schema-decoded result; credentials are lazy and redacted; provider output is decoded as one complete envelope; shared user pagination is exhaustive; stable UUIDs remain physical identities; sensitive semantic values are projected out; mutation handlers fail closed.                             |
| Verification coverage    | Focused Photon tests cover all six read classes, malformed responses, pagination, ambiguity, rate/transient/status policy, unavailable billing, public codec round trips, memory parity, compile-time brands and leak sentinels. The Alchemy harness covers exact adoption, Free/shared service, zero dedicated lines, zero writes and explicit project/line/billing/secret denial. |

## Authorized inventory implementation and inconclusive read

The repository slice adds `bun run infrastructure:inventory`. The executable
validates the fixed authority envelope and stricter read-only two-stage policy
before credential resolution, decodes one `InfrastructureCommandInput`, passes
only branded target Types to one named inventory service, performs two
sequential reads, canonicalizes the result, Schema-encodes a mode-`0600`
artifact and emits an `InfrastructureBoundedReceipt`. No provider write
operation is present.

The 2026-07-24 authority file was ignored under `tmp/proof/**` and validated
before discovery. Closeout inspection found its filesystem mode was `0644`
rather than the Photon runbook's required `0600`, so none of the discovery is
accepted proof. The file was corrected to `0600` for a future rerun, and the
command now rejects non-`0600` or oversized authority files before resolving
credentials. Authenticated Vercel discovery located the candidate Bundjil team
plus the existing agent and proxy projects, but the generic connector was
rejected as an evidence path when its deployment response included account
metadata outside the accepted projection. Photon CLI discovery was restricted
to fingerprints and structural counts: one project, two shared-user records
and zero dedicated lines were observed, while platform/billing shapes were
available. Those observations were not promoted to current truth because the
authority-file precondition failed, they did not traverse the receipt-bearing
command and webhook readback was absent.

The final command preflight then stopped: the local mode-`0600` Vercel bearer
returned `403` on the required current-principal endpoint. Current principal,
complete Vercel metadata, complete Photon metadata/credential custody,
separate-Free-Preview-project availability, two manifest digests and a bounded
receipt therefore remain unresolved. `authorized-read-only-inventory` stays
pending; `remote-state-and-noop-adoption` stays blocked.

### Authorized inventory impact ledger

| Surface                             | Status          | Decision and evidence boundary                                                                                                                                                                                            |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan   | Change required | Record the repository command, authority, inconclusive live attempt, exact unresolved readbacks and downstream block. Keep the SPEC proposed, task pending and plan active.                                               |
| Architecture and docs router        | Change required | Route the cross-provider inventory composition, fixed authority boundary, double read and mode-`0600` artifact through the existing package/quality owners.                                                               |
| Root, app and package READMEs       | Change required | Add the root/package command and its non-claims. App READMEs are preserved because no app imports or invokes infrastructure.                                                                                              |
| Exports and generated references    | Change required | Export only the owned inventory Schema/service/policy contracts from the private root package. No provider client, credential, DTO or generated reference is exposed; generated-reference work is evidenced N/A.          |
| Runbooks and authority              | Preserve        | Existing Vercel/Photon runbooks remain operation owners. The ignored one-run authority validates the fixed contract; it grants reads only and expires with this task. No recurring authority is added.                    |
| Verification journeys and proof     | Change required | The bounded receipt path is implemented, but no accepted live receipt exists because principal readback failed. No deployment, Channel, handset or provider-health claim is made and no historical packet is promoted.    |
| Skills and AGENTS                   | Preserve        | PRD implementer, docs maintainer, Effect client-wrapper and package-structure rules were applied. No recurring gap requires a skill or `AGENTS.md` change.                                                                |
| Lint, config, commands and CI       | Change required | Add root/package inventory commands, `@effect/platform-bun` development runtime and script typecheck ownership. No CI/automation admission or hosted credential is added.                                                 |
| Schemas, services and Layers        | Change required | Add branded target/source/principal/digest contracts, sanitized manifest/artifact codecs, authority task policy, named inventory service and explicit live composition. Existing provider Layers remain transport owners. |
| Tests and fixtures                  | Change required | Add cross-provider memory composition, fixed/task authority rejection, missing identity, canonicalization, artifact round trip, zero-write and phone/project-name/secret leak checks.                                     |
| Receipts and evidence               | Change required | The command can write only an ignored Schema-encoded artifact and bounded receipt. The failed preflight created neither; the task ledger/plan retain the inconclusive attempt without raw account or credential data.     |
| Rollout, rollback and lifecycle     | Preserve        | No rollout or external mutation occurred, so external rollback is N/A. Local rollback is reversion of this repository slice; adoption and later tasks remain closed.                                                      |
| Archive pointers and terminal audit | Preserve        | The plan remains active and no completed/archive pointer changes. The prior five-pass audit remains interim; one fresh formal five-pass audit runs only at terminal SPEC closeout after all tasks complete.               |

### Authorized inventory risk review

| Lens                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Applications do not import infrastructure. The package executable alone composes Vercel metadata reads with Photon management reads; Vercel Git retains deployment/promotion and runbooks retain external operations. Shared Photon state remains observation-only and no mutation operation is reachable.                                                                                                                                                                                                                                      |
| Implementation quality   | Contracts use Schema-derived Type/Encoded values, owner-qualified brands, a named Context service, Config.schema/Redacted credentials, fixed JSON-Schema authority validation, explicit Layers and Schema-encoded file/stdout writes. Photon project names/slugs, phones, assigned numbers, webhook queries, secrets, raw bodies and account metadata are absent from the artifact contract.                                                                                                                                                    |
| Verification coverage    | Infrastructure typecheck, 14 Vitest tests, 11 Alchemy lifecycle tests, package build, Effect language-service diagnostics and full repository verification passed with the documented process-only synthetic Executor configuration. Closeout found and corrected the ignored authority file's `0644` mode; the command now rejects non-`0600` or oversized authority files before credentials. Live proof remains inconclusive because the precondition defect invalidated discovery and the Vercel `403` stopped the receipt-bearing command. |

## Resumed authorized inventory and exact permission gate

The user approved the fixed read-only envelope and bounded credential custody.
Both authenticated principals resolved, then the first Photon project read at
`2026-07-25T14:11:35Z` started the 30-minute window. Existing credentials now
reside only in the root ignored mode-`0600` `.env.local` under the three owning
Config names. No value was printed, logged, copied to a tracked file or retained
in evidence.

The first canonical Preview run exposed one private adapter defect: its
Marketplace route returned `404`. Commit `711a133` replaces that obsolete route
with the environment `contentHint` plus documented installation-resources flow,
decodes both complete envelopes immediately, deduplicates exact hint tuples,
requires one `internalId === storeId` match, maps `partnerId` to the database
identity and fails closed on zero or multiple matches. The focused contract test
adds a mismatched-resource negative case and proves the provider sentinel is not
leaked.

The corrected canonical run still failed closed. Direct bounded diagnostics
showed HTTP `200` for Vercel projects, both projects' domains, environment
metadata and deployments, and for Photon project, platform, shared-user,
webhook, line and billing reads. Each Vercel project has one unique Marketplace
content hint, but the documented installation-resources endpoint returned
`403` with the persisted personal token. The separately authenticated Executor
Vercel connection found one Marketplace configuration and received the same
`connection_rejected` `403` for its resource read. This is the exact external
permission boundary.

The command exited before its required second observation and before artifact or
receipt persistence. No Preview or Production inventory artifact exists; the
blocked stdout capture was deleted because it was not a Schema-valid bounded
receipt. Production was not attempted after the shared Marketplace permission
failure. Component HTTP successes, one configuration, green repository tests
and the blocked status are explicitly rejected as proof by proxy. The task stays
pending, adoption stays blocked, and a new bounded read window plus a principal
that can read the exact installation resources is required. No provider write,
credential refresh/change, deployment, promotion, webhook mutation, send,
billable operation or Production mutation occurred.

### Resumed inventory impact ledger

| Surface                          | Status          | Decision and evidence boundary                                                                                                                                           |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SPEC, tasks and active plan      | Change required | Keep the SPEC proposed and task pending; record the property-level replay, exact Marketplace permission gate, missing second read/artifact/receipt and downstream block. |
| Architecture and READMEs         | Preserve        | The public boundary is unchanged. The correction remains private to the Vercel live Layer; existing architecture and package README already own that adapter.            |
| Exports and generated references | Preserve        | No public contract, export or generated owner changed.                                                                                                                   |
| Runbooks and authority           | Preserve        | Existing read-only runbooks and fixed envelope remain the authority owners. The expired execution is not reusable authority.                                             |
| Verification journeys and proof  | Change required | Record focused adapter proof and the explicit absence of live manifests/receipts. Do not promote diagnostic status/count evidence into provider-boundary completion.     |
| Skills and AGENTS                | Preserve        | PRD implementer, docs maintainer and Effect client-wrapper rules remain sufficient; no recurring instruction gap was found.                                              |
| Lint, config, commands and CI    | Preserve        | The existing command and redacted Config contract remain unchanged. Credentials stay local, ignored and mode `0600`; no hosted credential or CI authority was added.     |
| Schemas, services and Layers     | Change required | Decode Marketplace content hints and installation resources in the owning live Layer, with exact identity matching and safe typed failures.                              |
| Tests and fixtures               | Change required | Update the live fixture to the documented endpoint and add unmatched-resource/leak rejection.                                                                            |
| Receipts and evidence            | Change required | Retain no invalid receipt. Record only redacted status/shape/count evidence and the missing canonical artifact/receipt non-claim.                                        |
| Rollout, rollback and lifecycle  | Preserve        | No external mutation occurred. Local rollback identity is revert of `711a133` and the later ledger commit; adoption remains closed.                                      |
| Archive and terminal audit       | Preserve        | The plan remains active. The formal five-pass audit still runs once only at terminal full-SPEC closeout after every task reaches an honest terminal disposition.         |

## Accepted authorized read-only inventory

The prior installation-resource `403` was a provider/customer API ownership
error, not a missing customer entitlement. Vercel's customer storage catalog
is the supported read surface for the authenticated team. Commit `395d08f`
corrected that adapter. Live deployment evidence then reopened the Vercel
owner twice: `d779b43` admitted current nullable fields and numeric pagination,
and `c5dad50` mapped repository `prod` to provider `production` after the first
Production receipt exposed a zero-deployment false green. Commit `86a1b9a`
then rejected cross-stage environment metadata and Marketplace hints. Root
command correction `67fda39` preserves repository-relative authority and
artifact paths.

The accepted execution is bound to
`86a1b9a341054ccfa5c00250adc473d1ed6bafa3`. Preview digest
`e011bf3fa798142d3a23a5395b82765c5cb12d5673060af531498a10cdb56169`
contains two projects, 48 stage-applicable environment observations, two
project-scoped Marketplace observations and 45 Preview Git deployment
observations. Production digest
`e8b25f3aab1b683775e722b8dc6f963402faea42d0cbec97b8dc3fb56138f3ce`
contains two projects, 45 stage-applicable environment observations, the same
two shared Marketplace observations and 11 Production Git deployment
observations. Both observe the one configured Free/shared Photon project, two
shared users, two webhooks and zero dedicated lines. Each digest came from two
unchanged reads; both manifests and receipts are ignored, mode `0600`,
Schema-valid, fixed-receipt compatible, source/digest-bound and value/leak
scanned.

### Accepted inventory requirement replay

| Requirement                           | Direct observable and expected postcondition                                                                                                                               | Plausible false green rejected                                                                             | Focused command/readback                                                           | Evidence owner and result                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Authority, principal and exact target | Fixed authority/task Schemas, two fresh principal fingerprints and exact two-project plus configured Photon identities gate the reads; no mutation operation is reachable  | Credential/link presence, one successful principal or a valid envelope alone                               | Authority validation, principal readback and canonical command Config              | Ignored authority/receipts and task ledger; passed                 |
| Customer Marketplace identity         | Each stage resolves exactly one customer storage resource per project through content hint + store/configuration/integration/project identity and strips provider secrets  | Provider-only endpoint `403`, CLI display, hint presence or neighbouring env success                       | Focused Marketplace fixture and canonical `/v1/storage/stores` adapter reads       | Vercel live Layer and both artifacts; passed                       |
| Stage isolation                       | Every Preview env target includes `preview`, every Production env target includes `production`; deployment target sets are exactly `preview` and `production` respectively | Relabelled unfiltered inventory or zero Production deployments                                             | Negative two-stage fixture and all-element artifact predicates                     | Vercel env/deployment owners; passed after `c5dad50` and `86a1b9a` |
| Repeated canonical manifests          | Each stage's two reads produce one unchanged digest and one fixed-contract receipt whose detail SHA matches the artifact                                                   | Component HTTP 200, one read, empty/block output or mock suite                                             | `bun run infrastructure:inventory`, Effect Schema decode, AJV, SHA and mode checks | Four ignored evidence files; passed                                |
| Sensitive/write-only safety           | Environment values, credentials, phones, assigned numbers, webhook URLs/query data and raw provider/account objects are absent                                             | Mode `0600` or receipt safety alone proving the referenced artifact safe                                   | Exact credential-value and recursive forbidden-key scans                           | Artifact Schemas and ignored evidence; passed                      |
| Zero mutation and honest gaps         | Both manifests/receipts record `providerWrites:0`; no provider/deployment/billable operation occurred                                                                      | Two observations of one shared identity proving isolation, or deployment metadata proving health/promotion | Command call graph, provider action review and safe topology aggregation           | Task ledger and receipts; passed with explicit non-claims          |

Vercel protection settings remain unread, deployment aliases omitted by the
list API remain unknown, project domains/Marketplace storage remain
project-scoped shared observations, and the authenticated Photon principal
does not expose a separately isolated Preview project in the accepted
manifest. Those are later-task inputs or stop conditions, not inferred facts.
The full repository gate passed Effect diagnostics, every boundary/docs/skills/
authority/controls/verification/HGI-307 policy, 90 tooling tests, formatting,
lint, Knip, all nine typechecks and all fifteen Turbo build/test tasks with only
the documented process-local synthetic Executor fixture and no Executor
request.

### Accepted inventory docs-maintainer impact ledger

| Surface                          | Status          | Decision and evidence boundary                                                                                                                                                                               |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture and docs router     | Preserve        | Existing provider, Effect and verification owners already route the corrected private adapters and proof classes; no durable architecture contract changed.                                                  |
| Root, app and package READMEs    | Change required | Correct the root command invocation and remove stale claims that live Layers had never been read. App READMEs remain unchanged because apps do not import or operate this package.                           |
| Exports and generated references | Preserve        | No public export or generated owner changed; provider clients and raw envelopes remain private.                                                                                                              |
| Runbooks and authority           | Preserve        | The target-owned runbooks and fixed ignored envelope authorized this bounded read only. No standing authority, workflow register or mutation procedure changed.                                              |
| Verification journeys and proof  | Change required | Retain provider readback as two ignored fixed receipts and task-ledger summaries. Do not merge it with deployment, Channel, handset, protection or remote-state proof.                                       |
| Skills and `AGENTS.md`           | Preserve        | PRD implementer, docs maintainer, Effect client wrapper and package structure rules caught no recurring instruction gap.                                                                                     |
| Lint, config, commands and CI    | Change required | Root `infrastructure:inventory` now invokes the package script from repository root. No CI admission or hosted credential was added.                                                                         |
| Schemas, services and Layers     | Change required | Customer storage decoding, current deployment envelope/pagination, repository-to-provider stage mapping and env/hint target filtering remain private to the Vercel live Layer.                               |
| Tests and fixtures               | Change required | The focused contract fixture directly covers secret stripping, customer storage matching, nullable/provenance-free deployment omission, numeric pagination and both stage directions.                        |
| SPEC, tasks and active plan      | Change required | Mark `authorized-read-only-inventory` completed, preserve prior failed/inconclusive attempts as history, and route `remote-state-and-noop-adoption` next.                                                    |
| Receipts and evidence            | Change required | Retain only the fixed authority plus two Schema-valid artifacts and two fixed-compatible receipts under ignored `tmp/proof`; temporary raw CLI/diagnostic captures were removed.                             |
| Rollout and rollback             | Preserve        | No external rollout or mutation occurred, so provider rollback is N/A. Repository rollback is reversion of the five correction commits; ignored evidence remains needed by the next adoption-manifest slice. |
| Lifecycle and archive pointers   | Preserve        | The SPEC and plan remain active with six pending tasks. No completed-plan or archive pointer changes; the single formal five-pass audit remains terminal-only.                                               |

## Accepted remote state and no-mutation adoption

The owner approved one exact Cloudflare/R2 bootstrap plus read-only
Vercel/Photon adoption envelope. The operation created the previously absent
`bundjil-alchemy-state` bucket in Cloudflare account
`f9f94270a4a5af8af7010d891020922d` and one Object Read & Write credential
restricted to that bucket. Its values remain only in ignored mode-`0600`
`.env.local`. The stack uses Alchemy's native S3 state interface with prefix
`bundjil/v1`; it does not reuse the site's Cloudflare state worker or token.

Stage-specific manifests preserve the accepted inventory digests:

- Preview:
  `e011bf3fa798142d3a23a5395b82765c5cb12d5673060af531498a10cdb56169`,
  106 retained resources;
- Production:
  `e8b25f3aab1b683775e722b8dc6f963402faea42d0cbec97b8dc3fb56138f3ce`,
  69 retained resources.

The installed Alchemy beta does not implement `plan --adopt`.
`deploy --dry-run --adopt` supplied the side-effect-free adoption plans. Each
plan contained only the manifest-sized import/update set and no create,
replace, or delete. Authorized `deploy --adopt --yes` then persisted state
while the Vercel and Photon adapters performed metadata reads only. The
post-adoption plans were 106 and 69 no-ops respectively, and two consecutive
`sync --dry-run` executions per stage were unchanged. The native state
readback returned store `s3`, version `5`, one `BundjilInfrastructure` stack,
distinct `preview` and `prod` stages, exact logical-ID sets, completed adoption
status, and zero matches for the four credential values.

### Remote-state/adoption requirement replay

| Requirement or property                 | Direct observable and expected postcondition                                                                                                                                   | Plausible false green rejected                                                                                      | Focused command/readback                                                              | Evidence owner and result                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Dedicated backend and credential scope  | Exact account/bucket readback plus one bucket-only Object Read & Write token; native state reports `s3` v5                                                                     | Reusing the site state worker/token or treating a general Cloudflare credential as bucket scope                     | Cloudflare metadata readback and `infrastructure:adoption-proof`                      | Fixed authority, R2 config owner and ignored receipts; passed                    |
| Manifest identity and retain policy     | Every generated resource retains stage, logical ID, branded physical ID, owner, accepted digest and literal `retain`                                                           | Matching resource count, provider name, or a locally invented DTO                                                   | Manifest Schema round trip plus wrong-stage/ID/digest/name/retain negatives           | `adoption-manifest.ts`, focused tests and ignored manifests; passed              |
| Provider-write-free adoption            | Both dry runs contain zero create/replace/delete; live Vercel/Photon adapters expose GET reads only; receipts record zero provider writes                                      | Calling an import an update without checking the adapter transport, or treating state writes as provider writes     | `deploy --dry-run --adopt`, provider call-graph scan, deploy readback                 | Task ledger and stage receipts; passed                                           |
| Exact remote persistence and isolation  | One state store contains 106 Preview and 69 Production identities under distinct stages with exact stage props                                                                 | Counting state objects without comparing logical IDs/stage, or treating shared Photon identity as isolated projects | Native State list/get plus manifest logical-ID comparison                             | `prove-adoption-state.ts` and both receipts; passed with shared-Photon non-claim |
| No-op and repeated sync convergence     | Post-adoption plans are entirely no-op and two sync dry-runs per stage are unchanged                                                                                           | Successful deploy, a single plan, or neighbouring mock no-op assertion                                              | Alchemy plan and two native sync dry-runs per stage                                   | Ignored stage receipts and this plan; passed                                     |
| Secret/write-only safety                | Manifest/state Schemas contain no secret values and encoded state has zero exact credential matches                                                                            | Mode `0600`, redacted stdout, or a safe receipt proving the referenced state safe                                   | Schema encode plus exact in-memory credential-value scan                              | Adoption proof command and receipts; passed                                      |
| Retain/delete protection and recovery   | All manifest resources are retain-only; provider lifecycle tests reject Vercel/Photon deletion and forbidden Photon mutations; state rollback preserves the bucket/resources   | A manifest label without executable delete denial, or destructive state reset presented as rollback                 | Adoption negatives, 11 Alchemy lifecycle tests and runbook dry review                 | Package tests and Alchemy runbook; passed                                        |
| Retry, pagination and uncertain effects | Adoption performs idempotent metadata reads using the already proved bounded provider read policies; it introduces no provider write retry                                     | Broad retry suite proving a new write path, or state persistence proving provider outcome                           | Existing focused Vercel pagination/Photon retry matrices plus new provider call graph | Provider vertical owners; passed for read-only adoption, no provider-write claim |
| Fixed evidence contracts                | Authority validates before execution; both receipts encode through `InfrastructureBoundedReceipt` and validate against the fixed harness Schema before mode-`0600` persistence | Markdown summary, command exit zero, or receipt shape without referenced artifact digest                            | AJV fixed-contract validation, Effect Schema encode, SHA and mode readback            | Ignored authority/manifests/receipts and task ledger; passed                     |

### Remote-state/adoption docs-maintainer impact ledger

| Surface                          | Status          | Decision and evidence boundary                                                                                                                                    |
| -------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and docs router     | Preserve        | Existing Effect, provider and hybrid-ownership architecture already covers the implementation; no cross-package ownership moved.                                  |
| Root, app and package READMEs    | Change required | Replace stale offline/live-layer claims, add manifest/proof commands, and route operators to the new app-owned runbook.                                           |
| Exports and generated references | Change required | Export the native R2 state Config/Layer, strict adoption manifest contracts and live adoption Layer; no raw client or credential export.                          |
| Runbooks and authority           | Change required | Add the target-owned Alchemy procedure, authority-model route and static register envelope for state/adoption/reconciliation.                                     |
| Verification journeys and proof  | Change required | Route the two ignored fixed receipts without adding a consumer journey or merging provider/state/deployment claims.                                               |
| Skills and `AGENTS.md`           | Preserve        | The repository skills and task map were sufficient; no recurring gap or instruction change was found.                                                             |
| Lint, config, commands and CI    | Change required | Add root/package adoption-manifest and adoption-proof commands; no CI/provider credential or apply admission is added.                                            |
| Schemas, services and Layers     | Change required | Add branded R2 Config with redacted secrets, strict manifest variants, exact provider scopes, native state Layer and explicit read-only live provider graph.      |
| Tests and fixtures               | Change required | Add manifest round-trip and six direct false-green negatives, cross-brand compile fixtures, state redaction, and retain/no-write lifecycle coverage.              |
| SPEC, tasks and active plan      | Change required | Complete `remote-state-and-noop-adoption`, record property-level proof, and route `preview-vercel-configuration-spike` next.                                      |
| Receipts and evidence            | Change required | Retain the authority, two manifests and two fixed-compatible receipts only under ignored mode-`0600` `tmp/proof/**`; terminal output is not the evidence owner.   |
| Rollout and rollback             | Change required | Record the bucket/token bootstrap, state adoption, Git reversion path and create-readback-cutover-revoke credential procedure without destroying state/resources. |
| Lifecycle and archive pointers   | Preserve        | The SPEC and plan remain active with five tasks pending. The prior five-pass checkpoint stays interim; the one fresh formal audit remains terminal-only.          |

No Vercel deployment, promotion, configuration mutation, Photon mutation,
message, Channel, handset, runtime-health, or separately isolated Photon
project claim is made. The next task begins with a fresh bounded Preview
configuration authority/readback, not this adoption receipt. The receipt-bearing
candidate passed the complete repository verification gate, including Effect
language-service diagnostics, all policy/boundary checks, 90 tooling tests,
Knip, nine package typechecks and fifteen Turbo build/test tasks.

## Preview Vercel configuration spike

The provider lifecycle, rollback and immutable Git deployment observation are
accepted. Authenticated readback selected only `bundjil-agent`
(`prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`) under the accepted Bundjil team. The
mode-`0600` authority passed the shared and task-specific fixed contracts before
credentials resolved.

The first live apply found `PVC-001`: Vercel coupled an omitted
`enableProductionFeedback` field and changed it from `null` to `true`. The
operator stopped before drift, restored both feedback fields to `null`, deleted
only the created disposable variable, and proved both project controls clean.
The owner was reopened. The corrected provider now carries
`productionGuard: null` through branded props, attributes, service input,
outward request, complete response decode, state and readback. Focused tests and
the complete repository verification reran before the second apply.

The corrected lifecycle set Preview feedback to `true` while Production stayed
`null`, created one plain Preview-only variable with stable ID
`8jrS3AIVoAvFh0Y3`, converged to plan/sync no-op, induced only Preview feedback
`false`, detected one feedback update with environment no-op, repaired it, and
converged through two unchanged syncs. Rollback then restored both feedback
fields to `null` and deleted only that stable ID. `bundjil-codex-proxy` remained
unchanged throughout. `PVC-002` corrected command precedence after the stored
desired phase produced a false rollback no-op; the accepted command leaves
ordinary desired as the Config default and supplies rollback only as the
process-scoped phase.

After implementation commit `eb11b738b353c59715feb15044ff2a337b7d9084` was
pushed, two decoded deployment-list readbacks returned no matching SHA. A
separate authenticated project read then found no `link` field. This reopened
the owner as `PVC-003`: a branch push cannot prove Vercel Git ownership while
the exact project is unlinked. The correction keeps project-global Git
bootstrap outside the Preview Alchemy Layer, adds a distinct fixed authority
policy covering both environments, requires absent-link/read-after-connect
proof, and preserves exact-link disconnect as rollback. No deployment-create
or promotion call is admitted. After the fixed mode-`0600` authority, focused
negative tests and full repository verification passed, the supported Vercel
Git surface connected only `bundjil-agent`. Immediate Schema-decoded readback
proved GitHub repo ID `1291167731`, owner/repo `crcorbett/bundjil` and
Production branch `main`. Post-link commit
`ee1bcb81a40f61bbe565546851840be2d24dd648` then produced exact Preview
deployment `dpl_E5FCMM66ofzCayNo5niJrhSjtYKR`, observed `BUILDING` and finally
`READY`. No deployment-create, promotion or alias call ran. The mode-`0600`
receipt passed the native and fixed harness Schemas.

| Requirement                      | Direct observable and expected postcondition                                                                                               | Plausible false green rejected                                                                               | Focused command/readback                                    | Evidence owner and current result                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------ |
| Exact target and before identity | Team/project readback resolves one `bundjil-agent`; both feedback fields are `null`; disposable key match count is zero on both projects   | Project link, name match, credential presence, or absence on only one project                                | Authenticated project GET and target-filtered env list      | Fixed authority plus before/rollback readbacks; passed |
| Preview-only reversible scope    | Preview becomes `true` while Production stays `null`; one fixed non-secret Preview env key may change; proxy remains a control             | Trusting the property name, request body, or response without reading Production; `PVC-001` rejected exactly | Complete request/response decode and both-project readbacks | Corrected live adapter and provider contract; passed   |
| Drift and rollback               | Desired becomes true, direct drift false, sync detects/repairs true, rollback restores null; disposable key is deleted by exact created ID | Successful PATCH, ordinary plan, a mock drift test, or key absence without stable-ID cleanup                 | Alchemy plan/deploy/sync plus provider before/after reads   | Native live lifecycle and rollback; passed             |
| Vercel Git deployment ownership  | Exact project link and immutable SHA bind READY Preview deployment `dpl_E5FCMM66ofzCayNo5niJrhSjtYKR`; no promotion ran                    | Existing deployment, unlinked branch push, manual API deploy, state entry, or READY status without Git SHA   | Link readback, Git push, deployment readback by exact SHA   | `PVC-003` corrected; bounded receipt passed            |

### Preview configuration impact ledger

| Surface                          | Status          | Decision and evidence                                                                                                                                                                  |
| -------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and docs            | Change required | Add the separately composed Preview-only configuration graph, keep the adoption graph read-only, and record the Production guard correction here and in the runbook.                   |
| READMEs                          | Change required | Root and package READMEs route the new authority-gated commands and keep current provider evidence out of README scope.                                                                |
| Exports and generated references | Change required | Export named Preview Schemas, services, live/memory Layers and Resources through `@bundjil/infrastructure/vercel`; TypeScript build output remains generated and untracked.            |
| Runbooks and authority           | Change required | The runbook owns plan/apply/drift/repair/rollback and the distinct project-global Git-link bootstrap; separate fixed authorities prevent the Git link from broadening Preview Alchemy. |
| Verification journeys and proof  | Change required | Add stable `BND-J13-preview-infrastructure-convergence`, command mapping, fixed authority policy, bounded ignored receipt owner and direct false-green oracles.                        |
| Skills and AGENTS                | Preserve        | The repository-local implementer, docs, Effect client and package rules were applied; no repeated unowned failure changes the skills or `AGENTS.md`.                                   |
| Lint, config, commands, and CI   | Change required | Add root/package Preview commands and extend the executable verification-policy inventory from twelve to thirteen journeys; no CI workflow or standing external authority changes.     |
| Schemas, services, and Layers    | Change required | Add Preview-literal stage contracts, branded value/key/IDs, safe tagged errors, exact production guard, named operations and isolated live/mock provider graphs.                       |
| Tests and fixtures               | Change required | Add complete-envelope HTTP tests plus native Alchemy no-op/update/drift/uncertain/eventual/retain/rollback tests with Production and secret-leak negatives.                            |
| SPEC, tasks, and plan            | Change required | Accept this task with `PVC-001`, `PVC-002`, `PVC-003`, corrections and property-level proof; route current work to the isolated Photon Preview spike.                                  |
| Receipts and evidence            | Change required | Retain only Schema-valid mode-`0600` redacted authority/receipt artifacts; the accepted receipt binds the exact stable IDs, SHA, deployment, limitations and non-claims.               |
| Rollout, rollback, and archive   | Change required | Live configuration rollback restored the exact prior state; exact-link disconnect restores the earlier Git baseline; the active plan and terminal audit remain open.                   |

The task is accepted. `isolated-photon-preview-spike` is current and may not
reuse this receipt as Photon isolation, secret-custody, signed-ingress, Channel
or handset proof. The formal five-pass audit remains deferred until all SPEC
tasks finish.

## Isolated Photon Preview

`isolated-photon-preview-spike` is in progress. The first repository slice
implements the previously missing binding-custody boundary without performing
a provider mutation. `@bundjil/infrastructure/photon` owns one
`PhotonWebhookBindingSink` operation over decoded
`PhotonWebhookBindingWrite.Type`; it returns only a safe `SecretReference`.
The live Layer encodes exactly the agent's two sensitive Preview Vercel
bindings and decodes the full acknowledgement. The memory Layer retains only
stable IDs and the safe reference.

Cooper has now accepted an existing-number decision: inventory controlled
iMessage-capable E.164 identities by safe fingerprint and reuse the least
disruptive candidate without purchasing or provisioning a new number. Prefer
an unbound test/non-Production identity. A bound identity is eligible only
when Photon proves concurrent isolated-project use without detachment,
reassignment, disablement, or delivery change. Provider exclusivity is a stop,
not permission to move an existing binding. Candidate inventory and capability
readback are current. Two consecutive canonical inventories matched digest
`1d385c6ab7cc669aa31a48b7acb4661ba81f368f279134316cb6478c058be150`.
The authorized `bundjil-preview` creation returned separate project
fingerprint
`37cf2944d0c285636c86324faf46354b6990b2fcfd9fa1981af6d24f05406ce4`
and mode-`0600` credential custody. Photon automatically seeded candidate
`db23193a557af142d3ba0dd0d010e062e1f67928388875bf989369d1c0587ad4`
without a separate user-create call. Preview uses a separate user UUID and
assigned routing identity; fresh source readback retained both original users
and assignments. The provider-seeded candidate is therefore adopted as the
least-disruptive choice.

The redaction finding from the initial ad-hoc decoder is corrected by the
owner-named `PhotonCandidateInventory` service and
`infrastructure:photon-candidate-inventory` command. Native Config/Schema/live
and memory Layers retain only fingerprints, two complete post-bootstrap reads
matched digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`,
and every command failure renders only `{"status":"blocked"}`.

Pushing bootstrap commit
`a8c2672cbf58f4ee04c9a3db29b58710fff92953` produced exact non-Production
Vercel deployment `dpl_9kmc9i6zgZT4nDi1pKmddJUwd6CA`. It reached `READY`;
response-envelope inspection later corrected the first `401` to Vercel
Authentication rather than application signature rejection. Preview webhook
registration then created stable webhook fingerprint
`fd778595f7780dd9cd74a5eb6c467a518e92eebf48668fafda967ee68d709c19`.
The Vercel bulk write committed four sensitive Preview-only metadata
identities, but its acknowledgement failed the complete response contract.
The command therefore retained the mode-`0600` recovery artifact and did not
retry. Immediate decoded metadata readback found exactly one project ID,
project secret, webhook ID, and webhook secret binding. A read-before-write
stop now prevents replay; value convergence remains gated on a new immutable
deployment and valid signed ingress.

The recovery review then found that the binding-file ingress decoded an
encoded JSON secret string as an already decoded `Redacted` Type, and that the
Vercel upsert contract can acknowledge with `200` as well as `201`. The
corrected ingress decodes the string once and immediately redacts it; the live
adapter decodes both documented statuses. One explicit
`signedIngressMismatch` recovery required all four exact Preview metadata
identities, rewrote the same values through the owner sink, returned
`recoveredPendingIngress`, and retained the mode-`0600` artifact. No Photon
create or webhook replay ran.

Because the project has unrelated automation bypasses, none was guessed. One
note-scoped `bundjil-photon-preview-webhook` bypass was created and stored only
in ignored mode-`0600` custody. Its safe fingerprint is
`32f231e1106e391ace5581eb03ed811f7c2659b0a54aab6472728a0e8aa9199e`;
the value and callback query are absent from receipts.

Corrected commit `2436ddbd04ef07015fff7b1d1e4d68a03a65d5b6`
produced READY non-Production deployment
`dpl_C8Wrg6fKK5ztsTonQuFZcN8TXLWo`. A protected valid-signature unsupported
event returned exact `204` without redirect or body; this proves the recovered
webhook ID/secret without Channel dispatch or outbound SDK acquisition.

Stable cutover then created a second temporary webhook with fingerprint
`d24567746bb03623f86e5f8b3d43449dc56a6cb374788c482e1fcab56b35913b`.
Readback found two total webhooks. Explicit `stableCallbackCutover` rebound the
new ID/secret and returned `cutoverPendingIngress`; both exact webhooks and
mode-`0600` artifacts remained available for rollback.

Commit `8089076fa7282f97878042a484f4ce033d9aa9e9` produced READY
non-Production deployment `dpl_7F5K7LBqM9vjJsX29vWZB7btp75y`. Protected
valid-signature unsupported-event probes against its immutable URL and stable
branch alias each returned exact `204` with no redirect or response body. A
fresh stable probe passed after the documented roughly 3.5-minute retry
horizon. Cleanup then deleted only the old callback by exact URL, and fresh
readback found one stable callback at fingerprint
`d24567746bb03623f86e5f8b3d43449dc56a6cb374788c482e1fcab56b35913b`.
Two post-cutover candidate inventories matched digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`
with source and Preview bindings unchanged. The stable ID/secret now remain
only in ignored mode-`0600` `.env.local` and Vercel's sensitive Preview
environment; both temporary binding artifacts and the retired signing secret
were removed after exact cleanup readback.

### Binding-custody requirement replay

| Material requirement                              | Direct observable and expected postcondition                                                                                                                                                                                                                                                                                                       | Plausible false green rejected                                                                                                                                                                        | Focused command and evidence owner                                                                                                                            | Result                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Owner-specific Effect boundary                    | The exported service has one named operation receiving one decoded composite write and returning `SecretReference`; safe tagged errors carry retry and certainty. No raw client, callback, URL, primitive ID/value parameter or provider result crosses the boundary.                                                                              | A generic secret callback, a pair of primitive parameters, or an exported Vercel client could pass a happy-path test while violating ownership.                                                       | Infrastructure typecheck and boundary scan; `src/photon/webhook-binding.ts` plus package export map.                                                          | Passed.                                                                                                                             |
| Exact outward encoding and acknowledgement decode | The HTTP contract tests observe one POST with `teamId`, `upsert=true`, exactly four `sensitive` Preview entries for project and webhook ID/secret, with values only at the encoded request boundary; documented `200                                                                                                                               | 201` responses are decoded and projected immediately.                                                                                                                                                 | A neighbouring Vercel setting test, request-count assertion, two webhook-only entries, or accepting only create status `201` would not prove the upsert path. | `bunx vitest run test/photon-webhook-binding.test.ts`; live adapter, focused test and owner-sink recovery receipt own the evidence. | Passed for repository and live recovery acknowledgement. |
| Secret-safe state and result                      | Memory snapshots and live results contain stable identities and one safe reference; leak sentinels are absent from snapshots, errors and outward results.                                                                                                                                                                                          | Redaction in console output alone would not prevent a secret entering state or a receipt.                                                                                                             | Focused codec/leak tests plus `Inspectable` scans; production Schemas own both forms.                                                                         | Passed.                                                                                                                             |
| Timeout-after-write certainty                     | The forced timeout commits one binding, returns `readbackRequired`, and a retry by the same composite identity returns the existing reference with write count exactly one.                                                                                                                                                                        | A second successful write or a test that merely catches an error could hide duplicate persistence.                                                                                                    | Memory timeout test and write-count control.                                                                                                                  | Passed.                                                                                                                             |
| Vercel partial failure                            | A forced partial acknowledgement records no converged binding and returns uncertain outcome; live response-contract failure retained the recovery artifact, while immediate metadata readback found four exact Preview-only identities and no replay ran.                                                                                          | Treating the webhook-ID half, four metadata identities, or provider-side commit as value convergence would lose the only recovery copy and overclaim runtime configuration.                           | Memory/HTTP partial-failure tests plus dated binding receipt and exact metadata readback.                                                                     | Passed; later immutable signed proof resolved the uncertain value state before artifact cleanup.                                    |
| Retry compound policy                             | Photon create is attempted once. An uncertain create receives at most three exponentially backed-off, jittered exact-URL observations and is never replayed. Vercel recovery requires a direct signed mismatch, an explicit recovery literal and all four exact metadata identities; it retains the only source artifact pending deployment proof. | Labelling every failure `backoff`, retrying non-idempotent webhook create, or allowing a generic invocation to overwrite existing Vercel bindings would hide duplicates or destroy recovery evidence. | Exact register/list/delete counts, schedule inspection, partial/conflict tests, blocked default replay and explicit live recovery receipt.                    | Passed; stable signed ingress, full retry drain and exact old-callback cleanup supplied the value and lifecycle oracles.            |
| Isolation gate                                    | Two matching fingerprint-only inventories prove the source binding. Separate Preview creation auto-seeded one concurrent user with a distinct project, user UUID and assigned routing identity; fresh source readback remained unchanged. The provider-seeded candidate is adopted without another user write.                                     | Provider credentials, historical shared users, an earlier shared-project Preview receipt, availability alone, or successful user creation without source readback cannot prove isolation.             | Sanitized candidate/provider inventory, exact before/after binding readback and `docs/verification/alchemy-photon-preview-isolation-2026-07-25.md`.           | Passed for project/user isolation and stable callback lifecycle; the real Channel conversation remains open.                        |

Focused boundary review found `IPP-BC-001`: the safe tagged error initially
used an inline `Schema.NonEmptyString` message field. The boundary audit
rejected that plausible locally typed false green. The owning contract now
exports `PhotonWebhookBindingFailureMessage`, the error reuses it, and the
boundary, Effect-language-service and focused package gates reran and passed.
The exact corrected candidate then passed full `bun run verification`: 90
tooling tests, type-aware formatting/lint, lint fixture, Knip, all nine
workspace typechecks, 29 infrastructure Vitest tests, 14 Alchemy lifecycle
tests, all other workspace tests/builds, and every docs/skills/authority/
controls/verification-policy gate.

### Isolated Photon Preview impact ledger

| Surface                          | Status          | Decision and evidence                                                                                                                                                                   |
| -------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and docs            | Change required | Record the infrastructure-owned cross-provider custody boundary, provider-seeded isolation truth and fail-closed inventory owner while keeping Photon mutation private.                 |
| READMEs                          | Change required | Photon README routes the new read-only candidate command; root and infrastructure README purpose/boundary maps remain accurate and are preserved.                                       |
| Exports and generated references | Change required | Export binding contracts through infrastructure and candidate-inventory contracts through Photon management; generated build output remains untracked.                                  |
| Runbooks and authority           | Change required | The Photon runbook, refreshed `photon-management` register record, current task, direct source-thread approval and dated receipt bind exact scope, stops and rollback.                  |
| Verification journeys and proof  | Change required | Route the dated project/user isolation and stable-callback receipts; `BND-J11` still requires one exact approved real Channel conversation and repository tests are not Channel proof.  |
| Skills and AGENTS                | Preserve        | The repository PRD, docs, Effect-client and package-ownership rules were applied; no repeated unowned failure changes the skills.                                                       |
| Lint, config, commands and CI    | Change required | Add candidate inventory plus Preview webhook register/bind commands and typed Config inputs; workflows and CI authority remain unchanged.                                               |
| Schemas, services and Layers     | Change required | Add the binding sink, four-value decoded owner write, fail-closed binding command, and fingerprint-only candidate inventory service with explicit live/memory Layers.                   |
| Tests and fixtures               | Change required | Extend binding lifecycle coverage to four exact values and add bounded uncertain-create observation, preservation, no-delete, no-replay, malformed/leak and cross-selection tests.      |
| SPEC, tasks and plan             | Change required | Keep the task in progress; record project/user isolation, stable signed ingress, retry drain, exact cleanup, approved-conversation gate and terminal-only audit.                        |
| Receipts and evidence            | Change required | Route separate sanitized isolation and webhook-binding receipts; retain only fingerprints, metadata identities, limitations, non-claims and rollback identity.                          |
| Rollout, rollback and archive    | Change required | Retain the Preview project/user/stable webhook; rollback protects adopted users and removes only exact rollout-created identities after readback. Temporary cutover artifacts are gone. |

Fresh autonomous-origin preflight found no provider route from the adopted
registered sender: Sendblue's authenticated line fingerprint differed, and the
local Messages start identity was another existing controlled candidate.
Cooper approved one exact Preview-only adaptation for that candidate. Before
mutation, require fresh shared availability and unchanged source binding; then
create one temporary rollout-owned Preview user while preserving the adopted
user. Use only its assigned routing identity for one genuine Messages-origin
journey, run the same-event provider retry, outbound, typing and delivery
oracles, wait through the retry drain, and delete only that exact temporary
user. Final source and Preview inventories must restore the one-adopted-user
topology. A moved source binding, duplicate/ambiguous user, or uncertain create
or delete remains a stop.

Do not synthesize an identity, guess a recipient, or use the shared source
project to manufacture proof. Until the temporary-user journey and exact
restoration pass, the later stable-binding/no-op/drift/rollback matrix remains
dependency-blocked rather than falsely accepted.
The selected user is adopted; no later slice may delete it, add a second user,
or weaken source readback. The terminal five-pass audit remains deferred until
all tasks reach their final disposition.

## Repository-authorized five-pass audit

This 2026-07-24 interim checkpoint audited the first three repository slices on
`codex/alchemy-vercel-photon-infrastructure`: `0a08767`, `43af287`, and
`65f4d7b`, based on `origin/main`
`38a8a3f4cde7b6c519803f233b80b48f079a206d`. It is an interim audit, not the
final SPEC audit. Seven tasks remained pending at that checkpoint, beginning
with `authorized-read-only-inventory`; later provider work does not upgrade
the checkpoint into the terminal audit.

| Pass                                          | Result                      | Exact evidence and corrections                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Ownership and call graph                   | Passed                      | Executable import/export scans showed only `alchemy.run.ts` and `stacks/bundjil.ts` consume the infrastructure root; applications do not. `@bundjil/infrastructure/vercel` owns Vercel metadata-only services/resources, `@bundjil/photon/management` owns Photon read transport/services, and `@bundjil/infrastructure/photon` owns Alchemy observation resources. App runbooks retain Vercel Git deployment, promotion and rollback. Implemented resources retain and fail closed. Stage brands exist, but separate live Preview/Production state and credentials remain unimplemented and unclaimed.  |
| 2. Effect and provider implementation quality | Passed                      | Source and rejection scans confirmed Schema `Type`/`Encoded` contracts, owner-qualified brands, named `Context.Service` operations, `Config.schema` with `Redacted` secrets, constant live/memory Layers, Schema tagged errors, `Match` policy and named flat Effects. No raw client/callback export, unsafe cast, manual JSON, DTO mirror export, primitive semantic public service contract, `switch`, `instanceof`, stringly policy or unowned helper sprawl was found. Private primitive URL helpers remain confined to encoded HTTP adapters.                                                       |
| 3. Lifecycle, state and security correctness  | Passed after correction     | `FPA-003-001` reopened `photon-read-import-vertical`: Photon used bounded exponential retry without the required jitter. The shared retry schedule now uses `Schedule.jittered`, and the negative test proves 409 receives one request while 429/503 receive exactly three. Photon typecheck and all 30 tests passed before reclosure. Stable identities, no-write adoption, retain/delete protection, exhaustive pagination, foundation timeout-after-write/eventual-consistency/partial-failure recovery, safe secret-state variants and fail-closed destructive/billable operations otherwise passed. |
| 4. Verification and adversarial coverage      | Passed                      | Effect language-service; boundary, docs, skills, authority, controls and verification-policy audits; 89 tooling tests; type-aware lint and lint tests; Knip; all nine workspace typechecks; infrastructure’s 10 Vitest and 11 Alchemy lifecycle tests; Photon’s 30 tests; both package builds; and `git diff --check` passed. The matrix covers malformed envelopes, cross-brand compile failures, ambiguity, pagination, leak sentinels, uncertain writes, eventual consistency, no-write adoption and fail-closed deletion.                                                                            |
| 5. Documentation, authority and closeout      | Passed for repository scope | The SPEC, task ledger and this plan now own the explicit five-pass contract, executed evidence, corrected finding, repeated final-closeout requirement, limitations, rollback and non-claims. Architecture/README/runbook/authority/verification owners were inspected and preserved because their executable boundaries did not change. No credential, provider read/write, deployment, webhook, billable action, push or merge occurred. The full repository gate must pass on the exact audit-correction candidate before its local commit.                                                           |

### Five-pass correction impact ledger

| Surface                           | Status          | Decision and proof boundary                                                                                                                                                                                                         |
| --------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC, task ledger and active plan | Change required | Add the explicit ordered five-pass contract, executed interim evidence, `FPA-003-001`, task reclosure, seven-task external gate and mandatory final repetition. Keep the SPEC proposed, ledger in progress and plan active.         |
| Architecture and docs router      | Preserve        | `docs/README.md` and the three routed architecture owners already describe the executable package, Effect and verification boundaries. This audit changes acceptance accounting, not durable architecture.                          |
| Root, app and package READMEs     | Preserve        | Existing READMEs already map the root, infrastructure and Photon exports and non-claims. No public export, command, app route or procedure changed.                                                                                 |
| Exports and generated references  | Preserve        | No export or generated-reference surface changed. The Photon retry correction remains private to the live management Layer.                                                                                                         |
| Runbooks and authority            | Preserve        | App-owned Vercel and Photon runbooks remain the operation owners. No new authority envelope was materialized because this checkpoint performed repository inspection only.                                                          |
| Verification journeys and proof   | Preserve        | Existing journeys and fixed proof contracts remain current. Local audit output is repository proof only and is not retained as provider, deployment, Channel or handset evidence.                                                   |
| Skills and AGENTS                 | Preserve        | The existing prd-implementer, docs-maintainer, effect-client-wrapper and package-structure rules were applied. No repeated unowned failure justified changing skills, mirrors or `AGENTS.md`.                                       |
| Lint, config, commands and CI     | Preserve        | Existing commands and controls detected no new static exception. No workflow, boundary exception, credential, state or CI authority changed.                                                                                        |
| Schemas, services and Layers      | Change required | Add jitter to the existing shared Photon retry policy; no public Schema/service signature or Layer graph changes.                                                                                                                   |
| Tests and fixtures                | Change required | Strengthen the existing Photon failure fixture with exact request-count assertions for non-retryable 409 and bounded retryable 429/503. Fixture ownership and lifecycle remain with `packages/photon/test/management-read.test.ts`. |
| Receipts and evidence             | Preserve        | No dated provider receipt is created. The task ledger and plan are the canonical implementation-intent/evidence owners for this interim audit.                                                                                      |
| Rollout, rollback and lifecycle   | Preserve        | No rollout occurred. Rollback is reversion of the audit-correction commit; external rollback is N/A. The final five-pass audit remains mandatory in `drift-ci-monitoring-and-closeout`.                                             |
| Documentation audit inventory     | Preserve        | No `docs/**` or README path was added, moved or removed, and no harness epoch changed. Existing inventory/digests remain current.                                                                                                   |

## Authority and stop conditions

- This plan records repository intent and prior task-scoped external authority;
  it grants no future provider operation.
- Provider inventory, remote state bootstrap, secret access, Vercel apply,
  Photon mutation, deployment, promotion, rollback, message, or handset proof
  requires the exact later task, target-owned runbook, and current authority.
- Stop on physical identity ambiguity, Preview/Production crossover, a
  create/replace/delete during adoption, secret or personal data in state,
  unavailable rollback, uncertain provider outcome, or evidence-class
  overclaim.

## Completion

The plan completes only after every sibling dependency reaches an honest
terminal disposition, the SPEC acceptance criteria are reconciled, every task
has evidence for its applicable stable invariant IDs and three risk lenses,
every material requirement has a direct property-level replay with its
false-green oracle and evidence owner, the fixed structured artifacts validate
at their owning boundaries, the one fresh formal five-pass audit runs against
the integrated terminal result and closes every finding at its earliest owner,
and exact Git identity and verification evidence are recorded. This is not a
comparative harness campaign. A pass/worker/command count or successful local
plan is not completion.
