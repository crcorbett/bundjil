---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-25
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

The Photon project is currently one shared Free physical identity observed in
both state stages. That is migration state, not Preview/Production Photon
isolation and not authority to mutate it.

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

## Configuration and drift

For a separately approved apply, record the immutable before identity and safe
rollback value for every property. Read before writing, encode at the exact
provider boundary, decode the complete response immediately, read after
writing, and require a deterministic second no-op. A drift exercise must name
the direct-provider mutation separately, detect the exact property with
`sync --dry-run`, repair it once, and prove the accepted value again.

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
