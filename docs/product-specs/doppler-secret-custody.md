---
document_type: product-spec
lifecycle: implemented
authority: supporting
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-31
review_trigger: Doppler project/config/token, GitHub secret, workflow, root command, Vercel project, Alchemy state, or credential-consumer change
task_ledger: doppler-secret-custody.tasks.json
completed_plan: ../exec-plans/completed/doppler-secret-custody.md
---

# Doppler secret custody

## Decision

Use one Personal Doppler project, `bundjil`, with four root configs backed by
current consumers:

- `dev` supplies the documented non-secret synthetic Executor inputs to the
  friendly local verification command;
- `stg` supplies the existing read-only Preview drift workflow;
- `prd` supplies the existing automatic Production workflow; and
- `stg_repair` supplies only the approved local Preview Alchemy state repair.

The Doppler-created empty `dev_personal` branch config remains empty. No dummy
value is added to it. `stg_repair` is a separate locked root config so it does
not inherit the report-only `stg` authority, manifest or composite bundle.

The Personal Developer plan does not expose Doppler service accounts or OIDC
identities. Each hosted config therefore uses one read-only, config-scoped,
expiring service token stored as `DOPPLER_TOKEN` in its exact GitHub
Environment. GitHub fetches once with
`dopplerhq/secrets-fetch-action@451892f16195f9ac360e1a5bcbf0b5fd0e957534`
(`v2.0.0`) and maps named outputs only into the one step that consumes them.

The [environment and credential inventory](../operations/doppler-environment-inventory.md)
owns the source-to-consumer decisions. Vercel remains the owner of hosted app
runtime variables. Alchemy retains only its current R2 state and explicitly
adopted infrastructure roles. This change gives Alchemy no deployment role.

## Current evidence

- The Git remote and GitHub API identify `crcorbett/bundjil` with default
  branch `main`.
- Personal Vercel identifies team `team_1LX7ZujbijowTv8J9k0aU7nD` and projects
  `bundjil-agent` (`prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`) and
  `bundjil-codex-proxy` (`prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`). Fresh readback
  on 2026-08-31 shows the agent project linked to
  `github:crcorbett/bundjil` on `main`, while the proxy project remains
  unlinked. Both app configs still set `git.deploymentEnabled: false`. This is
  project metadata, not proof of a Git-created deployment, automatic
  Production, or public behaviour.
- `BUNDJIL_PRODUCTION_AGENT_VERCEL_TOKEN` and
  `BUNDJIL_PRODUCTION_PROXY_VERCEL_TOKEN` are exact Production workflow
  consumers. Their stage-qualified names describe distinct Production-only,
  project-scoped deployment credentials; no cross-environment logical secret
  exists to rename in this slice.
- `bundjil-alchemy-state` is the current R2 state bucket used by
  `layerAlchemyR2State`. It is infrastructure state, not a deployment
  credential or a hosted runtime variable store.
- The source-owned CI endpoint is
  `https://executor.sh/mcp/toolkits/bundjil-ci?elicitation_mode=model` with the
  synthetic key `executor-ci-synthetic-key`. Both are ordinary test inputs and
  must never be replaced by a live Executor toolkit or credential.
- Personal Doppler now has the four locked root configs and exact key sets
  described below. `stg_repair` has exactly eight direct consumer inputs and
  no service token or inherited config. The two hosted GitHub Environments each
  hold one read-only, config-scoped token expiring on 2026-09-23. Name-only
  cleanup readback found no legacy GitHub copies: each Environment retains only
  `DOPPLER_TOKEN`, and Production also retains the non-secret callback alias.
- CI run `33353598799` passed exact PR head `a28ed2b`. Preview run
  `33353598789` fetched the refreshed manifest, produced 155 desired no-ops and
  zero writes, and reduced the earlier eight inconclusive rows to the one
  provider-revision-only identity. It remained safely inconclusive.
- A fresh two-read exact-project inventory passed with digest
  `64ec77630806b6f61dba689c25c5068b8b0254f5a4062854c320f4f4b2e81813`
  and zero provider writes. The first candidate
  `f0a02c0f1bae439ae1a5019c9a7a2f8c71d58f945a508c25ab391b0686c273c3`
  retains all 155 resources, refreshes the exact eight approved identities and
  preserves every managed reference. A fresh exact-head inventory produced the
  same inventory digest. Timestamp-only candidate
  `2f3118ce3193ff12ec14a2d4041ec2aaf305453762643f4ab5fa3df92aa28e0f`
  received exact Doppler readback but was superseded before push when review
  proved that its identity omitted other admitted metadata. Version 3 candidate
  `bb731f680e64422d198ed6fa88997a23dbf4f99f55ba743d36d10c954dff76f5`
  binds the sorted full admitted metadata and provider timestamp for all eight
  rows. It is source-bound and exact `bundjil/stg` readback matched its bytes,
  digest, 155 resources and eight timestamps.
