# @bundjil/agent

Committed Vercel Eve app for the first Bundjil agent slice.

## What Lives Here

- `agent/agent.ts`: root Eve definition.
- `agent/channels/eve.ts`: explicit Vercel OIDC route policy with localhost-only development fallback.
- `agent/config.ts`: app-owned runtime config. The model is loaded through Effect
  `Config`, `ConfigProvider.fromEnv()`, and Effect Schema.
- `agent/model-provider.ts`: app-owned provider selector. It keeps AI Gateway
  as the default and can build an AI SDK OpenAI-compatible `LanguageModel` for
  the private Bundjil Codex proxy.
- `agent/instructions.md`: operational instructions for the minimal local
  agent, including the temporary Executor model-mode approval protocol.
- `agent/lib/executor/config.ts`: app-owned Effect Config and endpoint policy
  for the scoped Executor MCP connection.
- `agent/tools/workspace_status.ts`: Eve tool that delegates to
  `@bundjil/eve-effect`.
- `test/workspace-status-tool.test.ts`: app-level proof that the Eve tool
  execute path runs through the live Effect operation without starting Eve or
  calling a model.
- `test/model-provider.test.ts`: app-level proof that provider config selects
  Gateway by default and that Codex proxy mode sends private bearer auth only
  to the proxy.

## String Contracts

The app owns canonical Sendblue identities, replay coordinates, phone and
provider values as checked brands; provider/channel states as named literals;
message values as named content Schemas; and credentials as redacted secret
Schemas. It reuses `@bundjil/eve-effect` and `@bundjil/codex-oauth` contracts
instead of duplicating their fields. Decode complete webhook, config, and
completed-event projections at their boundaries, encode outbound provider
values, and use `Match` for material decoded unions. Tagged errors and the
read-only deployment preflight retain checked diagnostic/transport strings.
Do not add shared schema helpers, unsafe brand assertions, production
`decodeSync`, or raw discriminant branching where a decoded union exists.

## Provider State

Implemented:

- Gateway mode is the default model path.
- Codex proxy mode is opt-in with
  `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`.
- Local Codex proxy mode has been verified against `apps/codex-proxy` in mock
  mode.
- Hosted Eve Production has been verified through the private live proxy.
  Gateway remains the default unless the app-owned opt-in configuration selects
  the proxy.
- Hosted Preview has a source-correlated model-mode proof through the isolated
  live Codex proxy and Personal Executor toolkit. It covers a first-turn pause,
  later owner approve and decline, ambiguity/multiple/replay rejection,
  Sendblue owner and non-owner routing, provider delivery, and replay
  suppression. Model mode remains temporary and is not equivalent to browser
  or native authorization.

Unsupported:

- The Eve app must not import `CodexOAuthService`, `CodexProfileStore`, direct
  Codex HTTP clients, or hosted token storage adapters.
- Codex OAuth tokens are not OpenAI Platform API keys or AI Gateway
  credentials.
- The private proxy is not a public gateway.

## Executor MCP Approval

`BUNDJIL_EXECUTOR_MCP_URL` must be an HTTPS `executor.sh` toolkit URL with
exactly one explicit `elicitation_mode=model` or `elicitation_mode=browser`.
Missing, duplicate, native, unknown, legacy, root, or otherwise malformed URLs
fail closed. Bundjil does not rely on Executor's default model mode.

Model mode is temporary for authenticated email and iMessage conversations.
When Executor pauses an execution, Bundjil instructions stop the current turn
without a `resume` call. A later direct, unambiguous authenticated or
allowlisted owner decision can resume the one matching pending execution with
the default empty content. Ambiguous, quoted, forwarded, provider, tool, or
third-party text, non-owner input, and missing, multiple, mismatched, settled,
or replayed state make no resume call.

