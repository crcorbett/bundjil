---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-07-28
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
record zero transport writes. `isolated-photon-preview-spike` is now the
current task. Its project/user isolation and stable callback lifecycle are
proved. Fresh Messages and candidate inventory correct the current boundary:
accepted Photon traffic is inbound-first on the source project, while the
retained isolated Preview user belongs to a different Apple identity than the
current Mac. Exact rollback restored the original one-user, one-webhook
topology and canonical inventory digest. The next proof requires the
device/account owning the retained Preview identity, or an explicit product
choice between Preview topology reconfiguration and a provider-supported
non-disruptive cross-project reference. No cold outbound retry, support
contact, upgrade or mutation is the standing next step. A bounded 2026-07-28
Computer Use inspection confirmed Sendblue and source Photon directly in
Messages, the current Mac's iMessage start identity, and the absence of the
retained Preview conversation. The exact identity gate failed before
composition, so no message was typed or sent and no duplicate count was
observed. Cooper's 2026-07-29 product decision now requires that same current
Mac sender in both separate Photon projects with distinct assigned
destinations and isolated webhooks. Fresh provider readback must prove current
duplicate cross-project support without changing the source binding before any
Preview send.

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

That adaptation created one temporary Preview user only after fresh source and
adopted-binding readback, then registered one query-controlled proof callback.
Exact source `9f40dc44ae96433828d6b37bec87cf853c8d3523` produced READY deployment
`dpl_4BjAP2bNCAyoc44y4SRgNiJin8TP`, and its branch alias accepted the
valid-signature unsupported-event probe with an empty `204`. The full assigned
route stayed in process custody and matched its approved fingerprint, but
Messages advertised only SMS. The native `iMessage` service path was then
queried through AppleScript and JXA with bounded timeouts; neither returned a
service count or buddy. System Settings readback proved the actual `node`
invoker already had only Messages Automation enabled. ChatGPT's separate
Messages toggle was off, was not the bounded invoker, and was not changed. No
message was sent and no Photon callback, Eve dispatch, response or typing
oracle ran. Rollback restored the stable four-value Vercel binding and produced
READY deployment `dpl_4aa6EGdJ7NTnYQjBDdKgJj2HjPNR` from exact source
`fd630e98e18207c9765d7e4854e14dc1d2e29f90`. Stable-alias signed probes
returned empty `204` responses before and after a drain longer than the
documented approximately 3.5-minute retry horizon. Cleanup then deleted only
the proof callback and exact rollout-created temporary user. Two final
canonical inventories matched original digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`,
preserved both source bindings and the adopted Preview binding, and restored
one Preview user plus one stable webhook. Temporary mode-`0600` artifacts were
removed; stable custody remains in ignored `.env.local` and Vercel sensitive
Preview metadata.

Do not synthesize an identity, guess a recipient, use SMS, or use the shared
source project to manufacture proof. Until exact restoration passes, the later
stable-binding/no-op/drift/rollback matrix remains dependency-blocked rather
than falsely accepted. The adopted user must not be deleted or changed; only
the exact rollout-created temporary user may be removed after drain and
readback. The terminal five-pass audit remains deferred until all tasks reach
their final disposition.

The following 2026-07-26 outbound-first attempt is retained as historical
execution evidence. Its then-current capability diagnosis and next step are
superseded by the 2026-07-28 conversation-topology correction below. The
approved attempt tested whether the Preview project could resolve a direct
Space and send cold outbound to an exact registered recipient, while retaining
the signed inbound callback as the only ingress oracle because Photon webhooks
never echo outbound sends. After fresh
baseline readback, the rollout may recreate only the bounded temporary user and
query-controlled callback, send one uniquely identifiable non-sensitive Photon
message to the registered test recipient, and inspect the resulting exact
conversation through Computer Use. Provider acceptance and Messages appearance
remain insufficient; a reply is allowed only when the composer explicitly says
iMessage, never SMS, and only its signed inbound callback can begin the
Channel/retry/Eve/outbound/typing proof. Full identities, content and
conversation/message coordinates stay in secure process custody. Exact callback
and user rollback remains mandatory whether the handshake succeeds or stops.

That handshake stopped at a narrower provider boundary. Fresh source/adopted
readback passed, one new temporary Preview user and one query-controlled
callback were created, and two post-create inventories matched digest
`e4ab75194439bcf5d61a0ffc8ac2a5eaf3955a807da4dce82bf3a1e8c0a090a4`.
Exact source `d30509172a2810c2a3e27b893dffc63a0fd0c569` produced READY
deployment `dpl_2GPBK8DJqTAc3M6AQrdkjcfCokP4`, whose protected stable alias
returned exact signed `204`.

The scoped SDK acquired and the exact direct Space resolved, rejecting a
missing-client or ambiguous-recipient false green. The one outbound send then
failed with `AuthenticationError`, provider code `internalError`, transport
status `7` (`PERMISSION_DENIED`) and `retryable=false`. It was not retried.
Messages readback found no exact conversation for the assigned route, so no
iMessage reply was entered or sent and the signed inbound/Eve/response/typing
oracles did not run.

Stable values were rebound before cleanup. Exact rollback source
`fdba650e66854bd12f70c0b4e6c01e741f310aee` produced READY deployment
`dpl_4bsT55Mgt52JEswwzzTEY3LfWhwN`; signed stable-alias probes returned
empty `204`, with the final readback beyond the retry horizon after rebind.
Cleanup deleted only the exact proof callback and temporary user, removed three
temporary custody artifacts, and restored one adopted Preview user, one stable
callback and canonical inventory digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`
with both source bindings unchanged. At the time, the attempted next
prerequisite was an outbound-iMessage-capable isolated credential or provider
correction. The 2026-07-28 correction below supersedes that conclusion; the
task and plan remain open, and the terminal five-pass audit has not run.

The read-only diagnosis recorded on 2026-07-26 rejected a missing dashboard switch,
inactive Free plan, disabled iMessage platform, required dedicated line,
different SDK version and different Bundjil adapter as explanations. Photon
documents an allowlist rule for Free/shared sends to registered project users, provided the
registered target exactly matches Apple's iMessage handle. The temporary
Preview user was assigned before the failed send, but the shared transport
still returned `PERMISSION_DENIED`; Photon's management API exposes no
outbound-capability or binding-health flag, and no separate send-enable control
is documented or surfaced in the authenticated dashboard flow. That diagnosis
then routed the next step to debug-line validation and Photon support. The
2026-07-28 correction below supersedes support as the standing next step. A
Business upgrade, dedicated line, credential rotation or project recreation is
not justified by the current evidence. The read-only receipt is
`docs/verification/alchemy-photon-outbound-permission-diagnosis-2026-07-26.md`.

### Outbound-first handshake impact ledger

| Surface                          | Status          | Decision and evidence                                                                                                                                                        |
| -------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and docs            | Change required | SPEC and plan now separate SDK/Space resolution, provider send acceptance, Messages conversation activation and signed inbound ingress.                                      |
| READMEs                          | Preserve        | Existing Photon and agent README owner/command maps remain accurate; exact operation and limitation stay in the runbook and proof owner.                                     |
| Exports and generated references | Preserve        | No package boundary or generated reference changed; the attempt used the existing Photon client and management services.                                                     |
| Runbooks and authority           | Change required | The runbook already owns the outbound-first stop conditions; this plan records the exercised Preview-only authority and provider denial without broadening it.               |
| Verification journeys and proof  | Change required | The native-origin receipt records the denial/rollback; the read-only diagnosis records the registered-target contract, topology comparison, support boundary and non-claims. |
| Skills and AGENTS                | Preserve        | PRD, docs, Effect-client, package-ownership and Computer Use contracts were applied; no reusable process defect requires instruction changes.                                |
| Lint, config, commands and CI    | Preserve        | No tracked config, command or CI change occurred. Secure process-only values and existing mode-`0600` custody were used and removed as required.                             |
| Schemas, services and Layers     | Preserve        | Existing decoded Photon identities, private SDK boundary, named management operations and live Layers handled the attempt; no new DTO or escape hatch was added.             |
| Tests and fixtures               | Preserve        | No repository code changed. Focused package checks and full verification rerun against the receipt-bearing candidate; provider denial remains provider evidence, not a mock. |
| SPEC, tasks and plan             | Change required | Keep `isolated-photon-preview-spike` in progress at the exact shared-transport trace prerequisite; terminal audit remains deferred.                                          |
| Receipts and evidence            | Change required | Retain fingerprint-safe topology, exact SDK/version path, provider contract, support repair boundary, rollback and non-claims; retain no full identity or message content.   |
| Rollout and rollback             | Change required | One temporary user/callback were created and exactly removed after stable rebind/drain; original digest and one-user/one-webhook topology are restored.                      |
| Lifecycle and archive pointers   | Preserve        | The plan remains active, no archive pointer changes, and the earlier five-pass checkpoint remains explicitly non-terminal.                                                   |

### Photon debug-line corrective verification

The approved Preview-only corrective slice proved the intended Apple handle
through Photon's own debug bot before recreating the temporary user. The bot's
E.164 GUID/address matched candidate fingerprint `82ac258d…4c5`; SMS, an
unverified Messages start identity and a registered-handle mismatch are
therefore rejected.

Two baseline inventories matched digest `9e6108d5…88a3f`. Reconciliation created
one temporary Preview user at fingerprint `104f9ab4…418`, retained the adopted
user and source bindings, and produced two matching post-create inventories at
digest `21f343bc…32e9`. The stable callback was preserved and no Vercel binding
or deployment changed.

The first negative-control call used the assigned Photon shared line as the
direct-Space participant and failed with `ValidationError`, transport status
`3`, `retryable=false`, no provider message identity and zero retries. This
reopened the proof owner: an assigned line is the inbound destination, not the
registered outbound target. The corrected single call used the exact
debug-verified registered Apple handle and reproduced `AuthenticationError`,
`internalError`, status `7` (`PERMISSION_DENIED`) and `retryable=false`. No
provider message identity or delivery exists.

Two post-failure inventories matched `21f343bc…32e9`. Cleanup deleted only the
temporary user, removed its ignored mode-`0600` custody value, and two final
inventories restored `9e6108d5…88a3f`, one adopted Preview user, one stable
callback and unchanged source bindings. The support packet at
`docs/verification/alchemy-photon-outbound-debug-verification-2026-07-26.md`
asks Photon to distinguish and repair project-target binding/allowlist cache,
concurrent-project identity fencing and transport-token authorization. Handle
registration is no longer a live hypothesis. The task remains in progress;
outbound delivery, Channel ingress/replay/Eve/outbound/typing/handset,
Production and the terminal audit remain unclaimed.

### Corrective verification impact ledger

