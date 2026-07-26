import { assert, it } from "@effect/vitest";
import { Effect, Exit, Inspectable, Layer, Redacted, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import {
  emptyPhotonWebhookBindingMemory,
  layerPhotonWebhookBindingMemory,
  PhotonWebhookBindingMemoryControl,
  PhotonWebhookBindingSink,
  PhotonWebhookBindingSinkLive,
  PhotonWebhookBindingWrite,
} from "../src/photon/index.js";
import { VercelCredentials } from "../src/vercel/index.js";

const signingSecretSentinel = "photon-preview-signing-secret-sentinel";
const projectSecretSentinel = "photon-preview-project-secret-sentinel";

const fixture = Schema.decodeUnknownEffect(PhotonWebhookBindingWrite)({
  stage: "preview",
  teamId: "team-preview",
  vercelProjectId: "prj-agent",
  photonProjectId: "00000000-0000-4000-8000-000000000001",
  projectSecret: Redacted.make(projectSecretSentinel),
  webhookId: "00000000-0000-4000-8000-000000000002",
  signingSecret: Redacted.make(signingSecretSentinel),
});

const layerLive = (client: HttpClient.HttpClient) =>
  PhotonWebhookBindingSinkLive.pipe(
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
  "round trips the owner write and safe result without serializing its secret",
  () =>
    Effect.gen(function* testPhotonWebhookBindingCodec() {
      const input = yield* fixture;
      const encoded = yield* Schema.encodeEffect(PhotonWebhookBindingWrite)(
        input
      );
      assert.strictEqual(
        Redacted.value(encoded.signingSecret),
        signingSecretSentinel
      );
      assert.strictEqual(
        Redacted.value(encoded.projectSecret),
        projectSecretSentinel
      );
      const decoded = yield* Schema.decodeEffect(PhotonWebhookBindingWrite)(
        encoded
      );
      assert.strictEqual(
        Redacted.value(decoded.signingSecret),
        signingSecretSentinel
      );
      assert.strictEqual(
        Redacted.value(decoded.projectSecret),
        projectSecretSentinel
      );

      const result = yield* Effect.gen(function* persistBinding() {
        const sink = yield* PhotonWebhookBindingSink;
        return yield* sink.persistPreviewWebhookBinding(input);
      }).pipe(
        Effect.provide(
          layerPhotonWebhookBindingMemory(emptyPhotonWebhookBindingMemory)
        )
      );
      const safeResult = Inspectable.toStringUnknown(result);
      assert.strictEqual(safeResult.includes(signingSecretSentinel), false);
      assert.strictEqual(safeResult.includes(projectSecretSentinel), false);
      assert.strictEqual(
        result.owner,
        "bundjil-agent-preview-vercel-environment"
      );

      const malformed = yield* Schema.decodeUnknownEffect(
        PhotonWebhookBindingWrite
      )({
        ...encoded,
        stage: "production",
      }).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(malformed), true);
    })
);

it.effect(
  "recovers a timeout-after-write by identity without a duplicate write",
  () =>
    Effect.gen(function* testPhotonWebhookBindingTimeoutRecovery() {
      const input = yield* fixture;
      const layer = layerPhotonWebhookBindingMemory({
        ...emptyPhotonWebhookBindingMemory,
        failureMode: "timeoutAfterWrite",
      });
      const result = yield* Effect.gen(function* exerciseBindingTimeout() {
        const sink = yield* PhotonWebhookBindingSink;
        const control = yield* PhotonWebhookBindingMemoryControl;
        const first = yield* sink
          .persistPreviewWebhookBinding(input)
          .pipe(Effect.exit);
        assert.strictEqual(Exit.isFailure(first), true);
        const recovered = yield* sink.persistPreviewWebhookBinding(input);
        const writes = yield* control.writeCount;
        const snapshot = yield* control.snapshot;
        return { recovered, snapshot, writes };
      }).pipe(Effect.provide(layer));

      assert.strictEqual(result.writes.count, 1);
      assert.strictEqual(result.snapshot.binding?.webhookId, input.webhookId);
      assert.strictEqual(
        Inspectable.toStringUnknown(result.snapshot).includes(
          signingSecretSentinel
        ),
        false
      );
    })
);