This is an instruction-level workaround, not a hard authorization boundary or
an equivalent to Executor native or browser authorization. Executor policies
remain authoritative: destructive and authority-management operations stay
blocked, and the first Production acceptance operation is read-only. Browser
mode is the rollback target. Switch the target-scoped URL only after clean
Preview proof of the hosted page, approve, decline, settled replay, and
Sendblue delivery; then redeploy from a clean SHA before Production promotion.

### Production Executor Operations

Production promotion is accepted. The independent Production toolkit has one
selected GitHub connection and five ordered policy rules matching the reviewed
Preview intent. It is separate from Preview. Executor API keys are account-level
rather than technically toolkit-scoped, so Bundjil uses a dedicated environment
key operationally and relies on the toolkit endpoint and policy for capability
scope. The replacement bearer is correlated to one provider inventory row,
stored in the labeled Personal record, and bound only to Production as a
Sensitive Vercel value. `model` remains the temporarily accepted explicit
elicitation mode; it does not weaken the Executor policy boundary or authorize
writes.

The current and rollback agent deployments are `READY` at clean pushed revision
`e1f33e8`; the latest owns the stable aliases and both return health HTTP `200`.
The refreshed private Codex proxy is `READY` at the same revision and its stable
alias reports healthy `live` mode. Direct MCP discovery returned exactly
`skills`, `execute`, and `resume`, and the approved GitHub PR read succeeded. A
fresh OIDC-authenticated Eve session then called `connection_search`,
`executor__skills`, and `executor__execute`; the exact PR read returned
`succeeded`, the turn completed, and the session reached `session.waiting`.
Production runtime-error queries were empty and no write or approval path ran.

The labeled Personal 1Password item and Vercel's Production-only Sensitive
variables remain the durable sources of truth. This workstation also retains a
mode-`0600`, git-ignored recovery copy at
`.local/secrets/executor-production.env` so trusted local probes do not require
repeated biometric approval. Never commit, print, upload, or treat that local
file as deployment configuration. Set only these Vercel Production variables
for `bundjil-agent`:

```text
BUNDJIL_EXECUTOR_MCP_URL
BUNDJIL_EXECUTOR_API_KEY
```

Do not put either value in source, a shell history, a fixture, an Agent Run,
or documentation. Read back only variable names, target, and Sensitive type.
The endpoint must be the independent toolkit URL with exactly one explicit
`elicitation_mode=model`; Preview and root endpoints are not valid Production
substitutes.

Deploy only a clean pushed source revision. Before changing the alias, retain
sanitized immutable current and rollback deployment references. After deploy,
prove the protected health route, the exact Eve MCP surface (`skills`,
`execute`, `resume`), and one authenticated read-only Executor operation.
Keep only statuses, counts, source/deployment correlation, and leak-scan
booleans. Do not run a Production write.

For an incident, first block the selected Production toolkit policy, revoke the
dedicated key in Executor, remove the two Production Vercel variables, and
restore the retained immutable deployment. Verify post-revocation rejection
without recording the response body, rotate the 1Password-held key, configure
the replacement as a new Sensitive value, and repeat the read-only acceptance
path. The promotion record has current and rollback `READY` deployments,
a correlated and durably stored bearer, and a name/target/type-only environment
inventory. Before a key rotation, create and list-read the key
through the same authenticated provider session, correlate its unique provider
name and masked value, then prove only 1Password field presence, never its
value. Do not revoke an earlier key unless its provider identity is
deterministic. Use the Vercel
and Executor inventories plus status-only runtime logs to investigate;
never retain request content, provider output, credentials, OAuth material, or
execution identifiers.

To promote a future integration, inventory and classify its tools first, update
the SPEC and task ledger, prove the intended read, approval, and block behavior
in a separate Preview toolkit, review the resulting policy intent, recreate it
in the Production toolkit, deploy from a clean source revision, and monitor
only sanitized authorization, error, and leak-scan evidence. A new mutation or
authority-management capability requires its own task and chat-approval proof.

## Commands

Run from the repository root:

