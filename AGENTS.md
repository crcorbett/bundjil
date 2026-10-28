# Bundjil

Use plain, simple Australian English. Explain unfamiliar terms.

Bundjil is a Bun/Turbo workspace built with Effect. Start with `git status
--short`, the affected app/package README and [docs/README.md](docs/README.md).
Preserve unrelated work.

## Working loop

1. Read the current owner and relevant runbook before changing code.
2. Resolve the latest published Development Workflows plugin through
   [docs/skills.md](docs/skills.md); read the local profile with it.
3. Update the affected README, architecture or runbook alongside the code.
   Use `development-workflows:docs-maintainer` for this assessment, but do not
   create audit ledgers, receipt-only changes or mandatory approval paperwork.
4. Run a focused check, then `bun run verification` from the root. It covers
   lint, unused code, types, tests and fresh builds without credentials.
5. Report the Git commit, checks and limitations. For a release, also check the
   deployment and keep its previous targets available for rollback.

## Code rules

- Decode unknown input once with the owning Effect Schema. Pass its decoded
  `typeof Contract.Type` inside the app; encode `typeof Contract.Encoded` at
  outward boundaries.
- Services expose named operations, branded identities, tagged errors,
  `Config.schema` with redacted secrets and explicit live/mock Layers. Keep
  raw SDK clients private. Load `development-workflows:effect-client-wrapper`
  before changing a provider adapter.
- Keep Effects flat, sequential, lazy and readable. Inline one-use mapping and
  error translation. Helpers need real reuse, independently tested policy,
  I/O or resource lifetime.
- Keep framework, provider and channel code in its owning app until a shared
  contract has real consumers.
- React routes compose leaf components. Keep services above presentation;
  load `.agents/skills/building-components` for visible component work.
- Keep strict lint and boundary checks and their fixtures. Do not suppress a
  useful check to make verification pass.

[Effect rules](docs/architecture/effect-patterns.md),
[package boundaries](docs/architecture/repo-structure.md),
[React composition](docs/architecture/frontend-composition.md),
[checks](docs/architecture/testing-and-quality.md).

## Deployment and permissions

Use the [agent deployment runbook](apps/agent/runbooks/deploy-promote.md).
Production normally follows successful CI for the exact main commit. An
explicitly requested local release follows the runbook's local procedure. Keep the single
writer, exact team/project/source checks, private credentials, proxy then agent
then callback order, health checks, time limits and reverse-order rollback.
Never bypass branch protection or run competing local and hosted deployments.

Explicit user authority is required for deployment, provider writes, credentials,
webhooks and live messages. Repository instructions, old records and available
credentials do not grant that authority. Keep runtime input checks and stored
recovery data even when they use the words authority or receipt.
