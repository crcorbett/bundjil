---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-31
review_trigger: task status, provider metadata, workflow, CI, PR, cleanup, or claim change
spec: ../../product-specs/doppler-secret-custody.md
task_ledger: ../../product-specs/doppler-secret-custody.tasks.json
---

# Doppler secret custody execution plan

Status: Versioned timestamp-bound correction pending Doppler and hosted proof

Branch: `codex/doppler-secret-ownership`

Base: `origin/main` at `8c97942d8c3737525c0d9d2e47d24d3637c138ec`

Pull request: `https://github.com/crcorbett/bundjil/pull/7`

Hosted state: CI run `33357705409` and Preview run `33357705406` passed exact
head `edc5e9d0269dea81d39eb38b734a5b233884cd2e`. Preview fetched version 3
manifest `bb731f680e64422d198ed6fa88997a23dbf4f99f55ba743d36d10c954dff76f5`
and reported 155 desired no-ops, 63 accepted rows, 92 report-only rows, zero
blocking, zero inconclusive and zero provider writes. Exact `bundjil/stg`
readback matched its bytes, digest, 155 resources and eight timestamps.
Production has not run for this PR.

Approval: Cooper's 2026-08-24 goal continuation authorises this plan to make PR
`#7` green, merge only after exact-head checks pass, observe the automatic
Production result, then remove only the exact proved-unused legacy GitHub
copies. It does not authorise revoking an underlying Vercel credential,
widening a permission, or claiming public behaviour without direct proof.

## Ordered work

1. Complete the source-to-consumer inventory and consumer-backed config
   decision.
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
- Fresh provider readback shows the exact agent project linked to
  `github:crcorbett/bundjil` on `main` and the proxy project unlinked. Both
  repository app configs still disable direct Vercel Git deployment. This
  mixed link metadata is not deployment provenance.
- PR `#6`'s exact-project provider, R2, Marketplace and drift-classification
  corrections are merged into this branch; PR `#7` now owns the combined
  successor.
- The eight stopped Vercel rows are live exact Preview identities whose type or
  provider revision changed after the prior accepted manifest. Re-admission may
  accept current metadata only after two matching read-only inventories. It
  cannot claim a write-only value or hide a changed row.
- Exact-project inventory digest
  `64ec77630806b6f61dba689c25c5068b8b0254f5a4062854c320f4f4b2e81813`
  passed two-read equality with zero provider writes. The bounded re-admission
  first candidate
  `f0a02c0f1bae439ae1a5019c9a7a2f8c71d58f945a508c25ab391b0686c273c3`
  keeps 155 resources, refreshes the approved eight identities and preserves
  all managed references. Timestamp-only candidate
  `2f3118ce3193ff12ec14a2d4041ec2aaf305453762643f4ab5fa3df92aa28e0f`
  received exact Doppler readback but was superseded before push because its
  identity did not bind all admitted metadata. Version 3 candidate
  `bb731f680e64422d198ed6fa88997a23dbf4f99f55ba743d36d10c954dff76f5`
  binds each row's full desired metadata and provider timestamp. Its local
  report passed with 155 no-ops and zero blocking, inconclusive or provider
  writes. Exact Doppler readback matched its digest, 155 resources and eight
  timestamps. Hosted Preview run `33357705406` passed exact head `edc5e9d` with
  the same counts and zero provider writes.
- The live state-only operation applied the exact seven-update/148-no-op plan
  after all eight approved identities passed scope validation. The eighth
  provider-revision-only identity remained a no-op. Its following plan and a
  separate read-only plan both contained 155 no-ops. Its receipt names base SHA
  `67b2d95c`, but the command ran from an uncommitted repair tree, so
  it is not exact-source execution proof. This proves only the observed Alchemy
  state transition and convergence, not hosted provider drift.
- A distinct `stg_repair` consumer and state-only command are now repository
  owned. The command denies provider mutation services, keeps all eight
  approved identities in scope, accepts only the exact seven-update/148-no-op
  state plan, applies the same in-memory plan and requires a 155-no-op follow-up
  plan. The provider-revision-only eighth identity must remain unchanged in
  state. The config is a locked root with exactly eight direct inputs, no
  service token and no inherited `stg` values.
- A clean local report against the timestamp-bound candidate passed 155 desired
  no-ops, 63 accepted rows, 92 report-only rows, zero blocking rows, zero
  inconclusive rows and zero provider writes. This is not hosted proof.
- Merge, deployment and cleanup remain paused pending exact-head hosted checks.
  No exposed value is recorded here and no provider credential has been
  rotated or revoked.
- Production fetch, deployment and runtime/public behaviour remain unproved
  until the later eligible main-push CI event and their separate readbacks.
