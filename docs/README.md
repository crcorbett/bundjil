# Docs

This directory holds project documentation that is more detailed than the root
README.

## Start Here

- [Project README](../README.md) explains the product direction, current
  packages, setup, and roadmap.
- [Architecture](../ARCHITECTURE.md) explains the planned agent runtime shape,
  package boundaries, and quality gates.
- [Eve agent architecture](./architecture/eve-agent.md) documents the committed
  Eve app, Effect boundary, local HTTP endpoints, AI Gateway setup, and
  verification commands.
- [Eve + Effect Agent Spike](./product-specs/eve-effect-agent-spike.md)
  describes the first planned Eve agent implementation and Effect wrapper
  boundary.
- [Reference repositories](./reference-repositories.md) explains the local
  `.local/references` setup for Vercel and Effect source lookup.
- [`@bundjil/core`](../packages/core/README.md) documents the framework-neutral
  package for domain primitives and Effect programs.
- [`@bundjil/effect-start`](../packages/effect-start/README.md) documents the
  TanStack Start adapter package.
- [`@bundjil/eve-effect`](../packages/eve-effect/README.md) documents the
  Effect Schema contracts, tagged errors, service layers, Eve schema bridge,
  and verification commands for the Eve app operation boundary.

## Planned Docs

- Agent identity, consent, and memory model.
- iMessage ingress and egress through Sendblue.
- Email ingress through Cloudflare Email Routing Workers.
- Vercel Connect setup for Notion and future integrations.
- Verification playbooks for webhook replay, readback, and production safety.
