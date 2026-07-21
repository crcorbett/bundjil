---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-codex-proxy-operator
last_reviewed: 2026-07-21
review_trigger: reauthentication error, refresh policy, subject, trusted-local login, profile commit/fence, cipher, store, or target proof change
---

# Reauthenticate one Codex subject

## Scope and non-claims

Use this runbook when the proxy returns `codex_reauthentication_required` for
one exact subject. Distinguish it from
`codex_auth_temporarily_unavailable`: permanent auth failures require trusted-
local login; transient storage/refresh failures retain the profile and must not
trigger blind replacement. A local stored-profile proof does not prove a later
provider token or Production request.

## Preconditions

- Bind the sanitized HTTP error to one target deployment/config, environment,
  subject, database/prefix, and cipher key ID.
- Read current Vercel and Upstash metadata without values. Run stored-profile
  proof only against the exact subject under approved read authority.
- Confirm this is personal single-owner use. Stop if the principal, connector,
  installation, profile ID, namespace, or cipher is unknown or shared.
- Preserve the current encrypted/fenced profile generation and incident
  evidence. Do not stage expiry, force invalid grants, or use a working owner
  profile for failure demonstration.
- Record approval for the provider login and profile replacement.

## Authority envelope

| Field               | Required value                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Identity            | Authenticated local human, explicit Codex subject, and target operator                                 |
| Operation           | One trusted-local login/profile replacement plus target-matched proof                                  |
| Resource            | Exact subject, database/prefix, cipher, deployment/config, and provider account                        |
| Environment         | Explicit isolated, Preview, or Production target                                                       |
| Duration/revocation | One login/proof window; provider/session/profile revocation owner named                                |
| Approval            | Required for provider authorization and encrypted profile mutation                                     |
| Receipt             | Before/after sanitized profile proof, target identity, `observedAt`, result, limitation, and non-claim |

## Inputs and secret handling

Use the same explicit login inputs as [local authentication](local-auth.md) and
the same proxy subject inputs as `apps/codex-proxy/src/env.ts`. Never infer
identity from a token. Login defaults and proxy defaults differ; resolve and
compare all four subject fields before mutation. Never print or retain tokens,
account IDs, callback URLs, authorization artifacts, raw profiles/ciphertext,
storage keys/hashes/revisions, secret values, or protected URLs.

## Procedure

1. Classify the target response. `codex_reauthentication_required` may follow a
   missing/expired token, permanent refresh failure, incompatible profile,
   cipher failure, or reauthentication flag. `codex_auth_temporarily_unavailable`
   represents storage/lock/refresh availability and must be investigated before
   login.

2. Read exact Vercel deployment/config/alias metadata and Upstash database
   metadata. Run:

   ```bash
   bun run --filter @bundjil/codex proof:stored-profile
   ```

   Record only sanitized booleans. A blocked result or target mismatch stops
   the procedure.

3. Reconcile `BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID`, connector, installation,
   profile ID, prefix, and cipher with the target proxy's
   `BUNDJIL_CODEX_SUBJECT_ID`, connector, installation, profile ID, store, and
   cipher. Do not rely on defaults.

4. **Mutation gate:** attach the complete authority envelope and preserve the
   before proof. On a trusted local host run one login:

   ```bash
   bun run --filter @bundjil/codex login:subscription
   ```

5. Immediately repeat `proof:stored-profile` against the same subject. Require
   subscription, refresh-capable, valid expiry, reauthentication false, V2
   encrypted envelope, and no marker leak.

6. For Preview, use the [Preview proof](preview-proof.md). For Production, use
   the independent [Production proof](production-proof.md); there is no sourced
   one-command Production reauthentication or proof shortcut.

7. Record before/after profile booleans and target-matched result. Remove
   temporary local access and read back provider/session state where supported.

## Evidence and postcondition

Retain actor/approval, exact subject and target identities, source/deployment/
config identity, before/after stored-profile booleans, `observedAt`, target-
matched proof, limitations, non-claims, and newest fenced generation identity
without its value. Reauthentication is complete only for the target whose
boundary-matched proof passed.

## Rollback and revocation

Do not restore an older encrypted profile generation or directly edit Upstash.
If replacement fails, preserve/quarantine the newest fenced state and escalate.
Provider account controls own token/session revocation; the hosted runtime's
revoke path is unsupported and this repository exposes no operator revoke/delete
CLI. Rotation/re-login is not profile-generation rollback.

## Stop and escalation

Stop on transient auth code without a proven permanent failure, subject/default
mismatch, shared namespace/cipher, wrong environment, blocked proof, missing
approval, unsupported multi-user/public use, secret output, or missing
target-matched proof. Escalate account auth to the provider owner,
store/cipher/fence faults to the Codex/Upstash owner, and Production proof gaps
to HGI-305.

## Readback fallback

If provider, deployment, or store metadata is unavailable, retain an
`inconclusive` receipt and stop. Local auth-cache import, direct key access,
another subject, old proof, or a Preview result is not a fallback; unavailable
is never healthy.

## Maintenance

Review when error mapping, refresh/permanent-failure policy, subject defaults,
login, profile Schema/commit/fence, cipher/store, or Preview/Production proof
changes.
