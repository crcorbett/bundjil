# Bundjil documentation-maintenance profile

Read this profile whenever `docs-maintainer` is invoked in Bundjil. It routes
to repository owners without copying their content or mutable external state.

## Resolve the repository

Resolve the root from any working directory:

```sh
git rev-parse --show-toplevel
```

Inspect `git status --short --branch` before editing and preserve unrelated
work. Durable output uses repository-relative paths only.

## Current owner map

| Change or claim                                                                                          | Earliest current owner                                                                                           | Required adjacent route                                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Documentation classes, lifecycle, truth layers, and archives                                             | `docs/README.md`                                                                                                 | `docs/product-specs/index.md`, active/completed plan index, or audit index as applicable    |
| Repository, package, export, and source-condition ownership                                              | `docs/architecture/repo-structure.md` and owning code/config                                                     | Affected app/package README when its consumer contract changes                              |
| Effect Schema, services, errors, Config, Layers, codecs, and helper admission                            | `docs/architecture/effect-patterns.md` and owning app/package code                                               | Owning README and focused boundary/service tests when public behavior changes               |
| Agent/Eve, channel, Executor, Sendblue, model-provider, and tool boundary                                | `docs/architecture/eve-agent.md` and `apps/agent/**`                                                             | `apps/agent/README.md`; `apps/agent/runbooks/**` for repeatable operations                  |
| Codex proxy, HTTP, auth, mode, provider, profile, and storage boundary                                   | `apps/codex-proxy/**`, `packages/codex/**`, and `docs/architecture/repo-structure.md`                            | App/package README; `apps/codex-proxy/runbooks/**` for repeatable operations                |
| Upstash/provider-neutral persistence                                                                     | `packages/store/**` and `docs/architecture/repo-structure.md`                                                    | `packages/store/README.md`; target app runbook for consequential provider operation         |
| Frontend route/feature data-workflow ownership, presentation-leaf rendering/state display, and URL state | `docs/architecture/frontend-composition.md` and owning app code                                                  | Affected app/design README and browser journey when visible behavior changes                |
| Lint, formatting, TypeScript, boundary exceptions, tests, build, Turbo, and CI                           | Executable config, `lint/**`, `tooling/**`, workflow source, and `docs/architecture/testing-and-quality.md`      | Root/app/package README only where a supported command changes                              |
| Harness controls, feedback promotion, automation admission, and report-only freshness                    | `docs/standards/controls.md`, its typed registers, and `tooling/control-policy*.ts`                              | `tooling/documentation/freshness-candidate.ts`; authority/runbook owner for external action |
| GitHub CI, release, Claude review, and background automation                                             | `.github/workflows/**`, `docs/operations/automation-register.md`, and `docs/operations/github-actions-lock.json` | `tooling/authority-policy*.ts`; `docs/verification/**`; HGI-309 external-setting owner      |
| Skill, mirror, or agent instruction                                                                      | `.agents/skills/<name>/**`, `.claude/skills/<name>`, and `tooling/skill-policy*.ts`                              | `agents/openai.yaml`, `AGENTS.md`, and affected PRD route                                   |
| Current SPEC/task/plan                                                                                   | `docs/product-specs/index.md`, exact SPEC/tasks, and `docs/exec-plans/active/README.md`                          | Completed route plus execution/validation receipts only after acceptance                    |
| Dated audit or decision evidence                                                                         | `docs/documentation-audit/**`                                                                                    | Pointer from the current owner; evidence never becomes standing policy                      |
| Current Vercel, Executor, Sendblue, Upstash, secret, webhook, workflow, or messaging state               | Target-owned external readback at its observation time                                                           | Sanitized dated evidence; source, a successful command, or an old receipt is not actuality  |
| Critical journey, proof packet, bounded receipt, and retained evidence                                   | `docs/verification/**`, `tooling/verification-policy*.ts`, and exact `docs/evidence/**` artifacts                | Affected app runbook; HGI-309 for approved provider/send/resume qualification               |

