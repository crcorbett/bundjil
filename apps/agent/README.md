# @bundjil/agent

Committed Vercel Eve app for the Bundjil personal-agent boundary.

## Purpose and boundary

This app owns the Eve definition, app configuration, channel adapters, model
selection, instructions, tools, deployment boundary, and app-level tests. It
uses `@bundjil/eve` for reusable Eve-facing contracts and `@bundjil/store` for
shared persistence contracts; it does not own Codex OAuth/profile storage or a
public proxy gateway.

The app's decoded configuration, channel/authentication contracts, replay and
delivery policy, and model-provider behavior are owned by code and Schemas.
The default Eve routes and their exact access policy are app implementation
details; durable boundary rules belong in
[`docs/architecture/`](../../docs/architecture/README.md).

## Public commands

Run from the repository root:

```bash
bun run --filter @bundjil/agent dev:no-ui
bun run --filter @bundjil/agent check-types
bun run --filter @bundjil/agent test
bun run --filter @bundjil/agent build
bun run --filter @bundjil/agent preflight:production
```

`preflight:production` is a deliberately explicit read-only gate command. It
emits one bounded receipt plus an integrity-checked sanitized detail artifact;
it does not grant deployment authority or establish current provider state.

## Documentation routes

- Current durable code, Effect, frontend, and verification rules:
  [`docs/architecture/`](../../docs/architecture/README.md).
- Historical Eve, Executor, Sendblue, and model-provider rollout provenance:
  [`docs/product-specs/`](../../docs/product-specs/index.md) and retained
  [`docs/exec-plans/completed/`](../../docs/exec-plans/completed/README.md).
- Repeatable local, deployment/promotion, Executor, Sendblue, incident,
  rollback, and recovery procedures are owned by
  [`runbooks/`](runbooks/README.md). They require just-in-time target readback
  and an explicit authority envelope before consequential steps.
- Critical journeys, proof packets, bounded command receipts, and retained
  evidence are owned by
  [`docs/verification/`](../../docs/verification/README.md). External systems
  remain authoritative for current state; a packet proves only its exact
  candidate, target, authority, observation, and stated postcondition.

Do not add provider actuality, deployment identifiers, credentials,
provisioning sequences, incident steps, rollback procedures, or proof records
here; update the target-owned runbook and only this pointer when routing
changes.
