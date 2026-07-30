---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-30T01:29:13.671Z
artifact_git_identity: 39161312f73d4f59630db437cab6ad5a8c3d5f0b
environment: bundjil-photon-shared-sender-topology-readback
review_trigger: Photon callback traffic, Preview routing/configuration change, shared-sender retry, or a new topology decision
---

# Alchemy Photon shared-sender topology readback — 2026-07-29/30

## Source callback retirement

The 2026-07-29 baseline found source/Production project `ad20033f…` with
unchanged users `020cc192…` and `a78d3af6…`, Production callback
`72cac9b5…`, and obsolete Preview-target callback `2083611d…`. Isolated
Preview project `37cf2944…` retained adopted user `46b1fb0c…` and stable
callback `d2456774…`. Both projects were Free managed-shared, iMessage was
enabled, and the live lines endpoint returned zero dedicated lines.

Cooper then explicitly accepted the irreversible loss of the obsolete
callback's unavailable create-only signing secret and authorized retirement
of `2083611d…` only. Exact Vercel deployment/path logs contained zero requests
over the available 30-day window. A single read-only `GET` positive-control
probe to the same immutable callback returned `404` and produced exactly one
log row. This rejects the false green where an empty project-wide log service
is mistaken for no traffic and proves the exact callback/path had no observed
required traffic before retirement.

The owner command deleted exactly one matching source callback. Immediate and
post-drain reads returned only Production callback `72cac9b5…`, both unchanged
source users and assignments, shared service, and iMessage enabled. The drain
waited 225 seconds, longer than Photon's documented approximately 3.5-minute
maximum webhook retry horizon. The final 2026-07-30 readback again returned
that sole callback and the same two source bindings.

The deletion is intentionally irreversible: stable ID/URL custody cannot
restore the create-only signing secret, and no replacement callback was
created. Production callback `72cac9b5…`, every source user/assignment,
credential, platform, billing property, deployment, and Vercel setting was
preserved.

## Duplicate registration and bounded iMessage journey

After source isolation passed, one exact Preview create registered controlled
sender `82ac258d…` without altering its source user `020cc192…` or source
destination `d4039779…`. Preview returned rollout-created user `0e2e2abe…`
and distinct assigned destination `0809669f…`; the adopted Preview user
`46b1fb0c…` and callback `d2456774…` remained unchanged. This proves the
provider currently permits non-disruptive duplicate registration across the
two projects. It does not by itself prove application routing or a stable
deployable topology.

Computer Use resolved the exact assigned Preview destination in Messages.
The composer explicitly displayed `iMessage`, never SMS, before one bounded
non-sensitive inbound-first message was sent. Messages then displayed a
`Delivered` state. Full phone values, message content, conversation, Space,
event, and message identities remained in secure process/provider custody.

Exact Vercel runtime readback for the message window recorded one Preview
callback response `204` and one Preview callback response `401`; the
Production environment recorded zero Photon callback invocations. There was
no accepted `202`, Eve dispatch/completion, outbound agent response, typing
proof, or exact same-event duplicate disposition. The Preview routing-identity
metadata was last updated on 2026-07-22, before the rollout-created user and
route existed. The app owner maps `204` to ignored/duplicate or disallowed
identity and `401` to webhook authentication failure; the available logs do
not safely distinguish the exact `204` branch or explain why Photon emitted
the second request.

The observed postcondition therefore failed closed. iMessage delivery to the
Preview assigned line and zero Production invocation are direct provider/UI
evidence, but neither proves accepted Bundjil ingress or a Channel journey.
The task must not claim one Preview response, replay handling, Eve completion,
outbound delivery, or visible typing.

## Cleanup and restored topology

After the message window exceeded the retry horizon, cleanup guarded the exact
rollout-created sender, user, assignment, adopted user, and sole Preview
callback before deletion. It deleted only Preview user `0e2e2abe…` and read
back one retained Preview user `46b1fb0c…`, assignment `db49756e…`, and
callback `d2456774…`.

Two consecutive candidate inventories then matched the original digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
The final complete readback at `2026-07-30T01:29:13.671Z` retained:

| Property         | Source/Production        | Isolated Preview         |
| ---------------- | ------------------------ | ------------------------ |
| Project          | `ad20033f…`              | `37cf2944…`              |
| Users            | `020cc192…`, `a78d3af6…` | `46b1fb0c…`              |
| Assignments      | `6e61cb74…`, `d4039779…` | `db49756e…`              |
| Webhooks         | `72cac9b5…` only         | `d2456774…` only         |
| Service/platform | shared; iMessage enabled | shared; iMessage enabled |

