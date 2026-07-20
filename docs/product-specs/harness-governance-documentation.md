---
document_type: product-spec
lifecycle: current
authority: canonical
owner: bundjil-documentation-owner
last_reviewed: 2026-07-20
review_trigger: acceptance or scope change in Bundjil HGI-300 through HGI-306
---

# Harness-governance documentation

## Outcome

Bundjil maintainers can retrieve the current owner for documentation,
architecture, intent, operations, proof, research, skills, and history without
loading completed rollout evidence or treating repository prose as current
provider truth. Material slices update the earliest durable owner and retain
bounded evidence, limitations, rollback, and exact Git identity.

## Invariants

- `docs/README.md` is the sole maintainer lifecycle/truth-layer router.
- Active intent requires this current SPEC/task owner and a matching active
  plan. Completed ledgers/plans remain separately reachable as history.
- Root and package READMEs contain purpose, public boundaries, and public
  commands—not undated deployment readiness, revisions, webhook topology, or
  provider actuality.
- Repeatable consequential operations live in target-owned runbooks with
  preconditions, authority, steps, evidence, rollback, and escalation.
- Proof names the artifact, environment, exact journey, observation,
  limitations, non-claims, and rollback identity.
- Effect code remains Schema-owned at boundaries, typed, flat, sequential,
  composable, and free of generic SDK callbacks, raw semantic primitives,
  `instanceof` policy, unchecked outputs, and helper sprawl.

## Tasks

| Task                                                                                                                                          | State       | Acceptance owner                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| HGI-300 — lifecycle/router, current architecture, current intent, active/history and historical-ledger classification, and root-proof removal | In progress | This SPEC, active plan, accepted receipts, fresh retrieval, verification, and Git receipt |
| HGI-301 — retained corpus and decision reconciliation                                                                                         | Pending     | Explicit lifecycle/retention decisions                                                    |
| HGI-302 — docs/lint/CI controls                                                                                                               | Pending     | Executable checks with positive/negative fixtures                                         |
| HGI-307 — local skill reconciliation                                                                                                          | Pending     | Repo skill source and policy tests                                                        |
| HGI-303 — critical journeys and proof owners                                                                                                  | Pending     | `docs/verification/**` and artifact-matched evidence                                      |
| HGI-304 — target-owned operational runbooks                                                                                                   | Pending     | `docs/runbooks/**`, authority, rollback, and escalation proof                             |
| HGI-305 — docs-maintenance embedding                                                                                                          | Pending     | PRD/docs-maintainer change-impact contract                                                |
| HGI-306 — repository closeout                                                                                                                 | Pending     | Accepted receipts and pushed commit identity                                              |

## Non-goals and authority

This campaign does not itself change or prove Vercel, Executor, Sendblue,
Upstash, AI Gateway, deployment, webhook, credential, release, production, or
external-consumer state. Those claims require current external readback under
explicit authority and the target-owned runbook.
