# Architecture

Bundjil is a Bun/Turbo monorepo for a personal agent built around Vercel Eve,
Effect, and channel adapters for iMessage, email, and connected personal tools.

The current codebase contains a deployed Eve app slice. It establishes the Eve
filesystem boundary in `apps/agent` and keeps the reusable workspace-status
operation and schema bridge in `@bundjil/eve`. The private Codex proxy app is a separate
deployment boundary. Eve uses AI Gateway by default and can opt into the
private Codex proxy through app-owned Effect Config.

## Implementation State

Implemented:

- `apps/agent` runs the Eve app, `workspace_status` tool, Gateway default
  model config, and opt-in Codex proxy model-provider config.
- `apps/codex-proxy` exposes private Effect HTTP proxy routes locally and on
  personal Vercel Production and Preview deployments. Its refresh-capable live
  composition is proven through Production Eve.
- `@bundjil/codex` owns Codex OAuth profile/token contracts, direct
  Codex Responses proof services, OpenAI-compatible provider/proxy contracts,
  memory layers, and Codex-specific persistence composition over shared native
  and atomic persistence services.
- `@bundjil/store` owns provider-neutral native Effect
  `KeyValueStore` and supplemental `AtomicKeyValueStore` contracts, coherent
  memory Layer, and explicit Upstash Layer.

Future:

- Cloudflare email, Vercel Connect, Notion, and long-term memory.

Unsupported:

- Codex OAuth tokens are not OpenAI Platform API keys and are not Vercel AI
  Gateway credentials.
- `apps/codex-proxy` is not a public gateway.
- Subscription-provider code must not read `OPENAI_API_KEY` or `CODEX_API_KEY`
  unless a future SPEC explicitly adds a fallback.
- `bundjil-codex-proxy` belongs in Cooper's personal Vercel account, not Tilt
  Legal.

## Product Shape

```text
iMessage
  -> Sendblue webhook
  -> apps/agent Sendblue Eve channel (Production verified; Preview retained)
  -> Vercel Connect
  -> Notion and other connected systems

Email
  -> Cloudflare Email Routing Worker
  -> future Eve email channel/app boundary
  -> Vercel Connect
  -> Notion and other connected systems
```

Vercel Eve is the agent runtime. Its public model treats an agent as a
directory of instructions, skills, tools, channels, connections, schedules, and
subagents. Bundjil's committed app currently uses the root `agent.ts`,
`instructions.md`, and one `tools/workspace_status.ts` tool.

## Package Boundaries

```text
apps/agent
  -> @bundjil/eve
  -> @ai-sdk/openai-compatible when BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy
  -> apps/codex-proxy over private HTTP when Codex proxy mode is enabled

@bundjil/eve
  -> effect
  -> @standard-schema/spec

@bundjil/codex
  -> effect
  -> effect/unstable/persistence/KeyValueStore
  -> @bundjil/store
  -> direct HTTPS fetch to chatgpt.com/backend-api/codex/responses

@bundjil/store
  -> effect/unstable/persistence/KeyValueStore
  -> @upstash/redis only through its explicit /upstash subpath

apps/codex-proxy
  -> effect/unstable/http
  -> @bundjil/codex
```

`@bundjil/eve` owns the Eve-facing Effect boundary: canonical Effect
Schema contracts, `WorkspaceSchemaError`, the `WorkspaceOperations` service,
the deterministic workspace summary, live and memory layers, and the
`@bundjil/eve/schema` bridge for Eve `defineTool` schemas.

`@bundjil/codex` owns the Codex OAuth profile and token lifecycle
contract: Effect Schema subjects/profiles, safe tagged errors, deterministic
storage-key derivation, `CodexProfileStore`, `CodexOAuthService`,
`CodexOAuthClient`, KeyValueStore-backed live/memory layers, the opt-in
direct Codex Responses proof service, and the package-level
OpenAI-compatible private proxy contract. It also owns the explicit
shared `@bundjil/store/upstash` composition for Vercel Marketplace
Upstash Redis. The package owns profile keys and refresh policy, not provider
commands, prefixing, or client construction.
It owns the trusted-local loopback PKCE exchange and encrypted hosted
subscription-profile lifecycle. Browser interaction is never composed into a
Vercel function.

`apps/codex-proxy` owns the deployable HTTP boundary for the private provider.
It parses app-owned Effect Config, exposes `GET /health` and private
OpenAI-compatible `POST /v1/chat/completions` through Effect
`HttpRouter.toWebHandler`, and composes mock, local diagnostic, or
refresh-capable live providers. It exposes no browser OAuth route.

