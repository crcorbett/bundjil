---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-agent-operator
observed_at: 2026-07-23T00:13:22Z
artifact_git_identity: 2e798f7722d46bd8f1ba34ca75b14cebcdb2e30b
environment: bundjil-agent-production-candidate
review_trigger: do not refresh; create a new dated receipt for a later artifact, promotion, or environment
---

# Dual-Channel Production stage receipt — 2026-07-23

## Accepted boundary

Pushed source `2e798f7722d46bd8f1ba34ca75b14cebcdb2e30b`
produced READY Vercel Production-target deployment
`dpl_GtD9GPLZda5S2fqdCyUQCwkPbbKG`. Its provider metadata carried the same
source identity. The generated non-stable project alias resolved to that
candidate, while explicit stable domain `bundjil-agent.vercel.app` remained on
rollback deployment `dpl_F4YP4B1keHZU6raPgBmtwbqSyqKb`. Previous agent
rollback deployment `dpl_HxM6y9A53XZEHj7C4Wy5NPrTPDJ3`, current proxy
deployment `dpl_5kbRiDzbGkdRYMcsSCJidZkJ3njB`, and previous proxy deployment
`dpl_G8TWoENsb9vb83oA5EenRWG5kyfb` were READY and retained.

The Linux/Node 24 build traced Spectrum's `@grpc/grpc-js`, `nice-grpc`, and
`nice-grpc-common` runtime peers. Three earlier non-stable deployments were
discarded: one bounded webhook-secret bootstrap, one superseded preflight
candidate, and one candidate whose manually entered metadata SHA failed
readback. None received the explicit stable domain or a live handset journey.

## Clean configuration and provider adoption

Authenticated metadata readback established 29 Production variables, including
22 clean `BUNDJIL_CHANNEL_*` bindings and zero legacy Production bindings. The
old `BUNDJIL_SENDBLUE_*` variables were removed only from future Production
configuration; existing deployments retain frozen rollback configuration.

The existing Free Upstash Marketplace resource was reconnected to the agent for
Preview and Production under the exact `BUNDJIL_CHANNEL_REPLAY_` prefix. The
Production replay and routing prefixes are fresh and distinct from Preview. No
replay key or value was inspected, copied, cleared, migrated, or imported.

Authenticated provider readback established:

- Sendblue has one assigned line and one secret-bearing `receive` webhook on
  the clean stable-domain route. Its current provider secret and line were
  adopted directly into sensitive clean bindings; Sendblue provider state was
  not mutated.
- Photon remains a shared Free service with iMessage enabled, two total shared
  users, one exact Production-approved user, and zero dedicated lines. One new
  Production webhook was registered alongside the preserved Preview webhook.
  Its create-only secret flowed through a mode-`0600` artifact into sensitive
  Vercel bindings and was never printed or committed.

The proxy's redundant Production `KV_REST_API_*` targets were removed after
readback proved the accepted `UPSTASH_REDIS_REST_*` pair. Preview and
Development targets were preserved, no proxy deployment changed, and the
stable proxy health contract returned `200`, `ok: true`, and `mode: live`.

## Route, preflight, and monitoring proof

Against the accepted generated alias, both Channel routes returned `401` for
unsigned POSTs. A valid signed Photon unsupported-event fixture and a valid
signed Sendblue outbound fixture each returned `204` without Eve dispatch or
an outbound provider effect. Candidate log readback found four proof requests
and zero error/fatal messages.

A mode-`0600` sanitized `channel-candidate-staged` snapshot passed the local
Production preflight with no rejection. Its detail artifact digest was
`58f85db19c836ef6e5bdc74fe072389d448176004ea32b6c8e1c386e3f8a846d`.
The preflight keeps the accepted proxy and rollback agent's independently
observed source identities and requires the later Channel candidate alone to
match the pushed SHA.

This proves a rollback-ready immutable candidate and provider/configuration
inventory. It does not prove stable-domain traffic, Eve completion, outbound
acceptance, handset delivery, or visible typing for either provider.

## Repository proof

Before the accepted deployment, the pushed source passed the focused
17-test Production preflight suite, agent typecheck, docs policy, diff checks,
and the complete repository verification workflow. The full workflow included
57 agent tests, 37 proxy tests, all package/app builds and typechecks, policy,
boundary, Effect, skill, authority, controls, formatting, lint, Knip, and docs
checks.

## Docs-maintainer impact ledger

| Surface                                                     | Decision        | Result                                                                                                     |
| ----------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| Production preflight, regression test, and deploy runbook   | Change required | Late Channel stages compare the pushed SHA with the candidate, not the preserved rollback deployments.     |
| SPEC, task ledger, active plan, verification router         | Change required | The staged artifact, provider inventory, preflight correction, rollback references, and limits are routed. |
| This dated receipt                                          | Change required | This file is the immutable stage owner; promotion requires a separate Production receipt.                  |
| App/package READMEs and architecture                        | Preserve        | Public commands, runtime boundaries, package contracts, and architecture routes did not change.            |
| Preview and historical evidence                             | Preserve        | Earlier receipts retain their exact artifacts; they are not rewritten as Production proof.                 |
| Frontend, DNS, generated APIs, releases, and data migration | N/A             | No UI, DNS, generated API, package release, or stored-data migration entered the stage.                    |

## Promotion boundary

Promotion may target only `dpl_GtD9GPLZda5S2fqdCyUQCwkPbbKG`. It must first
re-read the stable alias and rollback references, pass the
`channel-production-promotion` preflight, promote the explicit stable domain,
and run separate bounded Photon and Sendblue journeys. Provider acceptance,
Eve completion, handset delivery, and visible typing remain separate claims.

## Sources

- [Vercel promote a Preview or staged deployment](https://vercel.com/docs/deployments/promote-preview-to-production)
- [Vercel environment variable behavior](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [Sendblue webhook management and retries](https://docs.sendblue.com/getting-started/webhooks/)
- [Photon webhook lifecycle](https://photon.codes/docs/webhooks/managing-webhooks)
