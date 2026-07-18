# Vercel Production Promotion Execution Plan

Status: Complete - Production and Sendblue routing correction accepted

Spec: `docs/product-specs/vercel-production-promotion.md`  
Task ledger: `docs/product-specs/vercel-production-promotion.tasks.json`

## Execution Rule

The ledger was implemented sequentially under the user's approval for
Production provisioning, deployment, commits, and pushes. Every task is
accepted with three parent audit passes. This completed plan remains in
`docs/exec-plans/active/` because the repository has no separate archive
convention; its directory does not imply unfinished work.

The parent records only sanitized evidence here and in the ledger. Allowed
evidence is deployment id, source SHA, target, status/content type, event
counts, timing, variable names, cipher key id, and approved boolean proof
results. Never record credentials, prompts/outputs, raw OAuth/profile/ciphertext
data, PII, or protected URLs.

## Corrective Sendblue Follow-up

Live investigation on 2026-07-16 confirmed that Sendblue account-level receive
webhooks fan out rather than select a Vercel environment. One inbound reached
both retained webhook targets and both returned `202`. The two-webhook evidence
later in this plan remains historical, but its independent-routing conclusion
is superseded.

The canonical accepted task is `correct-account-level-sendblue-routing` in
`docs/product-specs/sendblue-eve-channel.tasks.json`. Its accepted end state is
one stable Production receive webhook, no Preview Sendblue ingress or dedicated
bypass, one bounded Production handset execution, zero Preview side effects,
and three recorded parent audit passes.

## Current Production State

- The proxy and agent are `READY` at accepted source `e53e7a4`; rollback
  references remain recorded below.
- Production Eve is protected by Vercel Deployment Protection and explicit
  Vercel OIDC. The private proxy bearer and Sendblue route secret are distinct
  from platform bypass authentication.
- Sendblue Production has independent durable Upstash replay state and an
  accepted provider ingress -> Eve -> private proxy -> outbound delivery proof.
  The retained Preview proof is historical evidence; its receive webhook and
  dedicated Sendblue bypass were removed by the corrective task. The corrected
  route's authenticated-malformed proof returned `400` with curl exit `0`
  through a secret-preserving ephemeral shell. The accepted bounded handset
  proof recorded one Production inbound and delivered outbound, zero Preview
  requests, and one tool-use turn with two correlated successful proxy
  completions; the user confirmed the broader Production Executor catalog.
- The temporary Production configuration bundle was removed after use.
  1Password and Vercel-managed encrypted configuration own credentials; no
  credential material is tracked in this repository.

## Historical Baseline

The following baseline describes the state before the accepted Production
rollout. It is retained as historical evidence and must not be read as current
configuration.

- The private proxy is implemented in `apps/codex-proxy`; its live composition
  already uses the package-owned encrypted profile, Upstash store, refresh
  lock, fenced commit, and Codex HTTP services.
- The agent currently selects the optional private proxy through its app-owned
  model provider, but `apps/agent/agent/agent.ts` has no explicit Eve auth
  policy. The ledger requires explicit `vercelOidc()` plus localhost-only
  `localDev()` before Production mutation.
- The Codex OAuth and model-provider execution plans remain completed
  Preview-era evidence. The first promotion task must revalidate a clean,
  combined encrypted-variable Preview baseline rather than treating those
  separate proofs as a Production gate.
- Sendblue Preview proof is accepted: the plan records an immutable Preview
  deployment, protected route matrix, independent signing secret, provider
  delivery, and replay suppression. It also records no Production Sendblue
  mutation. Sendblue is consequently the final task, not a prerequisite for
  proxy/agent promotion.
- Live Vercel metadata on 2026-07-14 reports old failed Production deployments
  for both projects. Only the proxy's Marketplace Upstash aliases currently
  include Production; Bundjil proxy variables are Preview-only and all agent
  Bundjil variables are Preview-only. The stable domains are
  `bundjil-codex-proxy.vercel.app` and `bundjil-agent.vercel.app`; the agent has
  Vercel SSO protection for Production deployment URLs and all Previews.

## Reopened Preview Evidence

### 2026-07-14 `revalidate-clean-codex-preview-baseline`

- Recovered the former local-proof blocker with a newly generated Preview
  cipher/key id, encrypted proof-only copies, and a new isolated Preview
  Upstash namespace. The runtime cipher entries are sensitive; the proof-only
  copies are encrypted and were mapped to canonical names only in a mode-`0600`
  untracked local file. `BUNDJIL_CODEX_PROXY_MODE` remained `live`; deployed
  proof mode was not enabled.
