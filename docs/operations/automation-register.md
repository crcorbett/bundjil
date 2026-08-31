---
document_type: automation-register
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-31
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
  message, or approval-resume authority. It calls `verification:internal`
  directly and does not receive a Doppler token.
- **Duration and convergence:** one 30-minute run per repository and pull
  request/ref; a newer candidate cancels a stale run.
- **Evidence:** the GitHub check/run identity and bounded repository command
  results. Local parity does not prove the hosted run.
- **Stop, rollback, and escalation:** a failed or unavailable check stops
  acceptance. Revert the workflow change or disable the workflow under separate
  GitHub-setting authority; escalate to the repository owner.

### Production deployment — admitted post-CI automation, callback correction in progress

Automatic exact-main Production and one Terra High turn are accepted for SHA
`402c5c54460361f969f6cd2ba8326b1d3f16c047`. The callback correction described
below still needs a merged automatic run and exact provider readback. The
2026-08-13 stop occurred before any token or partial GitHub custody was created
and is retained in
[`automatic-production-personal-vercel-identity-blocked-2026-08-13.json`](../evidence/verification/packets/automatic-production-personal-vercel-identity-blocked-2026-08-13.json).
Its identity classification is superseded by the 2026-08-20 read-only
`getTeams`/`getProjects` result: the connection exposes only Personal team
`team_1LX7ZujbijowTv8J9k0aU7nD`, with owner membership and both exact Bundjil
projects. The primary contact email does not define Vercel resource scope.
The accepted read-only correction packet is
[`automatic-production-personal-vercel-access-qualified-2026-08-20.json`](../evidence/verification/packets/automatic-production-personal-vercel-access-qualified-2026-08-20.json).
The later 2026-08-21 custody readback proved four replacement one-year,
project-scoped tokens, assigned-project HTTP 200/sibling HTTP 404 tests, four
concealed personal `bundjil` 1Password items with fingerprint prefixes, and
exactly the two refreshed Production GitHub secret names. It did not prove a
deployment; the earlier 90-day result remains in
[`automatic-production-personal-vercel-custody-inconclusive-2026-08-21.json`](../evidence/verification/packets/automatic-production-personal-vercel-custody-inconclusive-2026-08-21.json).
Fresh 2026-08-24 readback also confirmed one expiring read-only Doppler token
for `bundjil/prd`, while the two legacy Vercel secrets and four legacy variables
remained in place. No eligible main-push event had been created at that point,
so no Production run, deployment or public behaviour was proved.
The current branch fetches `bundjil/prd` once, maps four identifiers plus the
two exact project credentials, and keeps the callback alias as a separate
non-secret GitHub variable. That combined custody and automatic callback path
remains unproved until this PR merges and a new exact-main run completes.

- **Signal and target:** only a completed successful `CI` `workflow_run` for a
  same-repository `push` to `main` may start the writer. The exact head SHA is
  checked out and becomes the immutable candidate identity.
- **Principal and operation:** the GitHub `Production` job has repository
  `contents: read` plus one expiring read-only token scoped only to
  `bundjil/prd`. The exact pinned Doppler action fetches once and maps four
  identifiers plus exactly two separately revocable Vercel tokens into the
  deployment step, one token for each exact Bundjil project. Before
  custody, each exact project binding must read its assigned project and receive
  a denied result for the sibling project. Exact project configuration and
  decoded project/SHA readback remain independent controls. The
  repository-owned Effect command stages proxy and agent with domains skipped,
  validates both candidates, re-reads main, promotes proxy then public agent,
  assigns the existing Photon callback alias to that agent, and verifies all
  three targets plus health. The callback hostname is a non-secret Production
  variable and uses the existing agent token. Unexpected teams, account-wide or
  user-scoped credentials, team-wide project listing, and raw workflow mutation
  commands are rejected.
- **Duration and convergence:** one repository-wide queue never cancels an
  in-flight writer and bounds each run to 60 minutes. Provider commands,
  mutation and each restoration have shorter Effect-managed deadlines so
  rollback time is retained. The seven workflow step deadlines total 59
  minutes, and the Effect deployment command has its own 45-minute step.
  Already-current and stale candidates are explicit no-ops only when the
  callback also matches. A stale callback with current public apps is
  reconciled alone. A partial failure restores the exact prior callback, agent
  and proxy identities in reverse order as applicable and verifies the
  restored targets.