it.effect(
  "fails closed before persistence and exposes no secret in the safe error",
  () =>
    Effect.gen(function* testPhotonWebhookBindingSinkFailure() {
      const input = yield* fixture;
      const layer = layerPhotonWebhookBindingMemory({
        ...emptyPhotonWebhookBindingMemory,
        failureMode: "sinkFailure",
      });
      const result = yield* Effect.gen(function* exerciseSinkFailure() {
        const sink = yield* PhotonWebhookBindingSink;
        const control = yield* PhotonWebhookBindingMemoryControl;
        const exit = yield* sink
          .persistPreviewWebhookBinding(input)
          .pipe(Effect.exit);
        const writes = yield* control.writeCount;
        const snapshot = yield* control.snapshot;
        return { exit, snapshot, writes };
      }).pipe(Effect.provide(layer));

      assert.strictEqual(Exit.isFailure(result.exit), true);
      assert.strictEqual(result.writes.count, 0);
      assert.strictEqual(result.snapshot.binding, null);
      assert.strictEqual(
        Inspectable.toStringUnknown(result).includes(signingSecretSentinel),
        false
      );
    })
);

it.effect(
  "records a Vercel partial failure without pretending the secret binding converged",
  () =>
    Effect.gen(function* testPhotonWebhookBindingPartialFailure() {
      const input = yield* fixture;
      const layer = layerPhotonWebhookBindingMemory({
        ...emptyPhotonWebhookBindingMemory,
        failureMode: "vercelPartialFailure",
      });
      const result = yield* Effect.gen(function* exercisePartialFailure() {
        const sink = yield* PhotonWebhookBindingSink;
        const control = yield* PhotonWebhookBindingMemoryControl;
        const exit = yield* sink
          .persistPreviewWebhookBinding(input)
          .pipe(Effect.exit);
        const snapshot = yield* control.snapshot;
        return { exit, snapshot };
      }).pipe(Effect.provide(layer));

      assert.strictEqual(Exit.isFailure(result.exit), true);
      assert.strictEqual(result.snapshot.binding, null);
      assert.strictEqual(result.snapshot.partialWebhookIdPersisted, true);
    })
);

it.effect("rejects a cross-webhook overwrite", () =>
  Effect.gen(function* testPhotonWebhookBindingConflict() {
    const input = yield* fixture;
    const other = yield* Schema.decodeUnknownEffect(PhotonWebhookBindingWrite)({
      ...(yield* Schema.encodeEffect(PhotonWebhookBindingWrite)(input)),
      webhookId: "00000000-0000-4000-8000-000000000003",
    });
    const result = yield* Effect.gen(function* exerciseBindingConflict() {
      const sink = yield* PhotonWebhookBindingSink;
      yield* sink.persistPreviewWebhookBinding(input);
      return yield* sink.persistPreviewWebhookBinding(other).pipe(Effect.exit);
    }).pipe(
      Effect.provide(
        layerPhotonWebhookBindingMemory(emptyPhotonWebhookBindingMemory)
      )
    );
    assert.strictEqual(Exit.isFailure(result), true);
  })
);

