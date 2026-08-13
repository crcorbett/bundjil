import { Schema } from "effect";

import { ProductionProject } from "./production.schemas.js";

export const ProductionDeploymentOperation = Schema.Literals([
  "configure",
  "current",
  "stage",
  "inspect",
  "promote",
  "rollback",
  "readMainSha",
  "probe",
  "validate",
]);

export const ProductionDeploymentFailureReason = Schema.Literals([
  "commandFailed",
  "invalidResponse",
  "targetMismatch",
  "sourceMismatch",
  "mainReadFailed",
  "healthFailed",
  "rollbackFailed",
]);

export class ProductionDeploymentError extends Schema.TaggedErrorClass<ProductionDeploymentError>()(
  "ProductionDeploymentError",
  {
    operation: ProductionDeploymentOperation,
    project: Schema.NullOr(ProductionProject),
    reason: ProductionDeploymentFailureReason,
    retry: Schema.Literals(["never", "after-readback"]),
  }
) {}
