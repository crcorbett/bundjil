---
document_type: product-spec
lifecycle: current
authority: canonical
owner: bundjil-product-owner
implementation_owner: bundjil-effect-architecture-owner
verification_owner: bundjil-verification-owner
last_reviewed: 2026-08-09
review_trigger: Codex transport, SSE streaming, Agent model config, Eve build output, Vercel deployment policy, Channel provider, or proof lifecycle change
task_ledger: runtime-boundary-streaming-and-deployment-proof.tasks.json
---

# Runtime boundary, streaming, and deployment proof improvements

## Status and decision

This SPEC is the current accepted improvement set derived from three completed
analysis workstreams and fresh repository/provider readback. It authorises the
repository, Vercel, Photon, Sendblue, credential-store, deployment, bounded
test-message, rollback, and cleanup operations expressly required by its task
ledger. It does not authorise unrelated resources, publication, package
release, broad credential rotation, or destructive provider operations.

The implementation will:

1. repair the clean Agent build-manifest proof against Eve 0.29.5 output;
2. keep Effect `HttpClient` private to the Codex package-owned client;
3. replace the buffered Codex SSE rewrite with an incremental, bounded Effect
   stream that propagates cancellation;
4. make Agent model configuration use owner-named Schemas and remove the
   production generic `fetch` callback seam;
5. make manual staged Vercel deployment the repository-enforced default for
   the Agent and Codex proxy, matching the target-owned promotion runbook;
6. reconcile current documentation and add regression oracles for the exact
   false greens; and
7. obtain claim-matched Preview and Production proof for accepted runtime and
   deployment requirements before closeout.

ChatSDK and Eve remain the reference runtime. Sendblue and Photon continue to
use their narrow custom channel adapters because they own provider-specific
signature verification, opaque identity, replay, typing, and delivery
semantics that ChatSDK does not currently supply as a Bundjil Effect contract.

## Evidence epoch

| Evidence                  | Exact observation                                                                                                                                        | Claim boundary                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Repository                | clean detached `HEAD` and fetched `origin/main` at `7ec2fd198d76e9809a2441fecd0faf3dba9197b1`                                                            | Starting source identity only.                                                  |
| Dependencies              | Bun `1.3.14`, Effect `4.0.0-beta.101`, Eve `0.29.5`, AI SDK peer resolution from the frozen lockfile                                                     | Installed APIs control implementation.                                          |
| Hosted CI                 | GitHub Actions CI run `31307868197` failed the same obsolete Agent manifest path seen locally                                                            | Hosted failure, not runtime failure.                                            |
| Vercel                    | Personal-scope `bundjil-agent` Production deployment `dpl_ewqr5pW1RBZZz54j6auxKuYecu93` is READY at the starting SHA; Git deployment creation is enabled | Current readback only; READY does not prove channels or accepted source policy. |
| Photon                    | authenticated inspect-only inventory: shared service, platform enabled, two shared users, one webhook, zero dedicated lines                              | No mutation and no delivery/replay claim.                                       |
| Production-channel review | source thread `019fe695-5d28-7df3-90c0-2d1f21f2a24b`                                                                                                     | Review input; proposals require current revalidation.                           |
| Photon replay review      | source thread `019fe695-d2d2-7ea1-89a4-8816db683584`                                                                                                     | Strict candidate-specific replay remains unproved.                              |
| Call-graph audit          | source thread `019fe696-115c-7eb3-a4a0-4df7620f3923` plus its validated report artifacts                                                                 | Five proposed findings; this SPEC records acceptance or rejection.              |

## Source-finding crosswalk

