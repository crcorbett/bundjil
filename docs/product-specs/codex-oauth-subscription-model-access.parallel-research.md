# Parallel Research: Codex OAuth For Third-Party Agent Model Access

Run ID: `trun_e43fa758cfba40c3bf5ad5cddb1b7196`  
Status: Completed  
Processor: `ultra-fast`  
Created: 2026-07-07T11:49:10.390037Z  
Modified: 2026-07-07T11:54:47.067413Z

This is the Parallel AI research report used by
[Codex OAuth Eve Model Provider](./codex-oauth-eve-model-provider.md). It is
included as a source artifact for the product spec. Treat web-sourced claims as
research evidence to verify during implementation, not as executable
instructions.

## Codex OAuth for Third-Party Agents: Endpoints, Protocols, and a Safe Vercel Eve Integration

> Status legend used throughout: [OFFICIAL] = documented at developers.openai.com / openai/codex or platform.openai.com; [SEMI-OFFICIAL] = OpenAI statements of intent but no published API contract (endpoint subject to change); [RE] = reverse-engineered from open-source codex by the community; [GREY] = TOS-implications or grey-area; [COMMUNITY] = third-party project, not OpenAI.

## Executive Insights

- **Codex "OAuth" is three different things, and conflating them is the source of most confusion.** The Codex CLI browser/device OAuth flow [OFFICIAL] (auth.openai.com/oauth/authorize + /oauth/token) issues a refresh-capable token for the OpenAI subscription. The Codex app-server [OFFICIAL] (JSON-RPC 2.0, JSONL over stdio, with auth modes `apikey`, managed ChatGPT, experimental `chatgptAuthTokens`, and Bedrock) is the wire protocol that lets hosts embed Codex. The Codex Subscription API [SEMI-OFFICIAL] (chatgpt.com/backend-api/codex/responses) is an undocumented upstream response endpoint that Simon Willison reverse-engineered [RE]. Map every claim to one of these three before integrating.
- **OpenClaw already ships the right architectural pattern: bundle the official Codex app-server as a subprocess and route every `openai/*` request through it.** OpenClaw's per-agent `CODEX_HOME` isolation, auth precedence order, and the deliberate scrubbing of `CODEX_API_KEY` / `OPENAI_API_KEY` from the child env when a subscription is detected is the de facto safe-by-default pattern for OpenAI subscription auth [OFFICIAL: Codex harness reference] [COMMUNITY: OpenClaw].
- **The Codex Subscription API has OpenAI's "we want people to be able to use Codex, and their ChatGPT subscription, wherever they like" blessing, but no contract.** OpenAI's published guidance is that the endpoint is undocumented, can change without notice, and that API keys are preferred for production workflows [SEMI-OFFICIAL + RE]. Treat any third-party dependency on `chatgpt.com/backend-api/codex/responses` as version-pinned and isolated to non-critical workloads.
- **Vercel AI Gateway does not accept a ChatGPT OAuth token as a substitute for an OpenAI API key.** Its three auth models (Vercel-issued OIDC, BYOK, and gateway-billed pass-through) all terminate at the gateway's upstream provider relationship with OpenAI or the customer's stored provider key [OFFICIAL]. If Vercel Eve needs ChatGPT-subscription pricing, the AI Gateway is not the billing vehicle; the Codex OAuth credentials must be held by the Eve runtime itself.
- **"Login with ChatGPT" exists in two unrelated forms.** OpenAI's Apps SDK OAuth 2.1 + Auth0/DCR/PKCE/JWT+JWKS [OFFICIAL] authenticates a remote MCP/HTTP server so that an OAuth'd ChatGPT-app user can call it; it does not let a third party bill LLM usage to the user's ChatGPT subscription. The other "Login with ChatGPT" is the LoginWithChatGPT React component by Savio Martin (Result) [COMMUNITY/RE] which uses device-code auth to drive Codex app-server turns against gpt-5.5-codex-fast on the user's plan quota.
- **The Anthropic mirror pattern is the strongest precedent: Claude Code's `claude login` issues `CLAUDE_CODE_OAUTH_TOKEN` and OpenClaw consumes it directly via the `ANTHROPIC_API_KEY` env, no Anthropic key required.** This is the same architectural shape Codex OAuth follows [COMMUNITY, substack: Reusing Claude Code's OAuth Token for OpenClaw]. The TypeScript Effect service can mirror the pattern but must own its own refresh loop because the upstream does not guarantee server-side refresh for unauthorized callers.
- **Hermes Agent and Pi coding agent expose fundamentally different surfaces.** Hermes [COMMUNITY, Nous Research] runs Hermes 3/4 open-weight models by default but its API server exposes an OpenAI-compatible endpoint that can point at any upstream URL, so it can sit in front of an OpenAI-key route, the Vercel AI Gateway, or a Codex-subscription proxy. Pi coding agent [COMMUNITY, earendil-works] uses `@earendil-works/pi-ai` as a unified LLM client with Anthropic, OpenAI, Google, Azure providers, but auth is strictly per-provider env keys and a `/login` command; no ChatGPT OAuth flow exists.
- **The TypeScript Effect service in a Vercel Eve app should not re-implement the OAuth client. It should consume the Codex app-server JSON-RPC plugin openclaw-style.** Spawn `codex app-server` (default stdio transport), set `CODEX_HOME` to an isolated directory, run initialize/initialized handshake, then send `thread/start` + `turn/start`. The Effect service wraps token storage in Eve Connect or in a sealed Vercel KV namespace; refresh as an Effect Schedule with retry on invalid_grant and 400/401; circuit-break on 401 chains.

