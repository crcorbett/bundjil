# Effect Schema String Contracts

- Status: Implemented
- Owners: `@bundjil/core`, `@bundjil/effect-persistence`,
  `@bundjil/effect-start`, `@bundjil/codex-oauth`, `@bundjil/eve-effect`,
  `apps/agent`, `apps/codex-proxy`
- Last reviewed: 2026-07-18

## Decision

Replace stringly domain and boundary contracts with canonical, owner-named
Effect Schemas. The type selected for a string depends on its semantics:

1. **Open semantic values** such as IDs, storage keys, model IDs, event
   coordinates, tool names, account identifiers, and opaque provider values
   use a checked `Schema.String` or `Schema.NonEmptyString` followed by
   `Schema.brand("OwnerTypeName")`.
2. **Closed vocabularies** such as `message.completed`, finish reasons,
   statuses, roles, operations, modes, and event kinds use a named
   `Schema.Literal` or `Schema.Literals`. They are discriminants, not brands.
3. **Secrets** use an owner-named `Schema.Redacted` or
   `Schema.RedactedFromValue` contract whose inner string is checked for the
   provider's minimum validity. Secret brands must not force unredaction.
4. **Human or generated content** uses an owner-named checked text Schema.
   Content is not nominally branded unless two valid content domains are
   otherwise interchangeable at a real call boundary and mixing them would be
   a defect.
5. **Transport primitives** such as HTTP header values, SSE lines, JSON text,
   Redis serialized values, filesystem paths, and provider error descriptions
   use owner-named checked Schemas at decode/encode boundaries. Internal
   parsing algorithms may use `string` after decoding while the semantic value
   remains inside the owning operation.
6. **Safe diagnostic messages** remain canonical checked strings on tagged
   errors. They are diagnostics, not identifiers, and must not gain brands
   that require unsafe construction.

`message.completed` is therefore a literal event discriminant, not a branded
string. Eve's typed channel event map remains the framework dispatch boundary.
Bundjil will define the canonical Eve event literal and payload Schemas it
persists or forwards, decode the event payload once in the channel adapter,
and use `Match` for finish-reason and result branching.

## Problem

The repository already uses Effect Schema extensively, but the string model is
inconsistent:

- Sendblue has strong brands for E.164 numbers, message handles, principals,
  conversation keys, replay keys, and claim IDs, while Eve session/turn IDs,
  message content, finish reasons, replay prefixes, and provider statuses are
  still inline string Schemas.
- Codex OAuth brands profile/connector/installation IDs, credential revisions,
  cipher key IDs, model IDs, endpoints, and prefixes, but principal IDs,
  issuers, redirect URIs, subject hashes, scopes, function/tool identifiers,
  stream event types, completion IDs, account IDs in several request shapes,
  and content types are plain strings or duplicated redacted strings.
- `AtomicKeyValueStoreKey` and `AtomicKeyValueStoreValue` are currently plain
  strings despite crossing the public persistence service boundary.
- `@bundjil/core` exposes `WorkspaceSummary` as raw `name: string` and
  `packages: readonly string[]`, while Eve independently brands those
  cross-package workspace semantics.
- Several operations decode a canonical union and then branch with raw
  equality checks or `as const` results even where exhaustive `Match` over the
  decoded discriminant is clearer.

A mechanical `Schema.brand` on every string would make this worse. It would
brand prose, error messages, serialized JSON, and protocol fragments without
adding validation; force unsafe constructors or decoding helpers; and obscure
literal unions that should drive exhaustive matching.

## Audit Baseline

The pre-implementation audit found:

- 541 production-source occurrences matching string Schema, explicit string
  type, literal, or `as const` patterns. This is a candidate set, not 541
  defects.
- Existing semantic string brands are concentrated in Sendblue and Codex
  OAuth. The persistence, Eve operation, and proxy packages have no string
  brands.
- `apps/agent/agent/channels/sendblue.ts` receives a typed Eve
  `"message.completed"` handler, but its projected `SendblueCompletedMessage`
  uses plain `finishReason`, `sessionId`, `turnId`, and message strings.
- The installed Eve `AssistantStepFinishReason` vocabulary is
  `content-filter | error | length | other | stop | tool-calls`.
- The Codex stream mapper decodes a broad event with a plain string `type`,
  then recognizes known event literals through repeated equality checks.
- Closed vocabularies are generally already `Schema.Literals`; they need
  canonical reuse and exhaustive matching, not branding.

The implementation must produce a checked audit table in the active plan for
every exported Schema field and every changed internal boundary. Each item is
classified as `brand`, `literal`, `content`, `secret`, `transport`, or
`diagnostic`, with its owner and admission reason.

## Goals

