---
document_type: product-specification
lifecycle: implemented
authority: canonical
owner: bundjil-product-owner
created: 2026-07-20
last_reviewed: 2026-08-09
review_trigger: model/reasoning policy, bounded Preview proof, rollback, or future public Eve correlation API change
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

### Accepted closeout boundary

The Terra/high rollout is complete at its intended boundary: the package-owned
reasoning policy, proxy Config and Layers, Eve model metadata, and bounded
protected Preview subscription/Eve replay proof are implemented and verified.
The dated Preview evidence proves live Terra/high subscription SSE, exact
`bundjil-codex-proxy/gpt-5.6-terra` identity, context `1050000`, protected
session completion, and durable-stream replay. It does **not** prove that a
replay issued no second private-proxy or upstream request.

That stricter claim is an accepted, deferred upstream-Eve enhancement, not a
rollout dependency. The dated public-API receipt remains the durable
non-claim. Do not add a speculative bridge, proxy-only counter, or standalone
receipt machinery merely to make this historical rollout appear stronger.

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

The strict replay-evidence gap is a separate follow-on slice. The current
Preview evidence proves Eve's durable stream replay behavior and the available
Agent Runs metadata, but it does not prove that replay caused no second request
at the private proxy or Codex subscription boundary. That claim must remain
blocked until the correlation and durable-receipt requirements below are
implemented and verified.

## Deferred strict replay enhancement

The following design is retained only as a future enhancement. It does not
block or reopen the completed Terra/high rollout. Resume only when a public
Eve API supplies a stable logical-step or attempt identifier to the actual
provider request, and then create a new SPEC/plan with new authority and
proof. The required trigger and rejected substitutes are recorded in the
sibling ledger and dated correlation receipt.

Implement both controls. They answer different questions and neither is a
complete substitute for the other:

1. **Eve-to-provider correlation.** A supported public Eve/provider seam must
   carry an opaque, schema-decoded correlation value to the private proxy. When
   Eve exposes a public per-attempt identifier, retain it only as a branded
   `CodexProxyCorrelationId` and distinguish it from the logical step key. A
   retry of an interrupted Eve step may have a new attempt identifier; a
   `startIndex=0` stream replay must not create a new model attempt.
2. **Durable atomic proxy evidence.** The proxy must atomically admit and
   transition the correlated logical attempt using Bundjil's existing
   `AtomicKeyValueStore` service. The record is the independent, process-safe
   evidence that a replay was not admitted as a second logical proxy request.
3. **Structured logs.** Native Effect logging (`Effect.logInfo`/the configured
   `Logger`) records safe lifecycle observations using the same opaque key.
   Logs support diagnosis and provider operations, but are not the strict
   replay oracle because retention, delivery, and retry duplication are not
   atomic guarantees.

The durable record must be owned by the proxy/provider boundary, not by an
unrelated channel replay store. It must record a small schema-defined state
machine such as `admitted`, `upstreamStarted`, `completed`, `failed`, or
`unknown`, together with model, reasoning effort, route/mode, safe status, SSE
completion, and an upstream-attempt ordinal. It must not retain prompts,
responses, tokens, credentials, account identifiers, raw headers, raw Eve
session/turn identifiers, or chain-of-thought.

The atomic store is an admission and evidence control, not a promise of
exactly-once execution against a remote provider. If the process crashes after
the record says `upstreamStarted` and before completion is recorded, the next
replay must remain `unknown` and must not automatically issue another request
unless the upstream supports an idempotency key or a bounded recovery proof
establishes that no upstream call occurred. A provider 401 refresh retry must
be represented as a distinct upstream-attempt ordinal, not mistaken for an Eve
stream replay.

### Options considered