## Background: What "Codex OAuth" Actually Refers To

The phrase "Codex OAuth" appears in at least four distinct design conversations, and treating them as the same is the root of integration mistakes:

1. **Codex CLI ChatGPT sign-in** [OFFICIAL]. A user-level OAuth 2.0 + PKCE flow between the Codex CLI binary and `auth.openai.com`, used to bind the CLI to a ChatGPT Plus / Pro / Business / Edu / Enterprise plan [2] [1].
2. **Codex app-server's `chatgptAuthTokens` mode** [OFFICIAL]. A host application (a third-party IDE, an embedded agent, OpenClaw, Promptfoo) supplies an already-issued OAuth `accessToken` to the JSON-RPC server, allowing it to converse with the Codex backend without the user re-doing the browser dance every time [56] [54].
3. **Codex Subscription API** [SEMI-OFFICIAL/RE]. The undocumented `chatgpt.com/backend-api/codex/responses` endpoint, reverse-engineered by Simon Willison, that lets any HTTP caller reuse Codex CLI credentials to drive the same model family the user has plan access to [36] [72].
4. **OpenAI Apps SDK OAuth 2.1** [OFFICIAL]. The standard OAuth path used to authenticate a remote MCP server that runs inside a ChatGPT apps context; this is a server-to-ChatGPT platform flow, not a ChatGPT-subscription-to-LLM-credit flow [47] [87].

The first three are the ones relevant to "use my ChatGPT subscription as model access for a third-party agent." The fourth is commonly confused with the third but has a different purpose.

## The Codex CLI ChatGPT OAuth Flow [OFFICIAL]

The Codex CLI exposes three documented sign-in methods [2] [1] [4]:

| Method        | Trigger                              | Underlying endpoints                                                                                                                                   | Token storage                                                                 | Capability gate                                                                                                   |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Browser OAuth | `codex login`                        | `https://auth.openai.com/oauth/authorize` with PKCE on a local http server bound to port 1455; token exchange at `https://auth.openai.com/oauth/token` | `~/.codex/auth.json` plaintext (mode `file`) or OS keyring (`keyring`/`auto`) | Full subscription features including fast mode, cloud tasks, Codex-Spark                                          |
| Device code   | `codex login --device-auth`          | User visits `https://auth.openai.com/device`                                                                                                           | Same as above                                                                 | Same; must be enabled in ChatGPT security settings; supported by the app-server device-code path added March 2026 |
| API key       | `codex login --with-api-key` (stdin) | Standard `https://api.openai.com/v1/...` (`sk-...`)                                                                                                    | Same                                                                          | Core CLI only; subscription features excluded                                                                     |

Across all three, the OAuth-side client id reported by community inspection of the open-source binary is `app_EMoamEEZ73f0CkXaXp7hrann` [1]. Token refresh is proactive and reactive on 401, with sessions considered stale after approximately 8 days without refresh. For CI/CD, `CODEX_AUTH_JSON` seeds `auth.json` so a remote runner never has to do a browser dance [1]. There is no public API contract for the auth endpoints themselves; the community references are derived from reading open-source code in `openai/codex`.

Takeaway: a TypeScript Effect service that does not want to spawn a CLI subprocess can still drive the same flow by reproducing the PKCE dance + token calls, but it must take responsibility for refresh, keyring secret storage, and stale-session handling. This is fragile. The cleaner alternative is to delegate the dance to the Codex binary and talk to it via JSON-RPC.

## The Codex App-Server [OFFICIAL]

In February 2026 OpenAI published the Codex App Server architecture: a JSON-RPC 2.0 interface, transported as JSONL over stdio (default), Unix sockets, or an experimental WebSocket, that powers the Codex CLI, the Codex VS Code extension, and any third-party rich client that speaks the protocol [56] [57]. The `codex-app-server-protocol` crate is published to crates.io and the Elixir/Python/TypeScript client packages are proliferating [58] [102].

The auth model is explicitly multi-modal and supports an external host calling it with ChatGPT credentials [56]:

| Auth mode                          | Identifier                   | Source of credentials                                                 |
| ---------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `apikey`                           | Direct OpenAI API key        | Operator-supplied string                                              |
| Managed ChatGPT (browser)          | Internal id                  | Codex binary handles PKCE + refresh itself                            |
| Managed ChatGPT (device code)      | Internal id                  | Codex binary, headless-friendly; app-server support landed March 2026 |
| `chatgptAuthTokens` (experimental) | accessToken supplied by host | Host's own OAuth-issued ChatGPT access token                          |
| Bedrock                            | AWS creds                    | AWS console-login or profile                                          |

Two points that drive a TypeScript Effect service's design:

- the JSON-RPC server enforces authentication before the `initialize` / `initialized` handshake, so the Effect client has to be auth-ready before any handshake call [100];
- the lifecycle model is Threads -> Turns -> Items, with `thread/start`, `turn/start`, `turn/steer`, `turn/interrupt` and a v2 filesystem RPC layer (`fs/readFile`, `fs/writeFile`, `fs/watch`, etc.) [54].

The `chatgptAuthTokens` mode, the experimental external-token mode, is precisely the surface area for "my third-party host is already authenticated to ChatGPT, let the app-server spend on the user's plan." It is also the least stable mode of the five; OpenAI marks it experimental in the docs.

## The Codex Subscription API [SEMI-OFFICIAL + RE]

A separate, parallel ecosystem exists around the upstream Codex backend. Simon Willison's reverse-engineering write-up of late April 2026 documents the `chatgpt.com/backend-api/codex/responses` endpoint, which accepts Codex-issued access tokens and returns Codex-style streaming responses for the same models the subscription covers [36] [69]. OpenAI's posture is captured in a single quote: "We want people to be able to use Codex, and their ChatGPT subscription, wherever they like" [36]. The same write-up notes that the endpoint is undocumented and can change without notice, and that OpenAI recommends API-key auth for production workflows.

This is the surface the proxy ecosystem sits on:

- **simonw/llm-openai-via-codex** [COMMUNITY/RE] - A Simon Willison plugin for his `llm` CLI tooling that "hijacks your Codex CLI credentials" to issue OpenAI-style model calls. Demonstrates the minimal viable bridge: read `~/.codex/auth.json`, craft an HTTP request to the subscription endpoint, parse streaming responses [72].
- **Codex2API** [COMMUNITY/RE] - Open-source account-pool proxy with automatic credential refresh and token-pool scheduling. Provides OpenAI-compatible `/v1/chat/completions` [36]. Single-tenant operation is in a grey TOS zone; pooled multi-account operation is more clearly against usage policies.
- **icebear0828/codex-proxy** [COMMUNITY/RE] - "OpenAI-compatible proxy for ChatGPT Codex Responses API." Converts Codex Responses -> OpenAI `/v1/chat/completions` + Anthropic `/v1/messages` + Gemini; optional Ollama-compat bridge [63].
- **xiaoshaoning/codex-bridge** [COMMUNITY/RE] - TypeScript proxy that converts OpenAI Responses -> DeepSeek Chat Completions, so Codex CLI can act against DeepSeek models [67].
- **CLIProxyAPI** [COMMUNITY/RE] - Docker-deployable proxy that supports Codex OAuth login plus Claude and Gemini logins; client-side configurable [64].
- **LoginWithChatGPT** [COMMUNITY/RE] - A React component by Savio Martin (Result, CTO), June 26 2026. Users authorize with a one-time device code from ChatGPT settings; the embedding site drives gpt-5.5-codex-fast through Codex on the user's plan quota [29].
- **TokenProvider.store** [COMMUNITY] - Commercial pay-as-you-go token gateway bundling Claude, Claude Code, ChatGPT, and Gemini behind a single OpenAI-compatible billing surface [65].

Most of these repos are TypeScript- or Python-native; for a TypeScript Effect service the relevant precedent is `icebear0828/codex-proxy` and `xiaoshaoning/codex-bridge` as shape references.

## Case Study: OpenClaw's Embedded Codex App-Server

OpenClaw by OpenClaw Labs treats Codex as the canonical OpenAI route by default [18] [49] [51]. For any embedded agent turn on `openai/*`, OpenClaw launches the bundled Codex app-server as a subprocess. The auth layout is deliberate and worth modeling:

1. **Auth precedence.** First, an OpenClaw Codex auth profile configured under `auth.order.openai`. Second, the app-server's existing account in the agent's `CODEX_HOME`. Third, for local stdio launches only, `CODEX_API_KEY` then `OPENAI_API_KEY`.
2. **Per-agent `CODEX_HOME`.** For local stdio launches, OpenClaw sets `CODEX_HOME` to a per-agent directory so that Codex config, auth files, plugin cache, and native thread state do not touch the operator's personal `~/.codex`. This is the isolation primitive every multi-tenant Eve service should copy.
3. **Anti-billing safeguard.** To prevent accidental API billing during subscription-style turns, OpenClaw explicitly removes `CODEX_API_KEY` and `OPENAI_API_KEY` from the spawned Codex child process when a ChatGPT subscription-style auth profile is detected. This makes the dual-auth case safer by construction.
4. **OpenClaw -> Codex app-server transport.** Local stdio or WebSocket. OpenClaw honors the same JSON-RPC envelope that OpenAI publishes, so any client of the app-server is also an OpenClaw client.

