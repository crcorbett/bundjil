import { Schema } from "effect";

import {
  InfrastructureLifecycleOperation,
  InfrastructureOutcomeCertainty,
  InfrastructureResourceKind,
  InfrastructureRetryClass,
} from "../schemas.js";

export const SyntheticResourceFailureFields = {
  operation: InfrastructureLifecycleOperation,
  resourceKind: InfrastructureResourceKind,
  retry: InfrastructureRetryClass,
  certainty: InfrastructureOutcomeCertainty,
  message: Schema.NonEmptyString.pipe(Schema.check(Schema.isMaxLength(300))),
};