| Option                                                             | Result                     | Reason                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing Agent Runs metadata or logs only                          | Supporting evidence        | Useful for diagnosis, but neither surface currently supplies a complete per-session proxy join or durable no-second-request oracle.                                                                                                         |
| Public Eve attempt/correlation value plus logs                     | Necessary but insufficient | Gives a join when the public seam exists; still depends on log retention and completeness.                                                                                                                                                  |
| Proxy-generated request ID without Eve correlation                 | Rejected                   | It cannot identify which Eve logical step caused the request.                                                                                                                                                                               |
| Public Eve correlation plus durable atomic proxy receipt           | **Required target**        | Combines a trustworthy join with process-independent admission and lifecycle evidence.                                                                                                                                                      |
| Eve internal harness import or static/time-window header           | Rejected                   | Internal `attemptId` types are not a supported authored API; process-local and time-based joins fail under Vercel retries and concurrent work.                                                                                              |
| `defineDynamic` at `step.started` returning a live `LanguageModel` | Investigation seam only    | It is public and can run before a model call, but the installed API does not expose Eve's internal attempt index or prove that a custom header reaches the actual proxy request. It requires a bounded compatibility spike before adoption. |

The strict acceptance claim is therefore layered: correlation proves the Eve
join, the atomic receipt proves proxy admission/lifecycle, and the actual
provider-egress observation proves what was sent upstream. If only one layer is
available, the receipt must state the narrower claim rather than infer the
stronger one.

### 2026-08-09 public-seam result

The installed Eve `0.29.5` API does not satisfy the required correlation
predicate. A dynamic model resolver may return a live `LanguageModel` at
`step.started`, but its public resolver signature is `event: unknown` and its
context provides session identity, channel metadata, and messages, not a typed
turn, step, or attempt identity. Eve documents a stable `meta.id` only after a
stream event is durably emitted; it is not a supported model-resolver input.
`runtimeContext` remains telemetry-only. The task is therefore blocked in the
dated [sanitized receipt](../evidence/verification/packets/codex-terra-eve-correlation-blocked-2026-08-09.json).
Do not derive a substitute from message content or internal behavior.

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
  "low",
  "medium",
  "high",
  "xhigh",
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

| Boundary                 | Owning codec and decoded domain value                                                    | Required operation                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Proxy environment        | `CodexResponsesReasoningEffort`, `CodexProxyRuntimeConfig`; `Type` in `CodexProxyConfig` | `Config.schema` then one `Schema.decodeUnknownEffect` in `env.ts`                                    |
| Package policy injection | `CodexResponsesRequestPolicy`; `Type` in the named policy service                        | decoded app config to explicit live/test Layer; no raw string crosses                                |
| Proxy HTTP ingress       | `OpenAICompatibleChatCompletionRequest`; `Type`                                          | existing `Schema.fromJsonString(...)` then `Schema.decodeUnknownEffect` in `server.ts`               |
| Mapper output            | `CodexResponsesRequest`; `Type`                                                          | mapper builds only decoded request and maps schema failures to `CodexResponsesRequestError`          |
| Subscription HTTP egress | `CodexResponsesRequest.Encoded`                                                          | `Schema.encodeEffect(CodexResponsesRequest)` immediately before `CodexHttpClient` writes the request |
| Provider response        | immediate stream/result codec in `CodexHttpClient`                                       | decode status/body/result immediately; keep raw provider data inside the adapter                     |
| Proxy SSE egress         | OpenAI-compatible stream/chunk encoded form                                              | existing stream mapper and HTTP response adapter encode only at the outward boundary                 |

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
Future correlation and durable-receipt runtime

Eve public per-attempt/provider seam
  -> apps/agent correlation codec and provider request metadata
  -> private proxy ingress decodes CodexProxyCorrelationId once
  -> OpenAICompatibleProxy admits the logical step through AtomicKeyValueStore
  -> @bundjil/codex provider egress records upstreamStarted and ordinal
  -> Codex subscription SSE body is consumed
  -> stream finalizer atomically records completed/failed/unknown
  -> native Effect Logger emits the same safe lifecycle fields
```

```text
Future correlation and durable-receipt test runtime

synthetic Eve correlation fixture
  -> schema-decoded proxy request metadata
  -> AtomicKeyValueStore memory Layer
  -> mock Codex provider stream with controlled completion/interrupt
  -> replay of the same logical key
  -> assert no second admission, correct retry/unknown state, and safe logs
