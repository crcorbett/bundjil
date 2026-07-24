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

`alchemy-offline-foundation` is next. Implementation has not begun. It requires
the repository-local `prd-implementer` skill. Its first acceptance boundary is
the canonical codec matrix, owner-qualified brands and cross-brand negative
type fixtures across CLI, manifest, Resource props/attributes, local state,
fixtures and receipts, including `InfrastructureBoundedReceipt.Encoded`
compatibility with the fixed embedded harness contract. It performs no
provider or remote state operation.

## Accepted planning evidence

| Lens                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Reviewed `origin/main` at `61992a2`, which contains Photon merge `23ae79b`, the harness-aligned proposed Eve runtime ownership SPEC, and the embedded structured harness contract. `@bundjil/infrastructure` is private tooling; `@bundjil/photon` remains the management transport owner; Vercel Git and app runbooks retain deployment authority.                                                                                |
| Implementation quality   | The SPEC requires actual Alchemy v2 reconcile semantics, lazy credential services, a complete boundary matrix naming each codec `Type`/`Encoded` and single decode/encode owner, owner-qualified branded identities, named literal discriminants, `Config.schema`/`Redacted`, named request/result services, safe errors, constant live/memory Layers, flat Effects, and no generic client/helper sprawl.                          |
| Verification coverage    | The sibling ledger requires codec round trips and malformed ingress, cross-brand compile failures, adoption, desired-state no-op, native sync drift, timeout-after-write, partial-failure, retain/delete-protection/leak tests, provider readback, deployment proof, Channel/handset proof separation, fixed structured artifact validation, stable invariant evidence, fixture lifecycle, and one fresh independent final review. |

The supporting research was revalidated against the exact Alchemy
`2.0.0-beta.64` package, current Vercel and Photon primary contracts, and the
Site repository at `878d18d`. Site's manifest/lock pin beta.64, while its
existing installed resolution reports beta.63; the beta.64 package tarball,
not stale `node_modules`, established provider and sync APIs. No tenant
provider was queried.

## Downstream-impact ledger

| Surface                              | Status          | Reason                                                                                                                                                                                                                                                           |
| ------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC/task/active plan                | Change required | The structured harness update adds stable invariant IDs, fixed journey/receipt/authority/control contracts, an explicit task dependency chain, and a fresh-review closeout; current indexes already route this active intent                                     |
| Documentation router/audit corpus    | Preserve now    | The current corpus remains 182 `docs/**` paths and 22 READMEs. Preserve historical HGI epoch/receipts and recompute only when implementation changes a tracked path or declared trigger; this infrastructure plan makes no inherited worker/harness-effect claim |
| Supporting research                  | Change required | Correct Alchemy reconcile/sync semantics, Site identity, and current Photon/Vercel gaps; it remains supporting reference                                                                                                                                         |
| Architecture                         | Preserve now    | Proposed topology and codec matrix are not executable architecture until implementation lands                                                                                                                                                                    |
| Root/app/package READMEs and exports | Preserve now    | No package, export or command exists yet. Implementation creates `packages/infrastructure/README.md` and updates only exact affected public routes                                                                                                               |
| Runbooks                             | Preserve now    | No provider operation or new repeatable command exists; target app procedures change before the first separately authorised operation                                                                                                                            |
| Authority/control registers          | Preserve now    | Planning grants no read, write, deployment or automation authority. Later live tasks validate the fixed embedded authority envelope; recurring drift also requires the fixed control record and current repository register owner                                |
| Verification/proof/effectiveness     | Preserve now    | No new provider, deployment, Channel or handset observation exists. Later journeys and receipts validate the fixed embedded contracts plus repository proof packet; the four clocks stay distinct and this approach comparison is not a harness campaign         |
| Skills                               | Preserve        | Current `prd-*`, docs-maintainer, effect-client-wrapper and package-structure owners already enforce the structured handoff, provider boundary and fresh-review workflow; fixed pass counts are not proof                                                        |
| Lint/boundaries/config/CI/tests      | Preserve now    | The fixed harness invariant register, existing boundary provenance controls, and repository verification own their distinct checks; executable config changes only with implementation                                                                           |

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
