# Effect Boundary Provenance Enforcement

- Status: Implemented
- Owners: `@bundjil/store`, `@bundjil/codex`, `@bundjil/eve`,
  `apps/agent`, `apps/codex-proxy`, root tooling
- Last reviewed: 2026-07-18
- Depends on: [Effect Schema String Contracts](./effect-schema-string-contracts.md)

The implementation originally landed before the repository naming cleanup.
Historical sections below retain the then-current package names as evidence;
their current owners are `@bundjil/store`, `@bundjil/codex`, and
`@bundjil/eve` respectively.

## Decision

Bundjil will enforce the provenance of data crossing config, HTTP, framework,
provider, persistence, file, and executable boundaries. Canonical Effect
Schema codecs remain the source of truth for both the decoded domain type and
its encoded representation:

- `typeof Contract.Type` is the only representation admitted to domain
  services and application decisions.
- `typeof Contract.Encoded` is admitted only inside the adapter that reads or
  writes that representation.
- `unknown`, raw JSON text, bytes, provider DTOs, and native primitive strings
  remain confined to exact, named boundary adapters.
- Incoming untrusted values use `Schema.decodeUnknownEffect` once at the host
  boundary. Already typed encoded values use `Schema.decodeEffect`.
- Outgoing decoded values use `Schema.encodeEffect` before they cross the
  adapter. `Schema.encodeUnknownEffect` is not used when the decoded type is
  already known.
- An encoded primitive that must outlive the immediate adapter expression or
  cross another service boundary receives an owner-named transport Schema,
  such as the existing `AtomicKeyValueStoreValue`. Ephemeral encoded strings
  are not wrapped merely to create more types.

This policy will be enforced by the existing TypeScript, Effect language
service, Ultracite, and Knip gates plus one narrow TypeScript AST audit owned by
root tooling. It will not create a generic schema/helper package or attempt to
ban ordinary prose and implementation-local strings.

The same policy must be present in every repository instruction surface that
can create or approve boundary code. Lint configuration, architecture docs,
`AGENTS.md`, `prd-writer`, `prd-implementer`, and `effect-client-wrapper` must
agree; updating only production source is incomplete.

## Why This Is A Separate SPEC

The completed string-contract migration establishes semantic ownership:
identifiers are branded, closed vocabularies are literals, secrets are
redacted, content is named, and transport values are classified. That work
does not by itself prove where an encoded value came from or prevent a future
service signature from reintroducing `string`, `unknown`, a provider DTO, or
an ad hoc JSON operation.

TypeScript brands also disappear at runtime. A branded type proves that code
has a nominal decoded value only when the value entered through the canonical
Schema. It does not prove validation if code uses a cast or an unsafe
constructor. The stronger model is therefore:

```text
untrusted host value
  -> canonical Effect Schema codec
    -> decoded owner type
      -> Effect service operation
        -> canonical Effect Schema codec
          -> encoded adapter value
            -> external system
```

## Definitions

| Term                | Meaning                                                                                              | Permitted location                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Untrusted           | `unknown`, request body, SDK result, environment value, file contents, webhook payload               | Executable or adapter entrypoint only                                              |
| Encoded             | The `Contract.Encoded` side of an Effect Schema codec                                                | The owning adapter; expression-local unless a named transport contract is required |
| Decoded             | The validated `Contract.Type` side of the codec                                                      | Services, domain operations, branching, and composition                            |
| Semantic string     | ID, key, model, mode, event, status, URI, path, content, secret, or other string with domain meaning | Canonical owner-named Schema/type only                                             |
| Parser-local string | A fragment used while decoding a larger boundary, such as one SSE line                               | Inside the one named parser/codec operation only                                   |
| Diagnostic string   | A safe message intended for operators or a typed error                                               | Canonical checked diagnostic Schema; never a secret or raw provider body           |
| Boundary exception  | A third-party or framework primitive that cannot expose Bundjil's type                               | Exact adapter symbol registered with owner, codec, and reason                      |

