import { Duration, Effect, Exit, Ref } from "effect";

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

const productionMutationTimeout = Duration.minutes(8);
const productionRollbackTimeout = Duration.minutes(4);

const rollbackTimeoutError = () =>
  new ProductionDeploymentError({
    operation: "rollback",
    project: null,
    reason: "timeout",
    retry: "after-readback",
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
    const previousAgentCallback = yield* deployments.currentAgentCallback;
    const publicTargetsAreCurrent =
      previousProxy.sourceSha === sourceSha &&
      previousAgent.sourceSha === sourceSha;
    const callbackIsCurrent =
      previousAgentCallback.projectId === previousAgent.projectId &&
      previousAgentCallback.deploymentId === previousAgent.deploymentId &&
      previousAgentCallback.sourceSha === sourceSha;

    if (publicTargetsAreCurrent && callbackIsCurrent) {
      return {
        status: "already-current",
        sourceSha,
        previousProxyDeploymentId: previousProxy.deploymentId,
        previousAgentDeploymentId: previousAgent.deploymentId,
        previousAgentCallbackDeploymentId: previousAgentCallback.deploymentId,
        proxyDeploymentId: null,
        agentDeploymentId: null,
        stableProxyDeploymentId: previousProxy.deploymentId,
        stableAgentDeploymentId: previousAgent.deploymentId,
        stableAgentCallbackDeploymentId: previousAgentCallback.deploymentId,
        rollbackReady: true,
      } satisfies AutomaticProductionReceipt;
    }

    const candidateProxy = publicTargetsAreCurrent
      ? previousProxy
      : yield* deployments.stage({ project: "proxy", sourceSha });
    const candidateAgent = publicTargetsAreCurrent
      ? previousAgent
      : yield* deployments.stage({ project: "agent", sourceSha });

    if (!publicTargetsAreCurrent) {
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
    }

    const currentMainSha = yield* deployments.readMainSha;
    if (currentMainSha !== sourceSha) {
      return {
        status: "stale",
        sourceSha,
        previousProxyDeploymentId: previousProxy.deploymentId,
        previousAgentDeploymentId: previousAgent.deploymentId,
        previousAgentCallbackDeploymentId: previousAgentCallback.deploymentId,
        proxyDeploymentId: publicTargetsAreCurrent
          ? null
          : candidateProxy.deploymentId,
        agentDeploymentId: publicTargetsAreCurrent
          ? null
          : candidateAgent.deploymentId,
        stableProxyDeploymentId: previousProxy.deploymentId,
        stableAgentDeploymentId: previousAgent.deploymentId,
        stableAgentCallbackDeploymentId: previousAgentCallback.deploymentId,
        rollbackReady: true,
      } satisfies AutomaticProductionReceipt;
    }

    const rollbackEligibility = yield* Ref.make<{
      readonly agent: boolean;
      readonly callback: boolean;
      readonly proxy: boolean;
    }>({ agent: false, callback: false, proxy: false });

    const promotion = Effect.gen(function* () {
      if (!publicTargetsAreCurrent) {
        yield* Ref.update(rollbackEligibility, (current) => ({
          ...current,
          proxy: true,
        }));
        yield* deployments.promote(candidateProxy);
        yield* validateCandidate(
          yield* deployments.current("proxy"),
          candidateProxy,
          sourceSha
        );
        yield* Ref.update(rollbackEligibility, (current) => ({
          ...current,
          agent: true,
        }));
        yield* deployments.promote(candidateAgent);
        yield* validateCandidate(
          yield* deployments.current("agent"),
          candidateAgent,
          sourceSha
        );
      }

      yield* Ref.update(rollbackEligibility, (current) => ({
        ...current,
        callback: true,
      }));
      yield* deployments.assignAgentCallback(candidateAgent);
      yield* validateCandidate(
        yield* deployments.currentAgentCallback,
        candidateAgent,
        sourceSha
      );
      yield* deployments.probeProxyHealth;
    });

    yield* promotion.pipe(
      Effect.timeoutOrElse({
        duration: productionMutationTimeout,
        orElse: () =>
          Effect.fail(
            new ProductionDeploymentError({
              operation: "promote",
              project: null,
              reason: "timeout",
              retry: "after-readback",
            })
          ),
      }),
      Effect.onExit((promotionExit) => {
        if (Exit.isSuccess(promotionExit)) {
          return Effect.void;
        }
        return Effect.gen(function* rollbackProduction() {
          const eligible = yield* Ref.get(rollbackEligibility);
          const callbackRollbackExit = yield* Effect.exit(
            (eligible.callback
              ? Effect.gen(function* restoreCallback() {
                  yield* deployments.assignAgentCallback(previousAgentCallback);
                  yield* validateCandidate(
                    yield* deployments.currentAgentCallback,
                    previousAgentCallback,
                    previousAgentCallback.sourceSha
                  );
                })
              : Effect.void
            ).pipe(
              Effect.timeoutOrElse({
                duration: productionRollbackTimeout,
                orElse: () => Effect.fail(rollbackTimeoutError()),
              })
            )
          );
          const agentRollbackExit = yield* Effect.exit(
            (eligible.agent
              ? Effect.gen(function* restoreAgent() {
                  yield* deployments.rollback(previousAgent);
                  yield* validateCandidate(
                    yield* deployments.current("agent"),
                    previousAgent,
                    previousAgent.sourceSha
                  );
                })
              : Effect.void
            ).pipe(
              Effect.timeoutOrElse({
                duration: productionRollbackTimeout,
                orElse: () => Effect.fail(rollbackTimeoutError()),
              })
            )
          );
          const proxyRollbackExit = yield* Effect.exit(
            (eligible.proxy
              ? Effect.gen(function* restoreProxy() {
                  yield* deployments.rollback(previousProxy);
                  yield* validateCandidate(
                    yield* deployments.current("proxy"),
                    previousProxy,
                    previousProxy.sourceSha
                  );
                })
              : Effect.void
            ).pipe(
              Effect.timeoutOrElse({
                duration: productionRollbackTimeout,
                orElse: () => Effect.fail(rollbackTimeoutError()),
              })
            )
          );
          if (
            Exit.isFailure(callbackRollbackExit) ||
            Exit.isFailure(agentRollbackExit) ||
            Exit.isFailure(proxyRollbackExit)
          ) {
            return yield* new ProductionDeploymentError({
              operation: "rollback",
              project: null,
              reason: "rollbackFailed",
              retry: "after-readback",
            });
          }
          return yield* Effect.void;
        });
      })
    );

    return {
      status: publicTargetsAreCurrent ? "callback-reconciled" : "promoted",
      sourceSha,
      previousProxyDeploymentId: previousProxy.deploymentId,
      previousAgentDeploymentId: previousAgent.deploymentId,
      previousAgentCallbackDeploymentId: previousAgentCallback.deploymentId,
      proxyDeploymentId: publicTargetsAreCurrent
        ? null
        : candidateProxy.deploymentId,
      agentDeploymentId: publicTargetsAreCurrent
        ? null
        : candidateAgent.deploymentId,
      stableProxyDeploymentId: candidateProxy.deploymentId,
      stableAgentDeploymentId: candidateAgent.deploymentId,
      stableAgentCallbackDeploymentId: candidateAgent.deploymentId,
      rollbackReady: true,
    } satisfies AutomaticProductionReceipt;
  }
);
