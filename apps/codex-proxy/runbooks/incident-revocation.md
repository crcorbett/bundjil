---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-codex-proxy-operator
last_reviewed: 2026-07-21
review_trigger: proxy incident, credential or profile compromise, auth/storage/provider outage, rollback, revocation, containment, or recovery change
---

# Contain Codex proxy incidents and revoke access

## Scope and non-claims

Use this runbook for proxy/auth/store incidents, bounded containment, deployment
rollback routing, and provider-owned revocation. The repository has no universal
profile delete, hosted token revoke, Vercel rollback, Upstash credential reset,
or secret rotation command. Do not invent one from internal service methods or
direct storage keys.

## Preconditions

- Open an incident record with ID/time, actor, severity, source SHA,
  deployment/config/alias identity, environment, subject/store/cipher identity,
  sanitized error code, suspected consequence, and current stop state.
- Preserve failing evidence without tokens, bypasses, protected URLs,
  prompts/output, raw SSE, profiles/ciphertext, storage keys, account IDs,
  authorization artifacts, or secret values.
- Read exact Vercel and Upstash metadata and the target's sanitized health/auth/
  stored-profile result. Mark unavailable dimensions inconclusive.
- Identify current/previous deployment references and the newest fenced profile
  generation. Do not roll encrypted profile data backward.

## Authority envelope

| Field               | Required value                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Identity            | Incident commander, executing principal, provider identity source, and approver                                    |
| Operation           | One isolate, rollback, rotate, revoke, reauthenticate, disable, or restore action                                  |
| Resource            | Exact deployment/alias, bearer/bypass/secret binding, subject/profile, database/prefix/cipher, or provider session |
| Environment         | Explicit affected and recovery environments                                                                        |
| Duration/revocation | Emergency expiry, access revocation, and follow-up owner                                                           |
| Approval            | Normal or break-glass receipt matching the operation and target                                                    |
| Receipt             | Before/after provider readback, source/config identity, `observedAt`, result, limitation, non-claim, and rollback  |

## Inputs and secret handling

Use names, immutable IDs, opaque fingerprints, error/status shapes, sanitized
counts, and boolean stored-profile proof only. Emergency credentials remain in
the approved secret path, never the repository or command line, and are revoked
at the recorded expiry.

## Procedure

1. Stop new deployment/promotion, proof/model requests, login/reauthentication,
   forced refresh, profile import/staging, credential changes, and automated
   callers for the affected target.

2. Run safe source checks when they clarify behavior:

   ```bash
   bun run --filter @bundjil/codex check-types
   bun run --filter @bundjil/codex test
   bun run --filter @bundjil/codex-proxy check-types
   bun run --filter @bundjil/codex-proxy test
   ```

3. Classify the observable boundary: health unavailable, proxy bearer `401`,
   `codex_reauthentication_required`, `codex_auth_temporarily_unavailable`,
   upstream/proxy `502`, storage/lock/fence fault, leak, wrong mode/target, or
   deployment/config/alias drift. Keep these claims separate.

4. Read Vercel project/deployment/alias/protection/metadata-only variable state,
   Upstash database metadata with credentials hidden, and sanitized stored-
   profile booleans for the exact subject. Confirm, contradict, or mark each
   dimension inconclusive with `observedAt`.

5. Select one bounded containment. Examples requiring separate authority are
   removing traffic from a bad deployment, restoring agent config so it cannot
   call a broken proxy, rotating one bearer/cipher/bypass/store credential,
   quarantining one subject, or reauthenticating one subject. Do not delete
   profile keys, roll back the profile generation, or mutate multiple providers
   speculatively.

6. **Mutation gate:** attach before state, the complete authority envelope,
   recovery oracle, rollback, and revocation. Execute only the named operation.
   Use the [agent incident runbook](../../agent/runbooks/incident-revocation.md)
   for coordinated Vercel rollback and the [reauthentication runbook](reauthentication.md)
   for one subject replacement.

7. Re-read every changed target. Prove local/Preview/Production at the matching
   boundary and preserve the newest fenced profile generation. Keep service
   recovery, deployment rollback, credential revocation, provider token
   validity, and Production health as separate claims.

8. Close only after emergency access is revoked, accepted postconditions are
   observed, residual risks/non-claims are recorded, and a durable owner/trigger
   exists. Otherwise retain failed or inconclusive evidence.

## Evidence and postcondition

Retain incident identity/times, actor/authority, target/environment, source/
deployment/config/alias and opaque profile identity, sanitized before/after
provider readback, one operation, observed result, proof artifact/digest,
limitations, non-claims, rollback identity, residual risk, and next owner.

## Rollback and revocation

Reverse only the recorded incident change. Vercel owns deployment/session/
bypass state, Upstash owns database credentials, the secret store owns bound
material, and the Codex account owner controls provider sessions/tokens. The
hosted runtime's revoke method is unsupported and no operator profile-delete
CLI exists. Preserve the newest fenced profile and read back each provider
after revocation.

## Stop and escalation

Stop on unknown current target, shared Preview/Production identity, subject/
store/cipher mismatch, missing rollback, unavailable readback, unknown provider
revoke support, suspected leak, repeated unauthorized response, storage/fence
fault, or any attempt to treat a local/Preview result as Production recovery.
Escalate to the provider owners in
[`docs/operations/authority-model.md`](../../../docs/operations/authority-model.md)
and to HGI-304/HGI-305 for authority/proof gaps.

## Readback fallback

Use only authenticated metadata and the boundary-matched app proof for the
exact target. If unavailable, retain an `inconclusive` receipt and choose no
mutation except an explicitly approved safest containment. Source, historical
evidence, local headers, old profile proof, or alternate credentials are not
fallbacks; unavailable is never healthy.

## Maintenance

Review after incidents/exercises and changes to error mapping, deployment,
auth/profile/refresh/fence, persistence/cipher, credentials, containment,
revocation, or proof.