```bash
bun run --filter @bundjil/agent dev:no-ui
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

`dev:no-ui` starts `eve dev --no-ui`. For installed `eve@0.20.0`, the default
local port is `2000`, so the app normally serves at:

```text
http://127.0.0.1:2000
```

## HTTP Endpoints

Default Eve channel routes:

- `GET /eve/v1/info`
- `POST /eve/v1/session`
- `POST /eve/v1/session/:sessionId`
- `GET /eve/v1/session/:sessionId/stream`

`/eve/v1/session*` routes require Vercel OIDC when deployed. `localDev()` is
the final fallback for loopback development only; anonymous deployed callers
are rejected. Vercel Deployment Protection is a separate platform boundary.
`GET /eve/v1/health` remains the public Eve health probe.

## Production Preflight

The read-only promotion gate consumes a mode-`0600`, ignored Vercel metadata
snapshot produced by a read-only operator adapter. Its `stage` is a strict,
ordered discriminant: `before-first-mutation`, `proxy-provisioned`,
`proxy-accepted-agent-configured`, `agent-accepted-rollback-ready`, or
`sendblue-final-promotion`. Each stage accepts only facts available at that
point; later bindings, profiles, aliases, deployments, rollback references,
and Sendblue controls are rejected as premature evidence.

The historical `before-first-mutation` checkpoint required granted approval,
the linked personal projects and stable domains, Deployment Protection, a clean
pushed SHA, absent Bundjil Production activation, no Preview identity reuse,
and read-only inventory. The inventory then advanced
exactly through proxy provisioned/agent absent, proxy accepted/agent configured,
and both accepted. Later stages added proxy binding/profile proof, accepted
proxy and agent configuration with Eve OIDC, immutable agent and rollback
references, then completed soak/rollback proof with Sendblue still unactivated.
The command does not read values and cannot deploy, alias, set variables,
provision storage, or write profiles.

```bash
BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT="$PWD/.local/production-preflight.json" \
  bun run --filter @bundjil/agent preflight:production
```

It emits only Schema-encoded sanitized go/no-go evidence, including the
checkpoint stage. A non-`0600` file, non-read-only adapter, unexpected field,
non-Production variable target, plain-text secret, Preview/branch proxy host,
mock/local mode, missing auth/protection, shared identity, or invalid immutable
reference fails closed. The accepted proxy and agent source references must
match the clean pushed SHA, and current rollback deployment/config references
must match the accepted deployments. The proxy URL is exactly
`https://bundjil-codex-proxy.vercel.app/v1`, without user info, port, query, or
fragment. Write-only Vercel `sensitive` variables are required for both internal
bearer bindings, the cipher key, and Upstash credentials; only non-secret
identifiers may remain `plain`.

Useful local probes:

```bash
curl -sS http://127.0.0.1:2000/eve/v1/info
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:2000/eve/v1/session \
  -H "Content-Type: application/json" \
  -d '{"message":"Use the workspace_status tool to tell me what packages are available in the Bundjil repo. Keep the answer short."}'
```

Stream the returned session:

