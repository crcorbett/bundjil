---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-30
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
   authority. Plan must prove 106 completed retained rows and the seven exact
   fingerprinted Photon rows; apply must persist the complete mode-`0600`
   backup before removing only those state rows and read back 99. Restore mode
   is the exact rollback until the next adoption reaches no-op. This command
   composes Alchemy state only and authorizes no provider delete.

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
   zero create, replace, delete, or other update.
2. Capture the externally retained prior four values and their revision in
   approved secret custody. Run
   `bun run infrastructure:stable-preview-apply`. Each provider request must
   target the same environment ID with `sensitive` and `preview`, then decode a
   complete acknowledgement with a new provider revision. Values must never
   appear in stdout, Alchemy state, receipts, plans, or tracked files.
3. A known 429 or 5xx receives exponential jitter and at most three total
   attempts. A malformed response, identity mismatch, 4xx policy failure, or
   timeout after a possible write is fail-closed. Never blindly retry an
   uncertain write: Vercel metadata can show an update timestamp but cannot
   prove the write-only value. Preserve both candidate and prior values and
   require operator classification before another apply.
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

Every mutation is read-before/write/read-after. Encode at the exact provider
boundary, decode the complete response immediately, and stop on a mismatched
identity, ambiguous key, unexpected plan action, or uncertain outcome after
bounded observation. Retain Schema-valid mode-`0600` authority and receipt
artifacts under ignored `tmp/proof/**`.

Do not let Alchemy create, deploy, or promote Vercel Git deployments. Do not
create or mutate Photon projects, dedicated lines, billing, users, webhooks,
or platform settings unless the active SPEC task and authority envelope name
that exact operation.

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
