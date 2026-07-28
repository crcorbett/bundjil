---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-28T17:30:48Z
artifact_git_identity: 12157bcfeacf49b516c176f7d85868cf4c0f0ac9
environment: bundjil-photon-shared-sender-topology-readback
review_trigger: source-project webhook retirement, Preview duplicate-registration attempt, Photon routing-contract change, or a new topology decision
---

# Alchemy Photon shared-sender topology readback — 2026-07-29

## Readback result

Under Cooper's bounded read and Preview-mutation authority, two consecutive
Schema-owned Photon management reads returned matching sanitized topologies:

| Property            | Source/Production project              | Isolated Preview project                 |
| ------------------- | -------------------------------------- | ---------------------------------------- |
| Project fingerprint | `ad20033f…`                            | `37cf2944…`                              |
| Plan and service    | Free, managed shared, iMessage enabled | Free, managed shared, iMessage enabled   |
| Shared users        | two unchanged stable user fingerprints | one adopted user fingerprint `46b1fb0c…` |
| Webhooks            | two: `2083611d…` and `72cac9b5…`       | one stable callback `d2456774…`          |
| Dedicated lines     | zero from the live lines endpoint      | zero from the live lines endpoint        |
| Billing mutation    | none; cancellation false               | none; cancellation false                 |

The isolated Preview callback fingerprint equals the exact stable webhook ID
held in ignored mode-`0600` custody. The two source callback route projections
also matched across both reads. No full project, phone, assigned destination,
webhook URL, credential, signing secret, Space, conversation, event, or message
identity was retained.

Two further read-only cross-provider resolutions removed the callback-ownership
ambiguity:

| Source webhook | Vercel owner readback                                                                                  | Query   |
| -------------- | ------------------------------------------------------------------------------------------------------ | ------- |
| `2083611d…`    | Bundjil agent project, READY Preview target, deployment fingerprint `fd4545ec…`, Git SHA `a3f8987…`    | present |
| `72cac9b5…`    | Bundjil agent project, READY Production target, deployment fingerprint `2cd0940b…`, Git SHA `e92f8d2…` | absent  |

The lookup resolved each protected callback origin through Vercel's
deployment-by-URL read endpoint inside process custody. Neither full origin nor
deployment identity was emitted or retained. This directly identifies
`2083611d…` as the preserved source-project Preview callback and
`72cac9b5…` as the Production callback; the earlier receipt is no longer the
only ownership evidence.

The fresh controlled-candidate inventory separately retained digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
Current Messages sender `82ac258d…` remains bound to unchanged source user
`020cc192…` and source destination `d4039779…`; it is reported available but
has no Preview binding. Availability is only a precondition and does not prove
duplicate cross-project registration.

## Isolation blocker and no-mutation decision

Fresh Vercel target readback identifies the two source-project callbacks as one
Production callback plus one preserved Preview callback. Photon documents that
a project event is delivered to every webhook registered on that project.
Fresh count, stable-ID, and target readback therefore establish that the
required postcondition—traffic to the source/Production destination reaches
Production only—cannot currently be proved.

The current authority explicitly forbids source/Production mutation. The
operator consequently stopped before the otherwise authorized Preview
shared-user create. No Photon user, webhook, line, project, platform, plan, or
credential changed; no Vercel operation, deployment, Messages action, SMS,
cold outbound call, callback probe, or message send occurred. Computer Use was
not opened because the provider-isolation prerequisite had already failed.

This is not evidence that Photon rejects one sender across two projects. The
duplicate-registration question remains untested. It is also not evidence that
the existing source callbacks are unhealthy, that the isolated Preview
callback received traffic, or that any Production or Preview response occurred
during this read-only slice.

## Required next authority

The smallest next operation is a separately approved source-project callback
retirement, not a Preview user change:

1. target only preserved Preview callback `2083611d…`; retain Production
   callback `72cac9b5…` unchanged;
