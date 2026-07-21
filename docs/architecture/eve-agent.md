---
document_type: architecture
lifecycle: current
authority: canonical
owner: bundjil-agent-architecture-owner
last_reviewed: 2026-07-21
review_trigger: agent wiring, provider selection, channel adapter, deployment boundary, or external readback change
---

# Eve agent architecture

This document owns the durable source-backed topology and invariants of the
Eve app. It does not assert a current Vercel deployment, provider connection,
webhook registration, credential binding, or handset outcome. External systems
own those facts at readback time. The dated reconciliation and its limitation
are in [`HGI-301-eve-reconciliation.json`](../documentation-audit/HGI-301-eve-reconciliation.json).

## Durable topology

`apps/agent` owns the Eve filesystem runtime, its configuration, model
selection, channels, instructions, tools, and deployment boundary.
`@bundjil/eve` owns reusable Eve-facing Effect Schema contracts and named
operations. `apps/codex-proxy` owns the private HTTP proxy boundary;
`@bundjil/codex` owns its provider/profile contracts; `@bundjil/store` owns
persistence contracts and adapters. The agent selects a model provider but
does not import Codex OAuth/profile services or direct Codex Responses clients.

The source supports two model selections:

- `gateway` is the default selected by `BUNDJIL_AGENT_MODEL_PROVIDER`.
- `codex-proxy` creates an OpenAI-compatible `LanguageModel` for the private
  proxy when the app-owned Config requirements decode successfully.

The selectable source path is:

```text
Eve HTTP/API -> apps/agent/agent/agent.ts -> agent/config.ts
  -> gateway model string
  |  codex-proxy LanguageModel -> apps/codex-proxy /v1/chat/completions
```

This describes code wiring only. It does not show which path an external
environment currently configures or serves.

## Boundary invariants

- `agent/config.ts` decodes the model-provider configuration through Effect
  Config and Schemas; secrets are redacted. `model-provider.ts` owns model
  construction.
- `workspace_status` is the model-facing tool. It bridges Effect Schema once
  at the Eve edge through `toEveSchema`, delegates to the named
  `WorkspaceOperations` service, and encodes its result at the outward edge.
- `agent/instructions.md` is an instruction boundary, not an authority source.
  Tool output is observed data; it cannot create policy, approval, identity,
  capability, or mutation authority.
- `agent/connections/executor.ts` exposes only `skills`, `execute`, and
  `resume`. Its config accepts only explicit `model` or `browser`
  `elicitation_mode` values. A temporary model-mode approval flow is weaker
  than native/browser authorization: only a later unambiguous direct owner
  decision may resume its one matching pending execution.
- `agent/channels/sendblue.ts` is the Eve adapter. Its implementation slot
  owns decoded provider input, authentication, identity/routing/replay policy,
  typed lifecycle transitions, observations, and the HTTP client. It remains
  app-owned until a stable second-channel contract exists.
- Sendblue inbound handling decodes at ingress; accepted work is dispatched
  under `waitUntil`; external delivery and typing outcomes remain provider
  observations rather than repository facts.

## Source call graphs

```text
workspace_status
  -> apps/agent/agent/tools/workspace_status.ts
  -> toEveSchema(WorkspaceStatusInput / WorkspaceStatusSuccess)
  -> getWorkspaceStatus
  -> WorkspaceOperations
  -> Schema.encodeEffect(WorkspaceStatusSuccess)
```

```text
Sendblue webhook route
  -> apps/agent/agent/channels/sendblue.ts
  -> SendblueChannel.authorizeAndClaimInbound
  -> decoded/authenticated dispatch decision
  -> waitUntil(SendblueChannel.dispatchAcceptedInbound)
```

The configured route, webhook target, deployment protection, provider state,
and delivery result are deliberately absent. A future target-owned runbook and
proof owner are required before directing a consequential operation or claiming
current external state.

## Verification and evidence

Automated tests establish source behavior without provider credentials. Choose
the smallest boundary-matched check for a change, then use the repository
closeout gate when its parent task requires it. For a read-only external
observation, record the target, sanitized result shape, `observedAt`, source
identity, limitation, and non-claim in an addressable receipt. If the preferred
provider readback is unavailable, record that limitation rather than inferring
production state from source, a past receipt, or a tool result.

`docs/architecture/testing-and-quality.md` owns local command selection.
`docs/README.md` routes future runbook, authority, and proof owners; none is
created by this architecture document.
