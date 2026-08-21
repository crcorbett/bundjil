---
document_type: automation-register
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-13
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

### Production deployment — admitted post-CI automation, hosted proof deferred

The source control is admitted, but its hosted proof is still deferred. The
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

- **Signal and target:** only a completed successful `CI` `workflow_run` for a
  same-repository `push` to `main` may start the writer. The exact head SHA is
  checked out and becomes the immutable candidate identity.
- **Principal and operation:** the GitHub `Production` job has repository
  `contents: read` plus exactly two separately revocable Vercel tokens
  project-scoped to the exact Personal projects, one bound to each exact
  Bundjil project. Before
  custody, each binding must read back the expected team and project. Exact
  project configuration and decoded project/SHA readback remain independent
  controls; each token must be project-scoped and pass sibling denial before
  custody. The
  repository-owned Effect command stages proxy and agent with domains skipped,
  validates both candidates, re-reads main, promotes proxy then agent, and
  verifies stable targets and health. Unexpected teams, account-wide or
  user-scoped credentials, team-wide project listing, and raw workflow mutation
  commands are rejected.
- **Duration and convergence:** one repository-wide queue never cancels an
  in-flight writer and bounds each run to 30 minutes. Already-current and stale
  candidates are explicit no-ops. A partial failure restores the exact prior
  agent then proxy identities as applicable and verifies the restored targets.
- **Evidence and non-claim:** source/CI/Production run, immutable candidates,
  project/source/readiness, stable target, health and rollback identities are
  separate receipt fields. Source and local fixtures do not prove GitHub
  custody, hosted execution, Vercel mutation, model behaviour or channel proof.
- **Stop, rollback, and escalation:** stop on any eligibility, target, SHA,
  readiness, credential, output, alias, health, leak or timeout mismatch.
  Restore exact prior deployments; control rollback disables the workflow and
  revokes the two tokens without enabling Vercel Git deployment.

### Preview infrastructure drift — report-only automation

The report-only source remains admitted. The exact Preview Photon credential,
R2 state access, distinct project-scoped drift tokens, static authority and
155-resource manifest are now installed as exactly the three environment
artifacts. Manual run `32440487569` checked out
`c154d725372617c699538629712569518ee18099` and finished green, but it did not
run drift: `bun --env-file … run …` printed help and exited zero, and the
workflow had no receipt readback. This is a rejected false green. The corrected
workflow places Bun's `run` argument before `--env-file`, requires a non-empty
receipt and prints the Schema-valid sanitised receipt. The authority audit
rejects both the bad argument order and missing receipt check. A corrected
hosted receipt remains required before acceptance. Pull-request run
`32441621932` on `1d1c47dd7422a125db8dda50509f6fd6f3169bb5` executed the
corrected command but failed before writing a receipt. The next source maps
every pre-receipt error to a fixed secret-safe phase so follow-up can target the
failed boundary without printing values or provider payloads. Diagnostic run
`32442223436` on `707aad58ceedeff1662f46d949326d5821449de0` reported
`runtimeInitializationFailed`. After the eight-line custody artifact passed its
R2, Preview Photon and exact-project Vercel Config Schemas and replaced only
the GitHub environment secret, run `32443491605` still reported
`stateConfigurationInvalid`. That source also mapped state-client
initialisation to the config label; its successor gives those typed boundaries
separate fixed outcomes.

The next custody readback proved that `gh secret set --body -` had stored a
literal hyphen instead of stdin. The two Production tokens and drift
environment were replaced with the correct stdin form. Run `32444546031` then
passed R2 state and stopped safely at `authorityArtifactInvalid`; the authority
replacement succeeded. GitHub rejected the raw 155-resource manifest with
HTTP 422 because it exceeds the environment-secret size boundary. The
successor workflow materialises the same Schema-encoded manifest from an exact
in-memory gzip/base64 transport into mode-`0600` custody, and the authority
audit rejects a changed or missing materialisation pipeline. A successful
hosted receipt is still required. The 7,516-byte transport was installed at
`2026-08-21T04:07:06Z` after an in-memory round trip retained the 87,930-byte
manifest's stage, digest and all 155 resources; GitHub readback exposed only
the secret name and update time.

- **Signal and target:** same-repository pull requests for `main`, one weekly
  schedule, or manual dispatch observe only
  `alchemy:BundjilInfrastructure:preview` for the exact checked-out source SHA.
- **Principal and authority:** `contents: read` plus one protected
  `infrastructure-read-only-preview` environment. Its three secret artifacts
  contain the static fixed policy envelope, provider/state environment, and
  accepted manifest. The environment artifact holds a distinct Schema-decoded
  set of unique project-ID/token bindings, one separately revocable Vercel
  project-scoped token per manifest project; the Layer
  rejects team-wide project resolution and Production or broad inventory
  credentials are not reused. The provider token scope and decoded project
  binding must agree; request routing is not a substitute for that scope.
  Vercel personal tokens are not
  method-level read-only, so exact project scope, sibling denial, independent
  revocation, the read-only call graph and zero-write receipt are mandatory
  controls. The policy envelope is fingerprinted custody, not a dynamic run
  identity. The workflow derives a branded exact
  repository/run/attempt identity and checked-out source SHA from GitHub, and
  the command carries those values plus the decoded manifest digest through
  its report and receipt. The job has no OIDC, apply, reconcile, repair,
  deployment, promotion, Production, Photon mutation, billing, or admitted
  provider-write operation.
- **Duration and convergence:** one 20-minute run per repository and pull
  request/ref; a newer candidate cancels a stale run. Native desired plan and
  native `sync --dry-run` remain distinct sources. Blocking drift fails;
  unavailable, ambiguous, skipped, or unknown-secret observations are
  inconclusive.
- **Evidence:** one mode-`0600` specialized classified report and one
  fixed-contract bounded receipt bound to the repository/run/attempt, source
  SHA, static authority fingerprint, and manifest digest. Source review and a local run prove neither
  current GitHub settings/secrets nor hosted execution/provider actuality.
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
