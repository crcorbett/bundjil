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
  quality rules, including the mandatory 3-pass Effect TS implementation
  audit.
- [Eve agent architecture](./architecture/eve-agent.md) documents the committed
  Eve app, Effect boundary, local HTTP endpoints, AI Gateway setup, and
  Codex proxy model-provider setup.
- [Eve + Effect Agent Spike](./product-specs/eve-effect-agent-spike.md)
  describes the first planned Eve agent implementation and Effect wrapper
  boundary.
- [Codex OAuth Eve Model Provider](./product-specs/codex-oauth-eve-model-provider.md)
  specifies the research-gated Codex OAuth service, Effect KeyValueStore
  profile store, Eve model-provider wiring, and mandatory implementation audit.
- [Hosted Codex Live OAuth Storage](./product-specs/codex-hosted-live-oauth-storage.md)
  specifies the next hosted live Codex slice: OAuth revalidation, encrypted
  token-profile storage, refresh locking, personal Vercel preview proof, and
  mandatory implementation audits.
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
  Codex OAuth profile store, direct Codex Responses proof service, service
  tags, KeyValueStore layers, Upstash Redis adapter, and safe
  secret-handling rules.
- [`@bundjil/codex-proxy`](../apps/codex-proxy/README.md) documents the
  private Effect HTTP proxy app, local mock SSE route, env vars, smoke tests,
  Vercel preview verification, and rollback rules.

## Codex Provider Documentation Map

- Current behavior: Gateway is the default Eve model path; Codex proxy mode is
  opt-in and calls the private proxy through an AI SDK OpenAI-compatible
  `LanguageModel`.
- Hosted proof: `apps/codex-proxy` has preview proof in the
  `bundjil-codex-proxy` Vercel project under Cooper's personal Vercel account,
  not Tilt Legal.
- Storage: `@bundjil/codex-oauth/upstash-key-value-store.layer` provides an
  opt-in Upstash Redis adapter behind Effect `KeyValueStore`; hosted refresh
  token storage waits for envelope encryption.
- JSON boundaries: app and package code should use Effect Schema codecs such
  as `Schema.fromJsonString(...)` and `Schema.UnknownFromJsonString`.
- Unsupported paths: do not treat Codex OAuth as an OpenAI Platform API key,
  do not route it through Vercel AI Gateway credentials, and do not expose the
  proxy publicly.

## Planned Docs

- Agent identity, consent, and memory model.
- iMessage ingress and egress through Sendblue.
- Email ingress through Cloudflare Email Routing Workers.
- Vercel Connect setup for Notion and future integrations.
- Verification playbooks for webhook replay, readback, and production safety.