```

```text
Required live subscription-endpoint proof

fresh Preview Eve request (OIDC-protected)
  -> model metadata: bundjil-codex-proxy/gpt-5.6-terra
  -> Preview private proxy with mode=live and reasoningEffort=high
  -> mapped encoded Responses request: model gpt-5.6-terra, reasoning.high
  -> subscription endpoint returns accepted SSE HTTP 200
  -> proxy returns OpenAI-compatible SSE through [DONE]
  -> atomic proxy receipt plus safe provider-egress observation correlate one request without payload capture
```

### OIDC caller decision

The Vercel CLI can mint a short-lived development OIDC token for an exact linked
project with `vercel project token`. The protected `vercel curl` path supplies
the separate Deployment Protection access for an immutable deployment. Together,
those Vercel-owned controls are sufficient for this bounded Preview operator
proof: the agent still validates the OIDC bearer, while platform protection
access is never treated as application authentication. Trace retrieval is not
part of the proof because it can expose payload-bearing data.

This is not a generic external caller capability. The proof may target only the
recorded immutable Preview agent deployment with a fixed bounded message; it
must not expose an arbitrary URL, prompt, header, or token relay. A separate
in-Vercel caller and Vercel Trusted Sources design is only needed if the CLI
operator proof is unavailable or a non-operator automated caller is required.

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
   replay its durable stream with `startIndex=0`. Read back only the Vercel
   Agent Runs model/deployment/lifecycle metadata that the exact team exposes.
   Production is out of scope until Preview evidence is accepted and new
   authority is supplied.

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

| Evidence class          | It proves                                                                                                              | It does not prove                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Repository proof        | schemas, config decoding, Layer composition, mapper encoding, tests                                                    | a deployed proxy or endpoint acceptance                                                                 |
| Local proxy proof       | private HTTP/SSE wiring using mock or local composition                                                                | Vercel or hosted subscription acceptance                                                                |
| Vercel deployment proof | source-built Preview, exact app/proxy configuration and deployment identity                                            | that an upstream request used high unless correlated runtime proof confirms it                          |
| Live subscription proof | Preview live proxy sent Terra/high and received a successful streaming subscription response                           | Production approval or general public API support                                                       |
| Eve runtime metadata    | protected info/session/replay results plus accessible Agent Runs model, deployment, lifecycle, step, and hook metadata | a per-session model/proxy attempt count or an independent no-second-upstream-call predicate             |
| Structured Effect logs  | safe lifecycle observations correlated to an opaque request key                                                        | durable delivery, complete retention, or exactly-once behavior                                          |
| Atomic proxy receipt    | process-independent admission and lifecycle state for a correlated logical proxy attempt                               | that an unknown crash window did not reach the remote provider without an upstream idempotency contract |

Add the sanitized observation at the actual provider-egress lifecycle, not only
when the HTTP handler creates a lazy stream. The observation may contain only:
`modelId`, `reasoningEffort`, route/mode, an opaque branded correlation id,
upstream-attempt ordinal, upstream HTTP status, lifecycle phase, and
SSE-completed boolean. Use native Effect logging and the existing safe proxy
observation owner; do not invent an external telemetry service. Complete or
failure observations must be attached to actual stream consumption/finalization
so a stream object being created is not mistaken for a completed response.
Nothing may contain credentials, authorization headers, account ids, token
values, prompts, request/response bodies, tool arguments/results, reasoning
text, or chain-of-thought.

### Eve session-to-proxy correlation constraint

The current installed Eve public API does not provide the required
Eve-to-provider correlation transport. Its `instrumentation.ts`
`step.started` callback receives session, turn, and step metadata, but its
returned `runtimeContext` is attached to AI SDK telemetry spans rather than
becoming a provider HTTP header. Stream hooks are post-durable and observe-only.
Eve's internal attempt scope contains `attemptId` and `attemptIndex`, but the
internal harness path is not an authored package export and must not be
imported.

The implementation must first prove one of these supported seams against the
versioned Eve package:

- a public Eve/provider attempt hook that supplies an opaque per-attempt value
  to the actual AI SDK model request; or
- a public `defineDynamic`/`step.started` model seam that returns a live
  `LanguageModel` and demonstrably carries the branded value to the proxy's
  real request boundary.

A session/turn/step value may be used as a logical join only after it is
converted to the owning branded opaque contract and its privacy/retention
properties are proven. Do not send or retain raw Eve identifiers. If neither
public seam exists, record the feature as blocked and do not substitute
`runtimeContext`, a static header, `AsyncLocalStorage`, a process-global, or a
time-window join.

Eve `0.29.5` has now been inspected and neither seam is available: the dynamic
resolver cannot receive a public per-step value, and instrumentation cannot
transport one to the proxy. The proxy receipt and correlated Preview tasks stay
unstarted until an upstream public API changes this predicate.

### Durable proxy-attempt receipt

`@bundjil/store` already owns the named `AtomicKeyValueStore` service and its
Effect Schema transaction contract. Reuse it with a new proxy-owned key prefix
and a schema-defined `CodexProxyAttemptReceipt`; do not use generic
`KeyValueStore.modify`, a read-then-write sequence, a new storage abstraction,
or the channel replay record for this purpose. The shared Upstash resource may
remain physically shared, but Preview and Production require distinct logical
prefixes and separately read-back configuration.

The proxy/provider boundary must perform these transitions with atomic
conditions and mutations:

1. Claim the logical correlation key only when absent, recording `admitted`.
2. Record `upstreamStarted` immediately before the actual provider request and
   include an ordinal for any provider-side retry.
3. Record `completed` only after the SSE body has been consumed through its
   terminal marker; record `failed` or `unknown` on an observed failure or
   interrupted/ambiguous stream.
4. On a replay of a completed logical key, return the durable result without
   issuing another provider request. On an `unknown` key, fail closed or enter
   the explicitly owned recovery path; never silently call upstream again.

Use `Effect.Clock` for observed timestamps and any bounded recovery decision so
tests do not depend on wall-clock reads. Encode/decode the receipt and
transaction with the owning Effect Schemas, and keep the live Upstash Layer and
memory test Layer explicit. A receipt proves the proxy's durable admission and
recorded egress lifecycle; it cannot prove a remote side effect across a crash
window unless the upstream idempotency contract is separately established.

### Log and receipt relationship

Emit the safe structured log after the corresponding durable transition, using
the same opaque correlation value and lifecycle phase. Logs are for operators;
the atomic receipt is the acceptance oracle. A missing log does not erase a
receipt, and a log without a matching receipt cannot close the strict replay
predicate.

### Eve upgrade and evidence boundary

Upgrade the agent from Eve `0.20.0` to `0.29.5` and align `ai` with its
required `^7.0.38` peer range before another hosted proof. This does not add a
dynamic per-session proxy-header API: `runtimeContext` remains span metadata,
not transport metadata. It adds the current Vercel Agent Runs metadata surface,
but the accessible Personal team view is authoritative only for the fields it
actually returns rather than for fields described by another dashboard tier.

The initially preferred join was Vercel OpenTelemetry, not a new proxy store:

```text
Eve step.started
  -> ai.eve.turn span with framework session/turn/step attributes
    -> AI SDK model/fetch span
      -> W3C traceparent on the private proxy request
        -> proxy inbound span
          -> Codex upstream SSE completion span
