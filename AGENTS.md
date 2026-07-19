# Repo Atlas

Start here for repo conventions.

## Current Shape

- `package.json` owns Bun workspaces, dependency catalogs, and root scripts.
- `turbo.json` owns workspace task orchestration.
- `tsconfig.base.json` owns strict TypeScript and Effect language-service
  settings.
- `packages/store` owns provider-neutral native and atomic store contracts,
  plus explicit memory and Upstash adapters.
- `packages/codex` owns Codex auth, profiles, storage policy, provider
  transport, proxy contracts, and intent-based public exports.
- `packages/eve` owns Eve-facing Effect Schema contracts, the workspace-status
  feature, its named operation service, and the Eve schema bridge.
- `apps/agent` owns the committed Vercel Eve app, including the root agent,
  instructions, app-owned config, and Eve tools.
- `apps/codex-proxy` owns the private Effect HTTP proxy app for Codex
  provider proof, including app-owned config, Vercel fetch entrypoint, local
  dev host, routes, mock streaming, and smoke tests.
- `docs/architecture` owns durable rules for Effect patterns, repo structure,
  package ownership, and verification.

## Working Agreements

- Use Bun from the repo root.
- Prefer workspace packages over app-local shared logic.
- Use Effect for fallible, async, stateful, boundary-crossing, or
  dependency-injected code.
- Decode unknown host/provider data once with the owning Schema, pass only its
  decoded `typeof Contract.Type` to services, and encode its decoded value
  before every outward write. Keep `typeof Contract.Encoded` values, provider
  DTOs, SDK instances, and exact third-party primitives inside named adapters.
- Provider clients expose named operations with schema-derived inputs/outputs,
  `Config.schema` plus redacted secrets, safe Schema tagged errors, and
  live/mock Layers. Do not expose generic SDK callbacks or raw clients, use
  public raw semantic identifiers, branch on native error classes, or let
  unchecked SDK outputs escape.
- Keep primary Effect operations flat and sequential. Keep one-use mapping,
  decoding, and error logic inline; do not create helper/common/utils sprawl.
- Keep app code out of packages unless the package explicitly owns that
  framework boundary.
- Keep channel-specific Sendblue, Cloudflare, Eve, Vercel Connect, and Notion
  code in app-owned boundaries until a shared contract is proven stable.
- Run the smallest useful check during iteration. Boundary/provider work must
  run `bun run check:boundaries`, `bun run check:effect-setup`, and
  `bun run check:skills`; run `bun run verification` before handing work back.
- Before adding a new app, channel, provider integration, or durable package
  boundary, create a SPEC through `prd-writer` and execute it through
  `prd-implementer`.

## Architecture Guides

- `docs/architecture/effect-patterns.md` defines Effect TS rules for schemas,
  services, config, layers, errors, and control flow.
- `docs/architecture/repo-structure.md` defines app/package ownership and
  import/export rules.
- `docs/architecture/testing-and-quality.md` defines verification scope and
  commands.
- `docs/architecture/eve-agent.md` documents the committed Eve app runtime.
- `docs/architecture/frontend-composition.md` defines conditional React,
  leaf-component, state ownership, and browser verification rules.

## Local Reference Repositories

These references are local-only and ignored by git:

- `.local/references/personal-agent-template` is a shallow clone of
  `vercel-labs/personal-agent-template` for Vercel personal-agent app patterns.
- `.local/references/effect-v4` points to
  `~/.local/share/effect-solutions/effect`, the Effect v4 source clone
  recommended by the Effect project setup guide.

Use these repositories to inspect real implementation patterns, type
definitions, and examples before inventing local abstractions.