- A clean local report against that corrected candidate passed with 155 desired
  no-ops, 63 accepted rows, 92 report-only rows, zero blocking rows, zero
  inconclusive rows and zero provider writes. This is local read-only proof,
  not hosted Preview proof.
- CI run `33357705409` and Preview run `33357705406` passed exact head
  `edc5e9d0269dea81d39eb38b734a5b233884cd2e`. Preview used version 3 digest
  `bb731f680e64422d198ed6fa88997a23dbf4f99f55ba743d36d10c954dff76f5`
  and matched the local counts with 155 no-ops and zero provider writes. This
  is hosted Preview report proof, not deployment or public behaviour proof.
- Final CI run `33358065293` and Preview run `33358065300` passed exact PR head
  `c418d2e8925fb389cdbabe6fbb059b4fae7e3169`. PR `#7` then merged as
  `413d39a072f31ef64af0502b38a6a4f46786f53f`; main CI run `33358238289`
  passed. Automatic Production run `33358460243` fetched only the named
  `bundjil/prd` outputs and returned `promoted` for that exact merge SHA with
  rollback ready.
- Independent Vercel readback found both exact projects on that merge SHA in
  `READY` Production state. The stable proxy target was
  `dpl_6moFcrPmdB6FNzFjTzeiydr9Udmh`, the stable agent and callback target was
  `dpl_BoRauaL3HivkXxdKQSKbXp1n3MpH`, and the proxy health response matched the
  live Schema. Each token returned `200` only for its own project and `404` for
  the sibling. This proves deployment metadata and health only, not an end-user
  journey or public behaviour.
- The narrow repair consumer requires its own `stg_repair` config. It must not
  reuse the report-only `stg` authority. Repository code now denies provider
  writes, keeps all eight approved identities in scope, accepts only the exact
  seven-update/148-no-op state plan, applies that same in-memory plan to Preview
  Alchemy state, and requires 155 no-ops afterwards. The eighth
  provider-revision-only identity must remain a state no-op.
  The first operation attempt correctly stopped on the stale eight-update
  expectation. After read-only proof showed seven state updates plus one
  provider-revision-only no-op, the corrected command applied only the seven
  R2 state updates and its next plan contained 155 no-ops. The bounded receipt
  passed its Schema, but its source field names base SHA `67b2d95c` while the
  command ran from an uncommitted repair tree. It therefore proves
  the recorded state plan and convergence, not exact-source execution. The
  runbook now requires a clean committed source before any future state write.
  The later exact-head Preview runs passed against the corrected manifest.

## Command and workflow call graphs

```text
Local verification
  -> bun run verification
  -> doppler run --project bundjil --config dev
  -> bun run verification:internal
  -> repository checks and tests
```

```text
Trusted same-repository Preview drift
  -> GitHub environment infrastructure-read-only-preview/DOPPLER_TOKEN
  -> pinned Doppler fetch action
  -> three named outputs to the custody-materialisation step
  -> bun run infrastructure:drift-report:internal
  -> existing Effect Schema, read-only provider and receipt boundaries

Fork pull request
  -> job condition rejects the job before environment or secret access
```

```text
Successful same-repository main-push CI
  -> GitHub environment Production/DOPPLER_TOKEN
  -> pinned Doppler fetch action
  -> six named outputs to the deployment step
  -> bun run production:deploy:internal
  -> existing Effect ProductionDeployment service and live Layer
```

```text
Authorised Preview state metadata repair
  -> bun run infrastructure:preview-state-readmission
  -> doppler run --project bundjil --config stg_repair
  -> bun run infrastructure:preview-state-readmission:internal
  -> exact authority + eight-ID plan policy
  -> same in-memory plan applied with provider writes denied
  -> following 155-resource no-op plan + bounded receipt
```

## Requirements

1. Root commands used by people select a fixed Doppler project and config.
   Credential-neutral internal commands own the real operations. GitHub must
   call only the internal commands.
2. CI remains secret-free and calls `verification:internal` with the existing
   synthetic Executor inputs. Fork pull requests receive no Doppler or
   provider credential.
3. Each hosted workflow references only `DOPPLER_TOKEN`, fetches once, uses the
   exact v2.0.0 commit pin, leaves `inject-env-vars` disabled, and maps only the
   named outputs required by its consumer step.
4. Doppler receives no dummy or empty values. A missing value remains missing
   until a real consumer and source prove it is required.
5. Existing GitHub provider secrets and variables remain in place until merge
   and independent hosted proof. Cleanup then deletes only the five legacy
   GitHub secrets and four legacy GitHub variables named by the inventory,
   while preserving both `DOPPLER_TOKEN` entries and the callback alias. The
   underlying Vercel credentials remain active through Doppler custody.
