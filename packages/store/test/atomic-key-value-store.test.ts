import { assert, it } from "@effect/vitest";
import { Array, Duration, Effect, Schema } from "effect";
import * as TestClock from "effect/testing/TestClock";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  AtomicKeyValueStore,
  AtomicKeyValueStoreCondition,
  AtomicKeyValueStoreMutation,
  AtomicKeyValueStoreTransaction,
  AtomicKeyValueStoreTtl,
} from "../src/index.js";
import { PersistenceMemory } from "../src/memory.layer.js";

const transaction = (
  conditions: unknown,
  mutations: unknown
): AtomicKeyValueStoreTransaction =>
  Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
    conditions,
    mutations,
  });

const uncheckedTransaction = (
  conditions: unknown,
  mutations: unknown
): AtomicKeyValueStoreTransaction => ({
  conditions: Schema.decodeUnknownSync(
    Schema.NonEmptyArray(AtomicKeyValueStoreCondition)
  )(conditions),
  mutations: Schema.decodeUnknownSync(
    Schema.NonEmptyArray(AtomicKeyValueStoreMutation)
  )(mutations),
});

it.effect(
  "shares state between native persistence and atomic transactions",
  () =>
    Effect.gen(function* sharedMemoryContract() {
      const atomic = yield* AtomicKeyValueStore;
      const native = yield* KeyValueStore.KeyValueStore;
      assert.strictEqual(
        yield* atomic.transact(
          transaction(
            [{ _tag: "Absent", key: "one" }],
            [{ _tag: "Set", key: "one", value: "first" }]
          )
        ),
        "applied"
      );
      assert.strictEqual(yield* native.get("one"), "first");
      assert.strictEqual(
        yield* atomic.transact(
          transaction(
            [{ _tag: "Equals", key: "one", value: "other" }],
            [{ _tag: "Remove", key: "one" }]
          )
        ),
        "conflict"
      );
      assert.strictEqual(yield* native.get("one"), "first");
    }).pipe(Effect.provide(PersistenceMemory))
);

it.effect(
  "commits every successful mutation and rejects duplicate transaction keys",
  () =>
    Effect.gen(function* atomicContract() {
      const atomic = yield* AtomicKeyValueStore;
      const native = yield* KeyValueStore.KeyValueStore;
      assert.strictEqual(
        yield* atomic.transact(
          transaction(
            [{ _tag: "Absent", key: "one" }],
            [
              { _tag: "Set", key: "one", value: "first" },
              { _tag: "Set", key: "two", value: "second" },
            ]
          )
        ),
        "applied"
      );
      assert.strictEqual(yield* native.size, 2);
      yield* atomic
        .transact(
          transaction(
            [
              { _tag: "Absent", key: "duplicate" },
              { _tag: "Absent", key: "duplicate" },
            ],
            [{ _tag: "Set", key: "duplicate", value: "value" }]
          )
        )
        .pipe(
          Effect.flip,
          Effect.tap(() =>
            native.get("duplicate").pipe(
              Effect.tap((value) =>
                Effect.sync(() => {
                  assert.strictEqual(value, undefined);
                })
              )
            )
          )
        );
    }).pipe(Effect.provide(PersistenceMemory))
);

it.effect("expires atomic TTL values and persistent sets remove expiry", () =>
  Effect.gen(function* ttlContract() {
    const atomic = yield* AtomicKeyValueStore;
    const native = yield* KeyValueStore.KeyValueStore;
    yield* atomic.transact(
      transaction(
        [{ _tag: "Absent", key: "ttl" }],
        [
          {
            _tag: "Set",
            key: "ttl",
            value: "temporary",
            ttl: 1,
          },
        ]
      )
    );
    yield* TestClock.adjust(Duration.millis(2));
    assert.strictEqual(yield* native.get("ttl"), undefined);
    yield* atomic.transact(
      transaction(
        [{ _tag: "Absent", key: "ttl" }],
        [{ _tag: "Set", key: "ttl", value: "durable" }]
      )
    );
    yield* TestClock.adjust(Duration.millis(2));
    assert.strictEqual(yield* native.get("ttl"), "durable");
  }).pipe(Effect.provide(PersistenceMemory))
);

