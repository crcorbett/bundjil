---
document_type: product-specification
lifecycle: proposed
authority: canonical
owner: bundjil-product-owner
created: 2026-07-20
review_trigger: implementation, deployment, environment, or proof change
---

# Codex Proxy GPT-5.6 Terra High Reasoning

## Decision and outcome

Move Bundjil's opt-in Codex subscription-proxy path to `gpt-5.6-terra` and
send `reasoning: { effort: "high" }` to the Codex subscription Responses
endpoint. Eve must report the exact selected model identity:

```text
bundjil-codex-proxy/gpt-5.6-terra
```

The accepted configuration target is:

```toml
# Codex TOML
model = "gpt-5.6-terra"
model_reasoning_effort = "high"
```

```json
{
  "model": "gpt-5.6-terra",
  "reasoning": { "effort": "high" }
}
```

```dotenv
# Bundjil agent environment
BUNDJIL_CODEX_PROXY_MODEL=gpt-5.6-terra
BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=1050000

# Bundjil Codex-proxy environment
BUNDJIL_CODEX_PROXY_REASONING_EFFORT=high
```

`BUNDJIL_CODEX_PROXY_REASONING_EFFORT` is intentionally a separate,
non-secret proxy-owned setting: the model is selected by Eve's app-owned
provider adapter, but the reasoning field is added only while the proxy maps
an OpenAI-compatible request into the subscription Responses request. It must
not be an arbitrary request option accepted from Eve or an HTTP caller.

The implementation must prove a real Vercel **Preview** request through
Bundjil's private `apps/codex-proxy` live composition, not merely the public
OpenAI API, a local Codex client, a direct `proof:codex-responses` call, or a
mock proxy. That proof establishes that the subscription endpoint accepted the
Terra/high request at the actual deployed proxy boundary.

## Current state and scope

`packages/codex/src/provider/request-mapper.ts` currently builds every
`CodexResponsesRequest` with the hard-coded value
`reasoning: { effort: "low" }`. `CodexResponsesReasoning.effort` already has
the inline provider literal vocabulary `low | medium | high | xhigh`, but it
has no separately owned semantic contract or injected policy. The mapper is
composed by `CodexDirectProviderLive` and `CodexLegacyDirectProviderLive` in
`packages/codex/src/runtime.ts`; hosted and local app layers consume those
package layers from `apps/codex-proxy/src/live.layer.ts` and
`apps/codex-proxy/src/local.layer.ts`.

Eve already reads `BUNDJIL_CODEX_PROXY_MODEL` and
`BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS` through app-owned Effect Config
in `apps/agent/agent/config.ts`, but `turbo.json` does not currently declare
the optional model override for `@bundjil/agent#build`. The proxy app's
`CodexProxyConfig` presently has no reasoning policy. Existing proxy and
package proof scripts also use `gpt-5.5`; they are fixtures or direct-proof
defaults, not evidence that Terra/high is accepted by the subscription path.

This work changes the Codex provider request policy, app configuration,
deployment contract, tests, docs, and proof tooling. It does not add public
proxy access, OAuth routes, API-key fallback, a generic Responses API options
bag, a production deployment, or any provider mutation while this SPEC is
being written.

## Ownership and canonical contracts

Follow [Effect patterns](../architecture/effect-patterns.md),
[repository structure](../architecture/repo-structure.md),
[testing and quality](../architecture/testing-and-quality.md), and the
[Eve architecture](../architecture/eve-agent.md).

### Reasoning contract

`@bundjil/codex` owns the provider vocabulary and request-policy service.
Extract the current effort literal into:

```ts
export const CodexResponsesReasoningEffort = Schema.Literals([
  "low", "medium", "high", "xhigh",
]);
export type CodexResponsesReasoningEffort =
  typeof CodexResponsesReasoningEffort.Type;
export type CodexResponsesReasoningEffortEncoded =
  typeof CodexResponsesReasoningEffort.Encoded;
```

`CodexResponsesReasoning` must reuse that schema. A literal union, rather
than a brand, is correct: this is a closed upstream protocol vocabulary, not
an unbounded identity whose provenance needs a brand. The `Type` and `Encoded`
forms must nevertheless be named and used at their correct sides even though
they presently have the same literal representation.

