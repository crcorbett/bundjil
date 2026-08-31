---
document_type: product-spec-index
lifecycle: current
authority: canonical
owner: bundjil-product-owner
last_reviewed: 2026-08-31
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

No product specification is currently active.

## Implemented or superseded history

The historical ledgers retain heterogeneous terminal provenance, including
ledger-level `completed` and `implemented` states. The Vercel promotion ledger
also retains a historical, scoped `approval.status: granted`. Every individual
entry in those ledgers' required `tasks` arrays is completed, but that does not
flatten the distinct ledger-level lifecycle or recorded approval fields. None
is standing authority.

| SPEC                                                                                                                 | Lifecycle note                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [Automatic Production deployment and operational closeout](automatic-production-and-operational-closeout.md)         | Automatic exact-main Production, callback and dual-channel proof accepted; drift and Photon replay limits retained            |
| [Alchemy infrastructure for Vercel and Photon](alchemy-vercel-photon-infrastructure.md)                              | Implemented hybrid infrastructure; five-pass audit accepted                                                                   |
| [Codex proxy GPT-5.6 Terra high reasoning](codex-terra-high-reasoning.md)                                            | Implemented Terra/high rollout; strict proxy replay absence deferred to a future public Eve API                               |
| [Codex hosted live OAuth storage](codex-hosted-live-oauth-storage.md)                                                | Implemented history                                                                                                           |
| [Codex local profile import workaround](codex-local-profile-import-workaround.md)                                    | Superseded fallback history                                                                                                   |
| [Codex OAuth Eve model provider](codex-oauth-eve-model-provider.md)                                                  | Implemented history                                                                                                           |
| [Doppler secret custody](doppler-secret-custody.md)                                                                  | Implemented custody, hosted proof, duplicate cleanup and temporary repair-path retirement; public behaviour remains unclaimed |
| [Effect boundary provenance enforcement](effect-boundary-provenance-enforcement.md)                                  | Implemented history                                                                                                           |
| [Effect-native runtime patterns and lint enforcement](effect-native-runtime-patterns-and-lint-enforcement.md)        | Implemented runtime/lint corrections; five-pass audit accepted                                                                |
| [Effect persistence](effect-persistence.md)                                                                          | Implemented history; current package names/exports own present state                                                          |
| [Effect Schema string contracts](effect-schema-string-contracts.md)                                                  | Implemented history                                                                                                           |
| [Eve Channel runtime ownership and supervision](eve-channel-runtime-ownership.md)                                    | Implemented runtime/supervision history; five-pass audit accepted                                                             |
| [Eve Effect agent spike](eve-effect-agent-spike.md)                                                                  | Implemented spike history                                                                                                     |
| [Executor MCP connection](executor-mcp-connection.md)                                                                | Implemented rollout history; not current provider truth                                                                       |
| [Harness-governance documentation](harness-governance-documentation.md)                                              | Implemented local harness; HGI-309 remains separately deferred                                                                |
| [Hosted Eve runtime qualification and durable handoff](hosted-eve-runtime-qualification-and-durability.md)           | Implemented handoff and accepted Preview history; combined Production qualification remains inconclusive                      |
| [Schema-driven Channels and Production promotion](photon-channel-provider.md)                                        | Implemented dual-provider rollout; dated receipt owns provider truth                                                          |
| [Repository naming cleanup](repo-naming-cleanup.md)                                                                  | Implemented migration history                                                                                                 |
| [Runtime boundary, streaming, and deployment proof improvements](runtime-boundary-streaming-and-deployment-proof.md) | Implemented build/boundary/streaming/deployment corrections; hosted proof and terminal audit accepted                         |
| [Sendblue Eve channel](sendblue-eve-channel.md)                                                                      | Implemented rollout history                                                                                                   |
| [Sendblue typing indicators](sendblue-typing-indicators.md)                                                          | Implemented rollout history                                                                                                   |
| [Vercel production promotion](vercel-production-promotion.md)                                                        | Completed rollout evidence; not current Vercel truth                                                                          |

The [Codex OAuth parallel research report](codex-oauth-subscription-model-access.parallel-research.md)
is supporting historical research routed through [`../research/README.md`](../research/README.md),
not an active SPEC.
