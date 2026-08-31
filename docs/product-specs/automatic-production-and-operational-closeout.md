---
document_type: product-spec
lifecycle: historical
authority: canonical
owner: bundjil-product-owner
implementation_owner: bundjil-security-automation-maintainer
verification_owner: bundjil-verification-owner
last_reviewed: 2026-08-28
review_trigger: main acceptance, CI, GitHub environment, Vercel CLI/API, project, Production alias, model configuration, rollback, Infrastructure Drift, Photon, Sendblue, or channel-proof change
task_ledger: automatic-production-and-operational-closeout.tasks.json
---

# Automatic Production deployment and operational closeout

## Status and accepted outcome

This SPEC is complete. Pull request `#15` merged the callback correction as
exact main SHA `27011deb4593f15f4042ff5cf570ca426da9d299`. Main CI run
`33108401987` passed and automatically started Production run `33108710900`.
That run promoted READY proxy `dpl_2kSZWu464QLcHmh6ZsrMwWaewPA6` and READY
agent `dpl_7ifR1WbvaQRbjuhakfzJL2PBRExp`; independent Personal Vercel readback
matched both stable aliases and the Photon callback to that exact source. The
receipt retained the preceding proxy, agent and callback identities and
reported rollback ready. No manual callback reassignment occurred.

Proxy health reported `live` with `high` reasoning. Protected Eve reported
`bundjil-codex-proxy/gpt-5.6-terra`, context `1050000`, and one bounded turn
reached `message.completed` and `session.waiting` without failure. One bounded
Photon journey and one bounded Sendblue journey each showed delivery, visible
typing and one complete reply. The accepted packet is
[`automatic-production-callback-channels-accepted-2026-08-28.json`](../evidence/verification/packets/automatic-production-callback-channels-accepted-2026-08-28.json).

Two limits remain recorded rather than hidden. Vercel cannot expose the prior
values for eight changed write-only settings, so the zero-write drift report
cannot re-baseline them. Photon exposes no supported candidate-specific replay
check, so strict replay proof remains unavailable. Neither limit blocks the
accepted automatic deployment, Terra High turn, callback movement or bounded
channel results.

The original repository implementation and its shared terminal audit were
complete before live proof reopened the Photon callback correction. The
2026-08-21 continuation now proves custody of four separately revocable,
one-year Personal Vercel project-scoped credentials, the two exact GitHub
Production secrets, and the three exact drift artifacts. Hosted drift run
`32440487569` is rejected as a false green because Bun printed help and exited
zero without running the report command or creating a receipt. The workflow
and authority fixture now require the executable argument order plus receipt
readback. Corrected pull-request run `32441621932` then executed the report but
failed before a receipt existed. The report boundary now emits only a fixed,
secret-safe failure stage before receipt creation so the next run is diagnostic
without disclosing values. Diagnostic run `32442223436` narrowed the stop to
runtime initialisation. The rebuilt eight-line custody artifact then passed its
R2, Preview Photon and exact-project Vercel Config Schemas, but run
`32443491605` exposed that the R2 config label also covered state-client
initialisation. Later readback found that `gh secret set --body -` had stored a
literal hyphen instead of stdin. After the two Production tokens and drift
environment were replaced with the correct form, run `32444546031` moved past
R2 state and stopped at `authorityArtifactInvalid`. The authority replacement
succeeded, but GitHub rejected the raw 155-resource manifest with HTTP 422
because it exceeds the environment-secret size boundary. The successor uses a
gzip/base64 transport only after Schema encoding, materialises the same JSON
inside the runner, and Schema-decodes it again before any provider read. The
7,516-byte transport was installed at `2026-08-21T04:07:06Z` after its
in-memory round trip retained the 87,930-byte manifest's stage, digest and all
155 resources. Pull-request run `32445924126` proved the materialisation but
stopped at `manifestArtifactInvalid` because the workflow omitted the exact
accepted digest required by command configuration. The successor binds digest
`307054bf0a080de4f8bd0fd47c79faac81b8199673dac6abcf01faec6aadad60`; the
authority audit rejects an absent or changed binding.
CI run `32446250097` then passed on exact SHA
`01978dc818adacb75d54042a34c7bf422c571745`. Drift run `32446250037`
reached live provider reads and emitted a Schema-valid inconclusive receipt
with `provider-writes:0`. Its native read failed because Vercel returned the
custom deployment target `staging` and the private transport Schema admitted
only Preview and Production. Both exact project credentials returned HTTP 200
for the same deployment endpoint in secret-negative follow-up. The successor
decodes non-empty provider target names but projects only exact Preview,
Production, or legacy `null` Preview values into Bundjil observations; custom
targets stay excluded.
At that point, automatic deployment and channel proof remained unproved. The
accepted 2026-08-28 result below supersedes that historical limitation.

### Automatic-main diagnostic correction (2026-08-28)

Pull request `#6` merged exact SHA
`276c7fdb665c3aac0cbd8f302ffacbf030317140`. CI run `33082854163` passed
that SHA and automatically started Production run `33083232642`. The
Production job used the same SHA and reached `production:deploy`, but stopped
within that command with the old `{"status":"blocked"}` output. This proves the
CI-to-Production trigger and exact checkout only. It does not prove candidate
creation, alias movement, rollback, health, Terra High or channel behaviour.

The failure output was too narrow to distinguish missing configuration from a
safe deployment operation failure. The command must now emit one
Schema-encoded, secret-negative blocked receipt with a closed category. For an
expected `ProductionDeploymentError`, it may also emit only the existing
operation, project, reason and retry fields. It must not emit a token, command,
URL, provider body, raw error, stack or Cause. Command-level tests must prove
the missing-config output and package tests must prove the deployment receipt
codec. A new automatic run on the merged correction is the only accepted way
to identify the hosted failure and continue the Production proof.

Pull request `#8` merged that correction as
`34c68131eab81e2ae3adaa7e77032e41e4dd5259`. Main CI run `33085234816`
passed, and automatic Production run `33085555416` returned
`deployment/current/proxy/commandFailed/after-readback`. It failed on the first
current-target read before staging or alias movement. The live adapter had
passed the Personal team ID to Vercel CLI `--scope`, which expects a team slug
and performs a team lookup outside a project-scoped token's access.

