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

Spectrum clients, Spaces, callbacks, SDK/Zod values, raw provider failures,
and Photon management operations are private implementation details. The
bounded operator workflow can reconcile one dedicated iMessage line, the
iMessage platform state, and one webhook by stable provider IDs. Its decoded
results expose lifecycle status and billing-sync classification only; phone
numbers and billing amounts do not cross the package boundary.

The exact `12.2.0` SDK declarations contain one upstream
`exactOptionalPropertyTypes` mismatch: the iMessage definition omits optional
`events`, while core's `AnyPlatformDef` constraint treats that omission as
incompatible. The single adjacent `@ts-expect-error` at `Spectrum(...)` is the
owned boundary exception; package and consumer typechecks cover the runtime-
supported call without weakening repository compiler settings.

## Pinned Spectrum boundary

| Package                 | Pin      | npm integrity                                                                                     | Export used |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------- | ----------- |
| `@spectrum-ts/core`     | `12.2.0` | `sha512-AducO3pBUwDdwgjUkQq1NVVOhZYfWOtNG41uBcxDv4GcPHZSH2+s3+E3+77uRV0PebtnCQGEAjQxbJpIrKYpIg==` | `.`         |
| `@spectrum-ts/imessage` | `12.2.0` | `sha512-WZouKWRtDfgysZVC07wzyQYc3Oleo2ZHLw0b0a3F5IpbJ8gejIT70NcU2gX+w1eJ0stTYnstyMhmAuAly20U5g==` | `.`         |

The direct packages are the documented lean installation, not the
`spectrum-ts` batteries-included metapackage. Core brings Photon proto/OTel,
Repeater, content parsing, MIME, vCard, and Zod dependencies; iMessage brings
the Photon gRPC client. Eve keeps `@bundjil/photon` external while compiling
authored modules so Nitro traces this dependency graph into the server output.

`Spectrum(...)` acquires the app asynchronously; `imessage(app).space.get(id)`
resolves a cold Space; Space send and typing operations return Promises; and
`app.stop()` releases the SDK. The live Layer brackets those operations with
`Effect.acquireRelease`. Its finalizer emits only a safe lifecycle tag if
cleanup fails. The SDK's webhook helper is deliberately not used because its
handler is fire-and-forget. Bundjil instead follows Photon's documented raw-
body HMAC contract and keeps deterministic completion in the Eve `waitUntil`
program.

Upstream references: [lean Spectrum installation](https://photon.codes/docs/spectrum-ts/getting-started),
[webhook wire format](https://photon.codes/docs/webhooks/events),
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

The separately authorised, provider-only lifecycle command is
`bun run --filter @bundjil/photon proof:provider`. It follows the
[Photon provider proof runbook](../../apps/agent/runbooks/photon.md),
performs one reversible proof-webhook lifecycle plus SDK acquire/release, and
emits only a sanitised Schema receipt. It is not a deployment or messaging
proof.

Production line, platform, webhook, and deployment reconciliation follows the
same runbook but remains a distinct promotion workflow. Repository tests and
the provider-only proof cannot stand in for immutable deployment, signed
ingress, Eve completion, send acceptance, delivery, or typing-display proof.
