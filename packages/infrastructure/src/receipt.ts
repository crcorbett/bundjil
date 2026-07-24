import { Schema } from "effect";

const InfrastructureReceiptText = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(1000))
);

export const InfrastructureReceiptStatus = Schema.Literals([
  "passed",
  "failed",
  "blocked",
  "skipped",
  "inconclusive",
  "no_op",
]);
export type InfrastructureReceiptStatus =
  typeof InfrastructureReceiptStatus.Type;
export type InfrastructureReceiptStatusEncoded =
  typeof InfrastructureReceiptStatus.Encoded;

export const InfrastructureArtifactDigest = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  Schema.brand("@bundjil/infrastructure/InfrastructureArtifactDigest")
);
export type InfrastructureArtifactDigest =
  typeof InfrastructureArtifactDigest.Type;
export type InfrastructureArtifactDigestEncoded =
  typeof InfrastructureArtifactDigest.Encoded;

export const InfrastructureDetailArtifact = Schema.Struct({
  path: InfrastructureReceiptText,
  sha256: InfrastructureArtifactDigest,
});
export type InfrastructureDetailArtifact =
  typeof InfrastructureDetailArtifact.Type;
export type InfrastructureDetailArtifactEncoded =
  typeof InfrastructureDetailArtifact.Encoded;

const InfrastructureReceiptNonEmptyTexts = Schema.Array(
  InfrastructureReceiptText
).pipe(Schema.check(Schema.isMinLength(1)));

export const InfrastructureBoundedReceipt = Schema.Struct({
  schemaVersion: Schema.Literal("1"),
  status: InfrastructureReceiptStatus,
  claim: InfrastructureReceiptText,
  target: InfrastructureReceiptText,
  candidateIdentity: InfrastructureReceiptText,
  actor: InfrastructureReceiptText,
  authorityReceipt: InfrastructureReceiptText,
  environment: InfrastructureReceiptText,
  journeyIds: Schema.Array(InfrastructureReceiptText),
  observations: InfrastructureReceiptNonEmptyTexts,
  postconditions: InfrastructureReceiptNonEmptyTexts,
  detailArtifacts: Schema.Array(InfrastructureDetailArtifact),
  limitations: InfrastructureReceiptNonEmptyTexts,
  nonClaims: InfrastructureReceiptNonEmptyTexts,
  rollbackOrRecovery: InfrastructureReceiptText,
  observedAt: Schema.String.pipe(
    Schema.check(
      Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/)
    )
  ),
});
export type InfrastructureBoundedReceipt =
  typeof InfrastructureBoundedReceipt.Type;
export type InfrastructureBoundedReceiptEncoded =
  typeof InfrastructureBoundedReceipt.Encoded;

export const InfrastructureBoundedReceiptJson = Schema.fromJsonString(
  InfrastructureBoundedReceipt
);
export type InfrastructureBoundedReceiptJson =
  typeof InfrastructureBoundedReceiptJson.Type;
export type InfrastructureBoundedReceiptJsonEncoded =
  typeof InfrastructureBoundedReceiptJson.Encoded;
