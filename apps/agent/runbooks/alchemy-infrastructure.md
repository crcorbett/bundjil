---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-08-13
review_trigger: Alchemy stack, remote state, Vercel or Photon provider boundary, adoption manifest, credential, drift, apply, rollback, or revocation change
---

# Alchemy infrastructure

This runbook owns the foreground operation for Bundjil's
`BundjilInfrastructure` Alchemy stack. It covers the dedicated remote-state
boundary, exact adoption manifests, read/import convergence, and later
task-scoped configuration reconciliation. Vercel Git remains the only
deployment creator; the app deployment runbooks remain the promotion and
runtime-proof owners.

The stack's stable identities are:

- Cloudflare account `f9f94270a4a5af8af7010d891020922d`;
- R2 bucket `bundjil-alchemy-state`, prefix `bundjil/v1`, region `auto`;
- Vercel team `team_1LX7ZujbijowTv8J9k0aU7nD`;
- Vercel projects `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB` and
  `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`;
- Photon project `f8efe9d0-708c-41bb-8010-a116978223be`;
- Alchemy stack `BundjilInfrastructure`, with distinct `preview` and `prod`
  stages.

Preview inventory and state must name the isolated Preview Photon project;
Production inventory and state must name the source/Production Photon project.
One project observed in both state stages is a stage-isolation failure, not
migration proof.

`@bundjil/infrastructure/photon` now contains the dormant
`PhotonWebhookBindingSink` required before an isolated Preview webhook can be
created. The sink accepts one decoded Preview binding write and projects its
Vercel acknowledgement to a safe secret reference. It is not permission or a
command: do not invoke it until the isolated Photon task has a separately
authenticated Free Preview project, an exact approved non-Production user,
fixed authority, an immutable callback candidate, and captured rollback
identities. A missing approved user is a stop; never substitute either user
from the shared project.

## Preconditions and authority gate

Before resolving a credential, record and validate one task-scoped authority
envelope against the fixed harness contract. It must bind the authenticated
principal, exact identities above, stage, allowed reads or writes, start and
expiry, secret custody, provider and state readback, rollback, revocation,
stop conditions, escalation, and an addressable approval receipt.

Adoption permits R2 state writes and Vercel/Photon reads only. A later apply
must enumerate each provider property it may change. Neither repository source,
an available credential, an Alchemy plan, nor this runbook grants authority.

Required local values stay in ignored mode-`0600` `.env.local` and are resolved
only by owning `Config.schema` boundaries:

- `BUNDJIL_ALCHEMY_STATE_ACCESS_KEY_ID`;
- `BUNDJIL_ALCHEMY_STATE_SECRET_ACCESS_KEY`;
- `VERCEL_INFRASTRUCTURE_ACCESS_TOKEN`;
- `BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID`;
- `BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET`.

The broad `VERCEL_INFRASTRUCTURE_ACCESS_TOKEN` remains an explicit inventory,
adoption, and authorized configuration-command credential. The report-only
hosted drift command does not use it. That command requires
`BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON`: one JSON array of
unique exact project-ID/token bindings, decoded through Effect Schema with
each token redacted. Each binding must use a separately revocable token scoped
to the admitted Personal Vercel team, must read back its expected team and
assigned project, and must be bound to that exact project ID before the dotenv
artifact enters GitHub custody. The binding is request routing, not
project-level Vercel token isolation. A team-wide project-list operation or
account-wide/unscoped token is not a fallback.

Preview inventory, adoption, and state proof use the distinct
`BUNDJIL_PHOTON_PREVIEW_PROJECT_ID` and
`BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET` pair. The decoded stage selects exactly
one pair; do not make both pairs mandatory and do not substitute the
source/Production pair when Preview custody is unavailable. The inventory
command also requires a distinct
`BUNDJIL_INFRASTRUCTURE_RECEIPT_PATH`; the command writes both inventory and
receipt as mode-`0600` Schema-valid artifacts. Captured stdout and a receipt
from another source revision are not evidence.

The Preview configuration stack additionally requires the ignored fixed
authority path plus exact non-secret target metadata:

