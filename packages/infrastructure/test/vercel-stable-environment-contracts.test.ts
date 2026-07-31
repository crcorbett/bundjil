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

import { SecretReferenceId } from "../src/index.js";
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
    environmentVariableId: update.environmentVariableId,
    key: update.key,
    valueOwnership: update.valueOwnership,
  });
  return { resolve, update };
});

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
  "encodes one exact Preview PATCH, decodes the full acknowledgement, and never projects the provider value",
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
                key: Schema.Literal("BUNDJIL_CHANNEL_PHOTON_PROJECT_ID"),
                target: Schema.Tuple([Schema.Literal("preview")]),
                type: Schema.Literal("sensitive"),
                value: Schema.Literal("preview-photon-project-value"),
              })
            )
          )(new TextDecoder().decode(request.body.body));
          assert.deepStrictEqual(body.target, ["preview"]);
          return HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                id: "env-photon-project",
                key: body.key,
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