Add a package-owned `CodexResponsesRequestPolicy` Schema containing
`reasoningEffort: CodexResponsesReasoningEffort`, with explicit
`typeof CodexResponsesRequestPolicy.Type` and
`typeof CodexResponsesRequestPolicy.Encoded`. It must be exposed through a
named `CodexResponsesRequestPolicy` Context service with an explicit decoded
test layer and a policy-construction layer for consumers that already hold a
decoded policy. `CodexRequestMapper.toCodexResponses` consumes this decoded
service value and emits `reasoning: { effort: policy.reasoningEffort }`.

Do not add a raw `reasoningEffort: string`, a mapper optional argument, a
generic provider-options escape hatch, a mutable global, or process-env access
to `@bundjil/codex`. `CodexResponsesProof` is a direct, opt-in proof path;
either give it the same explicit policy service or an independently named
schema-backed proof-policy input. It must not retain an unexplained low
hard-code that can be mistaken for proxy proof.

### Proxy configuration boundary

`apps/codex-proxy/src/env.ts` is the sole environment owner. It must load:

```ts
Config.schema(
  CodexResponsesReasoningEffort,
  "BUNDJIL_CODEX_PROXY_REASONING_EFFORT"
).pipe(Config.withDefault("low"));
```

The value is non-secret, so it is not `Redacted`; the internal bearer,
profile cipher, OAuth values, prompts, tokens, and request bodies remain
redacted/private. The app decodes the complete `CodexProxyRuntimeConfig` once
with `Schema.decodeUnknownEffect`, adding its decoded
`reasoningEffort: CodexResponsesReasoningEffort.Type`. Its environment value
is the encoded input to `Config.schema`; `CodexProxyRuntimeConfig.Encoded` is
used only by `makeCodexProxyConfig` and test fixtures. Neither routes nor
package services read `process.env`.

Missing effort defaults to `low` solely for existing configuration
compatibility. Empty, unknown, or malformed values (including `terra-high`)
must fail `Config.schema`/the complete app-config decode and make the live
Layer unavailable rather than silently falling back. Continue using the
existing safe app configuration failure boundary (`CodexProxyRouteError` where
the decoded app config is assembled); do not expose parser causes to HTTP
callers. `BUNDJIL_CODEX_PROXY_REASONING_EFFORT=high` is required in the new
Preview target alongside the new agent model/context settings.

The live app composition must turn the decoded `CodexProxyConfig` into the
package's decoded `CodexResponsesRequestPolicy` layer before providing
`CodexRequestMapperLive`/`CodexDirectProviderLive`. The mock layer may retain
deterministic output but must accept the same app config shape. The local
layer must compose an explicit policy too, using the same config-owned value;
it must not bypass the contract. Live and test layers remain explicit and
substitutable.

### Boundary ledger

| Boundary | Owning codec and decoded domain value | Required operation |
| --- | --- | --- |
| Proxy environment | `CodexResponsesReasoningEffort`, `CodexProxyRuntimeConfig`; `Type` in `CodexProxyConfig` | `Config.schema` then one `Schema.decodeUnknownEffect` in `env.ts` |
| Package policy injection | `CodexResponsesRequestPolicy`; `Type` in the named policy service | decoded app config to explicit live/test Layer; no raw string crosses |
| Proxy HTTP ingress | `OpenAICompatibleChatCompletionRequest`; `Type` | existing `Schema.fromJsonString(...)` then `Schema.decodeUnknownEffect` in `server.ts` |
| Mapper output | `CodexResponsesRequest`; `Type` | mapper builds only decoded request and maps schema failures to `CodexResponsesRequestError` |
| Subscription HTTP egress | `CodexResponsesRequest.Encoded` | `Schema.encodeEffect(CodexResponsesRequest)` immediately before `CodexHttpClient` writes the request |
| Provider response | immediate stream/result codec in `CodexHttpClient` | decode status/body/result immediately; keep raw provider data inside the adapter |
| Proxy SSE egress | OpenAI-compatible stream/chunk encoded form | existing stream mapper and HTTP response adapter encode only at the outward boundary |

`CodexRequestMapper`, `CodexDirectProvider`, `CodexHttpClient`, and
`OpenAICompatibleProxy` keep named operations and safe tagged errors.
Primary Effects stay flat, linear, lazy, and sequential; use meaningful
`Effect.gen`, and handle typed failures in `.pipe(...)` with `catchTag`,
`catchTags`, or `mapError`. Do not introduce `instanceof`, unsafe casts,
manual object readers, duplicated DTOs, generic SDK callbacks, or
`common`/`utils`/one-use mapper/helper sprawl.

