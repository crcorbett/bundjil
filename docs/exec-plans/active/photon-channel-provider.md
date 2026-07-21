---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-channel-rollout-owner
created: 2026-07-21
last_reviewed: 2026-07-21
review_trigger: channel contract, provider boundary, task status, authority, proof, or rollback change
---

# Channel Providers And Photon Proof Implementation Plan

Status: Active

Spec: [`../../product-specs/photon-channel-provider.md`](../../product-specs/photon-channel-provider.md)

Task ledger: [`../../product-specs/photon-channel-provider.tasks.json`](../../product-specs/photon-channel-provider.tasks.json)

## Execution rule

Implement the task ledger serially. Each task receives focused verification,
the applicable three Effect risk lenses, full `bun run verification`, a diff
review, and one coherent commit before the next task begins. After all six
tasks reach a terminal accepted state, run a separate five-pass closeout audit:

1. ownership, imports, exports, and production/test/proof call graphs;
2. Effect, Schema, Config, Layer, error, resource, and helper quality;
3. contract, failure, concurrency, build, boundary, and regression coverage;
4. documentation, authority, operations, proof, continuity, and rollback;
5. adversarial legacy, secret, unsafe-boundary, drift, and unsupported-claim
   review.

The final five passes do not replace task-local acceptance. Any finding reopens
the owning task, is corrected, and is reverified before closeout.

## Baseline and Git identity

- Worktree: `/Users/cooper/.codex/worktrees/17b6/bundjil`.
- Branch: `codex/photon-channel-provider-spec`.
- Base commit before implementation: `b421a07570c39af99ab192687dc972c80094b268`.
- Initial tracked change: the proposed Channel SPEC, sibling task ledger, and
  product-SPEC index entry only.
- The branch began three commits behind `origin/main`; implementation does not
  rewrite or discard the user's existing work.
- The 2026-07-20 repository record identifies Production deployment
  `dpl_F4YP4B1keHZU6raPgBmtwbqSyqKb` as the last accepted clean Sendblue
  deployment and `dpl_AzkNzhmEYL78PGcFUont8gVSjN4Y` as the retained prior
  rollback candidate. These are dated repository evidence, not current Vercel
  readback.
- Git history and those immutable deployment references are the only rollback
  sources for the legacy implementation. No legacy source copy, compatibility
  decoder, state importer, or replay-key bridge will be created.

## Authority and environment boundaries

- The user explicitly authorised Photon CRUD for the internal project on
  2026-07-21. The ignored credentials are present only at
  `/Users/cooper/Projects/bundjil/.env.photon`; they may be sourced in place and
  must never be copied, printed, logged, committed, or retained in evidence.
- Photon authority covers project-scoped management-plane and runtime actions,
  including reversible webhook, platform, line, and test-resource operations.
- No authority has been granted for Vercel deployments, Vercel environment
  variables, Deployment Protection, DNS, Production, Sendblue, Upstash, or
  other provider mutation. The hosted Preview portion therefore stops before
  a Vercel action unless authority changes.
- Local tests use memory/fake Layers. Live Photon checks are opt-in, bounded,
  sanitised, and occur only after deterministic local conformance passes.
- No proof may retain secret values, request bodies, message text, full
  identities, webhook URLs, project/space/message/resource IDs, SDK objects,
  prompts, tool results, or model output.

## Intentional continuity break

The new path starts a new `ChannelStateV1`, replay namespace, routing
namespace, and environment namespace. It does not read or write the legacy
Sendblue snapshot, replay keys, continuation algorithm, typing lifecycle, or
`BUNDJIL_SENDBLUE_*` configuration. A later Production promotion requires a
separate SPEC and runbook that disable and drain ingress, wait through the
provider retry horizon, bind new secrets, cut over from a clean Git identity,
observe the new path, and quarantine rollback traffic so old deliveries cannot
enter the new replay namespace.

## Source owners and removal order

New owners:

- `packages/channel/**`: canonical direct-text Schemas, safe common errors,
  `ChannelTransport`, and deterministic memory Layer.
