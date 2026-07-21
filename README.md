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
- [App and package READMEs](./docs/README.md#routes) for local public commands
  and boundaries

Deployment revisions, readiness, webhook topology, provider observations,
credentials, and production state are intentionally absent here. External
systems are authoritative for their current state; dated repository evidence
proves only the observation it records.

## Getting started

```bash
bun install
bun run build
bun run test
bun run check:boundaries
bun run check:effect-setup
bun run check:docs
bun run check:skills
bun run verification
```

Use Bun from the repository root. Read the affected app/package README and
`docs/architecture/testing-and-quality.md` before changing a boundary. New
apps, channels, provider integrations, or durable package boundaries require an
approved SPEC and execution plan.
