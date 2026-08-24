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
  services, safe errors, and explicit read/write-capability Layers. Preview
  configuration and stable-environment authority loaders expose only their
  owner-named authority error and bounded reason Schema; raw Config,
  filesystem, parser, and primitive-string failures remain private.
- `@bundjil/infrastructure/photon` — retained Photon observation Resources and
  the separately composed Preview webhook-binding capability.

Raw provider clients, wire DTOs, credentials, secret values, and unchecked
provider failures are not public exports.

Infrastructure operator programs keep owner-local Schema tagged errors until
their final process adapter. That adapter alone may render the stable bounded
status/reason and set the documented exit code. Root lint rejects primitive
`Effect.fail`, `Effect.failSync`, and `Effect.mapError` values across every
script in `scripts/`. Reusable live Layers retain typed construction failures;
commands provide their runtime inside the final catch/exit boundary, and root
lint rejects `Layer.orDie` in package source and infrastructure scripts.
Subprocess fixtures exercise deterministic foreground stops and missing Layer
configuration without provider transport or raw Cause output. Mutating
commands capture authority, configuration, runtime acquisition, foreground
work, readback, and Schema receipt encoding in that boundary; expected failure
must not fall through to a runtime stack reporter. The private automatic
Production entrypoint follows the same process contract: it keeps the existing
Schema-encoded deployment receipt on success and emits only
`{"status":"blocked"}` with exit code `1` after any Config, Layer, deployment,
rollback, health, or encoding failure. That bounded result is not a deployment
or rollback diagnosis; GitHub logs and Vercel readback remain the operational
evidence owners.

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
`infrastructure:vercel-git-link-authority`. `production:deploy` is the private
post-CI Production entrypoint. It is owned by the exact-SHA `Production`
workflow. The root wrapper selects `bundjil/prd` through Doppler; GitHub fetches
that config once and maps only its six named values into the credential-neutral
`production:deploy:internal` command. The operation uses two separately
revocable exact-project Vercel credentials
selected under the Personal account and proved by assigned-project access plus
sibling-project denial, stages both apps with
domains skipped, validates immutable candidates, promotes only while the
candidate is still `main`, verifies the stable targets and proxy health, and
restores the exact prior deployments on every non-success Effect exit after
promotion starts, including interruption and defect paths. It is not an
operator convenience command.

The root `infrastructure:drift-report` wrapper selects `bundjil/stg`. Its GitHub
worker maps only the authority, environment bundle and compressed manifest into
`infrastructure:drift-report:internal`. That operation uses a distinct
project-routed credential Layer.
Its environment file supplies
`BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON`, a Schema-decoded
non-empty array of unique project-ID/token bindings. The Vercel adapter selects
a redacted token only after receiving a decoded branded project ID, and the
Alchemy project provider observes exactly the manifest projects rather than
listing a whole team. Broad `VERCEL_INFRASTRUCTURE_ACCESS_TOKEN` custody remains
limited to the separate inventory/adoption/operator paths.

## Claim boundary

Package checks prove repository contracts only. They do not establish current
provider state or authorize credentials, state migration, provider writes,
deployment, promotion, messaging, billing, Preview, or Production operations.
Current evidence belongs to task-scoped receipts and external readback.
The automatic command's local tests prove orchestration and fail-closed
behavior only; a successful hosted `Production` run plus Vercel readback is
required to prove automatic deployment.

Operational preconditions, authority, sequencing, evidence, rollback, stop,
and escalation rules are owned by the
[Alchemy infrastructure runbook](../../apps/agent/runbooks/alchemy-infrastructure.md).
