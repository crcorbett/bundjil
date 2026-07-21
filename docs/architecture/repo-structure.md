---
document_type: architecture
lifecycle: current
authority: canonical
owner: bundjil-architecture-owner
last_reviewed: 2026-07-21
review_trigger: app, package, import, export, provider, channel, or repository-layout change
---

# Repo Structure

Bundjil is a Bun workspace and Turbo monorepo. Keep the repo small, explicit,
and ownership-driven.

## Current Layout

```text
apps/
  agent/              Vercel Eve app, instructions, tool files, runtime config.
  codex-proxy/        Private Effect HTTP proxy app for Codex provider proof.

packages/
  channel/            Provider-neutral direct-text Channel contracts.
  sendblue/           Sendblue ChannelTransport adapter.
  photon/             Photon Spectrum ChannelTransport adapter.
  store/              Provider-neutral native/atomic persistence and adapters.
  codex/              Complete Codex integration and intent-based exports.
  eve/                Eve contracts, workspace status, and schema bridge.

docs/
  architecture/       Durable architecture and repo standards.
  product-specs/      Specs and task ledgers; completed records keep provenance.
  exec-plans/active/  Plans for work that is actually in progress.
  exec-plans/completed/  Accepted and superseded execution evidence.
  runbooks/           Target-owned consequential operations.
  verification/       Dated bounded proof receipts.

lint/
  oxlint-plugin.ts        Repository-owned structural lint rules.

tooling/
  boundary-audit.ts       Root compiler-API boundary provenance audit.
  boundary-exceptions.ts  Exact external/framework adapter exception registry.

.agents/skills/       Repo-owned agent skills aligned to Bundjil architecture.
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
- Package names, public export paths, service names, and error names describe
  the capability that owns them. Do not name a reusable boundary after Effect,
  a Layer, a repository pattern, or another implementation mechanism.
- Keep provider qualifiers only when the capability genuinely wraps that
  provider boundary. Provider-specific adapters such as Codex, Eve, Sendblue,
  Photon, Executor, and Upstash retain their owner names; provider-neutral
  contracts do not inherit a provider qualifier from one implementation.
- `@bundjil/eve` owns reusable Eve operation contracts and the Effect
  Schema bridge to Eve, including the workspace-status feature.
- `@bundjil/store` owns native `KeyValueStore` composition,
  supplemental `AtomicKeyValueStore`, and explicit memory/Upstash Layers. It
  owns no OAuth, replay, or channel policy.

Do not create broad shared packages to avoid choosing ownership. A second
caller is a signal to inspect the concept, not automatic permission to invent
`shared`.

Root tooling may inspect TypeScript source but must not import app/package
runtime modules. Boundary exceptions remain beside this root audit rather than
moving adapter-specific primitives into a generic helper package.

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
      eve.ts          Eve auth policy
      sendblue.ts     thin Sendblue route/composition edge
      photon.ts       thin Photon route/composition edge
    lib/executor/
      config.ts       app-owned Executor endpoint policy and Redacted bearer
    lib/channel/      provider-neutral app identity/routing/replay/orchestration
    tools/            Eve tool modules
  test/               app-level tool and runtime-edge tests
  README.md           app usage and verification guide
```

Eve's `agent/lib` directory is the framework's import-only authored slot, not a
general-purpose shared-code bucket. `lib/channel` owns app-only identity,
routing, replay, orchestration, dispatch, state Schemas, and provider
composition roots; `lib/executor` owns the Executor integration. Discovery
identities remain the direct `channels/sendblue.ts`, `channels/photon.ts`, and
`connections/executor.ts` files; do not replace them with nested `index.ts`
entrypoints.

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

The accepted clean Channel boundary now has proven consumers. Provider-neutral
transport contracts live in `@bundjil/channel`; Sendblue and Photon wire/client
logic lives in `@bundjil/sendblue` and `@bundjil/photon`; the app owns all Eve,
identity, routing, replay, dispatch, and provider-composition policy. Packages
must not import the app or each other through deep source paths.

`apps/agent` owns the new versioned Channel replay key, record Schema, lease,
TTL, retry/uncertain policy, and outbound event-coordinate claims. It composes
the shared persistence `/upstash` Layer from app-owned redacted config.
Replay/idempotency storage is not Eve conversation history, session-stream
persistence, or a generic Workflow store. The clean path deliberately does not
preserve or inspect the removed legacy Sendblue physical key, value, typing
state, or continuation algorithm.

Future Cloudflare email, Vercel Connect, and Notion code starts in an app-owned
adapter until its stable reusable contract is proven. A new provider that can
implement the existing `ChannelTransport` may begin in a provider package only
after an accepted SPEC defines its wire/client boundary and app composition.

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

`@bundjil/channel`:

- owns branded provider, conversation, participant, inbound-message, and
  provider-message identities plus decoded direct-text transport values;
- owns the nominal `ChannelTransport` service with `decodeWebhook`,
  `sendMessage`, and `setPresence` operations and a common safe tagged-error
  vocabulary;
- exposes explicit root, `/memory`, and `/testing` boundaries;
- accepts raw `Request` only at `decodeWebhook` so a provider adapter can
  authenticate exact bytes and headers;
- owns no provider SDK/client, Eve adapter, environment name, replay policy,
  persistence, management operation, or deployment concern.

`@bundjil/sendblue`:

- owns Sendblue E.164 and private wire Schemas, webhook authentication, HTTP
  request/response codecs, safe error translation, and live/memory
  `ChannelTransport` Layers;
- accepts an already decoded `SendblueConfig`; app config owns environment
  binding names and provides the Effect HTTP client Layer;
- exposes no raw HTTP client, DTO, callback, Promise, account-management
  operation, replay behavior, or delivery claim;
- maps provider queue/send/delivery statuses to Channel `accepted`, never
  handset-delivered proof.

`@bundjil/photon`:

- owns Photon config and webhook Schemas, raw-body HMAC verification, the
  private pinned Spectrum SDK/Space boundary, safe error translation, and
  scoped live/memory `ChannelTransport` Layers;
- keeps SDK clients, Spaces, callbacks, Zod/Promise values, and management
  operations private; only the target-owned proof executable uses its internal
  management and lifecycle services;
- exposes root, `/config`, `/live`, and `/memory` boundaries, with exact
  `@spectrum-ts/core` and `@spectrum-ts/imessage` `12.2.0` pins;
- owns no Eve, identity, routing, replay, persistence, environment binding,
  provider-selection, deployment, or Production policy.

`@bundjil/eve`:

- owns Effect Schema contracts for Eve tool inputs and outputs;
- owns the deterministic workspace-status summary, its tagged Schema failure,
  and named operation service;
- owns live and memory layers for operation tests;
- owns `toEveSchema(schema)` on the explicit `/schema` export for the Eve
  Standard Schema boundary;
- may depend on Effect and Standard Schema packages;
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
- Name subpaths for consumer intent and owned capability. Effect service and
  Layer patterns do not require mechanism-only public names or `.service.ts`
  and `.layer.ts` filenames when the containing feature and exported symbol
  already make ownership clear.
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
