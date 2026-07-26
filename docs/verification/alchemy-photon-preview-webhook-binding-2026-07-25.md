---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-infrastructure-owner
observed_at: 2026-07-25T23:27:00Z
artifact_git_identity: a8c2672cbf58f4ee04c9a3db29b58710fff92953
environment: bundjil-photon-preview-webhook-binding
review_trigger: replace with a later receipt after signed ingress and cleanup
---

# Alchemy Photon Preview webhook binding receipt — 2026-07-25

## Immutable callback boundary

Pushing implementation commit
`a8c2672cbf58f4ee04c9a3db29b58710fff92953` caused Vercel Git to create
Preview deployment `dpl_9kmc9i6zgZT4nDi1pKmddJUwd6CA` for exact project
`prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`. The deployment reached `READY`, remained
non-Production, and had no alias error. Later response-envelope inspection
corrected the first unauthenticated `401`: Vercel Authentication, not the
application signature boundary, rejected the request. No public Photon-route
claim is retained for that deployment.

## Provider mutations and readback

Fresh Preview inventory established zero webhooks before mutation. The
authorized registration created one exact callback. Its stable webhook
fingerprint is
`fd778595f7780dd9cd74a5eb6c467a518e92eebf48668fafda967ee68d709c19`;
the full ID and create-only signing secret remain only in a mode-`0600`
ignored recovery artifact.

The owner-specific Vercel sink then sent one bulk upsert for exactly these
Preview-only sensitive bindings:

- `BUNDJIL_CHANNEL_PHOTON_PROJECT_ID`
- `BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET`
- `BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID`
- `BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET`

The provider response did not satisfy the complete acknowledgement Schema, so
the command failed closed and retained the recovery artifact. No retry ran.
Immediate decoded metadata readback found exactly one sensitive Preview-only
identity for each key:

- project ID metadata `gFnLAf9Aqaw2AeBP`;
- project secret metadata `pIi8t0fBhO28qj6g`;
- webhook ID metadata `EYerPvY1VmktTc0C`; and
- webhook secret metadata `nW8iWqmcPurhzXO2`.

This is a timeout/partial-acknowledgement recovery state, not final
convergence. The repository command now reads before writing and blocks when
any of the four identities already exists, preventing blind replay.

The recovery review found that Vercel's decoded upsert acknowledgement may use
status `200` as well as create status `201`, and that the binding-file ingress
must decode its encoded secret string before wrapping the owner service Type
as `Redacted`. The corrected adapter covers both success statuses. One
explicit `signedIngressMismatch` recovery used the existing four exact
metadata identities, rewrote the same values through the owner sink, returned
`recoveredPendingIngress`, and retained the mode-`0600` artifact.

Vercel Authentication remained the next ingress fence. The project already
contained unrelated automation-bypass entries, so none was guessed or reused.
One note-scoped `bundjil-photon-preview-webhook` automation bypass was created
under the approved credential authority and stored only in ignored
mode-`0600` custody. Its safe fingerprint is
`32f231e1106e391ace5581eb03ed811f7c2659b0a54aab6472728a0e8aa9199e`.
No bypass value or callback query is retained here.

Corrected commit `2436ddbd04ef07015fff7b1d1e4d68a03a65d5b6`
then produced exact non-Production deployment
`dpl_C8Wrg6fKK5ztsTonQuFZcN8TXLWo`. It reached `READY` with no alias error. A
protected valid-signature unsupported event returned `204` with no redirect or
body, proving the recovered webhook ID/secret on that immutable deployment.
The unsupported event acquires no outbound Photon SDK and dispatches no
Channel message.

The lossless stable-callback cutover then created one second temporary webhook
while preserving the old webhook and artifact. The new stable callback carries
the protection bypass only in its provider-custodied query and has safe webhook
fingerprint
`d24567746bb03623f86e5f8b3d43449dc56a6cb374788c482e1fcab56b35913b`.
Fresh registration readback observed two total webhooks. The exact new
ID/secret replaced the four Vercel Preview values through
`stableCallbackCutover`; the owner returned `cutoverPendingIngress` and both
mode-`0600` artifacts remain available for rollback.

## Current non-claims and recovery

The current receipt proves exact Git deployment `2436ddb`, one protected valid
signature `204`, two transient Photon webhook identities, four Vercel metadata
identities, the scoped protection-bypass identity, and bounded recovery/cutover
writes. It does not yet prove a deployment built with the stable webhook
values, provider delivery to that callback, replay disposition, Channel
processing, provider send, handset behavior, Production state, no-op/drift
repair, retry drain, or cleanup.

Keep the recovery artifact mode `0600` until a new immutable Preview
deployment proves signed Photon ingress. If the stable deployment fails,
retain both artifacts and both exact webhook fingerprints; do not replay the
sink or create a third webhook. Photon documents up to six attempts, jittered
backoff and a worst-case delivery window of about 3.5 minutes. After stable
signed proof, wait through that horizon before deleting only the old immutable
callback. The adopted Preview user and source project/users remain protected.
