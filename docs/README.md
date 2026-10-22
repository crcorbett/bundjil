# Bundjil documentation

Start with the owner of the code being changed. Keep instructions beside their
owner and update them when behaviour changes. Do not create audit ledgers,
approval inventories or receipt-only PRs for ordinary changes.

- [Architecture](architecture/README.md): apps, packages and shared contracts.
- [Code rules](architecture/effect-patterns.md), [package boundaries](architecture/repo-structure.md) and [React composition](architecture/frontend-composition.md).
- [Checks](architecture/testing-and-quality.md): lint, unused code, types, tests and builds.
- [Current work](product-specs/index.md) and [active plans](exec-plans/active/README.md).
- [Agent](../apps/agent/README.md) and [proxy](../apps/codex-proxy/README.md): purpose, commands and public contracts.
- [Agent operations](../apps/agent/runbooks/README.md) and [proxy operations](../apps/codex-proxy/runbooks/README.md): deployment, recovery and credential handling.
- [Authority](operations/authority-model.md): permission and deployment safeguards.
- [Credentials and environments](operations/doppler-environment-inventory.md).
- [Development skills](skills.md) and [reference repositories](reference-repositories.md).

Code and configuration describe intended behaviour. External readback describes
what is running at that time. A passed local test does not prove a deployment or
message delivery. Keep release results in the PR or task, with the source commit,
checks, deployment IDs, limitations and rollback targets.

Old audit records, proof packets and task ledgers remain in Git history. Links
to a fixed historical commit are background only, never current instructions or
permission. Keep useful operating steps, design decisions and recovery details
in current docs. Update the relevant README or runbook in the same change; no
separate documentation approval process is required.
