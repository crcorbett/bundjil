// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable eslint-plugin-vitest/prefer-importing-vitest-globals -- Alchemy Test/Bun registers these assertions with Bun. */

import { expect } from "bun:test";

import { adopt } from "alchemy/AdoptPolicy";
import * as Test from "alchemy/Test/Bun";
import { Effect, Exit, Layer, Record, Redacted, Schema } from "effect";

import {
  layerVercelMemory,
  layerVercelReadOnlyProviders,
  layerVercelStableEnvironmentMemory,
  VercelEnvironmentVariable,
  VercelEnvironmentVariableProps,
  VercelInventoryScope,
  VercelMemoryControl,
  VercelReadOnlyInventory,
  VercelStableEnvironmentMemoryConfig,
} from "../src/vercel/index.js";

const teamId = "team-preview";
const agentProjectId = "prj-agent";
const proxyProjectId = "prj-proxy";
const agentEnvironmentVariableId = "env-agent-photon-project";
const proxyEnvironmentVariableId = "env-proxy-photon-project";
const tokenEnvironmentVariableId = "env-agent-internal-token";
const managedOwner = "@bundjil/infrastructure/vercel/preview-photon";
const revisionOne = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const revisionTwo = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const observedValueOwnership = {
  _tag: "ObservedUnknown",
  configured: true,
} as const;

const managedValueOwnership = (
  environmentVariableId: string,
  revision: string
) =>
  ({
    _tag: "Managed",
    reference: {
      owner: managedOwner,
      reference: environmentVariableId,
      revision,
    },
  }) as const;

const fixture = await Effect.runPromise(
  Effect.gen(function* decodeStableEnvironmentFixture() {
    const inventory = yield* Schema.decodeUnknownEffect(
      VercelReadOnlyInventory
    )({
      projects: [
        {
          stage: "preview",
          teamId,
          projectId: agentProjectId,
          name: "bundjil-agent",
          framework: "vite",
          rootDirectory: "apps/agent",
          ownership: "Unowned",
        },
        {
          stage: "preview",
          teamId,
          projectId: proxyProjectId,
          name: "bundjil-codex-proxy",
          framework: "other",
          rootDirectory: "apps/codex-proxy",
          ownership: "Unowned",
        },
      ],
      domains: [],
      environmentVariables: [
        {
          stage: "preview",
          teamId,
          projectId: agentProjectId,
          environmentVariableId: agentEnvironmentVariableId,
          key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          providerUpdatedAt: 10,
          valueOwnership: observedValueOwnership,
          deploymentRequired: false,
          ownership: "Unowned",
        },
        {
          stage: "preview",
          teamId,
          projectId: proxyProjectId,
          environmentVariableId: proxyEnvironmentVariableId,
          key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          providerUpdatedAt: 20,
          valueOwnership: observedValueOwnership,
          deploymentRequired: false,
          ownership: "Unowned",
        },
        {
          stage: "preview",
          teamId,
          projectId: agentProjectId,
          environmentVariableId: tokenEnvironmentVariableId,
          key: "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          providerUpdatedAt: 30,
          valueOwnership: observedValueOwnership,
          deploymentRequired: false,
          ownership: "Unowned",
        },
      ],
      marketplaceBindings: [],
      deployments: [],
    });
    const scope = yield* Schema.decodeUnknownEffect(VercelInventoryScope)({
      projects: [
        { stage: "preview", teamId, projectId: agentProjectId },
        { stage: "preview", teamId, projectId: proxyProjectId },
      ],
    });
    const props = (
      projectId: string,
      environmentVariableId: string,
      key: string,
      valueOwnership: unknown
    ) =>
      Schema.decodeUnknownEffect(VercelEnvironmentVariableProps)({
        stage: "preview",
        teamId,
        projectId,
        environmentVariableId,
        desired: {
          key,
          type: "sensitive",
          targets: ["preview"],
          valueOwnership,
        },
      });
    return {
      inventory,
      scope,
      agent: {
        observed: yield* props(
          agentProjectId,
          agentEnvironmentVariableId,
          "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          observedValueOwnership
        ),
        managedOne: yield* props(
          agentProjectId,
          agentEnvironmentVariableId,
          "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          managedValueOwnership(agentEnvironmentVariableId, revisionOne)
        ),
        managedTwo: yield* props(
          agentProjectId,
          agentEnvironmentVariableId,
          "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          managedValueOwnership(agentEnvironmentVariableId, revisionTwo)
        ),
        absent: yield* props(
          agentProjectId,
          agentEnvironmentVariableId,
          "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          { _tag: "Absent" }
        ),
      },
      proxy: {
        observed: yield* props(
          proxyProjectId,
          proxyEnvironmentVariableId,
          "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          observedValueOwnership
        ),
        managedOne: yield* props(
          proxyProjectId,
          proxyEnvironmentVariableId,
          "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          managedValueOwnership(proxyEnvironmentVariableId, revisionOne)
        ),
      },
      token: {
        observed: yield* props(
          agentProjectId,
          tokenEnvironmentVariableId,
          "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          observedValueOwnership
        ),
        managed: yield* props(
          agentProjectId,
          tokenEnvironmentVariableId,
          "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          managedValueOwnership(tokenEnvironmentVariableId, revisionOne)
        ),
      },
    };
  })
);

