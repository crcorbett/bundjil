// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable eslint-plugin-vitest/prefer-importing-vitest-globals -- Alchemy Test/Bun registers these assertions with Bun. */

import { expect } from "bun:test";

import { adopt } from "alchemy/AdoptPolicy";
import { sync } from "alchemy/Sync";
import * as Test from "alchemy/Test/Bun";
import { Effect, Exit, Inspectable, Layer, Record, Schema } from "effect";

import { decodeSyntheticFixture } from "../src/__testing__/fixtures.js";
import {
  emptyMemoryConfig,
  layerMemory,
  SyntheticMemoryDrift,
  SyntheticResourcesMemoryControl,
} from "../src/memory.layer.js";
import {
  SyntheticResource,
  SyntheticResourceProvider,
} from "../src/providers.js";
import {
  AdoptionManifestDigest,
  InfrastructureDestructivePolicy,
  PreviewInfrastructureStateRevision,
  SyntheticDesiredValue,
  SyntheticPhysicalResourceId,
  SyntheticResourceAttributes,
} from "../src/schemas.js";
import { SyntheticResources } from "../src/service.js";

const syntheticMemory = layerMemory(emptyMemoryConfig);
const providers = Layer.merge(
  SyntheticResourceProvider.pipe(Layer.provide(syntheticMemory)),
  syntheticMemory
);
const { test } = Test.make({ providers, stage: "preview" });

test.provider("classifies create, no-op, update, and replacement", (stack) =>
  Effect.gen(function* testSyntheticLifecycle() {
    const { props } = yield* decodeSyntheticFixture;
    const initialPlan = yield* stack.plan(
      SyntheticResource("LifecycleResource", props)
    );
    expect(Record.values(initialPlan.resources)[0]?.action).toBe("create");
    expect(
      Inspectable.toStringUnknown(initialPlan).includes(
        "provider-secret-sentinel"
      )
    ).toBe(false);

    const deployed = yield* stack.deploy(
      SyntheticResource("LifecycleResource", props)
    );
    const encodedState = yield* Schema.encodeEffect(
      SyntheticResourceAttributes
    )(deployed);
    expect(
      Inspectable.toStringUnknown(encodedState).includes(
        "provider-secret-sentinel"
      )
    ).toBe(false);
    const noOpPlan = yield* stack.plan(
      SyntheticResource("LifecycleResource", props)
    );
    expect(Record.values(noOpPlan.resources)[0]?.action).toBe("noop");

    const desiredValue = yield* Schema.decodeUnknownEffect(
      SyntheticDesiredValue
    )("foundation-v2");
    const updatePlan = yield* stack.plan(
      SyntheticResource("LifecycleResource", {
        ...props,
        desiredValue,
      })
    );
    expect(Record.values(updatePlan.resources)[0]?.action).toBe("update");
    yield* stack.deploy(
      SyntheticResource("LifecycleResource", {
        ...props,
        desiredValue,
      })
    );

    const replacementPhysicalId = yield* Schema.decodeUnknownEffect(
      SyntheticPhysicalResourceId
    )("synthetic-preview-replacement");
    const replacePlan = yield* stack.plan(
      SyntheticResource("LifecycleResource", {
        ...props,
        desiredValue,
        physicalId: replacementPhysicalId,
      })
    );
    expect(Record.values(replacePlan.resources)[0]?.action).toBe("replace");
  })
);

