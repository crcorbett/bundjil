/* oxlint-disable max-classes-per-file -- Vercel read failures remain operation-specific while sharing one private safe field contract. */

import { Schema } from "effect";

import { VercelReadFailureReason, VercelReadOperation } from "./schemas.js";

const VercelReadErrorFields = {
  operation: VercelReadOperation,
  reason: VercelReadFailureReason,
  retry: Schema.Literals(["never", "backoff"]),
  message: Schema.NonEmptyString,
};

export class VercelProjectsReadError extends Schema.TaggedErrorClass<VercelProjectsReadError>()(
  "VercelProjectsReadError",
  VercelReadErrorFields
) {}

export class VercelDomainsReadError extends Schema.TaggedErrorClass<VercelDomainsReadError>()(
  "VercelDomainsReadError",
  VercelReadErrorFields
) {}

export class VercelEnvironmentVariablesReadError extends Schema.TaggedErrorClass<VercelEnvironmentVariablesReadError>()(
  "VercelEnvironmentVariablesReadError",
  VercelReadErrorFields
) {}

export class VercelMarketplaceBindingsReadError extends Schema.TaggedErrorClass<VercelMarketplaceBindingsReadError>()(
  "VercelMarketplaceBindingsReadError",
  VercelReadErrorFields
) {}

export class VercelDeploymentsReadError extends Schema.TaggedErrorClass<VercelDeploymentsReadError>()(
  "VercelDeploymentsReadError",
  VercelReadErrorFields
) {}
