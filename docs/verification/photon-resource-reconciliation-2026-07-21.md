---
document_type: proof-receipt
lifecycle: inconclusive
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-21T17:02:52Z
artifact_git_identity: 130cb896fda27d493da8d3789552c9cf3b72541b
environment: photon-internal-project-resource-reconciliation
review_trigger: do not refresh; current successor is docs/product-specs/photon-channel-provider.md
---

# Photon dedicated-line reconciliation attempt — 2026-07-21

## Observation

The user authorised Photon CRUD and the Production rollout. The operator
restricted the ignored Photon credential source from owner/world-readable mode
`0644` to owner-only mode `0600`, loaded it without emitting values, and ran
the Schema-encoded resource command from pushed commit
`130cb896fda27d493da8d3789552c9cf3b72541b`.

Authenticated readback reported only these sanitised facts:

- iMessage was enabled;
- the project had zero dedicated lines and zero webhooks;
- the subscription tier was Free with no active subscription; and
- dedicated-line creation was therefore ineligible.

Before subscription eligibility was added to the local preflight, one exact
line-create request was issued. It returned the command's safe blocked result.
The command did not retry. Immediate readback reported zero lines, and the
later subscription-aware readback again reported zero lines and zero webhooks.
No line, subscription quantity, prorated charge, or ambiguous provider
resource remained.

No project, webhook, line, Space, message, phone, identity, secret, URL,
subscription/customer identifier, amount, provider body, prompt, tool value,
or model output was retained.

## Source and proof boundary

Photon's current [management OpenAPI](https://spectrum.photon.codes/openapi/json)
documents `POST /projects/{projectId}/lines/` as Business-plan-only with a
prorated subscription consequence. It exposes authenticated subscription readback at
`GET /projects/{projectId}/billing/subscription`; it exposes no subscription
upgrade operation.

Repository tests prove the management decoder, active-Business eligibility
gate, inspect-only default, exact one-line adoption/create policy, no blind
create retry, safe receipt, and error boundary. Photon owns the live tier,
subscription, line, platform, and webhook facts at the readback time.

## Superseded conclusion and recovery

The original run concluded that an active Business subscription was required.
That conclusion was incorrect for Bundjil's use case. Current Photon pricing
identifies Free as managed-shared iMessage, and the management OpenAPI exposes
service-type readback, shared-user availability, idempotent shared-user create,
list, and delete operations. The current SPEC therefore requires service type
`shared`, one exact approved shared user, and zero dedicated lines. This receipt
remains useful only as proof that the attempted dedicated-line write was not
retried and left no provider or billing mutation.

Because the line prerequisite failed, the operator did not create a Preview
webhook, bind Photon secrets, deploy Vercel Preview, execute inbound/outbound or
typing operations, touch Sendblue or Upstash, stage Production, or promote a
domain. Those boundaries remain unproved and unchanged.

Successor: [Schema-driven Channels and Production promotion](../product-specs/photon-channel-provider.md).
