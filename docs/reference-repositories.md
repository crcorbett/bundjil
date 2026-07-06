# Reference Repositories

Bundjil keeps local-only reference repositories under `.local/references`.
They are intentionally ignored by git because they are upstream source checkouts,
not project source.

## Current References

- `.local/references/personal-agent-template`: shallow clone of
  `vercel-labs/personal-agent-template`.
- `.local/references/eve`: shallow clone of `vercel/eve`, used for current Eve
  framework docs, source, and TypeScript API lookup.
- `.local/references/effect-v4`: symlink to
  `~/.local/share/effect-solutions/effect`, the guide-recommended shallow clone
  of `Effect-TS/effect-smol`.

## Installed Package References

After `bun install`, inspect the installed Eve package at `node_modules/eve`.
For the `research-eve-installation` task, `eve@0.20.0` was installed as a root
workspace dev dependency so its packaged docs, CLI, and TypeScript declarations
can be inspected without creating `apps/agent` early.

Useful installed paths:

- `node_modules/eve/docs/`: packaged Eve docs matching the installed version.
- `node_modules/eve/dist/src/public/definitions/tool.d.ts`: installed
  `defineTool` overloads.
- `node_modules/eve/dist/src/shared/tool-definition.d.ts`: public tool schema
  input/output contract.
- `node_modules/eve/dist/src/internal/nitro/host/ports.d.ts`: local dev port
  constants used by `eve dev`.

The local `.local/references/personal-agent-template` checkout currently uses an
older Eve range and Zod examples. Treat `node_modules/eve` as authoritative for
installed API behavior.

## Refresh

```bash
git -C .local/references/eve pull --depth 1 --ff-only
git -C .local/references/personal-agent-template pull --depth 1 --ff-only
git -C ~/.local/share/effect-solutions/effect pull --depth 1
```

If `effect-smol` force-updates `main`, first confirm the local reference clone
has no changes:

```bash
git -C ~/.local/share/effect-solutions/effect status --short
```

Then refresh it from the latest shallow fetch:

```bash
git -C ~/.local/share/effect-solutions/effect fetch --depth 1 origin main
git -C ~/.local/share/effect-solutions/effect switch -C main FETCH_HEAD
```

## Source Guide

The Effect project setup guide recommends installing the Effect language service,
using the workspace TypeScript version in editors, patching TypeScript during
install, and keeping a local Effect v4 source checkout for AI-assisted
development.