- Trusted-local subscription provisioning and `proof:stored-profile` passed:
  V2 ciphertext envelope, subscription/refresh capability, valid expiry, no
  reauthentication marker, and no plaintext marker leak. No values, callback
  material, profile data, or tracked env files were emitted.
- From detached clean worktrees at
  `f3a7d9c53b70de7b7772415bfef4bf8151446af3`, Preview proxy deployment
  `dpl_BhiCBKKW4Ti4PZ5AA2Ukpv3uD3n5` and agent deployment
  `dpl_CDuXrTdnGaiFKvSCo7nBreZ5aAYa` are both `READY` with matching source
  metadata. The agent's encrypted Preview proxy-base variable references the
  accepted immutable proxy deployment.
- The proxy proof passed health `200` in `live`/ready mode, missing and invalid
  bearer `401`, authenticated SSE `200` with two data lines and completion, and
  all leak predicates false. The staged refresh/fence proof passed its seven
  approved booleans, including concurrent authenticated success, final revision
  change, final valid expiry, and completed SSE responses.
- Anonymous agent info was `401`; fresh Vercel OIDC plus a Preview-only
  automation protection bypass produced protected info `200`, minimal session
  `202`, and `startIndex=0` stream `200`. The first session has exactly one
  subsequent proxy completion `200` in the sanitized runtime log. Parent
  replayed both existing session streams from `startIndex=0`: each produced
  exactly one event of each kind: `session.started`, `turn.started`,
  `message.received`, `step.started`, `message.appended`, `message.completed`,
  `step.completed`, `turn.completed`, and `session.waiting`.
  `reachesWaiting=true`; `reachesFailure=false`. Curl timed out only because
  the durable stream remains open after waiting. The parent revoked the
  temporary Preview automation bypass through the Vercel protection-bypass
  API; four pre-existing bypass records remain unchanged. Local temporary files
  and the detached worktree were removed. No Production state, Sendblue
  setting, or Production variable changed.

Parent acceptance audits:

1. Ownership and call graph: both READY deployments resolve to pushed SHA
   `f3a7d9c`; the agent references the immutable proxy; the live proxy retains
   package-owned encrypted profile, refresh, lock, and fence ownership; Vercel
   metadata proves no Production Bundjil mutation.
2. Implementation quality: no runtime source changed. Existing proofs retain
   Effect `Config`, `Redacted`, `Schema`, `Layer`, flat `Effect.gen`/`Effect.fn`,
   and tagged-error boundaries without DTO mirrors, unsafe casts, manual JSON,
   or helper sprawl. The agent build admitted all five model-provider inputs;
   remaining Turbo warnings concern unrelated Marketplace aliases or upstream
   packages that must not receive app secrets.
3. Verification and evidence: focused checks and `bun run verification`
   passed. Build, ciphertext, refresh/fence, proxy auth/SSE, Eve auth/session,
   nine-event replay, exact correlation, leak predicates, and temporary-bypass
   cleanup passed with sanitized evidence only. Task accepted 2026-07-14.

## Ordered Tasks

1. `revalidate-clean-codex-preview-baseline`: completed; no Production mutation
   and one clean SHA's correlated Preview proxy and Eve proof.
2. `implement-production-preflight-and-eve-auth`: completed historical baseline
   for explicit Eve auth and a read-only Schema-backed command. Its accepted
   evidence and three audit passes are not rewritten.
3. `implement-staged-production-preflight-checkpoints`: serial support before
   provisioning. Add read-only Schema-backed checkpoints and stage-specific
   missing/forbidden-field tests without mutation capability or helper sprawl.
4. `provision-isolated-production-profile`: first run
   `before-first-mutation`, then provision separate Upstash/profile/lock/fence
   identity, bearer, cipher, and trusted-local OAuth profile.
5. `deploy-and-accept-production-proxy`: first run `proxy-provisioned`, then
   deploy and prove the private live proxy and accept its stable alias.
6. `deploy-and-prove-production-agent`: configure accepted agent variables,
   run `proxy-accepted-agent-configured`, then deploy and correlate a protected
   minimal Eve session to one proxy request.
7. `soak-monitor-and-drill-rollback`: run
   `agent-accepted-rollback-ready`, validate no-content monitoring, and execute
   the ordered rollback drill without profile rollback.
8. `enable-sendblue-production-last`: run `sendblue-final-promotion` only after
   soak/rollback, then independently configure and prove Sendblue.
9. `reconcile-production-documentation`: reconcile all durable status language
   and final sanitized evidence.

Each task must finish three parent audits before acceptance:

1. ownership and call graph;
2. flat Effect implementation quality, canonical schema ownership, typed
   `.pipe(...)` error handling, and helper admission;
3. verification coverage and evidence hygiene.

## Accepted Implementation Evidence

### 2026-07-14 `implement-production-preflight-and-eve-auth`

- Added the explicit app-owned Eve policy `vercelOidc(), localDev()` and a
  read-only `apps/agent` snapshot command. The command accepts only a
  mode-`0600` local metadata file, Schema-decodes a minimal sanitized
  projection, and emits Schema-encoded go/no-go evidence. It has no Vercel
  mutation, deployment, alias, variable, storage, or profile capability.
- Focused agent checks passed: typecheck; 45 tests; and build. The auth tests
  cover a mocked Vercel OIDC bearer accepted for the linked agent project,
  anonymous deployed rejection, and loopback-only `localDev()` behavior.
  Direct local HTTP evidence: loopback `GET /eve/v1/info` returned `200`; the
  same request with deployed agent host and no bearer returned `401`.
- Focused proxy checks passed: 21 tests and mock smoke health/SSE evidence
  (`200`, `200`, five stream lines). `bun run verification` passed. No
  Production state was changed.
- Parent pass 1, ownership and call graph: accepted the explicit policy in the
  app-owned Eve channel, the app-owned preflight contract/operation, and the
  ConfigProvider/FileSystem/Effect.runPromise executable edge. The preflight
  has no Vercel mutation, deployment, alias, storage, or profile capability.
- Parent pass 2, implementation quality: accepted flat `Effect.fn`/`Effect.gen`,
  Schema-derived contracts and JSON encoding, tagged error translation, and
  the two policy-owning helpers. Parent review corrected Vercel variable
  metadata to admit `sensitive` only where security policy permits it and added
  plain-text-secret rejection coverage. No raw JSON, `process.env`, unsafe
  cast, provider DTO mirror, nested generator, or helper sprawl remains.
- Parent pass 3, verification and evidence: the mode-`0600` CLI fixture emitted
  only Schema-encoded `go: true` evidence; agent typecheck/build/45 tests,
  proxy 21 tests/private-route proof, root lint/format, knip, all workspace
  typechecks/tests, `bun run verification`, `jq empty`, and `git diff --check`
  passed. The task is accepted with no Production state mutation.

### 2026-07-14 `provision-isolated-production-profile` preflight

- Read-only personal-scope Vercel metadata preflight is blocked before the
  first Production mutation. The linked proxy project is
  `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB` under
  `team_1LX7ZujbijowTv8J9k0aU7nD`; the agent project is also under that
  personal scope.
- The proxy has only Marketplace Upstash aliases in the Production target; all
  required Bundjil proxy bindings remain Preview-only. The agent has no
  Production Bundjil bindings. This task cannot repair the agent condition
  because its approved scope excludes agent Production variables.
- No independent Production bearer, cipher/key id, subject/profile identity,
  namespace, encrypted profile, lock/fence proof, deployment, alias, or
  Sendblue configuration was created or changed. The task remains fail-closed
  pending a scope-compatible preflight that can establish every prerequisite.

This blocker is preserved as accepted read-only inventory evidence. It exposed
a circular gate rather than a provisioning failure: the prior full preflight
required agent variables owned later by the agent task, proxy variables owned
by this task, and accepted rollback deployments owned by later deployment
tasks. The new serial staged-preflight task resolves that ordering without
changing this evidence, its status, or any accepted audit count.

### 2026-07-14 resumed `before-first-mutation` at `c4313c7`

- Read-only personal-scope metadata confirmed exact projects
  `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB` (`bundjil-codex-proxy`) and
  `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN` (`bundjil-agent`) under
  `team_1LX7ZujbijowTv8J9k0aU7nD`. Their verified stable domains are
  `bundjil-codex-proxy.vercel.app` and `bundjil-agent.vercel.app`.
- Local `HEAD` and `origin/main` both resolved to clean pushed source
  `c4313c7a3701c417e768f386b6310a4cc7332453`. Read-only variable inventory
  found no Bundjil Production activation in either project, so no Production
  identity existed that could reuse the accepted Preview identity.
- The agent project retained Vercel SSO posture
  `prod_deployment_urls_and_all_previews`. The proxy project reported no SSO,
  password, or passport Deployment Protection policy. A mode-`0600` ignored
  `before-first-mutation` snapshot encoded that observed false posture; the
  package-owned CLI rejected `proxy.deploymentProtection` because `true` is
  required.
- The rollout stopped before its first Production mutation. No proxy variable,
  Upstash namespace/profile key, OAuth profile, lock/fence state, deployment,
  alias, agent Production variable, or Sendblue setting changed. The temporary
  sanitized snapshot was removed.

