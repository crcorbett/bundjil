# Architecture

Bundjil is a Bun/Turbo monorepo for a personal agent built around Vercel Eve,
Effect, and channel adapters for iMessage, email, and connected personal tools.

The current codebase contains the first local Eve app slice. It establishes the
Eve filesystem boundary in `apps/agent`, keeps reusable operation contracts in
`@bundjil/eve-effect`, and keeps framework-neutral primitives in
`@bundjil/core`.

## Product Shape

```text
iMessage
  -> Sendblue webhook
  -> future Eve channel/app boundary
  -> @bundjil/core
  -> Vercel Connect
  -> Notion and other connected systems

Email
  -> Cloudflare Email Routing Worker
  -> future Eve channel/app boundary
  -> @bundjil/core
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
  -> @bundjil/eve-effect

@bundjil/eve-effect
  -> @bundjil/core
  -> effect
  -> @standard-schema/spec

@bundjil/effect-start
  -> effect
  -> @tanstack/react-start

@bundjil/codex-oauth
  -> effect
  -> effect/unstable/persistence/KeyValueStore

@bundjil/core
  -> effect
```

`@bundjil/core` stays framework-neutral. It can expose channel-neutral message
types, identity and consent contracts, tool intent schemas, service contracts,
and pure or Effect-returning programs.

`@bundjil/eve-effect` owns the Eve-facing Effect boundary: canonical Effect
Schema contracts, schema-backed tagged errors, the `BundjilAgentOperations`
service, live and memory layers, and `toEveSchema(schema)` for Eve
`defineTool` schemas.

`@bundjil/effect-start` is framework glue only. It adapts Effect HTTP programs
to TanStack Start middleware and must not know about channel routing, product
workflows, Eve runtime composition, or app-specific content.

`@bundjil/codex-oauth` owns the Codex OAuth profile and token lifecycle
contract: Effect Schema subjects/profiles, safe tagged errors, deterministic
storage-key derivation, `CodexProfileStore`, `CodexOAuthService`,
`CodexOAuthClient`, and KeyValueStore-backed live/memory layers. It currently
does not perform live OAuth endpoint exchange, call Codex Responses, or change
the Eve model.

`apps/agent` owns deployment concerns: Eve directory structure, model config,
instructions, authored tool files, future channel files, and runtime secrets.
It imports stable operations from `@bundjil/eve-effect` instead of duplicating
schemas or DTOs.

## Current Call Graphs

Production/local HTTP path:

```text
Eve HTTP API
  -> GET /eve/v1/info
  -> POST /eve/v1/session
  -> GET /eve/v1/session/:sessionId/stream
  -> apps/agent/agent/agent.ts model config
  -> apps/agent/agent/instructions.md
  -> apps/agent/agent/tools/workspace_status.ts
  -> @bundjil/eve-effect getWorkspaceStatus
  -> @bundjil/eve-effect BundjilAgentOperationsLive
  -> @bundjil/core makeWorkspaceSummary
```

Schema boundary:

```text
@bundjil/eve-effect WorkspaceStatusInput / WorkspaceStatusSuccess
  -> toEveSchema(schema)
  -> Effect Schema Standard Schema validation
  -> Effect Schema Standard JSON Schema metadata
  -> Eve defineTool inputSchema / outputSchema
```

Test path:

```text
Vitest
  -> apps/agent/test/workspace-status-tool.test.ts
  -> workspace_status.execute(...)
  -> getWorkspaceStatus(...).pipe(Effect.provide(BundjilAgentOperationsLive))
  -> @bundjil/core makeWorkspaceSummary

Vitest
  -> packages/eve-effect/test/bundjil-agent-operations.test.ts
  -> BundjilAgentOperationsLive or BundjilAgentOperationsMemory
  -> canonical WorkspaceStatus schemas and tagged errors
```

## Runtime Principles

- Keep the agent core channel-neutral. iMessage, email, and future channels
  should normalize into shared domain envelopes before workflow logic runs.
- Use Effect for fallible, async, stateful, boundary-crossing, or
  dependency-injected code.
- Keep provider credentials out of durable domain contracts. Prefer Vercel
  Connect tokens or app-owned runtime bindings at the edge.
- Preserve readback and replay paths. Channel webhooks should be observable and
  testable without needing to mutate live personal data.
- Put app-specific framework code in `apps/*`; move shared logic into packages
  only when it is stable and reusable.

Future Sendblue, Cloudflare email, Vercel Connect, and Notion code belongs in
app-owned boundaries first. Move shared contracts into `@bundjil/core` or
`@bundjil/eve-effect` only after the boundary is proven stable.

## Quality Gates

- `bun run build` compiles all packages through Turbo.
- `bun run test` runs package test suites.
- `bun run check-types` checks workspace TypeScript references.
- `bun run check` runs Ultracite type-aware lint/format checks.
- `bun run verification` runs lint, dependency hygiene, type checking, and
  tests.
- `bun run --filter @bundjil/agent dev:no-ui` starts the local Eve app on port
  `2000` by default for `eve@0.20.0`.

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
