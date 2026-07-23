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

Start with an offline Alchemy/custom-provider lifecycle proof. Then implement
read/import Vercel and Photon vertical slices with memory Layers. No live
provider read occurs until the separately authorized inventory task, and no
write occurs until exact adoption, state, secret custody, Preview isolation,
rollback, and proof gates pass.

The target is hybrid ownership:

- Alchemy owns stable configuration and drift;
- Vercel Git owns immutable deployments;
- app-owned runbooks own promotion, rollback, and runtime proof;
- existing Production resources are imported, retained, and
  delete-protected.

## Current task

`alchemy-offline-foundation` is next. Implementation has not begun. It requires
the repository-local `prd-implementer` skill and performs no provider or remote
state operation.

## Accepted planning evidence

| Lens                     | Evidence                                                                                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and call graph | Merged main at `23ae79b` contains the accepted Channel/Photon architecture. `@bundjil/infrastructure` is specified as private tooling; `@bundjil/photon` remains the management transport owner; Vercel Git and app runbooks retain deployment authority. |
| Implementation quality   | The SPEC requires Schema Type/Encoded boundaries, branded identities, `Config.schema`/`Redacted`, named services, safe tagged errors, live/memory Layers, immediate provider decode/outward encode, flat Effects, and no generic client/helper sprawl.    |
| Verification coverage    | The sibling ledger requires adoption/no-op/drift/timeout-after-write/partial-failure/retain/delete-protection/leak tests, provider readback, deployment proof, Channel/handset proof separation, and the final five-pass audit.                           |

The supporting research was revalidated against Alchemy
`2.0.0-beta.64`, current Vercel and Photon primary contracts, and the site
repository at `bbadf2b`. No provider was queried.

## Downstream-impact ledger

| Surface                     | Status          | Reason                                                                      |
| --------------------------- | --------------- | --------------------------------------------------------------------------- |
| SPEC/task/active plan       | Change required | New canonical implementation intent and phased acceptance ledger            |
| Supporting research         | Change required | Photon is selected/implemented and mutable upstream support was revalidated |
| Architecture                | Preserve now    | Proposed topology is not executable architecture until implementation lands |
| Root/app/package READMEs    | Preserve now    | No package, export, or command exists in this planning slice                |
| Runbooks                    | Preserve now    | No provider operation or new repeatable command exists                      |
| Authority/control registers | Preserve now    | Planning grants no read, write, deployment, or automation authority         |
| Verification/proof          | Preserve now    | No new provider, deployment, Channel, or handset observation exists         |
| Skills                      | Preserve        | Current repository-local skills already own the required workflow           |
| Lint/config/CI/tests        | Preserve now    | No executable source/config changes in this planning slice                  |

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

The plan completes only after every sibling task is accepted or honestly
blocked, the SPEC acceptance criteria are reconciled, the final five-pass audit
passes, and exact Git identity and verification evidence are recorded. A
successful local plan is not completion.
