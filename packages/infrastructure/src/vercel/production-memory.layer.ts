import { Array, Context, Effect, Layer, Ref, Schema } from "effect";

import { ProductionDeploymentError } from "./production.errors.js";
import type {
  InspectProductionDeployment,
  ProductionDeployment,
  ProductionProject,
  StageProductionDeployment,
} from "./production.schemas.js";
import { ProductionProxyHealth } from "./production.schemas.js";
import { ProductionDeployments } from "./production.service.js";
import type { VercelGitSha } from "./schemas.js";

export const ProductionMemoryFailure = Schema.Literals([
  "none",
  "proxy-stage",
  "agent-stage",
  "wrong-inspect",
  "proxy-promote",
  "agent-promote",
  "health",
  "health-rollback",
]);
export type ProductionMemoryFailure = typeof ProductionMemoryFailure.Type;

export interface ProductionDeploymentMemoryInput {
  readonly currentProxy: ProductionDeployment;
  readonly currentAgent: ProductionDeployment;
  readonly candidateProxy: ProductionDeployment;
  readonly candidateAgent: ProductionDeployment;
  readonly mainSha: VercelGitSha;
  readonly failure: ProductionMemoryFailure;
}

interface ProductionMemoryState {
  readonly currentProxy: ProductionDeployment;
  readonly currentAgent: ProductionDeployment;
  readonly promotions: readonly ProductionProject[];
  readonly rollbacks: readonly ProductionProject[];
}

export interface ProductionDeploymentMemorySnapshot {
  readonly currentProxy: ProductionDeployment;
  readonly currentAgent: ProductionDeployment;
  readonly promotions: readonly ProductionProject[];
  readonly rollbacks: readonly ProductionProject[];
}

export class ProductionDeploymentMemoryControl extends Context.Service<
  ProductionDeploymentMemoryControl,
  Effect.Effect<ProductionDeploymentMemorySnapshot>
>()("@bundjil/infrastructure/vercel/ProductionDeploymentMemoryControl") {}

const memoryError = (
  operation: ProductionDeploymentError["operation"],
  project: ProductionProject | null,
  reason: ProductionDeploymentError["reason"] = "commandFailed"
) =>
  new ProductionDeploymentError({
    operation,
    project,
    reason,
    retry: "after-readback",
  });

export const makeProductionDeploymentsMemory = (
  config: ProductionDeploymentMemoryInput
) =>
  Layer.effectContext(
    Effect.gen(function* makeMemory() {
      const state = yield* Ref.make<ProductionMemoryState>({
        currentProxy: config.currentProxy,
        currentAgent: config.currentAgent,
        promotions: [],
        rollbacks: [],
      });

      const current = Effect.fn("ProductionDeploymentsMemory.current")(
        function* (project: ProductionProject) {
          const snapshot = yield* Ref.get(state);
          return project === "proxy"
            ? snapshot.currentProxy
            : snapshot.currentAgent;
        }
      );

      const candidateFor = (project: ProductionProject) =>
        project === "proxy" ? config.candidateProxy : config.candidateAgent;

      return Context.make(ProductionDeployments, {
        current,
        stage: Effect.fn("ProductionDeploymentsMemory.stage")(function* (
          input: StageProductionDeployment
        ) {
          if (config.failure === `${input.project}-stage`) {
            return yield* memoryError("stage", input.project);
          }
          const candidate = candidateFor(input.project);
          if (candidate.sourceSha !== input.sourceSha) {
            return yield* memoryError("stage", input.project, "sourceMismatch");
          }
          return candidate;
        }),
        inspect: Effect.fn("ProductionDeploymentsMemory.inspect")(function* (
          input: InspectProductionDeployment
        ) {
          const candidate = candidateFor(input.project);
          if (config.failure === "wrong-inspect") {
            return {
              ...candidate,
              sourceSha: config.currentProxy.sourceSha,
            };
          }
          if (candidate.deploymentId !== input.deploymentId) {
            return yield* memoryError(
              "inspect",
              input.project,
              "targetMismatch"
            );
          }
          return candidate;
        }),
        promote: Effect.fn("ProductionDeploymentsMemory.promote")(function* (
          deployment: ProductionDeployment
        ) {
          if (config.failure === `${deployment.project}-promote`) {
            return yield* memoryError("promote", deployment.project);
          }
          return yield* Ref.update(state, (snapshot) => ({
            ...snapshot,
            currentProxy:
              deployment.project === "proxy"
                ? deployment
                : snapshot.currentProxy,
            currentAgent:
              deployment.project === "agent"
                ? deployment
                : snapshot.currentAgent,
            promotions: [...snapshot.promotions, deployment.project],
          }));
        }),
        rollback: Effect.fn("ProductionDeploymentsMemory.rollback")(function* (
          deployment: ProductionDeployment
        ) {
          if (config.failure === "health-rollback") {
            return yield* memoryError(
              "rollback",
              deployment.project,
              "rollbackFailed"
            );
          }
          return yield* Ref.update(state, (snapshot) => ({
            ...snapshot,
            currentProxy:
              deployment.project === "proxy"
                ? deployment
                : snapshot.currentProxy,
            currentAgent:
              deployment.project === "agent"
                ? deployment
                : snapshot.currentAgent,
            rollbacks: [...snapshot.rollbacks, deployment.project],
          }));
        }),
        readMainSha: Effect.succeed(config.mainSha),
        probeProxyHealth:
          config.failure === "health" || config.failure === "health-rollback"
            ? Effect.fail(memoryError("probe", "proxy", "healthFailed"))
            : Schema.decodeUnknownEffect(ProductionProxyHealth)({
                ok: true,
                service: "bundjil-codex-proxy",
                mode: "live",
                reasoningEffort: "high",
              }).pipe(Effect.orDie),
      }).pipe(
        Context.add(
          ProductionDeploymentMemoryControl,
          Ref.get(state).pipe(
            Effect.map((snapshot) => ({
              ...snapshot,
              promotions: Array.fromIterable(snapshot.promotions),
              rollbacks: Array.fromIterable(snapshot.rollbacks),
            }))
          )
        )
      );
    })
  );
