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

HGI-310 skill evidence:

- [`HGI-310-candidate.json`](HGI-310-candidate.json)
- [`HGI-310-scenarios.json`](HGI-310-scenarios.json)
- [`HGI-310-validation.json`](HGI-310-validation.json)
- [`hgi-310/HGI310-EFFECT-01.json`](hgi-310/HGI310-EFFECT-01.json)
- [`hgi-310/HGI310-PROXY-AUTH-01.json`](hgi-310/HGI310-PROXY-AUTH-01.json)
- [`hgi-310/HGI310-PROVIDER-01.json`](hgi-310/HGI310-PROVIDER-01.json)
- [`hgi-310/HGI310-WORKFLOW-01.json`](hgi-310/HGI310-WORKFLOW-01.json)
- [`hgi-310/HGI310-PROOF-LIFECYCLE-01.json`](hgi-310/HGI310-PROOF-LIFECYCLE-01.json)
- [`hgi-310/HGI310-PORTABLE-01.json`](hgi-310/HGI310-PORTABLE-01.json)

HGI-303 runbook and authority evidence:

- [`HGI-303-validation.json`](HGI-303-validation.json)
- [`HGI-303-candidate.json`](HGI-303-candidate.json)
- [`HGI-303-scenarios.json`](HGI-303-scenarios.json)
- [`hgi-303/HGI303-DEPLOY-STOP-01.json`](hgi-303/HGI303-DEPLOY-STOP-01.json)
- [`hgi-303/HGI303-EXECUTOR-RESUME-01.json`](hgi-303/HGI303-EXECUTOR-RESUME-01.json)
- [`hgi-303/HGI303-SENDBLUE-INCONCLUSIVE-01.json`](hgi-303/HGI303-SENDBLUE-INCONCLUSIVE-01.json)
- [`hgi-303/HGI303-PROOF-BOUNDARY-01.json`](hgi-303/HGI303-PROOF-BOUNDARY-01.json)
- [`hgi-303/HGI303-REAUTH-SUBJECT-01.json`](hgi-303/HGI303-REAUTH-SUBJECT-01.json)
- [`hgi-303/HGI303-REVOCATION-NO-COMMAND-01.json`](hgi-303/HGI303-REVOCATION-NO-COMMAND-01.json)

HGI-304 workflow and provider-authority evidence:

- [`HGI-304-candidate.json`](HGI-304-candidate.json)
- [`HGI-304-source-inventory.json`](HGI-304-source-inventory.json)
- [`HGI-304-scenarios.json`](HGI-304-scenarios.json)
- [`HGI-304-validation.json`](HGI-304-validation.json)
- [`hgi-304/HGI304-CLAUDE-ACTOR-01.json`](hgi-304/HGI304-CLAUDE-ACTOR-01.json)
- [`hgi-304/HGI304-RELEASE-EPOCH-01.json`](hgi-304/HGI304-RELEASE-EPOCH-01.json)
- [`hgi-304/HGI304-AUTO-REVIEW-01.json`](hgi-304/HGI304-AUTO-REVIEW-01.json)
- [`hgi-304/HGI304-OBSERVATION-AUTHORITY-01.json`](hgi-304/HGI304-OBSERVATION-AUTHORITY-01.json)
- [`hgi-304/HGI304-CONTAINMENT-01.json`](hgi-304/HGI304-CONTAINMENT-01.json)
- [`hgi-304/HGI304-ACTION-PIN-01.json`](hgi-304/HGI304-ACTION-PIN-01.json)

The accepted local defaults grant no provider or operation authority. The
source receipt is content-addressed by every decision record; the Eve live-state
deferral remains inconclusive rather than healthy.

Counts prove path accounting only. Fresh-context retrieval and the semantic
owner must support current-document claims.
