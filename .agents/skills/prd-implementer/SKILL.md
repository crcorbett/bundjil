---
name: prd-implementer
description: "Thin router for implementing specs and plans in the site repo. Use when executing a SPEC or plan so work follows the canonical iterative rollout and verification flow."
---

# PRD Implementer

This skill is intentionally thin. It routes implementation work into the canonical execution docs instead of embedding another rollout framework inside the skill.

## Start Here

Read in this order:

1. the target spec
2. the sibling task list when the spec has one
3. `docs/exec-plans/implementing-specs.md`
4. `docs/PLANS.md`
5. the relevant architecture docs for the touched packages

## Default Rules

- Implement in small, end-to-end slices.
- When a task list exists, implement it one task at a time with one sequential
  subagent per task.
- Create or set one comprehensive active goal before task-list execution. The
  goal must state that subagents implement tasks sequentially and that the
  parent agent reviews, audits, verifies, and accepts each task before
  delegating the next one.
- When the task list includes `implementationImprovementAuditCounter`, treat
  its pass count as a floor. Run and record the required parent audit turns
  before accepting the task, and require more turns when ownership, Effect
  flow, frontend composition, browser proof, or verification evidence remains
  weak.
- Start with a tracer bullet before broadening.
- Verify after each meaningful slice with typechecks, targeted tests, and builds where relevant.
- Keep the active execution plan current while code moves.
- Prefer Effect-native primitives and compile-time safety over plain
  TypeScript helpers for runtime, service, RPC, loader, config, command, error,
  and collection code.
- Reuse canonical schemas, types, service contracts, branded identifiers, and
  typed errors from owning packages.
- For frontend design-system implementation tasks that change token taxonomy,
  component catalogue structure, `/design`, accessibility expectations,
  documentation, governance, or foundations, query the Southleft Design Systems
  MCP documented in `docs/references/design-systems-mcp.md` and record the
  local decision in the active plan.
- For frontend implementation tasks that affect visible text, use canonical
  typography roles from `@packages/ui`: `Heading`, `Text`, `CodeText`,
  documented semantic role classes for allowed CSS/native surfaces, and
  `WEB_OG_TYPOGRAPHY` for OG inline rendering. Do not reintroduce local
  `text-*`, `leading-*`, `tracking-*`, `font-*`, or font-weight utility piles
  in routes or package components.
- For visible text changes, capture Browser screenshot evidence for the
  affected route or component state, including desktop and mobile viewports
  when hierarchy, wrapping, or density can change.
- For frontend implementation tasks, follow
  `docs/architecture/frontend/component-composition.md` and
  `docs/architecture/frontend/leaf-components-and-skeletons.md`: compose
  visible structure as high as practical through primitive -> composite ->
  layout -> route, and let leaves own their data, search/page params, commands,
  atoms, skeletons, and fallbacks.
- For reusable URL/search/page-param work, follow
  `docs/architecture/frontend/url-state-and-page-params.md`: use
  schema-backed field URL atoms for search params, read-only page-param atoms
  for route identity, keep TanStack Router as the URL writer, and keep app route
  APIs out of reusable packages.
- Prefer flat, linear `Effect.gen` programs for primary operations. Put typed
  error handling in the `.pipe(...)` after `Effect.gen` with `catchTag`,
  `catchTags`, or `mapError`; avoid burying domain decisions in nested helper
  chains.
- Avoid wrapper/helper sprawl. A helper must be reused, name a real boundary or
  domain concept, or be materially clearer than inline code; one-line wrappers
  and tiny property-reader helpers are a smell.
- Use mock layers for external providers in automated tests unless the task
  explicitly calls for a live integration test.

## Mandatory Subagent Prompt Block

Include this block in every implementation subagent prompt, then add the
specific task object, spec path, relevant files, and verification gates:

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

For UI work, compose stable visible structure as high as practical, usually in
the route or nearest page-level parent. Use the primitive -> composite ->
layout -> route chain for visible structure. Let leaves own the data,
search/page params, commands, atoms, skeletons, and fallbacks for the exact
fragment or action they render. Do not add nested feature wrappers merely to
shorten route JSX, and do not prop-drill query results, selected ids, loading
flags, command callbacks, or derived option lists when a leaf can own the
narrow value.