test.provider(
  "denies and then permits exact adoption without a write",
  (stack) =>
    Effect.gen(function* testSyntheticAdoption() {
      const { props } = yield* decodeSyntheticFixture;
      const physicalId = yield* Schema.decodeUnknownEffect(
        SyntheticPhysicalResourceId
      )("synthetic-preview-adoption");
      const revision = yield* Schema.decodeUnknownEffect(
        PreviewInfrastructureStateRevision
      )("memory-preview-unowned");
      const adoptionProps = { ...props, physicalId };
      const control = yield* SyntheticResourcesMemoryControl;
      const mismatchedDigest = yield* Schema.decodeUnknownEffect(
        AdoptionManifestDigest
      )("cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
      yield* control.seedResource(
        SyntheticResourceAttributes.make({
          stage: "preview",
          physicalId,
          observedValue: props.desiredValue,
          observedMetadataDigest: mismatchedDigest,
          ownership: "Unowned",
          stateRevision: { _tag: "Preview", revision },
        })
      );
      const writesBefore = yield* control.writeCount;
      const denied = yield* stack
        .plan(
          SyntheticResource("AdoptionResource", adoptionProps).pipe(adopt(true))
        )
        .pipe(Effect.exit);
      expect(Exit.isFailure(denied)).toBe(true);

      yield* control.seedResource(
        SyntheticResourceAttributes.make({
          stage: "preview",
          physicalId,
          observedValue: props.desiredValue,
          observedMetadataDigest: props.adoptionManifestDigest,
          ownership: "Unowned",
          stateRevision: { _tag: "Preview", revision },
        })
      );
      const adoptFlagDenied = yield* stack
        .plan(SyntheticResource("AdoptionResource", adoptionProps))
        .pipe(Effect.exit);
      expect(Exit.isFailure(adoptFlagDenied)).toBe(true);

      yield* stack.deploy(
        SyntheticResource("AdoptionResource", adoptionProps).pipe(adopt(true))
      );
      const writesAfter = yield* control.writeCount;
      expect(writesAfter.count).toBe(writesBefore.count);
    })
);

test.provider(
  "recovers timeout-after-write and repairs native sync drift",
  (stack) =>
    Effect.gen(function* testSyntheticRecoveryAndSync() {
      const { props } = yield* decodeSyntheticFixture;
      const physicalId = yield* Schema.decodeUnknownEffect(
        SyntheticPhysicalResourceId
      )("synthetic-preview-recovery");
      const recoveryProps = {
        ...props,
        physicalId,
      };
      yield* stack.deploy(SyntheticResource("RecoveryResource", recoveryProps));

      const control = yield* SyntheticResourcesMemoryControl;
      yield* control.setFailureMode("timeoutAfterWrite");
      const desiredValue = yield* Schema.decodeUnknownEffect(
        SyntheticDesiredValue
      )("foundation-timeout-recovered");
      const recovered = yield* stack.deploy(
        SyntheticResource("RecoveryResource", {
          ...recoveryProps,
          desiredValue,
        })
      );
      expect(recovered.observedValue).toBe(desiredValue);

      const driftedValue = yield* Schema.decodeUnknownEffect(
        SyntheticDesiredValue
      )("foundation-drifted");
      yield* control.setDrift(
        SyntheticMemoryDrift.make({
          physicalId,
          observedValue: driftedValue,
        })
      );
      const dryRun = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: true }
      ).pipe(Effect.provide(stack.state));
      expect(Record.values(dryRun.resources)[0]?.action).toBe("drifted");

      const repaired = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: false }
      ).pipe(Effect.provide(stack.state));
      expect(Record.values(repaired.resources)[0]?.action).toBe("repaired");
      const unchanged = yield* sync(
        { name: stack.name, stage: "preview" },
        { dryRun: true }
      ).pipe(Effect.provide(stack.state));
      expect(Record.values(unchanged.resources)[0]?.action).toBe("unchanged");
    })
);

test.provider("retains resources and rejects protected deletion", (stack) =>
  Effect.gen(function* testSyntheticRetention() {
    const { props } = yield* decodeSyntheticFixture;
    const physicalId = yield* Schema.decodeUnknownEffect(
      SyntheticPhysicalResourceId
    )("synthetic-preview-retained");
    const deployed = yield* stack.deploy(
      SyntheticResource("RetainedResource", {
        ...props,
        physicalId,
      })
    );
    yield* stack.destroy();
    const control = yield* SyntheticResourcesMemoryControl;
    const retained = yield* control.snapshot;
    expect(retained.resources.length > 0).toBe(true);

    const resources = yield* SyntheticResources;
    const protectedDelete = yield* resources
      .deleteResource({
        attributes: deployed,
        destructivePolicy: { _tag: "Protected" },
      })
      .pipe(Effect.exit);
    expect(Exit.isFailure(protectedDelete)).toBe(true);
  })
);

