---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-21
review_trigger: Vercel credential custody, GitHub environment custody, drift artifacts, automatic Production deployment, or channel proof
---

# Personal Vercel custody continuation

## Status

The four one-year project-scoped Personal Vercel credentials are created,
assigned-project/sibling-denial tested, and stored in the personal `bundjil`
1Password vault. The two Production credentials are installed in the exact
GitHub `Production` environment. The Preview Photon credential and exactly
three drift artifacts are installed in `infrastructure-read-only-preview`.
Run `32440487569` is rejected because Bun showed help and exited zero without
running drift or producing a receipt. The corrected workflow and negative
authority fixtures are now the active repository slice.

## Exact scope

- Personal Vercel team: `team_1LX7ZujbijowTv8J9k0aU7nD`.
- Agent project: `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`.
- Proxy project: `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`.
- 1Password vault: `bundjil`, `u6jbz5fuuvz7vlfthnm5dtwnpq`.
- GitHub environments: `Production` and `infrastructure-read-only-preview`.

## Milestones

- [x] Replace the four credentials with separately revocable one-year
      dashboard credentials with exact project scope and expiry `2027-08-21`.
- [x] Prove assigned-project HTTP 200 and sibling-project HTTP 404 for every
      credential before custody.
- [x] Store concealed values and sanitised metadata in four exact 1Password
      items with local SHA-256 fingerprint prefixes; the dashboard exposed no
      provider token ID.
- [x] Install the two named Production secrets and read back only names.
- [x] Read back the Production variables, ruleset `20616946`, and environment
      protection; no human approval or wait timer was added.
- [x] Confirm the approved Preview Photon credential in the exact personal
      vault without reading a Vercel sensitive environment value.
- [x] Build and install exactly three Schema-decoded drift artifacts from the
      distinct drift pair, Preview Photon credential and accepted R2 state.
- [x] Reject run `32440487569` as a false green because no report or receipt
      was produced despite the green GitHub result.
- [x] Correct the Bun argument order and require receipt readback; add negative
      authority fixtures for both false-green paths.
- [ ] Push the verified correction and require one genuine hosted zero-write
      receipt on its exact source.
- [ ] Push the verified main state and prove the automatic `workflow_run`
      Production path, exact deployments, stable aliases, health, Terra High,
      rollback readiness, and bounded downstream claims.

## Evidence owners

- Custody and external readback: the dated packet and detail linked above.
- Repository desired state: the canonical SPEC, task ledger, authority
  register, automation registers, runbook and verification router.
- Provider state: only fresh authenticated readback at the time of the next
  approved operation.

## Stop and rollback

Stop when an artifact, project binding, source SHA, report file, receipt file,
provider read or zero-write claim is missing. Do not accept a green workflow
result without the Schema-valid receipt. Each Vercel token can be revoked
separately; the two GitHub Production secrets and three drift artifacts can be
removed under their exact environment authorities. No deployment rollback is
needed for the rejected drift run because it executed no provider command.

## Documentation impact ledger

| Surface                            | Decision        | Owner/readback                                                                                           |
| ---------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| SPEC and task ledger               | Change required | Current one-year custody, installed drift package and rejected false green are recorded.                 |
| Authority and automation registers | Change required | GitHub/Vercel custody and false-green readback are updated without storing values.                       |
| Runbook                            | Preserve        | It already requires a Schema-valid receipt; the executable workflow and authority oracle were defective. |
| Verification packet and router     | Change required | Dated failed detail preserves exact run identity, missing receipt, correction and non-claims.            |
| Workflow and authority fixtures    | Change required | Correct Bun ordering and make receipt existence/readback an executable postcondition.                    |
| Effect code and provider values    | Preserve        | No provider adapter or provider value is changed by the false-green correction.                          |
| Root/app README and architecture   | Preserve        | No public command or stable architecture boundary changed.                                               |

## Verification status

Focused JSON, documentation, authority, controls and skills checks pass. The
full repository verification passes with the documented process-local
synthetic Executor configuration: 138 boundary tests, formatting/lint, nine
workspace type checks and all 15 workspace test tasks passed; the Agent suite
passed 80 tests. External claims remain separated: repository proof does not
prove hosted drift, deployment, provider behaviour, delivery, handset state or
future runs.
