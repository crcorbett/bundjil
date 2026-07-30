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
      environmentVariables: [
        {
          stage: "preview",
          teamId: "team-preview",
          projectId: "prj-agent",
          environmentVariableId: "env-photon-project",
          key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          valueOwnership: { _tag: "ObservedUnknown", configured: true },
          deploymentRequired: false,
          ownership: "Unowned",
        },
        {
          stage: "preview",
          teamId: "team-preview",
          projectId: "prj-agent",
          environmentVariableId: "env-photon-project-secret",
          key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          valueOwnership: { _tag: "ObservedUnknown", configured: true },
          deploymentRequired: false,
          ownership: "Unowned",
        },
        {
          stage: "preview",
          teamId: "team-preview",
          projectId: "prj-agent",
          environmentVariableId: "env-photon-webhook",
          key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          valueOwnership: { _tag: "ObservedUnknown", configured: true },
          deploymentRequired: false,
          ownership: "Unowned",
        },
        {
          stage: "preview",
          teamId: "team-preview",
          projectId: "prj-agent",
          environmentVariableId: "env-photon-webhook-secret",
          key: "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          valueOwnership: { _tag: "ObservedUnknown", configured: true },
          deploymentRequired: false,
          ownership: "Unowned",
        },
        {
          stage: "preview",
          teamId: "team-preview",
          projectId: "prj-agent",
          environmentVariableId: "env-internal-token",
          key: "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          type: "sensitive",
          targets: ["preview"],
          sensitive: true,
          valueOwnership: { _tag: "ObservedUnknown", configured: true },
          deploymentRequired: false,
          ownership: "Unowned",
        },
      ],
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
      assert.strictEqual(manifest.resources.length, 8);
      assert.deepStrictEqual(
        manifest.resources.map((resource) => resource.resourceKind),
        [
          "vercelEnvironmentVariable",
          "vercelEnvironmentVariable",
          "vercelEnvironmentVariable",
          "vercelEnvironmentVariable",
          "vercelEnvironmentVariable",
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
  "classifies only the four exact Preview Photon bindings as managed",
  () =>
    Effect.gen(function* testManagedPreviewPhotonProfile() {
      const inventory = yield* decodeInventoryFixture;
      const manifest = yield* buildAdoptionManifest(
        inventory,
        "previewPhotonManaged"
      );
      const environmentResources = manifest.resources.filter(
        (resource) => resource.resourceKind === "vercelEnvironmentVariable"
      );
      const managed = environmentResources.filter(
        (resource) => resource.desired.valueOwnership._tag === "Managed"
      );
      assert.strictEqual(managed.length, 4);
      assert.strictEqual(
        managed.every(
          (resource) =>
            resource.desired.valueOwnership._tag === "Managed" &&
            resource.desired.valueOwnership.reference.owner ===
              "@bundjil/infrastructure/vercel/preview-photon" &&
            String(resource.desired.valueOwnership.reference.reference) ===
              String(resource.physicalId.environmentVariableId) &&
            String(resource.desired.valueOwnership.reference.revision) ===
              String(inventory.sourceSha)
        ),
        true
      );
      const internalToken = environmentResources.find(
        (resource) =>
          resource.desired.key === "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
      );
      assert.strictEqual(
        internalToken?.desired.valueOwnership._tag,
        "ObservedUnknown"
      );
      const wrongProfile = yield* verifyAdoptionManifestAgainstInventory(
        inventory,
        manifest,
        "observedOnly"
      ).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(wrongProfile), true);
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
