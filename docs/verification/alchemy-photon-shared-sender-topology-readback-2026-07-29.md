---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-30T09:49:22Z
artifact_git_identity: 8cf0c1ef66ce0cbaf50d2ab180a6300e810aedf7
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

## Read-only application-boundary diagnosis

An exact valid-signature unsupported-event probe against the stable callback on
source commit `1f8600d79c60ae5451ee09cd4d7bab2f158e0b4e` returned `204` with no
redirect or body. The matching deployment log contained that one `204` and no
other result. This directly proves that the deployed Preview runtime resolves
the retained callback ID, signing-secret custody and exact path. It does not
explain the provider-originated `401`, prove the provider request used the same
signature inputs, or prove message acceptance.

Authenticated reads through three Vercel surfaces produced the same
write-only result for the sensitive Preview
`BUNDJIL_CHANNEL_ROUTING_IDENTITIES` record:

- the environment API returned exact metadata but no decrypted value;
- `vercel env pull` emitted an empty redacted value into an ephemeral file
  that was deleted immediately; and
- the dashboard editor exposed no readable current value and was cancelled
  without saving.

Nine Production Photon Agent Run details and traces from the accepted journey
window contained no `principalId`. Exact-key searches found no local ignored
env or process-environment copy. Sanitized inspection of retained task-session
records found code, fixtures and later read-only probes only; it did not yield
the configured owner value. No value, message, full participant identity,
credential, run identity or trace content was retained in this receipt.

The existing directory therefore cannot be appended or merged. The next
Preview configuration must be an intentional overwrite under separate Vercel
authority and must use either an exact owner-supplied canonical principal ID or
an explicit product decision adopting a new stable Preview principal ID. A
test fixture, guessed owner string, neighbouring Production run or successful
signed `204` is rejected as proof by proxy. The existing webhook configuration
remains preserved.

## Approved routing-directory resume

