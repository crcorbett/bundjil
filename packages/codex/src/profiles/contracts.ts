import { Schema } from "effect";

import {
  CodexOAuthAccessToken,
  CodexOAuthAccountId,
  CodexOAuthCredentialRevision,
  CodexOAuthConnectorId,
  CodexOAuthInstallationId,
  CodexOAuthProfileId,
  CodexOAuthProtocolScopeVersion,
  CodexOAuthRefreshToken,
  CodexOAuthSubject,
} from "../auth/credentials.js";

export const CodexOAuthProfileVersion = Schema.Literal(2);

export type CodexOAuthProfileVersion = typeof CodexOAuthProfileVersion.Type;

export const CodexOAuthProfileKind = Schema.Literals([
  "access-token-import",
  "subscription",
]);

export type CodexOAuthProfileKind = typeof CodexOAuthProfileKind.Type;

export const CodexAccessTokenImportProfile = Schema.Struct({
  profileVersion: CodexOAuthProfileVersion,
  profileKind: Schema.Literal("access-token-import"),
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  scopes: Schema.Array(Schema.NonEmptyString),
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  requiresReauthentication: Schema.Boolean,
});

export type CodexAccessTokenImportProfile =
  typeof CodexAccessTokenImportProfile.Type;

export const CodexSubscriptionProfile = Schema.Struct({
  profileVersion: CodexOAuthProfileVersion,
  profileKind: Schema.Literal("subscription"),
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  refreshToken: CodexOAuthRefreshToken,
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  accountId: CodexOAuthAccountId,
  protocolScopeVersion: CodexOAuthProtocolScopeVersion,
  scopes: Schema.Array(Schema.NonEmptyString),
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  lastRefreshedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  credentialRevision: CodexOAuthCredentialRevision,
  requiresReauthentication: Schema.Boolean,
});

export type CodexSubscriptionProfile = typeof CodexSubscriptionProfile.Type;

export const CodexOAuthProfile = Schema.Union([
  CodexAccessTokenImportProfile,
  CodexSubscriptionProfile,
]);

export type CodexOAuthProfile = typeof CodexOAuthProfile.Type;

export const LegacyCodexOAuthProfileV1 = Schema.Struct({
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  refreshToken: Schema.optional(CodexOAuthRefreshToken),
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  scopes: Schema.Array(Schema.NonEmptyString),
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  requiresReauthentication: Schema.Boolean,
});

export type LegacyCodexOAuthProfileV1 = typeof LegacyCodexOAuthProfileV1.Type;

export const CodexOAuthProfileCipherAlgorithm = Schema.Literal("AES-GCM");

export type CodexOAuthProfileCipherAlgorithm =
  typeof CodexOAuthProfileCipherAlgorithm.Type;

export const CodexOAuthProfileCipherKeyId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthProfileCipherKeyId")
);

export type CodexOAuthProfileCipherKeyId =
  typeof CodexOAuthProfileCipherKeyId.Type;

export const CodexOAuthProfileCipherConfig = Schema.Struct({
  algorithm: CodexOAuthProfileCipherAlgorithm,
  keyId: CodexOAuthProfileCipherKeyId,
  keyMaterial: Schema.RedactedFromValue(Schema.NonEmptyString),
});

export type CodexOAuthProfileCipherConfig =
  typeof CodexOAuthProfileCipherConfig.Type;

const EncryptedCodexOAuthProfileFields = {
  algorithm: CodexOAuthProfileCipherAlgorithm,
  keyId: CodexOAuthProfileCipherKeyId,
  nonce: Schema.Uint8Array,
  ciphertext: Schema.Uint8Array,
  subjectHash: Schema.NonEmptyString,
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
} as const;

export const EncryptedCodexOAuthProfile = Schema.Struct({
  version: Schema.Number.check(Schema.isFinite()),
  ...EncryptedCodexOAuthProfileFields,
});

export type EncryptedCodexOAuthProfile = typeof EncryptedCodexOAuthProfile.Type;

export const EncryptedCodexOAuthProfileV1 = Schema.Struct({
  version: Schema.Literal(1),
  ...EncryptedCodexOAuthProfileFields,
});

export type EncryptedCodexOAuthProfileV1 =
  typeof EncryptedCodexOAuthProfileV1.Type;

export const EncryptedCodexOAuthProfileV2 = Schema.Struct({
  version: Schema.Literal(2),
  ...EncryptedCodexOAuthProfileFields,
});

export type EncryptedCodexOAuthProfileV2 =
  typeof EncryptedCodexOAuthProfileV2.Type;

export const CodexOAuthRefreshLockTtlMillis = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0)),
  Schema.brand("CodexOAuthRefreshLockTtlMillis")
);

export type CodexOAuthRefreshLockTtlMillis =
  typeof CodexOAuthRefreshLockTtlMillis.Type;

export const CodexOAuthRefreshPolicy = Schema.Struct({
  refreshSkewMillis: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  lockTtlMillis: CodexOAuthRefreshLockTtlMillis,
});

export type CodexOAuthRefreshPolicy = typeof CodexOAuthRefreshPolicy.Type;

export const CodexOAuthRefreshLockOwner = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type CodexOAuthRefreshLockOwner = typeof CodexOAuthRefreshLockOwner.Type;

export const CodexOAuthRefreshLockAcquireInput = Schema.Struct({
  subject: CodexOAuthSubject,
  ttlMillis: CodexOAuthRefreshLockTtlMillis,
});

