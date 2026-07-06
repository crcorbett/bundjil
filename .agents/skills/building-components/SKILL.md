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

- [../../../docs/references/design-systems-mcp.md](../../../docs/references/design-systems-mcp.md) - Southleft Design Systems MCP usage for tokens, components, documentation, governance, accessibility, tools, foundations, and Figma reference material
- [../../../docs/architecture/frontend/component-composition.md](../../../docs/architecture/frontend/component-composition.md) - highest-parent route composition, primitive -> composite -> layout -> route, and wrapper avoidance
- [../../../docs/architecture/frontend/leaf-components-and-skeletons.md](../../../docs/architecture/frontend/leaf-components-and-skeletons.md) - leaf-owned reads, params, commands, skeletons, and fallbacks
- [../../../docs/architecture/frontend/url-state-and-page-params.md](../../../docs/architecture/frontend/url-state-and-page-params.md) - schema-backed field URL atoms, read-only page-param atoms, and TanStack Router adapter rules
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

## Site Repo MCP Rule

For this repo, query the Southleft Design Systems MCP before introducing or
substantially changing durable design-system concepts: token taxonomy,
semantic-token naming, component catalogue structure, component documentation,
accessibility expectations, governance, or `/design` route information
architecture.

Use these MCP categories first:

- `tokens` for DTCG terminology, alias/reference behavior, semantic tokens,
  and token documentation.
- `components` for component states, documentation structure, and reusable UI
  expectations.
- `accessibility` for keyboard, focus, contrast, ARIA, and inclusive design
  checks.
- `documentation`, `workflow`, and `governance` for source-of-truth,
  contribution, and adoption guidance.
- `foundations` for typography, spacing, color, layout, and other foundations.

Translate MCP results into local rules in `docs/DESIGN.md`, `docs/FRONTEND.md`,
`packages/ui/src/styles/base.css`, and `/design`. Do not let external guidance
override the repo's existing tokens, Base UI-backed components, or visual
direction without recording the deliberate exception in the relevant spec or
execution plan.

## Site Repo Typography Rule

For this repo, visible text must use the canonical typography role layer from
`@packages/ui`.

- Prefer `Heading`, `Text`, and `CodeText` for production UI text.
- Use semantic role classes such as `type-display`, `type-page-title`,
  `type-body`, `type-caption`, `mono-label`, and `code` only for CSS-owned
  surfaces, semantic native/link elements, MDX/prose rules, or documented
  `/design` specimens.
- Do not add local `text-*`, `leading-*`, `tracking-*`, `font-*`, or
  font-weight utility piles in routes or package components.
- Package control internals that need dense text should use role-backed compact
  helpers such as `type-label-compact` and `type-body-compact`.
- When a component change affects visible text, capture Browser screenshot
  evidence for the affected state and viewport, including mobile when text can
  wrap.

## Site Repo Composition Rule

For this repo, component work follows
`docs/architecture/frontend/component-composition.md` and
`docs/architecture/frontend/leaf-components-and-skeletons.md`.

- Compose visible structure as high as possible, usually in the route or nearest
  page-level parent.
- Use the primitive -> composite -> layout -> route chain for visible
  structure.
- Let leaves own the data, search/page params, commands, atoms, skeletons, and
  fallbacks for the exact fragment or action they render.
- Reusable leaves that need URL state should use schema-backed field URL atoms
  for search params and read-only page-param atoms for route identity; do not
  import app route files, generated route trees, or `Route.useSearch()` /
  `Route.useParams()` into reusable packages.
- Do not add nested feature wrappers merely to shorten route JSX.
- Do not prop-drill query results, selected ids, loading flags, command
  callbacks, or derived option lists when a leaf can own the narrow value.
