# Sendblue Eve Channel

- Status: Complete - single Production ingress and handset path verified
- Owner: `apps/agent`
- Last reviewed: 2026-07-20

## Decision

Implement Sendblue as an app-owned custom Eve channel at
`apps/agent/agent/channels/sendblue.ts`. Keep the Eve file thin: it adapts Eve
route/event callbacks to named Effect programs and does not own parsing,
authentication, identity policy, persistence, or provider HTTP calls.

The first slice supports direct, text-only inbound messages from explicitly
mapped senders and delivers completed assistant messages back through
Sendblue. It verifies Sendblue's configured `sb-signing-secret` in constant
time before decoding the body, atomically claims inbound `message_handle`
values, derives stable Eve principals and continuation tokens through an
identity/routing service, and atomically claims outbound Eve message events
before calling Sendblue.

Sendblue calls its header value a signing secret, but the documented protocol
is a shared secret copied into `sb-signing-secret`; it is not a body HMAC. The
implementation must describe and test the real mechanism without claiming
cryptographic body signing that the provider does not supply.

## Later Typing Extension

This document preserves the historical first channel slice, whose visible
output was completed assistant text only. The completed follow-on
[Sendblue Typing Indicators](./sendblue-typing-indicators.md) SPEC adds an
app-owned Effect-typed lifecycle without changing this channel's authentication,
identity, routing, replay, delivery, or single-Production-webhook ownership.
After accepted inbound policy and replay claiming, the current channel starts a
bounded provider indicator, persists `Pending`, adopts it as `Active(turnId)`
on Eve `turn.started` without a duplicate request, and attempts a stop before
terminal visible delivery. Provider `SENT` remains distinct from direct handset
visibility; both runtime/provider evidence and explicit handset observation are
recorded in the follow-on SPEC.

## Corrective Routing Decision

Sendblue receive webhooks are account-level fan-out destinations. They are not
environment selectors and do not route one inbound message to only one Vercel
target. A shared Sendblue account/line must therefore have exactly one active
receive webhook for normal operation. Production owns that webhook at the
stable `bundjil-agent.vercel.app` route. Preview may retain encrypted
configuration and immutable historical proof, but it must not retain active
provider ingress, a Sendblue-specific automation bypass, or any claim that it
is independently live on the shared account/line.

Live investigation on 2026-07-16 found both the immutable Preview deployment
and stable Production route registered as receive webhooks. One handset
message reached Preview and Production within two seconds and both returned
`202`. Their separate replay stores correctly deduplicated only within each
environment; they could not deduplicate across deployments. The deterministic
sender/line continuation token also resumed an older Preview conversation,
which made the reply appear to be routed to Preview.

The corrective slice must:

1. snapshot a sanitized provider inventory and bounded log/run baselines;
2. delete only the Preview receive webhook by exact provider value without
   printing or persisting the protected URL;
3. revoke the dedicated Preview Sendblue automation bypass after provider
   readback proves the Preview webhook is absent;
4. retain the stable Production receive webhook, route secret, Production
   bypass, durable replay configuration, and current deployment unchanged;
5. prove one subsequent handset message reaches Production exactly once and
   produces no Preview webhook request, Preview run update, Preview model/tool
   execution, or duplicate outbound; and
6. reconcile current docs while preserving the earlier two-webhook rollout
   evidence explicitly as historical evidence, not an accepted invariant.

### 2026-07-16 Corrective Execution Record

- A trusted Executor Personal pre-mutation inventory found exactly two receive
  entries: one known immutable Preview host and the stable Production host, with
  no unknown receive host.
- Inside the same provider execution, the exact Preview receive entry was
  deleted with type `receive`. Its protected value was not retained. Immediate
  readback found exactly one receive entry: `bundjil-agent.vercel.app`.
- After that readback, Vercel revoked exactly one bypass labeled for the Preview
  Sendblue receive webhook. The bypass inventory changed from six to five; the
  distinct Production Sendblue bypass remains present.
- Direct Production route probes after the mutation returned `401` for both a
  missing signing secret and an invalid signing secret. An authenticated
  malformed probe then returned `400` with curl exit `0` through one ephemeral
  interactive shell: the labeled Production webhook secret and populated
  current Production bypass field stayed in shell memory, curl received its
  URL and signing-secret header only through stdin config, the response was
  discarded, and the shell unset both values before exit. A bounded post-change
  window contained the two `401` Production requests, no Preview runtime
  request, and zero Agent Runs in either environment.
- Production Executor MCP initialized and listed exactly `skills`, `execute`,
  and `resume`. Historical readback exposed only the four reviewed GitHub
  operations because Production's final catch-all block masked its separately
  selected configured catalog; it was not evidence of Preview endpoint binding.
  The completed Executor policy-scope correction removed Production's
  `executor.*` connection pattern and final block, leaving 16 selected
  non-Executor namespaces, four GitHub overrides, and no Executor
  administration exposure.
  Endpoint and credential values were not retained.
- The accepted handset window from 12:03:30Z through 12:09:30Z contained one
  `RECEIVED` iMessage inbound, one Production Sendblue webhook request, one
  accepted Production turn, and one `DELIVERED` iMessage outbound. Production
  made two successful proxy completions for the single tool-use turn: one
  model step selected/discovered tools and the continuation produced the final
  reply. Preview had zero requests, and the user confirmed the response found
  the broader non-GitHub catalog. No content, number, handle, URL, credential,
  provider body, prompt, tool output, or model output was retained.
- A post-request bounded readback from 11:10Z through 11:21Z found zero
  Sendblue inbound/outbound records, zero Production/Preview runtime requests,
  zero Production/Preview Agent Runs, and zero Production proxy runtime logs.
  It proves only that no new handset proof occurred in that interval.

Future Preview channel testing requires a different Sendblue account/line. A
temporary shared-line cutover is permitted only inside an explicit maintenance
window that disables Production ingress before enabling Preview and restores
the single Production webhook before the window closes. Simultaneous Preview
and Production receive webhooks on one account/line are forbidden.

### Corrective Rollback And Monitoring

- Keep the pre-mutation provider inventory only as sanitized count/host
  classification evidence. The exact protected values remain in their existing
  provider and secret stores.
