# Vercel Production Promotion

Status: Draft  
Owner: Bundjil runtime  
Last reviewed: 2026-07-13

## Decision

Bundjil may not promote either `bundjil-agent` or `bundjil-codex-proxy` to
production until a new preview deployment has been built from a clean committed
revision using only Vercel-managed encrypted Preview variables. The accepted
preview must prove the complete Eve -> private Codex proxy -> Codex subscription
path without CLI-injected build/runtime secrets.

Production is a separate environment, not a promoted copy of preview state. It
gets its own stable proxy URL, internal bearer credential, Upstash namespace,
profile encryption key and key id, Codex OAuth profile, deployment-protection
policy, monitoring, and rollback evidence. Production deployment remains a
manual approval gate after the clean preview proof is recorded.

## Context

The current repository has already proved a personal Vercel preview in which
the Eve agent reported `bundjil-codex-proxy/gpt-5.5`, completed a minimal
session through `session.waiting`, and caused one authenticated `200` request
at the private live proxy. That evidence proves the configured preview call
graph, but it is not production approval.

The next gate exists to remove two deployment ambiguities:

1. Eve resolves its model manifest during the build, so the scoped Turbo build
   environment contract must be exercised without command-line secret
   injection.
2. Vercel environment variables, aliases, deployment protection, and storage
   bindings are target-specific. A successful Preview target does not define a
   safe Production target.

This SPEC complements, rather than replaces,
`codex-oauth-eve-model-provider.md` and
`codex-hosted-live-oauth-storage.md`.

## Goals

- Record one clean, reproducible preview deployment of both apps using only
  encrypted Vercel Preview variables.
- Define separate Preview and Production ownership for authentication, URLs,
  storage, OAuth profiles, encryption, and deployment protection.
- Promote the proxy before the agent so the production agent never points at a
  preview URL.
- Prove production health, private route rejection, Eve metadata, and one
  minimal end-to-end session without exposing credentials or prompt bodies.
- Define rollback actions for deployments, environment variables, proxy mode,
  and profile generations.
- Define operational monitoring and a fail-closed incident path.

## Non-goals

- This SPEC does not authorize production deployment by being merged.
- It does not add browser OAuth routes to Vercel.
- It does not make `apps/codex-proxy` a public or multi-user gateway.
- It does not share Preview and Production OAuth profile records, lock keys,
  encryption keys, or internal bearer tokens.
- It does not replace Vercel project authentication or Eve channel auth with a
  single global public secret.
- It does not promote the Sendblue channel. Sendblue has its own SPEC and may
  use the production environment only after both ledgers pass their gates.

## Current Ownership

- `apps/agent` owns Eve deployment, model selection, the production proxy URL,
  and the bearer token used only to call that proxy.
- `apps/codex-proxy` owns the private Effect HTTP boundary, route auth, runtime
  mode, Vercel entrypoint, health response, and live Layer composition.
- `@bundjil/codex-oauth` owns OAuth profiles, refresh, encryption, fencing,
  profile persistence, Codex HTTP access, and OpenAI-compatible mapping.
- Vercel owns encrypted target-scoped variables, deployment protection,
  aliases, functions, logs, and Marketplace storage bindings.
- The operator owns trusted-local OAuth login/profile provisioning and the
  explicit production approval decision.

No new package or app is required. Deployment scripts and proof programs stay
with the app whose deployment they verify.

## Environment Contract

| Concern                    | Preview                                                         | Production                                         |
| -------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| Vercel scope               | Cooper's personal account                                       | Cooper's personal account                          |
| Proxy URL                  | immutable accepted Preview URL                                  | stable Production alias/domain                     |
| Agent provider             | explicit `codex-proxy`                                          | explicit `codex-proxy` only after approval         |
| Internal token             | Preview-only encrypted value                                    | independently generated Production value           |
| Proxy mode                 | `live`                                                          | `live`; no fallback to `mock` or `local`           |
| Redis binding              | Preview resource/database or namespace                          | separate Production resource/database or namespace |
| Profile subject/key prefix | Preview-only                                                    | Production-only                                    |
| Cipher key and key id      | Preview-only                                                    | independently generated Production values          |
| OAuth profile              | trusted-local provisioned Preview profile                       | independently provisioned Production profile       |
| Deployment protection      | protected; operator proof uses Vercel OIDC/bypass as documented | protected; no anonymous proxy route                |
| Evidence                   | sanitized Preview proof                                         | sanitized Production smoke and monitoring proof    |

