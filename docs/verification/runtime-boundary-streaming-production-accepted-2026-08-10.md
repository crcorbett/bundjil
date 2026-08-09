---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-agent-operator
observed_at: 2026-08-09T22:57:01Z
artifact_git_identity: 6cc0936d502a7b5f0fa32994929fac7f396eb200
environment: bundjil-agent-and-codex-proxy-production
review_trigger: do not refresh; create a new dated receipt for a later artifact, provider journey, rollback, or environment
---

# Runtime boundary and streaming Production acceptance — 2026-08-10

## Accepted boundary

Exact pushed source `6cc0936d502a7b5f0fa32994929fac7f396eb200`
passed GitHub CI run `31321575702`. Pre/post-push Personal-scope Vercel
inventories contained no deployment at that source until the two explicit
foreground deployments below, proving that the push itself did not create a
Vercel deployment. Infrastructure Drift run `31321575704` failed before its
script ran because its three repository secrets were unset; it is an external
workflow-configuration limitation, not a passing drift result or a source
failure.

The stable proxy and Agent aliases now resolve to READY Production deployments
built from that exact source:

| Target                | Accepted deployment                | Immutable URL                                                       | Config fingerprint                                                 |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `bundjil-codex-proxy` | `dpl_AunVp2kRvSnuB1FsGoKUGYQMcQm4` | `bundjil-codex-proxy-7shhn0f34-cooper-corbetts-projects.vercel.app` | `181fdd9b0b2dfe5265dfe1f5567c8ec9de8698bf89c76cbb59441f2cc1bcf83a` |
| `bundjil-agent`       | `dpl_C7xHMKGmR5KwAC7oq1xEvEKMRAaA` | `bundjil-agent-894lfeaal-cooper-corbetts-projects.vercel.app`       | `485aebefb2ae4bb9e86b48acea422506080e4fc567699a2e2e0902efccc968a2` |

Fresh alias readback at the receipt epoch resolved
`bundjil-codex-proxy.vercel.app` to the proxy deployment and
`bundjil-agent.vercel.app` to the Agent deployment. Both were `READY` with
Production target. Stable proxy health was `200`, `live`, reasoning effort
`low`; stable Agent Eve health was `200` and `ready`.

## Profile and configuration custody

The bounded OAuth operation selected the Personal account, not Tilt Legal, and
stored profile `prod-rbs-6cc0936` under a dedicated prefix and cipher-key ID.
The stored-profile proof returned found, envelope-v2, ciphertext-present,
subscription, refresh-capable, expiry-valid and no-reauthentication predicates,
with marker leakage false. The callback browser tab was closed immediately.
Computer Use exposed the loopback callback once in internal action output, so
this receipt does not claim it was never displayed; no callback material was
written to repository files, diffs, commits, retained receipts, or this packet.

Only approved Vercel secret stores retain the effective Production key and
bearer. Their safe fingerprints are `af7dbdde6ffb8446315a8a1950e2d5d8d02bf7bfdae4b58b08c617440c3ded8b`
and `02b5c9c9298948fc5c102ed5977960b5beecf4ebacc3a4eed9012f86a6c312d1`.
The two mode-`0600` temporary local credential copies were removed after live
proof and their exact paths read back absent.

Production configuration mutations were bounded and read back:

- Agent added encrypted `BUNDJIL_CHANNEL_HANDOFF_TIMEOUT_MILLISECONDS`; its
  decoded positive value matched the runbook contract. Exact-key removal is
  rollback.
- Proxy changed `BUNDJIL_UPSTASH_REDIS_KEY_PREFIX` from plain to encrypted
  without changing its bounded value, then removed the ambiguous Production
  `KV_REST_API_*` alias family. Production retains exactly the runtime-owned
  `UPSTASH_REDIS_REST_*` family. Preview-only `KV_REST_API_*` records were
  unintentionally removed with that family and immediately restored from
  their exact prior values; readback again found them only on Preview with
  matching safe fingerprints. The inverse metadata conversion plus exact
  alias restoration is rollback.
- Proxy received the dedicated profile metadata, cipher key and rotated
  internal bearer; Agent received the matching bearer and canonical stable
  proxy base URL. Readback used names, targets, types and opaque fingerprints,
  never retained values.

## Immutable proxy proof

The accepted immutable proxy returned healthy live metadata, `401` without a
bearer, and `401` with an invalid bearer. One authenticated request returned
`200` `text/event-stream`, three data lines, two decoded JSON frames, one
content fragment and one terminal `[DONE]`. First output preceded completion;
the stable-alias replay measured start-transfer at `1.292039` seconds and total
completion at `1.790720` seconds. Token, OAuth, raw-provider and error-frame
leak predicates were false.

An earlier current-source candidate was deliberately not retained after it
returned `codex_reauthentication_required` under the rotated bearer. The OAuth
grant and stored-profile proof repaired that exact boundary before the accepted
candidate was built and promoted. A still earlier candidate at source
`924d9fb…` was superseded before bearer rotation and is not current proof.

## Immutable Agent proof

The accepted immutable Agent exposed the expected Eve build functions and both
public Channel routes. A project-scoped, short-lived Vercel OIDC token created
one `202` session. Its first stream read contained exactly nine terminal-success
events: one each of message received/appended/completed, session
started/completed, step started/completed and turn started/completed. No failed
or waiting event, token/OAuth leak, or retained raw payload appeared. The stable
alias repeated the same nine-event completion after promotion. Short-lived OIDC
files were deleted after each probe.

## Sendblue Production journey