- `packages/sendblue/**`: fresh Sendblue wire contracts, authentication, HTTP
  transport, and live/memory `ChannelTransport` Layers.
- `packages/photon/**`: Photon webhook and SDK/API boundary, scoped runtime,
  safe errors, and live/memory `ChannelTransport` Layers.
- `apps/agent/agent/lib/channel/**`: app-only identity, routing, replay,
  orchestration, event/state Schemas, dispatch, and composition.
- `apps/agent/agent/channels/sendblue.ts`: the thin Eve framework adapter and
  single module-edge runtime.

Replacement/removal targets, used only as rejected-pattern and rollback
evidence:

- `apps/agent/agent/lib/sendblue/channel.ts`
- `apps/agent/agent/lib/sendblue/client.ts`
- `apps/agent/agent/lib/sendblue/config.ts`
- `apps/agent/agent/lib/sendblue/errors.ts`
- `apps/agent/agent/lib/sendblue/identity-directory.ts`
- `apps/agent/agent/lib/sendblue/replay-claim-id-generator.ts`
- `apps/agent/agent/lib/sendblue/replay-store.ts`
- `apps/agent/agent/lib/sendblue/runtime.ts`
- `apps/agent/agent/lib/sendblue/schemas.ts`
- `apps/agent/agent/lib/sendblue/session-router.ts`
- `apps/agent/agent/lib/sendblue/testing.ts`
- `apps/agent/agent/lib/sendblue/webhook-verifier.ts`
- the existing contents of `apps/agent/agent/channels/sendblue.ts`
- old implementation-structured `apps/agent/test/sendblue-*.test.ts` files.

Removal order:

1. prove the neutral package and clean app vertical slice using only memory
   Layers;
2. build the fresh Sendblue package and its contract tests;
3. rewrite the Eve edge and prove the new HTTP/event journey;
4. remove the old app-owned tree and tests;
5. prove no old import, config, state, replay, typing, callback, or runtime
   pattern remains;
6. build Photon, pass dual conformance, then run bounded authorised Photon
   checks.

## Canonical namespaces and exact boundary exceptions

- Config: `BUNDJIL_CHANNEL_SENDBLUE_*`, `BUNDJIL_CHANNEL_PHOTON_*`,
  `BUNDJIL_CHANNEL_REPLAY_*`, and `BUNDJIL_CHANNEL_ROUTING_*` only.
- Durable state: `ChannelStateV1` inside `ChannelAdapterState`.
- Replay: a new versioned prefix owned by app Config and
  `AtomicKeyValueStore.transact`; no physical legacy key is inspected.
- Raw `Request` may enter only `ChannelTransport.decodeWebhook` because HMAC
  verification requires exact bytes and headers.
- The Spectrum SDK instance, Space, callbacks, Zod types, Promises, and raw
  errors remain private to `@bundjil/photon`'s live Layer.
- Eve's framework state may receive one complete encoded snapshot assignment
  in the thin adapter. Domain services return immutable decoded values.
- Any primitive forced by a third-party signature is confined to its exact
  adapter symbol and admitted to `tooling/boundary-exceptions.ts` only after a
  focused negative fixture proves the exception cannot broaden.

## Consumer journeys to re-prove

These journeys come from the new SPEC and user-visible behavior, not from old
internal state/status/test structure:

- authenticated direct-text ingress is accepted once and dispatched once;
- unauthenticated, malformed, unsupported, self, empty, and duplicate ingress
  fail or no-op with the new documented HTTP semantics;
- one decoded app identity routes to one fresh continuation;
- one outbound text completion becomes provider `accepted`, never `delivered`;
- provider rejection is distinct from timeout/uncertain delivery;
- presence start/stop is stateless and returns accepted/no-op/failure;
- one immutable decoded state becomes one encoded Eve snapshot;
- concurrent duplicate claims are atomic;
- Sendblue and Photon pass the same nominal transport conformance suite;
- authorised Photon management/runtime checks retain only sanitised outcomes;
- Production and the sole Sendblue webhook remain unchanged.

## Task progress

