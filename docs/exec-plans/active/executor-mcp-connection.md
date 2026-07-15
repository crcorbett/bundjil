# Executor MCP Connection Implementation Plan

Status: In progress

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
variables, and mode-`0600` ephemeral material for live work. Remove temporary
material after each proof.

## Ordered Tasks

1. `freeze-executor-eve-contract-and-policy-inventory`: accepted.
2. `implement-effect-config-and-eve-mcp-connection`: accepted.
3. `provision-isolated-preview-toolkit-and-credentials`: accepted.
4. `prove-preview-eve-executor-and-browser-resume`: pending.
5. `promote-production-document-and-audit`: pending.

## Current Baseline

- The SPEC and five-task ledger are Draft and uncommitted at rollout start.
- The repository is on `main` and otherwise clean against `origin/main`.
- Eve owns the production MCP client boundary; Executor owns hosted tool
  schemas, toolkit policy, downstream credentials, browser approval, and
  resume state.
- Preview now has an accepted dedicated Executor toolkit/key and target-scoped
  Vercel variables. Production remains unprovisioned by this rollout.
- No Bundjil frontend work is in scope.

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
| Credential boundary | Executor documents host-side downstream credential injection; agent/model sandbox code does not receive provider credentials. Bundjil will retain only its future dedicated toolkit bearer in app config.                                                                                                          | Official [Executor Cloud](https://executor.sh/cloud) and source above.                                                                                                                                                                     |

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
  sensitive/write-only. Production was not queried or changed.
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