## Investigation Findings

The 2026-07-18 follow-up audit found the repository clean of direct
`JSON.parse`, `JSON.stringify`, and untyped `.json()` calls in production
TypeScript. It also found substantial candidate surface that is not yet
machine-enforced:

- 35 explicit `string` annotations in non-test app/package TypeScript.
- 22 `unknown` occurrences in the same scope.
- 147 `Schema.String` or `Schema.NonEmptyString` occurrences.
- 98 Schema decode calls and 41 Schema encode calls.
- Three synchronous Schema decodes remain in `packages/codex-oauth/src`, plus
  synchronous encoding/decoding in operator scripts.
- Raw `Config.redacted` or `Config.nonEmptyString` remains in agent, Sendblue,
  Codex, and proxy configuration even where an owner-named Schema exists or
  should exist.

These counts are search candidates, not defect counts. Several are legitimate
adapter primitives: Effect's native `KeyValueStore` contract uses string keys
and values, Upstash's SDK returns `unknown`, Eve accepts `unknown` at its
schema adapter, and host callbacks return promises. They need exact ownership
and confinement rather than cosmetic brands.

With the following candidate diagnostics enabled as errors, the Effect
language service found six current issues:

- global `fetch` in two proxy proof scripts and one Codex provider operation;
- global `fetch` in the hosted Codex refresh proof script; and
- one nested `Effect.gen` yielded from the Codex profile cipher operation.

The other tested rules were clean: `anyUnknownInErrorContext`,
`floatingEffect`, `newPromise`, `preferSchemaOverJson`, `processEnv`,
`processEnvInEffect`, `schemaSyncInEffect`, `unknownInEffectCatch`, and
`unsafeEffectTypeAssertion`. The CLI does not detect every top-level sync
Schema call or public raw primitive, so the AST audit remains necessary.

`deterministicKeys` is deliberately excluded. Its current suggestions are
mostly path-derived service-key renames and do not enforce data provenance.
Changing stable service identifiers belongs in a separate migration if it is
ever justified.

## Goals

- Make every externally sourced value visibly cross one canonical decode
  boundary before entering a service.
- Make every outbound payload visibly cross one canonical encode boundary
  before an adapter sends or stores it.
- Prevent raw `string`, `unknown`, `any`, `Record<string, ...>`, and
  `Map<string, ...>` from appearing in exported semantic contracts unless an
  exact framework constraint is registered.
- Prevent duplicate inline string Schemas where an owning canonical Schema
  exists.
- Make config, persistence, webhook, SSE, OAuth, proxy, Eve, and provider
  boundaries follow the same provenance model.
- Fail CI on new unregistered boundary debt with actionable file, line, rule,
  owner, and remediation output.
- Preserve all current HTTP bodies, SSE frames, Redis keys and values,
  environment variable names, provider requests, event routing, and public
  package behavior.

## Non-goals

- Do not brand every JavaScript string, prose literal, local accumulator,
  regular expression input, HTTP method literal, or parser-local fragment.
- Do not invent `RawString`, `ValidatedString`, `SchemaUtils`, `CodecHelpers`,
  `BoundaryCommon`, or a repository-wide DTO layer.
- Do not replace framework-owned Eve event maps with a manual dispatcher.
- Do not hide third-party primitives with casts or unsafe brand constructors.
- Do not change production credentials, provider accounts, Vercel variables,
  Sendblue webhooks, Redis namespaces, routes, or deployment state.
- Do not change frontend or React behavior. Frontend composition rules remain
  mandatory if a future implementation expands into visible UI, but no React
  work is required by this SPEC.

## Governing Effect Rules