2. capture immutable rollback identity and recover retained signing-secret
   custody for `2083611d…`, or explicitly authorize irreversible retirement
   after accepting that the create-only value cannot be restored;
3. prove `2083611d…` has no required traffic, wait through Photon's
   retry horizon, and delete only that exact source-project Preview callback;
4. read back one unchanged Production callback, both unchanged source users and
   assignments, and zero Preview-environment fan-out; and
5. only then attempt the one bounded Preview duplicate-registration operation
   and the exact iMessage-only journey from the decision receipt.

That operation mutates the source/Production Photon project and was not
authorized here. No upgrade, billing change, dedicated line, credential
rotation, Vercel mutation, or Production deployment is implicated.

Current ignored mode-`0600` custody contains the isolated Preview webhook
`d2456774…`, not source Preview webhook `2083611d…`. The current Vercel
Preview metadata is owned by that isolated callback, and provider metadata
cannot return an earlier create-only signing value. The local 1Password CLI was
unavailable during this readback. Therefore exact signing-secret rollback for
`2083611d…` is not yet proved. No deletion should run under the existing
runbook until custody is recovered or Cooper separately accepts the
irreversible retirement boundary.

## Requirement replay

| Material requirement           | Direct observable and expected postcondition                                                                                   | Plausible false green rejected                                               | Result and owner                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Separate project ownership     | Two authenticated project credentials return distinct project fingerprints and unchanged user sets                             | Different credentials without isolated callbacks                             | Passed for inventory; this receipt                                                                      |
| Zero dedicated lines           | The actual management `lines` endpoint returns zero in both projects                                                           | The reconciliation summary's hard-coded zero                                 | Passed; this receipt                                                                                    |
| Environment-isolated callbacks | Source owns one Production callback only; Preview owns one Preview callback only                                               | Two callbacks in one source project or a separate Preview callback alone     | Failed before mutation; `2083611d…` is Preview-target and `72cac9b5…` is Production-target              |
| Retirement rollback custody    | Exact obsolete callback can be restored from retained create-only secret custody, or irreversible loss is separately accepted  | Callback URL/ID alone treated as signing-secret rollback                     | Failed: current mode-`0600` and Vercel ownership do not prove the retired secret; 1Password unavailable |
| Shared-sender capability       | Sender `82ac258d…` gains a distinct Preview binding without source change                                                      | Availability, second UUID, or prior seeded user                              | Not attempted because isolation failed first                                                            |
| Bounded inbound journey        | Exact Preview recipient is iMessage and yields one Preview response, zero Production response, and exact duplicate disposition | SMS, source reply, synthetic event, or aggregate suite                       | Not admitted                                                                                            |
| Rollback                       | No state changes when a prerequisite fails                                                                                     | Running the permitted Preview create despite an impossible acceptance oracle | Passed: zero external mutations                                                                         |

## Repository verification

Focused Effect setup, boundary, docs, skills, authority, controls,
verification-policy, Photon typecheck, all 35 Photon tests, Photon build, JSON,
inventory-digest, and diff checks passed. Complete repository verification used
only the documented process-local synthetic Executor URL/key fixture and
passed HGI-307, 90 tooling tests, type-aware format/lint, the lint fixture,
Knip, all nine workspace typechecks, and all fifteen Turbo build/test tasks.
The complete gate was rerun after this receipt and task-ledger statement became
the exact commit candidate.

These repository checks prove owner and policy consistency only. They do not
upgrade the live blocked topology into duplicate-registration, message,
callback, response, or environment-isolation proof.

## Sources

- [Photon managed-shared routing](https://photon.codes/blog/how-we-rebuilt-our-shared-imessage-routing-to-handle-10m-messages-a-day)
- [Photon webhook events and project fan-out](https://photon.codes/docs/webhooks/events)
- [Dual-Channel Production acceptance receipt](channel-production-accepted-2026-07-23.md)
