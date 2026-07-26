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
non-Production, and had no alias error. An unauthenticated invalid POST to its
exact `/eve/v1/photon/webhook` route returned the application-owned `401`
signature rejection with no redirect. This proves public routing to the
signature boundary, not a valid Photon signature.

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

## Current non-claims and recovery

The current receipt proves the exact Git deployment, public signature
boundary, one Photon webhook, and four Vercel metadata identities. It does not
prove the encrypted values, a deployment built after the environment change,
a valid Photon signature, signed ingress, replay disposition, Channel
processing, provider send, handset behavior, Production state, no-op/drift
repair, retry drain, or cleanup.

Keep the recovery artifact mode `0600` until a new immutable Preview
deployment proves signed Photon ingress. If the new deployment fails, retain
the artifact and exact webhook fingerprint; do not replay the sink or create a
second webhook. Rollback must first stop ingress and drain the provider retry
horizon, then remove only the four exact Vercel metadata identities and the
one rollout-created webhook. The adopted Preview user and source project/users
remain protected.
