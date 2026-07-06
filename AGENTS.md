# Repo Atlas

Start here for repo conventions.

## Current Shape

- `package.json` owns Bun workspaces, dependency catalogs, and root scripts.
- `turbo.json` owns workspace task orchestration.
- `tsconfig.base.json` owns strict TypeScript and Effect language-service
  settings.
- `packages/core` owns framework-neutral Bundjil domain primitives and Effect
  programs.
- `packages/effect-start` owns reusable TanStack Start middleware glue for
  running Effect HTTP programs.
- `apps` is intentionally empty until the first Eve/Vercel agent app boundary
  is chosen.

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

## Local Reference Repositories

These references are local-only and ignored by git:

- `.local/references/personal-agent-template` is a shallow clone of
  `vercel-labs/personal-agent-template` for Vercel personal-agent app patterns.
- `.local/references/effect-v4` points to
  `~/.local/share/effect-solutions/effect`, the Effect v4 source clone
  recommended by the Effect project setup guide.

Use these repositories to inspect real implementation patterns, type
definitions, and examples before inventing local abstractions.
