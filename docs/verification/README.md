---
document_type: verification-router
lifecycle: current
authority: canonical
owner: bundjil-verification-owner
last_reviewed: 2026-07-25
review_trigger: app, auth, provider, deployment, messaging, approval, recovery, proof, or receipt-contract change
---

# Bundjil verification

This is the canonical route for the thirteen consumer-visible critical journeys,
proof packet contract, bounded command receipts, retained evidence index, and
recorded harness evaluation epoch.
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
- Alchemy adoption keeps its fixed-contract state receipts under ignored
  mode-`0600` `tmp/proof/**` while the active SPEC remains open. The task
  ledger and active plan retain the sanitized summary; state, provider,
  deployment, runtime, Channel, and handset claims remain separate.
- Preview configuration journey `BND-J13-preview-infrastructure-convergence`
  binds the fixed authority, native Alchemy plan/apply/sync/rollback sequence,
  direct provider readbacks, immutable Git SHA and Vercel Git deployment
  observation. Local provider matrices and remote state alone are false-green
  rejections, not provider-bound proof.
- [`evidence-index.json`](evidence-index.json) owns retention classes,
  provenance fields, lifecycle transitions, and the directory for packets.
- [`harness-epochs.md`](harness-epochs.md) owns epoch identity,
  requalification triggers, fresh-context discipline, and intervention
  lifecycle. [`effectiveness.md`](effectiveness.md) owns accepted outcomes,
  the four clocks, human attention, and evidence-limited comparisons.
- [`photon-provider-proof-2026-07-21.md`](photon-provider-proof-2026-07-21.md)
  retains the bounded pre-promotion Photon management/SDK lifecycle receipt;
  it is not Preview, messaging, handset, or Production proof.
- [`photon-resource-reconciliation-2026-07-21.md`](photon-resource-reconciliation-2026-07-21.md)
  retains the bounded dedicated-line attempt and zero-mutation readback. Its
  Business-upgrade conclusion is superseded by the current Free managed-shared
  topology; it proves no Preview, message, typing, Sendblue, or Production result.
- [`photon-preview-2026-07-21.md`](photon-preview-2026-07-21.md) retains the
  hosted Preview deployment, Marketplace binding, protection, and
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
- [`alchemy-photon-preview-isolation-2026-07-25.md`](alchemy-photon-preview-isolation-2026-07-25.md)
  records the separate Free Preview project bootstrap, two matching
  fingerprint-only candidate inventories, the provider-seeded concurrent user,
  unchanged source binding, isolated credential custody, and rollback
  identity. It does not yet prove a webhook, Vercel binding, deployment,
  signed ingress, Channel journey, handset result, Production, or cleanup.
- [`alchemy-photon-preview-webhook-binding-2026-07-25.md`](alchemy-photon-preview-webhook-binding-2026-07-25.md)
  records the exact READY Git deployment, corrected protected signature
  boundary, one rollout-created stable webhook, four Preview-only sensitive
  Vercel metadata identities, lossless callback cutover, retry drain, exact old
  callback cleanup, and stable signed `204` ingress. The real Channel journey,
  handset result and Production remain unproved.
- [`alchemy-photon-preview-native-origin-2026-07-26.md`](alchemy-photon-preview-native-origin-2026-07-26.md)
  records the temporary-user/query-callback adaptation, exact route's SMS-only
  classification, bounded native Messages service failure, zero message send,
  stable redeployment, retry drain, exact cleanup, matching restored
  inventories, and unchanged adopted/source bindings. Its outbound diagnosis
  is corrected by the 2026-07-28 topology receipt; the SMS-only and denied-send
  observations remain negative evidence, not Channel or terminal SPEC proof.
- [`alchemy-photon-outbound-permission-diagnosis-2026-07-26.md`](alchemy-photon-outbound-permission-diagnosis-2026-07-26.md)
  compares the working and isolated Free/shared topologies, confirms the same
  Spectrum adapter/version and Photon's registered-target allowlist contract.
  It is superseded for current diagnosis; retain it only as read-only
  cold-outbound negative evidence, not a general send outage, provider repair,
  or Channel proof.
