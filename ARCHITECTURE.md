# Architecture

Bundjil is a Bun/Turbo monorepo for a personal agent built around Vercel Eve,
Effect, and channel adapters for iMessage, email, and connected personal tools.

The current codebase is deliberately small: it establishes package boundaries,
TypeScript strictness, Effect conventions, and verification before the first
deployable app lands.

## Product Shape

```text
iMessage
  -> Sendblue webhook
  -> Eve channel/app
  -> @bundjil/core
  -> Vercel Connect
  -> Notion and other connected systems

Email
  -> Cloudflare Email Routing Worker
  -> Eve channel/app
  -> @bundjil/core
  -> Vercel Connect
  -> Notion and other connected systems
```

Vercel Eve is the intended agent runtime. Its public model treats an agent as a
directory of instructions, skills, tools, channels, connections, schedules, and
subagents. Bundjil's app code should map that runtime model onto the domain
contracts in `@bundjil/core`.

## Package Boundaries

```text
apps/*
  -> @bundjil/core
  -> @bundjil/effect-start when a TanStack Start app exists

@bundjil/effect-start
  -> effect
  -> @tanstack/react-start

@bundjil/core
  -> effect
```

`@bundjil/core` stays framework-neutral. It can expose channel-neutral message
types, identity and consent contracts, tool intent schemas, service contracts,
and pure or Effect-returning programs.

`@bundjil/effect-start` is framework glue only. It adapts Effect HTTP programs
to TanStack Start middleware and must not know about channel routing, product
workflows, Eve runtime composition, or app-specific content.

App packages own deployment concerns: Eve directory structure, channel
webhooks, Vercel configuration, Cloudflare Worker boundaries, Sendblue
callbacks, and concrete Vercel Connect usage.

## Runtime Principles

- Keep the agent core channel-neutral. iMessage, email, and future channels
  should normalize into shared domain envelopes before workflow logic runs.
- Use Effect for fallible, async, stateful, boundary-crossing, or
  dependency-injected code.
- Keep provider credentials out of durable domain contracts. Prefer Vercel
  Connect tokens or app-owned runtime bindings at the edge.
- Preserve readback and replay paths. Channel webhooks should be observable and
  testable without needing to mutate live personal data.
- Put app-specific framework code in `apps/*`; move shared logic into packages
  only when it is stable and reusable.

## Quality Gates

- `bun run build` compiles all packages through Turbo.
- `bun run test` runs package test suites.
- `bun run check-types` checks workspace TypeScript references.
- `bun run verification` runs lint, dependency hygiene, type checking, and
  tests.

## References

- [eve - The Agent Framework - Vercel](https://vercel.com/eve)
- [Cloudflare Workers Email Routing API](https://developers.cloudflare.com/email-service/api/route-emails/email-handler)
- [Vercel Connect documentation](https://vercel.com/docs/connect)