Pattern lesson: delegate subscription auth to a subprocess that already handles refresh + storage. Reproduce this pattern in Vercel Eve by spawning the Codex app-server in a sandbox/sidecar and talking JSON-RPC over stdio; do not reimplement the OAuth dance unless app-server cannot satisfy the requirement.

## Case Study: Code Reuse Across Subscription Ecosystems

The strongest validation that subscription-OAuth reuse works in practice comes from outside the OpenAI ecosystem. In March 2026, the Substack "Reusing Claude Code's OAuth Token for OpenClaw" documented the same shape of pattern: after `claude login` creates a `CLAUDE_CODE_OAUTH_TOKEN`, OpenClaw consumes it as `ANTHROPIC_API_KEY`, so one subscription drives two agents with no second Anthropic API key [84].

The Codex side is harder because the equivalent env var (`CODEX_API_KEY` vs the OAuth access token) is not interchangeable. Codex's binary knows to introspect a token's shape and route accordingly, but a third-party caller passing the OAuth `access_token` in the wrong slot will get a 401 or, worse, a silent bill through API key metered usage.

This is why the Codex app-server's `chatgptAuthTokens` mode matters: it gives the host a deterministic slot to pass through ChatGPT OAuth credentials without falling through to the API-key path.

## Case Study: Hermes Agent and Pi as Comparative Surfaces

Hermes Agent by Nous Research runs Hermes 3 / Hermes 4 locally or pointed at any OpenAI-compatible upstream [22] [74]. Its API server exposes an OpenAI-compatible HTTP endpoint. A Hermes deployment can therefore be wired in three configurations with different billing implications:

1. **Local Hermes models** - local inference, no per-token OpenAI billing.
2. **Hermes proxying to a Codex-subscription proxy** - requests ride on the user's ChatGPT plan, assuming a Codex-compatible proxy is the upstream.
3. **Hermes proxying to Vercel AI Gateway** - requests ride on Vercel credits or BYOK provider keys.

Pi coding agent by earendil-works uses `@earendil-works/pi-ai` as a unified multi-provider LLM client [77] [34] [33]. Providers include Anthropic, OpenAI, Google, and Azure. Authentication is provider-key-shaped: env vars, a `/login` command for interactive login, and a `--api-key` flag for keyless local servers. There is no documented ChatGPT OAuth flow in Pi. A Pi agent cannot currently consume a ChatGPT OAuth token as model access without adding a bridge layer.

Takeaway: between Hermes and Pi, only Hermes has a tractable path to consuming ChatGPT subscription credentials as model access, and only via the upstream-URL-pointer pattern. Pi would require code modifications.

## Vercel AI Gateway: Where It Fits and Where It Does Not [OFFICIAL]

The Vercel AI Gateway exposes an OpenAI Chat Completions-compatible surface and routes to multiple upstream providers [6] [7] [96] [97]. Auth to the Gateway itself has three documented options:

| Auth model                | Who holds the provider key                       | Who pays OpenAI                         |
| ------------------------- | ------------------------------------------------ | --------------------------------------- |
| Vercel-issued OIDC token  | Vercel                                           | Vercel or Vercel-billed tokens          |
| BYOK (Bring Your Own Key) | Customer stores provider key in Vercel dashboard | Provider, using the customer's key      |
| Gateway-managed billing   | Vercel                                           | Vercel-marked-up, "no markup on tokens" |

The Gateway does not accept a ChatGPT OAuth token as a substitute for an OpenAI API key. Every authenticated Gateway request terminates in a Gateway-to-OpenAI request that the Gateway authorizes using either its own OIDC relationship with OpenAI or the stored BYOK API key. A customer who supplies only a `codex login`-style ChatGPT OAuth access token and no API key cannot route traffic through the Gateway to OpenAI via the OAuth-subscription path.

This is the central tension in the implementation question: Vercel Eve docs promote AI Gateway as the canonical way to make model calls [13] [14] [92], but the Gateway's billing model is detour-through-Vercel or BYOK API key, not "use my ChatGPT plan." To route ChatGPT-OAuth traffic an Eve service must step outside AI Gateway's normal path and either embed Codex app-server or operate a local Codex2API / codex-proxy-style sidecar.

## OpenAI Apps SDK: What It Is and What It Is Not [OFFICIAL]

