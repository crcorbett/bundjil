import {
  AutomaticProductionBlockedReceipt,
  AutomaticProductionBlockedReceiptJson,
  AutomaticProductionReceiptJson,
  ProductionDeploymentsLive,
  runAutomaticProduction,
  VercelGitSha,
} from "@bundjil/infrastructure/vercel";
import { BunServices } from "@effect/platform-bun";
import {
  Cause,
  Config,
  Console,
  Effect,
  Exit,
  Layer,
  Match,
  Option,
  Schema,
} from "effect";

declare const process: {
  exitCode: number | undefined;
};

const sourceSha = Config.schema(VercelGitSha, "BUNDJIL_PRODUCTION_SOURCE_SHA");
const ProductionDeploymentsBunLive = ProductionDeploymentsLive.pipe(
  Layer.provide(BunServices.layer)
);
const encodeBlocked = Schema.encodeEffect(
  AutomaticProductionBlockedReceiptJson
);

const runProductionDeployment = Effect.gen(function* automaticProduction() {
  const acceptedSourceSha = yield* sourceSha;
  return yield* runAutomaticProduction(acceptedSourceSha).pipe(
    Effect.provide(ProductionDeploymentsBunLive)
  );
});

const main = Effect.gen(function* automaticProductionMain() {
  const exit = yield* Effect.exit(
    runProductionDeployment.pipe(
      Effect.flatMap(Schema.encodeEffect(AutomaticProductionReceiptJson))
    )
  );
  if (Exit.isSuccess(exit)) {
    return yield* Console.log(exit.value);
  }
  const blockedReceipt = Option.match(Cause.findErrorOption(exit.cause), {
    onNone: () =>
      AutomaticProductionBlockedReceipt.make({
        status: "blocked",
        category: "unexpected",
        operation: null,
        project: null,
        reason: null,
        retry: null,
      }),
    onSome: (error) =>
      Match.value(error).pipe(
        Match.tag("ProductionDeploymentError", (failure) =>
          AutomaticProductionBlockedReceipt.make({
            status: "blocked",
            category: "deployment",
            operation: failure.operation,
            project: failure.project,
            reason: failure.reason,
            retry: failure.retry,
          })
        ),
        Match.tag("ConfigError", () =>
          AutomaticProductionBlockedReceipt.make({
            status: "blocked",
            category: "configuration",
            operation: null,
            project: null,
            reason: null,
            retry: null,
          })
        ),
        Match.orElse(() =>
          AutomaticProductionBlockedReceipt.make({
            status: "blocked",
            category: "unexpected",
            operation: null,
            project: null,
            reason: null,
            retry: null,
          })
        )
      ),
  });
  const blockedOutput = yield* encodeBlocked(blockedReceipt).pipe(Effect.orDie);
  yield* Console.error(blockedOutput);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);