- `BUNDJIL_PREVIEW_CONFIGURATION_AUTHORITY_PATH`;
- `BUNDJIL_PREVIEW_VERCEL_TEAM_ID`;
- `BUNDJIL_PREVIEW_VERCEL_PROJECT_ID`;
- `BUNDJIL_PREVIEW_VERCEL_ENVIRONMENT_KEY`;
- `BUNDJIL_PREVIEW_VERCEL_ENVIRONMENT_VALUE`.

Never print, export, persist in a tracked file, or copy a value into a receipt.
Stop on multiple candidate principals, teams, projects, buckets, credentials,
Photon projects, manifests, or physical identities.

## Adoption and no-op convergence

1. Read back the authenticated Cloudflare, Vercel, and Photon principals and
   exact target identities. Read the R2 bucket metadata and ensure the
   credential is Object Read & Write for this bucket only.
2. Validate the accepted inventory artifact, its source/digest, and its
   stage-specific mode-`0600` adoption manifest. Every resource must retain the
   same stage, logical ID, physical identity, observed digest, owner, and
   `retain` policy.
3. Run the supported side-effect-free adoption plan:

   ```sh
   bun alchemy deploy --stage preview --dry-run --adopt
   bun alchemy deploy --stage prod --dry-run --adopt
   ```

   The installed Alchemy beta does not implement `plan --adopt`. Stop unless
   each dry run contains only the exact manifest-sized import/update set with
   zero create, replace, or delete.

   If a stage-correct Preview manifest reveals exactly the accepted seven-row
   source-project state discontinuity, do not apply the delete plan. Run
   `infrastructure:preview-state-migration` first under its distinct fixed
   authority. Set `BUNDJIL_STATE_MIGRATION_STAGE=preview` and the exact
   `BUNDJIL_STATE_MIGRATION_{AUTHORITY,BACKUP,RECEIPT}_PATH` plus
   `BUNDJIL_STATE_MIGRATION_{MODE,CANDIDATE}` Config. Plan must prove 106
   completed retained rows and the seven exact fingerprinted Photon rows;
   apply must persist the complete mode-`0600` backup before removing only
   those state rows and read back 99. Restore mode is the exact rollback until
   the next adoption reaches no-op. This command composes Alchemy state only
   and authorizes no provider delete.

   If the first current Production plan reveals the accepted one-row
   discontinuity, run `infrastructure:production-state-migration` with the
   same Config names and `BUNDJIL_STATE_MIGRATION_STAGE=prod` under the
   Production-specific fixed authority. Plan must prove exactly 69 current
   state rows, 72 desired manifest resources, one retained Photon webhook type
   and fingerprint, and zero provider transports. Apply must back up all 69
   rows before retiring only that state row and read back 68. Restore must
   exactly recover all backed-up rows and remove only rows absent from the
   backup. The following adoption is expected to reconcile four desired
   resources absent from state and must still contain zero replacement or
   delete. Stop on any other count, type, fingerprint, stage, status or
   removal policy.

   If apply reaches the exact post-retirement count but its fixed receipt is
   absent, do not restore or repeat a delete blindly. Re-run the same apply
   command with the same manifest, backup, authority and candidate. Recovery is
   accepted only when the complete backup proves the original discontinuity
   and every retained row matches the live post-state byte-for-byte; that path
   issues no delete and emits the missing receipt. Any backup, stage, digest,
   count, fingerprint or retained-row mismatch stops for exact restore.

4. Under the same unexpired authority, adopt one stage at a time:

   ```sh
   bun alchemy deploy --stage preview --adopt --yes
   bun alchemy plan --stage preview
   bun alchemy sync --stage preview --dry-run
   bun alchemy sync --stage preview --dry-run

   bun alchemy deploy --stage prod --adopt --yes
   bun alchemy plan --stage prod
   bun alchemy sync --stage prod --dry-run
   bun alchemy sync --stage prod --dry-run
   ```

5. Require the post-adoption plan to be all no-op and both sync dry-runs to be
   unchanged. Read back the R2 state through the native state service and
   require the exact logical-ID set, stage, completed status, fixed store
   version, and zero credential-value matches.
