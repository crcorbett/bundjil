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
  codex-oauth/        Codex OAuth profiles, direct Responses proof, and KV adapters.
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
    model-provider.ts app-owned Gateway/private-proxy provider selector
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
The linked Vercel project is `bundjil-codex-proxy` in Cooper's personal
Vercel account. Do not link or deploy this app to Tilt Legal.

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
- owns explicit storage adapter subpaths such as
  `@bundjil/codex-oauth/upstash-key-value-store.layer` when they provide
  reusable Effect `KeyValueStore` implementations;
- owns the trusted-local access-token-only importer and encrypted filesystem
  adapter; that cache-reading boundary must stay out of app routes, Vercel,
  Eve, CI, and browser code;
- may depend on Effect and Effect v4 `KeyValueStore` primitives;
- may depend on provider SDKs such as `@upstash/redis` only behind explicit
  adapter subpaths and Effect Config/Layer boundaries;
- must not import Eve, app files, Vercel deployment code, Sendblue,
  Cloudflare, Notion, OpenClaw, or Goose implementations;
- must keep live/mock layers on explicit package subpaths when provider
  behavior is involved;
- currently composes only the accepted access-token fallback, but may add the
  SPEC-gated personal subscription design: trusted-local loopback PKCE login,
  explicit legacy/subscription profile variants, encrypted refresh persistence,
  fenced profile commits, and distributed refresh locking;
- must keep browser launch, callback server, PKCE state/verifier, and
  authorization code inside the trusted-local command boundary; Vercel, Eve,
  routes, CI, and browser bundles must not import that boundary;
- must not expose this personal design as public/multi-user auth, account
  pooling, credential resale, or a stable OpenAI Platform replacement.

`apps/codex-proxy`:

- owns private proxy deployment concerns, route auth, mock/local/live mode
  selection, local dev, Vercel fetch export, and app-owned env names;
- may compose `@bundjil/codex-oauth` service tags and schemas;
- must keep Eve model-provider selection out of this app;
- must not read `OPENAI_API_KEY` or `CODEX_API_KEY`;
- currently composes encrypted access-token-only `live` mode for personal
  preview; after the successor SPEC's local-login, fenced-refresh, and preview
  proof tasks pass, it may compose refresh-capable subscription credentials;
- must expose no OAuth browser start/callback route, must fail closed, and must
  never fall back to API keys or mock output after a live auth failure.
- must keep `mock` as the default, reject filesystem `local` mode on Vercel,
  and never enable production without a separate explicit approval.
- must record preview direct HTTP proof for `/health`, unauthorized rejection,
  invalid-token rejection, authenticated stream behavior, encrypted Upstash
  readback, and log/leak scans before a production proposal.

`apps/agent` model-provider rules:

- owns `BUNDJIL_AGENT_MODEL_PROVIDER`, `BUNDJIL_AGENT_MODEL`, and
  `BUNDJIL_CODEX_PROXY_*` config parsing;
- may construct an AI SDK `LanguageModel` for the private proxy;
- must keep AI Gateway as the default provider until hosted live Codex proxy
  proof passes;
- must not import `CodexOAuthService`, `CodexProfileStore`, direct Codex HTTP
  clients, or hosted token storage adapters.

## Imports And Exports

Rules:

- Prefer package subpath exports for durable boundaries.
- Use `.js` extensions for local TypeScript ESM imports under NodeNext.
- Import schemas and schema-derived types from the owning package.
- Do not import app files from packages.
- Do not import generated `dist` files from source or tests.
- Keep `package.json` exports aligned with the public API callers actually use.
- Keep provider-heavy or storage-heavy implementations on explicit subpaths so
  consumers opt into them deliberately.
- Keep JSON string boundaries on Effect Schema codecs such as
  `Schema.fromJsonString(...)` and `Schema.UnknownFromJsonString`.

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
- `.local/references/opencode-openai-codex-auth` for pinned personal
  interoperability research only; it is not a dependency or implementation
  authority.
- `.local/references/codex` for the pinned first-party authentication source
  snapshot used as protocol authority during SPEC and implementation review.

Do not copy code from references blindly. Use them to verify real APIs and
adapt the pattern to Bundjil's package boundaries.
