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
