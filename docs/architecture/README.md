---
document_type: architecture-router
lifecycle: current
authority: canonical
owner: bundjil-architecture-owner
last_reviewed: 2026-07-20
review_trigger: app, package, Effect, frontend, provider-adapter, or architecture-route change
---

# Bundjil architecture

Bundjil is a Bun/Turbo personal-agent workspace. Apps own framework, channel,
provider-selection, and deployment boundaries; packages own stable reusable
domain contracts and named Effect services. Code, package exports, and tests
remain authoritative for the exact implemented graph.

## Current owners

- [`effect-patterns.md`](effect-patterns.md): Effect Schemas, services, config,
  Layers, safe errors, boundary encoding/decoding, flat sequential programs,
  and helper admission.
- [`repo-structure.md`](repo-structure.md): app/package ownership, imports,
  exports, and package admission.
- [`eve-agent.md`](eve-agent.md): durable Eve app/runtime boundary.
- [`frontend-composition.md`](frontend-composition.md): React hierarchy,
  leaf-component ownership, state, and browser proof.
- [`testing-and-quality.md`](testing-and-quality.md): local verification
  commands and evidence expectations.

The root [`ARCHITECTURE.md`](../../ARCHITECTURE.md) is a tombstone. Its
[`legacy-atlas.md`](legacy-atlas.md) successor preserves the previous mixed
architecture/rollout record as history, not current provider truth.

## Boundary rules

- Unknown host/provider data decodes once at ingress; outward values encode at
  the owning boundary. Decoded Schema-derived types flow through services.
- Named Effect operations keep raw clients, provider DTOs, promises, and
  failures inside live adapters. Use branded identities, safe tagged errors,
  Schema-backed Config, redacted secrets, and explicit live/test Layers.
- Keep Effect programs flat, linear, sequential, lazy, and composable. Keep
  one-use transformation/error logic inline; prohibit generic helpers and
  common/utils sprawl.
- React routes compose leaf-owned presentation/state components. Effects and
  service orchestration remain above leaves.

External systems own deployment/provider actuality. Current operations and
proof are explicit gaps routed by [`../README.md`](../README.md); dated details
inside retained app/package prose are not standing truth.
