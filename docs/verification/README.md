---
document_type: verification-router
lifecycle: current
authority: canonical
owner: bundjil-verification-owner
last_reviewed: 2026-08-05
review_trigger: app, auth, provider, deployment, messaging, approval, recovery, proof, or receipt-contract change
---

# Bundjil verification

This is the canonical route for the consumer-visible critical-journey
registry, proof packet contract, bounded command receipts, retained evidence
index, and recorded harness evaluation epoch.
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
- Preview report-only journey `BND-J14-preview-infrastructure-drift-report`
  binds one exact source and read-only authority to native desired-plan and
  sync-dry-run observations, fingerprinted classifications, zero provider
  writes, and explicit missing-data/non-claims. Workflow source and local
  fixtures are not hosted-run, external-setting, current-provider, repair, or
  alert-delivery proof.
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
  routing-directory plus canonical-principal boundary. Its current successor
  slice adds an identity-free route-disposition oracle and proves it through
  one immutable signed safe callback plus exact deployment-log readback. It
  does not classify the earlier provider requests or complete the journey.
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
- [`channel-production-accepted-2026-07-31.md`](channel-production-accepted-2026-07-31.md)
  proves the current Alchemy-owned Production topology, exact immutable Vercel
  source, corrected Photon callback cutover and retirement, an independent
  Sendblue iMessage journey, final two-read no-op inventory, rollback limits,
  and separate handset-visible-typing non-claims.
- [`HEQ-timeout-readback-2026-07-25.json`](../evidence/verification/packets/HEQ-timeout-readback-2026-07-25.json)
  retains the superseded local-only timeout gate. Its unavailable hosted state
  is historical; the successor Preview packet owns current exact-candidate
  function, plan, latency, Workflow, provider, and restoration readback.
- [`codex-terra-preview-blocked-2026-08-03.json`](../evidence/verification/packets/codex-terra-preview-blocked-2026-08-03.json)
  retains the exact source-built Codex proxy and agent Preview candidates,
  high-effort and protected Terra/context readback, plus the non-ready proxy
  stop. It does not prove Codex subscription acceptance, SSE completion, Eve
  session/replay, or any Production result.
- [`codex-terra-preview-isolation-blocked-2026-08-04.json`](../evidence/verification/packets/codex-terra-preview-isolation-blocked-2026-08-04.json)
  retains the successor metadata-only isolation stop: no Preview-only writable
  REST store was bound to the encrypted Codex profile boundary, and the only
  writable candidate also targets Production. It proves no login, deployment,
  subscription, Eve, replay, or Production result.
- [`codex-terra-preview-upstash-billing-blocked-2026-08-04.json`](../evidence/verification/packets/codex-terra-preview-upstash-billing-blocked-2026-08-04.json)
  retains the Marketplace direct-store readback: the existing Upstash
  installation has no free Redis plan, so no paid resource was created without
  named-plan and spending approval. It is historical after the approved shared
  store decision and proves no profile, proxy, Eve, replay, deployment, or
  Production result.
- [`codex-terra-preview-shared-upstash-binding-2026-08-04.json`](../evidence/verification/packets/codex-terra-preview-shared-upstash-binding-2026-08-04.json)
  records the approved reuse of the agent-bound Upstash store for proxy
  Preview and Production, with separate Preview profile/prefix/cipher metadata
  retained. It proves only sensitive variable-name/target readback, not store
  reachability, OAuth, encrypted profile isolation, SSE, Eve replay, or a
  Production result.
- [`codex-terra-preview-live-proxy-2026-08-04.json`](../evidence/verification/details/codex-terra-preview-live-proxy-2026-08-04.json)
  retains the successful Preview stored-profile and private proxy proof: the
  subscription request mapped Terra/high and completed a bounded SSE stream.
  It is superseded only for its former Eve-session limitation by the later
  dedicated Eve receipt; it remains the proxy/profile proof owner.
- [`codex-terra-preview-live-eve-2026-08-04.json`](../evidence/verification/details/codex-terra-preview-live-eve-2026-08-04.json)
  records the protected Preview Eve info, session acceptance, and
  `startIndex=0` durable replay using Vercel's short-lived project OIDC token
  and CLI protection path. It retains event counts and status only; it does
  not claim Production, channel delivery, a public Eve route, general external
  caller capability, or that replay made no second upstream call. The current
  SPEC now records the accessible Eve `0.29.5` Agent Runs metadata and keeps
  the separate no-second-upstream-call claim blocked until a supported
  Eve/provider correlation seam and durable atomic proxy receipt are
  implemented; the older CLI OpenTelemetry attempt remains negative evidence.
- [`codex-terra-preview-live-eve-upgraded-2026-08-04.json`](../evidence/verification/details/codex-terra-preview-live-eve-upgraded-2026-08-04.json)
  records the Eve `0.29.5` protected Preview proof after the upgrade: exact
  Terra/1050000 info, session completion, identical `startIndex=0` replay
  event counts, and the accessible Agent Runs model/deployment/lifecycle
  metadata. The current Vercel surface does not expose `$eve.*` Workflow tags,
  and the repository has not yet completed the successor correlation/receipt
  tasks, so the packet remains blocked on the independent no-second-upstream-
  call predicate. It proves neither Production, channel delivery, public Eve
  access, nor general caller capability.
- [`HEQ-preview-qualification-accepted-2026-07-25.json`](../evidence/verification/packets/HEQ-preview-qualification-accepted-2026-07-25.json)
  proves exact send acceptance before `202`, intended-session continuity,
  deployment-replacement durability, one bounded result, exact Sendblue
  duplicate suppression, clean bounded logs, and restoration for source
  `a3f89877503acb137c0b76b1c09356e4789efe07`. Every observed Workflow step
  remained attempt one, so it does not claim a forced process retry.
- [`HEQ-production-qualification-blocked-2026-07-25.json`](../evidence/verification/packets/HEQ-production-qualification-blocked-2026-07-25.json)
  retains the superseded unattempted Production gate.
- [`HEQ-production-qualification-2026-07-25.json`](../evidence/verification/packets/HEQ-production-qualification-2026-07-25.json)
  retains accepted direct Sendblue and Photon candidate journeys, complete
  Sendblue duplicate suppression, monitoring, and restoration. Combined
  Production remains inconclusive because Photon exposes no exact delivered
  body or replay control for the candidate-specific duplicate oracle.
- [`HEQ-terminal-five-pass-audit-2026-07-25.json`](../evidence/verification/packets/HEQ-terminal-five-pass-audit-2026-07-25.json)
  retains the superseded local-only five-pass closeout. Later hosted work
  reopened the terminal lifecycle; its successor packet owns final closeout.
- [`HEQ-terminal-five-pass-hosted-audit-2026-07-25.json`](../evidence/verification/packets/HEQ-terminal-five-pass-hosted-audit-2026-07-25.json)
  retains the accepted single replacement audit on final hosted
  receipt-bearing state. All five passes accepted with no findings; Preview
  remains accepted and combined Production remains inconclusive on the Photon
  exact duplicate oracle.

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
operation. `BND-J13-hosted-eve-durability` is accepted for the dated immutable
Preview packet's exact boundaries; it does not generalize to a forced process
retry or future runtime state. The current
`BND-J12-dual-channel-production` packet is inconclusive only on the missing
candidate-specific Photon exact duplicate oracle; direct provider success
does not weaken that oracle.

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
