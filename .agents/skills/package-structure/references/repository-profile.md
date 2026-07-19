# Bundjil package profile

- Repository root: current checkout resolved with `git rev-parse --show-toplevel`
- Package manager/workspaces: Bun; use root workspace globs
- Namespace: `@bundjil/*`; any `@packages/*` path is cross-repository leakage
- Source condition: `@bundjil/source`
- Default build: `tsc -p tsconfig.build.json` with explicit source/types/default exports and clean publish exports
- Decide package ownership from `docs/architecture/repo-structure.md` before scaffolding; current packages are the repository exemplars
- Capability-owned filenames and small intent-owned layouts override generic mechanism names; do not rename valid modules merely to force `.service.ts`, `.layer.ts`, or one universal file tree
- `mock.layer.ts` is valid when it names the deterministic substitute owned by the capability
- Use NodeNext `.js` imports where the repository requires them and preserve exact entries owned by `tooling/boundary-exceptions.ts`
- Architecture routes: `docs/architecture/repo-structure.md`, `docs/architecture/effect-patterns.md`, and `docs/architecture/testing-and-quality.md`
- Verification: focused package commands, `bun run check:skills`, then `bun run verification`
- Never edit generated output, caches, or unrelated work.
