---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-agent-operator
observed_at: 2026-07-23T00:35:19Z
artifact_git_identity: 2e798f7722d46bd8f1ba34ca75b14cebcdb2e30b
environment: bundjil-agent-production
review_trigger: do not refresh; create a new dated receipt for a later artifact, provider journey, rollback, or environment
---

# Dual-Channel Production acceptance receipt — 2026-07-23

## Accepted boundary

Vercel promoted READY Production-target deployment
`dpl_GtD9GPLZda5S2fqdCyUQCwkPbbKG`, built from pushed source
`2e798f7722d46bd8f1ba34ca75b14cebcdb2e30b`, to explicit stable domain
`bundjil-agent.vercel.app`. Post-promotion authenticated readback resolved the
stable domain to that exact deployment. The root returned `200`; unsigned
Photon and Sendblue POSTs returned `401`; valid signed ignored fixtures
returned `204`; and both live provider webhooks reached their intended clean
routes without a redirect.

Rollback deployment `dpl_F4YP4B1keHZU6raPgBmtwbqSyqKb` and previous agent
deployment `dpl_HxM6y9A53XZEHj7C4Wy5NPrTPDJ3` remain distinct and retained.
The accepted proxy remains `dpl_5kbRiDzbGkdRYMcsSCJidZkJ3njB`, with previous
proxy deployment `dpl_G8TWoENsb9vb83oA5EenRWG5kyfb` retained. The rollback
qualification was non-mutating; no rollback was executed after acceptance.

Authenticated post-promotion provider readback found two Photon webhooks with
one exact Production callback and one preserved Preview callback. Sendblue
retained one secret-bearing `receive` webhook whose protected URL resolves to
the stable host and clean Sendblue path. No provider user, line, webhook,
secret, domain, replay value, or deployment was created, replaced, or deleted
after promotion.

## Photon Production packet

One approved handset direct message reached the signed Production callback and
returned `202`. The accepted deployment recorded one direct-Space resolution,
typing start, provider send, typing stop, and scoped release sequence, with no
`PhotonSdkOperationFailure`, `Channel inbound failed`, error, or fatal log. The
handset visibly displayed the typing indicator and then exactly one reply.

The fresh Production replay namespace contained one Photon inbound claim for
that journey. The operator redelivered the provider-documented Photon wire
shape using that exact real message identity and the current Production
signature. The stable route returned duplicate `204`; the accepted
deployment's Photon SDK send count remained one; and no second handset reply
appeared. This is an exact-identity application redelivery, not a claim that
Photon itself retried the Production request. The earlier accepted Preview
receipt separately proves a real Photon `503`/same-ID retry/`204` sequence.

## Sendblue Production packet

One approved handset direct message appeared exactly once in authenticated
Sendblue readback with provider status `RECEIVED`. The configured stable-domain
webhook reached the accepted deployment and returned `202`; one Eve result then
produced exactly one handset reply, with no error or fatal runtime log.

The operator redelivered the exact provider record and its real
`message_handle` to the current signed stable route. The route returned
duplicate `204`, while authenticated Sendblue outbound readback remained one
before and after the redelivery. Separate bounded calls for the same approved
conversation returned `200` and provider-accepted results for both typing
`start` and typing `stop`. The handset display boundary was not observed during
the Sendblue typing window and remains unproved.

## Replay, monitoring, and operational postcondition

The Production replay namespace is fresh and distinct from Preview. The
duplicate checks inspected only the exact newly created inbound identities and
provider message windows needed for this receipt; no legacy prefix or replay
value was read, copied, imported, cleared, or mutated. Both duplicates produced
zero second external response.

Vercel log readback for the accepted deployment contained zero error/fatal
records for the promotion and both live journeys. Provider acceptance, Eve
completion, handset delivery, and visible typing are intentionally separate:
Photon proves all four; Sendblue proves provider typing transitions, Eve
completion, and handset reply, but not visible typing display.

## Repository proof

The accepted source had already passed the focused Production preflight,
package/app typechecks, builds and tests, policy checks, and complete repository
verification before promotion. The final promotion closeout reruns the complete
verification workflow after this receipt and records the required five-pass
audit separately in the task ledger.

## Docs-maintainer impact ledger

| Surface                                                  | Decision        | Result                                                                                                           |
| -------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| Production task ledger and active execution plan         | Change required | Promotion, both bounded provider packets, rollback readiness, and exact limitations are current.                 |
| Verification router and this dated receipt               | Change required | This file is the bounded owner for the accepted stable-domain Production result.                                 |
| Photon and Sendblue runbooks                             | Preserve        | Existing procedures own exact provider ingress, duplicate, typing, secret, rollback, and stop conditions.        |
| App/package READMEs and architecture                     | Preserve        | Public commands, Effect service/Layer contracts, runtime call graphs, and package boundaries did not change.     |
| Staged, Preview, local, provider-only, and history proof | Preserve        | Earlier receipts retain their exact boundaries and are not rewritten as Production evidence.                     |
| Frontend, DNS, generated APIs, releases, and migration   | N/A             | No UI, DNS, generated API, package release, legacy state migration, or stored message/replay migration occurred. |

## Sources

- [Vercel promote a staged deployment](https://vercel.com/docs/deployments/promote-preview-to-production)
- [Photon webhook events and stable message identity](https://photon.codes/docs/webhooks/events)
- [Spectrum typing indicators](https://photon.codes/docs/spectrum-ts/content/typing-indicators)
- [Sendblue webhook delivery](https://docs.sendblue.com/getting-started/webhooks/)
- [Sendblue typing indicators](https://docs.sendblue.com/api-v2/typing-indicators)
- [Sendblue message readback](https://docs.sendblue.com/api-v2/messages/)
