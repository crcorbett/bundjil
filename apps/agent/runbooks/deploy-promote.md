---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-08-10
review_trigger: Vercel project, deployment, environment, domain, protection, variable, function duration, Workflow, source, preflight, rollout-stage, rollback, proxy, agent, or Channel provider activation change
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
  scope. Verify the local link before every operation. Both Bundjil projects
  already own an app Root Directory, so link the repository root to the exact
  project for the current stage and deploy from that root; linking the app
  directory would apply the Root Directory twice. Treat `.vercel` as disposable
  local routing metadata, never provider truth, and remove any link-generated
  local environment file before continuing.
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
`BUNDJIL_CHANNEL_PHOTON_*` listed by `apps/agent/README.md`. It must also
include the positive semantic configuration
`BUNDJIL_CHANNEL_HANDOFF_TIMEOUT_MILLISECONDS`. All identity,
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
   vercel list bundjil-codex-proxy --environment production --scope "$BUNDJIL_VERCEL_SCOPE"
   vercel list bundjil-agent --environment production --scope "$BUNDJIL_VERCEL_SCOPE"
   ```

   Then link the repository root to one exact project at a time, read back
   `.vercel/project.json`, and run `vercel env ls production --cwd . --scope
   "$BUNDJIL_VERCEL_SCOPE"`. Relink and repeat for the second project. Do not
   reuse an app-local link or infer the project from the working-directory
   name. Remove any link-generated local environment file before proceeding.

   Inspect each candidate with `vercel inspect "$DEPLOYMENT_URL" --scope
"$BUNDJIL_VERCEL_SCOPE"`. Sanitize provider output into the snapshot; do not
   copy raw output into evergreen documentation.

3. For an Eve durability candidate, retain the locally generated Build Output
   as preflight, then inspect the immutable deployment's Resources/function
   detail. Record the source SHA, Eve version, route-to-function mapping,
   ordinary `__server` effective maximum duration, Workflow flow
   `maxDuration`, queue trigger, project default, Fluid setting, plan maximum,
   and `observedAt`. Also retain separately measured cold/warm new-session and
   resume acceptance plus model, tool, and provider latency distributions.
   Missing function detail, project setting, plan, candidate deployment, or
   measurement makes the packet inconclusive.

   Eve `0.29.5` directly creates Nitro and exposes no Bundjil-facing
   `vercel.functions` input. Preserve the generated Workflow flow's
   `maxDuration: "max"` and queue trigger. Do not use the Sandbox idle timeout
   as a function value, guess a `vercel.json` glob for generated `__server`,
   patch `.vercel/output`, or treat local Build Output as hosted readback. If
   an ordinary-function override becomes necessary, stop until a supported
   Eve/Nitro seam or separately pinned upstream change exists.

   For the Preview replay-proof stage, require the encrypted
   `EVE_TRACES_CONTENT=off` binding, the supported Eve-to-provider correlation
   contract, and the proxy-owned AtomicKeyValueStore receipt binding. Read back
   the exact team's accessible Agent Runs model/deployment/lifecycle/step/hook
   metadata and the sanitized receipt phase/ordinal. Record unavailable
   `$eve.*` Workflow tags as limitations. These are proof predicates only; they
   do not authorize a deployment or replace the protected agent/proxy request
   proof.

4. For the current stage, set `BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT` through
   the approved secret/environment mechanism and run:

   ```bash
   bun run --filter @bundjil/agent preflight:production
   ```

   Stop unless exit status is zero, the bounded receipt status is `passed`,
   `rejected` is empty, the printed stage matches the approved stage, its
   detail artifact readback matches the receipt digest, the snapshot is fresh,
   and the addressable approval still matches. Exit `2` is a blocked
   invariant; exit `1` is inconclusive. Neither authorizes mutation.

5. Enforce the stages in order; no later checkpoint substitutes for an earlier
   one:

   | Stage                             | Required postcondition before the next stage                                                                                                                                                                                                                      |
   | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `before-first-mutation`           | Both Production activations absent; clean pushed SHA; exact projects/protection; read-only inventory                                                                                                                                                              |
   | `proxy-provisioned`               | Proxy configured `live`; required metadata bindings; separate Preview/Production subject, namespace, cipher, profile, lock, and fence identity; encrypted stored-profile proof                                                                                    |
   | `proxy-accepted-agent-configured` | Accepted immutable proxy matches pushed SHA/config/stable alias; agent uses `codex-proxy`, Vercel OIDC, no anonymous/deployed-local fallback, and a separate bearer                                                                                               |
   | `agent-accepted-rollback-ready`   | Accepted immutable agent plus distinct current/previous deployment and config references for both apps                                                                                                                                                            |
   | `channel-inventory-ready`         | New-only Channel bindings present; legacy bindings/data absent; Preview/Production namespace fingerprints distinct; exact healthy Sendblue and stable one-callback Photon inventories                                                                             |
   | `channel-candidate-staged`        | One pushed immutable candidate serves both routes with domains skipped; stable alias remains on the recorded current deployment; Photon is either the accepted stable callback or an explicit original-plus-candidate parallel cutover with distinct fingerprints |
   | `channel-production-promotion`    | Candidate source/config/routes accepted; soak and rollback drill complete; Production activation remains false immediately before the approved promote; any parallel Photon cutover still preserves both exact callbacks                                          |

   The accepted proxy and current rollback agent retain their own observed
   source identities during the Channel stages. They are not required to match
   a later Channel candidate. `channel-candidate-staged` and
   `channel-production-promotion` instead require the candidate source to match
   the newly pushed SHA while preserving the distinct stable-alias rollback
   deployment.

6. **Mutation gate:** stop before deploy, promote, alias/environment change, or
   rollback until the complete stage-specific authority envelope is attached.
   Confirm both app-owned `vercel.json` files still decode
   `git.deploymentEnabled: false`; a Git push must trigger CI only and must not
   be used as candidate creation or promotion. Compare the exact project
   deployment inventories immediately before and after the pushed SHA and stop
   if either project gained a Git-triggered deployment.
   When granted, operate one app and one stage only. Link the repository root to
   the exact project, read back `.vercel/project.json`, and confirm its project
   ID matches the provider project. Because the provider applies the configured
   app Root Directory, the staged pattern from that linked root is
   `vercel deploy --prod --skip-domain --cwd . --scope
