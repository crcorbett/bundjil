# Effect Boundary Provenance Enforcement Execution Plan

- Status: In progress
- Started: 2026-07-18
- SPEC: `docs/product-specs/effect-boundary-provenance-enforcement.md`
- Tasks: `docs/product-specs/effect-boundary-provenance-enforcement.tasks.json`
- Goal: implement four tasks sequentially with one Terra Medium subagent per
  task; the parent reviews, audits, verifies, accepts, and commits each task
  before delegating the next.

## Baseline

- Branch: `main`
- Starting commit: `650e9bc`
- Initial working tree: only the new SPEC and sibling task ledger were
  untracked.
- Current audit candidates: 35 explicit raw `string` annotations, 22
  `unknown` occurrences, 147 direct string Schema references, 98 decode calls,
  41 encode calls, and three synchronous Schema decodes in production package
  source.
- Candidate strict Effect diagnostics found five global-fetch occurrences and
  one nested `Effect.gen` occurrence. `deterministicKeys` is outside scope.
- Baseline verification passed with the ignored Preview-local environment
  loaded. No secret values are retained here.

## Task 1 - Establish Boundary Provenance Audit

- Status: Completed
- Subagent: Rawls (`019f75f4-f967-7923-bb06-d4854be00466`)
- Commit: `337762d`

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Completed
- Evidence: Root `tooling/boundary-audit.ts` owns the compiler-API check and
  imports only TypeScript plus the root registry; it never imports app/package
  runtime modules. `tooling/boundary-exceptions.ts` records only exact
  file/symbol/occurrence/rule adapter entries. Production source and operator scripts flow
  through `bun run check:boundaries`; fixture source flows through
  `bun run test:boundaries`.

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Completed
- Evidence: Reviewed `tooling/boundary-audit.ts` and
  `tooling/boundary-exceptions.ts`: no runtime behavior or provider wiring
  changed, no package/helper layer was added, and exception matching is exact
  on file, symbol, occurrence, and rule. The audit uses a TypeScript `Program`
  and type checker for public signatures and codec Type/Encoded provenance; its
  rule-sized checks report codec remediation and fail stale or duplicate
  registry entries. The Effectful CLI uses one tagged error and handles it in
  the outer pipe.

### Parent Audit Pass 3 - Verification And Evidence

- Status: Completed
- Evidence: `bun run test:boundaries` passed 22 positive/negative fixture,
  occurrence, codec-side, and stale/duplicate-exception tests;
  `bun run check:boundaries`, `tsc --project tooling/tsconfig.json`, Ultracite,
  Knip, all seven workspace typechecks, and 223 existing package/app tests
  passed. `bun --env-file=apps/agent/.env.preview.local run verification`
  passed. No live or browser proof is required because runtime output did not
  change. A standalone production-style agent build still requires its full
  runtime configuration and is tracked for the later app/config migration.

## Task 2 - Migrate Codex Boundaries End To End

- Status: In progress
- Subagent: Halley (`019f7621-76df-75b0-a2f0-99b65fdd614b`)
- Commit: pending

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Pending
- Evidence: pending

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Pending
- Evidence: pending

### Parent Audit Pass 3 - Verification And Evidence

- Status: Pending
- Evidence: pending

## Task 3 - Migrate Channel, Proxy, Config, And Persistence Boundaries

- Status: Pending
- Subagent: pending
- Commit: pending

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Pending
- Evidence: pending

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Pending
- Evidence: pending

### Parent Audit Pass 3 - Verification And Evidence

- Status: Pending
- Evidence: pending

## Task 4 - Enable Hard Gates And Reconcile Documentation And Skills

- Status: Pending
- Subagent: pending
- Commit: pending

### Parent Audit Pass 1 - Ownership And Call Graph

- Status: Pending
- Evidence: pending

### Parent Audit Pass 2 - Effect And Implementation Quality

- Status: Pending
- Evidence: pending

### Parent Audit Pass 3 - Verification And Evidence

- Status: Pending
- Evidence: pending

## Final Closeout

- Status: Pending
- Boundary audit: pending
- Effect language-service setup and diagnostics: pending
- Root verification: pending
- Root build: pending
- Diff and task-ledger validation: pending
- Frontend/Browser proof: not applicable unless implementation changes a
  visible route.
- Live provider proof: not required unless implementation changes runtime
  composition or wire output.
