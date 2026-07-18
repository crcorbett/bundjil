# Repository Naming And Structure Cleanup

- Status: Implemented
- Owner: Bundjil workspace
- Created: 2026-07-18
- Scope: package names, source paths, public exports, documentation taxonomy,
  and removal of unused scaffolding

## Decision

Rename reusable packages after the capability or external boundary they own,
not after Effect as an implementation technology. Remove packages that exist
only as unused or self-describing scaffolding, and replace generic `core`
buckets with explicit owners. Retain Eve's documented `agent/lib` authored slot
for import-only implementation because it is a framework boundary, not a
workspace package taxonomy.

The target workspace is:

```text
apps/
  agent/              Bundjil's Eve application and app-owned integrations.
  codex-proxy/        Private Codex model proxy; deployed identity unchanged.

packages/
  codex/              Codex auth, profiles, transport, provider, and proofs.
  eve/                Reusable Eve-facing schemas and tool adapter contracts.
  store/              Provider-neutral key-value and atomic store contracts.
```

The canonical package changes are:

| Current                       | Target           | Decision                                                                                          |
| ----------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `@bundjil/effect-persistence` | `@bundjil/store` | Rename; preserve contracts and adapter behavior.                                                  |
| `@bundjil/codex-oauth`        | `@bundjil/codex` | Rename because the package owns the complete Codex integration, not only OAuth.                   |
| `@bundjil/eve-effect`         | `@bundjil/eve`   | Rename; Eve is the real framework boundary.                                                       |
| `@bundjil/effect-start`       | none             | Remove because no production consumer exists.                                                     |
| `@bundjil/core`               | none             | Fold its workspace-status scaffold into `@bundjil/eve`; do not preserve a generic `core` package. |
| `@bundjil/agent`              | unchanged        | The application name describes the product capability.                                            |
| `@bundjil/codex-proxy`        | unchanged        | Codex is a real provider boundary and proxy describes the deployed app.                           |

This is a behavior-preserving source migration except for the deliberate name
changes exposed by imports, selected exported tagged-error discriminants, and
the `workspace_status` package inventory. It must not otherwise alter live
provider configuration, runtime routes, authentication, storage formats,
physical keys, deployment projects, webhooks, or accepted Production behavior.

## Problem

The current workspace mixes three naming strategies:

- implementation-first names such as `effect-persistence`, `effect-start`,
  and `eve-effect`;
- generic workspace buckets such as `core` and framework-specific source slots
  such as `agent/lib` whose import-only role is not obvious from the name; and
- capability/provider names such as `agent`, `codex-proxy`, `sendblue`, and
  `executor`.

Implementation-first names make Effect appear to be the owned product concept.
Generic workspace buckets conceal ownership. `@bundjil/codex-oauth` has the
opposite problem: it has grown to own Codex OAuth, encrypted profiles, refresh and
fencing, direct Responses transport, OpenAI-compatible mapping, proxy service
contracts, persistence composition, local login, and proof commands. Eve's
`agent/lib` directory is not one of those generic buckets: Eve 0.20 documents it
as the import-only authored slot for code that must not be discovered as a
channel, connection, tool, or other runtime identity.

The result is a package map that is harder to predict than the actual
architecture. Public subpaths such as `/live.layer`, `/mock.layer`, and
`/filesystem-key-value-store.layer` also expose dependency-injection mechanics
rather than consumer intent. Within Eve's required `agent/lib` slot, provider
subdirectories and responsibility filenames must still make their owner clear.

## Repository Evidence

