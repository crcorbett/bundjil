import {
  Array,
  Clock,
  Context,
  Duration,
  Effect,
  HashMap,
  Layer,
  Match,
  Option,
  SynchronizedRef,
  pipe,
} from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  AtomicKeyValueStore,
  decodeAtomicKeyValueStoreTransaction,
} from "./atomic-key-value-store.service.js";
import type { AtomicKeyValueStoreTransaction } from "./schemas.js";

type MemoryEntry = Readonly<{ value: string; expiresAt: number | undefined }>;
type MemoryState = HashMap.HashMap<string, MemoryEntry>;

const withoutExpiredEntries = (state: MemoryState, now: number) =>
  pipe(
    state,
    HashMap.filter(
      (entry) => entry.expiresAt === undefined || entry.expiresAt > now
    )
  );

/** A coherent process-local native and atomic store, intended for deterministic tests. */
export const PersistenceMemory: Layer.Layer<
  KeyValueStore.KeyValueStore | AtomicKeyValueStore
> = Layer.effectContext(
  Effect.gen(function* PersistenceMemoryLayer() {
    const state = yield* SynchronizedRef.make<MemoryState>(HashMap.empty());
    const get = Effect.fn("PersistenceMemory.get")(function* (key: string) {
      const now = yield* Clock.currentTimeMillis;
      return yield* SynchronizedRef.modify(state, (current) => {
        const live = withoutExpiredEntries(current, now);
        return [
          Option.getOrUndefined(HashMap.get(live, key))?.value,
          live,
        ] as const;
      });
    });
    const transact = Effect.fn("AtomicKeyValueStore.transact")(function* (
      transaction: AtomicKeyValueStoreTransaction
    ) {
      const decoded = yield* decodeAtomicKeyValueStoreTransaction(transaction);
      const now = yield* Clock.currentTimeMillis;
      return yield* SynchronizedRef.modify(state, (current) => {
        const live = withoutExpiredEntries(current, now);
        if (
          pipe(
            decoded.conditions,
            Array.some((condition) =>
              Match.value(condition).pipe(
                Match.tagsExhaustive({
                  Absent: ({ key }) => HashMap.has(live, key),
                  Equals: ({ key, value }) =>
                    Option.getOrUndefined(HashMap.get(live, key))?.value !==
                    value,
                })
              )
            )
          )
        ) {
          return ["conflict" as const, live] as const;
        }
        return [
          "applied" as const,
          Array.reduce(decoded.mutations, live, (next, mutation) =>
            Match.value(mutation).pipe(
              Match.tagsExhaustive({
                Remove: ({ key }) => HashMap.remove(next, key),
                Set: ({ key, ttl, value }) =>
                  HashMap.set(next, key, {
                    value,
                    expiresAt:
                      ttl === undefined
                        ? undefined
                        : now + Duration.toMillis(ttl),
                  }),
              })
            )
          ),
        ] as const;
      });
    });
    const native = KeyValueStore.makeStringOnly({
      get,
      set: (key, value) =>
        SynchronizedRef.modify(
          state,
          (current) =>
            [
              undefined,
              HashMap.set(current, key, { value, expiresAt: undefined }),
            ] as const
        ).pipe(Effect.asVoid, Effect.withSpan("PersistenceMemory.set")),
      remove: (key) =>
        SynchronizedRef.modify(
          state,
          (current) => [undefined, HashMap.remove(current, key)] as const
        ).pipe(Effect.asVoid, Effect.withSpan("PersistenceMemory.remove")),
      clear: SynchronizedRef.set(state, HashMap.empty()).pipe(
        Effect.withSpan("PersistenceMemory.clear")
      ),
      size: Effect.gen(function* memorySize() {
        const now = yield* Clock.currentTimeMillis;
        return yield* SynchronizedRef.modify(state, (current) => {
          const live = withoutExpiredEntries(current, now);
          return [HashMap.size(live), live] as const;
        });
      }).pipe(Effect.withSpan("PersistenceMemory.size")),
    });
    const atomic = AtomicKeyValueStore.of({ transact });
    return Context.empty().pipe(
      Context.add(KeyValueStore.KeyValueStore, native),
      Context.add(AtomicKeyValueStore, atomic)
    );
  })
);