```

The agent instrumentation must set `recordInputs: false` and
`recordOutputs: false`, use `@vercel/otel` with propagation restricted to the
configured private proxy origin, and create no third-party trace drain or
exporter. The proxy may continue the inbound W3C context at its Vercel HTTP
boundary and create only a named completion span with the existing safe
model/effort/mode/status/SSE attributes. These spans remain restricted
observability and may not be used as the replay oracle; the hosted proof uses
the accessible Eve Agent Runs metadata instead. The operator must not retain
raw session or turn identifiers, headers, requests, responses, prompts, tokens,
tool values, reasoning, or exported trace data.

The 2026-08-04 Preview readback falsified this approach as a complete proof:
the CLI trace captured admission and Workflow enqueue, but Eve's durable worker
invocation had no retrievable Vercel trace identifier. It therefore did not
include the model/proxy span. Do not retry this mechanism or treat queue
activity, timing, or an admission trace as model-call evidence. The upgraded
proof reads the exact Preview team's Agent Runs metadata for model, immutable
deployment, lifecycle, step, and hook fields. The current accessible surface
does not expose the framework-owned `$eve.*` Workflow tags or a per-session
model-attempt count; record those fields as unavailable and keep the strict
no-second-upstream-call predicate `blocked`. Do not infer it from unchanged
inventory, timing, process state, or a neighbouring run.

Do not bridge the replacement with a process-global value,
`AsyncLocalStorage`, a static proof header, an internal Eve harness import, or a
proxy counter keyed only by a time window. Those mechanisms either fail under
concurrent/replayed Vercel workflow execution or prove a weaker unrelated
claim. OpenTelemetry remains useful supporting telemetry only; it is not the
durable receipt or the replay oracle.

The receipt may retain only: Eve/AI SDK versions, immutable Preview deployment
IDs, Agent Runs availability, safe model/deployment/lifecycle/step/hook
metadata, one-hour inventory counts, completed/waiting event predicates, and
the known Terra/high configuration predicates. The new correlation/receipt
proof may retain only branded opaque keys, lifecycle phases, attempt ordinals,
safe model/effort/mode/status/SSE fields, and bounded timestamps according to
the receipt retention policy. It must not retain raw tags, session/turn/run IDs,
titles, prompts, responses, reasoning, tool payloads, token counts, trace
payloads, headers, or screenshots. Set `EVE_TRACES_CONTENT=off`; no third-party
exporter or trace drain is permitted.

The installed Eve source is the version-matched authority for the direct
transport limitation. Executor Personal DeepWiki was first attempted against
the stale `vercel-labs/eve` repository name and could not index it; the
corrected `vercel/eve` investigation confirms the framework's native telemetry
runtime context and durable replay model, and identifies an internal
`InstrumentationAttemptScope` containing `attemptId`/`attemptIndex` that is not
part of the public authored API. DeepWiki's extension guidance therefore
supports a public Eve/provider seam as the preferred correlation route, not an
internal harness import. Vercel's current tracing guidance
confirms `@vercel/otel` W3C fetch propagation and manual inbound extraction for
non-Next.js handlers. The upgraded local package and Build Output checks must
confirm the versioned Eve ownership signals before the hosted Agent Runs proof
is attempted.

Extend the Preview proof command/contract so that it uses the target
`gpt-5.6-terra` request and reports only sanitized target assertions such as
`requestedModelTerra`, `configuredReasoningEffortHigh`,
`observedReasoningEffortHigh`, status/content-type/SSE-completion, and leak
booleans. A 200 alone is insufficient: accepted live proof combines the
deployed config readback, emitted sanitized high field, exact Eve model
identity, one successful private proxy request, and a completed subscription
SSE response. The command must continue to exit nonzero with `status:
"blocked"` on any failed predicate.

### 2026-08-04 upgraded Preview evidence boundary

The source-built Eve `0.29.5` Preview deployment
`dpl_EsvxWbAHM6NBCJ82rQYEP8Va7uC1` is Ready and reports the exact
`bundjil-codex-proxy/gpt-5.6-terra` identity with context `1050000`. The
protected session returned `202`; both the initial stream and its
`startIndex=0` replay reached `message.completed` and `session.waiting` with
the same safe event counts and no failure event. The one-hour Agent Runs
inventory remained seven Terra runs before and after replay; the selected
matching run retained the same immutable deployment, model, lifecycle, and
step/hook metadata.

The accessible Personal Agent Runs surface does not expose `$eve.*` Workflow
tags or a per-session model-attempt/proxy-request counter. This is the strongest
current hosted evidence, not proof of zero upstream calls on replay. The dated
detail and blocked packet
[`codex-terra-preview-live-eve-upgraded-2026-08-04.json`](../evidence/verification/details/codex-terra-preview-live-eve-upgraded-2026-08-04.json)
and
[`codex-terra-preview-live-eve-upgraded-2026-08-04.json`](../evidence/verification/packets/codex-terra-preview-live-eve-upgraded-2026-08-04.json)
retain that ceiling. The related proxy detail remains the separate owner of
encrypted-profile and live Terra/high subscription SSE proof.

### 2026-08-03 authorized Preview result

The authorized Preview stage deployed source-built proxy and agent candidates
from `f1b11907c29464423ddcb3ffabac6bf9f0694770`. Vercel metadata readback
established the Preview-only high-effort proxy setting and encrypted agent
Terra/context settings. A protected Eve info readback established
`bundjil-codex-proxy/gpt-5.6-terra` and `1050000`.

The acceptance criterion remains unmet. The immutable proxy returned `503`
with `mode: live`, `reasoningEffort: high`, and `ok: false`; the bounded
proxy proof consequently recorded `request_failed` and did not observe bearer
or SSE predicates. The current Preview project lacks an isolated stored
profile, persistence namespace, and cipher configuration, and the configured
proof-only Vercel protection bypass did not admit the proof command. Do not
reuse Production credentials or profile state to bypass those missing
boundaries. The dated packet
[`codex-terra-preview-blocked-2026-08-03.json`](../evidence/verification/packets/codex-terra-preview-blocked-2026-08-03.json)
is the current provider receipt; it retains no secret or payload material.

### 2026-08-04 Preview persistence decision and binding

The succeeding authorized readback found explicit Preview subject, profile,
cipher, key-prefix, and high-effort variable metadata on the proxy. It did not
find either writable REST-store pair accepted by the Effect persistence layer:
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` or
`KV_REST_API_URL`/`KV_REST_API_TOKEN`. The proxy's remaining legacy KV URL and
read-only token are not a substitute.

