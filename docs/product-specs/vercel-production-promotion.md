# Vercel Production Promotion

Status: Active - approved, gated rollout
Owner: Bundjil runtime
Last reconciled: 2026-07-14

## Decision

The user has granted approval for Production provisioning and deployment. That
approval authorizes the ordered work in this SPEC; it does not waive any
preflight, test, deployment, soak, rollback, or no-secret evidence gate. A
failed or incomplete gate stops the rollout at its current state.

Production is a distinct runtime, not a Preview alias or copied profile. The
proxy is promoted before the agent. Sendblue stays disabled until the proxy and
agent have passed Production proof, the soak window, and the rollback drill.

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
- `apps/agent` owns model selection and currently has no explicit Eve auth
  policy. Production must add the installed Eve policy
  `eveChannel({ auth: [vercelOidc(), localDev()] })` at the app boundary and
  test deployed rejection/local-only behavior.
- The Codex OAuth and model-provider plans record Preview proofs separately.
  The Sendblue plan records an accepted Preview webhook proof, including route
  status/replay behavior and provider delivery. It also records that Production
  Sendblue variables, storage, aliases, deployments, and webhooks were
  untouched.
- Vercel currently reports old failed Production deployments for both linked
  projects. The proxy Production target is missing Bundjil runtime variables
  other than the Marketplace Upstash aliases; the agent Production target has
  no Bundjil runtime variables. Those deployments are rollback history only,
  not accepted releases.
- The stable project domains are `bundjil-codex-proxy.vercel.app` and
  `bundjil-agent.vercel.app`. The agent has Vercel SSO protection configured
  for Production deployment URLs and all Preview deployments. The preflight
  must re-read and prove these facts before mutation.

The first task therefore revalidates a clean combined Codex Preview baseline;
the completed Sendblue proof is retained as evidence for the final,
Production-only enablement task, not misrepresented as a Codex or Production
proof.

## Boundaries And Isolation

| Concern                   | Preview                                     | Production                                                                 |
| ------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Proxy and agent           | immutable accepted Preview deployments      | stable aliases resolving to accepted immutable Production deployments      |
| Proxy bearer              | Preview-only encrypted value                | independently generated encrypted value                                    |
| Upstash                   | Preview binding and namespace               | independently confirmed binding and namespace                              |
| Profile subject           | Preview-specific `CodexOAuthSubject` inputs | independently configured `CodexOAuthSubject` inputs                        |
| Profile, lock, fence keys | derived only in Preview namespace           | derived only in Production namespace                                       |
| Cipher                    | Preview key and key id                      | independent Production key and key id                                      |
| OAuth profile             | trusted-local Preview login                 | separate trusted-local Production login                                    |
| Eve access                | current Preview state                       | Deployment Protection plus explicit Vercel OIDC; `localDev()` only locally |
| Sendblue                  | accepted Preview-only configuration         | disabled until its final task passes                                       |

Preflight is staged. Every checkpoint decodes only the minimum sanitized
metadata that exists at that point and fails closed; a later checkpoint cannot
be substituted for an earlier one. No checkpoint prints values, profile
material, URLs carrying bypasses, or raw provider output. A Marketplace binding
is not evidence of environment isolation by itself.

| Checkpoint                        | When it runs                                                     | Required proof                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before-first-mutation`           | Before Production provisioning                                   | Granted approval; personal scope; exact linked projects and stable domains; Deployment Protection posture; clean pushed source SHA; known, expected absence of Bundjil Production activation; no Preview identity reuse; read-only inventory. It must not require future variables, profiles, aliases, or deployments.                                                              |
| `proxy-provisioned`               | After proxy credential/profile provisioning, before proxy deploy | `before-first-mutation` facts plus required proxy Production variable names and security types, `live` mode, independent opaque proxy/profile/namespace/lock/fence identities, encrypted stored-profile proof, and no Preview reuse. It does not require a stable proxy URL or accepted deployment reference.                                                                       |
| `proxy-accepted-agent-configured` | After accepted proxy and agent variables, before agent deploy    | `proxy-provisioned` facts plus the stable proxy URL resolving to the accepted immutable proxy deployment, required agent Production variable names and security types, independent bearer identity, Deployment Protection, and explicit Eve OIDC with no deployed `localDev()` or anonymous fallback. It does not require an accepted agent deployment or agent rollback reference. |
| `agent-accepted-rollback-ready`   | After accepted agent deployment and rollback references          | `proxy-accepted-agent-configured` facts plus immutable accepted agent deployment/source/config evidence and accepted current/previous rollback references for the proxy and agent.                                                                                                                                                                                                  |
| `sendblue-final-promotion`        | Immediately before Sendblue Production enablement                | `agent-accepted-rollback-ready` facts, completed soak and rollback drill, and proof that Sendblue Production remains unactivated until this final task. Sendblue-specific variables, ingress, delivery, and replay proof are created and accepted only in this task.                                                                                                                |

## Required Production Sequence

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