| Surface                         | Status          | Decision and proof boundary                                                                                                                                                                |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture and docs           | Preserve        | No package or runtime graph changed; the target identity distinction is operational proof policy.                                                                                          |
| READMEs and exports             | Preserve        | Public package contracts, exports and commands did not change.                                                                                                                             |
| Runbooks and authority          | Change required | The Photon runbook now names registered Apple handle versus assigned shared line and rejects their transposition. Existing Preview authority was exercised; Production remained untouched. |
| Verification journeys and proof | Change required | Add the debug-handle, negative-control, corrected denial, support packet and exact rollback receipt.                                                                                       |
| Skills and AGENTS               | Preserve        | Repository-local PRD, docs, Effect-client and Computer Use contracts were applied; no reusable instruction defect was found.                                                               |
| Lint, config, commands and CI   | Preserve        | No tracked executable configuration or command changed.                                                                                                                                    |
| Schemas, services and Layers    | Preserve        | Existing decoded management identities and `PhotonClient` boundary performed the reads and single sends; no raw client or DTO escaped.                                                     |
| Tests and fixtures              | Preserve        | Provider truth is retained as a bounded receipt; no local mock can substitute for the denial or delivery.                                                                                  |
| SPEC, tasks and plan            | Change required | Record direct debug proof, identity false green, provider denial, blocked status, support prerequisite and terminal-audit non-claim.                                                       |
| Receipts and evidence           | Change required | Retain fingerprints, timestamps, safe codes, digests, support question and non-claims; retain no full identity, secret or message.                                                         |
| Rollout and rollback            | Change required | Exactly one temporary user was created and removed; original digest and one-user/one-callback topology were restored twice.                                                                |
| Lifecycle and archive pointers  | Preserve        | The plan stays active and the formal five-pass audit remains terminal-only.                                                                                                                |

### Corrective slice review lenses

| Lens                                  | Result                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph              | Passed                        | Photon management reads/mutations remained in `PhotonManagement`; the corrected message attempt remained in `PhotonClient.sendMessage`; SDK instances and raw credentials stayed private. The app runbook owns the consequential procedure, the receipt owns the observation, and Production was not reached.                                                                                                                                                     |
| Effect and provider quality           | Passed                        | Existing branded identities, redacted Config, decoded service outputs, safe tagged errors, scoped SDK release and explicit live Layers were reused. The tracked diff adds no raw client, callback escape, primitive public contract, DTO mirror, unsafe cast, manual provider reader, switch/instanceof policy or helper sprawl.                                                                                                                                  |
| Verification and false-green coverage | Passed for the blocked result | Direct oracles proved the debug handle, two-pass baseline/create/failure/cleanup topology, assigned-line rejection, exact registered-target denial, zero automatic retries, no provider message identity and final restoration. Photon typecheck/build and 35 tests; Effect LS; boundary, docs, skills, authority, controls and verification-policy checks; leak scans; and `bun run verification` passed. Delivery and downstream Channel claims remain blocked. |

## 2026-07-28 conversation-topology correction

Fresh fingerprint-safe Messages inspection and live candidate inventory
supplied by Cooper reopen the diagnosis within
`isolated-photon-preview-spike`. No provider read, mutation, send, support
contact, deployment or Production operation occurred in this correction.

The named Messages conversation `Bundjil` resolves to Sendblue recipient
fingerprint `6a6a862e…`; it is not Photon. The successful Photon conversation
is unnamed assigned line `d4039779…`, mapped to original/source project
`ad20033f…` and current Mac Apple handle `82ac258d…`. Its transcript and the
accepted 2026-07-22/23 receipts are inbound-first: the registered user sends
first, then Bundjil replies in the provider-created conversation.

The retained isolated Preview user `db23193a…` owns assigned line
`db49756e…` and a different Apple identity. Current Mac identity `82ac258d…`
cannot originate that journey. Its rollout-created temporary Preview route
`0809669f…` was SMS-only, and SMS remains forbidden. The cold outbound-first
Preview call returned `PERMISSION_DENIED`; a source-project cold outbound
attempt had also failed at the shared gRPC boundary on 2026-07-22. These are
valid negative cold-outbound observations, not a general Photon reply outage
or a Preview-only regression.

Current Photon pricing lists direct-messaging API access on Free and Pro
managed-shared tiers, but cold outreach only on Business and Enterprise
dedicated offerings. The registered-user troubleshooting rule is an allowlist
condition, not a guarantee of cold-outbound entitlement. The prior diagnosis
and debug receipts are therefore superseded for current routing while retained
as negative evidence.

The exact Preview proof is now inbound-first from the device/account owning the
Apple identity registered to user `db23193a…`, sent from an explicitly
iMessage-labelled composer to assigned line `db49756e…`. The resulting signed
Preview callback remains the only entry to the replay/Eve/outbound/typing
journey. Sendblue, the source Photon conversation, current Mac identity, the
SMS-only temporary route, direct-Space resolution, cold outbound invocation
and synthetic callbacks are rejected false greens.

The least disruptive next operator path is the device/account owning the
retained Preview identity. If it is unavailable, the product owner must choose
one of two alternatives before mutation: reconfigure isolated Preview around
an operator-originable controlled identity with full adoption/isolation and
rollback proof; or ask Photon to confirm a non-disruptive duplicate
cross-project assignment/reference. No support contact, upgrade, line
purchase, credential rotation, project recreation or topology change follows
automatically.

### Conversation-topology requirement replay

| Requirement              | Direct observable and expected postcondition                                                                                                                         | Plausible false green rejected                                                                             | Focused command/readback                                                                   | Evidence owner and result                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Conversation ownership   | Supplied Messages mapping separates Sendblue `6a6a862e…`, source Photon `d4039779…`, and isolated Preview `db49756e…`; exact provider/channel owner remains distinct | Conversation display name or a neighbouring accepted receipt                                               | Fresh Messages mapping plus live fingerprint-only candidate inventory                      | `docs/verification/alchemy-photon-conversation-topology-correction-2026-07-28.md`; passed for classification |
| Direction and capability | Accepted transcripts show inbound user first and agent reply second; pricing separates managed-shared direct messaging from dedicated cold outreach                  | Treating “direct messaging” or a registered-user allowlist as cold-outbound entitlement                    | Accepted 2026-07-22/23 receipts plus current pricing/troubleshooting/deliverability review | Correction receipt; passed for current policy boundary                                                       |
| Preview origin           | Device/account owning retained Preview user `db23193a…` sends iMessage to `db49756e…`, producing one signed Preview callback                                         | Current Mac `82ac258d…`, source conversation, SMS-only `0809669f…`, outbound SDK call or synthetic webhook | Future exact identity readback and explicitly iMessage-labelled inbound journey            | Blocked pending operator identity/product choice                                                             |
| Negative-send retention  | `PERMISSION_DENIED` remains addressable with exact zero-retry and rollback evidence                                                                                  | Recasting it as ordinary reply failure, Preview regression or provider repair mandate                      | Superseded receipts plus final restored inventory digest                                   | Passed as negative cold-outbound evidence                                                                    |
| Safety and lifecycle     | One adopted Preview user, one stable callback and unchanged source bindings remain the rollback baseline                                                             | Support, upgrade or topology mutation inferred from documentation work                                     | Existing two-read restored inventory; no provider operation in this slice                  | Passed; terminal audit remains deferred                                                                      |

### Conversation-topology docs-maintainer impact ledger

| Surface                                   | Status          | Decision and proof boundary                                                                                                                                                        |
| ----------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and durable docs             | Preserve        | Runtime ownership and Effect/provider graphs did not change; the correction belongs to current SPEC intent, operational proof procedure and dated evidence.                        |
| READMEs, exports and generated references | Preserve        | No public contract, export, command or generated API changed.                                                                                                                      |
| Runbooks and authority                    | Change required | Replace cold-outbound bootstrap with the exact inbound-first Preview identity oracle and explicit product-decision stop. Existing authority does not trigger a provider operation. |
| Verification journeys and proof           | Change required | Add the correction receipt, preserve negative denied-send receipts as superseded evidence, and reject cross-channel/source/SMS/cold-send proof by proxy.                           |
| Skills and AGENTS                         | Preserve        | Existing PRD/docs ownership and proof contracts detected the correction; no reusable workflow defect requires a skill change.                                                      |
| Lint, config, commands and CI             | Preserve        | Documentation-only correction changes no executable configuration or workflow.                                                                                                     |
| Schemas, services and Layers              | Preserve        | No provider adapter or service contract changed.                                                                                                                                   |
| Tests and fixtures                        | Preserve        | Repository tests cannot prove conversation ownership; accepted receipts and supplied live evidence own the claim. No fixture changed.                                              |
| SPEC, tasks and plan                      | Change required | Reopen the current diagnosis, record the inbound-first oracle, exact operator choice, false greens and terminal-audit non-claim.                                                   |
| Receipts and evidence                     | Change required | Add one current correction receipt; mark the two overbroad diagnosis receipts superseded while preserving their negative observations and exact successor.                         |
| Rollout and rollback                      | Preserve        | No rollout occurred. The existing one-user/one-callback restored digest remains the rollback identity.                                                                             |
| Lifecycle and archive pointers            | Change required | Route current diagnosis through the correction receipt; keep the plan active and formal five-pass audit terminal-only.                                                             |

### Correction review lenses

| Lens                                  | Result                                 | Evidence                                                                                                                                                                                                                                                      |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph              | Passed                                 | SPEC/task/plan own current intent; `apps/agent/runbooks/photon.md` owns the repeatable procedure; dated receipts own observed conversations and denied sends. Sendblue, source Photon and isolated Preview are distinct.                                      |
| Effect and provider quality           | N/A with evidence                      | No code, Schema, Config, Service, Layer, SDK boundary or outward request changed. Existing `PhotonClient` remains private and the denied send is not retried.                                                                                                 |
| Verification and false-green coverage | Passed for the corrected blocked state | Direct evidence maps each conversation and direction, current pricing distinguishes cold outreach, the runbook rejects SMS/source/Sendblue/outbound/synthetic substitutes, and exact rollback remains retained. The genuine Preview journey remains unproved. |

Repository closeout decoded both changed JSON owners and passed docs,
verification-policy, authority, controls, skills, Effect language-service and
boundary checks. The first full verification rerun correctly stopped at the
absent Executor build endpoint. The accepted rerun used only the documented
process-local synthetic Executor URL/key fixture, made no provider request, and
passed HGI-307, 90 tooling tests, type-aware format/lint, the lint fixture,
Knip, all nine workspace typechecks and all fifteen Turbo build/test tasks.
This is repository proof only; it does not upgrade the blocked Preview journey.