- If deletion or immediate readback does not yield exactly one stable
  Production receive webhook, stop before any handset proof. Restore the known
  Production entry from its operator-owned secret record if it is absent; do
  not add Preview while Production remains registered.
- If Production route/model/outbound proof fails after Preview removal, keep
  Preview disabled and investigate the Production path. An emergency Preview
  cutover must first disable Production ingress and must be explicitly recorded
  as a time-bounded maintenance state.
- Revoke the Preview bypass only after successful webhook readback. Failure to
  revoke it does not restore ingress, but it blocks task acceptance and requires
  retry/rotation before completion.
- After acceptance, provider inventory is an operational invariant: receive
  count must equal one and the parsed host must equal the stable Production
  host. Any count/host drift is an incident. Monitoring records only the count,
  host classification, timestamp, and pass/fail result.

## Governing Architecture And Change Admission

The correction is governed by:

- `docs/architecture/effect-patterns.md` for Schema ownership, tagged errors,
  flat Effect control flow, Config/Redacted, Layers, executable edges, helper
  admission, and the three-pass audit;
- `docs/architecture/repo-structure.md` for the `apps/agent` Sendblue boundary
  and prohibition on speculative workspace packages;
- `docs/architecture/testing-and-quality.md` for targeted, live, leak-safe, and
  repository verification; and
- `docs/architecture/frontend-composition.md` if visible UI scope is ever
  proposed.

The expected corrective diff is provider state plus documentation and ledger
evidence. It does not need a runtime source change, provider-admin package,
generalized webhook router, cross-environment replay service, dashboard, or
React route. Before editing TypeScript, TSX, package metadata, lint config, or
runtime config, the implementer must identify a concrete failed acceptance
criterion that cannot be resolved operationally and amend this SPEC first.

If a committed proof command is justified after that amendment:

- keep it at the `apps/agent` executable/operator edge and reuse the existing
  Sendblue schemas, tagged errors, services, and config owner;
- introduce a new Schema only for a genuinely new persisted or
  boundary-crossing sanitized evidence contract, derive its type with
  `typeof SchemaName.Type`, and reject raw provider DTO mirrors;
- decode provider `unknown` once with `Schema.decodeUnknownEffect`, encode
  stored/output evidence with Effect Schema, and never use `JSON.parse`,
  `JSON.stringify`, structural assertions, or manual property readers;
- implement the primary operation as one named `Effect.fn`/flat `Effect.gen`
  success path: load redacted config -> acquire the existing dependency ->
  decode -> validate invariant -> perform one mutation -> read back -> encode
  sanitized evidence;
- handle expected tagged failures once in the outer `.pipe(...)` with
  `catchTag`, `catchTags`, or `mapError`, and attach one operation span there;
- provide live or deterministic test Layers at the composition root; never
  construct Layers, call `Effect.runPromise`, or read `process.env` inside a
  domain operation; and
- keep one-off target selection, host classification, and evidence projection
  inline unless an abstraction passes the documented helper-admission test.

The existing `SendblueChannel`, verifier, identity directory, session router,
replay store, client, canonical Schemas, tagged errors, and live/memory Layers
remain the runtime authority. Do not add a nominal `WebhookRoutingService`,
`SendblueAdminService`, mapper layer, static-class namespace, or generic proof
framework merely to make the operator sequence look architectural.

## Production Evidence Boundary

The later Production promotion accepted the route matrix, provider ingress,
one 15-event Eve replay through waiting, one private proxy completion, one
`DELIVERED` outbound, and replay suppression without a second dispatch or
delivery. That rollout retained separate Preview and Production webhook
credentials, replay stores, and automation bypasses, but the provider delivered
each account event to both registered receive URLs. The earlier conclusion that
these were independently routable is superseded by the corrective routing
decision above. Durable Upstash replay claims, Vercel platform bypass, and
route-level `sb-signing-secret` authentication remain distinct security
boundaries; none of them selects one provider webhook or deduplicates across
deployments. Only sanitized status/count evidence is retained. The earlier
Preview proof remains historical and is not rewritten as Production proof.

## Historical Implementation Inputs

The following context, configuration, Preview proof, and documentation
deliverables describe the original implementation slice. They remain historical
evidence and are not restated as current Production configuration.

## Context And Research

The installed Eve `0.20.0` custom-channel contract gives route handlers the raw
`Request`, `send`, `waitUntil`, and session helpers. A custom channel owns its
route authentication, continuation token, durable state, and outbound event
delivery. Eve's security model requires authentication before body-supplied
principal data is trusted.

Sendblue's current official documentation establishes:

- receive and outbound webhook types;
- per-webhook or global secrets carried in `sb-signing-secret`;
- inbound message fields including `message_handle`, `content`, direction,
  status, sender/recipient numbers, service, media, and group id;
- E.164 phone-number requirements;
- `message_handle` as the documented deduplication key;
- `POST /api/send-message` with `number`, `from_number`, and `content`;
- API authentication through `sb-api-key-id` and `sb-api-secret-key`;
- `200-299` acknowledgement and provider retry on unsuccessful delivery.

The ignored Vercel personal-agent template demonstrates where a Sendblue Eve
channel can live and how `message.completed` can trigger an outbound adapter.
It is reference material only. Bundjil will not copy its direct `process.env`
reads, manual object guards, process-local maps, permissive missing-secret
behavior, non-constant comparison, generic error logging, or unrelated app
identity/profile dependencies.

## Goals

- Accept authenticated Sendblue receive webhooks at a stable Eve custom route.
- Decode untrusted headers and payloads through canonical Effect Schema
  contracts before routing decisions.
- Map an allowed E.164 sender to a stable Eve user principal without using the
  request body as identity before authentication.
- Route each direct sender/Sendblue-line pair to one deterministic Eve
  continuation token.
- Prevent duplicate inbound dispatch and duplicate outbound delivery across
  provider retries, Vercel concurrency, and Eve event replay.
- Send completed assistant text back through a named Effect Sendblue client.
- Prove the complete behavior on a Vercel Preview deployment with one real
  inbound message and one real outbound reply.
- Keep logs, metrics, tests, and proof artifacts free of message content,
  credentials, and full phone numbers.

## Non-goals

- Group chats, media, reactions, read receipts, typing indicators, and HITL
  approval replies are not part of the first slice.
