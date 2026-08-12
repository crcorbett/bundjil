import { Effect, Exit } from "effect";

import { ProductionDeploymentError } from "./production.errors.js";
import type {
  AutomaticProductionReceipt,
  ProductionDeployment,
} from "./production.schemas.js";
import { ProductionDeployments } from "./production.service.js";
import type { VercelGitSha } from "./schemas.js";

const targetError = (project: "agent" | "proxy") =>
  new ProductionDeploymentError({
    operation: "validate",
    project,
    reason: "targetMismatch",
    retry: "never",
  });

const validateCandidate = (
  candidate: ProductionDeployment,
  expected: ProductionDeployment,
  sourceSha: VercelGitSha
) =>
  candidate.project === expected.project &&
  candidate.projectId === expected.projectId &&
  candidate.deploymentId === expected.deploymentId &&
  candidate.sourceSha === sourceSha
    ? Effect.void
    : Effect.fail(targetError(expected.project));

export const runAutomaticProduction = Effect.fn("runAutomaticProduction")(
  function* (sourceSha: VercelGitSha) {
    const deployments = yield* ProductionDeployments;
    const previousProxy = yield* deployments.current("proxy");
    const previousAgent = yield* deployments.current("agent");

    if (
      previousProxy.sourceSha === sourceSha &&
      previousAgent.sourceSha === sourceSha
    ) {
      return {
        status: "already-current",
        sourceSha,
        previousProxyDeploymentId: previousProxy.deploymentId,
        previousAgentDeploymentId: previousAgent.deploymentId,
        proxyDeploymentId: null,
        agentDeploymentId: null,
        stableProxyDeploymentId: previousProxy.deploymentId,
        stableAgentDeploymentId: previousAgent.deploymentId,
        rollbackReady: true,
      } satisfies AutomaticProductionReceipt;
    }

    const candidateProxy = yield* deployments.stage({
      project: "proxy",
      sourceSha,
    });
    const candidateAgent = yield* deployments.stage({
      project: "agent",
      sourceSha,
    });
    yield* validateCandidate(
      yield* deployments.inspect({
        project: "proxy",
        deploymentId: candidateProxy.deploymentId,
      }),
      candidateProxy,
      sourceSha
    );
    yield* validateCandidate(
      yield* deployments.inspect({
        project: "agent",
        deploymentId: candidateAgent.deploymentId,
      }),
      candidateAgent,
      sourceSha
    );

    const currentMainSha = yield* deployments.readMainSha;
    if (currentMainSha !== sourceSha) {
      return {
        status: "stale",
        sourceSha,
        previousProxyDeploymentId: previousProxy.deploymentId,
        previousAgentDeploymentId: previousAgent.deploymentId,
        proxyDeploymentId: candidateProxy.deploymentId,
        agentDeploymentId: candidateAgent.deploymentId,
        stableProxyDeploymentId: previousProxy.deploymentId,
        stableAgentDeploymentId: previousAgent.deploymentId,
        rollbackReady: true,
      } satisfies AutomaticProductionReceipt;
    }

    let proxyMoved = false;
    let agentMoved = false;
    const promote = Effect.gen(function* () {
      proxyMoved = true;
      yield* deployments.promote(candidateProxy);
      yield* validateCandidate(
        yield* deployments.current("proxy"),
        candidateProxy,
        sourceSha
      );
      agentMoved = true;
      yield* deployments.promote(candidateAgent);
      yield* validateCandidate(
        yield* deployments.current("agent"),
        candidateAgent,
        sourceSha
      );
      yield* deployments.probeProxyHealth;
    });

    yield* promote.pipe(
      Effect.onExit((promoteExit) => {
        if (Exit.isSuccess(promoteExit)) {
          return Effect.void;
        }
        const rollback = Effect.gen(function* () {
          if (agentMoved) {
            yield* deployments.rollback(previousAgent);
            yield* validateCandidate(
              yield* deployments.current("agent"),
              previousAgent,
              previousAgent.sourceSha
            );
          }
          if (proxyMoved) {
            yield* deployments.rollback(previousProxy);
            yield* validateCandidate(
              yield* deployments.current("proxy"),
              previousProxy,
              previousProxy.sourceSha
            );
          }
        });
        return Effect.exit(rollback).pipe(
          Effect.flatMap((rollbackExit) =>
            Exit.isFailure(rollbackExit)
              ? Effect.fail(
                  new ProductionDeploymentError({
                    operation: "rollback",
                    project: null,
                    reason: "rollbackFailed",
                    retry: "after-readback",
                  })
                )
              : Effect.void
          )
        );
      })
    );

    return {
      status: "promoted",
      sourceSha,
      previousProxyDeploymentId: previousProxy.deploymentId,
      previousAgentDeploymentId: previousAgent.deploymentId,
      proxyDeploymentId: candidateProxy.deploymentId,
      agentDeploymentId: candidateAgent.deploymentId,
      stableProxyDeploymentId: candidateProxy.deploymentId,
      stableAgentDeploymentId: candidateAgent.deploymentId,
      rollbackReady: true,
    } satisfies AutomaticProductionReceipt;
  }
);