- [`alchemy-photon-outbound-debug-verification-2026-07-26.md`](alchemy-photon-outbound-debug-verification-2026-07-26.md)
  proves the approved Apple handle through Photon's iMessage debug bot,
  distinguishes the registered outbound target from its assigned inbound
  shared line, reproduces the corrected registered-target denial, retains the
  conditional secret-free support packet, and proves exact temporary-user
  cleanup. It is superseded for current routing and remains negative
  cold-outbound evidence, not outbound delivery or Channel proof.
- [`alchemy-photon-conversation-topology-correction-2026-07-28.md`](alchemy-photon-conversation-topology-correction-2026-07-28.md)
  is the current diagnosis owner. It separates Sendblue, source Photon and
  isolated Preview conversations; proves accepted Photon replies are
  inbound-first; distinguishes managed-shared direct messaging from dedicated
  cold outreach; retains the denied sends as negative evidence; and routes the
  next Preview proof to the exact retained-user identity or an explicit
  topology decision. It performs no provider operation and proves no new
  Channel result.
- [`alchemy-photon-preview-messages-ui-gate-2026-07-28.md`](alchemy-photon-preview-messages-ui-gate-2026-07-28.md)
  records the bounded Computer Use inspection of the Sendblue and source
  Photon iMessage conversations, the current Mac start-identity mismatch, the
  absent retained Preview conversation, and the resulting stop before
  composition. No message, duplicate count, provider mutation, or Preview
  Channel result occurred.
- [`alchemy-photon-shared-sender-topology-decision-2026-07-29.md`](alchemy-photon-shared-sender-topology-decision-2026-07-29.md)
  records the accepted one-sender, two-project, distinct-destination topology,
  its live duplicate-registration and isolated-routing proof gates, bounded
  Preview authority, rollback, and non-claims. It is a product/authority
  decision, not current provider-state or journey proof.
- [`alchemy-photon-shared-sender-topology-readback-2026-07-29.md`](alchemy-photon-shared-sender-topology-readback-2026-07-29.md)
  records the positive-controlled no-traffic oracle, explicitly irreversible
  retirement of obsolete source Preview callback `2083611d…`, retry drain, and
  sole preserved Production callback `72cac9b5…`. It also records the
  non-disruptive duplicate Preview registration, one exact iMessage Delivered
  send, Preview `204`/`401` and zero Production callback invocations, failed
  Channel acceptance, guarded temporary-user cleanup, restored canonical
  inventory digest, exact signing-secret rollback limitation, final stable
  callback ID/secret/path proof, and the remaining write-only Preview
  routing-directory plus canonical-principal boundary.
- [`channel-production-staged-2026-07-23.md`](channel-production-staged-2026-07-23.md)
  proves the exact clean dual-Channel Production candidate, source/config and
  rollback identities, provider inventories, signed route fixtures, and passed
  staged preflight while the explicit stable domain remains unchanged. It is
  not a promotion, live provider journey, handset, or visible-typing receipt.
- [`channel-production-accepted-2026-07-23.md`](channel-production-accepted-2026-07-23.md)
  proves the accepted stable-domain Production deployment, separate real
  Photon and Sendblue handset journeys, exact-identity duplicate suppression,
  provider typing start/stop, rollback readiness, and zero second external
  response. Photon visible typing is observed; Sendblue visible typing remains
  unproved.

## Claim boundaries

Local source, test, smoke-test, and schema proof establish only their named
local postconditions. A Preview packet is not a Production packet. A packet
whose required external readback is unavailable is `inconclusive`; it may not
become `proved`, `passed`, or a provider-health claim. HGI-309 owns any approved
provider readback, mutation, send, deployment, promotion, or approval-resume
qualification unless an accepted current SPEC and target-owned runbook record
the exact task-scoped authority. Historical Channel rollout authority grants no
standing authority after its task closed.

Current qualification is explicit in `journey-command-map.json`. Workspace
status and local proxy mock health/auth/SSE are locally proved. Gateway
session creation/recovery is deferred because no deterministic session and
interrupted-stream recovery fixture exists. Local reauthentication,
Sendblue/provider rejection, and deployment preflight have only partial local
contract proof. Future Sendblue or Photon sends, Executor reads/resumes,
deployment/promotion, and incident containment/recovery remain approval-gated
external journeys. The accepted dual-Channel Production journey is retained
only in its dated receipt and grants no standing authority for another
operation.

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