The only available writable REST pair belongs to the agent channel-replay
configuration and targets both Preview and Production. Cooper explicitly
approved reuse of that existing Upstash resource (`upstash-kv-apricot-window`)
for the proxy, as the agent already does. The proxy now has sensitive
`KV_REST_API_URL` and `KV_REST_API_TOKEN` metadata on both targets. This
supersedes the former requirement for a physically dedicated Preview database,
but not the logical boundary: Preview and Production must retain separate
subject, profile, key prefix, cipher, access path, deployment, and proof.

The historical metadata-only stop packet
[`codex-terra-preview-isolation-blocked-2026-08-04.json`](../evidence/verification/packets/codex-terra-preview-isolation-blocked-2026-08-04.json)
and billing stop packet remain valid history. The successor binding packet
[`codex-terra-preview-shared-upstash-binding-2026-08-04.json`](../evidence/verification/packets/codex-terra-preview-shared-upstash-binding-2026-08-04.json)
records this narrow decision and metadata readback. It does not establish
store reachability, OAuth, profile isolation, deployment, provider acceptance,
or an Eve journey.

## Affected surfaces

- `packages/codex/src/provider/contracts.ts`: named effort, request-policy,
  branded correlation, and attempt-receipt schemas plus Type/Encoded exports.
- `packages/store/src/atomic-key-value-store.service.ts` and the existing
  Upstash Layer: reuse the atomic transaction service for proxy-owned receipt
  state; no generic KV mutation or second persistence abstraction.
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
  `instrumentation.ts`, `package.json`, `turbo.json`, and Vercel agent
  variable ownership: Eve/AI SDK versions, target model identity, 1,050,000
  context window, trace-content setting, build-env allowlist, and the supported
  correlation seam if one is available.
