---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-codex-proxy-operator
last_reviewed: 2026-07-21
review_trigger: trusted-local login, subject defaults, OAuth protocol, callback, profile store, cipher, Upstash, local proxy, or stored-profile proof change
---

# Create a trusted-local Codex profile

## Scope and non-claims

Use this runbook to create one encrypted subscription profile through the
trusted-local browser/loopback flow and prove its sanitized stored shape. The
login writes provider and storage state. Local import is a legacy diagnostic,
not refresh-capable subscription proof. Neither command proves a deployed
proxy, current Vercel configuration, or Production.

## Preconditions

- Identify one personal Codex subscription principal and one isolated subject:
  principal, connector, installation, and profile ID.
- Identify the exact Upstash database/namespace and cipher key ID through
  metadata-only readback. Do not read existing values or keys.
- Confirm no other subject/environment shares the namespace, key, or proof
  identity. Keep Preview and Production independent.
- Use a trusted local host with an interactive browser and loopback callback.
  Hosted/Vercel runtimes have no OAuth start/callback route.
- Record approval for the provider login and encrypted profile write.

## Authority envelope

| Field               | Required value                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Identity            | Authenticated local human and explicit Codex subject principal                                                   |
| Operation           | One `login:subscription` and one sanitized stored-profile readback                                               |
| Resource            | Exact Codex subject, Upstash database/prefix, and cipher key ID                                                  |
| Environment         | Isolated local/Preview-preparation/Production-preparation target; never inferred from defaults                   |
| Duration/revocation | One login session; callback timeout and profile/provider revocation owner named                                  |
| Approval            | Required for provider authorization and profile mutation                                                         |
| Receipt             | Subject fingerprints/labels only, command JSON, `observedAt`, stored-profile booleans, limitation, and non-claim |

## Inputs and secret handling

Login identity uses `BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID`, optional
`BUNDJIL_CODEX_PROFILE_CONNECTOR_ID`, optional
`BUNDJIL_CODEX_PROFILE_INSTALLATION_ID`, optional
`BUNDJIL_CODEX_PROFILE_ID`, and optional
`BUNDJIL_CODEX_LOGIN_CALLBACK_TIMEOUT`. Storage/cipher uses
`UPSTASH_REDIS_REST_URL` or `KV_REST_API_URL`,
`UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_TOKEN`, optional
`BUNDJIL_UPSTASH_REDIS_KEY_PREFIX`,
`BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`,
`BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY`, and optional
`BUNDJIL_CODEX_PROFILE_ENCRYPTION_ALGORITHM`.

Never print or retain callback URLs, authorization codes, state/verifier,
tokens, account IDs, profile keys/hashes/revisions, ciphertext, secret values,
raw provider responses, or local auth-cache contents.

## Procedure

1. Prove source behavior before operating the provider:

   ```bash
   bun run --filter @bundjil/codex check-types
   bun run --filter @bundjil/codex test
   bun run --filter @bundjil/codex-proxy smoke-test
   ```

2. Record the resolved subject fields and compare them with the target proxy
   config. Do not rely on defaults: login defaults (`bundjil-local`,
   `agent-dev`) differ from proxy defaults (`bundjil-codex-proxy`, `local`).
   Stop on any mismatch.

3. Read Upstash database metadata with credentials hidden and confirm the
   intended prefix and cipher key ID out of band. This is metadata preflight,
   not a profile read.

4. **Mutation gate:** attach the complete authority envelope. Then run one
   trusted-local login:

   ```bash
   bun run --filter @bundjil/codex login:subscription
   ```

   A blocked result is failure; do not retry with a different subject or
   credential path without a new envelope.

5. Immediately run the sanitized proof against the same resolved subject,
   database/prefix, and cipher:

   ```bash
   bun run --filter @bundjil/codex proof:stored-profile
   ```

   Require `found`, V2 envelope, ciphertext present, subscription profile,
   refresh capable, valid expiry, reauthentication false, and marker-leak false.

6. Record the booleans and command identities only. Remove temporary local
   configuration from the process/session and verify the worktree has no
   tracked secret material.

## Evidence and postcondition

Retain source SHA, actor/approval, explicit subject labels or opaque
fingerprints, database/prefix and cipher key identities, `observedAt`, the
sanitized login result, stored-profile booleans, worktree check, limitations,
and non-claims. The proof establishes only the configured encrypted store and
subject at that time; it does not prove provider token validity at a later use.

## Rollback and revocation

There is no repository CLI for hosted profile delete/revoke. Do not improvise
direct Upstash key deletion. If the login targeted the wrong isolated subject,
quarantine it and escalate to the profile/store owner for an approved
subject-aware removal and provider-account revocation. Preserve the newest
fenced generation until a safe successor is proven.

## Stop and escalation

Stop on subject/default mismatch, shared environment identity, unknown store or
cipher, missing approval, blocked login/proof, non-subscription profile,
invalid expiry, reauthentication flag, marker leak, secret output, or an
attempt to run OAuth on Vercel. Escalate provider authorization to the account
owner, storage/cipher faults to the Codex/Upstash owner, and source faults to
the package maintainer.

## Readback fallback

The fallback for missing provider/storage capability is an `inconclusive`
receipt and escalation; do not use local auth-cache import, another namespace,
raw Upstash access, or an old profile proof. Unavailable is never healthy.

## Maintenance

Review when OAuth protocol/callback, subject identity, defaults, store/prefix,
cipher, profile Schema, login command, or stored-profile proof changes.