```bash
curl -N http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

## Sendblue Channel

The app has an app-owned Sendblue custom channel. The shared Sendblue account
has one active receive webhook at the stable Production route. Preview
configuration and prior dual-webhook evidence are historical only; Preview has
no active shared-line receive webhook or dedicated Sendblue automation bypass.
The accepted typing proof records a bounded accepted-inbound start, a
provider-silent Eve turn adoption, a stop before one delivered final reply,
zero Preview ingress, and direct user confirmation that the handset rendered
the typing bubble.

- Route: `POST /eve/v1/sendblue/webhook`. The build test rejects `/webhook`.
- Authentication: Sendblue sends the configured shared secret in the
  `sb-signing-secret` header. It is compared in constant time before the body
  is read. This is a shared header secret, not a body HMAC.
- Deployment Protection: the Vercel bypass is an independent platform-auth
  credential. The active Production bypass does not replace the route's
  `sb-signing-secret` authentication. The Preview Sendblue bypass is revoked.
- Sender identity: only the redacted, schema-decoded
  `BUNDJIL_SENDBLUE_SENDER_IDENTITIES` allowlist may start a conversation. The
  sender and configured line produce an opaque keyed continuation token; raw
  phone numbers are not used as the Eve principal or routing key.
- Supported inbound event: direct, text-bearing, non-typing, `RECEIVED`
  iMessage from an allowlisted sender, addressed to the configured Sendblue
  line. The default allowed service is `iMessage`.
- Ignored with `200`: typing, outbound/direction-outbound, non-`RECEIVED`,
  group, media, blank, non-allowed-service, wrong-line, loopback, unknown
  sender, and duplicate events. Ignored events do not create an Eve session.
- Rejections: absent or invalid header returns `401`; authenticated malformed
  input returns `400`; an unavailable replay store or routing failure returns
  `503`; an accepted dispatch returns `202`.

Inbound handles are atomically claimed before Eve dispatch. On a rejected
dispatch, the owner-fenced retryable transition compare-and-deletes the claim,
releasing it for a later provider retry; an accepted dispatch is marked
complete. `message.completed` claims stable Eve coordinates before calling
Sendblue. Known provider rejections become retryable, while timeout,
transport, malformed-response, or completion-persistence failures become
uncertain and are not automatically resent. This protects against duplicate
personal messages; it does not promise exactly-once delivery after an
indeterminate provider outcome.

### Sendblue Typing Lifecycle

Typing is an app-owned, durable Effect lifecycle rather than a process-local
timer or scoped resource:

```text
authenticated + decoded + allowlisted + routed + replay-claimed inbound
  -> SendblueChannel.transitionTyping(StartInbound)
  -> SendblueClient.setTypingIndicator(state=start, bounded duration)
  -> channel.state.typing = Pending
  -> Eve send(...)
  -> turn.started
  -> provider-silent adoption as Active(turnId)
  -> model/tool work
  -> terminal visible message.completed
  -> transitionTyping(StopTurn), bounded to two seconds
  -> existing replay-protected SendblueClient.sendMessage
```

`channel.state.typing` is the encoded `Idle | Pending | Active(turnId)`
lifecycle. A missing field from a legacy conversation decodes to `Idle`;
malformed auxiliary state is repaired without blocking final-message decoding.
Same-turn replay, duplicate accepted-inbound start, idle stop, and stale
terminal events are provider-silent. Authorization wait stops typing and an
authorized continuation explicitly resumes it. Waiting, turn/session terminal,
failure, and input events attempt cleanup; `session.failed` is best effort
because Eve does not persist that callback's state mutation.

Every real provider attempt emits one Schema-valid Effect observation with
only command, outcome, attempted flag, safe reason/status, and elapsed time.
No id, number, content, handle, URL, credential, provider body, or raw cause is
logged. Sendblue `SENT` is API acceptance, not proof that the handset rendered
the bubble. A failed typing call is fail-open for Eve and final delivery, and
the provider maximum duration bounds cleanup if later callbacks do not run.

### Sendblue Configuration

All values are app-owned Effect `Config`; secrets use `Config.redacted` and
missing required configuration fails closed. Production and Preview use
independent Vercel-managed encrypted bindings. 1Password and Vercel own
credentials; temporary Production configuration bundles are removed after
operator use:

```text
BUNDJIL_SENDBLUE_API_KEY
BUNDJIL_SENDBLUE_API_SECRET
BUNDJIL_SENDBLUE_WEBHOOK_SECRET
BUNDJIL_SENDBLUE_FROM_NUMBER
BUNDJIL_SENDBLUE_SENDER_IDENTITIES
BUNDJIL_SENDBLUE_ROUTING_KEY
BUNDJIL_SENDBLUE_REPLAY_STORE_URL
BUNDJIL_SENDBLUE_REPLAY_STORE_TOKEN
BUNDJIL_SENDBLUE_REPLAY_STORE_PREFIX
BUNDJIL_SENDBLUE_REPLAY_STORE_TTL_SECONDS
BUNDJIL_SENDBLUE_REPLAY_STORE_LEASE_SECONDS
BUNDJIL_SENDBLUE_ALLOWED_SERVICES
BUNDJIL_SENDBLUE_TYPING_MAX_DURATION_MILLIS
```

`BUNDJIL_SENDBLUE_TYPING_MAX_DURATION_MILLIS` is non-secret, defaults to
`120000`, and must decode as an integer from `1` through `300000`. Typing HTTP
operations use a separate two-second timeout and no automatic retry.

Replay storage prefers the two `BUNDJIL_SENDBLUE_REPLAY_STORE_*` credentials
and otherwise uses the Vercel Marketplace `KV_REST_API_URL` and
`KV_REST_API_TOKEN` fallback for the configured environment. `BUNDJIL_SENDBLUE_TEST_MODE=true` plus
`BUNDJIL_SENDBLUE_TEST_API_BASE_URL` is restricted to tests/local fixtures.
Never put values in commands, docs, test fixtures, or commits.

The agent owns replay keys, records, claim IDs, and delivery policy. Its one
configured shared persistence adapter owns the Upstash client, prefix
application, atomic transaction execution, and provider failure boundary.

### Local Verification And Operations

```bash
bun run --filter @bundjil/agent check-types
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

