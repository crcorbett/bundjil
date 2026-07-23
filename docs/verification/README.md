---
document_type: verification-router
lifecycle: current
authority: canonical
owner: bundjil-verification-owner
last_reviewed: 2026-07-23
review_trigger: app, auth, provider, deployment, messaging, approval, recovery, proof, or receipt-contract change
---

# Bundjil verification

This is the canonical route for the twelve consumer-visible critical journeys,
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
- [`photon-provider-proof-2026-07-21.md`](photon-provider-proof-2026-07-21.md)
  retains the bounded pre-promotion Photon management/SDK lifecycle receipt;
  it is not Preview, messaging, handset, or Production proof.
- [`photon-resource-reconciliation-2026-07-21.md`](photon-resource-reconciliation-2026-07-21.md)
  retains the bounded dedicated-line attempt and zero-mutation readback. Its
  Business-upgrade conclusion is superseded by the current Free managed-shared
  topology; it proves no Preview, message, typing, Sendblue, or Production result.
- [`photon-preview-2026-07-21.md`](photon-preview-2026-07-21.md) retains the
  current hosted Preview deployment, Marketplace binding, protection, and
  signed-ingress proof plus the inconclusive first messaging attempt. It is not
  outbound, handset, duplicate, Eve-completion, or Production proof.
- [`photon-corrected-recipient-2026-07-22.md`](photon-corrected-recipient-2026-07-22.md)
  retains the corrected Australian managed-shared user reconciliation and one
  unretried uncertain local SDK send. It proves neither provider acceptance nor
  handset delivery and leaves the Production gate closed.
- [`photon-local-stream-2026-07-22.md`](photon-local-stream-2026-07-22.md)
  proves one exact Free per-user assigned route through local Spectrum inbound,
  provider-accepted reply, clean SDK release, and handset reply observation. It
  is not webhook, Eve, replay, duplicate, visible-typing, Preview, or Production
  proof.
- [`photon-sdk-version-refresh-2026-07-22.md`](photon-sdk-version-refresh-2026-07-22.md)
  records the exact latest-stable Spectrum 12.3.0 manifest/lock refresh and
  repository compatibility gates. It performs no provider operation and does
  not upgrade the 12.2.0 handset receipt into 12.3.0 live proof.
- [`photon-preview-participant-resolution-2026-07-22.md`](photon-preview-participant-resolution-2026-07-22.md)
  retains the 12.3.0 hosted signed-ingress/Eve observation, failed opaque-Space
  outbound diagnosis, and local participant-based DM correction. It is not a
  successful outbound, typing, handset, duplicate, or Production proof.
- [`photon-preview-accepted-2026-07-23.md`](photon-preview-accepted-2026-07-23.md)
  proves the exact 12.3.0 hosted Preview source/deployment, signed ingress,
  same-ID provider retry suppression, Eve completion, provider-accepted reply,
  both typing transitions, scoped release, and one handset reply. Visible
  handset typing and every Production boundary remain unproved.
- [`channel-production-staged-2026-07-23.md`](channel-production-staged-2026-07-23.md)
  proves the exact clean dual-Channel Production candidate, source/config and
  rollback identities, provider inventories, signed route fixtures, and passed
  staged preflight while the explicit stable domain remains unchanged. It is
  not a promotion, live provider journey, handset, or visible-typing receipt.

## Claim boundaries

Local source, test, smoke-test, and schema proof establish only their named
local postconditions. A Preview packet is not a Production packet. A packet
whose required external readback is unavailable is `inconclusive`; it may not
become `proved`, `passed`, or a provider-health claim. HGI-309 owns any approved
provider readback, mutation, send, deployment, promotion, or approval-resume
qualification unless an accepted current SPEC and target-owned runbook record
the exact task-scoped authority. The active Channel promotion uses that latter
boundary; it grants no standing authority after the task closes.

Current qualification is explicit in `journey-command-map.json`. Workspace
status and local proxy mock health/auth/SSE are locally proved. Gateway
session creation/recovery is deferred because no deterministic session and
interrupted-stream recovery fixture exists. Local reauthentication,
Sendblue/provider rejection, and deployment preflight have only partial local
contract proof. Sendblue sends, Executor reads/resumes, deployment/promotion,
Photon messaging/typing, the combined dual-Channel Production journey,
Sendblue sends, Executor reads/resumes, deployment/promotion, and incident
containment/recovery remain approval-gated external journeys.

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
