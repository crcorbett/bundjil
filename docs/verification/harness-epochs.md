---
document_type: verification-standard
lifecycle: current
authority: canonical
owner: bundjil-harness-evaluation-owner
last_reviewed: 2026-07-21
review_trigger: material worker, model, host, tool, runtime, skill, repository-contract, authority, or scenario change
---

# Harness evaluation epochs

A harness qualification applies only to one identifiable worker and repository
epoch. Start a new epoch when a material model, host, native action interface,
tool, runtime, skill, target revision, context projection, authority envelope,
or evaluation scenario changes. Preserve the prior epoch and its failed or
partial evidence; do not silently rewrite it into current qualification.

## Required identity

An epoch records:

- the model requested and any identity the worker interface cannot expose;
- host and native action interface;
- tool and runtime versions;
- skill paths, digests, and source revisions;
- exact target commit and scenario-manifest digest;
- context-projection revision, authority envelope, budget, and stopping rules;
- per-scenario worker identity, retained report digest, decision, evidence,
  limitations, non-claims, and the four timing clocks;
- impact-ledger identity and retain, revise, or remove decisions.

One evaluator result qualifies only the named scenario, candidate, and epoch.
Worker count, commands run, tokens, findings, and elapsed duration are activity,
not accepted outcomes.

## Scenario and grader discipline

Use fresh context and a bounded repository-local prompt. The worker may inspect
the named current owners but must not receive the parent acceptance answer as
its expected conclusion. Retain the raw report before parent grading. Failed,
partial, unsafe, or contradictory output remains evidence and causes source or
scenario correction; it is not averaged away.

Fresh evaluation never grants provider or mutation authority. An unavailable
external readback stays `inconclusive`; HGI-309 owns any separately approved
provider qualification.

## Requalification and retirement

Review every intervention against its expected mechanism and a disconfirming
result. Retain it only while it prevents the named failure at acceptable cost;
revise it when evidence shows a correctable gap; remove it when it adds no
accepted outcome or a smaller earlier owner replaces it. Re-run only the
scenarios affected by a minor intervention. A material worker or harness epoch
requires a new complete qualification packet.

The current machine-checked packet is routed by the single scenario source at
[`../../tooling/evals/hgi-307/scenarios.json`](../../tooling/evals/hgi-307/scenarios.json),
the accepted epoch record, and the impact ledger. Structured evaluation
evidence remains outside default task context under
`docs/documentation-audit/hgi-307/`.