The required correction is to keep exact project custody without that lookup:
bind the matching token, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` for every
provider command; use project-addressed API paths with the exact `teamId` query
for reads, inspection, promotion, and rollback; and poll the decoded current
target through an Effect Schedule after promotion or rollback. The bounded
poll must accept only the expected deployment ID and source SHA. Hosted proof
still requires a new successful automatic run and direct Vercel readback.

Pull request `#9` merged the project-scoped correction as
`ca9862347c7ddc139a9a3c153b2d068576bdf638`. Main CI run `33087961717`
passed, and automatic Production run `33088341038` then stopped at
`deployment/stage/proxy/commandFailed/after-readback`. Immediate Personal
Vercel readback found no new deployment in either project and confirmed both
stable Production targets remain READY and promoted at source
`6cc0936d502a7b5f0fa32994929fac7f396eb200`.

Each exact project already owns its app subdirectory through Vercel
`rootDirectory`. The staging command also passed that app subdirectory as its
upload root, applying the directory twice. The successor must upload repository
root `.` and rely on the exact project binding to select its app. Focused tests
must reject both app directories in the staging command. Hosted proof still
requires a new successful exact-main run and direct provider readback.

Pull request `#10` merged that repair as
`0fea78f07e8fccd035d0cce10c6eba758cda3651`. Main CI run `33089259199`
passed, and automatic Production run `33089620419` passed on the same SHA.
It promoted proxy deployment `dpl_4dP71otZFpbDhgNGqp4T5grAyFw6` and agent
deployment `dpl_8jwfW45DcEgPDCmTdV1NpvSNkahy`; independent Personal Vercel
readback found both READY, promoted, Production-targeted and bound to that
exact SHA. The previous READY deployments remain the recorded rollback pair.
Stable proxy health returned `200`, `live`, and `high`. Protected Eve info
reported `bundjil-codex-proxy/gpt-5.6-terra` with context `1050000`.

Three bounded protected Eve attempts were accepted while diagnosing the live
turn. Each reached the private proxy, and each proxy request returned `502`;
the fully observed attempt ended with `step.failed`, `turn.failed`, and
`session.waiting` without `message.completed`. Sanitized logs identify the
public failure only as a proxy stream failure. The next repository slice adds
one secret-negative `CodexProxyStreamFailure` log containing only the closed
stream operation. It must not retain the internal message, prompt, answer,
token, profile, raw SSE, request, response, or provider payload. Terra High
completion and both channel proofs remain open until the operation is observed
and the actual fault is repaired or recorded as a bounded limitation.

Pull request `#11` merged the first diagnostic as
`0af295bbaecc7b80c86411b92a5f542c2a51e2b8`. Main CI run `33093327445`
passed and automatic Production run `33093683516` promoted proxy deployment
`dpl_7FEYwYJeqFVHfkG8RnZ13otqRSBq` and agent deployment
`dpl_CqPEyfZCpuUNGuLjxhcv2fzW32KN`, retaining the prior pair for rollback. A
fresh protected turn again reached three proxy `502` responses and ended at
`session.waiting` with `step.failed` and `turn.failed`. No closed diagnostic
appeared because the failure occurred while opening the upstream response,
before the returned body stream existed. The follow-up keeps the body-stream
observer and applies the same secret-negative operation observer to the
pre-stream `CodexResponsesStreamError` handler. Tests must cover both timings.

That observer was merged as `f5ea0218de9199284530abb2a1c6613e59cf7852`.
Main CI run `33095223765` passed and automatic Production run `33095604644`
promoted exact-SHA proxy `dpl_3uRT9npE8Gx75LtdQEvjR45FhMiB` plus agent
`dpl_5wzmujRby12JZJVMBKQ3zuvcB17d`, retaining the prior pair for rollback. A
single fresh turn again produced three proxy `502` responses. All three safe
markers reported `postResponsesStream`: the upstream request returned, but its
successful response was rejected before body ownership because it was not
recognised as SSE. The local OpenAI Codex reference at
`9e552e9d15ba52bed7077d5357f3e18e330f8f38` and the independent OAuth reference
at `bec2ad69b252ef4ad7dd33b9532ff8b4fdb6d016` both send fixed Codex response
headers. Bundjil must explicitly request `text/event-stream` and send the fixed
beta and originator compatibility values before another live turn. The HTTP
client owns these non-secret values; callers cannot supply them.

Pull request `#13` merged those fixed headers as
`0dd591e081389ae366ff37cd5c20bff7c59d762b`. Main CI run `33097033155`
passed and automatic Production run `33097382192` promoted exact-SHA proxy
`dpl_EboDwKRM4q6gJij2roXW2ZeLp4hX` plus agent
`dpl_2dBT4KhjrzuFuoLXu7XJ8otFBGRg`, retaining the preceding pair for rollback.
A fresh bounded turn still reached three proxy `502` responses, with every safe
marker reporting `postResponsesStream`. The checked independent OAuth client
fills in `text/event-stream` only when a successful streaming response omits
`Content-Type`; it preserves an explicit value. Bundjil instead treated a
missing header as non-SSE. The next narrow correction adopts the same absent-only
fallback. Explicit JSON and misleading media types remain rejected before body
ownership.

### Accepted live result and Photon callback correction (2026-08-28)

Pull request `#14` merged the absent-only fallback as
`402c5c54460361f969f6cd2ba8326b1d3f16c047`. Exact-source CI run
`33098864416` passed and automatically started Production run `33099189936`.
That run promoted proxy deployment `dpl_8tiED99yxiLFTEWdu7WmFiFeSvoV` and
agent deployment `dpl_99rA1C88usyXUx2bG2V8s9Tu2Xzx`, retaining the preceding
READY pair for rollback. Protected Eve info reported
`bundjil-codex-proxy/gpt-5.6-terra` with context `1050000`; one bounded private
session then reached `message.completed` and `session.waiting` with no failure
event. Exact proxy readback recorded successful model requests. This accepts
automatic exact-main Production and Terra High for that immutable source.

One bounded Photon journey and one bounded Sendblue journey then reached the
same accepted agent and proxy. Photon accepted one signed webhook, ran the Eve
workflow, accepted typing start and stop operations, accepted one outbound
reply, and produced one visible reply in the established Production
conversation. Sendblue accepted one signed webhook, completed one model call,
reported the outbound reply as delivered, and produced one visible reply in
the established Bundjil conversation. Neither observer caught a handset-visible
typing animation. Photon candidate-specific replay also remains unsupported by
the provider's current read API. Those two facts stay explicit non-claims.

