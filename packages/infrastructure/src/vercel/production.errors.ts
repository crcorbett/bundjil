import { Schema } from "effect";

import { ProductionProject } from "./production.schemas.js";

export const ProductionDeploymentOperation = Schema.Literals([
  "configure",
  "current",
  "currentCallback",
  "stage",
  "inspect",
  "promote",
  "assignCallback",
  "rollback",
  "readMainSha",
  "probe",
  "validate",
]);

export const ProductionDeploymentFailureReason = Schema.Literals([
  "commandFailed",
  "timeout",
  "invalidResponse",
  "targetMismatch",
  "sourceMismatch",
  "mainReadFailed",
  "healthFailed",
  "rollbackFailed",
]);

export const AutomaticProductionFailureCategory = Schema.Literals([
  "configuration",
  "deployment",
  "unexpected",
]);

export const AutomaticProductionBlockedReceipt = Schema.Struct({
  status: Schema.Literal("blocked"),
  category: AutomaticProductionFailureCategory,
  operation: Schema.NullOr(ProductionDeploymentOperation),
  project: Schema.NullOr(ProductionProject),
  reason: Schema.NullOr(ProductionDeploymentFailureReason),
  retry: Schema.NullOr(Schema.Literals(["never", "after-readback"])),
});
export type AutomaticProductionBlockedReceipt =
  typeof AutomaticProductionBlockedReceipt.Type;
export const AutomaticProductionBlockedReceiptJson = Schema.fromJsonString(
  AutomaticProductionBlockedReceipt
);

export class ProductionDeploymentError extends Schema.TaggedErrorClass<ProductionDeploymentError>()(
  "ProductionDeploymentError",
  {
    operation: ProductionDeploymentOperation,
    project: Schema.NullOr(ProductionProject),
    reason: ProductionDeploymentFailureReason,
    retry: Schema.Literals(["never", "after-readback"]),
  }
) {}
