---
document_type: architecture-standard
lifecycle: current
authority: canonical
owner: bundjil-quality-owner
last_reviewed: 2026-07-21
review_trigger: verification, lint, test, CI, proof, documentation, or skill-control change
---

# Testing And Quality

Use the smallest check that proves the changed behavior, then broaden before
handoff when a change touches package contracts, runtime config, app tools, or
docs navigation.

## Standard Commands

Run from the repo root:

```bash
bun run check:boundaries
bun run check:effect-setup
bun run check:docs
bun run check:skills
bun run check:authority
bun run check:controls
bun run check:verification
bun run eval:hgi-307
bun run test:boundaries
bun run check
bun run test:lint
bun run knip
bun run check-types
bun run test
bun run build
bun run verification
```

`bun run check:boundaries` runs the TypeScript compiler-API provenance audit;
`bun run test:boundaries` proves its positive/negative fixtures and stale
exception behavior. `bun run check:effect-setup` proves the installed
TypeScript compiler is patched with the configured Effect language service.
`bun run check:docs` validates current metadata, links, indexes, lifecycle,
documented commands, package README coverage, successor routes, portability,
and owner-aware contradictions. It writes bounded console diagnostics and full
JSON detail to `tmp/docs-policy-report.json`. `bun run check:skills` rejects
broken/missing skill mirrors, invalid metadata/reference routes,
contradictory executable examples, and stale
Site-specific overlays in the relevant repo-owned skills, and confirms the
required provenance and frontend-composition policy is present in instruction
surfaces. `bun run verification` is the standard closeout gate. It runs those
policy checks, Ultracite, focused repository lint-rule tests, dependency
hygiene, workspace typechecks, and tests. `bun run check` enables
`bundjil/tagged-error-name` for app and package TypeScript; the rule rejects
any `Schema.TaggedErrorClass` whose class declaration, generic self-type, and
literal tag do not agree.

`bun run check:verification` validates all ten critical-journey records, their
real command/runbook mappings, every proof-packet template, bounded command
receipt constraints, evidence roots, lifecycle/provenance rules, and semantic
false-success cases. It validates repository contracts and fixtures only. It
does not call Vercel, Executor, Sendblue, Upstash, a model, or Production.
Packets and their claim boundaries are owned by
[`../verification/README.md`](../verification/README.md).

`bun run check:controls` decodes the canonical control and automation records,
the measured boundary decision, the feedback-promotion trace, and all retained
freshness candidates. It rejects missing owners/fixtures/costs/metrics,
automation-state drift, duplicate boundary identities, weakened occurrence
equivalence, candidate self-feedback, and unsafe publication. Full structured
detail is retained at `tmp/control-policy-report.json`; `bun run test:controls`
owns positive and adversarial fixtures. The gate is repository-only and grants
no workflow, deployment, provider, message, or Production authority.

`bun run eval:hgi-307` validates the current recorded harness epoch: all twelve
fresh-context scenario receipts, the exact scenario-manifest digest, distinct
four-clock fields, intervention decisions, every docs/README path inventory,
and the full docs/README/lint/skills/config/tests/CI/runbooks/rollback impact
ledger. It reads repository evidence only, writes bounded detail to
`tmp/harness-evaluation-report.json`, and grants no provider or mutation
authority. Epoch identity and metric interpretation are owned by
[`../verification/harness-epochs.md`](../verification/harness-epochs.md) and
[`../verification/effectiveness.md`](../verification/effectiveness.md).

Package-focused commands:

```bash
bun run --filter @bundjil/eve test
bun run --filter @bundjil/codex test
bun run --filter @bundjil/codex build
bun run --filter @bundjil/store test
bun run --filter @bundjil/store build
bun run --filter @bundjil/codex proof:codex-responses
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
bun run --filter @bundjil/agent preflight:production
```

## Scope Rules

- Docs-only change: run `bun run fix`, `bun run check`, focused link/path and
  stale-ownership scans, and `git diff --check`. When a SPEC mandates the
  repository closeout gate, also run `knip`, `verification`, and `build` with
  the required ignored local environment loaded.
