import { assert, it } from "@effect/vitest";
import { Effect, Exit, Inspectable, Layer, Redacted, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import { InfrastructureDestructivePolicy } from "../src/schemas.js";
import {
  CreateVercelPreviewEnvironmentMetadata,
  DeleteVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewFeedback,
  SetVercelPreviewFeedback,
  VercelCredentials,
  VercelLive,
  VercelPreviewConfiguration,
  VercelPreviewConfigurationLive,
  VercelPreviewEnvironmentMetadataProps,
  VercelPreviewFeedbackProps,
} from "../src/vercel/index.js";

const fixture = Effect.gen(function* decodePreviewConfigurationFixture() {
  const feedback = yield* Schema.decodeUnknownEffect(
    VercelPreviewFeedbackProps
  )({
    stage: "preview",
    teamId: "team-preview",
    projectId: "prj-agent",
    desired: true,
    productionGuard: null,
  });
  const environment = yield* Schema.decodeUnknownEffect(
    VercelPreviewEnvironmentMetadataProps
  )({
    stage: "preview",
    teamId: feedback.teamId,
    projectId: feedback.projectId,
    key: "BUNDJIL_ALCHEMY_PREVIEW_SPIKE",
    value: "alchemy-preview-spike",
    destructivePolicy: {
      _tag: "Permitted",
      approvalReceipt: "preview-configuration-spike-authority",
    },
  });
  return { environment, feedback };
});

const layerPreviewConfigurationLive = (client: HttpClient.HttpClient) => {
  const transport = Layer.merge(
    Layer.succeed(HttpClient.HttpClient, client),
    Layer.succeed(
      VercelCredentials,
      Effect.succeed(Redacted.make("vercel-token-sentinel"))
    )
  );
  const reads = VercelLive.pipe(Layer.provide(transport));
  const writes = VercelPreviewConfigurationLive.pipe(
    Layer.provide(reads),
    Layer.provide(transport)
  );
  return Layer.merge(reads, writes);
};

it.effect(
  "encodes exact Preview writes, decodes complete envelopes, and projects secret-bearing bodies immediately",
  () =>
    Effect.gen(function* testPreviewConfigurationLiveContracts() {
      const decoded = yield* fixture;
      const methods: string[] = [];
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          assert.strictEqual(
            request.headers["authorization"],
            "Bearer vercel-token-sentinel"
          );
          const url = new URL(request.url);
          let exactTeam = false;
          for (const [key, value] of request.urlParams) {
            exactTeam ||= key === "teamId" && value === "team-preview";
          }
          assert.strictEqual(exactTeam, true);
          methods.push(`${request.method} ${url.pathname}`);

          if (request.method === "GET" && url.pathname.endsWith("/env")) {
            return HttpClientResponse.fromWeb(
              request,
              Response.json(
                { envs: [], pagination: { next: null } },
                {
                  status: 200,
                  headers: { "x-ratelimit-remaining": "99" },
                }
              )
            );
          }
          if (request.method === "GET") {
            return HttpClientResponse.fromWeb(
              request,
              Response.json(
                {
                  id: "prj-agent",
                  name: "bundjil-agent",
                  framework: "vite",
                  rootDirectory: "apps/agent",
                  enablePreviewFeedback: null,
                  enableProductionFeedback: null,
                },
                {
                  status: 200,
                  headers: { "x-ratelimit-remaining": "99" },
                }
              )
            );
          }
          if (request.method === "DELETE") {
            return HttpClientResponse.fromWeb(
              request,
              Response.json(
                {
                  id: "env-preview-spike",
                  key: "BUNDJIL_ALCHEMY_PREVIEW_SPIKE",
                  type: "plain",
                  value: "provider-value-sentinel",
                },
                {
                  status: 200,
                  headers: { "x-ratelimit-remaining": "96" },
                }
              )
            );
          }
          if (request.body._tag !== "Uint8Array") {
            throw new Error("Expected an encoded JSON request body.");
          }
          const body = new TextDecoder().decode(request.body.body);
          if (request.method === "PATCH") {
            const patch = Schema.decodeUnknownSync(
              Schema.fromJsonString(
                Schema.Struct({
                  enablePreviewFeedback: Schema.Boolean,
                  enableProductionFeedback: Schema.Null,
                })
              )
            )(body);
            assert.strictEqual(patch.enablePreviewFeedback, true);
            assert.strictEqual(patch.enableProductionFeedback, null);
            return HttpClientResponse.fromWeb(
              request,
              Response.json(
                {
                  id: "prj-agent",
                  enablePreviewFeedback: true,
                  enableProductionFeedback: null,
                },
                {
                  status: 200,
                  headers: { "x-ratelimit-remaining": "98" },
                }
              )
            );
          }
          if (request.method === "POST") {
            const create = Schema.decodeUnknownSync(
              Schema.fromJsonString(
                Schema.Struct({
                  key: Schema.Literal("BUNDJIL_ALCHEMY_PREVIEW_SPIKE"),
                  value: Schema.Literal("alchemy-preview-spike"),
                  type: Schema.Literal("plain"),
                  target: Schema.Tuple([Schema.Literal("preview")]),
                })
              )
            )(body);
            assert.deepStrictEqual(create.target, ["preview"]);
            return HttpClientResponse.fromWeb(
              request,
              Response.json(
                {
                  created: {
                    id: "env-preview-spike",
                    key: create.key,
                    type: "plain",
                    target: ["preview"],
                    sensitive: false,
                    value: "provider-value-sentinel",
                  },
                  failed: [],
                },
                {
                  status: 201,
                  headers: { "x-ratelimit-remaining": "97" },
                }
              )
            );
          }
          throw new Error(`Unexpected Vercel method: ${request.method}`);
        })
      );

      return yield* Effect.gen(function* exercisePreviewConfigurationLive() {
        const configuration = yield* VercelPreviewConfiguration;
        const before = yield* configuration.observePreviewFeedback(
          ObserveVercelPreviewFeedback.make(decoded.feedback)
        );
        assert.strictEqual(
          before._tag === "Found" ? before.attributes.enabled : undefined,
          null
        );
        const updated = yield* configuration.setPreviewFeedback(
          SetVercelPreviewFeedback.make(decoded.feedback)
        );
        assert.strictEqual(updated.enabled, true);
        const absent = yield* configuration.observePreviewEnvironmentMetadata(
          ObserveVercelPreviewEnvironmentMetadata.make(decoded.environment)
        );
        assert.strictEqual(absent._tag, "Missing");
        const created = yield* configuration.createPreviewEnvironmentMetadata(
          CreateVercelPreviewEnvironmentMetadata.make(decoded.environment)
        );
        assert.strictEqual(created.environmentVariableId, "env-preview-spike");
        assert.strictEqual(
          Inspectable.toStringUnknown(created).includes(
            "provider-value-sentinel"
          ),
          false
        );
        yield* configuration.deletePreviewEnvironmentMetadata(
          DeleteVercelPreviewEnvironmentMetadata.make({
            attributes: created,
            destructivePolicy: decoded.environment.destructivePolicy,
          })
        );
        assert.deepStrictEqual(methods, [
          "GET /v9/projects/prj-agent",
          "PATCH /v9/projects/prj-agent",
          "GET /v10/projects/prj-agent/env",
          "POST /v10/projects/prj-agent/env",
          "DELETE /v10/projects/prj-agent/env/env-preview-spike",
        ]);
      }).pipe(Effect.provide(layerPreviewConfigurationLive(client)));
    })
);

it.effect(
  "rejects malformed responses, Production contracts, and protected deletion",
  () =>
    Effect.gen(function* testPreviewConfigurationNegativeContracts() {
      const decoded = yield* fixture;
      const production = yield* Schema.decodeUnknownEffect(
        VercelPreviewFeedbackProps
      )({
        ...decoded.feedback,
        stage: "prod",
      }).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(production), true);

      const malformedClient = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                id: "different-project",
                enablePreviewFeedback: true,
                enableProductionFeedback: null,
              },
              {
                status: 200,
                headers: { "x-ratelimit-remaining": "99" },
              }
            )
          )
        )
      );
      const malformed = yield* Effect.gen(function* exerciseMalformedLive() {
        const configuration = yield* VercelPreviewConfiguration;
        return yield* configuration
          .setPreviewFeedback(SetVercelPreviewFeedback.make(decoded.feedback))
          .pipe(Effect.exit);
      }).pipe(Effect.provide(layerPreviewConfigurationLive(malformedClient)));
      assert.strictEqual(Exit.isFailure(malformed), true);

      const protectedPolicy = InfrastructureDestructivePolicy.make({
        _tag: "Protected",
      });
      assert.strictEqual(protectedPolicy._tag, "Protected");
    })
);