Production proof recorded the route matrix, a fail-closed `503` replay-store
fixture, real-provider replay suppression, and the accepted typing lifecycle on
READY deployment `dpl_F4YP4B1keHZU6raPgBmtwbqSyqKb`. One authenticated
fixture returned `202`; `StartInbound` began about 0.8 seconds after ingress and
completed in 60 ms, `turn.started` made no duplicate provider request,
`StopTurn` completed in 78 ms, and one final iMessage reached `DELIVERED`
without downgrade or error. The user separately confirmed the visible handset
bubble. Evidence retains only sanitized statuses, counts, timings, and leak
booleans. The Preview lifecycle proof is retained as historical evidence and
Preview has no provider ingress.

Monitor counts of `StartInbound`, `ResumeTurn`, `StopTurn`, `started`,
`stopped`, and `unavailable` observations, plus their safe reasons and elapsed
times. A rise in `unavailable`, missing stops, final-message errors, duplicate
outbound delivery, Preview ingress, or more than one registered receive webhook
is an incident. Do not inspect message content or identifiers to establish
typing health.

Rotate the Vercel bypass and Sendblue webhook secret independently in their
provider/operator stores, update the corresponding encrypted environment
values, redeploy, then update the provider webhook. For a typing-only
regression with healthy final delivery, restore the retained pre-typing READY
agent deployment at the stable alias; the provider maximum duration bounds any
outstanding bubble. Do not change the receive webhook, route secret, replay
namespace, or account auto-typing setting for that rollback. Full channel
deactivation order remains: remove the Production receive webhook, revoke its
dedicated automation bypass, restore the retained agent deployment, then remove
Production Sendblue variables. Do not restore Preview ingress on the shared
account/line; an emergency cutover first disables Production ingress and is
time-bounded.

## Environment

Gateway mode is the default:

- `BUNDJIL_AGENT_MODEL_PROVIDER`: optional provider mode. Defaults to
  `gateway`. Supported values are `gateway` and `codex-proxy`.
- `BUNDJIL_AGENT_MODEL`: optional non-empty Gateway model override. Defaults
  to `google/gemini-2.5-flash`.
- `AI_GATEWAY_API_KEY`: local or hosted AI Gateway credential.
- `VERCEL_OIDC_TOKEN`: credential normally pulled by `eve link`.

Executor MCP mode is explicit:

- `BUNDJIL_EXECUTOR_MCP_URL`: required HTTPS Executor toolkit endpoint with
  exactly one `elicitation_mode=model` during the temporary chat workaround or
  `elicitation_mode=browser` after verified rollback.
