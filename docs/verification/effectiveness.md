---
document_type: verification-standard
lifecycle: current
authority: canonical
owner: bundjil-harness-evaluation-owner
last_reviewed: 2026-07-21
review_trigger: evaluation metric, telemetry source, accepted-outcome, intervention, or human-review change
---

# Harness effectiveness

Measure whether the harness produces accepted outcomes with less consequential
error and less synchronous human attention. Do not use run count, command
count, finding count, token count, or worker duration as a success proxy.

## Four separate clocks

Every epoch and scenario keeps these fields distinct:

1. `workerDurationMs`: worker start to terminal worker result when exposed.
2. `feedbackLatencyMs`: candidate availability to first actionable feedback
   when exposed.
3. `synchronousHumanAttentionMs`: time a human is actively required for
   prompting, approval, review, or recovery when measured.
4. `timeToAcceptedOutcomeMs`: candidate availability to accepted disposition
   when measured.

Unavailable telemetry is `null`, never zero, estimated, or copied from another
clock. Parent-observed orchestration time may be retained separately but cannot
be relabelled as worker compute or human attention.

## Outcome and cost record

For each scenario, record the accepted or rejected disposition, failure class,
false positive or false negative if observed, evidence reviewed, correction
required, and limitation. For each intervention, record its expected mechanism,
evidence, carrying cost, review trigger, retirement condition, and a
disconfirming result that would cause revision or removal.

Aggregate comparisons require equivalent target, task, authority, external
state, budget, tools, and instructions. When those conditions differ, describe
the epoch instead of claiming improvement. Small samples qualify only their
recorded cases and do not establish permanent worker quality.

Provider charges, hosted duration, latency, and external consequences require
their own current readback. Repository-local evaluation must leave those values
unknown and make no Production or provider-effectiveness claim.