- Unknown senders are not auto-enrolled and do not start Eve sessions.
- Outbound-first campaigns and bulk messaging are not supported.
- Sendblue contracts do not move into `@bundjil/core` or
  `@bundjil/eve-effect` until a second channel or proven shared contract exists.
- The channel does not implement app login, Better Auth, WorkOS, contacts, or a
  profile UI.
- The channel does not disable project-wide Vercel Deployment Protection as its
  authentication mechanism.
- The first slice does not promise exactly-once provider delivery after an
  indeterminate network outcome because Sendblue's documented send endpoint
  has no client idempotency key.

## Ownership And File Shape

Verified app-owned shape:

```text
apps/agent/agent/
  channels/
    sendblue.ts                 thin Eve adapter only
  lib/
    sendblue/
      config.ts                   Effect Config and redacted secrets
      schemas.ts                  canonical app-owned contracts
      errors.ts                   schema-backed tagged-error exports
      errors/                     one class per file when required by lint
      webhook-verifier.service.ts provider-authentication boundary
      identity-directory.service.ts sender -> Eve principal policy
      session-router.service.ts   deterministic conversation key
      replay-claim-id-generator.service.ts deterministic/live claim-id boundary
      replay-store.service.ts     inbound and outbound atomic claims
      client.service.ts           Sendblue HTTP operations
      channel.service.ts          named inbound/outbound programs
      live.layer.ts               Vercel/Upstash/HttpClient composition
      memory.layer.ts             deterministic tests
```

This verified shape is not permission to create another file per tiny function.
Future work must colocate closely related contracts/errors/services when that
is clearer. Do not add `utils.ts`, `helpers.ts`, `mappers.ts`, `common.ts`,
pass-through services, or single-use wrappers. Each retained module/service
must continue to own a provider, security, persistence, serialization,
identity, deterministic-id, or multi-call policy boundary.

`agent/lib/` is Eve's supported import-only authored-code boundary; do not put a
direct `sendblue/` directory under the agent root because Eve will treat it as
an unsupported discovery entry. `apps/agent/agent/config.ts` remains the
model-provider config. Sendblue config belongs in its distinct
`lib/sendblue/config.ts` and is composed by the channel runtime; it must not
expand the root model config into a global env bag.

## Canonical Contracts

Effect Schema is the single source of truth. Current canonical contracts
include:

- `E164PhoneNumber`: branded, validated E.164 value;
- `SendblueMessageHandle`: branded non-empty provider identifier;
- `SendblueWebhookSecret`: redacted config value, never a payload field;
- `SendblueInboundMessage`: the minimal accepted receive-webhook schema;
- `SendblueIgnoredEvent`: schema for sanitized ignored-event outcomes;
- `SendbluePrincipalId` and `SendblueSenderIdentity`;
- `SendblueConversationKey`: opaque deterministic keyed digest, not raw phone
  numbers;
- `SendblueChannelState`: only the durable fields needed for replies, including
  conversation key, sender number, Sendblue line number, and safe principal id;
- `SendblueSendMessageInput` and `SendblueSendMessageSuccess`;
- `SendblueInboundClaimKey`, `SendblueOutboundClaimKey`,
  `SendblueReplayClaimId`, `SendblueReplayClaim`, and `ReplayClaimStatus`;
- `SendblueInboundDecision`, including the canonical `Ignore`, `Duplicate`, and
  `Dispatch` variants;
- `SendblueCompletedMessage`, `SendblueCompletedMessageResult`,
  `SendblueWebhookAcknowledgement`, and `SendblueProofResult`.

Schema-derived types use `typeof SchemaName.Type`. No SDK DTO, webhook object,
or Vercel response becomes a second domain type. Unknown provider fields are
discarded by boundary decoding.

Current tagged errors are:

- `SendblueConfigError`;
- `SendblueWebhookAuthenticationError`;
- `SendblueWebhookSchemaError`;
- `SendblueSenderNotAllowedError`;
- `SendblueRoutingError`;
- `SendblueReplayStoreError`;
- `SendblueRequestError` and `SendblueResponseError`;
- `SendblueDeliveryUncertainError` for timeout/network outcomes where retrying
  could duplicate a message.

Error payloads expose only the operation, a finite safe reason/status where the
caller needs it, and a sanitized message. Runtime causes are deliberately
discarded at provider/security boundaries when retaining them could expose
headers, credentials, message content, raw provider bodies, or full phone
numbers.

## Required Effect Code Shape

Effect Schema owns the provider contract and all derived types. This abridged
shape matches the verified current implementation; omitted identifiers are
imports from the canonical local schema/error modules:

```ts
import { Context, Effect, Layer, Schema } from "effect";

export class SendblueRequestError extends Schema.TaggedErrorClass<SendblueRequestError>()(
  "SendblueRequestError",
  {
    message: Schema.NonEmptyString,
    operation: Schema.Literal("sendMessage"),
    reason: Schema.Literal("requestEncoding"),
  }
) {}

export type SendblueClientError =
  | SendblueDeliveryUncertainError
  | SendblueRequestError
  | SendblueResponseError;

export interface SendblueClientShape {
  readonly sendMessage: (
    input: SendblueSendMessageInputType
  ) => Effect.Effect<SendblueSendMessageSuccessType, SendblueClientError>;
}

export class SendblueClient extends Context.Service<
  SendblueClient,
  SendblueClientShape
>()("@bundjil/agent/SendblueClient") {}

export const SendblueClientLive = Layer.effect(
  SendblueClient,
  makeSendblueClient
);
```

`makeSendblueClient` is the concrete `Effect.gen` Layer constructor beside the
service. It acquires `SendblueConfigService` and `HttpClient.HttpClient`, returns
`SendblueClient.of({ sendMessage: Effect.fn("SendblueClient.sendMessage")(...) })`,
and attaches the `SendblueClientLive` span in the outer pipe. It must not become
a generic factory or a wrapper around a single already-composable Effect.

The live client uses `HttpClientRequest.schemaBodyJson` and
`HttpClientResponse.schemaBodyJson`, not raw JSON encoding/decoding. Transport,
timeout, status, provider rejection, and response-schema failures are translated
once into the canonical app-owned tagged errors.