`apps/agent` owns deployment concerns: Eve directory structure, model config,
instructions, authored tool files, channel files, and runtime secrets.
It imports stable operations from `@bundjil/eve` instead of duplicating
schemas or DTOs. For model selection, it owns only provider config and
`LanguageModel` construction; it must not import Codex OAuth profile storage,
token refresh, or direct Codex HTTP clients.

## Current Call Graphs

Eve HTTP path:

```text
Eve HTTP API
  -> GET /eve/v1/info
  -> POST /eve/v1/session
  -> GET /eve/v1/session/:sessionId/stream
  -> apps/agent/agent/agent.ts model config
  -> apps/agent/agent/instructions.md
  -> apps/agent/agent/tools/workspace_status.ts
  -> @bundjil/eve getWorkspaceStatus
  -> @bundjil/eve WorkspaceOperationsLive
  -> @bundjil/eve makeWorkspaceSummary
```

Gateway model path:

```text
apps/agent/agent/agent.ts
  -> agentConfig
  -> BUNDJIL_AGENT_MODEL_PROVIDER=gateway
  -> Gateway model string
  -> Eve AI Gateway runtime
```

Codex proxy model path:

```text
apps/agent/agent/agent.ts
  -> agentConfig
  -> BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy
  -> @ai-sdk/openai-compatible LanguageModel
  -> apps/codex-proxy /v1/chat/completions
  -> @bundjil/codex OpenAICompatibleProxy
```

The deployed Production proof records this configured Eve -> proxy path through
one private proxy completion. Gateway remains the default path.

Sendblue Production inbound/outbound path:

```text
Sendblue receive webhook
  -> Vercel Deployment Protection bypass (platform boundary only)
  -> POST /eve/v1/sendblue/webhook
  -> apps/agent/agent/channels/sendblue.ts
  -> app-owned ManagedRuntime and SendblueChannel
  -> header verification -> Schema decode -> identity -> opaque route
  -> AtomicKeyValueStore replay claim through the shared Upstash Layer
  -> Eve send under waitUntil
  -> message.completed -> outbound claim -> SendblueClient -> Sendblue API
```

The header verifier compares `sb-signing-secret` with the redacted configured
shared secret before body decoding; it is not a body HMAC. Tests replace the
provider and replay layers with deterministic memory layers. The CLI/local path
starts `eve dev --no-ui` and exercises the same authored channel with local
test configuration. The shared Sendblue account now has one active Production
receive webhook; Preview dual-webhook evidence is historical and its dedicated
Sendblue bypass is revoked. Task 4's bounded Production handset proof accepted
the corrected topology; it is historical rollout evidence, not a standing
provider probe.

Schema boundary:

```text
@bundjil/eve WorkspaceStatusInput / WorkspaceStatusSuccess
  -> toEveSchema(schema)
  -> Effect Schema Standard Schema validation
  -> Effect Schema Standard JSON Schema metadata
  -> Eve defineTool inputSchema / outputSchema
```

Private Codex proxy path:

```text
Request
  -> apps/codex-proxy/src/index.ts fetch wrapper
  -> Effect HttpRouter.toWebHandler
  -> apps/codex-proxy/src/server.ts
  -> CodexProxyConfig
  -> OpenAICompatibleProxy.handleChatCompletions(input)
  -> app-owned CodexDirectProvider mock layer
  -> OpenAI-compatible SSE Response
```

Test path:

```text
Vitest
  -> apps/agent/test/workspace-status-tool.test.ts
  -> workspace_status.execute(...)
  -> getWorkspaceStatus(...).pipe(Effect.provide(WorkspaceOperationsLive))
  -> @bundjil/eve makeWorkspaceSummary

Vitest
  -> packages/eve/test/workspace-operations.test.ts
  -> WorkspaceOperationsLive or WorkspaceOperationsMemory
  -> canonical WorkspaceStatus schemas and tagged errors

Vitest
  -> apps/agent/test/model-provider.test.ts
  -> Effect Config provider selection
  -> Gateway string or private proxy LanguageModel
  -> injected fetch proof for bearer auth and no token body leak

Vitest
  -> packages/store/test/upstash-key-value-store.test.ts
  -> packages/store/test/upstash-atomic-key-value-store.test.ts
  -> mocked Upstash client through @bundjil/store/upstash
  -> native KeyValueStore + AtomicKeyValueStore compatibility

Consumer suites
  -> packages/codex/test/persistence.test.ts
  -> apps/agent/test/sendblue-replay-store.test.ts
  -> Codex profile and Sendblue replay compatibility
```