test.provider(
  "bounds pre-write and eventual-consistency failures and heals by observation",
  (stack) =>
    Effect.gen(function* testSyntheticBoundedFailures() {
      const { props } = yield* decodeSyntheticFixture;
      const physicalId = yield* Schema.decodeUnknownEffect(
        SyntheticPhysicalResourceId
      )("synthetic-preview-bounded-failures");
      const failureProps = { ...props, physicalId };
      const control = yield* SyntheticResourcesMemoryControl;

      const writesBefore = yield* control.writeCount;
      yield* control.setFailureMode("timeoutBeforeWrite");
      const beforeWriteFailure = yield* stack
        .deploy(SyntheticResource("BoundedFailureResource", failureProps))
        .pipe(Effect.exit);
      expect(Exit.isFailure(beforeWriteFailure)).toBe(true);
      expect((yield* control.writeCount).count).toBe(writesBefore.count);

      yield* control.setFailureMode("none");
      yield* stack.deploy(
        SyntheticResource("BoundedFailureResource", failureProps)
      );
      const nextValue = yield* Schema.decodeUnknownEffect(
        SyntheticDesiredValue
      )("foundation-eventual-consistency");
      yield* control.setFailureMode("timeoutAfterWriteEventualConsistency");
      const exhausted = yield* stack
        .deploy(
          SyntheticResource("BoundedFailureResource", {
            ...failureProps,
            desiredValue: nextValue,
          })
        )
        .pipe(Effect.exit);
      expect(Exit.isFailure(exhausted)).toBe(true);

      yield* control.setFailureMode("none");
      const writesAfterUncertainWrite = yield* control.writeCount;
      const healed = yield* stack.deploy(
        SyntheticResource("BoundedFailureResource", {
          ...failureProps,
          desiredValue: nextValue,
        })
      );
      expect(healed.observedValue).toBe(nextValue);
      expect((yield* control.writeCount).count).toBe(
        writesAfterUncertainWrite.count
      );
      expect(
        Inspectable.toStringUnknown(exhausted).includes(
          "provider-secret-sentinel"
        )
      ).toBe(false);
    })
);

test.provider(
  "recovers an owned remote after local state loss without a second write",
  (stack) =>
    Effect.gen(function* testSyntheticStateWriteRecovery() {
      const { props } = yield* decodeSyntheticFixture;
      const physicalId = yield* Schema.decodeUnknownEffect(
        SyntheticPhysicalResourceId
      )("synthetic-preview-state-recovery");
      const revision = yield* Schema.decodeUnknownEffect(
        PreviewInfrastructureStateRevision
      )("memory-preview-state-recovery");
      const control = yield* SyntheticResourcesMemoryControl;
      yield* control.seedResource(
        SyntheticResourceAttributes.make({
          stage: "preview",
          physicalId,
          observedValue: props.desiredValue,
          observedMetadataDigest: props.adoptionManifestDigest,
          ownership: "Owned",
          stateRevision: { _tag: "Preview", revision },
        })
      );
      const writesBefore = yield* control.writeCount;
      const recovered = yield* stack.deploy(
        SyntheticResource("StateRecoveryResource", {
          ...props,
          physicalId,
        })
      );
      expect(recovered.physicalId).toBe(physicalId);
      expect((yield* control.writeCount).count).toBe(writesBefore.count);
    })
);

test.provider("permits explicit deletion and treats missing as success", () =>
  Effect.gen(function* testSyntheticIdempotentDelete() {
    const { props } = yield* decodeSyntheticFixture;
    const revision = yield* Schema.decodeUnknownEffect(
      PreviewInfrastructureStateRevision
    )("memory-preview-delete");
    const control = yield* SyntheticResourcesMemoryControl;
    const attributes = SyntheticResourceAttributes.make({
      stage: "preview",
      physicalId: props.physicalId,
      observedValue: props.desiredValue,
      observedMetadataDigest: props.adoptionManifestDigest,
      ownership: "Owned",
      stateRevision: { _tag: "Preview", revision },
    });
    yield* control.seedResource(attributes);
    const destructivePolicy = yield* Schema.decodeUnknownEffect(
      InfrastructureDestructivePolicy
    )({
      _tag: "Permitted",
      approvalReceipt: "local-test-delete-approval",
    });
    const resources = yield* SyntheticResources;
    const deleted = yield* resources.deleteResource({
      attributes,
      destructivePolicy,
    });
    const alreadyMissing = yield* resources.deleteResource({
      attributes,
      destructivePolicy,
    });
    expect(deleted.result).toBe("deleted");
    expect(alreadyMissing.result).toBe("alreadyMissing");
  })
);
