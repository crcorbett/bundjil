---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-agent-operator
observed_at: 2026-07-31T14:57:31Z
artifact_git_identity: 715c19fc2a1cdb62e1f168cef09e329fd297e708
environment: bundjil-agent-production
review_trigger: do not refresh; create a new dated receipt for a later artifact, provider journey, rollback, or environment
---

# Dual-Channel Production acceptance receipt — 2026-07-31

## Accepted boundary

The stable `bundjil-agent.vercel.app` alias resolves to READY Production
deployment fingerprint `6e31c487…`, built from exact source `53cbb77…` on
`codex/alchemy-vercel-photon-infrastructure`. Fresh root health returned `200`.
The public rollback deployment remains fingerprint `8a4202c3…`; the distinct
callback-alias rollback deployment remains `2cd0940b…`.

Photon and Sendblue were qualified as separate Channel routes on that same
immutable deployment. Their provider identities, webhooks, conversations,
messages, and receipts remain separate; neither journey is proof by proxy for
the other.

## Photon Production packet

The accepted Photon packet used sender fingerprint `82ac258d…`, source-user
fingerprint `020cc192…`, destination fingerprint `d4039779…`, and correlation
fingerprint `b4efa594…`. The candidate callback produced one
`202 acceptedForDispatch`; the obsolete callback produced one
`401 authenticationRejected` at `webhookId` before replay admission. One
workflow completed with provider-accepted typing start/stop and one Photon
send. Messages showed Delivered, Read, and one correlated reply. Both rollback
deployments received zero event-window traffic.

A fourteen-minute drain produced no late second effect. Under the exact
irreversible authority, only obsolete callback fingerprint `72cac9b5…` was
deleted. Candidate callback fingerprint `cfe12c3e…` is the sole surviving
Production callback. The obsolete callback's create-only signing secret is
unavailable, so exact restoration is impossible. Alchemy state then retired
only the obsolete callback row, recovered observation-first after an uncertain
receipt, and converged to 72 resources with plan plus two syncs all no-op.

## Sendblue Production packet

Fresh provider metadata retained one secret-bearing HTTPS `receive` webhook on
the stable Sendblue path, line fingerprint `6a6a862e…`, and account fingerprint
`18ecd39f…`. Metadata-only storage readback found one available integration
store attached to both exact Bundjil projects; no application data was read.

Computer Use inspected the exact conversation before sending. Recipient
fingerprint `6a6a862e…` matched the provider line and the composer explicitly
said iMessage. One bounded message with correlation fingerprint `037fa8fc…`
and content fingerprint `2e9e7603…` produced one outgoing iMessage container,
one Delivered marker, and exactly one Bundjil reply container.

Authenticated Sendblue readback through `2026-07-31T14:53:16.865Z` contained
exactly two event-window records:

- one inbound `RECEIVED` iMessage from `82ac258d…` to `6a6a862e…`, with no
  downgrade; and
- one outbound `DELIVERED` iMessage from `6a6a862e…` to `82ac258d…`, with no
  downgrade and content fingerprint `566b4ead…`.

The stable deployment recorded one Sendblue webhook
`202 acceptedForDispatch` and three successful Workflow requests, with no
second callback, duplicate, error, or fatal row. Exact Workflow run fingerprint
`3cd4fe35…` completed in 20 seconds with two completed `turnStep` phases and
one completed `sendTurnControlStep`.

The owned Channel callback contract awaits each lifecycle promise:
`turn.started` requests provider typing start, terminal visible
`message.completed` sends the response, and `turn.completed` requests typing
stop. The exact run completed all of those steps, and provider delivery
readback independently confirms the single outbound result. This establishes
provider-accepted typing start/stop at the exercised runtime boundary. The
handset typing indicator itself was not watched and remains unproved.

## Final readback and rollback state

At `2026-07-31T14:57:31.663Z`, the canonical Production inventory performed
two complete sequential reads and reproduced manifest digest `aa033024…`:
two exact Vercel projects, two Photon shared users, one Photon callback, zero
Photon lines, unchanged repeat-read, and zero provider writes. The stable alias
still resolved to deployment fingerprint `6e31c487…` at source `53cbb77…`.

No Sendblue or Photon user, line, billing plan, credential, project, callback,
webhook, deployment, domain, store, replay record, or environment binding was
mutated during the Sendblue journey or final readback. Production rollback
retains the two immutable Vercel rollback identities. The retired Photon
callback cannot be recreated exactly; any later callback replacement requires
new create-only custody and a fresh lossless cutover.

## Requirement-to-proof replay