| Evidence                                                                                                                                                     | Naming implication                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/effect-start` has no production consumer outside its own tests/docs and the workspace scaffold.                                                    | Remove it and the now-unused TanStack catalog instead of renaming it.                                                                                    |
| `packages/core` contains only workspace-summary scaffolding consumed by the Eve boundary.                                                                    | Fold that feature into `@bundjil/eve`; reserve a future domain package for proven multi-consumer concepts.                                               |
| `packages/codex-oauth/package.json` exposes auth, profiles, persistence, provider transport, proxy, local login, and proofs.                                 | `@bundjil/codex` describes the owned integration more accurately than `@bundjil/codex-oauth`.                                                            |
| Eve 0.20 documents `channels/<name>.ts` and `connections/<name>.ts` as filename-derived identities and `agent/lib` as import-only.                           | Keep the direct `sendblue.ts` and `executor.ts` files and their provider-owned `agent/lib` implementations.                                              |
| Renamed package manifests duplicate `exports` under `publishConfig.exports`; root TypeScript references point only at packages scheduled for removal.        | Reconcile both export maps and define the final project-reference graph explicitly.                                                                      |
| The agent build loads fail-closed Executor config, while the current CI workflow supplies no build-time Executor values.                                     | Add non-secret synthetic CI inputs and prove that discovery makes no provider call.                                                                      |
| Effect 4.0.0-beta.74 `Schema.TaggedErrorClass` makes its literal argument the runtime and encoded `_tag`; `catchTag` and `catchTags` dispatch on that value. | Rename each selected class, literal, union member, constructor, catcher, and encoded-contract assertion atomically.                                      |
| The target package/channel inventory contains 36 exported schema-backed errors: store 1, Codex 22, Eve 3, Sendblue 9, and Executor 1.                        | Rename eight inconsistent live contracts, remove two unused Eve contracts, and retain the 26 names that already identify genuine capabilities/providers. |
| Current storage schemas contain profiles and replay records, not encoded error objects; proxy routes translate typed errors to stable response codes.        | Use a hard in-repo tag cutover without aliases while preserving persisted values and HTTP responses.                                                     |

## Naming Rules

1. Workspace packages use `@bundjil/<owned-capability>`.
2. Provider or framework names remain when the package or app genuinely owns
   that boundary, including `codex`, `eve`, `sendblue`, `executor`, and
   `upstash` adapter paths.
3. Do not prefix a package with `effect-`; Effect remains the implementation
   model and may remain visible in types such as `Effect`, `Layer`, and
   `Context.Service`.
4. Do not introduce `core`, `shared`, `common`, `utils`, `helpers`, `manager`,
   or `repository` buckets. `apps/agent/agent/lib` is the sole exception for
   Eve import-only code; its immediate children must be owned integrations such
   as `sendblue` and `executor`, never another generic bucket.
5. Public export paths describe consumer intent: `/runtime`, `/local`,
   `/testing`, `/filesystem-store`, `/memory`, `/upstash`, and `/schema`.
6. Source paths describe owned features. File suffixes such as `.service.ts`
   and `.layer.ts` are not required when the containing feature path and
   exported symbol already identify the role.
7. Schema-derived types, service tags, tagged errors, and provider adapters
   remain owned by their current capability. A rename does not authorize DTO
   copies, compatibility wrappers, or speculative abstractions.
8. Historical evidence may retain old names when rewriting it would damage
   provenance. Current architecture, runbooks, commands, package metadata, and
   navigation must use only the new names.
9. Exported tagged-error class names and literal `_tag` values must match. A tag
   rename is one atomic contract migration across constructors, failure unions,
   `catchTag`/`catchTags`, Schema encode/decode tests, app mappings, and docs.

## Goals

- Make package names predictable from the concepts they own.
- Reduce the workspace from five reusable packages to three without changing
  runtime behavior.
- Keep provider-neutral storage contracts under `@bundjil/store` with explicit
  `/memory` and `/upstash` adapters.
- Make `@bundjil/codex` the canonical owner of the existing Codex integration.
- Make `@bundjil/eve` the canonical owner of the existing Eve schema bridge and
  workspace-status operation, with no dependency on a generic domain package.
- Keep Sendblue and Executor in Eve's documented direct discovery files and
  import-only implementation slot, with clear provider-owned subdirectories.
- Replace mechanism-named public subpaths with intent-named subpaths.
- Replace the selected stuttering, unowned, or obsolete tagged-error names with
  capability-owned names, removing unused speculative Eve failures.
- Move completed execution plans out of `docs/exec-plans/active` and separate
  current documentation from historical specifications.
- Finish with no stale current-code imports, workspace filters, package names,
  source paths, or current-documentation claims.

## Non-goals

- Do not add a new provider, app, channel, route, tool, UI, or feature.
- Do not change the Codex subscription protocol, OAuth endpoints, scopes,
  profile schemas, refresh policy, encryption, proxy request/stream mapping,
  or error classification.
- Do not change Sendblue routing, webhook authentication, sender policy,
  replay semantics, TTLs, or outbound delivery.
- Do not change Executor endpoint policy or Eve session behavior.
- Do not rename `apps/agent`, `apps/codex-proxy`, the linked Vercel projects,
  environment variables, provider resources, secrets, deployment aliases, or
  external URLs.
- Do not migrate, rewrite, clear, or delete stored values.
- Do not publish packages, create release tags, or deploy to Preview or
  Production as part of the source rename.
- Do not preserve old package aliases or forwarding packages after every
  in-repo consumer is migrated; all packages are private workspace packages.
- Do not rewrite historical proof text solely to remove an old package name.
- Do not introduce a replacement generic domain package until a separate SPEC
  proves stable concepts with more than one real consumer.
- Do not rename tagged errors that already identify a real capability or
  provider boundary. The selected error migration below is exhaustive.
- Do not preserve old error symbols, literal tags, compatibility aliases, or
  dual-tag decoders after all in-repo consumers move atomically.

## Maintainer Flow And Success Signals

The user of this change is a maintainer or implementation agent navigating the
workspace. Starting from the root package map, they can predict the import owner
for storage, Codex, and Eve; follow intent-based public exports; and distinguish
current runbooks from historical proof without knowing which framework primitive
implements the capability. The cleanup succeeds when that path is unambiguous,
the exact three-package inventory is observable through `workspace_status`, and
the compatibility, package-graph, build, and stale-name gates below pass. There
is no end-user UI, accessibility, or browser-flow change to validate.

## Canonical Contracts And Ownership

### `@bundjil/store`

The rename preserves the existing canonical contracts and compositions:

- adapters and Layers that provide Effect v4's upstream `KeyValueStore` tag for
  ordinary persistence;
- `AtomicKeyValueStore` and `AtomicKeyValueStoreShape`;
- `AtomicKeyValueStoreCondition`, `AtomicKeyValueStoreMutation`,
  `AtomicKeyValueStoreTransaction`, and `AtomicKeyValueStoreOutcome`;
- `AtomicKeyValueStoreError`;
- coherent memory composition; and
- the explicit Upstash adapter and `UpstashOptions`.

The package continues to own provider construction, key-prefix application,
atomic provider commands, response decoding, and safe generic store errors. It
does not acquire Codex, replay, messaging, OAuth, or workflow policy.

### `@bundjil/codex`

The rename preserves existing schemas and service contracts, including:

- `CodexOAuthSubject`, profile/envelope schemas, credentials, storage keys,
  proof schemas, request schemas, and stream schemas;
- `CodexProfileStore`, `CodexOAuthProfileCommit`, `CodexOAuthRefreshLock`,
  `CodexOAuthService`, and `CodexOAuthClient`;
- `CodexOAuthProfileCipher`, `CodexSubscriptionLogin`, and trusted-local
  callback/browser/HTTP services;
- `CodexHttpClient`, `CodexResponsesFetch`, `CodexRequestMapper`,
  `CodexStreamMapper`, `CodexDirectProvider`, and `OpenAICompatibleProxy`; and
- all existing schema-backed tagged failures and sanitized error boundaries.

The public surface becomes intent-based:

```text
@bundjil/codex
@bundjil/codex/runtime
@bundjil/codex/local
@bundjil/codex/testing
@bundjil/codex/filesystem-store
```

Internal source should be grouped by owned feature where doing so improves
navigation without adding wrappers:

```text
src/
  auth/
  profiles/
  provider/
  storage/
  testing/
  index.ts