## Call graphs

```text
Production runtime (after a separately authorized promotion)

apps/agent/agent/config.ts
  -> AgentModelProviderConfig (Config.schema; decoded Type)
  -> createOpenAICompatible(name: bundjil-codex-proxy)
  -> apps/codex-proxy POST /v1/chat/completions
  -> CodexProxyConfigLive (ConfigProvider.fromEnv)
  -> CodexProxyConfig.reasoningEffort
  -> CodexResponsesRequestPolicy live Layer
  -> OpenAICompatibleProxyLive
  -> CodexDirectProviderLive
  -> CodexRequestMapper.toCodexResponses
  -> CodexHttpClient.postResponsesStream
  -> ChatGPT Codex subscription Responses endpoint
  -> CodexStreamMapper.toOpenAICompatibleStream
  -> Eve session stream
```

```text
Automated test runtime

packages/codex/test/codex-direct-provider.test.ts
  -> CodexResponsesRequestPolicy test Layer
  -> CodexRequestMapperLive
  -> Schema.encodeEffect(CodexResponsesRequest)
  -> assert exact gpt-5.6-terra / reasoning.high encoding

apps/codex-proxy/test/proxy-handler.test.ts
  -> CodexProxyConfigLayer(decoded fixture)
  -> app policy Layer -> mock CodexResponsesFetch / direct-provider Layer
  -> POST /v1/chat/completions -> sanitized SSE assertions

apps/agent/test/model-provider.test.ts
  -> ConfigProvider.fromEnv
  -> AgentCodexProxyModelProviderConfig
  -> injected fetch -> exact model identity and context window
```

```text
CLI and deployment path

Vercel Preview environment values
  -> @bundjil/agent#build Turbo env allowlist
  -> eve build materializes model manifest
  -> Vercel Preview agent deployment
  -> private Preview proxy deployment (CodexProxyConfigLive)
  -> bun run --filter @bundjil/codex-proxy proof:preview
  -> sanitized Vercel logs and deployment metadata readback
```

```text
Required live subscription-endpoint proof

fresh Preview Eve request (OIDC-protected)
  -> model metadata: bundjil-codex-proxy/gpt-5.6-terra
  -> Preview private proxy with mode=live and reasoningEffort=high
  -> mapped encoded Responses request: model gpt-5.6-terra, reasoning.high
  -> subscription endpoint returns accepted SSE HTTP 200
  -> proxy returns OpenAI-compatible SSE through [DONE]
  -> sanitized trace/log counters correlate one request without payload capture
```

## Migration, rollout, and rollback

1. Land the schema, policy Layer, config plumbing, fixtures, documentation,
   and proof assertions with no Vercel or provider mutation. Default-low
   compatibility tests prove an existing proxy environment still maps low.
2. In a separately authorized Preview rollout, set
   `BUNDJIL_CODEX_PROXY_REASONING_EFFORT=high` on the proxy and set the agent's
   `BUNDJIL_CODEX_PROXY_MODEL=gpt-5.6-terra` plus
   `BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=1050000`. Add
   `BUNDJIL_CODEX_PROXY_MODEL` to the `@bundjil/agent#build` Turbo allowlist so
   Eve's build-time manifest cannot retain the fallback model.
3. Deploy source-built Previews only according to the existing proxy and agent
   Vercel runbooks. Read back the target project/environment/key names and
   values only as permitted by Vercel; never print a bearer, profile, cipher,
   OAuth token, prompt, response, or chain-of-thought.
4. Prove the Preview proxy first, then make a minimal protected Eve request and
   replay its durable stream with `startIndex=0`. Production is out of scope
   until Preview evidence is accepted and new authority is supplied.

Rollback before any Production action restores the previous Preview proxy
deployment/configuration: `BUNDJIL_CODEX_PROXY_MODEL=gpt-5.5`,
`BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS=200000`, and
`BUNDJIL_CODEX_PROXY_REASONING_EFFORT=low` (or removes the latter to exercise
the compatibility default). If the agent needs immediate isolation, restore
its retained Gateway/proxy configuration as defined in the app runbook. Do
not roll back by using API keys, `mock` as evidence, profile deletion, or
unreviewed Vercel environment edits. Record the exact deployment identity,
configuration names, result statuses, and rollback result without values.

## Proof and observability

