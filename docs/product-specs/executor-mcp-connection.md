# Executor MCP Connection

- Status: Draft
- Owner: `apps/agent`
- Last reviewed: 2026-07-14

## Decision

Connect the Bundjil Eve agent to Executor Cloud through Eve's native
`defineMcpClientConnection` boundary. Do not add an Executor SDK, a custom MCP
client, an MCP proxy, or a new workspace package.

The authored connection lives at
`apps/agent/agent/connections/executor.ts`. It obtains its toolkit-scoped URL
and bearer credential from an app-owned Effect Config module, exposes only the
remote `skills`, `execute`, and `resume` MCP tools through Eve's allowlist, and
uses Executor's browser-mediated approval mode. Executor remains responsible
for its dynamic tool schemas, sandbox execution, downstream credential
injection, connection scoping, policy evaluation, approval state, and
execution resumption.

Preview and Production use separate Executor toolkits and separate API keys.
Each toolkit is implicit-deny and admits only explicitly selected downstream
connections. Read-only operations may be approved automatically, mutations
require a human decision in Executor's browser UI, and destructive,
administrative, credential, billing, policy-management, and irreversible
operations are blocked for the first production slice.

The broad personal Executor MCP endpoint and existing API key may be used for
read-only discovery and connectivity proof only. They are not accepted as the
Bundjil Production connection.

## Why This Shape

Eve already owns the remote MCP lifecycle:

- connection discovery from `agent/connections/*.ts`;
- Streamable HTTP and SSE transport;
- bearer-token resolution through `auth.getToken`;
- remote tool discovery through `connection_search`;
- client-side `tools.allow` filtering; and
- session-aware connection execution.

Executor already owns the difficult provider boundary:

- a catalog of integrations and current remote schemas;
- sandboxed execution through the `execute` operation;
- host-side downstream credential injection;
- toolkit-scoped connection patterns with implicit deny;
- `approve`, `require_approval`, and `block` policy actions; and
- durable paused execution plus browser-mediated resume.

Duplicating either side in Bundjil would create stale DTOs, a second policy
engine, a second credential boundary, and unnecessary helper/service sprawl.

## Current Research Findings

The decisions in this SPEC are based on the current ignored reference clones,
official Executor documentation, a read-only live MCP initialization probe,
and the already committed Eve architecture:

- Eve's MCP connection contract accepts a static URL, `auth.getToken`, one of
  `tools.allow` or `tools.block`, and an optional connection-level approval
  function.
- Eve calls remote tools through `connection_search`; Bundjil does not need to
  reproduce the remote tool schemas.
- Executor's hosted MCP surface currently registers `skills`, `execute`, and
  `resume`.
- Executor supports dedicated toolkit MCP URLs. A toolkit selects connection
  patterns, applies ordered policies, and blocks tools outside its selected
  connections.
- Executor's current source defaults an absent or unknown
  `elicitation_mode` to `model`.
- In `elicitation_mode=model`, the model can submit an `accept`, `decline`, or
  `cancel` response itself. That mode is forbidden for Bundjil.
- In `elicitation_mode=browser`, a paused execution returns an approval URL;
  the signed-in human decides in Executor's UI and `resume` accepts only the
  execution id. This is the required mode.