Inbound handling is deliberately two-phase because authentication, validation,
and the atomic claim must finish before the HTTP acknowledgement, while
Eve/model work continues under `waitUntil`. The authoritative implementation is
`apps/agent/agent/lib/sendblue/channel.service.ts`; it is one named
`Effect.fn("SendblueChannel.authorizeAndClaimInbound")` with this verified
linear sequence:

```text
yield SendblueWebhookVerifier + SendblueConfigService +
  SendblueIdentityDirectory + SendblueReplayStore + SendblueSessionRouter
-> verify headers before reading the body
-> Effect.tryPromise(request.text) with sanitized SendblueWebhookSchemaError
-> reject body larger than 131072 bytes
-> Schema.decodeUnknownEffect(Schema.fromJsonString(SendblueInboundMessage))
-> Match-classify typing/direction/status/group/media/content/service/line/loop
-> resolve allowlisted identity; convert only SenderNotAllowed to Ignore
-> SendblueSessionRouter.route(sender, configuredLine)
-> SendblueReplayStore.claimInbound(message_handle)
-> return canonical Ignore | Duplicate | Dispatch decision
```

Do not change the error payloads to retain Promise/Parse/provider causes. The
sanitized boundary error is intentional.

Classification of ignored direction/status/service/group/media cases stays in
this linear operation through Schema unions and `Match`; do not extract a
forest of `isX`, `getY`, and property-reader helpers. The only permitted split
is the real durability boundary:

```text
authorizeAndClaimInbound
  -> return Ignore | Duplicate | Dispatch decision
  -> Eve route maps decision to HTTP response
  -> waitUntil(dispatchAcceptedInbound(decision)) only for Dispatch
```

Expected route errors are handled in one outer pipeline:

```ts
channelRuntime.runPromise(
  Effect.gen(function* handleSendblueWebhook() {
    const sendblue = yield* SendblueChannel;
    const decision = yield* sendblue.authorizeAndClaimInbound(request);
    if (decision._tag !== "Dispatch") {
      return new Response(null, { status: 200 });
    }
    waitUntil(
      channelRuntime.runPromise(
        sendblue.dispatchAcceptedInbound(decision, () =>
          send(decision.message, {
            auth: decision.auth,
            continuationToken: decision.continuationToken,
            state: decision.state,
          })
        )
      )
    );
    return new Response(null, { status: 202 });
  }).pipe(
    Effect.catchTags({
      SendblueReplayStoreError: () =>
        Effect.succeed(new Response(null, { status: 503 })),
      SendblueRoutingError: () =>
        Effect.succeed(new Response(null, { status: 503 })),
      SendblueWebhookAuthenticationError: () =>
        Effect.succeed(new Response(null, { status: 401 })),
      SendblueWebhookSchemaError: () =>
        Effect.succeed(new Response(null, { status: 400 })),
    })
  )
);
```

The complete decision union, including `Ignore`, `Duplicate`, and `Dispatch`,
is the canonical app-owned `SendblueInboundDecision` Schema. Internal literals
use `satisfies SendblueInboundDecision` to preserve discriminants without
asserting an unvalidated structural type. The route deliberately returns empty
HTTP responses, so it does not invent a second JSON response DTO or schema.
Do not create a static-class namespace or helper object merely to construct
these values. The client exposes the canonical `SendblueClientError` union of
request, response, and uncertain tagged errors.

Provider wire Schemas deliberately retain documented names such as
`from_number`, `to_number`, and `message_handle`. If the implementation needs a
camelCase domain view, define one Schema transformation at the provider
boundary; do not add handwritten request/response mappers.

The Eve channel creates one app-owned `ManagedRuntime` at module scope and
invokes it only from the route/event adapter. Services never call
`Effect.runPromise`, construct their own runtime, or provide live Layers inside
primary operations.

## Historical Preview Configuration

Load configuration with Effect `Config`, the runtime environment provider,
`Config.redacted`, and Schema validation; tests inject a deterministic
`ConfigProvider`. At the historical implementation checkpoint, the accepted
Preview channel used these variables and Production had no Sendblue variables:

- `BUNDJIL_SENDBLUE_API_KEY` (redacted);
- `BUNDJIL_SENDBLUE_API_SECRET` (redacted);
- `BUNDJIL_SENDBLUE_WEBHOOK_SECRET` (redacted, mandatory and fail-closed);
- `BUNDJIL_SENDBLUE_FROM_NUMBER` (E.164);
- `BUNDJIL_SENDBLUE_SENDER_IDENTITIES` (redacted schema-encoded mapping from
  E.164 sender to stable principal id);
- `BUNDJIL_SENDBLUE_ROUTING_KEY` (redacted key for conversation digests);
- `BUNDJIL_SENDBLUE_REPLAY_STORE_URL` (redacted, preferred replay URL);
- `BUNDJIL_SENDBLUE_REPLAY_STORE_TOKEN` (redacted, preferred replay token);
- `BUNDJIL_SENDBLUE_REPLAY_STORE_PREFIX`;
- `BUNDJIL_SENDBLUE_REPLAY_STORE_TTL_SECONDS`;
- `BUNDJIL_SENDBLUE_REPLAY_STORE_LEASE_SECONDS`;
- `BUNDJIL_SENDBLUE_ALLOWED_SERVICES` (optional, defaults to `iMessage`).

The replay URL/token prefer their app-owned names and fall back only to the
Preview Marketplace `KV_REST_API_URL` and `KV_REST_API_TOKEN` inputs. The
provider API defaults to `https://api.sendblue.com`; the only override is
`BUNDJIL_SENDBLUE_TEST_API_BASE_URL` with
`BUNDJIL_SENDBLUE_TEST_MODE=true` in tests/local fixtures. The channel fails
closed when any required secret, identity mapping, line, or replay store is
missing.

## Webhook Authentication And Parsing

The route is `POST /eve/v1/sendblue/webhook`. The build-output test rejects
accidental root `/webhook` exposure.

Processing order is mandatory:

1. Require `POST`, HTTPS at the deployed edge, and a configured webhook secret.
2. Read `sb-signing-secret` and compare its bytes with the configured secret in
   constant time. Normalize neither secret. Length mismatch is an auth failure.
