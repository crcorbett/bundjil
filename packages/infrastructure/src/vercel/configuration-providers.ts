import type { Resource } from "alchemy";
import { Unowned } from "alchemy/AdoptPolicy";
import { isResolved } from "alchemy/Diff";
import * as Provider from "alchemy/Provider";
import { Resource as makeResource } from "alchemy/Resource";
import { Effect, Layer, Match, Schedule, Schema } from "effect";

import {
  CreateVercelPreviewEnvironmentMetadata,
  DeleteVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewEnvironmentMetadata,
  ObserveVercelPreviewFeedback,
  SetVercelPreviewFeedback,
  VercelPreviewConfiguration,
  VercelPreviewConfigurationWriteError,
  VercelPreviewEnvironmentMetadataProps,
  VercelPreviewFeedbackProps,
} from "./configuration.js";
import type {
  VercelPreviewEnvironmentMetadataAttributes as VercelPreviewEnvironmentMetadataAttributesType,
  VercelPreviewEnvironmentMetadataProps as VercelPreviewEnvironmentMetadataPropsType,
  VercelPreviewFeedbackAttributes as VercelPreviewFeedbackAttributesType,
  VercelPreviewFeedbackProps as VercelPreviewFeedbackPropsType,
} from "./configuration.js";

const missingConfigurationResource = undefined;
const VercelConfigurationNoopDiff = Schema.Struct({
  action: Schema.Literal("noop"),
});
const VercelConfigurationUpdateDiff = Schema.Struct({
  action: Schema.Literal("update"),
});
const VercelConfigurationReplaceDiff = Schema.Struct({
  action: Schema.Literal("replace"),
});

export type VercelPreviewFeedback = Resource<
  "Bundjil.Infrastructure.VercelPreviewFeedback",
  VercelPreviewFeedbackPropsType,
  VercelPreviewFeedbackAttributesType
>;

export const VercelPreviewFeedback = makeResource<VercelPreviewFeedback>(
  "Bundjil.Infrastructure.VercelPreviewFeedback",
  { defaultRemovalPolicy: "retain" }
);

export type VercelPreviewEnvironmentMetadata = Resource<
  "Bundjil.Infrastructure.VercelPreviewEnvironmentMetadata",
  VercelPreviewEnvironmentMetadataPropsType,
  VercelPreviewEnvironmentMetadataAttributesType
>;

export const VercelPreviewEnvironmentMetadata =
  makeResource<VercelPreviewEnvironmentMetadata>(
    "Bundjil.Infrastructure.VercelPreviewEnvironmentMetadata",
    { defaultRemovalPolicy: "retain" }
  );

const feedbackReadback = Effect.fn("VercelPreviewFeedbackProvider.readback")(
  function* (input: VercelPreviewFeedbackPropsType) {
    const configuration = yield* VercelPreviewConfiguration;
    const observed = yield* configuration.observePreviewFeedback(
      ObserveVercelPreviewFeedback.make(input)
    );
    return yield* Match.value(observed).pipe(
      Match.tag("Missing", () =>
        Effect.fail(
          new VercelPreviewConfigurationWriteError({
            operation: "setPreviewFeedback",
            reason: "notFound",
            retry: "backoff",
            certainty: {
              _tag: "Uncertain",
              recovery: "observeByPhysicalIdentity",
            },
            message: "The Preview project was unavailable during readback.",
          })
        )
      ),
      Match.tag("Found", ({ attributes }) =>
        attributes.enabled === input.desired &&
        attributes.productionEnabled === input.productionGuard
          ? Effect.succeed(attributes)
          : Effect.fail(
              new VercelPreviewConfigurationWriteError({
                operation: "setPreviewFeedback",
                reason: "uncertainOutcome",
                retry: "never",
                certainty: {
                  _tag: "Uncertain",
                  recovery: "operatorReview",
                },
                message:
                  "Preview feedback readback did not match desired state.",
              })
            )
      ),
      Match.exhaustive
    );
  }
);

const environmentReadback = Effect.fn(
  "VercelPreviewEnvironmentMetadataProvider.readback"
)(function* (input: VercelPreviewEnvironmentMetadataPropsType) {
  const configuration = yield* VercelPreviewConfiguration;
  const observed = yield* configuration.observePreviewEnvironmentMetadata(
    ObserveVercelPreviewEnvironmentMetadata.make(input)
  );
  return yield* Match.value(observed).pipe(
    Match.tag("Missing", () =>
      Effect.fail(
        new VercelPreviewConfigurationWriteError({
          operation: "createPreviewEnvironmentMetadata",
          reason: "notFound",
          retry: "backoff",
          certainty: {
            _tag: "Uncertain",
            recovery: "observeByPhysicalIdentity",
          },
          message:
            "The Preview environment resource was unavailable during readback.",
        })
      )
    ),
    Match.tag("Found", ({ attributes }) => Effect.succeed(attributes)),
    Match.exhaustive
  );
});

