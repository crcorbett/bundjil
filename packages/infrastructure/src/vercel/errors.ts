/* oxlint-disable max-classes-per-file -- Vercel read failures remain operation-specific while sharing one private safe field contract. */

import { Schema } from "effect";

import {
  VercelCredentialFailureReason,
  VercelReadFailureReason,
  VercelReadOperation,
} from "./schemas.js";

const VercelReadErrorMessage = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(300))
);

const VercelReadErrorFields = {
  operation: VercelReadOperation,
  reason: VercelReadFailureReason,
  retry: Schema.Literals(["never", "backoff"]),
  message: VercelReadErrorMessage,
};

export class VercelCredentialError extends Schema.TaggedError<VercelCredentialError>()(
  "VercelCredentialError",
  { reason: VercelCredentialFailureReason }
) {}

export class VercelProjectsReadError extends Schema.TaggedError<VercelProjectsReadError>()(
  "VercelProjectsReadError",
  VercelReadErrorFields
) {}

export class VercelDomainsReadError extends Schema.TaggedError<VercelDomainsReadError>()(
  "VercelDomainsReadError",
  VercelReadErrorFields
) {}

export class VercelEnvironmentVariablesReadError extends Schema.TaggedError<VercelEnvironmentVariablesReadError>()(
  "VercelEnvironmentVariablesReadError",
  VercelReadErrorFields
) {}

export class VercelMarketplaceBindingsReadError extends Schema.TaggedError<VercelMarketplaceBindingsReadError>()(
  "VercelMarketplaceBindingsReadError",
  VercelReadErrorFields
) {}

export class VercelDeploymentsReadError extends Schema.TaggedError<VercelDeploymentsReadError>()(
  "VercelDeploymentsReadError",
  VercelReadErrorFields
) {}
