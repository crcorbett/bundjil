# Personal Codex Subscription Auth And Hosted Proxy

Status: Implemented and accepted for personal preview
Owner: Bundjil
Created: 2026-07-07
Revised: 2026-07-13

## Current State

The trusted-local PKCE login, encrypted Upstash V2 persistence,
refresh-capable hosted proxy, fenced concurrency, bounded unauthorized replay,
private SSE, and leak-safe preview proof are implemented and recorded. The
mandatory final three-pass cross-cutting Effect audit passed. The personal
Vercel preview is not a production approval.

`apps/agent` independently implements an opt-in `codex-proxy` LanguageModel
adapter through Effect Config, with Gateway as default. Its focused adapter
proof is not a recorded combined Eve -> hosted-live-proxy proof.

## Decision Summary

Bundjil can authenticate a single owner's personal Codex subscription without
an OpenAI Platform API key and without a Vercel-hosted OAuth callback.

The interactive authorization flow must run on the owner's trusted local
machine. A local Bundjil command starts the Codex-compatible loopback PKCE
flow, receives the authorization code on localhost, exchanges it for the
subscription credential bundle, discards the ID token after deriving the
required account metadata, encrypts the refresh-capable profile, and writes the
ciphertext to the owner's Upstash store. The private Vercel proxy reads that
profile and rotates access and refresh tokens under the existing distributed
refresh lock.

This supersedes the prior design assumption that Bundjil needs a separately
registered Vercel redirect URI. Bundjil must not add hosted OAuth start or
callback routes for this flow.

This is a personal, single-owner integration. It is not a public OAuth product,
multi-user SaaS authentication system, credential resale service, or general
OpenAI Platform replacement.

## Purpose

Replace the completed access-token-only workaround with a durable personal
subscription sign-in and refresh path while preserving the existing private
OpenAI-compatible proxy contract:

```text
trusted local login command
  -> ChatGPT subscription authorization through Codex-compatible PKCE
  -> encrypted refresh-capable profile in personal Upstash

apps/agent Eve runtime (opt-in adapter implemented; combined proof unrecorded)
  -> private apps/codex-proxy Vercel preview
  -> @bundjil/codex-oauth
  -> refreshed subscription access token
  -> https://chatgpt.com/backend-api/codex/responses
```

The access-token-only filesystem and Upstash import paths are now deprecated
emergency/local diagnostic fallbacks. They are preserved for rollback history
and diagnostics, not normal hosted operation.

## Corrected Research Conclusion

### Evidence hierarchy

1. OpenAI's current authentication documentation states that Codex supports
   **Sign in with ChatGPT for subscription access** and that the desktop app,
   CLI, and IDE extension complete that sign-in through a browser returning
   credentials to the local Codex client:
   <https://learn.chatgpt.com/docs/auth?surface=app>.
2. Current `openai/codex` source is the protocol authority for the local client
   implementation. Executor Personal DeepWiki research was checked against the
   ignored local source snapshot at commit
   `9e552e9d15ba52bed7077d5357f3e18e330f8f38`. Direct source confirms
   authorization-code PKCE, S256, ports 1455/1457, the first-party scope set,
   form-encoded code exchange, JSON refresh, required initial ID/access/refresh
   tokens, optional refreshed tokens, access-JWT expiry, ID-token account
   metadata, and bounded unauthorized recovery. Future live proofs must
   revalidate the exact current source before touching the owner's profile.
3. `numman-ali/opencode-openai-codex-auth` is community interoperability
   evidence, not an OpenAI policy or API stability guarantee. Local reference
   commit `bec2ad69b252ef4ad7dd33b9532ff8b4fdb6d016` demonstrates a personal
   external client using a localhost callback, manual fallback, code exchange,
   automatic refresh, rotating refresh persistence, account header derivation,
   and the Codex backend. Its own notice limits intended use to personal
   development and recommends the Platform API for public or multi-user
   applications.

### What changed

The earlier revision correctly rejected a **hosted Vercel callback** using the
Codex public client, but incorrectly treated that as a blocker for the whole
feature. The supported client shape is local: the browser returns to localhost,
then the trusted client persists credentials. Bundjil can use the same client
shape for its single owner and synchronize only the encrypted profile to its
private hosted proxy.

The following prior requirements are removed:

- a registered Bundjil Vercel redirect URI;
- `GET /codex/oauth/start` on Vercel;
- `GET /codex/oauth/callback` on Vercel;
- a hosted `CodexOAuthStateStore` for PKCE verifier/state;
- browser cookies or authorization codes crossing into Vercel.

### Protocol baseline

