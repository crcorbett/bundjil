# Vercel Production Promotion

Status: Production accepted; Sendblue routing correction in progress
Owner: Bundjil runtime
Last reconciled: 2026-07-16

## Decision

The user granted approval for Production provisioning and deployment. The
ordered rollout completed its preflight, deployment, soak, rollback,
Sendblue, no-secret, and documentation-reconciliation evidence gates. The task
ledger records the three parent audit passes that accepted the final state.

Production is a distinct runtime, not a Preview alias or copied profile. The
proxy was promoted before the agent; Sendblue was enabled only after Production
proof, soak, and rollback evidence. Preview deployment/configuration evidence
remains independently retained, but a shared Sendblue account/line cannot keep
simultaneous Preview and Production receive webhooks.

## Corrective Sendblue Addendum

The accepted rollout proved that the Production channel works, but its retained
two-webhook topology was not a valid environment-isolation mechanism. Live
investigation on 2026-07-16 confirmed Sendblue fans one account event out to
every registered receive webhook: the same handset message reached Preview and
Production and both returned `202`. Separate route secrets, automation bypasses,
replay namespaces, and continuation tokens do not prevent this cross-environment
duplicate delivery.

The canonical corrective requirements and accepted implementation task live in
[`sendblue-eve-channel.md`](./sendblue-eve-channel.md) and
[`sendblue-eve-channel.tasks.json`](./sendblue-eve-channel.tasks.json). The
required corrective end state is one active receive webhook on the shared
account/line, targeting the stable Production host. Preview configuration and
immutable proof may remain historical, but Preview provider ingress and its
dedicated Sendblue automation bypass must be disabled. A separate Sendblue
account/line is required for concurrent Preview testing.

The corrective provider operation on 2026-07-16 removed the Preview receive
entry after a fail-closed two-host inventory, then read back exactly one stable
Production receive host. It subsequently revoked only the dedicated Preview
Sendblue automation bypass while retaining the Production bypass. Direct
Production missing-secret and invalid-secret probes both returned `401`; a
secret-preserving authenticated-malformed probe returned `400` with curl exit
`0`; and the bounded post-change window had no Preview request or Agent Run.
The accepted 12:03:30Z through 12:09:30Z handset window recorded one Production
webhook request, one received inbound, one accepted tool-use turn, two
successful correlated proxy completions, one delivered outbound, and zero
Preview requests. The user confirmed that the deployed reply found the broader
Production Executor catalog, so the correction is accepted.

## Reconciled State

- `apps/codex-proxy` already owns the Vercel fetch entrypoint, `/health`,
  private `/v1/chat/completions` bearer boundary, `mock`/`local`/`live` mode,
  and `CodexProxyConfig`.
- Its `live` Layer already composes `CodexProfileStore`,
  `CodexOAuthProfileCipher`, `UpstashKeyValueStore`,
  `UpstashCodexOAuthRefreshLock`, `UpstashCodexOAuthProfileCommit`, and the
  Codex HTTP services. `local` is rejected in Vercel; Production must reject
  both `local` and `mock`.
- `@bundjil/codex-oauth` owns the canonical `CodexOAuthSubject`, encrypted
  profile/envelope, profile-store, refresh-lock, fenced-commit, trusted-local
  login, and stored-profile-proof contracts. No production DTO or alternate
  profile format is needed.
- `apps/agent` owns model selection and the explicit Eve policy
  `eveChannel({ auth: [vercelOidc(), localDev()] })` at the app boundary.
  Vercel OIDC protects deployed Eve callers; `localDev()` is localhost-only.
- The Codex OAuth, model-provider, and Sendblue plans retain Preview evidence
  as historical. Production evidence now includes route matrices, provider
  ingress/delivery, durable replay, private proxy completion, inventory,
  monitoring, and rollback proof.
- The accepted Production proxy and agent are `READY` at source `e53e7a4`.
  The earlier rejected channel deployment remains historical evidence only;
  rollback targets are recorded in the active plan.
- The stable project domains are `bundjil-codex-proxy.vercel.app` and
  `bundjil-agent.vercel.app`. The agent has Vercel SSO protection configured
  for Production deployment URLs and all Preview deployments. A future
  Production rerun must re-read and prove these facts before mutation.

The clean combined Codex Preview baseline and earlier Sendblue proof are
retained as historical evidence. They are not substitutes for the accepted
Production evidence.

## Boundaries And Isolation

