import { Schema } from "effect";

export const SecretOwner = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/SecretOwner")
);
export type SecretOwner = typeof SecretOwner.Type;
export type SecretOwnerEncoded = typeof SecretOwner.Encoded;

export const SecretReferenceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/SecretReferenceId")
);
export type SecretReferenceId = typeof SecretReferenceId.Type;
export type SecretReferenceIdEncoded = typeof SecretReferenceId.Encoded;

export const SecretRevision = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/SecretRevision")
);
export type SecretRevision = typeof SecretRevision.Type;
export type SecretRevisionEncoded = typeof SecretRevision.Encoded;

export const SecretReference = Schema.Struct({
  owner: SecretOwner,
  reference: SecretReferenceId,
  revision: SecretRevision,
});
export type SecretReference = typeof SecretReference.Type;
export type SecretReferenceEncoded = typeof SecretReference.Encoded;

export const SecretOwnership = Schema.Union([
  Schema.TaggedStruct("Managed", { reference: SecretReference }),
  Schema.TaggedStruct("ObservedUnknown", {
    configured: Schema.Literal(true),
  }),
  Schema.TaggedStruct("Absent", {}),
]);
export type SecretOwnership = typeof SecretOwnership.Type;
export type SecretOwnershipEncoded = typeof SecretOwnership.Encoded;