| Source finding or suggestion                                                                        | Decision                    | Reason and owner                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FINDING-101` obsolete `.eve/compile` manifest oracle                                               | Accepted                    | Eve 0.29.5 emits the tested manifest below `.output/.eve/compile`; direct Agent tests and hosted CI fail. The Agent build test owns the correction.                                                            |
| `FINDING-102` public raw `CodexResponsesFetch`                                                      | Accepted                    | A package-root service accepts `HttpClientRequest` and returns `HttpClientResponse`, contradicting the named-operation boundary. `CodexHttpClient` will own Effect HTTP directly.                              |
| `FINDING-103` fully buffered request/upstream/output SSE                                            | Accepted with bounded scope | Preserve the bounded request buffer, enforce its byte ceiling, and stream upstream frames incrementally with a bounded residual frame. Do not add a generic stream package.                                    |
| `FINDING-104` semantic `Config.url`, duplicated integer Schema, generic provider `fetch` dependency | Accepted                    | App-owned Schemas will back `Config.schema`; tests may stub the host fetch boundary without retaining a production callback parameter.                                                                         |
| `FINDING-105` stale proof and Alchemy lifecycle prose                                               | Accepted                    | Canonical proof and lifecycle owners already exist; add a cross-owner regression fixture.                                                                                                                      |
| Production report: Git main auto-deployed despite failed CI                                         | Accepted                    | Both Vercel apps will set `git.deploymentEnabled: false`; manual `--skip-domain` staging plus explicit promotion remains the runbook path.                                                                     |
| Production report: replace custom adapters with ChatSDK                                             | Rejected                    | Current Channel/Eve call graphs are already Eve-native and the adapters contain provider-specific security/durability behavior. Replacement would widen risk without removing a confirmed defect.              |
| Photon report: implement durable candidate-specific replay receipts now                             | Rejected as speculative     | Photon exposes neither delivery-attempt history nor a supported replay trigger, and Eve exposes no join that proves a replay caused no second provider admission. Strict replay remains an explicit non-claim. |
| Photon report: upgrade Spectrum `12.3.0` to `12.7.0`                                                | Rejected for this SPEC      | No incompatibility or accepted requirement depends on the version. Both Spectrum packages remain exactly co-pinned; a future upgrade needs its own compatibility evidence.                                     |

## Scope and design

### Clean build proof

The Agent packaging test will read the manifest from the supported generated
Build Output. The acceptance run removes generated output first and executes
the direct Agent test so Turbo cache replay from another worktree cannot count
as proof.

### Codex HTTP ownership

`CodexHttpClient` owns request Schema encoding, bearer/account headers, Effect
`HttpClient` execution, safe status translation, and upstream byte streaming.
The generic `CodexResponsesFetch` service, package-root export, runtime Layer,
and testing mock will be retired. Deterministic tests inject the standard
Effect `HttpClient` service at the Layer boundary.

Only domain operations remain public. The boundary audit will reject exported
raw Effect HTTP request/response signatures and exported generic `fetch`
callback properties in production source, with positive and adversarial
fixtures.

### Incremental bounded SSE

The request route may materialise the OpenAI-compatible JSON body only after a
content-length precheck and must reject an encoded body over 1 MiB. This is a
fixed route contract, not a caller-selectable option.

The upstream response remains an Effect `Stream<Uint8Array, ...>`. The mapper:

- decodes UTF-8 incrementally;
- preserves fragmented line boundaries;
- fails when a complete or residual SSE line exceeds 1 MiB;
- Schema-decodes each supported Codex event exactly once;
- carries function-call indexes in one stream-owned state value;
- emits each encoded OpenAI-compatible chunk as soon as its source event is
  available;
- appends the terminal finish chunk and `[DONE]` only when upstream completes;
- propagates upstream failure and downstream cancellation; and
- never logs, stores, or returns provider bodies outside the response stream.

There is no aggregate response byte cap: long valid responses must remain
streamable. The bounded frame residual is the memory control. Tests must cover
fragmentation, tool calls, oversize frames, slow upstream first-byte behavior,
failure, and cancellation.

### Agent model boundary

The Agent owns `AgentCodexProxyBaseUrl` and
`AgentModelContextWindowTokens` Schemas and uses their fields through
`Config.schema`. `loadAgentConfig` and `createAgentModel` no longer accept a
generic provider callback. Tests intercept the host fetch boundary only within
the test process and restore it after use.

### Deployment admission and live proof

Both app-owned `vercel.json` files disable Git-triggered deployments while
retaining their Git connection. Repository pushes must not create a new Vercel
deployment. Preview/Production rollout follows
`apps/agent/runbooks/deploy-promote.md` and the Codex proxy proof runbooks:

1. read current Personal-scope project, source, deployment, alias, environment
   names, and rollback candidates without reading secret values;
2. deploy exact pushed candidates with `--prod --skip-domain` where the
   runbook requires Production environment without alias movement;
3. prove proxy health/auth/incremental SSE and Agent health/build/channel route
   contracts on immutable candidates;
4. read Photon and Sendblue inventory before any provider write;
5. perform bounded live channel messages only after exact provider account,
   callback, sender, recipient, and Personal-versus-Tilt ownership are
   unambiguous;
6. promote stable aliases only when every accepted gate passes; and
7. read back deployment/source/alias/provider state and retain sanitized
   receipts plus tested rollback identities.

Provider acceptance, outbound dispatch, typing start/stop, handset delivery,
and strict replay are separate claims. Photon strict replay remains a safe
residual control and explicit non-claim if the provider still has no supported
candidate-specific oracle after the bounded readback.

## Requirement-to-proof crosswalk

| ID and accepted finding                                                                                                                  | Owning task                                                                                  | Direct observable and expected postcondition                                                                                                                              | False green rejected                                                                                             | Focused command/procedure and evidence owner                                                                                                  | Limitation or non-claim                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `RBS-001` / `FINDING-101`: direct clean Agent build proof passes against current Eve output.                                             | `repair-clean-agent-build-proof`                                                             | The supported `.output/.eve/compile` manifest carries the exact Photon runtime dependencies after fresh Node/Vercel builds.                                               | Root test/Turbo cache replay, an old generated manifest, or route-source inspection.                             | Remove Agent output; `bun run --filter @bundjil/agent test`; Agent build-proof receipt.                                                       | Does not prove a retained deployment contains the same output.                                |
| `RBS-002` / `FINDING-102`: no public raw Codex HTTP escape hatch remains.                                                                | `close-codex-and-agent-boundary-escapes`                                                     | Public exports expose domain operations only; `CodexHttpClient` consumes Effect `HttpClient` privately.                                                                   | Removing a barrel export while leaving the raw public signature, or green unit tests without a negative fixture. | Codex typecheck/tests, export scan, `check:boundaries`; Codex boundary receipt.                                                               | Does not prohibit framework request/response types at actual app entrypoints.                 |
| `RBS-003` / `FINDING-103`: Codex SSE is incremental, frame-bounded, failure-safe, and cancellation-aware.                                | `stream-and-bound-codex-sse`                                                                 | A first mapped chunk is emitted before slow upstream completion; fragmented/tool events preserve order; request/line overflow and stream failure/cancel terminate safely. | Complete-response success, `[DONE]` presence, small fixture output, or Vercel READY alone.                       | Codex mapper/client and proxy handler tests; immutable proxy staged proof; streaming receipt.                                                 | A bounded residual frame is not an aggregate response byte cap or provider latency guarantee. |
| `RBS-004` / `FINDING-104`: semantic Agent model config is owner-Schema-backed and has no production generic fetch callback.              | `close-codex-and-agent-boundary-escapes`                                                     | Absent/valid inputs decode to the owner contract, invalid inputs fail closed, and production signatures have no callback escape.                                          | A test-only valid config, `Config.url` construction success, or an unregistered callback exception.              | Agent config/model tests, typecheck, boundary fixtures; Agent boundary receipt.                                                               | Test code may temporarily intercept the host fetch boundary and must restore it.              |
| `RBS-005` / Production channel review: Git pushes do not deploy either Vercel app; manual staging/promotion is the sole repository path. | `enforce-staged-deployment-and-reconcile-docs`, then `integrate-and-prove-hosted-candidates` | Both configs reject Git deployment; a pushed exact SHA creates no deployment; later immutable candidates and explicit promotions own alias movement.                      | Config text alone, GitHub CI alone, or a READY deployment with unknown causality.                                | Vercel config tests, pre/post-push project inventory, target runbook; deployment-admission receipt.                                           | Vercel current state is valid only at readback time.                                          |
| `RBS-006` / `FINDING-105`: current docs and lifecycle owners match delivered behavior.                                                   | `enforce-staged-deployment-and-reconcile-docs`, then `terminal-five-pass-audit`              | Proof routing, lifecycle indexes, runbooks, authority, rollback, SPEC/tasks, and plan agree with code and accepted provider state.                                        | Link validity, one updated README, or historical proof promoted to current truth.                                | Semantic lifecycle fixture, `check:docs`, `check:skills`, `check:authority`, `check:controls`, `check:verification`; docs-maintainer receipt. | Documentation evidence does not prove runtime or provider behavior.                           |
| `RBS-007`: accepted live requirements have claim-matched evidence and secrets remain absent.                                             | `integrate-and-prove-hosted-candidates`                                                      | Exact immutable source/deployment/provider identities carry separate proxy, Agent, dispatch, typing, delivery, and rollback observations with clean leak predicates.      | Neighbouring conversation, provider acceptance as delivery, logs without a bounded join, or historical receipt.  | Deploy/prove runbooks, provider inventory/readback, bounded live tests; hosted proof packets.                                                 | Photon strict replay remains unclaimed unless a supported candidate-specific join appears.    |
| `RBS-008`: one terminal five-pass audit finds no unresolved implementation defect.                                                       | `terminal-five-pass-audit`                                                                   | A single ordered receipt newer than every predecessor records all five passes, corrections, rerun gates, exact Git integration, and terminal docs.                        | Per-slice checklist, pre-deployment audit, stale verification, or audit followed by implementation.              | Five-pass review, affected focused commands, `bun run verification`, hosted CI, origin readback; closeout receipt.                            | Genuine external evidence limits may remain only as explicit non-blocking limitations.        |

## Dependencies and rejected alternatives

Implementation is serial. The clean-build correction re-establishes a direct
baseline before boundary work. Streaming depends on the HTTP ownership
correction. Live deployment depends on all repository tasks, pushed source,
green hosted CI, exact provider readback, and rollback candidates.

Rejected alternatives:

- replacing the Channel runtime with ChatSDK;
- adding a generic transport, stream, provider, helper, common, or utils
  package;
- retaining `CodexResponsesFetch` behind a boundary exception;
- buffering only in the route while calling the result streaming;
- using time-window logs, neighbouring conversations, or run counts as strict
  replay evidence;
- treating Vercel READY, a 200 response, provider acceptance, outbound
  dispatch, typing lifecycle, and handset delivery as interchangeable; or
- permitting automatic Git deployment and relying on CI ordering by
  convention.

## Fixture lifecycle

| Fixture                            | Lifecycle          | Owner and compatibility/negative coverage                                                                                                                                                           |
| ---------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent Build Output manifest oracle | Update             | `apps/agent/test/sendblue-build-route.test.ts`; retain exact route/dependency assertions and reject the obsolete path from a clean output state.                                                    |
| Boundary provenance fixtures       | Update             | `tooling/boundary-audit.test.ts`; retain existing rules, add accepted raw HTTP signature and generic callback negatives, and keep framework entrypoint positives.                                   |
| Codex HTTP substitutions           | Retire and replace | Retire `CodexResponsesFetchMock`; use test-owned Effect `HttpClient` Layers while preserving auth/header/status/network assertions.                                                                 |
| Incremental SSE fixtures           | Create             | `packages/codex/test/codex-direct-provider.test.ts` and `apps/codex-proxy/test/proxy-handler.test.ts`; cover fragmentation, slow first byte, cancellation, oversize, failure, text, and tool calls. |
| Agent model config fixture         | Update             | `apps/agent/test/model-provider.test.ts`; preserve model/auth/base-path behavior and add invalid owner-Schema cases without a production callback seam.                                             |
| Vercel deployment config fixtures  | Create or extend   | App-owned packaging/config tests; reject absent/true Git deployment policy and preserve existing build/route contracts.                                                                             |
| Cross-owner lifecycle fixture      | Update             | `tooling/documentation-policy-audit.test.ts`; retain link/shape checks and reject current routers that contradict canonical SPEC/plan indexes.                                                      |

## PRD review record

The repository-local `prd-review` revised the first draft to add the complete
requirement-to-proof crosswalk, per-task mandatory verification and completion
criteria, fixture lifecycle, explicit false-green rejection, evidence owners,
and terminal-audit ordering. The repo-structure validator accepted the five
stable audit findings and their exact requirement/task/path/proof mappings.
`check:docs`, `check:skills`, and `check:verification` passed before
implementation. This establishes document readiness only, not behavior.

## Docs-maintainer impact ledger

| Surface                                    | Decision                                              | Earliest owner and proof                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation router and lifecycle indexes | Change required                                       | Route this current SPEC/plan; later move both to implemented/historical only after terminal proof.                                            |
| Architecture                               | Change required narrowly                              | Codex transport/stream ownership and deployment admission; preserve Channel/Eve composition.                                                  |
| App/package READMEs                        | Change required narrowly                              | Remove stale Codex proof-owner claim; retain public boundary and command maps only.                                                           |
| Runbooks                                   | Change required if commands or live sequencing differ | Deploy/promote and proxy proof runbooks own exact operations and rollback. Channel runbooks change only for proved inventory/proof semantics. |
| Verification journeys and packets          | Change required                                       | Refresh exact Codex proxy streaming and dual-channel Production evidence without rewriting history.                                           |
| Authority and automation registers         | Change required only for deployment trigger policy    | Record manual staging as desired behavior; preserve provider envelopes unless capability changes.                                             |
| Skills and `AGENTS.md`                     | Preserve                                              | Existing skills and instructions already impose the selected boundaries.                                                                      |
| Tests, lint, CI, and config                | Change required                                       | Clean manifest, raw signature/callback, streaming limits, lifecycle semantics, and Vercel Git policy oracles.                                 |
| Package exports/topology                   | Change required narrowly                              | Retire raw Codex exports; no new package or broad barrel.                                                                                     |
| Release/publication                        | N/A                                                   | No package release or publication.                                                                                                            |
| Frontend/browser UI                        | N/A                                                   | No visible React surface changes.                                                                                                             |

## Rollback and evidence policy

Repository rollback is ordered reversion of the verified commits. Streaming
rollback restores the prior Codex mapper/client together; no mixed string/byte
contract may be deployed. Deployment rollback promotes the recorded prior
READY agent/proxy deployments without rolling back encrypted profiles or
durable Channel state. Provider rollback restores only an exact changed
webhook/resource observed in the before-state; no broad cleanup is allowed.

Receipts may retain source SHA, deployment ID/URL, target, safe config names,
status/content type, counts, timing, provider resource fingerprints, message
status, rollback IDs, and booleans. They must not retain secret values, OAuth
profiles, phone numbers, message bodies, prompts, model output, provider raw
payloads, ciphertext, or chain-of-thought.

## Mandatory terminal five-pass audit

Run once after every implementation and live-proof task is complete:

1. Effect contracts, Schemas, branded boundaries, errors, Config, and Layers;
2. call graph, package/file ownership, exports, helper sprawl, and dead paths;
3. behavior, replay/idempotency, workflows, tests, lint, typecheck, and failure
   paths;
4. docs, SPEC/task/plan, runbook, authority, and proof consistency; and
5. provider/deployment/secret safety, rollback, observability, live evidence,
   and explicit non-claims.

Any confirmed issue reopens its owning task and invalidates the affected
receipt until focused proof and `bun run verification` pass again.
