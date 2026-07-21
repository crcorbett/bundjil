# @bundjil/codex-proxy

Private Effect HTTP proxy for Bundjil Codex subscription model access.

## Purpose and boundary

This app owns the private HTTP route, Vercel entrypoint, app configuration,
mode selection, and internal bearer boundary. It composes the stable Codex
contracts and Layers from [`@bundjil/codex`](../../packages/codex/README.md).
It does not own browser OAuth, a public gateway, Eve model selection, or shared
provider contracts.

`GET /health` reports the app health contract. `POST /v1/chat/completions`
requires the app-owned internal bearer. The app's `mock`, `local`, and `live`
modes are decoded from app configuration; code and Schemas own their exact
behavior and error contracts.

## Public commands

Run from the repository root:

```bash
bun run --filter @bundjil/codex-proxy dev
bun run --filter @bundjil/codex-proxy check-types
bun run --filter @bundjil/codex-proxy test
bun run --filter @bundjil/codex-proxy build
bun run --filter @bundjil/codex-proxy smoke-test
```

`proof:preview` is a deliberately explicit, private probe command; it is not a
standing deployment assertion or an operating procedure.

## Documentation routes

- Current durable rules and verification expectations:
  [`docs/architecture/`](../../docs/architecture/README.md).
- Historical Codex provider, storage, and proxy rollout provenance:
  [`docs/product-specs/`](../../docs/product-specs/index.md) and
  [`docs/exec-plans/completed/`](../../docs/exec-plans/completed/README.md).
- Repeatable deployment, credential, incident, rollback, and recovery
  procedures have no canonical repository owner yet; HGI-303 must create the
  target-owned runbooks before such operations are performed from repository
  documentation.
- Dated provider/deployment observations have no canonical repository owner
  yet; HGI-305 must create bounded verification owners. External systems remain
  authoritative for current state.

Do not add provider actuality, provisioning sequences, credentials, deployment
identities, incident steps, rollback procedures, or proof records here.
