---
name: prd-implementer
description: "Thin router for implementing Bundjil specs and plans with the canonical iterative rollout and verification flow."
---

# PRD Implementer

This skill is intentionally thin. It routes implementation work into the canonical execution docs instead of embedding another rollout framework inside the skill.

## Start Here

Read in this order:

1. `AGENTS.md`
2. `docs/README.md`
3. `.agents/skills/docs-maintainer/SKILL.md` and its repository profile
4. the target spec and sibling task list when it has one
5. the matching active plan in `docs/exec-plans/active/`, if implementation
   has started
6. the relevant routed files in `docs/architecture/`

## Default Rules

- Implement in small, end-to-end slices.
- When a task list exists, keep one primary trajectory accountable and
  implement one accepted task at a time. Delegate only an independently
  provable slice, fresh/adversarial review, or explicitly disjoint work.
- Use a goal only when the user explicitly requests one. A goal or subagent
  count is coordination state, never acceptance proof.
- Treat any historical `implementationImprovementAuditCounter` as a set of risk
  lenses, not a fixed pass floor. Ownership, implementation quality, and proof
  must pass regardless of turn count.
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
  `docs/architecture/testing-and-quality.md`. Require an atomic change to the
  class declaration, generic self-type, literal tag, constructors, failure
  unions, catchers, guards, encoded tests, boundary mappings, and current docs.
  Reject partial consumer migrations and unplanned aliases or dual decoders.
- For every changed config, HTTP, provider, persistence, framework, file,
  command, RPC, or tool boundary, trace the canonical codec through
  `typeof Contract.Encoded` at the adapter and `typeof Contract.Type` in the
  service. Decode once on entry, encode before exit, and keep provider DTOs,
  raw public primitives, raw values, and exact third-party exceptions confined
  to their named adapter. Reject unencoded outward writes and stale exceptions.
- For provider/SDK work, load `.agents/skills/effect-client-wrapper` and reject
  generic SDK escape hatches, raw clients, raw semantic identifiers, primitive
  semantic config, native-class error checks, and unchecked SDK outputs.
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
  high as practical through primitive -> composite -> layout -> route.
  Route or feature boundaries own data loading, Effect execution, service/RPC
  calls, auth, mutations, shared workflows, and command execution. Presentation
  leaves own rendering, accessibility, local UI interaction, and state display
  from narrow readonly values and action callbacks.
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
- Keep a downstream-impact ledger current while implementing. Mark docs,
  affected READMEs/runbooks, `AGENTS.md`, skills, schemas/contracts/exports,
  lint and boundary-audit rules, Effect diagnostics, CI/scripts, tests,
  fixtures, evidence, observability, rollout/rollback, SPECs, task ledgers, and
  active plans as `Change required` or `N/A` with a reason. Edit required
  artifacts in the same slice instead of reporting them as follow-up advice.
- For each applicable fixture, record its create/update/retain/retire lifecycle,
  owner, and compatibility or negative-case coverage. For release and rollback,
  record the grounded product/decision owner, operating owner, and exact
  release, halt, and rollback triggers.
- Invoke `.agents/skills/docs-maintainer` before and after every material
  implementation slice. Reconcile `Change required`, `Preserve`, and evidenced
  `N/A` decisions against the actual diff, then invoke it again at task
  closeout for lifecycle, execution-packet, receipt, and archive routing.

## Delegation reference

When a bounded, independently provable slice needs delegation, include the
relevant parts of this reference with the task object, routed owner paths, and
verification gates. Delegation is optional; the primary trajectory remains
accountable for integration and acceptance:

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

For every changed boundary, identify the canonical codec, its Type and Encoded
sides, the exact inbound decode adapter, the exact outbound encode adapter, and
any exact exception-registry entry. Decode unknown host/provider data once,
use decodeEffect for statically encoded data, and encode decoded values before
they leave the adapter. Domain services accept decoded owner types only.

For provider/SDK work, follow .agents/skills/effect-client-wrapper. Expose only
named operations, use schema-derived branded identifiers, load semantic config
through Config.schema with redacted secrets, encode requests, immediately
decode provider output, map failures to safe Schema tagged errors, and provide
live and mock Layers. Reject raw client/callback escape hatches and unchecked
provider DTOs.

Keep one-off Effect logic inline at the consumer. Do not add tiny wrappers,
mappers, transformers, switch/case branches, instanceof checks, unsafe casts,
or manual encode/decode adapters when an Effect Schema/RPC/Match/Result/Exit
primitive or owning service contract should carry the behavior.

For UI work, use the primitive -> composite -> layout -> route chain.
Route/feature boundaries own data loading, Effect execution, service/RPC calls,
auth, mutations, shared workflows, and command execution. Presentation leaves
own rendering, accessibility, local UI interaction, and loading, empty, error,
retry, skeleton, and fallback display from narrow readonly values and action
callbacks. Do not add nested feature wrappers merely to shorten route JSX, and
do not prop-drill unrelated values through ancestors.