| Concern                   | Preview                                                                        | Production                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Proxy and agent           | immutable accepted Preview deployments                                         | stable aliases resolving to accepted immutable Production deployments      |
| Proxy bearer              | Preview-only encrypted value                                                   | independently generated encrypted value                                    |
| Upstash                   | Preview binding and namespace                                                  | independently confirmed binding and namespace                              |
| Profile subject           | Preview-specific `CodexOAuthSubject` inputs                                    | independently configured `CodexOAuthSubject` inputs                        |
| Profile, lock, fence keys | derived only in Preview namespace                                              | derived only in Production namespace                                       |
| Cipher                    | Preview key and key id                                                         | independent Production key and key id                                      |
| OAuth profile             | trusted-local Preview login                                                    | separate trusted-local Production login                                    |
| Eve access                | current Preview state                                                          | Deployment Protection plus explicit Vercel OIDC; `localDev()` only locally |
| Sendblue                  | historical configuration/proof; no active shared-line ingress after correction | one active receive webhook plus accepted Production configuration/proof    |

The accepted rollout used staged preflight. For any future Production rerun,
each checkpoint must decode only the minimum sanitized metadata available at
that point and fail closed; a later checkpoint cannot substitute for an earlier
one. No checkpoint prints values, profile material, URLs carrying bypasses, or
raw provider output. A Marketplace binding is not evidence of environment
isolation by itself.

| Checkpoint                        | When it runs                                                     | Required proof                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before-first-mutation`           | Before Production provisioning                                   | Granted approval; personal scope; exact linked projects and stable domains; Deployment Protection posture; clean pushed source SHA; known, expected absence of Bundjil Production activation; no Preview identity reuse; read-only inventory. It must not require future variables, profiles, aliases, or deployments.                                                              |
| `proxy-provisioned`               | After proxy credential/profile provisioning, before proxy deploy | `before-first-mutation` facts plus required proxy Production variable names and security types, `live` mode, independent opaque proxy/profile/namespace/lock/fence identities, encrypted stored-profile proof, and no Preview reuse. It does not require a stable proxy URL or accepted deployment reference.                                                                       |
| `proxy-accepted-agent-configured` | After accepted proxy and agent variables, before agent deploy    | `proxy-provisioned` facts plus the stable proxy URL resolving to the accepted immutable proxy deployment, required agent Production variable names and security types, independent bearer identity, Deployment Protection, and explicit Eve OIDC with no deployed `localDev()` or anonymous fallback. It does not require an accepted agent deployment or agent rollback reference. |
| `agent-accepted-rollback-ready`   | After accepted agent deployment and rollback references          | `proxy-accepted-agent-configured` facts plus immutable accepted agent deployment/source/config evidence and accepted current/previous rollback references for the proxy and agent.                                                                                                                                                                                                  |
| `sendblue-final-promotion`        | Immediately before Sendblue Production enablement                | `agent-accepted-rollback-ready` facts, completed soak and rollback drill, and proof that Sendblue Production remains unactivated until this final task. Sendblue-specific variables, ingress, delivery, and replay proof are created and accepted only in this task.                                                                                                                |

## Historical Production Sequence And Future Rerun Invariant

The ordered sequence below was completed for the accepted rollout and is the
required order for any future Production rerun.

1. Revalidate a clean encrypted-variable Preview proxy-to-agent baseline from
   one pushed SHA. No Production target changes occur here.
2. Add and prove the explicit Eve auth policy and read-only preflight baseline.
   Its accepted historical evidence remains intact; it does not authorize a
   checkpoint to require resources that have not yet been created.
3. Add staged-preflight support before provisioning. Define Schema-backed
   checkpoint inputs/results and tests for stage-specific missing and forbidden
   fields, while retaining fail-closed read-only behavior and the existing
   accepted history.
4. Run `before-first-mutation`, then provision isolated
   Upstash/profile/lock/fence namespaces, an independent
   bearer and cipher/key id, and the separate trusted-local OAuth profile.
   The browser, PKCE values, callback, authorization code, and plaintext token
   stay in the package-owned local command boundary.
5. Run `proxy-provisioned`, then deploy and prove the Production proxy before
   assigning/accepting its stable
   alias. Prove health, `401` for missing/invalid bearer, authenticated SSE
   `200` with the expected content type, encrypted readback, refresh/fencing
   readiness, and sanitized logs.
6. Configure the Production agent only with that stable proxy URL and its
   independent bearer, run `proxy-accepted-agent-configured`, then deploy the
   agent. Prove protected Eve info, one minimal session,
   stream replay from `startIndex=0`, and exactly one correlated proxy request.
7. Run `agent-accepted-rollback-ready`, observe the defined soak window,
   validate monitoring, and run the ordered rollback drill. Do not roll a
   successful fenced profile generation backward.
8. Run `sendblue-final-promotion` only then configure and prove Sendblue
   Production ingress. Its Vercel bypass is platform-only; the independent
   `sb-signing-secret` route authentication, allowlist, and replay protection
   remain required.

No CLI `--env`/`--build-env`, shell-injected secret, tracked pulled env file,
or stale prebuilt output may participate in deployment. Vercel variables remain
encrypted and target-scoped.

## Authentication And Operations

- Deployment Protection controls protected deployment reachability.
- The agent uses explicit `vercelOidc()` for deployed Eve callers and
  `localDev()` only for localhost development. There is no anonymous Production
  Eve fallback.
- The proxy completion route separately requires
  `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`; it is neither a Codex OAuth token nor a
  Vercel token. `/health` may expose only the existing non-sensitive readiness
  schema.
- Trusted-local OAuth provisioning uses the existing
  `@bundjil/codex-oauth` login/profile services and `CodexStoredProfileProof`.
  Vercel has no OAuth start or callback route.
- Production telemetry contains deployment/source identity, target/mode,
  health/status/latency, Eve terminal-event counts, refresh/401/lock/fence and
  Upstash error counters, and authentication rejection rates. It excludes
  prompts, outputs, headers, tokens, raw profiles, ciphertext, PII, and bypass
  URLs.

Alerts fire on health/5xx failure, synthetic-completion absence, refresh or
reauthentication failure, expiry warning, storage/fence error, auth spike,
wrong mode/host/scope, or leak-marker match.

## Rollback

Rollback is ordered: disable external traffic, restore the agent to an accepted
configuration that cannot call a broken proxy, restore matching Production env
configuration and redeploy, restore the proxy immutable deployment, then rerun
sanitized health/auth/session proof. Preserve the newest fenced profile
generation. Rotate bearer/cipher/bypass credentials after suspected compromise;
rotation and re-login are not a profile-generation rollback.

## Call Graphs

### Production

```text
trusted Eve caller
  -> Vercel Deployment Protection
  -> apps/agent explicit eveChannel(vercelOidc(), localDev())
  -> AgentModelProviderConfig (provider: codex-proxy)
  -> @ai-sdk/openai-compatible LanguageModel
  -> stable Production apps/codex-proxy URL + independent bearer
  -> CodexProxyConfig and private route auth
  -> OpenAICompatibleProxy
  -> CodexOAuthService
  -> CodexProfileStore + CodexOAuthProfileCipher
  -> UpstashKeyValueStore + refresh lock + fenced commit
  -> Codex HTTP client -> Codex Responses API
