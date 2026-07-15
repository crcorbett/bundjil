# Executor MCP Connection Implementation Plan

Status: Complete - Production accepted and documentation reconciled

Spec: `docs/product-specs/executor-mcp-connection.md`
Task ledger: `docs/product-specs/executor-mcp-connection.tasks.json`

## Execution Rule

Implement the ledger sequentially. One Terra Medium subagent implements
exactly one task at a time. The parent agent inspects the actual diff, runs
focused and repository verification, performs and records the required
ownership/call-graph, implementation-quality/helper-admission, and
verification/evidence audits, commits the accepted slice, and only then
delegates the next task.

Three parent audit passes are the minimum. A finding keeps the task open until
it is corrected and another pass accepts the result. Subagent assertions are
inputs to review, not acceptance evidence.

## Evidence Policy

Record only sanitized contract facts, source references, environment,
deployment/source identifiers, policy categories/counts, status families,
approval outcomes, and leak-scan booleans. Never record credentials,
authorization headers, protected toolkit or approval URLs, prompts, generated
Executor code, raw MCP/provider payloads, provider records, message content,
or downstream results.

Use 1Password references, Executor-managed connections, target-scoped Vercel
variables, and mode-`0600` ignored material for live work. Trusted-workstation
recovery records may remain under `.local/secrets/`; remove callback, request,
response, stream, and other proof captures after each proof.

## Ordered Tasks

1. `freeze-executor-eve-contract-and-policy-inventory`: accepted.
2. `implement-effect-config-and-eve-mcp-connection`: accepted.
3. `provision-isolated-preview-toolkit-and-credentials`: accepted.
4. `adopt-temporary-chat-model-approval`: accepted.
5. `prove-preview-eve-executor-and-chat-resume`: accepted; the earlier browser
   proof attempt and its hosted blocker are retained below as historical evidence.
6. `promote-production-document-and-audit`: accepted.

## Current Baseline

- The SPEC and original five-task ledger were Draft at rollout start. The
  2026-07-15 revision adds one ordered task for the explicit temporary model
  approval workaround before the revised Preview proof task.
- The repository is on `main` and otherwise clean against `origin/main`.
- Eve owns the production MCP client boundary; Executor owns hosted tool
  schemas, toolkit policy, downstream credentials, paused execution, and
  resume state. Explicit model mode temporarily lets the Eve model submit a
  later authenticated owner's decision because browser approval is unavailable.
- Preview has an accepted dedicated Executor toolkit and operationally
  dedicated account key plus target-scoped Vercel variables. Production has an
  independent toolkit with reviewed policy intent, a distinct labeled Personal credential record, Production-only
  Sensitive bindings, and the sanitized live proof recorded below. The record
  title/category and non-empty fields are correct. A replacement bearer matches
  exactly one current Executor inventory row by unique provider name and masked
  value, is durably stored in that record, and matches the replaced
  Production-only Sensitive binding. The temporary handoff file is removed.
- No Bundjil frontend work is in scope.

### Task 6 Production Evidence

Status: Accepted 2026-07-15.

- Executor API readback confirms an independent Production toolkit in the
  Personal organization. It is distinct from the Preview toolkit; identifiers,
  protected endpoint URLs, and credentials are intentionally omitted.
- The Production toolkit was initially empty. Its policy now recreates only
  the reviewed Preview intent: one selected connection and five ordered policy
  rules. A post-write semantic readback matched the accepted Preview intent.
  This records policy intent, not a shared Preview identity or an unreviewed
  provider catalog entry.
- A Production bearer was generated and delivered to the Production Sensitive
  binding without source, task-evidence, or ephemeral-file retention. The
  distinct Personal item was initially created as an untitled empty Login item,
  then renamed to `Bundjil Executor Production`; it now has non-empty standard
  credential/reference fields. The generic Bundjil Production record is
  distinct and unchanged. A replacement bearer now matches exactly one current
  key-inventory row by unique provider name and masked value, is durably stored
  in the labeled Personal record, and matches the replaced Production-only
  Sensitive binding. Executor keys are account-level, not toolkit-bound; the
  toolkit endpoint and policy enforce capability scope. A mode-`0600`, ignored
  workstation record now supports trusted local probes without repeated
  1Password prompts. It is not a deployment source of truth and is not retained
  as proof output.
- Both Executor configuration names have separate Production-only Vercel
  bindings of type Sensitive. Name/target/type inventory confirms the Preview
  bindings remain separate. The endpoint uses the independent toolkit and
  explicit `elicitation_mode=model`; its value is not retained here.
- Two fresh Production deployments from clean pushed revision `e1f33e8` are
  `READY`: current `dpl_8zHs2hLyXToTrauttibmeGcReLuF` owns the stable aliases,
  and `dpl_BA63KVRxktQbYRQbByZFWrVihciL` is retained as the immediate rollback
  candidate. Authenticated Vercel CLI requests returned health HTTP `200` for
  both. Deployment metadata, source repository, source revision, target, and
  binding inventory were correlated without retaining a protected URL.
- Direct authenticated Streamable HTTP discovery established an MCP session and
  returned exactly `skills`, `execute`, and `resume`. One subsequent
  `execute` call completed the approved read of GitHub PR 1317 with content
  present, `writeRequested: false`, and no MCP or provider error. No Production
  write was invoked.
- The Production Codex profile had independently reached its explicit
  reauthentication-required state before final Eve proof. A fresh trusted-local
  OAuth callback stored a refresh-capable encrypted subscription profile in a
  new isolated Upstash namespace and cipher. The matching proxy variables were
  rotated as Production-only Sensitive values. Proxy deployment
  `dpl_5Nrw5hbs8oUwcP8NdSdfoHA3SBez` is `READY` at pushed revision `e1f33e8`;
  its stable alias reports health HTTP `200`, `mode: live`, and `ok: true`.
- A fresh Vercel OIDC bearer reached the deployed agent: session creation
  returned `202`, and replay returned `200`. The accepted run emitted
  `connection_search`, `executor__skills`, and `executor__execute`; the exact
  `github.user.personalgithub.pull_request_read` call used `method: get`, the
  reviewed owner/repository, and `pullNumber: 1317`. Executor returned
  `isError: false`, `status: completed`, and `result: succeeded`; the Eve turn
  completed and the session reached `session.waiting`. No write, resume, or
  approval operation was requested. An earlier read-only attempt used an
  incorrect generated argument shape, returned `succeeded: false`, and caused
  no provider mutation; it was not accepted as proof.
- Bounded post-proof runtime queries found no agent or proxy runtime errors.
  The accepted agent deployment recorded only `200`/`202` responses and the
  accepted proxy deployment recorded only `200` responses in the proof window.
  Request, stream, OIDC, callback, and temporary deployment material was removed.
