---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-21T23:12:14Z
artifact_git_identity: 855f71acd678873fdc7b65bafbc2709a4233bbea
environment: bundjil-agent-photon-preview
review_trigger: do not refresh; create a new dated receipt for a later observation
---

# Photon hosted Preview partial receipt — 2026-07-21

## Proved boundaries

The user authorised the active Photon/Vercel rollout. From the isolated
`codex/photon-channel-provider-spec` worktree, immutable Vercel deployment
`dpl_E5P3pYaEMXxWxfRzgDecrNspkpZo` reached `READY` with target `preview` from
the exact pushed source above. The dedicated non-Production Preview alias was
then assigned to that deployment.

Authenticated, sanitised readback established:

- Photon service type `shared`, iMessage enabled, one adopted shared user, zero
  dedicated lines, and one exact Preview webhook;
- the approved Upstash Marketplace resource connected to `bundjil-agent` only
  for Preview with encrypted `BUNDJIL_CHANNEL_REPLAY_KV_REST_API_*` bindings;
- no copied replay binding or unprefixed KV/Redis alias remained in Preview;
- the clean physical replay prefix was new and no Upstash key or data was read,
  copied, cleared, or changed;
- Vercel protection returned `302` without the task bypass and reached an
  application `404` with it; and
- the Photon route returned `401` for an unsigned POST and `204` for a valid
  HMAC-signed unsupported event. That accepted ignored event acquired no SDK,
  dispatched no Eve turn, wrote no replay claim, and sent no message.

The exact source passed Effect setup, boundaries, documentation, skills,
authority, controls, verification policy, formatting, lint, Knip, eight
workspace typechecks, 76 boundary/control tests, and 264 workspace tests before
deployment.

## Inconclusive messaging boundary

A bounded provider bootstrap used the sole adopted shared user in memory. Its
first attempt created/resolved the direct Space but stopped at provider
`typing-start` before any send. A second idempotent Space resolution attempted
the bounded bootstrap message first; the SDK threw during `send` and returned
no provider message identity or acceptance receipt. The operator did not retry
that uncertain send and did not attempt a later typing transition.

This receipt therefore proves neither accepted outbound delivery nor absence
of handset delivery. It also does not prove real Photon webhook delivery, Eve
completion, replay/duplicate behavior, cold-Space response, application
outbound acceptance, SDK release after an application response, or handset
typing display. A handset observation or provider-supported message readback
must resolve the uncertain send before another message attempt.

## State left intentionally active

The exact Preview webhook, task-scoped Vercel automation bypass, dedicated
Preview alias, encrypted environment bindings, and mode-`0600` local binding
artifacts remain active solely to preserve the approved proof path. They are
not Production resources and grant no standing authority. After the journey is
terminal, delete the exact Preview webhook, revoke only the task-created
bypass, remove local protected artifacts, and read back the resulting topology.

Production domains, Production environment, Sendblue provider state, Photon
billing/service type/shared user/platform, and Upstash data were not changed by
this Preview proof. No phone, assigned routing number, webhook URL, bypass,
secret, Space/message/resource ID, message content, request body, prompt, tool
result, or model output is retained here.
