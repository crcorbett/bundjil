---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-channel-rollout-owner
created: 2026-07-21
last_reviewed: 2026-07-21
review_trigger: channel contract, provider boundary, task status, authority, proof, or rollback change
---

# Channel Providers And Production Promotion Plan

Status: Active — Production promotion phase

Spec: [`../../product-specs/photon-channel-provider.md`](../../product-specs/photon-channel-provider.md)

Task ledger: [`../../product-specs/photon-channel-provider.tasks.json`](../../product-specs/photon-channel-provider.tasks.json)

## Execution rule

The first six implementation tasks and their original closeout audit are
complete. Implement the six appended Production tasks serially. Each task
receives focused verification, the applicable three Effect risk lenses, full
`bun run verification`, a diff review, and one coherent commit before the next
task begins. After every promotion task reaches a terminal accepted state, run
the separate five-pass closeout audit:

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
- The user directly approved this full Production rollout and all Photon CRUD,
  including number-line operations, in the current Codex thread on 2026-07-21.
  The approval covers only exact runbook-governed Vercel agent deployment and
  environment operations, Photon project/platform/line/webhook operations,
  reconciliation of the existing Sendblue line/webhook, fresh Upstash
  namespace binding, bounded dual-provider journeys, and their rollback.
- Every mutation remains stage-bounded by authenticated readback, clean pushed
  source, a matching authority envelope, previous-state identity, sanitized
  receipt, and immediate postcondition. The approval is not standing authority
  for unrelated resources, accounts, billing policy, DNS, contacts, messages,
  or future operations.
- Local tests use memory/fake Layers. Live Photon checks are opt-in, bounded,
  sanitised, and occur only after deterministic local conformance passes.
- No proof may retain secret values, request bodies, message text, full
  identities, webhook URLs, project/space/message/resource IDs, SDK objects,
  prompts, tool results, or model output.

## Production promotion phase

The promotion sequence is fixed:

1. amend the canonical SPEC/tasks/plan and current routers;
2. extend the Schema-driven preflight, authority, runbook, journey, and proof
   contracts;
3. reconcile Photon platform/line/webhook state and prove a hosted Preview;
4. reconcile Sendblue/Upstash metadata, bind only fresh
   `BUNDJIL_CHANNEL_*` Production configuration, and deploy with domains
   skipped;
5. prove both providers on the immutable candidate, promote the stable domain,
   then repeat Sendblue and Photon ingress/send/replay/typing journeys; and
6. reconcile durable truth and run the final five-pass audit.

Production must serve both clean routes. No task selects one provider as a
fallback for the other. Sendblue and Photon retain independent provider
credentials, webhook verification, transport Layers, and provider proof;
identity, routing, replay, dispatch, and Eve orchestration remain app-owned.

Photon resource reconciliation lists first and adopts one healthy dedicated
iMessage line if exactly one approved candidate exists. Otherwise it creates
one line once, records the documented prorated subscription consequence, and
never retries an ambiguous create before stable-ID inventory reconciliation.
Webhook registration follows the same list-before-create rule; its signing
secret is write-only and must flow directly into the target secret binding.

Typing proof is mandatory for both providers. Photon uses the pinned Spectrum
Space `startTyping` and `stopTyping` operations. Sendblue uses the documented
typing endpoint with explicit `start`/`stop`; a `stop` against no active
indicator is an accepted no-op. Provider acceptance never proves the handset
displayed the indicator, so any device observation is a separate receipt.

## Intentional continuity break

The new path starts a new `ChannelStateV1`, replay namespace, routing
namespace, and environment namespace. It does not read or write the legacy
Sendblue snapshot, replay keys, continuation algorithm, typing lifecycle, or
`BUNDJIL_SENDBLUE_*` configuration. This Production phase disables and drains
ingress, waits through each provider's bounded retry horizon, binds new
secrets, cuts over from a clean Git identity, observes the new path, and
quarantines rollback traffic so old deliveries cannot enter the new replay
namespace.

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
- Spectrum `12.2.0` has one exact declaration defect under
  `exactOptionalPropertyTypes`: its iMessage definition omits optional
  `events`, while core's `AnyPlatformDef` constraint rejects that omission.
  The adjacent `@ts-expect-error` on the `providers` property is the sole
  owned type-boundary exception; package and consuming-app typechecks remain
  strict.
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
- staged and stable-domain journeys prove both providers without treating
  provider acceptance as handset delivery;
- Photon and Sendblue typing start/stop outcomes are proved independently; and
- current/previous deployment plus provider resource identities remain
  rollback-ready without a legacy runtime bridge.

## Task progress

| Task                                   | Status    | Acceptance receipt                                                                                                                                                                                 |
| -------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active plan and clean boundary         | Completed | Plan, baseline, authority, owners, removal order, continuity break, full verification, and no provider action                                                                                      |
| Neutral Channel and app vertical slice | Completed | Canonical package plus clean memory journey; focused and full gates passed with no provider action                                                                                                 |
| Fresh Sendblue and rewritten Eve edge  | Completed | New package/config/runtime/edge accepted; old tree removed; 39 app and 8 provider tests plus full gate passed                                                                                      |
| Photon and dual local conformance      | Completed | Exact Spectrum 12.2.0 pins, signed direct webhook adapter, scoped SDK boundary, dual contract/app journeys, both built routes, 229 tests, and full gate passed locally                             |
| Isolated Photon Preview proof          | Completed | Provider-only CRUD and SDK lifecycle passed with restored zero-webhook topology; hosted Preview stopped on absent Vercel authority/live Space, and the `0644` credential file is a future-run stop |
| Docs reconciliation and promotion gate | Completed | Canonical architecture and public maps reconciled; provider-only proof routed; Production selection remains a separate SPEC boundary                                                               |

