---
document_type: product-spec-index
lifecycle: current
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-08-13
review_trigger: any SPEC/task or active-plan lifecycle change
---

# Product specifications

Current implementation intent requires both an active SPEC/task here and an
entry under [`../exec-plans/active/`](../exec-plans/active/). Completed task
ledgers remain beside their SPECs for provenance; they are not default current
context.

## Proposed

No SPEC is currently proposed without an active implementation plan.

## Current

- [Automatic Production deployment and operational closeout](automatic-production-and-operational-closeout.md) —
  exact-SHA post-CI Production automation, bounded credentials, rollback,
  Terra High correction, Infrastructure Drift and live channel closeout.
- [Effect-native runtime patterns and lint enforcement](effect-native-runtime-patterns-and-lint-enforcement.md) —
  all 22 implementation tasks are complete against installed Effect
  `4.0.0-beta.101`; its single terminal five-pass audit remains dependency-gated
  by automatic Production and live channel closeout.

## Implemented or superseded history

The historical ledgers retain heterogeneous terminal provenance, including
ledger-level `completed` and `implemented` states. The Vercel promotion ledger
also retains a historical, scoped `approval.status: granted`. Every individual
entry in those ledgers' required `tasks` arrays is completed, but that does not
flatten the distinct ledger-level lifecycle or recorded approval fields. None
is standing authority.

| SPEC                                                                                                                 | Lifecycle note                                                                                           |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [Alchemy infrastructure for Vercel and Photon](alchemy-vercel-photon-infrastructure.md)                              | Implemented hybrid infrastructure; five-pass audit accepted                                              |
| [Codex proxy GPT-5.6 Terra high reasoning](codex-terra-high-reasoning.md)                                            | Implemented Terra/high rollout; strict proxy replay absence deferred to a future public Eve API          |
| [Codex hosted live OAuth storage](codex-hosted-live-oauth-storage.md)                                                | Implemented history                                                                                      |
| [Codex local profile import workaround](codex-local-profile-import-workaround.md)                                    | Superseded fallback history                                                                              |
| [Codex OAuth Eve model provider](codex-oauth-eve-model-provider.md)                                                  | Implemented history                                                                                      |
| [Effect boundary provenance enforcement](effect-boundary-provenance-enforcement.md)                                  | Implemented history                                                                                      |
| [Effect persistence](effect-persistence.md)                                                                          | Implemented history; current package names/exports own present state                                     |
| [Effect Schema string contracts](effect-schema-string-contracts.md)                                                  | Implemented history                                                                                      |
| [Eve Channel runtime ownership and supervision](eve-channel-runtime-ownership.md)                                    | Implemented runtime/supervision history; five-pass audit accepted                                        |
| [Eve Effect agent spike](eve-effect-agent-spike.md)                                                                  | Implemented spike history                                                                                |
| [Executor MCP connection](executor-mcp-connection.md)                                                                | Implemented rollout history; not current provider truth                                                  |
| [Harness-governance documentation](harness-governance-documentation.md)                                              | Implemented local harness; HGI-309 remains separately deferred                                           |
| [Hosted Eve runtime qualification and durable handoff](hosted-eve-runtime-qualification-and-durability.md)           | Implemented handoff and accepted Preview history; combined Production qualification remains inconclusive |
| [Schema-driven Channels and Production promotion](photon-channel-provider.md)                                        | Implemented dual-provider rollout; dated receipt owns provider truth                                     |
| [Repository naming cleanup](repo-naming-cleanup.md)                                                                  | Implemented migration history                                                                            |
| [Runtime boundary, streaming, and deployment proof improvements](runtime-boundary-streaming-and-deployment-proof.md) | Implemented build/boundary/streaming/deployment corrections; hosted proof and terminal audit accepted    |
| [Sendblue Eve channel](sendblue-eve-channel.md)                                                                      | Implemented rollout history                                                                              |
| [Sendblue typing indicators](sendblue-typing-indicators.md)                                                          | Implemented rollout history                                                                              |
| [Vercel production promotion](vercel-production-promotion.md)                                                        | Completed rollout evidence; not current Vercel truth                                                     |

The [Codex OAuth parallel research report](codex-oauth-subscription-model-access.parallel-research.md)
is supporting historical research routed through [`../research/README.md`](../research/README.md),
not an active SPEC.