Hosted preview proof path:

```text
Vercel preview request
  -> bundjil-codex-proxy in Cooper personal Vercel account
  -> apps/codex-proxy/api/index.ts
  -> apps/codex-proxy/src/vercel.ts
  -> apps/codex-proxy/src/index.ts
  -> Effect HttpRouter.toWebHandler
  -> GET /health or POST /v1/chat/completions
  -> configured preview provider
  -> private OpenAI-compatible SSE
```

## Runtime Principles

- Keep app-owned integrations provider-specific. Introduce a shared domain
  contract only after a stable multi-consumer boundary exists.
- Use Effect for fallible, async, stateful, boundary-crossing, or
  dependency-injected code.
- Keep provider credentials out of durable domain contracts. Prefer Vercel
  Connect tokens or app-owned runtime bindings at the edge.
- Preserve readback and replay paths. Channel webhooks should be observable and
  testable without needing to mutate live personal data.
- Use native `KeyValueStore` for ordinary persistence only. Its `modify` is not
  atomic coordination; use `AtomicKeyValueStore.transact` for claims, locks,
  fencing, and concurrent transitions.
- The adapter owns provider prefixing, clients, commands, and failures; Codex
  and Sendblue own logical keys and policy. This preserves physical Redis keys,
  canonical encoded values, and TTL behavior without double prefixing.
- Replay records are delivery/idempotency state, not Eve conversation history,
  session streams, or Workflow persistence. Monitor only safe statuses/counts
  and roll back deployments or bindings without clearing durable namespaces.
- Put app-specific framework code in `apps/*`; move shared logic into packages
  only when it is stable and reusable.

The Production-verified Sendblue channel belongs in its existing app-owned
boundary. Retain Preview as an independent historical environment. Future
Cloudflare email, Vercel Connect, and Notion code belongs in app-owned
boundaries first. Move a contract into a capability-owned package only after
the boundary is proven stable.

## Quality Gates

- `bun run build` compiles all packages through Turbo.
- `bun run test` runs package test suites.
- `bun run check-types` checks workspace TypeScript references.
- `bun run check` runs Ultracite type-aware lint/format checks, including the
  `bundjil/tagged-error-name` equality rule for app and package TypeScript.
- `bun run test:lint` proves the repository lint plugin accepts a matching
  tagged error and rejects declaration, self-type, and literal-tag mismatches.
- `bun run verification` runs lint, dependency hygiene, type checking, and
  tests.
- `bun run --filter @bundjil/agent dev:no-ui` starts the local Eve app on port
  `2000` by default for `eve@0.20.0`.
- `bun run --filter @bundjil/codex-proxy smoke-test` starts the private proxy
  handler on a local ephemeral Bun server and proves health plus authenticated
  mock SSE without Codex network calls.
- `bun run --filter @bundjil/agent test` proves Gateway default selection and
  private proxy provider construction without live credentials.
- `bun run --filter @bundjil/codex test` proves profile storage,
  request/stream mapping, direct proof boundaries, and shared persistence
  composition.
- `bun run --filter @bundjil/store test` proves native/atomic
  persistence compatibility and the mocked Upstash adapter.

Every implementation task touching Effect runtime, provider, storage, or app
boundaries must complete and record the mandatory 3-pass Effect TS audit:

1. Ownership and call graph.
2. Effect implementation quality.
3. Verification coverage.

Vercel deployment rules for the proxy:

- Preview deploy first and record direct HTTP evidence before production.
- Keep the linked project under Cooper's personal Vercel scope.
- Set secrets only through Vercel env vars or ignored local env files.
- Direct proof may report status, content type, event/data-line counts, mode,
  model id, and leak booleans only.
- Roll back production with `vercel rollback <deployment-id-or-url>` or by
  removing Eve proxy env vars so the agent falls back to Gateway.

See [docs/architecture/eve-agent.md](./docs/architecture/eve-agent.md) for the
operational Eve app guide and local HTTP verification commands.

See also:

- [Effect Patterns](./docs/architecture/effect-patterns.md) for schema,
  service, config, layer, and error rules.
- [Repo Structure](./docs/architecture/repo-structure.md) for app/package
  ownership and import/export rules.
- [Testing And Quality](./docs/architecture/testing-and-quality.md) for
  verification scope and commands.

## References

- [eve - The Agent Framework - Vercel](https://vercel.com/eve)
- [Cloudflare Workers Email Routing API](https://developers.cloudflare.com/email-service/api/route-emails/email-handler)
- [Vercel Connect documentation](https://vercel.com/docs/connect)
