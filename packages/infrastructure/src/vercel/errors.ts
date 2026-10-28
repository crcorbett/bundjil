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

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class VercelCredentialError extends Schema.TaggedError<VercelCredentialError>()(
  "VercelCredentialError",
  { reason: VercelCredentialFailureReason }
) {}

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class VercelProjectsReadError extends Schema.TaggedError<VercelProjectsReadError>()(
  "VercelProjectsReadError",
  VercelReadErrorFields
) {}

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class VercelDomainsReadError extends Schema.TaggedError<VercelDomainsReadError>()(
  "VercelDomainsReadError",
  VercelReadErrorFields
) {}

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class VercelEnvironmentVariablesReadError extends Schema.TaggedError<VercelEnvironmentVariablesReadError>()(
  "VercelEnvironmentVariablesReadError",
  VercelReadErrorFields
) {}

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class VercelMarketplaceBindingsReadError extends Schema.TaggedError<VercelMarketplaceBindingsReadError>()(
  "VercelMarketplaceBindingsReadError",
  VercelReadErrorFields
) {}

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class VercelDeploymentsReadError extends Schema.TaggedError<VercelDeploymentsReadError>()(
  "VercelDeploymentsReadError",
  VercelReadErrorFields
) {}