The accepted implementation tracer verified the pinned `openai/codex` source
and local behavior before protocol values were committed. Future live proofs
must repeat that source-drift check. The accepted comparison established:

- authorization endpoint `https://auth.openai.com/oauth/authorize`;
- token endpoint `https://auth.openai.com/oauth/token`;
- public Codex client identifier category;
- allow-listed loopback redirects `http://localhost:1455/auth/callback` and
  first-party fallback port `1457`;
- authorization-code grant with PKCE S256 and random state;
- community-reference scopes `openid profile email offline_access`; the pinned
  first-party source also requests connector scopes, and the accepted tracer
  recorded that first-party set;
- `id_token_add_organizations=true`;
- `codex_cli_simplified_flow=true`;
- `originator=codex_cli_rs`;
- ID token, access token, and rotating refresh token from the token endpoint;
  access expiry derived through a narrow schema for the access-token `exp`
  claim, matching current first-party behavior rather than assuming
  `expires_in` exists.

Each future live proof must start with the then-current first-party scope set
and record source drift before login. Do not experiment with alternate scope
sets during the owner's real login. A later least-privilege reduction requires
its own deterministic proof and source review. Public protocol constants are
not secrets, but they must live in one package-owned schema/config module so
source drift is visible.

## Goals

- Provide a trusted-local, refresh-capable Codex subscription login command.
- Use a scoped loopback callback server with state and PKCE verifier held only
  in local memory.
- Exchange and decode OAuth responses through Effect HTTP and Effect Schema.
- Persist only the minimum encrypted hosted profile: access token, rotating
  refresh token, expiry, required account metadata, scopes, and timestamps.
- Never persist the authorization code, PKCE verifier, state, browser cookies,
  raw token response, or ID token.
- Make the existing refresh lock guard real hosted refresh and refresh-token
  rotation.
- Refresh proactively near expiry and perform at most one forced refresh/retry
  after an upstream authorization failure.
- Prove local login, encrypted Upstash persistence, hosted refresh, concurrent
  refresh safety, private proxy streaming, and safe reauthentication failure.
- Keep Gateway as the default Eve provider unless a separately approved
  production decision changes that boundary. The sibling Eve provider SPEC
  owns the implemented opt-in adapter.

## Non-Goals

- No hosted browser callback or app-user login.
- No Better Auth, WorkOS, Auth.js, or user/session database.
- No multi-user account linking, team account pool, credential sharing,
  subscription resale, or public proxy.
- No adoption or dependency on OpenCode, OpenClaw, Goose, Hermes, or Pi code.
- No copying of their implementation, prompts, model maps, request logs, or
  unsafe parsing patterns.
- No automatic extraction from `~/.codex/auth.json` as the primary login path.
- No storage of ID tokens or raw OAuth responses after login completion.
- No assumption that the subscription backend is a stable OpenAI Platform API.
- No production deployment without a fresh protocol/policy review and explicit
  user approval. Personal preview proof is complete but is not production
  approval.
- No Eve model-provider change in this SPEC.

## Existing Foundations

The following implemented package boundaries remain canonical:

- `CodexOAuthSubject`
- `CodexOAuthProfile`
- `CodexSubscriptionProfile`
- `EncryptedCodexOAuthProfileV1`
- `EncryptedCodexOAuthProfileV2`
- `CodexOAuthProfileCipher`
- `CodexProfileStore`
- `CodexProfileStoreEncryptedKeyValueLive`
- `CodexOAuthRefreshLock`
- `UpstashCodexOAuthRefreshLockLive`
- `CodexOAuthProfileCommit`
- `UpstashCodexOAuthProfileCommitLive`
- `CodexOAuthClient`
- `CodexOAuthHttpClient`
- `CodexOAuthRefreshClientLive`
- `CodexOAuthService`
- `CodexDirectProvider`
- `CodexHttpClient`
- `OpenAICompatibleProxy`
- `UpstashKeyValueStoreLive`
- `CodexProxyConfig`
- `CodexProxyRoutesLive`

Completed encryption, encrypted persistence, storage keys, Upstash adapter,
lock semantics, refresh-capable preview proof, and the server-safe/trusted-local
Layer split must be preserved. The access-token-only importer proves only its
deprecated diagnostic path and is not refresh evidence.

## Design

### Trusted-local login boundary

`@bundjil/codex-oauth` owns protocol schemas, token exchange, refresh, and the
login operation because it already owns the profile and provider contracts.
The Bun command is the only executable allowed to open a browser or bind a
loopback callback.

The implemented design owns these contracts:

