import { createHash } from "node:crypto";

import { inMemoryState, State } from "alchemy/State";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import {
  AdoptionManifest,
  AdoptionManifestDigest,
  AlchemyLogicalResourceId,
  makePreviewStateBackupStoreMemory,
  makePreviewStateMigrationLayer,
  PreviewStateMigration,
  PreviewStateMigrationPolicy,
  PreviewStateResourceFingerprint,
  PreviewStateResourceType,
  SyntheticPhysicalResourceId,
} from "../src/index.js";

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const digest = AdoptionManifestDigest.make(
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
);

const makeManifestResource = (logicalId: string) => ({
  provider: "synthetic" as const,
  resourceKind: "syntheticResource" as const,
  owner: {
    _tag: "Repository" as const,
    owner: "@bundjil/infrastructure" as const,
  },
  physicalId: {
    resourceId: SyntheticPhysicalResourceId.make(`physical-${logicalId}`),
  },
  stage: "preview" as const,
  logicalId: AlchemyLogicalResourceId.make(logicalId),
  removalPolicy: "retain" as const,
  observedMetadataDigest: digest,
});

const makeStateResource = (logicalId: string, resourceType: string) => ({
  resourceType,
  namespace: undefined,
  fqn: logicalId,
  logicalId,
  instanceId: `instance-${logicalId}`,
  providerVersion: 1,
  status: "updated" as const,
  downstream: [],
  bindings: [],
  props: { stage: "preview" },
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

const seedState = Effect.gen(function* seedPreviewState() {
  const resolveState = yield* State;
  const state = yield* resolveState;
  yield* Effect.forEach(
    [
      makeStateResource("desired-1", "DesiredObservation"),
      makeStateResource("desired-2", "DesiredObservation"),
      makeStateResource("desired-3", "DesiredObservation"),
      makeStateResource("stale", "StalePhotonObservation"),
    ],
    (resource) =>
      state.set({
        stack: "BundjilInfrastructure",
        stage: "preview",
        fqn: resource.fqn,
        value: resource,
      }),
    { discard: true }
  );
});

describe("Preview state migration", () => {
  it("backs up and retires only the exact stale row, then restores exactly", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* exactMigrationJourney() {
        yield* seedState;
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
        yield* seedState;
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
});
