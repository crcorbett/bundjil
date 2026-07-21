# @bundjil/agent

Committed Vercel Eve app for the Bundjil personal-agent boundary.

## Purpose and boundary

This app owns the Eve definition, app configuration, channel orchestration,
identity, routing, atomic replay, request-scoped dispatch, provider composition
roots, model selection, instructions, tools, deployment boundary, and app-level
tests.

It composes:

- `@bundjil/channel` for the provider-neutral nominal `ChannelTransport`;
- `@bundjil/sendblue` and `@bundjil/photon` only at provider-specific Layer
  composition roots;
- `@bundjil/store` for atomic replay persistence;
- `@bundjil/eve` for reusable Eve-facing contracts.

The app does not own provider wire DTOs/clients, Codex OAuth/profile storage, a
public proxy gateway, or provider management state. Provider selection does not
exist inside domain operations: the two authored routes each build one
provider-specific runtime over the same app-owned services.

## Channel boundary

Authored routes:

- `POST /eve/v1/sendblue/webhook`
- `POST /eve/v1/photon/webhook`

Each route decodes/authenticates through its provider Layer, then uses the same
identity, HMAC routing, atomic replay, immutable `ChannelStateV1`, Eve dispatch,
presence, and outbound-acceptance path. Accepted ingress returns `202`;
ignored/duplicate ingress returns `204`; authentication, payload, and
routing/replay failures map to `401`, `400`, and `503` respectively.

The replacement path uses only these app-owned environment namespaces:

| Concern  | Environment names                                                                                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routing  | `BUNDJIL_CHANNEL_ROUTING_IDENTITIES`, `BUNDJIL_CHANNEL_ROUTING_SECRET`                                                                                                                                                                                |
| Replay   | `BUNDJIL_CHANNEL_REPLAY_PREFIX`, `BUNDJIL_CHANNEL_REPLAY_LEASE_MILLISECONDS`, `BUNDJIL_CHANNEL_REPLAY_TTL_MILLISECONDS`, `BUNDJIL_CHANNEL_REPLAY_REST_URL`, `BUNDJIL_CHANNEL_REPLAY_REST_TOKEN`, `BUNDJIL_CHANNEL_REPLAY_STORE_PREFIX`                |
| Sendblue | `BUNDJIL_CHANNEL_SENDBLUE_ALLOWED_SERVICES`, `BUNDJIL_CHANNEL_SENDBLUE_API_KEY`, `BUNDJIL_CHANNEL_SENDBLUE_API_SECRET`, `BUNDJIL_CHANNEL_SENDBLUE_LINE`, `BUNDJIL_CHANNEL_SENDBLUE_TYPING_DURATION_MILLIS`, `BUNDJIL_CHANNEL_SENDBLUE_WEBHOOK_SECRET` |
| Photon   | `BUNDJIL_CHANNEL_PHOTON_PROJECT_ID`, `BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET`, `BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID`, `BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET`, `BUNDJIL_CHANNEL_PHOTON_WEBHOOK_TOLERANCE_SECONDS`                                        |

Secrets are decoded as `Redacted` values through owner Schemas. The state,
replay prefix, store prefix, routing tokens, and config namespace intentionally
do not read the removed legacy Sendblue path. Git history and retained rollout
evidence are the only legacy rollback sources.

Neither clean provider route is current Production behavior merely because it
exists in source or builds. A provider-selection and Production-promotion SPEC
must be accepted before deployment, environment binding, webhook cutover, or
legacy deployment retirement.

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

- Durable app/runtime and Channel call graphs:
  [`docs/architecture/eve-agent.md`](../../docs/architecture/eve-agent.md).
- Package/import ownership:
  [`docs/architecture/repo-structure.md`](../../docs/architecture/repo-structure.md).
- Local commands and proof levels:
  [`docs/architecture/testing-and-quality.md`](../../docs/architecture/testing-and-quality.md).
- Photon provider-only operation:
  [`docs/runbooks/photon-provider-proof.md`](../../docs/runbooks/photon-provider-proof.md).
- Dated Photon lifecycle evidence:
  [`docs/verification/photon-provider-proof-2026-07-21.md`](../../docs/verification/photon-provider-proof-2026-07-21.md).
- Historical Eve, Executor, legacy Sendblue, and model-provider rollout
  provenance: [`docs/product-specs/`](../../docs/product-specs/index.md) and
  [`docs/exec-plans/completed/`](../../docs/exec-plans/completed/README.md).

Do not add provider actuality, deployment identifiers, credentials,
provisioning sequences, incident steps, rollback procedures, or dated proof
records here.