- `BUNDJIL_EXECUTOR_API_KEY`: required Executor account bearer dedicated to
  this Bundjil environment. Toolkit scope is enforced by the companion URL and
  Executor policy, not by the key itself.

Codex proxy mode is opt-in:

- `BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy`: selects the private proxy
  provider.
- `BUNDJIL_CODEX_PROXY_BASE_URL`: required proxy base URL, including `/v1`.
  Example: `http://127.0.0.1:8788/v1`.
- `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`: required internal bearer token.
- `BUNDJIL_CODEX_PROXY_MODEL`: optional proxy model id override. If omitted,
  `BUNDJIL_AGENT_MODEL` is used as the proxy model id.
- `BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS`: optional positive integer.
  Defaults to `200000`.

The Eve app does not know about Codex OAuth profiles, refresh tokens, or the
direct `chatgpt.com` Responses endpoint. In Codex proxy mode it only receives
an AI SDK `LanguageModel` created with `@ai-sdk/openai-compatible`, and that
model calls the private Bundjil proxy with the internal bearer token.

## Hosted Deployment And Historical Preview Operations

`bundjil-agent` is a personal Vercel project with root directory `apps/agent`.
Its deployed environments contain only agent-owned provider and channel values.
They must not receive Codex OAuth profiles, access/refresh tokens, proxy-owned
Upstash credentials, or envelope cipher keys. App-owned Sendblue replay-store
Upstash URL/token bindings are legitimate agent configuration and remain
separate from the Codex profile, cipher, lock, and fence material.

The root [`turbo.json`](../../turbo.json) declares those five provider values
only for `@bundjil/agent#build`. Eve resolves the model manifest during
`eve build`; without that scoped Turbo environment contract, a Vercel build can
silently compile the Gateway default instead of the selected proxy model.

Deploy preview from the repository root so Vercel uploads the workspace while
the project root remains `apps/agent`:

```bash
vercel deploy . --project bundjil-agent --scope cooper-corbetts-projects --yes
```

The `@bundjil/agent#build` Turbo task is intentionally non-cacheable. `eve
build` must materialize the deployment-local `.vercel/output` Build Output API
tree and prewarm Eve sandbox templates on every Vercel build. A cached task can
replay logs without restoring that deployment artifact, causing Vercel to fall
back to the configured `public` directory and reject the deployment.

`vercel.json` explicitly enters the workspace root and runs the filtered root
Turbo build. This keeps the upstream workspace build graph deterministic before
the app-local Eve build emits `.vercel/output`; hosted deployment must not rely
on platform Turbo auto-detection.

Use the encrypted Preview values already bound to the Vercel project. Do not
pass bearer values through shell history, commit them, or add them to source.
`eve deploy` targets production and `vercel deploy --prebuilt` skips Eve's
sandbox-template prewarm, so neither is the preview deployment command.

Hosted `/eve/v1/*` routes are intentionally fail-closed and accept a Vercel
OIDC bearer. Use a fresh `vercel project token` and `vercel curl` for private
preview checks. Replaying an existing session requires `startIndex=0`; record
only the resulting HTTP status, model id, event kinds, and counts.

Provider call graph:

```text
apps/agent/agent/agent.ts
  -> loadAgentConfigFromEnv
  -> BUNDJIL_AGENT_MODEL_PROVIDER
  -> gateway model string or @ai-sdk/openai-compatible LanguageModel
  -> apps/codex-proxy /v1/chat/completions when codex-proxy is selected
```

Test call graph:

```text
bun run --filter @bundjil/agent test
  -> apps/agent/test/model-provider.test.ts
  -> Effect Config provider selection
  -> injected fetch proof for proxy bearer auth and no token body leak

bun run --filter @bundjil/agent test
  -> apps/agent/test/workspace-status-tool.test.ts
  -> workspace_status.execute(...)
  -> @bundjil/eve-effect BundjilAgentOperationsLive
```

