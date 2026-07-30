import { isAbsolute } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import { Config, Effect, FileSystem, Schema } from "effect";

import authorityEnvelopeSchema from "../../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import stableEnvironmentAuthorityPolicy from "../../schemas/stable-vercel-environment-authority.schema.json" with { type: "json" };

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

const authorityPathConfig = Config.schema(
  VercelStableEnvironmentAuthorityPath,
  "BUNDJIL_STABLE_ENVIRONMENT_AUTHORITY_PATH"
);

export const loadVercelStableEnvironmentAuthority = Effect.gen(
  function* loadVercelStableEnvironmentAuthorityOperation() {
    const path = yield* authorityPathConfig;
    const fileSystem = yield* FileSystem.FileSystem;
    const metadata = yield* fileSystem.stat(path);
    if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
      return yield* Effect.fail("stable-environment-authority-invalid");
    }
    const text = yield* fileSystem.readFileString(path);
    const authority = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(text);
    const options = {
      allErrors: true,
      strict: false,
      validateFormats: false,
    } as const;
    if (
      !new Ajv2020(options).compile(authorityEnvelopeSchema)(authority) ||
      !new Ajv2020(options).compile(stableEnvironmentAuthorityPolicy)(authority)
    ) {
      return yield* Effect.fail("stable-environment-authority-invalid");
    }
    return path;
  }
).pipe(Effect.withSpan("VercelStableEnvironmentAuthority.load"));
