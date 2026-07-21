---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-21
review_trigger: Sendblue account, line, webhook, signature, sender identity, routing, replay store, delivery, or typing behavior change
---

# Operate Sendblue ingress and delivery

## Scope and non-claims

Use this runbook for Sendblue account/webhook metadata, the agent webhook at
`POST /eve/v1/sendblue/webhook`, and its Upstash-backed replay boundary. An
HTTP `202` means accepted dispatch scheduling; it does not prove Eve completed
processing or that a handset received a message.

## Preconditions

- Identify the Sendblue account and line through an authenticated provider
  readback; record only sanitized line identity.
- Identify the target agent environment/deployment independently from the
  webhook URL.
- Use distinct credentials, webhook/routing material, replay prefixes, and
  sender identities for each environment.
- Confirm a metadata-only Upstash database readback with credentials hidden.
- Do not send a message, change a webhook, or inspect message content during
  preflight.

## Authority envelope

| Field               | Required value                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Identity            | Authenticated Sendblue/Upstash operator and app principal                                                           |
| Operation           | Account/webhook read, one webhook change, one bounded ingress/delivery journey, rotation, or rollback               |
| Resource            | Exact account, line, webhook class, app target, replay database/prefix, and sender allowlist                        |
| Environment         | Explicit isolated proof, Preview, or Production                                                                     |
| Duration/revocation | One operation/journey; provider credential/webhook/replay revocation owner named                                    |
| Approval            | Required for webhook, credential, routing, replay-data, typing, or message consequence                              |
| Receipt             | Source/deployment identity, sanitized provider readback, `observedAt`, HTTP/result shape, limitation, and non-claim |

## Inputs and secret handling

The only accepted runtime configuration is
`BUNDJIL_CHANNEL_SENDBLUE_ALLOWED_SERVICES`,
`BUNDJIL_CHANNEL_SENDBLUE_API_KEY`,
`BUNDJIL_CHANNEL_SENDBLUE_API_SECRET`, `BUNDJIL_CHANNEL_SENDBLUE_LINE`,
`BUNDJIL_CHANNEL_SENDBLUE_TYPING_DURATION_MILLIS`,
`BUNDJIL_CHANNEL_SENDBLUE_WEBHOOK_SECRET`, the app-owned
`BUNDJIL_CHANNEL_ROUTING_*` names, and the app-owned
`BUNDJIL_CHANNEL_REPLAY_*` names listed in the agent README. Any
`BUNDJIL_SENDBLUE_*` binding is legacy and blocks promotion; do not copy,
import, or fall back to it. Existing provider credential values may be entered
under the new names only through the approved secret operation and must never
be emitted by a migration script.

Never print secret values, full phone identities, message contents, protected
webhook URLs, routing material, replay keys, or raw provider responses.

## Procedure

1. Prove source contracts locally:

   ```bash
   bun run --filter @bundjil/sendblue check-types
   bun run --filter @bundjil/sendblue test
   bun run --filter @bundjil/agent check-types
   bun run --filter @bundjil/agent test
   ```

2. Read current Sendblue webhook metadata using the authenticated account GET
   endpoint. Sanitize immediately to status, event-class counts, HTTPS hostnames,
   and booleans indicating configured secrets; discard raw secret fields and
   URL query/path material. Record `observedAt` and the authenticated account
   identity separately.

3. Read Upstash database metadata through the authenticated control plane, for
   example `upstash redis get --db-id "$BUNDJIL_UPSTASH_DB_ID" --hide-credentials`.
   Record database ID/name/region/state and credential-hidden status only. Do
   not run `SCAN`, `KEYS`, `GET`, or any replay-data command.

4. Compare the complete `receive` webhook host inventory, app target,
   environment isolation, expected secret presence, sender allowlist shape,
   allowed services, replay prefix, lease, and terminal TTL to the intended
   configuration. Confirm the target has no redirect and the accepted Vercel
   immutable deployment owns the route before changing provider state. A
   missing preferred readback is inconclusive.

5. **Mutation gate:** stop before POST/PUT/DELETE webhook calls, credential or
   routing changes, replay-data changes, typing, or message sends until the
   complete authority envelope and rollback snapshot are approved.

6. Disable or isolate ingress, preserve the exact prior webhook inventory, and
   wait the current documented/provider-confirmed retry horizon before the
   intentional replay-continuity break. Perform at most the one approved
   change, then immediately re-read the complete webhook and database metadata
   before any bounded ingress/delivery journey.

7. Record webhook outcomes by status class: ignored/duplicate `204`, accepted
   dispatch `202`, invalid signature `401`, schema failure `400`, and
   replay/routing failure `503`. Keep provider acceptance, Eve processing, and
   handset delivery as separate claims. Treat `DeliveryUncertain` as unknown;
   never retry blindly.

8. For the exact approved direct conversation, call typing `start` with the
   configured bounded duration and then typing `stop`. Decode the complete
   response for each action. A stop when no indicator is active is an accepted
   no-op; a firmware `503`, route-mapping failure, timeout, or malformed body is
   a failed/inconclusive typing proof and blocks a success claim. Provider
   acceptance is best-effort and must not be recorded as handset display.

## Evidence and postcondition

Retain source/deployment identity, sanitized account/line and webhook-host
inventory, replay-database metadata, `observedAt`, one approved operation,
HTTP/result shapes, non-sensitive counts, separate ingress, Eve, outbound,
typing-start, typing-stop, delivery, and handset-display claims, limitations,
and non-claims. Use `BND-J05-sendblue-accepted-message` and, for the combined
Production result, `BND-J12-dual-channel-production`. This runbook does not
turn a local or provider response into Production proof.

## Rollback and revocation

Under separate authority, stop ingress, wait the retry horizon, quarantine the
new namespace, and restore the complete prior webhook inventory rather than
appending a guessed route. Rotate/revoke affected webhook, API, routing, or
replay-store material through its provider owner, then read back metadata and
confirm invalid/missing webhook secrets return `401` without recording a
secret. Never restore a legacy runtime/config/state path into the new source.
Provider and handset outcomes require their own postcondition.

## Stop and escalation

Stop on `503`, uncertain delivery, duplicate ingress outside replay policy,
unexpected host, unauthorized sender, shared environment identity, missing
rollback inventory, provider readback failure, or any secret/phone/content
leak. Escalate account/line/webhook/delivery issues to Sendblue, database/access
issues to Upstash, and routing/replay/app faults to the agent maintainer.

## Readback fallback

Use authenticated Sendblue account/webhook metadata and authenticated Upstash
database metadata with credentials hidden. If either is unavailable, retain an
`inconclusive` receipt and stop. Source, historical webhooks, a local `202`, or
an alternate account is not a fallback; unavailable is never healthy.

## Maintenance

Review when the provider API, event classes, webhook verification, sender
identity, routing, replay store, TTL/lease, delivery, or typing behavior changes.
