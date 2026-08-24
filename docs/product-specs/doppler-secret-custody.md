---
document_type: product-spec
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-24
review_trigger: Doppler project/config/token, GitHub secret, workflow, root command, Vercel project, Alchemy state, or credential-consumer change
task_ledger: doppler-secret-custody.tasks.json
active_plan: ../exec-plans/active/doppler-secret-custody.md
---

# Doppler secret custody

## Decision

Use one Personal Doppler project, `bundjil`, with only three configs backed by
current consumers:

- `dev` supplies the documented non-secret synthetic Executor inputs to the
  friendly local verification command;
- `stg` supplies the existing read-only Preview drift workflow; and
- `prd` supplies the existing automatic Production workflow.

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
  `bundjil-codex-proxy` (`prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`). Both project
  records currently report no Git repository link. This is provider metadata,
  not deployment or public-behaviour proof.
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
- Personal Doppler now has the three root configs and exact key sets described
  below. The two hosted GitHub Environments each hold one read-only,
  config-scoped token expiring on 2026-09-23; every legacy GitHub name remains.
- Final-source Preview run `32676125884` proved the pinned fetch, custody files,
  compressed manifest and sanitised receipt, then stopped inconclusive on the
  pre-existing native Alchemy readback failure. No Production run was started.

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
   Alchemy state and public behaviour remain separate claims. This change does
   not deploy, promote, Git-link a project, change runtime variables, mutate an
   Alchemy stack, rotate a provider credential, or prove public behaviour.

## Downstream impact ledger

| Surface                            | Decision        | Owner and evidence                                                                                          | Required result                                                                                      |
| ---------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Architecture and standards         | Preserve        | `docs/architecture/repo-structure.md`, `docs/architecture/effect-patterns.md`, `docs/standards/controls.md` | No service, Schema, Layer, package or control admission changes.                                     |
| Root and package commands          | Change required | `package.json`, `packages/infrastructure/package.json`                                                      | Friendly wrappers use fixed configs; internal commands stay credential-neutral.                      |
| Workflows and action lock          | Change required | `.github/workflows/{ci,infrastructure-drift,production}.yml`, `docs/operations/github-actions-lock.json`    | Exact fetch pin, output mapping, fork exclusion and internal commands are executable policy.         |
| Knip and config                    | Change required | `knip.json`                                                                                                 | The external `doppler` binary is explicitly admitted.                                                |
| Authority and runbooks             | Change required | `tooling/authority-policy.ts`, workflow contract tests, automation register, app runbooks                   | Custody and command boundaries reject direct legacy secret reads and broad injection.                |
| Runtime app variables              | Preserve        | app config Schemas, app READMEs and Vercel metadata                                                         | Vercel remains current storage owner; no values move.                                                |
| Provider services and Layers       | Preserve        | `packages/infrastructure/src/**`                                                                            | Existing redaction, exact project routing, replay, receipt and rollback boundaries remain unchanged. |
| SPEC, tasks and plan               | Change required | this SPEC, sibling ledger, active plan and indexes                                                          | Current intent and claim limits remain routed until post-merge proof and cleanup.                    |
| Critical journeys and dated proof  | Preserve        | `docs/verification/**`                                                                                      | Local and hosted CI results are reported separately; no deployment/public claim is added.            |
| Skills and AGENTS                  | N/A             | `.agents/skills/docs-maintainer`, `.agents/skills/alchemy-iac`, `AGENTS.md` inspected                       | No instruction or skill behaviour changes.                                                           |
| Frontend and browser-visible state | N/A             | no React, route or public UI consumer in the call graph                                                     | No browser proof required.                                                                           |

## Verification and delivery

Focused proof must cover the package-script split, exact workflow action pin,
one fetch per hosted job, exact output sets, no broad injection, fork exclusion,
action-lock registration and Knip admission. Then run documentation,
authority, controls and verification checks followed by
`bun run verification` through `bundjil/dev`.

After the PR opens, hosted CI must prove the exact PR source. Preview run
`32676659435` proved the `stg` fetch and custody path but correctly failed
closed on eight changed Vercel metadata rows. The approved continuation must
use two matching exact-project read-only inventories to re-admit only those
rows, refresh the accepted digest and obtain exact-head CI plus Preview success.
Only then may it merge and observe the existing automatic Production path.
Deployment, stable target, health and public behaviour remain separate claims.

## References

- [Doppler Secrets Fetch Action v2 configuration](https://github.com/DopplerHQ/secrets-fetch-action/tree/v2.0.0)
- [Doppler service tokens](https://docs.doppler.com/docs/service-tokens)
- [Doppler service-account identities](https://docs.doppler.com/docs/service-account-identities)
- [GitHub Actions secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [Alchemy state stores](https://alchemy.run/state-store)
