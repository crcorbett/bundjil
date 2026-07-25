import { assert, it } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";

import {
  AdoptionManifest,
  buildAdoptionManifest,
  InfrastructureInventoryArtifact,
  verifyAdoptionManifestAgainstInventory,
} from "../src/index.js";

const decodeAdoptionManifestUnknown = (input: unknown) =>
  Schema.decodeUnknownEffect(AdoptionManifest)(input, {
    onExcessProperty: "error",
  });

const inventoryDigest =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const photonProjectId = "f8efe9d0-708c-41bb-8010-a116978223be";

const decodeInventoryFixture = Schema.decodeUnknownEffect(
  InfrastructureInventoryArtifact
)({
  schemaVersion: "1",
  sourceSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  principalFingerprint:
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  observedAt: "2026-07-25T17:00:00.000Z",
  manifestDigest: inventoryDigest,
  manifest: {
    schemaVersion: "1",
    stage: "preview",
    vercel: {
      projects: [],
      domains: [],
      environmentVariables: [],
      marketplaceBindings: [],
      deployments: [],
    },
    photon: {
      project: {
        _tag: "Found",
        projectId: photonProjectId,
        profileConfigured: true,
      },
      platform: {
        _tag: "Found",
        attributes: {
          projectId: photonProjectId,
          platform: "imessage",
          enabled: true,
          autoScale: false,
          serviceType: "shared",
        },
      },
      sharedUsers: { users: [], total: 0, nextOffset: null },
      webhooks: { webhooks: [] },
      lines: { lines: [] },
      billing: {
        _tag: "Unavailable",
        projectId: photonProjectId,
      },
    },
    providerWrites: 0,
  },
});

it.effect(
  "builds and round trips the exact retain-only adoption manifest",
  () =>
    Effect.gen(function* testAdoptionManifestRoundTrip() {
      const inventory = yield* decodeInventoryFixture;
      const manifest = yield* buildAdoptionManifest(inventory);
      assert.strictEqual(manifest.stage, "preview");
      assert.strictEqual(manifest.resources.length, 3);
      assert.deepStrictEqual(
        manifest.resources.map((resource) => resource.resourceKind),
        [
          "photonProjectObservation",
          "photonPlatformConfiguration",
          "photonBillingObservation",
        ]
      );
      assert.strictEqual(
        manifest.resources.every(
          (resource) =>
            resource.removalPolicy === "retain" &&
            resource.observedMetadataDigest === manifest.digest
        ),
        true
      );
      const encoded = yield* Schema.encodeEffect(AdoptionManifest)(manifest);
      const decoded = yield* decodeAdoptionManifestUnknown(encoded);
      const verified = yield* verifyAdoptionManifestAgainstInventory(
        inventory,
        decoded
      );
      assert.deepStrictEqual(verified, manifest);
    })
);

it.effect(
  "rejects stage, physical identity, digest, logical rename, retain, and secret false greens",
  () =>
    Effect.gen(function* testAdoptionManifestNegativeCases() {
      const inventory = yield* decodeInventoryFixture;
      const manifest = yield* buildAdoptionManifest(inventory);
      const encoded = yield* Schema.encodeEffect(AdoptionManifest)(manifest);
      const [first] = encoded.resources;
      assert.notStrictEqual(first, undefined);
      if (first === undefined) {
        return;
      }

      const wrongStage = yield* decodeAdoptionManifestUnknown({
        ...encoded,
        resources: [{ ...first, stage: "prod" }, ...encoded.resources.slice(1)],
      }).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(wrongStage), true);

      const wrongPhysicalIdentity = yield* decodeAdoptionManifestUnknown({
        ...encoded,
        resources: [
          {
            ...first,
            physicalId: {
              projectId: "8e72466d-101f-4c45-a6da-9bdaf7862fe7",
            },
            owner: {
              _tag: "PhotonProject",
              projectId: "8e72466d-101f-4c45-a6da-9bdaf7862fe7",
            },
          },
          ...encoded.resources.slice(1),
        ],
      }).pipe(
        Effect.flatMap((candidate) =>
          verifyAdoptionManifestAgainstInventory(inventory, candidate)
        ),
        Effect.exit
      );
      assert.strictEqual(Exit.isFailure(wrongPhysicalIdentity), true);

      const changedDigest =
        "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
      const wrongDigest = yield* decodeAdoptionManifestUnknown({
        ...encoded,
        digest: changedDigest,
        resources: encoded.resources.map((resource) => ({
          ...resource,
          observedMetadataDigest: changedDigest,
        })),
      }).pipe(
        Effect.flatMap((candidate) =>
          verifyAdoptionManifestAgainstInventory(inventory, candidate)
        ),
        Effect.exit
      );
      assert.strictEqual(Exit.isFailure(wrongDigest), true);

      const renamedLogicalId = yield* decodeAdoptionManifestUnknown({
        ...encoded,
        resources: [
          { ...first, logicalId: "photon-project:renamed" },
          ...encoded.resources.slice(1),
        ],
      }).pipe(
        Effect.flatMap((candidate) =>
          verifyAdoptionManifestAgainstInventory(inventory, candidate)
        ),
        Effect.exit
      );
      assert.strictEqual(Exit.isFailure(renamedLogicalId), true);

      const { removalPolicy: _removed, ...withoutRetain } = first;
      const missingRetain = yield* decodeAdoptionManifestUnknown({
        ...encoded,
        resources: [withoutRetain, ...encoded.resources.slice(1)],
      }).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(missingRetain), true);

      const secretBearing = yield* decodeAdoptionManifestUnknown({
        ...encoded,
        resources: [
          { ...first, secret: "state-secret-sentinel" },
          ...encoded.resources.slice(1),
        ],
      }).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(secretBearing), true);
    })
);