"$BUNDJIL_VERCEL_SCOPE"`, followed only after acceptance by `vercel promote
"$DEPLOYMENT_URL" --scope "$BUNDJIL_VERCEL_SCOPE"`. Stop if the CLI resolves a
   doubled app path, an unrequested project, or any project other than the
   read-backed target. Do not use `--yes` for deployment, inline secret flags,
   or an unreviewed prebuilt artifact.

7. Before promotion, execute the Sendblue and Photon runbooks against the
   immutable candidate URL. For the ordinary one-callback `Stable` topology,
   require signed ingress, replay suppression, Eve completion, outbound
   acceptance, typing start, typing stop, and scoped resource release for each
   provider. A provider-accepted result does not establish handset delivery or
   typing display.

   A write-only-secret `ParallelCutover` is different: Photon fans one project
   event to both callbacks, so a real pre-promotion message can race the
   last-known-good deployment and the candidate or produce two effects if their
   replay namespaces differ. Do not send that message or call a candidate
   duplicate a full journey. Before promotion require only an exact
   candidate-URL signed, identity-free unsupported-event probe, its closed
   ignored disposition, zero dispatch/outbound capability, and zero error or
   fatal logs.

   Fresh readback must also resolve each exact callback origin to an immutable
   deployment. If both callbacks use one provider-facing Vercel alias distinct
   from the stable domain, record that alias by safe fingerprint and its exact
   current deployment as rollback. Under an explicit exact-alias authority,
   assign only that callback alias to the candidate, then require both callback
   routes to resolve to the candidate while the stable alias remains on its
   recorded rollback deployment. Stop on a stale/mixed route or any other alias
   change. Do not send a real message in this window. The full Photon journey
   remains at the immediate post-promotion gate.

8. Immediately repeat the project/list/inspect readbacks, resolve the stable
   alias to the accepted immutable deployment, retain the passed pre-promotion
   preflight and record the post-promotion readback. Do not rerun that
   pre-mutation stage as a passing postcondition: promotion intentionally
   changes its stable-alias invariant. Bind boundary-matched HTTP, session,
   message, and Production results to the matching
   [`docs/verification`](../../../docs/verification/README.md) packet. Repeat
   both provider journeys through the stable domain and bind them to
   `BND-J12-dual-channel-production`; a deployment status alone is
   insufficient. During `ParallelCutover`, the one bounded Photon event must
   yield two signed callback observations on that exact deployment, one fresh
   accepted dispatch, one duplicate disposition, and exactly one external
   response. Any second dispatch/response, callback on another deployment,
   missing duplicate, or replay-namespace ambiguity triggers rollback. Only
   after that proof, the documented retry-horizon drain, and exact callback
   readback may the original callback be retired.

   A write-only Photon-secret recovery may legitimately carry two Production
   callbacks through the staged and promotion preflights: the exact original
   callback plus one distinct candidate callback. Encode that as the
   `ParallelCutover` topology with both safe fingerprints. A bare count of two,
   duplicate fingerprints, or a parallel topology at
   `channel-inventory-ready` fails closed. Retire the original callback only
   after promotion, signed provider traffic, retry-horizon drain, and exact
   surviving-callback readback.

## Evidence and postcondition

Retain the clean pushed SHA, CLI version and identity/scope, sanitized provider
readback with `observedAt`, snapshot digest, bounded preflight receipt and
detail digest, approval receipt,
immutable accepted/current/previous deployment and config fingerprints, alias
resolution, exact route/function duration and Workflow trigger readback,
measured acceptance/model/tool/provider distributions, exact stage,
postcondition, limitations, and non-claims. Do not
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

For a `ParallelCutover` with a distinct provider-facing callback alias, rollback
also restores only that exact alias to its recorded prior immutable deployment
and reads back both callback routes. Restoring the public stable alias alone is
not Photon rollback proof.

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
