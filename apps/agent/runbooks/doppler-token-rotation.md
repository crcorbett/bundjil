---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-09-23
review_trigger: Doppler service-token, GitHub Environment secret, expiry, workflow, or credential-owner change
---

# Rotate GitHub's Doppler bootstrap tokens

This procedure covers only the two read-only service tokens fetched by
`crcorbett/bundjil` GitHub Actions. Production reads `bundjil/prd` through the
`Production` Environment; Preview infrastructure drift reads `bundjil/stg`
through `infrastructure-read-only-preview`. Each Environment stores a secret
named `DOPPLER_TOKEN`. Do not put either token in repository or organization
secrets, another project, a command argument, a log, or a committed file.

## Authority and preconditions

Record the operator, approval, time, `main` SHA, and intended one-year expiry.
The operator must authenticate to the Personal Doppler workplace and the
`crcorbett` GitHub account. Read back the exact Doppler project/config and the
GitHub Environment secret's name and update time. Confirm that the two workflow
files still consume only their matching Environment's `DOPPLER_TOKEN`.

The approved operation is one equivalent replacement per Environment: create
a read-only token scoped to its exact config, verify that it can read that
config and cannot read the other config, then replace the matching GitHub
Environment secret. This approval does not cover a wider token, deployment,
provider configuration change, or secret-value export.

## Procedure

1. Create each replacement with Doppler's `configs tokens create`, explicit
   `--project bundjil`, `--config stg` or `prd`, `--access read`, and
   `--max-age 8760h`. Use a distinct dated name for each token. Capture its
   one-time value only in the current shell, without tracing commands or
   printing it.
2. With the new token in that shell, require a successful metadata-only read of
   its own config and a denied read of the other config. Stop if either check
   fails. Keep the token available for retry until GitHub confirms the write.
3. Pipe the value to `gh secret set DOPPLER_TOKEN --repo crcorbett/bundjil
--env <exact-environment>` on standard input. Read back the GitHub secret's
   name and `updated_at`. Unset the shell value immediately after the write.
4. Read back Doppler service-token metadata: token name, config, read-only
   access, and expiry. Never record a token value or a full credential-bearing
   CLI response. Repeat for the other Environment.
5. Dispatch the report-only infrastructure drift workflow on `main` and check
   its result. Production's next eligible successful main CI run is the hosted
   consumer proof for the Production token; a GitHub secret timestamp or direct
   Doppler read alone does not prove that deployment path.
6. Record a dated, secret-negative receipt and update the current Doppler
   inventory. Revoke only an identified old token after both the new GitHub
   binding and its consumer proof pass. An already-expired token needs no
   emergency revocation, but confirm its provider status before claiming it
   absent.

## Failure and recovery

If a new token is created but GitHub rejects its binding, retry the same
Environment with the still-held token. If the value is lost, revoke that
unbound token by its exact Doppler slug and create a replacement. If Preview
proof fails, leave Production untouched until the cause is understood. If a
Production run fails, inspect only its sanitized job result; restore the last
known working credential only if it is still valid, otherwise create a new
config-scoped token and repeat the readback. Stop on account, project, config,
Environment, access, expiry, or workflow mismatch and escalate to Cooper.
