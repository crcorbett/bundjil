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
  quality rules, including `check:boundaries`, `check:effect-setup`,
  `check:skills`, and the mandatory 3-pass Effect TS implementation audit.
- [Eve agent architecture](./architecture/eve-agent.md) documents the committed
  Eve app, Effect boundary, local HTTP endpoints, AI Gateway setup, and
  Codex proxy model-provider setup.
- [Frontend Composition](./architecture/frontend-composition.md) defines the
  conditional React hierarchy, leaf ownership, Effect/runtime boundary, and
  browser verification rules for future visible apps.
- [Reference repositories](./reference-repositories.md) explains the local
  `.local/references` setup for Vercel and Effect source lookup.
- [`@bundjil/eve`](../packages/eve/README.md) documents the
  Effect Schema contracts, workspace-status operation, `/schema` Eve bridge,
  and verification commands for the Eve app operation boundary.
- [`@bundjil/codex`](../packages/codex/README.md) documents the
  Codex OAuth profile store, direct Codex Responses proof service, service
  tags, KeyValueStore layers, Upstash Redis adapter, and safe
  secret-handling rules.
- [`@bundjil/codex-proxy`](../apps/codex-proxy/README.md) documents the
  private Effect HTTP proxy app, local mock and filesystem proof, personal
  Vercel preview live mode, fenced refresh and 401 recovery, safe self-tests,
  and rollback.

## Historical Specifications And Plans

Product specifications and task ledgers preserve the names and evidence that
were current when each change was accepted. They are historical records, not
current package or command guidance. Completed execution evidence lives in
[`exec-plans/completed`](./exec-plans/completed/); only work that is actually in
progress belongs in `exec-plans/active`.

- [Repository Naming And Structure Cleanup](./product-specs/repo-naming-cleanup.md)
  records the capability-based package migration and compatibility audit.
- [Effect Persistence](./product-specs/effect-persistence.md) records the
  original persistence package implementation and is explicitly superseded by
  `@bundjil/store`.
- [Eve + Effect Agent Spike](./product-specs/eve-effect-agent-spike.md) records
  the first Eve agent and Effect wrapper boundary.
- [Codex OAuth Eve Model Provider](./product-specs/codex-oauth-eve-model-provider.md)
  records the research-gated Codex provider and proxy rollout.
- [Personal Codex Subscription Auth And Hosted Proxy](./product-specs/codex-hosted-live-oauth-storage.md)
  records trusted-local PKCE sign-in and hosted encrypted profile storage.
- [Codex Local Profile Import Workaround](./product-specs/codex-local-profile-import-workaround.md)
  records the superseded access-token-only fallback.
- [Vercel Production Promotion](./product-specs/vercel-production-promotion.md)
  records the accepted Production promotion and corrected routing evidence.
- [Sendblue Eve Channel](./product-specs/sendblue-eve-channel.md) records the
  app-owned iMessage channel rollout.
- [Executor MCP Connection](./product-specs/executor-mcp-connection.md) records
  the app-owned Executor connection and accepted Production policy evidence.
- [Codex OAuth Parallel research](./product-specs/codex-oauth-subscription-model-access.parallel-research.md)
  preserves the research report that corrected the subscription-backed model
  access plan.

## Codex Provider Documentation Map

- Current behavior: Gateway is the default Eve model path; Codex proxy mode is
  opt-in and calls the private proxy through an AI SDK OpenAI-compatible
  `LanguageModel`.
- Operating modes: `mock` is the default and never calls Codex; `local` is an
  access-token-only encrypted filesystem proof rejected by Vercel; `live` is
  the refresh-capable encrypted Upstash composition for the personal Vercel
  Preview and Production deployments.
- Deployment scope: `apps/codex-proxy` is linked to the
  `bundjil-codex-proxy` project under Cooper's personal Vercel account, not
  Tilt Legal. Preview proof is historical. Accepted Production evidence covers
  one deployed Eve-to-live-proxy completion and the bounded Task 4 rollout;
  it is not a standing provider probe or approval for later deployment changes.
- Storage: `@bundjil/store/upstash` provides native Effect
  `KeyValueStore` plus `AtomicKeyValueStore` through one provider adapter.
  `@bundjil/codex` owns profile keys, encrypted codecs, and refresh
  policy. `live` stores a versioned encrypted subscription profile, refreshes
  under a distributed lock, and fenced-CAS commits credential generations. The
  ID token is decoded during trusted-local login and is never persisted. The
  separate `local` workaround stores only an encrypted short-lived access-token
  profile.
- JSON boundaries: app and package code should use Effect Schema codecs such
  as `Schema.fromJsonString(...)` and `Schema.UnknownFromJsonString`.
- Unsupported paths: do not treat Codex OAuth as an OpenAI Platform API key,
  do not route it through Vercel AI Gateway credentials, and do not expose the
  proxy publicly. Browser authorization and loopback callbacks remain
  trusted-local only; the proxy exposes no hosted OAuth routes. Historical
  Preview and accepted Production proof do not approve later changes.

## Planned Docs

- Agent identity, consent, and memory model.
- Email ingress through Cloudflare Email Routing Workers.
- Vercel Connect setup for Notion and future integrations.
