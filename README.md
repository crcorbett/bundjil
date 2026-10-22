# Bundjil

Bundjil is a personal-agent workspace for meeting a person in the channels they
already use while reaching trusted personal systems through scoped
integrations. It uses Vercel Eve for the agent runtime and Effect for fallible,
asynchronous, stateful, boundary-crossing, and dependency-injected code.

The name refers respectfully to Bundjil/Bunjil, a creator figure in Victorian
Aboriginal traditions often represented as a wedge-tailed eagle. This project
does not speak for those traditions.

## Repository shape

- `apps/agent` owns the Eve app, model selection, channels, instructions,
  tools, and deployment boundary.
- `apps/codex-proxy` owns the private Effect HTTP proxy boundary.
- `packages/channel` owns provider-neutral direct-text Channel contracts.
- `packages/sendblue` owns the Sendblue `ChannelTransport` implementation.
- `packages/photon` owns the Photon Spectrum `ChannelTransport` implementation
  and its narrow read-only management boundary.
- `packages/infrastructure` owns private Alchemy stack contracts, custom
  resources, deterministic provider lifecycle tests, and the
  authority-validated read-only inventory and separately gated Preview
  configuration commands, including the dormant owner-specific Photon webhook
  binding sink and the report-only Preview drift classifier around native
  Alchemy plan/sync. Apps do not import it.
- `packages/eve` owns Eve-facing Schemas and named operations.
- `packages/codex` owns Codex subscription profile, storage, refresh, and
  private provider contracts.
- `packages/store` owns provider-neutral native and atomic persistence plus
  explicit memory and Upstash adapters.

Cloudflare email, Vercel Connect, Notion, and long-term memory remain future
product work. Exact implemented contracts are owned by code, exports, and
current architecture—not this overview.

## Documentation

- [Maintainer documentation router](./docs/README.md)
- [Current architecture](./docs/architecture/README.md)
- [Current SPEC/tasks](./docs/product-specs/index.md)
- [Current execution plans](./docs/exec-plans/active/README.md)
- [Completed history](./docs/exec-plans/completed/README.md)
- [Target-owned agent runbooks](./apps/agent/runbooks/README.md)
- [App and package READMEs](./docs/README.md) for local public commands
  and boundaries

Deployment revisions, readiness, webhook topology, provider observations,
credentials, and production state are intentionally absent here. External
systems are authoritative for their current state; dated repository evidence
proves only the observation it records.

## AI work history

This repository is set up to record AI work history with
[Entire](https://entire.io/gh/crcorbett/bundjil). The
[Entire settings](./.entire/settings.json) have telemetry off. Codex recording
is installed through [`.codex/hooks.json`](./.codex/hooks.json), and Claude Code
recording is installed through [`.claude/settings.json`](./.claude/settings.json).

Commits link automatically. The GitHub `origin` remote stays direct, and the
separate `entire` remote publishes checkpoints through Sydney. See the
[AI work history guide](./docs/architecture/testing-and-quality.md#ai-work-history)
for setup, publication and backfill commands.

## Getting started

```bash
bun install --frozen-lockfile
bun run verification
```

Use Bun from the repository root. Verification covers lint, unused code, types,
tests and builds with synthetic Executor settings. It needs no Doppler login or
live credentials. See [checks](docs/architecture/testing-and-quality.md) for
focused commands and [operations](apps/agent/runbooks/README.md) for deployment.
