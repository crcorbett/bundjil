import { assert, it } from "@effect/vitest";
import { Array, Effect, Redacted, Schema, pipe } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  AtomicKeyValueStore,
  AtomicKeyValueStoreTransaction,
} from "../src/index.js";
import { PersistenceMemory } from "../src/memory.layer.js";
import type { UpstashPersistenceClient } from "../src/upstash-client.internal.js";
import {
  makeUpstashPersistenceLayer,
  serializeUpstashAtomicCommand,
  upstashAtomicTransactionScript,
} from "../src/upstash-layer.internal.js";

const options = {
  keyPrefix: "test:persistence:",
  restToken: Redacted.make("token"),
  restUrl: Redacted.make("https://example.upstash.io"),
};

const transaction = Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
  conditions: [
    { _tag: "Absent" as const, key: "a" },
    { _tag: "Equals" as const, key: "b", value: "before" },
  ],
  mutations: [
    {
      _tag: "Set" as const,
      key: "a",
      value: "lease",
      ttl: 25,
    },
    { _tag: "Remove" as const, key: "b" },
    { _tag: "Set" as const, key: "c", value: "durable" },
  ],
});

const transactionInput = (
  conditions: AtomicKeyValueStoreTransaction["conditions"],
  mutations: AtomicKeyValueStoreTransaction["mutations"]
): AtomicKeyValueStoreTransaction => ({ conditions, mutations });

it.effect("serializes one physical key per logical transaction key", () =>
  Effect.gen(function* serializationContract() {
    const command = yield* serializeUpstashAtomicCommand(
      transaction,
      options.keyPrefix
    );
    assert.deepStrictEqual(command.keys, [
      "test:persistence:a",
      "test:persistence:b",
      "test:persistence:c",
    ]);
    assert.deepStrictEqual(command.args, [
      "2",
      "a",
      "1",
      "e",
      "2",
      "before",
      "3",
      "s",
      "1",
      "lease",
      "25",
      "r",
      "2",
      "s",
      "3",
      "durable",
      "",
    ]);
  })
);

it.effect(
  "evaluates one static atomic command and maps response outcomes",
  () => {
    const calls: (readonly [string, readonly string[], readonly string[]])[] =
      [];
    const client: UpstashPersistenceClient = {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(),
      del: () => Promise.resolve(),
      scan: () => Promise.resolve(["0", []]),
      eval: (script, keys, args) => {
        calls.push([script, keys, args]);
        return Promise.resolve(1);
      },
    };
    return Effect.gen(function* evalContract() {
      const atomic = yield* AtomicKeyValueStore;
      assert.strictEqual(yield* atomic.transact(transaction), "applied");
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0]?.[0], upstashAtomicTransactionScript);
      assert.deepStrictEqual(calls[0]?.[1], [
        "test:persistence:a",
        "test:persistence:b",
        "test:persistence:c",
      ]);
      assert.deepStrictEqual(calls[0]?.[2], [
        "2",
        "a",
        "1",
        "e",
        "2",
        "before",
        "3",
        "s",
        "1",
        "lease",
        "25",
        "r",
        "2",
        "s",
        "3",
        "durable",
        "",
      ]);
    }).pipe(Effect.provide(makeUpstashPersistenceLayer(options, () => client)));
  }
);

