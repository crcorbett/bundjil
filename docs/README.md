# Docs

This directory holds project documentation that is more detailed than the root
README.

## Start Here

- [Project README](../README.md) explains the product direction, current
  packages, setup, and roadmap.
- [Architecture](../ARCHITECTURE.md) explains the planned agent runtime shape,
  package boundaries, and quality gates.
- [Effect Patterns](./architecture/effect-patterns.md) defines the repo's
  Effect TS rules for schemas, services, config, layers, errors, and control
  flow.
- [Repo Structure](./architecture/repo-structure.md) defines app/package
  ownership, import/export rules, local references, and SPEC requirements.
- [Testing And Quality](./architecture/testing-and-quality.md) defines
  verification scope, standard commands, Eve runtime checks, and documentation
  quality rules.
- [Eve agent architecture](./architecture/eve-agent.md) documents the committed
  Eve app, Effect boundary, local HTTP endpoints, AI Gateway setup, and
  verification commands.
- [Eve + Effect Agent Spike](./product-specs/eve-effect-agent-spike.md)
  describes the first planned Eve agent implementation and Effect wrapper
  boundary.
- [Codex OAuth Eve Model Provider](./product-specs/codex-oauth-eve-model-provider.md)
  specifies the research-gated Codex OAuth service, Effect KeyValueStore
  profile store, Eve model-provider wiring, and mandatory implementation audit.
- [Codex OAuth Parallel research](./product-specs/codex-oauth-subscription-model-access.parallel-research.md)
  preserves the Parallel AI report that corrected the subscription-backed model
  access plan.
- [Reference repositories](./reference-repositories.md) explains the local
  `.local/references` setup for Vercel and Effect source lookup.
- [`@bundjil/core`](../packages/core/README.md) documents the framework-neutral
  package for domain primitives and Effect programs.
- [`@bundjil/effect-start`](../packages/effect-start/README.md) documents the
  TanStack Start adapter package.
- [`@bundjil/eve-effect`](../packages/eve-effect/README.md) documents the
  Effect Schema contracts, tagged errors, service layers, Eve schema bridge,
  and verification commands for the Eve app operation boundary.
- [`@bundjil/codex-oauth`](../packages/codex-oauth/README.md) documents the
  non-networked Codex OAuth profile store, service tags, KeyValueStore layers,
  and safe secret-handling rules.

## Planned Docs

- Agent identity, consent, and memory model.
- iMessage ingress and egress through Sendblue.
- Email ingress through Cloudflare Email Routing Workers.
- Vercel Connect setup for Notion and future integrations.
- Verification playbooks for webhook replay, readback, and production safety.