The Photon proof exposed one remaining automatic-deployment defect. Its
Production webhook uses Vercel's automatic agent-project alias, not the public
stable agent alias. The accepted Production workflow moved only the public
stable alias, so the Photon callback alias still resolved to an older READY
deployment until a bounded manual reassignment moved that exact alias to the
accepted agent. Sendblue was unaffected because its webhook uses the public
stable alias.

The completed implementation makes the exact Photon callback alias a
non-secret branded `Config.schema` value owned by the Production deployment
Layer. The deployment service reads the alias through Vercel's alias API,
decode its project and deployment identity, and include the prior callback
target in the bounded receipt. For a new main candidate, promotion order is
proxy, public agent, then Photon callback alias. For an already-current public
pair with a stale callback, the command performs a callback-only reconciliation
after re-reading main. It records rollback eligibility before the possibly
uncertain alias assignment, polls decoded readback until the callback resolves
to the expected agent deployment and source, and probes health before success.
Any later failure, interruption, or defect restores the exact prior callback
target before restoring the public agent and proxy targets. A missing,
cross-project, malformed, redirected, or unconfigured callback alias fails
before staging or mutation.

Every child-process provider command is scoped and bounded by an
Effect-managed two-minute timeout. The mutation phase has a separate eight-minute
deadline, and each callback, agent and proxy restoration has its own
four-minute deadline inside the workflow's 60-minute job limit. Eleven possible
pre-mutation provider commands take at most 22 minutes; mutation and all three
restorations take at most another 20 minutes. This 42-minute bound fits inside
the 45-minute deployment step. A timeout
enters the same typed failure and compensation path. The exact checkout,
identity, Node, Bun, install and deployment step deadlines are respectively 2,
1, 2, 2, 5 and 45 minutes, totalling 57 minutes. The authority audit reads the
parsed workflow structure and rejects any changed or commented-out deadline or
binding, including any Production job limit other than 60 minutes. Compensation must attempt
every eligible restoration even when an earlier restoration fails, read back
every successful restoration, and report rollback failure without claiming
full restoration. Deterministic `TestClock` coverage proves a stalled provider
command, a stalled whole mutation, and a stalled first restoration without
waiting in real time.

The output contract adds required prior and accepted callback deployment IDs.
Historical command log lines are retained as historical evidence and are not
decoded by a current repository consumer; no compatibility decoder is needed.
The current command and all new receipts use the expanded Schema. The alias
hostname is non-secret, but durable proof retains only its approved safe
fingerprint; query strings, webhook secrets, phone identities and message
content remain forbidden.

#### Documentation impact ledger

| Surface                                                            | Decision        | Owner and proof                                                                                                                                                                  |
| ------------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production service, Schemas, Layers and receipt                    | Change required | `@bundjil/infrastructure` owns the branded callback alias, named callback operations, private Vercel transport, live and memory Layers, closed errors and expanded safe receipt. |
| Workflow configuration and mutation order                          | Change required | `.github/workflows/production.yml` supplies the non-secret callback alias and the command moves proxy, public agent, then callback.                                              |
| Deployment procedure, rollback and proof                           | Change required | `apps/agent/runbooks/deploy-promote.md`, automation/authority registers, verification packet and focused tests own readback, callback-first rollback and exact-main proof.       |
| SPEC, task and execution status                                    | Change required | This historical SPEC, its completed task ledger and completed plan own the accepted result, limitations and terminal review.                                                     |
| Proxy runtime and Codex provider boundary                          | Preserve        | The accepted absent-only SSE fallback, fixed headers and Terra High provider behaviour do not change in the callback slice.                                                      |
| App/public HTTP API, package layout, skills and agent instructions | N/A             | The callback remains deployment control inside the existing infrastructure package; no public route, package placement, skill route or agent instruction changes.                |
| Provider state and credentials                                     | Change required | One exact non-secret GitHub Production variable was added and the existing callback alias moved. Exactly two project-scoped Vercel secrets remain.                               |

### Vercel credential boundary correction (2026-08-20)

Neither the saved Executor connection label nor the Vercel account's primary
contact email is enough to classify provider scope. A read-only
`getTeams`/`getProjects` readback through
`tools.vercel_api.user.personalvercelapi` returned exactly one accessible team:
`team_1LX7ZujbijowTv8J9k0aU7nD` (`cooper-corbetts-projects`, `Cooper Corbett's
projects`), with the authenticated user as `OWNER`. The same team owns exact
projects `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN` (`bundjil-agent`) and
`prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB` (`bundjil-codex-proxy`). No second Vercel
team was returned. This connection therefore satisfies the Personal Vercel
access boundary even though `cooper.corbett@tilt.legal` is the account's
primary contact address. Fresh team/project readback, not email-domain
classification, is the pre-mutation identity control.
The dated read-only receipt is
[`automatic-production-personal-vercel-access-qualified-2026-08-20.json`](../evidence/verification/packets/automatic-production-personal-vercel-access-qualified-2026-08-20.json).

The authenticated Vercel dashboard now exposes a project selector for access
tokens after `Cooper Corbett's projects` is selected. That direct UI readback
supersedes the earlier 2026-08-20 REST-catalog conclusion that the ordinary
token-creation contract had no project scope. The REST endpoint remains a
team/user-scoped API surface; it is not evidence that the dashboard flow lacks
project scope. The accepted design therefore uses four separately revocable
dashboard tokens in the admitted Personal Vercel team: one
project-scoped Production token and one project-scoped drift token for each
exact Bundjil project. Every command must decode the branded project ID, select
its matching token binding, and prove that the assigned project reads while
the sibling project is denied before 1Password or GitHub custody. A token
without that exact provider scope, an account-wide token, or a team-scoped
fallback is rejected. This correction preserves the Personal team access
qualification above; it changes the credential-scope conclusion only.

Live readback on 21 August 2026 established a second project-scope boundary.
Both exact tokens can read their project's environment metadata and its
Marketplace `contentHint`, but Vercel returns HTTP 403 for the account-wide
`/v1/storage/stores` list. That list is no longer present in Vercel's current
OpenAPI catalogue. Drift therefore proves the exact project attachment from
the decoded integration, configuration and resource IDs in project metadata;
it does not call the account-wide list. The accepted manifest's external
database ID is retained only after those observable IDs match and is not a
fresh database-ID readback. A successful report must carry this limitation and
must not claim that project-scoped custody can enumerate account storage.