| Task                                   | Status      | Acceptance receipt                                                                                            |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| Active plan and clean boundary         | Completed   | Plan, baseline, authority, owners, removal order, continuity break, full verification, and no provider action |
| Neutral Channel and app vertical slice | In progress | —                                                                                                             |
| Fresh Sendblue and rewritten Eve edge  | Pending     | —                                                                                                             |
| Photon and dual local conformance      | Pending     | —                                                                                                             |
| Isolated Photon Preview proof          | Pending     | Hosted Preview blocked without Vercel authority; provider-only proof may proceed                              |
| Docs reconciliation and promotion gate | Pending     | —                                                                                                             |

## Downstream-impact ledger

| Surface                           | Decision                                               | Owner and postcondition                                                                                   |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| SPEC/tasks/active plan/indexes    | Change required                                        | Current intent, status, evidence, decisions, and terminal limitations stay aligned                        |
| Root and app READMEs              | Change required when source lands                      | Public packages, app boundary, config names, commands, and routes match source without provider actuality |
| New package READMEs               | Change required                                        | Purpose, exports, operations, layers, config names, limitations, and commands are discoverable            |
| Repo/Eve architecture             | Change required                                        | Durable owners and production/test call graphs match the accepted clean implementation                    |
| Effect architecture               | Preserve unless a new enforceable rule emerges         | Existing rules already reject the known legacy patterns                                                   |
| Testing architecture              | Change required                                        | Add focused package commands, conformance, negative scans, and proof distinctions                         |
| Schemas/services/Layers/exports   | Change required                                        | Three packages and app-owned services use canonical Effect boundaries                                     |
| Manifests/lock/Turbo/Knip         | Change required                                        | Exact published Photon pins and all workspace tasks resolve without deep imports                          |
| Boundary exceptions/lint/CI       | Review; narrow change only if forced                   | No broad ignore or unproved primitive escape                                                              |
| Tests/fixtures                    | Change required                                        | New contract, concurrency, failure, state, adapter, and dual-provider journeys replace old tests          |
| Runbook/proof                     | Change required before live proof                      | Photon-only authority, stop conditions, rollback, sanitisation, and receipts are explicit                 |
| Monitoring                        | Change required at durable architecture/proof boundary | Safe status/count/latency/error-class observations only                                                   |
| Historical Sendblue docs/plans    | Preserve                                               | Immutable provenance remains non-authoritative for the replacement                                        |
| Research report                   | Preserve; cite where relevant                          | Supporting upstream evidence is not runtime acceptance                                                    |
| AGENTS/skills                     | Preserve unless routing becomes incomplete             | Current task map and skills already route provider/package work                                           |
| Frontend/browser/generated audits | N/A                                                    | No visible UI or generated documentation surface changes                                                  |
| Codex/store/eve public contracts  | Preserve                                               | Store is consumed through its existing public atomic service; no other public package contract changes    |

## Verification and evidence policy

Each task records focused commands plus:

```bash
bun run check:boundaries
bun run check:effect-setup
bun run check:skills
bun run verification
git diff --check
```

The ignored synthetic Executor configuration may be supplied only to make the
Eve build deterministic. It is not provider proof. Local tests prove code;
authorised Photon readback proves only the named provider observation; neither
proves Vercel Preview or Production. Full logs stay local and sanitised task
receipts contain only commands, exits, counts, safe tags, limitations, Git
identity, and recovery route.

## Rollback and stop conditions

- Before Production promotion: rollback is `git revert` of the task commit or
  abandonment of the branch. No live Production traffic changes.
- For reversible Photon resources: record the pre-operation resource class and
  count, use stable provider IDs only in process memory, read back the intended
  postcondition, delete only resources created by this rollout, and verify the
  prior count/topology is restored. A lost write response is an uncertain
  outcome and requires readback before retry.
- Stop on ambiguous line/Space selection, unverifiable signing semantics,
  leaked protected data, malformed SDK output, non-idempotent uncertain send,
  resource cleanup failure, provider drift outside the authorised project,
  missing rollback identity, or any request for Vercel/Production/Sendblue
  mutation without fresh authority.
