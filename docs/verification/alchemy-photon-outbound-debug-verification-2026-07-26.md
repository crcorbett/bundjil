---
document_type: proof-receipt
lifecycle: superseded
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-26T21:32:32Z
artifact_git_identity: fcbf62c5d7f488fb16e25b5f9bbbb299c4fae44c
environment: bundjil-photon-preview-outbound-debug-verification
successor: docs/verification/alchemy-photon-conversation-topology-correction-2026-07-28.md
superseded_reason: fresh conversation topology proves the denial concerns cold outbound-first managed-shared traffic rather than ordinary reply delivery
review_trigger: retain as negative cold-outbound evidence; use the successor for current diagnosis and next action
---

# Alchemy Photon outbound debug verification — 2026-07-26

> **Lifecycle correction (2026-07-28):** the handle match, exact temporary
> topology, zero-retry denial, and rollback remain valid observations. The
> denial is negative evidence for cold outbound-first managed-shared traffic,
> not a general Photon send outage or a Preview-only regression. Current
> diagnosis is owned by
> [`alchemy-photon-conversation-topology-correction-2026-07-28.md`](alchemy-photon-conversation-topology-correction-2026-07-28.md).

## Scope and authority

Cooper authorized one bounded Preview-only debug probe, temporary-user
reconciliation, outbound-first test message, fresh readback and exact cleanup.
No Production resource, Vercel binding, callback, deployment, credential,
plan, billing, dedicated line or unrelated Photon resource changed. Full
project, credential, phone, assigned-line, user and message identities remained
in provider or secure process custody.

## Exact handle proof

Photon's documented debug link opened an explicitly iMessage-labelled and
encrypted Messages conversation. One `debug` command was delivered, and the
debug bot reported both its observed GUID and address as the same E.164 handle
with fingerprint
`82ac258dac9ee2fbdf7430c0e8a1177433ea236c06cd045ffe8683af1a0cc4c5`.
That exactly matches the approved controlled candidate and rejects an
unverified Apple start identity, email/phone mismatch and SMS fallback.

Two pre-create inventories matched the restored baseline digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
Photon then created exactly one temporary Preview user for the debug-verified
handle. Two post-create inventories matched digest
`21f343bcef7cd86c3f1e9312d7a4536c7d3b3be98a001a6f2854768e03aa32e9`
and read back:

- temporary user fingerprint
  `104f9ab4f098823f7468556228ebce7618b419154b389d0bae7e2718871bd418`;
- assigned Photon line fingerprint
  `0809669fba7cf6164486add33143457d5a1c3120ef91b937a4c98e69663200c3`;
- unchanged source user, source assigned line, adopted Preview user and adopted
  Preview assigned line; and
- one stable Preview callback, with no proof callback or Vercel change.

## Outbound target correction and provider denial

The first bounded negative-control call resolved a direct Space using the
temporary user's **assigned Photon line** as participant. Photon rejected it
with `ValidationError`, provider code `internalError`, transport status `3`
and `retryable=false`. It returned no provider message identity and ran no
automatic retry. This call did not target the registered Apple handle and is
not the authorized outbound-first message.

That failure exposed an important identity distinction:

- `user.phoneNumber` is the debug-verified registered Apple handle and is the
  outbound SDK target; and
- `user.assignedPhoneNumber` is the Photon shared line the user messages for
  inbound delivery.

The corrected call used the exact registered Apple handle through the existing
`PhotonClient.sendMessage` boundary. The client acquired Spectrum, resolved
the direct Space and invoked `space.send` once. At
`2026-07-26T21:31:57.524Z`, Photon rejected the send with
`AuthenticationError`, provider code `internalError`, gRPC transport status
`7` (`PERMISSION_DENIED`) and `retryable=false`. The wrapper performed zero
automatic retries, released the scoped SDK and received no provider message
identity. Therefore no iMessage delivery, Messages return conversation,
webhook ingress, Eve completion, agent response, typing or handset result is
claimed.

The debug match excludes a handle typo for this denied cold send. It does not
establish a Free/shared cold-outbound entitlement. Fresh evidence also records
a source-project cold outbound denial, while successful Photon sends are
inbound-first replies. The exact internal transport interpretation remains
provider-owned and is not the standing blocker for the Preview Channel proof.

## Retained conditional Photon support packet

Transmit the full values below only through Photon's secure support custody.
The repository retains fingerprints and bounded metadata:

| Field                               | Bounded value                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| Environment                         | isolated Bundjil Photon Preview only                                                    |
| Project fingerprint                 | `37cf2944d0c285636c86324faf46354b6990b2fcfd9fa1981af6d24f05406ce4`                      |
| Registered Apple handle fingerprint | `82ac258dac9ee2fbdf7430c0e8a1177433ea236c06cd045ffe8683af1a0cc4c5`                      |
| Temporary user fingerprint          | `104f9ab4f098823f7468556228ebce7618b419154b389d0bae7e2718871bd418`                      |
| Assigned shared-line fingerprint    | `0809669fba7cf6164486add33143457d5a1c3120ef91b937a4c98e69663200c3`                      |
| Debug result                        | exact E.164 GUID/address match over iMessage                                            |
| Failed operation                    | `PhotonClient.sendMessage` → Spectrum Cloud iMessage → direct Space → `space.send`      |
| Failure time                        | `2026-07-26T21:31:57.524Z`                                                              |
| Safe failure                        | `AuthenticationError`; `internalError`; gRPC `7` `PERMISSION_DENIED`; `retryable=false` |
| Runtime                             | Bun; `@spectrum-ts/core@12.3.0`; `@spectrum-ts/imessage@12.3.0`; `@grpc/grpc-js@1.14.4` |
| Retry disposition                   | one corrected send call; zero automatic retries; no provider message identity           |

Only if the product owner chooses to investigate a non-disruptive duplicate
cross-project reference or cold-initiation entitlement should Photon support
answer:

> The exact Free/shared target is assigned as a user of this project and
> Photon's debug bot reports the same Apple E.164 handle. Why does the shared
> outbound transport still deny `space.send` with gRPC status 7? Please trace
> whether the project-target binding or allowlist cache failed to converge,
> whether the same controlled identity's concurrent project registrations are
> incorrectly fenced, or whether the issued transport token lacks outbound
> authorization for this project. Please identify the provider-side repair and
> the readback that proves it before another send.

Do not contact support, rotate credentials, recreate the project, upgrade the
plan or purchase a dedicated line without that explicit product decision and
separate authority.

## Exact cleanup and non-claims

Two post-failure inventories still matched the two-user digest. Cleanup deleted
only temporary user fingerprint `104f9ab4…418`, then two final inventories
matched the original digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
The source bindings and adopted Preview user remained unchanged, final Preview
topology is one adopted user plus one stable callback, and the temporary handle
was removed from ignored mode-`0600` custody.

The task is not blocked on mandatory Photon support. It is blocked on the
operator identity/topology choice recorded by the successor receipt. This
receipt does not prove outbound-first acceptance, Preview inbound-first reply,
Channel ingress, replay, delivery, Eve, typing, handset, Production or
terminal SPEC closeout. The formal five-pass audit has not run.

## Sources

- [Photon iMessage troubleshooting](https://photon.codes/docs/spectrum-ts/troubleshooting/imessage)
- [Photon iMessage deliverability](https://photon.codes/docs/best-practices/imessage-deliverability)
- [Photon Spaces and users](https://photon.codes/docs/spectrum-ts/spaces-and-users)
- [Photon webhook events](https://photon.codes/docs/webhooks/events)