- Ensure every exported or persisted semantic string field references a named
  canonical Schema owned by its package or app.
- Brand every open semantic string that can be confused with another valid
  string across a service, package, config, persistence, provider, or framework
  boundary.
- Keep closed event/status/role/operation vocabularies as named literal
  Schemas and branch on them with exhaustive `Match` where control flow is
  material.
- Decode unknown input once at HTTP, Eve, provider, config, persistence, file,
  and script boundaries; encode canonical values when crossing outward.
- Preserve all wire values, physical Redis keys, encoded JSON, OAuth payloads,
  SSE frames, HTTP statuses, Vercel configuration, and provider behavior.
- Remove duplicate inline Schemas for an existing canonical type.
- Add static audit coverage that prevents new anonymous semantic string fields
  in the audited boundary files without creating a second lint framework.

## Non-goals

- Do not brand arbitrary local variables, string literals, error messages,
  human prose, JSON fragments, SSE lines, HTTP method names, or provider error
  descriptions.
- Do not change Eve's public event types or replace its typed event-handler map.
- Do not introduce a global `StringTypes`, `BrandUtils`, `SchemaHelpers`,
  `CommonSchemas`, DTO package, or generic constructor layer.
- Do not add unsafe brand constructors, `as` assertions, double assertions,
  `Schema.decodeSync` calls inside domain operations, or wrappers whose only
  purpose is satisfying a brand.
- Do not change Production environment variables, OAuth profiles, webhooks,
  provider accounts, persistence namespaces, routes, or deployment state.
- Do not modify React, routes, visible text, or browser behavior.

## Governing Effect Rules

Use Effect TS native approaches first. Prefer `Data`, `Schema`, `Array`,
`Chunk`, `HashSet`, `HashMap`, `Match`, `Context`, `Layer`, `Config`, `Service`,
`Record`, `Result`, `Exit`, and `ManagedRuntime` over plain TypeScript helpers
when code is fallible, async, collection-heavy, or boundary-crossing.

Canonical Schemas and schema-derived types live with the domain that gives the
value meaning. Do not mirror `id: string`, `status: string`, `type: string`, or
equivalent fields downstream. A consumer imports the owner's Schema/type or
decodes its enclosing canonical structure.

Primary operations remain flat named `Effect.gen` or `Effect.fn` programs.
Expected failures are translated once in the outer `.pipe(...)` with
`catchTag`, `catchTags`, or `mapError`. Use `Match.value(...).pipe(...)` over a
decoded literal/tagged union for material branching. A framework callback may
remain an event-map property when the framework owns dispatch.

Boundary decoding is not permission to add constructor sprawl. Prefer decoding
the complete existing request/event/config/record Schema once. Add a named
single-field Schema when it is independently reused, persisted, configured, or
crosses a service/package boundary. Inline implementation-only parsing remains
inside its owning Effect.

## Required Contract Shape

The following illustrates the distinction; exact names follow the owning
package during implementation:

```ts
export const EveSessionId = Schema.NonEmptyString.pipe(
  Schema.brand("EveSessionId")
);

export const EveMessageCompletedEventType = Schema.Literal("message.completed");

export const EveAssistantStepFinishReason = Schema.Literals([
  "content-filter",
  "error",
  "length",
  "other",
  "stop",
  "tool-calls",
]);

export const EveAssistantMessageText = Schema.String;
```

The literal event and finish-reason contracts enable exhaustive control flow:

```ts
const delivery = Match.value(completed.finishReason).pipe(
  Match.when("tool-calls", () => Effect.succeed("ignored" as const)),
  Match.orElse(() => deliverTerminalMessage(completed))
);
```

The final implementation must avoid the illustrative `as const` if the
canonical result Schema or contextual return type already preserves the
literal.

## Ownership

### `@bundjil/core`

Own reusable framework-neutral workspace and package identities and the
schema-derived `WorkspaceSummary` boundary. The fixed current package set is a
named closed literal vocabulary; `makeWorkspaceSummary` decodes its complete
default/custom-name structure through Effect Schema.

### `@bundjil/effect-start`

Own no Bundjil string-domain contracts. It remains generic TanStack Start
middleware glue and must import an owning boundary contract when one is needed.

### `@bundjil/effect-persistence`

Own branded atomic keys and opaque serialized values. Branding is compile-time
only and must not alter Redis key/value bytes. Native Effect `KeyValueStore`
continues to expose its upstream string contract; the supplemental atomic
service owns the stricter semantic boundary.

### `@bundjil/codex-oauth`

Own Codex/OAuth identifiers, subjects, redirect URIs, scopes, hashes,
credentials, provider protocol literals, function-call identifiers, model
identifiers, stream event discriminants, completion identifiers, content
contracts, and proxy authorization contracts. Provider payloads remain
wire-compatible.