- `CodexSubscriptionAuthProtocolConfig`: issuer/endpoints, public client id,
  redirect URI, scopes, and approved authorization parameters.
- `CodexOAuthAuthorizationSession`: redacted state, redacted PKCE verifier,
  code challenge, redacted authorization URL, and redirect URI. This value is
  memory-only; reveal the URL only at the browser-launch boundary.
- `CodexOAuthAuthorizationCallback`: redacted code and state decoded from the
  loopback request.
- `CodexOAuthTokenResponse`: minimal ID/access/refresh token endpoint response
  schema without an assumed `expires_in` field.
- `CodexOAuthAccountId`: redacted account/workspace identifier needed for the
  backend request header.
- `CodexOAuthCredentialRevision`: opaque revision/fencing value for one
  encrypted profile generation.
- `CodexSubscriptionLoginResult`: sanitized profile id, mode, expiry category,
  refresh capability, and encrypted-store confirmation.
- tagged errors for callback bind, callback timeout, state mismatch, denied
  authorization, code exchange, token response schema, account metadata,
  refresh, and reauthentication required.

Use concrete package-owned service tags and explicit layers:

- `CodexSubscriptionAuthProtocolConfigService` with live/test layers;
- `CodexOAuthHttpClient` with live/mock HTTP layers;
- `CodexLoopbackCallback` with Bun live and memory test layers;
- `CodexBrowserLauncher` with platform-command live and memory test layers;
- `CodexSubscriptionLogin` with a live Layer composed against memory/mock
  dependencies in tests;
- `CodexOAuthProfileCommit` with Upstash fenced-CAS and memory layers.

The local operation should be a scoped, named Effect program:

```text
CodexSubscriptionLogin.run
  -> generate cryptographic state and PKCE pair
  -> acquire CodexLoopbackCallback through Effect Scope on 127.0.0.1
  -> build authorization URL
  -> reveal redacted URL only to CodexBrowserLauncher
  -> await one callback through Deferred with a strict timeout
  -> validate method, path, state, and code
  -> exchange code through CodexOAuthHttpClient.exchangeAuthorizationCode
  -> decode minimum account metadata
  -> construct canonical CodexSubscriptionProfile
  -> fenced initial/replace write through CodexOAuthProfileCommit
  -> close server through Scope finalization
  -> emit Schema-encoded sanitized result
```

State and verifier must never enter Upstash. Callback query strings and the
authorization code must not enter logs, spans, errors, proof output, shell
history, or docs. A port-bind failure returns a safe actionable error. Manual
redirect paste is a later opt-in fallback unless it can be implemented without
printing or retaining the code. Request logging is disabled for the callback
server, and Scope finalization must close it after success, denial, timeout,
interruption, state mismatch, exchange failure, or browser-launch failure.

### OAuth transport and refresh adapter

The implementation deliberately separates interactive login from hosted
refresh instead of presenting one broad client as if every operation were
available in every runtime:

- `CodexSubscriptionAuthProtocolConfigService` and package-owned named
  functions create authorization material and the authorization session;
- `CodexSubscriptionLogin` owns the trusted-local interactive workflow;
- `CodexOAuthHttpClient` owns code-exchange and refresh HTTP transport;
- `CodexOAuthRefreshClientLive` implements only the refresh operation of
  `CodexOAuthClient` for hosted composition; start-login, complete-login, and
  revoke remain explicit unsupported operations there;
- remote revocation remains unsupported unless a current provider endpoint is
  established by a future SPEC revision.

The transport uses Effect HTTP APIs and separate owning request contracts:

- authorization-code exchange uses the current first-party form-url-encoded
  request shape;
- refresh uses the current first-party JSON request shape;
- successful and error responses use narrow Effect Schemas, including optional
  token fields where current source permits them.

Redacted values are revealed only at the final request body boundary. The
client must not use raw `fetch`, `JSON.parse`, `JSON.stringify`, unsafe casts,
unverified object readers, or provider response logging.

### Token and account profile

The canonical profile is the explicit versioned union:

```text
CodexOAuthProfile (profileVersion = 2) =
  | CodexAccessTokenImportProfile
  | CodexSubscriptionProfile
```

`CodexAccessTokenImportProfile` represents the accepted legacy/import fallback
and may omit refresh/account metadata. `CodexSubscriptionProfile` must require
the rotating refresh token, account id, access expiry, protocol/scope version,
credential revision, and `requiresReauthentication` state.

The encrypted subscription plaintext may contain:

```text
CodexSubscriptionProfile
  profileVersion
  profileKind
  subject
  accessToken (Redacted)
  refreshToken (Redacted, required for subscription login profiles)
  expiresAtEpochMillis (derived from access-token `exp`)
  accountId (Redacted or otherwise excluded from keys/logs)
  scopes
  createdAtEpochMillis
  updatedAtEpochMillis
  lastRefreshedAtEpochMillis
  credentialRevision
  requiresReauthentication
```

Decode existing encrypted V1 plaintext only as the legacy access-token-import
variant. Do not silently reinterpret it as refresh-capable. A successful new
login writes V2; live refresh refuses a legacy profile with safe
reauthentication guidance. Migration and rollback tests must cover both
variants.

Do not persist the ID token. Derive the access expiry from the access-token
`exp` claim and extract the required account metadata from the first-party
canonical token/claim source using narrow Effect Schema decoders after the
response is received directly over TLS. This extraction supplies routing and
expiry metadata only; it must not be treated as independent proof of identity
or authorization. Never place account metadata in a Redis key, URL, log,
error, or route response.

If future `openai/codex` source proves that a different token or claim is the
canonical account source, update this SPEC before another implementation or
live-proof change proceeds.
On refresh, retain the stored account id when no new identity metadata is
returned. If a refresh response identifies a different account, fail without
mutating storage and require a new local login.

Although current first-party refresh response fields are optional at the
transport schema, Bundjil requires a new access token for a successful refresh.
It may retain the current refresh token when the replacement is omitted and
current source permits that behavior. An omitted ID token retains the existing
account id. Missing access token, malformed expiry, or cross-account metadata
is a typed failure with no profile mutation.

### Encrypted persistence

Hosted reads continue through the Schema-backed profile store:

```text
CodexProfileStore
  -> CodexProfileStoreEncryptedKeyValueLive
  -> CodexOAuthProfileCipherLive (AES-GCM)
  -> KeyValueStore.toSchemaStore
  -> UpstashKeyValueStoreLive
  -> personal Upstash Redis
```

Hosted writes do not bypass fencing:

```text
CodexOAuthProfileCommit
  -> UpstashCodexOAuthProfileCommitLive
  -> CodexOAuthProfileCipherLive (AES-GCM)
  -> atomic expected-revision compare-and-set
  -> personal Upstash Redis
```

Only the versioned encrypted envelope may cross the Upstash boundary. Key
material comes from `Config.redacted`; key ids remain non-secret. Rotation of
the encryption key is operationally separate from OAuth refresh-token
rotation.

### Refresh and rotation

The five-second refresh lease alone is insufficient: a slow request can finish
after lease expiry and overwrite a newer login or refresh. The implemented
`CodexOAuthProfileCommit` is the package-owned fenced compare-and-set mutation
contract. Its Upstash adapter atomically verifies the expected credential
revision/fence and writes the new encrypted profile/revision. All subscription
profile mutations—new login, refresh rotation, and permanent reauthentication
marking—must use this boundary. A stale lease holder receives a typed conflict
and re-reads the winner instead of writing.

`CodexOAuthService.getValidCredential` is the canonical hosted credential
operation and returns access token, account id, and credential revision
together. The legacy `getValidToken` operation remains access-token-only and is
not the hosted refresh path:

1. Read and decrypt the profile.
2. Return the access token when it remains valid beyond a configured refresh
   skew.
3. Otherwise acquire `CodexOAuthRefreshLock` using the canonical subject hash.
4. Re-read the profile under lock.
5. Return the newer winner token if another invocation already refreshed.
6. Exchange the current refresh token at the token endpoint.
7. Fenced-CAS commit the new access token, new expiry, account id, new revision,
   and rotated refresh token before releasing the lock.
8. On `invalid_grant`, missing refresh token, or another permanent credential
   failure, atomically mark `requiresReauthentication=true` and return a safe
   tagged error. On network, timeout, rate-limit, or provider 5xx failure,
   leave the stored profile unchanged and return a retryable typed failure.

The old refresh token must never overwrite a newer winner. If the provider
omits a replacement refresh token, retain the current token only when current
source evidence permits it; otherwise fail closed.

`recoverAfterUnauthorized({ subject, observedCredentialRevision })` re-reads
the profile under lock, uses the winner if the revision changed, or forces a
refresh regardless of JWT expiry when the rejected revision is still current.
It returns one atomic credential containing access token, account id, and
revision. The direct provider may replay exactly once with that credential. It
must not loop, retry arbitrary 4xx responses, or refresh after policy or
rate-limit errors.

### Private hosted proxy

`apps/codex-proxy` keeps its existing routes:

- `GET /health`
- private `POST /v1/chat/completions`

