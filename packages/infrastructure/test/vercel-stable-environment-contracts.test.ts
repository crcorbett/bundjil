import { assert, it } from "@effect/vitest";
import {
  ConfigProvider,
  Effect,
  Exit,
  Inspectable,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import { SecretOwner, SecretReferenceId } from "../src/index.js";
import {
  ResolveVercelPreviewPhotonValue,
  UpdateVercelStableEnvironmentVariable,
  VercelCredentials,
  VercelPreviewPhotonBindingValues,
  VercelPreviewPhotonBindingValuesLive,
  VercelStableEnvironmentBindings,
  VercelStableEnvironmentBindingsLive,
} from "../src/vercel/index.js";

const fixture = Effect.gen(function* decodeStableEnvironmentContractFixture() {
  const update = yield* Schema.decodeUnknownEffect(
    UpdateVercelStableEnvironmentVariable
  )({
    stage: "preview",
    teamId: "team-preview",
    projectId: "prj-agent",
    environmentVariableId: "env-photon-project",
    key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
    type: "sensitive",
    targets: ["preview"],
    valueOwnership: {
      _tag: "Managed",
      reference: {
        owner: "@bundjil/infrastructure/vercel/preview-photon",
        reference: "env-photon-project",
        revision: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    },
    value: Redacted.make("preview-photon-project-value"),
    previousProviderUpdatedAt: 41,
  });
  const resolve = ResolveVercelPreviewPhotonValue.make({
    stage: "preview",
    environmentVariableId: update.environmentVariableId,
    key: update.key,
    valueOwnership: update.valueOwnership,
  });
  return { resolve, update };
});

const productionFixture = Effect.gen(
  function* decodeProductionStableEnvironmentContractFixture() {
    const update = yield* Schema.decodeUnknownEffect(
      UpdateVercelStableEnvironmentVariable
    )({
      stage: "prod",
      teamId: "team-production",
      projectId: "prj-agent-production",
      environmentVariableId: "env-production-photon-project",
      key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
      type: "sensitive",
      targets: ["production"],
      valueOwnership: {
        _tag: "Managed",
        reference: {
          owner: "@bundjil/infrastructure/vercel/production-photon",
          reference: "env-production-photon-project",
          revision: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        },
      },
      value: Redacted.make("production-photon-project-value"),
      previousProviderUpdatedAt: 51,
    });
    const resolve = ResolveVercelPreviewPhotonValue.make({
      stage: "prod",
      environmentVariableId: update.environmentVariableId,
      key: update.key,
      valueOwnership: update.valueOwnership,
    });
    return { resolve, update };
  }
);

const bindingLayer = (client: HttpClient.HttpClient) =>
  VercelStableEnvironmentBindingsLive.pipe(
    Layer.provide(
      Layer.merge(
        Layer.succeed(HttpClient.HttpClient, client),
        Layer.succeed(
          VercelCredentials,
          Effect.succeed(Redacted.make("vercel-token-sentinel"))
        )
      )
    )
  );

it.effect(
  "omits the immutable sensitive key, decodes the full acknowledgement, and never projects the provider value",
  () =>
    Effect.gen(function* testStableEnvironmentLiveContract() {
      const decoded = yield* fixture;
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          assert.strictEqual(request.method, "PATCH");
          assert.strictEqual(
            new URL(request.url).pathname,
            "/v9/projects/prj-agent/env/env-photon-project"
          );
          assert.strictEqual(
            request.headers["authorization"],
            "Bearer vercel-token-sentinel"
          );
          if (request.body._tag !== "Uint8Array") {
            throw new Error("Expected an encoded stable environment body.");
          }
          const body = Schema.decodeUnknownSync(
            Schema.fromJsonString(
              Schema.Struct({
                target: Schema.Tuple([Schema.Literal("preview")]),
                type: Schema.Literal("sensitive"),
                value: Schema.Literal("preview-photon-project-value"),
              })
            )
          )(new TextDecoder().decode(request.body.body), {
            onExcessProperty: "error",
          });
          assert.deepStrictEqual(body.target, ["preview"]);
          return HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                id: "env-photon-project",
                key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
                type: "sensitive",
                target: ["preview"],
                sensitive: true,
                updatedAt: 42,
                value: "provider-value-sentinel",
              },
              {
                status: 200,
                headers: { "x-ratelimit-remaining": "99" },
              }
            )
          );
        })
      );
      return yield* Effect.gen(function* exerciseStableEnvironmentLive() {
        const bindings = yield* VercelStableEnvironmentBindings;
        const updated = yield* bindings.updateStableEnvironmentVariable(
          decoded.update
        );
        assert.strictEqual(updated.providerUpdatedAt, 42);
        assert.strictEqual(updated.deploymentRequired, true);
        assert.strictEqual(updated.valueOwnership._tag, "Managed");
        assert.strictEqual(
          Inspectable.toStringUnknown(updated).includes(
            "provider-value-sentinel"
          ),
          false
        );
      }).pipe(Effect.provide(bindingLayer(client)));
    })
);

