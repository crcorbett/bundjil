# bundjil

Bundjil is a personal-agent workspace. The goal is to build a durable agent
that can meet a person in the channels they already use, starting with
iMessage and email, while reaching into trusted personal systems such as Notion
through scoped runtime integrations.

The name comes from Bundjil, also commonly spelt Bunjil, a creator figure in
Victorian Aboriginal traditions who is often represented as a wedge-tailed
eagle. Bunjil Place describes Bunjil as the creator spirit whose stories are
connected to Boon Wurrung, Bunurong, and Wurundjeri peoples, and whose eagle
form inspired the building's protective roof line. This project uses the name
as a respectful reference point for building a watchful and useful personal
agent; it is not an attempt to speak for those traditions.

## Product Direction

Bundjil is planned around a simple product shape:

- Agent runtime: Vercel Eve, where an agent is a directory of Markdown
  instructions, optional skills, TypeScript tools, channels, connections,
  schedules, and subagents.
- iMessage channel: Sendblue for programmable iMessage/SMS/RCS delivery and
  inbound webhooks.
- Email channel: Cloudflare Email Routing and Workers email handlers for
  programmable inbound email processing.
- Connected tools: Vercel Connect for short-lived, project-scoped access to
  Notion and other third-party systems without long-lived provider secrets in
  the app runtime.
- Domain model: Effect for fallible, async, stateful, boundary-crossing, and
  dependency-injected code.

The current repository ships the first local Eve agent slice. It does not yet
ship live Sendblue, Cloudflare email, Vercel Connect, or Notion integrations.

## Current Packages

- `@bundjil/core` owns framework-neutral personal-agent domain primitives and
  Effect programs.
- `@bundjil/effect-start` owns reusable TanStack Start middleware glue for
  running Effect HTTP programs.
- `@bundjil/eve-effect` owns Eve-facing Effect Schema contracts, tagged
  errors, named operation services, and the Standard Schema bridge used by Eve
  tools.
- `@bundjil/agent` is the committed Vercel Eve app. It defines the root agent,
  instructions, and the `workspace_status` tool that delegates into
  `@bundjil/eve-effect`.

`apps/agent` owns Eve filesystem runtime shape and deployment concerns.
Reusable app operations live in packages once the boundary is stable.

## Getting Started

```bash
bun install
bun run build
bun run test
bun run verification
```

Use Bun from the repository root. During iteration, run the smallest useful
check first, then run `bun run verification` before handing work back.

For the local Eve app:

```bash
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent dev:no-ui
```

`eve dev --no-ui` serves the app at `http://127.0.0.1:2000` by default for
`eve@0.20.0`. Use `GET /eve/v1/info`, `POST /eve/v1/session`, and
`GET /eve/v1/session/:sessionId/stream` for local HTTP verification.

## Layout

```text
apps/
  agent/             Vercel Eve app and workspace_status tool.
packages/
  core/              Framework-neutral Bundjil domain primitives.
  effect-start/      TanStack Start adapter for Effect HTTP programs.
  eve-effect/        Effect contracts and services for Eve tool boundaries.
docs/
  README.md          Documentation index.
  architecture/
    effect-patterns.md
    eve-agent.md     Eve app architecture and verification guide.
    repo-structure.md
    testing-and-quality.md
ARCHITECTURE.md      Agent architecture and package boundary overview.
```

## Development Rules

- Start with [Effect Patterns](./docs/architecture/effect-patterns.md) before
  adding schemas, services, config, layers, or provider wrappers.
- Use [Repo Structure](./docs/architecture/repo-structure.md) when deciding
  where code belongs.
- Use [Testing And Quality](./docs/architecture/testing-and-quality.md) to pick
  the narrowest useful check and the final verification gate.
- Before adding a new app, channel, provider integration, or durable package
  boundary, draft a SPEC through `$prd-writer` and implement through
  `$prd-implementer`.

## Roadmap

1. Keep proving the Eve app through local HTTP and Gateway-backed verification.
2. Define channel-neutral message, identity, consent, and task contracts in
   `@bundjil/core`.
3. Add the Sendblue iMessage webhook and outbound delivery adapter.
4. Add the Cloudflare email ingress path.
5. Connect Notion through Vercel Connect and model the first personal workflows.
6. Add readback, observability, and replayable verification for every channel.

## References

- [Bunjil the creator - Bunjil Place](https://www.bunjilplace.com.au/our-story/bunjil-creator)
- [eve - The Agent Framework - Vercel](https://vercel.com/eve)
- [Sendblue documentation](https://docs.sendblue.com/)
- [Cloudflare Workers Email Routing API](https://developers.cloudflare.com/email-service/api/route-emails/email-handler)
- [Vercel Connect documentation](https://vercel.com/docs/connect)