- `package.json`, `bun.lock`, `apps/agent/test/vercel-packaging.test.ts`, and
  `apps/agent/test/sendblue-build-route.test.ts`: lock-resolved Eve ownership
  and version-tolerant Build Output assertions.
- `packages/codex` and proxy tests/fixtures, including direct-provider,
  refresh-capable, response-proof, and handler fixtures that intentionally
  assert an old model. Retain old-value fixtures only where they prove
  compatibility and label them accordingly.
- `README.md`, `packages/codex/README.md`, `apps/codex-proxy/README.md`,
  `apps/agent/README.md`, `.env.example`, `docs/architecture/eve-agent.md`,
  Vercel Preview runbook sections, proxy/provider recovery sections, proof
  packet/journey contracts, this SPEC/task ledger, and the index.

## Downstream impact ledger

| Surface                                                                   | Status          | Reason                                                                                                                                                                                |
| ------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical architecture and product docs                                   | Change required | Eve/proxy current configuration and evidence classes must describe Terra/high without rewriting historical proof as current truth.                                                    |
| Root README and affected app/package READMEs/runbooks                     | Change required | Document model/effort variables, build allowlist, safe Preview verification, rollback, and proof limits.                                                                              |
| `AGENTS.md`, repo skills, instruction surfaces                            | N/A             | Existing Effect/provider and PRD guidance already covers this slice; update only if implementation exposes a concrete conflicting instruction.                                        |
| Schemas, public types, service contracts, Layers, exports                 | Change required | The completed rollout owns effort/policy schemas and explicit Layers. Correlation and receipt schemas are deferred until their public Eve prerequisite exists.                        |
| Lint, Effect diagnostics, boundary audit, formatting, CI, scripts         | Change required | Exercise language service and existing policy scripts; retain the rejection of internal Eve imports, generic KV mutation, and process-local joins. No boundary exception is expected. |
| Tests, fixtures, compatibility assertions, browser/HTTP/provider evidence | Change required | Test low-default compatibility, high-target encoding, and live Preview proof. Browser evidence is N/A because this changes no visible browser UI.                                     |
| Observability, rollout, migration, rollback artifacts                     | Change required | Retain safe model/effort/status evidence, Preview proof, and exact rollback procedure. Strict replay observability remains a deferred future contract.                                |
| SPEC index, task ledger, completed execution plan                         | Change required | Mark the rollout implemented/completed/historical and retain the future strict-replay trigger without fake active work.                                                               |

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
- A public Eve attempt/provider seam is unavailable in the installed version.
  The dated blocked receipt is an accepted non-claim and future resume trigger,
  not a reason to infer a provider header or reopen this rollout.

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
   decoding, no token/body leak, and the lock-resolved Eve `0.29.5` package
   plus its generated route/workflow ownership.
