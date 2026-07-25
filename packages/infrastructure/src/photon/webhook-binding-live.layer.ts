/* oxlint-disable unicorn/no-array-method-this-argument -- Effect Array data-first combinators are not native Array methods with a thisArg. */

import { Array, Effect, Layer, Match, Redacted, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import {
  SecretOwner,
  SecretReference,
  SecretReferenceId,
  SecretRevision,
} from "../secret-reference.js";
import type { VercelAccessToken } from "../vercel/live.layer.js";
import {
  VercelCredentials,
  VercelCredentialsLive,
} from "../vercel/live.layer.js";
import {
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableKey,
} from "../vercel/schemas.js";
import {
  PhotonWebhookBindingSink,
  PhotonWebhookBindingWrite,
  PhotonWebhookBindingWriteError,
} from "./webhook-binding.js";
import type { PhotonWebhookBindingOperation } from "./webhook-binding.js";

export const PhotonWebhookIdEnvironmentKey = VercelEnvironmentVariableKey.make(
  "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID"
);
export const PhotonWebhookSecretEnvironmentKey =
  VercelEnvironmentVariableKey.make("BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET");

const PhotonWebhookBindingResponseHeaders = Schema.Struct({
  "x-ratelimit-remaining": Schema.optional(Schema.String),
  "x-ratelimit-reset": Schema.optional(Schema.String),
  "retry-after": Schema.optional(Schema.String),
});

const PhotonWebhookBindingProviderError = Schema.Struct({
  error: Schema.Struct({
    code: Schema.optional(Schema.String),
    message: Schema.optional(Schema.String),
  }),
});

const PhotonWebhookBindingFailureEnvelope = Schema.Struct({
  status: Schema.Literals([
    400, 401, 403, 404, 409, 412, 429, 500, 502, 503, 504,
  ]),
  headers: PhotonWebhookBindingResponseHeaders,
  body: PhotonWebhookBindingProviderError,
});

const VercelPhotonWebhookBindingEnvironmentRequest = Schema.Struct({
  key: Schema.Union([
    Schema.Literal("BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID"),
    Schema.Literal("BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET"),
  ]),
  value: Schema.NonEmptyString,
  type: Schema.Literal("sensitive"),
  target: Schema.Tuple([Schema.Literal("preview")]),
});

const VercelPhotonWebhookBindingRequest = Schema.Array(
  VercelPhotonWebhookBindingEnvironmentRequest
).pipe(Schema.check(Schema.isLengthBetween(2, 2)));

const VercelPhotonWebhookBindingCreatedEnvironment = Schema.Struct({
  id: VercelEnvironmentVariableId,
  key: VercelEnvironmentVariableKey,
  type: Schema.Literal("sensitive"),
  target: Schema.Union([
    Schema.Literal("preview"),
    Schema.Array(Schema.Literals(["preview", "production", "development"])),
  ]),
  sensitive: Schema.optional(Schema.Boolean),
  value: Schema.optional(Schema.String),
});

const VercelPhotonWebhookBindingSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(201),
  headers: PhotonWebhookBindingResponseHeaders,
  body: Schema.Struct({
    created: Schema.Union([
      VercelPhotonWebhookBindingCreatedEnvironment,
      Schema.Array(VercelPhotonWebhookBindingCreatedEnvironment),
    ]),
    failed: Schema.Array(
      Schema.Struct({
        error: Schema.Struct({
          code: Schema.String,
          message: Schema.String,
          key: Schema.optional(Schema.String),
        }),
      })
    ),
  }),
});

const VercelPhotonWebhookBindingEnvelope = Schema.Union([
  VercelPhotonWebhookBindingSuccessEnvelope,
  PhotonWebhookBindingFailureEnvelope,
]);

const owner = SecretOwner.make("bundjil-agent-preview-vercel-environment");

const vercelUrl = (path: string) => new URL(path, "https://api.vercel.com");

const withAuthorization = (
  request: HttpClientRequest.HttpClientRequest,
  token: VercelAccessToken
) =>
  request.pipe(
    HttpClientRequest.setHeader(
      "authorization",
      `Bearer ${Redacted.value(token)}`
    )
  );

const failureReason = (status: number) =>
  Match.value(status).pipe(
    Match.when(409, () => "conflict" as const),
    Match.when(429, () => "rateLimited" as const),
    Match.when(
      (candidate) => candidate >= 500,
      () => "transient" as const
    ),
    Match.orElse(() => "requestFailed" as const)
  );

const knownFailure = (
  operation: PhotonWebhookBindingOperation,
  reason:
    | "ambiguous"
    | "conflict"
    | "rateLimited"
    | "transient"
    | "invalidResponse"
    | "requestFailed",
  message: string
) =>
  new PhotonWebhookBindingWriteError({
    operation,
    reason,
    retry:
      reason === "rateLimited" || reason === "transient" ? "backoff" : "never",
    certainty: { _tag: "Known" },
    message,
  });

