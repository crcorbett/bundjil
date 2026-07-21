---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-21
review_trigger: Vercel project, deployment, environment, domain, protection, variable, source, preflight, rollout-stage, rollback, proxy, agent, or Channel provider activation change
---

# Deploy and promote the agent system

## Scope and non-claims

Use this runbook for the sequential Vercel rollout of the Codex proxy, agent,
and clean Sendblue plus Photon Channel routes. The repository command validates a sanitized
snapshot; it does not fetch Vercel state, deploy, promote, roll back, grant
authority, or establish Production. The deferred Eve live-state decision
remains in force until a fresh target-owned readback is retained.

## Preconditions

- Record a clean source revision with `git status --short`, `git rev-parse
HEAD`, and a readback of `origin/main`.
- Authenticate the intended Vercel principal and record its identity source and
  scope. Link each app directory only to its exact project.
- Record an addressable approval for one stage, target, source SHA, operation,
  duration, and rollback. The snapshot literal `operationAuthority:
"external-receipt-required"` is an explicit non-grant; attach the real
  approval receipt outside the local preflight.
- Use authenticated read-only Vercel metadata to identify project, environment,
  stable domain, Deployment Protection, variable names/types/targets, current
  immutable deployment/source/config, alias resolution, and prior rollback
  candidate. Never read or export variable values.
- Use a sanitized snapshot file outside the repository with mode `0600` and
  the exact Schema in
  [`agent/production-preflight.ts`](../agent/production-preflight.ts).

## Authority envelope

| Field               | Required value                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Identity            | Authenticated Vercel principal, team/scope, and human approver                                                     |
| Operation           | One read, staged deploy, promote, rollback, environment/alias change, or exact Channel provider activation         |
| Resource            | Exact `bundjil-codex-proxy` or `bundjil-agent` project and immutable deployment                                    |
| Environment         | Explicit Vercel Preview or Production target                                                                       |
| Duration/revocation | One stage; expiry and provider/session revocation owner recorded                                                   |
| Approval            | Addressable receipt matching operation, project, environment, source SHA, and deployment                           |
| Receipt             | Sanitized metadata snapshot, preflight JSON, immutable IDs, `observedAt`, postcondition, limitation, and non-claim |

## Inputs and secret handling

The preflight command reads only `BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT`.
Production agent metadata must include `BUNDJIL_AGENT_MODEL_PROVIDER`,
`BUNDJIL_CODEX_PROXY_BASE_URL`, `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`, every
app-owned `BUNDJIL_CHANNEL_ROUTING_*` and `BUNDJIL_CHANNEL_REPLAY_*` name, and
every provider name under `BUNDJIL_CHANNEL_SENDBLUE_*` and
`BUNDJIL_CHANNEL_PHOTON_*` listed by `apps/agent/README.md`. All identity,
line, credential, webhook, and protected routing values use sensitive
metadata; bounded semantic configuration uses encrypted or sensitive metadata.
Any `BUNDJIL_SENDBLUE_*` name is a legacy binding and blocks promotion.

Production proxy metadata must include
the names `BUNDJIL_CODEX_PROXY_MODE`, `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`,
`BUNDJIL_CODEX_PROFILE_ID`, `BUNDJIL_CODEX_CONNECTOR_ID`,
`BUNDJIL_CODEX_INSTALLATION_ID`, `BUNDJIL_CODEX_SUBJECT_ID`,
`BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY`,
`BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID`,
exactly one of `UPSTASH_REDIS_REST_URL` or `KV_REST_API_URL`, exactly one of
`UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_TOKEN`, and
`BUNDJIL_UPSTASH_REDIS_KEY_PREFIX`, with the target and allowed Vercel type.
Both aliases in one proxy group are ambiguous and fail closed. Channel replay
uses only the Vercel Marketplace connection-owned
`BUNDJIL_CHANNEL_REPLAY_KV_REST_API_URL` and
`BUNDJIL_CHANNEL_REPLAY_KV_REST_API_TOKEN`. Connect the approved Upstash
resource with the exact `BUNDJIL_CHANNEL_REPLAY_` prefix; do not copy an
unprefixed alias or a sensitive-value placeholder from `vercel env pull`.

Record opaque fingerprints and IDs only. Never retain values, access tokens,
profile contents/ciphertext, phone identities, bypass URLs, raw environment
exports, provider logs containing payloads, or `.vercel`/environment files.

## Procedure

1. Confirm source and CLI identity:

   ```bash
   git status --short --branch
   git rev-parse HEAD
   git ls-remote --exit-code origin refs/heads/main
   vercel --version
   vercel whoami
   ```

2. Read project and environment metadata without values:

   ```bash
   vercel project inspect bundjil-codex-proxy --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel project inspect bundjil-agent --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel env ls production --cwd apps/codex-proxy --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel env ls production --cwd apps/agent --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel list bundjil-codex-proxy --environment production --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel list bundjil-agent --environment production --scope "$BUNDJIL_VERCEL_SCOPE"
   ```

   Inspect each candidate with `vercel inspect "$DEPLOYMENT_URL" --scope
"$BUNDJIL_VERCEL_SCOPE"`. Sanitize provider output into the snapshot; do not
   copy raw output into evergreen documentation.

