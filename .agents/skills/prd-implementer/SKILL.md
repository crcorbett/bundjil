---
name: prd-implementer
description: "Thin router for implementing Bundjil specs and plans with the canonical iterative rollout and verification flow."
---

# PRD Implementer

This skill is intentionally thin. It routes implementation work into the canonical execution docs instead of embedding another rollout framework inside the skill.

## Start Here

Read in this order:

1. the target spec
2. the sibling task list when the spec has one
3. the matching active plan in `docs/exec-plans/active/`, if implementation
   has started
4. `AGENTS.md`
5. the relevant files in `docs/architecture/`

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
- For an exported tagged-error migration, follow
  `docs/architecture/effect-patterns.md` and
  `docs/architecture/testing-and-quality.md`. Accept only an atomic change to
  the class declaration, generic self-type, literal tag, constructors, failure
  unions, catchers, guards, encoded tests, boundary mappings, and current docs.
  Reject a partial consumer/catcher migration, an unplanned alias or dual
  decoder, or a compatibility claim that does not check persisted/public/
  independently deployed/external decoder boundaries.
- For frontend design-system implementation tasks that change token taxonomy,
  component catalogue structure, accessibility expectations, documentation,
  governance, or foundations, follow the design-system authority named by the
  SPEC and record external guidance and local decisions in the active plan.
- For frontend implementation tasks that affect visible text, use the
  typography roles or tokens owned by the app/design system named in the SPEC.
  Do not introduce route-local typography piles as a parallel API.
- For visible text changes, capture Browser screenshot evidence for the
  affected route or component state, including desktop and mobile viewports
  when hierarchy, wrapping, or density can change.
- For frontend implementation tasks, follow
  `docs/architecture/frontend-composition.md`: compose visible structure as
  high as practical through primitive -> composite -> layout -> route, and let
  leaves own their data, commands, loading/error states, skeletons, and
  fallbacks.
- For reusable URL/search/page-param work, follow
  `docs/architecture/frontend-composition.md`: use schema-owned URL and route
  identity contracts, keep the app router as the URL writer, and keep app route
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

For UI work, use the primitive -> composite -> layout -> route chain. Let
leaves own the data, commands, loading, empty, error, retry, skeleton, and
fallback behavior for the exact fragment they render. Do not add nested
feature wrappers merely to shorten route JSX, and do not prop-drill query
results, selected ids, loading flags, command callbacks, or derived option
lists when a leaf can own the narrow value.

For reusable URL state, use schema-owned search and route-identity contracts.
Keep the app router as the URL writer, and do not import app route modules into
reusable packages.
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
- exported tagged-error class/self-type/literal equality, exhaustive consumer
  migration, exact target encode/decode plus old-tag rejection, stable public
  mappings, and no unplanned alias or dual decoder
- route loaders and runtime code use the app runtime/RPC client boundary rather
  than route-local server functions or import-time runtime branching
- frontend routes compose visible structure as high as practical and do not add
  nested feature wrappers only to hide route JSX
- frontend visible text uses the app/design-system typography contract, with
  applicable lint rules and Browser evidence proving no overlap or overflow
- data-bearing leaves own their own reads, commands, loading, empty, error,
  retry, skeleton, and fallback states
- reusable URL state uses schema-owned search and route identity contracts,
  with the app router as writer and no app route imports in reusable packages
- no prop drilling of query results, selected ids, loading flags, command
  callbacks, or derived option lists when a leaf can own the narrow value
- implementation call graphs still match the spec's production/test/CLI graphs,
  or the spec and task list are updated with the intentional architecture
  change before acceptance
- visible route/runtime changes include Browser evidence for affected states,
  plus direct HTTP evidence for redirects and machine-readable responses where
  relevant
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
5. Browser screenshots when visible route output changes, plus direct HTTP
   evidence when redirects or machine-readable behavior changes
6. `bun run verification` before accepting or committing a task

Do not defer all verification until the end of the rollout. Narrow checks are
the inner loop; `bun run verification` is the task-acceptance gate unless the
task explicitly records why it is deferred or temporarily blocked by unrelated
repo findings.

## Common References

- `ARCHITECTURE.md`
- `AGENTS.md`
- `docs/architecture/effect-patterns.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/eve-agent.md`
- `docs/architecture/frontend-composition.md`
- `docs/architecture/testing-and-quality.md`
- `docs/exec-plans/active/`

## Notes

- Use old `docs/prds/` material only as background.
- Do not turn a spec into a giant one-pass implementation.
- Record uncertainty and deferred debt explicitly in the active plan.