Repository proof, local proof, Vercel deployment proof, and subscription
endpoint proof are distinct:

| Evidence class | It proves | It does not prove |
| --- | --- | --- |
| Repository proof | schemas, config decoding, Layer composition, mapper encoding, tests | a deployed proxy or endpoint acceptance |
| Local proxy proof | private HTTP/SSE wiring using mock or local composition | Vercel or hosted subscription acceptance |
| Vercel deployment proof | source-built Preview, exact app/proxy configuration and deployment identity | that an upstream request used high unless correlated runtime proof confirms it |
| Live subscription proof | Preview live proxy sent Terra/high and received a successful streaming subscription response | Production approval or general public API support |

Add a sanitized, request-correlatable observation at the mapper/provider
boundary (for example Effect span attributes or the established deployment
log adapter) with only: `modelId`, `reasoningEffort`, route/mode, upstream
HTTP status, SSE-completed boolean, and an opaque request correlation id. The
field names and existing log owner must be inspected during implementation;
do not invent an external telemetry service. It must not contain credentials,
authorization headers, account ids, token values, prompts, request/response
bodies, tool arguments/results, reasoning text, or chain-of-thought.

Extend the Preview proof command/contract so that it uses the target
`gpt-5.6-terra` request and reports only sanitized target assertions such as
`requestedModelTerra`, `configuredReasoningEffortHigh`,
`observedReasoningEffortHigh`, status/content-type/SSE-completion, and leak
booleans. A 200 alone is insufficient: accepted live proof combines the
deployed config readback, emitted sanitized high field, exact Eve model
identity, one successful private proxy request, and a completed subscription
SSE response. The command must continue to exit nonzero with `status:
"blocked"` on any failed predicate.

## Affected surfaces

- `packages/codex/src/provider/contracts.ts`: named effort and request-policy
  schemas plus Type/Encoded exports.
- `packages/codex/src/provider/request-mapper.ts`: injected decoded policy,
  no hard-coded low.
- `packages/codex/src/provider/proof.ts` and `config.ts`: align direct proof
  with an explicit policy or label it non-proxy evidence; no stale implicit
  low.
- `packages/codex/src/runtime.ts`, `src/index.ts`, and test exports: live/test
  policy Layers and public supported import path.
- `apps/codex-proxy/src/schemas.ts`, `env.ts`, `live.layer.ts`,
  `local.layer.ts`, and `mock.layer.ts`: app-owned config and injected policy
  composition.
- `apps/codex-proxy/scripts/prove-preview.ts`, `smoke-test.ts`, handler and
  Preview-proof tests: target and compatibility fixtures; safe proof result.
- `apps/agent/agent/config.ts`, `model-provider.ts`, model-provider tests,
  `turbo.json`, and Vercel agent variable ownership: target model identity,
  1,050,000 context window, and build-env allowlist.
- `packages/codex` and proxy tests/fixtures, including direct-provider,
  refresh-capable, response-proof, and handler fixtures that intentionally
  assert an old model. Retain old-value fixtures only where they prove
  compatibility and label them accordingly.
- `README.md`, `packages/codex/README.md`, `apps/codex-proxy/README.md`,
  `apps/agent/README.md`, `.env.example`, `docs/architecture/eve-agent.md`,
  Vercel Preview runbook sections, this SPEC/task ledger, and the index.

## Downstream impact ledger

| Surface | Status | Reason |
| --- | --- | --- |
| Canonical architecture and product docs | Change required | Eve/proxy current configuration and evidence classes must describe Terra/high without rewriting historical proof as current truth. |
| Root README and affected app/package READMEs/runbooks | Change required | Document model/effort variables, build allowlist, safe Preview verification, rollback, and proof limits. |
| `AGENTS.md`, repo skills, instruction surfaces | N/A | Existing Effect/provider and PRD guidance already covers this slice; update only if implementation exposes a concrete conflicting instruction. |
| Schemas, public types, service contracts, Layers, exports | Change required | Name effort/policy schema, decoded services, live/test Layers, runtime/index exports. |
| Lint, Effect diagnostics, boundary audit, formatting, CI, scripts | Change required | Exercise language service and existing policy scripts; update Turbo's build environment contract and Preview proof script/tests. No boundary exception is expected. |
| Tests, fixtures, compatibility assertions, browser/HTTP/provider evidence | Change required | Test low-default compatibility and high-target encoding; Preview HTTP/Eve proof must be live and sanitized. Browser evidence is N/A because this changes no visible browser UI. |
| Observability, rollout, migration, rollback artifacts | Change required | Add safe model/effort/status evidence, Preview progression, and exact rollback procedure. |
| SPEC index, task ledger, active execution plan | Change required / N/A | Add this current SPEC and sibling ledger now; do not create an active execution plan until implementation begins. |

