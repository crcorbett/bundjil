import { assert, it } from "@effect/vitest";
import { Array, Effect, HashSet, Redacted, Schema, pipe } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import type { UpstashPersistenceClient } from "../src/upstash-client.internal.js";
import { makeUpstashPersistenceLayer } from "../src/upstash-layer.internal.js";
import { UpstashPersistenceKeyPrefix } from "../src/upstash.layer.js";

const options = {
  keyPrefix: "test:persistence:",
  restToken: Redacted.make("token"),
  restUrl: Redacted.make("https://example.upstash.io"),
};

const layerFor = (client: UpstashPersistenceClient) =>
  makeUpstashPersistenceLayer(options, () => client);

it.effect(
  "prefixes native get set and remove and converts null to undefined",
  () => {
    const calls: (readonly [string, readonly string[]])[] = [];
    const client: UpstashPersistenceClient = {
      get: (key) => {
        calls.push(["get", [key]]);
        return Promise.resolve(null);
      },
      set: (key, value) => {
        calls.push(["set", [key, value]]);
        return Promise.resolve();
      },
      del: (...keys) => {
        calls.push(["del", keys]);
        return Promise.resolve();
      },
      scan: () => Promise.resolve(["0", []]),
      eval: () => Promise.resolve(0),
    };
    return Effect.gen(function* nativePrefixContract() {
      const store = yield* KeyValueStore.KeyValueStore;
      assert.strictEqual(yield* store.get("missing"), undefined);
      yield* store.set("entry", "value");
      yield* store.remove("entry");
      assert.deepStrictEqual(calls, [
        ["get", ["test:persistence:missing"]],
        ["set", ["test:persistence:entry", "value"]],
        ["del", ["test:persistence:entry"]],
      ]);
    }).pipe(Effect.provide(layerFor(client)));
  }
);

it.effect(
  "scans every cursor with an exact scoped match and deduplicates size",
  () => {
    const calls: (readonly [string, readonly string[]])[] = [];
    let allocations = 0;
    const client: UpstashPersistenceClient = {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(),
      del: () => Promise.resolve(),
      scan: (cursor, scanOptions) => {
        calls.push([
          "scan",
          [cursor, scanOptions.match, String(scanOptions.count)],
        ]);
        return Promise.resolve(
          cursor === "0"
            ? ["1", ["test:persistence:a", "test:persistence:b"]]
            : ["0", ["test:persistence:b", "test:persistence:c"]]
        );
      },
      eval: () => Promise.resolve(0),
    };
    return Effect.gen(function* scanContract() {
      const store = yield* KeyValueStore.KeyValueStore;
      assert.strictEqual(yield* store.size, 3);
      assert.strictEqual(allocations, 1);
      assert.deepStrictEqual(calls, [
        ["scan", ["0", "test:persistence:*", "100"]],
        ["scan", ["1", "test:persistence:*", "100"]],
      ]);
    }).pipe(
      Effect.provide(
        makeUpstashPersistenceLayer(options, () => {
          allocations += 1;
          return client;
        })
      )
    );
  }
);

it.effect(
  "collects scan pages before three deduplicated bounded clear batches",
  () => {
    const events: (readonly [string, readonly string[]])[] = [];
    const keys = Array.makeBy(205, (index) => `test:persistence:${index}`);
    const client: UpstashPersistenceClient = {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(),
      eval: () => Promise.resolve(0),
      scan: (cursor) => {
        events.push(["scan", [cursor]]);
        return Promise.resolve(
          cursor === "0"
            ? ["1", [...keys.slice(0, 103), keys[0]]]
            : ["0", [...keys.slice(102), keys[1]]]
        );
      },
      del: (...batch) => {
        events.push(["del", batch]);
        return Promise.resolve();
      },
    };
    return Effect.gen(function* clearContract() {
      const store = yield* KeyValueStore.KeyValueStore;
      yield* store.clear;
      assert.strictEqual(
        pipe(
          events,
          Array.filter(([name]) => name === "scan")
        ).length,
        2
      );
      const batches = pipe(
        events,
        Array.filter(([name]) => name === "del")
      );
      assert.strictEqual(batches.length, 3);
      const deleted = Array.flatten(
        pipe(
          batches,
          Array.map(([, batch]) => batch)
        )
      );
      assert.strictEqual(
        pipe(
          batches,
          Array.every(([, batch]) => batch.length <= 100)
        ),
        true
      );
      assert.strictEqual(HashSet.size(HashSet.fromIterable(deleted)), 205);
      assert.strictEqual(
        pipe(
          deleted,
          Array.every((key) => key.startsWith(options.keyPrefix))
        ),
        true
      );
    }).pipe(Effect.provide(layerFor(client)));
  }
);

