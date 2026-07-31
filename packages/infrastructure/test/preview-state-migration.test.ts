import { createHash } from "node:crypto";

import { inMemoryState, State } from "alchemy/State";
import { Effect, Layer, Redacted, Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  AdoptionManifest,
  AdoptionManifestDigest,
  AlchemyLogicalResourceId,
  makePreviewStateBackupStoreMemory,
  makePreviewStateMigrationLayer,
  PreviewStateMigration,
  PreviewStateMigrationPolicy,
  PreviewStateForbiddenValue,
  PreviewStateResourceFingerprint,
  PreviewStateResourceType,
  SyntheticPhysicalResourceId,
} from "../src/index.js";

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const digest = AdoptionManifestDigest.make(
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
);

const makeManifestResource = (
  logicalId: string,
  stage: "preview" | "prod" = "preview"
) => ({
  provider: "synthetic" as const,
  resourceKind: "syntheticResource" as const,
  owner: {
    _tag: "Repository" as const,
    owner: "@bundjil/infrastructure" as const,
  },
  physicalId: {
    resourceId: SyntheticPhysicalResourceId.make(`physical-${logicalId}`),
  },
  stage,
  logicalId: AlchemyLogicalResourceId.make(logicalId),
  removalPolicy: "retain" as const,
  observedMetadataDigest: digest,
});

const makeStateResource = (
  logicalId: string,
  resourceType: string,
  stage: "preview" | "prod" = "preview"
) => ({
  resourceType,
  namespace: undefined,
  fqn: logicalId,
  logicalId,
  instanceId: `instance-${logicalId}`,
  providerVersion: 1,
  status: "updated" as const,
  downstream: [],
  bindings: [],
  props: { stage },
  attr: { identity: `physical-${logicalId}` },
  removalPolicy: "retain" as const,
});

const manifest = AdoptionManifest.make({
  schemaVersion: "1",
  stage: "preview",
  digest,
  resources: [
    makeManifestResource("desired-1"),
    makeManifestResource("desired-2"),
    makeManifestResource("desired-3"),
    makeManifestResource("desired-4"),
    makeManifestResource("desired-5"),
  ],
});

const staleFingerprint = PreviewStateResourceFingerprint.make(sha256("stale"));

const policy = PreviewStateMigrationPolicy.make({
  stage: "preview",
  currentCount: 4,
  desiredCount: 5,
  staleFingerprints: [staleFingerprint],
  staleResourceTypes: [PreviewStateResourceType.make("StalePhotonObservation")],
});

const makeLayers = () => {
  const state = inMemoryState();
  const backup = makePreviewStateBackupStoreMemory();
  const dependencies = Layer.merge(state, backup);
  const migration = makePreviewStateMigrationLayer(policy).pipe(
    Layer.provide(dependencies)
  );
  return Layer.merge(dependencies, migration);
};

const seedState = (stage: "preview" | "prod" = "preview") =>
  Effect.gen(function* seedStateOperation() {
    const resolveState = yield* State;
    const state = yield* resolveState;
    yield* Effect.forEach(
      [
        makeStateResource("desired-1", "DesiredObservation", stage),
        makeStateResource("desired-2", "DesiredObservation", stage),
        makeStateResource("desired-3", "DesiredObservation", stage),
        makeStateResource("stale", "StalePhotonObservation", stage),
      ],
      (resource) =>
        state.set({
          stack: "BundjilInfrastructure",
          stage,
          fqn: resource.fqn,
          value: resource,
        }),
      { discard: true }
    );
  });

