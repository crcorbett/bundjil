---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-21
review_trigger: agent incident, compromise, outage, wrong target, failed preflight, rollback, credential, Executor, Sendblue, Upstash, or Vercel recovery change
---

# Contain agent incidents and revoke access

## Scope and non-claims

Use this runbook for agent-side incident triage, containment, rollback routing,
and provider-owned revocation. Repository source defines safe checks and
rollback evidence; it does not enact a Vercel rollback, revoke a credential,
remove an Executor connection, change a Sendblue webhook, or prove recovery.

## Preconditions

- Open an incident record with incident ID, start time, reporter, severity,
  source SHA, environment, target, suspected consequence, and current stop
  state.
- Preserve sanitized failing evidence before mutation. Never paste raw logs,
  secrets, tokens, protected URLs, tool payloads, messages, or phone identities.
- Obtain just-in-time readback from every affected provider. If current target
  identity is unavailable, stop broad diagnosis and choose the safest
  reversible containment only under emergency authority.
- Identify accepted current and previous deployment/config references, newest
  fenced profile generation, credential/webhook/toolkit owners, and the
  recovery oracle.

## Authority envelope

| Field               | Required value                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Identity            | Incident commander, executing principal, provider identity source, and approver                               |
| Operation           | One containment, rollback, rotate, revoke, disable, or restore action                                         |
| Resource            | Exact app/deployment, alias, secret binding, toolkit/key/connection, webhook/account/line, or database/prefix |
| Environment         | Explicit affected and recovery environments                                                                   |
| Duration/revocation | Emergency expiry, session revocation, and follow-up owner                                                     |
| Approval            | Normal or break-glass receipt naming the exact operation and target                                           |
| Receipt             | Before/after provider readback, source/config identity, `observedAt`, consequence, limitation, and rollback   |

## Inputs and secret handling

Operate on names, immutable IDs, opaque fingerprints, status/error shapes, and
sanitized counts only. Do not reveal, compare in logs, or copy credential
values. Keep emergency material outside the repository and revoke it at the
recorded expiry.

## Procedure

1. Stop new consequential activity: pause deployment/promotion, message sends,
   Executor `execute`/`resume`, webhook changes, credential rotation, and
   automated approval handling for the affected target.

2. Run safe repository checks only when they can clarify source behavior:

   ```bash
   bun run --filter @bundjil/agent check-types
   bun run --filter @bundjil/agent test
   ```

   Use the [deploy preflight](deploy-promote.md) only with a fresh sanitized
   snapshot. A passed local check or supplied snapshot does not resolve an
   external incident.

3. Read affected Vercel project/deployment/alias/protection/metadata-only
   variable state, Executor toolkit/connection/policy state, Sendblue
   account/webhook metadata, and Upstash database metadata as applicable.
   Classify each as confirmed, contradicted, or inconclusive with `observedAt`.

4. Choose one bounded containment. Examples requiring separate authority are
   removing external traffic from a bad deployment, disabling/removing one
   affected webhook, suspending one Executor key/toolkit connection, or
   revoking one compromised provider/session credential. Do not improvise an
   alternate account, blanket data deletion, or multi-provider mutation.

5. **Mutation gate:** attach the target-specific authority envelope, before
   state, recovery oracle, and rollback. Execute only the named operation.

6. For a deployment rollback, require current references to match provider
   state and previous references to be distinct. Coordinate agent and proxy
   configuration; do not roll back encrypted OAuth data or replace the newest
   fenced profile generation. Credential rotation or re-login is not profile
   generation rollback.

7. Re-read every changed provider target and run the boundary-matched recovery
   journey. Keep service recovery, credential revocation, message delivery,
   approval state, and Production health as separate claims.

8. Close only when the accepted postcondition is observed, emergency access is
   revoked, residual risks and unproved dimensions are recorded, and a durable
   owner/trigger is assigned. Otherwise preserve the incident as failed or
   inconclusive.

## Evidence and postcondition

Retain incident ID/times, actor/authority, exact target/environment, source and
config/deployment identity, before/after sanitized provider readbacks,
operation, observed postcondition, proof artifact/digest, limitations,
non-claims, rollback identity, remaining risk, and next owner. A provider
control-plane success is not application or handset proof.

## Rollback and revocation

Reverse only the incident change whose before state was recorded. Provider
owners control Vercel deployment/session, Executor toolkit/key/connection,
Sendblue account/webhook/API, Upstash database/access, GitHub, and secret-store
revocation. This repository has no universal revoke command. Read back the
provider state after every revocation and quarantine any uncertain credential.

## Stop and escalation

Stop on shared Preview/Production identity or bearer, wrong source/config,
missing binding, Sendblue `401`/`400`/`503`, replay-store failure, pending or
replayed Executor approval, unknown current deployment, suspected secret leak,
missing rollback, or unavailable provider readback. Escalate to the provider
owner named in [`docs/operations/authority-model.md`](../../../docs/operations/authority-model.md)
and to the security/automation maintainer for break-glass reconciliation.

## Readback fallback

Use only the approved provider-authenticated metadata path for the exact
target. When unavailable, retain an `inconclusive` receipt with the last proved
postcondition and choose no mutation except an explicitly approved safest
containment. Source, old receipts, local headers, and alternate credentials are
not fallbacks; unavailable is never healthy.

## Maintenance

Review after every incident exercise or change to deployment, rollback,
credentials, secrets, Executor, Sendblue, Upstash, proof, or break-glass policy.
