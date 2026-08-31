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
Schema-encoded deployment receipt on success and emits a Schema-encoded
`blocked` receipt with exit code `1` after any Config, Layer, deployment,
rollback, health, or encoding failure. The receipt exposes only the closed
failure category and, for an expected deployment failure, its safe operation,
project, reason and retry class. It never emits a command, URL, provider body,
credential, raw error or stack. That bounded result identifies the failed
control step; GitHub logs and Vercel readback remain the operational evidence
owners.

## Supported commands

Run package checks from the repository root:

```sh
bun run --filter=@bundjil/infrastructure check-types
bun run --filter=@bundjil/infrastructure test
bun run --filter=@bundjil/infrastructure build
```

Public repository command names are `infrastructure:inventory`,
`infrastructure:adoption-manifest`, `infrastructure:adoption-readmission`,
`infrastructure:adoption-proof`,
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
selected under the Personal account, selected by exact project binding, and
proved by assigned-project access plus sibling-project denial. It stages both
apps with
domains skipped, validates immutable candidates, promotes only while the
candidate is still `main`, verifies the stable targets and proxy health, and
then assigns the existing Photon callback alias to the accepted agent. It
restores the exact prior callback, agent and proxy targets in reverse order on
every non-success Effect exit after mutation starts, including interruption
and defect paths. When both apps already match `main` but the callback does
not, it moves only the callback. It is not an operator convenience command.

The live deployment adapter binds each command with the exact
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and matching redacted token. Reads,
promotion, callback assignment, and rollback use project-addressed Vercel API paths with the exact
team ID as a query parameter. Staging uses those environment bindings and does
not ask the CLI to discover a team by `--scope`. It uploads the repository root
once, then lets each exact Vercel project's `rootDirectory` select its owned app;
it must not pass that app directory as a second upload root. Mutation requests
send their required empty JSON body through an Effect Stream after Effect Schema
encoding. After promotion or rollback, the adapter polls the decoded current
target with an Effect Schedule until the deployment ID and source SHA match.
The callback hostname is a branded non-secret Config value; its current alias
response is decoded and its referenced immutable agent deployment is inspected
before use. The same bounded readback follows callback assignment. Missing,
redirected, malformed or cross-project aliases fail closed.
Every child-process provider command has an Effect-managed two-minute timeout.
The mutation phase has a separate eight-minute deadline, and each callback,
agent and proxy restoration has its own four-minute deadline. The workflow's
seven setup, fetch and deployment step limits total 59 minutes inside its
60-minute job, and the deployment step is capped at 45 minutes. The Effect
command's bounded
pre-mutation sequence can use at most 22 minutes; mutation and all three
restorations can use at most another 20 minutes. This 42-minute bound fits
inside that deployment step. A timeout is an unsuccessful Effect exit and never
becomes a success receipt.

The root `infrastructure:drift-report` wrapper selects `bundjil/stg`. Its GitHub
worker maps only the authority, environment bundle and compressed manifest into
`infrastructure:drift-report:internal`. That operation uses a distinct
project-routed credential Layer.
Its environment file supplies
`BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON`, a Schema-decoded
non-empty array of unique project-ID/token bindings. Each token is issued for
one exact Personal Vercel project and must pass the assigned-project read and
sibling-project denial checks before custody. The Vercel adapter selects a
redacted token only after receiving a decoded branded project ID, and the
Alchemy project provider observes exactly the manifest projects rather than
listing a whole team. `infrastructure:inventory` uses the same exact-project
credential contract. Broad `VERCEL_INFRASTRUCTURE_ACCESS_TOKEN` custody remains
limited to legacy adoption/operator paths.

Marketplace attachment reads use only each exact project's decoded
environment `contentHint`. Project tokens cannot enumerate the account-wide
storage list, so the adapter never calls it. The accepted manifest database ID
is retained only after the observable integration, configuration, resource and
project identities match; it is not a fresh database-ID readback.

The accepted Preview manifest is Schema-encoded first, then held in the exact
GitHub manifest secret as an in-memory gzip/base64 transport because the raw
155-resource JSON exceeds GitHub's secret-size boundary. The hosted workflow
materialises the original JSON into mode-`0600` custody before this command
Schema-decodes it and compares it with the exact configured accepted digest;
the transport is never a second manifest authority.
`infrastructure:adoption-readmission` is a local, credential-neutral command
for an approved metadata-only refresh. It takes the accepted manifest, a fresh
mode-`0600` two-read inventory and a non-empty JSON list of exact existing
logical IDs. It permits only `ObservedUnknown` Vercel environment identities
whose team, project, environment ID, key and stage still match. It preserves
the resource set, retain policy, secret ownership and all four managed Photon
references. Its new digest binds the old manifest digest, current inventory
digest, sorted approved identity list and each row's full admitted metadata.
It performs no provider or state write. Each selected write-only row also
carries the exact non-secret provider update timestamp admitted by that
inventory. A later Alchemy dry-run remains the owner of any proposed state
change.
The one-off 2026-08-31 Preview state re-admission command has been retired.
The converged state remains current evidence, but it is not standing authority
for another state write. A future state correction requires a new bounded
operation, current provider evidence and fresh approval.
Vercel deployment responses may also contain named custom targets. The live
adapter decodes those provider values but admits only `preview`, `production`,
or the provider's legacy `null` Preview target into Bundjil observations;
custom targets such as `staging` are ignored and are never relabelled Preview.
The drift report keeps returned deployment observations strict across every
typed field. If Vercel no longer returns an accepted historical deployment,
the report records unavailable history without claiming drift, deletion,
retention or repair authority. An accepted write-only environment baseline is
continuous when native sync is unchanged and present provider revision
metadata is available. A native-sync drift may also be accepted when the
desired plan is still no-op and the manifest records both `ObservedUnknown`
and the exact current provider update timestamp admitted from the two-read
inventory. A missing or different timestamp remains inconclusive; the value
itself is never proved.
If native sync cannot complete, the operator log may expose only the closed
typed provider-read error name and reason alongside the safe phase. It never
emits the error message, request, response, URL, headers, provider payload or
credential.

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