```

Do not split `@bundjil/codex` into more packages in this change. The package is
one provider integration with several cohesive internal features.

### Tagged error contract migration

The selected symbol and literal-tag cutover is exhaustive:

| Current exported contract                                    | Target contract                   | Decision                                                                                                                                                                                                                     |
| ------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CodexOAuthAuthTemporarilyUnavailable`                       | `CodexAuthTemporarilyUnavailable` | Rename the class, literal `_tag`, filename, constructors, failure unions, proxy `catchTags` key, tests, and docs together; the failure covers authorization availability beyond the OAuth exchange itself.                   |
| `CodexOAuthTemporaryFailureReason`                           | `CodexAuthTemporaryFailureReason` | Rename the associated Schema/type symbol; keep its five literal reason values unchanged.                                                                                                                                     |
| `CodexOAuthReauthenticationRequired`                         | `CodexReauthenticationRequired`   | Rename the class and literal `_tag`; the condition is the complete Codex integration's required user action and already maps to the provider-neutral public code `codex_reauthentication_required`.                          |
| `CodexOAuthTokenProviderError`                               | `CodexOAuthOperationError`        | Rename the class and literal `_tag`; constructors wrap OAuth-service credential/profile construction defects, not a token-provider transport. Keep the `CodexOAuthClientOperation`, `message`, and `cause` fields unchanged. |
| `OAuthProfileNotFound`                                       | `CodexProfileNotFound`            | Rename the class and literal `_tag`; the encrypted profile store belongs to the complete Codex integration, not only OAuth.                                                                                                  |
| `OAuthProfileSchemaError`                                    | `CodexProfileSchemaError`         | Rename the class and literal `_tag`; retain `boundary`, `message`, and `cause` fields unchanged.                                                                                                                             |
| `OAuthProfileStorageError`                                   | `CodexProfileStorageError`        | Rename the class and literal `_tag`; retain `operation`, optional `key`, `message`, and `cause` fields unchanged.                                                                                                            |
| `CodexOAuthProfileSchemaBoundary`                            | `CodexProfileSchemaBoundary`      | Rename the associated Schema/type symbol; keep its five boundary literal values unchanged.                                                                                                                                   |
| `CodexOAuthProfileStorageOperation`                          | `CodexProfileStorageOperation`    | Rename the associated Schema/type symbol; keep its seven operation literal values unchanged.                                                                                                                                 |
| `BundjilAgentSchemaError`                                    | `WorkspaceSchemaError`            | Rename the only constructed Eve error and its literal `_tag` to the owning workspace operation boundary.                                                                                                                     |
| `BundjilAgentSchemaBoundary`                                 | `WorkspaceSchemaBoundary`         | Rename the associated Schema/type symbol; keep its four boundary literal values unchanged.                                                                                                                                   |
| `BundjilAgentOperationError` and `BundjilAgentOperationName` | none                              | Remove these speculative exports: no production constructor or consumer exists. Do not replace them with an unused `WorkspaceOperationError`.                                                                                |
| `BundjilAgentGatewayConfigError`                             | none                              | Remove this speculative export: Gateway config is app-owned and the package never constructs the error.                                                                                                                      |
| `WorkspaceStatusFailure` one-purpose union                   | none                              | Remove the redundant union and use `WorkspaceSchemaError` directly in the operation signature.                                                                                                                               |
| `ExecutorConnectionConfigError`                              | `ExecutorConfigError`             | Rename the app-owned class, literal `_tag`, constructors, sanitized message prefix, Schema guards, and tests; the owning `executor` directory and config module already establish the connection boundary.                   |
| `ExecutorConnectionConfigOperation`                          | `ExecutorConfigOperation`         | Rename the associated Schema/type symbol; keep `loadEndpoint` and `loadApiKey` literals unchanged.                                                                                                                           |

