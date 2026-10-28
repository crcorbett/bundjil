import type { Credentials } from "@distilled.cloud/aws/Credentials";
import type { Endpoint } from "@distilled.cloud/aws/Endpoint";
import type { Region } from "@distilled.cloud/aws/Region";
import * as S3 from "@distilled.cloud/aws/s3";
import { StateStoreError } from "alchemy/State";
import { makeBucketState } from "alchemy/State/BucketState";
import type { BucketObjects } from "alchemy/State/BucketState";
import { Array, Effect, LogLevel, References, Schedule, Stream } from "effect";
import type { HttpClient } from "effect/http/HttpClient";

import type { AlchemyR2StateConfig } from "./r2-state.js";

// R2 implements the S3 object API, but not AWS bucket versioning, encryption
// configuration or ownership controls. Alchemy owns encoding, keys and leases;
// this adapter only accesses the existing bucket's objects.
export const makeAlchemyR2State = Effect.fn("AlchemyR2State.make")(
  function* (config: AlchemyR2StateConfig) {
    const context = yield* Effect.context<
      Credentials | Endpoint | Region | HttpClient
    >();
    const execute = <A, E>(
      operation: Effect.Effect<
        A,
        E,
        Credentials | Endpoint | Region | HttpClient
      >
    ) =>
      operation.pipe(
        Effect.provideContext(context),
        Effect.mapError(
          () =>
            new StateStoreError({ message: "The R2 state operation failed." })
        )
      );
    const Bucket = config.bucketName;
    const objects: BucketObjects = {
      listKeys: (prefix) =>
        execute(
          S3.listObjectsV2.pages({ Bucket, Prefix: prefix }).pipe(
            Stream.flatMap((page) => Stream.fromIterable(page.Contents ?? [])),
            Stream.map((object) => object.Key),
            Stream.filter((key): key is string => key !== undefined),
            Stream.runCollect
          )
        ),
      listChildren: (prefix) =>
        execute(
          S3.listObjectsV2
            .pages({ Bucket, Prefix: prefix, Delimiter: "/" })
            .pipe(
              Stream.flatMap((page) =>
                Stream.fromIterable(page.CommonPrefixes ?? [])
              ),
              Stream.map((common) => common.Prefix),
              Stream.filter((key): key is string => key !== undefined),
              Stream.map((key) => key.slice(prefix.length, -1)),
              Stream.runCollect
            )
        ),
      read: (key) =>
        execute(
          S3.getObject({ Bucket, Key: key }).pipe(
            Effect.flatMap((object) =>
              object.Body === undefined
                ? Effect.succeed(undefined)
                : Stream.mkString(Stream.decodeText(object.Body)).pipe(
                    Effect.map((text) => ({ text, version: object.ETag ?? "" }))
                  )
            ),
            Effect.catchTag("NoSuchKey", () => Effect.succeed(undefined))
          )
        ),
      write: (key, body, condition) => {
        const request = {
          Bucket,
          Key: key,
          Body: body,
          ContentType: "application/json",
        };
        const write = (() => {
          if (condition === undefined) {
            return S3.putObject(request);
          }
          return "ifAbsent" in condition
            ? S3.putObject({ ...request, IfNoneMatch: "*" })
            : S3.putObject({ ...request, IfMatch: condition.ifVersion });
        })();
        return execute(
          write.pipe(
            Effect.flatMap((object) =>
              object.ETag === undefined
                ? Effect.fail(
                    new StateStoreError({
                      message: "R2 returned no state object version.",
                    })
                  )
                : Effect.succeed<string | undefined>(object.ETag)
            ),
            Effect.retry({
              times: 4,
              schedule: Schedule.spaced("200 millis"),
              while: (error) => error._tag === "ConditionalRequestConflict",
            }),
            Effect.catchTag(
              ["PreconditionFailed", "ConditionalRequestConflict"],
              () => Effect.succeed(undefined)
            )
          )
        );
      },
      delete: (key, ifVersion) => {
        const request = { Bucket, Key: key };
        return execute(
          (ifVersion === undefined
            ? S3.deleteObject(request)
            : S3.deleteObject({ ...request, IfMatch: ifVersion })
          ).pipe(Effect.asVoid)
        );
      },
      deleteMany: (keys) =>
        Effect.forEach(
          Array.chunksOf(1000)(keys),
          (batch) =>
            execute(
              S3.deleteObjects({
                Bucket,
                Delete: {
                  Objects: Array.map((Key: string) => ({ Key }))(batch),
                  Quiet: true,
                },
              }).pipe(
                Effect.flatMap((result) =>
                  (result.Errors?.length ?? 0) === 0
                    ? Effect.void
                    : Effect.fail(
                        new StateStoreError({
                          message:
                            "R2 could not delete every requested state object.",
                        })
                      )
                )
              )
            ),
          { discard: true }
        ),
    };
    return yield* makeBucketState({
      id: "r2",
      label: "R2",
      prefix: config.prefix,
      // Fail if the existing bucket is absent; provisioning belongs to its owner.
      objects: execute(S3.headBucket({ Bucket })).pipe(Effect.as(objects)),
    });
  },
  Effect.updateService(References.MinimumLogLevel, (level) =>
    LogLevel.isLessThan(level, "Info") ? "Info" : level
  )
);
