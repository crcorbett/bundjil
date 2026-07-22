---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-22
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
   Match the exact approved redacted user identity. Adopt one exact existing
   match; if none exists, check shared availability and call the idempotent
   shared-user create once, then read back one exact stable user ID and an
   assigned routing number without retaining either phone value. More than one
   exact match, an unavailable identity, a dedicated service, or an uncertain
   postcondition is a stop.
4. Confirm the immutable Vercel target serves
   `/eve/v1/photon/webhook` over public HTTPS without redirects. List webhooks
   before create. Adopt an exact environment URL only when its write-only
   signing secret is already present in the approved secret store; otherwise
   set the absolute mode-`0600` temporary
   `BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH` and exact
   `BUNDJIL_PHOTON_WEBHOOK_URL`, then run
   `bun run --filter @bundjil/photon register:environment-webhook`. Bind the
   returned file's ID and secret directly to the target through stdin, verify
   variable metadata, and delete the temporary file. Never print either value.
   The command blocks an existing target rather than adopting a lost
   write-only secret and reconciles an uncertain create by exact URL inventory.
   Replace an isolated zero-traffic callback by running
   `delete:environment-webhook` against the exact old URL, proving zero exact
   matches, then registering the exact new URL. Never delete by hostname or
   count alone.
5. Read back service, platform, shared-user, and webhook topology. The accepted
   desired state is service type `shared`, zero dedicated lines, one exact
   approved shared user, and one exact environment webhook. Do not delete
   unrelated resources to make counts fit.

## Hosted Channel proof

1. Attach `photon-inbound` and `photon-outbound` authority, exact pushed source
   and immutable deployment/config identities, fresh replay/routing namespace
   fingerprints, the approved test conversation, and rollback references.
2. Send one bounded inbound direct-text event through Photon. Record signed
   authentication, fresh claim, one Eve dispatch/completion, one outbound
   provider result, and scoped SDK release without retaining body, content,
   phone, assigned routing number, project, user, webhook, Space, or message values.
3. Redeliver the same provider event identity and require a duplicate outcome
   with zero second external response. Do not synthesize a new identifier.
4. Against the exact decoded conversation, execute `setPresence(start)` and
   `setPresence(stop)`. The pinned Layer maps these to Spectrum Space
   `startTyping()` and `stopTyping()`. Require a decoded accepted/no-op result
   for each; an unsupported no-op, timeout, provider rejection, ambiguous
   Space, or release failure blocks a visible-typing claim.
5. Record provider acceptance, Eve completion, handset message delivery, and
   handset typing display as four separate boundaries. If a safe device
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