it.effect(
  "matches PersistenceMemory outcomes for fenced atomic transitions",
  () => {
    const sequence = [
      Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
        conditions: [{ _tag: "Absent", key: "owner" }],
        mutations: [{ _tag: "Set", key: "owner", value: "current" }],
      }),
      Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
        conditions: [{ _tag: "Absent", key: "owner" }],
        mutations: [{ _tag: "Set", key: "side", value: "side" }],
      }),
      Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
        conditions: [{ _tag: "Equals", key: "owner", value: "current" }],
        mutations: [
          { _tag: "Set", key: "owner", value: "newer" },
          { _tag: "Set", key: "second", value: "second" },
        ],
      }),
      Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
        conditions: [{ _tag: "Equals", key: "owner", value: "current" }],
        mutations: [{ _tag: "Set", key: "owner", value: "stale" }],
      }),
      Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
        conditions: [{ _tag: "Equals", key: "owner", value: "current" }],
        mutations: [{ _tag: "Remove", key: "owner" }],
      }),
      Schema.decodeUnknownSync(AtomicKeyValueStoreTransaction)({
        conditions: [{ _tag: "Equals", key: "owner", value: "newer" }],
        mutations: [
          { _tag: "Remove", key: "owner" },
          { _tag: "Remove", key: "second" },
        ],
      }),
    ];
    const state = new Map<string, string>();
    const scripts: string[] = [];
    const client: UpstashPersistenceClient = {
      get: (key) => Promise.resolve(state.get(key) ?? null),
      set: (key, value) => {
        state.set(key, value);
        return Promise.resolve();
      },
      del: (...keys) => {
        for (const key of keys) {
          state.delete(key);
        }
        return Promise.resolve();
      },
      scan: () => Promise.resolve(["0", []]),
      eval: (script, keys, args) => {
        scripts.push(script);
        const next = new Map(state);
        let offset = 1;
        const conditions = Number(args[0] ?? "");
        for (let index = 0; index < conditions; index += 1) {
          const kind = args[offset] ?? "";
          const key = keys[Number(args[offset + 1]) - 1] ?? "";
          if (
            kind === "a"
              ? next.has(key)
              : next.get(key) !== (args[offset + 2] ?? "")
          ) {
            return Promise.resolve(0);
          }
          offset += kind === "a" ? 2 : 3;
        }
        const mutations = Number(args[offset] ?? "0");
        offset += 1;
        for (let index = 0; index < mutations; index += 1) {
          const kind = args[offset] ?? "";
          const key = keys[Number(args[offset + 1]) - 1] ?? "";
          if (kind === "r") {
            next.delete(key);
            offset += 2;
          } else {
            next.set(key, args[offset + 2] ?? "");
            offset += 4;
          }
        }
        state.clear();
        for (const [key, value] of next) {
          state.set(key, value);
        }
        return Promise.resolve(1);
      },
    };
    return Effect.gen(function* parityContract() {
      const memoryAtomic = yield* AtomicKeyValueStore;
      const memoryNative = yield* KeyValueStore.KeyValueStore;
      const memoryOutcomes = yield* pipe(
        sequence,
        Effect.forEach((entry) => memoryAtomic.transact(entry))
      );
      const memoryReadback = [
        yield* memoryNative.get("owner"),
        yield* memoryNative.get("second"),
        yield* memoryNative.get("side"),
      ];
      const upstash = yield* Effect.gen(function* upstashSequence() {
        const upstashAtomic = yield* AtomicKeyValueStore;
        const upstashNative = yield* KeyValueStore.KeyValueStore;
        const outcomes = yield* pipe(
          sequence,
          Effect.forEach((entry) => upstashAtomic.transact(entry))
        );
        return {
          outcomes,
          readback: [
            yield* upstashNative.get("owner"),
            yield* upstashNative.get("second"),
            yield* upstashNative.get("side"),
          ],
        };
      }).pipe(
        Effect.provide(makeUpstashPersistenceLayer(options, () => client))
      );
      assert.deepStrictEqual(upstash.outcomes, memoryOutcomes);
      assert.deepStrictEqual(upstash.readback, memoryReadback);
      assert.deepStrictEqual(upstash.readback, [
        undefined,
        undefined,
        undefined,
      ]);
      assert.strictEqual(
        pipe(
          scripts,
          Array.every((script) => script === upstashAtomicTransactionScript)
        ),
        true
      );
    }).pipe(Effect.provide(PersistenceMemory));
  }
);