3. Return sanitized `401` on missing/mismatch. Do not parse or log the body.
4. Read the body once, enforce a small maximum size, and decode it with
   `Schema.fromJsonString(SendblueInboundMessage)` or the equivalent Effect
   Schema JSON codec.
5. Classify direction/status/service/group/media/content using `Match` or
   schema unions. Only a direct, text-bearing, non-outbound `RECEIVED` event for
   an allowed service can continue.
6. Verify `to_number`/`sendblue_number` corresponds to the configured line and
   `from_number` is not the Sendblue line. This prevents route confusion and
   outbound loops.
7. Map the authenticated sender through `SendblueIdentityDirectory`. Unknown
   senders receive a `2xx` ignored acknowledgement, no Eve session, and a
   sanitized metric; do not disclose enrollment policy over the webhook.

The route returns `200` for valid ignored events and already-claimed duplicate
events, `202` after an accepted dispatch is scheduled, `400` for authenticated
malformed payloads, `401` for auth failure, and `503` when replay or routing
cannot safely proceed.

## Replay Protection

Process-local `Map`/`Set` state is forbidden. Vercel instances are concurrent
and ephemeral.

`SendblueReplayStore` is an app-owned Effect service with explicit memory and
Upstash live Layers. Its live `claim` operation must be a single atomic provider
operation such as Redis `SET key value NX EX`, not the default non-atomic
get-then-set implementation of Effect `KeyValueStore.modify`.

Inbound claim key:

```text
sendblue:inbound:<environment>:<message_handle_digest>
```

Claim before calling Eve `send`. If the durable Eve dispatch fails before a
session is accepted, the owner-fenced `retryable` operation compare-and-deletes
the claim and releases it for a later provider retry. If dispatch is accepted,
mark it complete and retain it longer than Sendblue's retry horizon. Never clear a
completed claim merely because outbound delivery later fails.

Outbound claim key uses stable Eve event coordinates available in
`message.completed`:

```text
sendblue:outbound:<environment>:<session_id>:<turn_id>:<step_index>:<sequence>
```

Claim before `POST /api/send-message`. On a successful Sendblue response,
persist the provider `message_handle` and terminal state. On an indeterminate
network/timeout result, mark the claim `uncertain`, emit an alert, and do not
automatically resend. An operator can inspect Sendblue by the safe correlation
record before deciding to retry. This trades possible omission for protection
against duplicate personal messages when the provider accepted a request but
the response was lost.

Replay records contain hashes/opaque ids and status metadata only, never
message text, API credentials, or full phone numbers.

## Sender Identity And Session Routing

Identity is policy, not a body-field rename:

1. Authenticate the provider request.
2. Decode and normalize the E.164 sender.
3. Resolve it through the configured identity directory.
4. Construct Eve auth only from the resolved identity:

```text
authenticator: "sendblue"
principalType: "user"
principalId: <stable configured principal id, e.g. "owner">
attributes: channel-safe non-PII metadata only
```

The raw phone number is required in private channel state for the provider
reply, but must not become the Eve principal id or observability metadata.

`SendblueSessionRouter` derives a deterministic opaque conversation key from
the normalized sender plus configured Sendblue line using a keyed digest. That
key is the raw channel-local `continuationToken`; Eve adds the channel namespace.
One direct sender/line pair therefore resumes one Eve session. Group ids are
not accepted in the first slice.

The route calls Eve `send` through `waitUntil` only after authentication,
schema validation, identity resolution, and atomic claim succeed. The response
acknowledges accepted durable dispatch without waiting for model completion.

## Outbound Replies

`SendblueClient` is a named Effect service. The initial live operation is:

```text
sendMessage(SendblueSendMessageInput)
  -> Effect<SendblueSendMessageSuccess, SendblueRequestError | SendblueResponseError | SendblueDeliveryUncertainError>
```

The live Layer uses Effect HTTP client primitives or a wrapped third-party SDK
behind `Effect.tryPromise`; raw `fetch` does not leak into the channel file.
Requests send `sb-api-key-id` and `sb-api-secret-key`, and the body is encoded
from the canonical schema. Responses are decoded from the canonical schema.

Only `message.completed` with non-empty visible assistant text is delivered.
Reasoning, tool payloads, intermediate tool-call text, headers, and errors are
never sent. The outbound idempotency key uses Eve's
`session.id + turnId + stepIndex + sequence`. Long text is split only if a
verified Sendblue limit requires it; splitting then becomes a schema-owned
delivery plan with a deterministic part index. The current official OpenAPI
limit is 18,996 characters, so v1 may reject over-limit output with a safe
failure rather than introduce speculative chunking.

Status callbacks and outbound webhooks are ignored by the receive route and do
not create sessions. A later delivery-status slice may add a separate route and
state transition.

## Historical Vercel Preview Proof

The Preview deployment remains protected while Sendblue reaches the route with
a dedicated Vercel Protection Bypass for Automation. This bypass is independent
platform authentication; the app always additionally verifies the separate
`sb-signing-secret` shared header secret. That header is not a body HMAC.

Requirements:

- Use an immutable Preview deployment URL or a controlled Preview alias.
- Store the Vercel bypass and Sendblue webhook secrets only in provider/Vercel
  configuration. Never commit or print the full webhook URL.
- Configure Sendblue's `receive` webhook as an object with its own secret.
- Historical Preview input: use a Preview-specific sender identity map, line,
  routing key, and replay prefix.
- Rotate/revoke the automation bypass after proof if the URL was exposed in
  operator history or logs; Vercel requires redeployment after bypass-secret
  rotation.

Mandatory live proof matrix:

| Case                                          | Expected result                                    |
| --------------------------------------------- | -------------------------------------------------- |
| Missing `sb-signing-secret`                   | `401`, no decode, no claim, no session             |
| Wrong secret                                  | `401`, no decode, no claim, no session             |
| Authenticated malformed body                  | `400`, no claim/session                            |
| Unknown sender                                | `2xx` ignored, no session/reply                    |
| Outbound/status/typing/group/media-only event | `2xx` ignored, no session/reply                    |
| Valid direct inbound text                     | one claim, one Eve session dispatch                |
| Same `message_handle` replayed concurrently   | `2xx` duplicate, no second dispatch                |
| Eve completed reply                           | one Sendblue send and one provider handle recorded |
| Same Eve event replayed                       | no second provider send                            |
| Provider timeout/unknown result               | outbound claim `uncertain`, no auto-resend         |