- Package schema or export change: run that package's `check-types`, tests, and
  build, then root `bun run verification`.
- Eve tool change: run `@bundjil/eve` tests when contracts change,
  `@bundjil/agent` tests, `@bundjil/agent build`, then verification.
- Runtime config change: run app typecheck, app tests, app build, and
  verification.
- Critical-journey, proof-packet, receipt, or evidence-lifecycle change: run
  `bun run check:verification`, its focused fixture suite, the affected app
  tests, then root verification. Provider proof remains separately
  authority-gated.
- Control, automation, feedback-promotion, boundary-decision, or freshness
  candidate change: run `bun run check:controls`, `bun run test:controls`, the
  affected earlier-owner fixture, then root verification.
- Worker, tool, runtime, skill, scenario, context-projection, or harness-policy
  change: start a new epoch, run `bun run test:harness`, collect fresh scenario
  receipts, run `bun run eval:hgi-307`, then root verification. Never copy
  timing values between the four clocks or preserve a stale qualification
  silently.
- Channel/provider integration change: add or update a SPEC first, then include
  mock tests, live-boundary proof where safe, and docs.
- Codex subscription proof change: run `@bundjil/codex` tests,
  typecheck/build, and the opt-in `proof:codex-responses` command only with a
  private `CODEX_ACCESS_TOKEN` source. Proof output must contain only status,
  endpoint, byte/line counts, and safe booleans.
- Codex proxy app change: run `@bundjil/codex-proxy` check-types, tests,
  build, and smoke-test. Hosted deployment proof belongs in the deployment task
  and must verify isolated Preview before Production changes.
- Codex documentation task: update root, architecture, app, package, SPEC, and
  task-ledger docs as needed. Documentation-only verification must include
  stale-claim scans and `git diff --check`; run broader checks only when the
  parent acceptance task requires them.

## Risk-based implementation review

Select the review lenses that match the changed boundary; do not require a
fixed number of passes, reviewers, or delegated agents. For Effect runtime,
provider, storage, app-config, deployment, or durable-doc changes, consider:

- ownership and call graph, including supported and intentionally unsupported
  paths;
- implementation quality, including Effect Schema provenance, redacted Config,
  layers, error contracts, and helper admission; and
- verification coverage, including targeted checks, bounded evidence,
  deliberately skipped live proof, and required documentation updates.

Acceptance follows the task's applicable risks and evidence, not the number of
review entries. Correct an identified gap and rerun only the checks needed to
establish the repaired claim.

For persistence work, verify native `KeyValueStore` and
`AtomicKeyValueStore.transact` independently, scan for
`KeyValueStore.modify`/get-then-set coordination and consumer SDK imports, and
assert physical-key, encoded-value, TTL, privacy, replay, and rollback claims.
Replay records are not conversation/session/Workflow storage. Deployment proof
and monitoring may retain only safe statuses, counts, source correlation, and
leak booleans; do not use `clear` or `size` as coordination or recovery.

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
- For an intentional tagged-error rename, assert the exact target `_tag`
  through Schema encode and decode, and assert that the old tag is rejected.
  Keep public HTTP/tool/CLI mappings under test so internal tag migration does
  not change stable boundary status, code, message, or diagnostic shape.
- Retain fixtures for all non-selected error and state discriminants during a
  migration. They prove that the planned encoded-name changes were exhaustive
  and that unrelated contracts stayed exact.
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
boundary rather than pretending the model path completed. The repository does
not yet have a deterministic session-create, interrupted-stream, and recovery
fixture, so BND-J02 remains deferred and a local HTTP attempt is not a complete
recovery proof.

## Executor MCP Verification

