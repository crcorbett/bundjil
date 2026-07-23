import { Config, Effect, Exit, Redacted, Schema } from "effect";

import { PhotonManagement } from "./management.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import { PhotonSharedUserPhoneNumber } from "./schemas.js";

export const PhotonResourceReconciliationMode = Schema.Literals([
  "inspect",
  "reconcile-shared-user",
]);
export type PhotonResourceReconciliationMode =
  typeof PhotonResourceReconciliationMode.Type;

export const PhotonResourceReconciliationReceipt = Schema.Struct({
  approvedSharedUserCount: Schema.Int.pipe(
    Schema.check(Schema.isBetween({ minimum: 0, maximum: 1 }))
  ),
  assignmentPresent: Schema.Boolean,
  dedicatedLineCount: Schema.Literal(0),
  finalSharedUserCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  initialSharedUserCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  managementAuthenticated: Schema.Literal(true),
  mode: PhotonResourceReconciliationMode,
  platformAction: Schema.Literals(["inspected", "retained", "enabled"]),
  platformEnabled: Schema.Boolean,
  serviceType: Schema.Literal("shared"),
  sharedUserAction: Schema.Literals([
    "inspected",
    "adopted",
    "created",
    "recovered-after-create",
  ]),
  status: Schema.Literals(["inspected", "reconciled"]),
  webhookCount: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
});
export type PhotonResourceReconciliationReceipt =
  typeof PhotonResourceReconciliationReceipt.Type;

export const loadPhotonResourceReconciliationMode = Config.schema(
  PhotonResourceReconciliationMode,
  "BUNDJIL_PHOTON_RESOURCE_MODE"
).pipe(Config.withDefault("inspect"));

export const loadPhotonSharedUserPhoneNumber = Config.schema(
  PhotonSharedUserPhoneNumber,
  "BUNDJIL_PHOTON_SHARED_USER_PHONE_NUMBER"
);

const inspectPhotonResources = Effect.fn(
  "PhotonResourceReconciliation.inspect"
)(function* () {
  const management = yield* PhotonManagement;
  const service = yield* management.getIMessageService();
  if (service.type !== "shared") {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }
  const platform = yield* management.getIMessagePlatform();
  const users = yield* management.listSharedUsers();
  const webhooks = yield* management.listWebhooks();

  return PhotonResourceReconciliationReceipt.make({
    approvedSharedUserCount: 0,
    assignmentPresent: false,
    dedicatedLineCount: 0,
    finalSharedUserCount: users.length,
    initialSharedUserCount: users.length,
    managementAuthenticated: true,
    mode: "inspect",
    platformAction: "inspected",
    platformEnabled: platform.enabled,
    serviceType: "shared",
    sharedUserAction: "inspected",
    status: "inspected",
    webhookCount: webhooks.length,
  });
});

const reconcilePhotonSharedUser = Effect.fn(
  "PhotonResourceReconciliation.reconcileSharedUser"
)(function* (redactedPhoneNumber: PhotonSharedUserPhoneNumber) {
  const management = yield* PhotonManagement;
  const phoneNumber = Redacted.value(redactedPhoneNumber);
  const service = yield* management.getIMessageService();
  if (service.type !== "shared") {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }
  const initialPlatform = yield* management.getIMessagePlatform();
  const initialUsers = yield* management.listSharedUsers();
  const webhooks = yield* management.listWebhooks();
  const matching = initialUsers.filter(
    (user) => user.phoneNumber === phoneNumber
  );
  if (matching.length > 1) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }

  const platform = initialPlatform.enabled
    ? initialPlatform
    : yield* management.setIMessagePlatformEnabled(true);
  if (!platform.enabled) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "invalidResponse",
    });
  }

  if (matching.length === 1) {
    return PhotonResourceReconciliationReceipt.make({
      approvedSharedUserCount: 1,
      assignmentPresent: true,
      dedicatedLineCount: 0,
      finalSharedUserCount: initialUsers.length,
      initialSharedUserCount: initialUsers.length,
      managementAuthenticated: true,
      mode: "reconcile-shared-user",
      platformAction: initialPlatform.enabled ? "retained" : "enabled",
      platformEnabled: true,
      serviceType: "shared",
      sharedUserAction: "adopted",
      status: "reconciled",
      webhookCount: webhooks.length,
    });
  }

  if (!(yield* management.checkSharedAvailability(phoneNumber))) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }

  const createExit = yield* Effect.exit(
    management.createSharedUser(phoneNumber)
  );
  const finalUsers = yield* management.listSharedUsers();
  const finalMatching = finalUsers.filter(
    (user) => user.phoneNumber === phoneNumber
  );
  if (
    finalMatching.length !== 1 ||
    (Exit.isSuccess(createExit) && finalMatching[0]?.id !== createExit.value.id)
  ) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }

  return PhotonResourceReconciliationReceipt.make({
    approvedSharedUserCount: 1,
    assignmentPresent: true,
    dedicatedLineCount: 0,
    finalSharedUserCount: finalUsers.length,
    initialSharedUserCount: initialUsers.length,
    managementAuthenticated: true,
    mode: "reconcile-shared-user",
    platformAction: initialPlatform.enabled ? "retained" : "enabled",
    platformEnabled: true,
    serviceType: "shared",
    sharedUserAction: Exit.isSuccess(createExit)
      ? "created"
      : "recovered-after-create",
    status: "reconciled",
    webhookCount: webhooks.length,
  });
});

export const reconcilePhotonResources = Effect.fn(
  "PhotonResourceReconciliation.reconcile"
)((
  mode: PhotonResourceReconciliationMode,
  sharedUserPhoneNumber?: PhotonSharedUserPhoneNumber
) => {
  if (mode === "inspect") {
    return inspectPhotonResources();
  }
  if (sharedUserPhoneNumber === undefined) {
    return Effect.fail(
      new PhotonProviderProofError({
        operation: "assert",
        reason: "resourceConflict",
      })
    );
  }
  return reconcilePhotonSharedUser(sharedUserPhoneNumber);
});