Use Effect TS native approaches first. Prefer `Data`, `Schema`, `Array`,
`Chunk`, `HashSet`, `HashMap`, `Match`, `Context`, `Layer`, `Config`, `Service`,
`Record`, `Result`, `Exit`, Bun/Platform `Command`, and `ManagedRuntime` over
plain TypeScript helpers when code is fallible, async, runtime-owned,
collection-heavy, or crosses a package, config, HTTP, provider, persistence,
file, framework, or command boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as `id: string`, `slug: string`, `status: string`, or
provider metadata outside their canonical owner.

Keep primary operations as flat, meaningful `Effect.gen` or `Effect.fn`
programs. Keep the success path linear and put expected error translation in
the outer `.pipe(...)` with `catchTag`, `catchTags`, or `mapError`. Use
`Match` over decoded literals or tagged unions for material branching.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, property readers, pass-through services, nested generators,
`switch`/`instanceof` branches, unsafe casts, or manual encode/decode adapters
when the owning Schema, service, `Match`, `Result`, or `Exit` already carries
the behavior. A helper is admitted only for multiple real call sites, a real
boundary owner, or a non-trivial independently tested policy.

The implementation must comply with
[Effect Patterns](../architecture/effect-patterns.md),
[Repo Structure](../architecture/repo-structure.md), and
[Testing And Quality](../architecture/testing-and-quality.md).

## Required Codec Patterns

### Inbound Unknown To Decoded Type

The host adapter owns `unknown`. It decodes the complete request once and
passes only the decoded type to the service:

```ts
export const InboundMessage = Schema.Struct({
  messageId: MessageId,
  text: MessageText,
  event: MessageEventType,
});

export type InboundMessage = typeof InboundMessage.Type;

export class ChannelBoundaryError extends Schema.TaggedErrorClass<ChannelBoundaryError>()(
  "ChannelBoundaryError",
  { message: Schema.NonEmptyString }
) {}

const handleInbound = Effect.fn("Channel.handleInbound")(function* (
  input: unknown
) {
  const message = yield* Schema.decodeUnknownEffect(InboundMessage)(input);
  const channel = yield* Channel;
  return yield* channel.receive(message);
}).pipe(
  Effect.mapError(
    () => new ChannelBoundaryError({ message: "Invalid inbound message." })
  )
);
```

Only the host-facing operation may accept `unknown`. `Channel.receive` accepts
`InboundMessage`, not `unknown` and not a mirrored object.

### Typed Encoded To Decoded Type

When a provider SDK or persistence adapter already exposes the codec's encoded
type, use `decodeEffect` so a compile-time representation change is visible:

```ts
const decoded = yield * Schema.decodeEffect(PersistedProfile)(encoded);
```

Do not widen `encoded` to `unknown` merely to make a decoder accept it.

### Decoded Type To Encoded Output

Use the same canonical codec in reverse. If the encoded value is consumed
immediately by the adapter, keep it expression-local:

```ts
const body =
  yield * Schema.encodeEffect(Schema.fromJsonString(ProviderRequest))(request);

const httpRequest = HttpClientRequest.post(url).pipe(
  HttpClientRequest.bodyText(body)
);

return yield * httpClient.execute(httpRequest);
```

If `body` must be returned by a service, queued, cached, or persisted before
the external write, define an owner-named transport Schema instead of exposing
plain `string`.

### Configuration

Semantic values use `Config.schema(OwnerSchema, "ENV_NAME")`. Primitive
`Config.redacted`, `Config.nonEmptyString`, and `Config.string` are allowed
only where the configuration value is truly adapter-private and registered.
Secrets remain `Redacted`; they are not unwrapped and re-decoded to obtain a
brand.

### JSON And Persistence

JSON text uses `Schema.fromJsonString(...)`; JSON-safe object codecs may use
`Schema.toCodecJson(...)`. Domain services never call `JSON.parse`,
`JSON.stringify`, or untyped response `.json()`.

Every persisted record must have:

- one canonical codec owned by the domain that gives the record meaning;
- an Effectful encode before the native `KeyValueStore`/atomic adapter;
- an Effectful decode after retrieval;
- round-trip, invalid-input, and byte-compatibility tests; and
- exact physical key, prefix, TTL, and serialized-byte assertions when a
  migration touches durable data.

Effect's native `KeyValueStore` string interface remains an explicit adapter
constraint. Bundjil services continue to expose branded atomic keys and opaque
serialized values rather than leaking the native primitives.

### Errors And Diagnostics

Public and expected failures use `Schema.TaggedErrorClass` with safe,
owner-named fields. A private adapter may retain `cause: unknown` only if the
cause never crosses serialization, logs, HTTP, tools, or package API and the
adapter maps it once to a safe public error. Provider bodies and secrets are
never copied into diagnostic messages.

## Static Enforcement

### Root Boundary Audit

Add one purpose-built TypeScript compiler-API audit, owned by root tooling. It
must inspect production app/package source and operator scripts and report
stable diagnostics. It is not a general lint framework and must not import
runtime code from applications.

The audit fails on:

1. Raw `string`, `unknown`, `any`, string-indexed records, or string-keyed maps
   in exported Schemas, types, interfaces, classes, service methods, Layer
   constructors, and app composition APIs.
2. Inline `Schema.String` or `Schema.NonEmptyString` fields in exported
   structures when an owner-named field Schema is required.
3. Primitive `Config.string`, `Config.nonEmptyString`, or `Config.redacted`
   for a semantic value that lacks an exact adapter exception.
4. `Schema.decodeUnknownEffect` when the argument is statically the codec's
   encoded type, and `Schema.encodeUnknownEffect` when the argument is
   statically the codec's decoded type.
5. Production `Schema.decodeSync`, `decodeUnknownSync`, `encodeSync`, and
   `encodeUnknownSync`. Tests may use sync codecs for literal fixtures only;
   operator scripts must remain Effectful.
6. `JSON.parse`, `JSON.stringify`, untyped response `.json()`, unsafe casts,
   non-null assertions at boundaries, `Schema.make`, and unreviewed brand
   constructors.
7. Raw `.text()` or provider `fetch` outside an exact boundary adapter, or a
   text body that is not decoded by the canonical codec before domain use.
8. Outbound provider, HTTP, queue, file, or persistence writes whose body or
   value is not produced by a canonical Schema encoder or a framework-native
   Schema body API.
9. Boundary DTO mirrors, manual object readers/mappers, and new generic
   `utils`, `helpers`, `common`, or `shared` modules.

The checker must use AST symbols and the TypeScript type checker for public
signatures and encode/decode argument relationships. Regex-only scanning is
not sufficient. Fixture tests must prove accepted and rejected source shapes.

### Exact Exception Registry

Some external interfaces cannot be changed. Each exception must identify:

- exact file and exported or local symbol;
- owner package/app;
- boundary kind: `http-in`, `http-out`, `config`, `provider`, `persistence`,
  `file`, `framework`, or `cli`;
- canonical enclosing codec or public service contract;
- raw syntax being admitted; and
- concrete reason the third-party interface requires it.

Exceptions are exact symbol entries, not counts, line-number baselines, glob
allowlists, or directory ignores. The checker fails if an exception becomes
stale. Framework-generated files may be centrally excluded, but handwritten
framework adapters may not.

Likely justified entries include the native Effect `KeyValueStore` string
implementation, the private Upstash client facade, Eve's generic Standard
Schema adapter bound, and host callback promises. Current Codex, Sendblue,
config, and proxy raw annotations are migration candidates until individually
proved otherwise.

### Effect Language Service And CI

Configure `diagnosticSeverity` in `tsconfig.base.json` and make the selected
rules errors after their existing findings are fixed:

- `anyUnknownInErrorContext`
- `floatingEffect`
- `globalFetchInEffect`
- `nestedEffectGenYield`
- `newPromise`
- `preferSchemaOverJson`
- `processEnv`
- `processEnvInEffect`
- `schemaSyncInEffect`
- `unknownInEffectCatch`
- `unsafeEffectTypeAssertion`

