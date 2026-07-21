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
bun run --filter @bundjil/codex-proxy proof:preview
```

`proof:preview` is a deliberately explicit, private probe command; it is not a
standing deployment assertion or an operating procedure. It emits one bounded
receipt and stores only integrity-checked sanitized detail.

## Documentation routes

- Current durable rules and verification expectations:
  [`docs/architecture/`](../../docs/architecture/README.md).
- Historical Codex provider, storage, and proxy rollout provenance:
  [`docs/product-specs/`](../../docs/product-specs/index.md) and
  [`docs/exec-plans/completed/`](../../docs/exec-plans/completed/README.md).
- Repeatable local-authentication, Preview/Production proof,
  reauthentication, deployment, credential, incident, rollback, and recovery
  procedures are owned by [`runbooks/`](runbooks/README.md). They require
  just-in-time target readback and an explicit authority envelope before
  consequential steps.
- Critical journeys, proof packets, bounded command receipts, and retained
  evidence are owned by
  [`docs/verification/`](../../docs/verification/README.md). External systems
  remain authoritative for current state; a packet proves only its exact
  candidate, target, authority, observation, and stated postcondition.

Do not add provider actuality, provisioning sequences, credentials, deployment
identities, incident steps, rollback procedures, or proof records here; update
the target-owned runbook and only this pointer when routing changes.