describe("Preview state migration", () => {
  it("keeps forbidden credential sentinels redacted at the leak-scan boundary", async () => {
    const accepted = await Effect.runPromise(
      Schema.decodeUnknownEffect(PreviewStateForbiddenValue)(
        Redacted.make("credential-sentinel")
      )
    );
    const rejected = await Effect.runPromise(
      Effect.exit(
        Schema.decodeUnknownEffect(PreviewStateForbiddenValue)(
          "credential-sentinel"
        )
      )
    );

    expect(Redacted.value(accepted)).toBe("credential-sentinel");
    expect(rejected._tag).toBe("Failure");
  });

  it("backs up and retires only the exact stale row, then restores exactly", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* exactMigrationJourney() {
        yield* seedState();
        const migration = yield* PreviewStateMigration;
        const planned = yield* migration.plan(manifest);
        const retired = yield* migration.retire(manifest);
        const resolveState = yield* State;
        const state = yield* resolveState;
        const afterRetire = yield* state.list({
          stack: "BundjilInfrastructure",
          stage: "preview",
        });
        yield* state.set({
          stack: "BundjilInfrastructure",
          stage: "preview",
          fqn: "desired-1",
          value: {
            ...makeStateResource("desired-1", "DesiredObservation"),
            attr: { identity: "mutated-after-backup" },
          },
        });
        yield* state.set({
          stack: "BundjilInfrastructure",
          stage: "preview",
          fqn: "post-migration",
          value: makeStateResource("post-migration", "UnexpectedObservation"),
        });
        const restored = yield* migration.restore;
        const afterRestore = yield* state.list({
          stack: "BundjilInfrastructure",
          stage: "preview",
        });
        const restoredDesired = yield* state.get({
          stack: "BundjilInfrastructure",
          stage: "preview",
          fqn: "desired-1",
        });
        return {
          planned,
          retired,
          restored,
          afterRetire,
          afterRestore,
          restoredDesired,
        };
      }).pipe(Effect.provide(makeLayers()))
    );

    expect(result.planned).toMatchObject({
      status: "planned",
      currentCount: 4,
      desiredCount: 5,
      staleCount: 1,
      retainedCount: 3,
      providerWrites: 0,
    });
    expect(result.retired.status).toBe("retired");
    expect(result.afterRetire.toSorted()).toStrictEqual([
      "desired-1",
      "desired-2",
      "desired-3",
    ]);
    expect(result.restored.status).toBe("restored");
    expect(result.afterRestore.toSorted()).toStrictEqual([
      "desired-1",
      "desired-2",
      "desired-3",
      "stale",
    ]);
    expect(result.restoredDesired).toStrictEqual(
      makeStateResource("desired-1", "DesiredObservation")
    );
  });

  it("fails closed before backup or deletion when the stale fingerprint differs", async () => {
    const rejectedPolicy = PreviewStateMigrationPolicy.make({
      ...policy,
      staleFingerprints: [
        PreviewStateResourceFingerprint.make(sha256("different")),
      ],
    });
    const state = inMemoryState();
    const backup = makePreviewStateBackupStoreMemory();
    const dependencies = Layer.merge(state, backup);
    const migration = makePreviewStateMigrationLayer(rejectedPolicy).pipe(
      Layer.provide(dependencies)
    );
    const layers = Layer.merge(dependencies, migration);

    const remaining = await Effect.runPromise(
      Effect.gen(function* rejectMismatchJourney() {
        yield* seedState();
        const service = yield* PreviewStateMigration;
        const exit = yield* Effect.exit(service.retire(manifest));
        const resolveState = yield* State;
        const stateService = yield* resolveState;
        const fqns = yield* stateService.list({
          stack: "BundjilInfrastructure",
          stage: "preview",
        });
        return { exit, fqns };
      }).pipe(Effect.provide(layers))
    );

    expect(remaining.exit._tag).toBe("Failure");
    expect(remaining.fqns).toHaveLength(4);
  });

  it("keeps Production state and manifests isolated while restoring exactly", async () => {
    const productionManifest = AdoptionManifest.make({
      schemaVersion: "1",
      stage: "prod",
      digest,
      resources: [
        makeManifestResource("desired-1", "prod"),
        makeManifestResource("desired-2", "prod"),
        makeManifestResource("desired-3", "prod"),
        makeManifestResource("desired-4", "prod"),
        makeManifestResource("desired-5", "prod"),
      ],
    });
    const productionPolicy = PreviewStateMigrationPolicy.make({
      ...policy,
      stage: "prod",
    });
    const state = inMemoryState();
    const backup = makePreviewStateBackupStoreMemory();
    const dependencies = Layer.merge(state, backup);
    const migration = makePreviewStateMigrationLayer(productionPolicy).pipe(
      Layer.provide(dependencies)
    );

    const result = await Effect.runPromise(
      Effect.gen(function* productionMigrationJourney() {
        yield* seedState("prod");
        const service = yield* PreviewStateMigration;
        const previewMismatch = yield* Effect.exit(service.plan(manifest));
        const retired = yield* service.retire(productionManifest);
        const restored = yield* service.restore;
        const resolveState = yield* State;
        const stateService = yield* resolveState;
        const productionFqns = yield* stateService.list({
          stack: "BundjilInfrastructure",
          stage: "prod",
        });
        const previewFqns = yield* stateService.list({
          stack: "BundjilInfrastructure",
          stage: "preview",
        });
        return {
          previewMismatch,
          retired,
          restored,
          productionFqns,
          previewFqns,
        };
      }).pipe(Effect.provide(Layer.merge(dependencies, migration)))
    );

    expect(result.previewMismatch._tag).toBe("Failure");
    expect(result.retired).toMatchObject({
      status: "retired",
      staleCount: 1,
      providerWrites: 0,
    });
    expect(result.restored.status).toBe("restored");
    expect(result.productionFqns).toHaveLength(4);
    expect(result.previewFqns).toHaveLength(0);
  });
});