3. For the current stage, set `BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT` through
   the approved secret/environment mechanism and run:

   ```bash
   bun run --filter @bundjil/agent preflight:production
   ```

   Stop unless exit status is zero, the bounded receipt status is `passed`,
   `rejected` is empty, the printed stage matches the approved stage, its
   detail artifact readback matches the receipt digest, the snapshot is fresh,
   and the addressable approval still matches. Exit `2` is a blocked
   invariant; exit `1` is inconclusive. Neither authorizes mutation.

4. Enforce the stages in order; no later checkpoint substitutes for an earlier
   one:

   | Stage                             | Required postcondition before the next stage                                                                                                                                   |
   | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `before-first-mutation`           | Both Production activations absent; clean pushed SHA; exact projects/protection; read-only inventory                                                                           |
   | `proxy-provisioned`               | Proxy configured `live`; required metadata bindings; separate Preview/Production subject, namespace, cipher, profile, lock, and fence identity; encrypted stored-profile proof |
   | `proxy-accepted-agent-configured` | Accepted immutable proxy matches pushed SHA/config/stable alias; agent uses `codex-proxy`, Vercel OIDC, no anonymous/deployed-local fallback, and a separate bearer            |
   | `agent-accepted-rollback-ready`   | Accepted immutable agent plus distinct current/previous deployment and config references for both apps                                                                         |
   | `channel-inventory-ready`         | New-only Channel bindings present; legacy bindings/data absent; Preview/Production namespace fingerprints distinct; exact healthy Sendblue and Photon inventories              |
   | `channel-candidate-staged`        | One pushed immutable candidate serves both routes with domains skipped; stable alias remains on the recorded current deployment                                                |
   | `channel-production-promotion`    | Candidate source/config/routes accepted; soak and rollback drill complete; Production activation remains false immediately before the approved promote                         |

5. **Mutation gate:** stop before deploy, promote, alias/environment change, or
   rollback until the complete stage-specific authority envelope is attached.
   When granted, operate one app and one stage only. Vercel's staged pattern is
   `vercel deploy --prod --skip-domain --cwd <app> --scope
"$BUNDJIL_VERCEL_SCOPE"`, followed only after acceptance by `vercel promote
"$DEPLOYMENT_URL" --scope "$BUNDJIL_VERCEL_SCOPE"`. Do not use `--yes`,
   inline secret flags, or an unreviewed prebuilt artifact.

6. Before promotion, execute the Sendblue and Photon runbooks against the
   immutable candidate URL. Require signed ingress, replay suppression, Eve
   completion, outbound acceptance, typing start, typing stop, and scoped
   resource release for each provider. A provider-accepted result does not
   establish handset delivery or typing display.

7. Immediately repeat the project/list/inspect readbacks, resolve the stable
   alias to the accepted immutable deployment, rerun the matching preflight,
   and record the postcondition. Bind boundary-matched HTTP, session, message,
   and Production results to the matching
   [`docs/verification`](../../../docs/verification/README.md) packet. Repeat
   both provider journeys through the stable domain and bind them to
   `BND-J12-dual-channel-production`; a deployment status alone is
   insufficient.

## Evidence and postcondition

Retain the clean pushed SHA, CLI version and identity/scope, sanitized provider
readback with `observedAt`, snapshot digest, bounded preflight receipt and
detail digest, approval receipt,
immutable accepted/current/previous deployment and config fingerprints, alias
resolution, exact stage, postcondition, limitations, and non-claims. Do not
retain raw provider output containing secrets or payloads.

## Rollback and revocation

Rollback requires a fresh readback proving the current deployment/config still
matches the accepted `current` reference and the previous reference is
distinct. Under separate authority, use `vercel rollback
"$PREVIOUS_DEPLOYMENT" --scope "$BUNDJIL_VERCEL_SCOPE"`, then re-read project,
deployment, alias, variable metadata, and app proof. Coordinate proxy and agent
configuration; preserve the newest fenced OAuth profile generation. Before
restoring agent traffic, disable both provider ingresses, drain their retry
horizons, and quarantine the new replay namespace so delayed deliveries cannot
cross the intentional continuity break. Never reintroduce legacy source,
environment names, state, or replay readers. Revoke the Vercel session/token
separately when required.

## Stop and escalation

Stop on any rejected preflight check, dirty/unpushed/mismatched SHA, wrong
scope/project/environment, stale/unavailable provider readback, shared
Preview/Production identity or bearer, missing metadata binding, alias drift,
missing rollback candidate, unavailable approval, secret leak, or unexpected
Production activation. Escalate Vercel state to the project owner, Codex
profile/proxy issues to the proxy operator, Sendblue or Photon issues to their
provider owner, and authority/workflow gaps to the authority register owner.

## Readback fallback

The fallback is authenticated Vercel project/deployment/environment metadata
for the exact target. If the preferred connector or CLI cannot establish it,
retain an `inconclusive` receipt and stop. Local source, `.vercel` files,
historical deployment prose, a build, GitHub status, or an old receipt is not a
fallback; unavailable is never healthy.

## Maintenance

Review when Vercel CLI/API, project linkage, domains, protection, variable
types, build/deploy behavior, the preflight Schema, rollout stages, app
composition, or rollback strategy changes.