Marketplace variables that happen to be available for both targets do not
remove this separation requirement. The implementation must prove the actual
target bindings and key prefixes without printing values.

## Clean Preview Gate

The first implementation task must perform this gate before any Production
target is changed:

1. Start from a clean worktree on a committed revision pushed to GitHub.
2. Verify required Preview variable names and target assignments using Vercel
   metadata. Do not print values and do not pull them into a tracked path.
3. Deploy `bundjil-codex-proxy` to Preview without `--env`, `--build-env`, or
   equivalent inline values. Record deployment id, immutable URL, source SHA,
   target, and READY state.
4. Run the existing sanitized proxy proof against that immutable URL. Prove
   health, unauthenticated `401`, invalid-token `401`, authenticated SSE `200`,
   encrypted profile readback, refresh/fencing behavior where applicable, and
   no secret markers in output/logs.
5. Set the agent's encrypted Preview `BUNDJIL_CODEX_PROXY_BASE_URL` to the newly
   accepted immutable proxy URL. Deploy `bundjil-agent` to Preview, again with
   no inline env values.
6. Confirm the build used the scoped `@bundjil/agent#build` environment declared
   in `turbo.json`; build logs must not report omitted strict-environment inputs.
7. Authenticate to the protected Eve API with a fresh Vercel project OIDC
   token. Prove `/eve/v1/info`, create one minimal session, and replay the stream
   with `startIndex=0` through `session.waiting`.
8. Correlate exactly one authenticated proxy completion request and no runtime
   errors. Record only request path, status, deployment ids, model id, event
   names/counts, and timings.

Any inline secret injection, dirty source, stale alias, Gateway fallback,
plaintext profile material, or uncorrelated proxy request invalidates the gate
and requires a fresh Preview deployment.

## Production Authentication

Authentication is layered and route-specific:

- Vercel Deployment Protection controls who can reach protected deployments.
- Before Production, commit an explicit `apps/agent/agent/channels/eve.ts`
  policy using `eveChannel({ auth: [vercelOidc(), localDev()] })`. This pins the
  installed Eve default: Vercel OIDC for trusted deployed callers, localhost
  only during local development, and no anonymous Production caller.
- The Codex proxy completion route additionally requires the app-owned
  `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`. Health may expose only non-sensitive
  readiness metadata.
- The agent-to-proxy token is a distinct Production credential. It is never a
  Codex OAuth token, Vercel OIDC token, AI Gateway key, or Preview token.
- Future provider webhooks use their own route authentication. Deployment
  Protection bypass only gets a request to the app; it never replaces the
  channel's signature/shared-secret verification.

No route may fall back from a failed auth mechanism to another provider mode.
Authentication errors must be tagged, sanitized, observable, and fail closed.

## Production Proxy And Profile Provisioning

Production provisioning is operator-driven and occurs only after explicit
approval:

1. Create/confirm target-scoped Production Upstash credentials and a dedicated
   Bundjil profile/lock/fence namespace.
2. Generate a new Production internal bearer token and a new profile encryption
   key. Store them only as encrypted Production variables.
3. Set a non-secret Production cipher key id and a Production profile subject.
4. Run the trusted-local Codex OAuth login/provision command against the
   Production storage target. Browser launch, PKCE verifier/state, callback,
   authorization code, and plaintext token material stay local.
5. Read back only the schema-decoded encrypted envelope and sanitized metadata:
   profile variant, generation/revision, expiry horizon, cipher key id, and
   ciphertext/plaintext-marker checks.
6. Never copy Preview ciphertext into Production or reuse Preview lock/fence
   records. Re-login or explicitly re-encrypt through the package-owned profile
   service if migration is ever required.