- **Evidence and non-claim:** source/CI/Production run, immutable candidates,
  project/source/readiness, stable target, health and rollback identities are
  separate receipt fields. Source and local fixtures do not prove GitHub
  custody, hosted execution, Vercel mutation, model behaviour or channel proof.
- **Stop, rollback, and escalation:** stop on any eligibility, target, SHA,
  readiness, credential, output, alias, health, leak or timeout mismatch.
  Restore exact prior deployments; control rollback disables the workflow and
  revokes the two tokens without enabling Vercel Git deployment.

### Preview infrastructure drift — report-only automation

The earlier missing-custody run remains retained history. On 2026-08-24, a
one-time protected run copied the three existing GitHub values into
`bundjil/stg` without printing them or deleting the originals. Name-only
readback then proved the three expected Doppler keys, and hosted custody moved
to one expiring read-only token for that config while the legacy copies were
retained. Later runs proved the pinned fetch and fail-closed provider path.
CI run `33353598799` passed exact PR head
`a28ed2b919f821dc8adb7ea634cf2b12fc395344`. Preview run `33353598789`
fetched the refreshed manifest, produced 155 desired no-ops and zero provider
writes, and safely remained inconclusive only on the provider-revision-only
identity.
The report-only source remains admitted. The exact Preview Photon credential,
R2 state access, distinct project-scoped drift tokens, static authority and
the accepted manifest are carried as exactly three Doppler outputs. Two
matching exact-project inventories produced digest
`64ec77630806b6f61dba689c25c5068b8b0254f5a4062854c320f4f4b2e81813`
with zero provider writes. Predecessor manifest
`f0a02c0f1bae439ae1a5019c9a7a2f8c71d58f945a508c25ab391b0686c273c3`
refreshes only the approved eight identities and preserves their write-only
value non-claims. A fresh exact-head inventory matched the same inventory
digest. Timestamp-only candidate
`2f3118ce3193ff12ec14a2d4041ec2aaf305453762643f4ab5fa3df92aa28e0f`
received exact Doppler readback but was superseded before push because its
identity omitted other admitted metadata. Version 3 candidate
`bb731f680e64422d198ed6fa88997a23dbf4f99f55ba743d36d10c954dff76f5`
binds the full sorted admitted metadata plus provider timestamps. It passed a
clean local report with 155 desired no-ops, zero blocking, zero inconclusive and
zero writes. Exact `bundjil/stg` readback matched its bytes, digest, 155
resources and eight timestamps. The separate foreground state-only operation
applied seven state metadata updates and then reached 155 no-ops; it was not
this report-only automation. CI run `33357705409` and Preview run `33357705406`
passed exact head `edc5e9d0269dea81d39eb38b734a5b233884cd2e`. The hosted
Preview receipt matched the local 63 accepted, 92 report-only, zero blocking,
zero inconclusive, 155-no-op and zero-write result.

CI run `32455191281` passed exact successor SHA
`f5c707c4da8065993e6886130f887a774ff71520`. Same-source drift run
`32455191367` completed all provider reads and recorded zero writes, zero
blocking rows, eight inconclusive write-only rows and 38 report rows. Aggregate
secret-negative follow-up found the eight rows live, four per project, with
changed provider revisions; five also changed type and two also changed
sensitivity. No previous value or immutable value revision is available from
the admitted provider read. The workflow therefore remains failed closed and
cannot trigger a main merge or automatic Production.

- **Signal and target:** same-repository pull requests for `main`, one weekly
  schedule, or manual dispatch observe only
  `alchemy:BundjilInfrastructure:preview` for the exact checked-out source SHA.
