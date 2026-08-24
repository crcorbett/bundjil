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

Status: Repository repair control in progress; external mutation paused

Branch: `codex/doppler-secret-ownership`

Base: `origin/main` at `c154d725372617c699538629712569518ee18099`

Pull request: `https://github.com/crcorbett/bundjil/pull/7`

Hosted state: exact-head CI run `32681495867` passed on `0f5c58c`. Preview run
`32681495864` proved Doppler fetch and custody, then failed closed on the eight
stale accepted metadata rows with zero provider writes. Production has not run.

Approval: Cooper's 2026-08-24 goal continuation authorises this plan to make PR
`#7` green, merge only after exact-head checks pass, observe the automatic
Production result, then remove only the exact proved-unused legacy GitHub
copies. It does not authorise revoking an underlying Vercel credential,
widening a permission, or claiming public behaviour without direct proof.

## Ordered work

1. Complete the source-to-consumer inventory and three-config decision.
2. Implement root/internal command splits, workflow fetches, action lock,
   executable authority tests, Knip admission and current documentation.
3. Create the Personal Doppler project/config values and expiring read-only
   tokens, then add only `DOPPLER_TOKEN` to each exact GitHub Environment.
4. Run focused and full local verification, commit, push and open a PR to
   `main`.
5. Wait for hosted checks. Record CI, Preview drift, Doppler, GitHub and Vercel
   metadata separately.
6. Fold the exact-project provider corrections from PR `#6` into this branch.
   Re-admit only the eight changed Preview Vercel environment metadata rows
   from two matching read-only inventories, keep their values as non-claims,
   refresh the accepted manifest transport and run the full repository gate.
7. Require exact-head CI and Preview drift success, merge PR `#7`, then observe
   only the automatic main-push Production path. Keep immutable deployment,
   stable target, health and public behaviour as separate claims.
8. After independent hosted proof, remove only the five legacy GitHub secrets
   and four legacy GitHub variables named by the inventory. Read back names.
   Do not revoke the Vercel credentials that Doppler still supplies.

## Stop conditions

Stop on a Personal/Tilt scope mismatch, repository/project/environment
mismatch, unavailable source value, secret-value output, unexpected provider
permission, action-pin mismatch, fork credential path, unapproved provider
write, changed re-admission scope, failed exact-head check, or any cleanup
target outside the nine exact GitHub copies.

## Current limitations

- Doppler OIDC is unavailable on the current Personal Developer plan.
- The two exact Vercel projects currently report no Git repository link.
- PR `#6`'s exact-project provider, R2, Marketplace and drift-classification
  corrections are merged into this branch; PR `#7` now owns the combined
  successor.
- The eight stopped Vercel rows are live exact Preview identities whose type or
  provider revision changed after the prior accepted manifest. Re-admission may
  accept current metadata only after two matching read-only inventories. It
  cannot claim a write-only value or hide a changed row.
- Exact-project inventory digest
  `5f4c591dcc3af0a11c93fe79cdbf092000c84a2e005e10eb36ee3d3c3cb64e36`
  passed two-read equality with zero provider writes. The bounded re-admission
  candidate `35bc11a3c17fa55d03a0587818a9b0ee9288c65f3049da6b5a562835dafef3cf`
  keeps 155 resources, refreshes the approved eight identities, preserves all
  managed references and performs no provider or state write. It is not yet
  the hosted accepted manifest.
- The Alchemy memory-provider contract now simulates an external Vercel
  type/revision change, refreshes the `ObservedUnknown` output into state,
  records zero provider writes, and proves the following plan is no-op. This is
  repository proof only; an exact real dry-run and state readback are still
  required.
- A distinct `stg_repair` consumer and state-only command are now repository
  owned. The command denies provider mutation services, accepts only the exact
  eight-update/147-no-op plan, applies the same in-memory plan and requires a
  155-no-op follow-up plan. Local checks do not prove a real R2 state change.
- External state mutation, merge, deployment and cleanup remain paused pending
  Cooper's response to the reported credential exposure. No exposed value is
  recorded here and no provider credential has been rotated or revoked.
- Production fetch, deployment and runtime/public behaviour remain unproved
  until the later eligible main-push CI event and their separate readbacks.