The Production proxy URL is the stable production alias/domain of the proxy
project. The agent Production environment may not point to a `*-git-*`,
Preview, branch, or ad hoc deployment URL.

## Promotion Sequence

1. Complete and accept the clean Preview gate.
2. Run a read-only Production preflight that validates target-scoped variable
   names, project ownership, route/auth matrix, storage binding presence, and
   rollback inputs.
3. Obtain explicit operator approval for Production changes.
4. Provision the Production storage/profile/credentials.
5. Deploy the proxy to Production and verify its immutable deployment before
   assigning/accepting the stable alias.
6. Prove health, private auth rejection, one authenticated completion, profile
   refresh readiness, ciphertext-only persistence, and clean logs.
7. Set the agent Production proxy URL/token/model configuration to the verified
   stable proxy endpoint.
8. Deploy the agent to Production and prove Eve info plus one minimal session
   through the production proxy.
9. Observe the release for the defined soak window before enabling any external
   channel.

Production proof uses minimal non-sensitive prompts. It must not use a real
personal conversation as a smoke test.

## Monitoring

Monitoring must answer whether the runtime is available, authenticated, fresh,
and private without logging message content or credentials.

Required signals:

- Agent and proxy deployment id, target, source SHA, region, and runtime mode.
- `/health` status and latency from an authenticated monitor where protection
  requires it.
- Proxy completion request count, status family, latency, and sanitized error
  tag.
- Eve session terminal events: completed/waiting/failed counts and latency.
- OAuth expiry horizon, refresh attempts/outcomes, 401 replay count, refresh
  lock contention, fenced commit conflict, and reauthentication-required state.
- Upstash read/write/timeout/error counts and profile revision only.
- Authentication rejection counts for Eve, proxy bearer, and deployment
  protection, with rate-based alerts rather than request-body logs.

Forbidden telemetry includes prompts, model output, bearer/OAuth tokens,
headers, raw profile records, phone numbers, email addresses, full webhook
URLs containing bypass credentials, and ciphertext.

Initial alert conditions:

- health failure or repeated 5xx;
- no successful synthetic completion in the agreed interval;
- refresh failure, reauthentication required, or expiry inside the warning
  horizon;
- unexpected `mock`, `local`, Gateway, Preview URL, or wrong Vercel scope in a
  Production deployment;
- repeated auth failures or storage/fencing errors;
- any leak-scan marker match.

## Rollback

Rollback is an ordered operation, not only `vercel rollback`:

1. Stop new external traffic or disable the affected channel.
2. Roll back the agent first to a deployment/configuration that does not call a
   broken proxy. The safe fallback is the previously accepted deployment or
   explicit Gateway mode if its credentials and behavior were pre-proved.
3. Roll back the proxy deployment to the last accepted immutable deployment.
4. Restore the matching Production environment variable set and redeploy;
   Vercel deployment rollback does not by itself prove environment rollback.
5. Do not roll a profile generation backward across a successful refresh.
   Preserve the newest fenced generation unless the package-owned recovery
   procedure proves a safe restore.
6. Rotate the internal bearer, profile cipher, or automation bypass credential
   when compromise is suspected, then redeploy all consumers.
7. Run the same sanitized health/auth/session checks after rollback and record
   the incident boundary.

The runbook must record immutable deployment ids and configuration versions for
the current and previous accepted release. Secrets are referenced by variable
name/key id only.

## Canonical Contracts

Implementation reuses existing package-owned contracts wherever available:

- `AgentModelProviderConfig` and app config from `apps/agent`.
- Proxy config/health schemas and tagged errors from `apps/codex-proxy`.
- OAuth profile, encrypted envelope, profile subject, revision/generation,
  refresh-lock, fenced-commit, and proxy request/stream contracts from
  `@bundjil/codex-oauth`.

New deployment proof contracts, if code is needed, remain app-owned and must be
Effect Schema-derived. Expected concepts include:

- `VercelDeploymentTarget`, `VercelDeploymentIdentity`,
  `DeploymentConfigurationSummary`;
