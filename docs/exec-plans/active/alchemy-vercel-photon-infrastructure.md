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
No live provider read occurs until the separately authorized inventory task,
and no write occurs until exact adoption, state, secret binding, Preview
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
repository gate. Its live Layer remains unused and no tenant read is
authorised. `photon-read-import-vertical` is implemented and locally accepted:
Photon owns the new read-only `/management`
boundary, infrastructure owns six retained observation Resources, and the
accepted memory topology is Free/shared with zero dedicated lines. Neither
live Layer is wired and no project credential or provider state was read. The
full repository gate passed, and the adversarial closeout extended the shared
bounded retry policy across every Photon HTTP read before focused Photon and
infrastructure checks passed again. `authorized-read-only-inventory` is now
the current task. A fixed-schema read-only authority envelope permitted one
bounded Preview/Production inventory attempt. The repository command and
memory proof are implemented, but the live attempt is inconclusive. Closeout
found that the ignored authority file used for discovery had mode `0644`, so
that discovery is not accepted proof; it was corrected to `0600`, and the
command now enforces mode and size before resolving credentials. The
mode-`0600` cached Vercel bearer separately returned `403` on the mandatory
current-principal read. No accepted manifest or receipt exists and downstream
adoption remains blocked. No credential refresh or provider/deployment
mutation was attempted.

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

The current `authorized-read-only-inventory` replay is incomplete. Repository
observables prove the command's fixed authority decoder, mode/size preflight,
canonical codecs, zero-write call graph, memory composition, leak exclusions
and verification gates. They do not prove the direct provider requirements:
the initial authority-file mode invalidated discovery, the Vercel principal
read returned `403`, and no receipt-bearing Preview/Production inventory or
matching second digest exists. The task therefore remains pending.

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

## Repository-authorized five-pass audit

This 2026-07-24 interim checkpoint audited the first three repository slices on
`codex/alchemy-vercel-photon-infrastructure`: `0a08767`, `43af287`, and
`65f4d7b`, based on `origin/main`
`38a8a3f4cde7b6c519803f233b80b48f079a206d`. It is an interim audit, not the
final SPEC audit. Seven tasks remain pending behind new target-specific
provider authority, beginning with `authorized-read-only-inventory`.

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

- This plan grants repository documentation authority only.
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