it.effect(
  "resolves only exact owner/reference custody and rejects malformed acknowledgements",
  () =>
    Effect.gen(function* testStableEnvironmentNegativeContracts() {
      const decoded = yield* fixture;
      const config = ConfigProvider.layer(
        ConfigProvider.fromEnv({
          env: {
            BUNDJIL_PHOTON_PREVIEW_PROJECT_ID: "preview-photon-project-value",
            BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET:
              "preview-photon-secret-value",
            BUNDJIL_PHOTON_PREVIEW_WEBHOOK_ID:
              "33333333-3333-4333-8333-333333333333",
            BUNDJIL_PHOTON_PREVIEW_WEBHOOK_SECRET:
              "preview-webhook-secret-value",
          },
        })
      );
      const valuesLayer = Layer.merge(
        VercelPreviewPhotonBindingValuesLive,
        config
      );
      const resolved = yield* Effect.gen(function* resolveExactValue() {
        const values = yield* VercelPreviewPhotonBindingValues;
        return yield* values.resolvePreviewPhotonValue(decoded.resolve);
      }).pipe(Effect.provide(valuesLayer));
      assert.strictEqual(
        Redacted.value(resolved),
        "preview-photon-project-value"
      );
      const wrongReference = yield* Effect.gen(
        function* rejectWrongReference() {
          const values = yield* VercelPreviewPhotonBindingValues;
          return yield* values
            .resolvePreviewPhotonValue(
              ResolveVercelPreviewPhotonValue.make({
                ...decoded.resolve,
                valueOwnership: {
                  _tag: "Managed",
                  reference: {
                    ...decoded.resolve.valueOwnership.reference,
                    reference: SecretReferenceId.make("different-env"),
                  },
                },
              })
            )
            .pipe(Effect.exit);
        }
      ).pipe(Effect.provide(valuesLayer));
      assert.strictEqual(Exit.isFailure(wrongReference), true);

      const malformedClient = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                id: "different-env",
                key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
                type: "sensitive",
                target: ["preview"],
                sensitive: true,
                updatedAt: 42,
              },
              { status: 200 }
            )
          )
        )
      );
      const malformed = yield* Effect.gen(function* rejectMalformedLive() {
        const bindings = yield* VercelStableEnvironmentBindings;
        return yield* bindings
          .updateStableEnvironmentVariable(decoded.update)
          .pipe(Effect.exit);
      }).pipe(Effect.provide(bindingLayer(malformedClient)));
      assert.strictEqual(Exit.isFailure(malformed), true);
    })
);