It must not add OAuth browser routes. Live mode composes the server-safe
`CodexOAuthHttpClientLive`, `CodexOAuthRefreshClientLive`, encrypted profile
store, Upstash lock and fenced commit, OAuth service, direct provider, and
existing OpenAI-compatible stream mapper. Trusted-local browser, callback, and
login Layers are exported only from
`@bundjil/codex-oauth/trusted-local.layer` and cannot enter the deployable app
module graph. Missing or invalid credentials return a generic reauthentication
instruction with no provider body or token metadata.

Route error semantics are explicit:

- missing/invalid private proxy bearer remains HTTP 401;
- permanent subscription credential failure returns HTTP 502 with stable code
  `codex_reauthentication_required`;
- transient token refresh or auth-provider failure returns HTTP 503 with stable
  code `codex_auth_temporarily_unavailable`;
- non-auth upstream failure remains a sanitized HTTP 502 provider error.

`GET /health` must not report `ok: true` when `live` layer construction has
fallen back to the unavailable proxy service. In that state it returns a
sanitized non-ready status without probing or exposing the stored profile.

`mock` remains the default. `local` remains a trusted filesystem proof and is
rejected on Vercel. `live` remains explicit and personal-preview only until a
later production decision.

### Disconnect and revocation

Bundjil can always disconnect locally by deleting the encrypted profile and
switching the proxy to `mock`. If OpenAI does not expose a supported remote
revocation endpoint, do not fabricate one. Documentation must direct the owner
to the current ChatGPT/Codex account controls for provider-side revocation.

### Evidence and usage boundary

The protocol is appropriate only for Cooper's personal agent using Cooper's
own subscription. The proxy must remain private and single-profile. Any move
to multiple users, commercial access, account pooling, or public traffic
requires a new SPEC and the OpenAI Platform API unless OpenAI publishes a
different supported product surface.

## Call Graphs

### Local login CLI

```text
bun run --filter @bundjil/codex-oauth login:subscription
  -> CodexSubscriptionLogin.run
  -> CodexSubscriptionAuthProtocolConfigServiceLive
  -> CodexLoopbackCallbackBunLive
     -> Effect Scope + Bun platform services + Deferred callback
  -> createCodexOAuthAuthorizationMaterial
  -> buildCodexOAuthAuthorizationSession
  -> CodexBrowserLauncherCommandLive
  -> browser -> auth.openai.com/oauth/authorize
  -> localhost callback -> Deferred<AuthorizationCallback>
  -> CodexOAuthHttpClient.exchangeAuthorizationCode
  -> auth.openai.com/oauth/token
  -> UpstashCodexOAuthProfileCommitLive
     -> CodexOAuthProfileCipherLive
     -> fenced initial/replacement write to personal Upstash Redis
```

### Hosted refresh-capable request

```text
POST /v1/chat/completions
  -> apps/codex-proxy CodexProxyRoutesLive
  -> OpenAICompatibleProxy.handleChatCompletions
  -> CodexDirectProvider.streamChatCompletion
  -> CodexOAuthService.getValidCredential
  -> CodexProfileStoreEncryptedKeyValueLive
  -> when near expiry: UpstashCodexOAuthRefreshLockLive
  -> CodexOAuthRefreshClientLive
  -> CodexOAuthHttpClient.refresh
  -> auth.openai.com/oauth/token
  -> UpstashCodexOAuthProfileCommitLive fenced-CAS rotated write
  -> CodexHttpClient.postResponsesStream
  -> chatgpt.com/backend-api/codex/responses
```

### Forced authorization retry

```text
Codex backend 401 with observed credential revision
  -> CodexDirectProvider classifies authorization failure
  -> CodexOAuthService.recoverAfterUnauthorized
  -> distributed lock + profile re-read
  -> winner credential OR forced refresh of unchanged rejected revision
  -> fenced-CAS rotated profile write
  -> one replay
  -> success OR CodexOAuthReauthenticationRequired
```

### Tests

```text
@effect/vitest
  -> CodexSubscriptionLogin
  -> CodexSubscriptionAuthProtocolConfigTest
  -> CodexLoopbackCallbackMemory
  -> CodexBrowserLauncherMemory
  -> CodexOAuthHttpClientMock
  -> encrypted profile store over KeyValueStore.layerMemory

@effect/vitest
  -> concurrent CodexOAuthService requests
  -> memory/Upstash-like refresh lock
  -> rotating mock token endpoint
  -> CodexOAuthProfileCommitMemory fenced-CAS
  -> exactly one refresh and one winning encrypted profile
```