- Vercel deployment-event and bounded Executor artifact scans found zero bearer,
  credential-assignment, protected-endpoint, or OAuth markers. The scan output
  retains no provider result, prompt, message content, or execution identifier.
- Final repository verification passes with a nonsecret synthetic
  explicit-model Production fixture: type-aware Ultracite/Oxlint reports zero
  findings, Knip is clean, all six strict package typechecks pass, and all 194
  tests pass. Effect language-service diagnostics across the root and all six
  package/app TypeScript projects report zero errors, warnings, or messages.
  Frozen install made no changes; focused agent typecheck, 56 tests, and build,
  JSON validation, `git diff --check`, tracked/compiled-value scans, and
  temporary-artifact cleanup also pass.

#### Production Acceptance Audits

- **Pass 1 - ownership and call graph:** accepted. The app uses Eve's native MCP
  boundary with one independent Production toolkit; Executor owns schemas,
  connection policy, downstream credentials, and paused execution. The Codex
  path remains the private proxy and package-owned encrypted profile store. No
  duplicate client, proxy, DTO, approval/state service, package, or frontend
  owner was added.
- **Pass 2 - Effect quality and helper admission:** accepted. Task 6 changes
  documentation and operator configuration only. The previously accepted
  Config/ConfigProvider, Schema, Redacted, tagged-error, named linear Effect,
  Layer, and adapter-edge runtime surfaces remain unchanged. The helper
  inventory contains only the accepted app config, Eve connection,
  instructions, and direct tests; no new helper, mapper, wrapper, hook, script,
  service, layer, factory, barrel, DTO, manual reader, raw JSON helper,
  `process.env` access, cast, suppression, or UI component exists.
- **Pass 3 - verification and evidence:** accepted. Independent Production
  authority, target-scoped Sensitive bindings, clean-source current/rollback
  deployments, direct MCP read, fresh encrypted Codex subscription profile,
  OIDC-authenticated deployed Eve read, runtime-error absence, frozen install,
  focused checks, all 194 tests, six strict typechecks, Knip, type-aware lint,
  root plus six-project Effect diagnostics, JSON, diff, protected-value scans,
  and proof-artifact cleanup pass. No Production write or approval ran.

No Production write or destructive revocation rehearsal is an acceptance step.
Do not disable an unrelated key.

The incident procedure is proved by current read-only inventory and documented
ordering, not a live destructive rehearsal: block the selected toolkit policy;
revoke the dedicated key; remove the two Production bindings; restore the
retained immutable Ready deployment; confirm rejection with a status-only
probe; rotate the labeled key; add the replacement only as a new Production
Sensitive value; and repeat the bounded read-only proof. The fresh current and
rollback `READY` deployments are retained as immutable candidates while the
correlated Production bearer remains active.

#### Production Runbook

- **Rollback:** retain the current and previous immutable deployment references
  before promotion. On a deployment incident, restore the retained deployment,
  then confirm protected health and runtime status without retaining bodies.
- **Revocation:** on credential or authority concern, first block the selected
  toolkit policy, revoke the dedicated key in Executor, remove both Production
  Vercel bindings, and verify a status-only rejection. Create a replacement
  only after its Personal 1Password reference exists, then repeat the
  read-only acceptance path.
- **Monitoring:** inspect only deployment/source state, protected-health status,
  exact MCP tool names, read-only result category, HTTP status families, and
  zero-leak/zero-5xx summaries. Never preserve secrets, protected URLs,
  prompts, raw MCP/provider results, message content, OAuth material, or
  execution identifiers.
- **Future integration promotion:** inventory and classify the candidate,
  update the SPEC and task ledger, configure a separate Preview toolkit, prove
  read/approval/block behavior, review the resulting policy intent, recreate
  it in Production, deploy a clean revision, and monitor sanitized evidence.
  Any Production mutation or authority-management capability needs a new task
  and separate chat-approval proof.

## Task Evidence

### freeze-executor-eve-contract-and-policy-inventory

Status: Accepted 2026-07-14

#### Scope And Acceptance Boundary

This is a read-only evidence slice. It creates no runtime code, provisions no
toolkit/key/credential/Vercel variable, and performs no downstream provider
operation. The parent retains acceptance, ledger status changes, commits, and
all three audit pass records.

The proposed first Preview capability is **GitHub pull-request triage**:
list, search, and read pull requests from one selected user-owned GitHub
connection. A reversible comment is included only as a later disposable
Preview browser-approval proof; it was not executed. No Bundjil frontend,
route, visible text, or URL state is in scope. Any such need stops this rollout
for the separate frontend SPEC required by the task ledger.

#### Revalidated Contract Evidence

