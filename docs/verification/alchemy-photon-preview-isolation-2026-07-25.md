---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-infrastructure-owner
observed_at: 2026-07-25T22:37:48Z
artifact_git_identity: cd6f8d56dc14302f7fd0e45060d0cb192c99dff7
environment: bundjil-photon-preview-bootstrap
review_trigger: do not refresh; create a new dated receipt for a later provider observation
---

# Alchemy Photon Preview isolation receipt — 2026-07-25

## Authority and candidate inventory

Cooper approved the SPEC-owned Photon Preview project, user, webhook,
configuration, proof, and rollback operations in source thread
`019f3c64-2576-70c2-90c0-e6b212f79ee1` and accepted reuse of an existing
controlled iMessage-capable identity. The `photon-management` static envelope,
current task ledger, direct approval, authenticated principal readback, exact
Bundjil resource scope, stop conditions, and rollback identity formed the
task-scoped authority receipt. The operator used ignored mode-`0600` project
credentials without printing or persisting a credential value.

Two consecutive fingerprint-only candidate inventories had the same canonical
SHA-256 digest:
`1d385c6ab7cc669aa31a48b7acb4661ba81f368f279134316cb6478c058be150`.
Both controlled candidates were bound to source project fingerprint
`ad20033fcbadd799c549cd269739710d241c13b67fdbbc23c49bd2c755a10c01`,
and both the authenticated account-level and source-project availability
reads returned available. The inventory retained no phone value.

The initially preferred candidate was the rollout-created proof identity
`82ac258dac9ee2fbdf7430c0e8a1177433ea236c06cd045ffe8683af1a0cc4c5`.
The alternative
`db23193a557af142d3ba0dd0d010e062e1f67928388875bf989369d1c0587ad4`
was the earlier adopted identity.

## Project creation and provider side effect

The authenticated account initially contained one running project named
`bundjil`. The operator created one `bundjil-preview` project in the United
States with iMessage selected. Photon returned project fingerprint
`37cf2944d0c285636c86324faf46354b6990b2fcfd9fa1981af6d24f05406ce4`.
Its project ID and create-only project secret are held only in the ignored
mode-`0600` root `.env.local`.

Photon automatically enabled the managed-shared service and seeded one shared
user as part of project creation; the operator issued no separate user-create
request. The seeded user references candidate
`db23193a557af142d3ba0dd0d010e062e1f67928388875bf989369d1c0587ad4`,
has Preview user fingerprint
`46b1fb0c12007dbe62245ac934288aa6e189b304423c994edd8e1e40008867bd`,
and received Preview assigned-identity fingerprint
`db49756e7d25c982a6bcd60c2139da5a4f895c788f33c5af2c0cdfc57b710c0`.
That assigned identity differs from the source-project assignment.

Fresh source readback still found both original source users, including the
same candidate, with no stable-user or assigned-identity change. Preview
project-scoped availability also returned available for both controlled
candidates. These direct observations prove Photon can concurrently reference
this controlled identity in the isolated project without detaching,
reassigning, disabling, or changing the source binding.

The least disruptive decision therefore changed from adding the initially
preferred identity to adopting the provider-seeded existing identity
`db23193a557af142d3ba0dd0d010e062e1f67928388875bf989369d1c0587ad4`.
Deleting the seeded user or adding a second user would introduce unnecessary
mutation.

## Current isolated topology

Owner-service readback through the Preview project credentials established:

- project name `bundjil-preview`, profile absent;
- Free tier, managed-shared service, iMessage enabled, auto-scale enabled;
- one assigned shared user;
- zero webhooks and zero dedicated lines; and
- no cancellation-at-period-end state.

The Preview project has its own project credential, user identity, and assigned
routing identity. It does not share the source project credential or physical
user UUID. This receipt does not yet prove a Preview webhook, Vercel secret
binding, deployment, signed ingress, Channel processing, handset delivery,
Production state, no-op/drift repair, or cleanup.

## Finding and correction

During the first ad-hoc inventory attempt, an incorrectly escaped local schema
pattern caused one full candidate value to appear in the interactive tool
transcript. No tracked file, receipt, provider mutation, or Git object retained
that value. The operator stopped that path, switched to the canonical Photon
E.164 Schema, suppressed provider-bearing failure details, and completed the
two matching fingerprint-only inventories above.

The repository correction now owns
`bun run infrastructure:photon-candidate-inventory`. Its live Layer lazily
decodes both project credentials through `Config.schema`, reads both complete
user sets twice, checks Preview availability for every source candidate,
encodes only fingerprint observations, and emits only `{"status":"blocked"}`
on failure. The current post-bootstrap reads matched digest
`9e6108d55bd6801b1d7e041d98cfbdce4587f39c0d0d3384ffad7bc2f7488a3f`
and uniquely selected the provider-seeded Preview binding.

## Rollback identity

The source project and both source users are adopted and must never be deleted
or changed by this rollback. The Preview project and its auto-seeded Preview
user are rollout-created but retained and deletion-protected while webhook,
deployment, retry-drain, and restoration proof remain open.

If later rollback is required, resolve the full project only from project
fingerprint
`37cf2944d0c285636c86324faf46354b6990b2fcfd9fa1981af6d24f05406ce4`,
require the exact `bundjil-preview` name, re-read the source baseline, and
remove only rollout-created Preview resources in reverse dependency order.
Never delete a source-project user by phone value, list order, creation time,
or partial ID.
