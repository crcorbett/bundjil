---
document_type: product-spec
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-31
review_trigger: Doppler project/config/token, GitHub secret, workflow, root command, Vercel project, Alchemy state, or credential-consumer change
task_ledger: doppler-secret-custody.tasks.json
active_plan: ../exec-plans/active/doppler-secret-custody.md
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
  hold one read-only, config-scoped token expiring on 2026-09-23; every legacy
  GitHub name remains.
- CI run `33351419991` passed exact PR head `67b2d95c`. Preview run
  `33351419994` attempt 2, still using the old accepted manifest, repeated the
  eight inconclusive rows with 155 no-ops and zero provider writes.
- A fresh two-read exact-project inventory passed with digest
  `64ec77630806b6f61dba689c25c5068b8b0254f5a4062854c320f4f4b2e81813`
  and zero provider writes. Candidate
  `f0a02c0f1bae439ae1a5019c9a7a2f8c71d58f945a508c25ab391b0686c273c3`
  retains all 155 resources, refreshes the exact eight approved identities and
  preserves every managed reference. The updated compressed candidate is now
  installed only as the `bundjil/stg` manifest value and is bound in source.
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
  Hosted exact-head Preview readback against the new manifest remains required.

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
   and independent hosted proof. The approved continuation may then delete only
   the five legacy GitHub secrets and four legacy GitHub variables named by the
   inventory. It must not revoke either underlying Vercel credential because
   Doppler remains their active custody owner.
6. Runtime Vercel variables, project connections, deployment provenance,
   Alchemy state and public behaviour remain separate claims. The only Alchemy
   mutation in this slice is the approved seven-row Preview state metadata
   readmission described above. It does not write a provider, deploy, promote,
   Git-link a project, change runtime variables, rotate a provider credential,
   or prove public behaviour.

## Downstream impact ledger

| Surface                            | Decision        | Owner and evidence                                                                                                                                               | Required result                                                                                            |
| ---------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Architecture and standards         | Change required | `packages/infrastructure/src/state/readmission.ts`, exact read-only Layer and tests                                                                              | State-only repair is a closed Effect boundary with provider mutation denied and exact plan policy.         |
| Root and package commands          | Change required | `package.json`, `packages/infrastructure/package.json`                                                                                                           | Friendly wrappers use fixed configs; internal commands stay credential-neutral.                            |
| Workflows and action lock          | Change required | `.github/workflows/{ci,infrastructure-drift,production}.yml`, `docs/operations/github-actions-lock.json`                                                         | Exact fetch pin, output mapping, fork exclusion and internal commands are executable policy.               |
| Knip and config                    | Change required | `knip.json`                                                                                                                                                      | The external `doppler` binary is explicitly admitted.                                                      |
| Authority and runbooks             | Change required | `tooling/authority-policy.ts`, workflow contract tests, automation register, app runbooks                                                                        | Custody and command boundaries reject direct legacy secret reads and broad injection.                      |
| Runtime app variables              | Preserve        | app config Schemas, app READMEs and Vercel metadata                                                                                                              | Vercel remains current storage owner; no values move.                                                      |
| Provider services and Layers       | Change required | adoption/readmission modules, exact-project read-only Layer and focused tests                                                                                    | Re-admission accepts only exact existing metadata; state repair cannot read values or write providers.     |
| SPEC, tasks and plan               | Change required | this SPEC, sibling ledger, active plan and indexes                                                                                                               | Current intent and claim limits remain routed until post-merge proof and cleanup.                          |
| Critical journeys and dated proof  | Preserve        | `docs/verification/README.md` routes open Alchemy state receipts to ignored `tmp/proof/**`, with sanitised summary in this SPEC, its task ledger and active plan | The bounded state receipt remains local while this SPEC is open; hosted and provider claims stay separate. |
| Skills and AGENTS                  | N/A             | `.agents/skills/docs-maintainer`, `.agents/skills/alchemy-iac`, `AGENTS.md` inspected                                                                            | No instruction or skill behaviour changes.                                                                 |
| Frontend and browser-visible state | N/A             | no React, route or public UI consumer in the call graph                                                                                                          | No browser proof required.                                                                                 |

## Verification and delivery

Focused proof must cover the package-script split, exact workflow action pin,
one fetch per hosted job, exact output sets, no broad injection, fork exclusion,
action-lock registration and Knip admission. Then run documentation,
authority, controls and verification checks followed by
`bun run verification` through `bundjil/dev`.

Hosted CI run `33351419991` passed exact PR head `67b2d95c`. Preview run
`33351419994` attempt 2 used the old manifest and correctly failed closed on
the eight changed Vercel metadata rows with 155 no-ops and zero provider
writes. Two matching inventories then produced digest
`64ec77630806b6f61dba689c25c5068b8b0254f5a4062854c320f4f4b2e81813`, and the
state-only operation converged at seven updates plus 148 no-ops followed by
155 no-ops. The accepted
`f0a02c0f1bae439ae1a5019c9a7a2f8c71d58f945a508c25ab391b0686c273c3`
manifest is installed in `bundjil/stg` and bound in source. A new exact-head CI
and Preview run must still pass before merge. Only then may the existing
automatic Production path run. Deployment, stable target, health and public
behaviour remain separate claims.

## References

- [Doppler Secrets Fetch Action v2 configuration](https://github.com/DopplerHQ/secrets-fetch-action/tree/v2.0.0)
- [Doppler service tokens](https://docs.doppler.com/docs/service-tokens)
- [Doppler service-account identities](https://docs.doppler.com/docs/service-account-identities)
- [GitHub Actions secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [Alchemy state stores](https://alchemy.run/state-store)
