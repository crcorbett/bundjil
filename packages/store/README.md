# @bundjil/store

Provider-neutral persistence contracts and explicit test/provider Layers for
Bundjil Effect programs.

## Public boundary

- `@bundjil/store` exposes the package-owned persistence contracts.
- `@bundjil/store/memory` exposes deterministic test composition.
- `@bundjil/store/upstash` exposes the hosted-provider Layer.

The package export map and source are authoritative for the exact API. Storage
semantics and coordination rules belong to the architecture owner, not a
README copy.

## Supported commands

Run from the repository root:

```bash
bun run --filter @bundjil/store test
bun run --filter @bundjil/store build
```

## Durable routes

- [Effect patterns](../../docs/architecture/effect-patterns.md)
- [Testing and quality](../../docs/architecture/testing-and-quality.md)
- [Repository structure](../../docs/architecture/repo-structure.md)