6. Encode and validate one bounded receipt per stage before writing it to
   ignored mode-`0600` `tmp/proof/**`. Keep provider, state, deployment,
   runtime, Channel, and handset proof as separate claim classes.

The Vercel and Photon adoption adapters expose metadata reads only. State
object writes do not authorize a Vercel or Photon mutation.

## Stable Preview bindings

Stable binding starts only after stage-correct no-write adoption is current and
the isolated Photon Preview journey is accepted. Generate a second manifest
from that exact inventory with
`BUNDJIL_INFRASTRUCTURE_BINDING_PROFILE=previewPhotonManaged`. It must classify
exactly the four existing `bundjil-agent`
`BUNDJIL_CHANNEL_PHOTON_{PROJECT_ID,PROJECT_SECRET,WEBHOOK_ID,WEBHOOK_SECRET}`
environment identities as `Managed`; every other environment value remains
`ObservedUnknown`. The managed reference owner is fixed, its reference is the
exact Vercel environment ID, and its revision is the immutable source SHA.

Validate a distinct mode-`0600`
`BUNDJIL_STABLE_ENVIRONMENT_AUTHORITY_PATH`. Its fixed policy permits only the
four exact Preview PATCH operations, Preview Alchemy state, read-only
Marketplace/Photon metadata, branch push, and observation of Vercel
Git-created deployments. It grants no Production, bearer, Marketplace,
datastore, Photon, deployment-create, promotion, delete, or secret-read
operation.

1. Run `bun run infrastructure:stable-preview-plan`. Stop unless it reports
   exactly four updates on the already adopted environment physical IDs and
   zero create, replace, delete, or other update. Use the root command as
   written: it rebuilds `@bundjil/infrastructure` before provider access so
   Alchemy's child process cannot resolve an ignored stale `dist/**` adapter.
2. Capture the externally retained prior four values and their revision in
   approved secret custody. Run
   `bun run infrastructure:stable-preview-apply`. Each provider request must
   target the same environment ID with `sensitive` and `preview`, omit the
   immutable sensitive-variable key, then decode a complete acknowledgement
   with a new provider revision. Values must never appear in stdout, Alchemy
   state, receipts, plans, or tracked files.
3. A known 429 or 5xx receives exponential jitter and at most three total
   attempts. A malformed response, identity mismatch, 4xx policy failure, or
   timeout after a possible write is fail-closed. Never blindly retry an
   uncertain write: Vercel metadata can show an update timestamp but cannot
   prove the write-only value. Preserve both candidate and prior values and
   require operator classification before another apply. The safe failure must
   retain the HTTP status and error-field presence only; raw provider codes,
   messages, request values, and credential material must not enter logs or
   receipts.
4. Run a fresh two-read Preview inventory, then
   `bun run infrastructure:stable-preview-plan` and two
   `bun run infrastructure:stable-preview-sync` commands. Require all no-op or
   unchanged, exact key/type/target/provider-revision readback, the same two
   Marketplace/database identities, and the same Photon project/users/webhook.
   Run `bun run infrastructure:adoption-proof` with
   `BUNDJIL_INFRASTRUCTURE_BINDING_PROFILE=previewPhotonManaged`; retain its
   fixed-contract receipt alongside the inventory receipt.
5. Environment updates affect only new deployments. Push the coherent
   receipt-bearing branch commit and observe a distinct Vercel Git-created
   Preview deployment for each affected project whose source SHA is exact and
   status is `READY`. Do not create or promote a deployment. Deployment
   readiness remains distinct from runtime, Channel, and handset proof.

Rollback reapplies the externally retained prior value revision to the same
four environment IDs under a new authority receipt, requires provider
acknowledgements, creates a new immutable Git deployment, and repeats
readback. Do not claim Vercel retains two active values for the same key and
target.

## Stable Production bindings