- `ProductionPromotionPreflight`, `ProductionPromotionEvidence`;
- schema-backed tagged errors for invalid target, wrong project/scope, missing
  variable, stale/Preview proxy URL, proof mismatch, and leak detection.

Do not create DTO mirrors of Vercel responses. Decode only the minimal fields
required by the proof at the CLI boundary.

## Required Effect Code Shape

The implementation must follow the existing Effect v4 service style in this
repository. The following is the normative shape, not a request to create these
exact names if an existing owner already provides the contract:

```ts
import { Config, ConfigProvider, Context, Effect, Layer, Schema } from "effect";

export const VercelDeploymentTarget = Schema.Literals([
  "preview",
  "production",
]);

export const ProductionPreflightInput = Schema.Struct({
  target: VercelDeploymentTarget,
  projectId: Schema.NonEmptyString,
  sourceSha: Schema.NonEmptyString,
});

export type ProductionPreflightInput = typeof ProductionPreflightInput.Type;

export const ProductionPromotionEvidence = Schema.Struct({
  target: Schema.Literal("production"),
  projectId: Schema.NonEmptyString,
  sourceSha: Schema.NonEmptyString,
  ready: Schema.Boolean,
});

export type ProductionPromotionEvidence =
  typeof ProductionPromotionEvidence.Type;

export const ProductionPromotionBlockedEvidence = Schema.Struct({
  status: Schema.Literal("blocked"),
  reason: Schema.Literal("ProductionPreflightError"),
});

export type ProductionPromotionBlockedEvidence =
  typeof ProductionPromotionBlockedEvidence.Type;

export class ProductionPreflightError extends Schema.TaggedErrorClass<ProductionPreflightError>()(
  "ProductionPreflightError",
  {
    operation: Schema.Literal("preflight"),
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

export interface ProductionPromotionShape {
  readonly preflight: (
    input: ProductionPreflightInput
  ) => Effect.Effect<ProductionPromotionEvidence, ProductionPreflightError>;
}

export class ProductionPromotion extends Context.Service<
  ProductionPromotion,
  ProductionPromotionShape
>()("@bundjil/agent/ProductionPromotion") {}

export const runProductionPreflight = Effect.fn(
  "ProductionPromotion.preflight"
)(function* (unknownInput: unknown) {
  const input = yield* Schema.decodeUnknownEffect(ProductionPreflightInput)(
    unknownInput
  ).pipe(
    Effect.mapError(
      (cause) =>
        new ProductionPreflightError({
          operation: "preflight",
          message: "Unable to decode the production preflight input.",
          cause,
        })
    )
  );
  const promotion = yield* ProductionPromotion;

  return yield* promotion.preflight(input);
});

export const ProductionPromotionLive = Layer.effect(
  ProductionPromotion,
  makeProductionPromotion
);
```

`makeProductionPromotion` represents the one Layer constructor that owns the
Vercel deployment/proof adapter and its dependencies. It belongs beside that
service and must not become a generic factory, dependency bag, or pass-through
helper.

The example establishes these rules:

- one canonical Schema value and its derived type;
- one meaningful service tag for the deployment boundary, not one service per
  function;
- a flat named operation whose success path is decode -> service -> result;
- schema/provider error translation at the failing boundary;
- explicit `Live` composition and replaceable test Layers;
- no `Effect.runPromise` below the CLI/Vercel adapter edge.

Configuration follows the same shape and remains separate from operations:

```ts
const loadProductionPromotionConfig = Effect.all({
  proxyUrl: Config.url("BUNDJIL_CODEX_PROXY_BASE_URL"),
  internalToken: Config.redacted("BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"),
}).pipe(
  Effect.mapError(
    (cause) =>
      new ProductionPreflightError({
        operation: "preflight",
        message: "Unable to load production promotion config.",
        cause,
      })
  )
);
```

The executable command composes configuration, provider adapters, and Layers
once. It handles expected tagged failures in the outer pipeline and runs the
Effect exactly once:

```ts
const program = runProductionPreflight(input).pipe(
  Effect.catchTags({
    ProductionPreflightError: (error) =>
      Effect.succeed({
        status: "blocked",
        reason: error._tag,
      } satisfies ProductionPromotionBlockedEvidence),
  }),
  Effect.provide(ProductionPromotionLive),
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

await Effect.runPromise(program);
```

