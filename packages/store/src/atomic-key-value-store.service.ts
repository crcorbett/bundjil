import { Context, Effect, HashSet, Schema } from "effect";

import { AtomicKeyValueStoreError } from "./errors.js";
import { AtomicKeyValueStoreTransaction } from "./schemas.js";
import type {
  AtomicKeyValueStoreOutcome,
  AtomicKeyValueStoreTransaction as AtomicKeyValueStoreTransactionType,
} from "./schemas.js";

export interface AtomicKeyValueStoreShape {
  readonly transact: (
    transaction: AtomicKeyValueStoreTransactionType
  ) => Effect.Effect<
    typeof AtomicKeyValueStoreOutcome.Type,
    AtomicKeyValueStoreError
  >;
}

export class AtomicKeyValueStore extends Context.Service<
  AtomicKeyValueStore,
  AtomicKeyValueStoreShape
>()("@bundjil/store/AtomicKeyValueStore") {}

/** Internal shared public-boundary validation for both adapters. */
const decodeAtomicKeyValueStoreTransactionEffect = Effect.fn(
  "AtomicKeyValueStore.decodeTransaction"
)(function* (transaction: AtomicKeyValueStoreTransactionType) {
  const encoded = yield* Schema.encodeEffect(AtomicKeyValueStoreTransaction)(
    transaction
  );
  const decoded = yield* Schema.decodeUnknownEffect(
    AtomicKeyValueStoreTransaction
  )(encoded);
  const conditionKeys = HashSet.map(
    HashSet.fromIterable(decoded.conditions),
    (condition) => condition.key
  );
  const mutationKeys = HashSet.map(
    HashSet.fromIterable(decoded.mutations),
    (mutation) => mutation.key
  );
  if (
    HashSet.size(conditionKeys) !== decoded.conditions.length ||
    HashSet.size(mutationKeys) !== decoded.mutations.length
  ) {
    return yield* new AtomicKeyValueStoreError({
      operation: "transact",
      message: "Invalid atomic key-value transaction.",
    });
  }
  return decoded;
});

export const decodeAtomicKeyValueStoreTransaction = (
  transaction: AtomicKeyValueStoreTransactionType
) =>
  decodeAtomicKeyValueStoreTransactionEffect(transaction).pipe(
    Effect.mapError(
      () =>
        new AtomicKeyValueStoreError({
          operation: "transact",
          message: "Invalid atomic key-value transaction.",
        })
    )
  );
