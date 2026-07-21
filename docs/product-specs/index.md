---
document_type: product-spec-index
lifecycle: current
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-07-21
review_trigger: any SPEC/task or active-plan lifecycle change
---

# Product specifications

Current implementation intent requires both an active SPEC/task here and an
entry under [`../exec-plans/active/`](../exec-plans/active/). Completed task
ledgers remain beside their SPECs for provenance; they are not default current
context.

## Current

- [Harness-governance documentation](harness-governance-documentation.md) —
  all repository-local tasks are complete; HGI-309 external qualification is
  explicitly deferred pending separate authority.
- [Codex proxy GPT-5.6 Terra high reasoning](codex-terra-high-reasoning.md) —
  implementation in progress; Preview subscription-endpoint proof remains
  pending explicit deployment authority.

## Implemented or superseded history

The twelve sibling historical ledgers retain heterogeneous terminal
provenance: ten use ledger-level `status: completed`, while the Effect
persistence and Effect Schema string-contract ledgers use `status:
implemented`. The Vercel promotion ledger also retains a historical, scoped
`approval.status: granted`. Every individual entry in those ledgers' `tasks`
arrays is `completed`, but that does not flatten the distinct ledger-level
lifecycle or recorded approval fields. None is standing authority.

| SPEC                                                                                | Lifecycle note                                                       |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [Codex hosted live OAuth storage](codex-hosted-live-oauth-storage.md)               | Implemented history                                                  |
| [Codex local profile import workaround](codex-local-profile-import-workaround.md)   | Superseded fallback history                                          |
| [Codex OAuth Eve model provider](codex-oauth-eve-model-provider.md)                 | Implemented history                                                  |
| [Effect boundary provenance enforcement](effect-boundary-provenance-enforcement.md) | Implemented history                                                  |
| [Effect persistence](effect-persistence.md)                                         | Implemented history; current package names/exports own present state |
| [Effect Schema string contracts](effect-schema-string-contracts.md)                 | Implemented history                                                  |
| [Eve Effect agent spike](eve-effect-agent-spike.md)                                 | Implemented spike history                                            |
| [Executor MCP connection](executor-mcp-connection.md)                               | Implemented rollout history; not current provider truth              |
| [Repository naming cleanup](repo-naming-cleanup.md)                                 | Implemented migration history                                        |
| [Sendblue Eve channel](sendblue-eve-channel.md)                                     | Implemented rollout history                                          |
| [Sendblue typing indicators](sendblue-typing-indicators.md)                         | Implemented rollout history                                          |
| [Vercel production promotion](vercel-production-promotion.md)                       | Completed rollout evidence; not current Vercel truth                 |

The [Codex OAuth parallel research report](codex-oauth-subscription-model-access.parallel-research.md)
is supporting historical research routed through [`../research/README.md`](../research/README.md),
not an active SPEC.
