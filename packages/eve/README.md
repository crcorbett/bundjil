# @bundjil/eve

Eve-facing Effect Schema contracts and workspace operations used by the
Bundjil agent. Eve runtime files, channels, model configuration, and provider
secrets remain app-owned.

## Public boundary

- `@bundjil/eve` exposes the package-owned schemas, branded values, errors,
  service definition, and live/test Layers.
- `@bundjil/eve/schema` exposes the Effect Schema bridge used at Eve tool
  boundaries.

The package export map and source are authoritative for the exact API. Do not
mirror its contracts in a README or consumer-local DTO.

## Supported commands

Run from the repository root:

```bash
bun run --filter @bundjil/eve test
bun run --filter @bundjil/eve build
```

## Durable routes

- [Effect patterns](../../docs/architecture/effect-patterns.md)
- [Eve agent architecture](../../docs/architecture/eve-agent.md)
- [Testing and quality](../../docs/architecture/testing-and-quality.md)
- [Repository structure](../../docs/architecture/repo-structure.md)

`toEveSchema` exposes a plain Standard Schema object with Effect's native
validator and JSON Schema emitters. Effect 4 schemas can be callable, while
Eve 0.84 accepts object adapters. The wrapper keeps the owning Schema inside
Effect and supplies only its standard interface at the Eve boundary.