The command encodes the resulting success/blocked union with its canonical
Schema immediately before writing stdout. Do not add a
`makeSanitizedBlockedEvidence` helper unless a reused serialization/security
boundary later justifies it.

## Call Graphs

### Production

```text
Trusted Eve caller
  -> Vercel Deployment Protection
  -> apps/agent Eve route auth: vercelOidc()
  -> apps/agent AgentConfig / AgentModelProviderConfig
  -> @ai-sdk/openai-compatible LanguageModel
  -> stable Production codex-proxy URL + internal bearer
  -> apps/codex-proxy Vercel fetch entrypoint
  -> CodexProxyConfig + private route auth
  -> OpenAICompatibleProxy
  -> CodexDirectProvider
  -> CodexOAuthService
  -> CodexProfileStore + CodexOAuthProfileCipher + refresh lock/fenced commit
  -> Production Upstash KeyValueStore adapter
  -> CodexHttpClient
  -> chatgpt.com/backend-api/codex/responses
```

### Tests

```text
Vitest
  -> app config/proof Schemas
  -> ConfigProvider.fromMap fixtures
  -> agent model provider with injected fetch
  -> codex-proxy Request/Response handler
  -> OpenAICompatibleProxy memory/mock Layers
  -> CodexProfileStore memory Layer + deterministic cipher/clock
  -> success, auth, refresh, fencing, wrong-target, and leak assertions
```

### CLI And Deployment Proof

```text
Bun proof/preflight command
  -> ConfigProvider.fromEnv()
  -> app-owned Effect Schema deployment inputs
  -> Vercel CLI/API adapter at executable edge
  -> encrypted variable-name and target metadata checks
  -> Vercel deploy without inline secret flags
  -> authenticated HTTP probes
  -> Eve session stream replay with startIndex=0
  -> Vercel runtime-log query
  -> Schema-encoded sanitized evidence artifact
```

## Effect Implementation Rules

- Deployment and proof programs are named, flat `Effect.gen` or `Effect.fn`
  operations. Keep the success path linear and visible.
- Expected failures are schema-backed tagged errors. Handle them after the main
  program with `catchTag`, `catchTags`, or `mapError` in `.pipe(...)`.
- Use `Config`, `ConfigProvider.fromEnv()`, `Config.redacted`, Effect Schema,
  `HttpClient`, `Command`, `Layer`, and `ManagedRuntime` where their boundaries
  apply.
- Use `Schema.fromJsonString(...)` or the canonical schema codec for JSON. Do
  not use `JSON.stringify`, `JSON.parse`, manual object readers, or untyped CLI
  response access in committed proof code.
- Runtime services return Effects. `Effect.runPromise` belongs only at Vercel,
  CLI, test, or framework adapter edges.
- Do not add generic deployment helpers. A wrapper must own a real provider,
  security, serialization, or reusable policy boundary.
- Do not use unsafe casts, `instanceof` error branching, DTO mirrors, broad
  lint suppressions, or secret-bearing snapshots.

## Helper And Static-Analysis Gate

Helper sprawl is forbidden. Before accepting each task, inventory every new
function, module, service, adapter, mapper, and wrapper in the diff. Retain it
only when it has multiple real call sites or owns a non-trivial provider,
security, serialization, resource, or policy boundary. Inline single-use
property readers, one-line `Effect.map` wrappers, pass-through services, and
aliases. Generic `utils`, `helpers`, `common`, `shared`, and speculative
abstraction modules are not allowed.

Static-analysis requirements:

- `bun run check` is the Ultracite/Oxlint/format authority;
- `bun run knip` must report no dead files, exports, or dependencies;
- changed packages/apps must pass focused typechecks and the Effect language
  service must have no unresolved diagnostics;
- `bun run verification` is the final repository gate;
- do not weaken root lint rules, expand ignores, or add broad
  `oxlint-disable`, `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`
  directives;