### 2026-07-14 `provision-isolated-production-profile` evidence

- A fresh read-only personal-scope snapshot confirmed both exact projects,
  stable domains, clean pushed source
  `c4313c7a3701c417e768f386b6310a4cc7332453`, absent Bundjil Production
  activation, and Vercel SSO Deployment Protection
  `prod_deployment_urls_and_all_previews` on both projects. The mode-`0600`
  package CLI returned `go: true` with no rejection at
  `before-first-mutation` before any Production write.
- Proxy Production now has `plain` subject selectors
  `BUNDJIL_CODEX_PROFILE_ID`, `BUNDJIL_CODEX_CONNECTOR_ID`,
  `BUNDJIL_CODEX_INSTALLATION_ID`, and `BUNDJIL_CODEX_SUBJECT_ID`.
  `BUNDJIL_CODEX_PROXY_MODE`, `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`,
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY`,
  `BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`,
  `BUNDJIL_UPSTASH_REDIS_REST_URL`,
  `BUNDJIL_UPSTASH_REDIS_REST_TOKEN`,
  `BUNDJIL_UPSTASH_REDIS_KEY_PREFIX`, `UPSTASH_REDIS_REST_URL`, and
  `UPSTASH_REDIS_REST_TOKEN` are `sensitive`; every listed binding targets
  Production only. The proxy mode is `live`, and the independent Production
  cipher key id is `bundjil-production-20260714-v1`.
- The shared Marketplace Upstash resource is isolated by a strongly disjoint
  Production namespace. Sanitized comparison proof confirmed every
  Preview/Production namespace, subject, profile, lock, fence, and cipher-key
  identity is disjoint; opaque fingerprints are intentionally not retained.
- The package-owned trusted-local subscription login stored an encrypted
  refresh-capable profile with `valid` expiry horizon. Final stored-profile
  proof returned true for found, envelope v2, ciphertext present,
  subscription variant, refresh capability, valid expiry, reauthentication
  false, and marker leak false.
- The package-owned staged refresh proof ran through a trusted-local proxy
  process using only the Production namespace. It returned true for staged
  expiry, concurrent authenticated success, SSE responses, complete streams,
  final subscription variant, valid final expiry, and final revision changed.
  The final fenced generation is therefore newer than the forced-expiry
  generation; a second stored-profile proof confirmed the newest envelope.
- A mode-`0600` sanitized `proxy-provisioned` snapshot returned `go: true` with
  no rejection. Focused OAuth typecheck, 102 tests, and build; agent typecheck,
  51 tests, and build; proxy typecheck, 21 tests, build, and smoke; and
  `bun run verification` passed. No deployment or alias was created, and no
  agent Production variable, Sendblue setting, task status, or parent audit
  field changed.
- Parent pass 1, ownership and call graph: accepted personal proxy-project
  security/variable mutation, package-owned trusted-local OAuth and encrypted
  profile/lock/fence services, and app-owned sanitized staged preflight. No
  hosted OAuth route, deployment, alias, agent variable, or Sendblue mutation
  entered this task.
- Parent pass 2, implementation quality: accepted the existing Config/Redacted,
  canonical Schema, explicit Layer, flat named Effect, tagged-error, and Schema
  JSON boundaries. No source abstraction was added; all one-off helpers and
  local material were removed after proof, leaving no plaintext persistence,
  raw JSON, unsafe cast, DTO mirror, manual mapper, or helper sprawl.
- Parent pass 3, verification and evidence: accepted exact personal scope,
  project/domain/protection and variable metadata readback, both staged gates,
  disjoint identity fingerprints, stored V2 profile proof, concurrent refresh
  and fenced-generation advancement, final encrypted-envelope proof, OAuth 102
  tests, proxy 21 tests/build/smoke, agent 51 tests/build, root verification,
  ledger validation, diff check, and secret-file cleanup. The task is accepted
  without deployment or downstream activation.

### 2026-07-14 `deploy-and-accept-production-proxy` evidence

- The read-only `proxy-provisioned` checkpoint passed before deployment. The
  Production internal bearer was synchronized as a write-only `sensitive`
  Vercel variable and in the personal-vault `Bundjil Production` record. No
  bearer, OAuth token, profile, ciphertext, prompt, response, or bypass value
  was recorded; temporary files and the local clipboard were cleared.
- Two post-rotation immutable Production deployments built from accepted source
  `e53e7a48270db4bb571d90c771186f92a0282922` without inline runtime/build
  variables or prebuilt output. Current deployment
  `dpl_DJBqdgbJRL3qGMpXjSgrUp8u3HsW` and previous accepted rollback deployment
  `dpl_CU9Y7UiFEV84QLcjczzsCnsBvFRZ` are both `READY`, target Production, and
  retained as rollback candidates. The stable personal alias resolves to the
  current deployment.
- Personal-project SSO protection remains
  `prod_deployment_urls_and_all_previews`. Stable-alias health returned `200`
  with `mode: live`. Valid-shape requests with missing and invalid internal
  bearers returned `401` without marker leaks. The matched bearer returned
  `200`, `text/event-stream`, `mode: live`, two data lines, and terminal
  `[DONE]`, with no bearer leak.
- Production logs recorded only route, status, deployment, and cache metadata.
  The accepted current deployment had exactly one correlated completion `200`;
  the runtime-error query was empty. No agent Production variable or deployment
  and no Sendblue Production state changed in this task.
- Parent pass 1, ownership and call graph: accepted personal proxy-project
  deployment/alias ownership, app-owned Config and HTTP ingress, and the
  package-owned proxy/OAuth/profile/refresh/lock/fence/provider graph. No agent
  or channel mutation entered the task.
- Parent pass 2, implementation quality: accepted the deployed
  `Config.redacted`, canonical Schema, explicit Layer, flat named Effect,
  `catchTags`, `HttpServerResponse.schemaJson`, and Schema JSON boundaries. No
  source helper was added and no raw JSON helper, unsafe cast, DTO mirror,
  manual mapper, plaintext persistence, or helper sprawl entered the slice.
- Parent pass 3, verification and evidence: accepted both same-source/config
  immutable deployments, alias and protection readback, health/auth/SSE and
  leak proofs, exactly one current completion correlation, empty runtime errors,
  rollback candidacy, focused checks, root verification, ledger validation,
  diff check, clean tracked state, and local-material cleanup.

### 2026-07-14 `deploy-and-prove-production-agent` worker evidence

- The read-only `proxy-accepted-agent-configured` checkpoint returned
  `go: true` for the accepted proxy and agent deployment source
  `e53e7a48270db4bb571d90c771186f92a0282922`. It retained the exact personal
  team/project scope, stable proxy URL, sensitive agent binding types,
  disjoint bearer fingerprints, Deployment Protection, explicit Vercel OIDC,
  and no deployed local or anonymous Eve fallback.
- Two source-only Production agent deployments from that clean reachable source
  are `READY`: rollback `dpl_5y9a6SJHybFvPd3ayGnSddHiCJnD` and current stable
  alias `dpl_8wuKAm1o5xJagcMdLsPDU1XtsYqz`. Neither used prebuilt output,
  inline runtime values, or build-environment injection.
- Anonymous deployed Eve info returned `401`; a fresh Vercel OIDC caller
  returned `200`. Sanitized info metadata reported
  `bundjil-codex-proxy/gpt-5.5`, external endpoint/routing, and context window
  `200000`, with no Gateway, mock, local, or Preview fallback.
- One minimal non-sensitive session replayed from `startIndex=0` with the
  expected curl timeout after durable bytes were received. The mode-`0600`
  partial replay contained exactly nine events, once and in order:
  `session.started`, `turn.started`, `message.received`, `step.started`,
  `message.appended`, `message.completed`, `step.completed`,
  `turn.completed`, and `session.waiting`. It reached waiting with no failure
  event. The fresh-session proxy correlation advanced exactly once from three
  to four accepted current-proxy completion `200` requests; later replay reads
  did not add a completion.
- Agent and proxy runtime-error queries were empty. Sanitized log scans found
  no token, authorization, prompt, ciphertext, bypass, Preview, mock, or
  Gateway markers; request metadata recorded only expected Eve/proxy routes.
  No task-created bypass existed, and the pre-existing Preview Sendblue
  automation bypass was unchanged. Detached worktree and local proof material
  were removed after proof.
- Parent pass 1, ownership and call graph: accepted the personal agent-project
  variable/deployment boundary, app-owned Config/model-provider/Eve auth graph,
  stable proxy HTTP boundary, and package-owned OAuth/profile/refresh/lock/fence
  graph. Agent and proxy deployment sources match at `e53e7a4`; no provider
  secret or Sendblue Production state crossed into Eve.
- Parent pass 2, implementation quality: accepted the deployed Effect Config,
  Redacted, canonical model-provider Schema, Match selection, flat named Effect,
  Eve auth, and proxy Schema/Layer/tagged-error boundaries. The worker changed
  documentation only; no raw JSON helper, unsafe cast, DTO mirror, manual
  mapper, plaintext credential, Gateway fallback, or helper sprawl was added.
- Parent pass 3, verification and evidence: accepted sensitive Production
  variable readback, strict staged preflight, two READY same-source/config
  deployments, alias/protection/bypass readback, anonymous `401`, OIDC `200`,
  external model metadata, nine ordered durable events through waiting with no
  failure, one accepted-session proxy completion with none on replay, empty
  runtime errors, clean leak scans, agent typecheck/51 tests/build, root
  verification, ledger validation, diff check, and local-material cleanup.

### 2026-07-14 `soak-monitor-and-drill-rollback` worker evidence

- A mode-`0600` sanitized `agent-accepted-rollback-ready` snapshot passed with
  the exact personal team/project scope, current and previous immutable
  references for both applications, accepted source
  `e53e7a48270db4bb571d90c771186f92a0282922`, Production `live` proxy mode,
  sensitive-variable inventory, Vercel OIDC, Deployment Protection, accepted
  model/provider facts, and disjoint profile/cipher/namespace fingerprints.
  A preliminary snapshot with a duplicated opaque identity fingerprint failed
  closed before mutation; the corrected snapshot passed. No values or profile
  material were read into the evidence.
- The elapsed interval since the accepted Production deployments was treated as
  the practical soak. Sanitized Production metadata kept both current releases
  `READY`, Production-targeted, source-matched, and alias-assigned. Runtime
  logs recorded proxy completion `200`s, Eve anonymous rejection `401`, and
  fresh-OIDC acceptance `200`; the current agent and proxy error-log queries
  were empty. The available request metadata did not expose latency, refresh,
  lock, fence, or storage outcome fields, so those facts are evidenced by the
  unchanged profile/config state and successful live completions rather than
  inferred from absent logs.
- External Sendblue remained disabled in Production: the proxy has zero
  Sendblue entries and the agent's ten Sendblue entries are Preview-only. No
  production webhook/channel binding was active. No protection bypass was
  created or changed; the existing Preview bypasses, including Sendblue Preview,
  were not touched.
- The ordered rollback drill used only existing immutable deployments and made
  no environment, profile, namespace, cipher, subject, or external-channel
  mutation. The agent alias moved first to
  `dpl_5y9a6SJHybFvPd3ayGnSddHiCJnD`, then the proxy alias moved to
  `dpl_CU9Y7UiFEV84QLcjczzsCnsBvFRZ`; both were verified `READY`,
  Production-targeted, protected, source-matched, and alias-assigned.
- A pre-existing rollback session was replayed from `startIndex=0` using fresh
  OIDC and a mode-`0600` partial-output file. Direct curl returned `28` only
  after exactly the nine ordered events `session.started`, `turn.started`,
  `message.received`, `step.started`, `message.appended`,
  `message.completed`, `step.completed`, `turn.completed`, and
  `session.waiting`; no failure event occurred. Three rollback session `202`s
  each had exactly one subsequent previous-proxy completion `200`; the replay
  did not add a completion.
- Restoration was ordered proxy first to
  `dpl_DJBqdgbJRL3qGMpXjSgrUp8u3HsW`, then agent to
  `dpl_8wuKAm1o5xJagcMdLsPDU1XtsYqz`. Current aliases, source, protection,
  proxy health `200`, anonymous Eve `401`, and fresh-OIDC Eve `200` were
  verified. One final minimal non-sensitive restored-pair session returned
  `202`, replayed the same nine ordered events with no failure and curl `28`,
  and added exactly one current-proxy completion `200`; its replay added none.
- Read-only metadata fingerprints were retained for the post-drill Production
  environment inventories. Current and previous proxy deployment config
  inventories matched exactly, and post-restore live completion proved that the
  newest stored profile generation remained usable. No profile-generation
  downgrade was observed.
- Focused synthetic failure coverage passed: agent `51` tests, proxy `21`
  tests, and OAuth `102` tests covering health, auth, storage, refresh,
  reauthentication, invalid mode/host/scope, rollback, and leak boundaries.
  Temporary mode-`0600` proof material was removed.
- Parent pass 1, ownership and call graph: accepted alias-only rollback and
  restoration with no Production variable or package-owned profile, refresh,
  lock, fence, cipher, subject, or Upstash mutation. Agent-first/proxy-second
  rollback and proxy-first/agent-second restoration preserved the deployed
  Eve-to-proxy-to-OAuth/provider graph; Sendblue Production stayed disabled.
- Parent pass 2, implementation quality: accepted the staged Schema gate's
  fail-closed duplicate-identity rejection and corrected canonical snapshot,
  plus the existing Config/Redacted, explicit Layer, flat named Effect, tagged
  error, and Schema JSON runtime boundaries. The worker changed documentation
  only and added no helper, raw JSON path, unsafe cast, DTO mirror, manual
  mapper, or plaintext persistence.
- Parent pass 3, verification and evidence: accepted the practical soak,
  explicit preliminary-retry accounting, empty runtime errors, both ordered
  nine-event/no-failure rollback and restore proofs, one completion per proof
  session and none on replay, final current aliases, unchanged environment and
  profile/config fingerprints, inactive Sendblue Production, unchanged bypass
  inventory, agent 51/proxy 21/OAuth 102 tests, root verification, ledger and
  diff checks, and temporary-file cleanup.

## Staged Checkpoints

The preflight remains read-only and fail closed. Checkpoints consume only
sanitized metadata and may never print values, raw Vercel output, protected
URLs, profiles, or credentials.

1. `before-first-mutation`: granted approval, personal scope, exact projects and
   stable domains, Deployment Protection posture, clean pushed source SHA,
   expected absence of Bundjil Production activation, no Preview identity reuse,
   and read-only inventory. Future variables, profile state, aliases, and
   deployment/rollback references are forbidden inputs.
2. `proxy-provisioned`: after provision and before proxy deploy, require proxy
   Production variable names/security types, `live` mode, disjoint opaque
   identities, and encrypted stored-profile proof. Stable proxy URL and
   immutable deployment references are forbidden inputs.
3. `proxy-accepted-agent-configured`: after proxy acceptance and agent variable
   configuration, require the stable proxy URL resolving to the accepted
   immutable proxy, agent Production variable names/security types, independent
   bearer identity, Deployment Protection, and Eve OIDC with no deployed
   local/anonymous fallback. Agent deployment and rollback references are not
   required yet.
4. `agent-accepted-rollback-ready`: after agent acceptance, require immutable
   agent source/config/deployment evidence and current/previous accepted
   rollback references for both apps.
5. `sendblue-final-promotion`: immediately before final Sendblue enablement,
   require the preceding checkpoint, completed soak/rollback proof, and known
   unactivated Sendblue Production state. Sendblue-specific variables, ingress,
   provider delivery, and replay proof remain final-task work.

## Call Graphs

### Production

```text
Vercel Deployment Protection
  -> apps/agent Eve auth (vercelOidc; localDev only localhost)
  -> AgentModelProviderConfig / codex-proxy LanguageModel
  -> stable Production proxy alias + independent bearer
  -> CodexProxyConfig -> OpenAICompatibleProxy -> CodexOAuthService
  -> encrypted CodexProfileStore + cipher + Upstash lock/fence/store
  -> Codex Responses API
