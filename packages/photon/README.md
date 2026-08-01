# `@bundjil/photon`

Photon Spectrum implementation of Bundjil's provider-neutral
`ChannelTransport` contract. The package owns signed webhook decoding, scoped
Spectrum acquisition and release, direct-message Space resolution, send and
typing operations, plus state-safe Photon management observations.

## Public exports

- `@bundjil/photon` — decoded configuration Schemas and explicit live/memory
  Layers.
- `@bundjil/photon/config` — configuration Schemas without SDK acquisition.
- `@bundjil/photon/live` — the scoped live transport Layer.
- `@bundjil/photon/memory` — the deterministic provider-neutral memory Layer.
- `@bundjil/photon/management` — management Schemas, named read-only
  observation services, the controlled candidate-inventory service, safe
  errors, redacted credential services, and explicit live/memory Layers.

Spectrum clients, provider DTOs, credentials, secrets, phone values, callback
query values, raw failures, and provider mutation operations are not public
exports.

## Supported commands

Run package checks from the repository root:

```sh
bun run --filter=@bundjil/photon check-types
bun run --filter=@bundjil/photon test
bun run --filter=@bundjil/photon build
```

Public package command names are `proof:provider`, `reconcile:resources`,
`inventory:candidates`, `register:environment-webhook`, and
`delete:environment-webhook`. Related repository command names are
`infrastructure:photon-candidate-inventory`,
`infrastructure:photon-preview-webhook-register`,
`infrastructure:photon-preview-webhook-binding`,
`infrastructure:photon-production-webhook-register`, and
`infrastructure:photon-production-webhook-delete`.

## Claim boundary

Package checks prove repository contracts only. They do not establish current
Photon state or authorize provider reads or writes, webhook changes,
deployment, messaging, handset delivery, billing, Preview, or Production
operations. Current evidence belongs to task-scoped receipts and external
readback.

Operational preconditions, authority, sequencing, evidence, rollback, stop,
and escalation rules are owned by the
[Photon runbook](../../apps/agent/runbooks/photon.md).