Many blog readers conflate OpenAI's Apps SDK OAuth with "Login with ChatGPT." The two have different objectives [47] [87] [88] [90]:

| Apps SDK OAuth (OFFICIAL)                                                | "Login with ChatGPT" (COMMUNITY/RE)                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Server-to-ChatGPT platform OAuth                                         | Server-to-Codex-app-server OAuth                                               |
| Authenticates a remote MCP/HTTP server so a ChatGPT-app user can call it | Authenticates a third-party app so it can spend on the user's ChatGPT LLM plan |
| OAuth 2.1 / Auth0 / DCR / PKCE / JWT + JWKS                              | OAuth 2.0 + PKCE (Codex CLI client) + ChatGPT device code                      |
| Auth context: which end-user is calling my server                        | Auth context: whose ChatGPT plan should this LLM call bill to                  |
| Tool calls fire on behalf of the user inside ChatGPT                     | Tool calls fire on behalf of the user's plan outside ChatGPT                   |
| Goal: data integration inside ChatGPT conversations                      | Goal: reuse subscription pricing outside ChatGPT UI                            |

A TypeScript Effect service inside a Vercel Eve app almost never wants Apps SDK OAuth for model access. It wants the subscription-spend variant.

## Synthesis: Cross-Cutting Comparison and the Safe Integration Path

