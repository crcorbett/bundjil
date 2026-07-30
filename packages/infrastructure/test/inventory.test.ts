import { PhotonE164PhoneNumber } from "@bundjil/photon/config";
import {
  layerPhotonManagementMemory,
  PhotonBillingAttributes,
  PhotonCallbackOrigin,
  PhotonCallbackPath,
  PhotonManagementMemoryInventory,
  PhotonPlatformAttributes,
  PhotonProjectAttributes,
  PhotonProjectId,
  PhotonProjectName,
  PhotonProjectSlug,
  PhotonSubscriptionTier,
  PhotonUserId,
  PhotonWebhookId,
} from "@bundjil/photon/management";
import { assert, it as effectIt } from "@effect/vitest";
import { Ajv2020 } from "ajv/dist/2020.js";
import { Effect, Layer, Redacted, Schema } from "effect";

import authorityEnvelopeContract from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import readOnlyInventoryAuthorityPolicy from "../schemas/read-only-inventory-authority.schema.json" with { type: "json" };
import {
  canonicalizeInfrastructureObservedManifest,
  InfrastructureInventory,
  InfrastructureInventoryArtifact,
  InfrastructureInventoryArtifactJson,
  InfrastructureInventoryDigest,
  InfrastructureInventoryLive,
  InfrastructureInventoryPrincipalFingerprint,
  InfrastructureInventorySourceSha,
  InfrastructureInventoryTarget,
} from "../src/index.js";
import {
  layerVercelMemory,
  VercelCanonicalDomain,
  VercelDeploymentId,
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableKey,
  VercelGitSha,
  VercelProjectId,
  VercelProjectName,
  VercelReadOnlyInventory,
  VercelTeamId,
} from "../src/vercel/index.js";

const teamId = VercelTeamId.make("team_inventory");
const projectId = VercelProjectId.make("prj_inventory");
const photonProjectId = PhotonProjectId.make(
  "00000000-0000-4000-8000-000000000001"
);