6. Runtime Vercel variables, project connections, deployment provenance,
   Alchemy state and public behaviour remain separate claims. The only Alchemy
   mutation in this slice is the approved seven-row Preview state metadata
   readmission described above. It does not write a provider, deploy, promote,
   Git-link a project, change runtime variables, rotate a provider credential,
   or prove public behaviour.

## Downstream impact ledger

| Surface                            | Decision        | Owner and evidence                                                                                                                                             | Required result                                                                                                                       |
| ---------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and standards         | Change required | `packages/infrastructure/src/state/readmission.ts`, exact read-only Layer and tests                                                                            | State-only repair is a closed Effect boundary with provider mutation denied and exact plan policy.                                    |
| Root and package commands          | Change required | `package.json`, `packages/infrastructure/package.json`                                                                                                         | Friendly wrappers use fixed configs; internal commands stay credential-neutral.                                                       |
| Workflows and action lock          | Change required | `.github/workflows/{ci,infrastructure-drift,production}.yml`, `docs/operations/github-actions-lock.json`                                                       | Exact fetch pin, output mapping, fork exclusion and internal commands are executable policy.                                          |
| Knip and config                    | Change required | `knip.json`                                                                                                                                                    | The external `doppler` binary is explicitly admitted.                                                                                 |
| Authority and runbooks             | Change required | `tooling/authority-policy.ts`, workflow contract tests, automation register, app runbooks                                                                      | Custody and command boundaries reject direct legacy secret reads and broad injection.                                                 |
| Runtime app variables              | Preserve        | app config Schemas, app READMEs and Vercel metadata                                                                                                            | Vercel remains current storage owner; no values move.                                                                                 |
| Provider services and Layers       | Change required | adoption/readmission and drift modules, exact-project read-only Layer and focused tests                                                                        | Re-admission binds exact provider timestamps; unmatched revisions fail closed and state repair cannot read values or write providers. |
| SPEC, tasks and plan               | Change required | this SPEC, sibling ledger, completed plan and indexes                                                                                                          | Completed intent, proof, cleanup and claim limits remain routed as retained history.                                                  |
| Critical journeys and dated proof  | Preserve        | `docs/verification/README.md` routes Alchemy state receipts to ignored `tmp/proof/**`, with sanitised summary in this SPEC, its task ledger and completed plan | Hosted, provider, health and public-behaviour claims stay separate; no end-user journey is inferred.                                  |
| Skills and AGENTS                  | N/A             | `.agents/skills/docs-maintainer`, `.agents/skills/alchemy-iac`, `AGENTS.md` inspected                                                                          | No instruction or skill behaviour changes.                                                                                            |
| Frontend and browser-visible state | N/A             | no React, route or public UI consumer in the call graph                                                                                                        | No browser proof required.                                                                                                            |

## Verification and delivery

Focused proof must cover the package-script split, exact workflow action pin,
one fetch per hosted job, exact output sets, no broad injection, fork exclusion,
action-lock registration and Knip admission. Then run documentation,
authority, controls and verification checks followed by
`bun run verification` through `bundjil/dev`.

Hosted CI run `33353598799` passed exact PR head `a28ed2b`. Preview run
`33353598789` used the refreshed manifest and correctly remained inconclusive
on the provider-revision-only row with 155 desired no-ops and zero provider
writes. Two matching inventories then produced digest
`64ec77630806b6f61dba689c25c5068b8b0254f5a4062854c320f4f4b2e81813`, and the
state-only operation converged at seven updates plus 148 no-ops followed by
155 no-ops. A fresh exact-head inventory matched that digest. The timestamp-only
candidate `2f3118ce3193ff12ec14a2d4041ec2aaf305453762643f4ab5fa3df92aa28e0f`
was read back exactly but superseded before push. Version 3 digest
`bb731f680e64422d198ed6fa88997a23dbf4f99f55ba743d36d10c954dff76f5`
binds the full sorted admitted projection, so metadata-only changes cannot share
an identity. Its clean local report passed with 155 desired no-ops, zero
blocking or inconclusive rows and zero provider writes. Exact `bundjil/stg`
readback matched its bytes, digest, 155 resources and eight timestamps. CI run
`33358065293` and Preview run `33358065300` passed final head `c418d2e`; PR
`#7` merged as `413d39a`, main CI run `33358238289` passed, and automatic
Production run `33358460243` promoted that exact SHA. Independent Vercel
readback matched both stable targets, callback assignment, health and token
isolation. Name-only GitHub readback then proved only both `DOPPLER_TOKEN`
entries and the Production callback alias remain. No provider credential was
revoked, no permission was widened, and no public-behaviour claim is made.

## References

- [Doppler Secrets Fetch Action v2 configuration](https://github.com/DopplerHQ/secrets-fetch-action/tree/v2.0.0)
- [Doppler service tokens](https://docs.doppler.com/docs/service-tokens)
- [Doppler service-account identities](https://docs.doppler.com/docs/service-account-identities)
- [GitHub Actions secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [Alchemy state stores](https://alchemy.run/state-store)