| Surface             | Sanitized current evidence                                                                                                                                                                                                                                                                                         | Source                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eve public API      | `defineMcpClientConnection` is a public `eve/connections` definition for `agent/connections/<name>.ts`; it accepts URL, auth token resolver, exact `tools.allow` or `tools.block`, and optional connection-level approval. Eve discovers remote schemas through `connection_search`; Bundjil must not mirror them. | Eve reference `79e9959a95393d8644ab17364769513858f77228`: `docs/connections/mcp.mdx`, `packages/eve/src/public/definitions/connections/mcp.ts`, and `packages/eve/src/public/connections/index.ts`; installed app dependency `eve@0.20.0`. |
| Hosted MCP surface  | Executor currently registers `execute`, `skills`, and `resume`; `skills` is metadata/guidance and `execute` reaches the scoped dynamic catalog. Eve must expose exactly those orchestration tools.                                                                                                                 | Executor reference `0a50c796c2cc334cf3e9bf6d4be33c77dbfac93b`: `packages/hosts/mcp/src/tool-server.ts`; direct personal MCP discovery.                                                                                                     |
| Resume mode         | The host accepts `browser`, `model`, and `native`; absent/unknown `elicitation_mode` and the legacy model-resume alias resolve to `model`. Model resume accepts execution id, action, and optional content. Browser resume accepts **only** execution id and waits for Executor's stored browser decision.         | Executor reference: `packages/hosts/mcp/src/browser-approval.ts` and `packages/hosts/mcp/src/tool-server.ts`. Direct personal MCP metadata advertises model-side resume, so it is discovery-only.                                          |
| Root versus toolkit | The root MCP resource and a dedicated `/mcp/toolkits/<slug>` resource are distinct; toolkit routing scopes the catalog. Actual endpoint and approval URLs are protected and intentionally omitted.                                                                                                                 | Executor reference: `packages/hosts/cloudflare/src/mcp/agent-session-durable-object.ts` and `packages/plugins/toolkits/src/page.tsx`.                                                                                                      |
| Policy semantics    | Tools outside selected connection patterns resolve to `block`. For selected connections, ordered explicit policies resolve to `approve`, `require_approval`, or `block`; an absent explicit policy uses the plugin default.                                                                                        | Executor reference: `packages/plugins/toolkits/src/server.ts` and `packages/plugins/toolkits/src/server.test.ts`; official [Executor Policies](https://executor.sh/docs/concepts/policies).                                                |
| Credential boundary | Executor documents host-side downstream credential injection; agent/model sandbox code does not receive provider credentials. Executor API keys are account-level; Bundjil retains one operationally dedicated environment bearer while the toolkit URL/policy enforce capability scope.                           | Official [Executor Cloud](https://executor.sh/cloud) and current Executor auth/API-key source.                                                                                                                                             |

The direct MCP read-only probe used the existing personal discovery connection
only. `skills({ name: "execute" })` succeeded; a catalog inventory succeeded
after following its documented result envelope. It found 16 connected,
user-owned integrations, identified GitHub as a candidate, and excluded
Executor core management from the candidate inventory. No downstream provider
tool was called. No raw MCP response, protected URL, credential, prompt,
generated code, provider record, or provider result is retained here.

#### Candidate Authority Inventory

**Owner:** Bundjil `apps/agent`, acting through a future isolated Preview
Executor toolkit. Live catalog search confirmed the operation names below
without calling GitHub. The toolkit selects only these four operations from one
user-owned GitHub connection; it does not select a connection-wide wildcard.
This is accepted policy intent, not yet provisioned authority.

| Sanitized remote operation | Category            | Policy             | Rationale                                                                                                                          |
| -------------------------- | ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `list_pull_requests`       | Read-only           | `approve`          | Initial Preview triage capability; lists pull requests without GitHub state change.                                                |
| `search_pull_requests`     | Read-only           | `approve`          | Initial Preview triage capability; searches pull requests without GitHub state change.                                             |
| `pull_request_read`        | Read-only           | `approve`          | Initial Preview triage capability; reads one pull request without GitHub state change.                                             |
| `add_issue_comment`        | Reversible mutation | `require_approval` | Selected only for one disposable Preview browser pause/decision/resume proof. It is not approved for the first Production toolkit. |

Every other GitHub operation, including create, update, review write, comment
reply, branch update, Copilot review request, merge, delete, repository/admin,
credential/account, billing, access-control, webhook, deployment, or other
state change, is unselected and therefore `block`. Every other integration is
also unselected and `block`. No broad wildcard is allowed. Executor core tools
for toolkit, policy, key, credential, and connection management are excluded
from the selected patterns, so Bundjil cannot enlarge its own authority.

#### Accepted-For-Review Module And Helper Budget

Task 1 adds no source module or helper. This is the maximum task-2 budget;
anything else requires a parent SPEC/plan update before implementation.

| Module or abstraction                         | Owner and reason                                                                                                          | Expected call sites                          | Direct test                                                                            | Decision                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/agent/agent/lib/executor/config.ts`     | `apps/agent`; app-specific Effect Config loading, redacted bearer, and validation of HTTPS toolkit browser-mode endpoint. | Future `agent/connections/executor.ts` only. | `apps/agent/test/executor-config.test.ts` using deterministic ConfigProvider fixtures. | Retain only if endpoint and token loading share tested policy; an in-module ConfigProvider Layer is allowed, but no separate schema/error/service/layer/mapper/helper module. |
| `apps/agent/agent/connections/executor.ts`    | `apps/agent`; thin Eve authored MCP definition using the public API and exact `skills`/`execute`/`resume` allowlist.      | Eve connection discovery only.               | `apps/agent/test/executor-connection.test.ts` with no live network.                    | Required framework boundary; no custom MCP client, proxy, SDK wrapper, DTO mirror, or pass-through service.                                                                   |
| `apps/agent/test/executor-config.test.ts`     | App test ownership.                                                                                                       | Test runner only.                            | Itself.                                                                                | Retain only with `config.ts`.                                                                                                                                                 |
| `apps/agent/test/executor-connection.test.ts` | App test ownership.                                                                                                       | Test runner only.                            | Itself.                                                                                | Retain only with `executor.ts`.                                                                                                                                               |

No new package, dependency, barrel, `schemas.ts`, `errors.ts`, Context service,
standalone service/Layer module, factory, helper, custom MCP client, proxy, DTO
mirror, generic module, or frontend file has a current boundary. Those are
rejected from task 2. `ConfigProvider.layer(...)` may be retained inside
`config.ts` because it supplies Effect Config at the executable adapter/test
edge; it must not become a pass-through service abstraction. The architecture
review agrees with `docs/architecture/effect-patterns.md` and
`docs/architecture/repo-structure.md`: this provider boundary is Eve/app-owned,
fallible config policy belongs in Effect at the consumer edge, and Executor's
dynamic remote schemas remain remote.

#### Task 2 Delegation Contract

Delegate exactly `implement-effect-config-and-eve-mcp-connection` from the
task ledger after parent acceptance. The one-task prompt must include this:

> Implement only task 2 for `/Users/cooper/Projects/bundjil`. Read and follow
> `AGENTS.md`, `docs/product-specs/executor-mcp-connection.md`, the exact task
> object in `docs/product-specs/executor-mcp-connection.tasks.json`, this plan,
> and all named architecture docs. File ownership is app-only:
> `apps/agent/agent/lib/executor/config.ts`,
> `apps/agent/agent/connections/executor.ts`, and direct tests. The accepted
> budget is exactly the two production modules and two test modules above; do
> not add a package, dependency, SDK, proxy, custom MCP client, DTO mirror,
> generic helper, mapper, wrapper, service, Context tag, standalone service or
> Layer module, factory, barrel, or separate schemas/errors module. Use Effect
> Config, Schema-derived values, Redacted, and tagged sanitized errors only for
> a real handled config boundary; an in-module ConfigProvider Layer is allowed
> only to supply that Config at the executable adapter/test edge. Use
> deterministic `@effect/vitest` fixtures and linear Effect control flow.
> Use public `defineMcpClientConnection` only, allow exactly `skills`,
> `execute`, and `resume`, reject root/non-HTTPS/non-toolkit and
> missing/unknown/model/native/legacy model-resume endpoints, and retain no
> protected URL, key, header, prompt, raw MCP payload, execution code, or
> provider data. No live Executor, Vercel, Sendblue, model, or public-network
> call. No frontend file is in scope: React, route, visible text, or URL-state
> need stops for a separate frontend SPEC with highest-parent composition and
> leaf-owned data, commands, and states. Run focused checks plus JSON
> validation, formatting/lint as applicable, `git diff --check`, and
> secret/protected-URL scans. Report sanitized evidence only; do not
> self-approve parent audits, change ledger acceptance, commit, push, provision,
> or mutate provider state.

#### Parent Acceptance Audits

1. **Ownership and call graph:** accepted after inspecting Eve's public MCP
   definition and Executor's host/toolkit sources plus the live personal MCP
   surface. The supported path is exactly `apps/agent -> Eve native MCP client
-> isolated Executor toolkit`; no shared package, SDK, proxy, custom MCP
   client, remote DTO mirror, or second policy engine is justified. The first
   Preview authority is accepted as three exact GitHub PR read operations and
   one browser-gated disposable comment operation; every other operation and
   integration remains unselected and blocked.
2. **Implementation quality and helper admission:** accepted after correcting
   two findings from the first review: operation groups were replaced with an
   operation-level inventory, and the budget now distinguishes an admitted
   in-module `ConfigProvider` Layer from a forbidden pass-through service/Layer
   abstraction. Task 1 adds no source helper. Task 2 has a four-file maximum,
   with each production module directly tested and no speculative module.
3. **Verification and evidence:** accepted after a parent read-only
   `mcp__executor_personal` guidance/catalog probe confirmed 16 connections and
   a GitHub connection without a downstream provider call, and local source
   review confirmed the exact three hosted MCP tools, model default,
   browser-only resume input, toolkit implicit deny, and policy actions. The
   first root check caught plan formatting; it was fixed before the clean
   rerun. Frozen install, root check, Knip, six package typechecks, all 185
   tests, JSON/diff/whitespace checks, and scoped leak scans pass. Browser and
   state-changing proof were intentionally not run in this read-only task.

#### Task 1 Verification Record

- `jq empty docs/product-specs/executor-mcp-connection.tasks.json`: passed.
- `bun run check`: passed; documentation formatting and lint reported no
  warnings or errors.
- `bun install --frozen-lockfile`: passed with no changes.
- `bun run verification`: passed after the formatter finding was corrected;
  six package typechecks and 185 tests passed.
- `git diff --check`: passed.
- Secret/protected-URL scan: passed with a scoped credential-pattern scan of
  this plan; it found no bearer header, API key assignment, protected toolkit
  or approval URL, token assignment, or secret-shaped key.
- Browser verification was not run by design. No approval page was opened and
  no state-changing operation was attempted.

### implement-effect-config-and-eve-mcp-connection

Status: Accepted 2026-07-14

The accepted write budget is limited to the two app-owned production modules
and two direct test modules recorded above, plus the minimum `turbo.json`
environment declaration if Eve's build proves it necessary. No provider or
public-network call is permitted in this task.

#### Worker Implementation Record

Changed files:

- `apps/agent/agent/lib/executor/config.ts`: canonical endpoint/config Schemas,
  sanitized tagged config errors, named endpoint/key loading effects, and the
  executable ConfigProvider Layer.
- `apps/agent/agent/connections/executor.ts`: public Eve MCP definition with
  app principal, runtime-only Redacted bearer conversion, and the exact three
  tool allowlist.
- `apps/agent/test/executor-config.test.ts`: injected ConfigProvider coverage
  for valid, malformed, missing, and redacted configuration.
- `apps/agent/test/executor-connection.test.ts`: public definition assertions
  plus isolated child-process import and runtime bearer-adapter proof.
- `turbo.json`: `BUNDJIL_EXECUTOR_MCP_URL` is supplied to the agent build and
  test tasks because both execute `eve build`. The API-key name is deliberately
  absent because build does not resolve it.

| Candidate                                                      | Owner/reason                                    | Concrete call sites                                  | Direct test                              | Decision                                   |
| -------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `ExecutorMcpEndpoint` / config operations                      | App-owned configuration and security boundary.  | `executor.ts` endpoint load and bearer resolver.     | `executor-config.test.ts`.               | Retain in `config.ts`.                     |
| `ExecutorConfigProviderLayer`                                  | Executable adapter edge only.                   | `executor.ts`.                                       | Build plus connection-definition import. | Retain in `config.ts`; no service wrapper. |
| `executor.ts` definition                                       | Required public Eve framework boundary.         | Eve discovery and direct definition test.            | `executor-connection.test.ts`.           | Retain.                                    |
| `runExecutorConnectionSubprocess`                              | Three executable-edge probes with isolated env. | URL-only import, missing-key, and runtime-key proof. | `executor-connection.test.ts`.           | Retain in the direct test only.            |
| `ExecutorConnectionTestError`                                  | Sanitized typed subprocess failure.             | `runExecutorConnectionSubprocess`.                   | `executor-connection.test.ts`.           | Retain in the direct test only.            |
| Other helper, mapper, wrapper, service, Layer, factory, barrel | No justified owner or call site.                | None.                                                | Not applicable.                          | Not added.                                 |

Focused evidence with a non-secret synthetic toolkit endpoint:

- `bun run --filter @bundjil/agent check-types`: passed.
- `bun run --filter @bundjil/agent test`: passed, 12 files and 55 tests.
- `bun run --filter @bundjil/agent build`: passed without an API key.
- Isolated subprocess proof imports with URL only, confirms `getToken` fails
  with the sanitized `loadApiKey` error when absent, then confirms it returns
  the synthetic child-environment key without emitting it.
- `bun run check`, `bun run knip`, and `bun run verification`: passed.
- `jq empty docs/product-specs/executor-mcp-connection.tasks.json` and
  `git diff --check`: passed.
- Compiled-output scan found no synthetic secret marker or bearer header.

Task-2 scope correction for parent review: Eve's documented public
`eve/connections` surface exports a connection definition, not an executable
connection client or test server. The task therefore adds no in-process MCP
stub, custom transport, deep runtime import, or scoped server resource.
Remote exact-tool discovery, bearer/auth failure, malformed/unavailable
failure, read execution, browser-paused executionId-only resume, and no
fallback move to the deployed Preview task, which uses `connection_search`
against the isolated Executor toolkit.

#### Parent Acceptance Audits

1. **Ownership and call graph:** accepted after rejecting the original local
   stub requirement. Eve 0.20.0 publicly exposes the authored definition but
   not its runtime MCP client harness, so Bundjil owns only Effect Config and
   the thin `eve/connections` adapter. The SPEC and ledger now require remote
   filtering, transport failure, read execution, and browser resume proof in
   the deployed Preview task rather than admitting a deep import, custom
   client/server, or second transport boundary.
2. **Implementation quality and helper admission:** accepted after multiple
   corrections. The final production code is two modules with named
   `Effect.fn` config operations, Schema endpoint policy, sanitized tagged
   errors, Redacted credential handling, one ConfigProvider Layer, and adapter-
   edge runtime execution. The subprocess proof uses `Match` and Effect v4
   `Effect.callback` with interruption cleanup; machine-specific execution,
   discarded output, direct environment reads, Promise wrappers, unnecessary
   conversions, and a meaningless marker were removed. Every retained helper
   is in the inventory and owns a tested boundary.
3. **Verification and evidence:** accepted after parent-focused and root
   reruns. URL-only import and Eve build pass without an API key; missing-key
   and supplied-key adapter probes pass without output leakage. Agent
   typecheck, 55 tests, and build pass. Ultracite/Oxlint report zero findings,
   Knip is clean, six package typechecks and all 189 repository tests pass,
   and JSON, diff, changed-file, known-secret, and compiled-output leak scans
   pass. No provider, model, public-network, or frontend operation occurred.

### provision-isolated-preview-toolkit-and-credentials

Status: Accepted 2026-07-15

#### Provisioning Surface Readback

- Codex MCP configuration identifies the pre-existing personal Executor
  organization separately from the Tilt Legal organization. The personal
  bearer remains the discovery/bootstrap credential and was not replaced or
  repurposed. A redundant organization created while that identity was
  misread contained only this rollout's transient objects and was fully
  removed before personal-org provisioning continued.
- Typed Executor API readback confirms one user-owned `Bundjil Preview`
  toolkit. It selects exactly one existing user-owned connection pattern: the
  personal GitHub connection. Executor core tools, the root catalog, and all
  other connections are absent.
- Five explicit rules are present in evaluation order: three approved
  read-only pull-request operations, one browser-approval comment operation,
  and one final wildcard block. The wildcard was initially auto-inserted at
  highest precedence by the Toolkit API; source inspection found the ordering
  defect before credential acceptance, and explicit fractional positions now
  place exact rules before the final implicit-deny rule.
- One first-attempt dedicated key exposed its one-time value in an automation
  diagnostic. It was immediately revoked and never stored or configured. A
  later clean key became unrecoverable when the OS removed its temporary copy
  while 1Password was locked, so the credential was rotated again rather than
  weakening storage policy. The final dedicated key was stored in 1Password
  before Vercel was overwritten and direct MCP proof was rerun.
- The personal `bundjil-agent` Vercel project now contains Preview-only
  `BUNDJIL_EXECUTOR_MCP_URL` and `BUNDJIL_EXECUTOR_API_KEY` variables. Creation
  evidence records the URL as encrypted/non-sensitive and the key as
  sensitive/write-only. During that Preview task, Production was not queried
  or changed.
- A direct Streamable HTTP MCP handshake using the replacement key succeeded
  against the protected browser-elicitation toolkit endpoint. Tool discovery
  returned exactly `skills`, `execute`, and `resume`; no downstream provider
  operation was run.
- The existing personal-vault `Executor` item now owns a `Bundjil Preview`
  section with concealed `Toolkit URL` and `API Key` fields. Reveal-to-file
  readback matched both final values without printing them. All mode-`0600`
  files, browser/runtime key variables, and browser/system clipboards were
  removed or cleared after proof.
- No protected URL, API key, authorization header, raw MCP payload, provider
  record, or downstream result is retained in this plan.

#### Verification To Date

- `jq empty docs/product-specs/executor-mcp-connection.tasks.json`: passed.
- Agent strict typecheck: passed.
- Agent Eve build and 55 tests: passed with a non-secret synthetic endpoint
  on the approved Executor host and no API key.
- `bun run verification`: passed with the same synthetic endpoint. Ultracite
  and Oxlint report zero findings, Knip is clean, all six package typechecks
  pass, and all 189 repository tests pass.
- Replacement-key and protected-endpoint scans across tracked and hidden
  repository files found no match. Vercel readback lists both variable names
  only in Preview. Direct MCP readback remains limited to the three accepted
  orchestration tools.
- The initial synthetic verification endpoint intentionally used an
  unapproved host and was rejected by `ExecutorMcpEndpoint`; rerunning with a
  synthetic toolkit path on `executor.sh` passed. This confirms the host
  allowlist rather than a test or build regression.
- Post-storage readback, cleanup, and the three parent acceptance audits pass.

#### Helper Admission

| Candidate | Owner/reason                           | Concrete call sites | Direct test     | Decision                                                      |
| --------- | -------------------------------------- | ------------------- | --------------- | ------------------------------------------------------------- |
| None      | Task 3 is provider configuration only. | None.               | Not applicable. | No committed helper, script, module, service, or Layer added. |

#### Parent Acceptance Audits

1. **Ownership and call graph:** accepted. Executor owns the existing personal
   GitHub connection, dynamic schemas, toolkit filtering, policy evaluation,
   approval, and execution. Bundjil owns only the dedicated toolkit endpoint
   and bearer through app Config and Preview Vercel variables. The Codex
   discovery key, Tilt Legal organization, Production, GitHub credential, root
   catalog, and authority-management operations remain outside app authority.
2. **Implementation quality and helper admission:** accepted. This provider-
   only slice adds no code, package, SDK, proxy, script, service, Layer, DTO,
   helper, suppression, dependency, or configuration weakening. Typed APIs and
   mode-`0600` one-off procedures handled provisioning. Exposed or
   unrecoverable credentials were rotated instead of reused; final values are
   concealed in 1Password and sensitive/target-scoped in Vercel.
3. **Verification and evidence:** accepted. Readback proves one user-owned
   toolkit, one personal GitHub pattern, three ordered approved reads, one
   browser-gated comment, and final wildcard block. 1Password values matched,
   Vercel writes target Preview only, and MCP discovery returns exactly
   `skills`, `execute`, and `resume` without a downstream call. Agent build and
   55 tests, zero lint findings, clean Knip, six typechecks, all 189 repository
   tests, JSON/diff checks, cleanup checks, and secret/protected-URL scans pass.

### adopt-temporary-chat-model-approval

Status: Accepted 2026-07-15

This new ordered implementation slice changes only the existing app-owned
Executor endpoint policy, direct tests, agent instructions, and documentation.
It accepts exactly one explicit `elicitation_mode=model` or
`elicitation_mode=browser`, continues to reject every implicit, duplicate,
native, legacy, unknown, root, or malformed form, and adds no client, proxy,
SDK, package, persistence boundary, service, Layer, helper module, or UI.

The temporary chat protocol is intentionally two-turn: the paused `execute`
turn asks the authenticated owner for approve, decline, or cancel and stops at
`session.waiting` without `resume`; only a later unambiguous continuation from
the same authenticated or allowlisted owner may submit one decision for the
conversation's single pending execution. Prompt/provider/quoted/forwarded
content, ambiguous language, non-owner messages, missing or multiple pending
executions, settled executions, and replay never authorize `resume`.

This is an instruction-level control rather than a hard authorization
boundary. Destructive and authority-management operations remain blocked by
the Executor toolkit, the first Production proof remains read-only, and
browser mode remains the rollback target after a clean Preview proves the
hosted decision page and repeats approve, decline, replay, and Sendblue proof.

The task receives exactly one Terra Medium implementation subagent after this
SPEC revision is committed. Parent acceptance still requires the three-pass
ownership/call-graph, Effect/helper-admission, and verification/evidence audit.

#### Accepted Implementation Record

- `agent/lib/executor/config.ts` now owns `ExecutorElicitationMode`, the
  canonical Effect Schema for explicit `model` or `browser`. The endpoint
  policy still rejects missing, duplicate, native, unknown, legacy, root,
  transport, host, port, userinfo, fragment, and extra-query forms.
- `agent/instructions.md` now requires the first paused turn to stop without
  `resume`, then permits exactly one later direct owner decision for one
  matching pending execution. Ambiguous, quoted, forwarded, provider, tool,
  third-party, non-owner, missing, multiple, mismatched, settled, and replayed
  state fails closed; ordinary resume uses default empty content and no retry.
- Existing config and connection tests cover both supported modes, rejected
  modes/forms, and the exact instruction contract. Root/app READMEs and Eve,
  repo-structure, and testing architecture docs disclose the temporary weaker
  boundary, blocked authority, read-only Production gate, and browser rollback.

#### Helper Admission

| Candidate                                                                                                     | Owner/reason                                                           | Concrete call sites                        | Direct test                                | Decision                  |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ------------------------- |
| `ExecutorElicitationMode`                                                                                     | App-owned endpoint security policy.                                    | `ExecutorMcpEndpoint` and its direct test. | Both accepted values and native rejection. | Retain.                   |
| Instruction assertion                                                                                         | Direct policy-document proof at the existing Eve connection test edge. | One test in `executor-connection.test.ts`. | The assertion itself.                      | Retain inline; no helper. |
| Approval service, persistence, state machine, MCP client, proxy, SDK, Layer, mapper, wrapper, factory, module | No accepted owner or runtime need.                                     | None.                                      | Not applicable.                            | Not added.                |

#### Parent Acceptance Audits

1. **Ownership and call graph:** accepted after parent diff inspection. The
   production path remains `apps/agent -> Eve native MCP -> isolated Executor
toolkit`; only existing app-owned Config and instructions changed. Eve owns
   turn continuity, Executor owns paused state/policy, and no new runtime or UI
   boundary exists.
2. **Implementation quality and helper admission:** accepted. The single new
   Schema is canonical, directly used, and tested; the existing named flat
   Config Effects, sanitized tagged errors, Redacted bearer, and adapter-edge
   runtime remain unchanged. No helper sprawl, unsafe cast, DTO mirror, raw
   JSON helper, process environment read, broad error collapse, concurrency,
   retry, suppression, dependency, or config weakening exists.
3. **Verification and evidence:** accepted after parent-focused strict
   typecheck, 56 agent tests with explicit model mode, explicit browser build,
   and full verification with explicit model mode. Type-aware Ultracite/Oxlint,
   Knip, six package typechecks, and all 194 tests pass; JSON/diff and scoped
   output/diff leak scans pass. No provider or Vercel mutation, Sendblue send,
   browser action, or frontend change occurred.

### prove-preview-eve-executor-and-chat-resume

Status: Accepted 2026-07-15

The browser evidence below is retained as historical diagnosis. It no longer
blocks the revised task, which must deploy explicit model mode and prove a
first-turn pause with no `resume`, later-turn approve and decline, ambiguity,
non-owner and replay rejection, and the same two-turn flow through Sendblue.

#### Personal Organization And Initial Preview Diagnosis

- The accepted Executor authority remains in the personal organization at
  `executor.sh/personal-3548`. The Tilt Legal organization is not used by the
  Bundjil Preview toolkit, key, Vercel variables, or direct proof.
- The first clean Preview deployment reached the Codex subscription-backed
  model through the private proxy after the Preview proxy URL and internal
  token were aligned. Direct proxy proof passed authenticated streaming,
  unauthenticated and invalid-token rejection, live health, completion, and
  leak checks.
- Authenticated Eve runs then remained active without emitting a tool call.
  Source review found the actual protocol gap: the existing Codex request
  mapper retained only text messages and omitted Chat Completions `tools`,
  `tool_choice`, assistant function-call history, and tool outputs. The stream
  mapper retained only text deltas and omitted Responses function-call events.
  Eve therefore advertised its intent in instructions but the model never
  received the `connection_search` definition.

#### Codex Tool Bridge Correction

The existing `packages/codex-oauth` protocol boundary now owns the complete
translation without changing Eve, adding another proxy, or mirroring Executor
schemas:

1. Canonical Effect Schemas decode Chat Completions function definitions,
   forced or automatic tool choice, assistant tool calls, tool outputs, and
   OpenAI-compatible tool-call chunks.
2. `CodexRequestMapper.toCodexResponses` maps system instructions, user and
   assistant text, function-call history, function-call outputs, flat Responses
   function tools, and tool choice in one linear named Effect operation. Tools
   set `parallel_tool_calls: false` so approval-gated execution remains
   sequential.
3. `CodexStreamMapper.toOpenAICompatibleStream` decodes Responses output-item
   and function-argument events through Effect Schema, emits Chat Completions
   tool-call deltas, and terminates with `tool_calls` or `stop` before `[DONE]`.
   Malformed function-call events fail closed with the existing sanitized
   tagged stream error.
4. Provider tests prove exact tool-definition and conversation-history
   mapping, function-call streaming, final finish reasons, text-stream
   compatibility, and malformed-event rejection. No raw provider payload,
   prompt, protected URL, credential, or downstream result is retained.

#### Corrective Slice Helper Admission

| Surface                                                                            | Owner/reason                                                                                             | Concrete call sites                                                 | Direct proof                                                | Decision                                                                                              |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Canonical tool and function-event Schemas in `packages/codex-oauth/src/schemas.ts` | Existing Codex protocol owner; required to decode both wire formats without DTO mirrors or unsafe reads. | Existing request and stream mappers plus proxy input/output codecs. | `packages/codex-oauth/test/codex-direct-provider.test.ts`   | Retain in the canonical schema owner.                                                                 |
| Existing `CodexRequestMapper` service                                              | Existing OpenAI-compatible Chat Completions to Codex Responses request boundary.                         | `CodexDirectProvider` only.                                         | Exact request mapping tests.                                | Extend the existing operation; no new helper, service, Layer, or module.                              |
| Existing `CodexStreamMapper` service and `decodeCodexStreamLine` boundary          | Existing Codex Responses SSE to OpenAI-compatible SSE boundary.                                          | `CodexDirectProvider` only.                                         | Text, function-call, completion, and malformed-event tests. | Extend the existing operation and retain the already-admitted line decoder; no new wrapper or helper. |

#### Corrective Slice Review And Verification

1. **Ownership and call graph:** reviewed. The production path remains Eve
   `connection_search` to the OpenAI-compatible model, private Codex proxy, and
   Codex Responses, with Executor's dynamic schema still discovered through
   Eve. Only the owning protocol package changed; no app-local mapper, second
   policy engine, provider fallback, or direct Executor client was added.
2. **Implementation quality and helper admission:** reviewed. Primary mapping
   remains one named linear `Effect.fn` per direction with canonical Schema
   decode/encode and existing tagged errors. The changed files contain no raw
   JSON helper, unsafe cast, `any`, non-null assertion, DTO mirror,
   `process.env`, `Object.values`, `Object.entries`, `switch`, Context service,
   Layer, standalone helper module, suppression, or helper sprawl.
3. **Verification coverage:** reviewed. Codex package build and strict
   typecheck pass; all 105 package tests and all 55 agent tests pass. Root
   Ultracite/Oxlint is clean, Knip is clean, all six package typechecks pass,
   and the repository gate passes all 192 tests with a synthetic Executor
   config. Diff and prohibited-pattern scans pass. A new clean immutable
   Preview deployment and live Eve tool-call proof remain required before this
   task can be accepted.

#### Clean Preview Credential And Read Proof

- The current Preview definition still targets the Personal organization at
  `executor.sh/personal-3548`, the dedicated `bundjil-preview` toolkit, and
  browser elicitation. The Tilt Legal toolkit/root endpoint is not configured
  in Bundjil.
- Diagnostic key rotation proved write-only Vercel delivery but did not change
  the hosted approval outcome. The original accepted Task 3 Preview key remains
  valid and was restored to the Preview-only Sensitive Vercel variable; no
  Production variable changed. Vercel intentionally returns an empty value for
  Sensitive variables, so acceptance uses authenticated runtime behavior
  rather than an impossible readback-value comparison.
- Final ordinary, non-forced retained-key Preview deployment
  `dpl_Fz4wDdZpc1i2dof8SimKUCerqdCb` is Ready. Vercel's authenticated
  deployment readback records CLI source plus explicit Bundjil source metadata
  for pushed commit `ff8ddfe94d33dbfc96dcbb98315c1294df2bda09` on `main`.
  The hosted build restored only dependency caches, force-executed the
  non-cacheable agent task, and regenerated `.vercel/output` through
  `eve build`.
- A fresh authenticated session on that exact deployment completed
  `connection_search`, `executor__skills`, and three sequential
  `executor__execute` calls for a read-only public GitHub inspection. The
  replay contained five requested/result pairs, `message.completed`,
  `turn.completed`, and `session.waiting`, with no failure event. Exact-value
  and generic credential scans across the deployment log, session response,
  and 469-event replay returned zero hits.
- A separate direct Streamable HTTP probe using the dedicated key returned
  HTTP 200, preserved an `Mcp-Session-Id`, and listed exactly `execute`,
  `resume`, and `skills`. Sanitized stream scans found no bearer, key, refresh,
  access-token, or protection-bypass marker.
- An earlier fully cached credential-only redeploy replayed `eve build` logs
  without materializing the Vercel Build Output API tree, so Vercel rejected
  the build after falling back to `public`. The root Turbo contract now marks
  `@bundjil/agent#build` non-cacheable; `eve build` owns deployment-local
  `.vercel/output` materialization and sandbox prewarm. The source-correlated
  non-forced deployment above closes this corrective deployment finding.

#### Hosted Browser Approval Regression

- A reversible Eve request reached `user_approval_required` for the accepted
  browser-gated GitHub issue-comment operation and returned an HTTPS Executor
  approval URL plus execution id. No `resume` action was submitted and no
  GitHub write occurred.
- Opening the URL while the Executor shell was visibly scoped to Personal
  transitioned immediately to "This paused execution is no longer available"
  before any approve, decline, or cancel decision. Reloading after explicitly
  selecting Personal produced the same result.
- Two additional pauses from the source-correlated Preview deployment repeated
  the same outcome. Each emitted URL was HTTPS, hosted on `executor.sh`, scoped
  to `/personal-3548/resume/`, matched its opaque execution id, carried exactly
  one non-empty `mcp_session_id`, and had no extra query input. The authenticated
  page initially rendered disabled Cancel, Decline, and Approve controls, then
  hydrated from a stale Tilt Legal shell label to Personal and replaced the
  controls with the unavailable message. Browser diagnostics also recorded
  React hydration errors. Reissuing a pause while the tab was already settled
  on Personal did not change the result, excluding an incorrect operator
  organization selection or a one-off expired link. GitHub readback confirmed
  neither unique proof marker was posted.
- The same outcome reproduced outside Eve through a direct MCP client that
  retained the server-issued `Mcp-Session-Id` across initialize, initialized,
  and execute. It also reproduced with the already configured
  `executor_personal` credential. This excludes the Codex bridge, Eve tool
  history, Vercel credential delivery, and lost MCP transport identity as the
  immediate cause.
- The third consecutive goal continuation repeated the direct proof with a
  newly initialized session and the accepted dedicated Preview key. Initialize
  returned 200, initialized returned 202, the selected browser-gated operation
  returned 200 with `user_approval_required`, and the canonical URL-shape
  predicates all passed. The authenticated page again replaced its initially
  rendered disabled decision controls with the unavailable state after
  hydration. GitHub readback found zero matching proof comments.
- Executor PR
  [#1317](https://github.com/UsefulSoftwareCo/executor/pull/1317) documents the
  exact hosted symptom: the approval handler used `idFromString` while MCP
  sessions were created with `idFromName`, so the page queried a different
  Durable Object and reported the execution unavailable. Current ignored
  source contains the canonical helper and regression test, but the live
  hosted behavior still reproduces the pre-fix failure.
- The strict blocked-audit threshold was satisfied after the same external
  hosted lookup failure prevented acceptance in three consecutive goal turns.
  Browser approve, decline, settled-link replay, and Sendblue browser-decision
  evidence remain intentionally unaccepted. The 2026-07-15 SPEC revision uses
  explicit model mode as a user-accepted temporary workaround; a Bundjil-owned
  MCP client/proxy and source-only acceptance remain forbidden. Browser mode
  can return only after `executor.sh` demonstrates a working name-addressed
  approval lookup through the separate Preview rollback gate.

#### Accepted Model-Mode Preview Proof

- The isolated Preview Codex profile was reauthenticated on a trusted local
  callback, stored refresh-capable and encrypted in the Preview-only Upstash
  namespace, and read successfully by the redeployed private proxy. Its rotated
  cipher and key id are stored in a dedicated Personal 1Password record; a
  concealed readback matched both ephemeral source values. Production profile,
  cipher, storage, and Vercel variables were not changed.
- Proxy deployment `dpl_8EMpMnmzxHR1YvFyxuXAsw23HgTo` and agent deployment
  `dpl_AiMMmiMX9wMKxYjJquiCnrExx5N7` are Ready Preview deployments. Vercel API
  readback records `main`, `crcorbett/bundjil`, and pushed source SHA
  `440656d88db9a7a98cc044ba618d5fcdae9a2bf5` for both. The agent reports model
  `bundjil-codex-proxy/gpt-5.5`; the protected proxy reports live/ready and
  completes authenticated SSE with the terminal marker.
- On that exact agent deployment, the authenticated Eve proof reached one
  `waiting_for_interaction` result and `session.waiting` with zero `resume`
  requests and zero downstream comments. A later direct owner approval called
  `executor__resume` exactly once, completed, created exactly one disposable
  comment, and the operator deleted it after readback. Separate sessions proved
  decline with one resume and no write, ambiguous and already-settled replies
  with zero resume, and a request referring to multiple pending actions with
  zero resume followed by explicit clarification and a single decline.
- On the exact source-correlated deployment, a signed allowlisted Sendblue
  request returned `202` and delivered the pending-approval reply. A correctly
  signed non-owner request returned the documented ignored `200` and created no
  write. The later owner decision returned `202`, produced exactly one
  disposable comment, and delivered the completion reply. Replaying the same
  inbound handle returned `200`, produced no second write or outbound reply,
  and the operator deleted the disposable comment after evidence capture.
- Executor policy readback contains only the pre-existing Personal Gmail read
  approval; no disposable GitHub allow rule or management authority was added.
  The selected GitHub mutation therefore retained Executor's approval gate,
  while unselected operations remained blocked by toolkit scope. At the time
  of this Preview proof, no Production Executor toolkit, key, URL, policy, or
  write authority was provisioned.
- Final deployment logs contained 46 agent records and 14 proxy records, zero
  5xx responses, zero exact secret hits, zero OAuth/credential marker hits, and
  zero sensitive environment-name hits. All retained live response, stream,
  log, and provider material was mode `0600` and removed after sanitized
  inspection. An earlier stream capture was briefly created with the process
  default mode, immediately corrected to `0600`, excluded from retained
  evidence, and removed; every subsequent capture used an explicit restrictive
  umask or chmod.

The first proxy proof helper attempt returned blocked because the retained
Preview deployment is protected and that historical helper does not send the
Vercel automation-bypass header. Acceptance therefore used an equivalent
private black-box probe with the independent bypass and proxy bearer, retained
only statuses and booleans, and deleted the response body. Production
promotion must either extend the existing helper at its owning boundary or
retain this explicit protected-probe procedure; it must not disable deployment
protection.

#### Model-Mode Preview Parent Acceptance Audits

1. **Ownership and call graph:** accepted. The exact source-correlated Preview
   path remains the agent through Eve native MCP to the dedicated Personal
   Executor toolkit. Model traffic remains the agent through the private Codex
   proxy to the Codex subscription. Eve owns turn continuity, Executor owns
   paused execution and policy, and Sendblue owns provider delivery. No Bundjil
   approval client, proxy, state store, provider fallback, or Production
   authority was added.
2. **Implementation quality and helper admission:** accepted. Task 5 changes
   only sanitized documentation and evidence. The previously accepted
   canonical Effect Config Schema, `Redacted` key, named linear operations,
   tagged errors, adapter-edge runtime, and model instructions are unchanged.
   No helper, mapper, wrapper, hook, script, service, `Layer`, factory, barrel,
   DTO mirror, raw JSON reader, `process.env`, cast, suppression, UI component,
   or speculative abstraction was added.
3. **Verification and evidence:** accepted. The exact pushed Preview agent and
   proxy deployments are Ready and source-correlated. Protected live Codex
   streaming, Eve discovery, first-turn pause, owner approve and decline,
   ambiguous/settled/multiple rejection, one-resume limits, Sendblue owner
   continuation, non-owner rejection, provider delivery, replay suppression,
   policy readback, encrypted profile storage, restrictive temporary-file
   handling, and zero-leak/zero-5xx log scans pass. Root type-aware lint and
   formatting report zero findings, Knip is clean, all six strict typechecks
   pass, and all 194 tests pass with a nonsecret synthetic model-mode Executor
   fixture.

#### Deployment Cache Corrective Slice Review

| Surface                               | Owner/reason                                                                                                      | Concrete call sites                                                     | Direct proof                                                                                                                          | Decision                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `@bundjil/agent#build` `cache: false` | Root Turbo task contract; `eve build` owns deployment-local Build Output API materialization and sandbox prewarm. | Agent local builds, Vercel Preview builds, and later Production builds. | Turbo dry-run cache state, focused agent build/tests, full repository verification, and source-correlated non-forced Vercel redeploy. | Retain on the existing task; no script, helper, wrapper, service, Layer, factory, or module was added. |

1. **Ownership and call graph:** reviewed. The cache change is scoped only to
   the existing agent build task. Dependency package builds remain cacheable,
   no environment variable moved to a global/pass-through scope, and Executor,
   Eve, Vercel, Sendblue, and app/package ownership boundaries are unchanged.
2. **Implementation quality and helper admission:** reviewed. The executable
   diff is one explicit task-policy field. It adds no helper, command wrapper,
   package, dependency, suppression, ignore, unsafe type, JSON boundary,
   environment reader, Effect service, or alternative deployment path. The
   adjacent operator and architecture docs explain the constraint at the
   owning surfaces.
3. **Verification coverage:** accepted for this corrective slice. Turbo
   dry-run reports local and remote cache disabled for
   `@bundjil/agent#build`; agent strict typecheck and all 55 agent tests pass.
   Root verification reports zero Ultracite/Oxlint findings, clean Knip, all
   six strict package typechecks, and all 193 tests passing. JSON validation,
   formatting, diff checks, and sanitized live retained-key read proof pass. A
   normal non-forced deployment from pushed SHA `ff8ddfe` reached Ready,
   force-executed the agent build task, regenerated the Build Output API tree,
   and completed the authenticated read path without credential leakage. This
   closes only the deployment-cache corrective slice. Its historical browser
   and Sendblue gates are superseded by the revised explicit-model Preview task.
