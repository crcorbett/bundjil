---
name: effect-client-wrapper
description: Create or review Bundjil Effect services around third-party SDKs and provider APIs. Use for provider clients, external Promise APIs, live and mock Layers, request encoding, response decoding, configuration, retries, and typed boundary errors.
---

# Effect Client Wrapper

Build a named adapter whose public service contract contains Bundjil domain
operations. Keep the SDK instance, provider DTOs, Promises, and raw failures
private to the live Layer.

Read `AGENTS.md`, `docs/architecture/effect-patterns.md`,
`docs/architecture/repo-structure.md`, and
`docs/architecture/testing-and-quality.md` before editing a provider boundary.
Reuse the owning package's existing Schemas, types, services, errors, and
exception-registry entries.

## Acceptance Rules

- Expose named operations such as `createCustomer` or `sendMessage`. Never
  expose the SDK instance or a generic callback escape hatch.
- Accept only decoded, Schema-derived inputs and branded identifiers. Do not
  put raw semantic primitives in the public service API.
- Encode outbound requests through the owning codec immediately before the
  provider call. Decode unknown SDK output with `Schema.decodeUnknownEffect`
  immediately after it returns. When an SDK statically exposes the canonical
  codec's `Encoded` type, use `Schema.decodeEffect` instead; provider DTOs and
  `unknown` never escape the adapter.
- Load semantic configuration with `Config.schema`. Keep secrets redacted and
  reveal them only at immediate SDK construction or header assignment.
  Tests supply configuration through `ConfigProvider` or replace the service
  with its mock Layer.
- Wrap Promise calls with `Effect.tryPromise` at the live boundary. Map raw
  failures once to safe `Schema.TaggedErrorClass` failures. Branch on decoded
  literals or tagged unions with `Match` or Effect tagged-error operators.
- Keep each primary operation as one flat, sequential `Effect.fn` or
  `Effect.gen` program. Put expected error translation, retry, logging, and
  spans in its outer pipeline.
- Keep one-off encoding, decoding, and error mapping inline. Add a helper only
  for multiple real call sites, a genuine boundary owner, or a non-trivial
  independently tested policy.
- Export explicit `layerLive` and deterministic `layerMock`/`layerMemory`
  implementations. Do not make tests construct or reach through the SDK.

## Canonical Shape

Adapt names and schemas to the owning package. Do not create parallel request
or response DTOs solely for the wrapper.

```ts
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

export const ProviderCustomerId = Schema.NonEmptyString.pipe(
  Schema.brand("ProviderCustomerId")
);
export type ProviderCustomerId = typeof ProviderCustomerId.Type;

export const CustomerEmail = Schema.NonEmptyString.pipe(
  Schema.brand("CustomerEmail")
);

export const CreateCustomer = Schema.Struct({
  email: CustomerEmail,
});
export type CreateCustomer = typeof CreateCustomer.Type;

const ProviderCreateCustomerRequest = Schema.Struct({
  email_address: CustomerEmail,
});

const ProviderCreateCustomerResponse = Schema.Struct({
  customer_id: ProviderCustomerId,
});

export const CreatedCustomer = Schema.Struct({
  customerId: ProviderCustomerId,
});
export type CreatedCustomer = typeof CreatedCustomer.Type;

const ProviderApiKey = Schema.Redacted(Schema.NonEmptyString);
const ProviderOperation = Schema.Literals(["initialize", "createCustomer"]);
const ProviderClientDiagnostic = Schema.NonEmptyString;

export class ProviderClientError extends Schema.TaggedErrorClass<ProviderClientError>()(
  "ProviderClientError",
  {
    operation: ProviderOperation,
    message: ProviderClientDiagnostic,
  }
) {}

export interface ProviderClientShape {
  readonly createCustomer: (
    input: CreateCustomer
  ) => Effect.Effect<CreatedCustomer, ProviderClientError>;
}

export class ProviderClient extends Context.Service<
  ProviderClient,
  ProviderClientShape
>()("@bundjil/provider/ProviderClient") {}

const providerApiKey = Config.schema(
  ProviderApiKey,
  "BUNDJIL_PROVIDER_API_KEY"
);

export const layerLive = Layer.effect(
  ProviderClient,
  Effect.gen(function* makeProviderClient() {
    const apiKey = yield* providerApiKey;
    const sdk = yield* Effect.try({
      try: () => new ThirdPartySdk(Redacted.value(apiKey)),
      catch: () =>
        new ProviderClientError({
          operation: "initialize",
          message: "Unable to initialize the provider client.",
        }),
    });

    return ProviderClient.of({
      createCustomer: Effect.fn("ProviderClient.createCustomer")(
        function* (input) {
          const request = yield* Schema.encodeEffect(
            ProviderCreateCustomerRequest
          )({ email_address: input.email }).pipe(
            Effect.mapError(
              () =>
                new ProviderClientError({
                  operation: "createCustomer",
                  message: "Unable to encode the provider request.",
                })
            )
          );
          const providerResult = yield* Effect.tryPromise({
            try: () => sdk.customers.create(request),
            catch: () =>
              new ProviderClientError({
                operation: "createCustomer",
                message: "The provider request failed.",
              }),
          });
          const decoded = yield* Schema.decodeUnknownEffect(
            ProviderCreateCustomerResponse
          )(providerResult).pipe(
            Effect.mapError(
              () =>
                new ProviderClientError({
                  operation: "createCustomer",
                  message: "The provider returned an invalid response.",
                })
            )
          );
          return {
            customerId: decoded.customer_id,
          };
        }
      ),
    });
  })
);

export const layerMock = (result: CreatedCustomer) =>
  Layer.succeed(
    ProviderClient,
    ProviderClient.of({
      createCustomer: () => Effect.succeed(result),
    })
  );
```

The sample uses a private provider transport Schema because the external SDK
shape differs from the domain contract. If the SDK already accepts the
canonical codec's `Encoded` side, encode directly with that codec instead.
If an SDK's type signature unavoidably requires a primitive, confine it to the
exact live adapter symbol and register the exception required by
`tooling/boundary-exceptions.ts`.

## Tests

Require focused tests for:

1. named-operation success through `layerMock`;
2. outbound request encoding;
3. malformed provider output becoming the safe tagged error;
4. Promise rejection becoming the safe tagged error without leaking provider
   bodies, credentials, or raw causes;
5. retry behavior only for the intended tagged failure;
6. configuration through an isolated `ConfigProvider` when the live Layer is
   tested; and
7. `bun run check:boundaries`, `bun run check:effect-setup`,
   `bun run check:skills`, focused tests, and `bun run verification`.

## Rejection Checklist

Reject a wrapper when it:

- exposes a callback-based SDK escape hatch or the raw client;
- accepts unbranded semantic strings or primitive semantic config;
- returns a provider DTO or unconstrained generic result;
- branches on native error classes or retains raw causes in a public error;
- skips request encoding or provider-response decoding;
- hides a short sequential operation behind one-use readers, mappers, or
  wrappers; or
- lacks a deterministic mock Layer and malformed-output coverage.
