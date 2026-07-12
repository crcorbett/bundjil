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
- `@bundjil/codex-oauth` owns the research-gated Codex OAuth profile and token
  lifecycle service contracts, the direct Codex Responses proof surface, the
  private OpenAI-compatible provider contract, and the opt-in Upstash Redis
  `KeyValueStore` adapter. It also owns the trusted-local, access-token-only
  import command and encrypted profile envelope. It does not own a hosted
  account-link OAuth flow or durable refresh.
- `@bundjil/codex-proxy` is the private Effect HTTP proxy app. It exposes
  `GET /health` and a bearer-token-protected
  `POST /v1/chat/completions` route with explicit mock, local, and live
  compositions. The Vercel project is `bundjil-codex-proxy` in Cooper's
  personal Vercel account, not Tilt Legal.
- `@bundjil/agent` is the committed Vercel Eve app. It defines the root agent,
  instructions, the `workspace_status` tool that delegates into
  `@bundjil/eve-effect`, and app-owned model-provider config. Gateway is the
  default model path; Codex proxy mode is opt-in.

`apps/agent` owns Eve filesystem runtime shape and deployment concerns.
Reusable app operations live in packages once the boundary is stable.

## Codex Provider State

Implemented:

- AI Gateway remains the default Eve model provider.
- `apps/agent` can opt into a private Codex proxy `LanguageModel` with
  `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`.
- `mock` is the default proxy mode for local smoke tests and safe preview
  rollback. It never calls Codex.
- `local` is an explicit encrypted filesystem proof. It runs only in trusted
  local Bun and Vercel rejects it.
- `live` is an explicit personal-Vercel preview composition: a trusted-local
  importer writes an encrypted access-token-only profile to Upstash, and the
  proxy fails closed if that profile is absent or expired.

Operational constraints:

- Imports intentionally exclude refresh and ID tokens, set
  `requiresReauthentication: true`, and cannot refresh. Expiry requires a new
  trusted-local import or a rollback to `mock`.
- The personal Vercel configuration and deploys are preview only. Bundjil did
  not set a production proxy mode, profile, or cipher configuration, and did
  not deploy production. A Marketplace Upstash resource may still auto-bind
  its provider credentials to production; that is not permission to run live
  mode there.
- The operator runbook is in
  [`apps/codex-proxy/README.md`](./apps/codex-proxy/README.md). It records only
  sanitized statuses and leak booleans.

Unsupported paths:

- Do not treat Codex OAuth tokens as OpenAI Platform API keys or Vercel AI
  Gateway credentials.
- Do not use `OPENAI_API_KEY`, `CODEX_API_KEY`, or `@vercel/kv` for the
  subscription-backed provider path.
- Do not expose `apps/codex-proxy` as a public gateway.
- Do not deploy `bundjil-codex-proxy` to Tilt Legal.
- Hosted browser OAuth/account linking remains blocked. Bundjil does not reuse
  the Codex CLI client, redirect URI, PKCE exchange, browser session, or
  refresh token.
- Eve integration with this workaround is out of scope. Gateway remains the
  default until a separate SPEC changes that boundary.

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

For the private Codex proxy app:

```bash
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
```

The proxy smoke test starts a local Bun server on an ephemeral port, verifies
`GET /health`, and verifies authenticated mock OpenAI-compatible SSE without
calling Codex.

The Codex proxy runbook is deliberately separate from Eve. It provides local
import, preview import, status-only self-tests, expiry/re-import, and mock
rollback without exposing credentials or request content. Do not point Eve at
the preview proxy as part of this workaround; a later integration requires its
own SPEC.

## Layout

```text
apps/
  agent/             Vercel Eve app and workspace_status tool.
  codex-proxy/       Private Effect HTTP proxy for Codex provider proof.
packages/
  core/              Framework-neutral Bundjil domain primitives.
  codex-oauth/       Codex OAuth profiles and direct Codex Responses proof.
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
- Every implementation task that touches Effect runtime, provider, app, or
  storage behavior must record the mandatory 3-pass Effect TS audit:
  ownership/call graph, implementation quality, and verification coverage.
- JSON string boundaries in app/package code must use Effect Schema codecs such
  as `Schema.fromJsonString(...)` and `Schema.UnknownFromJsonString`.

## Roadmap

1. Keep Gateway as the default Eve model provider while Codex proxy remains
   opt-in.
2. Add hosted token storage and refresh for the Codex proxy behind Effect
   `KeyValueStore`.
3. Complete a hosted live Codex proxy proof before considering Codex proxy as
   the default provider.
4. Define channel-neutral message, identity, consent, and task contracts in
   `@bundjil/core`.
5. Add the Sendblue iMessage webhook and outbound delivery adapter.
6. Add the Cloudflare email ingress path.
7. Connect Notion through Vercel Connect and model the first personal workflows.
8. Add readback, observability, and replayable verification for every channel.

## References

- [Bunjil the creator - Bunjil Place](https://www.bunjilplace.com.au/our-story/bunjil-creator)
- [eve - The Agent Framework - Vercel](https://vercel.com/eve)
- [Sendblue documentation](https://docs.sendblue.com/)
- [Cloudflare Workers Email Routing API](https://developers.cloudflare.com/email-service/api/route-emails/email-handler)
- [Vercel Connect documentation](https://vercel.com/docs/connect)