The first continuation used 90-day credentials. Cooper then approved replacing
all four with one-year credentials. The current tokens expire on 21 August
2027; the earlier 18 November 2026 custody packet remains historical evidence
for the replaced values.

An accepted push is a `push` event for `refs/heads/main` whose exact SHA has a
successful `CI` workflow run. A successful pull-request check, local
verification, a Vercel build, or a newer neighbouring main run is not that
acceptance. The exact accepted SHA must be checked out, staged, read back, and
either promoted automatically or left unpromoted with a bounded failure.

The accepted outcome is:

1. direct Vercel Git deployment remains disabled for both projects;
2. a separate GitHub `workflow_run` job reacts only to a successful same-repo
   main-push `CI` run, serializes without cancellation, and uses the protected
   `Production` environment;
3. the job stages the proxy and agent as Production candidates with domain
   assignment skipped, validates both immutable deployments against the exact
   accepted SHA and current target identities, then promotes them;
4. a stale SHA, failed build, malformed provider response, wrong project,
   alias mismatch, failed health/readback, or partial promotion fails closed;
5. any typed failure, interruption, or defect after promotion starts invokes
   the exact recorded rollback identities and proves the restored aliases
   before the job exits unsuccessfully;
6. the Production proxy uses `gpt-5.6-terra`, context window `1050000`, and
   reasoning effort `high`, with stable health and Eve behaviour proved
   separately;
7. the Preview Infrastructure Drift environment has exactly the three required
   secret artifacts and one genuine hosted read-only passing receipt; and
8. one bounded existing-conversation Photon test and one bounded established
   Sendblue test record provider acceptance, Eve completion, dispatch,
   delivery, handset result, and typing visibility as separate claims.

This SPEC does not convert a workflow success, deployment `READY`, provider
acceptance, or historical conversation into a stronger live claim.

## Evidence epoch

| Evidence                      | Current identity                                                                                                                                                                                                                                                                                                                                                                         | Claim limit                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Bundjil source                | Pull request `#15` merged exact main `27011deb4593f15f4042ff5cf570ca426da9d299`.                                                                                                                                                                                                                                                                                                         | Accepted candidate identity only; this prose is not a current-head assertion.                                           |
| Main CI                       | GitHub run `33108401987` passed that exact source and automatically started Production run `33108710900`.                                                                                                                                                                                                                                                                                | Exact accepted run only; it does not promise future execution.                                                          |
| GitHub controls               | Admin principal `crcorbett`; active ruleset `20616946` requires a pull request, strict `verify` status and non-fast-forward updates on the default branch with no bypass; `Production` permits protected branches with no human reviewer or wait; Production has exactly the two named Vercel secrets and `infrastructure-read-only-preview` has exactly the three named drift artifacts | Point-in-time metadata/readback only; source, custody and settings do not prove a future run.                           |
| Drift state credential        | A personal Cloudflare account token is active through `2026-11-11T06:11:42Z`, scoped only to Object Read & Write for `bundjil-alchemy-state`, stored as personal Bundjil 1Password item `dylpugrxetztdr76qruqtxonie`; one S3 list under `bundjil/v1` succeeded; the token value is intentionally redacted                                                                                | Credential and exact-bucket read proof only; it is not GitHub custody, a complete drift environment, or a drift result. |
| Agent Vercel target           | Personal project `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`, team `team_1LX7ZujbijowTv8J9k0aU7nD`; accepted READY Production deployment `dpl_7ifR1WbvaQRbjuhakfzJL2PBRExp` at the accepted source; public and callback aliases matched.                                                                                                                                                          | Point-in-time accepted readback; no mutation authority or future state.                                                 |
| Proxy Vercel target           | Personal project `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`, same team; accepted READY Production deployment `dpl_2kSZWu464QLcHmh6ZsrMwWaewPA6` at the accepted source; the public alias matched.                                                                                                                                                                                                | Point-in-time accepted readback; no mutation authority or future state.                                                 |
| Current proxy health          | Stable `/health` returned `200`, `mode: live`, `reasoningEffort: high`.                                                                                                                                                                                                                                                                                                                  | Proves only the accepted observation window.                                                                            |
| Vercel configuration metadata | Protected Eve reported `bundjil-codex-proxy/gpt-5.6-terra`, context `1050000`, zero diagnostics and one completed bounded turn.                                                                                                                                                                                                                                                          | Point-in-time Terra High proof only; it does not promise future model access or output.                                 |
| Provider topology             | both Vercel projects are Personal-owned and have no current Git repository connection; repository `vercel.json` files disable Git deployment                                                                                                                                                                                                                                             | Desired/source and provider-link observation only.                                                                      |
| GitHub action runtimes        | Hosted PR `#5` CI run `31617632184` passed at exact source `5a28c3bddfc6f1bdf21c82fca3aa90e1ec5458dc` with the reviewed checkout `v7.0.1` and setup-node `v7.0.0` commits; check `94184307855` returned zero annotations.                                                                                                                                                                | Exact candidate action execution only; it does not prove later runs or upstream safety.                                 |

`observedAt` timestamps and sanitized fingerprints belong in the active plan and
dated proof packet. Secret values, message content, phone identities, OAuth
artifacts, provider DTOs, raw logs, and protected URLs never enter repository
evidence.

## Decision and alternatives

### Accepted: post-CI GitHub deployment and promotion

Add `.github/workflows/production.yml` with `workflow_run` on completed `CI`.
The job runs only when all of these are true:

- repository is exactly `crcorbett/bundjil`;
- the triggering workflow conclusion is `success`;
- its event is `push`;
- its head branch is `main`;
- its head repository is the same repository; and
- the checked-out commit equals the workflow-run head SHA.

The workflow has root `contents: read`, a bounded timeout, one repository-wide
Production concurrency group with `cancel-in-progress: false`, checkout
credentials disabled, exact pinned actions, and the `Production` environment.
It uses two separately revocable Vercel tokens, each provider-scoped to its
exact Personal project. One secret binding is selected for the exact agent
project and one for the exact proxy project. Before either credential enters
1Password or GitHub, read back the authenticated team and prove the assigned
project succeeds while the sibling project is denied; verify that the token
fingerprint, secret name, project ID and team ID agree. The workflow retains
exact team/project configuration, project-bound secret names, decoded provider
readback and fail-closed project/SHA checks as independent controls. An
account-wide, user-scoped, team-scoped or otherwise unscoped token is not an
accepted fallback.

