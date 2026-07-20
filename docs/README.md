---
document_type: documentation-router
lifecycle: current
authority: canonical
owner: bundjil-documentation-owner
last_reviewed: 2026-07-20
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

| Need                          | Owner                                                                                                                                                                                                                    | Use                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Current architecture          | [`architecture/README.md`](architecture/README.md)                                                                                                                                                                       | Durable architecture route. Root `ARCHITECTURE.md` is a tombstone; the retained mixed atlas is historical.                             |
| Effect and code rules         | [`architecture/effect-patterns.md`](architecture/effect-patterns.md), [`architecture/repo-structure.md`](architecture/repo-structure.md), [`architecture/frontend-composition.md`](architecture/frontend-composition.md) | Current enforced design rules.                                                                                                         |
| Verification commands         | [`architecture/testing-and-quality.md`](architecture/testing-and-quality.md)                                                                                                                                             | Current local checks; not release/provider proof.                                                                                      |
| Current intent                | [`product-specs/index.md`](product-specs/index.md) and [`exec-plans/active/README.md`](exec-plans/active/README.md)                                                                                                      | Only genuinely active SPEC/tasks and plans.                                                                                            |
| Completed plans and ledgers   | [`exec-plans/completed/README.md`](exec-plans/completed/README.md) and the implemented inventory in [`product-specs/index.md`](product-specs/index.md)                                                                   | Retained provenance, never default policy.                                                                                             |
| Research and local references | [`research/README.md`](research/README.md) and [`reference-repositories.md`](reference-repositories.md)                                                                                                                  | Supporting context; revalidate mutable upstreams.                                                                                      |
| Agent app                     | [`../apps/agent/README.md`](../apps/agent/README.md)                                                                                                                                                                     | App boundary and current public commands; no provider actuality or operator procedure.                                                 |
| Codex proxy app               | [`../apps/codex-proxy/README.md`](../apps/codex-proxy/README.md)                                                                                                                                                         | App boundary and current public commands; no provider actuality or operator procedure.                                                 |
| Package contracts             | [`../packages/eve/README.md`](../packages/eve/README.md), [`../packages/codex/README.md`](../packages/codex/README.md), [`../packages/store/README.md`](../packages/store/README.md)                                     | Package purpose, exports, and public commands.                                                                                         |
| Target-owned runbooks         | No canonical `docs/runbooks/**` route yet                                                                                                                                                                                | HGI-303 must establish preconditions, authority, steps, evidence, rollback, and escalation before repository docs direct an operation. |
| Workflow/provider authority   | No standing repository authority                                                                                                                                                                                         | HGI-304 must define identity, operation, target, environment, duration, approval boundary, audit receipt, and rollback.                |
| Critical journeys and proof   | No canonical `docs/verification/**` route yet                                                                                                                                                                            | HGI-305 must establish bounded artifact/environment proof owners; retained history is not a substitute.                                |
| Audit/accounting              | [`documentation-audit/README.md`](documentation-audit/README.md)                                                                                                                                                         | Dated evidence and inventories, not policy.                                                                                            |

Failed/inconclusive work retains provenance, last successful step, observed
state, escalation, resume trigger, recovery, limitations, and non-claims
outside default current routes. Do not delete or move completed history,
research, or raw evidence without an approved retention manifest.

## Maintenance

Every material slice decides `Change required`, `Preserve`, or `N/A` for
docs, READMEs, architecture, public/generated references, runbooks,
proof/evidence, skills, lint/config/CI, and active SPEC/tasks. Update the
earliest durable owner and necessary pointers in the same slice. Counts prove
accounting only; semantic, consumer, runtime, and provider claims require
boundary-matched evidence.