## Risks and unresolved questions

- The subscription endpoint may reject Terra, high effort, the 1,050,000-token
  context metadata, or their combination. Only the required live Preview proof
  resolves that question; public API documentation or local CLI behavior does
  not.
- Eve may materialize its model identity at build time. The Turbo allowlist and
  `/eve/v1/info` readback are required to prevent an environment value being
  ignored by the build.
- `gpt-5.5` appears in accepted historical documents and fixtures. Preserve
  historical evidence labels; do not use broad stale-name deletion that erases
  provenance.
- Existing logging is deliberately sparse (`HttpRouter.toWebHandler` disables
  the default logger). Implementation must choose the smallest existing
  Effect-owned observation point, prove it cannot leak sensitive data, and
  avoid a new telemetry abstraction unless a stable owner is demonstrated.

## Acceptance criteria

1. The canonical package contract has `CodexResponsesReasoningEffort` and
   `CodexResponsesRequestPolicy` with explicit schema-derived `Type` and
   `Encoded` forms; literal union rationale is documented and no raw semantic
   strings cross a service boundary.
2. `BUNDJIL_CODEX_PROXY_REASONING_EFFORT` is parsed only in
   `apps/codex-proxy/src/env.ts` by `Config.schema`, is non-redacted, defaults
   to `low` for compatibility, rejects invalid values safely, and is injected
   as decoded policy into both hosted and local provider Layer composition.
3. `CodexRequestMapper` has no hard-coded low and no generic provider options;
   it consumes decoded policy and encodes a request containing exactly
   `model: "gpt-5.6-terra"` and `reasoning.effort: "high"` for the target.
4. Tests prove low-default compatibility, high-target mapping, invalid config,
   Layer composition, exact request encoding, immediate provider-response
   decoding, no token/body leak, and Eve's exact expected identity.
5. The new model env is present in the `@bundjil/agent#build` Turbo contract;
   Preview uses model `gpt-5.6-terra`, context `1050000`, and proxy high
   effort. All changes have source-built, read-back deployment evidence.
6. An authorized real Preview request through `bundjil-codex-proxy` in `live`
   mode emits safe high/model/status evidence, receives complete SSE from the
   subscription endpoint, and a protected Eve request reports exactly
   `bundjil-codex-proxy/gpt-5.6-terra`. No credentials, prompts, bodies,
   tokens, account ids, tool data, or chain-of-thought are retained.
7. Each implementation task records the ownership/call-graph,
   implementation-quality, and verification-coverage lenses, including flat
   Effect control flow, typed `.pipe(...)` error handling, schema ownership,
   Type/Encoded boundaries, no casts/manual mappers/helper sprawl, and clean
   boundary policy results.
8. The implementation runs focused tests, Effect language-server diagnostics,
   `bun run check:boundaries`, `bun run check:effect-setup`,
   `bun run check:skills`, and `bun run verification`; all required docs,
   runbooks, environment samples, proof artifacts, and rollout/rollback notes
   are updated before acceptance.

## Implementation instruction block

```text
Use Effect TS native approaches first. Prefer Data, Schema, Array, Chunk,
HashSet, HashMap, Match, Context, Layer, Config, Service, Record, Result, Exit,
Bun/Platform Command, and ManagedRuntime over plain TypeScript helpers when the
code is fallible, async, runtime-owned, collection-heavy, or crosses a package,
RPC, SSR, command, config, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as id: string, slug: string, status, or post metadata
outside their canonical schema/type owner.

For every boundary, name the canonical codec, its Type and Encoded sides, the
single inbound decode adapter, the single outbound encode adapter, and any
exact registered third-party exception. Services receive only decoded types.
Provider/SDK wrappers expose named operations, encode requests, immediately
decode provider outputs, use Config.schema with redacted secrets, and provide
live and mock Layers. Reject a generic SDK callback/client escape hatch.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, instanceof checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema/RPC/Match/Result/Exit
primitive or owning service contract should carry the behavior.
```
