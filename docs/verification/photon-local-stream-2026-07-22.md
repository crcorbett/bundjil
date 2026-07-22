---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-22T21:05:49Z
artifact_git_identity: ba159628cbf8dbd581079d73a6e503eda5ff855d
environment: photon-internal-project-local-sdk-stream
review_trigger: do not refresh; create a new dated receipt for a later observation
---

# Photon local SDK-stream receipt — 2026-07-22

## Authority and scope

The user supplied the Photon end-to-end agent guide, approved Photon project
operations in the active rollout, and explicitly requested that the macOS
Messages application send the test messages. This qualification installed the
official Photon CLI locally, authenticated the existing account, performed
read-only project/resource inventory, started one bounded Spectrum SDK stream,
and sent two synthetic handset messages. It did not create, update, or delete a
Photon project, platform, user, line, webhook, secret, billing resource, Vercel
resource, Sendblue resource, DNS record, or repository credential.

The ignored credential file remained outside this worktree and was loaded
without printing values. The existing dirty documentation changes were
preserved. The proof used source identity
`ba159628cbf8dbd581079d73a6e503eda5ff855d`; it is not a claim about a pushed
or deployed artifact.

## Configuration and validation

The official Photon CLI was absent, so the operator installed current stable
`@photon-ai/cli` `2.0.0` from the package registry. `photon whoami` then
authenticated successfully to Photon's production dashboard. Structured
readback found one running Free project, iMessage enabled, two shared users
with assignments, and zero dedicated lines. No table-mode user output or
dedicated-line assumption was used.

Before starting the listener, `@bundjil/photon` passed its typecheck, all 24
tests, and build under Bun `1.3.14`. The bounded listener used the repository's
exact Spectrum `12.2.0` pins, one iMessage provider, telemetry disabled, and
one application lifecycle. It emitted only sanitized state transitions.

## Per-user routing observation

The Messages account's configured `Start new conversations from` identity
matched one exact registered Photon user. The first synthetic iMessage was
sent to the other registered user's assigned shared number. The handset marked
the iMessage delivered to that Photon line, but Photon returned an explicit
unrecognised-sender response and the Spectrum application received no inbound
event.

This negative observation establishes that assigned Free shared numbers are
per-user routes, not interchangeable project endpoints. It does not prove that
either user record or line was unhealthy.

## Successful local journey

The same registered Messages identity then sent one synthetic direct text to
its own assigned shared number. The running Spectrum application received one
inbound text event. It executed one `space.responding(...)` operation, returned
one reply result with a provider message identity, and then closed the SDK
cleanly through `app.stop()`.

The Messages conversation displayed the expected reply from the assigned
line. This separately proves, for this observation:

- the handset send reached the correct managed shared route;
- the local Spectrum stream received one inbound event;
- the provider accepted one reply and returned an identity;
- the SDK lifecycle released cleanly; and
- the handset displayed the reply.

`space.responding(...)` exercised the automatic typing lifecycle, but no
bounded observer captured a visible typing indicator. Visible typing therefore
remains unproved.

## Architecture conclusion and non-claims

Photon's generated `bun start` instruction is necessary for its local
SDK-stream example because that process consumes `app.messages`. It is one
application process for the project, not one process per user or assigned
line. Bundjil's accepted hosted architecture remains different: Photon owns
the managed connection and posts signed webhooks to the Vercel route, while a
scoped Spectrum instance performs outbound Space operations.

This receipt is not proof of Photon webhook delivery, signature verification,
Vercel Preview, Eve dispatch/completion, replay, duplicate suppression,
visible typing, Production, Sendblue, monitoring, or long-running process
supervision. The active Preview task remains open, and the two-user desired
topology still requires an explicit Production decision.

## Docs-maintainer impact ledger

| Surface                         | Decision        | Owner and result                                                                                                         |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Package README                  | Change required | `packages/photon/README.md` distinguishes local stream from hosted webhook mode and records per-user assignment routing. |
| Agent runbook                   | Change required | `apps/agent/runbooks/photon.md` owns the repeatable pairing, startup, stop, proof, and non-claim procedure.              |
| SPEC/tasks/active plan          | Change required | Current evidence records local success while leaving hosted Preview and Production gates open.                           |
| Verification router/evidence    | Change required | This dated receipt is addressable and bounded to the observed environment.                                               |
| Architecture and app README     | Preserve        | Existing hosted webhook topology remains correct; no durable app boundary changed.                                       |
| Schemas/services/Layers/exports | Preserve        | No code or public contract changed during this qualification.                                                            |
| API/generated references        | N/A             | No generated or API surface changed.                                                                                     |
| Skills, mirrors, AGENTS         | Preserve        | Existing routing correctly required the package, runbook, proof, and docs-maintainer owners.                             |
| Lint/config/CI/workflows        | N/A             | The CLI was installed globally; no repository command, configuration, or workflow changed.                               |

## Recovery and next owner

The listener terminated normally and retained no process. No provider resource
rollback is required. The local Photon CLI session is the only persistent local
state introduced and can be revoked with the official `photon logout` command
if the user later requests it. Do not delete either shared user based on this
receipt.

The next owner is the hosted Preview journey: send from the exact registered
identity to its own assigned number after confirming the Preview webhook and
secret binding, then require signed ingress, Eve completion,
provider-accepted reply, duplicate suppression, and separately observed typing.

## Sources

- [Photon CLI](https://github.com/photon-hq/cli)
- [Spectrum getting started](https://photon.codes/docs/spectrum-ts/getting-started)
- [Spectrum webhooks](https://photon.codes/docs/webhooks/overview)
- [Photon iMessage routing](https://photon.codes/docs/spectrum-ts/providers/imessage/connection-and-routing)
