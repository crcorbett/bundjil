---
document_type: runbook-index
lifecycle: current
authority: canonical
owner: bundjil-codex-proxy-operator
last_reviewed: 2026-07-21
review_trigger: proxy, Codex OAuth, Vercel, Upstash, secret, deployment, auth, proof, or incident boundary change
---

# Codex proxy operations

This directory is the sole operational owner for the Bundjil Codex proxy app.
It contains repeatable procedures; the app and package READMEs remain concise
boundary and command maps.

## Runbooks

- [Local authentication](local-auth.md) — create and inspect an isolated,
  encrypted trusted-local subscription profile.
- [Preview proof](preview-proof.md) — bind an immutable Preview target to the
  existing private HTTP probe and retain its limitations.
- [Production proof](production-proof.md) — define the independent Production
  evidence gate and refuse Preview/local evidence as a substitute.
- [Reauthentication](reauthentication.md) — distinguish permanent
  reauthentication from transient auth failure and replace one exact subject.
- [Incident and revocation](incident-revocation.md) — contain proxy incidents,
  route provider-owned revocation, and preserve the newest fenced profile
  generation.

## Shared contract

Every run records operator identity, identity source, operation, resource,
environment, duration and revocation, approval receipt, source revision,
`observedAt`, sanitized evidence, limitation, non-claim, rollback identity,
stop condition, and escalation owner. Capability or a successful tool result
never grants authority.

External systems own their current state. A missing or failed readback is
`inconclusive`, never healthy. No procedure in this directory authorizes a
login, profile write, probe, deployment, credential change, provider mutation,
or production claim by itself; use the authority gate in the exact runbook and
the durable rationale in
[`docs/operations/authority-model.md`](../../../docs/operations/authority-model.md).
