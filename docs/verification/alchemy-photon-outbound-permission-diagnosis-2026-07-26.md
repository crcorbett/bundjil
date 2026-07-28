---
document_type: proof-receipt
lifecycle: superseded
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-26T20:00:27Z
artifact_git_identity: f50cd32a508f5d9f5ecc9e90c6ee3b03dae311a9
environment: bundjil-photon-outbound-permission-diagnosis
successor: docs/verification/alchemy-photon-conversation-topology-correction-2026-07-28.md
superseded_reason: fresh Messages and inventory evidence separates inbound-first shared replies from unproved cold outbound-first entitlement
review_trigger: retain as negative cold-outbound evidence; use the successor for current diagnosis and next action
---

# Alchemy Photon outbound-permission diagnosis — 2026-07-26

> **Lifecycle correction (2026-07-28):** the observed
> `PERMISSION_DENIED` remains valid negative evidence for a cold
> outbound-first managed-shared send. It is not evidence of a general Photon
> reply outage, a Preview-only regression, or a provider defect requiring
> repair. Current diagnosis and next action are owned by
> [`alchemy-photon-conversation-topology-correction-2026-07-28.md`](alchemy-photon-conversation-topology-correction-2026-07-28.md).

## Read-only scope

This observation compared the previously working Photon project, the isolated
Alchemy Preview project, their Vercel configuration metadata, the pinned
Spectrum adapter, current Photon documentation, and the authenticated Photon
dashboard. It performed no Photon or Vercel write, message send, credential
change, user or callback change, plan change, deployment, or Production
operation. Full project, credential, phone, assigned-route, user, webhook,
Space, message, and conversation identities remained in provider or process
custody.

## Fresh provider comparison

Authenticated owner-service readback returned the following sanitized state:

| Property                    | Previously working project                                         | Isolated Preview project                                           |
| --------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Project fingerprint         | `ad20033fcbadd799c549cd269739710d241c13b67fdbbc23c49bd2c755a10c01` | `37cf2944d0c285636c86324faf46354b6990b2fcfd9fa1981af6d24f05406ce4` |
| Credential-pair fingerprint | `1e1237360a0486913c3d95291dfc5c181bf45ad7332d4b94ab75de760c92a2f5` | `f5324ea1cbdf903c2371a3ce577d76ed120bfc68286d63edb5a3fb2a86f8e393` |
| Tier and service            | Free, managed shared                                               | Free, managed shared                                               |
| iMessage                    | enabled, auto-scale enabled                                        | enabled, auto-scale enabled                                        |
| Dedicated lines             | zero                                                               | zero                                                               |
| User topology               | two assigned shared users                                          | one assigned adopted shared user after exact rollback              |
| Profile and billing status  | profile absent; billing status absent; no cancellation             | profile absent; billing status absent; no cancellation             |
| Webhooks                    | two                                                                | one stable Preview callback                                        |

The management API exposes no send-capability, outbound-approval, activation,
allowlist-health, or shared-proxy-binding flag. Both credential pairs
authenticate their own management scope. The isolated credential can acquire
the Spectrum SDK and resolve a direct Space; the networked send is the first
operation that receives gRPC status `7` (`PERMISSION_DENIED`).

Vercel readback found exactly four branch-independent sensitive environment
metadata records for the two Photon runtime keys, separated into Production
and Preview targets. Vercel intentionally does not return plaintext values for
sensitive variables, so this read-only observation does not claim fresh
plaintext equality. The retained binding receipts own the earlier writes and
deployment-specific runtime proof.

## Provider contract and repository path

Photon's current pricing contract gives Free and Pro projects direct-messaging
iMessage API access through managed shared lines, while listing cold outreach
only for Business and Enterprise dedicated offerings. The troubleshooting
contract says a shared project may address only a recipient registered as a
user of that exact project, using the exact handle Apple uses for iMessage.
That allowlist rule narrows an otherwise admitted send; it does not guarantee
that Free/shared includes cold outbound-first initiation. The published
getting-started and deliverability paths prefer inbound-first, and the accepted
Bundjil receipts prove replies only after the registered user initiated.