Every other exported tagged error retains its current symbol, `_tag`, fields,
and meaning. Provider/capability names such as `CodexOAuthTokenMissing`,
`CodexOAuthTokenMissing`, `CodexSubscriptionAuthError`, `CodexResponsesStreamError`,
`OpenAICompatibleProxyAuthError`, `UpstashKeyValueStoreConfigError`,
`AtomicKeyValueStoreError`, app-owned `CodexProxyRouteError`, and the nine
app-owned Sendblue errors remain valid boundaries rather than naming residue.

Effect 4.0.0-beta.74 includes the literal tag in the constructed value and
encoded Schema representation. Therefore the implementation must update each
selected class and tag in one passing commit with every constructor, export,
failure union, `catchTag`/`catchTags` key, Schema guard, test, script, and current
document. Effect supplies no automatic old-tag alias or dual decoder, and this
SPEC intentionally adds neither.

Repository evidence currently finds no persisted value, provider payload, or
public HTTP body encoded from these selected error schemas. Before the cutover,
repeat that scan. If an external or persisted decoder of an old tag is found,
stop and amend this SPEC with a data/protocol migration; do not silently add a
compatibility layer. The proxy must continue translating the renamed failures
to the existing `codex_reauthentication_required` and
`codex_auth_temporarily_unavailable` response codes and existing HTTP statuses.

### `@bundjil/eve`

The package preserves `WorkspaceStatusInput`, `WorkspaceStatusSuccess`,
`getWorkspaceStatus`, and `toEveSchema`. The current `WorkspaceSummary`,
`defaultWorkspacePackages`, and `makeWorkspaceSummary` scaffold moves from
`@bundjil/core` into this boundary because its only production purpose is the
Eve `workspace_status` tool.

Broad service symbols should be narrowed to their actual responsibility:

- `BundjilAgentOperations` becomes `WorkspaceOperations`;
- the Eve schema adapter is exported from `@bundjil/eve/schema`.

The workspace-status operation uses `WorkspaceSchemaError` directly.
Delete the unused operation/Gateway errors and their supporting one-purpose
contracts rather than carrying speculative public API into `@bundjil/eve`.

The package remains independent of Sendblue, Executor, model configuration,
provider secrets, and Eve filesystem app files.

### App-owned integrations

Preserve Eve's filename-derived discovery identities and import-only slot:

```text
apps/agent/agent/channels/sendblue.ts       # discovered channel id: sendblue
apps/agent/agent/lib/sendblue/**            # import-only implementation
```

```text
apps/agent/agent/connections/executor.ts    # discovered connection id: executor
apps/agent/agent/lib/executor/**            # import-only implementation
```

Provider names remain. Nested `index.ts` authored entrypoints are prohibited:
Eve derives channel and connection identity from the direct filename. Internal
files may be renamed by responsibility inside the two provider directories, but
the source cleanup must not create shared channel packages, change the two
entrypoint paths, or change Eve discovery behavior.

## Compatibility Invariants

The implementation must capture and preserve these values before renaming,
using the existing tests as named compatibility fixtures rather than relying on
new snapshots alone:

- every physical Upstash key and prefix;
- Codex logical storage keys from `packages/codex-oauth/src/storage-keys.ts`,
  subject hashes, encrypted envelope encoding, profile revision behavior,
  refresh locks, and fenced commits;
- Sendblue replay claim/record keys and encoded records covered by
  `apps/agent/test/sendblue-replay-store.test.ts`, canonical encoded values,
  TTLs, lease behavior, duplicate suppression, and delivery transitions;
