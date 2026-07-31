# `@bundjil/infrastructure`

Private repository tooling for Bundjil's Alchemy stacks. The package owns
state-safe infrastructure Schemas, branded identities, safe lifecycle errors,
named services, custom Resource providers, adoption manifests, bounded
receipts, and deterministic memory Layers.

## Public boundary

- `@bundjil/infrastructure` exports the owned Schema, service, receipt,
  adoption, Config, credential, synthetic Resource, provider, and deterministic
  memory plus sanitized inventory contracts without a provider client or
  credential escape hatch.
- `@bundjil/infrastructure/testing` exports decoded fixture Effects.
- `@bundjil/infrastructure/vercel` exports Vercel read/import Schemas, named
  services, safe operation errors, lazy credential and live/memory Layers,
  retained custom Resources, one separately composed Preview-only
  configuration capability, and one separately composed stable-binding
  capability. The private HTTP adapters encode
  scoped requests, decodes complete response envelopes, exhausts pagination,
  omits environment values, resolves Marketplace identity through Vercel's
  customer storage catalog and projects its secret-bearing provider envelope
  immediately into safe binding identities. The Preview capability can set
  only `enablePreviewFeedback` and create/delete one plain Preview-only
  environment metadata identity under a fixed authority contract. It contains
  no Git deployment, promotion, Production, domain, or Marketplace mutation.
  The stable-binding capability updates only the four existing sensitive
  Preview Photon environment identities by exact Vercel environment ID. It
  resolves each already-custodied value only at the PATCH boundary, records a
  branded value revision without the value, decodes the complete
  acknowledgement immediately, and leaves every ObservedUnknown, Absent,
  Marketplace, datastore, bearer, Production, deployment, and promotion
  boundary read-only. Rejections expose only the bounded HTTP status and
  provider error-field presence; raw provider codes, messages, and values
  remain private to the adapter.
- `@bundjil/infrastructure/photon` exports six retained Alchemy Resources and
  stage-scoped state-safe props/attributes for Photon project, iMessage
  platform, shared user, webhook, dedicated-line, and billing observation. It
  also owns the `PhotonWebhookBindingSink`: one Preview-only decoded binding
  write, safe tagged failure, and safe `SecretReference` result with live and
  deterministic memory Layers. The live adapter upserts only the agent's
  exact Preview webhook ID and create-only signing secret as Vercel sensitive
  variables, decodes the complete acknowledgement, and never returns or
  retains the signing value. It consumes `@bundjil/photon/management`; it does
  not duplicate Photon HTTP, authentication, DTO, retry, or secret policy and
  exposes no Photon provider write.

Applications do not import this package. Root `alchemy.run.ts` and
`stacks/**` own stack topology; provider HTTP adapters remain in their owning
provider boundary. Provider-bound stack commands require one exact
stage/digest adoption manifest, compose read-only Vercel and Photon Layers,
and use Alchemy's native S3 state interface against the dedicated
`bundjil-alchemy-state` R2 bucket under `bundjil/v1`. The remote-state
credential is bucket-scoped and distinct from any site state credential.

Current provider evidence belongs in the canonical task ledger and its
Schema-valid ignored receipts, never in this README. Contract tests use
in-process HTTP and deterministic memory inventories; the Alchemy harness
proves exact read/import adoption, no-op convergence, recovery and destructive
denial. The live adoption path permits R2 state writes but its Vercel and
Photon adapters expose reads only. It does not create, update, delete, deploy,
promote, send, or change billing at either provider.

The binding sink is a dormant cross-provider custody boundary until the
isolated Photon Preview task supplies a separate project, exact approved
synthetic user, fixed authority and rollback identities. Its repository tests
prove exact outbound encoding, safe projection, fail-closed conflict,
timeout-after-write idempotency and partial Vercel acknowledgement handling;
they do not prove a Photon project, Vercel environment value, deployment,
signed ingress, Channel response, or handset behavior.

The separate `alchemy.preview.run.ts` entry point owns
`BundjilPreviewConfigurationSpike`. It validates one mode-`0600` authority
artifact against both fixed contracts before resolving credentials, composes
the write-capable Layer only for that stack, opts the disposable variable into
exact-ID rollback deletion, and retains the project setting for explicit
prior-value reconciliation. The normal adoption stack cannot access these
write services.

Vercel Git linking is a project-global, runbook-owned bootstrap and is not part
of the Preview Alchemy configuration Layer. Before an exact `bundjil-agent`
link mutation, `infrastructure:vercel-git-link-authority` validates a separate
mode-`0600` envelope against the shared harness and the fixed Git-link policy.
Its rollback restores the observed absent-link state by disconnecting only the
exact `github:crcorbett/bundjil` link.

The live inventory executable is the only place that composes both provider
read Layers. It validates the fixed authority envelope and the narrower
read-only Preview/Production policy before resolving credentials, decodes one
`InfrastructureCommandInput`, performs two sequential reads, writes one
mode-`0600` Schema-encoded artifact, and emits one bounded receipt. It contains
no provider write operation. A blocked or absent artifact establishes no
current provider state.