Add an explicit setup check so CI fails if TypeScript is not patched with the
Effect language service. `bun run verification` must run the boundary audit,
the Effect setup check, Ultracite, Knip, all workspace typechecks, and tests.
Do not weaken severity, add broad suppressions, or create a permanent debt
count to land the migration.

## Governance And Instruction Surfaces

Boundary provenance is a repository rule, not a one-time refactor. The final
implementation task must reconcile these surfaces together:

- `package.json`, `tsconfig.base.json`, and CI own executable lint, Effect
  language-service, setup, and verification commands.
- `AGENTS.md` states the concise default: decode unknown input at the owning
  adapter, expose decoded Schema-derived types to services, encode outward,
  and run the boundary audit. `CLAUDE.md` is a symlink and must not be edited as
  a separate source of truth.
- `docs/architecture/effect-patterns.md` owns the full `Type`/`Encoded`, codec,
  adapter-exception, Config, HTTP, persistence, error, Match, and helper
  admission rules.
- `docs/architecture/testing-and-quality.md` owns `check:boundaries`,
  `check:effect-setup`, fixture tests, compatibility proof, and the complete
  closeout gate.
- `docs/architecture/repo-structure.md` identifies where canonical Schemas,
  adapters, and the root audit live; it must continue to forbid app/provider
  DTOs in shared packages.
- `prd-writer` requires every new SPEC that crosses a config, HTTP, provider,
  persistence, framework, file, command, RPC, or tool boundary to name the
  canonical codec, its decoded/encoded sides, exact adapter, exception needs,
  and inbound/outbound call graph.
- `prd-implementer` places the same requirements in its mandatory subagent
  prompt, task acceptance loop, and three-pass audit. It must reject raw public
  primitives, unsafe construction, unencoded outward writes, stale
  exceptions, and missing boundary-audit evidence.
- `effect-client-wrapper` must be rewritten to demonstrate owner-named
  operations, request encoding, provider-result decoding, `Config.schema`,
  redacted secrets, Schema tagged errors, live/mock Layers, and provider
  primitives confined to the adapter. It must no longer recommend a generic
  public `use` callback, raw `id: string`, primitive semantic config,
  `instanceof` error branching, or unchecked SDK result escape.

Skill text is executable policy for future agents. Skill examples must compile
conceptually against Effect v4 and must not retain simplified examples that
contradict the repository. A stale-pattern scan must cover the relevant skills
and architecture docs in addition to production source.

## Ownership And Initial Remediation Map

### `@bundjil/effect-persistence`

- Retain native `KeyValueStore` primitive strings only in its live/memory
  adapter implementations.
- Keep Upstash `unknown` SDK results private and decode every command response
  through a command-specific Schema before decisions.
- Replace raw method/cursor/script/value annotations where an owner-named
  provider transport contract crosses an internal operation.
- Prove physical keys, values, TTL behavior, and transaction scripts remain
  byte-compatible.

### `@bundjil/codex-oauth`

- Replace raw profile map keys, redirect URIs, filesystem directories, auth
  cache paths, token inputs, revisions, and persisted values with existing or
  newly owner-named contracts.
- Keep SSE line text parser-local and decode each completed event through the
  canonical event codec before `Match` branches.
- Remove synchronous Schema work from `src` and operator scripts.
- Move provider HTTP and proof requests to Effect `HttpClient`.
- Flatten the profile-cipher nested generator and preserve typed errors in its
  outer pipeline.

### `@bundjil/eve-effect`

- Retain `Schema.Decoder<unknown>` only as the exact generic constraint needed
  by the Standard Schema bridge.
- Ensure Eve operation inputs/outputs and event projections expose only
  canonical owner types.

### `apps/agent`

- Replace raw config and preflight fields with app-owned Schemas.
- Confine Eve callback `unknown` and Promise return values to the framework
  adapter.
