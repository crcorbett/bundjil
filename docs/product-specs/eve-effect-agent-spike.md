# Eve + Effect Agent Spike

Status: Draft  
Owner: Bundjil  
Created: 2026-07-06

## Purpose

Create the first verifiable Bundjil Eve agent slice while keeping the repo's
Effect-first boundary intact. The slice should prove that Bundjil can run a
minimal Eve agent, configure a cheap Vercel AI Gateway model, expose one simple
tool, and delegate all meaningful app-owned operations through typed Effect
services with canonical Effect Schema inputs, success values, and errors.

This is an implementation spec, not just a research note. The first milestone is
a simple agent we can run locally, call through Eve's local HTTP API, and verify
with an inexpensive gateway-backed model.

## Research Evidence

DeepWiki was queried through the executor MCP. The requested personal DeepWiki
path, `deepwiki_mcp.user.personaldeepwikimcp.ask_question`, was not exposed in
this session; `tools.describe` returned `tool_not_found` and suggested
`deepwiki_mcp.org.workspacedeepwikimcp.ask_question`. The exposed DeepWiki ask
tool was used for the research below.

- `vercel/eve`: DeepWiki confirmed Eve is filesystem-first; a minimal agent is
  an `agent/` directory with `instructions.md`, optional `agent.ts`, `tools/`,
  `skills/`, `channels/`, `connections/`, and `schedules/`. It also confirmed
  `defineAgent`, `defineTool`, `agent/tools/*`, local `eve dev`, bundled
  `node_modules/eve/docs`, `/eve/v1/info`, and `/eve/v1/session` as the local
  verification seam.
- `vercel/eve`: DeepWiki confirmed model strings in `agent/agent.ts` can route
  through Vercel AI Gateway when `AI_GATEWAY_API_KEY` or Vercel OIDC is
  available, and named `/eve/v1/info` plus `/eve/v1/session` as HTTP
  verification endpoints.
- `vercel-labs/personal-agent-template`: DeepWiki confirmed the reference
  template uses `agent/agent.ts`, `agent/channels/*`, `agent/tools/*`,
  `agent/skills/*`, `agent/connections/*`, Sendblue, Vercel Connect, and a
  two-service Vercel deployment model.
- `vercel-labs/personal-agent-template`: DeepWiki identified the main service
  boundaries another repo should isolate: Sendblue, Vercel Connect, internal API
  calls, channels, tools, schema validation, and model configuration.
- `Effect-TS/effect-smol`: DeepWiki confirmed the Effect v4 wrapper primitives:
  `Schema`, `Schema.decodeUnknownEffect`, `Schema.encodeEffect`,
  `Schema.TaggedErrorClass`, `Context.Service`, `Layer.effect`,
  `Config.redacted`, `Effect.tryPromise`, `Effect.withSpan`, and
  `@effect/vitest`.

Local reference files inspected:

- `.local/references/personal-agent-template/package.json`
- `.local/references/personal-agent-template/README.md`
- `.local/references/personal-agent-template/agent/agent.ts`
- `.local/references/personal-agent-template/agent/channels/eve.ts`
- `.local/references/personal-agent-template/agent/channels/sendblue.ts`
- `.local/references/personal-agent-template/agent/tools/weather.ts`
- `.local/references/personal-agent-template/agent/tools/save_memory.ts`
- `.local/references/eve/docs/tools/overview.mdx`
- `.local/references/eve/packages/eve/src/public/definitions/tool.ts`
- `.local/references/eve/packages/eve/src/shared/tool-definition.ts`
- `.local/references/effect-v4/packages/effect/src/Schema.ts`
- `.local/references/effect-v4/packages/effect/src/Context.ts`
- `.local/references/effect-v4/packages/effect/src/Layer.ts`
- `.local/references/effect-v4/packages/effect/src/Data.ts`

## Target Shape

Add two new workspace surfaces:

```text
apps/agent
  package.json
  agent/
    instructions.md
    agent.ts
    tools/
      workspace_status.ts
  test/
    workspace-status-tool.test.ts

packages/eve-effect
  package.json
  src/
    index.ts
    errors.ts
    schemas.ts
    services/
      bundjil-agent-operations.ts
    eve/
      tool-adapter.ts
  test/
    bundjil-agent-operations.test.ts
    tool-adapter.test.ts
```

`apps/agent` owns Eve runtime shape and deployment concerns. Eve supports
Standard Schema for tool `inputSchema` and `outputSchema`, so the first
implementation should pass Effect Schema through `Schema.toStandardSchemaV1`
instead of mirroring contracts in zod.

`@bundjil/eve-effect` owns typed operation contracts, Effect Schema decoding and
encoding, tagged errors, layers, and testable operations. It must not own Eve
channel files, Vercel deployment configuration, Sendblue callbacks, or final
provider secrets.

## Decisions

- Use `apps/agent` for the first deployable Eve app boundary. This keeps the
  framework-owned filesystem layout out of shared packages.
- Use `@bundjil/eve-effect` for reusable Effect wrappers around app operations
  that Eve tools and channels call.
- Keep `@bundjil/core` as the framework-neutral domain primitive package.
  `@bundjil/eve-effect` may depend on `@bundjil/core`; `@bundjil/core` must not
  depend on Eve.
- Start with a single named operation:
  `BundjilAgentOperations.getWorkspaceStatus`.
- Use Effect Schema as the source of truth for:
  `WorkspaceStatusInput`, `WorkspaceStatusSuccess`, and
  `WorkspaceStatusError`.
- Use `Schema.toStandardSchemaV1(...)` for Eve's
  `defineTool({ inputSchema, outputSchema })` boundary. This lets Eve infer the
  `execute` input and output types from the canonical Effect Schema contracts.
  Do not add zod mirrors unless a concrete Eve API requires them.
- Configure the first model through `agent/agent.ts` with an environment
  override and a cheap default candidate such as `google/gemini-2.5-flash`.
  Confirm the exact available model ID during implementation using Eve docs or
  Vercel AI Gateway docs before committing the model string.
- Do not commit `AI_GATEWAY_API_KEY` or any provider secret. Use local
  environment files ignored by git, Vercel OIDC from `vercel link`, or executor
  Vercel env upsert only when a real project and secret source are explicitly
  available.

## Effect Boundary Requirements

Use this implementation block for the Effect parts:

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

The wrapper pattern must follow the local `effect-client-wrapper` skill:

- Define tagged errors with `Schema.TaggedErrorClass` or `Data.TaggedError`
  when no schema encoding is needed.
- Define a `Context.Service` or local service tag for named operations.
- Use named operation methods instead of exposing only a generic `use`.
- Load secrets through `Config.redacted` when a service owns credentials.
- Wrap promise/SDK calls with `Effect.tryPromise`.
- Add `Effect.withSpan` or `Effect.fn` names for operation spans.
- Provide a `Layer.effect` live layer and a memory/mock layer for tests.

## Canonical Schemas And Errors

Initial package contracts:

```ts
WorkspaceStatusInput;
WorkspaceStatusSuccess;
WorkspaceStatusFailure;
WorkspaceStatusToolInput;
WorkspaceStatusToolSuccess;
BundjilAgentOperationError;
BundjilAgentSchemaError;
BundjilAgentGatewayConfigError;
```

`WorkspaceStatusInput` should include the minimum useful user prompt or context
for the first tool, such as `{ readonly question: string }`.

`WorkspaceStatusSuccess` should include deterministic fields that can be tested
without calling a model, such as workspace name, package names, and a short
agent-facing summary.

The first model-backed verification may be an agent conversation that asks the
agent to call `workspace_status` and summarize the result. The named Effect
operation must remain testable without model access.

## Call Graphs

Production:

```ts
Eve local HTTP /eve/v1/session
  -> apps/agent/agent/agent.ts model config
  -> apps/agent/agent/instructions.md
  -> apps/agent/agent/tools/workspace_status.ts
    -> @bundjil/eve-effect tool adapter
      -> WorkspaceStatusInput Effect Schema decode
      -> BundjilAgentOperations.getWorkspaceStatus
        -> @bundjil/core makeWorkspaceSummary
      -> WorkspaceStatusSuccess Effect Schema encode
```

Gateway-backed verification:

```ts
Local shell
  -> apps/agent eve dev
  -> GET /eve/v1/info
  -> POST /eve/v1/session
    -> Vercel AI Gateway model string
    -> workspace_status tool call
    -> Effect named operation
```

Tests:

```ts
Vitest
  -> @bundjil/eve-effect BundjilAgentOperations.layerMemory
    -> Effect Schema decode/encode
    -> @bundjil/core workspace summary

Vitest
  -> apps/agent workspace_status tool adapter
    -> mocked Eve execute input
    -> @bundjil/eve-effect layerMemory
```

CLI/scripts:

```ts
bun run verification
  -> ultracite
  -> knip
  -> turbo check-types
  -> turbo test

bun run --filter @bundjil/agent dev
  -> eve dev
  -> local TUI and HTTP endpoints
```

## Verification Requirements

The implementation is not complete until all of the following pass and are
recorded in the task evidence:

- `bun install --frozen-lockfile`
- `bun run check`
- `bun run knip`
- `bun run check-types`
- `bun run test`
- `bun run verification`
- `bun run --filter @bundjil/agent test` or equivalent app-local test command
- `GET /eve/v1/info` against the local Eve dev server
- `POST /eve/v1/session` against the local Eve dev server with a prompt that
  causes the agent to use the `workspace_status` tool
- At least one AI Gateway-backed response using a confirmed cheap model, unless
  missing credentials are documented as the only blocker

The Effect language service must remain active. A temporary local probe may be
used to confirm an Effect diagnostic such as `effect(floatingEffect)`, but the
probe must be deleted before commit.

## Documentation Requirements

The implementation must include comprehensive documentation, not just code:

- Root README: mention the Eve app and the first verification command once it
  exists.
- `ARCHITECTURE.md`: add the final app/package boundary and call graph.
- `docs/architecture/eve-agent.md`: document the Eve filesystem layout, model
  config, Effect wrapper boundary, Standard Schema tool boundary, AI Gateway
  setup, local dev commands, and verification evidence.
- `docs/reference-repositories.md`: add any new Eve docs lookup path such as
  `node_modules/eve/docs`.
- Package READMEs for `@bundjil/eve-effect` and `@bundjil/agent`.

Documentation must include exact commands and note which paths are local-only,
which files are committed, and which secrets are intentionally excluded.

## Risks And Tradeoffs

- Eve docs still use zod examples, but current Eve tool types support any
  Standard Schema. The first implementation should use
  `Schema.toStandardSchemaV1(...)` directly and avoid maintaining zod mirrors.
- Eve's model IDs and Gateway behavior can change. The implementation must
  verify the chosen cheap model against current Eve/Vercel docs before relying
  on it.
- Eve may expect Node/pnpm conventions from its examples while this repo uses
  Bun workspaces. The app package must fit Bun/Turbo without adding a second
  package manager.
- Local AI Gateway verification depends on credentials. The work may need to
  use Vercel OIDC from `vercel link` or executor Vercel env upsert, but no
  secret should be committed.
- The first slice should not add Sendblue, Cloudflare email, Notion, memory, or
  Vercel Connect workflows yet. Those remain follow-on integrations after the
  minimal Eve + Effect seam is proven.

## Out Of Scope

- Production Sendblue iMessage channel.
- Cloudflare Email Routing.
- Notion/Vercel Connect tools.
- Long-term memory persistence.
- Multi-user auth.
- Full web chat UI.

## Open Questions

- Which cheap AI Gateway model should become the committed default? Candidate:
  `google/gemini-2.5-flash`, pending current model availability.
- Should `apps/agent` deploy as its own Vercel service immediately, or should
  the first spike stay local-only until Sendblue/email channels are scoped?
