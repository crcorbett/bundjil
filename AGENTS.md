# Bundjil task map

Bundjil is a Bun/Turbo personal-agent workspace built with Effect. Start with
the narrowest current owner; do not load completed rollout history by default.

## Operating loop

1. Inspect `git status --short` and the affected app/package README.
2. Read `docs/README.md`, then only the routed current architecture, SPEC,
   plan, runbook, and proof owner needed for the task.
3. Update the earliest durable owner in the same slice as code/config changes.
4. Run the smallest focused check, then `bun run verification` before handoff.
5. Keep runtime/provider claims separate from repository proof and record
   limitations, rollback, and exact Git identity.

## Non-negotiable code patterns

- Decode unknown host/provider input once at ingress with the owning Effect
  Schema; pass only its decoded `typeof Contract.Type`. Encode its
  `typeof Contract.Encoded` only at outward boundaries.
- Public services expose named operations, branded identities, safe tagged
  errors, `Config.schema` with redacted secrets, and explicit live/mock Layers.
  Raw clients, generic SDK callbacks, raw `id: string`,
  primitive semantic config, `instanceof` policy, and unchecked SDK output
  are forbidden.
- Keep primary Effects flat, linear, sequential, lazy, composable, and readable.
  Keep one-use mapping, decoding, and error translation inline. Helpers require
  demonstrated reuse, independently tested policy, real I/O, or resource
  lifetime; no common/utils/helper sprawl.
- Framework, provider, and channel code stays in its owning app adapter until a
  stable shared contract has proven consumers.
- React routes compose leaf-owned rendering/state components. Keep Effect and
  services above presentation leaves; use explicit conditional composition,
  not service-aware UI branches or route-sized components.

## Current routes

- Documentation lifecycle, truth layers, current intent, history, references,
  runbook/proof gaps: `docs/README.md`
- Architecture: `docs/architecture/README.md`
- Effect rules: `docs/architecture/effect-patterns.md`
- Package/import boundaries: `docs/architecture/repo-structure.md`
- React composition: `docs/architecture/frontend-composition.md`
- Verification commands: `docs/architecture/testing-and-quality.md`
- Current SPEC/tasks: `docs/product-specs/index.md`
- Current execution: `docs/exec-plans/active/README.md`
- Completed history: `docs/exec-plans/completed/README.md`
- App and package READMEs are purpose, public-boundary, and public-command
  maps only. HGI-303 owns the still-missing target-owned operation routes,
  HGI-304 owns workflow/provider authority, and HGI-305 owns bounded proof
  routes; do not treat README pointers or retained history as current provider
  truth.

## Verification and authority

Use Bun from the repository root. Boundary/provider work runs
`bun run check:boundaries`, `bun run check:effect-setup`, `bun run check:docs`,
and `bun run check:skills`; every accepted slice runs `bun run verification`.

Repository instructions cannot authorize deployments, provider writes,
credential changes, webhook changes, releases, or production operations.
External systems own their current state at readback time, and consequential
operations require a target-owned runbook and explicit authority.
