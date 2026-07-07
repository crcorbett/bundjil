# @bundjil/agent

Committed Vercel Eve app for the first Bundjil agent slice.

## What Lives Here

- `agent/agent.ts`: root Eve definition.
- `agent/config.ts`: app-owned runtime config. The model is loaded through Effect
  `Config.schema(Schema.NonEmptyString, "BUNDJIL_AGENT_MODEL")` with
  `ConfigProvider.fromEnv()` and a default of `google/gemini-2.5-flash`.
- `agent/instructions.md`: operational instructions for the minimal local
  agent.
- `agent/tools/workspace_status.ts`: Eve tool that delegates to
  `@bundjil/eve-effect`.
- `test/workspace-status-tool.test.ts`: app-level proof that the Eve tool
  execute path runs through the live Effect operation without starting Eve or
  calling a model.

## Commands

Run from the repository root:

```bash
bun run --filter @bundjil/agent dev:no-ui
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

`dev:no-ui` starts `eve dev --no-ui`. For installed `eve@0.20.0`, the default
local port is `2000`, so the app normally serves at:

```text
http://127.0.0.1:2000
```

## HTTP Endpoints

Default Eve channel routes:

- `GET /eve/v1/info`
- `POST /eve/v1/session`
- `POST /eve/v1/session/:sessionId`
- `GET /eve/v1/session/:sessionId/stream`

Useful local probes:

```bash
curl -sS http://127.0.0.1:2000/eve/v1/info
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:2000/eve/v1/session \
  -H "Content-Type: application/json" \
  -d '{"message":"Use the workspace_status tool to tell me what packages are available in the Bundjil repo. Keep the answer short."}'
```

Stream the returned session:

```bash
curl -N http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

## Environment

- `BUNDJIL_AGENT_MODEL`: optional non-empty Gateway model override.
- `AI_GATEWAY_API_KEY`: local or hosted AI Gateway credential.
- `VERCEL_OIDC_TOKEN`: credential normally pulled by `eve link`.

The Task 4 local HTTP proof had none of `AI_GATEWAY_API_KEY`,
`VERCEL_OIDC_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` present.
`/eve/v1/info` worked and `/eve/v1/session` returned HTTP 202, but streaming
failed with `MODEL_CALL_FAILED` because Eve had no AI Gateway credentials. Do
not fake model output when this boundary is hit.

Follow-up local proof created a personal Vercel AI Gateway key under the
`cooper-corbetts-projects` scope and stored it only in ignored
`apps/agent/.env.local`. With that key present, `/eve/v1/info` reports Gateway
`connected: true`, the model selects `workspace_status`, the tool result
completes, and the model summarizes the current packages:
`@bundjil/core`, `@bundjil/effect-start`, and `@bundjil/eve-effect`.

Do not commit `.env.local` or any copied Gateway key. Before adding new
runtime integrations or deployed app boundaries, create a SPEC through
`prd-writer` and execute it through `prd-implementer`.

## Runtime Artifacts

The app ignores Eve and Nitro runtime output:

```text
.eve/
.workflow-data/
.output/
```

These are local/generated artifacts and should not be committed.
