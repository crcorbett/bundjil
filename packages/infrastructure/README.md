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
workflow, uses two separately revocable Vercel credentials project-scoped to
the exact Personal projects and selected by exact project binding, proves the
assigned-project read and sibling-project denial before custody, and stages both apps with
domains skipped, validates immutable candidates, promotes only while the
candidate is still `main`, verifies the stable targets and proxy health, and
restores the exact prior deployments on every non-success Effect exit after
promotion starts, including interruption and defect paths. It is not an
operator convenience command.

`infrastructure:drift-report` uses a distinct project-scoped credential Layer.
Its environment file supplies
`BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON`, a Schema-decoded
non-empty array of unique project-ID/token bindings. Each token is issued for
one exact Personal Vercel project and must pass the assigned-project read and
sibling-project denial checks before custody. The Vercel adapter selects a
redacted token only after receiving a decoded branded project ID, and the
Alchemy project provider observes exactly the manifest projects rather than
listing a whole team. Broad `VERCEL_INFRASTRUCTURE_ACCESS_TOKEN` custody remains
limited to the separate inventory/adoption/operator paths.

The accepted Preview manifest is Schema-encoded first, then held in the exact
GitHub manifest secret as an in-memory gzip/base64 transport because the raw
155-resource JSON exceeds GitHub's secret-size boundary. The hosted workflow
materialises the original JSON into mode-`0600` custody before this command
Schema-decodes it and compares it with the exact configured accepted digest;
the transport is never a second manifest authority.
Vercel deployment responses may also contain named custom targets. The live
adapter decodes those provider values but admits only `preview`, `production`,
or the provider's legacy `null` Preview target into Bundjil observations;
custom targets such as `staging` are ignored and are never relabelled Preview.
If native sync cannot complete, the operator log may expose only the closed
typed provider-read error name alongside the safe phase. It never emits the
error message, request, response, URL, headers, provider payload or credential.

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