- Replace Sendblue raw message/replay comparison values with canonical
  content, coordinate, claim, and replay contracts or exact private parser
  exceptions.
- Preserve signed webhook verification, replay claims, routing, and outbound
  delivery behavior.

### `apps/codex-proxy`

- Replace raw response diagnostics and proof-script output strings with
  canonical response/output Schemas.
- Use Effect `HttpClient` in proof and smoke programs.
- Preserve status codes, content types, authorization behavior, streaming
  frames, and Vercel runtime composition.

### `@bundjil/core` And `@bundjil/effect-start`

These packages are currently clean under the proposed Effect diagnostics.
They remain in audit scope so new raw public boundaries cannot regress.

## Call Graphs

```text
Production inbound channel:
Sendblue HTTP webhook / Eve framework callback
  -> apps/agent host adapter (unknown/raw text allowed)
    -> SendblueInboundMessage codec decodeUnknownEffect
      -> SendblueChannel service
        -> Eve agent session/tool operations using decoded owner types
          -> Sendblue outbound codec encodeEffect
            -> SendblueClient live adapter
```

```text
Production Codex provider:
apps/agent decoded model request
  -> private codex-proxy HTTP codec
    -> apps/codex-proxy Effect HTTP API handler
      -> CodexDirectProvider
        -> CodexOAuthService / CodexProfileStore
          -> @bundjil/effect-persistence AtomicKeyValueStore
            -> Upstash live adapter
        -> CodexRequestMapper decoded request
          -> CodexHttpClient live adapter + Effect HttpClient
            -> OpenAI Codex Responses endpoint
          -> Codex stream event codec
            -> decoded event Match
              -> encoded OpenAI-compatible SSE response
```

```text
Persistence tests:
encoded fixture
  -> owner codec decodeEffect
    -> service operation with decoded Type
      -> owner codec encodeEffect
        -> AtomicKeyValueStore memory layer
          -> read/decode/round-trip and exact-byte assertion
```

```text
Static verification:
bun run check:boundaries
  -> TypeScript Program + type checker
    -> AST boundary rules
      -> exact exception registry validation
        -> actionable diagnostics / zero unexplained findings

bun run check:effect-setup
  -> effect-language-service check

bun run check-types
  -> patched TypeScript + configured Effect diagnostics

bun run verification
  -> boundary audit + Effect setup + Ultracite + Knip + typechecks + tests
```

## Implementation Sequence

1. Add the AST audit, fixture tests, exact initial exception registry, CI
   commands, and architecture documentation. The initial registry may contain
   only individually classified current findings; no numeric debt baseline is
   allowed.
2. Migrate the Codex request, OAuth, profile, SSE, persistence, filesystem,
   provider HTTP, and operator-script paths end to end. Remove resolved
   exceptions as each slice lands.
3. Migrate agent, Sendblue, proxy, config, and shared persistence boundaries
   end to end while preserving webhook, replay, streaming, and wire behavior.
4. Enable all approved Effect language-service diagnostics, reduce the exact
   registry to unavoidable third-party/framework constraints, reconcile lint
   configuration, architecture docs, `AGENTS.md`, `prd-writer`,
   `prd-implementer`, and `effect-client-wrapper`, then run the complete
   repository gate.

Each task must leave a working repository state, include focused tests, and
commit only after its verification and three parent audit passes succeed.

## Verification

Every implementation task must include:

- fixture tests for every new static rule and exception-registry behavior;
- focused Schema round-trip and invalid-input tests for each changed codec;
- typechecks proving service APIs accept decoded owner types;
- compatibility tests for persisted bytes, Redis keys/prefixes/TTL, OAuth
  payloads, HTTP request/response JSON, authorization headers, and SSE frames;
- direct HTTP tests for affected proxy and webhook status codes, content
  types, error bodies, and streaming output;
