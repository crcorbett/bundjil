import {
  AutomaticProductionReceiptJson,
  ProductionDeploymentsLive,
  runAutomaticProduction,
  VercelGitSha,
} from "@bundjil/infrastructure/vercel";
import { BunRuntime } from "@effect/platform-bun";
import { Config, Console, Effect, Schema } from "effect";

const sourceSha = Config.schema(VercelGitSha, "BUNDJIL_PRODUCTION_SOURCE_SHA");

const main = Effect.gen(function* automaticProductionMain() {
  const acceptedSourceSha = yield* sourceSha;
  const receipt = yield* runAutomaticProduction(acceptedSourceSha).pipe(
    Effect.provide(ProductionDeploymentsLive)
  );
  const encoded = yield* Schema.encodeEffect(AutomaticProductionReceiptJson)(
    receipt
  );
  yield* Console.log(encoded);
});

BunRuntime.runMain(main);
