import { Duration, Schema } from "effect";

export const AtomicKeyValueStoreKey = Schema.NonEmptyString;
export type AtomicKeyValueStoreKey = typeof AtomicKeyValueStoreKey.Type;

export const AtomicKeyValueStoreValue = Schema.String;
export type AtomicKeyValueStoreValue = typeof AtomicKeyValueStoreValue.Type;

export const AtomicKeyValueStoreTtl = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0)),
  Schema.decodeTo(Schema.DurationFromMillis),
  Schema.check(
    Schema.makeFilter((ttl) => Number.isSafeInteger(Duration.toMillis(ttl)), {
      expected: "a positive finite whole-millisecond Duration",
    })
  )
);
export type AtomicKeyValueStoreTtl = typeof AtomicKeyValueStoreTtl.Type;

export const AtomicKeyValueStoreCondition = Schema.Union([
  Schema.TaggedStruct("Absent", { key: AtomicKeyValueStoreKey }),
  Schema.TaggedStruct("Equals", {
    key: AtomicKeyValueStoreKey,
    value: AtomicKeyValueStoreValue,
  }),
]);
export type AtomicKeyValueStoreCondition =
  typeof AtomicKeyValueStoreCondition.Type;

export const AtomicKeyValueStoreMutation = Schema.Union([
  Schema.TaggedStruct("Set", {
    key: AtomicKeyValueStoreKey,
    value: AtomicKeyValueStoreValue,
    ttl: Schema.optional(AtomicKeyValueStoreTtl),
  }),
  Schema.TaggedStruct("Remove", { key: AtomicKeyValueStoreKey }),
]);
export type AtomicKeyValueStoreMutation =
  typeof AtomicKeyValueStoreMutation.Type;

export const AtomicKeyValueStoreTransaction = Schema.Struct({
  conditions: Schema.NonEmptyArray(AtomicKeyValueStoreCondition).pipe(
    Schema.check(Schema.isMaxLength(32))
  ),
  mutations: Schema.NonEmptyArray(AtomicKeyValueStoreMutation).pipe(
    Schema.check(Schema.isMaxLength(32))
  ),
});
export type AtomicKeyValueStoreTransaction =
  typeof AtomicKeyValueStoreTransaction.Type;

export const AtomicKeyValueStoreOutcome = Schema.Literals([
  "applied",
  "conflict",
]);
export type AtomicKeyValueStoreOutcome = typeof AtomicKeyValueStoreOutcome.Type;

export const AtomicKeyValueStoreOperation = Schema.Literals(["transact"]);
export type AtomicKeyValueStoreOperation =
  typeof AtomicKeyValueStoreOperation.Type;
