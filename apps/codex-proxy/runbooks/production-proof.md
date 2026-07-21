---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-codex-proxy-operator
last_reviewed: 2026-07-21
review_trigger: Production deployment, alias, protection, proxy route/auth/mode, profile/store, model, production preflight, or proof packet change
---

# Prove one Codex proxy Production deployment

## Scope and non-claims

Use this runbook to define and collect independent Production evidence. There
is currently no app-owned Production proof command. `proof:preview`, local
headers, historical rollout evidence, a Vercel `READY` status, or a passed
preflight must not be relabeled as Production proof. HGI-305 owns the missing
bounded Production packet and command improvements.

## Preconditions

- Record clean pushed source SHA, authenticated Vercel identity/scope, exact
  Production project, immutable deployment, stable alias resolution,
  Deployment Protection, config fingerprint, and metadata-only variable
  inventory.
- Prove the exact independent Production subject, namespace, cipher, profile,
  lock/fence identity, and bearer without revealing values or raw profile data.
- Confirm the accepted proxy deployment and its current/previous rollback
  references in the five-stage
  [agent deploy runbook](../../agent/runbooks/deploy-promote.md).
- Record approval for each remote Production request and its expected side
  effects/cost. Production proof is not bundled into deployment authority.

## Authority envelope

| Field               | Required value                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Identity            | Authenticated Vercel principal, private proxy caller, and approver                                                                 |
| Operation           | Metadata read and one explicitly approved Production health/auth/session journey                                                   |
| Resource            | Exact immutable proxy deployment, stable alias, subject/store, bearer, and upstream provider                                       |
| Environment         | Vercel Production only                                                                                                             |
| Duration/revocation | One proof window; session/bypass/bearer/provider access revocation owner named                                                     |
| Approval            | Separate receipt for Production requests and any external consequence                                                              |
| Receipt             | Source/deployment/config/alias identity, sanitized provider readback, exact journey result, `observedAt`, limitation, and rollback |

## Inputs and secret handling

Production config names are owned by `apps/codex-proxy/src/env.ts`, the Codex
runtime, and the production-preflight Schema. The runtime reads
`UPSTASH_REDIS_REST_URL` or `KV_REST_API_URL` and
`UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_TOKEN`; the current preflight also
requires `BUNDJIL_UPSTASH_REDIS_REST_URL` and
`BUNDJIL_UPSTASH_REDIS_REST_TOKEN` metadata. Treat that dual inventory as an
explicit preflight limitation until HGI-305 resolves the ambiguity. Stop if
the actual runtime binding cannot be established without reading values.

Never retain values, protected URLs, tokens/bypasses, prompts/output, raw SSE,
profiles/ciphertext, account IDs, authorization artifacts, or unsanitized logs.

## Procedure

1. Run source checks and the Production-stage preflight; neither is Production
   proof:

   ```bash
   bun run --filter @bundjil/codex-proxy check-types
   bun run --filter @bundjil/codex-proxy test
   bun run --filter @bundjil/codex-proxy build
   bun run --filter @bundjil/agent preflight:production
   ```

2. Read exact Vercel state:

   ```bash
   vercel whoami
   vercel project inspect bundjil-codex-proxy --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel list bundjil-codex-proxy --environment production --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel inspect "$PRODUCTION_DEPLOYMENT_URL" --scope "$BUNDJIL_VERCEL_SCOPE"
   ```

   Confirm stable alias resolution, source/config identity, protection,
   metadata-only bindings, independent Production identities, stored-profile
   proof, and current/previous rollback references.

3. **Proof gate:** stop unless an approved HGI-305-compatible journey or an
   explicitly bounded temporary proof plan names the candidate, starting state,
   health/auth/session oracle, external effects, evidence, limitation,
   non-claims, and recovery. Do not run `proof:preview` against Production.

4. Under that separate authority, collect health, absent-bearer `401`,
   invalid-bearer `401`, authenticated SSE completion, no-leak assertions,
   sanitized error logs, and one correlated agent-to-proxy request as distinct
   evidence. A health response alone cannot prove auth/session/provider
   behavior.

5. Re-read immutable deployment and stable alias state. Bind every result to
   source/deployment/config identity and `observedAt`; retain what was not
   established.

## Evidence and postcondition

The accepted packet must identify the artifact/candidate, authority, exact
Production journeys, observable results, provider readback, sanitized log
reference, risks, limitations, non-claims, rollback identity, and digest. Until
that packet exists, this runbook's result is `inconclusive`, not healthy.

## Rollback and revocation

Use the [agent deploy runbook](../../agent/runbooks/deploy-promote.md) for a
coordinated deployment rollback. Preserve the newest fenced profile generation;
do not roll back encrypted profile data. Revoke temporary sessions, bypasses,
and proof credentials after the window and read back their target state.

## Stop and escalation

Stop on wrong target/source/config/alias, missing independent identity,
ambiguous runtime binding, stale or unavailable Vercel readback, no approved
Production journey, missing rollback, blocked auth/profile proof, secret or
payload leak, or any attempt to upgrade Preview/local evidence. Escalate proof
gaps to HGI-305 and authority/workflow gaps to HGI-304.

## Readback fallback

Use authenticated Vercel metadata and the target-matched app journey. If either
is unavailable, retain an `inconclusive` receipt and stop. Source, historical
evidence, a stable hostname, local response header, deployment status, or an
old packet is not a fallback; unavailable is never healthy.

## Maintenance

Review when Production routing, Vercel metadata/protection, runtime bindings,
subject/store/cipher, auth/session behavior, preflight Schema, proof command,
packet schema, or rollback model changes.
