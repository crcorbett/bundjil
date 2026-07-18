---
name: prd-writer
description: "Thin router for Bundjil spec authoring. Use when writing a SPEC, PRD, or feature proposal so the work follows canonical repo docs."
---

# PRD Writer

This skill is intentionally thin. It routes spec authoring into canonical repo docs instead of carrying a parallel planning framework inside the skill.

## Start Here

Read in this order:

1. `AGENTS.md`
2. the target SPEC in `docs/product-specs/`
3. its sibling task list when implementation needs sequencing
4. the matching plan in `docs/exec-plans/active/`, if work has started
5. the relevant files in `docs/architecture/`

## Default Rules

- New current specs belong in `docs/product-specs/`.
- Substantial specs that need implementation sequencing should get a sibling
  `.tasks.json` file in `docs/product-specs/`.
- New active implementation plans belong in `docs/exec-plans/active/`.
- `docs/prds/` is historical unless the user explicitly asks for that layout.
- Prefer one compact canonical spec over a sprawling PRD bundle.
- Prefer progressive, end-to-end implementation spikes with explicit
  verification gates over package-by-package TODO lists.
- Link to architecture docs instead of restating service, API, frontend, or workflow guidance.
- For Effect TS work, specs and task lists must require flat, meaningful
  `Effect.gen` control flow for primary operations, tagged errors handled in
  `.pipe(...)`, canonical Effect Schema-derived types, and an audit against
  `docs/architecture/effect-patterns.md` plus
  `docs/architecture/repo-structure.md`.
- Specs that touch runtime, service, RPC, schema, config, command, or package
  boundaries must name the canonical schemas/types/service contracts/errors
  being reused and must require Effect-native primitives over plain TypeScript
  helpers unless an exception is explicitly justified.
- Specs that cross config, HTTP, provider, persistence, framework, file,
  command, RPC, or tool boundaries must name each canonical codec and both
  `typeof Contract.Type` and `typeof Contract.Encoded`. Name the exact inbound
  adapter that runs `Schema.decodeUnknownEffect`/`Schema.decodeEffect`, the
  exact outbound adapter that runs `Schema.encodeEffect`, and every exact
  third-party exception that may be required. Domain services accept decoded
  types; provider DTOs, raw values, and encoded primitives stay inside the
  named adapter.
- Provider/SDK specs must require the repo-local
  `.agents/skills/effect-client-wrapper`: named operations, schema-derived
  inputs and branded identifiers, `Config.schema`, redacted secrets, encoded
  requests, immediate provider-result decoding, safe Schema tagged errors,
  flat sequential Effects, no helper sprawl, and live/mock Layers. Generic SDK
  escape hatches, raw clients, public semantic primitives, native-class error
  checks, and unchecked provider output are acceptance failures.
- Specs that touch runtime, service, RPC, loader, route, command, middleware,
  package, provider, or boundary-crossing code must include fenced call graphs
  for the production path and test path, plus CLI/script paths when relevant.
  The graphs should name service tags, live/mock layers, owning packages, and
  major third-party adapters.
- Specs that touch route rendering or machine-readable routes must require
  Browser evidence for affected visible states and direct HTTP evidence for
  redirects, status codes, content types, and machine responses.
- Frontend design-system specs that touch tokens, component catalogues,
  accessibility guidance, documentation, governance, or foundations must name
  the design-system authority being followed and record which external
  guidance was used or intentionally rejected.
- Frontend specs that touch visible text must name the canonical typography
  roles or tokens owned by that app/design system. Do not approve route-local
  typography piles as a substitute for a stable design-system contract.
- Frontend specs that change visible text must require Browser screenshot
  evidence for affected routes or component states, including desktop and
  mobile viewports when wrapping, density, or hierarchy can change.
- Frontend specs that touch route/component composition must reference
  `docs/architecture/frontend-composition.md`, require the primitive ->
  composite -> layout -> route chain for visible structure, and require
  leaf-owned data, commands, loading/error states, skeletons, and fallbacks.
  Do not approve nested feature wrappers that merely shorten route JSX or
  prop-drill leaf state.
- Frontend specs that touch reusable URL state, search params, page params, or
  route-agnostic component state must reference
  `docs/architecture/frontend-composition.md`, require schema-owned URL and
  route identity contracts, and keep app route APIs out of reusable packages.
- Do not approve specs that introduce local DTO mirrors or repeated standalone
  fields such as `id: string`, `slug: string`, status, or metadata when an
  owning package already has a schema/type for that value.
- Do not allow a single top-level quality reminder to cover implementation
  style. Each code task must explicitly verify Effect TS control flow, schema
  ownership, unsafe casts, manual mappers/readers, and wrapper/helper sprawl.
- Substantial implementation task lists must include an
  `implementationImprovementAuditCounter` and per-task
  `implementationImprovementAudit` entries. Use three parent audit passes as
  the default acceptance floor, and state that the implementer may require more
  passes when ownership, Effect flow, frontend composition, browser proof, or
  verification evidence remains weak.
- Use DeepWiki through Executor only for upstream packages or libraries when
  current external guidance is necessary. Do not use it to inspect Bundjil;
  the checked-out source, installed versions, repo docs, and tests are the
  authority. Record any upstream/local version mismatch and adapt the decision
  to the installed API.

