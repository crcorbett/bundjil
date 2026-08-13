import {
  PhotonProjectId,
  PhotonProjectSecret,
  PhotonWebhookId,
  PhotonWebhookSecret,
} from "@bundjil/photon/config";
import { Config, Effect, Layer, Match, Redacted, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { SecretReferenceId } from "../secret-reference.js";
import type { VercelAccessToken } from "./schemas.js";
import {
  VercelEnvironmentVariableAttributes,
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableKey,
  VercelEnvironmentVariableType,
  VercelEnvironmentVariableUpdatedAt,
} from "./schemas.js";
import { VercelCredentials } from "./services.js";
import {
  UpdateVercelStableEnvironmentVariable,
  VercelPreviewPhotonBindingValues,
  VercelPreviewPhotonSecretOwner,
  VercelProductionPhotonSecretOwner,
  VercelStableEnvironmentBindings,
  VercelStableEnvironmentReadError,
  VercelStableEnvironmentWriteError,
} from "./stable-environment.js";
import type {
  VercelStableEnvironmentFailureReason,
  VercelStableEnvironmentOperation,
  VercelStableEnvironmentProviderFailure,
  ResolveVercelPreviewPhotonValue,
} from "./stable-environment.js";

const VercelStableEnvironmentResponseHeaders = Schema.Struct({
  "retry-after": Schema.optional(Schema.String),
  "x-ratelimit-remaining": Schema.optional(Schema.String),
  "x-ratelimit-reset": Schema.optional(Schema.String),
});

const VercelStableEnvironmentFailureEnvelope = Schema.Struct({
  status: Schema.Literals([
    400, 401, 403, 404, 409, 412, 429, 500, 502, 503, 504,
  ]),
  headers: VercelStableEnvironmentResponseHeaders,
  body: Schema.Struct({
    error: Schema.Struct({
      code: Schema.optional(Schema.String),
      message: Schema.optional(Schema.String),
    }),
  }),
});

const VercelStableEnvironmentSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelStableEnvironmentResponseHeaders,
  body: Schema.Struct({
    id: VercelEnvironmentVariableId,
    key: VercelEnvironmentVariableKey,
    type: VercelEnvironmentVariableType,
    target: Schema.Array(
      Schema.Literals(["preview", "production", "development"])
    ),
    sensitive: Schema.optional(Schema.Boolean),
    updatedAt: VercelEnvironmentVariableUpdatedAt,
  }),
});

const VercelStableEnvironmentEnvelope = Schema.Union([
  VercelStableEnvironmentSuccessEnvelope,
  VercelStableEnvironmentFailureEnvelope,
]);

const VercelStableEnvironmentRequest = Schema.Union([
  Schema.Struct({
    target: Schema.Tuple([Schema.Literal("preview")]),
    type: Schema.Literal("sensitive"),
    value: Schema.NonEmptyString,
  }),
  Schema.Struct({
    target: Schema.Tuple([Schema.Literal("production")]),
    type: Schema.Literal("sensitive"),
    value: Schema.NonEmptyString,
  }),
]);

const previewProjectIdConfig = Config.schema(
  PhotonProjectId,
  "BUNDJIL_PHOTON_PREVIEW_PROJECT_ID"
);
const previewProjectSecretConfig = Config.schema(
  PhotonProjectSecret,
  "BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET"
);
const previewWebhookIdConfig = Config.schema(
  PhotonWebhookId,
  "BUNDJIL_PHOTON_PREVIEW_WEBHOOK_ID"
);
const previewWebhookSecretConfig = Config.schema(
  PhotonWebhookSecret,
  "BUNDJIL_PHOTON_PREVIEW_WEBHOOK_SECRET"
);
const productionProjectIdConfig = Config.schema(
  PhotonProjectId,
  "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID"
);
const productionProjectSecretConfig = Config.schema(
  PhotonProjectSecret,
  "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET"
);
const productionWebhookIdConfig = Config.schema(
  PhotonWebhookId,
  "BUNDJIL_PHOTON_PRODUCTION_WEBHOOK_ID"
);
const productionWebhookSecretConfig = Config.schema(
  PhotonWebhookSecret,
  "BUNDJIL_PHOTON_PRODUCTION_WEBHOOK_SECRET"
);

const stableEnvironmentUrl = (path: string) =>
  new URL(path, "https://api.vercel.com");