No shared/Production user or assignment, adopted Preview user, retained
callback, credential, plan, billing setting, dedicated line, Vercel
configuration, deployment, or Production environment changed.

## Requirement replay

| Material requirement                  | Direct observable and expected postcondition                                               | Plausible false green rejected                              | Result and evidence owner                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| No required obsolete-callback traffic | Exact callback/path has zero rows and a positive-control request becomes one row           | Empty project-wide logs or an unverified zero count         | Passed before deletion; this receipt and Vercel runtime logs                        |
| Exact callback retirement             | Only `2083611d…` disappears; `72cac9b5…` and source users remain                           | Deleting by count, hostname, or list order                  | Passed after 225-second drain; Photon management readback                           |
| Retirement rollback                   | Irreversible secret loss is explicitly accepted and recorded                               | Stable ID/URL described as exact signing-secret restoration | Passed for authorized irreversible retirement; exact restoration remains impossible |
| Duplicate registration                | `82ac258d…` gains distinct Preview user/destination while source binding remains unchanged | Availability, second UUID, or adopted different sender      | Passed for provider capability; candidate inventories and Photon reads              |
| iMessage-only origin                  | Exact Preview destination resolves in an `iMessage` composer and shows delivery            | SMS, Sendblue, source destination, or uncertain recipient   | Passed for one bounded handset/provider delivery; Computer Use                      |
| Environment isolation                 | Preview path receives the test and Production receives zero invocation                     | Separate projects without exact runtime counts              | Passed for callback invocation isolation; Vercel runtime logs                       |
| Accepted Channel ingress              | Preview returns `202` and produces one Eve completion/response                             | `204`, `401`, handset delivery, or aggregate suite          | Failed: exact responses were `204` and `401`; no accepted dispatch                  |
| Retry/duplicate proof                 | Same provider event is retried with one dispatch and one response                          | Two unrelated requests or synthetic replay                  | Not proved                                                                          |
| Rollback                              | Only rollout-created Preview user is removed and original digest returns                   | Retaining a failed topology or deleting the adopted user    | Passed; guarded delete and two-read candidate inventory                             |

## Retry and effect-certainty replay

- Eligibility: the obsolete callback delete became eligible only after the
  positive-controlled traffic oracle and explicit irreversible authority.
  The Preview user create became eligible only after sole-Production-callback
  readback. No message retry was eligible after the failed acceptance result.
- Bounded attempts: one callback delete, one Preview shared-user create, one
  iMessage send, and one exact Preview user delete ran. No blind mutation or
  message retry ran.
- Backoff and jitter: no provider operation returned a transient/rate-limit
  result requiring a retry schedule. The fixed retry-horizon drain was an
  observation window, not request replay.
- Idempotent versus uncertain effects: both deletes returned decoded success
  and received exact readback. The create returned decoded success and was
  reconciled by complete source/Preview inventory before use.
- Observation after write: each mutation was followed by complete owning
  provider readback; the final two-read digest proves cleanup convergence.

## Repository verification

Focused Effect setup, boundary, docs, skills, authority, controls,
verification-policy, Photon typecheck, all 35 Photon tests, Photon build, JSON,
inventory-digest, diff, and secret/full-identity leak checks passed. Complete
`bun run verification` used only the documented process-local synthetic
Executor fixture and passed HGI-307, 90 tooling tests, type-aware format/lint,
the lint fixture, Knip, all nine workspace typechecks, and all fifteen Turbo
build/test tasks. The complete gate is rerun after this exact verification
statement becomes the commit candidate.

Repository checks prove owner and policy consistency only. They do not upgrade
the failed live `204`/`401` boundary into accepted ingress, Eve completion,
outbound response, replay, typing, or terminal SPEC proof. The task remains
open, and the single terminal five-pass audit has not run.

## Sources

- [Photon webhook delivery and retries](https://photon.codes/docs/webhooks/delivery)
- [Photon webhook troubleshooting](https://photon.codes/docs/webhooks/troubleshooting)
- [Photon webhook events and project fan-out](https://photon.codes/docs/webhooks/events)
- [Dual-Channel Production acceptance receipt](channel-production-accepted-2026-07-23.md)