const uncertainFailure = (message: string) =>
  new PhotonWebhookBindingWriteError({
    operation: "persistPreviewWebhookBinding",
    reason: "uncertainOutcome",
    retry: "readbackRequired",
    certainty: {
      _tag: "Uncertain",
      recovery: "observeByPhysicalIdentity",
    },
    message,
  });

const exactPreviewTarget = (
  target: "preview" | readonly ("preview" | "production" | "development")[]
) => target === "preview" || (target.length === 1 && target[0] === "preview");

export const PhotonWebhookBindingSinkLive = Layer.effect(
  PhotonWebhookBindingSink,
  Effect.gen(function* makePhotonWebhookBindingSinkLive() {
    const client = yield* HttpClient.HttpClient;
    const credentials = yield* VercelCredentials;

    const persistPreviewWebhookBinding = Effect.fn(
      "PhotonWebhookBindingSinkLive.persistPreviewWebhookBinding"
    )(function* (input: typeof PhotonWebhookBindingWrite.Type) {
      const encoded = yield* Schema.encodeEffect(PhotonWebhookBindingWrite)(
        input
      ).pipe(
        Effect.mapError(() =>
          knownFailure(
            "persistPreviewWebhookBinding",
            "requestFailed",
            "The Preview Photon binding request could not be encoded."
          )
        )
      );
      const token = yield* credentials.pipe(
        Effect.mapError(() =>
          knownFailure(
            "persistPreviewWebhookBinding",
            "requestFailed",
            "Vercel binding credentials are unavailable."
          )
        )
      );
      const request = yield* HttpClientRequest.post(
        vercelUrl(`/v10/projects/${encoded.vercelProjectId}/env`)
      ).pipe(
        HttpClientRequest.setUrlParam("teamId", encoded.teamId),
        HttpClientRequest.setUrlParam("upsert", "true"),
        HttpClientRequest.schemaBodyJson(VercelPhotonWebhookBindingRequest)([
          {
            key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
            value: encoded.webhookId,
            type: "sensitive",
            target: ["preview"],
          },
          {
            key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
            value: Redacted.value(encoded.signingSecret),
            type: "sensitive",
            target: ["preview"],
          },
        ]),
        Effect.mapError(() =>
          knownFailure(
            "persistPreviewWebhookBinding",
            "requestFailed",
            "The Vercel binding request body could not be encoded."
          )
        ),
        Effect.map((candidate) => withAuthorization(candidate, token))
      );
      const response = yield* client.execute(request).pipe(
        Effect.flatMap(
          HttpClientResponse.schemaJson(VercelPhotonWebhookBindingEnvelope)
        ),
        Effect.mapError(() =>
          uncertainFailure(
            "The Vercel Preview binding mutation outcome is uncertain."
          )
        )
      );
      if (response.status !== 201) {
        return yield* knownFailure(
          "persistPreviewWebhookBinding",
          failureReason(response.status),
          "Vercel rejected the Preview Photon binding mutation."
        );
      }

      const created = Array.ensure(response.body.created);
      const webhookIdEntries = Array.filter(
        created,
        (candidate) => candidate.key === PhotonWebhookIdEnvironmentKey
      );
      const secretEntries = Array.filter(
        created,
        (candidate) => candidate.key === PhotonWebhookSecretEnvironmentKey
      );
      if (
        response.body.failed.length !== 0 ||
        created.length !== 2 ||
        webhookIdEntries.length !== 1 ||
        secretEntries.length !== 1
      ) {
        return yield* uncertainFailure(
          "Vercel returned a partial Preview Photon binding acknowledgement."
        );
      }
      const [webhookIdEntry] = webhookIdEntries;
      const [secretEntry] = secretEntries;
      if (
        webhookIdEntry === undefined ||
        secretEntry === undefined ||
        !exactPreviewTarget(webhookIdEntry.target) ||
        !exactPreviewTarget(secretEntry.target) ||
        webhookIdEntry.sensitive === false ||
        secretEntry.sensitive === false
      ) {
        return yield* knownFailure(
          "persistPreviewWebhookBinding",
          "invalidResponse",
          "Vercel did not acknowledge two exact Preview-only sensitive bindings."
        );
      }

      const reference = yield* Schema.decodeUnknownEffect(SecretReferenceId)(
        secretEntry.id
      ).pipe(
        Effect.mapError(() =>
          knownFailure(
            "persistPreviewWebhookBinding",
            "invalidResponse",
            "The Vercel secret reference identity was invalid."
          )
        )
      );
      const revision = yield* Schema.decodeUnknownEffect(SecretRevision)(
        encoded.webhookId
      ).pipe(
        Effect.mapError(() =>
          knownFailure(
            "persistPreviewWebhookBinding",
            "invalidResponse",
            "The Photon secret revision identity was invalid."
          )
        )
      );
      return SecretReference.make({ owner, reference, revision });
    });

    return PhotonWebhookBindingSink.of({ persistPreviewWebhookBinding });
  })
);

export const layerPhotonWebhookBindingSinkLive =
  PhotonWebhookBindingSinkLive.pipe(Layer.provideMerge(VercelCredentialsLive));
