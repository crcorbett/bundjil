---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-24
review_trigger: task status, provider metadata, workflow, CI, PR, cleanup, or claim change
spec: ../../product-specs/doppler-secret-custody.md
task_ledger: ../../product-specs/doppler-secret-custody.tasks.json
---

# Doppler secret custody execution plan

Status: In progress

Branch: `codex/doppler-secret-ownership`

Base: `origin/main` at `c154d725372617c699538629712569518ee18099`

## Ordered work

1. Complete the source-to-consumer inventory and three-config decision.
2. Implement root/internal command splits, workflow fetches, action lock,
   executable authority tests, Knip admission and current documentation.
3. Create the Personal Doppler project/config values and expiring read-only
   tokens, then add only `DOPPLER_TOKEN` to each exact GitHub Environment.
4. Run focused and full local verification, commit, push and open a PR to
   `main`.
5. Wait for hosted checks. Record CI, Preview drift, Doppler, GitHub and Vercel
   metadata separately. Do not run Production.

## Stop conditions

Stop on a Personal/Tilt scope mismatch, repository/project/environment
mismatch, unavailable source value, secret-value output, unexpected provider
permission, action-pin mismatch, fork credential path, deployment trigger, or
need to delete/revoke a legacy credential.

## Current limitations

- Doppler OIDC is unavailable on the current Personal Developer plan.
- The two exact Vercel projects currently report no Git repository link.
- Existing open PR `#6` owns broader hosted drift and project-credential
  corrections. This branch carries only its current-provider-compatible
  compressed-manifest materialisation, exact digest, executable Bun argument
  order and sanitised receipt readback because the migrated `stg` value already
  uses that format. The remaining overlap is reported, not treated as merged.
- Production fetch and runtime/public behaviour cannot be proved without a
  later eligible main-push CI event, which is outside this no-deploy task.
