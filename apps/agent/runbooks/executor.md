---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-21
review_trigger: Executor endpoint, toolkit, connection, credential, tool allowlist, elicitation, approval, or resume behavior change
---

# Operate the Executor connection

## Scope and non-claims

Use this runbook to inspect and operate the app-scoped Executor connection.
Repository source proves the endpoint and allowed-tool contract only. It does
not prove a current toolkit, API key, downstream connection, capability,
policy, approval, or provider state.

## Preconditions

- Read [`agent/connections/executor.ts`](../agent/connections/executor.ts) and
  the app tests at the source revision being operated.
- Identify one Executor organization/toolkit and its environment label through
  an authenticated Executor surface.
- Confirm the endpoint is HTTPS on `executor.sh`, has no userinfo, custom port,
  fragment, legacy `allow_model_resume`, or extra query parameter, and names a
  dedicated toolkit with one `elicitation_mode`.
- Obtain metadata-only toolkit/connection/policy readback. Do not print or
  inspect the API key value.

## Authority envelope

| Field               | Required value                                                                          |
| ------------------- | --------------------------------------------------------------------------------------- |
| Identity            | Authenticated app principal plus the human owner for approval/resume                    |
| Operation           | One of discovery, `skills`, `execute`, approval decision, or single `resume`            |
| Resource            | Exact toolkit, downstream connection, tool, and provider resource                       |
| Environment         | Explicit Executor and downstream environment labels                                     |
| Duration/revocation | One call or one pending approval; key/toolkit/connection revocation owner named         |
| Approval            | Required separately for any consequential `execute`, decision, or `resume`              |
| Receipt             | Sanitized toolkit/policy readback, call identity, `observedAt`, outcome, and limitation |

## Inputs and secret handling

The app uses `BUNDJIL_EXECUTOR_MCP_URL` and the redacted
`BUNDJIL_EXECUTOR_API_KEY`. It exposes only `skills`, `execute`, and `resume`.
An endpoint or key presence is capability, not authority. Do not record the
key, connection credentials, raw third-party payloads, or protected resource
identifiers in repository evidence.

## Procedure

1. Prove the repository connection contract locally:

   ```bash
   bun run --filter @bundjil/agent check-types
   bun run --filter @bundjil/agent test
   ```

2. Through the authenticated Executor toolkit owner, read the toolkit identity,
   environment, selected connection status, exposed tool names/schemas,
   imported safety semantics, and approval policy. Record a sanitized summary
   and `observedAt`.

3. For discovery or `skills`, confirm the call cannot mutate the downstream
   target. If the imported schema or HTTP/GraphQL/MCP semantics are ambiguous,
   stop.

4. **Mutation gate:** before `execute`, bind the exact downstream operation,
   resource, environment, duration, approval receipt, side effects, evidence,
   rollback, and escalation. Tool availability or a successful prior call does
   not satisfy this gate.

5. When model-mode execution yields a pending approval, end the turn. Resume
   only once after the same authenticated or allowlisted owner gives one
   unambiguous decision for the matching pending state. Reject quoted,
   forwarded, provider, tool, third-party, ambiguous, replayed, multiple, or
   mismatched decisions.

6. Re-read toolkit/connection/policy state and the affected downstream target.
   Record the postcondition separately from the Executor call result.

## Evidence and postcondition

Retain the toolkit/connection identity, imported safety classification, tool
schema digest or version, operation/target, approval identity/receipt,
`observedAt`, sanitized result, downstream postcondition, limitation, and
non-claim. Executor output alone cannot prove the downstream consequence.

## Rollback and revocation

Use the downstream system's rollback for the resource consequence. Executor
account administration owns API-key, toolkit, connection, and policy
revocation; this repository has no revoke command. After an approved change,
read back both Executor and the downstream target. Never invent a raw HTTP
delete or alternate credential path.

## Stop and escalation

Stop on target/identity mismatch, unknown mutation semantics, missing rollback,
unavailable readback, pending approval without the matching owner, replayed
state, leaked secret, or any attempt to treat model-mode elicitation as stronger
than browser/native approval. Escalate toolkit/key/policy issues to the
Executor owner and resource effects to the downstream provider owner.

## Readback fallback

The fallback for an unavailable preferred connector is an `inconclusive`
receipt and escalation to the authenticated Executor account owner. Source,
the endpoint URL, API-key presence, or an unapproved alternate account is not a
fallback. Unavailable is never healthy.

## Maintenance

Review when the connection endpoint, allowed tools, toolkit, imported safety
semantics, credential source, approval protocol, or resume behavior changes.
