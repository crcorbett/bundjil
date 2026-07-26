# `@bundjil/photon`

Photon Spectrum implementation of Bundjil's provider-neutral
`ChannelTransport` contract. The package owns signed Photon webhook decoding,
scoped Spectrum SDK acquisition and release, Space resolution, direct-text
send, and typing presence.

## Public boundary

- `@bundjil/photon` exports the decoded Photon config Schemas and live/memory
  Layers.
- `@bundjil/photon/config` exports config Schemas without loading the SDK.
- `@bundjil/photon/live` exports the scoped live Layer.
- `@bundjil/photon/memory` exports the provider-neutral memory Layer.
- `@bundjil/photon/management` exports the read-only Photon management
  Schemas, six named resource-observation services, one owner-named controlled
  candidate inventory service, operation-specific safe errors, lazy redacted
  credential services, and explicit live/memory Layers required by Alchemy.
  It exports no mutation operation.

Spectrum clients, Spaces, callbacks, SDK/Zod values, raw provider failures,
Basic-auth construction, management URLs, provider DTOs, and operator
mutations are private implementation details. The public read/import boundary
observes project profile metadata, iMessage platform/service type, exhaustively
paged shared users, webhooks, dedicated-line inventory, and billing status.
Its state-safe observations expose only stable branded IDs and safe metadata:
project and webhook secrets, shared and assigned phone numbers, callback query
values, billing/customer identifiers, provider bodies, SDK values, and raw
failures do not cross it. Webhook signing state is `ObservedUnknown` because
list readback cannot recover the create-only secret.

The existing bounded operator workflows remain internal and separately
authority-gated. They may reconcile the Free managed-shared iMessage service,
one exact approved shared user, platform state, and one webhook by stable
provider IDs, but are not imported by Alchemy.

The exact `12.3.0` SDK declarations contain one upstream
`exactOptionalPropertyTypes` mismatch: the iMessage definition omits optional
`events`, while core's `AnyPlatformDef` constraint treats that omission as
incompatible. The single adjacent `@ts-expect-error` at `Spectrum(...)` is the
owned boundary exception; package and consumer typechecks cover the runtime-
supported call without weakening repository compiler settings.

## Pinned Spectrum boundary

| Package                 | Pin      | npm integrity                                                                                     | Export used |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------- | ----------- |
| `@spectrum-ts/core`     | `12.3.0` | `sha512-j4NM5lRBE/GIAYKGVDIkfM5Gvn6CxHQiCRbaQPpEmidhkkR0i4DSDZKjZpNE1VLxU3knuPlOxAP6v+/7m84X1w==` | `.`         |
| `@spectrum-ts/imessage` | `12.3.0` | `sha512-RiGFBnmgTMjzE+ZsSCFTQtl8DCNfLk8EiY1KXcFFwjMoHf6GmJk84MYgtd9wAA7VddrwEAF6Sp+jXSp0ZmILwQ==` | `.`         |
| `@grpc/grpc-js`         | `1.14.4` | Registry integrity retained in `bun.lock`                                                         | runtime     |
| `nice-grpc`             | `2.1.16` | Registry integrity retained in `bun.lock`                                                         | runtime     |
| `nice-grpc-common`      | `2.0.3`  | Registry integrity retained in `bun.lock`                                                         | runtime     |

The direct packages are the documented lean installation, not the
`spectrum-ts` batteries-included metapackage. Core brings Photon proto/OTel,
Repeater, content parsing, MIME, vCard, and Zod dependencies; iMessage brings
the Photon gRPC client. That client dynamically imports and resolves the three
gRPC packages above, so `@bundjil/photon` declares them directly rather than
relying on a transitive install shape. Eve keeps `@bundjil/photon` and those
runtime peers external while compiling authored modules so Nitro traces
resolvable packages into the server output; the agent packaged-build test owns
this deployment boundary.
The `12.3.0` refresh resolves `@photon-ai/otel` to `3.3.0` and changes the
iMessage provider's failed contact-card sharing behavior; it does not widen
Bundjil's direct-text Channel contract.

Free managed-shared routing is per user, not one interchangeable project
number. Each authorised user has its own `phoneNumber -> assignedPhoneNumber`
pairing. An inbound local-stream proof must send from that exact user identity
to that user's assigned number; another authorised user's assigned number
rejects the sender before the application receives an event. The dated
[local-stream receipt](../../docs/verification/photon-local-stream-2026-07-22.md)
records this distinction without making it standing provider-state truth.