const recoverUncertainFeedbackWrite = (
  input: VercelPreviewFeedbackPropsType,
  failure: VercelPreviewConfigurationWriteError
) =>
  Match.value(failure.certainty).pipe(
    Match.tag("Known", () => Effect.fail(failure)),
    Match.tag("Uncertain", () =>
      feedbackReadback(input).pipe(
        Effect.retry({
          times: 2,
          schedule: Schedule.exponential("10 millis").pipe(Schedule.jittered),
          while: (readbackFailure) => readbackFailure.retry === "backoff",
        })
      )
    ),
    Match.exhaustive
  );

const recoverUncertainEnvironmentWrite = (
  input: VercelPreviewEnvironmentMetadataPropsType,
  failure: VercelPreviewConfigurationWriteError
) =>
  Match.value(failure.certainty).pipe(
    Match.tag("Known", () => Effect.fail(failure)),
    Match.tag("Uncertain", () =>
      environmentReadback(input).pipe(
        Effect.retry({
          times: 2,
          schedule: Schedule.exponential("10 millis").pipe(Schedule.jittered),
          while: (readbackFailure) => readbackFailure.retry === "backoff",
        })
      )
    ),
    Match.exhaustive
  );

export const layerVercelPreviewConfigurationProviders = (scope: {
  readonly feedback: VercelPreviewFeedbackPropsType;
  readonly environmentMetadata: VercelPreviewEnvironmentMetadataPropsType;
}) => {
  const feedbackProvider = Provider.succeed(
    VercelPreviewFeedback,
    VercelPreviewFeedback.Provider.of({
      read: Effect.fn("VercelPreviewFeedbackProvider.read")(function* ({
        olds,
        output,
      }) {
        const configuration = yield* VercelPreviewConfiguration;
        const observed = yield* configuration.observePreviewFeedback(
          ObserveVercelPreviewFeedback.make({
            stage: olds.stage,
            teamId: olds.teamId,
            projectId: output?.projectId ?? olds.projectId,
          })
        );
        return yield* Match.value(observed).pipe(
          Match.tag("Missing", () =>
            Effect.succeed(missingConfigurationResource)
          ),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              output === undefined ? Unowned(attributes) : attributes
            )
          ),
          Match.exhaustive
        );
      }),
      diff: Effect.fn("VercelPreviewFeedbackProvider.diff")(({ news, olds }) =>
        Effect.sync(() => {
          if (!isResolved(news)) {
            return missingConfigurationResource;
          }
          if (
            news.stage !== olds.stage ||
            news.teamId !== olds.teamId ||
            news.projectId !== olds.projectId
          ) {
            return VercelConfigurationReplaceDiff.make({
              action: "replace",
            });
          }
          return news.desired === olds.desired &&
            news.productionGuard === olds.productionGuard
            ? VercelConfigurationNoopDiff.make({ action: "noop" })
            : VercelConfigurationUpdateDiff.make({ action: "update" });
        })
      ),
      reconcile: Effect.fn("VercelPreviewFeedbackProvider.reconcile")((input) =>
        Effect.gen(function* reconcileVercelPreviewFeedback() {
          const desired = VercelPreviewFeedbackProps.make(input.news);
          const configuration = yield* VercelPreviewConfiguration;
          const observed = yield* configuration.observePreviewFeedback(
            ObserveVercelPreviewFeedback.make(desired)
          );
          if (
            observed._tag === "Found" &&
            observed.attributes.enabled === desired.desired &&
            observed.attributes.productionEnabled === desired.productionGuard
          ) {
            return observed.attributes;
          }
          return yield* configuration.setPreviewFeedback(
            SetVercelPreviewFeedback.make(desired)
          );
        }).pipe(
          Effect.catchTag("VercelPreviewConfigurationWriteError", (failure) =>
            recoverUncertainFeedbackWrite(
              VercelPreviewFeedbackProps.make(input.news),
              failure
            )
          )
        )
      ),
      delete: Effect.fn("VercelPreviewFeedbackProvider.delete")(() =>
        Effect.fail(
          new VercelPreviewConfigurationWriteError({
            operation: "setPreviewFeedback",
            reason: "protected",
            retry: "never",
            certainty: { _tag: "Known" },
            message:
              "Preview feedback is retained; rollback requires an explicit prior-value reconcile.",
          })
        )
      ),
      list: Effect.fn("VercelPreviewFeedbackProvider.list")(function* () {
        const configuration = yield* VercelPreviewConfiguration;
        const observed = yield* configuration.observePreviewFeedback(
          ObserveVercelPreviewFeedback.make(scope.feedback)
        );
        return Match.value(observed).pipe(
          Match.tag("Missing", () => []),
          Match.tag("Found", ({ attributes }) => [attributes]),
          Match.exhaustive
        );
      }),
      stables: ["teamId", "projectId"],
    })
  );

  const environmentProvider = Provider.succeed(
    VercelPreviewEnvironmentMetadata,
    VercelPreviewEnvironmentMetadata.Provider.of({
      read: Effect.fn("VercelPreviewEnvironmentMetadataProvider.read")(
        function* ({ olds, output }) {
          const configuration = yield* VercelPreviewConfiguration;
          const observed =
            yield* configuration.observePreviewEnvironmentMetadata(
              ObserveVercelPreviewEnvironmentMetadata.make({
                stage: olds.stage,
                teamId: olds.teamId,
                projectId: output?.projectId ?? olds.projectId,
                key: output?.key ?? olds.key,
              })
            );
          return yield* Match.value(observed).pipe(
            Match.tag("Missing", () =>
              Effect.succeed(missingConfigurationResource)
            ),
            Match.tag("Found", ({ attributes }) =>
              Effect.succeed(
                output === undefined ? Unowned(attributes) : attributes
              )
            ),
            Match.exhaustive
          );
        }
      ),
      diff: Effect.fn("VercelPreviewEnvironmentMetadataProvider.diff")(
        ({ news, olds }) =>
          Effect.sync(() => {
            if (!isResolved(news)) {
              return missingConfigurationResource;
            }
            return news.stage === olds.stage &&
              news.teamId === olds.teamId &&
              news.projectId === olds.projectId &&
              news.key === olds.key &&
              news.value === olds.value
              ? VercelConfigurationNoopDiff.make({ action: "noop" })
              : VercelConfigurationReplaceDiff.make({ action: "replace" });
          })
      ),
      reconcile: Effect.fn(
        "VercelPreviewEnvironmentMetadataProvider.reconcile"
      )((input) =>
        Effect.gen(function* reconcileVercelPreviewEnvironmentMetadata() {
          const desired = VercelPreviewEnvironmentMetadataProps.make(
            input.news
          );
          const configuration = yield* VercelPreviewConfiguration;
          const observed =
            yield* configuration.observePreviewEnvironmentMetadata(
              ObserveVercelPreviewEnvironmentMetadata.make(desired)
            );
          return yield* Match.value(observed).pipe(
            Match.tag("Found", ({ attributes }) => Effect.succeed(attributes)),
            Match.tag("Missing", () =>
              configuration.createPreviewEnvironmentMetadata(
                CreateVercelPreviewEnvironmentMetadata.make(desired)
              )
            ),
            Match.exhaustive
          );
        }).pipe(
          Effect.catchTag("VercelPreviewConfigurationWriteError", (failure) =>
            recoverUncertainEnvironmentWrite(
              VercelPreviewEnvironmentMetadataProps.make(input.news),
              failure
            )
          )
        )
      ),
      delete: Effect.fn("VercelPreviewEnvironmentMetadataProvider.delete")(
        function* ({ olds, output }) {
          const configuration = yield* VercelPreviewConfiguration;
          yield* configuration
            .deletePreviewEnvironmentMetadata(
              DeleteVercelPreviewEnvironmentMetadata.make({
                attributes: output,
                destructivePolicy: olds.destructivePolicy,
              })
            )
            .pipe(
              Effect.catchTag(
                "VercelPreviewConfigurationWriteError",
                (failure) =>
                  Match.value(failure.certainty).pipe(
                    Match.tag("Known", () => Effect.fail(failure)),
                    Match.tag("Uncertain", () =>
                      configuration
                        .observePreviewEnvironmentMetadata(
                          ObserveVercelPreviewEnvironmentMetadata.make(olds)
                        )
                        .pipe(
                          Effect.flatMap((observed) =>
                            observed._tag === "Missing"
                              ? Effect.void
                              : Effect.fail(failure)
                          )
                        )
                    ),
                    Match.exhaustive
                  )
              )
            );
        }
      ),
      list: Effect.fn("VercelPreviewEnvironmentMetadataProvider.list")(
        function* () {
          const configuration = yield* VercelPreviewConfiguration;
          const observed =
            yield* configuration.observePreviewEnvironmentMetadata(
              ObserveVercelPreviewEnvironmentMetadata.make(
                scope.environmentMetadata
              )
            );
          return Match.value(observed).pipe(
            Match.tag("Missing", () => []),
            Match.tag("Found", ({ attributes }) => [attributes]),
            Match.exhaustive
          );
        }
      ),
      stables: ["teamId", "projectId", "key"],
    })
  );

  return Layer.merge(feedbackProvider, environmentProvider);
};