All workflow actions remain exact-commit pinned and lock-owned. The corrective
candidate replaces only `actions/checkout` and `actions/setup-node` with the
reviewed Node-24 `v7.0.1` and `v7.0.0` commits after hosted CI surfaced the
Node-20 action-runtime deprecation. Triggers, permissions, environments,
credentials, operations and target gates remain unchanged; hosted execution
run `31617632184` proves the exact replacement candidate without the former
Node-20 runtime annotation.

The repository-owned Effect command is the sole deployment adapter. It uses
Schema-derived SHA, team, project, deployment, URL, alias, state, and bounded
receipt contracts; `Config.schema` with redacted tokens; named service
operations; immediate CLI/API output decoding; safe tagged errors; explicit
live and memory Layers; a scoped Effect `ChildProcessSpawner`; flat sequential
Effects; and one Bun application-boundary runtime execution. The application
root supplies `BunServices.layer`. Raw CLI output, token values, provider DTOs,
platform failures, and process handles remain private to the live Layer; raw
Promises and ambient environment reads are not part of the package boundary.

### Rejected: direct Vercel Git auto-deploy

Direct auto-deploy moves the Production alias as soon as Vercel accepts the Git
event. It cannot prove Bundjil's repository verification completed first and
recreates the previously observed unsafe ordering. Both app configs keep
`git.deploymentEnabled: false`, Vercel Git remains disconnected, and tests plus
provider readback must reject drift.

### Rejected for this slice: merge queue as the deployment gate

A merge queue can bind required checks to a synthetic merge-group SHA, but it
adds queue policy, merge-group workflow coverage, and another external setting
without removing the need to verify and deploy the resulting exact main SHA.
The repository currently has no branch protection or queue. The accepted
workflow protects the Production boundary for direct accepted pushes and
merges alike. A minimal main ruleset requiring pull requests and the existing
CI check may be installed as a repository control, but the Production job must
remain correct if an authorised administrator creates a direct main push.

### Rejected: promotion inside the CI verification job

The current CI control is deliberately secret-free and cancellable. Giving the
same job Production secrets would mix read-only candidate proof with a
non-cancellable writer and make stale-run cancellation unsafe after a partial
promotion. The separate workflow preserves independent identities and
concurrency semantics.

## Production call graphs

```text
main push SHA
  -> GitHub CI workflow
     -> build
     -> bun run verification
  -> successful workflow_run event for the same push SHA
     -> Production environment
     -> @bundjil/infrastructure automatic-production command
        -> ProductionDeployments service
        -> ProductionDeploymentsLive
           -> scoped Effect ChildProcessSpawner
           -> project-bound Vercel CLI/API boundary
           -> stage proxy --prod --skip-domain
           -> stage agent --prod --skip-domain
           -> decode immutable deployment readback
           -> verify current refs/heads/main freshness
           -> promote proxy, then agent
           -> assign the exact Photon callback alias to the accepted agent
           -> cohesive Ref marks rollback eligibility before each mutation
           -> public aliases, callback alias and health readback
           -> Schema-encoded bounded receipt
        -> makeProductionDeploymentsMemory for deterministic tests
        -> on any non-success Effect Exit after promotion starts
           -> restore the recorded prior callback target when eligible
           -> rollback recorded prior agent and proxy deployment(s)
           -> callback and public alias restoration readback
           -> preserve the original unsuccessful exit unless rollback fails
```

```text
Tests
  -> automatic-production orchestration
  -> makeProductionDeploymentsMemory
  -> candidate-ready, stale-main, malformed-output, wrong-project,
     stale-callback reconciliation, partial-promotion, callback assignment,
     after-write interruption/defect, rollback-success, rollback-failure and
     no-op fixtures
```

```text
Channel proof
  -> target-owned Photon or Sendblue runbook
  -> exact established Personal conversation selected without typing an address
  -> stable Production agent webhook
  -> replay/continuity -> Eve -> Terra/high proxy
  -> provider typing/send result
  -> provider delivery readback
  -> direct handset observation where available
```

## Requirements and acceptance checks

### Automatic deployment control

- `production.yml` must not run from pull requests, forks, failed/cancelled CI,
  another workflow, another branch, or another repository.
- The writer must never cancel in flight. A newly queued run waits. Immediately
  before promotion, it re-reads current `refs/heads/main`; a superseded
  candidate remains unpromoted and exits as an explicit stale no-op.
- Staging uses `--prod --skip-domain`; no stable alias moves until both
  candidates are `READY`, Production-targeted, exact-project, and exact-SHA.
- A rerun for the already-current exact SHA is idempotent and performs no
  deployment, promotion or callback assignment only when both public targets
  and the Photon callback already resolve to that SHA.
- The exact Photon callback alias is a branded, non-secret `Config.schema`
  value. The live Layer reads it through the project-bound Vercel alias API,
  immediately decodes alias/project/deployment output, and then inspects the
  referenced immutable deployment before domain code receives it. The service
  exposes only named `currentAgentCallback` and `assignAgentCallback`
  operations; raw alias clients, URLs and provider DTOs remain private.
- Promotion is proxy first, public agent second, Photon callback third. One
  cohesive operation-local `Ref` records proxy, agent and callback rollback
  eligibility immediately before each potentially outcome-uncertain provider
  call. Any later non-success Effect `Exit` restores the eligible exact prior
  callback target, then agent and proxy when eligible. The exit-aware rollback
  finalizer is uninterruptible, reads one eligibility snapshot, and verifies
  restoration before preserving the original failure, interruption, or defect.
- When both public targets already match main but the callback is stale, the
  command re-reads main and performs only a callback reconciliation. It does
  not rebuild or move either public target.
- Success requires both public targets and the callback target to read back the
  exact candidate IDs and source SHA. Immutable readiness, public alias
  resolution and callback alias resolution are separate assertions.
- The command emits only a bounded Schema-encoded receipt. It must not print
  tokens, environment values, raw provider responses, protected URLs, message
  content, request bodies, profiles, ciphertext, OAuth material, or raw errors.

Focused acceptance:

```bash
bun run --filter @bundjil/infrastructure check-types
bun run --filter @bundjil/infrastructure test
bun run check:authority
bun run check:controls
bun run check:verification
bun run check:docs
bun run check:skills
```

Hosted acceptance requires the merged exact main SHA's CI run, Production run,
two staged deployment IDs, both public target readbacks, the Photon callback
target readback, stable proxy health, protected Eve model behaviour, all three
rollback identities, and zero manual promotion or callback reassignment.

### Credential and environment custody

- Create four separate one-year Vercel dashboard tokens in Personal team
  `team_1LX7ZujbijowTv8J9k0aU7nD`: the two named Production tokens and the two
  named drift tokens, with each token scoped to exactly one of
  `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN` or
  `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`. Before custody, prove each token reads
  its assigned project and is denied for the sibling project. Store each value
  immediately in the personal `bundjil` 1Password vault with its token name,
  ID or fingerprint, project ID, expiry, purpose and revocation owner. Store
  only the two Production values as the matching GitHub `Production` secrets.
- GitHub receives only token ciphertext. Local creation material uses a
  mode-`0600` temporary directory, is never printed, and is deleted after
  secret metadata readback.
- Record token IDs or sanitized fingerprints and revocation owners, never token
  values. Rollback can revoke any token independently and disable the
  workflow/environment without altering Vercel runtime variables.
- Keep the Production environment free of unrelated secrets. Exact secret and
  variable names must be asserted by the authority control.

### Infrastructure Drift closure

- Populate `infrastructure-read-only-preview` with exactly:
  `BUNDJIL_INFRASTRUCTURE_DRIFT_AUTHORITY_JSON`,
  `BUNDJIL_INFRASTRUCTURE_DRIFT_ENV_FILE`, and
  `BUNDJIL_INFRASTRUCTURE_DRIFT_MANIFEST_JSON`.
- The authority artifact must validate against the fixed harness envelope and
  drift authority policy. It is static protected-environment policy custody,
  not a one-run identity. The workflow must derive and Schema-decode the exact
  GitHub repository/run/attempt identity and source SHA for every execution.
  The manifest must be the current accepted Preview adoption manifest. The
  command must carry its decoded digest, the dynamic run identity, and the
  source SHA through the report and bounded receipt. The dotenv artifact must
  contain only the state, Photon, and Vercel bindings needed by the report
  command. Vercel custody is a Schema-decoded non-empty array of unique exact
  project-ID/token bindings under
  `BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON`; each token must be
  project-scoped to one exact manifest project ID, separately revocable, and
  proven to deny the sibling project before custody. Before custody, read back
  the expected team and project for every binding. The drift Layer rejects team-wide
  project resolution and the Alchemy project provider observes manifest
  project IDs directly rather than listing all team projects. Do not reuse
  either Production deployment token or the broad inventory/adoption token.
  Vercel tokens are not method-level read-only credentials, so exact project
  scope, independent revocation, the read-only call graph, and the zero-write
  receipt remain separate controls. The call graph reads project environment
  Marketplace hints only; it cannot call the account-wide storage list. The
  external database ID retained in the accepted manifest is not a current
  provider readback.
- Dispatch one `Infrastructure Drift` run for the exact source that owns the
  workflow. Acceptance requires the hosted job to pass, its source SHA to
  match, the receipt to report zero provider writes, and every required
  project-scoped provider read to complete without a blocking or inconclusive
  result. A historical deployment absent from Vercel's current list is an
  accepted report limitation, not an available read or no-op claim. An
  `ObservedUnknown` environment baseline is accepted only when native sync is
  unchanged, provider revision metadata is present and unchanged, and the
  accepted manifest records the same baseline. A missing secret, blocking
  desired change, unaccepted unknown revision, skipped read, or provider
  unavailability is not a pass.

### Terra High Production correction

- Set agent Production `BUNDJIL_CODEX_PROXY_MODEL=gpt-5.6-terra` and
  `BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=1050000` as encrypted semantic
  configuration.
- Set proxy Production
  `BUNDJIL_CODEX_PROXY_REASONING_EFFORT=high` as encrypted semantic
  configuration.
- Redeploy only through the accepted automatic main path. No manual candidate
  promotion may be used as substitute proof.
- Stable proxy `/health` must report `mode: live` and
  `reasoningEffort: high`. A bounded protected Eve journey must report Terra and
  context `1050000`, complete one turn, and correlate one proxy completion.
  Health, configuration, Eve completion, and provider/model behaviour remain
  separate receipt claims.

### Channel proof

- Reauthenticate Photon only in the Personal scope, then take a fresh
  inventory before any message. Stop on Tilt scope, session ambiguity,
  conversation ambiguity, or an unproved established conversation.
- Use Computer Use to select the established conversation by visible history;
  never infer, retain, or type a phone number. Send one deliberately
  long-response test and observe typing start/stop directly if the handset UI
  exposes it.
- Run one deliberately long Sendblue response in the established Bundjil
  conversation and directly observe typing start and stop if possible.
- For each provider record separately: inbound/provider acceptance, Eve
  acceptance/completion, proxy completion, outbound dispatch, provider
  acceptance, provider delivery state, handset message result, typing-start
  acceptance, typing-stop acceptance, and handset-visible animation.
- If Photon exposes no supported candidate-specific replay oracle after fresh
  inventory, preserve the limitation and the existing atomic replay,
  continuity, no-blind-retry, single-message and provider-readback controls.
  Do not add a custom content/log/time-window oracle and do not block unrelated
  accepted work.

## Rollback and recovery

The automatic job records the exact prior Production deployment for each
project and the exact prior Photon callback target before staging. Runtime
rollback restores the callback first, then the public agent and proxy in
reverse mutation order, but only for operations that became rollback-eligible.
Eligibility is conservative because it is recorded before a provider call
whose write outcome could become uncertain. A callback-only reconciliation
restores only the callback. Every rollback must read back the alias, deployment
readiness, project and source identity. Do not roll back the newest fenced
Codex profile generation or unrelated provider state.

Control rollback disables `.github/workflows/production.yml`, revokes the
project-scoped Vercel tokens, and reads back the GitHub environment. It
does not re-enable direct Vercel Git deployment. Infrastructure Drift rollback deletes
the three environment secrets and disables the workflow/environment; provider
rollback is not applicable because the report has zero writes.