### Live proof

```text
trusted local login command
  -> sanitized success only
  -> encrypted Upstash envelope readback

Vercel personal preview
  -> health/auth checks
  -> force near-expiry profile
  -> isolated proof subject and concurrent live requests
  -> safe refresh observer reports one winner without revision values
  -> successful private SSE stream
  -> response/storage/log leak scans
```

## Effect Requirements

### Native ownership and contracts

Use Effect TS native approaches first. Prefer `Data`, `Schema`, `Array`,
`Chunk`, `HashSet`, `HashMap`, `Match`, `Context`, `Layer`, `Config`,
`Service`, `Record`, `Result`, `Exit`, Effect Platform HTTP/Command,
`Deferred`, `Scope`, and `ManagedRuntime` over plain TypeScript helpers when
the code is fallible, async, runtime-owned, resource-scoped, collection-heavy,
or crosses a package, HTTP, command, config, provider, or persistence boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from `@bundjil/codex-oauth`. Do not create script-local DTOs,
token-response mirrors, duplicate profile fields, or app-owned copies of a
package contract. Decode unknown input once at the owning boundary and encode
it when it crosses HTTP, persistence, command-output, or proof boundaries.

### Linear Effect programs

Primary login, callback, exchange, refresh, profile update, and provider retry
operations must be flat, named `Effect.gen` or `Effect.fn` programs. Handle
expected failures in the following `.pipe(...)` with `catchTag`, `catchTags`,
`mapError`, or `Match`.

The success path must read top-to-bottom in domain order: decode, acquire the
required services, execute the operation, and encode at the outbound boundary.
Use this shape:

```ts
export const executeOperation = Effect.fn("CodexService.executeOperation")(
  function* (unknownInput: unknown) {
    const input =
      yield* Schema.decodeUnknownEffect(OperationInput)(unknownInput);
    const dependency = yield* CodexDependency;
    const result = yield* dependency.execute(input).pipe(
      Effect.mapError(
        (cause) =>
          new CodexOAuthTokenProviderError({
            operation: "refresh",
            message: "Unable to execute the Codex operation.",
            cause,
          })
      )
    );

    return yield* Schema.encodeEffect(OperationOutput)(result);
  }
);
```

A nested `Effect.gen` is allowed only when it scopes a resource, defines a
materially reusable sub-operation, or keeps a lock/commit critical section
explicit. Do not bury policy branches inside nested pipelines.

- Runtime execution with `Effect.runSync`, `Effect.runPromise`, or
  `ManagedRuntime` belongs only at an executable app, route adapter, test, or
  CLI edge, never package domain logic.
- Layer composition belongs in `*.layer.ts`, app-runtime, CLI composition, or
  test setup files. Domain services depend on service tags, not concrete live
  Layers.
- Operation and span names describe domain behavior. Span attributes must not
  contain credentials, callback URLs, account ids, prompts, or provider
  payloads.
- Prefer `Match` and typed schema discriminants over `switch` statements or
  chained string comparisons for closed variants.

### Resources, config, and secrets

- Effect Schema owns URL/query/form/token/profile/callback/result boundaries
  and all derived TypeScript types.
- JSON string boundaries use `Schema.fromJsonString(...)` or
  `Schema.UnknownFromJsonString`; no manual JSON parser/stringifier.
- Effect Platform owns HTTP client/server and browser-opening command
  lifecycles; no raw Node HTTP server or unmanaged child process.
- Callback listener acquisition and release are scoped; state completion uses
  `Deferred` or an equivalent Effect concurrency primitive.
- Config lives beside its consumer and uses `Config`, `Config.redacted`, and
  `ConfigProvider.fromEnv()`; package logic does not read `process.env`.
- Secrets remain `Redacted` until the final crypto, form body, or authorization
  header boundary.
- Provider response bodies, callback query strings, and credentials never
  enter spans, errors, logs, snapshots, or proof output.
- Persistence uses Effect `KeyValueStore` plus owning schemas. Raw Upstash
  commands remain isolated to the lock and fenced-commit adapter.
- Deployable apps import server-safe `live.layer` exports only. Browser,
  loopback, and interactive login Layers remain behind `trusted-local.layer`.

### Helper and abstraction budget

Helper sprawl is forbidden. Keep a one-off transformation or Effect pipeline
inline at its consumer. A new helper, wrapper, mapper, adapter, or service is
allowed only when at least one of these is true:

1. it is reused by multiple real call sites;
2. it names and enforces a package, provider, serialization, resource, crypto,
   lock, or security boundary;
