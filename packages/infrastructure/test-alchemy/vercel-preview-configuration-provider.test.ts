// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable eslint-plugin-vitest/prefer-importing-vitest-globals -- Alchemy Test/Bun registers these assertions with Bun. */

import { expect } from "bun:test";

import { adopt } from "alchemy/AdoptPolicy";
import { destroy } from "alchemy/RemovalPolicy";
import { sync } from "alchemy/Sync";
import * as Test from "alchemy/Test/Bun";
import { Effect, Exit, Layer, Record, Schema } from "effect";

import {
  layerVercelPreviewConfigurationMemory,
  layerVercelPreviewConfigurationProviders,
  VercelPreviewConfiguration,
  VercelPreviewConfigurationMemoryConfig,
  VercelPreviewConfigurationMemoryControl,
  VercelPreviewEnvironmentMetadata,
  VercelPreviewEnvironmentMetadataProps,
  VercelPreviewEnvironmentValue,
  VercelPreviewFeedback,
  VercelPreviewFeedbackAttributes,
  VercelPreviewFeedbackProps,
} from "../src/vercel/index.js";

const fixture = await Effect.runPromise(
  Effect.gen(function* decodePreviewConfigurationFixture() {
    const feedback = yield* Schema.decodeUnknownEffect(
      VercelPreviewFeedbackProps
    )({
      stage: "preview",
      teamId: "team-preview",
      projectId: "prj-agent",
      desired: true,
      productionGuard: null,
    });
    const value = yield* Schema.decodeUnknownEffect(
      VercelPreviewEnvironmentValue
    )("alchemy-preview-spike");
    const environmentMetadata = yield* Schema.decodeUnknownEffect(
      VercelPreviewEnvironmentMetadataProps
    )({
      stage: "preview",
      teamId: feedback.teamId,
      projectId: feedback.projectId,
      key: "BUNDJIL_ALCHEMY_PREVIEW_SPIKE",
      value,
      destructivePolicy: {
        _tag: "Permitted",
        approvalReceipt: "preview-configuration-spike-authority",
      },
    });
    const before = VercelPreviewFeedbackAttributes.make({
      stage: "preview",
      teamId: feedback.teamId,
      projectId: feedback.projectId,
      enabled: null,
      productionEnabled: null,
      ownership: "Unowned",
    });
    return { before, environmentMetadata, feedback };
  })
);

const memory = layerVercelPreviewConfigurationMemory(
  VercelPreviewConfigurationMemoryConfig.make({
    feedback: [fixture.before],
    environmentMetadata: [],
    failureMode: "none",
  })
);
const providers = Layer.merge(
  layerVercelPreviewConfigurationProviders({
    feedback: fixture.feedback,
    environmentMetadata: fixture.environmentMetadata,
  }).pipe(Layer.provide(memory)),
  memory
);
const { test } = Test.make({ providers, stage: "preview" });

const desiredStack = Effect.all({
  feedback: VercelPreviewFeedback("PreviewFeedback", fixture.feedback).pipe(
    adopt(true)
  ),
  environmentMetadata: VercelPreviewEnvironmentMetadata(
    "PreviewEnvironmentMetadata",
    fixture.environmentMetadata
  ).pipe(destroy()),
});