const vercelInventory = VercelReadOnlyInventory.make({
  projects: [
    {
      stage: "preview",
      teamId,
      projectId,
      name: VercelProjectName.make("bundjil-agent"),
      framework: "other",
      rootDirectory: null,
      ownership: "Unowned",
    },
  ],
  domains: [
    {
      stage: "preview",
      teamId,
      projectId,
      domain: VercelCanonicalDomain.make("bundjil-agent.vercel.app"),
      verified: true,
      ownership: "Unowned",
    },
  ],
  environmentVariables: [
    {
      stage: "preview",
      teamId,
      projectId,
      environmentVariableId: VercelEnvironmentVariableId.make("env_inventory"),
      key: VercelEnvironmentVariableKey.make("SAFE_METADATA_ONLY"),
      type: "sensitive",
      targets: ["preview"],
      sensitive: true,
      valueOwnership: { _tag: "ObservedUnknown", configured: true },
      deploymentRequired: false,
      ownership: "Unowned",
    },
  ],
  marketplaceBindings: [],
  deployments: [
    {
      stage: "preview",
      teamId,
      projectId,
      deploymentId: VercelDeploymentId.make("dpl_inventory"),
      gitSha: VercelGitSha.make("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
      target: "preview",
      status: "READY",
      aliases: [],
      ownership: "Unowned",
    },
  ],
});

const photonInventory = PhotonManagementMemoryInventory.make({
  project: PhotonProjectAttributes.make({
    projectId: photonProjectId,
    name: PhotonProjectName.make("inventory-project"),
    slug: PhotonProjectSlug.make("inventory-project"),
    profileConfigured: true,
  }),
  platform: PhotonPlatformAttributes.make({
    projectId: photonProjectId,
    platform: "imessage",
    enabled: true,
    autoScale: false,
    serviceType: "shared",
  }),
  sharedUsers: [
    {
      attributes: {
        projectId: photonProjectId,
        userId: PhotonUserId.make("00000000-0000-4000-8000-000000000002"),
        serviceType: "shared",
        assignmentPresent: true,
      },
      phoneNumber: Redacted.make(PhotonE164PhoneNumber.make("+61400000000")),
    },
  ],
  webhooks: [
    {
      attributes: {
        projectId: photonProjectId,
        webhookId: PhotonWebhookId.make("00000000-0000-4000-8000-000000000003"),
        callbackOrigin: PhotonCallbackOrigin.make("https://example.invalid"),
        callbackPath: PhotonCallbackPath.make("/eve/v1/photon/webhook"),
        queryPresent: false,
        signingSecret: { _tag: "ObservedUnknown", configured: true },
      },
      callbackUrl: Redacted.make(
        "https://example.invalid/eve/v1/photon/webhook"
      ),
    },
  ],
  lines: [],
  billing: PhotonBillingAttributes.make({
    projectId: photonProjectId,
    tier: PhotonSubscriptionTier.make("free"),
    status: "active",
    cancelAtPeriodEnd: false,
  }),
});

const inventoryLayer = InfrastructureInventoryLive.pipe(
  Layer.provide(
    Layer.merge(
      layerVercelMemory(vercelInventory),
      layerPhotonManagementMemory(photonInventory)
    )
  )
);

effectIt.effect(
  "reads one deterministic metadata-only inventory and encodes its artifact",
  () =>
    Effect.gen(function* testInventoryReadAndEncoding() {
      const inventory = yield* InfrastructureInventory;
      const manifest = yield* inventory.read(
        InfrastructureInventoryTarget.make({
          stage: "preview",
          vercelTeamId: teamId,
          vercelProjectIds: [projectId],
          photonProjectId,
        })
      );
      const canonical =
        yield* canonicalizeInfrastructureObservedManifest(manifest);
      assert.strictEqual(canonical.providerWrites, 0);
      assert.strictEqual(canonical.vercel.projects.length, 1);
      assert.strictEqual(canonical.photon.sharedUsers.users.length, 1);
      assert.strictEqual(canonical.photon.lines.lines.length, 0);

      const artifact = InfrastructureInventoryArtifact.make({
        schemaVersion: "1",
        sourceSha: InfrastructureInventorySourceSha.make(
          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        ),
        principalFingerprint: InfrastructureInventoryPrincipalFingerprint.make(
          "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        ),
        observedAt: "2026-07-24T22:00:00.000Z",
        manifestDigest: InfrastructureInventoryDigest.make(
          "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
        ),
        manifest: canonical,
      });
      const encoded = yield* Schema.encodeEffect(
        InfrastructureInventoryArtifactJson
      )(artifact);
      const decoded = yield* Schema.decodeEffect(
        InfrastructureInventoryArtifactJson
      )(encoded);
      assert.deepStrictEqual(decoded, artifact);
      assert.strictEqual(encoded.includes("+61400000000"), false);
      assert.strictEqual(encoded.includes("inventory-project"), false);
      assert.strictEqual(encoded.includes("provider-secret-sentinel"), false);
    }).pipe(Effect.provide(inventoryLayer))
);

effectIt.effect("rejects a missing authorized Vercel physical identity", () =>
  Effect.gen(function* testMissingProject() {
    const inventory = yield* InfrastructureInventory;
    const exit = yield* inventory
      .read(
        InfrastructureInventoryTarget.make({
          stage: "preview",
          vercelTeamId: teamId,
          vercelProjectIds: [VercelProjectId.make("prj_missing")],
          photonProjectId,
        })
      )
      .pipe(Effect.exit);
    assert.strictEqual(exit._tag, "Failure");
  }).pipe(Effect.provide(inventoryLayer))
);

effectIt.effect("rejects duplicate authorized physical identities", () =>
  Effect.gen(function* testDuplicateProject() {
    const inventory = yield* InfrastructureInventory;
    const exit = yield* inventory
      .read(
        InfrastructureInventoryTarget.make({
          stage: "preview",
          vercelTeamId: teamId,
          vercelProjectIds: [projectId, projectId],
          photonProjectId,
        })
      )
      .pipe(Effect.exit);
    assert.strictEqual(exit._tag, "Failure");
  }).pipe(Effect.provide(inventoryLayer))
);

effectIt.effect(
  "accepts only the fixed read-only two-stage inventory authority",
  () =>
    Effect.sync(() => {
      const fixed = new Ajv2020({ strict: false }).compile(
        authorityEnvelopeContract
      );
      const inventory = new Ajv2020({ strict: false }).compile(
        readOnlyInventoryAuthorityPolicy
      );
      const envelope = {
        schemaVersion: "1",
        principal: "inventory operator",
        identitySource: "authenticated provider readback",
        localWrite: true,
        externalAccess: "read_only",
        operations: ["vercel metadata read", "photon metadata read"],
        resources: ["bundjil vercel projects", "bundjil photon project"],
        environments: ["preview", "production"],
        duration: "one bounded command",
        revocation: "command exit",
        approvalRequired: true,
        approvalReceipt: "current task approval",
        stopConditions: ["identity ambiguity"],
        readback: ["repeat inventory"],
        rollback: ["no external rollback"],
        escalation: "stop",
      };
      assert.strictEqual(fixed(envelope), true);
      assert.strictEqual(inventory(envelope), true);
      assert.strictEqual(
        inventory({ ...envelope, externalAccess: "mutation" }),
        false
      );
      assert.strictEqual(
        inventory({ ...envelope, environments: ["preview"] }),
        false
      );
    })
);