Historical accepted proof is the READY immutable Preview deployment
`dpl_C2Xg1F8H8KFiARopc59WeDwKV7tQ` from commit
`fdb71a87e930899aea1e75dd1f7a417f6c7a307e`. It established the
`401`/`400`/`200`/`202` route matrix, a temporary isolated `503` storage
fixture, one provider-originated inbound to one delivered outbound, and
sequential plus concurrent synthetic and real-handle replay suppression.
Runtime logs in the proof window had no error or fatal entries. Evidence keeps
only deployment ids, status codes, counts, and a short opaque digest; it omits
message text, full phone numbers, protected URL, provider body, replay payload,
credentials, and ciphertext. At this historical checkpoint, Production
variables, deployment, aliases, storage, and webhooks remained untouched.

## Corrective Acceptance Matrix

The provider mutation is accepted only when all evidence below is captured in
sanitized form. Baseline and post-change windows must be bounded by timestamp,
deployment, and target. Do not infer absence from an unfiltered log query.

| Check                            | Required result                                                                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-mutation provider inventory  | Exactly two receive entries: the known Preview host and stable Production host                                                                                                                                         |
| Deletion selection               | Exact Preview entry selected inside the trusted provider execution; no URL, query credential, or secret emitted                                                                                                        |
| Post-deletion provider inventory | Exactly one receive entry and its parsed host is `bundjil-agent.vercel.app`                                                                                                                                            |
| Production route probes          | Existing `401`/`401`/`400` authentication/schema matrix remains unchanged                                                                                                                                              |
| Preview ingress                  | Zero Sendblue webhook requests after the provider deletion timestamp                                                                                                                                                   |
| Handset inbound                  | Exactly one Production webhook `2xx` and one accepted Production Eve dispatch                                                                                                                                          |
| Agent/model execution            | Exactly one Production turn reaches terminal waiting/completed state; every proxy completion in its tool-use sequence is correlated (two successful completions in the accepted proof)                                 |
| Executor authority               | Production endpoint is distinct from Preview; MCP exposes only `skills`, `execute`, `resume`; 16 selected non-Executor namespaces are visible, four GitHub overrides remain, and Executor administration count is zero |
| Outbound delivery                | Exactly one subsequent Sendblue outbound reaches the accepted terminal provider state                                                                                                                                  |
| Duplicate/race check             | No second webhook dispatch, unrelated model cycle, duplicate tool execution, or duplicate outbound appears; multiple model completions are allowed only inside the correlated single-turn tool loop                    |
| Leak check                       | No content, full number, handle, protected URL, query credential, token, secret, prompt, or model output is retained                                                                                                   |
| Repository gate                  | Focused agent checks and `bun run verification` pass from a clean tracked state                                                                                                                                        |

The current Production Executor toolkit is a separate least-privilege boundary.
The agent connection exposes Executor's `skills`, `execute`, and `resume` MCP
methods; provider operations are discovered inside `execute`. This correction
must verify the Production endpoint and policy-scope correction but must not
copy Preview authority or treat a model's incomplete tool summary as provider
inventory. Preview remains limited to its four GitHub operations plus a final
catch-all block. Production retains its independent endpoint/key and selected
configured catalog, has removed its `executor.*` connection pattern and
accidental final catch-all block, and uses tool-declared defaults plus
explicit reviewed overrides. That is an accepted temporary model-mode risk for
other selected provider operations, not proof that unenumerated dangerous
classes are hard-blocked. Executor toolkit, policy, key, credential, OAuth, and
connection administration remain hard-denied through `executor.*` removal; a
future operation-level policy-hardening SPEC is required for broader hard-block
claims.

## Call Graphs

### Corrected Production Runtime

```text
Sendblue account + shared iMessage line
  -> exactly one receive webhook: stable Production host
  -> Vercel Production automation bypass
  -> apps/agent/agent/channels/sendblue.ts POST route
  -> module-owned ManagedRuntime<SendblueChannel>
  -> SendblueChannel.authorizeAndClaimInbound
  -> SendblueWebhookVerifier -> SendblueConfigService -> Effect Schema decode
  -> SendblueIdentityDirectory -> SendblueSessionRouter.route
  -> SendblueReplayStore.claimInbound(message_handle)
     -> SendblueReplayClaimIdGenerator -> Production Upstash atomic claim
  -> Eve Production send(...) via waitUntil
  -> Codex proxy model and Production Executor MCP connection
  -> message.completed
  -> SendblueReplayStore.claimOutbound
  -> SendblueClient.sendMessage
  -> one Sendblue outbound
```

### Corrective Provider Operation

```text
trusted operator -> Executor Personal Sendblue connection
  -> getWebhooks
  -> select exact receive entry by parsed Preview host inside execution
  -> deleteWebhooks({ type: "receive", webhooks: [exactPreviewValue] })
  -> getWebhooks
  -> emit only count + parsed host + success/failure status
  -> Vercel revoke dedicated Preview Sendblue automation bypass
  -> bounded Production/Preview log and Agent Run verification
```

No committed provider-admin helper is expected. If implementation introduces a
CLI or proof command, its provider responses and evidence are canonical Effect
Schemas; Config/Redacted owns credentials; expected failures are tagged errors
handled in `.pipe(...)`; and `Effect.runPromise` remains at the executable edge.
One-off selection and redaction remain linear in that command rather than
creating provider-admin services, DTO mirrors, readers, mappers, or helper
modules.

### Historical Preview Runtime

```text
Sendblue receive webhook
  -> Vercel Deployment Protection / automation bypass
  -> apps/agent/agent/channels/sendblue.ts POST route
  -> SendblueChannel.authorizeAndClaimInbound
  -> SendblueWebhookVerifier (constant-time sb-signing-secret check)
  -> Schema JSON decode: SendblueInboundMessage
  -> SendblueIdentityDirectory
  -> SendblueSessionRouter
  -> SendblueReplayStore.claimInbound (Upstash atomic NX + TTL)
  -> Eve send(message, auth, continuationToken, state) via waitUntil
  -> Eve agent/model/tools
  -> message.completed(event, channel, ctx)
  -> SendblueChannel.deliverCompletedMessage
  -> SendblueReplayStore.claimOutbound
  -> SendblueClient.sendMessage
  -> Sendblue POST /api/send-message
  -> SendblueReplayStore.complete(provider message handle)
```

