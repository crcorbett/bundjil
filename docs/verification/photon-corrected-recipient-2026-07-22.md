---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-22T16:21:34Z
artifact_git_identity: ba159628cbf8dbd581079d73a6e503eda5ff855d
environment: photon-internal-project-local-provider-runtime
review_trigger: do not refresh; create a new dated receipt for a later observation
---

# Photon corrected-recipient outbound receipt — 2026-07-22

## Authority and target

The user approved one corrected Australian iMessage identity and named the
already-adopted UK identity as an alternative. The operation remained inside
the active Photon rollout authority: one exact Free managed-shared user create
and one bounded message attempt against the corrected Australian identity.
No Vercel, Production, Sendblue, Upstash, webhook, billing, dedicated-line,
DNS, contact, or unrelated provider action ran.

The ignored project credential file remained mode `0600`, exposed only the two
expected Photon variable names, and was loaded in place without printing or
copying values. The exact source passed the Photon typecheck and all 24 Photon
tests before provider access.

## Provider reconciliation

Authenticated readback first found one managed-shared user. It matched the
approved UK identity exactly and had an assigned routing number. Photon
reported the corrected Australian identity as available.

The bounded resource reconciler created the Australian user once and read back
one exact match with an assignment. The sanitized receipt reported service type
`shared`, iMessage enabled, zero dedicated lines, two final shared users, and
one existing webhook. A second authenticated readback found exactly one UK and
one Australian user, both assigned. Their protected stable-ID fingerprints are
`a78d3af6ca353134` and `020cc192c042e0f4` respectively; neither full ID nor
either phone or assigned routing number is retained here.

## Inconclusive outbound boundary

One local provider operation used Spectrum `12.2.0` under Bun `1.3.14`. It
created the direct Australian Space in memory, then attempted one bounded text
send. The SDK threw during `send` before returning a provider message identity.
No retry was issued, and the UK alternative was not attempted.

This is an uncertain send, not provider acceptance and not proof of failed or
successful handset delivery. The operator must obtain a handset observation or
provider-supported readback before another message attempt. Typing start/stop,
real webhook delivery, Eve completion, replay/duplicate behavior, and hosted
Preview or Production outbound behavior remain unproved.

## Direct API diagnosis

Photon's current management OpenAPI exposes project, service, platform, user,
line, profile, token, and webhook operations, but no HTTP message-send route.
The current [webhook event contract](https://photon.codes/docs/webhooks/events)
also states that outbound messages require a live Spectrum SDK connection.

A direct Basic-authenticated `POST` to the published iMessage token endpoint
succeeded and returned a non-empty, expiring `shared` token. Project and billing
status reads also succeeded; billing reported `in_sync` with no error, while
the optional project profile was absent. A separate Node `24.16.0` TLS probe
established an authorised HTTP/2 connection to Photon's published shared
iMessage host.

Using that freshly issued token through Photon's installed low-level iMessage
gRPC client, a read-only address-availability request failed with
`AuthenticationError`, gRPC status `7` (`PERMISSION_DENIED`), safe code
`internalError`, and `retryable: false`. Photon returned no provider source,
request ID, or safe context. No message or typing operation ran during this
diagnostic.

This proves the REST management/token plane and network path work while at
least one authenticated shared iMessage transport RPC is permission-denied.
It strongly localises the two Spectrum operation failures below Bundjil's
Effect adapter, but does not prove that the earlier send failures carried the
same gRPC status because their raw causes were intentionally discarded. The
availability RPC could also have a narrower entitlement than send. A Photon
transport readback or support-side trace is therefore required before calling
the provider itself conclusively faulty.

## State, rollback, and next boundary

The rollout-created Australian user remains present so an unresolved delivery
cannot be disrupted and so its exact stable identity remains available for
readback. The adopted UK user is preserved. Do not delete either by count,
list order, creation time, partial ID, or a phone value alone. If rollback is
later approved, match the Australian protected stable-ID fingerprint to a full
authenticated record, delete only that rollout-created ID, and require the
post-delete inventory to retain the adopted UK user.

The next owner is Photon support or a provider-visible trace keyed to the
project and observation time. A later send may use a Node runtime and opt-in
Photon messaging telemetry only after the current uncertain send is resolved
and a fresh one-run authority receipt is attached. Repository tests and this
receipt cannot establish current provider health or delivery.
