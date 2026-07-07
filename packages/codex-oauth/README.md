# @bundjil/codex-oauth

Effect contracts for Bundjil-owned Codex OAuth profiles.

This package owns the reusable profile boundary only. It does not perform live
OAuth endpoint exchange, call Codex Responses, or change the Eve app model.

## Contracts

- `CodexOAuthSubject` identifies one Codex profile by provider, principal,
  connector id, installation id, and profile id.
- `CodexOAuthProfile` stores redacted access and refresh token wrappers,
  expiry timestamps, scopes, and reauthentication state.
- `CodexProfileStore` is the profile persistence service.
- `CodexOAuthService` is the token lifecycle service.
- `CodexOAuthClient` is the future provider-client boundary.

Token schemas use Effect `Schema.RedactedFromValue`. Decoded values print and
serialize as redacted placeholders, while the KeyValueStore JSON codec can
persist the token value inside the approved storage boundary.

## Storage Keys

Profiles are stored under:

```text
bundjil/oauth/v1/provider/codex/profile/{subjectHash}
```

`subjectHash` is a SHA-256 hash over the canonical subject fields. Raw emails,
token values, prompts, and OAuth responses are not included in storage keys.

## Layers

- `CodexProfileStoreKeyValueLive`, exported from
  `@bundjil/codex-oauth/live.layer`, wires `CodexProfileStore` to
  `effect/unstable/persistence/KeyValueStore`.
- `CodexOAuthClientLive` and `CodexOAuthServiceLive`, also exported from the
  live subpath, are deterministic and non-networked in this slice. Client
  operations fail with `CodexOAuthUnsupportedRuntimePath` until the live OAuth
  task implements endpoint exchange.
- `CodexOAuthMemory` and `CodexProfileStoreMemory`, exported from
  `@bundjil/codex-oauth/mock.layer`, use
  `KeyValueStore.layerMemory` for deterministic tests and optional seeded
  profiles.

The root export is reserved for schemas, errors, service tags, and pure
operation helpers. Import live and mock layers from their explicit subpaths.

## Safe Secret Handling

Do not log, snapshot, or include access tokens, refresh tokens, authorization
codes, raw OAuth responses, or private prompts in errors. Public tagged errors
only include safe fields such as operation names, profile ids, hashed subject
keys, timestamps, and sanitized messages.

## Verification

Run from the repo root:

```bash
bun run --filter @bundjil/codex-oauth test
bun run --filter @bundjil/codex-oauth build
bun run check-types
```