test.provider(
  "converges, reports no-op, detects drift, repairs, and rolls back exactly",
  (stack) =>
    Effect.gen(function* provePreviewConfigurationLifecycle() {
      const planned = yield* stack.plan(desiredStack);
      const actions = Record.values(planned.resources).map(
        (resource) => resource.action
      );
      expect(actions).toContain("create");
      expect(actions).toContain("update");

      const deployed = yield* stack.deploy(desiredStack);
      expect(deployed.feedback.enabled).toBe(true);
      expect(deployed.feedback.productionEnabled).toBeNull();
      expect(deployed.environmentMetadata.targets).toEqual(["preview"]);
      const writesAfterDeploy =
        yield* VercelPreviewConfigurationMemoryControl.pipe(
          Effect.flatMap((control) => control.writeCount)
        );
      expect(writesAfterDeploy.count).toBe(2);

      const noOp = yield* stack.plan(desiredStack);
      expect(
        Record.values(noOp.resources).every(
          (resource) => resource.action === "noop"
        )
      ).toBe(true);

      const control = yield* VercelPreviewConfigurationMemoryControl;
      yield* control.setFeedbackDrift({
        stage: "preview",
        teamId: fixture.feedback.teamId,
        projectId: fixture.feedback.projectId,
        enabled: false,
      });
      const drift = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: true }
      ).pipe(Effect.provide(stack.state));
      expect(
        Record.values(drift.resources).some(
          (resource) => resource.action === "drifted"
        )
      ).toBe(true);
      const repaired = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: false }
      ).pipe(Effect.provide(stack.state));
      expect(
        Record.values(repaired.resources).some(
          (resource) => resource.action === "repaired"
        )
      ).toBe(true);
      const unchanged = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: true }
      ).pipe(Effect.provide(stack.state));
      expect(
        Record.values(unchanged.resources).every(
          (resource) => resource.action === "unchanged"
        )
      ).toBe(true);

      const rollbackFeedback = VercelPreviewFeedback(
        "PreviewFeedback",
        VercelPreviewFeedbackProps.make({
          ...fixture.feedback,
          desired: null,
        })
      );
      const rollback = yield* stack.deploy(rollbackFeedback);
      expect(rollback.enabled).toBeNull();
      const snapshot = yield* control.snapshot;
      expect(snapshot.feedback[0]?.enabled).toBeNull();
      expect(snapshot.feedback[0]?.productionEnabled).toBeNull();
      expect(snapshot.environmentMetadata).toEqual([]);
    })
);

test.provider(
  "observes uncertain writes, bounds eventual consistency, and never retries a known pre-write failure",
  (stack) =>
    Effect.gen(function* provePreviewConfigurationRecovery() {
      const control = yield* VercelPreviewConfigurationMemoryControl;
      yield* control.setFailureMode("timeoutBeforeWrite");
      const writesBefore = yield* control.writeCount;
      const knownFailure = yield* stack.deploy(desiredStack).pipe(Effect.exit);
      expect(Exit.isFailure(knownFailure)).toBe(true);
      expect((yield* control.writeCount).count).toBe(writesBefore.count);

      yield* control.setFailureMode("none");
      yield* stack.deploy(desiredStack);
      yield* control.setFeedbackDrift({
        stage: "preview",
        teamId: fixture.feedback.teamId,
        projectId: fixture.feedback.projectId,
        enabled: false,
      });
      yield* control.setFailureMode("timeoutAfterWrite");
      const recovered = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: false }
      ).pipe(Effect.provide(stack.state));
      expect(
        Record.values(recovered.resources).some(
          (resource) => resource.action === "repaired"
        )
      ).toBe(true);

      yield* control.setFeedbackDrift({
        stage: "preview",
        teamId: fixture.feedback.teamId,
        projectId: fixture.feedback.projectId,
        enabled: false,
      });
      yield* control.setFailureMode("timeoutAfterWriteEventualConsistency");
      const observationsBefore = yield* control.observationCount;
      const bounded = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: false }
      ).pipe(Effect.provide(stack.state), Effect.exit);
      expect(Exit.isFailure(bounded)).toBe(true);
      expect((yield* control.observationCount).count).toBe(
        observationsBefore.count + 7
      );

      yield* control.setFailureMode("none");
      const writesBeforeHealing = yield* control.writeCount;
      yield* stack.deploy(desiredStack);
      expect((yield* control.writeCount).count).toBe(writesBeforeHealing.count);
    })
);

test.provider(
  "retains the project setting and rejects environment deletion without exact permission",
  (stack) =>
    Effect.gen(function* provePreviewConfigurationProtection() {
      yield* stack.deploy(desiredStack);
      const configuration = yield* VercelPreviewConfiguration;
      const snapshot = yield* VercelPreviewConfigurationMemoryControl.pipe(
        Effect.flatMap((control) => control.snapshot)
      );
      const [environmentMetadata] = snapshot.environmentMetadata;
      if (environmentMetadata === undefined) {
        return yield* Effect.die(
          "The Preview environment fixture was not created."
        );
      }
      const denied = yield* configuration
        .deletePreviewEnvironmentMetadata({
          attributes: environmentMetadata,
          destructivePolicy: { _tag: "Protected" },
        })
        .pipe(Effect.exit);
      expect(Exit.isFailure(denied)).toBe(true);
      return yield* Effect.void;
    })
);