const withStableEnvironmentAuthorization = (
  request: HttpClientRequest.HttpClientRequest,
  token: VercelAccessToken
) =>
  request.pipe(
    HttpClientRequest.setHeader(
      "authorization",
      `Bearer ${Redacted.value(token)}`
    )
  );

const failureReason = (status: number): VercelStableEnvironmentFailureReason =>
  Match.value(status).pipe(
    Match.when(429, () => "rateLimited" as const),
    Match.when(
      (candidate) => candidate >= 500,
      () => "transient" as const
    ),
    Match.orElse(() => "requestFailed" as const)
  );

const writeFailure = (
  operation: VercelStableEnvironmentOperation,
  reason: VercelStableEnvironmentFailureReason,
  message: string,
  uncertain = false,
  providerFailure?: VercelStableEnvironmentProviderFailure
) =>
  new VercelStableEnvironmentWriteError({
    operation,
    reason,
    retry: uncertain ? "readbackRequired" : "never",
    certainty: uncertain
      ? { _tag: "Uncertain", recovery: "operatorReview" }
      : { _tag: "Known" },
    ...(providerFailure === undefined ? {} : { providerFailure }),
    message,
  });

export const VercelPreviewPhotonBindingValuesLive = Layer.succeed(
  VercelPreviewPhotonBindingValues,
  VercelPreviewPhotonBindingValues.of({
    resolvePreviewPhotonValue: Effect.fn(
      "VercelPreviewPhotonBindingValuesLive.resolvePreviewPhotonValue"
    )(function* (input: typeof ResolveVercelPreviewPhotonValue.Type) {
      const encodedReference = yield* Schema.encodeEffect(SecretReferenceId)(
        input.valueOwnership.reference.reference
      ).pipe(
        Effect.mapError(
          () =>
            new VercelStableEnvironmentReadError({
              operation: "resolvePreviewPhotonValue",
              reason: "identityMismatch",
              retry: "never",
              certainty: { _tag: "Known" },
              message:
                "The managed Preview Photon reference could not be encoded.",
            })
        )
      );
      const encodedEnvironmentVariableId = yield* Schema.encodeEffect(
        VercelEnvironmentVariableId
      )(input.environmentVariableId).pipe(
        Effect.mapError(
          () =>
            new VercelStableEnvironmentReadError({
              operation: "resolvePreviewPhotonValue",
              reason: "identityMismatch",
              retry: "never",
              certainty: { _tag: "Known" },
              message: "The Preview environment identity could not be encoded.",
            })
        )
      );
      if (
        input.valueOwnership.reference.owner !==
          Match.value(input.stage).pipe(
            Match.when("preview", () => VercelPreviewPhotonSecretOwner),
            Match.when("prod", () => VercelProductionPhotonSecretOwner),
            Match.exhaustive
          ) ||
        encodedReference !== encodedEnvironmentVariableId
      ) {
        return yield* new VercelStableEnvironmentReadError({
          operation: "resolvePreviewPhotonValue",
          reason: "identityMismatch",
          retry: "never",
          certainty: { _tag: "Known" },
          message:
            "The managed Preview Photon reference does not match the target environment identity.",
        });
      }
      return yield* Match.value(input.stage).pipe(
        Match.when("preview", () =>
          Match.value(input.key).pipe(
            Match.when("BUNDJIL_CHANNEL_PHOTON_PROJECT_ID", () =>
              previewProjectIdConfig.pipe(Effect.map(Redacted.make))
            ),
            Match.when(
              "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
              () => previewProjectSecretConfig
            ),
            Match.when("BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID", () =>
              previewWebhookIdConfig.pipe(Effect.map(Redacted.make))
            ),
            Match.when(
              "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
              () => previewWebhookSecretConfig
            ),
            Match.exhaustive
          )
        ),
        Match.when("prod", () =>
          Match.value(input.key).pipe(
            Match.when("BUNDJIL_CHANNEL_PHOTON_PROJECT_ID", () =>
              productionProjectIdConfig.pipe(Effect.map(Redacted.make))
            ),
            Match.when(
              "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
              () => productionProjectSecretConfig
            ),
            Match.when("BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID", () =>
              productionWebhookIdConfig.pipe(Effect.map(Redacted.make))
            ),
            Match.when(
              "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
              () => productionWebhookSecretConfig
            ),
            Match.exhaustive
          )
        ),
        Match.exhaustive,
        Effect.mapError(
          () =>
            new VercelStableEnvironmentReadError({
              operation: "resolvePreviewPhotonValue",
              reason: "requestFailed",
              retry: "never",
              certainty: { _tag: "Known" },
              message:
                "The exact managed Photon value is unavailable from stage-owned Config custody.",
            })
        )
      );
    }),
  })
);

