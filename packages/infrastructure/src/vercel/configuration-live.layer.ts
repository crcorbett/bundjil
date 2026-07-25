/* oxlint-disable unicorn/no-array-method-this-argument -- Effect Array data-first combinators are not native Array methods with a thisArg. */

import { Array, Effect, Layer, Match, Option, Redacted, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import {
  CreateVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewFeedback,
  SetVercelPreviewFeedback,
  VercelPreviewConfiguration,
  VercelPreviewConfigurationReadError,
  VercelPreviewConfigurationWriteError,
  VercelPreviewEnvironmentMetadataAttributes,
  VercelPreviewEnvironmentMetadataObservation,
  VercelPreviewFeedbackAttributes,
  VercelPreviewFeedbackObservation,
} from "./configuration.js";
import type {
  DeleteVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewEnvironmentMetadata,
  VercelPreviewConfigurationOperation,
} from "./configuration.js";
import type { VercelAccessToken } from "./live.layer.js";
import { VercelCredentials } from "./live.layer.js";
import {
  ListVercelEnvironmentVariables,
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableKey,
  VercelEnvironmentVariableType,
  VercelProjectId,
} from "./schemas.js";
import { VercelEnvironmentVariables } from "./services.js";

const VercelConfigurationResponseHeaders = Schema.Struct({
  "x-ratelimit-remaining": Schema.optional(Schema.String),
  "x-ratelimit-reset": Schema.optional(Schema.String),
  "retry-after": Schema.optional(Schema.String),
});

const VercelConfigurationErrorBody = Schema.Struct({
  error: Schema.Struct({
    code: Schema.optional(Schema.String),
    message: Schema.optional(Schema.String),
  }),
});

const VercelConfigurationFailureEnvelope = Schema.Struct({
  status: Schema.Literals([
    400, 401, 403, 404, 409, 412, 429, 500, 502, 503, 504,
  ]),
  headers: VercelConfigurationResponseHeaders,
  body: VercelConfigurationErrorBody,
});

const VercelPreviewFeedbackSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelConfigurationResponseHeaders,
  body: Schema.Struct({
    id: VercelProjectId,
    enablePreviewFeedback: Schema.optional(Schema.NullOr(Schema.Boolean)),
    enableProductionFeedback: Schema.optional(Schema.NullOr(Schema.Boolean)),
  }),
});

const VercelPreviewFeedbackEnvelope = Schema.Union([
  VercelPreviewFeedbackSuccessEnvelope,
  VercelConfigurationFailureEnvelope,
]);

const VercelPreviewFeedbackRequest = Schema.Struct({
  enablePreviewFeedback: Schema.NullOr(Schema.Boolean),
  enableProductionFeedback: Schema.NullOr(Schema.Boolean),
});

const VercelCreatePreviewEnvironmentRequest = Schema.Struct({
  key: Schema.String,
  value: Schema.NonEmptyString,
  type: Schema.Literal("plain"),
  target: Schema.Tuple([Schema.Literal("preview")]),
});

const VercelProviderCreatedEnvironment = Schema.Struct({
  id: VercelEnvironmentVariableId,
  key: VercelEnvironmentVariableKey,
  type: VercelEnvironmentVariableType,
  target: Schema.Union([
    Schema.Literal("preview"),
    Schema.Array(Schema.Literals(["preview", "production", "development"])),
  ]),
  sensitive: Schema.optional(Schema.Boolean),
  value: Schema.optional(Schema.String),
});

const VercelCreatePreviewEnvironmentSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(201),
  headers: VercelConfigurationResponseHeaders,
  body: Schema.Struct({
    created: Schema.Union([
      VercelProviderCreatedEnvironment,
      Schema.Array(VercelProviderCreatedEnvironment),
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

const VercelCreatePreviewEnvironmentEnvelope = Schema.Union([
  VercelCreatePreviewEnvironmentSuccessEnvelope,
  VercelConfigurationFailureEnvelope,
]);

const VercelRemovedEnvironment = Schema.Struct({
  id: Schema.optional(VercelEnvironmentVariableId),
  key: Schema.optional(VercelEnvironmentVariableKey),
  type: Schema.optional(VercelEnvironmentVariableType),
  value: Schema.optional(Schema.String),
});

const VercelDeletePreviewEnvironmentSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelConfigurationResponseHeaders,
  body: Schema.Union([
    VercelRemovedEnvironment,
    Schema.Array(Schema.NullOr(VercelRemovedEnvironment)),
  ]),
});

const VercelDeletePreviewEnvironmentEnvelope = Schema.Union([
  VercelDeletePreviewEnvironmentSuccessEnvelope,
  VercelConfigurationFailureEnvelope,
]);

const vercelConfigurationUrl = (path: string) =>
  new URL(path, "https://api.vercel.com");

const withConfigurationAuthorization = (
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
    Match.when(404, () => "notFound" as const),
    Match.when(429, () => "rateLimited" as const),
    Match.when(
      (candidate) => candidate >= 500,
      () => "transient" as const
    ),
    Match.orElse(() => "requestFailed" as const)
  );

const readFailureReason = (
  reason:
    | "notFound"
    | "ambiguous"
    | "teamMismatch"
    | "rateLimited"
    | "transient"
    | "invalidResponse"
    | "requestFailed"
    | "writeForbidden"
) =>
  Match.value(reason).pipe(
    Match.when("teamMismatch", () => "identityMismatch" as const),
    Match.when("writeForbidden", () => "requestFailed" as const),
    Match.orElse((candidate) => candidate)
  );

const writeFailure = (
  operation: VercelPreviewConfigurationOperation,
  message: string,
  options?: {
    readonly reason?: "invalidResponse" | "requestFailed" | "uncertainOutcome";
    readonly uncertain?: boolean;
  }
) =>
  new VercelPreviewConfigurationWriteError({
    operation,
    reason: options?.reason ?? "requestFailed",
    retry: options?.uncertain === true ? "readbackRequired" : "never",
    certainty:
      options?.uncertain === true
        ? {
            _tag: "Uncertain",
            recovery: "observeByPhysicalIdentity",
          }
        : { _tag: "Known" },
    message,
  });

export const VercelPreviewConfigurationLive = Layer.effect(
  VercelPreviewConfiguration,
  Effect.gen(function* makeVercelPreviewConfigurationLive() {
    const client = yield* HttpClient.HttpClient;
    const credentials = yield* VercelCredentials;
    const environmentVariables = yield* VercelEnvironmentVariables;

    const tokenFor = Effect.fn("VercelPreviewConfigurationLive.tokenFor")(
      (operation: VercelPreviewConfigurationOperation) =>
        credentials.pipe(
          Effect.mapError(() =>
            writeFailure(
              operation,
              "Vercel Preview configuration credentials are unavailable."
            )
          )
        )
    );

    const observePreviewFeedback = Effect.fn(
      "VercelPreviewConfigurationLive.observePreviewFeedback"
    )(function* (input: typeof ObserveVercelPreviewFeedback.Type) {
      const encoded = yield* Schema.encodeEffect(ObserveVercelPreviewFeedback)(
        input
      ).pipe(
        Effect.mapError(
          () =>
            new VercelPreviewConfigurationReadError({
              operation: "observePreviewFeedback",
              reason: "requestFailed",
              retry: "never",
              certainty: { _tag: "Known" },
              message: "The Preview feedback observation could not be encoded.",
            })
        )
      );
      const token = yield* tokenFor("observePreviewFeedback").pipe(
        Effect.mapError(
          (failure) =>
            new VercelPreviewConfigurationReadError({
              operation: "observePreviewFeedback",
              reason: failure.reason,
              retry: failure.retry,
              certainty: failure.certainty,
              message: failure.message,
            })
        )
      );
      const response = yield* client
        .execute(
          withConfigurationAuthorization(
            HttpClientRequest.get(
              vercelConfigurationUrl(`/v9/projects/${encoded.projectId}`)
            ).pipe(HttpClientRequest.setUrlParam("teamId", encoded.teamId)),
            token
          )
        )
        .pipe(
          Effect.flatMap(
            HttpClientResponse.schemaJson(VercelPreviewFeedbackEnvelope)
          ),
          Effect.mapError(
            () =>
              new VercelPreviewConfigurationReadError({
                operation: "observePreviewFeedback",
                reason: "invalidResponse",
                retry: "never",
                certainty: { _tag: "Known" },
                message:
                  "Vercel returned an invalid Preview feedback envelope.",
              })
          )
        );
      if (response.status === 404) {
        return VercelPreviewFeedbackObservation.make({
          _tag: "Missing",
          stage: input.stage,
          teamId: input.teamId,
          projectId: input.projectId,
        });
      }
      if (response.status !== 200) {
        return yield* new VercelPreviewConfigurationReadError({
          operation: "observePreviewFeedback",
          reason: failureReason(response.status),
          retry:
            response.status === 429 || response.status >= 500
              ? "backoff"
              : "never",
          certainty: { _tag: "Known" },
          message: "Vercel could not observe Preview feedback.",
        });
      }
      if (response.body.id !== input.projectId) {
        return yield* new VercelPreviewConfigurationReadError({
          operation: "observePreviewFeedback",
          reason: "identityMismatch",
          retry: "never",
          certainty: { _tag: "Known" },
          message: "Vercel returned a different project identity.",
        });
      }
      return VercelPreviewFeedbackObservation.make({
        _tag: "Found",
        attributes: VercelPreviewFeedbackAttributes.make({
          stage: input.stage,
          teamId: input.teamId,
          projectId: input.projectId,
          enabled: response.body.enablePreviewFeedback ?? null,
          productionEnabled: response.body.enableProductionFeedback ?? null,
          ownership: "Owned",
        }),
      });
    });

    const setPreviewFeedback = Effect.fn(
      "VercelPreviewConfigurationLive.setPreviewFeedback"
    )(function* (input: typeof SetVercelPreviewFeedback.Type) {
      const encoded = yield* Schema.encodeEffect(SetVercelPreviewFeedback)(
        input
      ).pipe(
        Effect.mapError(() =>
          writeFailure(
            "setPreviewFeedback",
            "The Preview feedback mutation could not be encoded."
          )
        )
      );
      const token = yield* tokenFor("setPreviewFeedback");
      const request = yield* HttpClientRequest.patch(
        vercelConfigurationUrl(`/v9/projects/${encoded.projectId}`)
      ).pipe(
        HttpClientRequest.setUrlParam("teamId", encoded.teamId),
        HttpClientRequest.schemaBodyJson(VercelPreviewFeedbackRequest)({
          enablePreviewFeedback: encoded.desired,
          enableProductionFeedback: encoded.productionGuard,
        }),
        Effect.mapError(() =>
          writeFailure(
            "setPreviewFeedback",
            "The Preview feedback request body could not be encoded."
          )
        ),
        Effect.map((candidate) =>
          withConfigurationAuthorization(candidate, token)
        )
      );
      const response = yield* client.execute(request).pipe(
        Effect.flatMap(
          HttpClientResponse.schemaJson(VercelPreviewFeedbackEnvelope)
        ),
        Effect.mapError(() =>
          writeFailure(
            "setPreviewFeedback",
            "The Preview feedback mutation outcome is uncertain.",
            { reason: "uncertainOutcome", uncertain: true }
          )
        )
      );
      if (response.status !== 200) {
        return yield* new VercelPreviewConfigurationWriteError({
          operation: "setPreviewFeedback",
          reason: failureReason(response.status),
          retry:
            response.status === 429 || response.status >= 500
              ? "backoff"
              : "never",
          certainty: { _tag: "Known" },
          message: "Vercel rejected the Preview feedback mutation.",
        });
      }
      if (
        response.body.id !== input.projectId ||
        (response.body.enablePreviewFeedback ?? null) !== input.desired ||
        (response.body.enableProductionFeedback ?? null) !==
          input.productionGuard
      ) {
        return yield* writeFailure(
          "setPreviewFeedback",
          "Vercel did not return the requested Preview feedback state.",
          { reason: "invalidResponse" }
        );
      }
      return VercelPreviewFeedbackAttributes.make({
        stage: input.stage,
        teamId: input.teamId,
        projectId: input.projectId,
        enabled: input.desired,
        productionEnabled: input.productionGuard,
        ownership: "Owned",
      });
    });

    const observePreviewEnvironmentMetadata = Effect.fn(
      "VercelPreviewConfigurationLive.observePreviewEnvironmentMetadata"
    )(function* (input: typeof ObserveVercelPreviewEnvironmentMetadata.Type) {
      const listed = yield* environmentVariables
        .listEnvironmentVariables(
          ListVercelEnvironmentVariables.make({
            stage: input.stage,
            teamId: input.teamId,
            projectId: input.projectId,
          })
        )
        .pipe(
          Effect.mapError(
            (failure) =>
              new VercelPreviewConfigurationReadError({
                operation: "observePreviewEnvironmentMetadata",
                reason: readFailureReason(failure.reason),
                retry: failure.retry === "backoff" ? "backoff" : "never",
                certainty: { _tag: "Known" },
                message:
                  "Vercel could not list scoped Preview environment metadata.",
              })
          )
        );
      const matches = Array.filter(
        listed.environmentVariables,
        (candidate) =>
          candidate.key === input.key &&
          Array.contains(candidate.targets, "preview")
      );
      if (matches.length > 1) {
        return yield* new VercelPreviewConfigurationReadError({
          operation: "observePreviewEnvironmentMetadata",
          reason: "ambiguous",
          retry: "never",
          certainty: { _tag: "Known" },
          message:
            "More than one Preview environment variable matched the key.",
        });
      }
      return Option.match(Array.head(matches), {
        onNone: () =>
          VercelPreviewEnvironmentMetadataObservation.make({
            _tag: "Missing",
            stage: input.stage,
            teamId: input.teamId,
            projectId: input.projectId,
            key: input.key,
          }),
        onSome: (candidate) =>
          candidate.type === "plain" &&
          candidate.targets.length === 1 &&
          candidate.targets[0] === "preview" &&
          !candidate.sensitive
            ? VercelPreviewEnvironmentMetadataObservation.make({
                _tag: "Found",
                attributes: VercelPreviewEnvironmentMetadataAttributes.make({
                  stage: input.stage,
                  teamId: input.teamId,
                  projectId: input.projectId,
                  environmentVariableId: candidate.environmentVariableId,
                  key: candidate.key,
                  type: "plain",
                  targets: ["preview"],
                  sensitive: false,
                  ownership: "Owned",
                }),
              })
            : VercelPreviewEnvironmentMetadataObservation.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                projectId: input.projectId,
                key: input.key,
              }),
      });
    });

    const createPreviewEnvironmentMetadata = Effect.fn(
      "VercelPreviewConfigurationLive.createPreviewEnvironmentMetadata"
    )(function* (input: typeof CreateVercelPreviewEnvironmentMetadata.Type) {
      const encoded = yield* Schema.encodeEffect(
        CreateVercelPreviewEnvironmentMetadata
      )(input).pipe(
        Effect.mapError(() =>
          writeFailure(
            "createPreviewEnvironmentMetadata",
            "The Preview environment mutation could not be encoded."
          )
        )
      );
      const token = yield* tokenFor("createPreviewEnvironmentMetadata");
      const request = yield* HttpClientRequest.post(
        vercelConfigurationUrl(`/v10/projects/${encoded.projectId}/env`)
      ).pipe(
        HttpClientRequest.setUrlParam("teamId", encoded.teamId),
        HttpClientRequest.schemaBodyJson(VercelCreatePreviewEnvironmentRequest)(
          {
            key: encoded.key,
            value: encoded.value,
            type: "plain",
            target: ["preview"],
          }
        ),
        Effect.mapError(() =>
          writeFailure(
            "createPreviewEnvironmentMetadata",
            "The Preview environment request body could not be encoded."
          )
        ),
        Effect.map((candidate) =>
          withConfigurationAuthorization(candidate, token)
        )
      );
      const response = yield* client.execute(request).pipe(
        Effect.flatMap(
          HttpClientResponse.schemaJson(VercelCreatePreviewEnvironmentEnvelope)
        ),
        Effect.mapError(() =>
          writeFailure(
            "createPreviewEnvironmentMetadata",
            "The Preview environment mutation outcome is uncertain.",
            { reason: "uncertainOutcome", uncertain: true }
          )
        )
      );
      if (response.status !== 201) {
        return yield* new VercelPreviewConfigurationWriteError({
          operation: "createPreviewEnvironmentMetadata",
          reason: failureReason(response.status),
          retry:
            response.status === 429 || response.status >= 500
              ? "backoff"
              : "never",
          certainty: { _tag: "Known" },
          message: "Vercel rejected the Preview environment mutation.",
        });
      }
      const created = Array.ensure(response.body.created);
      if (
        created.length !== 1 ||
        response.body.failed.length !== 0 ||
        created[0]?.key !== input.key ||
        created[0]?.type !== "plain" ||
        !(
          created[0]?.target === "preview" ||
          (created[0]?.target.length === 1 &&
            created[0].target[0] === "preview")
        )
      ) {
        return yield* writeFailure(
          "createPreviewEnvironmentMetadata",
          "Vercel did not return one exact Preview-only environment resource.",
          { reason: "invalidResponse" }
        );
      }
      return VercelPreviewEnvironmentMetadataAttributes.make({
        stage: input.stage,
        teamId: input.teamId,
        projectId: input.projectId,
        environmentVariableId: created[0].id,
        key: created[0].key,
        type: "plain",
        targets: ["preview"],
        sensitive: false,
        ownership: "Owned",
      });
    });

    const deletePreviewEnvironmentMetadata = Effect.fn(
      "VercelPreviewConfigurationLive.deletePreviewEnvironmentMetadata"
    )(function* (input: DeleteVercelPreviewEnvironmentMetadata) {
      if (input.destructivePolicy._tag !== "Permitted") {
        return yield* new VercelPreviewConfigurationWriteError({
          operation: "deletePreviewEnvironmentMetadata",
          reason: "protected",
          retry: "never",
          certainty: { _tag: "Known" },
          message:
            "Preview environment deletion requires the exact approval receipt.",
        });
      }
      const token = yield* tokenFor("deletePreviewEnvironmentMetadata");
      const encoded = yield* Schema.encodeEffect(
        VercelPreviewEnvironmentMetadataAttributes
      )(input.attributes).pipe(
        Effect.mapError(() =>
          writeFailure(
            "deletePreviewEnvironmentMetadata",
            "The Preview environment deletion identity could not be encoded."
          )
        )
      );
      const response = yield* client
        .execute(
          withConfigurationAuthorization(
            HttpClientRequest.delete(
              vercelConfigurationUrl(
                `/v10/projects/${encoded.projectId}/env/${encoded.environmentVariableId}`
              )
            ).pipe(HttpClientRequest.setUrlParam("teamId", encoded.teamId)),
            token
          )
        )
        .pipe(
          Effect.flatMap(
            HttpClientResponse.schemaJson(
              VercelDeletePreviewEnvironmentEnvelope
            )
          ),
          Effect.mapError(() =>
            writeFailure(
              "deletePreviewEnvironmentMetadata",
              "The Preview environment deletion outcome is uncertain.",
              { reason: "uncertainOutcome", uncertain: true }
            )
          )
        );
      if (response.status !== 200) {
        return yield* new VercelPreviewConfigurationWriteError({
          operation: "deletePreviewEnvironmentMetadata",
          reason: failureReason(response.status),
          retry:
            response.status === 429 || response.status >= 500
              ? "backoff"
              : "never",
          certainty: { _tag: "Known" },
          message: "Vercel rejected the exact Preview environment deletion.",
        });
      }
      return yield* Effect.void;
    });

    return {
      observePreviewFeedback,
      setPreviewFeedback,
      observePreviewEnvironmentMetadata,
      createPreviewEnvironmentMetadata,
      deletePreviewEnvironmentMetadata,
    };
  })
);

export type VercelPreviewConfigurationLiveRequirements =
  | HttpClient.HttpClient
  | VercelCredentials
  | VercelEnvironmentVariables;