On 2026-07-30 Cooper explicitly approved generating a new opaque stable
Preview Channel principal and replacing the complete Preview-only routing
directory with the one controlled-sender record. The generated principal has
safe fingerprint `1b41b326…`; the exact one-record mapping has sanitized
digest `96971a51…` and is retained only in ignored mode-`0600` local custody.
A fresh pre-mutation candidate inventory at
`2026-07-30T02:47:16.046Z` matched the restored digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`,
showed sender `82ac258d…` unchanged in the source project and available in
Preview, and retained the adopted Preview user/callback.

The bounded envelope authorizes the complete Preview-only overwrite, one
resulting immutable deployment/readback, one minimal Preview shared-user
reconciliation, and one inbound-first iMessage/replay journey with exact
cleanup on failure. Production, billing, SMS, cold outbound, credential
rotation, main merge, and unrelated mutation remain excluded. This section is
authority and precondition evidence only; it does not claim the overwrite,
deployment, user, message, replay, Eve completion, or stable topology has
succeeded.

## Resumed Preview journey and rollback

The approved Preview-sensitive metadata update completed at
`2026-07-30T02:51:07.479Z`. Immutable deployment fingerprint `687e5a7d…` at
source `29467f1…` reached READY. A signed unsupported-event probe returned
`204` with no redirect, location or body, and its exact deployment log
contained one `ignored/unsupportedEvent` disposition with zero retained
participant, principal, signature or bypass fingerprints.

One owner reconciliation then created rollout Preview user `19489599…` with
destination `0809669f…`. Two-read inventory digest `89282717…` proved sender
`82ac258d…` remained bound to unchanged source destination `d4039779…`, gained
the distinct Preview destination, and preserved the adopted Preview
user/callback, shared service and zero dedicated lines.

Computer Use re-read the selected Messages conversation and provider custody
before sending. The signed-in Messages identity fingerprint matched
`82ac258d…`, the recipient matched `0809669f…`, and the composer explicitly
showed iMessage/Encrypted. One bounded message fingerprint `4961806c3e06…`
was sent and displayed Delivered. The transcript contained no agent reply.
Full sender, destination, message content, conversation, Space and message
identities remained in process/provider custody and were cleared after
readback.

The application acceptance gate failed closed at
`2026-07-30T02:56:38Z`. The exact Preview deployment window contained one
`ignored/unsupportedService` disposition and one
`authenticationRejected` disposition, with no `acceptedForDispatch`,
`duplicate`, provider-retry control, Eve completion, response or typing
evidence. The rows contained none of the retained fingerprint/signature/bypass
sentinels. The Production deployment window contained zero rows, but its log
surface had no same-window positive control; that is retained as a limitation,
not a proved zero-Production-response claim.

Current official Photon event documentation says an iMessage webhook carries
`iMessage` in the top-level space, message, sender and nested-space platform
fields. The safe app disposition proves at least one observed provider value
did not satisfy that contract; it does not identify the exact field or justify
case-folding, SMS acceptance, payload retention, another message, or a
repository decoder change. The separate authentication rejection likewise
does not identify a signature input mismatch.

No retry or additional callback appeared during a 239-second observation,
longer than the documented approximately 3.5-minute retry horizon. Guarded
cleanup then deleted only rollout user `19489599…`/destination `0809669f…`.
Two subsequent candidate-inventory commands each matched the restored digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
Source users/assignments and sole Production callback, adopted Preview user,
Preview callback, service, platform, lines, billing and credentials remained
unchanged.

The approved one-record Preview routing mapping and immutable deployment
remain for diagnosis. Exact restoration of the overwritten write-only routing
value is impossible by the accepted product decision; its replacement remains
recoverable from ignored mode-`0600` custody. No second message, SMS, cold
outbound, Production mutation, billing change, credential operation or main
merge occurred.

## Read-only boundary diagnosis and correction candidate

Exact deployment logs proved that the `204` occurred at
`2026-07-30T02:56:38.255Z` and the `401` at
`2026-07-30T02:56:38.951Z`: two distinct requests 696 milliseconds apart.
Photon documents any `2xx` as terminal, so the later `401` cannot be a retry
caused by the earlier `204`. Authenticated Preview dashboard readback showed
one retained webhook and no delivery-attempt detail or repair control. Neither
surface exposes the historical wire platform value or failed authentication
input.

The repository candidate based on
`deb52f41590145f981e781452b1f51efe199e468` adds one private
`PhotonWebhookBoundaryDisposition` record at the owning transport boundary.
Authentication rejections name only `headers`, `webhookId`, `timestamp`, or
`signature`; unsupported-service results name only `spacePlatform`,
`messagePlatform`, `senderPlatform`, or `messageSpacePlatform`. Direct tests
exercise each checkpoint independently and prove that an explicit
provider-value sentinel is absent after Schema encoding. The diagnostic does
not enter package exports and never records the observed value, headers, body,
identity, URL, signature, or credential.

Focused Photon typecheck, the direct 14-test transport fixture, Photon build,
the cross-app Channel fixture, Effect language-service diagnostics, and every
routed repository policy gate pass. Full `bun run verification` also passes
with the process-local synthetic Executor fixture; the documentation audit
checked 272 routed files with zero findings. Deployment and safe synthetic
checkpoint probes then ran against immutable Preview deployment `AB9G854g…`,
which reached READY from exact source `7e29cc9…`. The eight requests returned
the expected four `401` and four `204` classes. Deployment-scoped logs
contained exactly one `headers`, `webhookId`, `timestamp`, `signature`,
`spacePlatform`, `messagePlatform`, `senderPlatform`, and
`messageSpacePlatform` record, with zero occurrences of the explicit
provider-value leak sentinel. This evidence does not retroactively classify
the historical requests, authorize a provider retry, prove Photon-originated
ingress, or satisfy the Channel journey.

## Resumed provider-contract diagnosis

The pinned installed SDK resolves the platform failure without retaining the
historical value. `@spectrum-ts/imessage@12.3.0` defines its provider as exact
lowercase `imessage`, and Photon's current provider guide states that cloud
iMessage uses that ID. Photon's current webhook event example still spells
the field `iMessage`. The example and installed provider contract therefore
conflict; the installed owner contract plus the repeated `spacePlatform`
rejection makes Bundjil's exact `iMessage` check defective. The corrected
adapter accepts only `imessage` at all four positions and does not case-fold or
accept both spellings.

The separate provider-originated `401` remains unclassified. Photon's current
signature contract requires timestamp, signature and exact body bytes, while
the delivery contract also documents event and webhook-ID headers. Photon
management exposes no delivery-attempt metadata, and retained Vercel logs
contain no header presence. The repository correction therefore does not
guess a missing header or change signature policy. It replaces aggregate
`headers` with exact required-header plus `missing|malformed`, and classifies a
rejected platform only as `knownAlternative|caseVariant|unknown`. Direct
fixtures cover all eight header presence/shape properties, all later
authentication checks, all four platform positions and all four platform
classes. Schema encoding rejects explicit header/platform leak sentinels.
Effect language-service diagnostics report zero findings; Photon typecheck and
all 38 package tests pass. The exact receipt-bearing candidate also passes
boundaries, docs, skills, authority, controls, verification policy, HGI-307,
90 tooling tests, type-aware format/lint, the lint fixture, Knip, all nine
workspace typechecks, all 63 agent tests, all 38 Photon tests and all fifteen
Turbo build/test tasks with only the process-local synthetic Executor fixture.
Deployment and a new provider event remain pending, so the exact cause of the
second request, accepted ingress, Eve response, duplicate, typing and
environment-isolated Production-zero behavior are not claimed.

## Approved bounded journey retry

Cooper approved the exact proposed retry envelope in this Codex thread on
2026-07-30. It authorizes one Preview-only shared-user recreation for sender
`82ac258d…`, unchanged source-binding and distinct-destination readback, one
explicitly iMessage-labelled inbound-first send, signed webhook/runtime
readback, one bounded Eve/reply/replay journey, retry-horizon observation, and
deletion of only the rollout-created user on failure. A fully accepted stable
Preview topology may be retained. Production mutation, SMS, cold outbound,
billing or paid lines, credential changes, Vercel configuration, unrelated
resources, main merge, and terminal audit are excluded.

Immediately before this approval slice, two candidate-inventory commands each
performed two sequential reads and returned restored digest `9e6108d5…`.
Sender `82ac258d…` remained source-bound, Preview-available, and absent from
Preview. The adopted Preview user/callback remained unchanged. Deployment
`6bVHqBib…` at source `654c5ac…` remained READY on the branch alias, and no
unexpected callback appeared after the final safe probe. These facts establish
write eligibility only; they do not claim create, send, ingress, response,
replay, retention, or cleanup.

## Approved bounded retry result and rollback

One owner reconciliation created only Preview rollout user `ab4f5f8d…` with
distinct destination `0809669f…`. Immediate candidate inventory retained the
source binding `020cc192…`/`d4039779…` and adopted Preview binding
`46b1fb0c…`/`db49756e…`; the source and Preview project fingerprints remained
`ad20033f…` and `37cf2944…`.

Read-only Messages Settings proved the selected start identity was exact sender
`82ac258d…`. The new conversation targeted exact Preview destination
`0809669f…` and the composer explicitly said iMessage. One non-sensitive
message whose retained safe fingerprint is `605f8245…` was sent once. The
accessibility tree contained exactly one outgoing iMessage container, two
text-node representations of that same container, one Delivered marker, and
zero SMS containers. The duplicated text nodes are not two sends.

The final Preview deployment `6bVHqBib…` at source `654c5ac…` received two
separate requests:

| Request | HTTP/application disposition       | Private boundary checkpoint |
| ------- | ---------------------------------- | --------------------------- |
| First   | `204` `ignored/unsupportedService` | `spacePlatform`             |
| Second  | `401` `authenticationRejected`     | `headers`                   |

There was no `acceptedForDispatch`, Eve completion, outbound response,
same-event duplicate, typing, or additional callback through the conservative
retry horizon. Messages exposed no incoming reply. The latest Production
deployment returned no log row in the same window, but the window lacked an
independent Production positive control; this receipt therefore records zero
observed Production traffic, not proof of zero Production response.

The first checkpoint means only that the decoded top-level `space.platform`
was not exact accepted literal `iMessage`; it does not retain or infer the
observed value. The second means required-header decoding failed before
webhook-ID, timestamp, or signature checks; it does not identify which required
header was missing or malformed. The two requests cannot be described as an
accepted event plus provider retry: Photon's documented `2xx` terminal rule
still applies.

After the retry horizon, cleanup re-read the exact sender/user/destination and
preservation guards, then called the named `PhotonManagement.deleteSharedUser`
operation for only rollout user `ab4f5f8d…`. Decoded delete success and
immediate list readback reduced Preview users from two to one. Two independent
post-cleanup candidate inventories at `2026-07-30T04:14Z` each performed two
matching reads and restored digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
Sender `82ac258d…` is again absent from Preview and unchanged in source;
adopted Preview user `46b1fb0c…` remains. No webhook, platform, service, plan,
billing, credential, deployment, Vercel configuration, or Production resource
was mutated.

The authorized retry is complete and failed closed. It directly repeats and
narrows the live provider/application mismatch, but it does not prove accepted
ingress, identity resolution, Eve completion, one reply, replay, typing, or
environment-isolated Production-zero behavior. The owning task remains open
for Photon/provider contract resolution, and the terminal five-pass audit has
not run.

Focused verification passed Effect language-service, boundary, docs, skills,
authority, controls and verification-policy gates; Photon typecheck/build and
23 lifecycle/transport tests; and the exact 12-test Channel vertical command.
The first Channel command was started in parallel before Photon `dist` existed
and failed at module resolution; it was not an application failure and the
same command passed after the owning package build completed. Full
`bun run verification` then passed on the receipt-bearing candidate with
HGI-307, 90 tooling tests, type-aware format/lint, the lint fixture, Knip, all
nine workspace typechecks, all 37 Photon tests, all 63 agent tests, and all
fifteen Turbo tasks. The process-local synthetic Executor fixture made no
external request. These repository checks do not upgrade the failed provider
journey.

## Repository disposition-oracle correction

The owning Channel route previously collapsed ignored, duplicate and
identity-rejected inputs into the same unlogged `204`; it also returned `401`
without recording the authentication disposition. The repository correction
adds one `ChannelWebhookDisposition` record at each returned route class. Its
payload is limited to the branded webhook path, a closed disposition literal
and, where applicable, a closed ignore/identity/routing reason or replay
operation.

The direct vertical fixture asserts exact records for ignored, duplicate,
identity rejection, authentication rejection, schema rejection, replay
failure, routing failure, accepted dispatch and the provider-retry control.
It encodes the captured records through Effect Schema and proves that explicit
participant and message leak sentinels are absent. An HTTP status, a logger
construction test or a neighbouring provider assertion is not accepted as
proof.

Immutable Preview deployment `310dc759…` reached READY. At
`2026-07-30T02:28:08.325Z`, one exact signed unsupported-event probe against
the stable branch callback returned `204` with no redirect, location or body.
The exact deployment log window contained one
`ChannelWebhookDisposition`, classified `ignored` with reason
`unsupportedEvent`, and zero participant, principal, message-sentinel,
signature or protection-bypass tokens.

This proves the disposition oracle at the deployed safe callback. It does not
retroactively classify the historical `204` or `401`. Another real message
remains ineligible without the later exact routing-directory decision,
immutable configuration readback and new bounded message authority.

The exact repository candidate passed Effect language-service diagnostics,
boundary, docs, skills, authority, controls and verification-policy gates,
HGI-307, 90 tooling tests, type-aware format/lint, the lint fixture, Knip, all
nine workspace typechecks, all 63 agent tests, all 35 Photon tests and all
fifteen Turbo tasks. The process-local synthetic Executor Config fixture made
no external request.

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

| Material requirement                  | Direct observable and expected postcondition                                               | Plausible false green rejected                                | Result and evidence owner                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| No required obsolete-callback traffic | Exact callback/path has zero rows and a positive-control request becomes one row           | Empty project-wide logs or an unverified zero count           | Passed before deletion; this receipt and Vercel runtime logs                        |
| Exact callback retirement             | Only `2083611d…` disappears; `72cac9b5…` and source users remain                           | Deleting by count, hostname, or list order                    | Passed after 225-second drain; Photon management readback                           |
| Retirement rollback                   | Irreversible secret loss is explicitly accepted and recorded                               | Stable ID/URL described as exact signing-secret restoration   | Passed for authorized irreversible retirement; exact restoration remains impossible |
| Duplicate registration                | `82ac258d…` gains distinct Preview user/destination while source binding remains unchanged | Availability, second UUID, or adopted different sender        | Passed for provider capability; candidate inventories and Photon reads              |
| iMessage-only origin                  | Exact Preview destination resolves in an `iMessage` composer and shows delivery            | SMS, Sendblue, source destination, or uncertain recipient     | Passed for one bounded handset/provider delivery; Computer Use                      |
| Environment isolation                 | Preview path receives the test and Production receives zero invocation                     | Separate projects without exact runtime counts                | Preview observed; Production-zero lacks a same-window positive control              |
| Callback configuration                | Stable valid-signature fixture reaches exact path and returns `204`                        | Metadata presence, READY state or historical receipt          | Passed for ID/secret/path coherence at `1f8600d`; not provider-message acceptance   |
| Safe disposition oracle               | Exact route branch emits one identity-free disposition record                              | HTTP status alone, logger construction, or adjacent assertion | Passed in direct fixtures and one signed deployed probe at `310dc759…`              |
| Provider checkpoint diagnosis         | Exact first failed auth/platform checkpoint with no observed value                         | Status alone, permissive decode, secret change, or value log  | Synthetic deployed matrix passed at `AB9G854g…`; real provider event remains gated  |
| Routing-directory custody             | Existing value is readable or an exact owner replacement is approved                       | Redacted reads, test fixture or inferred principal            | Passed for approved mapping custody and immutable Preview deployment                |
| Accepted Channel ingress              | Preview returns `202` and produces one Eve completion/response                             | `204`, `401`, handset delivery, or aggregate suite            | Failed: unsupportedService/authenticationRejected; no accepted dispatch             |
| Retry/duplicate proof                 | Same provider event is retried with one dispatch and one response                          | Two unrelated requests or synthetic replay                    | Not proved                                                                          |
| Rollback                              | Only rollout-created Preview user is removed and original digest returns                   | Retaining a failed topology or deleting the adopted user      | Passed; guarded delete and two-read candidate inventory                             |

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
the lint fixture, Knip, all nine workspace typechecks, 62 agent tests, all 35
Photon tests, and all fifteen Turbo build/test tasks. The fixture made no
Executor request.

Repository checks prove owner and policy consistency only. They do not upgrade
the failed live `204`/`401` boundary into accepted ingress, Eve completion,
outbound response, replay, typing, or terminal SPEC proof. The task remains
open, and the single terminal five-pass audit has not run.

## Lowercase-contract live qualification

Commit `52434d479c99bcbc1e23bdf6ee5a1a0df1165c99` reached READY on immutable
Preview deployment `DAcSftdx…`. Signed hosted fixtures returned:

- `204 ignored/nonInbound` for exact lowercase `imessage`;
- `204 ignored/unsupportedService` plus
  `spacePlatform/caseVariant` for `iMessage`; and
- `401 authenticationRejected` plus `eventHeader/missing` when the event
  header was absent.

The deployment log contained no synthetic identity/content sentinel. These
results prove the deployed platform and header classifiers; they do not prove
provider delivery.

Two fresh pre-write inventories matched `9e6108d5…`. The owner reconciliation
created only Preview user `8c3ce2b0…` for sender `82ac258d…`, with distinct
destination `0809669f…`. Two complete post-write inventories matched
`eec3f46c…`; source user `020cc192…`/destination `d4039779…`, adopted Preview
user `46b1fb0c…`/destination `db49756e…`, and stable Preview callback
`d2456774…` were unchanged.

Computer Use proved exact sender and recipient fingerprints, an
`iMessage`/Encrypted composer, exactly one outgoing proof fingerprint
`623a3978…`, one Delivered marker, and no SMS. The immutable Preview route
returned one signed `202 acceptedForDispatch`. A separate request returned
`401` and was classified exactly `eventHeader/missing`; this disproves the
earlier aggregate `headers` diagnosis and does not establish a signature
failure or same-event duplicate.

The workflow runtime subsequently recorded direct-Space resolution, typing
start, one outbound `sendMessage`, typing stop, resource releases, and a final
workflow `200`. The first Messages observer inspected only the
ingress-destination conversation. Cooper's screenshots plus a fresh read-only
Messages inspection later proved that the response arrived in a separate
iMessage conversation.

The required duplicate journey is in a reversible cutover. One temporary
`bundjil-proof=retry-once` callback was created beside the stable callback, its
new create-only ID/secret remain in mode-`0600` custody, and the four sensitive
Preview variables were rebound under `stableCallbackCutover`. Neither callback
has been deleted. The next immutable deployment must pass signed ingress
before another bounded iMessage. After one intentional `503`, same-event
provider retry, duplicate `204`, one total response, and the retry horizon, the
stable binding must be restored and proved before deleting only the temporary
callback. Production remains unchanged.

The retry deployment `87YLdwPi…` at source `8f3076c…` reached READY with the
branch alias and passed one signed `ignored/unsupportedEvent` probe. Computer
Use then proved exact sender and recipient fingerprints, an
`iMessage`/Encrypted composer, one outgoing proof fingerprint `6cafe0e7…`,
Delivered, and no SMS.

The accepted provider event returned one intentional
`503 providerRetryRequested`. Photon redelivered the same event and the replay
owner returned one `204 duplicate`. Project-wide runtime readback recorded one
workflow, one direct-Space resolution sequence, typing start/stop, one outbound
`sendMessage`, resource releases, and final workflow `200`. The retained old
callback's event failed closed at `webhookId`; two independent request rows
failed at `eventHeader/missing`. Those rejection classes produced no dispatch.

The Messages observer still showed zero inbound response rows in the
ingress-destination conversation. No additional callback or workflow appeared
through 225 seconds after the duplicate. A later correlation-based inspection
across Messages conversations established the exact handset outcome:

- accepted signed ingress, one Eve workflow, typing operations, one provider
  send, same-event retry, and duplicate suppression are proved;
- ingress destination `0809669f…` contains outgoing correlations
  `623a3978…` and `6cafe0e7…`;
- a separate conversation from provider origin `d4039779…` contains grey
  replies naming those exact correlations and the expected Bundjil package
  result; and
- handset response delivery is proved. Inspecting only the ingress-destination
  conversation was a false-negative oracle, not evidence of wrong-recipient
  delivery.

The original stable callback values are restored in Vercel metadata from
retained ignored custody.

## Stable restoration and exact cleanup

Immutable Preview restoration deployment `2yxUAv6i…` at exact source
`8cf0c1e…` reached READY with the branch alias and no alias error. A signed
identity-free unsupported-event probe through the stable callback returned
client `204`; the exact deployment record contained
`ignored/unsupportedEvent`. This is stable callback ID/secret/path proof, not
message or handset proof.

The owner delete then selected the temporary query-controlled callback by its
exact URL, deleted only that callback, and read back zero matching callbacks.
A separate stable-ID/fingerprint guard selected rollout user `8c3ce2b0…`,
proved its assignment fingerprint `0809669f…`, deleted only that user, and
read back one remaining adopted Preview user with no matching controlled
sender.

Two independent candidate inventories at `2026-07-30T09:47Z` each returned
matching first/second observations and exact baseline digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`.
The final management inspection returned one shared user, one webhook, shared
service, iMessage enabled, and zero dedicated lines. Source user
`020cc192…`/destination `d4039779…`, adopted Preview user
`46b1fb0c…`/destination `db49756e…`, and the stable callbacks remained
unchanged. No Production resource or configuration changed.

