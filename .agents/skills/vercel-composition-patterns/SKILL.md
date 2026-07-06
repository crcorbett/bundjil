---
name: vercel-composition-patterns
description:
  React composition patterns that scale. Use when refactoring components with
  boolean prop proliferation, building flexible component libraries, or
  designing reusable APIs. Triggers on tasks involving compound components,
  render props, context providers, or component architecture. Includes React 19
  API changes.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# React Composition Patterns

Composition patterns for building flexible, maintainable React components. Avoid
boolean prop proliferation by using compound components, lifting state, and
composing internals. These patterns make codebases easier for both humans and AI
agents to work with as they scale.

## When to Apply

Reference these guidelines when:

- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers
- Composing route-visible layouts, composites, primitives, and leaf slots

## Site Repo Composition Rule

Before substantial frontend composition work in this repo, read:

- `docs/architecture/frontend/component-composition.md`
- `docs/architecture/frontend/leaf-components-and-skeletons.md`
- `docs/architecture/frontend/url-state-and-page-params.md`
- `docs/FRONTEND.md`

The site-specific rule is: compose stable visible structure as high as possible,
usually in the route, while leaves own the data, search/page params, commands,
atoms, skeletons, and fallbacks for the exact UI they render. Avoid nested
feature wrappers that only hide route JSX or pass data down. Reusable leaves
that need URL state use schema-backed field URL atoms and read-only page-param
atoms instead of importing app route APIs.

Text-bearing composition must also use the canonical typography role layer:
`Heading`, `Text`, `CodeText`, semantic role classes for allowed CSS/native
surfaces, package compact helpers for dense controls, and `WEB_OG_TYPOGRAPHY`
for OG inline rendering. Do not use local `text-*`, `leading-*`, `tracking-*`,
`font-*`, or font-weight utility piles as a shortcut for visible text
hierarchy. When a composition change affects visible text, capture Browser
screenshot evidence for the affected route or component state, including
mobile when text can wrap.

## Rule Categories by Priority

| Priority | Category                | Impact | Prefix          |
| -------- | ----------------------- | ------ | --------------- |
| 1        | Component Architecture  | HIGH   | `architecture-` |
| 2        | State Management        | MEDIUM | `state-`        |
| 3        | Implementation Patterns | MEDIUM | `patterns-`     |
| 4        | React 19 APIs           | MEDIUM | `react19-`      |

## Quick Reference

### 1. Component Architecture (HIGH)

- `architecture-avoid-boolean-props` - Don't add boolean props to customize
  behavior; use composition
- `architecture-compound-components` - Structure complex components with shared
  context

### 2. State Management (MEDIUM)

- `state-decouple-implementation` - Provider is the only place that knows how
  state is managed
- `state-context-interface` - Define generic interface with state, actions, meta
  for dependency injection
- `state-lift-state` - Move state into provider components for sibling access

### 3. Implementation Patterns (MEDIUM)

- `patterns-explicit-variants` - Create explicit variant components instead of
  boolean modes
- `patterns-children-over-render-props` - Use children for composition instead
  of renderX props

### 4. React 19 APIs (MEDIUM)

> **⚠️ React 19+ only.** Skip this section if using React 18 or earlier.

- `react19-no-forwardref` - Don't use `forwardRef`; use `use()` instead of `useContext()`

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/architecture-avoid-boolean-props.md
rules/state-context-interface.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