3. it isolates a non-trivial algorithm or policy that is clearer and directly
   testable in isolation;
4. it matches an established repo abstraction with the same ownership.

The following are not acceptable abstractions:

- one-line wrappers around one Effect or SDK call;
- helpers that only read one property, rename a field, or wrap one `map`;
- local DTO converters that mirror an owning Schema;
- generic `utils`, `helpers`, `common`, or `shared` modules without one clear
  owner;
- pass-through services or Layers created only to shorten a call site;
- script-specific clients that duplicate package services;
- abstractions justified only by possible future reuse.

Every implementation audit must inspect each new helper and record its owner,
call sites, and admission reason. If the reason is weak, inline or delete it.

### Static analysis and lint policy

- `bun run check` is authoritative for Ultracite/Oxlint formatting and
  type-aware linting; `oxlint.config.ts` is the root rule authority.
- `bun run knip` rejects dead files, exports, and dependencies. Do not retain an
  abstraction merely because it may be used later.
- Package and app `check-types` commands plus the configured Effect language
  service must remain clean.
- Do not add broad lint disables, ignore patterns, `eslint-disable`,
  `oxlint-disable`, `@ts-ignore`, `@ts-expect-error`, unsafe casts, or config
  exceptions to land the work. A narrow suppression requires an adjacent
  reason and must not hide Effect, promise, hook, accessibility, or schema
  failures.
- The Eve tool filename-case exception is local to Eve's filesystem convention
  and is not precedent for disabling other rules.
- Lint cannot prove good Effect ownership or detect helper sprawl; those remain
  mandatory manual audit checks.
- Tests use `@effect/vitest` with explicit memory/mock Layers and schema failure
  assertions at public boundaries.

Every implementation task requires three parent audit passes before
acceptance: ownership/call graph, Effect implementation quality, and
verification coverage. The dedicated final 3-pass audit sweep was completed,
and its trusted-local Layer export finding was fixed before acceptance.

## Frontend And React Applicability

This SPEC adds no React route or operator UI. Do not introduce one as incidental
scope. Any later visible account, connection, or proxy-status surface requires
a SPEC amendment or a new SPEC and must follow
`docs/architecture/frontend-composition.md`.

That future work must:

- compose visible structure as primitive -> composite -> layout -> route;
- let leaf components own the data, command, loading, empty, error, retry, and
  skeleton behavior for the exact fragment they render;
- avoid prop-drilling query results, ids, loading flags, derived options, and
  command callbacks through unrelated ancestors;
- avoid nested feature wrappers, boolean-prop matrices, controller components,
  and component/helper aliases that exist only to shorten JSX;
- derive render values directly instead of mirroring props/query data into
  state, and use React effects only to synchronize with external systems;
- prefer explicit children/slots and narrow domain props over generic callback
  bags and presentation-flag matrices;
- keep Effect runtimes, services, Layers, Config, credentials, and provider
  clients out of render functions and browser bundles;
- expose Schema-owned serializable contracts at route/loader/RPC boundaries
  rather than duplicating package DTOs in components;
- verify accessibility, focus/keyboard behavior, responsive layout, stable
  loading dimensions, long content, and error states with browser evidence at
  desktop and mobile widths.

## Verification

Automated gates:

- `bun run --filter @bundjil/codex-oauth check-types`
- `bun run --filter @bundjil/codex-oauth test`
- `bun run --filter @bundjil/codex-oauth build`
- `bun run --filter @bundjil/codex-proxy check-types`
- `bun run --filter @bundjil/codex-proxy test`
- `bun run --filter @bundjil/codex-proxy build`
- `bun run --filter @bundjil/codex-proxy smoke-test`
- `bun run verification`
- `git diff --check`

Required deterministic tests:

- authorization URL protocol fields and least-privilege scopes;
- state entropy/validation, PKCE S256, callback path/method validation;
- callback timeout, denial, missing code, state mismatch, and port conflict;
- code exchange success without `expires_in`, access-JWT expiry decoding, and
  safe provider/schema failures;
- ID token is not persisted and account metadata is never exposed;
- refresh-capable encrypted profile contains no plaintext token markers;
- legacy-profile decode/migration behavior and required subscription fields;
- proactive refresh skew, rotating refresh replacement, lock contention,
  winner re-read, lock expiry during exchange, fenced stale-write rejection,
  concurrent login replacement, stale permanent-failure rejection, and
  owner-only release;
- permanent refresh failure marks reauthentication and does not loop, while
  transient refresh failure leaves the stored profile unchanged;
- one forced 401 refresh/replay and no replay for unrelated errors;
- mock/local mode preservation and live config failure safety.

