# Repo Atlas

Start here for repo conventions.

## Current Shape

- `package.json` owns Bun workspaces, dependency catalogs, and root scripts.
- `turbo.json` owns workspace task orchestration.
- `tsconfig.base.json` owns strict TypeScript and Effect language-service
  settings.
- `packages/core` owns framework-neutral Bundjil domain primitives and Effect
  programs.
- `packages/eve-effect` owns Eve-facing Effect Schema contracts, tagged
  errors, named operation services, and the Eve schema bridge.
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
- Keep app code out of packages unless the package explicitly owns that
  framework boundary.
- Keep channel-specific Sendblue, Cloudflare, Eve, Vercel Connect, and Notion
  code in app-owned boundaries until a shared contract is proven stable.
- Run the smallest useful check during iteration, then `bun run verification`
  before handing work back.
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
