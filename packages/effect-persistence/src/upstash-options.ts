import { Schema } from "effect";

export const UpstashPersistenceKeyPrefix = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[^*?[\]\\]+$/))
);
export type UpstashPersistenceKeyPrefix =
  typeof UpstashPersistenceKeyPrefix.Type;

export const UpstashPersistenceOptions = Schema.Struct({
  restUrl: Schema.Redacted(Schema.NonEmptyString),
  restToken: Schema.Redacted(Schema.NonEmptyString),
  keyPrefix: UpstashPersistenceKeyPrefix,
});
export type UpstashPersistenceOptions = typeof UpstashPersistenceOptions.Type;
