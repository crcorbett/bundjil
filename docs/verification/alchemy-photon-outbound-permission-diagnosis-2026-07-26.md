---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-26T20:00:27Z
artifact_git_identity: f50cd32a508f5d9f5ecc9e90c6ee3b03dae311a9
environment: bundjil-photon-outbound-permission-diagnosis
review_trigger: replace after Photon support identifies the shared-transport cause or a later bounded outbound verification changes the result
---

# Alchemy Photon outbound-permission diagnosis — 2026-07-26

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

Photon's current pricing contract gives Free and Pro projects full direct
messaging iMessage API access through managed shared lines. Its troubleshooting
contract narrows shared outbound further: a Free or Pro project may message
only a recipient registered as a user of that exact project, using the exact
handle Apple uses for iMessage. The prescribed self-service checks are the
project Users page and Photon's debug line. No separate outbound-enable or
approval control is documented or surfaced in the authenticated Free/shared
getting-started flow; that flow is inbound-first and describes the assigned
line as replying only to added users. Business adds a dedicated line and
cold-outreach capability, but the published Free/shared contract does not
require Business for one registered target.

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

## Diagnosis and fix boundary

The confirmed cause boundary is a Photon shared-transport authorization or
route-binding failure for outbound-first delivery, not an inactive plan,
disabled iMessage platform, missing line purchase, invalid management
credential, different SDK version, different Bundjil adapter, or broad Photon
outage. Photon reports all systems operational, but that does not prove this
project-specific binding.

The exact internal cause is not externally observable. Ranked provider-side
possibilities are:

1. the shared proxy has no current project-target binding, or its allowlist
   cache did not converge, despite management readback showing the temporary
   user assigned;
2. the same controlled identity's concurrent source/Preview registration
   exposes a shared-router binding defect even though management explicitly
   allowed both project references; or
3. the issued shared transport token lacks the required outbound permission
   for this project or RPC.

The public troubleshooting path must be exhausted before another send:

1. Recreate the bounded Preview user only under the existing mutation
   authority and read back its stable assignment.
2. Use Photon's debug line from the exact controlled Apple sender to establish
   the handle Apple actually presents; require an exact match to the registered
   Preview user.
3. If the match passes, give Photon support the project ID, exact observation
   time, exact safe error string, target and debug handles, SDK/runtime
   versions, and the assigned user identity through secure support custody.
   Ask Photon to trace and repair the shared outbound project-target binding or
   transport-token authorization. Photon documents email/Discord escalation
   for failures that remain after the user-handle checks.
4. If requested by Photon, enable Spectrum messaging telemetry for one
   separately authorized bounded retry so Photon can inspect provider
   initialization, Space resolution, and send spans. Telemetry is not a
   dashboard toggle and is disabled in the current Bundjil adapter.

Do not rotate the credential, recreate the project, buy a dedicated line, or
upgrade the plan as a diagnostic shortcut. Those actions do not follow from
the observed evidence. If Photon instead confirms that new outbound
conversations are intentionally unsupported on Free/shared despite its current
published contracts, the supported choices become inbound-first proof or a
dedicated Business line, and the SPEC must be revised before either topology
change.

## Smallest verification after repair

After Photon confirms the binding or entitlement repair, perform one
Preview-only bounded verification:

1. re-read the unchanged source and isolated baselines;
2. create one exact temporary registered Preview user and wait for stable
   assignment plus provider-confirmed binding convergence;
3. send one non-sensitive outbound text through the existing SDK without
   automatic retry and require a provider message identity plus iMessage
   conversation/delivery readback;
4. treat that result only as outbound proof because outbound messages do not
   echo through Photon webhooks;
5. reply only from an iMessage-labelled conversation and require the signed
   Preview callback, Eve completion, outbound response, typing transitions,
   and delivery readbacks for the full Channel proof; and
6. restore the stable callback and one-user topology with exact cleanup and
   source/Preview readback.

## Limitations and non-claims

This diagnosis did not retrieve sensitive Vercel plaintext, exercise the debug
line, obtain a Photon support trace, send a message, prove a current
project-target binding, or change any provider state. It does not prove the
ranked internal cause, outbound delivery, Channel ingress, replay disposition,
Eve completion, typing, handset delivery, Production state, or terminal SPEC
closeout. The owning task remains in progress, and the terminal five-pass
audit has not run.

## Sources

- [Photon iMessage troubleshooting](https://photon.codes/docs/spectrum-ts/troubleshooting/imessage)
- [Photon iMessage deliverability](https://photon.codes/docs/best-practices/imessage-deliverability)
- [Photon Spaces and users](https://photon.codes/docs/spectrum-ts/spaces-and-users)
- [Photon pricing and number types](https://photon.codes/pricing)
- [Photon shared iMessage routing](https://photon.codes/blog/how-we-rebuilt-our-shared-imessage-routing-to-handle-10m-messages-a-day)
- [Photon status](https://status.photon.codes/)
