# Eve Agent Architecture

This guide documents the committed Bundjil Eve app and the Effect package
boundary it uses. It covers the current local slice only; Sendblue, Cloudflare
email, Vercel Connect, and Notion are future boundaries.

## Filesystem Layout

Committed source:

```text
apps/agent/
  package.json
  tsconfig.json
  vitest.config.ts
  agent/
    agent.ts
    instructions.md
    tools/
      workspace_status.ts
  test/
    workspace-status-tool.test.ts

packages/eve-effect/
  src/
    schemas.ts
    errors.ts
    services/
      bundjil-agent-operations.ts
    eve/
      tool-adapter.ts
  test/
    bundjil-agent-operations.test.ts
    tool-adapter.test.ts
```

Ignored local/runtime files:

```text
node_modules/
.local/
.env
.env.*
!.env.example
apps/agent/.eve/
apps/agent/.workflow-data/
apps/agent/.output/
```

`.local/references/*` checkouts are local-only references. The committed
`eve@0.20.0` package docs under `node_modules/eve/docs` are the authoritative
lookup for the installed Eve API. Secrets belong in ignored env files or
Vercel-managed runtime configuration, never in committed source.

## Package Boundary

`apps/agent` owns the Eve filesystem runtime:

- `agent/agent.ts` defines the model through Effect Config and Schema:
  `Config.schema(Schema.NonEmptyString, "BUNDJIL_AGENT_MODEL")`,
  `Config.withDefault("google/gemini-2.5-flash")`, and
  `ConfigProvider.fromEnv()`.
- `agent/instructions.md` tells the agent to use `workspace_status` for
  current repo/package questions and not to claim live channels or integrations.
- `agent/tools/workspace_status.ts` is the model-facing Eve tool slug.

`@bundjil/eve-effect` owns the reusable operation boundary:

- `WorkspaceStatusInput` and `WorkspaceStatusSuccess` are canonical Effect
  Schema contracts.
- `BundjilAgentOperationError`, `BundjilAgentSchemaError`, and
  `BundjilAgentGatewayConfigError` are schema-backed tagged errors.
- `BundjilAgentOperations` is the named Effect service.
- `BundjilAgentOperationsLive` delegates deterministic workspace data to
  `@bundjil/core`.
- `BundjilAgentOperationsMemory` lets tests replace the operation without Eve
  or model access.
- `toEveSchema(schema)` adapts Effect Schema to Eve's tool schema boundary.

`@bundjil/core` remains framework-neutral. The current live operation calls
`makeWorkspaceSummary`, which returns the deterministic package list.

## Schema Boundary

Eve tools accept Standard Schema or JSON Schema. Bundjil keeps Effect Schema as
the source of truth and bridges it once at the Eve edge:

```ts
Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema));
```

`toEveSchema(schema)` wraps that pattern. The result gives Eve both:

- Standard Schema validation via `~standard.validate`.
- Standard JSON Schema metadata via `~standard.jsonSchema`.

The app does not define Zod mirrors or standalone DTOs for tool input/output.
The `workspace_status` tool imports `WorkspaceStatusInput`,
`WorkspaceStatusSuccess`, `getWorkspaceStatus`, and
`BundjilAgentOperationsLive` from `@bundjil/eve-effect`.

## Production Call Graph

The current local/production runtime path is:

```text
Eve HTTP/API
  -> /eve/v1/info, /eve/v1/session, /eve/v1/session/:sessionId/stream
  -> apps/agent/agent/agent.ts
  -> apps/agent/agent/instructions.md
  -> apps/agent/agent/tools/workspace_status.ts
  -> toEveSchema(WorkspaceStatusInput / WorkspaceStatusSuccess)
  -> getWorkspaceStatus(input)
  -> BundjilAgentOperationsLive
  -> @bundjil/core makeWorkspaceSummary
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
  -> Eve tool result
```

`workspace_status.ts` keeps the one-off Effect execution inline at the consumer:

```ts
Effect.runPromise(
  getWorkspaceStatus(input).pipe(Effect.provide(BundjilAgentOperationsLive))
);
```

## Test Call Graph

App test path:

```text
bun run --filter @bundjil/agent test
  -> apps/agent/test/workspace-status-tool.test.ts
  -> workspaceStatusTool.execute(...)
  -> getWorkspaceStatus(...).pipe(Effect.provide(BundjilAgentOperationsLive))
  -> @bundjil/core defaultWorkspacePackages
```

Package test path:

```text
bun run --filter @bundjil/eve-effect test
  -> packages/eve-effect/test/bundjil-agent-operations.test.ts
  -> BundjilAgentOperationsLive
  -> BundjilAgentOperationsMemory
  -> packages/eve-effect/test/tool-adapter.test.ts
  -> toEveSchema(WorkspaceStatusInput / WorkspaceStatusSuccess)
```

