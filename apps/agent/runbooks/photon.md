---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-23
review_trigger: Photon API, SDK pin, credential path, proof command, authority, platform, shared-user, webhook, deployment, typing, resource lifecycle, or output contract change
---

# Operate Photon Channel rollout

Use this runbook for the bounded provider lifecycle proof and the active hosted
Channel rollout. The provider-only command proves authenticated management,
one isolated webhook lifecycle, write-only signing-secret handling, and SDK
acquire/release. Hosted Preview and Production claims require the additional
resource, deployment, message, typing, and readback procedure below.

## Authority and target

- Actor: the Codex operator running the Channel Provider SPEC on 2026-07-21.
- Authority: the user explicitly approved all Photon actions against the
  internal project and supplied ignored project credentials.
- Target resolution: the project scoped by `PHOTON_PROJECT_ID` and
  `PHOTON_PROJECT_SECRET` in the ignored file named by
  `BUNDJIL_PHOTON_ENV_FILE`.
- Permitted writes: the fixed non-routable proof webhook, exact environment
  webhooks, required iMessage platform toggle, one exact adopted or
  rollout-created Free managed-shared user, approved Preview/Production bindings/deployments, and the
  bounded message plus typing journeys named by the active task.
- Forbidden writes: dedicated lines, unrelated users, contacts, message history,
  platforms, webhooks, projects, billing policy, DNS, Sendblue resources,
  Upstash data, or any target outside the accepted rollout envelope.

Repository instructions do not grant future provider authority. The user's
2026-07-21 approval is bounded to the active promotion tasks; reconfirm the
actor, target, operation, duration, stable resource identity, rollback, and
approval before every stage.

## Upstream contract used

Photon documents HTTP Basic authentication with project-scoped credentials,
`GET`/`POST`/`DELETE` webhook operations, a create-only signing secret, logical
deletion, and a five-request-per-second project limit. Registration validates
URL syntax before delivery; the proof therefore uses a reserved
`example.invalid` HTTPS URL that cannot become Bundjil ingress.

The Free plan supplies managed-shared iMessage routing. The management API
reports the project's `shared | dedicated` service type, checks shared-user
availability, and idempotently creates a shared user from the exact E.164 user
identity. Photon assigns a routing number to that specific user. A Free-plan
inbound proof must pair the exact registered sender with that sender's own
assigned number; another user's assigned number is not an interchangeable
project endpoint. Dedicated-line endpoints are a separate Business capability
and are not part of this rollout.