it.effect("maps malformed and rejected native responses to safe errors", () => {
  const privateMarker = "private-marker";
  const client: UpstashPersistenceClient = {
    get: () => Promise.resolve({ privateMarker }),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    scan: () => Promise.resolve(["0", ["foreign:key"]]),
    eval: () => Promise.resolve(0),
  };
  return Effect.gen(function* safeErrorContract() {
    const store = yield* KeyValueStore.KeyValueStore;
    const getError = yield* store.get(privateMarker).pipe(Effect.flip);
    const rendered = Schema.encodeUnknownSync(Schema.UnknownFromJsonString)(
      getError
    );
    assert.strictEqual(rendered.includes(privateMarker), false);
    assert.strictEqual(getError.key, undefined);
    assert.strictEqual(getError.cause, undefined);
    const sizeError = yield* store.size.pipe(Effect.flip);
    const sizeRendered = Schema.encodeUnknownSync(Schema.UnknownFromJsonString)(
      sizeError
    );
    assert.strictEqual(sizeRendered.includes("foreign:key"), false);
    assert.strictEqual(sizeError.key, undefined);
    assert.strictEqual(sizeError.cause, undefined);
    yield* Effect.all(
      pipe(
        ["*", "?", "[", "]", "\\"],
        Array.map((prefix) =>
          Schema.decodeUnknownEffect(UpstashPersistenceKeyPrefix)(prefix).pipe(
            Effect.flip
          )
        )
      )
    );
  }).pipe(Effect.provide(layerFor(client)));
});

it.effect("safely maps malformed and rejected scan providers", () => {
  const privateMarker = "private-scan-marker";
  const malformed: UpstashPersistenceClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    scan: () => Promise.resolve(["0", privateMarker]),
    eval: () => Promise.resolve(0),
  };
  const rejected: UpstashPersistenceClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    scan: () => Promise.reject(new Error(privateMarker)),
    eval: () => Promise.resolve(0),
  };
  return Effect.gen(function* scanFailureContract() {
    const malformedStore = yield* KeyValueStore.KeyValueStore;
    const malformedError = yield* malformedStore.size.pipe(Effect.flip);
    assert.strictEqual(
      Schema.encodeUnknownSync(Schema.UnknownFromJsonString)(
        malformedError
      ).includes(privateMarker),
      false
    );
    assert.strictEqual(malformedError.key, undefined);
    assert.strictEqual(malformedError.cause, undefined);
    const rejectedError = yield* Effect.gen(function* rejectedScanSize() {
      const rejectedStore = yield* KeyValueStore.KeyValueStore;
      return yield* rejectedStore.size;
    }).pipe(Effect.provide(layerFor(rejected)), Effect.flip);
    assert.strictEqual(
      Schema.encodeUnknownSync(Schema.UnknownFromJsonString)(
        rejectedError
      ).includes(privateMarker),
      false
    );
    assert.strictEqual(rejectedError.key, undefined);
    assert.strictEqual(rejectedError.cause, undefined);
  }).pipe(Effect.provide(layerFor(malformed)));
});

it.effect("skips empty clear and safely maps rejected provider reads", () => {
  const privateMarker = "private-provider-marker";
  const calls: string[] = [];
  const client: UpstashPersistenceClient = {
    get: () => Promise.reject(new Error(privateMarker)),
    set: () => Promise.resolve(),
    del: () => {
      calls.push("del");
      return Promise.resolve();
    },
    scan: () => Promise.resolve(["0", []]),
    eval: () => Promise.resolve(0),
  };
  return Effect.gen(function* providerFailureContract() {
    const store = yield* KeyValueStore.KeyValueStore;
    yield* store.clear;
    assert.strictEqual(calls.length, 0);
    const error = yield* store.get("private-key").pipe(Effect.flip);
    const rendered = Schema.encodeUnknownSync(Schema.UnknownFromJsonString)(
      error
    );
    assert.strictEqual(rendered.includes(privateMarker), false);
    assert.strictEqual(error.key, undefined);
    assert.strictEqual(error.cause, undefined);
  }).pipe(Effect.provide(layerFor(client)));
});
