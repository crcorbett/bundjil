---
document_type: authority-model
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-07-21
review_trigger: identity, provider, workflow, permission, deployment, messaging, credential, approval, rollback, or runbook change
---

# Operational authority model

This document owns durable authority rationale and routes exact procedures to
the target app. It is not a central runbook and contains no mutable provider
state.

## Capability, observation, policy, and authority

- Capability means an identity or tool can attempt an operation.
- Observation is dated, target-specific output. It may establish a bounded
  fact but never approval.
- Policy defines allowed behavior and review boundaries.
- Authority binds one identity, operation, resource, environment, duration,
  approval, audit receipt, rollback, and revocation. It is not implied by the
  other three.

Repository instructions, a passing preflight, provider output, historical
approval, and an available credential do not authorize a consequential action.
HGI-304 owns the remaining workflow and provider authority controls; until
that slice is accepted, each runbook must stop at its explicit mutation gate
unless a separately recorded approval names the complete envelope.

## Required envelope

Record this before a consequential step:

| Field                   | Required evidence                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Principal and identity  | Human or workload principal plus authenticated identity source                                                |
| Operation               | One exact read, deploy, promote, send, resume, login, rotate, revoke, rollback, or configuration change       |
| Resource                | App, project, deployment, account, toolkit, connection, webhook, database, profile subject, or secret binding |
| Environment             | Local, isolated proof, Preview, or Production; never infer it from a URL alone                                |
| Duration and revocation | Start/expiry or one-shot boundary, revocation owner, and recovery path                                        |
| Approval                | Approver, approved operation/target, timestamp, and addressable receipt                                       |
| Evidence                | Source revision, provider readback, `observedAt`, sanitized result, limitation, and non-claim                 |
| Rollback and escalation | Accepted rollback identity, postcondition readback, stop condition, and named escalation owner                |

An envelope is invalid when a field is unknown, the target changed after
approval, the readback is stale or unavailable, the identity cannot be
confirmed, or rollback/revocation cannot be named.

## Target owners and just-in-time truth

| Target                            | Repeatable-operation owner                                                                                                           | Current-state readback                                                                                         | Consequential boundary                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Agent/Eve and Vercel deployment   | [`apps/agent/runbooks/`](../../apps/agent/runbooks/README.md)                                                                        | Authenticated Vercel project, environment, deployment, alias, protection, and metadata-only variable inventory | Deploy, promote, alias, environment, rollback, or traffic change                                |
| Executor                          | [Executor runbook](../../apps/agent/runbooks/executor.md)                                                                            | Authenticated toolkit, connection, capability, policy, and approval-state metadata                             | Tool execution, approval acceptance/decline, resume, connection, key, or policy change          |
| Sendblue and agent replay store   | [Sendblue runbook](../../apps/agent/runbooks/sendblue.md)                                                                            | Authenticated account/webhook metadata and Upstash database metadata with credentials hidden                   | Webhook, line, message, replay data, credential, or routing change                              |
| Codex proxy and Vercel deployment | [`apps/codex-proxy/runbooks/`](../../apps/codex-proxy/runbooks/README.md)                                                            | Authenticated Vercel project/deployment metadata plus the target-matched app proof                             | Deploy, promote, profile login/write, environment, bearer, cipher, alias, or rollback change    |
| Codex OAuth profile and Upstash   | [Local auth](../../apps/codex-proxy/runbooks/local-auth.md), [reauthentication](../../apps/codex-proxy/runbooks/reauthentication.md) | Sanitized stored-profile proof and authenticated database metadata; never raw keys, ciphertext, or tokens      | Login, import, profile write/delete, refresh staging, token revoke, key/namespace/cipher change |
| GitHub workflows and settings     | HGI-304 authority owner; no app runbook substitutes for it                                                                           | Authenticated `gh`/API repository, workflow, permission, environment, and rule metadata                        | Workflow/settings write, release, review loop, approval resume, token/OIDC permission change    |
| Secrets and 1Password             | Runbook for the consuming target plus the secret-store owner                                                                         | Metadata-only binding/name/version/access inventory; never a value readback                                    | Create, reveal, copy, rotate, revoke, or rebind secret material                                 |

If the preferred readback is unavailable, retain an `inconclusive` receipt with
the attempted identity, target, `observedAt`, failure shape, last proved
postcondition, limitation, escalation owner, and resume trigger. Do not switch
to an unapproved alternate account, connector, secret path, or mutation API.

## Receipt and lifecycle

Keep one-run output in dated evidence, not this document or a README. A receipt
identifies the artifact and digest, actor/authority, source revision, exact
journey, environment, provider readback, observable result, limitations,
non-claims, rollback identity, and what remains unproved. Redact secret values,
tokens, raw profiles/ciphertext, authorization codes/verifiers, protected URLs,
message contents, and phone identities.

Failed, blocked, and inconclusive work remains addressable outside the default
route. Recovery proves the target again; it does not erase failed evidence or
turn a prior receipt into standing actuality.