it.effect(
  "encodes the exact four Preview bindings and projects the provider acknowledgement",
  () =>
    Effect.gen(function* testPhotonWebhookBindingLiveContract() {
      const input = yield* fixture;
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          assert.strictEqual(
            request.headers["authorization"],
            "Bearer vercel-token-sentinel"
          );
          const url = new URL(request.url);
          assert.strictEqual(url.pathname, "/v10/projects/prj-agent/env");
          const params = globalThis.Array.from(request.urlParams);
          assert.strictEqual(
            params.some(
              ([key, value]) => key === "teamId" && value === "team-preview"
            ),
            true
          );
          assert.strictEqual(
            params.some(([key, value]) => key === "upsert" && value === "true"),
            true
          );
          if (request.body._tag !== "Uint8Array") {
            throw new Error("Expected one encoded Vercel JSON request.");
          }
          const body = new TextDecoder().decode(request.body.body);
          const decoded = Schema.decodeUnknownSync(
            Schema.fromJsonString(
              Schema.Array(
                Schema.Struct({
                  key: Schema.Literals([
                    "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
                    "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
                    "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
                    "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
                  ]),
                  value: Schema.NonEmptyString,
                  type: Schema.Literal("sensitive"),
                  target: Schema.Tuple([Schema.Literal("preview")]),
                })
              )
            )
          )(body);
          assert.strictEqual(decoded.length, 4);
          assert.strictEqual(
            decoded.find(
              (entry) => entry.key === "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET"
            )?.value,
            projectSecretSentinel
          );
          assert.strictEqual(
            decoded.find(
              (entry) => entry.key === "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET"
            )?.value,
            signingSecretSentinel
          );
          return HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                created: [
                  {
                    id: "env-photon-project-id",
                    key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
                    type: "sensitive",
                    target: ["preview"],
                    sensitive: true,
                    value: input.photonProjectId,
                  },
                  {
                    id: "env-photon-project-secret",
                    key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
                    type: "sensitive",
                    target: ["preview"],
                    sensitive: true,
                    value: projectSecretSentinel,
                  },
                  {
                    id: "env-photon-webhook-id",
                    key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
                    type: "sensitive",
                    target: ["preview"],
                    sensitive: true,
                    value: input.webhookId,
                  },
                  {
                    id: "env-photon-webhook-secret",
                    key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
                    type: "sensitive",
                    target: ["preview"],
                    sensitive: true,
                    value: signingSecretSentinel,
                  },
                ],
                failed: [],
              },
              {
                status: 201,
                headers: { "x-ratelimit-remaining": "99" },
              }
            )
          );
        })
      );

      const result = yield* Effect.gen(function* persistLiveBinding() {
        const sink = yield* PhotonWebhookBindingSink;
        return yield* sink.persistPreviewWebhookBinding(input);
      }).pipe(Effect.provide(layerLive(client)));
      assert.strictEqual(result.reference, "env-photon-webhook-secret");
      assert.strictEqual(String(result.revision), String(input.webhookId));
      assert.strictEqual(
        Inspectable.toStringUnknown(result).includes(signingSecretSentinel),
        false
      );
      assert.strictEqual(
        Inspectable.toStringUnknown(result).includes(projectSecretSentinel),
        false
      );
    })
);

it.effect(
  "accepts the documented 200 acknowledgement for an exact upsert",
  () =>
    Effect.gen(function* testPhotonWebhookBindingUpsertContract() {
      const input = yield* fixture;
      const mockClient = HttpClient.make((request) =>
        Effect.sync(() => {
          if (request.body._tag !== "Uint8Array") {
            throw new Error("Expected one encoded Vercel JSON request.");
          }
          const body = Schema.decodeUnknownSync(
            Schema.fromJsonString(
              Schema.Array(
                Schema.Struct({
                  key: Schema.String,
                  value: Schema.String,
                  type: Schema.String,
                  target: Schema.Array(Schema.String),
                })
              )
            )
          )(new TextDecoder().decode(request.body.body));
          return HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                created: body.map((entry, index) => ({
                  id: `env-upsert-${index}`,
                  key: entry.key,
                  type: entry.type,
                  target: entry.target,
                  sensitive: true,
                })),
                failed: [],
              },
              { status: 200 }
            )
          );
        })
      );

      const result = yield* PhotonWebhookBindingSink.pipe(
        Effect.flatMap((sink) => sink.persistPreviewWebhookBinding(input)),
        Effect.provide(layerLive(mockClient))
      );

      assert.strictEqual(
        result.owner,
        "bundjil-agent-preview-vercel-environment"
      );
    })
);

it.effect("classifies a partial Vercel acknowledgement as uncertain", () =>
  Effect.gen(function* testPhotonWebhookBindingLivePartialFailure() {
    const input = yield* fixture;
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          Response.json(
            {
              created: {
                id: "env-photon-webhook-id",
                key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
                type: "sensitive",
                target: ["preview"],
                sensitive: true,
              },
              failed: [
                {
                  error: {
                    code: "partial_write",
                    message: "synthetic partial failure",
                    key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
                  },
                },
              ],
            },
            { status: 201 }
          )
        )
      )
    );
    const exit = yield* Effect.gen(function* persistPartialBinding() {
      const sink = yield* PhotonWebhookBindingSink;
      return yield* sink.persistPreviewWebhookBinding(input);
    }).pipe(Effect.provide(layerLive(client)), Effect.exit);
    assert.strictEqual(Exit.isFailure(exit), true);
    assert.strictEqual(
      Inspectable.toStringUnknown(exit).includes(signingSecretSentinel),
      false
    );
    assert.strictEqual(
      Inspectable.toStringUnknown(exit).includes(projectSecretSentinel),
      false
    );
  })
);
