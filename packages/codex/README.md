# @bundjil/codex

Effect contracts and runtime services for Bundjil Codex profiles and the
private provider path.

## Purpose and public boundary

The package owns Codex identity, profile, token, request, stream, persistence,
and safe-error Schemas; named services and Layers for encrypted profile storage,
credential validity and refresh, direct Responses transport, request/stream
mapping, and the private proxy contract. It also exports explicit `runtime`,
`local`, `testing`, and `filesystem-store` subpaths.

Apps own HTTP servers, deployment configuration, model selection, and provider
operations. `@bundjil/store` owns provider-neutral persistence primitives. The
exact exports, Schemas, and runtime graph are owned by code and package exports;
durable design rules are in
[`docs/architecture/`](../../docs/architecture/README.md).

The package preserves trusted-local and hosted compositions as explicit code
boundaries. Their commands do not establish current provider state or authorize
an external operation.

## Public commands

Run from the repository root:

```bash
bun run --filter @bundjil/codex check-types
bun run --filter @bundjil/codex test
bun run --filter @bundjil/codex build
```

The package also exposes intentionally explicit local import, subscription
login, and proof commands through `package.json`. They require authorized,
target-owned procedures and are not general setup instructions.

## Documentation routes

- Historical Codex OAuth, storage, local-import, and model-provider decisions:
  [`docs/product-specs/`](../../docs/product-specs/index.md) and retained
  [`docs/exec-plans/completed/`](../../docs/exec-plans/completed/README.md).
- Repeatable trusted-local login, stored-profile, reauthentication, credential,
  storage, and recovery procedures are owned by the Codex proxy
  [`runbooks/`](../../apps/codex-proxy/runbooks/README.md). This package owns
  their executable contracts, not provider authority or current state.
- Dated provider responses, deployment observations, and journey proof have no
  canonical repository owner yet; HGI-305 must create bounded verification
  owners. External systems own current state.

Do not add provider actuality, dated proof, provisioning, secrets, operator
sequences, rollback, or incident procedures here.