const stableConfig = async (
  failureProjectIds: readonly string[],
  failureMode: "none" | "timeoutBeforeWrite" | "timeoutAfterWrite" = "none"
) =>
  Effect.runPromise(
    Schema.decodeUnknownEffect(VercelStableEnvironmentMemoryConfig)({
      values: [
        {
          environmentVariableId: agentEnvironmentVariableId,
          key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          valueOwnership: managedValueOwnership(
            agentEnvironmentVariableId,
            revisionOne
          ),
          value: Redacted.make("agent-value-one"),
        },
        {
          environmentVariableId: agentEnvironmentVariableId,
          key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          valueOwnership: managedValueOwnership(
            agentEnvironmentVariableId,
            revisionTwo
          ),
          value: Redacted.make("agent-value-two"),
        },
        {
          environmentVariableId: proxyEnvironmentVariableId,
          key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          valueOwnership: managedValueOwnership(
            proxyEnvironmentVariableId,
            revisionOne
          ),
          value: Redacted.make("proxy-value-one"),
        },
      ],
      failureMode,
      failureProjectIds,
    })
  );

const makeProviders = async (
  failureProjectIds: readonly string[],
  failureMode: "none" | "timeoutBeforeWrite" | "timeoutAfterWrite" = "none"
) => {
  const memory = layerVercelMemory(fixture.inventory);
  const stable = layerVercelStableEnvironmentMemory(
    await stableConfig(failureProjectIds, failureMode)
  ).pipe(Layer.provide(memory));
  return Layer.mergeAll(
    layerVercelReadOnlyProviders(fixture.scope).pipe(
      Layer.provide(stable),
      Layer.provide(memory)
    ),
    stable,
    memory
  );
};

const mainHarness = Test.make({
  providers: await makeProviders([]),
  stage: "preview",
});

mainHarness.test.provider(
  "adopts unknown metadata, applies managed revisions, reports deployment-required, and converges to no-op",
  (stack) =>
    Effect.gen(function* proveManagedStableEnvironmentLifecycle() {
      yield* stack.deploy(
        VercelEnvironmentVariable(
          "StableAgentPhotonProject",
          fixture.agent.observed
        ).pipe(adopt(true))
      );
      const updatePlan = yield* stack.plan(
        VercelEnvironmentVariable(
          "StableAgentPhotonProject",
          fixture.agent.managedOne
        )
      );
      expect(
        Record.values(updatePlan.resources).some(
          (resource) => resource.action === "update"
        )
      ).toBe(true);
      const first = yield* stack.deploy(
        VercelEnvironmentVariable(
          "StableAgentPhotonProject",
          fixture.agent.managedOne
        )
      );
      expect(first.valueOwnership._tag).toBe("Managed");
      expect(first.deploymentRequired).toBe(true);
      expect((yield* VercelMemoryControl).providerWriteCount).toBeDefined();
      const noOp = yield* stack.plan(
        VercelEnvironmentVariable(
          "StableAgentPhotonProject",
          fixture.agent.managedOne
        )
      );
      expect(
        Record.values(noOp.resources).every(
          (resource) => resource.action === "noop"
        )
      ).toBe(true);
      yield* stack.deploy(
        VercelEnvironmentVariable(
          "StableAgentPhotonProject",
          fixture.agent.managedTwo
        )
      );
      const control = yield* VercelMemoryControl;
      expect(yield* control.providerWriteCount).toBe(2);
    })
);