- every environment-variable name and Config decoding rule;
- Vercel project names, routes, deployment configuration, provider endpoints,
  and package inclusion rules;
- Eve tool slug `workspace_status`, Standard Schema metadata covered by
  `packages/eve-effect/test/tool-adapter.test.ts`, operation output covered by
  `apps/agent/test/workspace-status-tool.test.ts`, and authored
  channel/connection discovery;
- proxy `GET /health` and `POST /v1/chat/completions` behavior;
- local CLI command behavior and sanitized proof shape; and
- every non-selected `Schema.TaggedErrorClass` symbol, literal `_tag`, field
  schema, and encoded payload.

For the selected error migration, preserve each field schema, reason literal,
cause, retry classification, and boundary translation while changing the class
symbol and `_tag` exactly as listed. Add focused Schema encode/decode tests that
prove the target tag is emitted and accepted, the old tag is rejected, and no
compatibility alias or dual-tag union is exported. Update proxy tests to prove
the same status, stable response code, sanitized message, and no internal tag
leak after the catcher keys change.

The staging CLI's machine-readable `errorTag` field intentionally emits a
target tag when it observes a selected failure; its field name, success/block
status, redaction behavior, and all non-selected values remain unchanged. Update
the CLI Schema fixture and documentation in the same error-family spike.

Tracing span names should use the new package/feature names after the migration.
`Context.Service` identifier strings are dependency identities, not merely
telemetry: they may change only through an atomic inventory-backed migration in
which each tag, Layer provider, and consumer resolves the same new identity and
no old and new copies coexist. Neither rename may alter persisted keys, encoded
values, HTTP payloads, tool slugs, or external identifiers.

The one intentional tool-output change is exact and deterministic:

```ts
readonly packages: readonly ["@bundjil/codex", "@bundjil/eve", "@bundjil/store"]
```

The array continues to report reusable packages only, in the order above. No
other `workspace_status` field or Standard Schema metadata changes.

## Governing Effect Rules

Use Effect TS native approaches first. Prefer Data, Schema, Array, Chunk,
HashSet, HashMap, Match, Context, Layer, Config, Service, Record, Result, Exit,
Bun/Platform Command, and ManagedRuntime over plain TypeScript helpers when the
code is fallible, async, runtime-owned, collection-heavy, or crosses a package,
RPC, SSR, command, config, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as `id: string`, `slug: string`, status, or metadata
outside their canonical schema/type owner.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, `switch` branches, `instanceof` checks, unsafe casts, or
manual encode/decode adapters when an Effect Schema, Match, Result, Exit, or
owning service contract should carry the behavior.

Primary operations remain flat meaningful `Effect.gen` or named `Effect.fn`
programs. Expected failures are translated in the outer `.pipe(...)` with
`catchTag`, `catchTags`, or `mapError`. A source move must not be used to hide
new helper layers, duplicated DTOs, broad barrel exports, or runtime execution
inside package operations.

## Call Graphs

Production Codex path after migration:

```text
apps/agent model-provider selection
  -> apps/codex-proxy POST /v1/chat/completions
    -> @bundjil/codex OpenAICompatibleProxy
      -> CodexDirectProvider
        -> CodexOAuthService
          -> CodexProfileStore + CodexOAuthProfileCommit + CodexOAuthRefreshLock
            -> @bundjil/store KeyValueStore + AtomicKeyValueStore
              -> @bundjil/store/upstash
        -> CodexHttpClient
          -> Codex Responses endpoint

selected Codex failure
  -> target `_tag`
    -> apps/codex-proxy `Effect.catchTags`
      -> unchanged HTTP status + stable public error code
```

Production Sendblue path after migration:

```text
apps/agent/agent/channels/sendblue.ts
  -> SendblueChannelRuntimeLive
    -> SendblueReplayStore
      -> @bundjil/store/upstash
    -> Eve session send
    -> SendblueClient
      -> Sendblue API
```

Eve tool path after migration:

```text
apps/agent/agent/tools/workspace_status.ts
  -> @bundjil/eve/schema toEveSchema
  -> @bundjil/eve getWorkspaceStatus
    -> WorkspaceOperationsLive
```

Tests:

```text
store contract tests
  -> @bundjil/store/memory
  -> mocked @bundjil/store/upstash provider

Codex tests
  -> @bundjil/codex/testing
    -> @bundjil/store/memory
  -> selected error Schema encode/decode contract
    -> target tag accepted and encoded
    -> old tag rejected

proxy handler tests
  -> renamed target errors
    -> unchanged HTTP status/code/message

agent workspace-status tests
  -> @bundjil/eve WorkspaceOperationsMemory

Eve package tests
  -> WorkspaceSchemaError encode/decode contract
    -> target tag accepted and encoded
    -> old tag rejected

Sendblue tests
  -> app-owned Sendblue memory/test Layers
    -> @bundjil/store/memory
```