Sources: [Photon pricing](https://photon.codes/pricing),
[management OpenAPI](https://spectrum.photon.codes/openapi/json),
[shared-routing architecture](https://photon.codes/blog/how-we-rebuilt-our-shared-imessage-routing-to-handle-10m-messages-a-day),
[API introduction](https://photon.codes/docs/api-reference/introduction),
[webhook lifecycle](https://photon.codes/docs/webhooks/managing-webhooks), and
[rate limit](https://photon.codes/docs/api-reference/rate-limit).

## Preconditions and stop conditions

1. Run from the isolated Bundjil worktree on the accepted Task 4 Git identity.
2. Confirm the ignored file has mode `0600` and exposes exactly
   `PHOTON_PROJECT_ID` and `PHOTON_PROJECT_SECRET` by printing names only;
   never print values. Stop if either check fails.
3. Confirm focused Photon tests pass before loading credentials.
   Before a hosted or local message qualification, compare both direct
   `@spectrum-ts/*` pins with the npm `latest` dist-tag and keep them on the
   same exact release. A dependency refresh requires new package/app build
   proof and invalidates earlier live proof for the refreshed artifact.
4. Stop if credentials are absent, a provider response violates its Schema,
   management authentication fails, the reserved proof record cannot be
   isolated, SDK acquisition/release fails, deletion is ambiguous, final
   readback differs from the baseline, or any request would touch a forbidden
   target.
5. The provider-only proof does not add a user. The hosted rollout requires
   service type `shared`, zero dedicated lines, and one exact approved shared
   user. Stop on a dedicated service, ambiguous user identity, unavailable
   identity, or a create whose exact postcondition cannot be read back.
6. Shared-user creation is provider-documented as idempotent by phone identity,
   but the operator still lists first and reads back after create. Do not retry
   an uncertain create before exact identity reconciliation. Never retain the
   user phone or assigned routing number in durable evidence.
7. Before a local inbound proof, read the complete user inventory and match one
   exact approved sender to its own assigned number in memory. Stop if either
   side is absent or ambiguous. Do not substitute another user's assigned
   number, infer a route from the dashboard's currently selected user, or use a
   cold outbound send as the readiness test.

## Procedure

Set `BUNDJIL_PHOTON_ENV_FILE` to the operator-owned ignored credential file,
then run from the root returned by `git rev-parse --show-toplevel`:

```sh
bun run --filter @bundjil/photon check-types
bun run --filter @bundjil/photon test
test -n "$BUNDJIL_PHOTON_ENV_FILE"
awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' "$BUNDJIL_PHOTON_ENV_FILE"
test "$(stat -f '%Lp' "$BUNDJIL_PHOTON_ENV_FILE")" = 600
set -a
source "$BUNDJIL_PHOTON_ENV_FILE"
set +a
bun run --filter @bundjil/photon proof:provider
BUNDJIL_PHOTON_RESOURCE_MODE=inspect bun run --filter @bundjil/photon reconcile:resources
unset PHOTON_PROJECT_ID PHOTON_PROJECT_SECRET
```

The command decodes config through Effect Config and owner Schemas, keeps the
project secret and returned signing secret `Redacted`, uses the Effect HTTP
client behind named management operations, and runs the SDK lifecycle through
an explicit Effect service. Output is one Schema-encoded receipt containing
only booleans and webhook counts. Failure output is exactly
`{"status":"blocked"}`.

## Cleanup and rollback

The command reserves one exact proof URL, removes an exact stale proof record,
captures a baseline, creates one webhook, verifies it by ID and URL in memory,
and brackets use with deletion. After any normal or ambiguous outcome it lists
webhooks again, deletes only records matching the reserved proof URL, and
requires the final ID-and-URL topology to equal the post-recovery baseline.

If the process is interrupted, rerun the same command: the fixed proof URL is
the recovery identity and the first step deletes only that exact record. Never
delete another URL or infer ownership from creation time, list order, or a
partial ID. If exact cleanup or final readback cannot complete, stop and use the
Photon dashboard or API in read-only mode to locate the reserved proof URL
before an explicitly authorised deletion.

SDK acquisition is paired with `app.stop()` and any release failure blocks the
proof. No retry is issued for webhook creation because a lost response is an
ambiguous write; exact URL readback owns recovery instead.

## Evidence and non-claims

Retain only the command, exit status, safe receipt, Git identity, actor and
authority statement, timestamp, limitations, and recovery result. Do not
retain project, webhook, Space, message, phone, identity, secret, URL, content,
SDK object, raw response, prompt, tool, or model values.

A passing provider-only receipt proves only the named Photon project
observation at that time. It never substitutes for the hosted procedure below.

## Local SDK-stream qualification

Use this only as a bounded provider/runtime qualification before hosted proof.
It is the mode generated by Photon's dashboard scaffold: one Bun or Node
process creates one Spectrum application for the project and consumes
`app.messages` until it is stopped. It is not a process per user or line.

1. Install the current official Photon CLI, require `photon whoami` to succeed,
   and select the exact project explicitly. Use JSON for user and line reads.
2. Require Free service, iMessage enabled, zero dedicated lines, and one exact
   approved sender-to-assigned-number pairing. Keep all other user records
   unchanged.
3. Run the focused Photon typecheck, tests, and build. Load the ignored
   project credentials without printing them, map them to the SDK's
   `SPECTRUM_PROJECT_ID` and `SPECTRUM_PROJECT_SECRET` names in process memory,
   then start one bounded SDK message loop.
4. From the approved Messages identity, send one synthetic direct text to that
   identity's own assigned number. If Photon replies that it does not recognise
   the sender, inspect the Messages `Start new conversations from` identity and
   the exact user pairing before any further attempt. Do not mutate users or
   try another user's assigned number merely to make the test pass.
5. Require one inbound event, one `space.responding(...)` reply with a provider
   message identity, one handset reply observation, and a clean `app.stop()`.
   Record visible typing separately; use of `responding` alone does not prove
   that the handset displayed an indicator.

This qualification proves the managed line, SDK stream, inbound route,
provider-accepted reply, and observed handset reply only for the named local
observation. It does not prove Photon webhooks, Vercel, Eve completion, replay,
duplicate suppression, Preview, Production, or durable process supervision.

## Hosted resource reconciliation

1. Attach the `photon-management` authority receipt, verify the ignored
   credential file is mode `0600`, load it without printing values, and run the
   focused/full local gates.
2. Use authenticated management reads to decode the project, iMessage service
   type, platform, complete shared-user inventory, and complete webhook
   inventory. Retain only sanitized counts/state and protected stable-ID
   fingerprints. Never infer an owned resource from list order, creation time,
   phone identity, assigned routing number, or partial ID.
3. Require service type `shared`, zero dedicated lines, and iMessage enabled.
   The accepted topology uses one controlled sender in two separate Photon
   projects. Capture the source/Production user's stable ID, sender fingerprint,
   assigned-destination fingerprint, project fingerprint, platform state and
   webhook topology before any Preview write. Capture the complete Preview
   baseline separately. Official Photon material says shared inbound ownership
   resolves from destination plus sender, but the live management API must
   still prove duplicate cross-project registration.
   Before a Preview user write, also require the source project to have exactly
   one accepted Production callback. Photon fans an event to every webhook in a
   project, so multiple environment callbacks in the source project are a stop.
   Retiring a callback is a separate source/Production mutation: require
   explicit authority, exact current route ownership, rollback/signing-secret
   custody or separately accepted irreversible loss, traffic/drain evidence,
   deletion by stable ID, then one-callback and unchanged-user readback. Do not
   infer permission from later Preview-user authority.
   The 2026-07-30 authorized retirement targeted only `2083611d…` and preserved
   Production callback `72cac9b5…`. Its no-required-traffic oracle queried the
   exact deployment/path, then sent one non-mutating `GET` positive control and
   required the count to change from zero to one. A zero from project-wide or
   unresponsive logs is not proof. The owner command deleted the exact callback
   only after that oracle; complete reads after 225 seconds retained sole
   `72cac9b5…` and both source users/assignments. Because the create-only secret
   was unavailable, Cooper explicitly accepted that exact restoration is
   impossible. Never describe a recreated callback with a new secret as exact
   restoration.
   Match the exact redacted sender, check shared availability without treating
   availability as capability proof, call the idempotent Preview shared-user
   create at most once, then read back one exact Preview user and its assigned
   destination without retaining either phone value. Immediately re-read the
   source project and require its stable user, sender, destination, platform and
   webhook fingerprints to remain unchanged. Require the Preview destination
   to differ from the source destination.
   Photon project creation may automatically seed the authenticated
   principal's controlled shared user. Treat that as a provider mutation:
   fingerprint and read back the seeded user, its assignment, and the source
   binding before any later user operation. Adopt it only when the source
   binding is unchanged and retaining it is less disruptive than deletion or
   adding another user. Never call create merely because the runbook expected
   an initially empty project.
   More than one exact match, a duplicate-registration rejection, an SMS-only
   assignment, an unavailable or exclusive identity, any source binding
   change, a dedicated service, or an uncertain postcondition is a stop.
   Reconcile an uncertain create by exact Preview and source readback; never
   replay it blindly. Delete only the exact rollout-created Preview user after
   retry drain when the accepted topology was not established. Preserve a
   successful stable Preview user only after every isolation gate passes.
   The 2026-07-30 bounded check proved that source sender `82ac258d…` can be
   registered concurrently in Preview with a distinct assigned destination
   while the source binding stays unchanged. Fresh Messages UI classified that
   destination as iMessage and showed one Delivered send. Do not retain this as
   an accepted stable topology by itself: exact Preview runtime readback
   returned `204` and `401`, zero Production invocations, and no accepted
   `202`/Eve response. Cleanup removed only the rollout-created Preview user and
   restored the original candidate digest. Before repeating, require separate
   authority to overwrite the Preview routing-identity directory, an exact
   owner-supplied canonical principal ID or explicit new-principal product
   decision, and immutable deployment readback. Preserve the existing webhook
   configuration: the final `1f8600d…` deployment returned exact `204` for a
   valid-signature unsupported-event probe, proving callback ID/secret/path
   coherence. Vercel API, CLI and dashboard reads expose the sensitive routing
   value as write-only, while Production Agent Run detail/trace retains no
   `principalId`; do not guess, merge against an empty read, or infer the value
   from tests. Provider registration, callback configuration or handset
   delivery cannot substitute for accepted application ingress.
   Cooper approved one complete Preview-only replacement on 2026-07-30. Use
   only the one-record mapping in ignored mode-`0600` custody: controlled
   sender `82ac258d…`, opaque principal fingerprint `1b41b326…`, sanitized
   mapping digest `96971a51…`. Replace the entire Preview value, deploy one new
   immutable candidate, and prove the exact route before recreating the shared
   user. Stop on any mapping digest, target, deployment, or callback mismatch.
   The envelope excludes Production, billing, SMS, cold outbound, credential
   rotation, main merge, and unrelated mutation.
   The authorized attempt reached READY deployment `687e5a7d…`, passed the
   signed safe probe, and recreated the distinct Preview destination without
   source change. Messages proved the exact sender, recipient,
   iMessage/Encrypted composer, and Delivered state. The real callback then
   returned `ignored/unsupportedService` plus `authenticationRejected`, with no
   accepted work or response. After a 239-second drain, cleanup removed only
   rollout user `19489599…`/destination `0809669f…` and restored the provider
   digest twice. Preserve the approved new Preview routing mapping and
   deployment, but do not recreate or resend until the Photon platform/signature
   mismatch has direct evidence and a new bounded authority.
   Cooper approved one further bounded retry after deployment of the private
   checkpoint diagnostic. It again created only the exact Preview rollout user,
   preserved both source bindings and the adopted Preview user, and sent one
   exact iMessage-only inbound message. The final deployment recorded two
   separate requests: `ignored/unsupportedService` at `spacePlatform`, then
   `authenticationRejected` at `headers`. No accepted dispatch, Eve work,
   response, duplicate or typing row appeared through the retry horizon.
   Guarded cleanup deleted only rollout user `ab4f5f8d…` and two independent
   inventories restored digest `9e6108d5…`. Do not recreate or resend again
   without provider evidence explaining why a genuine Messages iMessage
   produces a non-`iMessage` top-level space platform and a separate request
   that fails required-header decoding. An escalation packet may name only
   project/webhook/deployment fingerprints, timestamps, the two closed
   checkpoints and HTTP classes; it must not include the message, phone,
   assigned line, provider payload, header values, signature or credential.
   The resumed diagnosis proves that pinned `@spectrum-ts/imessage@12.3.0`
   owns exact lowercase platform ID `imessage`; correct and deploy that owner
   boundary first. Cooper's latest authority then permits the minimum
   Preview-only shared-user reconciliation and bounded message needed for
   live qualification. Before that write, require two matching inventories,
   unchanged source/Production topology, exact Preview callback/deployment
   identity, and deployed value-free header/platform diagnostics. Keep the
   send count bounded, require explicit iMessage, observe the retry horizon,
   and retain a passing topology or delete only the rollout-created failed
   user after exact readback. A materially broader or irreversible action
   remains a report-before-execute stop.
4. Confirm the immutable Vercel target serves
   `/eve/v1/photon/webhook` over public HTTPS without redirects. List webhooks
   before create. Adopt an exact environment URL only when its write-only
   signing secret is already present in the approved secret store; otherwise
   set the absolute mode-`0600` temporary
   `BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH` and exact
   `BUNDJIL_PHOTON_WEBHOOK_URL`, then run
   `bun run infrastructure:photon-preview-webhook-register`. Pass the returned
   file to `bun run infrastructure:photon-preview-webhook-binding`. The sink
   binds project ID/secret and webhook ID/secret as four sensitive Preview-only
   variables, verifies exact metadata, and deletes the temporary file only
   after the complete acknowledgement passes. Never print any value.
   If the Vercel acknowledgement is uncertain but exact metadata exists,
   retain the file, block replay, deploy through Vercel Git, and require signed
   ingress before deleting the recovery copy.
   If Vercel Authentication fences Preview, create or select only an explicitly
   approved note-scoped automation bypass. For a provider that cannot set a
   header, place it only in the protected callback query, keep the value in
   ignored mode-`0600` custody, and retain only its safe fingerprint. Never
   guess among unrelated bypass entries.
   A direct signed-ingress mismatch may set
   `BUNDJIL_PHOTON_BINDING_RECOVERY_MODE=signedIngressMismatch` for one exact
   owner-sink recovery after all four Preview-only sensitive metadata
   identities are read back. Keep the artifact until a later immutable
   deployment returns the expected signed response.
   For a stable callback replacement, create the new exact callback while the
   old one and its artifact remain intact, then set
   `BUNDJIL_PHOTON_BINDING_RECOVERY_MODE=stableCallbackCutover` to bind the new
   ID/secret. Require a new immutable deployment and signed `2xx`, wait through
   the provider's documented maximum retry horizon, and only then delete the
   old exact callback. Never collapse the two secret artifacts during cutover.
   The command blocks an existing target rather than adopting a lost
   write-only secret and reconciles an uncertain create by exact URL inventory.
   Replace an isolated zero-traffic callback by running
   `delete:environment-webhook` against the exact old URL, proving zero exact
   matches, then registering the exact new URL. Never delete by hostname or
   count alone.
   After stable signed proof, retry-horizon drain and final one-webhook
   readback, move the surviving ID and signing secret into the approved ignored
   mode-`0600` `.env.local` custody. Delete both temporary binding artifacts
   and discard the retired callback's signing secret only after that readback;
   never retain a second recovery copy or write either value to a tracked
   receipt.
5. Read back service, platform, shared-user, and webhook topology. The accepted
   desired state is service type `shared`, zero dedicated lines, one exact
   approved shared user, and one exact environment webhook. Do not delete
   unrelated resources to make counts fit.

## Hosted Channel proof

1. Attach `photon-inbound` and `photon-outbound` authority, exact pushed source
   and immutable deployment/config identities, fresh replay/routing namespace
   fingerprints, the approved test conversation, and rollback references.
   Stop when no exact approved Preview conversation identity is present. A
   synthetic event identity, guessed recipient, or shared source-project
   conversation is not provider-bound Channel proof.
   The sending device/account must use the same exact Apple identity retained
   by the source/Production project and newly proved in Preview. Read back both
   user/destination pairs by safe fingerprint. Select only the distinct Preview
   destination, then send one bounded direct text from an explicitly
   iMessage-labelled composer. Stop if the current Messages identity differs
   from the approved shared sender, the selected recipient differs from the
   Preview destination, or the composer says SMS. Do not substitute a Sendblue
   conversation, the source/Production Photon destination, another controlled
   identity, a synthetic callback, or a cold outbound-first SDK call.
   Require the signed event to identify only the Preview webhook/environment,
   one Preview response, zero Production response, and exact same-event
   duplicate disposition. Two callbacks in one Photon project are forbidden
   because a project event fans out to every registered webhook. The sole
   exception is the bounded Production write-only-secret `ParallelCutover`:
   both callbacks must be preserved until promotion, no real pre-promotion
   message is permitted, and fresh pre-promotion readback must prove both
   callback routes resolve to the candidate. A shared provider-facing callback
   alias is reassigned only under exact alias authority with its prior immutable
   target retained as rollback. Fresh post-promotion readback must prove that
   callback alias and the public stable alias resolve to the same accepted
   deployment and replay namespace. One bounded event must then produce one
   accepted dispatch, one duplicate disposition, exactly one response, and no
   callback on another deployment before drain and exact original-callback
   retirement.
   Classify every exact route response and its matching
   `ChannelWebhookDisposition` record before accepting the journey. The record
   contains only the branded webhook path, a closed disposition literal, and,
   where applicable, a closed ignore/identity/routing reason or replay
   operation; it must not contain a participant, principal, message, provider
   identity, signature, credential, URL query, or request content. `202` plus
   `acceptedForDispatch` is accepted for background dispatch; `204` must be
   exactly `ignored`, `duplicate`, or `identityRejected`; `401` must be
   `authenticationRejected`; `400` must be `schemaRejected`; and `503` must be
   `replayFailed`, `routingFailed`, or the admitted
   `providerRetryRequested` control. Status alone is rejected as proof by
   proxy. One `204` plus one `401` does not prove a duplicate retry, even when
   Messages shows Delivered and Production receives zero callbacks. If the
   deployed source predates this oracle or no matching record exists, stop,
   preserve the status/time metadata, drain, and remove only rollout-created
   failed topology.
   When the Photon adapter returns `ignored/unsupportedService`, require one
   matching `PhotonWebhookBoundaryDisposition` naming only the first failed
   platform checkpoint: `spacePlatform`, `messagePlatform`,
   `senderPlatform`, or `messageSpacePlatform`, plus only
   `knownAlternative`, `caseVariant`, or `unknown`. Pinned
   `@spectrum-ts/imessage@12.3.0` and the current provider guide define exact
   accepted platform ID `imessage`; the current webhook example's `iMessage`
   spelling is a conflicting example, not an accepted compatibility literal.
   When the adapter returns `authenticationRejected`, a required-header
   failure must name exactly `eventHeader`, `webhookIdHeader`,
   `timestampHeader`, or `signatureHeader` plus `missing` or `malformed`.
   Later verification failures name only `webhookId`, `timestamp`, or
   `signature`. The record must never contain the observed value, request body,
   header, identity, signature, URL, or credential.
   A checkpoint localizes the owning boundary only; it does not authorize
   case-folding, accepting SMS, changing a signing secret, or replaying a real
   message.
   Current pricing lists cold outreach only for Business/Enterprise dedicated
   offerings; Free/Pro direct-messaging access is not proof of cold-outbound
   entitlement. Do not upgrade, buy a line, rotate credentials, recreate a
   project, mutate Production, or change billing.
2. Send one bounded inbound direct-text DM through Photon. Record signed
   authentication, fresh claim, one Eve dispatch/completion, participant-based
   direct-Space reconstruction, one outbound provider result, and scoped SDK
   release without retaining body, content, phone, assigned routing number,
   project, user, webhook, Space, or message values. A group event must return
   the documented unsupported-conversation no-op and must never be answered as
   a DM to its sender.
3. Redeliver the same provider event identity and require a duplicate outcome
   with zero second external response. Do not synthesize a new identifier.
   Photon currently documents no replay endpoint or dashboard delivery replay.
   In Preview only, set the sole callback's decoded query to
   `bundjil-proof=retry-once`. The Photon app adapter completes the fresh claim
   before returning one intentional `503`; require the provider retry with the
   same event identity to return `204`, one total Eve dispatch, and one total
   external response. The signed callback remains the only caller able to
   activate the control. Sendblue and the Production Photon callback must not
   use this query. Do not use it to retry an outbound send.
4. Against the exact decoded conversation, execute `setPresence(start)` and
   `setPresence(stop)`. The pinned Layer maps these to Spectrum Space
   `startTyping()` and `stopTyping()`. Require a decoded accepted/no-op result
   for each; an unsupported no-op, timeout, provider rejection, ambiguous
   participant/Space, or release failure blocks a visible-typing claim.
5. Record provider acceptance, Eve completion, handset message delivery, and
   handset typing display as four separate boundaries. For Managed Shared
   service, search all iMessage conversations by the bounded correlation
   fingerprint: the provider-selected outbound origin can create a conversation
   separate from the ingress destination, and a same-conversation-only search
   is not a valid negative oracle. Keep both numbers and message content in
   secure observer custody and retain only fingerprints. If a safe device
   observer is unavailable, mark the handset boundaries unproved rather than
   upgrading SDK acceptance.
6. For Preview use `BND-J11-photon-accepted-message-typing`. For Production,
   bind that packet into `BND-J12-dual-channel-production` with the matching
   Vercel and Sendblue packets.

## Hosted rollback

Stop Photon ingress first, wait at least the current documented worst-case
webhook retry horizon (about 3.5 minutes unless fresh provider truth states a
longer configured value), and quarantine the new replay namespace. Delete only
the exact rollout-created webhook and, if rollback explicitly requires it, the
rollout-created shared user by stable ID. Preserve an adopted user. Restore only platform state changed by this rollout,
re-read the complete inventory, and preserve all adopted pre-existing
resources. Never retry an uncertain message and never restore legacy runtime,
config, state, or replay behavior.
