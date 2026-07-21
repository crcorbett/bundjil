---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-21
review_trigger: agent command, Eve local auth, Executor config, Sendblue adapter, model provider, or local storage change
---

# Run the agent locally

## Scope and non-claims

Use this runbook for a developer-owned local Eve process. It proves only the
named source revision, local process, and observed local journey. It does not
prove Vercel, Executor, Sendblue, Upstash, message delivery, provider
credentials, or Production.

## Preconditions

- Work from a clean or intentionally scoped worktree and record `git rev-parse
HEAD` plus `git status --short`.
- Use Bun from the repository root.
- Use a dedicated non-Production Executor toolkit and non-Production provider
  identities. Never reuse a Production bearer, routing key, webhook secret,
  replay prefix, profile namespace, or Sendblue sender identity.
- Load secrets through the approved local secret mechanism. Do not place them
  in a command, shell history, tracked file, receipt, or chat.
- Confirm whether this run needs only source validation, an actual local Eve
  process, or an approved external-provider journey.

## Authority envelope

| Field               | Required value                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Identity            | Authenticated developer and its local identity source                                           |
| Operation           | Source checks or one local `dev:no-ui` process                                                  |
| Resource            | This worktree and the dedicated local configuration only                                        |
| Environment         | `local`; never inferred to be Preview or Production                                             |
| Duration/revocation | Current terminal session; stop the process to revoke                                            |
| Approval            | No external approval for source-only checks; separately recorded approval for any provider call |
| Receipt             | Source SHA, command, exit status, `observedAt`, limitation, and non-claim                       |

## Inputs and secret handling

The Executor connection requires `BUNDJIL_EXECUTOR_MCP_URL` at module import
and loads `BUNDJIL_EXECUTOR_API_KEY` only when authenticating. The URL must be
HTTPS on `executor.sh`, identify one dedicated toolkit, and select exactly one
`elicitation_mode` of `model` or `browser`.

Gateway is the default model provider. Codex-proxy mode additionally uses the
names `BUNDJIL_AGENT_MODEL_PROVIDER`, `BUNDJIL_AGENT_MODEL`,
`BUNDJIL_CODEX_PROXY_BASE_URL`, `BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN`, optional
`BUNDJIL_CODEX_PROXY_VERCEL_BYPASS`, optional `BUNDJIL_CODEX_PROXY_MODEL`, and
optional `BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS`. Sendblue configuration
is owned by the [Sendblue runbook](sendblue.md); do not load it for a journey
that does not exercise that adapter.

## Procedure

1. Confirm repository identity and inspect the app boundary:

   ```bash
   git status --short --branch
   git rev-parse HEAD
   bun run --filter @bundjil/agent check-types
   ```

2. Run the app test boundary. This command performs an Eve build before the
   Vitest suite; it is not unit-test-only:

   ```bash
   bun run --filter @bundjil/agent test
   ```

3. For a real local process, confirm the dedicated configuration names and
   target out of band, then start one foreground process:

   ```bash
   bun run --filter @bundjil/agent dev:no-ui
   ```

4. Observe only the intended local journey. Record status/error shapes, not
   prompts, model output, credentials, message contents, phone identities, raw
   tool output, or protected URLs.

5. Stop the process. Run `git status --short` and verify that no generated
   secret/config/evidence file entered the tracked worktree.

## Evidence and postcondition

Retain source SHA, commands, exit codes, local target, `observedAt`, and a
sanitized journey result. The postcondition is: the named local process stopped
and the worktree contains no newly tracked secret material. A successful test
or local response is repository/local proof only.

## Rollback and revocation

Stop the foreground process and discard only generated local runtime state
that the operator explicitly created for this run. Revert code through normal
Git review. Provider credentials, connections, webhooks, or stored profiles
require their target-owned revocation runbook; stopping Eve does not revoke
them.

## Stop and escalation

Stop on an invalid Executor endpoint, missing secret source, unexpected
Production identity, unapproved external call, model stream failure, generated
credential output, or unclear target. Escalate app/config faults to the agent
maintainer and provider/identity faults to the relevant target owner. Do not
replace the real model path with fake output to make the journey pass.

## Readback fallback

When an external readback is unavailable, mark that provider dimension
`inconclusive` with its identity, target, `observedAt`, failure, limitation,
owner, and resume trigger. Local source or a prior receipt is never a fallback
for current provider state and unavailable is never healthy.

## Maintenance

Review after any app command, Eve auth, connection import, model-provider,
Sendblue config, or local-state change. The code and Schemas remain the exact
configuration owner; this runbook owns the operating sequence.