CLI and local proxy paths:

```text
bun run --filter @bundjil/codex login:subscription
  -> @bundjil/codex/local
    -> CodexSubscriptionLogin
      -> profile storage through @bundjil/store

bun run --filter @bundjil/codex-proxy smoke-test
  -> apps/codex-proxy mock runtime
    -> @bundjil/codex/testing
```

## Documentation Migration

Current documentation must be updated atomically with source names:

- `AGENTS.md`, `README.md`, `ARCHITECTURE.md`, and `docs/README.md`;
- all files in `docs/architecture/`;
- package and app READMEs;
- the repository-owned `prd-writer`, `prd-implementer`,
  `effect-client-wrapper`, and `create-package` skills;
- current runbooks, commands, package filters, source paths, and call graphs;
- `package.json`, `turbo.json`, `knip.json`, Vercel packaging configuration,
  test assertions, and `bun.lock` references; and
- the `workspace_status` package inventory.

### Durable Naming Governance

The exhaustive rename table in this SPEC is migration evidence, not a reusable
lint or skill policy. Carry only the general rule into canonical repository
surfaces:

| Surface                                                                       | Disposition                    | Required change and proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture/effect-patterns.md`                                        | Change required                | State that an exported `Schema.TaggedErrorClass` declaration name, self-type argument, and literal `_tag` use the same capability-owned error name. Define an error rename as one atomic change across those names, constructors, unions, catchers, guards, encoded Schema tests, boundary mappings, and current docs. Reject speculative exported error types with no constructor or consumer.                                                                                                                                                                                               |
| `docs/architecture/repo-structure.md`                                         | Change required                | Define capability ownership as the authority for package, public-export, service, and error names. Retain provider qualifiers only where the owner genuinely wraps that provider, and do not use Effect or another implementation mechanism as the reusable boundary name.                                                                                                                                                                                                                                                                                                                    |
| `docs/architecture/testing-and-quality.md`                                    | Change required                | Require the tagged-error lint rule, exact encode/decode and old-tag rejection tests for intentional tag migrations, stable public-boundary mapping tests, non-selected-tag fixtures, and scoped stale-name scans that distinguish current source from historical evidence.                                                                                                                                                                                                                                                                                                                    |
| `oxlint.config.ts`, `lint/oxlint-plugin.ts`, and `lint/oxlint-plugin.test.ts` | Change required                | Add and enable `bundjil/tagged-error-name` for TypeScript source under `apps/**` and `packages/**`. It must report a `Schema.TaggedErrorClass` whose class declaration, self-type argument, and literal tag do not agree. Unit cases must prove one valid declaration and mismatched declaration/self-type/tag failures. `bun run check` must execute the rule, and a root `test:lint` script must run its tests as part of `verification`. The rule must not attempt to judge subjective capability vocabulary or ban old strings in historical specs and negative compatibility assertions. |
| `.agents/skills/prd-writer/SKILL.md`                                          | Change required                | Require any SPEC that renames a tagged error to name the compatibility decision and exhaustive contract migration, including exact encoded-tag tests and public-boundary behavior. Link to the canonical architecture rules rather than copying this rename table.                                                                                                                                                                                                                                                                                                                            |
| `.agents/skills/prd-implementer/SKILL.md`                                     | Change required                | Require tagged-error tasks to land declaration, self type, literal tag, consumers, tests, mappings, and docs atomically; reject an unplanned alias, dual decoder, or partial catcher migration. Link to the canonical architecture rules rather than copying this rename table.                                                                                                                                                                                                                                                                                                               |
| `.agents/skills/effect-client-wrapper/SKILL.md`                               | Change required                | Route tagged-error examples to the canonical Effect error rules and state the declaration/tag equality invariant. Keep provider-specific names only where the wrapper genuinely owns that provider boundary.                                                                                                                                                                                                                                                                                                                                                                                  |
| `.agents/skills/create-package/SKILL.md`                                      | Change required                | Remove the unreferenced copied skill. It targets the site repository, `@packages/<name>`, `packages/core`, and mechanism-named layer files, so retaining it could recreate precisely the generic package structure this cleanup removes. A future Bundjil package-scaffolding skill requires its own evidence-backed design.                                                                                                                                                                                                                                                                  |
| Other repository-owned skills and `AGENTS.md`                                 | N/A beyond pointers            | `AGENTS.md` already routes Effect and verification work to the canonical architecture docs. Unrelated skills do not author these boundaries and must not duplicate the rule.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| User-global `prd-review` skill                                                | N/A for this repository change | It already requires explicit documentation, lint/static-rule, skill, and adjacent-artifact impact classification. Keep Bundjil-specific rules and the exhaustive rename table in this repository.                                                                                                                                                                                                                                                                                                                                                                                             |

General naming quality beyond the mechanical tagged-error equality invariant is
an architecture and review decision, not a lint rule. Migration-specific old
name scans remain explicit task verification because historical specifications
and focused old-tag rejection tests intentionally retain the old literals.

Configuration reconciliation is explicit rather than scan-only:

- both `exports` and `publishConfig.exports` in each renamed package manifest
  must expose the same target subpaths;
- root `tsconfig.json` references must be exactly the five surviving projects:
  `packages/store`, `packages/codex`, `packages/eve`, `apps/codex-proxy`, and
  `apps/agent`;
- removing `effect-start` also removes the now-unused root `tanstack` dependency
  catalog and its lockfile closure;
- `apps/codex-proxy` drops its unused direct store dependency and the matching
  Knip ignore; and
- `apps/codex-proxy/vercel.json` builds `@bundjil/store`, then
  `@bundjil/codex`, then `@bundjil/codex-proxy`, with packaging assertions
  updated to prove that exact dependency closure.

Because package imports, public exports, and selected error tags change, add one
minor changeset covering the three target private `0.x` packages and describing
the removed names. Do not publish or tag; `bun run changeset:status` is the
repository-local validation boundary.

Create `docs/exec-plans/completed/` and move every execution plan whose status
is complete or superseded out of `docs/exec-plans/active/`. Historical product
specs and completed task ledgers remain in place, but `docs/README.md` must list
them under a historical section rather than as current starting points.

The completed `effect-persistence` SPEC and ledger remain historical evidence
under their existing filenames. They must gain a short notice pointing to this
SPEC and the new `@bundjil/store` name; their accepted evidence must not be
rewritten as though it originally used the new name.

## Delivery And Rollback

Implement the ledger as progressive, reviewable commits: compatibility baseline
and removal, one package identity at a time, optional internal Codex organization,
Eve/core reconciliation, app-owned filename cleanup, then documentation and final
verification. Do not mix runtime-policy changes into path-only commits.

Each stage is rolled back by reverting its whole commit and restoring its
pre-stage lockfile, manifests, imports, and generated discovery artifacts
together; do not create temporary forwarding packages or mixed old/new Context
identities. The selected error migration rolls back as one unit: class symbols,
literal tags, unions, catchers, tests, and docs return together. If a
compatibility fixture, Eve identity, package closure, encoded-error scan, or
fail-closed config check changes unexpectedly, stop at that stage and revert it
before proceeding. No provider, deployment, or stored-data rollback exists
because this SPEC prohibits those mutations.

## Alternatives Considered

- `@bundjil/persistence` is accurate but narrower than the package's ordinary
  and atomic store contracts/adapters; `@bundjil/store` is shorter and matches
  consumer intent.
- Splitting Codex auth, profiles, provider, and proxy contracts into separate
  packages would increase boundary and release overhead before a second consumer
  proves that split.
- Nested Eve `index.ts` entrypoints would visually co-locate integrations but
  conflict with filename-derived discovery and are therefore rejected.
- Forwarding packages or old export aliases would reduce short-term import churn
  but leave two canonical names for private in-repo consumers and are rejected.
- Renaming TypeScript error symbols while preserving old `_tag` literals would
  leave runtime/encoded contracts with the naming residue this cleanup is meant
  to remove. Because the selected errors are not persisted or returned directly
  over public HTTP, the atomic hard cutover is preferred.
- Dual-tag decoders would be necessary for persisted or independently deployed
  consumers, but no such boundary exists in the current checkout. Adding them
  speculatively would create compatibility code with no owner or removal date.

## Verification

Each implementation spike must run its focused package/app tests and builds.
After manifest and workspace moves, run `bun install` once to regenerate
`bun.lock`; do not hand-edit the lockfile. The final frozen gate uses non-secret
synthetic Executor build configuration so Eve discovery can load its fail-closed
connection module without contacting a provider:

```bash
export BUNDJIL_EXECUTOR_MCP_URL='https://executor.sh/mcp/toolkits/bundjil-ci?elicitation_mode=model'
export BUNDJIL_EXECUTOR_API_KEY='executor-ci-synthetic-key'
bun install --frozen-lockfile
bun run test:lint
bun run check
bun run knip
bun run check-types
bun run test
bun run build
bun run verification
bun run changeset:status
git diff --check
```

The same two non-secret values must be present in the CI build/verification job.
They are parseable build inputs only: tests and builds must still make no live
Executor or other provider request, and Production remains fail-closed on real
deployment configuration.

Additional acceptance scans must prove:

- no current code, manifest, config, test, command, or current architecture
  document references `@bundjil/effect-persistence`, `@bundjil/codex-oauth`,
  `@bundjil/eve-effect`, `@bundjil/effect-start`, or `@bundjil/core`;
- no current source path contains `packages/effect-persistence`,
  `packages/codex-oauth`, `packages/eve-effect`, `packages/effect-start`,
  or `packages/core`;
- Eve discovery still resolves `sendblue` from `channels/sendblue.ts` and
  `executor` from `connections/executor.ts`, with no nested authored
  `channels/*/index.ts` or `connections/*/index.ts` replacement;
- old names occur only in this canonical migration table/task ledger,
  explicitly marked historical specs, completed execution plans, or focused
  compatibility assertions;
- current source and current operational/architecture docs outside this SPEC
  and its ledger contain none of
  `CodexOAuthAuthTemporarilyUnavailable`, `OAuthProfileNotFound`,
  `OAuthProfileSchemaError`, `OAuthProfileStorageError`,
  `CodexOAuthReauthenticationRequired`, `CodexOAuthTokenProviderError`,
  `CodexOAuthTemporaryFailureReason`, `CodexOAuthProfileSchemaBoundary`,
  `CodexOAuthProfileStorageOperation`, `BundjilAgentSchemaError`,
  `BundjilAgentSchemaBoundary`, `BundjilAgentOperationError`,
  `BundjilAgentOperationName`, `BundjilAgentGatewayConfigError`,
  `WorkspaceStatusFailure`, `ExecutorConnectionConfigError`, or
  `ExecutorConnectionConfigOperation`; focused compatibility assertions may
  contain old literal strings only to prove rejection;
- target error exports, literal tags, unions, constructors, catchers, and Schema
  encode/decode fixtures agree exactly, while all non-selected tags remain
  unchanged;
- direct `@upstash/redis` imports remain confined to
  `@bundjil/store/upstash` implementation files;
- `bun pm ls` and the lockfile expose only the target workspace package names;
- Vercel package inclusion tests still include the transitive runtime source;
- proxy mock smoke proof and agent build succeed without provider calls; and
- no storage key, environment-variable, route, tool slug, provider URL,
  deployment project, or secret name changed.

No new runtime dependency, network call, hot-path work, or bundle payload is
permitted. Package removal should reduce or preserve the install/build closure;
any increase requires an explicit explanation and SPEC amendment.

No Browser evidence is required because this SPEC changes no visible route,
component, or browser state. No live provider or deployment proof is required
because provider and deployment mutation are prohibited; if implementation
changes runtime behavior or deploys, stop and amend this SPEC before proceeding.

## Risks And Tradeoffs

- Large path-only diffs can hide accidental logic changes. Keep commits
  progressive, use `git diff --color-moved`, and compare focused behavior after
  each spike.
- Renaming `codex-oauth` touches the largest package and many documentation
  references. Package identity and public subpaths should migrate before
  optional internal folder organization so failures stay attributable.
- Removing `core` and `effect-start` reduces speculative reuse but may require
  a future package when real multi-consumer domain or TanStack behavior exists.
  That future boundary should be created by a separate SPEC.
- Historical documents will contain old names by design. Acceptance scans must
  distinguish provenance from stale current guidance rather than blindly
  replacing every occurrence.
- Renaming a tracing span changes a trace label. Renaming a `Context.Service`
  identifier changes dependency identity and is safe only as an atomic tag,
  Layer, and consumer migration. Persisted identifiers and external telemetry
  correlation fields must not be derived from either string.
- Renaming a selected `_tag` changes Effect dispatch and Schema encoding. A
  partial commit can bypass a catcher or reject an encoded value, so each error
  migration must land with all constructors, unions, catchers, guards, scripts,
  tests, and app mappings updated together.

## Completion Criteria

- The workspace contains only `@bundjil/store`, `@bundjil/codex`, and
  `@bundjil/eve` as reusable packages.
- `@bundjil/agent` and `@bundjil/codex-proxy` keep their existing names and
  runtime behavior.
- Every in-repo consumer uses the new package names and intent-based exports.
- The selected tagged errors expose only the target class and literal names;
  unused Eve failures are removed, old tags are rejected, and proxy HTTP
  responses remain stable.
- The unused `effect-start` and generic `core` packages are removed.
- Sendblue and Executor retain their direct Eve discovery files and clearly
  owned import-only `agent/lib` implementations, and Eve discovery still passes.
- Compatibility tests prove storage, auth, replay, proxy, tool, and packaging
  invariants.
- Completed plans are no longer stored under `docs/exec-plans/active`.
- Current documentation and commands use only the target names; historical
  evidence is clearly labeled.
- Every task records at least three implementation-improvement audit passes:
  ownership/call graph, Effect implementation quality/helper admission, and
  verification/evidence coverage, with additional passes for unresolved gaps.
- `bun run verification`, `bun run build`, stale-name scans, and
  `git diff --check` pass from the repository root.