Both the accepted Production artifact and the failed isolated Preview artifact
pin `@spectrum-ts/core@12.3.0`, `@spectrum-ts/imessage@12.3.0`, and
`@grpc/grpc-js@1.14.4`. Both run through
`PhotonTransportLive`: explicit project ID and secret, Spectrum Cloud iMessage,
participant resolution, direct-Space creation, and `space.send`. The SDK keeps
the cloud client private. Direct-Space creation is local; it is not provider
acceptance.

Every retained successful Photon journey was inbound-first:

- the registered handset identity messaged its assigned shared line;
- Photon created or delivered the inbound Space;
- Bundjil used that Space to send the reply.

The previously working project has not proved a cold outbound-first send. Its
earlier cold outbound attempt and a low-level shared-transport availability
RPC also stopped below the management/token plane. This distinction matters:
an inbound-created conversation has a provider-established shared-route
binding that the failed outbound-first attempt did not have.

## Superseded diagnosis and corrected boundary

The original diagnosis correctly localized the denial to cold outbound-first
shared transport rather than ordinary management authentication or SDK
construction. It incorrectly treated the remaining boundary as a provider
defect to repair. Fresh conversation mapping shows that all successful Bundjil
Photon sends were replies in inbound-created conversations, while cold
outbound-first attempts failed on both the source and isolated Preview
projects. Current pricing separately advertises cold outreach only for
Business/Enterprise dedicated offerings.

The retained provider-side hypotheses below remain possible explanations only
if the product later asks Photon whether duplicate cross-project assignment or
cold initiation should work:

1. the shared proxy has no current project-target binding, or its allowlist
   cache did not converge, despite management readback showing the temporary
   user assigned;
2. the same controlled identity's concurrent source/Preview registration
   exposes a shared-router binding defect even though management explicitly
   allowed both project references; or
3. the issued shared transport token lacks the required outbound permission
   for this project or RPC.

Do not repeat the cold send as the next verification. The correct Preview path
is:

1. Use the device/account owning the exact Apple identity registered to the
   retained Preview user and send one explicitly iMessage-labelled inbound
   message to that user's own assigned Preview line.
2. If that device/account is unavailable, obtain an explicit product decision
   to reconfigure Preview around an operator-originable identity or to ask
   Photon about a non-disruptive duplicate cross-project reference.
3. Preserve the adopted user and source binding until that decision. Never use
   the SMS-only temporary route or a source-project conversation as proof.

Do not rotate the credential, recreate the project, buy a dedicated line, or
upgrade the plan as a diagnostic shortcut. Those actions do not follow from
the observed evidence, and no support contact is the standing next step.

## Smallest verification after the operator identity is available

Perform one Preview-only bounded inbound-first verification:

1. re-read the unchanged source and isolated baselines;
2. prove the sending device/account owns the retained Preview user's exact
   registered Apple identity;
3. from an explicitly iMessage-labelled composer, send one non-sensitive
   inbound text to that user's own assigned Preview line;
4. require the signed Preview callback, Eve completion, one outbound reply,
   same-event retry suppression, typing transitions, and separate provider and
   handset readbacks; and
5. retain the one-user/one-callback topology unless an explicit later product
   decision authorizes a different isolated Preview topology.

## Limitations and non-claims

This diagnosis did not retrieve sensitive Vercel plaintext, obtain a Photon
support trace, prove cold-outbound entitlement, or change any provider state.
Its denied send remains negative evidence only. It does not prove a provider
defect, outbound delivery, Channel ingress, replay disposition, Eve
completion, typing, handset delivery, Production state, or terminal SPEC
closeout. The owning task remains in progress, and the terminal five-pass
audit has not run.

## Sources

- [Photon iMessage troubleshooting](https://photon.codes/docs/spectrum-ts/troubleshooting/imessage)
- [Photon iMessage deliverability](https://photon.codes/docs/best-practices/imessage-deliverability)
- [Photon Spaces and users](https://photon.codes/docs/spectrum-ts/spaces-and-users)
- [Photon pricing and number types](https://photon.codes/pricing)
- [Photon shared iMessage routing](https://photon.codes/blog/how-we-rebuilt-our-shared-imessage-routing-to-handle-10m-messages-a-day)
- [Photon status](https://status.photon.codes/)
