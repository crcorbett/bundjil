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
  codex-oauth/        Codex OAuth profiles, local PKCE, refresh, and codecs.
  store/              Provider-neutral native/atomic persistence and adapters.
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
- `@bundjil/store` owns native `KeyValueStore` composition,
  supplemental `AtomicKeyValueStore`, and explicit memory/Upstash Layers. It
  owns no OAuth, replay, or channel policy.

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
    connections/
      executor.ts     thin Eve Executor MCP definition
    channels/
      sendblue.ts     thin Eve route/event adapter
    lib/executor/
      config.ts       app-owned Executor endpoint policy and Redacted bearer
    lib/sendblue/     app-owned Sendblue contracts, services, and Layers
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

The proxy app may import `@bundjil/codex` service tags, schemas, and
layers. It must not move app-owned env binding names, Vercel deployment
metadata, local dev hosting, or route-specific HTTP behavior into the package.
The linked Vercel project is `bundjil-codex-proxy` in Cooper's personal
Vercel account. Do not link or deploy this app to Tilt Legal.

The proxy composes mock, deprecated local diagnostic, and refresh-capable
hosted `live` modes for Production and retained Preview. It never owns a
hosted browser OAuth callback or an account-linking endpoint. Deployable apps
import server-safe layers from
`@bundjil/codex/runtime`; trusted-local browser, loopback, and login
composition is isolated behind `@bundjil/codex/local`.

The Production-verified Sendblue channel remains app-owned in
`apps/agent/agent/channels/sendblue.ts` and `agent/lib/sendblue/`; retained
Preview evidence does not make it a shared package contract. Future Cloudflare
email, Vercel Connect, and Notion code should likewise start in app-owned
boundaries. Move shared contracts into packages only after the shape has
survived at least one real tool/channel implementation.

`apps/agent` keeps Sendblue replay keys, record schemas, TTL policy, and
delivery decisions app-owned. It composes the shared persistence `/upstash`
Layer from app-owned redacted config. Replay/idempotency storage is not Eve
conversation history, session-stream persistence, or a generic Workflow store;
the adapter must preserve the pre-existing physical key, encoded value, and TTL.

The Executor MCP connection is also app-owned: `agent/lib/executor/config.ts`
owns its Effect Config endpoint policy and redacted bearer, while
`agent/connections/executor.ts` is the thin Eve framework adapter. It does not
justify a shared package, custom MCP client, proxy, SDK wrapper, approval
service, persistence store, or state machine. Eve owns conversation/session
continuity and Executor owns paused execution state.

Executor Production operations remain at this app/provider boundary. Personal
1Password owns the labeled independent toolkit reference; Executor owns the
toolkit, selected connection, ordered policy, and account-key lifecycle;
toolkit scope is enforced by the endpoint/policy rather than the bearer itself.
Vercel owns the two Production-only Sensitive app bindings, and the active
execution plan owns sanitized acceptance evidence. A future integration starts in a Preview
toolkit and is promoted only after its SPEC/task, policy review, read/approval/
block proof, and clean-source deployment gate. No package may import or model
the provider catalog, key, policy records, paused state, or deployment control
plane.

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

`@bundjil/codex`:

- organizes implementation under feature-owned `src/auth`, `src/profiles`,
  `src/provider`, `src/storage`, and `src/testing` paths while keeping the
  root, `/runtime`, `/local`, `/testing`, and `/filesystem-store` exports as
  the supported consumer API;
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
- composes `@bundjil/store` for native and atomic persistence;
  it owns Codex logical keys, encrypted profile codecs, and refresh policy,
  not the Upstash client or provider adapter;
- owns the trusted-local access-token-only importer and encrypted filesystem
  adapter; that cache-reading boundary must stay out of app routes, Vercel,
  Eve, CI, and browser code;
- may depend on Effect and Effect v4 `KeyValueStore` primitives;
- must not depend on `@upstash/redis` or reintroduce a provider adapter;
- must not import Eve, app files, Vercel deployment code, Sendblue,
  Cloudflare, Notion, OpenClaw, or Goose implementations;
- must keep live/mock layers on explicit package subpaths when provider
  behavior is involved;
- owns the implemented personal subscription design: trusted-local loopback
  PKCE login, explicit legacy/subscription profile variants, encrypted refresh
  persistence, atomic credentials, fenced profile commits, distributed refresh
  locking, and bounded 401 recovery;
- must keep browser launch, callback server, PKCE state/verifier, and
  authorization code inside the trusted-local command boundary; Vercel, Eve,
  routes, CI, and browser bundles must not import that boundary;
- must not expose this personal design as public/multi-user auth, account
  pooling, credential resale, or a stable OpenAI Platform replacement.

`apps/codex-proxy`:

- owns private proxy deployment concerns, route auth, mock/local/live mode
  selection, local dev, Vercel fetch export, and app-owned env names;
- may compose `@bundjil/codex` service tags and schemas;
- must keep Eve model-provider selection out of this app;
- must not read `OPENAI_API_KEY` or `CODEX_API_KEY`;
- composes refresh-capable encrypted `live` mode for personal Production and
  retained Preview using the package-owned OAuth refresh transport, Upstash
  lock, fenced profile commit, and encrypted profile store. The Production
  Eve-to-proxy proof is accepted; Preview proof is historical;
- keeps the trusted filesystem `local` mode access-token-only and rejects that
  mode on Vercel;
- must expose no OAuth browser start/callback route, must fail closed, and must
  never fall back to API keys or mock output after a live auth failure.
- must keep `mock` as the default configuration, reject filesystem `local`
  mode on Vercel, and never fall back to `mock` after a live failure. A default
  does not assert the mode of any retained deployment.
- must record direct HTTP proof for `/health`, unauthorized rejection,
  invalid-token rejection, authenticated stream behavior, encrypted Upstash
  readback, and log/leak scans. Preview-first sequencing remains required for
  future Production changes.

`apps/agent` model-provider rules:

- owns `BUNDJIL_AGENT_MODEL_PROVIDER`, `BUNDJIL_AGENT_MODEL`, and
  `BUNDJIL_CODEX_PROXY_*` config parsing;
- may construct an AI SDK `LanguageModel` for the private proxy;
- must keep AI Gateway as the default provider unless app-owned configuration
  selects the accepted opt-in Codex proxy;
- may expose the accepted opt-in Codex proxy adapter, but must distinguish its
  historical Preview proof from the separately accepted Production end-to-end
  evidence;
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
