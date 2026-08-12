import {
  AutomaticProductionReceiptJson,
  ProductionDeploymentsLive,
  runAutomaticProduction,
  VercelGitSha,
} from "@bundjil/infrastructure/vercel";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Config, Console, Effect, Layer, Schema } from "effect";

const sourceSha = Config.schema(VercelGitSha, "BUNDJIL_PRODUCTION_SOURCE_SHA");
const ProductionDeploymentsBunLive = ProductionDeploymentsLive.pipe(
  Layer.provide(BunServices.layer)
);

const main = Effect.gen(function* automaticProductionMain() {
  const acceptedSourceSha = yield* sourceSha;
  const receipt = yield* runAutomaticProduction(acceptedSourceSha).pipe(
    Effect.provide(ProductionDeploymentsBunLive)
  );
  const encoded = yield* Schema.encodeEffect(AutomaticProductionReceiptJson)(
    receipt
  );
  yield* Console.log(encoded);
});

BunRuntime.runMain(main);
