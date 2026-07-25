import { isAbsolute } from "node:path";

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { Ajv2020 } from "ajv/dist/2020.js";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Schema,
} from "effect";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import vercelGitLinkAuthorityPolicy from "../schemas/vercel-git-link-authority.schema.json" with { type: "json" };

declare const process: {
  exitCode: number | undefined;
};

const VercelGitLinkAuthorityPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "The Vercel Git-link authority path must be safe and repository-relative."
    )
  ),
  Schema.brand("@bundjil/infrastructure/VercelGitLinkAuthorityPath")
);

const authorityPathConfig = Config.schema(
  VercelGitLinkAuthorityPath,
  "BUNDJIL_VERCEL_GIT_LINK_AUTHORITY_PATH"
).pipe(
  Config.withDefault(
    VercelGitLinkAuthorityPath.make("tmp/proof/vercel-git-link.authority.json")
  )
);

const validateVercelGitLinkAuthority = Effect.gen(
  function* validateVercelGitLinkAuthorityOperation() {
    const authorityPath = yield* authorityPathConfig;
    const fileSystem = yield* FileSystem.FileSystem;
    const metadata = yield* fileSystem.stat(authorityPath);
    if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
      return yield* Effect.fail("vercel-git-link-authority-invalid");
    }
    const authorityText = yield* fileSystem.readFileString(authorityPath);
    const authority = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(authorityText);
    const options = {
      allErrors: true,
      strict: false,
      validateFormats: false,
    } as const;
    if (
      !new Ajv2020(options).compile(authorityEnvelopeSchema)(authority) ||
      !new Ajv2020(options).compile(vercelGitLinkAuthorityPolicy)(authority)
    ) {
      return yield* Effect.fail("vercel-git-link-authority-invalid");
    }
    return yield* Console.log('{"status":"valid"}');
  }
);

const main = Effect.exit(validateVercelGitLinkAuthority).pipe(
  Effect.flatMap((exit) =>
    Exit.isSuccess(exit)
      ? Effect.void
      : Console.error('{"status":"invalid"}').pipe(
          Effect.andThen(
            Effect.sync(() => {
              process.exitCode = 1;
            })
          )
        )
  ),
  Effect.provide(
    Layer.merge(
      BunFileSystem.layer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

await Effect.runPromise(main);
