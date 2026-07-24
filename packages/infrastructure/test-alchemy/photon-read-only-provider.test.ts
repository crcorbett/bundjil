// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable eslint-plugin-vitest/prefer-importing-vitest-globals -- Alchemy Test/Bun registers these assertions with Bun. */

import { expect } from "bun:test";

import { PhotonE164PhoneNumber } from "@bundjil/photon/config";
import {
  layerPhotonManagementMemory,
  PhotonBillingAttributes,
  PhotonCallbackOrigin,
  PhotonCallbackPath,
  PhotonLineId,
  PhotonLines,
  PhotonManagementMemoryControl,
  PhotonManagementMemoryInventory,
  PhotonPlatformAttributes,
  PhotonProjectAttributes,
  PhotonProjectId,
  PhotonProjectName,
  PhotonProjectSlug,
  PhotonSharedUserAttributes,
  PhotonSharedUserPhoneNumber,
  PhotonSubscriptionTier,
  PhotonUserId,
  PhotonWebhookAttributes,
  PhotonWebhookCallbackUrl,
  PhotonWebhookId,
} from "@bundjil/photon/management";
import { adopt } from "alchemy/AdoptPolicy";
import { destroy } from "alchemy/RemovalPolicy";
import * as Test from "alchemy/Test/Bun";
import { Effect, Exit, Layer, Redacted, Schema } from "effect";

import {
  layerPhotonReadOnlyProviders,
  PhotonBillingObservationResource,
  PhotonInventoryScope,
  PhotonLineObservationResource,
  PhotonPlatformConfigurationResource,
  PhotonProjectObservationResource,
  PhotonSharedUserResource,
  PhotonWebhookObservationResource,
} from "../src/photon/index.js";

const projectId = PhotonProjectId.make("ab96fc27-475d-4a52-a52e-bef2d4c66dde");
const userId = PhotonUserId.make("60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c");
const webhookId = PhotonWebhookId.make("70d6d04f-f9fa-4a7b-9c97-37c9c90ce91c");
const absentLineId = PhotonLineId.make("80d6d04f-f9fa-4a7b-9c97-37c9c90ce91c");
const phoneNumber = Schema.decodeSync(PhotonSharedUserPhoneNumber)(
  Redacted.make(PhotonE164PhoneNumber.make("+14155550199"))
);
const callbackUrl = Schema.decodeSync(PhotonWebhookCallbackUrl)(
  Redacted.make(
    "https://preview.example.test/eve/v1/photon/webhook?binding=secret"
  )
);

const inventory = PhotonManagementMemoryInventory.make({
  project: PhotonProjectAttributes.make({
    projectId,
    name: PhotonProjectName.make("Bundjil"),
    slug: PhotonProjectSlug.make("bundjil"),
    profileConfigured: false,
  }),
  platform: PhotonPlatformAttributes.make({
    projectId,
    platform: "imessage",
    enabled: true,
    autoScale: false,
    serviceType: "shared",
  }),
  sharedUsers: [
    {
      attributes: PhotonSharedUserAttributes.make({
        projectId,
        userId,
        serviceType: "shared",
        assignmentPresent: true,
      }),
      phoneNumber,
    },
  ],
  webhooks: [
    {
      attributes: PhotonWebhookAttributes.make({
        projectId,
        webhookId,
        callbackOrigin: PhotonCallbackOrigin.make(
          "https://preview.example.test"
        ),
        callbackPath: PhotonCallbackPath.make("/eve/v1/photon/webhook"),
        queryPresent: true,
        signingSecret: { _tag: "ObservedUnknown", configured: true },
      }),
      callbackUrl,
    },
  ],
  lines: [],
  billing: PhotonBillingAttributes.make({
    projectId,
    tier: PhotonSubscriptionTier.make("free"),
    status: null,
    cancelAtPeriodEnd: false,
  }),
});

const scope = PhotonInventoryScope.make({
  stage: "preview",
  projectId,
  sharedUserIds: [userId],
  webhookIds: [webhookId],
  lineIds: [],
});

const memory = layerPhotonManagementMemory(inventory);
const providers = Layer.merge(
  layerPhotonReadOnlyProviders(scope).pipe(Layer.provide(memory)),
  memory
);
const { test } = Test.make({ providers, stage: "preview" });

const props = {
  project: { stage: "preview", projectId },
  platform: { stage: "preview", projectId, platform: "imessage" },
  sharedUser: { stage: "preview", projectId, userId },
  webhook: { stage: "preview", projectId, webhookId },
  billing: { stage: "preview", projectId },
} as const;

test.provider(
  "adopts the exact Free shared topology with zero dedicated lines and zero writes",
  (stack) =>
    Effect.gen(function* () {
      const denied = yield* stack
        .plan(PhotonProjectObservationResource("PhotonProject", props.project))
        .pipe(Effect.exit);
      expect(Exit.isFailure(denied)).toBe(true);

      const outputs = yield* stack.deploy(
        Effect.all({
          project: PhotonProjectObservationResource(
            "PhotonProject",
            props.project
          ).pipe(adopt(true)),
          platform: PhotonPlatformConfigurationResource(
            "PhotonPlatform",
            props.platform
          ).pipe(adopt(true)),
          sharedUser: PhotonSharedUserResource(
            "PhotonSharedUser",
            props.sharedUser
          ).pipe(adopt(true)),
          webhook: PhotonWebhookObservationResource(
            "PhotonWebhook",
            props.webhook
          ).pipe(adopt(true)),
          billing: PhotonBillingObservationResource(
            "PhotonBilling",
            props.billing
          ).pipe(adopt(true)),
        })
      );
      expect(outputs.project.projectId).toBe(projectId);
      expect(outputs.platform.serviceType).toBe("shared");
      expect(outputs.sharedUser.userId).toBe(userId);
      expect(outputs.webhook.signingSecret._tag).toBe("ObservedUnknown");
      expect(outputs.billing.tier).toBe(PhotonSubscriptionTier.make("free"));

      const lines = yield* PhotonLines;
      const listed = yield* lines.listLines({
        projectId,
        platform: "imessage",
      });
      expect(listed.lines).toHaveLength(0);
      const control = yield* PhotonManagementMemoryControl;
      expect(yield* control.providerWriteCount).toBe(0);
    })
);

test.provider(
  "rejects project, dedicated-line, billing and secret-rotation writes",
  (stack) =>
    Effect.gen(function* () {
      yield* stack.deploy(
        Effect.all({
          project: PhotonProjectObservationResource(
            "ProtectedPhotonProject",
            props.project
          ).pipe(adopt(true), destroy()),
          billing: PhotonBillingObservationResource(
            "ProtectedPhotonBilling",
            props.billing
          ).pipe(adopt(true), destroy()),
        })
      );
      expect(Exit.isFailure(yield* stack.destroy().pipe(Effect.exit))).toBe(
        true
      );

      const lineAttempt = yield* stack
        .deploy(
          PhotonLineObservationResource("ForbiddenPhotonLine", {
            stage: "preview",
            projectId,
            lineId: absentLineId,
            platform: "imessage",
          }).pipe(adopt(true))
        )
        .pipe(Effect.exit);
      expect(Exit.isFailure(lineAttempt)).toBe(true);
      const control = yield* PhotonManagementMemoryControl;
      expect(yield* control.providerWriteCount).toBe(0);
    })
);
