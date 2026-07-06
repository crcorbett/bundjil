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
as a reminder to build a watchful, useful, and respectful personal agent.

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

The current repository is the foundation for that product. It does not yet ship
the Eve agent app or live channel adapters.

## Current Packages

- `@bundjil/core` owns framework-neutral personal-agent domain primitives and
  Effect programs.
- `@bundjil/effect-start` owns reusable TanStack Start middleware glue for
  running Effect HTTP programs.

`apps/` is intentionally empty until the first deployable Eve/Vercel app
boundary is chosen.

## Getting Started

```bash
bun install
bun run build
bun run test
bun run verification
```

Use Bun from the repository root. During iteration, run the smallest useful
check first, then run `bun run verification` before handing work back.

## Layout

```text
apps/
  .gitkeep           Placeholder for the first deployable agent app.
packages/
  core/              Framework-neutral Bundjil domain primitives.
  effect-start/      TanStack Start adapter for Effect HTTP programs.
docs/
  README.md          Documentation index.
ARCHITECTURE.md      Agent architecture and package boundaries.
```

## Roadmap

1. Choose the first deployable app boundary for the Eve agent.
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