## 2026-07-28 bounded Messages UI gate

Cooper authorized the bundled Computer Use plugin to inspect Messages and send
one inbound-first Preview message only if the exact Preview sender, exact
assigned recipient, and iMessage transport were all proven. The bounded
inspection confirmed the `Bundjil` conversation as Sendblue recipient
`6a6a862e…`, the unnamed source Photon conversation as `d4039779…`, and both
existing composers as iMessage. The Messages debug-bot row identified the
current Mac start identity as `82ac258d…` on the iMessage service.

The retained Preview conversation was absent from the visible inventory, and
current Mac identity `82ac258d…` still differs from the identity registered to
retained Preview user `db23193a…`. The exact sender and recipient gates
therefore failed before composition. No text was typed, no message was sent,
no SMS or cold outbound path was used, and no reply, delivery, or duplicate
count exists for this observation. The Messages search was cleared after
inspection. No Photon, Vercel, credential, user, callback, deployment,
Production, or support operation occurred.

### Messages gate requirement replay

| Requirement                   | Direct observable and expected postcondition                                                                 | Plausible false green rejected                                                           | Focused command/readback                                                  | Evidence owner and result                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Conversation ownership        | Details resolve `Bundjil` to Sendblue `6a6a862e…` and source Photon to `d4039779…`                           | Display name, iMessage label, or neighbouring accepted reply treated as isolated Preview | Computer Use conversation search, details, and composer inspection        | `docs/verification/alchemy-photon-preview-messages-ui-gate-2026-07-28.md`; passed for classification |
| Exact sender                  | Current start identity must equal the identity registered to Preview user `db23193a…`                        | Any controlled Mac identity or source-project identity treated as interchangeable        | Computer Use debug-bot row plus retained fingerprint-only inventory       | Failed safely: current identity is `82ac258d…`                                                       |
| Exact recipient and transport | Selected recipient must be `db49756e…` and its composer must say iMessage                                    | Source `d4039779…`, Sendblue, missing conversation, SMS, or uncertain recipient          | Computer Use visible conversation inventory and exact composer inspection | Failed before composition: retained Preview conversation absent                                      |
| Message and duplicate proof   | One admitted event yields bounded delivery and duplicate observations                                        | Recording zero duplicates when no event was admitted                                     | No-send readback and restored Messages list                               | Not admitted; no message or duplicate count                                                          |
| Safety and rollback           | No external mutation; Messages returns to ordinary list; existing restored provider digest remains unchanged | UI inspection treated as provider readback or topology proof                             | Search clear and final no-send state                                      | Passed for repository/UI scope only                                                                  |

### Messages gate docs-maintainer impact ledger

| Surface                                   | Status          | Decision and proof boundary                                                                                                                                                                                 |
| ----------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and durable docs             | Preserve        | No runtime, package, provider, or Layer graph changed. The SPEC records only the newly observed gate result.                                                                                                |
| READMEs, exports and generated references | Preserve        | No public contract, export, command, or generated API changed.                                                                                                                                              |
| Runbooks and authority                    | Preserve        | `apps/agent/runbooks/photon.md` already requires the exact registered Preview identity, exact assigned line, iMessage composer, and stop on mismatch or SMS. The runbook correctly caused the no-send stop. |
| Verification journeys and proof           | Change required | Add the fingerprint-only Messages UI receipt and route it from the verification index and current correction owner.                                                                                         |
| Skills and AGENTS                         | Preserve        | PRD, docs-maintainer, and Computer Use contracts were applied; no reusable instruction defect was found.                                                                                                    |
| Lint, config, commands and CI             | Preserve        | No executable configuration or workflow changed.                                                                                                                                                            |
| Schemas, services and Layers              | Preserve        | No provider adapter, SDK boundary, Schema, service, or Layer changed.                                                                                                                                       |
| Tests and fixtures                        | Preserve        | Local mocks cannot prove Messages identity or delivery. No event was admitted, so no duplicate fixture or runtime assertion changed.                                                                        |
| SPEC, tasks and plan                      | Change required | Record the direct UI gate, exact no-send result, rejected false greens, and pending operator identity/product choice.                                                                                       |
| Receipts and evidence                     | Change required | Add one dated receipt with safe fingerprints, no-send result, limitations, rollback, and non-claims.                                                                                                        |
| Rollout and rollback                      | Preserve        | No rollout occurred. Existing one-user/one-callback restored digest remains the provider rollback identity; Messages search was cleared.                                                                    |
| Lifecycle and archive pointers            | Change required | Keep the task and plan active, route the new supporting receipt, and defer the formal terminal five-pass audit.                                                                                             |
| Documentation audit inventory             | Change required | The new receipt expands the docs corpus from 192 to 193 paths; recompute the sorted-path digest from the changed tree.                                                                                      |

### Messages gate review lenses

| Lens                                  | Result                        | Evidence                                                                                                                                                                                                                                                                                               |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ownership and call graph              | Passed for the blocked result | Messages UI owns the observed conversation/service state; Photon inventory owns the retained Preview identity mapping; the SPEC/task/plan own current intent; the app runbook owns the stop procedure; the dated receipt owns this observation.                                                        |
| Effect and provider quality           | N/A with evidence             | No code, provider call, SDK boundary, Config, Schema, Service, Layer, adapter, DTO, cast, mapper, helper, or outward request changed.                                                                                                                                                                  |
| Verification and false-green coverage | Passed for the blocked result | Direct UI details separated Sendblue from source Photon, the debug row proved the active iMessage identity, the absent Preview conversation and identity mismatch blocked composition, and the receipt explicitly rejects zero-duplicate, source, Sendblue, SMS, and uncertain-recipient false greens. |

Focused JSON decode, docs inventory digest readback, docs,
verification-policy, authority, controls, skills, Effect language-service,
boundary, and diff checks passed. Full repository verification used only the
documented process-local synthetic Executor URL/key fixture, made no provider
request, and passed HGI-307, 90 tooling tests, type-aware format/lint, the lint
fixture, Knip, all nine workspace typechecks, and all fifteen Turbo build/test
tasks. The same full gate is rerun after this exact receipt-bearing ledger
update before commit. These checks prove repository consistency only; they do
not upgrade the blocked Messages or Preview provider result.

## 2026-07-29 shared-sender, separate-destination decision

Cooper accepted one mandatory topology for `isolated-photon-preview-spike`:
current controlled sender `82ac258d…` remains unchanged in the working
source/Production Photon project and is also registered non-disruptively in the
separate Preview project. Each project has separate credentials, a distinct
Photon-assigned destination, and its own environment webhook. Sending to the
source/Production destination reaches only Production; sending to the Preview
destination reaches only Preview.

Another Apple identity/device is rejected. A single Photon project with both
environment callbacks is rejected because Photon documents that one project
event is delivered to every webhook registered on that project. Official
Photon shared-routing material says inbound ownership is resolved from
destination plus sender; fresh management readback must still prove that the
current API admits the same sender concurrently across projects.

Before mutation, capture full fingerprint-only source and Preview baselines.
Then perform at most one idempotent Preview shared-user create for the exact
sender, immediately re-read both projects, and require an unchanged source
binding plus a distinct Preview destination. Reconcile an uncertain create by
observation, never blind replay. Stop and clean up only the exact
rollout-created Preview resource after drain if the provider rejects duplicate
registration, changes the source binding, assigns SMS-only, or cannot establish
the exact postcondition.

Only after the Messages start identity, exact Preview destination, and
iMessage composer all match may one bounded inbound-first message be sent.
Acceptance then requires signed Preview webhook ingress, exactly one Preview
response, zero Production response, exact same-event duplicate disposition,
and complete post-journey source/Preview readback. A passing stable Preview
binding is retained; Production remains untouched.

### Shared-sender decision requirement replay

| Requirement                   | Direct observable and expected postcondition                                                                                            | Plausible false green rejected                                                               | Focused command/readback                                                                           | Evidence owner and result                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| One sender, separate projects | Sender `82ac258d…` exists in both project inventories while source stable user/destination remain unchanged                             | Availability result, second UUID alone, or source move                                       | Full source/Preview management baselines, one bounded Preview reconcile, immediate double readback | `docs/verification/alchemy-photon-shared-sender-topology-decision-2026-07-29.md`; live proof pending |
| Distinct destinations         | Preview assigned destination differs from source `d4039779…` and resolves as iMessage                                                   | Same destination, missing route, or SMS-only route                                           | Provider user readback plus exact Messages recipient/composer inspection                           | Pending; no send until passed                                                                        |
| Environment isolation         | Preview event names only Preview webhook/environment; Production observes zero response                                                 | Two webhooks in one project, synthetic callback, or aggregate response count                 | Signed callback detail, Preview replay owner, source/Production negative readback                  | Pending                                                                                              |
| Bounded message               | One inbound-first message from `82ac258d…` to exact Preview destination produces one response                                           | Cold outbound, source conversation, Sendblue, another Apple identity, or uncertain recipient | Bundled Computer Use after all gates, followed by provider/runtime readback                        | Pending                                                                                              |
| Lifecycle and rollback        | Successful stable Preview binding is retained; failed/temporary Preview resource alone is removed after drain; source remains unchanged | Blind retry, adopted-user deletion, or Production repair                                     | Before/after stable-ID fingerprints, retry horizon, exact cleanup and two final inventories        | Pending                                                                                              |

### Shared-sender decision docs-maintainer impact ledger

| Surface                                   | Status          | Decision and proof boundary                                                                                                                                                          |
| ----------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture and durable docs             | Preserve        | Existing provider/app ownership remains correct. The accepted topology belongs to SPEC intent, runbook procedure, and dated decision evidence.                                       |
| READMEs, exports and generated references | Preserve        | No public package contract, export, command, or generated API changed.                                                                                                               |
| Runbooks and authority                    | Change required | Replace the prior retained-user-device choice with exact shared-sender duplicate-registration, source-preservation, distinct-destination, isolation, send, and cleanup gates.        |
| Verification journeys and proof           | Change required | Add the decision receipt now and a separate dated live capability/journey receipt after provider execution. Preserve prior no-send and SMS-only evidence.                            |
| Skills and AGENTS                         | Preserve        | PRD, docs-maintainer, Effect client-boundary, and Computer Use contracts cover the work; no reusable instruction change is required.                                                 |
| Lint, config, commands and CI             | Preserve        | No executable policy or workflow changed in this decision slice.                                                                                                                     |
| Schemas, services and Layers              | Preserve        | Existing Photon management and Channel boundaries own the future read/mutation/send operations; no adapter change is yet required.                                                   |
| Tests and fixtures                        | Preserve        | Local fixtures cannot prove live duplicate registration or routing isolation. Existing lifecycle tests remain required before provider acceptance.                                   |
| SPEC, tasks and plan                      | Change required | Record the product decision, direct proof oracle, false greens, authority, stop conditions, and deferred terminal audit.                                                             |
| Receipts and evidence                     | Change required | Add a safe fingerprint-only decision receipt; later retain exact live before/after identities without full numbers, secrets, message content, Space or event IDs.                    |
| Rollout and rollback                      | Change required | Starting rollback remains one adopted Preview user, one stable callback and unchanged source. Future rollback removes only exact rollout-created failed/temporary Preview resources. |
| Lifecycle and archive pointers            | Change required | Keep `isolated-photon-preview-spike` active; preserve earlier receipts as observations and route the new accepted decision.                                                          |
| Documentation audit inventory             | Change required | The decision receipt expands the docs corpus from 193 to 194 paths; recompute the sorted-path digest.                                                                                |