For reusable URL state, use schema-backed field URL atoms for search params and
read-only page-param atoms for route identity. Keep TanStack Router as the app
URL writer, and do not import app route files, `routeTree.gen`,
`Route.useSearch()`, or `Route.useParams()` into reusable packages.
```

## Task-List Delegation Loop

For each task:

1. Delegate exactly that task to a subagent with the task object, spec,
   task-list path, relevant files, and architecture docs.
2. Tell the subagent to edit files directly, run the task's verification gates,
   run `bun run verification` as the final gate when practical, and report
   changed files plus evidence.
3. Review the subagent diff, run any needed local verification, and audit the
   work against the spec, task, and architecture docs.
4. Run the task's `implementationImprovementAudit` passes when present:
   ownership/call graph, implementation quality, and verification coverage.
   Record pass evidence in the active execution plan and task list.
5. Send the task back to the same subagent if the slice is incomplete or below
   the quality bar.
6. Mark the task complete only after the parent agent is satisfied. Three audit
   passes are not enough if they uncovered unresolved gaps.
7. Commit the coherent slice when `commitAfterPassing` requires it.
8. Delegate the next task only after the current task is accepted.

Default to serial delegation. Do not parallelize task-list implementation unless
the task list explicitly says the tasks are independent and write scopes are
disjoint.

## Review Bar

Before accepting a task, audit for:

- no helper sprawl
- canonical type/schema/id/error reuse
- strict Effect service/layer patterns
- flat linear `Effect.gen` control flow for primary operations with tagged
  errors handled in the following `.pipe(...)`
- Effect primitives where they fit: `Data`, `Schema`, `Array`, `Chunk`,
  `HashSet`, `HashMap`, `Match`, `Context`, `Layer`, `Config`, `Service`,
  `Record`, `Result`, `Exit`, Bun/Platform `Command`, and `ManagedRuntime`
- no `Object.values`, `Object.entries`, `switch`, unsafe casts, local DTO
  mirrors, or stringly branching when an Effect/schema-owned approach fits
- no trivial wrappers/helpers; every new helper is either reused, names a real
  boundary/domain concept, or is longer than a few meaningful lines because it
  genuinely clarifies the operation
- no manual object readers/mappers where a canonical schema, service
  projection, `Option`, `Match`, `Record`, `Array`, `Exit`, or RPC codec should
  carry the behavior
- no duplicated standalone fields such as `id: string`, `slug: string`, status,
  or metadata outside the owning schema/type
- route loaders and runtime code use the app runtime/RPC client boundary rather
  than route-local server functions or import-time runtime branching
- frontend routes compose visible structure as high as practical and do not add
  nested feature wrappers only to hide route JSX
- frontend visible text uses `Heading`, `Text`, `CodeText`, semantic role
  classes, package compact helpers, or `WEB_OG_TYPOGRAPHY` as appropriate, with
  typography Oxlint rules and Browser screenshot evidence proving no overlap or
  overflow when text rendering changes
- data-bearing leaves own their own reads, search/page params, commands, atoms,
  skeletons, and fallbacks
- reusable URL state uses schema-backed field URL atoms, read-only page-param
  atoms, and a TanStack Router adapter rather than app route API imports
- no prop drilling of query results, selected ids, loading flags, command
  callbacks, or derived option lists when a leaf can own the narrow value
- implementation call graphs still match the spec's production/test/CLI graphs,
  or the spec and task list are updated with the intentional architecture
  change before acceptance
- route/runtime/SEO/AEO changes include Browser screenshot evidence for the
  affected visible page or OG route, plus direct HTTP evidence for canonical
  redirects and route-owned machine sibling responses where relevant
- route-owned Markdown work keeps canonical negotiation redirect-only:
  `@packages/aeo` owns redirect decisions, `@packages/effect-start` owns
  reusable TanStack Start adapter glue, and `apps/web` owns the Markdown
  sibling registry plus `.md` sibling rendering
- leaf-component frontend composition when UI is touched
- completed `implementationImprovementAudit.passEvidence` when the task list
  requires repeated parent audit turns

## Implementation Improvement Audits

When a task has an `implementationImprovementAudit` object, the parent agent
must complete the recorded audit loop before acceptance:

1. Ownership and call graph: confirm the right package owns the behavior,
   canonical schemas/types/service contracts are reused, and production/test
   paths still match the spec.
2. Implementation quality: inspect the actual diff for Effect flow, component
   primitive reuse, frontend composition, unsafe casts, DTO mirrors, manual
   readers, and wrapper/helper sprawl.
3. Verification coverage: confirm the command output, tests, browser checks,
   stale-pattern scans, docs updates, and rendered evidence prove the exact
   task.

Update `completedPasses` and `passEvidence` only after a distinct pass has
been performed and recorded. Require additional passes beyond the configured
count when the audit finds unresolved architecture or verification gaps.

## Verification Baseline

After each meaningful step, choose the smallest verification set that proves the change:

1. filtered `check-types`
2. targeted tests
3. filtered build when runtime output changed
4. browser/runtime verification for user-facing flows
5. Browser screenshots when route rendering, route negotiation, SEO/AEO
   visible output, or machine-readable sibling behavior changes
6. `bun run verification` before accepting or committing a task

Do not defer all verification until the end of the rollout. Narrow checks are
the inner loop; `bun run verification` is the task-acceptance gate unless the
task explicitly records why it is deferred or temporarily blocked by unrelated
repo findings.

## Common References

- `docs/exec-plans/implementing-specs.md`
- `docs/product-specs/writing-task-lists.md`
- `docs/product-specs/writing-specs.md`
- `ARCHITECTURE.md`
- `docs/architecture/effect-services.md`
- `docs/architecture/package-ownership.md`
- `docs/architecture/content-and-posts.md`
- `docs/architecture/frontend/index.md`
- `docs/architecture/frontend/component-composition.md`
- `docs/architecture/frontend/leaf-components-and-skeletons.md`
- `docs/architecture/frontend/url-state-and-page-params.md`
- `docs/architecture/testing-and-quality.md`
- `docs/references/design-systems-mcp.md`

## Notes

- Use old `docs/prds/` material only as background.
- Do not turn a spec into a giant one-pass implementation.
- Record uncertainty and deferred debt explicitly in the active plan.