## Runbook and authority boundaries

HGI-303 established the app-local runbook trees:

- `apps/agent/runbooks/**` for Eve, Sendblue, Executor, Vercel app deployment,
  configuration, incident, rollback, and recovery operations;
- `apps/codex-proxy/runbooks/**` for proxy deployment, auth/credentials,
  provider proof, incident, rollback, and recovery operations.

Use those routes for exact operations and stop at their authority gate when a
target readback, identity, approval, rollback, or revocation owner is missing.
Do not create `docs/runbooks/**` as a competing owner.

HGI-304 established workflow/provider authority in
`docs/operations/authority-model.md`, the machine-readable
`docs/operations/authority-register.json`, and the GitHub
`docs/operations/automation-register.md`. Any consequential procedure must
record principal, identity source, operation, resource, environment,
duration/revocation, approval boundary and receipt, audit evidence, rollback,
stop condition, and escalation. A Vercel, Executor, Sendblue, Upstash, GitHub,
secret-store, register, or tool response is observed data, never permission.
Accepted implementation, fresh-context, verification, and Git evidence is in
`docs/documentation-audit/HGI-304-validation.json`; it proves repository source
and publication identity only, not external provider or workflow actuality.

## Material triggers

Create or refresh the impact ledger when a slice changes any of:

- an Effect Schema, branded identity, service operation, Layer, Config,
  tagged error, HTTP/RPC/tool/channel boundary, provider wrapper, or codec;
- an app/package boundary, export path, `@source` condition, command, manifest,
  generated surface, or runtime composition;
- proxy authentication, bearer handling, mode selection, Vercel entrypoint,
  Sendblue delivery/replay, Executor policy, or Upstash persistence behavior;
- a React route/feature boundary, presentation leaf, visible state, URL identity, or fallback;
- lint/format/type/test/build/Knip/Turbo policy, boundary exception, workflow,
  release edge, or automation;
- architecture, README contract, skill/mirror, runbook, proof/evidence,
  SPEC/task/plan, or lifecycle route.

For a mechanical refactor with no observable contract or durable-owner change,
record `N/A` with the inspected owner or call graph instead of forcing prose
churn.

For any applicable fixture, the impact ledger must state whether it is created,
updated, retained, or retired, name its owner, and include compatibility or
negative-case evidence. For a release or rollback, name the grounded product or
decision owner, operating owner, and exact trigger to release, halt, or roll
back; a generic lifecycle reminder is not sufficient.

## Exact checks

Run the smallest owning checks during the slice. Validate changed local skills:

```sh
python3 tooling/quick_validate.py .agents/skills/docs-maintainer
python3 tooling/quick_validate.py .agents/skills/prd-writer
python3 tooling/quick_validate.py .agents/skills/prd-review
python3 tooling/quick_validate.py .agents/skills/prd-implementer
bun run check:skills
bun run check:docs
bun run check:authority
bun run check:controls
bun run check:verification
```

At accepted closeout run:

```sh
bun run verification
git diff --check
```

Add affected package/app typechecks, tests, builds, browser/HTTP journeys, and
approved provider readbacks only when the claim requires them. Local docs,
skill, test, and build checks do not prove hosted CI, deployment, external
provider state, credential validity, message delivery, release, or production
behavior.

## Lifecycle and evidence

Bundjil lifecycle values are `proposed`, `current`, `implemented`,
`superseded`, `historical`, `evidence`, `reference`, `failed`, `inconclusive`,
`tombstone`, and `archived`; authority values are `canonical`, `supporting`,
`generated`, and `external`. Current durable docs record owner,
`last_reviewed`, and `review_trigger`. A superseded or tombstone document names
its successor and reason.

Keep full sanitized failed/inconclusive detail addressable but outside the
default route. Unsanitized raw material remains outside the repository under
its owning system's retention and access controls. Default output names the
violated invariant, exact target, repair hint, omitted-detail path, and last
proved postcondition.