it.effect("evaluates absent and equals conditions without partial writes", () =>
  Effect.gen(function* conditionContract() {
    const atomic = yield* AtomicKeyValueStore;
    const native = yield* KeyValueStore.KeyValueStore;
    yield* atomic.transact(
      transaction(
        [{ _tag: "Absent", key: "owner" }],
        [{ _tag: "Set", key: "owner", value: "current" }]
      )
    );
    assert.strictEqual(
      yield* atomic.transact(
        transaction(
          [{ _tag: "Equals", key: "owner", value: "stale" }],
          [
            { _tag: "Set", key: "owner", value: "replacement" },
            { _tag: "Set", key: "side", value: "must-not-write" },
          ]
        )
      ),
      "conflict"
    );
    assert.strictEqual(yield* native.get("owner"), "current");
    assert.strictEqual(yield* native.get("side"), undefined);
    assert.strictEqual(
      yield* atomic.transact(
        transaction(
          [{ _tag: "Equals", key: "owner", value: "current" }],
          [{ _tag: "Set", key: "owner", value: "replacement" }]
        )
      ),
      "applied"
    );
    assert.strictEqual(yield* native.get("owner"), "replacement");
    assert.strictEqual(
      yield* atomic.transact(
        transaction(
          [{ _tag: "Equals", key: "owner", value: "replacement" }],
          [{ _tag: "Remove", key: "owner" }]
        )
      ),
      "applied"
    );
    assert.strictEqual(yield* native.get("owner"), undefined);
  }).pipe(Effect.provide(PersistenceMemory))
);

it.effect("clears TTLs through native and atomic persistent sets", () =>
  Effect.gen(function* ttlClearingContract() {
    const atomic = yield* AtomicKeyValueStore;
    const native = yield* KeyValueStore.KeyValueStore;
    yield* atomic.transact(
      transaction(
        [{ _tag: "Absent", key: "native" }],
        [
          {
            _tag: "Set",
            key: "native",
            value: "short",
            ttl: 10,
          },
        ]
      )
    );
    yield* native.set("native", "durable");
    yield* TestClock.adjust(Duration.millis(11));
    assert.strictEqual(yield* native.get("native"), "durable");
    yield* atomic.transact(
      transaction(
        [{ _tag: "Absent", key: "atomic" }],
        [
          {
            _tag: "Set",
            key: "atomic",
            value: "short",
            ttl: 10,
          },
        ]
      )
    );
    yield* atomic.transact(
      transaction(
        [{ _tag: "Equals", key: "atomic", value: "short" }],
        [{ _tag: "Set", key: "atomic", value: "durable" }]
      )
    );
    yield* TestClock.adjust(Duration.millis(11));
    assert.strictEqual(yield* native.get("atomic"), "durable");
  }).pipe(Effect.provide(PersistenceMemory))
);

it.effect("expires values from get, has, and size", () =>
  Effect.gen(function* expiryObservationsContract() {
    const atomic = yield* AtomicKeyValueStore;
    const native = yield* KeyValueStore.KeyValueStore;
    yield* atomic.transact(
      transaction(
        [{ _tag: "Absent", key: "expires" }],
        [
          {
            _tag: "Set",
            key: "expires",
            value: "value",
            ttl: 1,
          },
        ]
      )
    );
    yield* TestClock.adjust(Duration.millis(2));
    assert.strictEqual(yield* native.get("expires"), undefined);
    assert.strictEqual(yield* native.has("expires"), false);
    assert.strictEqual(yield* native.size, 0);
  }).pipe(Effect.provide(PersistenceMemory))
);

it.effect(
  "allows exactly thirty-two unique entries and rejects thirty-three without mutation",
  () =>
    Effect.gen(function* boundsContract() {
      const atomic = yield* AtomicKeyValueStore;
      const native = yield* KeyValueStore.KeyValueStore;
      const conditions = Array.makeBy(32, (index) => ({
        _tag: "Absent" as const,
        key: `condition-${index}`,
      }));
      const mutations = Array.makeBy(32, (index) => ({
        _tag: "Set" as const,
        key: `mutation-${index}`,
        value: `value-${index}`,
      }));
      assert.strictEqual(
        yield* atomic.transact(transaction(conditions, mutations)),
        "applied"
      );
      assert.strictEqual(yield* native.size, 32);
      yield* atomic
        .transact(
          uncheckedTransaction(
            Array.makeBy(33, (index) => ({
              _tag: "Absent" as const,
              key: `too-many-${index}`,
            })),
            [{ _tag: "Set", key: "must-not-write", value: "value" }]
          )
        )
        .pipe(Effect.flip);
      assert.strictEqual(yield* native.size, 32);
      assert.strictEqual(yield* native.get("must-not-write"), undefined);
    }).pipe(Effect.provide(PersistenceMemory))
);

