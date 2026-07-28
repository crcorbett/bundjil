---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-28T13:43:08Z
artifact_git_identity: 756d8256066b8bbc1b5af42f2212f0351ca8d668
environment: bundjil-photon-preview-messages-ui-gate
review_trigger: the retained Preview registered Apple identity becomes available on an operator-controlled iMessage device/account or the accepted Preview topology decision changes
---

# Alchemy Photon Preview Messages UI gate — 2026-07-28

## Authority and scope

Cooper explicitly authorized the bundled Computer Use plugin to inspect the
existing macOS Messages conversations and to send one bounded inbound-first
Preview message only if the exact sender, recipient, and iMessage transport
gates all passed. The inspection made no Photon, Vercel, credential, user,
callback, plan, deployment, Production, or support mutation.

Full phone, project, credential, conversation, Space, message, and content
values stayed in Messages, provider, or secure process custody. This receipt
retains only safe fingerprints and bounded UI observations.

## Direct UI observations

| UI observation                                                                                                                                                                                                                    | Classification                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| The existing conversation titled `Bundjil` exposed recipient fingerprint `6a6a862e…` in its details view and an `iMessage` composer.                                                                                              | This is the Sendblue conversation. Its iMessage label does not make it Photon proof.                                                                  |
| The unnamed conversation at recipient fingerprint `d4039779…` exposed only that recipient in its details view and an `iMessage` composer. Its visible transcript contains inbound-first user messages followed by Photon replies. | This is the accepted original/source-project Photon conversation, not the isolated Preview conversation.                                              |
| The Messages debug-bot row identified the current Mac start identity as fingerprint `82ac258d…` on the `iMessage` service.                                                                                                        | The Mac can originate iMessage from the source identity, but that identity is not the Apple identity registered to retained Preview user `db23193a…`. |
| The visible conversation inventory contained no conversation for retained Preview assigned-line fingerprint `db49756e…` and no current conversation for retired temporary route `0809669f…`.                                      | The exact retained Preview sender-recipient pair was not established in Messages.                                                                     |

## Send-admission result

| Required gate          | Expected postcondition                                                                                        | Result                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Exact sending identity | The active Messages start identity equals the Apple identity registered to retained Preview user `db23193a…`. | Failed. Current Mac identity fingerprint is `82ac258d…`.                                                     |
| Exact recipient        | The selected conversation recipient equals retained Preview assigned-line fingerprint `db49756e…`.            | Failed. No such conversation was present.                                                                    |
| Exact transport        | The exact Preview conversation composer says `iMessage`, never SMS.                                           | Not reached for the required pair. Existing Sendblue and source Photon conversations cannot prove this gate. |
| Message admission      | One uniquely identifiable message may be composed and sent only after all three gates pass.                   | Not admitted. No message was typed or sent.                                                                  |

Because no event was admitted, this observation has no reply, delivery, or
duplicate-count result. It would be a false green to record zero duplicates:
there was no Preview event against which duplicates could be counted.

## Restoration, limitations, and next owner

The Messages search was cleared and the app was returned to its ordinary
conversation list. No SMS, cold outbound-first attempt, uncertain-recipient
send, or provider-side operation occurred.

This receipt confirms the exact blocker that existed at its observation time:
the current Mac could not originate from the Apple identity registered to
retained Preview user `db23193a…`.

Cooper's later 2026-07-29 product decision selects a different required
topology: register the current controlled sender `82ac258d…` non-disruptively
in both separate projects, with distinct assigned destinations and isolated
webhooks. The decision and new proof oracle are owned by
[`alchemy-photon-shared-sender-topology-decision-2026-07-29.md`](alchemy-photon-shared-sender-topology-decision-2026-07-29.md).
This receipt remains valid evidence of the earlier no-send gate and does not
prove that the newly selected topology is supported.

The stable rollback remains the previously proved isolated Preview topology:
one adopted user, one stable callback, unchanged source bindings, and restored
inventory digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
No Preview Channel delivery, signed webhook, same-event replay disposition,
Eve completion, outbound response, typing, handset delivery, Production state,
or terminal SPEC result is claimed.

## Related owners

- [`alchemy-photon-conversation-topology-correction-2026-07-28.md`](alchemy-photon-conversation-topology-correction-2026-07-28.md)
- [`alchemy-photon-preview-native-origin-2026-07-26.md`](alchemy-photon-preview-native-origin-2026-07-26.md)
- [`../../apps/agent/runbooks/photon.md`](../../apps/agent/runbooks/photon.md)