Channel messages cannot be unsent. On an uncertain send, stop; do not retry.
Revoke a temporary OAuth/session grant after the proof window where the target
owner supports it. Provider callbacks, credentials, replay state, and stable
deployments remain unchanged unless a separately accepted rollback requires a
specific mutation.

## Evidence and non-claims

The active plan records exact SHA, actor, authority, timestamps, run IDs,
deployment and rollback IDs, sanitized secret/token metadata, environment and
project identities, expected and observed postconditions, limitations,
non-claims, and evidence paths. Dated accepted proof belongs under
`docs/verification/**` or `docs/evidence/verification/**`; the SPEC and runbooks
must not become provider-state snapshots.

No repository check proves GitHub settings, secret availability, hosted
execution, Vercel deployment, stable alias, model behaviour, provider delivery,
handset display, typing animation, or strict replay. No provider response grants
authority. A missing live oracle is recorded as inconclusive or a non-claim,
never promoted to success.

## Historical 2026-08-13 disposition and 2026-08-20 correction

At that point, repository implementation was complete, but the three serial
hosted tasks were deferred rather than accepted. On 2026-08-13, work stopped before mutation
because the connection's primary contact email was treated as proof of Tilt
scope. That was too strict: an email address identifies a user contact, not the
Vercel teams and projects available to the connection.

The blocked packet at
[`automatic-production-personal-vercel-identity-blocked-2026-08-13.json`](../evidence/verification/packets/automatic-production-personal-vercel-identity-blocked-2026-08-13.json)
still owns the attempted work, unchanged postconditions, rollback and
non-claims for that date. Its identity-classification conclusion is superseded
by the 2026-08-20 readback, which returned only Personal team
`team_1LX7ZujbijowTv8J9k0aU7nD`, authenticated owner access, and the exact two
Bundjil projects. `configure-hosted-controls-and-drift`,
`correct-terra-high-and-prove-automatic-main`, and
`close-channel-proof-gaps` were recorded as terminally deferred for that
implementation epoch. The accepted 2026-08-28 result and current task ledger
supersede that historical status. The old disposition does not convert any
absent hosted result into acceptance.

The operational chain may resume through the authenticated dashboard after a
fresh readback confirms the same sole team, owner role, and exact Bundjil
project IDs. The dashboard observation is a read-only scope correction: it
showed the exact Bundjil project choices, but created no token and proves no
custody, denial test, GitHub setting, deployment or drift run. A successor
epoch must create the four named separately revocable project-scoped
credentials, prove assigned-project success and sibling-project denial, store
metadata and values in the personal `bundjil` 1Password vault, install the
complete custody package, and gather new hosted evidence. Existing repository
checks and the personal Cloudflare credential are not substitutes.

## 2026-08-21 custody continuation and hosted false-green correction

The successor continuation replaced the earlier four-token custody slice under
the exact Personal team. The four one-year dashboard credentials expire on
2027-08-21 and are named `bundjil-production-agent-2026-08-21`,
`bundjil-production-proxy-2026-08-21`, `bundjil-drift-agent-2026-08-21`, and
`bundjil-drift-proxy-2026-08-21`. Each token was tested before custody: its
assigned project returned HTTP 200 and the sibling project returned HTTP 404.
The values were then stored as concealed fields in the personal `bundjil`
1Password vault with the exact project, team, expiry, purpose and revocation
owner. Each item stores a SHA-256 fingerprint prefix; the dashboard exposed no
provider token ID.

The two Production values are now held by the exact GitHub `Production`
environment under `BUNDJIL_PRODUCTION_AGENT_VERCEL_TOKEN` and
`BUNDJIL_PRODUCTION_PROXY_VERCEL_TOKEN`. Metadata-only readback confirms the
four existing Production variables, ruleset `20616946`, and protected-branch
environment `18184147018`; no human reviewer or wait timer was added.

The exact Preview Photon credential is now present in the personal `bundjil`
vault. The static authority, 155-resource Preview manifest at digest
`307054bf0a080de4f8bd0fd47c79faac81b8199673dac6abcf01faec6aadad60`, and
Schema-decoded provider/state environment were installed as exactly the three
required `infrastructure-read-only-preview` secrets. No secret value entered
repository evidence.

Manual drift run `32440487569` checked out
`c154d725372617c699538629712569518ee18099` and finished green, but its log
contains Bun help instead of a drift summary. The workflow passed
`--env-file` before `run`; Bun exits zero in that form without selecting the
script. No report or receipt readback followed, so the run proves only hosted
custody and the false-green defect. The workflow now uses `bun run --env-file`
and an always-run receipt readback that fails when the receipt is absent. The
authority audit has independent negative fixtures for both the bad argument
order and missing receipt check. A corrected hosted run is still required
before accepting drift. The rejected run is retained in
[`automatic-production-personal-vercel-drift-false-green-2026-08-21.json`](../evidence/verification/packets/automatic-production-personal-vercel-drift-false-green-2026-08-21.json).

Follow-up custody review found a second false assumption: `gh secret set
--body -` stores a literal hyphen; stdin is used only when `--body` is omitted.
The two Production tokens and the drift environment were replaced with the
correct stdin form. Run `32444546031` then passed R2 state initialisation and
stopped safely at `authorityArtifactInvalid`. The authority replacement
succeeded. GitHub rejected the raw accepted manifest with HTTP 422 because the
155-resource JSON exceeds its environment-secret size boundary. The successor
workflow requires an in-memory gzip/base64 transport produced only after the
owning `AdoptionManifestJson` Schema encodes the accepted manifest. It expands
that transport directly into mode-`0600` custody, then the report command
Schema-decodes the original manifest and verifies its accepted digest. The
authority audit rejects a missing or altered materialisation pipeline.
The 7,516-byte transport was installed at `2026-08-21T04:07:06Z` only after
an in-memory round trip retained the 87,930-byte manifest's stage, digest and
all 155 resources. Secret readback remains names and timestamps only.
Pull-request run `32445924126` then proved transport materialisation and
stopped safely at `manifestArtifactInvalid` because the workflow did not bind
the accepted digest required by `loadAdoptionCommand`. The successor adds the
exact digest as non-secret source configuration and an authority fixture that
rejects omission or change.
CI run `32446250097` passed on the exact digest-binding SHA. Drift run
`32446250037` produced the first valid hosted receipt after custody, with an
inconclusive native read and zero provider writes. Secret-negative follow-up
isolated the cause to Vercel's valid custom deployment target `staging`, not
credential denial: both exact project tokens returned HTTP 200. The provider
transport now decodes arbitrary non-empty target names and explicitly excludes
custom targets from the closed Bundjil Preview/Production model. A fixture
proves `staging` is ignored rather than rejected or relabelled.

