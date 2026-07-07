# Repo Structure

Bundjil is a Bun workspace and Turbo monorepo. Keep the repo small, explicit,
and ownership-driven.

## Current Layout

```text
apps/
  agent/              Vercel Eve app, instructions, tool files, runtime config.
  codex-proxy/        Private Effect HTTP proxy app for Codex provider proof.

packages/
  core/               Framework-neutral Bundjil domain primitives and programs.
  codex-oauth/        Codex OAuth profiles and direct Responses proof.
  effect-start/       Reusable TanStack Start middleware adapters for Effect.
  eve-effect/         Effect contracts, service layers, and Eve schema bridge.

docs/
  architecture/       Durable architecture and repo standards.
  product-specs/      Specs and task ledgers for planned work.

.agents/skills/       Repo-local agent skills copied from the site workspace.
.claude/              Symlinked Claude skill/config surface.
.local/references/    Ignored local source references for Eve and Effect.
```

## Ownership Rule

Put behavior in the package that owns the concept, not the first file that
needs it.

- App runtime files own framework shape, deployment entrypoints, channel files,
  local config, authored instructions, and secret binding names.
- Packages own reusable contracts, schemas, service APIs, pure programs, and
  provider wrappers once the boundary is stable.
- `@bundjil/core` owns channel-neutral personal-agent concepts.
- `@bundjil/eve-effect` owns reusable Eve operation contracts and the Effect
  Schema bridge to Eve.
- `@bundjil/effect-start` owns generic TanStack Start middleware glue only.

Do not create broad shared packages to avoid choosing ownership. A second
caller is a signal to inspect the concept, not automatic permission to invent
`shared`.

## App Boundaries

`apps/agent` owns the committed Eve filesystem runtime:

```text
apps/agent/
  agent/
    agent.ts          root Eve definition
    config.ts         app-owned model/config parsing
    instructions.md   agent instructions
    tools/            Eve tool modules
  test/               app-level tool and runtime-edge tests
  README.md           app usage and verification guide
```

`apps/codex-proxy` owns the private Codex provider HTTP runtime:

```text
apps/codex-proxy/
  src/
    env.ts            app-owned Effect Config and service layer.
    index.ts          Vercel-compatible fetch export.
    server.ts         Effect HttpRouter routes and web handler.
    dev.ts            local Bun host.
    mock.layer.ts     app-owned mock direct provider layer.
  scripts/            local smoke-test entrypoints.
  test/               direct Request/Response handler tests.
  README.md           routes, env vars, Vercel proof, rollback.
```

The proxy app may import `@bundjil/codex-oauth` service tags, schemas, and
layers. It must not move app-owned env binding names, Vercel deployment
metadata, local dev hosting, or route-specific HTTP behavior into the package.

Future Sendblue, Cloudflare email, Vercel Connect, and Notion code should start
in app-owned boundaries until stable. Move shared contracts into packages only
after the shape has survived at least one real tool/channel implementation.

## Package Boundaries

`@bundjil/core`:

- owns stable, provider-neutral agent domain contracts;
- can export pure functions and Effect-returning programs;
- must not import Eve, Sendblue, Cloudflare, Vercel Connect, Notion SDKs,
  TanStack Start, React, or app files.

`@bundjil/eve-effect`:

- owns Effect Schema contracts for Eve tool inputs and outputs;
- owns tagged errors and named agent operation services;
- owns live and memory layers for operation tests;
- owns `toEveSchema(schema)` for the Eve Standard Schema boundary;
- may depend on `@bundjil/core`, `effect`, and Standard Schema packages;
- must not own Eve filesystem files, app model config, channel files, or
  provider secrets.

`@bundjil/effect-start`:

- owns generic Effect HTTP to TanStack Start middleware adapters;
- may depend on TanStack Start and Effect HTTP primitives;
- must stay independent of the Bundjil agent runtime, channels, and domain
  workflows.

`@bundjil/codex-oauth`:

- owns Codex OAuth subjects, profiles, redacted token schemas, safe tagged
  errors, deterministic storage keys, direct Codex Responses proof schemas,
  and service tags;
- owns `CodexProfileStore`, `CodexOAuthService`, `CodexOAuthClient`, and
  KeyValueStore-backed live/memory layers;
- owns `CodexHttpClient`, `CodexResponsesFetch`, and `CodexResponsesProof` for
  the opt-in direct Codex Responses proof path;
- owns `CodexRequestMapper`, `CodexStreamMapper`, `CodexDirectProvider`, and
  `OpenAICompatibleProxy` for the package-level private provider/proxy
  contract;
- may depend on Effect and Effect v4 `KeyValueStore` primitives;
- must not import Eve, app files, Vercel deployment code, Sendblue,
  Cloudflare, Notion, OpenClaw, or Goose implementations;
- must keep live/mock layers on explicit package subpaths when provider
  behavior is involved.

`apps/codex-proxy`:

- owns private proxy deployment concerns, route auth, mock streaming proof,
  local dev, Vercel fetch export, and app-owned env names;
- may compose `@bundjil/codex-oauth` service tags and schemas;
- must keep Eve model-provider selection out of this app;
- must not read `OPENAI_API_KEY` or `CODEX_API_KEY`;
- must keep hosted live Codex calls disabled until deployment, storage, and
  secret verification tasks pass.

## Imports And Exports

Rules:

- Prefer package subpath exports for durable boundaries.
- Use `.js` extensions for local TypeScript ESM imports under NodeNext.
- Import schemas and schema-derived types from the owning package.
- Do not import app files from packages.
- Do not import generated `dist` files from source or tests.
- Keep `package.json` exports aligned with the public API callers actually use.

Bundjil packages currently expose `@bundjil/source` conditional exports so
tests and workspace consumers can resolve TypeScript source during development.
Keep that condition when adding new package exports.

## Specs Before New Boundaries

Before adding a new app, channel, provider integration, or durable package
boundary:

1. Draft a SPEC with `$prd-writer`.
2. Include ownership, schemas, config, verification, and docs tasks.
3. Implement with `$prd-implementer`.
4. Keep docs updated as part of the implementation, not as a cleanup task.

Small refactors inside an existing boundary do not need a new SPEC, but they
still need focused checks and documentation updates when they change a public
pattern.

## Local References

Ignored source references are for inspection only:

- `.local/references/personal-agent-template` for Vercel personal-agent
  structure.
- `.local/references/effect-v4` for Effect v4 source and API details.
- `.local/references/eve` when present for Eve framework source.

Do not copy code from references blindly. Use them to verify real APIs and
adapt the pattern to Bundjil's package boundaries.
