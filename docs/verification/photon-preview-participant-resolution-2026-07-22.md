---
document_type: proof-receipt
lifecycle: inconclusive
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-22T22:54:00Z
artifact_git_identity: 38a89f90a3f190ed702e3dd8826943bb6371db5d
environment: vercel-preview-and-isolated-worktree
review_trigger: do not refresh; create a new dated receipt for the corrected immutable Preview candidate
---

# Photon Preview participant-resolution receipt — 2026-07-22

## Claim and scope

This receipt retains one inconclusive Photon Preview journey and the
repository correction it caused. Pushed source `38a89f90a3f190ed702e3dd8826943bb6371db5d`
produced READY Preview deployment `dpl_5sZhTL7wzi5AmRsb5cxz1YCXeieZ` behind the
dedicated protected Preview alias. The Photon webhook inventory contained one
exact callback to that alias, and its write-only signing binding was present in
the Preview environment.

The artifact identity above is the deployed source, not the later uncommitted
correction. No Production or Sendblue provider, environment, deployment,
webhook, routing, replay, message, or traffic state changed in this slice.

## Hosted observation

- an unsigned Photon request returned `401`;
- a valid signed ignored fixture returned `204` without dispatch;
- one fresh handset direct message produced a signed webhook `202`;
- the Eve workflow completed its hosted request sequence; and
- outbound completion failed before provider acceptance and was mapped to
  `ChannelUnavailableError` with operation `sendMessage`, reason `transport`,
  and retry class `backoff`.

No provider message identity was returned. The failed outbound was not retried.
No reply or visible typing indicator appeared on the handset. Duplicate replay
suppression was not exercised because the provider had already accepted the
inbound delivery and no safe redelivery control was available in this step.

## Diagnosis and repository correction

Photon's current webhook contract defines the serialized Space ID as opaque
and states there is no public serverless send or Space-by-ID lookup. For a DM,
an independent SDK instance resolves the webhook sender and reconstructs the
direct Space from that participant. The deployed private client instead called
`space.get(conversationId)`.

The local correction preserves the webhook Space ID as
`ChannelConversationId` for replay, routing, and state, but passes the decoded
`ChannelParticipantId` to the private Photon client. Both send and presence now
resolve `provider.user(participantId)` and then
`provider.space.create(participant)` inside the operation-scoped Spectrum
resource. Authenticated group events are ignored as
`unsupportedConversation`, because the serialized event cannot reconstruct a
group safely and a one-sender fallback would misroute into a DM.

Focused repository proof passed for the corrected source:

- Photon typecheck;
- all 25 Photon tests, including participant resolution for send and presence
  plus the group no-misroute contract; and
- Photon package build; and
- the complete repository verification gate: documentation, skill, authority,
  control, and twelve-journey policy checks; 76 boundary tests; formatting,
  lint, Knip, eight workspace typechecks, and 266 workspace tests.

These checks are local source proof only. They do not upgrade the failed
deployed artifact.

## Docs-maintainer impact ledger

| Surface                                      | Decision        | Result                                                                                                    |
| -------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| Photon client, transport, tests, and README  | Change required | Outbound DM reconstruction uses branded participant identity; groups fail safe before dispatch.           |
| SPEC, active plan, and task evidence         | Change required | Current intent and deployed/local proof boundaries record the discovered defect and required reproof.     |
| Photon runbook and verification route        | Change required | Hosted proof requires participant-based direct-Space reconstruction and routes this inconclusive receipt. |
| Neutral Channel and app orchestration        | Preserve        | Common conversation state, identity, routing, replay, and Eve contracts remain unchanged.                 |
| Sendblue and Production state                | Preserve        | No Sendblue or Production operation ran.                                                                  |
| Earlier dated receipts and research          | Preserve        | Their artifact-specific observations remain immutable.                                                    |
| Architecture, generated APIs, skills, CI, UI | N/A             | No durable architecture rule, generated surface, skill, workflow, frontend, or public release changed.    |

## Recovery, limitations, and next owner

The dedicated Preview alias and its exact Photon callback remain the recovery
boundary. The next owner must commit and push the correction, deploy a new
immutable Preview artifact, retarget the dedicated alias, and run one fresh
bounded DM journey. It must separately prove signed ingress, Eve completion,
provider-accepted reply, both typing transitions, SDK release, duplicate
suppression, and handset observations. It must not retry the failed outbound
recorded here.

## Sources

- [Photon webhook events](https://photon.codes/docs/webhooks/events)
- [Spectrum Spaces and Users](https://photon.codes/docs/spectrum-ts/spaces-and-users)
- [Spectrum typing indicators](https://photon.codes/docs/spectrum-ts/content/typing-indicators)