Exact-source run `32452367518` completed every provider read and emitted a
Schema-valid zero-write receipt. Run `32453467578` then retained one report-only
Photon change, 37 blocking Vercel deployment findings and 44 inconclusive
write-only rows. A secret-negative exact-state comparison corrected the earlier
diagnosis: 58 returned historical deployment records match every typed field,
while 37 accepted historical records are no longer returned by Vercel's current
project deployment list. Their absence is a report, not a no-op, deletion
claim, or repair authority. An unchanged write-only row may be accepted only
when present provider revision metadata matches the persisted observation and
the accepted manifest explicitly records the same `ObservedUnknown` baseline.
That proves metadata continuity only; the remote secret value remains unknown.
Absent revision metadata or any changed row remains inconclusive or blocking.

CI run `32455191281` passed exact successor SHA
`f5c707c4da8065993e6886130f887a774ff71520`. Same-source drift run
`32455191367` completed every provider read with zero writes and returned 109
accepted, zero blocking, eight inconclusive and 38 report findings. The eight
write-only rows are live, four per project. Secret-negative aggregate readback
proved every provider revision changed; five rows also changed type and two also
changed sensitivity. Vercel exposes no prior secret value or separate immutable
value-revision history for those rows. The control therefore stops before
`main`; report-only authority cannot replace the accepted baseline or call the
rows unchanged.

## Documentation impact ledger

| Surface                                       | Decision                                                                 | Earliest owner and evidence                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow desired state                        | Change required                                                          | New `.github/workflows/production.yml`; current CI remains secret-free.                                                                                                                |
| Workflow/provider authority                   | Change required                                                          | `docs/operations/authority-register.json`, `docs/operations/automation-register.md`, `docs/standards/automation-register.json`, `docs/standards/controls.md`, authority/control tests. |
| Vercel deployment boundary                    | Change required                                                          | `@bundjil/infrastructure` provider service, script, Schemas, errors, live/memory Layers, tests and package README command map.                                                         |
| Direct Vercel Git settings                    | Preserve                                                                 | Both app `vercel.json` files retain `git.deploymentEnabled: false`; provider Git connection remains absent.                                                                            |
| Agent/proxy runbooks                          | Change required                                                          | `apps/agent/runbooks/deploy-promote.md` becomes automatic-main operation and rollback owner; proxy Production proof and runbook indexes point to it.                                   |
| App/package READMEs                           | Change required only for supported command or boundary changes           | Infrastructure README adds the automatic command; app READMEs preserve public boundary unless command routing changes.                                                                 |
| Architecture/testing                          | Change required                                                          | `docs/architecture/testing-and-quality.md` separates CI acceptance, automatic staging/promotion and live proof; repo structure changes only if the actual topology requires it.        |
| Verification journey/proof                    | Change required                                                          | `docs/verification/README.md`, journey command map, exact proof packet and dated receipt.                                                                                              |
| SPEC/tasks/plan/indexes                       | Change required                                                          | This SPEC/tasks, refreshed Effect SPEC/tasks, one active plan, product and plan indexes.                                                                                               |
| Runtime/provider Schemas and channel services | Preserve unless a direct confirmed defect is found                       | No custom replay oracle or channel wrapper is admitted by this SPEC.                                                                                                                   |
| Skills, AGENTS, root README                   | Preserve unless implementation exposes a durable route not already owned | Existing routes and authority split already cover this change.                                                                                                                         |
| Fixtures                                      | Change required                                                          | Create workflow/authority negative fixtures and Production deployment live/memory fixtures; update exact Vercel packaging fixtures; retain existing Channel and drift fixtures.        |
| Rollout and rollback evidence                 | Change required                                                          | Active plan plus dated custody/drift packet; failed/inconclusive attempts retained outside current routes.                                                                             |
| Credential custody and external readback      | Change required                                                          | Four-token 1Password/GitHub readback is recorded in the 2026-08-21 detail; no secret values are retained and the missing Preview Photon secret remains an explicit stop.               |

## Dependencies and sequencing

The sibling task ledger is serial except for the accepted, non-blocking drift
limitation. Repository desired state, focused checks and full verification must
pass before GitHub or Vercel mutations. The callback implementation must land
on main before its automatic behaviour can be proved. The four Vercel tokens
and two Production GitHub secrets remain in custody; the callback hostname is
one non-secret Production variable. Drift run `32455191367` remains accepted
only as a zero-write, partly inconclusive report because Vercel exposes no
usable value history for eight write-only rows. That limitation must not block
the already accepted Production or channel work and must not be rewritten as a
clean drift result.

## Requirement-to-proof crosswalk

| Requirement                                                | Direct proof                                                                                          | False result rejected                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Decode the configured callback and current provider target | Config, alias response and immutable deployment fixtures plus exact project/source assertions         | A raw hostname, missing alias, redirect, wrong project or deployment ID alone      |
| Reconcile a stale callback without rebuilding current apps | Memory-Layer fixture proves only callback assignment and readback occur                               | Treating current public aliases as a complete no-op while callback is stale        |
| Promote a new candidate in the required order              | Operation log fixture proves proxy, public agent, callback, then health                               | Moving callback early or reporting success before all three read back              |
| Recover from typed failure, interruption or defect         | Before-write and after-write fixtures prove callback-first reverse rollback and restoration readback  | Typed-error-only compensation or retrying an uncertain assignment                  |
| Emit bounded evidence                                      | Schema-decoded receipt includes previous and accepted callback deployment IDs and leak-negative tests | Raw Vercel output, callback query, secret, token, message or provider body         |
| Prove automatic hosted behaviour                           | Exact-main CI and Production runs plus independent public and callback alias readback                 | Local tests, a manual callback move, READY alone or a stable health response alone |

After implementation and focused proof pass, run one fresh terminal review over
the changed call graph, Effect ownership, failure and rollback paths, lint,
documentation and hosted evidence. Reopen every finding at its earliest owner,
correct it, rerun affected checks, and repeat the terminal review once. Do not
run a fixed number of reviews when the repeated review is clean.