- **Principal and authority:** `contents: read` plus one protected
  `infrastructure-read-only-preview` environment. It exposes only one expiring
  read-only token scoped to `bundjil/stg`. The exact pinned Doppler action
  fetches once and maps three named values into the custody step: the static
  fixed policy envelope, provider/state environment, and accepted compressed
  manifest. The environment artifact holds a distinct Schema-decoded
  set of unique project-ID/token bindings, one separately revocable
  project-scoped Vercel token per manifest project. The Layer rejects team-wide
  project resolution, and Production or broad inventory credentials are not
  reused. Token scope and decoded project binding must agree; request routing is
  not a substitute for that scope.
  Marketplace proof uses the exact project's environment attachment hint. The
  denied account-wide storage list is outside this principal, and the accepted
  manifest database ID is retained identity rather than current readback.
  Vercel personal tokens are not method-level read-only, so exact project
  scope, sibling denial, independent
  revocation, the read-only call graph and zero-write receipt are mandatory
  controls. The policy envelope is fingerprinted custody, not a dynamic run
  identity. The workflow derives a branded exact
  repository/run/attempt identity and checked-out source SHA from GitHub, and
  the command carries those values plus the fixed decoded manifest digest
  through its report and receipt. The job has no OIDC, apply, reconcile, repair,
  deployment, promotion, Production, Photon mutation, billing, or admitted
  provider-write operation.
- **Duration and convergence:** one 20-minute run per repository and pull
  request/ref; a newer candidate cancels a stale run. Native desired plan and
  native `sync --dry-run` remain distinct sources. Blocking drift fails.
  Unavailable, ambiguous and skipped reads remain inconclusive. An unknown
  write-only secret baseline is accepted when native sync is unchanged with
  present provider revision metadata. A drifted row may also be accepted only
  when the desired plan remains no-op and the accepted manifest binds the exact
  current provider update timestamp from its matching two-read inventory. A
  missing or different admitted timestamp remains inconclusive. Neither case
  proves the value.
- **Evidence:** one mode-`0600` specialized classified report and one
  fixed-contract bounded receipt bound to the repository/run/attempt, source
  SHA, static authority fingerprint, and manifest digest. The always-run log
  readback may expose only grouped non-accepted resource kind, category,
  disposition and count plus the bounded receipt; it does not print resource
  fingerprints or provider values. Source review and a local run prove neither
  current GitHub settings/secrets nor hosted execution/provider actuality.
  Read-only Photon project metadata changes remain visible as non-repair
  reports. Returned Vercel deployment observations must match all current typed
  fields. Accepted historical deployment identities absent from Vercel's
  current list are reported as unavailable history, not drift, no-op, deletion,
  retention, or repair authority.
- **Stop, rollback, and escalation:** stage/identity/authority drift, any write
  path, malformed output, blocking drift, or inconclusive readback stops the
  run. Disable the workflow or revoke its read-only environment under separate
  GitHub-setting authority; no provider rollback exists because provider writes
  are fixed at zero. Escalate a classified provider finding to its owner.

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

### Other provider operations — foreground or disabled

Direct Vercel Git deployment remains disabled; the post-CI workflow above is
the sole admitted automatic deployment/promotion writer. Sendblue outbound
work, Executor reads/resumes and bounded AI Gateway/Eve proof turns remain
foreground operations with exact target-owned runbooks, authority, proof,
stopping and recovery. None is admitted as scheduled continuous automation,
and unavailable external readback stays inconclusive.

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

The Doppler fetch action is fixed at
`451892f16195f9ac360e1a5bcbf0b5fd0e957534` (`v2.0.0`) and is admitted only in
the Preview drift and Production workflows. It may not inject the whole config
into the job environment; each consumer step maps its exact named outputs.

Unknown, floating, short, mismatched, or unregistered actions fail closed.
Rollback restores the prior lock and workflow pins together. Compromise or
upstream deletion stops the affected workflow and escalates to the repository
owner; it does not justify substituting an unreviewed fork or tag.

The 2026-08-13 action-runtime review moved the admitted workflows from the
Node-20-based checkout/setup-node v4 pins to exact `actions/checkout@v7.0.1`
and `actions/setup-node@v7.0.0` commits. Both reviewed upstream `action.yml`
files declare `node24`. The public tag and manifest readback proves only the
resolved source and declared action runtime; the next hosted run remains the
execution proof.

## External settings and HGI-309

HGI-309 must use authenticated, metadata-only GitHub readback to prove or
reverse Actions enablement, default permissions, exact workflow identity,
environment/rule settings, the release epoch variable, token/OIDC claims,
secret binding metadata, run identity, and any resulting comment or pull
request. No value read, setting change, workflow dispatch, comment, release,
or provider mutation is authorized by this register.
