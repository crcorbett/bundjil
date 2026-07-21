---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-21T12:22:00Z
artifact_git_identity: c7bed88338e50e5177489fecca8d89968605728e
environment: photon-internal-project-provider-only
review_trigger: do not refresh; create a new dated receipt for a later observation
---

# Photon provider-only proof receipt — 2026-07-21

## Observation

The user authorised all Photon actions against the internal project. From the
isolated worktree on branch `codex/photon-channel-provider-spec`, the operator
ran the target-owned [Photon proof runbook](../runbooks/photon-provider-proof.md)
after focused Photon typecheck, 13 tests, package build, Effect setup,
boundaries, skills, and diff checks passed.

The sanitised command exited `0` and reported:

- management authentication succeeded;
- the baseline contained zero webhooks;
- one reserved proof webhook was created and listed exactly once;
- a non-empty write-only signing secret was decoded into `Redacted` memory and
  was never emitted;
- the Spectrum SDK acquired and `app.stop()` released successfully;
- the exact proof webhook was deleted;
- final readback contained zero webhooks and matched the baseline;
- no stale proof record required recovery;
- no line, billing, message, user, platform, Vercel, DNS, environment,
  deployment, Sendblue, Upstash, Preview-runtime, or Production mutation ran.

Photon provider state at readback time owns this observation. The repository
records only booleans, counts, command exits, authority, limitations, and the
accepted Task 4 runtime Git identity. No project, webhook, Space, message,
phone, identity, secret, URL, content, SDK object, response body, prompt, tool,
or model value was retained.

## Source and proof boundary

Repository code and tests prove the management/probe logic, safe Schemas,
ambiguous-create recovery, exact-resource cleanup, and local runtime contracts.
Official Photon documentation defines the management API and SDK contract.
This dated provider readback proves only that those calls worked for the scoped
internal project at the observation time.

The provider proof command and receipt documentation were still uncommitted
Task 5 work when executed; the runtime Channel/Photon implementation under
test was commit `c7bed88338e50e5177489fecca8d89968605728e`.

After the provider readback, the first full repository gate found one
`consistent-return` lint issue in the new delete operation. That source-only
issue was corrected. The rerun passed Effect setup, boundaries, skills, 24
boundary fixtures, formatting, lint, Knip, eight workspace typechecks, all 232
tests, Photon/agent builds, and diff checks. No second provider action ran.

## Limitations and terminal candidate stop

- No Vercel deployment authority was granted, so no isolated hosted Preview,
  deployment identity, protected URL, environment binding, or runtime log
  exists under this SPEC.
- No live inbound Photon Space or approved synthetic recipient was available,
  so signed provider delivery, cold Space resolution against a real
  conversation, replay claim, Eve turn, outbound acceptance, presence,
  `waitUntil`, retry suppression, and handset behavior remain unproved live.
- The ignored credential source was mode `0644` during the observation. No
  value was emitted or copied, but future runs must stop until the file is
  restricted to owner read/write (`0600`).

Those missing prerequisites are a terminal candidate stop for the hosted
Preview journey. They do not weaken the narrower provider lifecycle result and
do not authorise a later Vercel, message, line, billing, or Production action.

## Recovery

The final provider readback matched the baseline, so no recovery action is
open. If a future run is interrupted, the fixed reserved proof URL is the only
adoptable recovery identity; follow the runbook and delete no unrelated
resource.