Required opt-in live proof, with values suppressed:

- local browser sign-in completes through the loopback callback;
- sanitized result confirms refresh capability and encrypted persistence;
- Upstash readback proves a versioned ciphertext envelope and no token, code,
  verifier, state, account-id, or ID-token markers;
- preview health is live, unauthorized/invalid-token calls are 401, and a
  private authenticated request streams SSE with `[DONE]`;
- a controlled near-expiry or test-profile proof exercises hosted refresh;
- concurrent proof requests use safe observer counters/booleans to prove one
  refresh winner and no stale overwrite without recording revision values;
- permanent-failure behavior is proven against deterministic token endpoints
  and an isolated proof profile, not by damaging the owner's working profile;
- Vercel logs contain no credentials, callback query, raw provider payload,
  prompt, request body, or full model response;
- no production deploy occurs without a later explicit approval.

## Documentation Deliverables

Update the root README, `docs/README.md`, package/app READMEs, Effect/repository
architecture guides, testing guide, this SPEC, task ledger, and active plan.
After refresh-capable live proof passes, mark the access-token-only workaround
as superseded for normal operation while retaining its rollback instructions.

Documentation must distinguish:

- official OpenAI documentation and `openai/codex` source behavior;
- community interoperability evidence;
- Bundjil's personal experimental use of the subscription backend;
- the OpenAI Platform API requirement for public or multi-user products.

## Risks And Mitigations

- **Protocol drift:** revalidate current `openai/codex` source before each live
  proof; keep constants centralized and test authorization URL shape.
- **Ambiguous product support:** keep the feature personal, private, and
  single-owner; do not describe it as a general third-party OAuth product.
- **Credential exfiltration:** local-only callback, encrypted profile store,
  redacted contracts, no raw payload logs, and ciphertext readback checks.
- **Refresh-token race:** distributed lock, profile re-read under lock,
  fenced-CAS encrypted winner write, and lease-expiry/concurrent tests.
- **Callback interception:** loopback-only bind, random state, PKCE S256,
  strict path/method validation, timeout, one-shot completion, scoped close.
- **JWT misuse:** narrow schema extraction only after direct token exchange;
  do not use unverified claims as an independent identity decision.
- **Backend instability:** isolate request mapping and auth client behind
  package services; fail closed and retain Gateway/mock rollback.
- **Subscription misuse:** no pooling, resale, multi-user service, or public
  gateway; revisit terms and current official docs before production.

## Rollback

- Set preview `BUNDJIL_CODEX_PROXY_MODE=mock` and deploy another preview.
- Remove the encrypted refresh-capable profile from Upstash.
- Rotate the Bundjil encryption key and private proxy token if exposure is
  suspected.
- Disconnect/revoke Codex access through current ChatGPT account controls when
  provider-side revocation is required.
- Restore the accepted access-token-only importer only as a temporary personal
  fallback.
- Keep Eve on AI Gateway.

## Spec Review Record

- Revision 1, 2026-07-12: official authentication docs, Executor Personal
  DeepWiki research on `openai/codex`, and local inspection of
  `opencode-openai-codex-auth` corrected the hosted-redirect assumption and
  established the local-broker/hosted-refresh design.
- Revision 2, 2026-07-12: the first independent auth/security review removed
  the `expires_in` assumption, required access-JWT expiry decoding, classified
  the official/community scope discrepancy, tightened transient versus
  permanent refresh failure semantics, and confirmed that no hosted browser
  route or durable PKCE state store belongs in the design.
- Revision 3, 2026-07-12: the second independent Effect/task review required
  explicit legacy/subscription profile variants, fenced-CAS profile mutation,
  revision-aware 401 recovery, first-party refresh transport/port/scope parity,
  concrete local service layers, safe proof instrumentation, explicit route
  error/readiness semantics, and progressive task dependencies.
- Revision 4, 2026-07-13: the completion review reconciled the SPEC with the
  implemented split between trusted-local login, OAuth HTTP transport, and the
  hosted refresh adapter; added enforceable linear-Effect, helper-admission,
  lint/suppression, runtime/Layer-boundary, and React leaf-composition rules;
  and linked the new durable frontend composition guide. No frontend was added
  to this backend-only scope.
- Revision 5, 2026-07-13: the adversarial implementation review corrected
  remaining pre-implementation language and stale Eve/proof gates, aligned the
  authorization-session, profile-union, fenced-write, read/write persistence,
  login, and refresh call graphs with the committed schemas and services, and
  tightened typed error, lint-suppression, derived-state, effect, and component
  API rules.
