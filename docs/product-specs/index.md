---
document_type: product-spec-index
lifecycle: current
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-07-20
review_trigger: any SPEC/task or active-plan lifecycle change
---

# Product specifications

Current implementation intent requires both an active SPEC/task here and an
entry under [`../exec-plans/active/`](../exec-plans/active/). Completed task
ledgers remain beside their SPECs for provenance; they are not default current
context.

## Current

- [Harness-governance documentation](harness-governance-documentation.md) —
  HGI-300 is in progress.

## Implemented or superseded history

All twelve sibling task ledgers below contain only `completed` tasks.

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
