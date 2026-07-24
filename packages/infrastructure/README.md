# `@bundjil/infrastructure`

Private repository tooling for Bundjil's Alchemy stacks. The package owns
state-safe infrastructure Schemas, branded identities, safe lifecycle errors,
named services, custom Resource providers, adoption manifests, bounded
receipts, and deterministic memory Layers.

## Public boundary

- `@bundjil/infrastructure` exports the owned Schema, service, receipt,
  adoption, Config, credential, synthetic Resource, provider, and deterministic
  memory contracts without a provider client or credential escape hatch.
- `@bundjil/infrastructure/testing` exports decoded fixture Effects.

Applications do not import this package. Root `alchemy.run.ts` and
`stacks/**` own stack topology; provider HTTP adapters remain in their owning
provider boundary. The initial synthetic provider uses ignored local
`.alchemy/` state only and performs no Vercel, Photon, DNS, secret, webhook,
deployment, remote-state, or other network operation.

## Commands

Run from the repository root:

```sh
bun run --filter @bundjil/infrastructure check-types
bun run --filter @bundjil/infrastructure test
bun run --filter @bundjil/infrastructure build
bun alchemy plan --stage preview
bun alchemy deploy --stage preview --yes
bun alchemy sync --stage preview --dry-run
```

The Alchemy commands currently exercise only the deterministic synthetic
offline resource. They are repository/local-state proof, not provider,
deployment, Preview, Production, or authority proof.