`Spectrum(...)` acquires the app asynchronously. A Photon webhook Space ID is
an opaque stable conversation identity, not a public serverless send lookup.
For an accepted direct-message webhook, the live Layer resolves the branded
participant through `imessage(app).user(participantId)` and reconstructs the
DM with `space.create(participant)` before send or typing. Group webhook spaces
are ignored as unsupported because the current serialized event does not
contain enough membership state to reconstruct their outbound Space safely.
Space send and typing operations return Promises, and `app.stop()` releases the
SDK. The live Layer is construction-safe for a serverless webhook: signature
verification and payload decoding do not acquire Spectrum. Each outbound send
or presence operation brackets one SDK resource with
`Effect.acquireUseRelease`. Send has a 30-second delivery-uncertain bound;
presence has a distinct 15-second unavailable bound so hosted Spectrum
acquisition can complete before `startTyping()` or `stopTyping()`. A failed SDK
Promise becomes one private typed error and emits only operation, phase,
bounded name/code tokens, numeric nested status, and a boolean retry hint
before mapping to the common safe Channel error; raw errors, messages, stacks,
causes, identities, content, URLs, credentials, and provider metadata are never
observed. Successful acquire, direct-Space resolution, send, typing, and
release phases emit only provider, operation, and phase so hosted proof can
establish the lifecycle without exposing data-plane values. The SDK's webhook
helper is deliberately not used because its handler is fire-and-forget.
Bundjil instead follows Photon's documented raw-body HMAC contract and keeps
deterministic completion in the Eve `waitUntil` program.

The Photon dashboard's generated `bun start` command is the SDK-stream
development mode: one process for the application/project consumes
`app.messages` and must remain running while it handles inbound events. It is
not one process per user or assigned line. Bundjil's hosted topology instead
uses Photon-signed webhooks into Vercel and acquires Spectrum only for outbound
Space operations; it does not require a continuously running Bun process.

Upstream references: [lean Spectrum installation](https://photon.codes/docs/spectrum-ts/getting-started),
[serverless webhook guidance](https://photon.codes/docs/webhooks/overview),
[webhook wire format](https://photon.codes/docs/webhooks/events),
[Spaces and Users](https://photon.codes/docs/spectrum-ts/spaces-and-users),
[signature verification](https://photon.codes/docs/webhooks/verifying-signatures),
and [iMessage routing](https://photon.codes/docs/spectrum-ts/providers/imessage/connection-and-routing).

## Commands

Run from the repository root:

```sh
bun run --filter @bundjil/photon check-types
bun run --filter @bundjil/photon test
bun run --filter @bundjil/photon build
```

These commands are repository proof only. They do not configure Photon or
prove a deployed webhook, provider send, or handset delivery.

`bun run infrastructure:photon-candidate-inventory` loads the ignored source
and Preview project credentials plus one selected safe fingerprint, performs
two complete sequential source/Preview shared-user and availability reads, and
emits only a Schema-encoded fingerprint manifest when both digests match and
the selected Preview binding is unique. Every failure emits only
`{"status":"blocked"}`. The command performs no provider write and retains no
phone, assigned routing identity, project secret, provider body, or raw error.

The separately authorised, provider-only lifecycle command is
`bun run --filter @bundjil/photon proof:provider`. It follows the
[Photon provider proof runbook](../../apps/agent/runbooks/photon.md),
performs one reversible proof-webhook lifecycle plus SDK acquire/release, and
emits only a sanitised Schema receipt. It is not a deployment or messaging
proof.

`bun run --filter @bundjil/photon reconcile:resources` is the bounded hosted
inventory edge. It defaults to read-only `inspect`; setting
`BUNDJIL_PHOTON_RESOURCE_MODE=reconcile-shared-user` with the redacted
`BUNDJIL_PHOTON_SHARED_USER_PHONE_NUMBER` may enable iMessage and adopt or
idempotently create the exact approved Free managed-shared user. The accepted
topology has service type `shared` and zero dedicated lines. Its Schema receipt
contains only counts, actions, service type, and assignment presence.

`bun run --filter @bundjil/photon register:environment-webhook` registers one
new exact `BUNDJIL_PHOTON_WEBHOOK_URL` only when no matching webhook exists. It
writes the create-only ID and signing secret to the absolute
`BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH` with mode `0600`, verifies provider and
file readback, and emits only a sanitized receipt. The operator must bind the
artifact directly to the approved environment and remove it after readback; an
existing target or lost write-only secret blocks instead of replacing or
adopting it.

`bun run --filter @bundjil/photon delete:environment-webhook` deletes only one
exact `BUNDJIL_PHOTON_WEBHOOK_URL` and requires zero matching records on
readback. Zero or multiple matches block; it never selects by list order,
creation time, partial ID, or hostname alone.

Production shared-user, platform, webhook, and deployment reconciliation
follows the same runbook but remains a distinct promotion workflow. Repository tests and
the provider-only proof cannot stand in for immutable deployment, signed
ingress, Eve completion, send acceptance, delivery, or typing-display proof.
