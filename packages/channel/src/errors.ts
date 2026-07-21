import type { ChannelDeliveryUncertainError } from "./errors/delivery-uncertain-error.js";
import type { ChannelProviderRejectedError } from "./errors/provider-rejected-error.js";
import type { ChannelRequestEncodingError } from "./errors/request-encoding-error.js";
import type { ChannelUnavailableError } from "./errors/unavailable-error.js";
import type { ChannelUnsupportedOperationError } from "./errors/unsupported-operation-error.js";
import type { ChannelWebhookAuthenticationError } from "./errors/webhook-authentication-error.js";
import type { ChannelWebhookSchemaError } from "./errors/webhook-schema-error.js";

export { ChannelDeliveryUncertainError } from "./errors/delivery-uncertain-error.js";
export { ChannelProviderRejectedError } from "./errors/provider-rejected-error.js";
export { ChannelRequestEncodingError } from "./errors/request-encoding-error.js";
export { ChannelUnavailableError } from "./errors/unavailable-error.js";
export { ChannelUnsupportedOperationError } from "./errors/unsupported-operation-error.js";
export { ChannelWebhookAuthenticationError } from "./errors/webhook-authentication-error.js";
export { ChannelWebhookSchemaError } from "./errors/webhook-schema-error.js";

export type ChannelWebhookError =
  | ChannelWebhookAuthenticationError
  | ChannelWebhookSchemaError
  | ChannelUnavailableError;
export type ChannelSendError =
  | ChannelRequestEncodingError
  | ChannelProviderRejectedError
  | ChannelUnavailableError
  | ChannelDeliveryUncertainError
  | ChannelUnsupportedOperationError;
export type ChannelPresenceError =
  | ChannelRequestEncodingError
  | ChannelProviderRejectedError
  | ChannelUnavailableError
  | ChannelUnsupportedOperationError;
