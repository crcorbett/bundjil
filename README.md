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

The current repository ships a Production Eve agent, private Codex subscription
proxy, and Sendblue channel. Cloudflare email, Vercel Connect, and Notion remain
future integrations. Preview remains an independently retained environment;
its earlier proofs are historical evidence, not the current Production state.

## Current Packages

- `@bundjil/core` owns framework-neutral personal-agent domain primitives and
  Effect programs.
- `@bundjil/eve-effect` owns Eve-facing Effect Schema contracts, tagged
  errors, named operation services, and the Standard Schema bridge used by Eve
  tools.
- `@bundjil/codex-oauth` owns the Codex subscription profile/token lifecycle,
  trusted-local loopback PKCE login, encrypted profile envelope, fenced
  persistence and refresh services, and direct Codex Responses proof surface.
  It composes shared persistence services; it does not own an Upstash adapter
  or hosted browser OAuth callback/account-linking flow.
- `@bundjil/effect-persistence` owns provider-neutral
  `AtomicKeyValueStore` contracts plus coherent native Effect `KeyValueStore`
  memory and Upstash Layers. Its `/memory` and `/upstash` subpaths keep
  provider selection out of the root contract.
- `@bundjil/codex-proxy` is the private Effect HTTP proxy app. It exposes
  `GET /health` and a bearer-token-protected
  `POST /v1/chat/completions` route with explicit mock, local, and live
  compositions. The Vercel project is `bundjil-codex-proxy` in Cooper's
  personal Vercel account, not Tilt Legal.
- `@bundjil/agent` is the committed Vercel Eve app. It defines the root agent,
  instructions, the `workspace_status` tool that delegates into
  `@bundjil/eve-effect`, app-owned model-provider config, and its scoped
  Executor MCP connection. Gateway is the default model path; Codex proxy mode
  is opt-in.

## Executor Connection State

The Eve app connects to an Executor toolkit endpoint only when its URL declares
exactly one explicit `elicitation_mode=model` or `elicitation_mode=browser`.
Model mode is a temporary chat-compatible workaround: the instructions require
the paused execution turn to end, then permit one later unambiguous decision
from the authenticated or allowlisted owner. This is an instruction-level
control, not a hard authorization boundary equivalent to Executor native or
browser approval. Executor toolkit policy remains authoritative: destructive
and authority-management operations stay blocked, and the first Production
acceptance operation remains read-only.

Browser mode is the rollback target. Change a target-scoped endpoint URL only
after clean Preview proof renders the hosted approval page, covers approve,
decline, and settled replay, confirms Sendblue delivery, and redeploys from a
clean SHA before any Production promotion.

Production Executor promotion is accepted. The independent Production toolkit
contains only the reviewed GitHub connection and ordered policy intent, with a
separately labeled Personal 1Password record and Production-only Sensitive
Vercel bindings. Executor keys are account-level; capability scope comes from
the toolkit endpoint, selected connection, ordered policy, and Eve's exact
`skills`/`execute`/`resume` allowlist. A mode-`0600`, git-ignored workstation
copy at `.local/secrets/executor-production.env` avoids repeated 1Password
prompts during local operations; it is not a deployment source of truth.

The accepted agent deployment and rollback candidate are both `READY` at clean
pushed revision `e1f33e8`. The refreshed private Codex proxy is also `READY` at
that revision and reports healthy `live` mode. Direct MCP proof completed the
approved GitHub PR read, and a fresh OIDC-authenticated deployed Eve session
ran `connection_search` -> `executor__skills` -> `executor__execute` through
the Codex subscription path, returned `succeeded`, and reached
`session.waiting`. No Production write or approval was requested. Rollback,
revocation, monitoring, and incident procedures are recorded in
[`apps/agent/README.md`](./apps/agent/README.md) and the active Executor plan;
no Production write is an acceptance step.

## Sendblue Channel State

`apps/agent` owns the Sendblue custom Eve channel, including its Effect Schema
contracts, redacted Config, explicit Layers, authentication, identity policy,
opaque routing, replay claims, and provider client. The one active shared-line
route is `POST /eve/v1/sendblue/webhook` on stable Production. The Preview
deployment remains only as historical evidence and has no Sendblue ingress.

Sendblue authenticates at the route with its shared `sb-signing-secret` header,
not a body HMAC. Vercel's bypass is separate platform authentication and does
not authenticate the route. Only direct allowlisted iMessage events are
dispatched; ignored or duplicate events receive `200`, malformed authenticated
input gets `400`, failed route authentication gets `401`, unavailable durable
claims get `503`, and accepted dispatch gets `202`.