### Promotion task progress

| Task                               | Status    | Acceptance receipt                                                                                                                                 |
| ---------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reopen SPEC and plan               | Completed | PRD review and writer phases specified all promotion owners and gates; every repository check passed with no live mutation                         |
| Build promotion contracts          | Completed | Dual-provider preflight, authority, proof/runbook, line/platform management, 12 journeys, 236 tests, and full gate passed                          |
| Reconcile Photon and prove Preview | Stopped   | Authenticated readback proved Free tier, active iMessage, zero lines/webhooks; one rejected create left zero lines; no Preview deployment followed |
| Stage dual-provider Production     | Pending   | —                                                                                                                                                  |
| Promote and prove Production       | Pending   | —                                                                                                                                                  |
| Reconcile docs and final audit     | Pending   | —                                                                                                                                                  |

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

## Current external stop

Task 3 reached a target-specific terminal stop on 2026-07-21. The ignored
credential source was restricted from mode `0644` to `0600`. Authenticated
Photon readback then proved iMessage enabled, zero dedicated lines, zero
webhooks, Free tier, no active subscription, and line-creation ineligibility.
One line-create request was rejected; immediate and later readback both proved
zero lines, so no ambiguous provider resource or billing mutation remains.

Photon's current OpenAPI describes dedicated line creation as Business-plan
only and exposes subscription readback but no subscription-upgrade operation.
The user must activate an eligible Business subscription in Photon before this
task can be reopened. No Preview webhook, Vercel binding/deployment, message,
typing operation, Sendblue change, Upstash change, or Production operation
followed the stop. See the dated
[`Photon resource reconciliation receipt`](../../verification/photon-resource-reconciliation-2026-07-21.md).

### Task 6 docs-maintainer accounting

- **Changed:** root README; agent README; docs/architecture/research routers;
  repo-structure, Eve-agent, testing, and Effect architecture metadata;
  research status pointer; AGENTS routes; SPEC/task/index and plan/index
  lifecycle records. These owners now route the clean packages, app services,
  config/state/replay boundaries, local/provider proof levels, and later
  Production SPEC boundary.
- **Preserved after review:** `@bundjil/channel`, `@bundjil/sendblue`, and
  `@bundjil/photon` READMEs already match their accepted exports, commands, and
  limitations; Photon runbook and dated receipt already match Task 5; Codex,
  Eve, store, codex-proxy, frontend, and unrelated package/app READMEs have no
  changed public contract.
- **Historical/reference:** completed Sendblue SPECs/plans, legacy atlas, and
  generated HGI-300 receipts remain immutable provenance. The Alchemy report
  remains `reference`/`supporting`; only a post-research pointer was added so
  its research-time call graph cannot be mistaken for current architecture.
- **N/A:** frontend/browser proof, public/generated API references, changelog,
  Changeset, release note, data migration, package publication, and deployment
  evidence. No UI, released API, provider selection, deployment, or Production
  state changed.
- **Operations and proof:** only the Photon provider lifecycle has a canonical
  target runbook and dated receipt. HGI-303/HGI-305 still own every missing
  target/journey, and HGI-304 still owns standing workflow/provider authority.

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

## Final five-pass closeout audit

The audit ran only after all six tasks were terminal. Its five passes covered:

1. ownership, declared exports/imports, and production/test/proof call graphs;
2. Effect, Schema, Config, Layer, error, resource, and helper quality;
3. contract, failure, timeout, concurrency, build-route, boundary, and
   regression coverage;
4. documentation, authority, proof levels, continuity, rollback, and the later
   Production SPEC gate;
5. adversarial legacy, secret, unsafe-boundary, topology-drift, and unsupported-
   claim scans.

Pass 5 reopened Task 5. The provider proof had compared only final webhook
count and absence of the reserved proof URL, so unrelated same-count topology
drift could be misreported as restoration. The corrected proof compares the
complete baseline and final topology by stable webhook ID and URL in both
directions. A fourth provider-proof test now simulates replacement of an
unrelated webhook at the same count and requires `topologyNotRestored`.

After correction, focused Channel, Sendblue, Photon, agent, boundary, Effect,
skill, docs, leak, stale-pattern, and build-route checks pass. The final full
repository gate contains 233 tests. Current and changed documentation passes
relative-link and frontmatter checks. The whole historical corpus still has
four pre-existing relative-link errors in `legacy-atlas.md` and two historical
documents without `review_trigger`; those retained history defects are not
current architecture or provider truth.

No credential value is tracked. The ignored Photon credential file remains
mode `0644`, so the runbook blocks another provider action until mode `0600`.
Hosted Vercel Preview, live messaging, handset delivery, and Production remain
unproved and unauthorised.
