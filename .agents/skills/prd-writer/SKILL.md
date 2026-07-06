---
name: prd-writer
description: "Thin router for site repo spec authoring. Use when writing a SPEC, PRD, or feature proposal so the work follows canonical docs instead of inventing a new PRD bundle."
---

# PRD Writer

This skill is intentionally thin. It routes spec authoring into canonical repo docs instead of carrying a parallel planning framework inside the skill.

## Start Here

Read in this order:

1. `docs/product-specs/writing-specs.md`
2. `docs/product-specs/writing-task-lists.md` when the spec needs
   implementation sequencing
3. `docs/PLANS.md`
4. the relevant architecture docs from `ARCHITECTURE.md` or `docs/architecture/*`

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
  `docs/architecture/effect-services.md` plus
  `docs/architecture/package-ownership.md`.
- Specs that touch runtime, service, RPC, schema, config, command, or package
  boundaries must name the canonical schemas/types/service contracts/errors
  being reused and must require Effect-native primitives over plain TypeScript
  helpers unless an exception is explicitly justified.
- Specs that touch runtime, service, RPC, loader, route, command, middleware,
  package, provider, or boundary-crossing code must include fenced call graphs
  for the production path and test path, plus CLI/script paths when relevant.
  The graphs should name service tags, live/mock layers, owning packages, and
  major third-party adapters.
- Specs that touch route rendering, route negotiation, SEO/AEO surfaces, or
  machine-readable sibling routes must require Browser screenshot evidence for
  the affected visible page or OG route, plus direct HTTP evidence for
  canonical redirects and sibling-owned machine responses.
- Route-owned Markdown specs must distinguish canonical negotiation redirects
  from sibling-owned Markdown rendering: `@packages/aeo` owns redirect
  decisions, `@packages/effect-start` owns reusable TanStack Start adapter
  glue, and `apps/web` owns the Markdown sibling registry and `.md` sibling
  output.
- Frontend design-system specs that touch tokens, component catalogue
  structure, `/design`, accessibility guidance, documentation, governance, or
  foundations must query the Southleft Design Systems MCP documented in
  `docs/references/design-systems-mcp.md` and record which guidance was used or
  intentionally rejected.
- Frontend specs that touch visible text must require canonical typography
  roles from `@packages/ui`: use `Heading`, `Text`, `CodeText`, semantic role
  classes for allowed CSS/native surfaces, and `WEB_OG_TYPOGRAPHY` for OG
  inline rendering. Do not approve local `text-*`, `leading-*`, `tracking-*`,
  `font-*`, or font-weight utility piles as the production typography API.
- Frontend specs that change visible text must require Browser screenshot
  evidence for affected routes or component states, including desktop and
  mobile viewports when wrapping, density, or hierarchy can change.
- Frontend specs that touch route/component composition must reference
  `docs/architecture/frontend/component-composition.md` and
  `docs/architecture/frontend/leaf-components-and-skeletons.md`, require the
  primitive -> composite -> layout -> route chain for visible structure, and
  require leaf-owned data, search/page params, commands, atoms, skeletons, and
  fallbacks. Do not approve nested feature wrappers that merely shorten route
  JSX or prop-drill leaf state.
- Frontend specs that touch reusable URL state, search params, page params, or
  route-agnostic component state must reference
  `docs/architecture/frontend/url-state-and-page-params.md`, require
  schema-backed field URL atoms for search params, read-only page-param atoms
  for route identity, and keep app route APIs out of reusable packages.
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

Task lists should follow `docs/product-specs/writing-task-lists.md`: include
principles, global verification, ordered tasks, mandatory verification,
browser verification where relevant, completion criteria, and
`commitAfterPassing` for each implementation spike. Use `bun run verification`
as the default final task gate unless the task explicitly records a narrower
reasoned exception. For substantial implementation or verification work, also
include `implementationImprovementAuditCounter` plus per-task
`implementationImprovementAudit` evidence counters.

For route/runtime/SEO/AEO task lists, add Browser screenshot evidence to
`browserVerification` for each task that changes visible route behavior or OG
output. Direct HTTP checks should prove canonical redirects and direct
route-owned `.md`, `.og`, robots, sitemap, LLM, or RPC behavior as relevant.

For Effect TS tasks, every task's `mandatoryVerification` or
`completionCriteria` must explicitly check:

- flat meaningful `Effect.gen` programs for primary operations;
- typed error handling in `.pipe(...)` with `catchTag`, `catchTags`, or
  `mapError`;
- canonical `Effect.Schema` contracts and schema-derived types from owning
  packages;
- no unsafe casts, local DTO mirrors, manual object readers/mappers, or
  trivial wrappers/helpers.
- implementation-improvement audit passes for ownership/call graph,
  implementation quality, and verification coverage, with pass evidence
  recorded before task acceptance.

For frontend tasks that affect visible text, every task's
`mandatoryVerification` or `browserVerification` must also require canonical
typography role usage, the typography Oxlint rules where relevant, and Browser
screenshot evidence proving the changed text does not overlap or overflow.

## Common References

- `ARCHITECTURE.md`
- `docs/architecture/effect-services.md`
- `docs/architecture/package-ownership.md`
- `docs/architecture/content-and-posts.md`
- `docs/architecture/frontend/index.md`
- `docs/architecture/testing-and-quality.md`
- `docs/references/design-systems-mcp.md`
- `docs/product-specs/writing-task-lists.md`

## Notes

- Reuse old `docs/prds/` material only as source material to revalidate.
- Keep specs compact, current, and ownership-aware.
- Keep task lists concrete: each task should produce a working repo state and
  name the tests, typechecks, browser checks, architecture audits, and
  `bun run verification` result required before it can be considered complete.
- Do not generate package-by-package code tutorials unless the user explicitly asks for that depth.
