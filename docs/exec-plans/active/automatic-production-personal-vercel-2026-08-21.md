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

The four 90-day project-scoped Personal Vercel credentials are created,
assigned-project/sibling-denial tested, and stored in the personal `bundjil`
1Password vault. The two Production credentials are installed in the exact
GitHub `Production` environment. The drift environment is intentionally empty:
approved Preview Photon custody is missing, so no incomplete artifact or
report-only run has been attempted. The current bounded result is the
inconclusive packet
[`automatic-production-personal-vercel-custody-inconclusive-2026-08-21.json`](../../evidence/verification/packets/automatic-production-personal-vercel-custody-inconclusive-2026-08-21.json).

## Exact scope

- Personal Vercel team: `team_1LX7ZujbijowTv8J9k0aU7nD`.
- Agent project: `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`.
- Proxy project: `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`.
- 1Password vault: `bundjil`, `u6jbz5fuuvz7vlfthnm5dtwnpq`.
- GitHub environments: `Production` and `infrastructure-read-only-preview`.

## Milestones

- [x] Create four separately revocable 90-day dashboard credentials with exact
      project scope and expiry `2026-11-18`.
- [x] Prove assigned-project HTTP 200 and sibling-project HTTP 404 for every
      credential before custody.
- [x] Store concealed values and sanitised metadata in four exact 1Password
      items; the dashboard exposed no token ID or fingerprint.
- [x] Install the two named Production secrets and read back only names.
- [x] Read back the Production variables, ruleset `20616946`, and environment
      protection; no human approval or wait timer was added.
- [x] Confirm the drift environment remains empty and retain the stop.
- [ ] Obtain an approved Preview Photon credential without reading a Vercel
      sensitive environment value or substituting the source/Production pair.
- [ ] Build the three Schema-decoded drift artifacts, install them, dispatch
      one report-only run, and retain a successful zero-write receipt.
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

Stop before drift artifact construction when the Preview Photon secret is not
in approved custody. Do not decrypt or copy a Vercel environment value, use the
source/Production Photon pair, install an incomplete artifact, or dispatch a
known-failed run. Each Vercel token can be revoked separately; the two GitHub
Production secret names can be removed under the same exact environment
authority. No deployment rollback is needed because no deployment was
attempted in this continuation.

## Documentation impact ledger

| Surface                                   | Decision        | Owner/readback                                                                                          |
| ----------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| SPEC and task ledger                      | Change required | Current custody, drift stop and deferred deployment result recorded in the canonical owners.            |
| Authority and automation registers        | Change required | GitHub/Vercel custody and current external readback updated without storing values.                     |
| Runbook                                   | Change required | Report-only precondition now stops before artifact construction when Preview Photon custody is missing. |
| Verification packet and router            | Change required | Dated detail preserves exact IDs, counts, names, limits and non-claims.                                 |
| Workflow, Effect code and provider values | Preserve        | No repository runtime or provider value was changed in this continuation.                               |
| Root/app README and architecture          | Preserve        | No public command or stable architecture boundary changed.                                              |

## Verification status

Focused JSON, documentation, authority, controls, skills and full repository
checks must pass after these documentation/evidence changes. External claims
remain separated: repository proof does not prove hosted drift, deployment,
provider behaviour, delivery, handset state or future runs.