| Surface                            | Codex CLI OAuth (browser)                        | Codex App-Server `chatgptAuthTokens`                   | Codex Subscription API (`chatgpt.com/backend-api/codex/responses`) | OpenAI Apps SDK OAuth                                             | Vercel AI Gateway                                |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------ |
| Support status                     | OFFICIAL                                         | OFFICIAL (experimental flag)                           | SEMI-OFFICIAL / RE                                                 | OFFICIAL                                                          | OFFICIAL                                         |
| Wire                               | OAuth 2.0 PKCE over HTTPS                        | JSON-RPC 2.0 over stdio/JSONL                          | HTTPS responses endpoint                                           | OAuth 2.1 / Auth0 / DCR / PKCE / JWT                              | HTTPS REST                                       |
| Token location                     | `~/.codex/auth.json` or keyring                  | Supplied by host each session                          | Built from `~/.codex/auth.json` token                              | Standard OAuth token store                                        | Provider key in Vercel dashboard                 |
| Refresh                            | Proactive + 401 reactive, ~8d stale              | Same (managed by Codex binary on host's behalf)        | Host-managed                                                       | Standard                                                          | Provider-managed                                 |
| Plans accepted                     | Plus/Pro/Business/Edu/Enterprise                 | Same                                                   | Same                                                               | End-user ChatGPT accounts for app context                         | N/A (no subscription auth)                       |
| Plan-billed LLM calls              | Yes                                              | Yes                                                    | Yes                                                                | No (calls are billed to the tool's own auth, not the user's plan) | No (calls are billed via Vercel credits or BYOK) |
| Risk of silent API-billed fallback | Yes (if host exposes `OPENAI_API_KEY` and login) | No (bin separation)                                    | Yes (if host treats as API key)                                    | No                                                                | No                                               |
| Used by                            | Codex CLI                                        | OpenClaw, Promptfoo, Vercel Eve-Codex-bridge candidate | codex-proxy, Codex2API, llm-openai-via-codex, LoginWithChatGPT     | ChatGPT apps with MCP servers                                     | All Vercel + AI SDK consumers                    |

Non-obvious tensions:

- **The same native binary can either protect against or expose the user to API-billed usage.** OpenClaw proves negative: when it sees a subscription profile, it scrubs API-key env. A naive consumer that does not scrub can accidentally bill API usage after OAuth login. The Codex binary's `apikey` slot is a foot-gun unless the host actively prevents it.
- **Vercel AI Gateway is the canonical Eve model-routing path, but is incompatible with subscription billing.** AI Gateway can only route calls it can authenticate upstream with, and that upstream auth is BYOK key or Vercel-managed billing. If Eve users want their ChatGPT plan to be Eve's model wallet, AI Gateway cannot deliver.
- **The Codex Subscription API is blessing-and-curse.** OpenAI's "wherever they like" statement is permission to ship wrappers; the same docs warn the endpoint can change without notice. The right pattern is to pin a known-good Codex CLI version and treat its `chatgpt.com` client behavior as a versioning contract.
- **OpenAI Apps SDK is the wrong mental model.** Apps SDK OAuth authenticates a remote MCP server; it is not Codex subscription OAuth.

## Actionable Design for the TypeScript Effect Service in a Vercel Eve App

The safest, most-supported path is OpenClaw's pattern, expressed in Effect idioms:

1. **Treat the Codex CLI binary as your OAuth client.** Spawn `codex app-server` inside an Eve Sandbox or equivalent sidecar. Use stdio. Do not reimplement PKCE unless app-server cannot satisfy the requirement.
2. **Use isolated `CODEX_HOME` per agent.** Set `CODEX_HOME=/var/lib/eve/agents/$AGENT_ID/codex` or an equivalent local/hosted path on the subprocess. Persist it in a sealed storage boundary so auth survives across workflow runs but never bleeds into another tenant.
3. **Enforce the JSON-RPC handshake correctly.** Auth is enforced before `initialize`. The Effect service should open the JSON-RPC stream, send auth credentials via the app-server auth mode selector (`chatgptAuthTokens` with stored `accessToken` for subscription, or `apikey` for BYOK), await `initialize`, send `initialized`, then issue `thread/start`.
4. **Wrap the runtime as Effect Layers.** Model `CodexClient` as an Effect service with operations such as `threadStart`, `turnStart`, `turnSteer`, `turnInterrupt`, `readFile`, and `writeFile`. Effects return `Stream` for token-by-token processing. Each layer is parameterized by `AuthStrategy = Subscription | ApiKey | Bedrock`, and the layer chooses whether to scrub complementary env from the child. Tests should assert that `OPENAI_API_KEY` is absent when the strategy is `Subscription`.
5. **Refresh in an Effect Schedule only when bypassing the CLI.** If Bundjil bypasses the CLI, use retry-on-401 and atomic refresh-token persistence. Do not trust local `expiresAt` as authoritative; treat first 401 as refresh-trigger even if local expiry has not elapsed.
6. **For Vercel Connect integrations.** Use Vercel Connect for tool-side OAuth (Linear, GitHub, Stripe). Do not try to make Connect hold ChatGPT OAuth tokens; keep Codex auth in the app-server sandbox.
7. **Do not call `chatgpt.com/backend-api/codex/responses` directly as the primary contract.** If equivalent HTTP capability is needed, wrap a pinned proxy sidecar instead of reimplementing.
8. **TOS posture.** Single-user single-key subscription reuse via the user's Codex OAuth flow is the lowest-risk configuration. Pooled-credential multiplexing, third-party user billing against a subscription, or marketing as "free ChatGPT" increases TOS risk.
9. **Test surface.** Cover auth precedence when both API key and OAuth token are present; dummy-key local server paths; `CODEX_AUTH_JSON` seeding for CI; refresh race conditions; subscription-token revocation; and token redaction.

## Recommendations and Decision Framework

- **If the user already pays OpenAI for a ChatGPT Plus / Pro / Business / Edu / Enterprise plan, the right pattern is OpenClaw-style app-server embedding.** Use `codex app-server` inside an Eve Sandbox, isolated `CODEX_HOME`, no API-key fallback.
- **If the user pays OpenAI via a separate OpenAI API key, use Vercel AI Gateway with BYOK.** Do not reinvent OAuth plumbing.
- **If neither applies and the user wants free or local inference, point the Eve agent at Hermes Agent or any model that responds to OpenAI-compatible requests from a local server.** Pi has no equivalent default and would need a code patch.
- **Never mix the two paths.** The fastest way to confuse billing is to register an OpenAI API key, a ChatGPT OAuth subscription, and AI Gateway OIDC at the same time. Each path bills independently; the Effect service must keep header/env hygiene explicit.
- **Treat direct use of `chatgpt.com/backend-api/codex/responses` as a dependency-pinned third-party, not as a primary contract.** Pin Codex CLI version, version the proxy, log when endpoint behavior changes, and always have a fallback to a real API key.

The future-of-this-space question: OpenAI's stated intent ("wherever they like") suggests the subscription API may eventually be officially published; the experimental `chatgptAuthTokens` mode in the app-server suggests third-party embedding is also on the roadmap. Until those promote to stable, the right external posture is: spawn the binary, talk JSON-RPC, refresh via upstream mechanisms, and plan for an eventual migration to whatever OpenAI publishes next.

## References

1. _Codex CLI Authentication: OAuth, Device Code, API Keys, and ..._. <https://codex.danielvaughan.com/2026/04/01/codex-cli-authentication-flows-credential-management>
2. _CLI - Codex | OpenAI Developers_. <https://developers.openai.com/codex/cli>
3. _Authentication · Codex Docs_. <https://docs.onlinetool.cc/codex/docs/authentication.html>
4. _Auth + API key - sign-in paths for Codex CLI · Claw Planet_. <https://claw.aguidetocloud.com/openai/codex-cli/auth>
5. _Authentication - Codex | OpenAI Developers_. <https://developers.openai.com/codex/auth>
6. _OpenAI Chat Completions API - Vercel_. <https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions>
7. _Vercel AI Gateway docs_. <https://vercel.com/docs/ai-gateway>
8. _Vercel AI Gateway - GitHub_. <https://github.com/vercel/ai/blob/main/skills/use-ai-sdk/references/ai-gateway.md>
9. _Vercel AI Gateway - AI Model API - LLM Reference_. <https://www.llmreference.com/provider/vercel-ai-gateway>
10. _OpenAI Responses API_. <https://vercel.com/docs/ai-gateway/sdks-and-apis/responses>
11. _Vercel Releases Eve: An Open-Source AI Agent ..._. <https://www.marktechpost.com/2026/06/17/vercel-releases-eve>
12. _Eve vs Flue: Which TypeScript Agent Framework?_. <https://theroadtoenterprise.com/blog/eve-vs-flue-typescript-agent-framework>
13. _eve - The Agent Framework_. <https://vercel.com/eve>
14. _Introducing eve_. <https://vercel.com/blog/introducing-eve>
15. _Vercel AI Gateway | Developer Documentation - LlamaParse_. <http://developers.llamaindex.ai/python/framework/integrations/llm/vercel-ai-gateway>
16. _OpenClaw Custom Provider Setup: Add Any OpenAI-Compatible API_. <https://haimaker.ai/blog/openclaw-custom-provider-setup>
17. _Deploying Holo 3.1 as a Local Agent: Connecting llama.cpp to ..._. <https://knightli.com/en/2026/06/12/holo-3-1-local-agent-openclaw-llamacpp>
18. _OpenAI - OpenClaw_. <https://docs.openclaw.ai/providers/openai>
19. _openclaw-security-playbook/docs/guides/02-credential ... - GitHub_. <https://github.com/topazyo/openclaw-security-playbook/blob/main/docs/guides/02-credential-isolation.md>
20. _OpenClaw Custom API Setup: Connect Any Model in 5 Minutes (2026)_. <https://www.atlascloud.ai/blog/guides/openclaw-custom-api-setup>
21. _How to Set Up Hermes Agent: Complete Guide by Nous Research_. <https://www.braincuber.com/tutorial/hermes-agent-setup-tutorial>
22. _API Server | Hermes Agent_. <https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server>
23. _hermes-agent-handbook/.plans/openai-api-server.md at main ..._. <https://github.com/SpaceX-mit/hermes-agent-handbook/blob/main/.plans/openai-api-server.md>
24. _Hermes Agent Setup Guide (2026)_. <https://hermes-agent.ai/blog/hermes-agent-setup-guide>
25. _Hermes Agent vs OpenClaw: Which Open-Source AI Agent Should You Use? | MindStudio_. <http://mindstudio.ai/blog/hermes-agent-vs-openclaw-comparison>
26. _OAuth Token Refresh Strategies for ChatGPT Apps | MakeAIHQ_. <https://makeaihq.com/guides/cluster/oauth-token-refresh-strategies-chatgpt>
27. _CLI - Codex | OpenAI Developers_. <http://developers.openai.com/codex/cli>
28. _Evaluate ChatGPT MCP refresh_token support, then implement ..._. <https://github.com/vinicius-ssantos/github-unified-mcp/issues/33>
29. _LoginWithChatGPT: Codex OAuth, TOS & API Alternative (2026 ..._. <https://www.explainx.ai/blog/login-with-chatgpt-codex-subscription-oauth-2026>
30. _Using Codex with your ChatGPT plan | OpenAI Help Center_. <http://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan>
31. _Pi Coding Agent Setup Guide: Install, Configure Models, and ..._. <https://www.bitdoze.com/pi-coding-agent-setup-guide>
32. _Pi Coding Agent Setup Guide · GitHub_. <https://gist.github.com/schpet/85531b6a05a5d8119e859bdec6b0e0b8>
33. _pi-coding-agent · PyPI_. <https://pypi.org/project/pi-coding-agent>
34. _pi/packages/coding-agent/docs/models.md at main · earendil ..._. <https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md>
35. _Setting Up and Using the Pi Coding Agent - DeepakNess_. <https://deepakness.com/blog/pi-agent-setup>
36. _The Codex Subscription API: Programmatic Access to GPT-5.5 ..._. <https://codex.danielvaughan.com/2026/04/24/codex-subscription-api-programmatic-access-gpt-5-5-chatgpt-plan>
37. _Automate with Codex CLI on ChatGPT Plus subscription_. <https://medium.com/%40balazskocsis/automate-with-codex-cli-on-chatgpt-plus-subscription-d4f5c1e0c9a9>
38. _OpenAI Codex CLI: Official Description & Setup Guide (Updated ..._. <https://smartscope.blog/en/generative-ai/chatgpt/openai-codex-cli-comprehensive-guide>
39. _How to Handle Token Refresh in OAuth2 - oneuptime.com_. <https://oneuptime.com/blog/post/2026-01-24-oauth2-token-refresh/view>
40. _Effect Services & Layers (Office Hours 14) - YouTube_. <https://www.youtube.com/watch?v=06htYotj_Pc>
41. _Clarification on Services and Layers in Effect Typescript Library_. <https://www.answeroverflow.com/m/1441927316723728536>
42. _Dependency Management, Effect Service Layers (Office Hours 1)_. <https://www.youtube.com/watch?v=4picSqwsA-U>
43. [[BUG] OAuth refresh returns 400 after early 401 before ...](http://github.com/anthropics/claude-code/issues/54443)
44. _ChatGPT App: OpenAI Apps SDK, OAuth2 & Custom Widgets_. <https://mcpmarket.com/server/chatgpt-app-1>
45. _clientcredentials package - golang.org/x/oauth2/clientcredentials_. <https://pkg.go.dev/golang.org/x/oauth2/clientcredentials>
46. _MCP OAuth code issued but ChatGPT never calls /token (Authorize MCP ..._. <https://community.openai.com/t/apps-sdk-submission-blocked-mcp-oauth-code-issued-but-chatgpt-never-calls-token-authorize-mcp-modal-hangs/1385089>
47. _Authentication - Apps SDK | OpenAI Developers_. <https://developers.openai.com/apps-sdk/build/auth>
48. _Understanding OAuth 2.0 Client Credentials Grant (Part 2) - Medium_. <https://medium.com/%40vgzxkgmrpn/understanding-oauth-2-0-client-credentials-grant-5b147354a5aa>
49. _Codex harness reference - OpenClaw Docs_. <https://docs.openclaw.ai/plugins/codex-harness-reference>
50. _Codex - ClawHub Plugins_. <https://clawhub.ai/plugins/%40openclaw/codex>
51. _Codex harness - OpenClaw_. <https://docs.openclaw.ai/plugins/codex-harness>
52. _OpenClaw Codex Plugin: Config & App-Server Setup | OpenClaw_. <https://open-claw.bot/docs/tools/plugins/codex-harness-reference>
53. _OpenClaw Plugin For Codex App Server - ClawHub Plugins_. <https://clawhub.ai/plugins/openclaw-codex-app-server>
54. _The Codex App-Server: Building Custom Integrations with the ..._. <https://codex.danielvaughan.com/2026/03/28/codex-app-server-json-rpc-protocol>
55. _OpenAI Codex App Server - Promptfoo_. <https://www.promptfoo.dev/docs/providers/openai-codex-app-server>
56. _Codex App Server_. <https://developers.openai.com/codex/app-server>
57. _OpenAI Publishes Codex App Server Architecture for ..._. <https://www.infoq.com/news/2026/02/opanai-codex-app-server>
58. _codex-app-server-protocol - crates.io: Rust Package Registry_. <https://crates.io/crates/codex-app-server-protocol>
59. _GitHub - icebear0828/codex-proxy: OpenAI-compatible proxy for ..._. <https://github.com/icebear0828/codex-proxy>
60. _GitHub - xiaoshaoning/codex-bridge: A TypeScript proxy server ..._. <https://github.com/xiaoshaoning/codex-bridge>
61. _llm-openai-via-codex 0.1a0_. <https://www.alldevblogs.com/article/simon-willison/llm-openai-via-codex-01a0>
62. _A pelican for GPT-5.5 via the semi-official Codex backdoor API_. <https://www.alldevblogs.com/article/simon-willison/a-pelican-for-gpt-55-via-the-semi-official-codex-backdoor-api>
63. _Release: llm-openai-via-codex 0.1a0 - simonwillison.net_. <https://simonwillison.net/2026/Apr/23/llm-openai-via-codex>
64. _Hermes Agent | Nous Research_. <https://hermes-agent.nousresearch.com/>
65. _earendil-works/pi: AI agent toolkit: unified LLM API ..._. <https://github.com/earendil-works/pi>
66. _Reusing Claude Code's OAuth Token for OpenClaw_. <https://oldeucryptoboi.substack.com/p/reusing-claude-codes-oauth-token>
67. _Guide to authentication and user consent in the OpenAI Apps SDK_. <https://stytch.com/blog/guide-to-authentication-for-the-openai-apps-sdk>
68. _openai-apps-sdk-examples/authenticated_server_python at main ..._. <https://github.com/openai/openai-apps-sdk-examples/tree/main/authenticated_server_python>
69. _eve_. <https://vercel.com/docs/eve>
70. _OIDC_. <https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc>
71. _Bring Your Own Key (BYOK)_. <https://vercel.com/docs/ai-gateway/authentication-and-byok/byok>
72. _AI Gateway Provider_. <https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway>
73. _AI Gateway_. <https://vercel.com/ai-gateway>
74. _llms-full.txt - OpenAI Developers_. <https://developers.openai.com/codex/llms-full.txt>
75. _Codex CLI App Server: Remote Access, WebSocket Transport, and ..._. <https://codex.danielvaughan.com/2026/03/31/codex-cli-app-server-remote-websocket>
76. _codex_app_server - Hex.pm_. <https://hex.pm/packages/codex_app_server>
