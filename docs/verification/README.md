---
document_type: verification-router
lifecycle: current
authority: canonical
owner: bundjil-verification-owner
last_reviewed: 2026-07-21
review_trigger: app, auth, provider, deployment, messaging, approval, recovery, proof, or receipt-contract change
---

# Bundjil verification

This is the canonical route for the ten consumer-visible critical journeys,
proof packet contract, bounded command receipts, and retained evidence index.
It describes repository-owned proof structure; it neither grants an external
operation nor asserts present provider state.

## Use the right owner

- [`critical-journeys.json`](critical-journeys.json) is the exact, small
  inventory. Each record conforms to the shared critical-journey contract.
- [`journey-command-map.json`](journey-command-map.json) maps those IDs to
  actual local commands or the target-owned runbook that must be followed.
- [`proof-packet.schema.json`](proof-packet.schema.json) is the machine-readable
  packet contract. Start from the matching template in
  [`templates/`](templates/).
- [`bounded-command-receipt.md`](bounded-command-receipt.md) owns legible
  command/procedure output. Full sanitised detail is addressable outside this
  default route.
- [`evidence-index.json`](evidence-index.json) owns retention classes,
  provenance fields, lifecycle transitions, and the directory for packets.

## Claim boundaries

Local source, test, smoke-test, and schema proof establish only their named
local postconditions. A Preview packet is not a Production packet. A packet
whose required external readback is unavailable is `inconclusive`; it may not
become `proved`, `passed`, or a provider-health claim. HGI-309 owns any approved
provider readback, mutation, send, deployment, promotion, or approval-resume
qualification.

Current qualification is explicit in `journey-command-map.json`. Workspace
status and local proxy mock health/auth/SSE are locally proved. Gateway
session creation/recovery is deferred because no deterministic session and
interrupted-stream recovery fixture exists. Local reauthentication,
Sendblue/provider rejection, and deployment preflight have only partial local
contract proof. Sendblue sends, Executor reads/resumes, deployment/promotion,
and incident containment/recovery remain approval-gated external journeys.

For an external or approval-gated journey, first use the app-owned runbook:
[`../../apps/agent/runbooks/README.md`](../../apps/agent/runbooks/README.md) or
[`../../apps/codex-proxy/runbooks/README.md`](../../apps/codex-proxy/runbooks/README.md).
Those runbooks own preconditions, identity, authority, rollback, and
escalation. The packet records their evidence; it never substitutes for them.

## Retention and handoff

Create a packet only for one identifiable candidate and one environment. Keep
the default handoff bounded: invariant, exact target, recovery hint, omitted
detail path, and postcondition. Live commands first use ignored mode-`0600`
`tmp/proof/**` detail. Store packets under
`docs/evidence/verification/packets/` and retained sanitised detail under
`docs/evidence/verification/details/`, each with a SHA-256 digest. Do not record secret values, request
bodies, message content, tokens, home paths, or unlimited process output.

Failed, blocked, interrupted, and inconclusive packets are retained with the
same provenance as successful ones. They are evidence, not standing policy or
current provider truth.
