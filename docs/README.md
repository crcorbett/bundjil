---
document_type: documentation-router
lifecycle: current
authority: canonical
owner: bundjil-documentation-owner
last_reviewed: 2026-07-21
review_trigger: any docs class, root route, SPEC, plan, runbook, proof, research, provider, app, package, or lifecycle change
---

# Bundjil documentation

This is the sole maintainer-document lifecycle and truth-layer router.
`README.md` is the public repository entry point; `AGENTS.md` is the terse
task map; `docs/architecture/README.md` owns current durable architecture.

## Truth layers

Use the strongest applicable owner and link rather than copy:

1. External systems own their current external state at readback time.
2. Code, configuration, Schemas, package exports, workflows, and generated
   sources own executable state.
3. Current architecture and enforced standards own durable boundaries.
4. Target-owned runbooks own repeatable consequential operations.
5. Dated proof/evidence owns one artifact/environment/authority observation,
   its limitations, and its rollback identity.
6. Active SPEC/tasks and execution plans own current implementation intent.

A deployment ID, readiness assertion, webhook observation, provider response,
or completed plan is not standing current truth. Repository proof cannot grant
authority for a later provider action.

## Metadata and lifecycle

New or materially revised maintainer docs separate `document_type`,
`lifecycle`, `authority`, and `owner`. Current durable docs also record
`last_reviewed` and `review_trigger`; superseded/tombstone docs record a
successor and reason.

Lifecycle values are `proposed`, `current`, `implemented`,
`superseded`, `historical`, `evidence`, `reference`, `failed`,
`inconclusive`, `tombstone`, and `archived`. Authority values are
`canonical`, `supporting`, `generated`, and `external`.

## Routes

| Need                              | Owner                                                                                                                                                                                                                                                                                                                                                                                      | Use                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current architecture              | [`architecture/README.md`](architecture/README.md)                                                                                                                                                                                                                                                                                                                                         | Durable architecture route. Root `ARCHITECTURE.md` is a tombstone; the retained mixed atlas is historical.                                         |
| Effect and code rules             | [`architecture/effect-patterns.md`](architecture/effect-patterns.md), [`architecture/repo-structure.md`](architecture/repo-structure.md), [`architecture/frontend-composition.md`](architecture/frontend-composition.md)                                                                                                                                                                   | Current enforced design rules.                                                                                                                     |
| Verification commands             | [`architecture/testing-and-quality.md`](architecture/testing-and-quality.md)                                                                                                                                                                                                                                                                                                               | Current local checks; not release/provider proof.                                                                                                  |
| Current intent                    | [`product-specs/index.md`](product-specs/index.md) and [`exec-plans/active/README.md`](exec-plans/active/README.md)                                                                                                                                                                                                                                                                        | Only genuinely active SPEC/tasks and plans.                                                                                                        |
| Completed plans and ledgers       | [`exec-plans/completed/README.md`](exec-plans/completed/README.md) and the implemented inventory in [`product-specs/index.md`](product-specs/index.md)                                                                                                                                                                                                                                     | Retained provenance, never default policy.                                                                                                         |
| Research and local references     | [`research/README.md`](research/README.md) and [`reference-repositories.md`](reference-repositories.md)                                                                                                                                                                                                                                                                                    | Supporting context; revalidate mutable upstreams.                                                                                                  |
| Agent app                         | [`../apps/agent/README.md`](../apps/agent/README.md)                                                                                                                                                                                                                                                                                                                                       | App boundary and current public commands; no provider actuality or operator procedure.                                                             |
| Codex proxy app                   | [`../apps/codex-proxy/README.md`](../apps/codex-proxy/README.md)                                                                                                                                                                                                                                                                                                                           | App boundary and current public commands; no provider actuality or operator procedure.                                                             |
| Package contracts                 | [`../packages/channel/README.md`](../packages/channel/README.md), [`../packages/sendblue/README.md`](../packages/sendblue/README.md), [`../packages/photon/README.md`](../packages/photon/README.md), [`../packages/eve/README.md`](../packages/eve/README.md), [`../packages/codex/README.md`](../packages/codex/README.md), [`../packages/store/README.md`](../packages/store/README.md) | Package purpose, exports, and public commands.                                                                                                     |
| Target-owned runbooks             | [`../apps/agent/runbooks/`](../apps/agent/runbooks/README.md) and [`../apps/codex-proxy/runbooks/`](../apps/codex-proxy/runbooks/README.md)                                                                                                                                                                                                                                                | Exact app operations with preconditions, identity, target, authority gate, sequential steps, evidence, rollback, revocation, stop, and escalation. |
| Durable authority rationale       | [`operations/authority-model.md`](operations/authority-model.md) and [`operations/authority-register.json`](operations/authority-register.json)                                                                                                                                                                                                                                            | Capability/observation/policy/authority separation plus machine-checked static envelopes; exact procedures remain app-owned.                       |
| Workflow automation authority     | [`operations/automation-register.md`](operations/automation-register.md), [`operations/github-actions-lock.json`](operations/github-actions-lock.json), and `.github/workflows/**`                                                                                                                                                                                                         | Admission, immutable action identity, convergence, stopping, rollback, and HGI-309 external-readback gates.                                        |
| Controls and automation admission | [`standards/controls.md`](standards/controls.md)                                                                                                                                                                                                                                                                                                                                           | Failure owners, fixtures, false-positive/carrying cost, feedback promotion, loop states, metrics, retirement, and report-only freshness.           |
| Critical journeys and proof       | [`verification/README.md`](verification/README.md)                                                                                                                                                                                                                                                                                                                                         | Ten named journeys, proof packet schemas/templates, bounded receipts, evidence lifecycle, and explicit local/Preview/Production/external limits.   |
| Retained proof evidence           | [`evidence/README.md`](evidence/README.md)                                                                                                                                                                                                                                                                                                                                                 | Exact-path sanitized packets and detail; outside default context and never standing provider truth.                                                |
| Audit/accounting                  | [`documentation-audit/README.md`](documentation-audit/README.md)                                                                                                                                                                                                                                                                                                                           | Dated evidence and inventories, not policy.                                                                                                        |

Failed/inconclusive work retains provenance, last successful step, observed
state, escalation, resume trigger, recovery, limitations, and non-claims
outside default current routes. Do not delete or move completed history,
research, or raw evidence without an approved retention manifest.

## Maintenance

Every material PRD or ordinary slice invokes the repository-local
`.agents/skills/docs-maintainer`, then decides `Change required`, `Preserve`, or `N/A` for
docs, READMEs, architecture, public/generated references, runbooks,
proof/evidence, skills, lint/config/CI, and active SPEC/tasks. Update the
earliest durable owner and necessary pointers in the same slice. Counts prove
accounting only; semantic, consumer, runtime, and provider claims require
boundary-matched evidence. Scheduled/background maintenance remains
report-only unless attached implementation authority names the exact paths;
policy publication requires separate approval and readback.
