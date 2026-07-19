# Bundjil package profile

- Repository: `/Users/cooper/Projects/bundjil`
- Package manager/workspaces: Bun; use root workspace globs
- Namespace: `@bundjil/*`; any `@packages/*` path is cross-repository leakage
- Source condition: `@bundjil/source`
- Default build: `tsc -p tsconfig.build.json` with explicit source/types/default exports and clean publish exports
- Decide package ownership from `docs/architecture/repo-structure.md` before scaffolding; current packages are the repository exemplars
- Verification: focused package commands, `bun run check:skills`, then `bun run verification`
- Never edit generated output, caches, or unrelated work.