Live Layer composition:

```text
SendblueChannelRuntimeLive
  -> SendblueChannelLive
  -> sendblueServicesLive = Layer.mergeAll(
       SendblueWebhookVerifierLive,
       SendblueIdentityDirectoryLive,
       SendblueSessionRouterLive,
       SendblueReplayStoreUpstashLive,
       SendblueClientLive
     )
  -> Layer.provideMerge(SendblueConfigLive)
  -> Layer.provideMerge(FetchHttpClient.layer)
  -> SendblueReplayClaimIdGeneratorLive at replay-store composition
  -> node:crypto timingSafeEqual at verifier implementation boundary
```

### Tests

```text
Vitest signed webhook fixture
  -> thin Eve route adapter
  -> SendblueChannel
  -> injected SendblueConfigService
  -> SendblueWebhookVerifierLive with deterministic secret
  -> SendblueIdentityDirectoryLive over injected config
  -> SendblueSessionRouterLive with fixed key
  -> SendblueReplayStoreMemory with injected SendblueReplayClaimIdGenerator
     and atomic test semantics
  -> fake Eve send
  -> SendblueClientMemory / injected HttpClient
  -> captured sanitized outcomes
```

Concurrency tests must race identical inbound claims and outbound claims and
prove one winner. Memory test semantics must model the live atomic contract,
not hide races behind sequential test setup.

### Historical CLI And Preview Operations

```text
No committed Sendblue provisioning CLI exists. Historical operator-only
provider actions created or rotated the Preview webhook and its bypass/route
secrets; they did not run inside the app. Those credentials were independent,
but the webhook destination was not independently routed by Sendblue. Local CLI
verification starts `eve dev --no-ui` with ignored configuration and runs
focused tests. The accepted provider proof used a temporary private operator
surface and retained only the sanitized results stated above.
```

Any future CLI is an executable edge: it may run `Effect.runPromise` or a
`ManagedRuntime`; services and domain operations may not.

## Effect Implementation Rules

- Primary operations such as `handleInbound`, `claimInbound`,
  `deliverCompletedMessage`, and `sendMessage` are named, flat `Effect.gen` or
  `Effect.fn` programs.
- Keep the success path linear. Handle tagged expected errors in `.pipe(...)`
  with `catchTag`, `catchTags`, or `mapError`.
- Use `Schema`, `Data`, `Context.Service`, `Layer`, `Config`, `Redacted`,
  `Match`, `Clock`, `Effect` crypto/platform primitives, and Effect HTTP APIs
  before plain helpers.
- JSON request/response boundaries use `Schema.fromJsonString(...)` or the
  canonical Effect Schema codec. No `JSON.stringify`, `JSON.parse`, manual
  object readers, `in`-property guards, or duplicate DTOs.
- Secret comparison is constant time and receives `Redacted` values only at
  the verifier boundary.
- No direct `process.env`, raw fetch, process-local replay maps, unsafe casts,
  `instanceof` error branching, broad lint suppression, or swallowed errors.
- The Eve adapter may call `Effect.runPromise`/a single app-owned
  `ManagedRuntime` at its framework edges. It must not reimplement service
  logic.
- Every abstraction must survive the helper-admission test in
  `docs/architecture/effect-patterns.md`; inline one-off transforms and remove
  pass-through wrappers.

## Helper And Static-Analysis Gate

Helper sprawl is forbidden. Audit every new function, file, service, mapper,
adapter, hook, and wrapper. Keep it only for multiple concrete call sites or a
real provider, security, atomic-persistence, serialization, resource, or
policy boundary. Inline single-use predicates, property readers, object
reshapers, `Effect.map` aliases, and response constructors. Do not create
`utils`, `helpers`, `common`, `shared`, or speculative channel abstractions.

The initially suggested file shape is a maximum separation map, not a quota.
Combine contracts/errors or closely related services when separate files would
only create navigation and export noise. Conversely, do not collapse provider
HTTP, signature verification, and atomic replay behavior into the Eve channel
file: those are independently testable boundaries.

Static-analysis requirements:

- run `bun run check`, focused typechecks/tests, `bun run knip`, and final
  `bun run verification`;
- inspect Effect language-service diagnostics for every changed TypeScript file
  and resolve all actionable hints;
- do not weaken lint rules, expand ignore patterns, or add broad
  `oxlint-disable`, `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`
  directives;
- a narrow suppression requires an adjacent explanation, focused test, and
  audit evidence;
- structural assertions, `any`, non-null assertions used to bypass decoding,
  and `instanceof` error branching are forbidden. `as const` and `satisfies`
  are allowed only when they preserve inference;
- no floating provider/Eve promises: background work is registered explicitly
  with Eve `waitUntil` and errors remain observable.

## Frontend Composition Audit Result

The Sendblue slice is a machine webhook/channel integration and adds no React
route or operator UI. Frontend composition rules are not applicable to this
task. No dashboard, contact screen, replay viewer, credential form, Browser
evidence, or frontend audit work was invented. A future UI requires a separate
SPEC.

That future UI must follow
`docs/architecture/frontend-composition.md` and the hierarchy:

```text
primitive -> composite -> layout -> route
```

The leaf that renders a delivery status, sender mapping, webhook health,
credential action, or replay decision owns its exact read/mutation, command,
loading, empty, error, retry, skeleton, and fallback states. Routes compose the
layout and route context only. Do not prop-drill provider results, ids, loading
flags, callbacks, or derived lists through nested feature wrappers; do not hide
workflows in generic hooks merely to shorten JSX.

Prefer explicit children/slots and domain-named composites over boolean-prop
matrices. A component or hook is admitted only when it owns reusable rendering,
interaction, accessibility, React lifecycle, or a real framework boundary;
pass-through feature wrappers, single-use aliases, and workflow-hiding hooks are
frontend helper sprawl. Hoist state only when siblings coordinate or the
route/layout genuinely owns the workflow. Reusable URL/search/page state is
Schema-owned and route-agnostic; app route APIs stay in the app boundary.

