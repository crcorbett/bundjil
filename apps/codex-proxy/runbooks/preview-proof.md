---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-codex-proxy-operator
last_reviewed: 2026-07-21
review_trigger: Preview deployment, Vercel protection, proxy route/auth/mode, stored profile, model/reasoning, proof command, or output contract change
---

# Prove one Codex proxy Preview

## Scope and non-claims

Use this runbook to bind the existing private HTTP probe to one immutable
Vercel Preview. The probe performs remote requests, including one short Codex
completion, but does not deploy or mutate configuration. It proves only the
named Preview at `observedAt`; it is never Production proof.

## Preconditions

- Record clean pushed source SHA and authenticated Vercel identity/scope.
- Read the exact Preview project's immutable deployment URL/ID, environment,
  source SHA, Deployment Protection, configuration fingerprint, `live` mode,
  reasoning effort, subject/namespace/cipher identity, and variable-name/type
  inventory without values.
- Run [local authentication](local-auth.md) or otherwise prove the exact
  isolated Preview subject with sanitized stored-profile proof.
- Obtain authority for the remote model call and any protection bypass use.
  The bypass grants platform access only; it is not the proxy bearer.
- Do not create a deployment, bypass, profile, or environment variable as part
  of this proof run.

## Authority envelope

| Field               | Required value                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Identity            | Authenticated Vercel principal and private proxy caller                                                    |
| Operation           | Metadata read plus one `proof:preview` journey                                                             |
| Resource            | Exact immutable Preview deployment, subject/store, bypass identity, and proxy bearer identity              |
| Environment         | Vercel Preview only                                                                                        |
| Duration/revocation | One proof run; bypass/bearer/session revocation owner named                                                |
| Approval            | Required for remote authenticated completion and protected deployment access                               |
| Receipt             | Source/deployment/config identity, sanitized metadata, proof JSON, `observedAt`, limitation, and non-claim |

## Inputs and secret handling

The probe reads `BUNDJIL_CODEX_PROXY_PREVIEW_URL`,
`BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`, and optional
`BUNDJIL_CODEX_PROXY_VERCEL_BYPASS`. Load values through the approved secret
mechanism, not an inline command, environment dump, tracked file, or receipt.
Never retain full protected URLs, tokens, bypasses, prompts/output, raw SSE,
authorization codes/verifiers, profile/ciphertext, or provider logs containing
payloads.

## Procedure

1. Prove local source and route behavior:

   ```bash
   bun run --filter @bundjil/codex-proxy check-types
   bun run --filter @bundjil/codex-proxy test
   bun run --filter @bundjil/codex-proxy build
   ```

2. Read Vercel metadata for the exact project and candidate:

   ```bash
   vercel whoami
   vercel project inspect bundjil-codex-proxy --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel list bundjil-codex-proxy --environment preview --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel inspect "$PREVIEW_DEPLOYMENT_URL" --scope "$BUNDJIL_VERCEL_SCOPE"
   ```

   Stop unless the immutable deployment, Preview environment, source SHA,
   protection, config identity, and intended subject/store can be established.

3. Run `bun run --filter @bundjil/codex proof:stored-profile` only under
   approved read authority for the exact Preview subject/store. Record booleans
   only.

4. Attach the authority envelope, load the three probe inputs without printing
   them, and run:

   ```bash
   bun run --filter @bundjil/codex-proxy proof:preview
   ```

5. Require health `200`, `live`, ready, high reasoning; missing and invalid
   bearer `401`; authenticated `200` SSE with multiple data lines and `[DONE]`;
   requested Terra model; and no token, raw prompt, authorization-code, or
   verifier leak. A `{ "status": "blocked" }` result is inconclusive/failure,
   not a healthy Preview.

6. Re-read the immutable deployment metadata and record the exact candidate,
   proof JSON, exit status, `observedAt`, and limitations. Do not infer stable
   alias ownership, Production, logs, or source identity from the HTTP response
   alone.

## Evidence and postcondition

Retain source/deployment/config identity, sanitized Vercel readback, stored
profile booleans, authority receipt, probe JSON, `observedAt`, exit status,
limitations, and non-claims. HGI-305 owns a future richer packet; the current
blocked output intentionally lacks diagnostic detail and must not be upgraded
to a success claim.

## Rollback and revocation

This probe should not mutate provider configuration. Revoke the temporary
Vercel session/bypass and proxy bearer access according to their owners after
the run. If unexpected state appears, stop and use the
[incident runbook](incident-revocation.md); do not delete a deployment or
profile from this procedure.

## Stop and escalation

Stop on wrong project/environment/source, mutable alias instead of immutable
candidate, local/mock mode, missing stored profile, failed protection or auth
oracle, blocked proof, secret/payload leak, or any unapproved model call.
Escalate deployment/protection to Vercel, profile/auth to the Codex owner, and
proof output gaps to HGI-305.

## Readback fallback

Use authenticated Vercel project/deployment metadata for the exact candidate.
If unavailable, retain an `inconclusive` receipt and do not run the probe. A
Preview URL, source file, local header, historical plan, or old proof is not a
fallback; unavailable is never healthy.

## Maintenance

Review when Vercel Preview/protection, target identity, proxy route/auth/mode,
stored-profile proof, requested model/reasoning, probe assertions, or result
shape changes.
