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
- [Frontend Composition](./architecture/frontend-composition.md) defines the
  conditional React hierarchy, leaf ownership, Effect/runtime boundary, and
  browser verification rules for future visible apps.
- [Eve + Effect Agent Spike](./product-specs/eve-effect-agent-spike.md)
  describes the first planned Eve agent implementation and Effect wrapper
  boundary.
- [Codex OAuth Eve Model Provider](./product-specs/codex-oauth-eve-model-provider.md)
  specifies the research-gated Codex OAuth service, Effect KeyValueStore
  profile store, Eve model-provider wiring, and mandatory implementation audit.
- [Personal Codex Subscription Auth And Hosted Proxy](./product-specs/codex-hosted-live-oauth-storage.md)
  specifies trusted-local loopback PKCE sign-in, versioned encrypted
  refresh-capable profiles, fenced rotation, personal Vercel preview proof,
  and mandatory implementation audits without a hosted OAuth callback.
- [Codex Local Profile Import Workaround](./product-specs/codex-local-profile-import-workaround.md)
  preserves the historical access-token-only fallback. It is superseded for
  normal hosted operation and remains only as a deprecated emergency/local
  diagnostic path.
- [Vercel Production Promotion](./product-specs/vercel-production-promotion.md)
  gates production on a clean encrypted-variable Preview redeploy, then defines
  target-separated auth, proxy URL, profile provisioning, monitoring, and
  rollback.
- [Sendblue Eve Channel](./product-specs/sendblue-eve-channel.md) specifies the
  app-owned iMessage channel, shared-secret webhook verification, sender
  identity mapping, deterministic Eve routing, durable replay protection,
  outbound delivery, and historical Vercel Preview proof.
- [Sendblue Typing Indicators](./product-specs/sendblue-typing-indicators.md)
  records the completed Effect-typed accepted-inbound typing lifecycle,
  durable `Idle | Pending | Active` state, bounded cleanup, sanitized runtime
  observations, sole-Production-ingress topology, and direct handset proof.
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
  private Effect HTTP proxy app, local mock and filesystem proof, personal
  Vercel preview live mode, fenced refresh and 401 recovery, safe self-tests,
  and rollback.

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
- Storage: `@bundjil/effect-persistence/upstash` provides native Effect
  `KeyValueStore` plus `AtomicKeyValueStore` through one provider adapter.
  `@bundjil/codex-oauth` owns profile keys, encrypted codecs, and refresh
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