it.effect(
  "binds Production custody and updates only the exact Production target",
  () =>
    Effect.gen(function* testProductionStableEnvironmentLiveContract() {
      const decoded = yield* productionFixture;
      const config = ConfigProvider.layer(
        ConfigProvider.fromEnv({
          env: {
            BUNDJIL_CHANNEL_PHOTON_PROJECT_ID:
              "provider-write-only-placeholder",
            BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET:
              "provider-write-only-placeholder",
            BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID:
              "provider-write-only-placeholder",
            BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET:
              "provider-write-only-placeholder",
            BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID:
              "production-photon-project-value",
            BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET:
              "production-photon-project-secret",
            BUNDJIL_PHOTON_PRODUCTION_WEBHOOK_ID:
              "44444444-4444-4444-8444-444444444444",
            BUNDJIL_PHOTON_PRODUCTION_WEBHOOK_SECRET:
              "production-photon-webhook-secret",
          },
        })
      );
      const resolved = yield* Effect.gen(function* resolveProductionValue() {
        const values = yield* VercelPreviewPhotonBindingValues;
        return yield* values.resolvePreviewPhotonValue(decoded.resolve);
      }).pipe(
        Effect.provide(
          Layer.merge(VercelPreviewPhotonBindingValuesLive, config)
        )
      );
      assert.strictEqual(
        Redacted.value(resolved),
        "production-photon-project-value"
      );
      const productionWebhookSecret = yield* Effect.gen(
        function* resolveProductionWebhookSecret() {
          const values = yield* VercelPreviewPhotonBindingValues;
          return yield* values.resolvePreviewPhotonValue(
            ResolveVercelPreviewPhotonValue.make({
              ...decoded.resolve,
              key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
            })
          );
        }
      ).pipe(
        Effect.provide(
          Layer.merge(VercelPreviewPhotonBindingValuesLive, config)
        )
      );
      assert.strictEqual(
        Redacted.value(productionWebhookSecret),
        "production-photon-webhook-secret"
      );
      const [productionProjectSecret, productionWebhookId] = yield* Effect.gen(
        function* resolveRemainingProductionValues() {
          const values = yield* VercelPreviewPhotonBindingValues;
          return yield* Effect.all([
            values.resolvePreviewPhotonValue(
              ResolveVercelPreviewPhotonValue.make({
                ...decoded.resolve,
                key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
              })
            ),
            values.resolvePreviewPhotonValue(
              ResolveVercelPreviewPhotonValue.make({
                ...decoded.resolve,
                key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
              })
            ),
          ]);
        }
      ).pipe(
        Effect.provide(
          Layer.merge(VercelPreviewPhotonBindingValuesLive, config)
        )
      );
      assert.strictEqual(
        Redacted.value(productionProjectSecret),
        "production-photon-project-secret"
      );
      assert.strictEqual(
        Redacted.value(productionWebhookId),
        "44444444-4444-4444-8444-444444444444"
      );

      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          if (request.body._tag !== "Uint8Array") {
            throw new Error("Expected an encoded stable environment body.");
          }
          const body = Schema.decodeUnknownSync(
            Schema.fromJsonString(
              Schema.Struct({
                target: Schema.Tuple([Schema.Literal("production")]),
                type: Schema.Literal("sensitive"),
                value: Schema.Literal("production-photon-project-value"),
              })
            )
          )(new TextDecoder().decode(request.body.body), {
            onExcessProperty: "error",
          });
          assert.deepStrictEqual(body.target, ["production"]);
          return HttpClientResponse.fromWeb(
            request,
            Response.json({
              id: "env-production-photon-project",
              key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
              type: "sensitive",
              target: ["production"],
              sensitive: true,
              updatedAt: 52,
            })
          );
        })
      );
      const updated = yield* Effect.gen(
        function* updateProductionEnvironment() {
          const bindings = yield* VercelStableEnvironmentBindings;
          return yield* bindings.updateStableEnvironmentVariable(
            decoded.update
          );
        }
      ).pipe(Effect.provide(bindingLayer(client)));
      assert.strictEqual(updated.stage, "prod");
      assert.deepStrictEqual(updated.targets, ["production"]);

      const previewOwnerForProduction = yield* Effect.gen(
        function* rejectCrossStageOwner() {
          const values = yield* VercelPreviewPhotonBindingValues;
          return yield* values
            .resolvePreviewPhotonValue(
              ResolveVercelPreviewPhotonValue.make({
                ...decoded.resolve,
                valueOwnership: {
                  _tag: "Managed",
                  reference: {
                    ...decoded.resolve.valueOwnership.reference,
                    owner: SecretOwner.make(
                      "@bundjil/infrastructure/vercel/preview-photon"
                    ),
                  },
                },
              })
            )
            .pipe(Effect.exit);
        }
      ).pipe(
        Effect.provide(
          Layer.merge(VercelPreviewPhotonBindingValuesLive, config)
        )
      );
      assert.strictEqual(Exit.isFailure(previewOwnerForProduction), true);

      const placeholderOnlyConfig = ConfigProvider.layer(
        ConfigProvider.fromEnv({
          env: {
            BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET:
              "provider-write-only-placeholder",
          },
        })
      );
      const placeholderOnly = yield* Effect.gen(
        function* rejectProviderWriteOnlyPlaceholder() {
          const values = yield* VercelPreviewPhotonBindingValues;
          return yield* values
            .resolvePreviewPhotonValue(
              ResolveVercelPreviewPhotonValue.make({
                ...decoded.resolve,
                key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
              })
            )
            .pipe(Effect.exit);
        }
      ).pipe(
        Effect.provide(
          Layer.merge(
            VercelPreviewPhotonBindingValuesLive,
            placeholderOnlyConfig
          )
        )
      );
      assert.strictEqual(Exit.isFailure(placeholderOnly), true);
    })
);

it.effect(
  "retains only bounded provider rejection metadata and never renders raw provider error fields",
  () =>
    Effect.gen(function* testStableEnvironmentProviderRejection() {
      const decoded = yield* fixture;
      const rejectedClient = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                error: {
                  code: "provider-code-sentinel",
                  message: "provider-message-sentinel",
                },
              },
              { status: 403 }
            )
          )
        )
      );
      const rejection = yield* Effect.gen(function* rejectProviderResponse() {
        const bindings = yield* VercelStableEnvironmentBindings;
        return yield* bindings
          .updateStableEnvironmentVariable(decoded.update)
          .pipe(Effect.flip);
      }).pipe(Effect.provide(bindingLayer(rejectedClient)));
      assert.deepStrictEqual(rejection.providerFailure, {
        status: 403,
        codePresent: true,
        messagePresent: true,
      });
      const rendered = Inspectable.toStringUnknown(rejection);
      assert.strictEqual(rendered.includes("provider-code-sentinel"), false);
      assert.strictEqual(rendered.includes("provider-message-sentinel"), false);
      assert.strictEqual(
        rendered.includes("preview-photon-project-value"),
        false
      );
      assert.strictEqual(
        rendered.includes(
          "status 403; code present: true; message present: true"
        ),
        true
      );
    })
);