```

### Tests

```text
Vitest
  -> ConfigProvider.fromMap and canonical Schema fixtures
  -> agent auth/model-provider tests
  -> CodexProxyConfig and HTTP handler tests
  -> CodexProfileStore memory Layer + deterministic cipher/clock
  -> mock Upstash lock/fence Layers
  -> auth, isolation, refresh, fencing, URL/scope, leak, and rollback assertions
```

### CLI And Proof

```text
Bun app-owned preflight/proof command
  -> ConfigProvider.fromEnv and canonical Schema decode
  -> Command or Vercel adapter at executable edge
  -> target metadata and deployment identity checks
  -> deploy without inline secret flags
  -> authenticated HTTP probes and Eve stream replay
  -> sanitized Vercel log/monitor query
  -> Schema-encoded sanitized evidence
```

## Effect And Verification Rules

Reuse `AgentModelProviderConfig`, `CodexProxyConfig`, `CodexOAuthSubject`,
encrypted-profile, refresh-lock, fenced-commit, and stored-profile-proof
contracts from their current owners. New deployment-proof contracts, if needed,
are app-owned and Schema-derived at the CLI boundary; decode only minimal
provider fields and do not mirror Vercel responses.

Each implementation task must use flat, meaningful `Effect.gen`/`Effect.fn`
flow, handle expected typed errors in `.pipe(...)` with `catchTag`,
`catchTags`, or `mapError`, use canonical Schema-derived contracts, and reject
unsafe casts, DTO mirrors, manual readers/mappers, raw JSON parsing/encoding,
or trivial wrapper/helper sprawl. Use `Config`, `Redacted`, `Context`, `Layer`,
`Command`, and `ManagedRuntime` at their owning boundaries. Keep
`Effect.runPromise` at CLI/Vercel/framework edges.

Every task records at least three parent audit passes: ownership/call graph,
implementation quality, and verification/evidence coverage. Run focused checks
while iterating and `bun run verification`, `jq empty`, and `git diff --check`
before task acceptance. Commit and push each accepted coherent slice before a
deployment consumes it, so immutable deployment evidence always names a clean
pushed source revision.

## Documentation And Evidence

The active plan and ledger record only source SHA, deployment id, target,
sanitized status/event counts, timing, variable names, cipher key id, and
approved boolean proof results. They never contain secrets, prompt/output
content, raw OAuth/profile/ciphertext values, phone/email, or protected URLs.

After each accepted task, reconcile the affected app docs, architecture docs,
SPEC, ledger, and active plan. Production status changes only after the
corresponding fail-closed evidence exists.