The exact mode-`0600` sender, temporary callback binding, and stable restore
artifacts were removed after those reads and cannot be recovered. Their durable
stable credential values remain in the approved ignored local environment and
Vercel Preview secret store; no tracked receipt contains them.

The bounded journey therefore proves signed lowercase ingress, one workflow,
one typing start/stop sequence, one provider send, one intentional `503`, one
same-event provider retry, one duplicate `204`, and handset receipt of both
exact correlated replies. The separate request class remains proved only as
`eventHeader/missing`; no semantic purpose or provider defect is inferred.

Current Photon Managed Shared documentation places traffic behind a central
proxy, and the pinned shared-mode SDK exposes neither an outbound `from`
selector nor an origin/history read API. Bundjil supplied the decoded
participant and could not select `d4039779…`; a provider-selected origin and
separate handset conversation are compatible with the public contract. The
exact reuse of that source-assigned fingerprint is not publicly documented as
a stable cross-project guarantee, so it is recorded as observed
provider-managed routing, not as a Bundjil configuration invariant or
Production workflow execution.

The shared-sender Preview user was deleted only because the original handset
oracle failed falsely. The task stays open until minimum re-adoption restores
that user and two fresh inventories prove the distinct Preview ingress
destination, unchanged source binding and unchanged stable callback. No second
model call is required. Downstream work and the terminal five-pass audit remain
pending.

