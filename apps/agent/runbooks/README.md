---
document_type: runbook-index
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-21
review_trigger: agent, Eve, Vercel, Executor, Sendblue, Photon, Upstash, secret, deployment, approval, or incident boundary change
---

# Agent operations

This directory is the sole operational owner for the Bundjil agent app. It
contains repeatable procedures; the app README remains a purpose, boundary,
command, and routing map.

## Runbooks

- [Local development](local-development.md) — start and qualify the local Eve
  app without turning local behavior into provider proof.
- [Deploy and promote](deploy-promote.md) — collect just-in-time Vercel
  metadata, validate the seven Production checkpoints, stop for authority, and
  retain rollback identity.
- [Executor](executor.md) — inspect the app-owned Executor connection and
  separate discovery, execution, approval, and resume authority.
- [Sendblue](sendblue.md) — inspect webhook and replay-store topology, then
  bound any separately approved ingress or delivery operation.
- [Photon](photon.md) — prove bounded management/SDK lifecycle and own Photon
  line, webhook, typing, delivery, rollback, and recovery procedures.
- [Incident and revocation](incident-revocation.md) — contain agent incidents,
  route revocation to the owning provider, and prove recovery without exposing
  secrets.

## Shared contract

Every run records operator identity, identity source, operation, resource,
environment, duration and revocation, approval receipt, source revision,
`observedAt`, sanitized evidence, limitation, non-claim, rollback identity,
stop condition, and escalation owner. Capability or tool output never grants
authority.

External systems own their current state. A missing or failed readback is
`inconclusive`, never healthy. No procedure in this directory authorizes a
deployment, promotion, message, credential change, approval resume, provider
mutation, or production claim by itself; use the authority gate in the exact
runbook and the durable rationale in
[`docs/operations/authority-model.md`](../../../docs/operations/authority-model.md).