- focused package/app tests, builds, Ultracite, Knip, and Effect diagnostics;
- stale-pattern scans proving architecture docs and relevant skills do not
  teach raw public primitives, generic SDK escape hatches, unsafe construction,
  unencoded outward writes, or obsolete verification commands;
- `bun run verification` as the final gate; and
- `git diff --check` plus JSON parsing of the task ledger.

Browser evidence is not required because this SPEC changes no visible route or
React surface. Live provider proof is not required unless implementation
changes runtime composition or wire output; if it does, use non-mutating
preview proof and record the exact environment and endpoint without exposing
secrets.

## Mandatory Three-Pass Effect Audit

Every parent implementation task must record at least three complete passes.
More passes are required while any weakness remains.

1. **Ownership and call graph:** confirm every Schema, type, service, error,
   adapter, Layer, and exception has one owner; imports point inward through
   stable exports; raw data exists only at the named boundary; frontend work,
   if unexpectedly introduced, follows primitive -> composite -> layout ->
   route composition with route/feature-owned data and workflows and
   presentation-leaf rendering, accessibility, local UI, and state display.
2. **Effect and implementation quality:** inspect complete diffs for flat
   linear `Effect.gen`, typed errors in outer `.pipe(...)`, correct
   `decodeUnknownEffect`/`decodeEffect`/`encodeEffect` selection, exhaustive
   `Match`, no unsafe casts or sync production codecs, no local DTO mirrors,
   no manual readers/mappers, and no helper/wrapper sprawl.
3. **Verification and evidence:** prove static rules with fixtures, runtime
   behavior with focused tests, encoded compatibility with round-trip and
   byte assertions, direct HTTP contracts where relevant, all-workspace
   typechecks, and the complete root verification gate.

Audit evidence must be recorded in the active execution plan before a task is
accepted. A statement that a pass occurred is not evidence; record files,
findings, corrections, and commands/results.

## Acceptance Criteria

- Every service and exported domain API uses canonical Schema-derived decoded
  types; no unexplained raw semantic primitive remains.
- Every incoming host/provider value is decoded once at an exact adapter.
- Every outgoing provider, HTTP, persistence, file, or queue value is encoded
  through the canonical codec before crossing outward.
- The exception registry contains only exact unavoidable framework/provider
  constraints, and stale entries fail the audit.
- No direct JSON APIs, unsafe casts, production sync codecs, raw environment
  reads, global fetch inside Effect programs, or anonymous semantic config
  primitives remain.
- Material decoded literals and tagged unions use `Match`; framework event
  maps remain framework-owned.
- No generic helper, common, DTO, mapper, or schema-constructor layer is added.
- All wire values and durable bytes remain compatible.
- The selected Effect language-service diagnostics are errors and the setup is
  verified in CI.
- Lint configuration, `AGENTS.md`, architecture docs, `prd-writer`,
  `prd-implementer`, and `effect-client-wrapper` describe and enforce the same
  codec/provenance model without contradictory examples.
- Every task records the mandatory three audit passes with concrete evidence.
- `bun run verification` and `git diff --check` pass.

## Risks And Tradeoffs

- TypeScript cannot intrinsically prove the origin of a primitive encoded
  string. Confining encoded primitives to adapters and auditing the AST is
  stronger than proliferating unsafe nominal wrappers.
- A custom audit can become a second linter. Its scope is therefore limited to
  boundary provenance, implemented with the TypeScript compiler API, and
  covered by source fixtures.
- Over-branding parser fragments and prose creates constructor pressure and
  helper sprawl. The audit targets exported, configured, persisted, provider,
  framework, and cross-operation values, not every local string.
- Third-party APIs necessarily expose primitives. Exact symbol exceptions make
  those constraints visible without weakening the rest of the repository.
- Tightening diagnostics may uncover unrelated code-shape defects. Only the
  named provenance and Effect-flow rules are included; deterministic service
  key renaming is explicitly deferred.