Fresh Personal Sendblue readback found one secret-bearing HTTPS `receive`
webhook targeting the stable Agent route, line fingerprint
`6a6a862e44d7968617f7ef46413ce71851c8c134f8c65d26ea8201f4319b25b9`,
and no outbound or typing webhook. Computer Use selected only the established
Bundjil iMessage conversation; no phone identity is retained here.

One bounded request with content fingerprint
`081d7cd41aa3f26607e74cc6ec2cc5fabf74f8737bb2774970ba1ca6664da716`
was handset-marked Delivered. Current Sendblue API readback returned exactly
two joined records in the event window:

- inbound handle fingerprint `b6259bb1e3919696ce8645b6b36a65a15253823c9afdf2b4e5cafaabae243270`
  was `RECEIVED` iMessage at `2026-08-09T22:49:21.025Z`; and
- outbound handle fingerprint `4807dd54583be0e9727fa30ffc4bd7b12a003a0add26ca42be202f2b0cfa29ba`
  was `DELIVERED` iMessage in the same conversation at
  `2026-08-09T22:49:39.982Z` with expected-response fingerprint
  `f82404be6445ef57b670b87a4ee1a885613b7f71a091cc37a944fd9102eaaf5a`.

The Bundjil reply was independently visible on the handset. After a fresh
same-conversation readback, one transient typing `start` and one `stop` request
each returned HTTP `200`, provider status `SENT`, matching target, and no error.
This proves provider acceptance of both transitions, not that the animated
indicator was observed on the handset.

## Photon limitation

No Photon write or test message occurred. The installed Photon CLI `2.0.0`
reports that its `production` session has expired. The completed source
investigation found no supported provider delivery-attempt history, replay
trigger, or candidate-specific Eve join. Historical inventory is therefore not
promoted into current proof, the `channel-inventory-ready` preflight is not run
retrospectively, and Photon dispatch, typing, delivery and strict replay remain
explicit non-claims. This external evidence limit does not weaken the separate
Sendblue result or reopen an implementation defect.

## Rollback and operational incidents

The accepted `agent-accepted-rollback-ready` snapshot passed with empty
rejections and detail digest
`34cfe688ede2dc66bc7cf51754c7f1d2c3f3a73740d50a05ff07fd856dc28000`.
The exact prior READY rollback deployments remain:

| Target | Prior deployment                   | Immutable URL                                                       | Config fingerprint                                                 |
| ------ | ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Proxy  | `dpl_5kbRiDzbGkdRYMcsSCJidZkJ3njB` | `bundjil-codex-proxy-n2fnd6jgc-cooper-corbetts-projects.vercel.app` | `7da09ac4f395024cc033dd1b8f66afb39db907d65db192bc7f3bc2b1ae35c447` |
| Agent  | `dpl_ewqr5pW1RBZZz54j6auxKuYecu93` | `bundjil-agent-dsb27gbey-cooper-corbetts-projects.vercel.app`       | `1e4cb0945527a0fa08275d000170d64bc0a78f35e97906bcc22b5ae2038b7503` |

Rollback requires fresh alias/config readback before promoting those immutable
deployments. The prior Agent bearer/config is not compatible with the rotated
accepted proxy without also applying the recorded exact configuration
rollback; do not move one alias in isolation.

Three false-starts were contained without widening scope:

- A stale local Vercel link targeted a previously deleted project. Exact link
  readback stopped the operation; the root was relinked to the intended project
  and generated local environment files were removed.
- One accidental empty `codex-proxy` project and its failed deployment were
  created from an unlinked working directory. The empty project was deleted
  immediately and provider readback confirmed it absent.
- The former runbook command combined an app-local `--cwd` with the same
  provider Root Directory. Vercel refused the doubled nonexistent path before
  upload. The runbook now links the repository root to one exact project and
  deploys from `--cwd .` so the provider Root Directory is applied once.

There was a bounded compatibility interval after proxy promotion and before
Agent promotion in which the old Agent still held the old bearer. No live
failure was observed or claimed in that interval. The Agent promotion closed
it, and the stable post-promotion probes plus Sendblue journey are newer.

## Docs-maintainer impact ledger

| Surface                            | Decision        | Result                                                                                                                 |
| ---------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Architecture and package ownership | Preserve        | The accepted Effect service, Layer, Channel and package call graphs are unchanged by hosted operations.                |
| READMEs and public commands        | Preserve        | No app/package public boundary or command changed.                                                                     |
| Deployment runbook                 | Change required | Correct the Vercel Root Directory/link/`--cwd .` sequence and retain exact stop conditions.                            |
| Verification journeys and packets  | Change required | This dated packet owns exact-source deployment, proxy, Agent, Sendblue, rollback and non-claim evidence.               |
| Authority and automation registers | Preserve        | Existing task-scoped authority and manual-only deployment policy governed the operations; no standing grant was added. |
| SPEC, tasks and plan               | Change required | Close the hosted task only with this packet and keep Photon/Drift limits explicit.                                     |
| Secrets and rollback               | Change required | Record sanitized fingerprints, provider readback, temp-file cleanup and coupled rollback identities only.              |
| Tests and fixtures                 | Preserve        | Repository fixtures remain direct contract evidence; no live result is replaced by a mock.                             |
| Lifecycle and terminal audit       | Preserve        | The terminal five-pass audit must run after this packet and any documentation correction.                              |

## Non-claims

- Photon current inventory, dispatch, typing, handset delivery and strict
  candidate-specific replay are unproved.
- Sendblue handset-visible typing was not watched.
- Vercel `READY`, a green CI run, provider acceptance and handset delivery are
  separate observations; none substitutes for another.
- Infrastructure Drift did not run its source-controlled checks because its
  repository secrets are unset.
- This point-in-time packet does not prove future availability or reliability.
- The terminal whole-SPEC five-pass audit had not run at this packet epoch.
