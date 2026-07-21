import { Config, Effect, Exit, Schema } from "effect";

import { PhotonManagement } from "./management.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import { PhotonSubscriptionTier } from "./schemas.js";

export const PhotonResourceReconciliationMode = Schema.Literals([
  "inspect",
  "reconcile-line",
]);
export type PhotonResourceReconciliationMode =
  typeof PhotonResourceReconciliationMode.Type;

export const PhotonResourceReconciliationReceipt = Schema.Struct({
  billingSyncStatus: Schema.Literals(["not_applicable", "in_sync", "syncing"]),
  finalAvailableDedicatedLineCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  finalDedicatedLineCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  initialAvailableDedicatedLineCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  initialDedicatedLineCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  lineCreationEligible: Schema.Boolean,
  lineAction: Schema.Literals([
    "inspected",
    "adopted",
    "created",
    "recovered-after-ambiguous-create",
  ]),
  managementAuthenticated: Schema.Literal(true),
  mode: PhotonResourceReconciliationMode,
  platformAction: Schema.Literals(["inspected", "retained", "enabled"]),
  platformEnabled: Schema.Boolean,
  status: Schema.Literals(["inspected", "reconciled"]),
  subscriptionStatus: Schema.NullOr(
    Schema.Literals(["active", "canceled", "past_due"])
  ),
  subscriptionTier: PhotonSubscriptionTier,
  webhookCount: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
});
export type PhotonResourceReconciliationReceipt =
  typeof PhotonResourceReconciliationReceipt.Type;

export const loadPhotonResourceReconciliationMode = Config.schema(
  PhotonResourceReconciliationMode,
  "BUNDJIL_PHOTON_RESOURCE_MODE"
).pipe(Config.withDefault("inspect"));

const inspectPhotonResources = Effect.fn(
  "PhotonResourceReconciliation.inspect"
)(function* () {
  const management = yield* PhotonManagement;
  const initialPlatform = yield* management.getIMessagePlatform();
  const subscription = yield* management.getSubscription();
  const initialLines = yield* management.listDedicatedLines();
  const webhooks = yield* management.listWebhooks();
  const initialAvailableDedicatedLineCount = initialLines.filter(
    (line) => line.status === "available"
  ).length;
  const lineCreationEligible =
    subscription.tier.toLowerCase() === "business" &&
    subscription.status === "active";

  return PhotonResourceReconciliationReceipt.make({
    billingSyncStatus: "not_applicable",
    finalAvailableDedicatedLineCount: initialAvailableDedicatedLineCount,
    finalDedicatedLineCount: initialLines.length,
    initialAvailableDedicatedLineCount,
    initialDedicatedLineCount: initialLines.length,
    lineAction: "inspected",
    lineCreationEligible,
    managementAuthenticated: true,
    mode: "inspect",
    platformAction: "inspected",
    platformEnabled: initialPlatform.enabled,
    status: "inspected",
    subscriptionStatus: subscription.status,
    subscriptionTier: subscription.tier,
    webhookCount: webhooks.length,
  });
});

const reconcilePhotonLine = Effect.fn(
  "PhotonResourceReconciliation.reconcileLine"
)(function* () {
  const management = yield* PhotonManagement;
  const initialPlatform = yield* management.getIMessagePlatform();
  const subscription = yield* management.getSubscription();
  const initialLines = yield* management.listDedicatedLines();
  const webhooks = yield* management.listWebhooks();
  const initialAvailableDedicatedLineCount = initialLines.filter(
    (line) => line.status === "available"
  ).length;
  const lineCreationEligible =
    subscription.tier.toLowerCase() === "business" &&
    subscription.status === "active";
  if (
    initialLines.length > 1 ||
    (initialLines.length === 1 && initialAvailableDedicatedLineCount !== 1)
  ) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }
  if (initialLines.length === 0 && !lineCreationEligible) {
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

  if (initialLines.length === 1) {
    return PhotonResourceReconciliationReceipt.make({
      billingSyncStatus: "not_applicable",
      finalAvailableDedicatedLineCount: 1,
      finalDedicatedLineCount: 1,
      initialAvailableDedicatedLineCount,
      initialDedicatedLineCount: initialLines.length,
      lineAction: "adopted",
      lineCreationEligible,
      managementAuthenticated: true,
      mode: "reconcile-line",
      platformAction: initialPlatform.enabled ? "retained" : "enabled",
      platformEnabled: true,
      status: "reconciled",
      subscriptionStatus: subscription.status,
      subscriptionTier: subscription.tier,
      webhookCount: webhooks.length,
    });
  }

  const createExit = yield* Effect.exit(management.createDedicatedLine());
  const finalLines = yield* management.listDedicatedLines();
  if (
    finalLines.length !== 1 ||
    finalLines[0]?.status !== "available" ||
    (Exit.isSuccess(createExit) &&
      finalLines[0].id !== createExit.value.line.id)
  ) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }
  let billingSyncStatus: typeof PhotonResourceReconciliationReceipt.fields.billingSyncStatus.Type =
    "not_applicable";
  if (Exit.isSuccess(createExit)) {
    if (createExit.value.billingSyncStatus === "failed") {
      return yield* new PhotonProviderProofError({
        operation: "assert",
        reason: "resourceConflict",
      });
    }
    ({ billingSyncStatus } = createExit.value);
  }

  return PhotonResourceReconciliationReceipt.make({
    billingSyncStatus,
    finalAvailableDedicatedLineCount: 1,
    finalDedicatedLineCount: 1,
    initialAvailableDedicatedLineCount,
    initialDedicatedLineCount: initialLines.length,
    lineAction: Exit.isSuccess(createExit)
      ? "created"
      : "recovered-after-ambiguous-create",
    lineCreationEligible,
    managementAuthenticated: true,
    mode: "reconcile-line",
    platformAction: initialPlatform.enabled ? "retained" : "enabled",
    platformEnabled: true,
    status: "reconciled",
    subscriptionStatus: subscription.status,
    subscriptionTier: subscription.tier,
    webhookCount: webhooks.length,
  });
});

export const reconcilePhotonResources = Effect.fn(
  "PhotonResourceReconciliation.reconcile"
)((mode: PhotonResourceReconciliationMode) =>
  mode === "inspect" ? inspectPhotonResources() : reconcilePhotonLine()
);