export type CodexOAuthRefreshLockAcquireInput =
  typeof CodexOAuthRefreshLockAcquireInput.Type;

export const CodexOAuthRefreshLockLease = Schema.Struct({
  subject: CodexOAuthSubject,
  subjectHash: Schema.NonEmptyString,
  owner: CodexOAuthRefreshLockOwner,
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
});

export type CodexOAuthRefreshLockLease = typeof CodexOAuthRefreshLockLease.Type;

export const CodexOAuthLoginStart = Schema.Struct({
  profileId: CodexOAuthProfileId,
  connectorId: CodexOAuthConnectorId,
  installationId: CodexOAuthInstallationId,
  redirectUri: Schema.NonEmptyString,
});

export type CodexOAuthLoginStart = typeof CodexOAuthLoginStart.Type;

export const CodexOAuthLoginStartResult = Schema.Struct({
  authorizationUrl: Schema.NonEmptyString,
  state: Schema.RedactedFromValue(Schema.NonEmptyString),
  codeVerifier: Schema.RedactedFromValue(Schema.NonEmptyString),
});

export type CodexOAuthLoginStartResult = typeof CodexOAuthLoginStartResult.Type;

export const CodexOAuthLoginCallback = Schema.Struct({
  code: Schema.RedactedFromValue(Schema.NonEmptyString),
  state: Schema.RedactedFromValue(Schema.NonEmptyString),
  redirectUri: Schema.NonEmptyString,
});

export type CodexOAuthLoginCallback = typeof CodexOAuthLoginCallback.Type;

export const CodexOAuthRefreshInput = Schema.Struct({
  subject: CodexOAuthSubject,
  refreshToken: CodexOAuthRefreshToken,
});

export type CodexOAuthRefreshInput = typeof CodexOAuthRefreshInput.Type;

export const CodexOAuthRevokeInput = Schema.Struct({
  subject: CodexOAuthSubject,
  accessToken: Schema.optional(CodexOAuthAccessToken),
  refreshToken: Schema.optional(CodexOAuthRefreshToken),
});

export type CodexOAuthRevokeInput = typeof CodexOAuthRevokeInput.Type;

export const CodexOAuthProfileCommitOperation = Schema.Literals([
  "initialWrite",
  "replaceLegacy",
  "replace",
  "refresh",
  "markReauthenticationRequired",
]);

export type CodexOAuthProfileCommitOperation =
  typeof CodexOAuthProfileCommitOperation.Type;

export const CodexOAuthProfileCommitLegacyReplacementInput = Schema.Struct({
  expectedLegacyProfile: CodexAccessTokenImportProfile,
  profile: CodexSubscriptionProfile,
});

export type CodexOAuthProfileCommitLegacyReplacementInput =
  typeof CodexOAuthProfileCommitLegacyReplacementInput.Type;

export const CodexOAuthProfileCommitReplacementInput = Schema.Struct({
  profile: CodexSubscriptionProfile,
  expectedRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthProfileCommitReplacementInput =
  typeof CodexOAuthProfileCommitReplacementInput.Type;

export const CodexOAuthProfileCommitRefreshInput = Schema.Struct({
  profile: CodexSubscriptionProfile,
  expectedRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthProfileCommitRefreshInput =
  typeof CodexOAuthProfileCommitRefreshInput.Type;

export const CodexOAuthProfileCommitReauthenticationInput = Schema.Struct({
  profile: CodexSubscriptionProfile,
  expectedRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthProfileCommitReauthenticationInput =
  typeof CodexOAuthProfileCommitReauthenticationInput.Type;

export const CodexStoredProfileProofResult = Schema.Struct({
  found: Schema.Boolean,
  envelopeVersion2: Schema.Boolean,
  ciphertextPresent: Schema.Boolean,
  profileKindSubscription: Schema.Boolean,
  refreshCapable: Schema.Boolean,
  expiryValid: Schema.Boolean,
  requiresReauthenticationFalse: Schema.Boolean,
  markerLeakFalse: Schema.Boolean,
});

export type CodexStoredProfileProofResult =
  typeof CodexStoredProfileProofResult.Type;

export const CodexOAuthObserverEventType = Schema.Literals([
  "refreshStarted",
  "refreshSucceeded",
  "refreshConflict",
  "refreshWinnerUsed",
  "reauthenticationMarked",
]);

export type CodexOAuthObserverEventType =
  typeof CodexOAuthObserverEventType.Type;

export const CodexOAuthObserverEvent = Schema.Struct({
  type: CodexOAuthObserverEventType,
  operation: Schema.optional(CodexOAuthProfileCommitOperation),
  profileKind: Schema.optional(CodexOAuthProfileKind),
  requiresReauthentication: Schema.optional(Schema.Boolean),
});

export type CodexOAuthObserverEvent = typeof CodexOAuthObserverEvent.Type;

export const CodexOAuthObserverCounters = Schema.Struct({
  refreshStarted: Schema.Int,
  refreshSucceeded: Schema.Int,
  refreshConflict: Schema.Int,
  refreshWinnerUsed: Schema.Int,
  reauthenticationMarked: Schema.Int,
});

export type CodexOAuthObserverCounters = typeof CodexOAuthObserverCounters.Type;

export const CodexOAuthObserverSnapshot = Schema.Struct({
  counters: CodexOAuthObserverCounters,
  events: Schema.Array(CodexOAuthObserverEvent),
});

export type CodexOAuthObserverSnapshot = typeof CodexOAuthObserverSnapshot.Type;
