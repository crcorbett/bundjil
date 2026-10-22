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

The Schema bridge returns a plain Standard Schema object because Eve does not
recognise Effect 4's callable schema values. Effect still owns validation and
JSON Schema generation. Both representations reject extra object fields, and
the bridge supports draft 2020-12 and draft-07 without copying domain contracts.

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