- a narrow suppression requires an adjacent reason, focused regression test,
  and audit evidence explaining why the owning type/schema cannot express the
  boundary;
- structural type assertions are forbidden. `as const` and `satisfies` are
  permitted when they preserve inference and do not bypass validation.

## Frontend Composition Guardrail

This SPEC adds no React app, operator dashboard, or visible browser route.
Implementation must not introduce one as incidental deployment tooling. If a
visible operator surface becomes necessary, stop and draft a separate SPEC
under `prd-writer` before adding the route or component boundary.

That future SPEC must follow
`docs/architecture/frontend-composition.md`:

```text
primitive -> composite -> layout -> route
```

Routes compose stable regions and route context; they do not own leaf data or
commands. The leaf that renders a status, credential action, rollback command,
or monitoring control owns its read/mutation, loading, empty, error, retry,
skeleton, and fallback states. Do not prop-drill query data, selected ids,
callbacks, or loading flags through unrelated wrappers. Hoist only genuinely
shared coordination state.

Effect runtimes, Layers, Config, credentials, and provider clients remain on
the server. Routes/loaders/actions expose Schema-owned serializable contracts;
React renders tagged success/error states and never runs `Effect.runPromise`
during render. Visible work also requires canonical typography, accessible
controls, desktop/mobile Browser screenshots, direct HTTP evidence, and long,
loading, empty, and error-state overflow checks.

## Verification And Acceptance

Every implementation task requires the three-pass audit defined in
`docs/architecture/effect-patterns.md`:

1. ownership and call graph;
2. Effect implementation quality and helper-sprawl review;
3. verification coverage and evidence quality.

The final gate requires:

- clean Preview redeploy evidence using only encrypted Vercel variables;
- targeted agent/proxy/Codex OAuth checks;
- direct HTTP auth/status/content-type checks;
- one Preview and, after approval, one Production session replay;
- sanitized Vercel build/runtime log inspection;
- rollback and monitoring evidence;
- `bun run verification` and `git diff --check`.

Production is accepted only when the agent and proxy source SHA/configuration
are correlated, the stable Production URL is in use, no Preview/Gateway/mock
fallback occurred, and no secret or message-content markers appear in evidence.

## Documentation Deliverables

Implementation must update:

- root `README.md` and `ARCHITECTURE.md` implementation state;
- `apps/agent/README.md` deployment/auth/rollback instructions;
- `apps/codex-proxy/README.md` production provisioning and monitoring runbook;
- `docs/architecture/eve-agent.md` current production call graph;
- the relevant Codex OAuth SPEC/task ledgers where status language changes;
- an active execution plan with sanitized deployment ids, source SHAs, checks,
  and audit evidence.

## Risks And Tradeoffs

- A Production Codex subscription profile can require interactive re-login.
  Monitoring must surface this; Vercel must not host the browser flow.
- Vercel target variables and aliases can drift independently. The preflight
  and post-deploy proof are both mandatory.
- Deployment rollback can pair old code with new credentials/profile state.
  Configuration compatibility must be verified explicitly.
- Gateway fallback improves availability but changes provider and billing.
  It is allowed only when preconfigured, pre-proved, and selected deliberately.

## Implementation Delegation Prompt

```text
Use Effect TS native approaches first. Prefer Data, Schema, Array, Chunk,
HashSet, HashMap, Match, Context, Layer, Config, Service, Record, Result, Exit,
Bun/Platform Command, and ManagedRuntime over plain TypeScript helpers when the
code is fallible, async, runtime-owned, collection-heavy, or crosses a package,
RPC, SSR, command, config, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as id: string, slug: string, status, or post metadata
outside their canonical schema/type owner.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, instanceof checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema/RPC/Match/Result/Exit
primitive or owning service contract should carry the behavior.
```

## Sources

- Installed Eve `0.20.0` auth/channel docs in
  `node_modules/eve/docs/channels/eve.mdx` and
  `node_modules/eve/docs/guides/auth-and-route-protection.md`.
- [Vercel Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).
- Existing accepted preview evidence in `apps/agent/README.md` and the Codex
  OAuth product SPEC/task ledgers.
