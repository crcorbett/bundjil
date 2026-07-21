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
```

`preflight:production` is a deliberately explicit read-only gate command. It
does not grant deployment authority or establish current provider state.

## Documentation routes

- Current durable code, Effect, frontend, and verification rules:
  [`docs/architecture/`](../../docs/architecture/README.md).
- Historical Eve, Executor, Sendblue, and model-provider rollout provenance:
  [`docs/product-specs/`](../../docs/product-specs/index.md) and retained
  [`docs/exec-plans/completed/`](../../docs/exec-plans/completed/README.md).
- Repeatable deployment, provider configuration, incident, rollback, and
  recovery procedures have no canonical repository owner yet; HGI-303 must
  create target-owned runbooks.
- Dated deployment, webhook, provider, and critical-journey observations have
  no canonical repository owner yet; HGI-305 must create bounded verification
  owners. External systems remain authoritative for current state.

Do not add provider actuality, deployment identifiers, credentials,
provisioning sequences, incident steps, rollback procedures, or proof records
here.