export const VercelStableEnvironmentBindingsLive = Layer.effect(
  VercelStableEnvironmentBindings,
  Effect.gen(function* makeVercelStableEnvironmentBindingsLive() {
    const client = yield* HttpClient.HttpClient;
    const credentials = yield* VercelCredentials;

    const updateStableEnvironmentVariable = Effect.fn(
      "VercelStableEnvironmentBindingsLive.updateStableEnvironmentVariable"
    )(function* (input: typeof UpdateVercelStableEnvironmentVariable.Type) {
      const encoded = yield* Schema.encodeEffect(
        UpdateVercelStableEnvironmentVariable
      )(input).pipe(
        Effect.mapError(() =>
          writeFailure(
            "updateStableEnvironmentVariable",
            "requestFailed",
            "The stable environment write could not be encoded."
          )
        )
      );
      const token = yield* credentials
        .accessToken({ _tag: "Project", projectId: input.projectId })
        .pipe(
          Effect.mapError(() =>
            writeFailure(
              "updateStableEnvironmentVariable",
              "requestFailed",
              "Vercel stable environment credentials are unavailable."
            )
          )
        );
      const request = yield* HttpClientRequest.patch(
        stableEnvironmentUrl(
          `/v9/projects/${encoded.projectId}/env/${encoded.environmentVariableId}`
        )
      ).pipe(
        HttpClientRequest.setUrlParam("teamId", encoded.teamId),
        HttpClientRequest.schemaBodyJson(VercelStableEnvironmentRequest)(
          Match.value(encoded.stage).pipe(
            Match.when("preview", () => ({
              target: ["preview"] as const,
              type: "sensitive" as const,
              value: Redacted.value(input.value),
            })),
            Match.when("prod", () => ({
              target: ["production"] as const,
              type: "sensitive" as const,
              value: Redacted.value(input.value),
            })),
            Match.exhaustive
          )
        ),
        Effect.mapError(() =>
          writeFailure(
            "updateStableEnvironmentVariable",
            "requestFailed",
            "The stable environment request body could not be encoded."
          )
        )
      );
      const response = yield* client
        .execute(withStableEnvironmentAuthorization(request, token))
        .pipe(
          Effect.flatMap(
            HttpClientResponse.schemaJson(VercelStableEnvironmentEnvelope)
          ),
          Effect.mapError(() =>
            writeFailure(
              "updateStableEnvironmentVariable",
              "uncertainOutcome",
              "Vercel did not return a complete stable environment response.",
              true
            )
          )
        );
      if (response.status !== 200) {
        return yield* writeFailure(
          "updateStableEnvironmentVariable",
          failureReason(response.status),
          `Vercel rejected the stable environment update (status ${response.status}; code present: ${response.body.error.code !== undefined}; message present: ${response.body.error.message !== undefined}).`,
          false,
          {
            status: response.status,
            codePresent: response.body.error.code !== undefined,
            messagePresent: response.body.error.message !== undefined,
          }
        );
      }
      if (
        response.body.id !== input.environmentVariableId ||
        response.body.key !== input.key ||
        response.body.type !== "sensitive" ||
        response.body.target.length !== 1 ||
        response.body.target[0] !== input.targets[0] ||
        response.body.sensitive === false
      ) {
        return yield* writeFailure(
          "updateStableEnvironmentVariable",
          "invalidResponse",
          "Vercel returned different stable environment metadata.",
          true
        );
      }
      return VercelEnvironmentVariableAttributes.make({
        stage: input.stage,
        teamId: input.teamId,
        projectId: input.projectId,
        environmentVariableId: response.body.id,
        key: response.body.key,
        type: response.body.type,
        targets: response.body.target,
        sensitive: true,
        providerUpdatedAt: response.body.updatedAt,
        valueOwnership: input.valueOwnership,
        deploymentRequired: true,
        ownership: "Owned",
      });
    });

    return VercelStableEnvironmentBindings.of({
      updateStableEnvironmentVariable,
    });
  })
);
