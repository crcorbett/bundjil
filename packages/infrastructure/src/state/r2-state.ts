import {
  Credentials as AwsCredentials,
  Endpoint as AwsEndpoint,
  Region as AwsRegion,
} from "@distilled.cloud/aws";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { AWSEnvironment, makeS3State } from "alchemy/AWS";
import { inMemoryState, State } from "alchemy/State";
import { Config, Effect, Layer, Redacted, Schema } from "effect";
import type { HttpClient } from "effect/unstable/http/HttpClient";

export const AlchemyR2AccountId = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{32}$/u)),
  Schema.brand("@bundjil/infrastructure/state/AlchemyR2AccountId")
);
export type AlchemyR2AccountId = typeof AlchemyR2AccountId.Type;
export type AlchemyR2AccountIdEncoded = typeof AlchemyR2AccountId.Encoded;

export const AlchemyR2BucketName = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z0-9](?:[a-z0-9.-]{1,61}[a-z0-9])$/u)),
  Schema.brand("@bundjil/infrastructure/state/AlchemyR2BucketName")
);
export type AlchemyR2BucketName = typeof AlchemyR2BucketName.Type;
export type AlchemyR2BucketNameEncoded = typeof AlchemyR2BucketName.Encoded;

export const AlchemyR2StatePrefix = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z0-9][a-z0-9/-]*[a-z0-9]$/u)),
  Schema.brand("@bundjil/infrastructure/state/AlchemyR2StatePrefix")
);
export type AlchemyR2StatePrefix = typeof AlchemyR2StatePrefix.Type;
export type AlchemyR2StatePrefixEncoded = typeof AlchemyR2StatePrefix.Encoded;

export const AlchemyR2AccessKeyId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/state/AlchemyR2AccessKeyId")
);
export type AlchemyR2AccessKeyId = typeof AlchemyR2AccessKeyId.Type;
export type AlchemyR2AccessKeyIdEncoded = typeof AlchemyR2AccessKeyId.Encoded;

export const AlchemyR2SecretAccessKey = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/state/AlchemyR2SecretAccessKey")
);
export type AlchemyR2SecretAccessKey = typeof AlchemyR2SecretAccessKey.Type;
export type AlchemyR2SecretAccessKeyEncoded =
  typeof AlchemyR2SecretAccessKey.Encoded;

export const AlchemyR2StateConfig = Schema.Struct({
  accountId: AlchemyR2AccountId,
  bucketName: AlchemyR2BucketName,
  prefix: AlchemyR2StatePrefix,
  accessKeyId: Schema.Redacted(AlchemyR2AccessKeyId),
  secretAccessKey: Schema.Redacted(AlchemyR2SecretAccessKey),
});
export type AlchemyR2StateConfig = typeof AlchemyR2StateConfig.Type;
export type AlchemyR2StateConfigEncoded = typeof AlchemyR2StateConfig.Encoded;

export const AlchemyR2StateFailureReason = Schema.Literals([
  "configurationInvalid",
  "initializationFailed",
]);
export class AlchemyR2StateError extends Schema.TaggedErrorClass<AlchemyR2StateError>()(
  "AlchemyR2StateError",
  { reason: AlchemyR2StateFailureReason }
) {}

const accountIdConfig = Config.schema(
  AlchemyR2AccountId,
  "BUNDJIL_ALCHEMY_STATE_ACCOUNT_ID"
).pipe(
  Config.withDefault(
    AlchemyR2AccountId.make("f9f94270a4a5af8af7010d891020922d")
  )
);

const bucketNameConfig = Config.schema(
  AlchemyR2BucketName,
  "BUNDJIL_ALCHEMY_STATE_BUCKET"
).pipe(Config.withDefault(AlchemyR2BucketName.make("bundjil-alchemy-state")));

const prefixConfig = Config.schema(
  AlchemyR2StatePrefix,
  "BUNDJIL_ALCHEMY_STATE_PREFIX"
).pipe(Config.withDefault(AlchemyR2StatePrefix.make("bundjil/v1")));

const accessKeyIdConfig = Config.schema(
  Schema.Redacted(AlchemyR2AccessKeyId),
  "BUNDJIL_ALCHEMY_STATE_ACCESS_KEY_ID"
);

const secretAccessKeyConfig = Config.schema(
  Schema.Redacted(AlchemyR2SecretAccessKey),
  "BUNDJIL_ALCHEMY_STATE_SECRET_ACCESS_KEY"
);

export const loadAlchemyR2StateConfig = Effect.gen(
  function* loadAlchemyR2StateConfigOperation() {
    return AlchemyR2StateConfig.make({
      accountId: yield* accountIdConfig,
      bucketName: yield* bucketNameConfig,
      prefix: yield* prefixConfig,
      accessKeyId: yield* accessKeyIdConfig,
      secretAccessKey: yield* secretAccessKeyConfig,
    });
  }
).pipe(Effect.withSpan("AlchemyR2StateConfig.load"));

const layerForAlchemyR2StateConfig = (config: AlchemyR2StateConfig) => {
  const endpoint =
    `https://${config.accountId}.r2.cloudflarestorage.com` as const;
  const credentials = AwsCredentials.fromCredentials({
    accessKeyId: Redacted.value(config.accessKeyId),
    secretAccessKey: Redacted.value(config.secretAccessKey),
  });
  const region = Layer.succeed(AwsRegion.Region, Effect.succeed("auto"));
  const providerEndpoint = Layer.succeed(
    AwsEndpoint.Endpoint,
    Effect.succeed(endpoint)
  );
  const environment = Layer.effect(
    AWSEnvironment,
    AwsCredentials.Credentials.pipe(
      Effect.map((credentialEffect) =>
        Effect.succeed({
          accountId: config.accountId,
          region: "auto",
          credentials: credentialEffect,
          endpoint,
        })
      )
    )
  ).pipe(Layer.provide(credentials));
  const dependencies = Layer.mergeAll(
    credentials,
    region,
    providerEndpoint,
    environment,
    BunHttpClient.layer
  );

  return Layer.effect(
    State,
    Effect.gen(function* makeCachedAlchemyR2State() {
      const context = yield* Effect.context<
        | AwsCredentials.Credentials
        | AwsEndpoint.Endpoint
        | AwsRegion.Region
        | AWSEnvironment
        | HttpClient
      >();
      return yield* Effect.cached(
        makeS3State({
          bucketName: config.bucketName,
          prefix: config.prefix,
        }).pipe(Effect.provideContext(context))
      );
    })
  ).pipe(
    Layer.provide(dependencies),
    /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-then, eslint-plugin-promise/prefer-await-to-callbacks -- Layer.catch recovers the typed provider Layer error channel, not a Promise callback. */
    Layer.catch(() =>
      Layer.effect(
        State,
        new AlchemyR2StateError({ reason: "initializationFailed" })
      )
    )
  );
};

export const layerAlchemyR2State = Layer.unwrap(
  loadAlchemyR2StateConfig.pipe(
    Effect.mapError(
      () => new AlchemyR2StateError({ reason: "configurationInvalid" })
    ),
    Effect.map(layerForAlchemyR2StateConfig)
  )
);

export const layerAlchemyR2StateMemory = inMemoryState();
