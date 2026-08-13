/* oxlint-disable promise/prefer-await-to-callbacks -- Effect callbacks preserve the typed error channel without Promise escape. */
import { isAbsolute } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import { Config, Effect, FileSystem, Match, Schema } from "effect";

import authorityEnvelopeSchema from "../../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import productionStableEnvironmentAuthorityPolicy from "../../schemas/production-stable-vercel-environment-authority.schema.json" with { type: "json" };
import stableEnvironmentAuthorityPolicy from "../../schemas/stable-vercel-environment-authority.schema.json" with { type: "json" };
import { InfrastructureStage } from "../schemas.js";

export const VercelStableEnvironmentAuthorityPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "The stable environment authority path must be safe and repository-relative."
    )
  ),
  Schema.brand(
    "@bundjil/infrastructure/vercel/VercelStableEnvironmentAuthorityPath"
  )
);
export type VercelStableEnvironmentAuthorityPath =
  typeof VercelStableEnvironmentAuthorityPath.Type;
export type VercelStableEnvironmentAuthorityPathEncoded =
  typeof VercelStableEnvironmentAuthorityPath.Encoded;

export const VercelStableEnvironmentAuthorityFailureReason = Schema.Literals([
  "configurationInvalid",
  "authorityUnreadable",
  "authorityInvalid",
]);
export type VercelStableEnvironmentAuthorityFailureReason =
  typeof VercelStableEnvironmentAuthorityFailureReason.Type;
export type VercelStableEnvironmentAuthorityFailureReasonEncoded =
  typeof VercelStableEnvironmentAuthorityFailureReason.Encoded;

export class VercelStableEnvironmentAuthorityError extends Schema.TaggedErrorClass<VercelStableEnvironmentAuthorityError>()(
  "VercelStableEnvironmentAuthorityError",
  { reason: VercelStableEnvironmentAuthorityFailureReason }
) {}
export type VercelStableEnvironmentAuthorityErrorEncoded =
  typeof VercelStableEnvironmentAuthorityError.Encoded;

const authorityPathConfig = Config.schema(
  VercelStableEnvironmentAuthorityPath,
  "BUNDJIL_STABLE_ENVIRONMENT_AUTHORITY_PATH"
);
const stageConfig = Config.schema(
  InfrastructureStage,
  "BUNDJIL_INFRASTRUCTURE_STAGE"
);

export const loadVercelStableEnvironmentAuthority = Effect.gen(
  function* loadVercelStableEnvironmentAuthorityOperation() {
    const path = yield* authorityPathConfig;
    const stage = yield* stageConfig;
    const fileSystem = yield* FileSystem.FileSystem;
    const metadata = yield* fileSystem.stat(path).pipe(
      Effect.mapError(
        () =>
          new VercelStableEnvironmentAuthorityError({
            reason: "authorityUnreadable",
          })
      )
    );
    if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
      return yield* new VercelStableEnvironmentAuthorityError({
        reason: "authorityInvalid",
      });
    }
    const text = yield* fileSystem.readFileString(path).pipe(
      Effect.mapError(
        () =>
          new VercelStableEnvironmentAuthorityError({
            reason: "authorityUnreadable",
          })
      )
    );
    const authority = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(text).pipe(
      Effect.mapError(
        () =>
          new VercelStableEnvironmentAuthorityError({
            reason: "authorityInvalid",
          })
      )
    );
    const options = {
      allErrors: true,
      strict: false,
      validateFormats: false,
    } as const;
    if (
      !new Ajv2020(options).compile(authorityEnvelopeSchema)(authority) ||
      !new Ajv2020(options).compile(
        Match.value(stage).pipe(
          Match.when("preview", () => stableEnvironmentAuthorityPolicy),
          Match.when("prod", () => productionStableEnvironmentAuthorityPolicy),
          Match.exhaustive
        )
      )(authority)
    ) {
      return yield* new VercelStableEnvironmentAuthorityError({
        reason: "authorityInvalid",
      });
    }
    return path;
  }
).pipe(
  Effect.mapError((error) =>
    Schema.is(VercelStableEnvironmentAuthorityError)(error)
      ? error
      : new VercelStableEnvironmentAuthorityError({
          reason: "configurationInvalid",
        })
  ),
  Effect.withSpan("VercelStableEnvironmentAuthority.load")
);
