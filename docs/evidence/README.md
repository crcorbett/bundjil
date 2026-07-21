---
document_type: evidence-router
lifecycle: current
authority: canonical
owner: bundjil-verification-owner
last_reviewed: 2026-07-21
review_trigger: proof packet, evidence path, retention, provenance, redaction, or lifecycle change
---

# Retained verification evidence

This directory retains exact-path sanitized proof packets and detail artifacts
for the contract in [`../verification/`](../verification/README.md). It is not
part of the default maintainer context and never owns current provider state,
policy, approval, or authority.

Store one immutable packet under `verification/packets/` for one candidate,
environment, authority envelope, journey set, and observation window. Retain
its minimal sanitized detail under `verification/details/`. The packet
identifies every detail artifact by repository-relative path and SHA-256
digest. Failed, blocked, interrupted, inconclusive, deferred, and superseded
work remains addressable with the same provenance as accepted work.

Do not retain raw secrets, tokens, protected URLs, prompts, model/tool output,
message or request bodies, phone numbers, full provider payloads, user-home
paths, or unlimited stdout/stderr. Raw operational material stays outside the
repository. Promote only the minimal sanitized, schema-valid artifact needed
to support the exact claim.

Use [`../verification/evidence-index.json`](../verification/evidence-index.json)
for lifecycle and provenance requirements. A superseded artifact remains
immutable and names its successor; it is not rewritten into current truth.
