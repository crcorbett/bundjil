# @bundjil/channel

Provider-neutral Effect contracts for Bundjil direct-text channels.

## Public boundary

The package owns branded conversation, participant, inbound-message, and
provider-message identities; decoded direct-text transport values; the common
safe error vocabulary; and the nominal `ChannelTransport` service. It has no
provider, Eve, app, environment, persistence, or deployment dependency.

`ChannelTransport` exposes only `decodeWebhook`, `sendMessage`, and
`setPresence`. A raw Fetch `Request` is accepted only by `decodeWebhook` so a
provider Layer can authenticate its exact headers and bytes. Provider DTOs,
SDK clients, callbacks, secrets, and delivery claims never cross this package.

The `/memory` export supplies a deterministic Layer from already decoded
canonical outcomes. It performs no provider or network work.

The `/testing` export runs the provider-neutral transport conformance journey
used by each provider package. It is test support, not a runtime registry.

## Commands

From the repository root:

```bash
bun run --filter @bundjil/channel check-types
bun run --filter @bundjil/channel test
bun run --filter @bundjil/channel build
```

Durable package and Effect rules live in
[`docs/architecture/`](../../docs/architecture/README.md). Current rollout
intent lives in the
[`Channel provider SPEC`](../../docs/product-specs/photon-channel-provider.md).