For reusable URL state, use schema-owned search and route-identity contracts.
Keep the app router as the URL writer, and do not import app route modules into
reusable packages.
```

## Task-List Delegation Loop

For each task:

1. Keep the primary owner on the task. Delegate a bounded slice only under the
   independent-evidence rule, with the task object, spec, paths, and gates.
2. Implement directly, or tell a bounded delegated owner to edit files and run
   the task's verification gates. Run `bun run verification` as the final gate
   when practical and retain changed-file plus evidence records.
3. Review the complete diff, independently run needed verification, and audit
   the work against the spec, task, and architecture docs.
4. Apply the task's `implementationImprovementAudit` risk lenses when present:
   ownership/call graph, implementation quality, and verification coverage.
   Record pass evidence in the active execution plan and task list.
5. Correct incomplete work directly or return a delegated slice to the same
   owner with exact failed evidence.
6. Mark the task complete only after the parent agent is satisfied and every
   required risk lens and proof passes.
7. Reconcile the repo-local docs-maintainer ledger and run `bun run check:docs`
   plus `bun run check:skills` before accepting the slice.
8. Commit the coherent slice when `commitAfterPassing` requires it.
9. Begin the next task only after the current task is accepted.

Default to serial task execution. Parallelize only when the task list proves
independent dependencies and disjoint write scopes.

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
- public service inputs/outputs use `typeof Contract.Type`; encoded values use
  `typeof Contract.Encoded` only inside the exact adapter
- unknown host/provider input crosses one `Schema.decodeUnknownEffect`, typed
  encoded input uses `Schema.decodeEffect`, and every outward write crosses
  `Schema.encodeEffect` or the equivalent framework-native Schema body API
- exact boundary exceptions are justified and non-stale; no casts or broad
  ignores hide a primitive/provider constraint
- provider wrappers expose named operations, keep SDK instances private, use
  `Config.schema` and redacted secrets, decode SDK results immediately, and
  provide deterministic mock Layers
- route loaders and runtime code use the app runtime/RPC client boundary rather
  than route-local server functions or import-time runtime branching
- frontend routes compose visible structure as high as practical and do not add
  nested feature wrappers only to hide route JSX
- frontend visible text uses the app/design-system typography contract, with
  applicable lint rules and Browser evidence proving no overlap or overflow
- presentation leaves own rendering, accessibility, local UI interaction, and
  loading/empty/error/retry/skeleton/fallback display; route/feature boundaries
  own reads, mutations, commands, and shared workflows
- reusable URL state uses schema-owned search and route identity contracts,
  with the app router as writer and no app route imports in reusable packages
- no prop drilling of service clients, loader-result bags, loading policy, or
  unrelated query state through wrappers; put the route/feature boundary near
  the leaf and pass narrow values/callbacks
- implementation call graphs still match the spec's production/test/CLI graphs,
  or the spec and task list are updated with the intentional architecture
  change before acceptance
- visible route/runtime changes include Browser evidence for affected states,
  plus direct HTTP evidence for redirects and machine-readable responses where
  relevant
- leaf-component frontend composition when UI is touched
- completed evidence for each applicable ownership, implementation-quality,
  and verification-coverage risk lens

## Implementation Improvement Audits

When a historical task has an `implementationImprovementAudit` object, treat
its entries as risk lenses and complete them before acceptance:

1. Ownership and call graph: confirm the right package owns the behavior,
   canonical schemas/types/service contracts are reused, and production/test
   paths still match the spec.
2. Implementation quality: inspect the actual diff for Effect flow, component
   primitive reuse, frontend composition, unsafe casts, DTO mirrors, manual
   readers, and wrapper/helper sprawl.
3. Verification coverage: confirm the command output, tests, browser checks,
   `bun run check:boundaries`, `bun run check:effect-setup`,
   `bun run check:skills`, stale-pattern scans, downstream-impact ledger, docs
   and README updates, and rendered evidence prove the exact task.

Record evidence only after the corresponding lens has been checked. Do not
equate a configured count with acceptance while architecture or proof gaps
remain.

## Verification Baseline

After each meaningful step, choose the smallest verification set that proves the change:

1. filtered `check-types`
2. targeted tests
3. filtered build when runtime output changed
4. browser/runtime verification for user-facing flows
5. Browser screenshots when visible route output changes, plus direct HTTP
   evidence when redirects or machine-readable behavior changes
6. `bun run verification` before accepting or committing a task

For SDK/provider and provenance work, also run `bun run check:boundaries`,
`bun run check:effect-setup`, and `bun run check:skills` directly so failures
are attributable before the combined gate.

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
