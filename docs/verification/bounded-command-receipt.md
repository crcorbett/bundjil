---
document_type: verification-standard
lifecycle: current
authority: canonical
owner: bundjil-verification-owner
last_reviewed: 2026-07-21
review_trigger: command, proof, output, process-lifecycle, or evidence-retention change
---

# Bounded command receipt

Every verification command or procedure ends with one small receipt, including
failure, blocked, interruption, early pipe close, and rerun avoidance. It must
state:

1. outcome and true process exit code (or `null` when it did not exit);
2. the violated or preserved invariant and exact target;
3. an actionable recovery hint;
4. an addressable sanitised detail path and SHA-256 digest; and
5. the postcondition actually established.

The receipt is not a log stream. Limit each human-facing field to 240
characters. A live command may first write mode-`0600` sanitised detail under
an ignored `tmp/proof/**` path. A retained proof packet promotes only the
minimal sanitised detail needed for its exact claim into `docs/evidence/**`
and replaces the command receipt's path/digest accordingly. Never print or
retain raw secrets, request/message bodies, tokens, user-home paths, or
unlimited stdout/stderr. A missing, corrupt, oversized, digest-mismatched, or
outside-root retained detail artifact makes the packet invalid.

An interrupted command may record `null` when no exit was observed or a
nonzero exit when its wrapper handled the interruption; it must never record
successful exit `0`. A pipe-close follows the same rule and is a distinct
outcome, not success. If output closes after attempt detail is retained, keep
that artifact immutable and write a separate bounded sidecar that identifies
its path and digest. A rerun-avoided receipt identifies the prior retained
detail without replacing it and states why re-execution was unsafe or
unnecessary. Only an actual process exit may populate `exitCode`; status words
never substitute for it.