- Executor PR
  [#1317](https://github.com/UsefulSoftwareCo/executor/pull/1317) fixed a
  hosted-cloud failure with the exact unavailable-page symptom by routing
  approval lookups through the name-addressed MCP session Durable Object
  instead of treating the session id as a Durable Object id string. Live
  Preview acceptance must therefore prove the rendered hosted page, not infer
  browser approval from a `user_approval_required` tool result or from source
  alone.
- Executor resolves downstream credentials on its host. Bundjil, Eve, the
  model, conversation history, and proof artifacts must not receive those
  credentials.

Where current Executor source, official docs, and generated research disagree,
current source plus a direct read-only live probe are authoritative. The
implementation task must revalidate the installed/current contracts before
provisioning because Executor and Eve are external, evolving systems.

## Goals

- Let the Eve agent discover and invoke a deliberately small set of connected
  services through Executor.
- Keep the Executor API key out of model context, conversation history,
  committed files, build logs, runtime logs, traces, and proof artifacts.
- Preserve Effect Config, Schema, Redacted, tagged-error, Layer, and linear
  control-flow rules at the app-owned boundary.
- Ensure the model cannot approve its own gated Executor operation.
- Isolate Preview and Production credentials, toolkits, policies, and evidence.
- Prove one read-only execution and one browser-gated pause/decision/resume
  sequence through the deployed Eve agent before Production promotion.
- Make rollback possible without changing Executor or Eve source under
  incident pressure.
- Document how operators add an integration or change a policy without
  broadening the agent's authority accidentally.

## Non-goals

- Self-hosting Executor.
- Running Executor over local stdio in the deployed agent.
- Replacing Eve's MCP client or adding a Bundjil MCP proxy.
- Adding the Executor SDK to Bundjil runtime code.
- Mirroring Executor integration schemas or downstream provider DTOs.
- Exposing the broad personal Executor root catalog in Production.
- Letting the model edit Executor toolkits, policies, API keys, credentials, or
  connected accounts.
- User-scoped Executor linking or multi-user account selection.
- Migrating every existing personal Executor integration into Bundjil.
- Adding a Bundjil operator UI. Any later UI needs a separate SPEC following
  `docs/architecture/frontend-composition.md`.
- Treating Eve's coarse connection-level approval as a replacement for
  Executor's per-downstream-tool policies.
- Accepting `elicitation_mode=model`, `allow_model_resume=true`, a missing
  elicitation mode, or an unknown mode.

## Security Invariants

1. The URL must be an HTTPS Executor toolkit endpoint, not a root MCP endpoint,
   and must contain exactly `elicitation_mode=browser`.
2. Eve may discover only `skills`, `execute`, and `resume` from this
   connection. Future remote MCP additions remain hidden until reviewed.
3. Preview and Production have distinct toolkit slugs, API keys, Vercel
   variables, and acceptance evidence.
4. Toolkit connection patterns are implicit-deny. An operation is unavailable
   unless both its connection and policy admit it.
5. `approve` is limited to explicitly reviewed read-only operations.
6. Create, update, send, publish, or other state-changing operations require
   browser approval unless they are blocked.
7. Delete, purchase, billing, credential, account, infrastructure,
   policy/toolkit administration, and irreversible operations are blocked in
   the first Production slice.
8. The model receives an execution id and approval URL, but never an approval
   action field. It can call `resume(executionId)` only after the human decision
   is recorded by Executor.
9. A Sendblue reply may carry the approval URL to the allowlisted owner, but a
   Sendblue message is not itself an approval decision.
10. The Executor API key is unwrapped from `Redacted` only inside Eve's
    `auth.getToken` adapter and is never added to an Effect error payload.
11. Downstream provider credentials remain in Executor. Bundjil stores only its
    dedicated Executor bearer credential and non-secret/sanitized identifiers.
12. Production enablement follows accepted Preview proof. Rollback uses an
    accepted immutable Vercel deployment and immediate key revocation/toolkit
    disablement when credential or policy compromise is suspected.

## Threat Model

| Threat                                                   | Required control                                                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prompt injection asks for a destructive action           | Toolkit policy blocks it or requires a browser decision; model text cannot change policy.                                                              |
| Model attempts to approve its own action                 | URL pins browser mode; tests prove `resume` has no action/content fields.                                                                              |
| Executor adds a new MCP orchestration tool               | Eve's exact `tools.allow` list hides it until a reviewed change.                                                                                       |
| A selected integration later adds operations             | Toolkit implicit deny and explicit operation policy inventory prevent automatic authority expansion.                                                   |
| Broad personal key or endpoint is copied into Production | Provisioning checks reject root endpoints, shared keys, and shared toolkit identities.                                                                 |
| Build or runtime logs expose the bearer                  | Runtime-only `auth.getToken`, Redacted config, compiled-output scans, log scans, and synthetic-marker tests.                                           |
| Approval URL reaches an untrusted person                 | Only authenticated Eve/API and allowlisted Sendblue owner routes are accepted; URL is not logged or retained as evidence.                              |
| Preview policy changes affect Production                 | Separate toolkits and keys; promotion copies reviewed policy intent, not mutable identity.                                                             |
| Executor is unavailable or returns malformed MCP data    | Eve connection fails closed; no alternate direct-provider path or automatic fallback.                                                                  |
| Key is compromised                                       | Revoke the environment-specific Executor key, disable its toolkit, restore the previous immutable Vercel deployment, and verify no further executions. |

## Ownership And File Shape

Expected app-owned shape:

```text
apps/agent/
  agent/
    connections/
      executor.ts                  thin Eve MCP definition and adapter edge
    lib/
      executor/
        config.ts                  Effect Config, endpoint policy, Redacted key
        errors.ts                  config/adapter tagged errors if needed
        schemas.ts                 Bundjil-owned sanitized config/proof contracts
  test/
    executor-config.test.ts
    executor-connection.test.ts
```

This is a maximum expected shape, not a requirement to create every file.
Colocate contracts when that is clearer. Do not add `utils.ts`, `helpers.ts`,
`mappers.ts`, `common.ts`, a pass-through service, a one-operation Context tag,
or an app-local MCP client. A retained abstraction must own configuration,
security policy, serialization, a framework adapter, or a policy with direct
tests.

The boundary stays in `apps/agent` because it is an Eve-specific, app-scoped
connection. It does not move into `@bundjil/core` or `@bundjil/eve-effect`
unless another app proves a stable shared contract.

### Import And Dependency Rules

- Import Eve only through its installed public `eve/connections` and related
  documented public exports. Do not deep-import Eve compiler/runtime internals.
- `.local/references/eve` and `.local/references/executor` are read-only design
  references, never runtime/build dependencies or import targets.
- Do not import from another app, move app config into a shared package, or add
  an `@bundjil/eve-effect` wrapper for this single authored connection.
- Use direct local module imports. Do not create an index barrel solely to
  re-export executor connection internals.
- No new production dependency is expected. Any dependency addition must own a
  capability unavailable from Eve, Effect, Bun, or the existing test stack and
  requires an explicit SPEC/task update before installation.
- Knip must confirm there are no dead files/exports/dependencies, and package
  metadata/lockfile changes must be absent unless the accepted task proves
  they are necessary.

## Canonical Contracts

Bundjil owns only the contracts it must validate or emit:

- `ExecutorMcpEndpoint`: HTTPS, Executor host, toolkit path, browser elicitation
  mode, and no userinfo or fragment;
- `ExecutorConnectionConfigOperation`: exactly `loadEndpoint` or `loadApiKey`
  so sanitized configuration failures retain operation identity;
- `ExecutorConnectionEnvironment`: `preview` or `production` when a proof or
  operator command needs explicit target identity;
- `ExecutorMcpToolName`: exactly `skills`, `execute`, or `resume`;
- `ExecutorToolkitPolicyAction`: the sanitized values `approve`,
  `require_approval`, and `block` when documenting or validating policy
  inventory;
- sanitized proof schemas containing booleans, counts, environment, deployment
  id, toolkit identity digest/category, operation category, HTTP status family,
  and approval outcome only.

Types are derived with `typeof SchemaName.Type`. Do not define TypeScript
interfaces mirroring Executor's `skills`, `execute`, `resume`, integration,
execution, or provider payloads. Those schemas are remote MCP contracts owned
by Executor and consumed by Eve.

Expected app-owned tagged errors are limited to failures Bundjil actually
handles, such as `ExecutorConnectionConfigError` and a sanitized
`ExecutorConnectionProofError`. Error payloads may include operation and safe
reason. They must not include keys, authorization headers, full protected URLs,
approval URLs, raw MCP payloads, generated execution code, downstream
responses, or provider data.

## Required Effect Code Shape

The exact installed Effect v4 APIs must be confirmed during implementation,
but the ownership and execution shape is mandatory:

```ts
// agent/lib/executor/config.ts
import { Config, ConfigProvider, Effect, Schema } from "effect";

export const ExecutorConnectionConfigOperation = Schema.Literals([
  "loadEndpoint",
  "loadApiKey",
]);

export class ExecutorConnectionConfigError extends Schema.TaggedErrorClass<ExecutorConnectionConfigError>()(
  "ExecutorConnectionConfigError",
  {
    operation: ExecutorConnectionConfigOperation,
    reason: Schema.NonEmptyString,
  }
) {}

export const ExecutorMcpEndpoint = Schema.URL.pipe(
  Schema.check(
    Schema.makeFilter((endpoint) => {
      if (endpoint.protocol !== "https:") {
        return "Executor MCP endpoint must use HTTPS.";
      }
      if (endpoint.hostname !== "executor.sh") {
        return "Executor MCP endpoint must use the approved Executor host.";
      }
      if (endpoint.port) {
        return "Executor MCP endpoint must not override the HTTPS port.";
      }
      if (
        !/^\/(?:[a-z0-9-]+\/)?mcp\/toolkits\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
          endpoint.pathname
        )
      ) {
        return "Executor MCP endpoint must identify a dedicated toolkit.";
      }
      if (endpoint.username || endpoint.password || endpoint.hash) {
        return "Executor MCP endpoint must not contain userinfo or a fragment.";
      }
      const modes = endpoint.searchParams.getAll("elicitation_mode");
      if (modes.length !== 1 || modes[0] !== "browser") {
        return "Executor MCP endpoint must select browser elicitation exactly once.";
      }
      if (endpoint.searchParams.has("allow_model_resume")) {
        return "Executor MCP endpoint must not enable legacy model resume.";
      }
      if (
        [...endpoint.searchParams.keys()].some(
          (name) => name !== "elicitation_mode"
        )
      ) {
        return "Executor MCP endpoint contains an unsupported query parameter.";
      }
    })
  )
);

const endpointConfig = Config.schema(
  ExecutorMcpEndpoint,
  "BUNDJIL_EXECUTOR_MCP_URL"
);
const apiKeyConfig = Config.schema(
  Schema.Redacted(Schema.NonEmptyString),
  "BUNDJIL_EXECUTOR_API_KEY"
);

export const loadExecutorEndpoint = Effect.fn("ExecutorConfig.loadEndpoint")(
  function* () {
    return yield* endpointConfig;
  },
  (effect) =>
    effect.pipe(
      Effect.mapError(
        () =>
          new ExecutorConnectionConfigError({
            operation: "loadEndpoint",
            reason: "Executor MCP endpoint configuration is invalid.",
          })
      )
    )
);

export const loadExecutorApiKey = Effect.fn("ExecutorConfig.loadApiKey")(
  function* () {
    return yield* apiKeyConfig;
  },
  (effect) =>
    effect.pipe(
      Effect.mapError(
        () =>
          new ExecutorConnectionConfigError({
            operation: "loadApiKey",
            reason: "Executor MCP credential configuration is invalid.",
          })
      )
    )
);

export const ExecutorConfigProviderLayer = ConfigProvider.layer(
  ConfigProvider.fromEnv()
);
```

```ts
// agent/connections/executor.ts
import { Effect, Redacted } from "effect";
import { defineMcpClientConnection } from "eve/connections";

import {
  ExecutorConfigProviderLayer,
  loadExecutorApiKey,
  loadExecutorEndpoint,
} from "../lib/executor/config.js";

const endpoint = Effect.runSync(
  loadExecutorEndpoint().pipe(Effect.provide(ExecutorConfigProviderLayer))
);

export default defineMcpClientConnection({
  url: endpoint.toString(),
  description:
    "Executor: use selected connected services under explicit read, approval, and block policies.",
  auth: {
    principalType: "app",
    getToken: async () => {
      const key = await Effect.runPromise(
        loadExecutorApiKey().pipe(Effect.provide(ExecutorConfigProviderLayer))
      );
      return { token: Redacted.value(key) };
    },
  },
  tools: { allow: ["skills", "execute", "resume"] },
});
```

The exact toolkit-path predicate must be reconciled with the live hosted route
during the contract-freeze task before this illustrative code is committed;
the invariant is a dedicated toolkit, never the account/root MCP endpoint.
The connection module is an executable framework edge, so `Effect.runSync`
for the non-secret compile-time URL and `Effect.runPromise` inside the runtime
auth callback are permitted. Domain/config operations still return Effects.
The API key must not be read or unwrapped while `eve build` imports and
normalizes the connection. The implementation must prove that the compiled
output contains no secret marker.

Do not add a nominal `ExecutorService` around `defineMcpClientConnection`.
There is no app-owned multi-operation provider API to inject: Eve is the MCP
adapter and Executor is the remote service.

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
mappers, transformers, switch/case branches, `instanceof` checks, unsafe
casts, or manual encode/decode adapters when an Effect Schema, Match, Result,
Exit, or owning service contract should carry the behavior.

### Linear Effect Control Flow

Every primary operation must expose its business sequence directly in one
named `Effect.fn` or flat `Effect.gen`:

```text
decode or load boundary input
  -> acquire required services/config
  -> apply policy decisions in sequence
  -> call the framework/provider boundary
  -> decode/encode the crossing result when Bundjil owns that contract
  -> return the success value
  -> translate expected tagged failures in Effect.fn transforms or outer .pipe(...)
  -> name the Effect.fn span or add Effect.withSpan to an Effect.gen value
```

Do not bury the success path in nested generators, callback pyramids, Promise
chains, helper chains, or side effects hidden inside `map`. A nested Effect is
admitted only when it owns a scoped resource or is a separately reusable named
program. Expected branching uses Schema-decoded discriminants, `Match`,
`Option`, `Result`, or tagged-error operators rather than `switch`,
`instanceof`, raw `_tag` string checks, broad `catch`, or boolean flag piles.

`Effect.runSync`, `Effect.runPromise`, `ManagedRuntime.runPromise`, and Promise
conversion belong only at executable framework, CLI, test, or adapter edges.
No domain/config operation starts its own runtime. Third-party Promise calls,
if this scope unexpectedly needs one, use `Effect.tryPromise` with an explicit
sanitized error translation; the connection must not add a second HTTP/MCP
client merely to satisfy that pattern.

In installed Effect v4, `Effect.fn("Operation.name")` returns a function and
creates the named tracing span when that function is called. Error transforms
may be supplied after the generator body and should use an explicit
`effect.pipe(...)`, as in the config example. Do not `.pipe(...)` the function
itself, forget to invoke a zero-argument operation, or add a duplicate
`Effect.withSpan` around an already named `Effect.fn`. Plain `Effect.gen`
values put `mapError`/`catchTag(s)` and `withSpan` in their outer `.pipe(...)`.

Do not use `Effect.catchAll`, `Effect.orDie`, defects, or broad error collapse
to erase an expected typed failure. `Effect.tap` is for observability or a
genuinely effectful side action, not hidden business branching. Do not add
`Effect.runFork`, unscoped fibers, daemon work, hidden queues, or unbounded
parallelism. Any introduced concurrency must be bounded, scoped, interruption-
safe, and justified by independent idempotent work.

Bundjil adds no retry around Executor `execute` or `resume`: either can repeat
external effects or consume approval state. Transport retry remains owned by
Eve/Executor and must be verified against their current contract. A future
retry policy requires an explicit idempotency contract, bounded schedule,
typed exhausted-retry error, interruption proof, and a SPEC/task update.

Layer and service composition must be proportional. Add a `Context.Service`
and Live/Memory Layers only when Bundjil owns multiple meaningful operations or
a replaceable resource/provider boundary. Do not wrap Eve's one connection
definition or a single Config effect in a pass-through service. Tests inject
`ConfigProvider` at the local task-2 edge. Remote MCP behavior is exercised
only by the deployed Preview proof.

Composable here means each app-owned operation remains an Effect value until a
real Eve/test/CLI edge executes it, dependencies are supplied once at that
edge, and Schema-owned values remain in their decoded types until the adapter
requires a wire representation. Do not convert the endpoint to a string in the
Config operation, unwrap the credential before `auth.getToken`, or provide the
same Layer repeatedly inside domain control flow.

### Helper Admission And Module Budget

Helper sprawl is forbidden and is reviewed after every implementation task,
not deferred to final cleanup. Each task must record a helper-admission table
covering every new helper, mapper, wrapper, hook, service, layer, factory, and
module:

| Candidate        | Owner/reason                                             | Concrete call sites | Direct test | Decision                |
| ---------------- | -------------------------------------------------------- | ------------------- | ----------- | ----------------------- |
| `<name or none>` | boundary, reusable domain concept, or non-trivial policy | count and paths     | yes/no      | retain or inline/remove |

Zero new helpers is a valid and preferred result. Retain a candidate only when
it has multiple real call sites, owns a provider/config/security/
serialization/resource boundary, or isolates a materially complex policy that
has a direct test. Single-use code stays inline unless extracting the policy
makes the primary `Effect.gen` materially easier to read and the policy is
tested independently.

The following are not acceptable abstractions:

- one-line aliases, property readers, pass-through services, and generic
  `make*` factories;
- `utils.ts`, `helpers.ts`, `common.ts`, `shared.ts`, or index barrels created
  only to shorten imports;
- local DTO converters, schema-to-schema object copying, and manual unknown
  readers;
- wrappers around one `Effect.map`, `Effect.flatMap`, Config read, Eve call, or
  MCP call;
- speculative abstractions for future integrations; and
- React feature wrappers or hooks that only shorten JSX or move a command away
  from the leaf that owns its control.

### Lint And Static Analysis Contract

The root Ultracite/Oxlint configuration, TypeScript strict mode, Effect
language service, and Knip are acceptance authorities:

- `bun run check` must finish with zero warnings and zero errors;
- `bun run knip` must report no new dead files, exports, dependencies, or
  unresolved imports;
- focused and root typechecks must pass without weakening compiler options;
- every changed TypeScript file must be reviewed for Effect language-service
  hints, not only compiler failures; and
- no lint, formatter, Knip, Turbo, TypeScript, or test ignore list may be
  broadened to land this work.

Do not add `@ts-ignore`, structural double casts, non-null assertions, `any`,
blanket `eslint-disable`/`oxlint-disable`/formatter ignores, or broad test
exclusions. A genuinely necessary narrow suppression requires an adjacent
reason, direct test evidence, and explicit parent-audit acceptance; it cannot
hide an Effect, Promise, Schema, auth, accessibility, or ownership failure.
Literal inference through `as const` is not a structural cast, but should still
be unnecessary when an owning Schema supplies the literal contract.

Committed app code must not use `JSON.stringify`, `JSON.parse`, ad hoc JSON
text, direct `process.env`, raw production `fetch`, manual `_tag` inspection,
or copied remote DTOs. Effect Schema owns JSON crossing values; Effect Config
owns environment decoding; Eve owns MCP transport.

### Frontend Scope Stop

This SPEC intentionally changes no Bundjil React component, route, visible
text, URL state, or browser bundle. Any such change stops this task and
requires a separate accepted frontend SPEC before implementation.

That frontend SPEC must follow
`docs/architecture/frontend-composition.md` and require:

- visible structure composed as high as practical through `primitive ->
composite -> layout -> route`;
- leaf components owning the exact fragment's reads, mutations, search/page
  params, local interaction state, commands, atoms/stores, loading, empty,
  error, retry, skeleton, and fallback states;
- no prop drilling of query results, selected ids, loading flags, command
  callbacks, or derived option lists through unrelated ancestors;
- no nested feature wrapper, generic hook, boolean-prop matrix, or view-model
  mapper whose only purpose is shorter route JSX;
- explicit children/slot composition instead of boolean-prop matrices, and
  stable schema-owned keys for stateful/reorderable lists;
- values derived during render rather than mirrored from props/query data into
  state, with React effects reserved for synchronization with external
  systems rather than ordinary derivation or command handling;
- schema-backed field URL state for reusable search params, read-only route
  identity at reusable leaves, and the app router as the only URL writer; app
  route APIs and generated route trees must not enter reusable packages;
- Effect services, Layers, Config, secrets, and runtimes kept outside render
  functions and browser bundles, with Schema-owned serializable route/RPC
  contracts;
- canonical typography/design-system tokens, accessible controls, stable
  loading dimensions, keyboard/focus behavior, and no text overlap/overflow;
  and
- Browser evidence for desktop and mobile loading, empty, error, success, long
  content, and approval-related states, plus direct HTTP proof for any changed
  machine-readable route.

### Implementation Delegation Contract

Any implementation worker or subagent receives this SPEC path, the exact one
task object, relevant architecture documents, current file ownership, the
accepted helper/module budget, and that task's verification gates. Its prompt
must repeat the linear Effect, Schema ownership, helper-admission, lint, secret,
and frontend scope-stop rules. A worker may implement and report evidence, but
the parent implementer must inspect the actual diff and record the three audit
passes; worker assertions do not count as parent audit evidence.

Delegation does not permit package-by-package fragmentation. Each task remains
a progressive end-to-end slice and must leave a runnable, verified repository
state before the next task begins. A worker must not create a shared package,
service, helper, UI, or provider boundary beyond the assigned task without an
accepted SPEC/task update.

## Connection And Policy Design

### Eve Surface

The Eve connection allowlist is exact:

| MCP tool  | Purpose                                                             | Eve policy                                                                  |
| --------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `skills`  | Retrieve Executor usage guidance and discover the selected catalog. | Allowed. Read-only metadata.                                                |
| `execute` | Run code that invokes one or more selected downstream tools.        | Allowed. Executor evaluates every downstream operation against the toolkit. |
| `resume`  | Continue a browser-decided paused execution by execution id.        | Allowed only because browser mode removes model-supplied decision fields.   |

Do not add an Eve `always()` approval gate in this slice. It is too coarse for
Executor's dynamic downstream catalog and would duplicate a second approval
state machine. The security boundary is Executor's toolkit policy plus browser
mode. Eve's allowlist remains defense in depth around the orchestration tools.

### Executor Toolkit Surface

Implementation begins with a sanitized inventory, not a blanket catalog copy.
For every selected downstream operation, record its integration, connection
owner, operation category, and policy action without recording provider data
or credentials.

Initial policy rules:

| Operation category                                                                                                                                              | Policy             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Search, list, get, inspect, or other explicitly reviewed read-only operations                                                                                   | `approve`          |
| Create, update, send, publish, schedule, or state-changing operations that are reversible and appropriate for Bundjil                                           | `require_approval` |
| Delete, purchase, billing, credential/account administration, domain/registrar, infrastructure mutation, policy/toolkit management, and irreversible operations | `block`            |
| Unclassified operation or operation outside selected connections                                                                                                | implicit `block`   |

The first Preview toolkit should select only the smallest integrations needed
for proof. A useful first capability is a read-only search/get integration plus
one harmless operation temporarily set to `require_approval` for the browser
flow. Do not choose final integrations by assumption in this SPEC; inventory
the user's current Executor catalog and obtain explicit acceptance in the task
evidence before Production.

Executor core/toolkit/policy/key management tools must not be present in either
Bundjil toolkit. The agent cannot use Executor to enlarge its own authority.

## Configuration And Secret Lifecycle

Use target-scoped variables with the same names and different values:

- `BUNDJIL_EXECUTOR_MCP_URL`: encrypted Preview/Production value available to
  `eve build` and runtime. It identifies only the environment's toolkit and
  includes `elicitation_mode=browser`.
- `BUNDJIL_EXECUTOR_API_KEY`: sensitive/write-only Preview/Production bearer,
  resolved only at runtime by `auth.getToken`.

Add both names to `@bundjil/agent#build.env` in `turbo.json` only as required
by the actual Eve build behavior. The URL is necessarily import-time because
Eve requires a concrete URL in the compiled definition. The key must remain
runtime-only; do not add a build-time read merely because the variable name is
declared to Turbo.

Create separate Bundjil Preview and Production API keys. Store them as newly
labeled fields in the existing personal-vault Executor item and as encrypted
target-scoped Vercel variables. Do not overwrite the broad discovery key until
the dedicated keys have passed proof and rollback metadata is retained.

Provisioning and proof commands must use 1Password references or mode-0600
temporary files. Never place a secret in shell history, process arguments,
committed `.env` files, clipboard evidence, task ledgers, screenshots, or
terminal output. Remove temporary material after each proof.

Eve does not currently expose a conditional `enabled` field for an authored
MCP connection. Do not invent an unsupported toggle or point a disabled
connection at a fake endpoint. Local and CI builds must inject a syntactically
valid non-secret fixture toolkit URL. Task 2 adds no test-only MCP client or
server because Eve 0.20.0 exposes no public executable MCP client or test
harness; remote transport behavior is proved through the deployed Preview
task. Runtime rollback restores the last accepted immutable deployment that
predates or disables the connection, then revokes the affected Executor
key/toolkit.

## Call Graphs

### Production

```text
Authenticated Eve API principal or allowlisted Sendblue principal
  -> Eve turn
    -> connection_search("executor")
      -> apps/agent/agent/connections/executor.ts
        -> loadExecutorEndpoint
          -> ConfigProvider.fromEnv
          -> ExecutorMcpEndpoint policy
        -> auth.getToken
          -> loadExecutorApiKey
            -> Config.schema(Schema.Redacted(Schema.NonEmptyString))
            -> ConfigProvider.fromEnv
          -> Redacted.value at Eve adapter edge only
        -> Eve native MCP client (Streamable HTTP/SSE)
          -> Executor Production toolkit endpoint
            -> skills | execute | resume
              -> toolkit selected-connection implicit deny
              -> per-operation approve | require_approval | block
              -> Executor sandbox
              -> Executor host-side downstream credential injection
              -> selected downstream integration
```

### Browser Approval

```text
Eve model calls executor__execute
  -> Executor policy returns require_approval
    -> Executor pauses execution
    -> Executor returns executionId + approvalUrl
      -> Eve tells the authenticated owner to open approvalUrl
      -> Sendblue may deliver the same URL to the allowlisted owner
        -> owner signs into Executor in browser
        -> owner approves, declines, or cancels
          -> Executor stores the human decision
          -> Eve model calls executor__resume({ executionId })
            -> Executor consumes the stored decision
            -> completed or denied result returns to Eve
```

### Tests

```text
Vitest
  -> injected ConfigProvider fixture
    -> loadExecutorEndpoint + loadExecutorApiKey
      -> canonical endpoint/config Schemas
  -> authored executor connection definition
    -> Eve build/normalization
      -> URL-only import succeeds without API key
      -> isolated runtime getToken fixture
        -> missing key is a sanitized tagged error
        -> synthetic key is returned only to Eve's bearer adapter
  -> compiled artifact/log/evidence leak scans
```

### Operator And Deployment Proof

```text
1Password operator input
  -> mode-0600 ephemeral auth material
    -> read-only initialize + tools/list probe
    -> Executor toolkit connection/policy inventory
    -> Vercel Preview target variables
      -> clean source deployment
        -> Eve connection_search -> skills -> execute read-only
        -> browser pause -> human decision -> resume
        -> Vercel Agent Run + Executor trace readback
        -> sanitized proof only
          -> independent Production toolkit/key/variables
          -> Production deployment and smoke proof
```

## Test Strategy

### Config And Definition Tests

- Accept only HTTPS Executor toolkit URLs with the exact browser elicitation
  mode.
- Reject root MCP URLs, wrong hosts, HTTP,
  userinfo, fragments, missing/duplicate/wrong elicitation mode, and the legacy
  model-resume query.
- Prove missing URL and missing key fail closed with sanitized tagged errors.
- Prove key failures and `Redacted` rendering do not emit a synthetic secret
  marker.
- Prove the connection is app-scoped, exposes exactly `skills`, `execute`, and
  `resume`, and has no approval callback, custom headers, or fallback path.
- Prove URL-only import and `eve build` succeed without resolving or unwrapping
  the key; an isolated executable-edge subprocess proves missing-key
  sanitization and synthetic-key delivery only to `auth.getToken`.
- Scan `.output`, `.vercel/output`, test snapshots, and logs for synthetic key,
  authorization, protected URL, and approval URL markers.

### Task 2 Local Boundary

Task 2 owns only Bundjil configuration and the authored Eve definition. Eve
0.20.0's documented public `eve/connections` API exposes no executable MCP
client or test harness, so an in-process MCP server, custom transport, or
deep runtime import would create an unsupported second client boundary.

No app-owned resource exists in this task; `Effect.acquireRelease` lifecycle
coverage is therefore not applicable. Tests use `@effect/vitest`, injected
`ConfigProvider` fixtures, and isolated child-process environment options.
They do not mutate ambient `process.env`, start a server, choose a port, call
Executor/Vercel/Sendblue/a model/the public network, or hand-roll JSON-RPC.

Remote tool filtering, bearer/auth failures, malformed/unavailable transport,
read execution, browser-paused resume input, and no-fallback behavior are
Eve/Executor runtime responsibilities. The deployed Preview task proves them
against the isolated toolkit through `connection_search` and real remote tool
discovery; Bundjil does not mirror those contracts locally.

### Live Preview Proof

- Read back the Preview Vercel variable names, targets, and security types
  without values.
- Read back the Preview toolkit's selected connections and policy categories.
- Prove a direct MCP initialize/tools-list request with the dedicated Preview
  key using ephemeral mode-0600 material.
- Deploy a clean pushed SHA and confirm the immutable deployment is Ready.
- Through an authenticated Eve session, prove `connection_search`, `skills`,
  exact remote `skills`/`execute`/`resume` discovery, and one selected
  read-only `execute` operation.
- Prove a sanitized bearer/auth failure plus malformed and unavailable remote
  MCP failures fail closed without a direct-provider fallback.
- Temporarily require browser approval for a harmless proof operation. Prove
  the Eve turn pauses, the owner opens the authenticated Executor page,
  approve and decline each work, and `resume` carries only the execution id.
- Restore and read back the intended toolkit policy after the proof.
- Send one allowlisted Sendblue message that requires the Executor connection;
  prove a usable approval URL is delivered when gated and the final reply is
  delivered only after the browser decision.
- Correlate sanitized Eve Agent Run, Vercel request, Executor execution, and
  Sendblue delivery status without retaining prompts, message text, provider
  records, execution code, full URLs, or credentials.

## Browser Verification

Bundjil adds no React route or component in this slice. Browser evidence is
still mandatory for the external approval state because it is the human
security decision surface:

- approval URL opens the expected Executor origin over HTTPS;
- unauthenticated access requires Executor authentication;
- the authenticated page identifies the pending operation without revealing
  raw credentials;
- approve, decline, and cancel are distinct actions;
- approving and declining each produce the expected resume outcome;
- refreshing or reusing a settled approval URL cannot apply a second decision;
- the URL received through Sendblue is usable by the allowlisted owner;
- screenshots/evidence redact the full URL, execution id, account data, and
  provider payload.

If implementation adds any Bundjil-visible UI, apply the hard stop and complete
contract in **Frontend Scope Stop**. External Executor approval-page proof does
not authorize Bundjil route/component work.

## Rollout

1. Freeze current Eve and Executor contract evidence and create a sanitized
   inventory of candidate integrations/operations.
2. Implement Effect config, endpoint policy, the thin Eve connection,
   executable-edge definition tests, documentation, and compiled-output leak
   checks.
3. Create the isolated Preview toolkit/key and target-scoped Vercel variables.
4. Pass local config/definition, direct MCP, deployed Eve, browser approval,
   Sendblue, log, and leak proof in Preview.
5. Create an independent Production toolkit/key from the accepted policy
   intent. Do not reuse Preview identities or copy unreviewed catalog entries.
6. Deploy Production from the accepted clean SHA, prove one read-only
   operation, and observe before enabling any approved write integration.
7. Expand the toolkit one integration at a time through a SPEC/task update,
   policy inventory, Preview proof, and Production promotion.

## Rollback And Incident Response

- Keep the previous accepted immutable agent deployment id before promotion.
- For runtime or compatibility failure, restore that deployment and verify the
  stable alias plus Eve info/health behavior.
- For suspected key exposure, revoke the affected Executor API key first,
  disable/remove the environment toolkit, then roll back the deployment.
- For policy overreach, block the affected operation/toolkit immediately,
  retain sanitized execution identifiers for investigation, and do not rely
  only on a code rollback.
- For approval-mode regression, revoke the key and disable the toolkit. A
  missing or model mode is a stop condition, not a degraded operating mode.
- Confirm no post-revocation execution succeeds and scan Vercel/Executor logs
  for the incident interval without copying provider payloads into the repo.
- Rotate the 1Password and Vercel values together and record only dates,
  environment, and sanitized key identifiers.

## Observability And Evidence

Record only the minimum correlation data needed to prove behavior:

- environment and immutable Vercel deployment id;
- source commit SHA;
- sanitized toolkit identity or digest;
- connection/tool name category;
- operation category and policy action;
- execution status and latency bucket;
- whether approval was required and the final decision category;
- Eve session/turn and Sendblue claim identifiers only in opaque or digested
  form; and
- HTTP status family and error tag.

Do not record prompts, generated Executor code, model reasoning, message text,
provider records, raw MCP payloads, downstream tool results, full approval or
toolkit URLs, authorization headers, API keys, or provider credentials.

Use Vercel Agent Run inspection, deployment/function logs, Executor execution
history, and Sendblue delivery status as separate evidence sources. A success
claim requires correlated evidence, not only a model response.

## Documentation Deliverables

Implementation must update:

- root `README.md` with the optional Executor capability and security posture;
- `apps/agent/README.md` with local config, connection discovery, approval
  flow, Preview/Production variables, proof, rollback, and troubleshooting;
- `docs/architecture/eve-agent.md` with the connection call graph and model
  behavior;
- `docs/architecture/effect-patterns.md` only if the implementation proves a
  new reusable adapter/config rule;
- `docs/architecture/repo-structure.md` with the app-owned connection boundary;
- `docs/architecture/testing-and-quality.md` with local definition and
  deployed MCP proof rules if they generalize;
- this SPEC and its task ledger with accepted evidence and audit passes; and
- an active execution plan under `docs/exec-plans/active/` only when
  implementation starts, archived after acceptance.

Documentation must distinguish live verified behavior from intended behavior,
name the exact environment, and provide secret-safe operator commands without
literal credentials or protected URLs.

## Mandatory Three-Pass Effect Audit

Every implementation task must complete at least three parent review passes:

1. **Ownership and call graph:** verify the connection remains app-owned, Eve
   remains the MCP client, Executor remains the remote schema/policy/credential
   owner, and Preview/Production boundaries match this SPEC.
2. **Implementation quality:** review the complete diff for flat meaningful
   `Effect.gen`/`Effect.fn` programs with visible sequential success paths,
   typed errors handled through `Effect.fn` transforms or the outer
   `.pipe(...)`, correctly named non-duplicated spans, canonical Schema-derived
   contracts, Config/ConfigProvider/non-empty Redacted usage,
   adapter-edge execution only, and no nested helper chains, unsafe/structural
   casts, non-null assertions, `any`, DTO mirrors, manual readers/mappers, raw
   JSON helpers, `process.env`, raw production fetch, raw `_tag` checks, broad
   expected-error collapse, unscoped fibers, hidden queues, unbounded
   concurrency, automatic `execute`/`resume` retry, or helper sprawl. Record
   the helper-admission table and remove every candidate without accepted
   ownership, call sites, and direct tests.
3. **Verification and evidence:** review focused tests, Eve build, task-owned
   config/definition evidence, deployed MCP/direct HTTP, browser approval,
   Sendblue, deployment, logs, leak scans,
   documentation, rollback evidence, zero-warning Ultracite/Oxlint, strict
   typechecks, Effect language-service diagnostics, Knip, and proof that no
   lint/type/test/configuration escape was introduced.

Three passes are the acceptance floor, not a quota. Any unresolved ownership,
policy, approval, secret, Effect, helper, deployment, or evidence finding
requires correction and another pass. Record evidence in the task ledger and
active execution plan before accepting the task.

## Risks And Tradeoffs

- Executor and Eve are evolving. Pinning versions and revalidating current
  source/behavior reduces but does not remove compatibility risk.
- Eve requires a concrete connection URL at build time, which makes local and
  CI build configuration less optional. A fixture URL is preferable to an
  unsupported runtime toggle.
- Executor's `execute` tool is intentionally powerful. Toolkits and policies,
  not the small number of MCP orchestration tools, define the true authority.
- Browser approval adds latency and requires the owner to authenticate in a
  browser. This is the intended security tradeoff for state-changing actions.
- A dedicated hosted dependency adds availability risk. Bundjil fails closed
  rather than bypassing Executor and calling providers directly.
- App-scoped Executor credentials are appropriate for a single-owner personal
  agent, but they are not a future multi-user authorization model.

## Acceptance Criteria

- The connection uses Eve's native MCP definition and no custom production MCP
  client, Executor SDK, proxy, or new workspace package exists.
- Config is app-owned, in a distinct `config.ts`, uses Effect Config,
  ConfigProvider, Schema policy, Redacted, and sanitized tagged errors.
- The URL is toolkit-scoped and browser-mode; root and model-mode endpoints are
  rejected.
- Eve exposes exactly `skills`, `execute`, and `resume`.
- Preview and Production toolkits and keys are independent and implicit-deny.
- The initial operation inventory has explicit approve/require/block outcomes
  and no agent-accessible authority-management operation.
- Stub tests prove auth, filtering, read execution, browser resume shape,
  failures, and leak safety.
- Preview proves authenticated Eve discovery/execution, browser approval and
  decline, Sendblue approval-link delivery, policy restoration, and correlated
  provider/runtime evidence.
- Production is promoted only from accepted Preview evidence and retains a
  tested rollback deployment plus key/toolkit revocation procedure.
- Documentation and task evidence reflect actual behavior and environment.
- Every retained helper/module has accepted ownership, concrete call sites,
  direct test evidence where applicable, and a recorded retain decision; no
  generic, pass-through, one-line, or speculative abstraction survives.
- Ultracite/Oxlint, strict TypeScript, Effect language service, Knip, Turbo,
  formatter, and test settings are not weakened and no unaccepted suppression
  or broadened ignore list exists.
- No Bundjil React/route/visible-text/URL-state change exists. Any later UI is
  governed by a separate SPEC with highest-parent composition, leaf-owned
  data/commands/states, children/slot composition, render-time derivation,
  schema-backed URL state, app-router-only URL writes, accessibility,
  canonical typography, and desktop/mobile Browser proof.
- `bun install --frozen-lockfile`, focused agent checks, root checks, knip,
  `bun run verification`, JSON validation, diff checks, language-service
  review, secret scans, and all mandatory live proofs pass.
- Every implementation task records at least three accepted audit passes.

## Sources

- [Executor MCP Proxy](https://executor.sh/docs/mcp-proxy)
- [Executor Cloud](https://executor.sh/docs/hosted/cloud)
- [Executor Policies](https://executor.sh/docs/concepts/policies)
- [Executor source](https://github.com/UsefulSoftwareCo/executor)
- [Executor hosted browser-approval lookup fix](https://github.com/UsefulSoftwareCo/executor/pull/1317)
- Ignored current Executor reference:
  `.local/references/executor` at researched commit
  `0a50c796c2cc334cf3e9bf6d4be33c77dbfac93b`
- Ignored current Eve reference: `.local/references/eve`, especially
  `docs/connections/mcp.mdx` and the authored connection definition source
- Bundjil architecture: `docs/architecture/effect-patterns.md`,
  `docs/architecture/repo-structure.md`, `docs/architecture/eve-agent.md`, and
  `docs/architecture/testing-and-quality.md`
