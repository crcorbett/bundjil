# @bundjil/sendblue

Sendblue implementation of `@bundjil/channel`'s nominal `ChannelTransport`.

## Public boundary

The package owns Sendblue E.164 identities, webhook and HTTP wire Schemas,
constant-time comparison of the documented `sb-signing-secret` header,
outbound request encoding, complete response decoding, and safe mapping to the
common Channel error vocabulary. It exposes no raw client, provider DTO,
callback, Promise, environment reader, account-management operation, or
delivery claim.

`layerLive(config)` consumes an already decoded `SendblueConfig` and requires
an Effect `HttpClient` Layer. `layerMemory(config)` delegates to the canonical
deterministic Channel memory Layer. The app owns environment variable names
and loads redacted secrets with `Config.schema`.

The implementation follows Sendblue's current official
[message](https://docs.sendblue.com/api/resources/messages/methods/send/),
[typing](https://docs.sendblue.com/api-v2/typing-indicators), and
[webhook](https://docs.sendblue.com/getting-started/webhooks/) contracts.
Sendblue `QUEUED`, `SENT`, or `DELIVERED` responses are represented only as
Channel `accepted`; they do not prove handset delivery.

## Commands

```bash
bun run --filter @bundjil/sendblue check-types
bun run --filter @bundjil/sendblue test
bun run --filter @bundjil/sendblue build
```

Current rollout intent and proof boundaries live in the
[`Channel provider SPEC`](../../docs/product-specs/photon-channel-provider.md).