Production begins only after observed-only adoption is accepted with a
zero-create, zero-replacement and zero-delete post-plan. Generate the exact
Production manifest with
`BUNDJIL_INFRASTRUCTURE_BINDING_PROFILE=productionPhotonManaged`. It may mark
only the four existing sensitive, Production-targeted `bundjil-agent`
`BUNDJIL_CHANNEL_PHOTON_{PROJECT_ID,PROJECT_SECRET,WEBHOOK_ID,WEBHOOK_SECRET}`
identities managed under the Production secret owner. Every other Vercel and
Photon resource remains observed, retained or runbook-owned.

Validate the distinct mode-`0600` Production stable authority. It permits
those four exact updates, stage-owned Alchemy state, read-only topology, and
one staged Production deployment with domains skipped. It does not permit a
domain assignment, alias, promotion, bearer rotation, Photon mutation,
deletion or broader secret sweep.

1. Retain the accepted pre-retirement state backup. Resolve the Production
   project pair from independent Photon management custody and the webhook pair
   from the create-only Photon webhook artifact into ignored mode-`0600`
   `.env.local`. Do not treat a Vercel Production env pull as value custody:
   [sensitive variables are non-readable after creation](https://vercel.com/docs/environment-variables/sensitive-environment-variables).
   All four independently custodied values must pass their owning Schemas
   before the first provider write. Run
   `bun run infrastructure:stable-production-plan`. Stop unless the plan has
   exactly four updates on the accepted physical IDs and every other one of
   the 72 resources is no-op. Reject create, replacement, delete, Preview
   target, wrong owner, wrong project, wrong key or any additional update.
2. Run `bun run infrastructure:stable-production-apply`. Each request must
   use the exact existing environment ID, `sensitive` type and `production`
   target, omit the immutable key, and decode a complete acknowledgement. A
   known 429/5xx may receive exponential jitter and at most three total
   attempts. Do not retry a 4xx, identity mismatch, malformed response or
   uncertain timeout after a possible write.
3. Immediately run two fresh inventory reads. Require the same topology and
   exactly four changed provider revisions, then run
   `bun run infrastructure:stable-production-plan` and two
   `bun run infrastructure:stable-production-sync` commands. All 72 resources
   must converge to no-op/unchanged. Run
   `bun run infrastructure:adoption-proof` with the Production managed
   profile and require four acknowledgements, zero secret matches and zero
   unclassified provider writes.
4. From the clean, pushed receipt-bearing source, create one deployment with
   `vercel deploy --prod --skip-domain`. Read back exact source, Production
   target and `READY` status, and prove that no domain or current Production
   alias moved. This is a staged candidate only; do not promote or assign an
   alias in this slice.

   When lossless write-only-secret recovery is active, the staged Production
   preflight must encode `ParallelCutover` with the exact distinct safe
   fingerprints of the preserved original callback and candidate callback.
   The ordinary stable topology encodes one callback and its fingerprint.
   Neither a bare count nor the parallel topology at the earlier
   `channel-inventory-ready` checkpoint is accepted. Two callbacks remain a
   temporary cutover state, not the final desired topology.

When all prior values are independently retained, rollback reapplies only that
prior revision to the same four IDs under fresh bounded authority, requires
acknowledgement and metadata convergence, and creates another immutable staged
deployment. If any prior sensitive value is not independently retained, never
pretend Vercel metadata can recover it. Preserve the last-known-good immutable
deployment and callback as runtime rollback, then use the lossless cutover
below to establish a new complete candidate revision. Metadata alone cannot
prove write-only contents.

If any write occurs before a later custody failure, classify it as partial
failure from fresh exact-ID metadata. Do not assume the failed command wrote
nothing. Existing deployments retain their baked environment values, so keep
the current Production alias and its Photon callback unchanged. When the prior
webhook secret is not independently recoverable, repair by the lossless
callback cutover: under separate exact Photon authority, create one parallel
callback while retaining the old callback by running
`bun run infrastructure:photon-production-webhook-register` with the exact
`BUNDJIL_PHOTON_WEBHOOK_URL` and an absent absolute mode-`0600`
`BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH`. Also set the exact mode-`0600`
`BUNDJIL_PHOTON_WEBHOOK_AUTHORITY_PATH`; the fixed Production policy permits
only parallel create/readback/local custody and preserves the original
callback. Set
`BUNDJIL_PHOTON_PRODUCTION_ORIGINAL_WEBHOOK_ID` from the fresh exact readback;
the command requires one matching pre-create callback and exactly that original
plus the rollout-created callback afterward. Store the create-only ID/secret
in `.env.local` as the Production
webhook pair, re-run the four-value apply, create a staged deployment, and
require a candidate-specific signed identity-free safe probe before promotion.
Do not send a real pre-promotion Photon message while the two callbacks resolve
to different deployments: project fanout makes that a replay race, not a
candidate-only proof. When both callbacks share a provider-facing Vercel alias
that is distinct from the stable domain, read its exact current immutable target
as rollback and, under exact alias authority, assign only that alias to the
candidate. Require both callback routes to resolve to the candidate before
promotion while the stable alias stays on its rollback deployment. Immediately
after promotion, require both aliases to resolve to the accepted deployment,
then one bounded real event to produce one accepted dispatch through the
candidate callback, one `authenticationRejected` disposition at `webhookId`
through the preserved original callback, and exactly one response. The
rejection is mandatory when the original callback's create-only signing secret
is unavailable: it proves that the old route reached the candidate but cannot
enter the replay namespace. Do not claim a duplicate disposition for a request
that failed authentication. Require zero second effect and zero callback on
either rollback deployment, drain the retry horizon, and delete only the exact
retired URL with
`bun run infrastructure:photon-production-webhook-delete`. Never deploy a
candidate while any configured value is a provider write-only placeholder.

## Configuration and drift

For the approved Preview spike, first require exact readback of team
`team_1LX7ZujbijowTv8J9k0aU7nD`, project
`prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`, `enablePreviewFeedback: null`, and zero
Preview matches for `BUNDJIL_ALCHEMY_PREVIEW_SPIKE`. The fixed authority must
validate and the local provider matrix, Effect diagnostics, boundaries, and
verification gates must pass before the first write.

1. Run `bun run infrastructure:preview-plan`. Stop unless it reports exactly
   one `PreviewFeedback` update and one `PreviewEnvironmentMetadata` create,
   with no Production, deployment, promotion, replacement, or deletion.
2. Run `bun run infrastructure:preview-apply`, then read back the same team and
   project. Require `enablePreviewFeedback: true`,
   `enableProductionFeedback: null`, plus exactly one plain, non-sensitive,
   Preview-only key and retain its created stable ID without its value. The
   write contract sends both feedback fields so Vercel cannot infer a
   Production change from an omitted field.
3. Run `bun run infrastructure:preview-plan` and
   `bun run infrastructure:preview-sync`. Require all no-op/unchanged.
4. Run `bun run infrastructure:preview-drift`. Its separately composed direct
   provider service requires Preview `true` and Production `null`, sets only
   Preview to `false` while explicitly preserving Production `null`, and reads
   both back before returning. Then run
   `bun run infrastructure:preview-sync`. Require only `PreviewFeedback`
   `drifted`; the disposable environment resource must be unchanged.
5. Run `bun run infrastructure:preview-repair`, read back `true`, then run two
   consecutive `bun run infrastructure:preview-sync` commands and require
   unchanged.
6. Run `bun run infrastructure:preview-rollback-plan`. Stop unless it contains
   one feedback update to the recorded prior value and deletion of only the
   disposable environment resource. Run
   `bun run infrastructure:preview-rollback`, read back
   `enablePreviewFeedback: null` and zero key matches, then require a
   deterministic rollback no-op.
7. After the coherent implementation commit is pushed, observe only the
   Vercel Git-created Preview deployment whose `githubCommitSha` equals that
   immutable commit. Do not call a deployment-create or promotion operation.
   If authenticated project readback shows the exact project has no Git link,
   stop deployment polling. Validate the distinct mode-`0600`
   `tmp/proof/vercel-git-link.authority.json` with
   `bun run infrastructure:vercel-git-link-authority`, connect only
   `bundjil-agent` to `github:crcorbett/bundjil` through the supported Vercel
   Git surface, and read back that exact link before another branch push.
   This project-global bootstrap names both Preview and Production in its
   separate authority; it does not authorize a deployment create, promotion,
   Production configuration write, alias change, or deletion. Its rollback is
   to disconnect only that exact link and read back the prior absent-link state.

## Report-only drift and monitoring

The report-only path wraps the same stable stack, stage-owned R2 state, native
desired plan, and native Alchemy `sync --dry-run`. It does not own repair.
Before every run:

1. Validate the static read-only policy envelope against both the fixed harness
   contract and
   `packages/infrastructure/schemas/drift-report-authority.schema.json`. It is
   protected environment custody and is fingerprinted by each run; it is not a
   one-run identity. Bind execution dynamically to the exact checked-out source
   SHA and branded GitHub repository/run/attempt identity. Carry those values
   plus the receipt-bearing post-apply Preview manifest's decoded digest through
   the Schema-encoded report and bounded receipt.
   A filename containing `current` is convenience custody only and is not an
   evidence owner: stop if it differs from the last accepted post-apply
   manifest or receipt.
   The hosted workflow must set
   `BUNDJIL_INFRASTRUCTURE_MANIFEST_DIGEST` to the exact accepted digest owned
   by that manifest. File custody without the configured digest is an invalid
   command boundary, not provider drift.
   Require external access `read_only`, local report writes only, Preview as
   the sole environment, and exactly the native plan plus sync-dry-run
   operations.
2. Provide the static authority policy, manifest, provider/state environment
   file, output report, and bounded-receipt paths only through mode-`0600`
   custody. The environment file must contain the exact project-scoped,
   sibling-denial-verified Vercel credential JSON described above, never the broad
   inventory token. The
   project provider observes each manifest project by exact ID and cannot call
   the team-wide project-list operation under this Layer. Never put credentials
   in workflow YAML, tracked files, command arguments, stdout, report fields,
   or receipts. Vercel access tokens are not method-level read-only
   credentials; exact project scope, sibling-denial readback, dedicated
   revocation, the read-only command graph, `contents: read`, and zero-write
   receipt are the controls.
   For Marketplace bindings, the read-only command may read only the exact
   project's environment `contentHint`. Do not substitute the denied
   account-wide storage list or broaden the token. Treat the manifest's
   external database ID as retained identity after the observable project,
   integration, configuration and resource IDs match, not as fresh provider
   readback.
   GitHub cannot hold the accepted 155-resource manifest as raw secret text.
   After the owning `AdoptionManifestJson` Schema has encoded the exact
   accepted manifest, gzip it and base64-encode the compressed bytes in memory
   for `BUNDJIL_INFRASTRUCTURE_DRIFT_MANIFEST_JSON`. The hosted custody step
   must decode and decompress that value directly into the mode-`0600`
   manifest path before `infrastructure:drift-report` Schema-decodes it again.
   Do not hand-compose, log, retain, or treat the compressed transport as a
   different manifest. The authority audit owns the exact materialisation
   pipeline and rejects a direct copy or missing decode step.
   If approved custody does not also contain the exact Preview Photon pair,
   stop before constructing any artifact. Do not decrypt or copy a Vercel
   sensitive environment value and do not substitute the source/Production
   Photon pair.
3. Run `bun run infrastructure:drift-report`. The command validates the
   authority before provider/state resolution, rejects every non-Preview stage,
   decodes native output once, fingerprints physical identities, and emits
   only classified metadata. It never calls apply, reconcile, repair, deploy,
   promote, Photon mutation, or Production.
4. Interpret desired-state plan changes separately from native provider
   observation. Require explicit classifications for expected normalization,
   unowned, missing, in-place, destructive, unavailable/ambiguous readback,
   unknown secret revision, skipped provider read, deployment drift, and
   desired-plan change. Native attempts or duration absent from the pinned
   result remain `NotExposed`; if native execution fails before returning a
   plan, the plan itself remains `NotExposed` and the bounded result is
   inconclusive rather than fabricated zero counts.
   Vercel may return named custom deployment targets such as `staging`.
   Decode the non-empty provider target at ingress, then admit only exact
   `preview`, `production`, or the provider's legacy `null` Preview target.
   Ignore custom targets; never relabel one as Preview or Production.
   Vercel sensitive environment values are write-only at this boundary. A row
   with an `ObservedUnknown` accepted manifest baseline may classify
   `unknownSecretRevision` as accepted only when native sync returns
   `unchanged` and present provider revision metadata matches the persisted
   observation. This proves metadata continuity, not the remote value. Missing
   revision metadata or any changed row remains inconclusive.
5. Exit `0` is a Schema-valid `no_op` or accepted report-only result, exit `1`
   is blocking drift, and exit `2` is inconclusive or a rejected boundary.
   Before a receipt exists, a rejected boundary emits only its safe phase:
   runtime initialisation, R2 state configuration, R2 state initialisation,
   command configuration, authority artifact, manifest artifact, report
   construction, receipt persistence, or a fixed command-policy reason.
   A native provider-read failure may also emit only its closed typed error
   name and closed typed reason, never its message, request, response, URL,
   headers, provider payload, credential, or other underlying value. None is
   repair authority. A read-only Photon project metadata change is a report,
   not repair authority. A returned Vercel deployment must match every current
   typed field. An accepted historical deployment that is no longer returned
   by Vercel's current project list is
   `historicalDeploymentUnavailable`/`report`: it is not drift repair
   authority, a no-op claim, or proof that the deployment still exists.
   Missing or stale runs, signed-ingress/replay/send/typing failures,
   Photon inventory/billing failures, and report failures are operator signals;
   Photon exposes no alert-policy or persistent delivery-log management API,
   and no alert transport is claimed by this procedure.

The desired GitHub workflow is `.github/workflows/infrastructure-drift.yml`.
It is limited to same-repository pull requests, one weekly schedule, and manual
dispatch; uses `contents: read`, one protected read-only Preview environment,
exact secret artifacts, bounded concurrency, and a 20-minute timeout; and
executes only the report command. Its always-run readback prints a grouped
summary of non-accepted resource kind, category, disposition and count before
the bounded receipt. It omits resource fingerprints and all provider values so
a failed hosted run can be diagnosed without widening disclosure. Workflow
source does not prove the GitHub
environment, secret metadata, settings, a hosted run, or alert delivery.
Current external settings and any hosted qualification require fresh
authenticated readback under the authority model. Rollback is to disable the
workflow or revoke its read-only environment under separately authorized
GitHub-setting authority; no provider rollback is needed because the command
performs zero provider writes.

Every mutation is read-before/write/read-after. Encode at the exact provider
boundary, decode the complete response immediately, and stop on a mismatched
identity, ambiguous key, unexpected plan action, or uncertain outcome after
bounded observation. Retain Schema-valid mode-`0600` authority and receipt
artifacts under ignored `tmp/proof/**`.

Do not let Alchemy create, deploy, or promote Vercel deployments. Both app
configs disable Git-triggered deployment; manual staging and promotion remain
owned by the target deployment runbook. Do not create or mutate Photon
projects, dedicated lines, billing, users, webhooks, or platform settings
unless one current SPEC and sibling task ledger routed by the canonical
indexes, plus the exact authority envelope, name that operation.

## Rollback, credential replacement, and revocation

Never destroy the R2 bucket or delete retained provider resources to roll back
repository code. Revert the desired Git revision, run a read-only plan and
sync, and apply only an explicitly approved property restoration. Preserve the
prior provider values, state revision, manifests, deployments, Photon
identities, and bounded receipts until the rollback window closes.

To replace the R2 credential, create a second Object Read & Write credential
scoped to the exact bucket, verify state read using the new credential, update
only the ignored/provider-secret owner, read back the same state identity, and
then revoke the old exact credential. Never revoke first or guess between
credentials. Credential disclosure, uncertain write outcome, missing
read-after-write, state mismatch, secret in state/logs, cross-stage identity,
unexpected create/replace/delete, provider 4xx/5xx without classified
recovery, or unbounded billing is an immediate stop.

Escalate state or Cloudflare identity failures to the Cloudflare account owner,
Vercel identity/configuration failures to the exact project owner, Photon
failures to the Photon project owner, and deployment/runtime concerns to the
corresponding app deployment runbook.