These tests prove the operation path without starting Eve or calling a model.

## Local Commands

Run commands from the repo root:

```bash
bun install --frozen-lockfile
bun run --filter @bundjil/eve-effect test
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
bun run check
bun run check-types
bun run test
bun run verification
```

Start the Eve app without the interactive UI:

```bash
bun run --filter @bundjil/agent dev:no-ui
```

For `eve@0.20.0`, the installed CLI help and runtime constants default to
`$PORT`, then `2000`. The local URL is normally `http://127.0.0.1:2000`.

## HTTP Endpoints

Default Eve HTTP routes are available without an authored
`agent/channels/eve.ts`:

- `GET /eve/v1/health`
- `GET /eve/v1/info`
- `POST /eve/v1/session`
- `POST /eve/v1/session/:sessionId`
- `GET /eve/v1/session/:sessionId/stream`

Local probes:

```bash
curl -sS http://127.0.0.1:2000/eve/v1/info
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:2000/eve/v1/session \
  -H "Content-Type: application/json" \
  -d '{"message":"Use the workspace_status tool to tell me what packages are available in the Bundjil repo. Keep the answer short."}'
```

Use the returned `sessionId` to stream events:

```bash
curl -N http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

Initial Task 4 evidence from this spike:

- `GET /eve/v1/info` returned HTTP 200.
- The agent model id was `google/gemini-2.5-flash`.
- Eve discovered `workspace_status` as an authored tool with `hasExecute: true`
  and `hasOutputSchema: true`.
- `POST /eve/v1/session` returned HTTP 202 with `ok`, `sessionId`, and
  `continuationToken`.
- Streaming that session emitted `session.started`, `turn.started`,
  `message.received`, `step.started`, `step.failed`, `turn.failed`, and
  `session.failed`.
- The failure code was `MODEL_CALL_FAILED`.
- Eve reported missing AI Gateway credentials and said the local run needs
  `VERCEL_OIDC_TOKEN` from `eve link` or `AI_GATEWAY_API_KEY`.
- No model response or `workspace_status` model-selected tool call was faked.

Follow-up live Gateway proof:

- A personal Vercel AI Gateway key was created under the
  `cooper-corbetts-projects` scope and stored only in ignored local file
  `apps/agent/.env.local`.
- `GET /eve/v1/info` then returned the same model id,
  `google/gemini-2.5-flash`, and reported Gateway endpoint
  `connected: true` with credential type `api-key`.
- `POST /eve/v1/session` returned `ok: true` for the workspace-status prompt.
- The stream emitted `actions.requested` for `workspace_status`, followed by a
  completed `action.result`.
- The tool output listed `@bundjil/core`, `@bundjil/effect-start`, and
  `@bundjil/eve-effect`.
- The model completed with a concise answer naming those three packages.

## AI Gateway Setup

`apps/agent/agent/agent.ts` validates the Gateway model id as a non-empty
Effect Schema string. The committed default is:

```text
google/gemini-2.5-flash
```

Override it locally when needed:

```bash
BUNDJIL_AGENT_MODEL=<gateway-model-id> bun run --filter @bundjil/agent dev:no-ui
```

Use one of the supported credential paths:

- Run `eve link` from `apps/agent` to link a Vercel project and pull
  `VERCEL_OIDC_TOKEN` or `AI_GATEWAY_API_KEY` into an ignored local env file.
- Or provide `AI_GATEWAY_API_KEY` through an ignored `.env.local`, shell
  environment, or Vercel project environment.

Do not commit `AI_GATEWAY_API_KEY`, `VERCEL_OIDC_TOKEN`, provider API keys, or
Vercel project secrets. For local Bundjil development, the current working
machine uses an ignored `apps/agent/.env.local` key from the personal Vercel
scope `cooper-corbetts-projects`. If credentials are missing, local sessions
can start but the streamed turn fails before the model can select tools.

Before starting new integrations such as Sendblue, Cloudflare email, Vercel
Connect, Notion, or a deployed app boundary, draft a compact SPEC with
`prd-writer` and implement it through `prd-implementer` so call graphs,
ownership, verification gates, and Effect audit evidence are recorded before
code moves.

## Future Boundaries

These integrations are intentionally not implemented in the current slice:

- Sendblue iMessage/SMS/RCS channel files and webhooks.
- Cloudflare Email Routing Workers and email handlers.
- Vercel Connect connection setup and token exchange.
- Notion tools and workflow-specific operations.
- Long-term memory persistence.

Add them in `apps/agent` first unless the contract has become stable enough to
move into `@bundjil/core` or `@bundjil/eve-effect`.