Effect services, Layers, Config, Sendblue credentials, replay stores, and
provider clients remain server-only. Route loaders/actions/RPC decode and
encode canonical Schemas and translate tagged failures once into explicit UI
states. React must not run Effects during render or duplicate provider/domain
schemas as component DTOs. Controls use the app design-system primitives and
canonical typography roles, retain keyboard/focus/accessibility semantics, and
keep stable dimensions across loading and settled states. Visible work requires
desktop/mobile Browser screenshots, direct HTTP proof, and
loading/empty/error/retry/long-content overflow checks.

## Lint, Tests, And Verification

Targeted tests must cover:

- Effect Config success/failure/redaction;
- constant-time verifier behavior, including missing configured secret;
- schema decoding and unknown-field handling;
- E.164 validation and mapped/unknown sender behavior;
- direct conversation-key stability and sender/line separation;
- direction/status/service/group/media/empty-content loop guards;
- concurrent inbound and outbound claim winners, TTL/lease transitions, and
  storage failure fail-closed behavior;
- outbound request headers/body through an injected client without secret/body
  snapshots;
- provider 2xx, 4xx, 401, 429, timeout, malformed response, and uncertain
  outcome handling;
- Eve `message.completed` delivery coordinates and duplicate event replay;
- no message text, phone number, API secret, webhook secret, or bypass token in
  logs/evidence.

Required checks include focused agent tests/build, lint/typecheck/Knip, direct
HTTP status/content-type checks, Vercel build/runtime logs, and final
`bun run verification` plus `git diff --check`.

Every implementation task requires three recorded audit passes:

1. ownership and production/test/CLI call graph;
2. flat Effect flow, canonical schemas, tagged errors, redaction, and
   helper-sprawl review;
3. targeted/live verification coverage and leak-safe evidence.

More passes are required while any finding remains.

## Operational Behavior, Rotation, And Rollback

- A failed/missing webhook secret is an auth incident, not an ignored event.
- Replay-store failure returns `503` so Sendblue retries; it must not dispatch
  without a durable claim.
- Unknown senders and unsupported authenticated event types are acknowledged
  and counted without content/PII logs.
- Provider `401` is a known rejection; the outbound claim becomes retryable
  and requires operator credential investigation before any retry.
- Provider `429` is also retryable only after an operator policy decision; no
  background provider retry is implemented.
- Indeterminate send outcomes are quarantined as `uncertain` and require
  operator inspection.
- Channel failure must not switch the Eve model provider or expose the default
  Eve API publicly.
- Historical Preview operation: rotate the Vercel bypass and Sendblue webhook
  secret independently, store them only in provider/operator systems and
  encrypted Preview configuration, redeploy, then update the provider receive
  webhook. Never print an old or new value or the protected URL.
- Historical Preview rollback: remove the Sendblue receive webhook first, then
  revoke the Preview bypass and remove/revoke Preview Sendblue configuration.
  Current Production rollback is recorded in the promotion plan.

## Historical Documentation Deliverables

Implementation updates:

- `apps/agent/README.md` with Sendblue env names, webhook route, local tests,
  Preview proof, rotation, and rollback;
- `docs/architecture/eve-agent.md` with the channel call graph and auth model;
- `docs/architecture/repo-structure.md` if the app-owned Sendblue folder becomes
  a durable convention;
- root `README.md` and `ARCHITECTURE.md` only after the channel is actually
  verified;
- this SPEC/task ledger and an active execution plan with sanitized evidence.

Docs must state that the provider uses a shared signing-secret header, not a
body signature, and that historical Preview proof did not authorize Production.

## Current Environment Ownership

Production and Preview retain app-owned Sendblue configuration and separate
replay state, but the shared provider account has exactly one active receive
webhook at the stable Production route and one Production Sendblue automation
bypass. Preview retains immutable historical evidence only; its receive webhook
and dedicated Sendblue bypass are inactive. Production replay storage uses the app-owned
`BUNDJIL_SENDBLUE_REPLAY_STORE_*` URL/token bindings or the
configured-environment Marketplace fallback; those credentials are distinct
from Codex OAuth/profile/cipher storage. 1Password and Vercel own credential values. The
accepted Production evidence is recorded in the promotion SPEC/plan; this SPEC
retains earlier Preview and two-webhook proof as historical evidence only.

## Risks And Tradeoffs

- A copied shared secret provides origin authentication but not body-bound HMAC
  integrity. TLS, constant-time comparison, strict schemas, line checks, and
  replay claims reduce the remaining risk.
- The Vercel automation bypass appears in the webhook URL when Sendblue cannot
  set custom headers. Treat that URL as a secret and rotate it after exposure.
- Phone numbers and message content necessarily enter Eve durable state/model
  context. Retention, provider terms, consent, and deletion behavior must be
  reviewed before non-test use.
- Without provider request idempotency, indeterminate outbound network outcomes
  cannot guarantee both no loss and no duplicates. The first slice chooses no
  automatic resend and explicit operator reconciliation.
- Upstash adds a stateful dependency to the agent app. Failing closed protects
  replay guarantees but can delay inbound replies during storage incidents.
- Multiple account-level receive webhooks duplicate delivery across every
  target. Per-environment secrets, continuation tokens, and replay stores do
  not provide cross-environment routing or deduplication.
- Removing Preview ingress reduces live pre-production channel coverage. Use a
  separate account/line for concurrent Preview testing; do not restore dual
  delivery as a convenience.

## Implementation Delegation Prompt

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

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, instanceof checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema/RPC/Match/Result/Exit
primitive or owning service contract should carry the behavior.
```

## Sources

- [Sendblue webhook guide](https://docs.sendblue.com/getting-started/webhooks).
- [Sendblue security and webhook secret](https://docs.sendblue.com/security/).
- [Sendblue API reference](https://docs.sendblue.com/api/), including the
  published OpenAPI `1.1.0` contract for `POST /api/send-message`.
- [Vercel Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).
- Installed Eve `0.20.0` docs:
  `node_modules/eve/docs/channels/custom.mdx`,
  `node_modules/eve/docs/channels/overview.mdx`, and
  `node_modules/eve/docs/concepts/security-model.md`.
- Local pattern reference:
  `.local/references/personal-agent-template/agent/channels/sendblue.ts`.