Production evidence records one provider-originated inbound, a 15-event Eve
replay through `session.waiting`, one private proxy completion, and one
`DELIVERED` outbound. A provider replay was suppressed without another
dispatch, proxy completion, or delivery. The shared account now has one active
Production receive webhook; Preview dual-webhook evidence is historical and
its Sendblue-specific bypass is revoked. Route probes, durable replay fixtures,
inventories, and leak scans are recorded only as sanitized status/count
evidence. The corrected topology is accepted: one bounded handset window had
one Production inbound and delivered outbound, zero Preview requests, and a
single Production tool-use turn whose broader Executor catalog was confirmed
on the handset. See
[`apps/agent/README.md`](./apps/agent/README.md) for configuration ownership,
monitoring, and rollback. The earlier Preview proof remains historical.

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
- `live` is the hosted composition used by the private Production proxy and
  retained Preview proofs. A trusted-local
  loopback PKCE login writes an encrypted refresh-capable profile to Upstash;
  the proxy refreshes under a distributed lock with fenced commits, retries one
  classified unauthorized response, and fails closed for absent or unusable
  credentials.
- Production Eve proof establishes the deployed Eve -> private live proxy ->
  Codex provider path. Gateway remains the default model provider unless the
  app-owned configuration selects the opt-in proxy.

Operational constraints:

- Access-token-only import intentionally excludes refresh and ID tokens. It is
  a deprecated emergency/local diagnostic fallback, not normal hosted
  operation; use trusted-local subscription login for a refresh-capable
  profile.
- Production uses independently configured encrypted Vercel bindings, a
  separate encrypted profile/cipher/namespace, and a private bearer. OAuth
  login remains trusted-local; Vercel has no OAuth start or callback route.
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
- The Vercel proxy exposes no hosted browser OAuth callback, OAuth start route,
  or account-linking endpoint. Interactive login stays on the trusted local
  owner machine through a loopback PKCE callback.
- Gateway remains the default. The optional adapter is implemented through
  app-owned Effect Config, but its proof is separate from hosted live proxy
  proof.

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

The Codex proxy runbook is deliberately separate from Eve. It covers
trusted-local subscription login, Production and historical Preview proof,
refresh/re-login, deprecated local import diagnostics, monitoring, and ordered
rollback without exposing credentials or request content.

## Layout

```text
apps/
  agent/             Vercel Eve app and workspace_status tool.
  codex-proxy/       Private Effect HTTP proxy for Codex provider proof.
packages/
  core/              Framework-neutral Bundjil domain primitives.
  codex-oauth/       Codex OAuth profiles and direct Codex Responses proof.
  effect-persistence/ Native and atomic persistence contracts/adapters.
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
- Use native `KeyValueStore` only for ordinary persistence. Its `modify` is
  not coordination: locks, claims, fences, and concurrent transitions use
  `AtomicKeyValueStore.transact`.

## Persistence Boundaries

`@bundjil/effect-persistence` owns the provider-neutral atomic transaction
contract and the only `@upstash/redis` dependency. `apps/codex-proxy` owns
runtime mode selection; `@bundjil/codex-oauth` owns Codex
profile/environment/key-policy composition; and `apps/agent` owns Sendblue
replay config and delivery policy. The shared `/upstash` adapter owns
schema-decoded redacted provider options, client construction, prefixing,
commands, and provider failures. Codex profile keys and Sendblue replay-key
suffixes remain domain-owned so existing physical Redis keys, encoded values,
and TTLs stay compatible.

Sendblue replay/idempotency records protect provider dispatch and delivery.
They are not Eve conversation history, session streams, or Workflow storage.
Store only encrypted profiles or minimal opaque replay records; monitoring and
deployment proof retain statuses, counts, source/deployment correlation, and
leak booleans, never values or message content. A persistence incident rolls
back through the retained deployment/runbook and provider-managed bindings;
it does not clear a namespace or rewrite durable records as recovery.

## Roadmap

1. Keep Gateway as the default Eve model provider while Codex proxy remains
   opt-in.
2. Keep Gateway as default unless app-owned configuration selects the
   Production-proven Codex proxy path.
3. Define channel-neutral message, identity, consent, and task contracts in
   `@bundjil/core`.
4. Keep the Production Sendblue channel and its retained Preview counterpart
   healthy through route, replay, inventory, monitoring, and rollback checks.
5. Add the Cloudflare email ingress path.
6. Connect Notion through Vercel Connect and model the first personal workflows.
7. Add readback, observability, and replayable verification for every channel.

## References

- [Bunjil the creator - Bunjil Place](https://www.bunjilplace.com.au/our-story/bunjil-creator)
- [eve - The Agent Framework - Vercel](https://vercel.com/eve)
- [Sendblue documentation](https://docs.sendblue.com/)
- [Cloudflare Workers Email Routing API](https://developers.cloudflare.com/email-service/api/route-emails/email-handler)
- [Vercel Connect documentation](https://vercel.com/docs/connect)