The Task 4 local HTTP proof had none of `AI_GATEWAY_API_KEY`,
`VERCEL_OIDC_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` present.
`/eve/v1/info` worked and `/eve/v1/session` returned HTTP 202, but streaming
failed with `MODEL_CALL_FAILED` because Eve had no AI Gateway credentials. Do
not fake model output when this boundary is hit.

Follow-up local proof created a personal Vercel AI Gateway key under the
`cooper-corbetts-projects` scope and stored it only in ignored
`apps/agent/.env.local`. With that key present, `/eve/v1/info` reports Gateway
`connected: true`, the model selects `workspace_status`, the tool result
completes, and the model summarizes the current packages:
`@bundjil/core`, `@bundjil/effect-start`, and `@bundjil/eve-effect`.

Do not commit `.env.local` or any copied Gateway key. Before adding new
runtime integrations or deployed app boundaries, create a SPEC through
`prd-writer` and execute it through `prd-implementer`.

Codex proxy local proof:

```bash
PORT=8788 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_MODE=mock \
bun run --filter @bundjil/codex-proxy dev
```

```bash
PORT=2101 \
BUNDJIL_AGENT_MODEL_PROVIDER=codex-proxy \
BUNDJIL_AGENT_MODEL=codex-default-model \
BUNDJIL_CODEX_PROXY_BASE_URL=http://127.0.0.1:8788/v1 \
BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN=local-proof-token \
BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=123456 \
bun run --filter @bundjil/agent dev:no-ui
```

With those two local processes running, `GET /eve/v1/info` reports model id
`bundjil-codex-proxy/codex-default-model` and context window `123456`.
`POST /eve/v1/session` plus `GET /eve/v1/session/<sessionId>/stream` emits a
mock model response through the private proxy. The proof output should include
event type, model id, and status only; do not print bearer tokens, OAuth
tokens, prompts beyond the probe prompt, or full upstream payloads.

Schema JSON boundaries:

- Provider request bodies and proof helpers must use
  `Schema.fromJsonString(...)`.
- Unknown diagnostic values must use `Schema.UnknownFromJsonString`.
- Do not add manual JSON string assembly in app code.

Rollback to Gateway:

```bash
unset BUNDJIL_AGENT_MODEL_PROVIDER
unset BUNDJIL_CODEX_PROXY_BASE_URL
unset BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN
bun run --filter @bundjil/agent dev:no-ui
```

Hosted rollback is handled in `apps/codex-proxy`; the app-level rollback is to
remove the `codex-proxy` env vars so Eve uses Gateway again.

## Historical Preview Proof Boundary

The `codex-proxy` adapter is opt-in and uses app-owned Effect Config to create
an OpenAI-compatible `LanguageModel`; Gateway is the default. Its
configuration and injected-fetch tests prove adapter construction, private
bearer handling, and Gateway fallback. They do not prove a combined Eve ->
hosted Vercel live-proxy request in isolation. The accepted hosted-preview
proof adds that boundary: authenticated Eve info selected
`bundjil-codex-proxy/gpt-5.5`, one minimal session replayed nine durable events
through `session.waiting`, and the private proxy logged one authenticated 200
chat-completions request. This is preview evidence only, not production
approval. Refresh, fencing, and proxy ownership remain in `apps/codex-proxy`
and `@bundjil/codex-oauth`.

## Current Production Proof Boundary

Production evidence separately records one deployed Eve -> private live proxy
completion and one Sendblue-triggered provider ingress -> Eve replay through
waiting -> `DELIVERED` outbound proof. The Production route remains protected
by Vercel Deployment Protection, deployed callers require Vercel OIDC, and the
private proxy bearer plus Sendblue route secret remain independent boundaries.
The historical adapter and Preview proof above do not substitute for this
accepted Production evidence.

## Runtime Artifacts

The app ignores Eve and Nitro runtime output:

```text
.eve/
.workflow-data/
.output/
```

These are local/generated artifacts and should not be committed.
