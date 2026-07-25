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
- `@bundjil/infrastructure/vercel` exports only Vercel read/import Schemas,
  named services, safe operation errors, lazy credential and live/memory
  Layers, and retained custom Resources. The private HTTP adapter encodes
  scoped requests, decodes complete response envelopes, exhausts pagination,
  omits environment values, resolves Marketplace identity through Vercel's
  customer storage catalog, projects its secret-bearing provider envelope
  immediately into safe binding identities, and contains no Git deployment or
  promotion operation.
- `@bundjil/infrastructure/photon` exports six retained Alchemy Resources and
  stage-scoped state-safe props/attributes for Photon project, iMessage
  platform, shared user, webhook, dedicated-line, and billing observation. It
  consumes `@bundjil/photon/management`; it does not duplicate Photon HTTP,
  authentication, DTO, retry, or secret policy and exposes no Photon write.

Applications do not import this package. Root `alchemy.run.ts` and
`stacks/**` own stack topology; provider HTTP adapters remain in their owning
provider boundary. The initial synthetic provider uses ignored local
`.alchemy/` state only and performs no Vercel, Photon, DNS, secret, webhook,
deployment, remote-state, or other network operation.

The Vercel live Layer is implemented but is not wired into the root stack and
has not been executed against a tenant. Its tests use an in-process HTTP client
and deterministic two-project memory inventory; they are contract proof, not
provider readback.

The Photon live management Layer and Alchemy providers are likewise not wired
into the root stack and have not been executed against a Photon project.
Contract tests use in-process HTTP and a deterministic Free shared-service
inventory with zero dedicated lines. The Alchemy harness proves exact
read/import adoption and destructive denial with zero provider writes; it is
not Photon state or billing proof.

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
bun run --filter @bundjil/infrastructure check-types
bun run --filter @bundjil/infrastructure test
bun run --filter @bundjil/infrastructure build
bun run infrastructure:inventory
bun alchemy plan --stage preview
bun alchemy deploy --stage preview --yes
bun alchemy sync --stage preview --dry-run
```

The Alchemy commands currently exercise only the deterministic synthetic
offline resource. They are repository/local-state proof, not provider,
deployment, Preview, Production, or authority proof.

`infrastructure:inventory` additionally requires the accepted task-scoped
authority file, source/principal identities, exact Vercel team/project scope,
and the redacted Vercel and Photon credential configuration named by
`scripts/inventory-live.ts`. Follow the Vercel and Photon runbooks; never put
credential values on stdout or commit ignored `tmp/proof/**` artifacts.
