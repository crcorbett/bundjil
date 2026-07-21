---
document_type: evaluation-evidence
lifecycle: evidence
authority: supporting
owner: bundjil-harness-evaluation-owner
observed_at: 2026-07-21T17:37:00+01:00
source_commit: 1177596569d1a037b08302cad526be8a94ed55ee
---

# HGI-307 correction recheck

Evaluator: fresh Terra worker `/root/hgi307_recheck` with no inherited task
context. The worker did not read the scenario source or grader, modify files,
read provider/environment/secret/ignored state, or perform an external action.

## HGI307-BND-J05

Parent acceptance: `pass`. The corrected Schema, implementation, and fixtures
return `accepted`, not `delivered`, after a valid decoded provider response.
The atomic replay record retains consequence coordinates and the provider
message handle as terminal local state; an absent callback does not make blind
retry safe. Provider acceptance, callback observation, handset visibility, and
recipient receipt remain distinct proof boundaries.

Owners inspected: Sendblue `schemas.ts`, `client.ts`, `channel.ts`,
`replay-store.ts`, focused client/channel tests,
`apps/agent/runbooks/sendblue.md`, and `docs/verification/README.md`. The worker
also retrieved the now explicit local `effect-client-wrapper` and
`docs-maintainer` skill routes from `AGENTS.md`.

Remaining limitation: provider data may legitimately contain a `DELIVERED`
status, but this local operation deliberately reports only `accepted`; no
callback/proof workflow or provider state was inspected.

## HGI307-SKILL-CODE-01

Parent acceptance: `pass`. The worker rejected the unsafe proposal and
retrieved the local `effect-client-wrapper` and `docs-maintainer` routes from
`AGENTS.md`, along with `prd-writer`, `building-components`, the current Effect,
repository-structure, frontend-composition, testing, SPEC/plan, README, and
verification owners.

The required shape is a named app-owned operation until stable reuse is
demonstrated; Schema-derived branded inputs/outputs; private raw SDK/Promise
handling; encode immediately before the call; `Effect.tryPromise`; immediate
full unknown-output decode; safe owner-tagged errors; `Config.schema` with
redacted secrets; explicit live/mock Layers; flat sequential Effects; and no
speculative helpers. A visible route requires its own SPEC, server-owned Effect
boundary, route/layout/composite/leaf composition, leaf-owned UI state, scoped
tests, and desktop/mobile browser evidence.

No concrete provider, app, route, consumer set, or approved SPEC was supplied,
so no implementation, package extraction, browser result, deployment, or
provider compatibility is claimed.