it.effect(
  "rejects duplicate condition and mutation keys before changing state",
  () =>
    Effect.gen(function* duplicateContract() {
      const atomic = yield* AtomicKeyValueStore;
      const native = yield* KeyValueStore.KeyValueStore;
      yield* atomic
        .transact(
          transaction(
            [
              { _tag: "Absent", key: "condition" },
              { _tag: "Absent", key: "condition" },
            ],
            [{ _tag: "Set", key: "condition", value: "value" }]
          )
        )
        .pipe(Effect.flip);
      yield* atomic
        .transact(
          transaction(
            [{ _tag: "Absent", key: "mutation" }],
            [
              { _tag: "Set", key: "mutation", value: "one" },
              { _tag: "Set", key: "mutation", value: "two" },
            ]
          )
        )
        .pipe(Effect.flip);
      assert.strictEqual(yield* native.size, 0);
    }).pipe(Effect.provide(PersistenceMemory))
);

it.effect(
  "selects one concurrent absent-key winner and fences stale owners",
  () =>
    Effect.gen(function* concurrencyContract() {
      const atomic = yield* AtomicKeyValueStore;
      const native = yield* KeyValueStore.KeyValueStore;
      const outcomes = yield* Effect.all(
        Array.map(["one", "two", "three"], (owner) =>
          atomic.transact(
            transaction(
              [{ _tag: "Absent", key: "claim" }],
              [{ _tag: "Set", key: "claim", value: owner }]
            )
          )
        ),
        { concurrency: "unbounded" }
      );
      assert.strictEqual(
        Array.reduce(
          outcomes,
          0,
          (count, outcome) => count + (outcome === "applied" ? 1 : 0)
        ),
        1
      );
      const owner = yield* native.get("claim");
      yield* atomic.transact(
        transaction(
          [{ _tag: "Equals", key: "claim", value: owner ?? "" }],
          [{ _tag: "Set", key: "claim", value: "new-owner" }]
        )
      );
      assert.strictEqual(
        yield* atomic.transact(
          transaction(
            [{ _tag: "Equals", key: "claim", value: owner ?? "" }],
            [{ _tag: "Remove", key: "claim" }]
          )
        ),
        "conflict"
      );
      assert.strictEqual(
        yield* atomic.transact(
          transaction(
            [{ _tag: "Equals", key: "claim", value: owner ?? "" }],
            [{ _tag: "Set", key: "claim", value: "stale-overwrite" }]
          )
        ),
        "conflict"
      );
      assert.strictEqual(yield* native.get("claim"), "new-owner");
    }).pipe(Effect.provide(PersistenceMemory))
);

it.effect(
  "round trips transaction and TTL codecs and rejects invalid TTL encodings",
  () =>
    Effect.gen(function* schemaContract() {
      const value = transaction(
        [{ _tag: "Absent", key: "round-trip" }],
        [
          {
            _tag: "Set",
            key: "round-trip",
            value: "value",
            ttl: 25,
          },
        ]
      );
      const json = yield* Schema.encodeEffect(
        Schema.fromJsonString(
          Schema.toCodecJson(AtomicKeyValueStoreTransaction)
        )
      )(value);
      const decoded = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(
          Schema.toCodecJson(AtomicKeyValueStoreTransaction)
        )
      )(json);
      assert.strictEqual(decoded.mutations[0]._tag, "Set");
      yield* Effect.all(
        Array.map([0, -1, 1.5, Infinity], (ttl) =>
          Schema.decodeUnknownEffect(AtomicKeyValueStoreTtl)(ttl).pipe(
            Effect.flip
          )
        )
      );
    })
);