| Material requirement        | Direct observable and expected postcondition                                                                           | Plausible false green rejected                                                                            | Focused evidence owner                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Stable execution identity   | Alias readback resolves READY deployment `6e31c487…` at source `53cbb77…`; root is `200`                               | Git branch head, a Preview deployment, root health alone, or alias assignment without deployment readback | Vercel deployment readback and stable-root request                                              |
| Independent routes          | Photon and Sendblue each produce their own exact ingress, workflow, provider and handset packet on the same deployment | One provider journey, an adjacent historical receipt, or aggregate deployment health                      | This receipt, BND-J12, provider/runtime packets                                                 |
| Sendblue ingress and replay | One exact inbound yields one `202 acceptedForDispatch`, one workflow and no second callback through drain              | Provider `RECEIVED`, handset reply, or aggregate `2xx` count without stable callback attribution          | Deployment-scoped logs and Sendblue message readback                                            |
| Sendblue outbound delivery  | Exactly one outbound record is `DELIVERED` iMessage with no downgrade and one handset reply container                  | Runtime completion, provider `SENT`, SMS, or a neighbouring conversation                                  | Sendblue API readback and Computer Use                                                          |
| Sendblue typing lifecycle   | Exact completed Workflow plus the awaited Channel event mapping establishes provider-accepted start and stop           | Local transport test alone, outbound delivery alone, or visible-typing claim without observation          | Workflow run `3cd4fe35…`, `apps/agent/agent/lib/channel/eve.ts`, focused Channel/Sendblue tests |
| Photon cutover disposition  | One candidate acceptance plus one obsolete-callback authentication rejection yields one effect and response            | Calling the pre-replay `401` a duplicate or substituting BND-J11's Preview duplicate proof                | Production Photon packet and candidate logs                                                     |
| No-op final topology        | Two sequential inventory reads match digest `aa033024…` with one callback and zero writes                              | Pre-message inventory, a single read, count-only selection, or inferred future state                      | Schema-valid final inventory receipt                                                            |
| Rollback and retention      | Vercel rollback identities remain; exact obsolete Photon callback restoration is explicitly impossible                 | Claiming Vercel metadata reconstructs write-only values or that an unavailable secret is retained         | Production runbook, cutover receipt and final inventory                                         |

## Repository verification

Focused `@bundjil/sendblue` typecheck plus 9 tests and `@bundjil/agent`
typecheck plus 66 tests passed. The exact receipt-bearing candidate then passed
Effect language-service setup; boundary, 273-file documentation, skill,
authority, control, verification-policy and HGI-307 gates; 90 tooling tests;
type-aware formatting/lint; the lint fixture; Knip; all nine workspace
typechecks; and all fifteen Turbo build/test tasks. The full run used only the
documented process-local synthetic Executor fixture and made no Executor
request.

## Docs-maintainer impact ledger

| Surface                                       | Decision        | Result                                                                                                                                                     |
| --------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and provider call graph          | Preserve        | Vercel Git owns deployment/promotion; Alchemy owns stable configuration/state; Sendblue and Photon retain separate Channel transports and provider Layers. |
| READMEs, exports and generated references     | Preserve        | No public package boundary, export, command, or generated reference changed.                                                                               |
| Runbooks and authority                        | Preserve        | Existing Production, Sendblue, Photon and deployment runbooks supplied the exact authority, stop, readback and rollback gates.                             |
| Verification journeys and proof               | Change required | BND-J12 and this dated receipt now bind both current Production provider packets without merging evidence classes.                                         |
| Skills, AGENTS, lint, config, commands and CI | Preserve        | No standing authority, skill, command, lint, config or automation admission changed.                                                                       |
| Schemas, services and Layers                  | Preserve        | No runtime boundary changed; the accepted Type/Encoded, Service and Layer graph remains the exercised owner.                                               |
| Tests and fixtures                            | Preserve        | Existing focused Channel and provider fixtures remain direct contract evidence; no provider output was replaced by a mock.                                 |
| SPEC, tasks and active plan                   | Change required | Production rollout closes only after both current journeys, final inventory and exact non-claims pass.                                                     |
| Secrets, receipts, rollout and rollback       | Change required | Raw evidence remains ignored mode `0600`; tracked evidence contains fingerprints and bounded metadata only.                                                |
| Lifecycle, archive and terminal audit         | Preserve        | Drift/CI/monitoring and whole-SPEC closeout remain active; the terminal five-pass audit has not run.                                                       |

## Non-claims

- Sendblue handset-visible typing was not observed.
- Provider acceptance and one successful journey do not prove future
  availability or permanent delivery reliability.
- The final inventory is point-in-time metadata, not a deployment, message, or
  handset receipt.
- No Production provider state was mutated during the Sendblue journey or
  final readback.
- The terminal whole-SPEC five-pass audit has not run.