it.effect("rejects invalid transactions before provider I/O", () => {
  let evalCalls = 0;
  const client: UpstashPersistenceClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    scan: () => Promise.resolve(["0", []]),
    eval: () => {
      evalCalls += 1;
      return Promise.resolve(1);
    },
  };
  return Effect.gen(function* invalidTransactionContract() {
    const atomic = yield* AtomicKeyValueStore;
    const native = yield* KeyValueStore.KeyValueStore;
    const duplicateConditions = Schema.decodeUnknownSync(
      AtomicKeyValueStoreTransaction
    )({
      conditions: [
        { _tag: "Absent", key: "duplicate" },
        { _tag: "Absent", key: "duplicate" },
      ],
      mutations: [{ _tag: "Set", key: "duplicate", value: "value" }],
    });
    const duplicateMutations = Schema.decodeUnknownSync(
      AtomicKeyValueStoreTransaction
    )({
      conditions: [{ _tag: "Absent", key: "mutation" }],
      mutations: [
        { _tag: "Set", key: "mutation", value: "one" },
        { _tag: "Set", key: "mutation", value: "two" },
      ],
    });
    yield* atomic.transact(duplicateConditions).pipe(Effect.flip);
    yield* atomic.transact(duplicateMutations).pipe(Effect.flip);
    yield* atomic
      .transact(
        transactionInput(
          Array.makeBy(33, (index) => ({
            _tag: "Absent" as const,
            key: `too-many-${index}`,
          })),
          [{ _tag: "Set", key: "must-not-write", value: "value" }]
        )
      )
      .pipe(Effect.flip);
    assert.strictEqual(evalCalls, 0);
    assert.strictEqual(yield* native.get("must-not-write"), undefined);
    assert.strictEqual(yield* native.size, 0);
  }).pipe(Effect.provide(makeUpstashPersistenceLayer(options, () => client)));
});

it.effect("maps rejected eval provider failures to safe atomic errors", () => {
  const privateProviderMarker = "private-provider-marker";
  const client: UpstashPersistenceClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    scan: () => Promise.resolve(["0", []]),
    eval: () => Promise.reject(new Error(privateProviderMarker)),
  };
  return Effect.gen(function* rejectedEvalContract() {
    const atomic = yield* AtomicKeyValueStore;
    const error = yield* atomic.transact(transaction).pipe(Effect.flip);
    const rendered = Schema.encodeUnknownSync(Schema.UnknownFromJsonString)(
      error
    );
    assert.strictEqual(error.operation, "transact");
    assert.strictEqual(rendered.includes(privateProviderMarker), false);
    assert.strictEqual(rendered.includes("lease"), false);
    assert.strictEqual("cause" in error, false);
  }).pipe(Effect.provide(makeUpstashPersistenceLayer(options, () => client)));
});

it.effect("maps zero eval responses to conflict", () => {
  const client: UpstashPersistenceClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    scan: () => Promise.resolve(["0", []]),
    eval: () => Promise.resolve(0),
  };
  return Effect.gen(function* conflictContract() {
    const atomic = yield* AtomicKeyValueStore;
    assert.strictEqual(yield* atomic.transact(transaction), "conflict");
  }).pipe(Effect.provide(makeUpstashPersistenceLayer(options, () => client)));
});

it.effect(
  "maps malformed and rejected eval responses to safe atomic errors",
  () => {
    const marker = "private-eval-marker";
    const malformed: UpstashPersistenceClient = {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(),
      del: () => Promise.resolve(),
      scan: () => Promise.resolve(["0", []]),
      eval: () => Promise.resolve({ marker }),
    };
    return Effect.gen(function* safeEvalErrorContract() {
      const atomic = yield* AtomicKeyValueStore;
      const error = yield* atomic.transact(transaction).pipe(Effect.flip);
      const rendered = Schema.encodeUnknownSync(Schema.UnknownFromJsonString)(
        error
      );
      assert.strictEqual(error.operation, "transact");
      assert.strictEqual(rendered.includes(marker), false);
      assert.strictEqual("cause" in error, false);
    }).pipe(
      Effect.provide(makeUpstashPersistenceLayer(options, () => malformed))
    );
  }
);