```

### Tests

```text
Vitest -> ConfigProvider fixtures -> agent/proxy HTTP handlers
  -> canonical Codex OAuth schemas -> memory/deterministic Layers
  -> auth, target isolation, refresh/fencing, rollback, and leak assertions
```

### CLI / Deployment Proof

```text
Bun app-owned Effect command -> Schema decode -> Vercel adapter at edge
  -> target metadata -> deploy without inline secret flags -> HTTP/session probes
  -> sanitized log query -> Schema-encoded evidence
```

## Acceptance Evidence

Before a task is accepted, run its focused checks and the ledger's global gate,
including `bun run verification`, `jq empty`, and `git diff --check`. Record
the three audit passes in both this plan and the task entry. Keep production
status unchanged until the corresponding evidence has been recorded.

### 2026-07-14 `implement-staged-production-preflight-checkpoints` worker evidence

- The app-owned, read-only preflight now accepts five strict ordered Schema
  checkpoint variants. The first checkpoint needs only approval, exact personal
  team/project/domain/protection facts, a clean pushed source reference,
  inactive Production state, Preview-reuse absence, and inventory. Later
  inventories advance through proxy provisioned/agent absent, proxy
  accepted/agent configured, and both accepted; excess or contradictory stage
  facts are rejected at decode.
- Focused agent typecheck, the complete agent suite (51 tests), and agent build
  passed. The staged tests cover five accepted fixtures plus per-stage missing
  and premature fields, wrong target/scope/team/security type, contradictory
  state, exact HTTPS URL restrictions, missing OIDC, shared identities, source
  and current rollback correlation, invalid immutable references, and
  non-read-only metadata rejection. Both internal bearer bindings require
  `sensitive`; `plain` and `encrypted` downgrades are rejected.
- A temporary mode-`0600` local fixture exercised the direct CLI with the
  `before-first-mutation` checkpoint. It emitted only sanitized Schema-encoded
  evidence: `go: true`, an empty rejection list, and the checkpoint name. The
  fixture was removed. No Vercel or Production state was read or changed.
- `bun run verification`, task-ledger `jq empty`, and `git diff --check` passed.
  Review found no mutation capability, raw JSON, `process.env`, unsafe cast,
  provider DTO mirror, manual reader, or new helper/service layer.
- Parent pass 1, ownership and call graph: accepted the app-owned staged Schema
  union and named operation with ConfigProvider, Effect Platform FileSystem,
  strict JSON decode, and `Effect.runPromise` only at the CLI edge. No Vercel
  client or mutation capability enters this boundary.
- Parent pass 2, implementation quality: accepted canonical stage variants,
  flat `Effect.fn`/`Effect.gen`, Schema JSON, typed error mapping, and the two
  policy-owning helpers after correcting inherited absent-state contradictions,
  exact personal-team ownership, HTTPS URL restrictions, source/current
  rollback correlation, and write-only sensitive bearer enforcement. No helper
  sprawl or prohibited boundary pattern remains.
- Parent pass 3, verification and evidence: accepted five positive checkpoint
  fixtures and the complete missing, premature, target, scope, team, security,
  state, URL, OIDC, identity, source, rollback, and read-only failure matrix.
  Agent typecheck/build/51 tests, direct mode-`0600` CLI proof, root lint/format,
  knip, all workspace checks, `bun run verification`, `jq empty`, and
  `git diff --check` passed. The task is accepted without Production access.

### 2026-07-14 `enable-sendblue-production-last` accepted evidence

- The mode-`0600` `sendblue-final-promotion` checkpoint returned `go: true`.
  Production Sendblue received twelve `sensitive`, Production-only bindings and
  one dedicated automation bypass; the existing Preview bypasses remain.
- The first channel deployment was rejected as evidence after a malformed
  identity-map dotenv encoding caused sanitized `SendblueConfigError` route
  failures. The Production bundle was repaired by copying the approved Preview
  assignment verbatim, its local `loadSendblueConfig` proof passed, and only
  that sensitive Production variable was upserted.
- Rejected deployment `dpl_9KKkPqbAKTcShH3bm8X6KBcf5xXj` is retained as
  evidence. Current source-only Production deployment
  `dpl_6g91e8CEg7JTkQnAEtvAdeR6CWrT` is `READY` at accepted source
  `e53e7a4`; `dpl_8wuKAm1o5xJagcMdLsPDU1XtsYqz` remains the rollback target.
- Historical 2026-07-14 state: Sendblue then had exactly two receive webhooks:
  retained Preview plus Production. This was superseded by the 2026-07-16
  account-level routing correction.
  Stable-route probes now return missing-secret `401`, invalid-secret `401`,
  and authenticated-malformed `400`. Focused agent checks (51 tests/build) and
  root verification passed.
- Non-handset follow-up: a signed Production loop event returned `200` without
  dispatch or delivery. Deterministic agent fixtures cover replay-store
  fail-closed `503` plus sequential and concurrent inbound/outbound replay
  suppression; the focused suite passed all 51 tests. Read-only inventory
  historically confirmed two receive webhooks and five automation bypasses,
  including the retained Preview and dedicated Production notes. Root
  verification passed.
- Live provider readback: one correlated Production inbound was `RECEIVED` via
  iMessage at `2026-07-14T15:21:30.810Z`; exactly one subsequent outbound was
  `DELIVERED` at `2026-07-14T15:21:46.728Z`. Content, identities, handles, and
  protected URLs were not retained.
- Live proof completed: the one-hour Production window contains one successful
  Sendblue-triggered agent run using the private proxy model, with one turn and
  no failed or cancelled execution. The durable Eve replay returned 15 ordered
  events from `session.started` through `session.waiting`, including seven
  `message.appended` events and one each of `message.completed`,
  `step.completed`, and `turn.completed`; waiting was one and failure was zero.
- The proof window contains one private proxy completion `200` and one
  subsequent Sendblue outbound `DELIVERED` record. Reposting the real provider
  handle returned `200`; outbound inventory and proxy completion count were
  unchanged before and after. Agent/proxy leak scans found zero sensitive-value
  and credential-marker hits. No content, identity, handle, URL, credential,
  run/session id, or token count was retained.
- Rollback order, not executed after acceptance: remove the Production receive
  webhook; revoke the Production automation bypass; return the agent alias to
  `dpl_8wuKAm1o5xJagcMdLsPDU1XtsYqz`; then remove Production Sendblue vars.
