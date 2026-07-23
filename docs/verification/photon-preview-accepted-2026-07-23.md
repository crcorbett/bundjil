---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-22T23:43:17Z
artifact_git_identity: daab3e04ef4a7ae043904893a6ae9ee05d79a83e
environment: bundjil-agent-photon-preview
review_trigger: do not refresh; create a new dated receipt for a later artifact or environment
---

# Photon hosted Preview acceptance receipt — 2026-07-23

## Accepted boundary

Pushed source `daab3e04ef4a7ae043904893a6ae9ee05d79a83e`
produced READY Vercel Preview deployment
`dpl_HL8XcE9GRRYtQBUSaujhebzdrKK4`. Authenticated deployment readback matched
that exact Git identity, target `preview`, READY state, and one dedicated
Preview alias. The Linux/Node 24 build traced Spectrum's required
`@grpc/grpc-js`, `nice-grpc`, and `nice-grpc-common` runtime peers.

Sanitised provider and configuration readback established:

- Photon service type `shared`, iMessage enabled, two assigned shared users,
  zero dedicated lines, and one exact Preview callback;
- the callback carried the Photon-only, Schema-decoded
  `bundjil-proof=retry-once` control and its create-only signing secret was
  rebound directly from a mode-`0600` artifact;
- the webhook ID, signing secret, replay prefix, physical store prefix, and
  routing secret were replaced with fresh Preview values stored as Vercel
  `sensitive` metadata without branch scope; and
- Production, Sendblue, DNS, billing, shared users, dedicated lines, and
  Upstash data were unchanged. No replay key or value was inspected, copied,
  cleared, or imported.

An unsigned Photon request returned `401`. A valid signed unsupported-event
fixture returned `204` without dispatch.

## Provider retry and duplicate receipt

One fresh handset direct message caused the signed Photon callback to finish
one Eve dispatch and complete its replay claim before returning the
Preview-only intentional `503`. Photon retried the callback 1.435 seconds
later and received `204`. Photon documents that a retry carries the same stable
`message.id`; the application did not synthesize an identifier or repeat an
outbound send.

The matching hosted workflow returned `200`. Vercel's indexed safe lifecycle
observations matched direct-Space resolution, typing start, send, typing stop,
and scoped release, with no `PhotonSdkOperationFailure` or
`Channel inbound failed` match. Exactly one reply appeared on the handset. A
second reply did not appear.

This proves one real hosted at-least-once delivery produced one replay claim,
one Eve turn, one accepted external response, both provider typing
transitions, and one total handset reply. It does not prove that the handset
rendered a visible typing indicator; that display boundary remains unproved.

## Repository proof

Before deployment, the exact pushed source passed:

- the Photon package's 25 tests and build;
- the agent's 56 tests, including the fresh-`503`/duplicate-`204` route receipt
  and proof-disabled Sendblue acknowledgement path;
- 76 boundary tests, Effect setup, docs, skills, authority, controls, and all
  twelve verification-policy journeys;
- formatting, type-aware lint, Knip, eight workspace typechecks, and all
  fourteen workspace build/test tasks; and
- `git diff --check`.

## Docs-maintainer impact ledger

| Surface                                             | Decision        | Result                                                                                                             |
| --------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Photon app adapter, Schemas, and vertical tests     | Change required | The provider-retry proof policy is typed, Photon-only, claim-completing, and covered with negative Sendblue proof. |
| Photon runbook, SPEC, task ledger, and active plan  | Change required | Exact provider-retry procedure, accepted Preview artifact, limitations, and Production gate are current.           |
| Verification router and dated receipt               | Change required | This receipt is the accepted owner for the immutable Preview boundary.                                             |
| Package and app READMEs                             | Preserve        | Public purpose, package boundaries, commands, configuration, and runbook routes did not change.                    |
| Effect, Eve, repository, and testing architecture   | Preserve        | Existing rules already own the implemented decode, service, Layer, adapter, and verification boundaries.           |
| Production, Sendblue, Upstash data, and prior proof | Preserve        | No Production/Sendblue operation or data inspection occurred; earlier receipts retain artifact truth.              |
| Skills, generated APIs, CI, frontend, and releases  | N/A             | No skill, generated API, workflow, UI, package release, or public contract changed.                                |

## Promotion boundary

This receipt closes the Photon Preview gate only. It does not authorise or
prove Production. The next task must run the Production preflight, preserve
current and previous rollback references, stage one dual-provider Production
candidate with domains skipped, and prove both signed routes before any stable
alias promotion.

## Sources

- [Photon webhook events and same-ID retries](https://photon.codes/docs/webhooks/events)
- [Spectrum Spaces and Users](https://photon.codes/docs/spectrum-ts/spaces-and-users)
- [Spectrum typing indicators](https://photon.codes/docs/spectrum-ts/content/typing-indicators)