5. The new model env and `EVE_TRACES_CONTENT` are present in the
   `@bundjil/agent#build` Turbo contract; Preview uses model `gpt-5.6-terra`,
   context `1050000`, and proxy high effort. All changes have source-built,
   read-back deployment evidence.
6. An authorized real Preview request through `bundjil-codex-proxy` in `live`
   mode emits safe high/model/status evidence, receives complete SSE from the
   subscription endpoint, and a protected Eve request reports exactly
   `bundjil-codex-proxy/gpt-5.6-terra`. No credentials, prompts, bodies,
   tokens, account ids, tool data, or chain-of-thought are retained.
7. Strict no-second-upstream replay absence is explicitly excluded from this
   rollout. It may be specified anew only when a public Eve API supplies a
   stable pre-egress correlation value; internal Eve imports,
   runtimeContext-as-header, static headers, AsyncLocalStorage, process
   globals, time-window joins, proxy-only counters, and uncorrelated receipts
   remain rejected.
8. Each implementation task records the ownership/call-graph,
   implementation-quality, and verification-coverage lenses, including flat
   Effect control flow, typed `.pipe(...)` error handling, schema ownership,
   Type/Encoded boundaries, no casts/manual mappers/helper sprawl, and clean
   boundary policy results.
9. The implementation runs focused tests, Effect language-server diagnostics,
   `bun run check:boundaries`, `bun run check:effect-setup`,
   `bun run check:docs`, `bun run check:skills`, `bun run check:authority`,
   `bun run check:controls`, `bun run check:verification`, and
   `bun run verification`; all required docs, runbooks, environment samples,
   proof artifacts, and rollout/rollback notes are updated before acceptance.
   The final closeout task performs the mandatory terminal five-pass audit on
   the actual accepted rollout scope.

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
