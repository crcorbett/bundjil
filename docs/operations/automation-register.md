---
document_type: automation-register
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-07-21
review_trigger: workflow, action pin, token, OIDC, permission, trigger, target gate, concurrency, timeout, release, review, receipt, or external-setting change
---

# Workflow automation register

This register owns Bundjil's durable GitHub workflow admission and authority
policy. Workflow YAML owns executable desired state. GitHub owns current
settings, identity issuance, runs, checks, comments, and pull requests at
readback time. This register is not a runbook, approval receipt, or claim that
GitHub executed the desired state.

The machine-readable provider and interaction envelopes live in
[`authority-register.json`](authority-register.json). Approved third-party
action identities live in [`github-actions-lock.json`](github-actions-lock.json).
The complete typed inventory for GitHub, deployment, provider, and report-only
loops lives in
[`../standards/automation-register.json`](../standards/automation-register.json),
routed by [`../standards/controls.md`](../standards/controls.md). This document
keeps the GitHub workflow rationale; the typed register prevents the other
loops from disappearing from admission review.
`bun run check:authority` rejects drift across all three owners and the workflow
source; `bun run check:controls` rejects automation-state, proof, metric,
retirement, and freshness-publication drift.

## Admission rule

Continuous automation is admitted only when it has an observable signal,
least-privilege identity, exact operation and resource, bounded duration,
durable convergence state, proof on each run, a stopping rule, rollback or
revocation, and named escalation. Source review may establish that desired
contract. It cannot establish current GitHub settings, token claims, secret
availability, action behavior, a successful run, or an external consequence.

Issue, pull-request, model, provider, or tool text is untrusted input. It may
request work but cannot grant identity, approval, policy, capability, or
authority. A workflow must never infer permission from its own successful
output.

Emergency containment is one-shot, time-bounded, exact-target, and
non-normal-operation. It requires explicit approval, a bounded receipt, and
mandatory reconciliation through the authority model; it is never an
automation fallback.

## Current desired-state records

### CI verification — admitted read-only automation

- **Signal and target:** push or pull request for `main` in
  `crcorbett/bundjil`; exact source revision is the candidate identity.
- **Principal and authority:** the ephemeral GitHub Actions job token has only
  `contents: read`. The synthetic Executor variables are fixtures, not a
  provider identity or secret. CI has no OIDC, secret, write, deploy, release,
  message, or approval-resume authority.
- **Duration and convergence:** one 30-minute run per repository and pull
  request/ref; a newer candidate cancels a stale run.
- **Evidence:** the GitHub check/run identity and bounded repository command
  results. Local parity does not prove the hosted run.
- **Stop, rollback, and escalation:** a failed or unavailable check stops
  acceptance. Revert the workflow change or disable the workflow under separate
  GitHub-setting authority; escalate to the repository owner.

### Release pull request — disabled pending external authority epoch

- **Signal and target:** a push to `refs/heads/main` in
  `crcorbett/bundjil`, plus repository variable
  `BUNDJIL_RELEASE_AUTHORITY_EPOCH=hgi-304-v1`.
- **Principal and operation:** the job-scoped `GITHUB_TOKEN` may write contents
  and pull requests only to create or converge the Changesets version pull
  request. It may not publish, merge, approve, tag, deploy, or release a
  package.
- **Approval boundary:** repository source authorizes only the desired static
  operation. HGI-309 must separately read and approve the GitHub variable,
  token/settings, branch target, and reversal before enabling or claiming the
  external capability. Merging the generated pull request remains a human
  decision.
- **Duration and convergence:** main-targeted runs serialize and never cancel
  an in-flight writer; each has a 20-minute timeout. Changesets owns convergence
  to one version pull request.
- **Evidence:** source SHA, run identity, exact generated pull request if one is
  observed, sanitized changed-package summary, and post-run repository
  readback. An absent or unreadable setting/run is `inconclusive`.
- **Stop, rollback, and escalation:** stop on target mismatch, unexpected write,
  publication input, duplicate writer, or missing rollback identity. Disable
  the epoch gate and close/revert the generated pull request under separate
  authority; escalate to the repository owner.