## 2026-07-29 shared-sender live readback and stop gate

Two consecutive authenticated, Schema-owned reads returned the same sanitized
state. Source/Production is Free managed-shared with two unchanged users, zero
actual dedicated lines, and two stable webhooks `2083611d…`/`72cac9b5…`.
Isolated Preview is Free managed-shared with one adopted user, zero actual
dedicated lines, and sole stable webhook `d2456774…`, matching ignored
mode-`0600` custody. Candidate inventory digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`
still maps sender `82ac258d…` to unchanged source destination `d4039779…`,
reports it available, and finds no Preview binding.

The accepted Production receipt classifies the two source callbacks as one
Production callback plus one preserved Preview callback. Because Photon fans
every project event to every project webhook, the required
Production-destination-to-Production-only postcondition cannot currently pass.
The authority for this slice prohibited any source/Production mutation, so the
operator stopped before the otherwise permitted Preview shared-user create.
No provider write, Vercel action, Messages action, callback probe, or message
occurred. Duplicate cross-project registration remains untested.

Two additional read-only deployment-by-URL resolutions directly classify
`2083611d…` as a READY Preview-target callback at Git SHA `a3f8987…` and
`72cac9b5…` as a READY Production-target callback at `e92f8d2…`, both in the
Bundjil agent project. The exact obsolete callback is therefore known without
printing either origin. Current mode-`0600` custody holds isolated Preview
callback `d2456774…`, not `2083611d…`; current Vercel Preview metadata belongs
to the isolated callback, and the local 1Password CLI was unavailable. Because
Photon signing secrets are create-only, stable ID/URL custody cannot provide
exact restoration. Any later retirement requires recovered signing custody or
separate explicit acceptance of irreversible deletion in addition to
source-project mutation authority and traffic/drain proof.

### Live-readback requirement replay

| Requirement               | Direct observable and expected postcondition                                                                         | Plausible false green rejected                                                          | Command/readback and owner                                                                                                            | Result                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Complete project state    | Two matching project-scoped reads expose platform, full users, full webhooks, actual lines, and billing              | Reconciliation summary hard-coded line count or one partial read                        | Photon management services plus candidate inventory; `docs/verification/alchemy-photon-shared-sender-topology-readback-2026-07-29.md` | Passed for inventory                                          |
| Source callback isolation | Source has exactly one Production callback before any Preview user write                                             | Distinct Preview project, available sender, or two source callbacks treated as isolated | Fresh stable-ID/route fingerprints plus accepted Production callback classification                                                   | Failed: source has Production plus preserved Preview callback |
| Callback ownership        | Exact obsolete callback resolves to Preview target while the retained callback resolves to Production target         | Query presence or historical receipt alone                                              | Two Vercel deployment-by-URL resolutions without emitting origins                                                                     | Passed: retire only `2083611d…`; preserve `72cac9b5…`         |
| Retirement rollback       | Create-only signing value exists in approved custody, or irreversible deletion is separately accepted                | Stable ID/URL described as exact signing rollback                                       | Mode-`0600` key/fingerprint audit, current Vercel metadata ownership and 1Password availability check                                 | Failed: secret custody unproved; 1Password unavailable        |
| Preview mutation gate     | Preview create runs only after source isolation is already satisfiable                                               | Exercising mutation merely because it is authorized                                     | Fail-closed runbook gate and zero-write provider readback                                                                             | Passed: mutation not admitted                                 |
| Shared-sender support     | Same sender gains one distinct Preview route without source change                                                   | Availability, prior seeded user, or another Apple identity                              | One future bounded Preview create after callback blocker is removed                                                                   | Not run                                                       |
| Channel journey           | Exact Preview route is iMessage and yields one Preview response, zero Production response, one duplicate disposition | SMS, source reply, synthetic webhook, or aggregate response                             | Future Computer Use and signed provider/runtime readback                                                                              | Not run                                                       |

### Live-readback docs-maintainer impact ledger

| Surface                                   | Status          | Decision and proof boundary                                                                                                          |
| ----------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture and durable docs             | Preserve        | Package/provider ownership is unchanged; the stop gate belongs to current SPEC, runbook, plan, and evidence.                         |
| READMEs, exports and generated references | Preserve        | No public package contract, export, command, or generated surface changed.                                                           |
| Runbooks and authority                    | Change required | Require one source Production callback before Preview mutation and separately authorize exact preserved-Preview-callback retirement. |
| Verification journeys and proof           | Change required | Add the sanitized live-readback receipt and preserve the decision receipt as authority rather than provider truth.                   |
| Skills and AGENTS                         | Preserve        | PRD, docs-maintainer, Effect wrapper, and Computer Use contracts were applied; no reusable guidance defect was found.                |
| Lint, config, commands and CI             | Preserve        | The temporary diagnostic used public Schema-owned services and was removed; no executable surface remains.                           |
| Schemas, services and Layers              | Preserve        | Existing management services supplied the complete reads; no raw client or new boundary was needed.                                  |
| Tests and fixtures                        | Preserve        | Local fixtures cannot prove current provider topology; repository verification still guards unchanged contracts.                     |
| SPEC, tasks and plan                      | Change required | Record the current two-webhook stop result, zero writes, untested duplicate registration, and exact next authority.                  |
| Receipts and evidence                     | Change required | Add one safe fingerprint-only provider receipt; retain no full IDs, URLs, numbers, credentials, or messages.                         |
| Rollout and rollback                      | Preserve        | No rollout occurred; source and Preview topology remained unchanged across matching reads.                                           |
| Lifecycle and archive pointers            | Change required | Keep `isolated-photon-preview-spike` open and defer all dependent tasks and the terminal audit.                                      |
| Documentation audit inventory             | Change required | The live receipt expands the docs corpus from 194 to 195 paths; recompute the sorted-path digest.                                    |

Focused Effect setup, boundaries, docs, skills, authority, controls,
verification policy, Photon typecheck, all 35 Photon tests, Photon build, JSON,
docs-inventory digest, and diff checks passed. Complete repository verification
used only the documented process-local synthetic Executor URL/key fixture and
passed HGI-307, 90 tooling tests, type-aware format/lint, the lint fixture,
Knip, all nine workspace typechecks, and all fifteen Turbo build/test tasks.
The same complete gate is rerun after this exact receipt-bearing ledger update
before commit. These checks prove repository consistency only, not live
duplicate registration, message delivery, callback isolation, or response
counts.

## 2026-07-30 callback retirement and fail-closed Preview journey

Cooper separately accepted irreversible loss of obsolete source callback
`2083611d…` because its create-only signing secret could not be recovered, and
authorized deletion of that callback only after no-required-traffic proof.
Exact callback/path Vercel logs showed zero rows over the available 30-day
window. A single non-mutating positive-control `GET` returned `404` and
produced exactly one row, proving the path-specific zero was an observable
rather than an empty log-service false green.

The owner command deleted exactly `2083611d…`. Immediate and post-drain reads
after 225 seconds—beyond Photon's documented approximately 3.5-minute retry
horizon—returned sole Production callback `72cac9b5…`, unchanged source users
`020cc192…`/`a78d3af6…`, unchanged assignments
`6e61cb74…`/`d4039779…`, shared service, and iMessage enabled. No replacement
callback was created. Exact restoration remains impossible by the accepted
authority because the lost signing secret cannot be reconstructed.

With source fan-out removed, one bounded Preview reconciliation registered
sender `82ac258d…` exactly once. Preview created rollout user `0e2e2abe…` and
distinct destination `0809669f…`; source user `020cc192…`, source destination
`d4039779…`, adopted Preview user `46b1fb0c…`, and stable Preview callback
`d2456774…` remained unchanged. This direct readback proves current
non-disruptive duplicate cross-project registration.

Computer Use resolved only that exact Preview destination and required the
composer to display `iMessage`, never SMS, before one bounded inbound-first
send. Messages displayed `Delivered`. Exact runtime readback recorded one
Preview `204` and one Preview `401`, while Production recorded zero Photon
callback invocations. No `202`, Eve dispatch/completion, outbound agent
response, typing evidence, or same-event duplicate disposition appeared.
Read-only Vercel metadata showed the sensitive Preview routing-identity
configuration was last updated on 2026-07-22, before the temporary identity
existed. The safe evidence cannot distinguish the exact ignored/duplicate
identity branch behind `204` or explain the second authentication failure.

The final deployed source commit
`1f8600d79c60ae5451ee09cd4d7bab2f158e0b4e` received an exact
valid-signature unsupported-event probe on the stable callback and returned
`204` without redirect or body. This proves the deployed Preview callback ID,
signing-secret custody and path are internally coherent. It does not explain
the provider-originated `401`, prove that provider request used the same
signature inputs, or upgrade the message into accepted ingress.

The authenticated Vercel API, CLI and dashboard independently exposed the
sensitive Preview `BUNDJIL_CHANNEL_ROUTING_IDENTITIES` record as write-only:
metadata remained readable, while `decrypt: true`, `vercel env pull` and the
dashboard editor returned no current value. Nine Production Photon Agent Run
details and traces contained no `principalId`. Exact-key searches found no
recoverable copy in the repository-local ignored env files or current process
environment; sanitized retained-task-session inspection found only code,
fixtures and later read-only probes, not the configured owner value. The
current directory therefore cannot be appended or merged safely. An overwrite
requires an exact owner-supplied canonical principal ID or an explicit product
decision to adopt a new stable Preview principal ID. Guessing from examples or
neighbouring tests is forbidden.

Cooper approved the intentional replacement on 2026-07-30. One opaque stable
Preview principal was generated and retained only with the exact controlled
sender mapping in ignored mode-`0600` local custody. Its safe fingerprint is
`1b41b326…`; the one-record mapping digest is `96971a51…`. The granted envelope
authorizes the complete Preview-only routing-directory overwrite, the
resulting immutable deployment/readback, one minimal Preview shared-user
reconciliation, and one bounded inbound-first iMessage/replay journey with
exact cleanup on failure. It excludes Production, billing, SMS, cold outbound,
credential rotation, main merge, and unrelated mutation.

The bounded resume completed and failed closed. Preview sensitive metadata
updated, immutable deployment fingerprint `687e5a7d…` at source `29467f1…`
reached READY, and its signed safe probe produced exactly
`ignored/unsupportedEvent`. One owner reconciliation created Preview user
`19489599…`/destination `0809669f…` while source sender `82ac258d…` remained
unchanged. Computer Use re-proved the exact sender, recipient,
iMessage/Encrypted composer, and Delivered state. Exact runtime readback then
contained one `ignored/unsupportedService` and one
`authenticationRejected`, with no `acceptedForDispatch`, Eve completion,
response, typing or duplicate disposition. The current official Photon event
contract says every iMessage platform field is `iMessage`; no available safe
observable identifies which provider wire field differed.

After a 239-second retry-horizon drain, guarded cleanup deleted only rollout
user `19489599…`/destination `0809669f…`. Two subsequent candidate inventories
each restored digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
The approved new Preview routing mapping and immutable deployment remain;
restoration of the prior write-only mapping is impossible by the accepted
product decision.

Repository tracing then found that the route returned the same unlogged `204`
for ignored, duplicate and identity-rejected inputs, and returned `401`
without an authentication disposition. The current slice adds the
identity-free `ChannelWebhookDisposition` oracle at the owning Channel adapter.
Its direct route tests cover every disposition/status class and reject
participant/message leakage. Immutable Preview deployment `310dc759…` reached
READY; one exact signed unsupported-event probe returned `204` with no
redirect, location or body, and deployment-scoped logs contained exactly one
`ignored`/`unsupportedEvent` disposition with zero forbidden
identity/signature/bypass tokens. It does not classify the prior provider
requests or make another message eligible.

The acceptance gate therefore failed closed. After the retry horizon, guarded
cleanup deleted only rollout user `0e2e2abe…`/assignment `0809669f…`. Two
matching inventories restored canonical digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
Final complete readback retained source callback `72cac9b5…`, both source
bindings, adopted Preview user `46b1fb0c…`, assignment `db49756e…`, and Preview
callback `d2456774…`. No billing, paid line, credential, Vercel configuration,
deployment, Production user/assignment, or adopted Preview resource changed.

The task remains in progress at the exact provider/application mismatch. The
safe disposition oracle and new Preview routing deployment are proved, but the
real provider event is not accepted. Preserve the new routing mapping,
immutable deployment and existing Preview callback. Do not recreate the user
or send again without separately bounded authority after the platform/signature
mismatch is resolved. The terminal five-pass audit remains deferred until the
complete SPEC is honestly terminal.

### Requirement-to-proof replay

| Material requirement          | Direct observable and expected postcondition                                      | Plausible false green rejected                                        | Focused command/evidence owner                                                   | Result                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| No required obsolete traffic  | Exact deployment/path returns zero rows and a probe becomes one row               | Empty project-wide log service                                        | Vercel exact-path logs plus one `404` positive control; shared-sender receipt    | Passed                                                                                                       |
| Exact irreversible retirement | Only `2083611d…` disappears after drain; `72cac9b5…` and users remain             | Delete by hostname/count or claiming URL/ID restores a signing secret | Owner delete command plus complete Photon reads; shared-sender receipt           | Passed; exact restoration intentionally impossible                                                           |
| Shared-sender capability      | Same sender gains a distinct Preview route while source binding remains unchanged | Availability, another sender, or second UUID alone                    | One create plus complete source/Preview candidate inventories                    | Passed for provider capability                                                                               |
| iMessage-only send            | Exact Preview destination shows `iMessage` and `Delivered`                        | SMS, Sendblue, source destination, or uncertain recipient             | Computer Use fail-closed composer/readback                                       | Passed for one bounded delivery                                                                              |
| Environment isolation         | Preview receives callbacks and Production receives zero                           | Separate projects without runtime counts                              | Exact Vercel environment/status readback                                         | Preview observed; Production-zero not conclusively proved                                                    |
| Callback configuration        | Exact valid-signature fixture reaches the stable callback and returns `204`       | Metadata presence, a READY deployment or historic receipt             | Stable callback probe and exact deployment logs at `1f8600d`                     | Passed for ID/secret/path coherence only                                                                     |
| Disposition observability     | Each route result emits one safe exact disposition with no identity/content       | HTTP status alone or a neighbouring unit assertion                    | `channel-vertical.test.ts`; immutable signed probe and deployment-scoped log     | Passed at `310dc759…`                                                                                        |
| Routing-directory custody     | Existing sensitive value is readable or an exact owner replacement is approved    | Empty/redacted reads, test principal or inferred neighbour            | Approval, mode-`0600` mapping digest, metadata readback and immutable safe probe | Passed for new Preview mapping/deployment                                                                    |
| Accepted Channel journey      | Preview returns `202`, completes Eve, sends one response, and proves replay       | `204`, `401`, handset delivery, or aggregate suite                    | Exact runtime dispositions and app owner mapping                                 | Failed; unsupportedService/authenticationRejected                                                            |
| Cleanup                       | Only rollout user is deleted and the original digest/topology returns             | Retaining failed topology or deleting adopted state                   | Guarded delete, final complete read, two-read candidate inventory                | Passed                                                                                                       |
| Provider checkpoint diagnosis | One closed checkpoint identifies the first authentication or platform boundary    | Status alone, value logging, permissive decoding, or secret change    | Photon transport fixture matrix, immutable deployment and exact scoped logs      | Synthetic matrix passed at `AB9G854g…`; real retry localized to `spacePlatform` and `headers` at `6bVHqBib…` |

### Read-only diagnosis review lenses

- **Ownership and call graph:** passed. Photon still owns user/assignment and
  callback actuality; Vercel owns the write-only environment value; the app
  `ChannelIdentity` configuration separately owns participant-to-principal
  resolution. The signed probe narrows the failed call graph to message
  acceptance/routing without moving Git deployment, Photon callback or
  Production ownership.
- **Implementation quality:** passed for the repository correction. The
  existing named route Effect remains flat and lazy; typed failures stay in
  the following outer `catchTags` pipe. The change adds no client, callback,
  service, Layer, schema mirror, primitive public contract, cast, mapper or
  helper. Closed decoded reasons and operations are logged directly at their
  owning branches.
- **Verification coverage:** passed for the diagnosis only. API, CLI and
  dashboard reads independently proved write-only custody; nine run
  detail/trace reads and local-custody searches rejected a recoverable
  principal; the stable signed probe rejected missing callback configuration.
  None of those observables substitutes for the still-failed `202`/Eve/replay
  journey.

Read-only deployment logs further proved that the historical `204` and `401`
were distinct requests 696 milliseconds apart. Photon documents every `2xx`
as terminal, so the `401` was not a retry caused by the `204`. The authenticated
Preview dashboard showed one retained webhook but no delivery-attempt detail
or repair toggle. The current repository candidate therefore keeps the
historical provider values unclassified and adds a private, identity-free
checkpoint diagnostic at the Photon transport boundary. All four
authentication checkpoints and all four official iMessage platform positions
receive independent direct tests; a value-leak sentinel must remain absent
after Schema encoding. Another real message is not authorized by this slice.

Immutable Preview deployment `AB9G854g…` at source `7e29cc9…` reached READY.
The eight-case synthetic matrix returned the expected four `401` and four
`204` responses. Exact deployment-scoped logs contained one record for each
closed checkpoint and zero occurrences of the provider-value leak sentinel.
This closes the repository/deployment diagnostic slice only. The historical
wire values, accepted Channel journey, same-event retry, response, typing and
Production-zero proof remain unproved.

Cooper approved the exact bounded retry envelope on 2026-07-30. It permits one
Preview-only shared-user recreation for sender `82ac258d…`, immediate
unchanged-source and distinct-destination readback, one fail-closed
iMessage-only inbound send, exact Preview/Production runtime readback, one
bounded Eve/reply/replay journey, retry-horizon observation, and deletion of
only the rollout-created user on failure. A fully accepted isolated topology
may be retained. Production mutation, SMS, cold outbound, billing, credentials,
Vercel configuration, unrelated resources, main merge, and the terminal audit
remain excluded.

Two fresh candidate-inventory commands at `2026-07-30T03:50Z` each completed
two matching reads with restored digest `9e6108d5…`. The sender remains
source-bound, Preview-available, and absent from Preview; the adopted Preview
user and callback remain unchanged. Final deployment `6bVHqBib…` at source
`654c5ac…` is READY, owns the branch alias, and had no unexpected callback
after the safe probe. These are eligibility gates, not journey proof.

The approved retry then created only Preview rollout user `ab4f5f8d…` with
distinct destination `0809669f…`. Immediate inventory retained source user
`020cc192…`/destination `d4039779…` and adopted Preview user
`46b1fb0c…`/destination `db49756e…`. Computer Use proved the selected Messages
start identity was sender `82ac258d…`, the exact Preview destination composer
said iMessage, and message fingerprint `605f8245…` produced exactly one
outgoing iMessage container, one Delivered marker, and no SMS container.

The deployed application failed closed before dispatch. Deployment
`6bVHqBib…` recorded one `204` `ignored/unsupportedService` request at exact
checkpoint `spacePlatform` and one separate `401`
`authenticationRejected` request at exact checkpoint `headers`. No
`acceptedForDispatch`, Eve completion, outbound response, duplicate, typing, or
additional callback appeared through the conservative retry horizon. The
latest Production deployment had no row in the same window, but there was no
same-window Production positive control, so zero Production response is not
claimed.

After the horizon, a stable-ID guard selected only rollout user `ab4f5f8d…`.
The owner service deleted that one user and read back the Preview user count
from two to one. Two independent post-cleanup candidate inventories at
`2026-07-30T04:14Z` each restored digest `9e6108d5…`, with both source bindings,
the adopted Preview user, both webhooks, service/platform, plans, credentials,
deployments, and Vercel state preserved. This closes the authorized retry and
rollback slice, not the task: the provider/application contract mismatch,
accepted Channel journey, same-event replay, response, typing, Production-zero
proof, and terminal audit remain open.

### Resumed provider-contract correction

Current primary contracts identify the platform failure as a Bundjil literal
defect. Pinned `@spectrum-ts/imessage@12.3.0` defines the cloud provider ID as
lowercase `imessage`, and the current Photon provider guide agrees. The current
webhook event example still uses `iMessage`, so that example is rejected as a
proof-by-proxy for the installed platform contract. The owning ingress adapter
will accept only exact `imessage` at all four positions; no case-folding or
dual-literal compatibility is admitted.

The second provider request remains unclassified. Photon documents timestamp
and signature as the signature-verification inputs, and documents event plus
webhook ID on normal delivery, but retained Photon/Vercel surfaces do not
expose the historical request headers. The next repository slice therefore
adds only closed missing-or-malformed classifications for each required header
and exact-accepted/known-alternative/case-variant/unknown classification for a
rejected platform. Values, payloads, identities, signatures, URLs and
credentials remain forbidden. A deployed synthetic matrix is required before
the newly approved bounded Preview qualification can consume another live
event.

| Requirement                      | Direct observable                                                                                        | Rejected plausible false green                                              | Focused command/evidence owner                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Exact platform contract          | All four decoded platform positions require exact lowercase `imessage`                                   | Webhook example display casing, case-folding, or accepting two spellings    | Pinned SDK/provider guide plus Photon transport fixtures; package/SPEC owners   |
| Header cause classification      | Each header boundary reports only one exact header and `missing` or `malformed`                          | Aggregate `headers`, status `401`, signature guess, or retained raw value   | Photon transport fixture matrix and private diagnostic Schema                   |
| Rejected-platform classification | A rejection reports only exact accepted, known alternative, case variant, or unknown                     | Logging the observed value or treating every non-match as SMS               | Photon transport fixture matrix and encoded sentinel-absence assertion          |
| Hosted qualification eligibility | Immutable diagnostic deployment passes direct synthetic cases before one bounded Preview-only live event | Local suite, READY alone, historical `204`/`401`, or another handset marker | Deployment-scoped synthetic requests/logs; verification receipt and active plan |

### Provider-contract correction docs-maintainer impact ledger

| Surface                                                            | Status          | Decision and evidence                                                                                                                                                       |
| ------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture, SPEC, tasks and active plan                          | Change required | Record exact lowercase `imessage` ownership, the still-unclassified second request, direct proof contract, authority and pending hosted qualification.                      |
| READMEs, exports and generated references                          | Change required | Update the Photon README's private diagnostic and exact platform contract; preserve public exports and generated references.                                                |
| Runbooks and authority                                             | Change required | Route the new Preview-first mutation/message authority through exact read-before-write, deployed-diagnostic, bounded-send, drain and retain-or-rollback gates.              |
| Verification journeys and proof                                    | Change required | Record primary-contract conflict, proven Bundjil literal defect, value-free diagnostic coverage and remaining hosted/live non-claims.                                       |
| Skills and AGENTS                                                  | Preserve        | Existing PRD, docs-maintainer, Effect client-wrapper and package-structure contracts cover this correction; no reusable skill or AGENTS change is evidenced.                |
| Lint, config, commands and CI                                      | Preserve        | No command, config or CI surface changes; existing focused and complete repository gates remain mandatory.                                                                  |
| Schemas, services, Layers, tests and fixtures                      | Change required | Correct only the private ingress literal/classifier and header decoding diagnostic; keep SDK/client/Layer/public service ownership unchanged and add direct negative tests. |
| SPEC/tasks/plan, receipts, rollout, rollback and lifecycle/archive | Change required | Keep the task/plan open, update the receipt and proof replay, record zero provider mutation in this repository slice, preserve prior rollback, and defer terminal audit.    |
| Documentation inventory                                            | Preserve        | No document or README path is added, moved or removed; inventory counts must be recomputed only if the docs check reports a structural change.                              |

Strict Effect language-service diagnostics, Photon typecheck/build, all 38
Photon tests, the 12-test cross-app Channel fixture, every routed policy gate,
HGI-307, 90 tooling tests, type-aware format/lint, the lint fixture, Knip, all
nine workspace typechecks, all 63 agent tests and all fifteen Turbo build/test
tasks pass on the receipt-bearing candidate. Complete verification used only
the documented process-local synthetic Executor fixture and made no provider
request. Hosted deployment and live qualification remain separate pending
evidence.

### Bounded retry docs-maintainer impact ledger

| Surface                                                              | Status          | Decision and evidence                                                                                                                                                                           |
| -------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture, SPEC, tasks and active plan                            | Change required | Record the repeated real boundary at `spacePlatform` and `headers`, keep the task in progress, and preserve provider/application ownership without weakening accepted literals.                 |
| READMEs, exports, generated references, schemas, services and Layers | Preserve        | No public or executable repository boundary changed; the existing named management and private transport owners were used unchanged.                                                            |
| Runbooks and authority                                               | Change required | Record the consumed bounded authority, one-send constraint, closed stop, provider-escalation packet, and no-recreate/no-resend gate.                                                            |
| Verification journey, receipts and proof                             | Change required | Retain the one-send/Delivered observable, exact deployed checkpoints, missing acceptance evidence, retry-horizon result, exact cleanup and restored digest.                                     |
| Skills and AGENTS                                                    | Preserve        | Existing PRD, docs-maintainer, Effect-client, package-structure and Computer Use rules covered the slice; no reusable instruction gap was found.                                                |
| Lint, config, commands, CI, tests and fixtures                       | Preserve        | No executable tracked bytes changed. Existing focused and full checks remain mandatory because docs and task owners changed.                                                                    |
| Rollout, rollback and lifecycle                                      | Change required | Delete only rollout user `ab4f5f8d…`, preserve adopted/source resources, retain the active plan and proposed SPEC, and defer the single formal five-pass audit until the full SPEC is terminal. |
| Documentation audit inventory and archive pointers                   | Preserve        | No tracked document path, README count, lifecycle class or archive pointer changed; the inventory digest remains current.                                                                       |

Effect language-service, boundary, docs, skills, authority, controls and
verification-policy gates passed. Photon typecheck/build and 23 focused tests
passed. One parallel Channel command began before Photon `dist` existed and
failed at module resolution; after the Photon build completed, the exact
12-test Channel command passed. Full `bun run verification` then passed on the
receipt-bearing candidate: HGI-307, 90 tooling tests, type-aware format/lint,
the lint fixture, Knip, all nine workspace typechecks, all 37 Photon tests, all
63 agent tests and all fifteen Turbo tasks. The process-local synthetic
Executor fixture made no external request.

### Retry-policy replay

| Property                            | Direct evidence and result                                                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eligibility                         | Callback delete was gated by positive-controlled no-traffic proof and irreversible authority. Preview create was gated by sole-Production-callback readback. Message retry was ineligible after failed acceptance. |
| Bounded attempts                    | One callback delete, one Preview create, one iMessage send, and one Preview delete. No blind replay.                                                                                                               |
| Backoff                             | No transient/rate-limit failure occurred. The 225-second wait was observation through the retry horizon, not a repeated request.                                                                                   |
| Jitter                              | No retry schedule became eligible.                                                                                                                                                                                 |
| Idempotent versus uncertain effects | Both deletes returned decoded success and exact readback. The create returned decoded success and complete source/Preview observation before use.                                                                  |
| Observation after write             | Every write received full provider readback; final matching inventories prove cleanup convergence.                                                                                                                 |

### Slice docs-maintainer impact ledger

| Surface                          | Status          | Decision and evidence                                                                                                                                      |
| -------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and docs            | Change required | Runtime ownership is unchanged, but the SPEC/plan/runbook/evidence now own the safe disposition oracle and its deployment/non-claim boundary.              |
| READMEs                          | Change required | The Photon package owner now records the private checkpoint diagnostic and confirms it is not a public export.                                             |
| Exports and generated references | Preserve        | No code, export, generated artifact, or reference owner changed.                                                                                           |
| Runbooks and authority           | Change required | Record the approved Preview overwrite/new-principal envelope while preserving the proved callback configuration and Production exclusions.                 |
| Verification journeys and proof  | Change required | Add principal/mapping fingerprints, immutable deployment proof, provider journey evidence, cleanup or retained-topology state, and exact non-claims.       |
| Skills and AGENTS                | Preserve        | PRD implementer, docs maintainer, Effect wrapper, package ownership, and Computer Use contracts were applied; no reusable instruction defect emerged.      |
| Lint, config, commands and CI    | Preserve        | No tracked config/command/CI change occurred. Operational reads and owner services used existing boundaries.                                               |
| Schemas, services and Layers     | Change required | Add one private closed diagnostic Schema at the existing Photon transport; public services, Layers, config, SDK custody, and exports remain unchanged.     |
| Tests and fixtures               | Change required | Direct route tests cover every route disposition plus all eight private provider checkpoints and reject participant/message/provider-value leak sentinels. |
| SPEC, tasks and plan             | Change required | Record the approved new-principal decision, complete Preview overwrite, exact journey gates, result, and terminal-only audit.                              |
| Receipts                         | Change required | Retain only safe fingerprints, bounded metadata, exact status/disposition counts, deployment identity, rollback limitation, and non-claims.                |
| Rollout and rollback             | Change required | The 239-second drain and guarded delete restored the provider digest twice; retain the approved new Preview mapping/deployment and record irreversibility. |
| Lifecycle and archive pointers   | Preserve        | The SPEC/task/plan remain active; no completed/archive pointer changes; formal five-pass audit remains terminal-only.                                      |
| Documentation audit inventory    | Preserve        | No docs/README path was added, moved, or removed; the candidate audit passed for all 272 routed files with zero findings.                                  |

Focused Effect language-service, boundary, docs, skills, authority, controls,
verification-policy, Photon typecheck, all 35 Photon tests, Photon build, JSON,
inventory-digest, diff, and secret/full-identity leak checks passed. Complete
repository verification used only the documented process-local synthetic
Executor fixture and passed HGI-307, 90 tooling tests, type-aware format/lint,
the lint fixture, Knip, all nine workspace typechecks, 62 agent tests, all 35
Photon tests, and all fifteen Turbo build/test tasks. The fixture made no
Executor request. These repository checks do not upgrade the live `204`/`401`
boundary into accepted Channel proof.

The later disposition-oracle candidate independently passed the same Effect,
boundary, docs, skills, authority, controls, verification-policy, HGI-307,
tooling, lint, Knip and nine-workspace typecheck gates, plus all 63 agent tests,
all 35 Photon tests and all fifteen Turbo tasks. Its synthetic Executor Config
fixture made no external request. This proves the repository call graph and
safe-log contract only; immutable Preview deployment and signed-log readback
are now passed at `310dc759…`, while the historical provider requests remain
unclassified.

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

## Live lowercase-contract qualification and retry cutover

The exact correction commit
`52434d479c99bcbc1e23bdf6ee5a1a0df1165c99` reached READY as immutable
Preview deployment `DAcSftdx…`. The hosted property matrix passed without
proof by proxy:

| Requirement              | Direct observable                                                    | Rejected false green                           | Result                         |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------ |
| Exact platform literal   | Signed lowercase `imessage` reaches `ignored/nonInbound`             | Unit fixture or conflicting `iMessage` example | Passed on immutable deployment |
| Case variant             | Signed `iMessage` records `spacePlatform/caseVariant`                | Case-fold acceptance or raw value logging      | Passed                         |
| Required-header presence | Missing event header records `eventHeader/missing` and returns `401` | Aggregate `headers` checkpoint or status alone | Passed                         |
| Leak boundary            | Deployment logs contain no synthetic identity/content sentinel       | Logger construction or local encode only       | Passed                         |

Two baseline inventories matched `9e6108d5…`. One Preview-only owner
reconciliation created user `8c3ce2b0…` with destination `0809669f…` for
sender `82ac258d…`; two immediate inventories matched `eec3f46c…` and proved
the source binding, adopted Preview user, and stable callback unchanged.
Computer Use then proved the exact fingerprint pair, `iMessage`/Encrypted,
one outgoing proof `623a3978…`, Delivered, and no SMS.

The live request returned `202 acceptedForDispatch`. A distinct request
returned `401 eventHeader/missing`; no signature failure is claimed. The
workflow deployment recorded direct-Space resolution, typing start, one
outbound send, typing stop, releases, and final `200`. The first handset
observer inspected only the ingress-destination conversation. Cooper's
screenshots plus a fresh read-only Messages inspection later proved the exact
correlated reply in a separate outbound-origin iMessage conversation.

For the required same-event duplicate proof, the plan is now at a reversible
Preview-only cutover: one temporary query-controlled callback exists beside
stable callback `d2456774…`; its create-only binding remains mode `0600`; and
the four sensitive Preview variables were rebound with
`stableCallbackCutover`. The next immutable deployment must pass a signed safe
probe before one additional bounded iMessage. That journey must return one
intentional `503`, one provider retry of the same event identity, one
`duplicate` `204`, one total Eve dispatch, and one total external response.
After the retry horizon, restore the stable binding, deploy and prove it,
delete only the temporary callback, and either retain the stable Preview user
after every acceptance gate or delete only `8c3ce2b0…` on failure. Production
remains unchanged. The terminal five-pass audit remains deferred.

The retry deployment `87YLdwPi…` at source `8f3076c…` passed signed safe
ingress. Proof `6cafe0e7…` was an explicit Delivered iMessage. Its valid event
produced one `503 providerRetryRequested`, then one same-event
`204 duplicate`; one workflow recorded one start/stop typing sequence, one
outbound send, releases, and final `200`. The retained old callback produced
only an expected `webhookId` rejection during cutover, while the independent
provider request class again produced `eventHeader/missing`. Neither failure
dispatched.

No inbound agent-response row appeared in the ingress-destination Messages
conversation, and no further callback or workflow appeared through the
225-second horizon. The later cross-conversation inspection found the exact
`623a3978…` and `6cafe0e7…` correlations in grey handset replies from provider
origin `d4039779…`. Provider acceptance, same-event duplicate suppression,
typing operations, one outbound send and handset delivery are proved. The
same-conversation-only observer was a false-negative retention gate.

The rollback is complete. Vercel Preview metadata was restored to the original
stable callback values. Immutable restoration deployment `2yxUAv6i…` at exact
source `8cf0c1e…` reached READY on the branch alias, and a signed safe probe
returned `204` with exact `ignored/unsupportedEvent`. The owner delete then
removed only the temporary query-controlled callback and read back zero exact
URL matches. A stable-ID/fingerprint guard removed only rollout user
`8c3ce2b0…` and destination `0809669f…`, leaving the adopted Preview user.

Two independent inventories at `2026-07-30T09:47Z` each restored exact digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
The final management inspection returned one adopted user, one stable callback,
shared service, iMessage enabled, and zero dedicated lines. Source/Production
bindings and callback were unchanged. The three exact mode-`0600` ephemeral
sender/cutover/restore artifacts were deleted after readback; stable credential
custody remains in the ignored local environment and Vercel Preview secret
store.

### Bounded retry rollback docs-maintainer impact ledger

| Surface                                       | Decision        | Final evidence                                                                                                                                                                                                |
| --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and call graph                   | Preserve        | No package, service, Layer, app ownership, Vercel Git deployment ownership, or Preview/Production routing boundary changed.                                                                                   |
| READMEs, exports and generated references     | Preserve        | No public command, export, generated owner, or package purpose changed.                                                                                                                                       |
| Runbooks, authority and controls              | Change required | The handset oracle now searches all iMessage conversations by correlation because Managed Shared replies can use a provider-selected origin; signed cutover, retry drain and exact deletion remain unchanged. |
| Verification journey and receipt              | Change required | The dated shared-sender receipt records exact cross-conversation handset evidence, restoration deployment, signed stable ingress, exact cleanup, restored digest and the unclassified auxiliary request.      |
| Schemas, services, Layers, tests and fixtures | Preserve        | No repository implementation changed after the lowercase/header correction; existing focused fixtures remain the direct property proofs.                                                                      |
| SPEC, task ledger and active plan             | Change required | Correct the handset false negative and keep `isolated-photon-preview-spike` open only for minimum stable Preview-user re-adoption and exact topology readback.                                                |
| Credentials, rollout and rollback             | Change required | Record approved durable custody, removal of three exact ephemeral artifacts, one-user/one-callback restoration, unchanged Production, and no unresolved provider write.                                       |
| Lifecycle and terminal audit                  | Preserve        | The plan remains active; three downstream tasks remain pending and the one formal five-pass audit stays terminal-only.                                                                                        |

This closes the authorized retry/rollback journey but not yet
`isolated-photon-preview-spike`. The provider/runtime journey and the
correlation-based handset journey both pass. In Managed Shared mode the pinned
SDK supplies the target participant but exposes no outbound `from` selector;
the provider-selected origin `d4039779…` and separate conversation are
compatible with that boundary. Exact cross-project origin selection is not a
documented stable guarantee and is not treated as Production execution. The
independent request remains proved only as `eventHeader/missing`. No additional
model call is justified; the next operation is minimum Preview-user re-adoption
with exact source/Preview readback. Production mutation, main merge and the
terminal audit remain out of this slice.

## Stable Preview re-adoption and task acceptance

Two pre-write complete candidate manifests matched baseline digest
`9e6108d5…` and proved sender `82ac258d…` source-bound, Preview-unbound and
Preview-available. One exact owner reconciliation created Preview user
`b95e88f6…` and recovered the previously qualified destination `0809669f…`.
The source binding, adopted Preview user, stable Preview callback, shared
service and enabled platform remained unchanged.

Two post-write candidate commands each performed two sequential complete reads
and matched digest `76f0b5c9…`. A second reconciliation returned `adopted` with
two users before and after, proving the semantic no-op property without another
create. The retained route is the same fingerprint used by both already
accepted signed/handset journeys, so another message or Eve model call would
add cost and risk without proving a new property.

| Surface                                       | Decision        | Stable-retention evidence                                                                                                           |
| --------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Architecture, ownership and call graph        | Preserve        | Source/Production and Preview remain separate projects, credentials, destinations and callbacks; Vercel Git ownership is unchanged. |
| READMEs, exports and generated references     | Preserve        | No public package boundary, command or generated reference changed.                                                                 |
| Runbook, authority and controls               | Preserve        | The existing Preview user-reconciliation envelope authorized this exact one-write/readback/no-op slice.                             |
| Verification journey and proof receipt        | Change required | Record exact create, recovered route, four matching post-write reads, no-op adoption and the corrected handset oracle.              |
| Schemas, services, Layers, tests and fixtures | Preserve        | The previously verified owner reconciliation and candidate-inventory boundaries were used unchanged.                                |
| SPEC, tasks and active plan                   | Change required | Accept `isolated-photon-preview-spike` and unblock stable bindings.                                                                 |
| Secrets, rollout and rollback                 | Preserve        | Full sender identity stayed process-local; stable credentials stayed in ignored/provider custody; no rollback is pending.           |
| Lifecycle and terminal audit                  | Preserve        | Three downstream tasks remain; the formal five-pass audit remains terminal-only.                                                    |

`isolated-photon-preview-spike` is complete. The next serial owner is
`stable-bindings-and-deployment-observation`.

## Stable-binding stage-isolation correction

The requirement-to-proof replay found that the canonical Preview inventory
still composed `PhotonManagementCredentialsLive`, whose Config owner is the
source/Production pair. No live stable-binding apply is eligible while the
Preview manifest points at the wrong Photon project.

The current repository slice routes the decoded stage through one named
redacted Config operation and uses its result for both the live Photon Layer
and inventory target. Preview and Production tests each omit the opposite
credential entirely, reject proof by shared local custody, and scan the
rendered value for the secret sentinel.

| Surface                          | Decision        | Current evidence                                                                                                    |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Architecture and call graph      | Change required | Inventory remains the sole cross-provider composition edge; its Photon credential is now selected by decoded stage. |
| READMEs and commands             | Change required | The infrastructure README states the exact Preview/Production Config ownership and wrong-stage stop condition.      |
| Exports and generated references | Change required | Export the named Config operation; no provider client, raw credential, DTO or generated reference is added.         |
| Runbooks, authority and controls | Preserve        | The existing read-only inventory envelope remains sufficient; no provider write has occurred.                       |
| Verification journey and receipt | Change required | Historical Preview inventory is explicitly ineligible; fresh stage-correct provider evidence remains required.      |
| Schemas, services and Layers     | Change required | Reuse Photon Schema/credential service and Config; the live SDK/HTTP boundary is unchanged.                         |
| Tests and fixtures               | Change required | Add opposite-stage-missing and secret-render rejection for both stage branches.                                     |
| SPEC, tasks and active plan      | Change required | Reopen the stable-binding owner as in progress at the earliest incorrect manifest input.                            |
| Secrets, rollout and rollback    | Preserve        | No value leaves Redacted Config and no provider mutation ran; local rollback is revert of the correction commit.    |
| Lifecycle and terminal audit     | Preserve        | Stable bindings remain in progress; Production, drift closeout and terminal five-pass audit remain pending.         |

The next step is full verification, a coherent prerequisite commit, and a
fresh exact-SHA Preview inventory before adoption planning.

## Stage-correct adoption and durable inventory receipt

The next requirement replay rejected proof by a stage-correct inventory alone.
The live adoption Layer and state-proof leak scan still authenticated through
the source/Production Photon Config owner for both stages. That would let a
Preview manifest name one project while its provider reads targeted another.

The correction selects the same decoded-stage Photon credential in inventory,
adoption and state proof. The inventory command now writes its fixed-contract
receipt to a separate validated mode-`0600` path after its owning Effect Schema
encoder and harness validation; stdout remains operator feedback only.

| Surface                           | Decision        | Direct evidence and rejected false green                                                                                                                  |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and call graph       | Change required | All three provider composition edges select the decoded stage. A correct manifest paired with a wrong authenticated project is explicitly rejected.       |
| READMEs and commands              | Change required | Document the distinct receipt path and make the command—not shell redirection—the durable writer.                                                         |
| Runbooks and authority            | Preserve        | The existing read-only inventory/adoption envelope remains the authority owner; no provider write is added.                                               |
| Verification journeys and receipt | Change required | Regenerate the exact-commit Preview artifact and receipt. A stale receipt beside a fresh artifact is not accepted proof.                                  |
| Schemas, services and Layers      | Change required | Reuse the stage-owned redacted Config operation and Photon credential service; no raw SDK/client or new DTO crosses the boundary.                         |
| Tests and fixtures                | Preserve        | Existing opposite-stage-missing and secret-render tests exercise the shared Config operation; package typecheck and complete provider matrices must pass. |
| SPEC, tasks and active plan       | Change required | Keep stable bindings in progress until exact provider evidence, adoption convergence, bindings and deployment observations all pass directly.             |
| Secrets, rollout and rollback     | Preserve        | No provider mutation occurs; rollback is the prerequisite commit revert and discarded ignored artifacts.                                                  |
| Lifecycle and terminal audit      | Preserve        | Production, drift closeout and the one terminal five-pass audit remain downstream.                                                                        |

The exact receipt candidate passed strict Effect language-service diagnostics,
19 focused Photon transport/reconciliation tests, the exact 12-test Channel
fixture, every routed policy gate, and complete `bun run verification`. The
full gate included HGI-307, 90 tooling tests, type-aware lint/format, Knip, all
nine workspace typechecks, all 38 Photon tests, all 63 agent tests, 30
infrastructure Vitest tests plus 14 Alchemy lifecycle tests, and all fifteen
Turbo tasks. The process-local synthetic Executor fixture made no external
request.

## Stable Preview binding ownership candidate

The next requirement replay rejected the historical binding sink as the
long-lived owner. Stable reconciliation now stays on the same adopted
`VercelEnvironmentVariable` logical and physical identity. Its desired
contract exhaustively distinguishes `Managed`, `ObservedUnknown`, and
`Absent`: only the four existing sensitive Preview Photon variables can be
Managed, every other value remains metadata-only, and Absent cannot delete a
retained binding. Managed reference identity is the exact Vercel environment
ID and its value revision is the immutable source SHA.

The write-capable Layer is reachable only from `alchemy.stable.run.ts`, after a
distinct mode-`0600` fixed authority and exact managed manifest both validate.
It resolves the four already-custodied values from owner Config only at the
PATCH adapter, decodes the complete acknowledgement immediately, and returns
only metadata, revision ownership, and `deploymentRequired`. The ordinary
adoption entry point composes denied value/write Layers.

Direct tests reject proof by broad suite: the managed profile selects exactly
four keys and not the internal bearer; wrong owner/reference and malformed
acknowledgement fail; known pre-write transient failure makes three total
exponential-jitter attempts and zero writes; an uncertain timeout after the
exact write makes one attempt and stops; partial one-project failure resumes
with the first physical identity no-op. Marketplace ambiguity/datastore retain
remain owned by their existing read-only tests. Live acceptance still requires
exact-commit inventory and adoption convergence, a four-update-only plan,
provider acknowledgements, fresh metadata readback, fixed receipts, namespace
continuity, no-op sync, and a distinct Vercel Git-created immutable deployment.

### Stable-binding candidate docs-maintainer impact ledger

| Surface                                       | Decision        | Direct evidence or preserved boundary                                                                                                       |
| --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and call graph                   | Change required | One existing environment Resource owns read/import and managed reconcile; Vercel Git alone owns deployment creation and promotion.          |
| READMEs, exports and generated references     | Change required | Export the named stable contracts/Layers/authority path and document three root commands; no client or credential escape hatch is exported. |
| Runbooks, authority and controls              | Change required | Add exact four-write authority, retry/uncertainty stops, readback, deployment observation and prior-revision rollback.                      |
| Verification journeys and proof               | Change required | Extend the fixed state receipt for the managed profile and retain a separate fresh inventory/deployment observation.                        |
| Skills, AGENTS, lint, config, commands and CI | Change required | Existing skills/AGENTS/CI policy is preserved; root commands and Config names are added and must pass every routed gate.                    |
| Schemas, services and Layers                  | Change required | Add Schema-derived desired state, branded update revision, safe errors, named value/write services, explicit denied/live/memory Layers.     |
| Tests and fixtures                            | Change required | Add profile, authority, exact HTTP, leak, no-op/update, policy rejection, retry, uncertainty and partial-failure cases.                     |
| SPEC, tasks and active plan                   | Change required | Keep the task in progress and record direct observables plus rejected false greens property-by-property.                                    |
| Secrets, receipts, rollout and rollback       | Change required | Values remain in ignored/provider custody; receipt retains revisions only; rollback reapplies the externally retained prior revision.       |
| Lifecycle, archive and terminal audit         | Preserve        | Production and drift tasks remain downstream; the single formal five-pass audit remains terminal-only.                                      |
| Documentation audit inventory                 | Preserve        | No documentation path was added or removed; `check:docs` recomputes and validates the current 272 routed files from the changed tree.       |

No stable provider mutation has occurred in this repository candidate.
The exact repository candidate passed the complete `bun run verification`
gate with the documented process-only synthetic Executor fixture and no
Executor request. Evidence includes Effect language-service diagnostics,
boundary/docs/skills/authority/controls/verification-policy and HGI-307
checks, 90 tooling tests, type-aware format/lint, the lint fixture, Knip, all
nine workspace typechecks, infrastructure's 37 Vitest and 19 Alchemy lifecycle
tests, and all fifteen Turbo build/test tasks. Live acceptance remains
separate: exact-commit inventory/adoption convergence, the four-update-only
plan and apply, provider readback/no-op sync, namespace continuity, fixed
receipts, and a distinct immutable Vercel Git deployment have not yet run.

### Preview state-discontinuity correction

Exact commit `7f856e605326683185eca56590b9eda4a0c6ed91` produced two
matching read-only Preview inventories at manifest digest `16861b7d…`: two
Vercel projects, 48 environment observations, two Marketplace bindings, 87
deployment observations, isolated Photon project `37cf2944…`, two users, one
webhook and zero lines. The mode-`0600` artifact and fixed receipt agree and
record zero writes.

The observed-only adoption dry-run stopped before apply with 96 updates, 51
no-ops and seven deletes. Read-only remote-state inspection found 106 completed
retain rows and classified the seven manifest-absent entries as one Photon
billing, one platform, one project, two shared-user and two webhook
observations. They belong to the stale source-project Preview state recorded
before stage-correct credential routing. Treating `retain` as permission to
apply a delete plan would weaken the accepted zero-delete gate.

The corrective slice must back up all 106 Preview rows to ignored
mode-`0600` custody, validate an exact state-only authority, remove only the
seven fingerprinted stale FQNs, and read back the remaining 99 rows before
another adoption plan. Its restore mode must delete any rows absent from the
backup and reset every backed-up row, recreating the exact pre-migration state
without composing Vercel or Photon transports. The correction is accepted only
when focused plan/apply/restore tests pass and the next live adoption dry-run
contains zero create, replace and delete. No provider mutation has occurred.

The repository candidate implements that fixed authority, Schema-derived
backup/result contracts, named backup/migration services, explicit live and
memory Layers, credential-value scan, bounded receipt and root command. Two
focused memory journeys pass exact backup-before-retire/readback/extra-row
cleanup/restore and reject a changed stale fingerprint before backup or
deletion. Infrastructure typecheck, 40 Vitest tests, 19 Alchemy lifecycle
tests and `check:docs` pass. The live plan command then reproduced 106 current,
147 desired, seven exact stale and 99 retained rows, emitted a fixed
mode-`0600` zero-provider-write receipt, and wrote no backup in plan mode.
The exact correction candidate also passed complete `bun run verification`:
Effect language-service and every routed policy gate, 90 tooling tests,
type-aware format/lint, the lint fixture, Knip, all nine workspace typechecks
and all fifteen Turbo build/test tasks. A coherent pushed correction commit
remains the final gate before live state retirement.

### Preview state-discontinuity docs-maintainer impact ledger

| Surface                                      | Decision        | Direct evidence or preserved boundary                                                                                                                  |
| -------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture and provider call graph         | Preserve        | The correction composes only the Alchemy R2 state service; Vercel and Photon provider Layers remain unreachable and provider writes are fixed at zero. |
| READMEs, exports, generated references       | Change required | Export the named state contracts/Layers and document the one root command; no generated reference or raw state client is exposed.                      |
| Runbook, authority and controls              | Change required | Add the exact seven-fingerprint state-only procedure, complete backup, readback, stop conditions and restore trigger under a distinct fixed authority. |
| Verification journeys and receipts           | Change required | Prove plan, backup-before-retire, exact row/content restore, mismatch rejection and the subsequent zero-create/replace/delete adoption plan directly.  |
| Skills, AGENTS, lint, config and CI          | Preserve        | Existing repository skills, agent policy, lint and CI remain authoritative; the new Config-owned command must pass every routed gate.                  |
| Schemas, services and Layers                 | Change required | Add branded identities, exact backup/result contracts, safe error, named migration/backup services and explicit live/memory Layers.                    |
| Tests and fixtures                           | Change required | Create the memory-state fixture, including stale-fingerprint rejection and a changed retained row plus unexpected-row false green before restore.      |
| SPEC, tasks and active plan                  | Change required | Record the one-time discontinuity without accepting the stable-binding task before provider-bound adoption and binding evidence.                       |
| Secrets, rollout and rollback                | Change required | Retain the complete ignored mode-`0600` backup, scan known credential values, and restore it exactly if adoption cannot converge.                      |
| Lifecycle, archive and terminal audit        | Preserve        | The plan remains active; downstream Production/drift work and the single terminal five-pass audit remain pending.                                      |
| Documentation inventory and archive pointers | Preserve        | No documentation path or lifecycle route changes; `check:docs` must recompute the current routed inventory from this tree.                             |

The first immutable-candidate plan after push failed closed before state
readback because the credential leak scan revealed then decoded a primitive
into its `Schema.Redacted` contract. No state or provider write and no backup
occurred. The owning adapter now re-wraps the value in Redacted custody at the
immediate scan boundary. A third focused test accepts the Redacted form and
rejects the raw-string false green; the plan must be repeated from a coherent
pushed correction before retirement.
