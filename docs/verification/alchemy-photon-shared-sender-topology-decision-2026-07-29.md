---
document_type: decision-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-28T17:18:57Z
artifact_git_identity: 12157bcfeacf49b516c176f7d85868cf4c0f0ac9
environment: bundjil-photon-shared-sender-topology-decision
review_trigger: live Photon duplicate-registration or isolated-routing evidence, a shared-routing contract change, or a different product topology decision
---

# Alchemy Photon shared-sender topology decision — 2026-07-29

## Accepted product topology

Cooper requires one controlled iMessage sender identity to work in both
Production and Preview without moving or altering the working Production
binding. Production and Preview remain separate Photon projects with separate
credentials, separate Photon-assigned destination lines, and separate
environment webhook routing:

| Sender action                                                                   | Required owner                                 |
| ------------------------------------------------------------------------------- | ---------------------------------------------- |
| Send from the controlled sender to the Production Photon destination            | Production project and Production webhook only |
| Send from the same controlled sender to the distinct Preview Photon destination | Preview project and Preview webhook only       |

The accepted topology forbids requiring another Apple identity or device. It
also forbids putting both environment callbacks in one Photon project: Photon
delivers one project event to every webhook registered on that project, so
two callbacks in one project do not provide environment isolation.

## Provider contract to prove

Current official Photon material says managed-shared inbound ownership is
resolved from the pair of Photon destination number and sender number. That
model is consistent with one sender owning distinct conversations in separate
projects when each project has a distinct assigned destination, but it does not
by itself prove that the current management API admits duplicate cross-project
registration.

Before any send, the live proof must establish all of the following:

1. the source/Production project still owns the controlled sender and its
   existing assigned destination;
2. the isolated Preview project has separate credentials, one stable Preview
   webhook, and zero dedicated lines;
3. the Preview management API can adopt or create the same sender without
   detaching, reassigning, disabling, or changing the source binding;
4. Preview receives a distinct assigned destination whose Messages composer is
   explicitly iMessage rather than SMS;
5. a message to the Preview destination reaches exactly the Preview webhook,
   produces one Preview response, reaches no Production webhook, and has an
   exact duplicate disposition; and
6. complete source and Preview readback after the journey preserves the
   Production binding and the accepted stable Preview topology.

Availability alone, an idempotent-looking create response, a second user UUID,
an assigned number, an iMessage label for another conversation, a source
project reply, an SMS route, a synthetic webhook, or two callbacks in one
project are rejected false greens.

## Authority and stop conditions

Cooper authorizes fresh source/Production and Preview readback, the minimum
Preview-only user mutation required to register the existing sender, one
bounded inbound-first Preview iMessage through Messages after every gate
passes, signed Preview callback and isolation readback, and exact cleanup of
rollout-created or failed Preview resources.

The operation stops without a send if Photon rejects the duplicate
cross-project sender, moves or changes the source binding, assigns only an SMS
route, returns an ambiguous outcome that cannot be reconciled by exact
readback, or cannot prove isolated routing. Photon support may be asked the
exact non-disruptive configuration question, but this authority permits no
Production mutation, Vercel mutation, deployment, credential rotation,
billing change, upgrade, paid or dedicated line, SMS, cold outbound-first
message, or main-branch merge.

The formal five-pass audit remains deferred until every SPEC task is honestly
terminal.

## Starting evidence and non-claims

The last proved rollback has one adopted Preview user, one stable Preview
webhook, unchanged source bindings, and inventory digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
The current Mac iMessage identity is fingerprint `82ac258d…`; the accepted
source Photon destination is fingerprint `d4039779…`. The prior retained
Preview user `db23193a…`, destination `db49756e…`, and temporary SMS-only route
`0809669f…` remain historical observations, not the new acceptance topology.

This decision receipt proves authority and intended topology only. It proves
no current provider state, duplicate registration, Preview iMessage route,
message delivery, webhook isolation, response, duplicate result, Production
non-response, or stable post-mutation topology.

## Subsequent readback boundary

The separately routed
[`alchemy-photon-shared-sender-topology-readback-2026-07-29.md`](alchemy-photon-shared-sender-topology-readback-2026-07-29.md)
records two matching live provider reads. Source/Production remains Free/shared
with two unchanged users, zero dedicated lines, and two webhooks; isolated
Preview remains Free/shared with one adopted user, zero dedicated lines, and
the exact stable callback `d2456774…`. Candidate inventory still reports
sender `82ac258d…` unchanged in source and available but unbound in Preview.

The accepted Production receipt identifies the two source webhooks as one
Production callback plus one preserved Preview callback. Because Photon fans
one project event to every project webhook, the required Production-only
routing postcondition already fails. The authorized slice therefore stopped
before a Preview user mutation or Messages action. Duplicate cross-project
registration remains untested; separate source-project authority is required
to retire only the preserved Preview callback before this decision's live
capability and journey proof can resume.

## Official sources

- [Photon managed-shared routing](https://photon.codes/blog/how-we-rebuilt-our-shared-imessage-routing-to-handle-10m-messages-a-day)
- [Photon webhook events and project fan-out](https://photon.codes/docs/webhooks/events)
- [Photon pricing and number types](https://photon.codes/pricing)