For an Executor endpoint or instruction change, run focused agent check-types,
tests, and build with an explicit synthetic toolkit URL for each supported
`elicitation_mode=model` and `elicitation_mode=browser`. Config tests must
reject missing, duplicate, unknown, native, legacy model-resume, root,
non-HTTPS, wrong-host, port, userinfo, fragment, and extra-query forms through
the sanitized tagged config error. Instruction assertions must prove that a
paused model-mode turn makes no same-turn resume, only a later unambiguous
authenticated or allowlisted owner decision maps to one resume, ordinary
resume uses default empty content, and ambiguous/non-owner/quoted/provider/
tool/third-party/missing/multiple/mismatched/settled/replayed state fails
closed without a resume attempt.

The temporary model protocol is instruction-level and weaker than native or
browser authorization. Keep destructive and authority-management operations
blocked in tests and do not infer approval from a paused result. External
approval, deployment, rollback, and provider procedures require their
target-owned runbook and a fresh readback; this guide owns neither.

Codex proxy mode is not an ordinary Eve test requirement. Gateway remains the
default source selection. The access-token-only `local` workaround must never
be used as hosted auth. Source ignored env values rather than printing them:

```bash
PORT=<local-port> \
BUNDJIL_CODEX_PROXY_MODE=mock \
bun run --filter @bundjil/codex-proxy dev
```

This is a local mock check only. It establishes neither a hosted proxy nor any
provider state.

## Codex Proxy Verification

Local proxy checks use mock mode and must not call Codex:

```bash
bun run --filter @bundjil/codex-proxy smoke-test
```

The smoke test starts a local Bun server on an ephemeral port, checks
`GET /health`, and checks authenticated mock SSE from
`POST /v1/chat/completions`.

Manual probes must use a minimal request from a private shell; the server
decodes it through the owning Effect Schema boundary. Record no request body or
model output. Any hosted or provider observation belongs in a dated,
target-owned proof receipt with a source identity, `observedAt`, limitations,
and non-claims. It never grants deployment or mutation authority.

## Workflow and authority policy

Workflow or provider-authority changes run the machine-readable register,
action-lock, and workflow semantic gate:

```bash
bun run check:authority
bun run check:controls
bun run test:boundaries
```

The gate rejects missing authority-envelope fields, unavailable readback
reported as healthy, tool/preflight-derived authority, secret-bearing records,
unsafe emergency containment, mutable or mismatched action pins, widened
permissions, target mismatch, unbounded jobs, repeated review loops,
unapproved mutation, release publication, and restoration of retired automatic
Claude review. It proves source desired state only. GitHub and each provider
remain authoritative for current identity, settings, credentials, runs, and
consequences.

## Documentation Quality

Every durable feature should leave behind:

- a package README update when package behavior changes;
- an architecture doc update when ownership or patterns change;
- app README updates for commands, env vars, routes, and local proof;
- a SPEC and task ledger for new apps, channels, providers, or package
  boundaries.

Every SPEC and implementation review must also maintain a downstream-impact
ledger. Mark docs, affected READMEs/runbooks, agent instructions and skills,
schemas/contracts/exports, lint and boundary rules, Effect diagnostics,
CI/scripts, tests/fixtures/evidence, observability, rollout/rollback, the SPEC,
task ledger, and active plan as `Change required` or `N/A` with a reason. Edit
all required artifacts before accepting the slice.

Use `rg` for docs checks:

```bash
rg -n "old-path|old-package|old-command" README.md AGENTS.md docs apps packages
rg -n "docs/architecture/(effect-patterns|repo-structure|testing-and-quality)" README.md AGENTS.md docs ARCHITECTURE.md
bun run check:skills
bun run check:docs
bun run check:authority
```

Stale-name scans must be scoped by provenance. Current source, manifests,
configuration, commands, architecture, runbooks, and navigation must use the
current names. Historical specifications, completed task ledgers and plans may
retain prior names when they are explicitly labeled; focused old-tag fixtures
may retain a literal only to prove rejection. Review and classify those matches
instead of weakening the current-source gate or blindly rewriting history.

Docs should describe current behavior and exact verification commands. Avoid
long aspirational sections unless they clearly mark future work.
