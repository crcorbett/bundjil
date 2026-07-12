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
- `.local/references/codex`: sparse shallow clone of `openai/codex`, used as
  first-party protocol authority for the personal subscription auth SPEC.
- `.local/references/opencode-openai-codex-auth`: shallow clone of
  `numman-ali/opencode-openai-codex-auth`, used only as personal external-client
  interoperability precedent. It is not an implementation dependency or policy
  authority.

## Installed Package References

After `bun install`, inspect the installed Eve package at `node_modules/eve`.
For this repo, installed `node_modules/eve/docs` is the authoritative Eve docs
source because it matches the committed `eve@0.20.0` package. Use it before
copying patterns from the local Eve source checkout or the personal-agent
template.

Useful installed paths:

- `node_modules/eve/docs/`: packaged Eve docs matching the installed version.
- `node_modules/eve/docs/reference/project-layout.md`: path-derived Eve
  authored slots and naming rules.
- `node_modules/eve/docs/agent-config.md`: `defineAgent` model and Gateway
  model-id behavior.
- `node_modules/eve/docs/tools/overview.mdx`: `defineTool` behavior, tool file
  naming, `inputSchema`, `outputSchema`, and runtime execution notes.
- `node_modules/eve/docs/channels/eve.mdx`: default HTTP API routes, including
  `/eve/v1/info`, `/eve/v1/session`, and the stream route.
- `node_modules/eve/docs/reference/cli.md`: CLI command behavior, artifact
  locations, `eve link`, `eve dev`, `eve build`, and `eve start`.
- `node_modules/eve/dist/src/public/definitions/tool.d.ts`: installed
  `defineTool` overloads.
- `node_modules/eve/dist/src/shared/tool-definition.d.ts`: public tool schema
  input/output contract.
- `node_modules/eve/dist/src/internal/nitro/host/ports.d.ts`: local dev port
  constants used by `eve dev`.

The installed CLI help and runtime constants say `eve dev` defaults to `$PORT`,
then `2000` for `eve@0.20.0`. The packaged CLI markdown still says `3000` in
its option table, so use CLI help and
`node_modules/eve/dist/src/internal/nitro/host/ports.d.ts` for the current port.

The local `.local/references/personal-agent-template` checkout is useful for
app shape, channel ownership, and Vercel personal-agent deployment patterns. It
currently uses an older Eve range and Zod examples, so do not treat it as
authoritative for Bundjil's installed API behavior.

The local `.local/references/eve` checkout is useful when packaged docs point
to a concept but the implementation detail is only visible in source. Check the
installed package first, then compare source if needed.

## Refresh

```bash
git -C .local/references/eve pull --depth 1 --ff-only
git -C .local/references/personal-agent-template pull --depth 1 --ff-only
git -C .local/references/codex pull --depth 1 --ff-only
git -C .local/references/opencode-openai-codex-auth pull --depth 1 --ff-only
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
