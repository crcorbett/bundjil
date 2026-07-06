# Docs

This directory holds project documentation that is more detailed than the root
README.

## Start Here

- [Project README](../README.md) explains the product direction, current
  packages, setup, and roadmap.
- [Architecture](../ARCHITECTURE.md) explains the planned agent runtime shape,
  package boundaries, and quality gates.
- [`@bundjil/core`](../packages/core/README.md) documents the framework-neutral
  package for domain primitives and Effect programs.
- [`@bundjil/effect-start`](../packages/effect-start/README.md) documents the
  TanStack Start adapter package.

## Planned Docs

- Agent identity, consent, and memory model.
- iMessage ingress and egress through Sendblue.
- Email ingress through Cloudflare Email Routing Workers.
- Vercel Eve app layout, channels, schedules, and tools.
- Vercel Connect setup for Notion and future integrations.
- Verification playbooks for webhook replay, readback, and production safety.
