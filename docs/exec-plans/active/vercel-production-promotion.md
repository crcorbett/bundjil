# Vercel Production Promotion Execution Plan

Status: Active - approved, gated rollout

Spec: `docs/product-specs/vercel-production-promotion.md`  
Task ledger: `docs/product-specs/vercel-production-promotion.tasks.json`

## Execution Rule

Implement the ledger sequentially. The user has granted approval for Production
provisioning, deployment, commits, and pushes, but each task remains fail
closed: a missing proof, failed check, wrong target, unsafe evidence boundary,
or unresolved audit finding blocks the next task. Commit and push each accepted
slice before a deployment consumes it.

The parent records only sanitized evidence here and in the ledger. Allowed
evidence is deployment id, source SHA, target, status/content type, event
counts, timing, variable names, cipher key id, and approved boolean proof
results. Never record credentials, prompts/outputs, raw OAuth/profile/ciphertext
data, PII, or protected URLs.

## Reconciled Baseline

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
