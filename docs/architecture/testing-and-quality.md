# Testing And Quality

Use the smallest check that proves the changed behavior, then broaden before
handoff when a change touches package contracts, runtime config, app tools, or
docs navigation.

## Standard Commands

Run from the repo root:

```bash
bun run check
bun run knip
bun run check-types
bun run test
bun run build
bun run verification
```

`bun run verification` is the standard closeout gate. It runs Ultracite,
dependency hygiene, workspace typechecks, and tests.

Package-focused commands:

```bash
bun run --filter @bundjil/core test
bun run --filter @bundjil/effect-start test
bun run --filter @bundjil/eve-effect test
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
```

## Scope Rules

- Docs-only change: run `bun run check` and targeted `rg` checks for links,
  paths, and renamed files.
- Package schema or export change: run that package's `check-types`, tests, and
  build, then root `bun run verification`.
- Eve tool change: run `@bundjil/eve-effect` tests when contracts change,
  `@bundjil/agent` tests, `@bundjil/agent build`, then verification.
- Runtime config change: run app typecheck/build and verification.
- Channel/provider integration change: add or update a SPEC first, then include
  mock tests, live-boundary proof where safe, and docs.

## Effect Test Patterns

Use `@effect/vitest` for Effect programs:

```ts
it.effect("does the thing", () =>
  Effect.gen(function* testThing() {
    const result = yield* program;
    assert.strictEqual(result.ok, true);
  })
);
```

Rules:

- Test live deterministic layers without external credentials.
- Provide memory/mock layers for service boundaries.
- Keep provider-network tests explicit and opt-in.
- Validate schema failures, not only success paths, when a schema owns a public
  edge.
- For Eve tools, test both `execute(...)` behavior and the Standard Schema /
  Standard JSON Schema metadata produced by `toEveSchema(...)`.

## Eve Runtime Verification

The app test suite proves tool execution without starting Eve or calling a
model. For local HTTP proof, start Eve:

```bash
bun run --filter @bundjil/agent dev:no-ui
```

For installed `eve@0.20.0`, the default local URL is:

```text
http://127.0.0.1:2000
```

Useful probes:

```bash
curl -sS http://127.0.0.1:2000/eve/v1/info
```

```bash
curl -i -sS \
  -X POST http://127.0.0.1:2000/eve/v1/session \
  -H "Content-Type: application/json" \
  -d '{"message":"Use the workspace_status tool to tell me what packages are available in the Bundjil repo. Keep the answer short."}'
```

```bash
curl -N http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

Do not fake model output when Gateway credentials are missing. A session may
start and then fail during streaming with `MODEL_CALL_FAILED`; document that
boundary rather than pretending the model path completed.

## Documentation Quality

Every durable feature should leave behind:

- a package README update when package behavior changes;
- an architecture doc update when ownership or patterns change;
- app README updates for commands, env vars, routes, and local proof;
- a SPEC and task ledger for new apps, channels, providers, or package
  boundaries.

Use `rg` for docs checks:

```bash
rg -n "old-path|old-package|old-command" README.md AGENTS.md docs apps packages
rg -n "docs/architecture/(effect-patterns|repo-structure|testing-and-quality)" README.md AGENTS.md docs ARCHITECTURE.md
```

Docs should describe current behavior and exact verification commands. Avoid
long aspirational sections unless they clearly mark future work.
