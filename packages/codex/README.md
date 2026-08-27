# @bundjil/codex

Effect contracts and runtime services for Bundjil Codex profiles and the
private provider path.

## Purpose and public boundary

The package owns Codex identity, profile, token, request, stream, persistence,
and safe-error Schemas; named services and Layers for encrypted profile storage,
credential validity and refresh, direct Responses proof, request/stream mapping,
and the private proxy contract. Raw HTTP services and byte streams remain inside
the package's provider/runtime composition. Tests inject a standard Effect HTTP
client only through the explicit `testing` subpath. The package also exports
explicit `runtime`, `local`, `testing`, and `filesystem-store` subpaths.
Proof and live streaming share one bounded SSE framing owner and require a
decoded `response.completed` event before reporting clean completion. The
framer preserves exact LF, CRLF and CR wire bytes across chunk boundaries,
bounds line fragments and event fields, and counts every field plus the blank
terminator toward the aggregate ceiling. A closed shared event state machine
validates recognized data and terminal events, requires exact zero-based
sequence progression, and rejects failed, incomplete, malformed, duplicate,
regressing, skipped and post-terminal streams. It strips a UTF-8 BOM only at
stream start and preserves colonless `data` as an empty event field. Arbitrary
protocol JSON is opaque, encoding-stable and limited to 32 nested containers
before event selection or object-root tool mapping. Decoding and encoding
detach and deeply freeze canonical ordinary JSON rather than retaining
caller-owned mutable arrays, objects, accessors, or proxies. Schema guards and
type-side constructors accept only deeply frozen containers produced by the
package transform, tracked through private weak identity. Frozen caller-owned
objects and proxies therefore cannot bypass detachment, while ordinary decode
still detaches them into stable encodable data. The
credential-bearing
client accepts only the owned ChatGPT Responses endpoint; access-token and
account-ID values remain distinctly branded inside redaction, while header
values are bounded and defensively constructed through a fixed secret-negative
error path. The private client explicitly requests SSE and sends the fixed
Codex compatibility headers required by the checked reference clients; callers
cannot override those headers.
Raw provider headers and transport services remain private; successful metadata
uses the closed `text/event-stream` literal.

The expected private-proxy token is a stable Layer dependency, never an
operation-input field. Responses transport policy is decoded with Effect
Config. Defaults are 30 seconds for response headers, 30 seconds between
non-empty body chunks, 32 MiB cumulative body bytes, and 100,000 SSE events.
Zero-length transport chunks do not count as progress. Deployments may override
the limits with `BUNDJIL_CODEX_RESPONSES_HEADER_TIMEOUT_MILLIS`,
`BUNDJIL_CODEX_RESPONSES_STREAM_IDLE_TIMEOUT_MILLIS`,
`BUNDJIL_CODEX_RESPONSES_MAXIMUM_BODY_BYTES`, and
`BUNDJIL_CODEX_RESPONSES_MAXIMUM_EVENTS`. Values must be positive integers.
Proof responses remain scoped through complete validation and consumption.
Streaming responses transfer a dedicated request scope to the returned body;
early status/media rejection aborts immediately without reading body bytes.
After accepted status, media type and metadata are validated, an Effect-clock
ownership watchdog closes that scope at the stream-idle deadline unless body
subscription claims it. It does not run during the independent header timeout.
The claim is exactly once: only the winning subscriber receives the one-shot
upstream body; a subscriber after expiry or after another subscriber receives a
fixed typed stream error without touching the body. Scope closure signals the
watchdog, so normal completion, failure, cancellation and interruption leave no
detached work.

Apps own HTTP servers, deployment configuration, model selection, and provider
operations. `@bundjil/store` owns provider-neutral persistence primitives. The
exact exports, Schemas, and runtime graph are owned by code and package exports;
durable design rules are in
[`docs/architecture/`](../../docs/architecture/README.md).

The package preserves trusted-local and hosted compositions as explicit code
boundaries. Their commands do not establish current provider state or authorize
an external operation.

## Public commands

Run from the repository root:

```bash
bun run --filter @bundjil/codex check-types
bun run --filter @bundjil/codex test
bun run --filter @bundjil/codex build
```

The package also exposes intentionally explicit local import, subscription
login, and proof commands through `package.json`. They require authorized,
target-owned procedures and are not general setup instructions.

## Documentation routes

- Historical Codex OAuth, storage, local-import, and model-provider decisions:
  [`docs/product-specs/`](../../docs/product-specs/index.md) and retained
  [`docs/exec-plans/completed/`](../../docs/exec-plans/completed/README.md).
- Repeatable trusted-local login, stored-profile, reauthentication, credential,
  storage, and recovery procedures are owned by the Codex proxy
  [`runbooks/`](../../apps/codex-proxy/runbooks/README.md). This package owns
  their executable contracts, not provider authority or current state.
- Dated provider responses, deployment observations, and journey proof are
  routed through
  [`docs/verification/`](../../docs/verification/README.md). External systems
  still own current state; a retained packet proves only its exact target and
  observation window.

Do not add provider actuality, dated proof, provisioning, secrets, operator
sequences, rollback, or incident procedures here.