## Required Impact Ledger

Before approving a SPEC, add a downstream-impact ledger that marks every
surface `Change required` or `N/A` with a reason:

- canonical architecture docs and product documentation;
- the root README and every affected app/package README or runbook;
- `AGENTS.md`, repo-local skills, and linked instruction surfaces;
- schemas, public types, service contracts, live/mock Layers, and exports;
- lint rules, Effect language-service diagnostics, boundary-audit rules and
  exact exceptions, formatting, CI, and verification scripts;
- tests, fixtures, compatibility assertions, Browser/HTTP/provider evidence,
  observability, rollout, migration, and rollback artifacts; and
- SPEC indexes, task ledgers, and active execution plans.

Edit the SPEC and sibling task list as findings are identified. Do not return
an advisory review while known requirements remain only in commentary.

## Prompt Block For Implementation Specs

Include this block, or a task-specific tightening of it, in implementation
specs and task-list delegation notes:

```text
Use Effect TS native approaches first. Prefer Data, Schema, Array, Chunk,
HashSet, HashMap, Match, Context, Layer, Config, Service, Record, Result, Exit,
Bun/Platform Command, and ManagedRuntime over plain TypeScript helpers when the
code is fallible, async, runtime-owned, collection-heavy, or crosses a package,
RPC, SSR, command, config, or service boundary.

Reuse canonical schemas, types, service contracts, errors, and branded
identifiers from the owning package. Do not define standalone DTO mirrors or
duplicate fields such as id: string, slug: string, status, or post metadata
outside their canonical schema/type owner.

For every boundary, name the canonical codec, its Type and Encoded sides, the
single inbound decode adapter, the single outbound encode adapter, and any
exact registered third-party exception. Services receive only decoded types.
Provider/SDK wrappers expose named operations, encode requests, immediately
decode provider outputs, use Config.schema with redacted secrets, and provide
live and mock Layers. Reject a generic SDK callback/client escape hatch.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, instanceof checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema/RPC/Match/Result/Exit
primitive or owning service contract should carry the behavior.
```

## Expected Output

For most substantial work, produce:

1. one spec in `docs/product-specs/`
2. one sibling task list in `docs/product-specs/<topic>.tasks.json` when the
   spec needs implementation sequencing, verification gates, or staged
   delegation
3. one active execution plan in `docs/exec-plans/active/` when implementation
   begins and live progress/validation evidence must be recorded

Specs that require implementation sequencing should include a `Call Graphs`
section before risks/tradeoffs. Keep it compact and use this shape when it
fits:

```ts
Production:
HTTP handlers
  -> ServiceTag
    -> ServiceTag.layerLive
      -> ProviderClient

Tests:
HTTP handlers
  -> ServiceTag
    -> ServiceTag.layerMemory
```

For small work, a single spec may be enough.

Task lists should live beside their SPEC in `docs/product-specs/`: include
principles, global verification, ordered tasks, mandatory verification,
browser verification where relevant, completion criteria, and
`commitAfterPassing` for each implementation spike. Use `bun run verification`
as the default final task gate unless the task explicitly records a narrower
reasoned exception. For substantial implementation or verification work, also
include `implementationImprovementAuditCounter` plus per-task
`implementationImprovementAudit` evidence counters.

For visible route/runtime task lists, add Browser evidence to
`browserVerification` for each changed state. Direct HTTP checks should prove
redirects, status codes, content types, and machine-readable behavior as
relevant.

For Effect TS tasks, every task's `mandatoryVerification` or
`completionCriteria` must explicitly check:

- flat meaningful `Effect.gen` programs for primary operations;
- typed error handling in `.pipe(...)` with `catchTag`, `catchTags`, or
  `mapError`;
- canonical `Effect.Schema` contracts and schema-derived types from owning
  packages;
- no unsafe casts, local DTO mirrors, manual object readers/mappers, or
  trivial wrappers/helpers.
- `Schema.decodeUnknownEffect` only at unknown host/provider boundaries,
  `Schema.decodeEffect` for statically encoded inputs, and
  `Schema.encodeEffect` before outward writes;
- zero unexplained boundary findings, zero stale exact exceptions, and passing
  `bun run check:boundaries`, `bun run check:effect-setup`, and
  `bun run check:skills`;
- implementation-improvement audit passes for ownership/call graph,
  implementation quality, and verification coverage, with pass evidence
  recorded before task acceptance.

For frontend tasks that affect visible text, every task's
`mandatoryVerification` or `browserVerification` must also require canonical
design-system typography usage, applicable lint rules, and Browser evidence
proving the changed text does not overlap or overflow.

## Common References

- `ARCHITECTURE.md`
- `docs/architecture/testing-and-quality.md`
- `docs/architecture/effect-patterns.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/eve-agent.md`
- `docs/architecture/frontend-composition.md`
- `docs/exec-plans/active/` for active implementation evidence

## Notes

- Reuse old `docs/prds/` material only as source material to revalidate.
- Keep specs compact, current, and ownership-aware.
- Keep task lists concrete: each task should produce a working repo state and
  name the tests, typechecks, browser checks, architecture audits, and
  `bun run verification` result required before it can be considered complete.
- Do not generate package-by-package code tutorials unless the user explicitly asks for that depth.
