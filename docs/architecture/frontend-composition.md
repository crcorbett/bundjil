# Frontend Composition

Bundjil currently has no committed React operator interface. These rules apply
when a SPEC introduces React, TanStack Start routes, or another component-based
frontend. A new visible app or durable frontend boundary still requires its own
SPEC before implementation.

## Composition Direction

Compose visible structure through a clear hierarchy:

```text
primitive -> composite -> layout -> route
```

- Primitives own one reusable visual or interaction contract.
- Composites combine primitives into a domain concept.
- Layouts own stable page structure and responsive placement.
- Routes select the layout, establish route-level context, and compose the
  major visible regions.

Do not add nested feature wrappers merely to shorten route JSX. A component
must own rendering, behavior, accessibility, state, or a genuinely reusable
composition. Pass-through wrappers and single-use aliases are helper sprawl.

## Leaf Ownership

The component that renders a narrow fragment should own the narrow state and
behavior needed by that fragment whenever the framework boundary permits it:

- reads and mutations for the exact fragment;
- loading, empty, error, and retry states;
- local form or interaction state;
- the command triggered by its button or control;
- its skeleton and fallback with the same stable dimensions.

Do not prop-drill query results, selected ids, loading flags, command callbacks,
or derived option lists through unrelated ancestors. Hoist state only when
multiple siblings must coordinate or a route/layout genuinely owns the
workflow.

## Effect And React

- Keep Effect services, Layers, Config, secrets, and provider clients outside
  render functions and browser bundles.
- Run server-side Effects at route, loader, action, RPC, or app-runtime
  boundaries; expose Schema-owned serializable contracts to components.
- Do not call `Effect.runPromise` during render or hide runtime construction in
  hooks. Provide one app-owned runtime boundary when several consumers share
  services.
- Model expected server failures as tagged errors and translate them once at
  the route/RPC boundary into explicit UI states.
- Do not duplicate package schemas as component DTOs. Derive view data close to
  the leaf, and introduce a named view model only when it is reused or removes
  material rendering complexity.

## React Rules

- Prefer composition and explicit children/slots over boolean-prop matrices.
- Keep component APIs narrow and domain-named; avoid generic bags of callbacks
  and presentation flags.
- Derive values during render when possible. Do not mirror props or query data
  into state without a synchronization requirement.
- Use effects only to synchronize with external systems, not for ordinary data
  derivation or event handling.
- Do not hide business workflows in generic hooks merely to shorten a
  component. A hook must own reusable React lifecycle behavior or a real
  framework boundary.
- Keep command handlers at the component that owns the control unless a shared
  workflow boundary requires coordination.
- Use stable keys from owning schemas. Never use array indexes for reorderable
  or stateful lists.
- Preserve accessibility semantics, focus behavior, keyboard operation, and
  stable loading dimensions.

## Verification

Frontend work must pass `bun run check`, focused typechecks/tests, and
`bun run verification`. Visible changes also require browser evidence at the
affected desktop and mobile widths, including loading, empty, error, and long
content states when relevant. Verify that text does not overlap or overflow and
that dynamic content does not shift fixed-format controls or layouts.

The root Ultracite/Oxlint configuration is the lint authority. Do not add local
rule suppressions or broad file exclusions to land a component. A narrow
suppression requires an adjacent explanation and must not conceal hook,
accessibility, promise, or type-safety failures.