### Interactive Claude — owner-invoked foreground capability

- **Signal and target:** only the repository owner may invoke `@claude` on the
  exact issue or pull-request conversation, and the comment body must begin
  exactly with `@claude`. A quoted, forwarded, indirect, or embedded mention is
  not an invocation. Each accepted invocation is one foreground request, not
  continuous review automation.
- **Principal and authority:** the workflow token is read-only for contents,
  issues, and pull requests. `id-token: write` is scoped to the pinned
  Anthropic action's workload exchange; the named OAuth secret is an input
  binding, never evidence of availability. The declared shell-tool allowlist is
  limited to built-in `Read`, `Glob`, and `Grep` and excludes shell, comment,
  edit, merge, approve, release, deploy, provider mutation, and approval
  resume.
- **Duration and convergence:** one 15-minute run per issue or pull request;
  a new owner invocation cancels the stale run. One invocation is the stopping
  boundary.
- **Evidence and non-claim:** record source/run/conversation identity and the
  sanitized provider-managed response if observed. Repository permissions do
  not prove the external action's OIDC audience, credential, comment identity,
  or runtime behavior; HGI-309 owns that readback.
- **Stop, rollback, and escalation:** reject ineligible actors, indirect or
  quoted mentions, unknown targets, write requests, and unbounded tools. Cancel
  or disable the workflow under separate authority and escalate to the
  repository owner and Anthropic integration owner.

### Automatic Claude review — retired

The former pull-request-open/synchronize workflow is removed. HGI-308 found no
proved comment identity, least-privilege write path, head-SHA deduplication,
severity taxonomy, convergence, stopping, escalation, cost, or false-positive
evidence. It must not be restored as governed automation without a new SPEC,
an explicit authority envelope, one-comment-per-head convergence, bounded
proof, and HGI-306 admission evidence. Retained decision provenance is
[`HGI-308-claude-review.decision.json`](../documentation-audit/HGI-308-claude-review.decision.json).

### Deployment and provider operations — foreground or disabled

Vercel deployment/promotion, Sendblue outbound work, Executor reads/resumes,
and AI Gateway/Eve turns remain foreground operations with exact target-owned
runbooks, authority, proof, stopping, and recovery. The hosted Codex model
proxy remains disabled pending proof. None is admitted as scheduled continuous
automation, and unavailable external readback stays inconclusive.

Sendblue inbound processing is the one admitted consequential runtime loop. Its
signed ingress, durable replay/lease state, one-turn convergence, bounded proof,
no-blind-retry rule, stopping, recovery, and escalation are recorded in the
typed register. HGI-306 neither reads nor changes its current provider state.

### Documentation and context freshness — report-only

Background freshness may emit only a typed isolated candidate. Candidate output
cannot feed itself, edit a current owner, review itself, or publish policy.
Distinct review, approval, publisher identity, immutable revision, atomic
readback, and last-known-good recovery are required before publication. The
canonical contract is
[`../../tooling/documentation/freshness-candidate.ts`](../../tooling/documentation/freshness-candidate.ts).

## Action pin ownership

Every local `uses:` reference is an exact 40-character commit from the action
lock. The security/automation maintainer resolves the reviewed upstream ref,
reviews release notes and the diff from the current pin, updates the lock and
all approved workflow locations atomically, runs `bun run check:authority` and
`bun run verification`, and records the public Git-ref provenance. A public
ref proves only tag/ref resolution, not action safety or hosted execution.

Unknown, floating, short, mismatched, or unregistered actions fail closed.
Rollback restores the prior lock and workflow pins together. Compromise or
upstream deletion stops the affected workflow and escalates to the repository
owner; it does not justify substituting an unreviewed fork or tag.

## External settings and HGI-309

HGI-309 must use authenticated, metadata-only GitHub readback to prove or
reverse Actions enablement, default permissions, exact workflow identity,
environment/rule settings, the release epoch variable, token/OIDC claims,
secret binding metadata, run identity, and any resulting comment or pull
request. No value read, setting change, workflow dispatch, comment, release,
or provider mutation is authorized by this register.
