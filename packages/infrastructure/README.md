# `@bundjil/infrastructure`

Private repository infrastructure contracts and Alchemy providers for Bundjil.
The package owns state-safe Schemas, branded identities, named services, safe
errors, explicit live/memory Layers, adoption and inventory contracts, bounded
receipts, and retained custom Resources.

## Public exports

- `@bundjil/infrastructure` — shared infrastructure contracts, services,
  configuration, receipts, inventory, drift, state, adoption, and synthetic
  provider capabilities.
- `@bundjil/infrastructure/testing` — decoded deterministic test fixtures.
- `@bundjil/infrastructure/vercel` — Vercel-owned Schemas, identities,
  services, safe errors, and explicit read/write-capability Layers.
- `@bundjil/infrastructure/photon` — retained Photon observation Resources and
  the separately composed Preview webhook-binding capability.

Raw provider clients, wire DTOs, credentials, secret values, and unchecked
provider failures are not public exports.

## Supported commands

Run package checks from the repository root:

```sh
bun run --filter=@bundjil/infrastructure check-types
bun run --filter=@bundjil/infrastructure test
bun run --filter=@bundjil/infrastructure build
```

Public repository command names are `infrastructure:inventory`,
`infrastructure:adoption-manifest`, `infrastructure:adoption-proof`,
`infrastructure:drift-report`, `infrastructure:preview-plan`,
`infrastructure:preview-apply`, `infrastructure:preview-sync`,
`infrastructure:preview-drift`, `infrastructure:preview-repair`,
`infrastructure:preview-rollback-plan`, `infrastructure:preview-rollback`,
`infrastructure:preview-state-migration`,
`infrastructure:production-state-migration`,
`infrastructure:stable-preview-plan`,
`infrastructure:stable-preview-apply`,
`infrastructure:stable-preview-sync`,
`infrastructure:stable-production-plan`,
`infrastructure:stable-production-apply`,
`infrastructure:stable-production-sync`,
`infrastructure:photon-candidate-inventory`,
`infrastructure:photon-preview-webhook-register`,
`infrastructure:photon-preview-webhook-binding`,
`infrastructure:photon-production-webhook-register`,
`infrastructure:photon-production-webhook-delete`, and
`infrastructure:vercel-git-link-authority`.

## Claim boundary

Package checks prove repository contracts only. They do not establish current
provider state or authorize credentials, state migration, provider writes,
deployment, promotion, messaging, billing, Preview, or Production operations.
Current evidence belongs to task-scoped receipts and external readback.

Operational preconditions, authority, sequencing, evidence, rollback, stop,
and escalation rules are owned by the
[Alchemy infrastructure runbook](../../apps/agent/runbooks/alchemy-infrastructure.md).