mainHarness.test.provider(
  "keeps observed-unknown metadata read-only and rejects absent or single-bearer managed values",
  (stack) =>
    Effect.gen(function* rejectUnsafeStableEnvironmentPolicies() {
      yield* stack.deploy(
        Effect.all({
          photon: VercelEnvironmentVariable(
            "ObservedPhoton",
            fixture.agent.observed
          ).pipe(adopt(true)),
          token: VercelEnvironmentVariable(
            "ObservedInternalToken",
            fixture.token.observed
          ).pipe(adopt(true)),
        })
      );
      const absent = yield* stack
        .deploy(
          VercelEnvironmentVariable("ObservedPhoton", fixture.agent.absent)
        )
        .pipe(Effect.exit);
      expect(Exit.isFailure(absent)).toBe(true);
      const bearer = yield* stack
        .deploy(
          VercelEnvironmentVariable(
            "ObservedInternalToken",
            fixture.token.managed
          )
        )
        .pipe(Effect.exit);
      expect(Exit.isFailure(bearer)).toBe(true);
      const control = yield* VercelMemoryControl;
      expect(yield* control.providerWriteCount).toBe(0);
    })
);

const partialHarness = Test.make({
  providers: await makeProviders([proxyProjectId]),
  stage: "preview",
});

partialHarness.test.provider(
  "preserves the first exact write across a one-project failure and resumes without duplicating it",
  (stack) =>
    Effect.gen(function* proveStableEnvironmentPartialFailureRecovery() {
      yield* stack.deploy(
        Effect.all(
          [
            VercelEnvironmentVariable(
              "PartialAgentPhotonProject",
              fixture.agent.observed
            ).pipe(adopt(true)),
            VercelEnvironmentVariable(
              "PartialProxyPhotonProject",
              fixture.proxy.observed
            ).pipe(adopt(true)),
          ],
          { concurrency: 1 }
        )
      );
      const desired = Effect.all(
        [
          VercelEnvironmentVariable(
            "PartialAgentPhotonProject",
            fixture.agent.managedOne
          ),
          VercelEnvironmentVariable(
            "PartialProxyPhotonProject",
            fixture.proxy.managedOne
          ),
        ],
        { concurrency: 1 }
      );
      const first = yield* stack.deploy(desired).pipe(Effect.exit);
      expect(Exit.isFailure(first)).toBe(true);
      const control = yield* VercelMemoryControl;
      expect(yield* control.providerWriteCount).toBe(1);
      yield* stack.deploy(desired);
      expect(yield* control.providerWriteCount).toBe(2);
    })
);

const beforeWriteTimeoutHarness = Test.make({
  providers: await makeProviders([], "timeoutBeforeWrite"),
  stage: "preview",
});

beforeWriteTimeoutHarness.test.provider(
  "bounds known pre-write timeout retries without a provider mutation",
  (stack) =>
    Effect.gen(function* proveBoundedPreWriteRetry() {
      yield* stack.deploy(
        VercelEnvironmentVariable(
          "PreWriteTimeoutPhotonProject",
          fixture.agent.observed
        ).pipe(adopt(true))
      );
      const result = yield* stack
        .deploy(
          VercelEnvironmentVariable(
            "PreWriteTimeoutPhotonProject",
            fixture.agent.managedOne
          )
        )
        .pipe(Effect.exit);
      expect(Exit.isFailure(result)).toBe(true);
      const control = yield* VercelMemoryControl;
      expect(yield* control.stableEnvironmentAttemptCount).toBe(3);
      expect(yield* control.providerWriteCount).toBe(0);
    })
);

const afterWriteTimeoutHarness = Test.make({
  providers: await makeProviders([], "timeoutAfterWrite"),
  stage: "preview",
});

afterWriteTimeoutHarness.test.provider(
  "never retries an uncertain timeout after the exact physical write",
  (stack) =>
    Effect.gen(function* rejectBlindUncertainRetry() {
      yield* stack.deploy(
        VercelEnvironmentVariable(
          "AfterWriteTimeoutPhotonProject",
          fixture.agent.observed
        ).pipe(adopt(true))
      );
      const result = yield* stack
        .deploy(
          VercelEnvironmentVariable(
            "AfterWriteTimeoutPhotonProject",
            fixture.agent.managedOne
          )
        )
        .pipe(Effect.exit);
      expect(Exit.isFailure(result)).toBe(true);
      const control = yield* VercelMemoryControl;
      expect(yield* control.stableEnvironmentAttemptCount).toBe(1);
      expect(yield* control.providerWriteCount).toBe(1);
    })
);
