---
document_type: control-register
lifecycle: current
authority: canonical
owner: bundjil-harness-maintainer
last_reviewed: 2026-08-13
review_trigger: control finding, false positive, automation loop, boundary exception, accepted-outcome, carrying-cost, or retirement change
---

# Harness controls and automation admission

This document routes Bundjil's controls, feedback promotion, and automation
admission. The typed records in
[`control-register.json`](control-register.json) and
[`automation-register.json`](automation-register.json) are the machine-readable
owners. `bun run check:controls` decodes them through Effect Schema and rejects
missing owners, fixtures, costs, metrics, review triggers, retirement data,
loop-state drift, unsafe freshness publication, duplicate boundary identities,
and incomplete feedback promotion.

## Control admission

A retained control names one failure class, invariant, earliest durable owner,
owning commands, positive and negative fixtures, admission evidence,
false-positive and repair cost, carrying cost, review trigger, metrics,
retirement condition, rollback, and non-claim. A repeated review finding moves
to the earliest schema, lint rule, test, generated owner, runbook, or canonical
document capable of preventing it. Weaker repeated instructions are then
retired and leave only a route to that owner.

The register covers Effect diagnostics, boundary provenance, type-aware
lint/format, documentation ownership and freshness, skill/mirror integrity,
workflow authority, critical-journey proof, and dependency/export hygiene.
Passing controls proves their named repository invariants only; it does not
aggregate into provider, deployment, delivery, health, or Production proof.

The skill control also retains requirement-to-proof traceability across PRD
writing, review, implementation, and documentation maintenance. It rejects
removal of direct-observable and plausible-false-green guidance, but it cannot
prove a worker followed the guidance. The implementation's task assertions and
claim-matched evidence remain the behavioral oracle.

## Boundary exception decision

HGI-306 currently measures 17 exact occurrence records. The representation is verbose,
especially for the private Upstash facade, but no smaller candidate has proved
equivalent exact match, duplicate rejection, occurrence isolation, and stale
detection against the real audit. Two former Production CLI response-reader
exceptions were retired after that adapter moved to Effect's scoped process
service. The remaining occurrence registry is retained. Line count is not a
success criterion. The dated decision is
[`HGI-306-boundary-exceptions.decision.json`](../documentation-audit/HGI-306-boundary-exceptions.decision.json).

## Automation states

`admitted` is reserved for settled work with an observable signal, durable
state, exact authority, bounded operation, convergence, proof on every run,
stopping, escalation, rollback, accepted-outcome metrics, and a retirement
condition. `foreground_only`, `disabled_pending_proof`, `retired`, and
`report_only` are distinct states and grant no continuous-operation authority.

The machine register distinguishes admitted read-only CI, the exact-SHA
post-CI Production writer and the bounded Sendblue inbound runtime from
disabled release and Codex-proxy paths, foreground interactive
Claude/provider operations, retired automatic Claude review, report-only
documentation freshness, and report-only Preview infrastructure drift. The
Production writer has one non-cancelling repository queue, two project-scoped
credentials, immutable candidate and stable-target readback, and exact prior
deployment rollback; direct Vercel Git deployment remains disabled. The drift
worker wraps native Alchemy plan/sync observation, fails closed on blocking or
inconclusive classifications, and has no repair edge. This register does not
itself schedule a worker or prove an external capability. GitHub and providers
remain authoritative for current settings, identities, runs, state, cost, and
consequences; HGI-309 owns any separately approved authenticated readback.

The infrastructure drift control is
[`alchemy-infrastructure-drift.control.json`](alchemy-infrastructure-drift.control.json).
It records its signal, durable state, exact read-only authority, convergence,
proof, bounded failure, repair owner, cost, review trigger, stop/rollback,
retirement, and disconfirming evidence against the fixed control-record
contract. The authority audit requires Bun's executable `run --env-file`
argument order and a non-empty receipt readback, so help text with exit zero
cannot count as a drift run. Before receipt creation, the report command emits
only a fixed secret-safe failure phase, including distinct R2 state
configuration and state-client initialisation phases, never an underlying
value or provider payload. A workflow file, green command, run count, or local
fixture cannot promote it beyond `report_only`.

The audit also requires the exact gzip/base64 materialisation step for the
accepted manifest secret. The raw 155-resource JSON exceeds GitHub's secret
size boundary, so the workflow may only expand the in-memory transport into a
mode-`0600` file and then let the report command Schema-decode the original
manifest. A direct copy, changed pipeline, or transport treated as a new
manifest authority fails the control.
The same audit requires the exact accepted manifest digest as non-secret
workflow configuration. Materialised file custody without that binding fails
before provider reads.
The Vercel deployment response boundary decodes non-empty custom target names
but emits observations only for exact Preview, Production, or legacy `null`
Preview targets. A custom target such as `staging` is excluded, not renamed.

## Report-only freshness

The canonical candidate contract is
[`tooling/documentation/freshness-candidate.ts`](../../tooling/documentation/freshness-candidate.ts).
Candidate output lives under `docs/documentation-audit/freshness-candidates/`,
outside default current-owner routing, and cannot be its own source or proposed
owner. The generator cannot review or publish its candidate. Publication
requires a distinct reviewer, approval receipt, publisher identity, immutable
target revision, atomic readback, and last-known-good recovery. Otherwise the
candidate remains report-only, rejected, or quarantined.

HGI-306 promotes this safety rule from repeated field lists into the typed
contract and executable fixtures. The before/after trace is
[`HGI-306-feedback-promotion.json`](../documentation-audit/HGI-306-feedback-promotion.json).

## Verification and maintenance

Run the focused owners first:

```bash
bun run check:controls
bun run test:controls
bun run check:boundaries
bun run check:docs
bun run check:skills
bun run check:authority
bun run check:verification
```

At accepted closeout, run `bun run verification` and `git diff --check`.
Review accepted outcomes and human attention rather than command, finding, or
run volume. Retain failed, rejected, inconclusive, superseded, quarantined, and
retracted evidence outside default context with provenance and recovery.