The exact rollback receipt candidate passed strict Effect language-service
diagnostics; 19 focused Photon transport/reconciliation tests; the exact
12-test Channel fixture; every boundary, documentation, skill, authority,
control and verification-policy gate; and complete `bun run verification`.
The full gate included HGI-307, 90 tooling tests, type-aware lint/format, Knip,
all nine workspace typechecks, all 38 Photon tests, all 63 agent tests, 30
infrastructure Vitest tests plus 14 Alchemy lifecycle tests, and all fifteen
Turbo tasks. The process-local synthetic Executor fixture made no external
request.

## Sources

- [Photon Managed Shared routing](https://photon.codes/blog/how-we-rebuilt-our-shared-imessage-routing-to-handle-10m-messages-a-day)
- [Photon plans and Managed Shared service](https://photon.codes/pricing)
- [Photon webhook delivery and retries](https://photon.codes/docs/webhooks/delivery)
- [Photon webhook troubleshooting](https://photon.codes/docs/webhooks/troubleshooting)
- [Photon webhook events and project fan-out](https://photon.codes/docs/webhooks/events)
- [Photon Spectrum provider IDs](https://photon.codes/docs/spectrum-ts/providers)
- [Dual-Channel Production acceptance receipt](channel-production-accepted-2026-07-23.md)