### `@bundjil/eve-effect`

Own reusable Bundjil Eve operation input/output strings and any reusable Eve
session, turn, message, or event contracts that are framework-neutral enough
for more than one app boundary. It re-exports core-owned workspace/package
contracts for its tool boundary and must not mirror Eve's entire protocol.

### `apps/agent`

Own Sendblue-specific content, replay prefixes, routing secrets, ignored
reasons, channel state, and the projection from Eve's typed event callback into
canonical Bundjil event-coordinate Schemas. Shared Eve identifiers belong in
`@bundjil/eve-effect` only when actual reuse exists.

### `apps/codex-proxy`

Own proxy mode, local filesystem directory, health/error literals, and
app-specific runtime config. It reuses Codex-owned account, token, model, and
subject Schemas.

## Call Graphs

Production inbound and outbound channel path:

```text
Sendblue HTTP unknown
  -> SendblueWebhookVerifier
  -> Schema.fromJsonString(SendblueInboundMessage)
  -> branded IDs/content + literal direction/service/status
  -> Match classification
  -> SendblueReplayStore (branded key/value transaction)
  -> Eve send(continuationToken)
  -> typed "message.completed" callback
  -> Schema.decodeUnknownEffect(Eve/Sendblue completed payload)
  -> Match finish reason/result
  -> SendblueClient
```

Production Codex path:

```text
OpenAI-compatible HTTP unknown
  -> Schema.decodeUnknownEffect(OpenAICompatibleChatCompletionRequest)
  -> CodexRequestMapper
  -> literal role Match + branded model/tool/call identifiers
  -> CodexOAuthService (branded subject/profile/revision)
  -> CodexHttpClient
  -> Schema.fromJsonString(Codex Responses stream event)
  -> known literal event Match with forward-compatible fallback
  -> Schema.encodeEffect(OpenAICompatibleChatCompletionChunk)
```

Persistence path:

```text
Consumer domain Schema encode
  -> Schema.decodeUnknownEffect(AtomicKeyValueStoreTransaction)
  -> branded atomic keys/serialized values
  -> PersistenceMemory or UpstashPersistenceLive
  -> unchanged physical string bytes
```

Tests:

```text
unknown fixture
  -> canonical owner Schema decode
  -> service with Memory/Mock Layer
  -> Match-controlled outcome
  -> canonical Schema encode/readback
```

## Compatibility Requirements

- Every existing accepted payload fixture must decode or fail for the same
  semantic reason after named Schema extraction.
- Encoded OAuth profiles, encrypted envelopes, Redis records, atomic keys and
  values, Sendblue requests, Codex requests, and SSE chunks must remain
  byte-for-byte compatible where ordering is canonical today.
- Existing callers must receive branded values through canonical whole-object
  decoding, Config Schema decoding, provider decoding, or persisted-record
  decoding. Tests may decode fixtures; production code may not assert brands.
- Unknown Codex stream events remain safely ignored unless malformed; the
  recognized event vocabulary is literal and matched exhaustively.
- `message.completed` tool-call narration remains ignored; all other current
  Eve finish reasons retain terminal-delivery behavior.

## Verification

- Focused typechecks/tests/builds for all seven scoped owners where they own
  runtime code; `@bundjil/effect-start` has no string-domain change.
- Schema round-trip tests for every new brand and extracted literal/content
  contract, including cross-brand compile-time separation where practical.
- Compatibility fixtures for persisted keys/values, encrypted profiles,
  Sendblue payloads, Codex requests/events/chunks, and Eve completed events.
- Static scans prove no unsafe casts, local brand constructors, duplicate
  semantic Schema definitions, `switch`, new raw JSON, or helper/common/utils
  modules.
- Effect language-service diagnostics are reviewed for every changed
  TypeScript file.
- `bun run fix`, `bun run check`, `bun run knip`, `bun run verification`,
  `bun run build`, and `git diff --check` pass.
- No frontend files or runtime/provider configuration change; Browser and live
  provider proof are not applicable unless implementation violates that
  boundary and first amends this SPEC.
- Each implementation task requires three parent audit passes: ownership/call
  graph, Effect implementation/helper admission, and verification/evidence.

## Acceptance

- No exported or persisted semantic string field in the audited files is an
  anonymous inline `Schema.String`/`Schema.NonEmptyString` when an owner-named
  contract carries domain meaning.
- Every open semantic value that crosses a boundary is branded; every closed
  vocabulary is a named literal Schema; every content, secret, transport, and
  diagnostic exception is explicitly classified.
- Eve and provider event handling decodes once and uses `Match` over canonical
  discriminants without changing behavior.
- The audit table, source, tests, architecture guidance, and package/app
  runbooks agree.
