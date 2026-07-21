---
document_type: audit-index
lifecycle: evidence
authority: supporting
owner: bundjil-documentation-owner
last_reviewed: 2026-07-21
review_trigger: any HGI corpus, route, decision, reconciliation, or acceptance receipt change
---

# Documentation audit

This directory owns dated corpus, link, acceptance, and Git receipts. It does
not own current policy or provider truth; use [`../README.md`](../README.md).

Current HGI-300 receipts:

- [`corpus-inventory.json`](corpus-inventory.json)
- [`link-report.json`](link-report.json)
- [`HGI-300-S1-receipt.json`](HGI-300-S1-receipt.json)
- [`HGI-300-S1-git-receipt.json`](HGI-300-S1-git-receipt.json)
- [`HGI-300-S2-receipt.json`](HGI-300-S2-receipt.json)
- [`HGI-300-validation.json`](HGI-300-validation.json)

Current HGI-301 evidence:

- [`HGI-301-eve-reconciliation.json`](HGI-301-eve-reconciliation.json)
- [`HGI-301-candidate.json`](HGI-301-candidate.json)
- [`HGI-301-validation.json`](HGI-301-validation.json)

HGI-308 decision evidence:

- [`HGI-308-source-receipt.json`](HGI-308-source-receipt.json)
- [`HGI-308-candidate.json`](HGI-308-candidate.json)
- [`HGI-308-validation.json`](HGI-308-validation.json)
- [`HGI-308-eve-live-state.decision.json`](HGI-308-eve-live-state.decision.json)
- [`HGI-308-runbook-ownership.decision.json`](HGI-308-runbook-ownership.decision.json)
- [`HGI-308-claude-review.decision.json`](HGI-308-claude-review.decision.json)
- [`HGI-308-boundary-exceptions.decision.json`](HGI-308-boundary-exceptions.decision.json)
- [`HGI-308-readback-fallbacks.decision.json`](HGI-308-readback-fallbacks.decision.json)

HGI-302 control evidence:

- [`HGI-302-candidate.json`](HGI-302-candidate.json)
- [`HGI-302-validation.json`](HGI-302-validation.json)

The accepted local defaults grant no provider or operation authority. The
source receipt is content-addressed by every decision record; the Eve live-state
deferral remains inconclusive rather than healthy.

Counts prove path accounting only. Fresh-context retrieval and the semantic
owner must support current-document claims.
