---
name: building-components
description: Guide for building modern, accessible, and composable UI components. Use when building new components, implementing accessibility, creating composable APIs, setting up design tokens, publishing to npm/registry, or writing component documentation.
---

# Building Components

## When to use this skill

Use when the user is:

- Building new UI components (primitives, components, blocks, templates)
- Implementing accessibility features (ARIA, keyboard navigation, focus management)
- Creating composable component APIs (slots, render props, controlled/uncontrolled state)
- Setting up design tokens and theming systems
- Publishing components to npm or a registry
- Writing component documentation
- Implementing polymorphism or as-child patterns
- Working with data attributes for styling/state

## References

- [../../../docs/architecture/frontend-composition.md](../../../docs/architecture/frontend-composition.md) - Bundjil's primitive -> composite -> layout -> route, leaf ownership, URL ownership, Effect boundary, and browser evidence rules
- [definitions.mdx](./references/definitions.mdx) - Artifact taxonomy (primitives, components, blocks, templates)
- [principles.mdx](./references/principles.mdx) - Core principles for component design
- [accessibility.mdx](./references/accessibility.mdx) - ARIA, keyboard navigation, WCAG compliance
- [composition.mdx](./references/composition.mdx) - Composable component patterns
- [as-child.mdx](./references/as-child.mdx) - The as-child pattern for element polymorphism
- [polymorphism.mdx](./references/polymorphism.mdx) - Polymorphic component patterns
- [types.mdx](./references/types.mdx) - TypeScript typing patterns for components
- [state.mdx](./references/state.mdx) - Controlled vs uncontrolled state management
- [data-attributes.mdx](./references/data-attributes.mdx) - Using data attributes for styling and state
- [design-tokens.mdx](./references/design-tokens.mdx) - Design token systems and theming
- [styling.mdx](./references/styling.mdx) - Component styling approaches
- [registry.mdx](./references/registry.mdx) - shadcn-style registry distribution
- [npm.mdx](./references/npm.mdx) - Publishing components to npm
- [marketplaces.mdx](./references/marketplaces.mdx) - Component marketplace distribution
- [docs.mdx](./references/docs.mdx) - Writing component documentation

## Bundjil Composition Rule

For this repo, component work follows
`docs/architecture/frontend-composition.md`.

- Compose visible structure as high as possible, usually in the route or nearest
  page-level parent.
- Use the primitive -> composite -> layout -> route chain for visible
  structure.
- Let leaves own the data, commands, loading, empty, error, retry, skeleton,
  and fallback states for the exact fragment or action they render.
- Keep the app router as the URL writer, use schema-owned URL/route identities,
  and keep app route APIs out of reusable packages.
- Do not add nested feature wrappers merely to shorten route JSX.
- Do not prop-drill query results, selected ids, loading flags, command
  callbacks, or derived option lists when a leaf can own the narrow value.
- If a SPEC introduces a design system or visible text contract, name its
  authority and typography roles before implementation. Capture Browser
  evidence for affected desktop/mobile states and verify no overlap or
  overflow.
