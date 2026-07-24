---
document_type: execution-plan
lifecycle: active
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-07-24
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
authorised. The next repository slice is `photon-read-import-vertical`.

## Accepted planning evidence

| Lens                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Reviewed `origin/main` at `61992a2`, which contains Photon merge `23ae79b`, the harness-aligned proposed Eve runtime ownership SPEC, and the embedded structured harness contract. `@bundjil/infrastructure` is private tooling; `@bundjil/photon` remains the management transport owner; Vercel Git and app runbooks retain deployment authority.                                                                                |
| Implementation quality   | The SPEC requires actual Alchemy v2 reconcile semantics, lazy credential services, a complete boundary matrix naming each codec `Type`/`Encoded` and single decode/encode owner, owner-qualified branded identities, named literal discriminants, `Config.schema`/`Redacted`, named request/result services, safe errors, constant live/memory Layers, flat Effects, and no generic client/helper sprawl.                          |
| Verification coverage    | The sibling ledger requires codec round trips and malformed ingress, cross-brand compile failures, adoption, desired-state no-op, native sync drift, timeout-after-write, partial-failure, retain/delete-protection/leak tests, provider readback, deployment proof, Channel/handset proof separation, fixed structured artifact validation, stable invariant evidence, fixture lifecycle, and one fresh independent final review. |

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
the fixed structured artifacts validate at their owning boundaries, one fresh
independent review closes the remaining failure classes, and exact Git identity
and verification evidence are recorded. This is not a comparative harness
campaign. A pass/worker/command count or successful local plan is not
completion.