## Commands

Run from the repository root:

```sh
bun run --filter=@bundjil/infrastructure check-types
bun run --filter=@bundjil/infrastructure test
bun run --filter=@bundjil/infrastructure build
bun run infrastructure:inventory
bun run infrastructure:adoption-manifest
bun run infrastructure:adoption-proof
bun run infrastructure:preview-state-migration
bun run infrastructure:stable-preview-plan
bun run infrastructure:stable-preview-apply
bun run infrastructure:stable-preview-sync
bun run infrastructure:preview-plan
bun run infrastructure:preview-apply
bun run infrastructure:preview-sync
bun run infrastructure:preview-drift
bun run infrastructure:preview-repair
bun run infrastructure:preview-rollback-plan
bun run infrastructure:preview-rollback
bun run infrastructure:photon-preview-webhook-binding
bun run infrastructure:vercel-git-link-authority
bun alchemy deploy --stage preview --dry-run --adopt
bun alchemy deploy --stage preview --adopt --yes
bun alchemy plan --stage preview
bun alchemy sync --stage preview --dry-run
```

`infrastructure:inventory` additionally requires the accepted task-scoped
authority file, distinct mode-`0600` inventory and receipt paths,
source/principal identities, exact Vercel team/project scope, and the redacted
Vercel and Photon credential configuration named by
`scripts/inventory-live.ts`. It writes the already Schema-encoded fixed receipt
itself; captured stdout is not the durable evidence owner. Adoption additionally
requires the exact accepted inventory digest, stage-specific mode-`0600`
manifest, validated authority, and dedicated R2 Config named by
`src/state/r2-state.ts`. The installed Alchemy beta has no `plan --adopt`; use
`deploy --dry-run --adopt` for the side-effect-free adoption plan. Follow the
[Alchemy infrastructure runbook](../../apps/agent/runbooks/alchemy-infrastructure.md);
never put credential values on stdout or commit ignored `tmp/proof/**`
artifacts.

Stable Preview commands require the same accepted stage-correct inventory and
manifest plus `BUNDJIL_INFRASTRUCTURE_BINDING_PROFILE=previewPhotonManaged`
and a separate mode-`0600`
`BUNDJIL_STABLE_ENVIRONMENT_AUTHORITY_PATH`. The authority policy permits
updates only to the four existing `BUNDJIL_CHANNEL_PHOTON_*` identities in
`bundjil-agent`; the source SHA is the value revision. The plan must contain
exactly four updates and no create, replace, delete, bearer, Marketplace,
datastore, Photon, Production, deployment-create, or promotion action. Known
429/5xx failures receive at most three total attempts with exponential jitter;
an uncertain timeout after write is never retried blindly because Vercel
metadata cannot prove a write-only value. After apply, require exact provider
acknowledgements, fresh metadata-only inventory, a no-op plan, two unchanged
sync dry-runs, and `infrastructure:adoption-proof` with the managed profile.
The four `deploymentRequired` results require a distinct new Vercel Git
deployment before runtime claims.

The inventory executable selects Photon credentials by the decoded stage:
`preview` requires the isolated `BUNDJIL_PHOTON_PREVIEW_*` pair, while `prod`
requires the source/Production `BUNDJIL_PHOTON_MANAGEMENT_*` pair. It does not
load the other stage's credential. A Preview artifact containing the
Production Photon project, or vice versa, is a stage-isolation failure and
must not become an adoption manifest.

The live adoption Layer and state-proof leak scan apply the same stage
selection. Passing a stage-correct inventory to a Layer that authenticates as
the other Photon project is a hard failure, not partial adoption proof.

`infrastructure:photon-preview-webhook-binding` consumes the mode-`0600`
create-only Photon webhook artifact and writes the project ID/secret plus
webhook ID/secret as four sensitive Preview-only Vercel variables through the
owner-specific sink. It reads the exact metadata before and after the write,
blocks rather than replaying any pre-existing or partial binding, and removes
the recovery artifact only after the complete acknowledgement and metadata
readback pass.

After a direct signed-ingress mismatch, the exact four existing metadata
identities may be recovered once by setting
`BUNDJIL_PHOTON_BINDING_RECOVERY_MODE=signedIngressMismatch`. The command
rewrites the same decoded values through the owner sink and retains the source
artifact until a later immutable deployment proves signed ingress.

For the later lossless stable callback replacement, use
`BUNDJIL_PHOTON_BINDING_RECOVERY_MODE=stableCallbackCutover` only while the old
webhook and its artifact remain available for rollback. The command retains
the new artifact and returns `cutoverPendingIngress`; delete neither callback
nor artifact until the new immutable deployment passes signed proof.
After signed proof, the full documented retry drain and exact one-webhook
cleanup readback, keep the surviving ID/secret only in approved ignored
mode-`0600` `.env.local` custody and Vercel's sensitive Preview environment.
Delete both temporary binding artifacts and discard the retired callback
secret. The later hosted Channel proof still requires an exact approved
Preview conversation; never substitute a synthetic identity, guessed
recipient, or the shared source project.
