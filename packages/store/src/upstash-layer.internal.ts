import {
  Array,
  Context,
  Data,
  Duration,
  Effect,
  HashMap,
  HashSet,
  Layer,
  Match,
  Option,
  pipe,
  Schema,
} from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  AtomicKeyValueStore,
  decodeAtomicKeyValueStoreTransaction,
} from "./atomic-key-value-store.service.js";
import { AtomicKeyValueStoreError } from "./errors.js";
import type { AtomicKeyValueStoreTransaction } from "./schemas.js";
import type { UpstashPersistenceClientFactory } from "./upstash-client.internal.js";
import type { UpstashPersistenceOptions } from "./upstash-options.js";

class UpstashPersistenceProviderError extends Data.TaggedError(
  "UpstashPersistenceProviderError"
)<{ readonly cause: unknown }> {}

const UpstashGetResponse = Schema.NullOr(Schema.String);
const UpstashScanPage = Schema.Tuple([
  Schema.String,
  Schema.Array(Schema.String),
]);
const UpstashTransactionResponse = Schema.Literals([0, 1]);
const UpstashAtomicCommand = Schema.Struct({
  keys: Schema.Array(Schema.String),
  args: Schema.Array(Schema.String),
});
type UpstashAtomicCommand = typeof UpstashAtomicCommand.Type;
type UpstashAtomicCommandEncoded = typeof UpstashAtomicCommand.Encoded;

export const upstashAtomicTransactionScript =
  "local n=tonumber(ARGV[1]); local i=2; for c=1,n do local t=ARGV[i]; local k=KEYS[tonumber(ARGV[i+1])]; if (t=='a' and redis.call('get',k)~=false) or (t=='e' and redis.call('get',k)~=ARGV[i+2]) then return 0 end; i=i+(t=='a' and 2 or 3) end; local m=tonumber(ARGV[i]); i=i+1; for c=1,m do local t=ARGV[i]; local k=KEYS[tonumber(ARGV[i+1])]; if t=='r' then redis.call('del',k); i=i+2 else local v=ARGV[i+2]; local ttl=ARGV[i+3]; if ttl=='' then redis.call('set',k,v) else redis.call('set',k,v,'PX',ttl) end; i=i+4 end end; return 1";

const toPhysicalKey = (
  prefix: UpstashPersistenceOptions["keyPrefix"],
  logical: string
) => `${prefix}${logical}`;

export const serializeUpstashAtomicCommand = Effect.fn(
  "UpstashPersistence.serializeAtomicCommand"
)(function* (
  transaction: AtomicKeyValueStoreTransaction,
  prefix: UpstashPersistenceOptions["keyPrefix"]
) {
  const logicalKeys = pipe(
    Array.appendAll(
      pipe(
        transaction.conditions,
        Array.map((condition) => condition.key)
      ),
      pipe(
        transaction.mutations,
        Array.map((mutation) => mutation.key)
      )
    ),
    Array.dedupe
  );
  const indexes = Array.reduce(
    logicalKeys,
    HashMap.empty<string, number>(),
    (map, key, index) => HashMap.set(map, key, index + 1)
  );
  const getKeyIndex = (key: string) =>
    Option.match(HashMap.get(indexes, key), {
      onNone: () =>
        Effect.fail(
          new AtomicKeyValueStoreError({
            operation: "transact",
            message: "Unable to apply the atomic key-value transaction.",
          })
        ),
      onSome: Effect.succeed,
    });
  const conditionArgs = yield* pipe(
    transaction.conditions,
    Effect.forEach((condition) =>
      Match.value(condition).pipe(
        Match.tagsExhaustive({
          Absent: ({ key }) =>
            Effect.map(getKeyIndex(key), (index) => ["a", String(index)]),
          Equals: ({ key, value }) =>
            Effect.map(getKeyIndex(key), (index) => [
              "e",
              String(index),
              value,
            ]),
        })
      )
    )
  );
  const mutationArgs = yield* pipe(
    transaction.mutations,
    Effect.forEach((mutation) =>
      Match.value(mutation).pipe(
        Match.tagsExhaustive({
          Remove: ({ key }) =>
            Effect.map(getKeyIndex(key), (index) => ["r", String(index)]),
          Set: ({ key, value, ttl }) =>
            Effect.map(getKeyIndex(key), (index) => [
              "s",
              String(index),
              value,
              ttl === undefined ? "" : String(Duration.toMillis(ttl)),
            ]),
        })
      )
    )
  );
  const command: UpstashAtomicCommandEncoded = {
    keys: pipe(
      logicalKeys,
      Array.map((key) => toPhysicalKey(prefix, key))
    ),
    args: Array.appendAll(
      [
        String(transaction.conditions.length),
        ...Array.flatten(conditionArgs),
        String(transaction.mutations.length),
      ],
      Array.flatten(mutationArgs)
    ),
  };
  return yield* Schema.decodeEffect(UpstashAtomicCommand)(command);
});

export const makeUpstashPersistenceLayer = (
  options: UpstashPersistenceOptions,
  clientFactory: UpstashPersistenceClientFactory
) =>
  Layer.effectContext(
    Effect.sync(() => {
      const client = clientFactory();
      const error = (method: string) =>
        new KeyValueStore.KeyValueStoreError({
          method,
          message: "Unable to access the persistence store.",
        });
      const scanKeys = Effect.fn("UpstashPersistence.scanKeys")(function* () {
        let cursor = "0";
        let keys = HashSet.empty<string>();
        do {
          const scanCursor = cursor;
          const page = yield* Effect.tryPromise({
            try: () =>
              client.scan(scanCursor, {
                match: `${options.keyPrefix}*`,
                count: 100,
              }),
            catch: (cause) => new UpstashPersistenceProviderError({ cause }),
          });
          const [nextCursor, pageKeys] = yield* Schema.decodeUnknownEffect(
            UpstashScanPage
          )(page).pipe(
            Effect.mapError(
              () => new UpstashPersistenceProviderError({ cause: undefined })
            )
          );
          if (
            !pipe(
              pageKeys,
              Array.every((key) => key.startsWith(options.keyPrefix))
            )
          ) {
            return yield* new UpstashPersistenceProviderError({
              cause: undefined,
            });
          }
          cursor = nextCursor;
          keys = HashSet.union(keys, HashSet.fromIterable(pageKeys));
        } while (cursor !== "0");
        return keys;
      });
      const native = KeyValueStore.makeStringOnly({
        get: (logical) =>
          Effect.tryPromise({
            try: () => client.get(toPhysicalKey(options.keyPrefix, logical)),
            catch: (cause) => new UpstashPersistenceProviderError({ cause }),
          }).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(UpstashGetResponse)),
            Effect.map((value) => value ?? undefined),
            Effect.mapError(() => error("get")),
            Effect.withSpan("UpstashPersistence.get")
          ),
        set: (logical, value) =>
          Effect.tryPromise({
            try: () =>
              client.set(toPhysicalKey(options.keyPrefix, logical), value),
            catch: (cause) => new UpstashPersistenceProviderError({ cause }),
          }).pipe(
            Effect.asVoid,
            Effect.mapError(() => error("set")),
            Effect.withSpan("UpstashPersistence.set")
          ),
        remove: (logical) =>
          Effect.tryPromise({
            try: () => client.del(toPhysicalKey(options.keyPrefix, logical)),
            catch: (cause) => new UpstashPersistenceProviderError({ cause }),
          }).pipe(
            Effect.asVoid,
            Effect.mapError(() => error("remove")),
            Effect.withSpan("UpstashPersistence.remove")
          ),
        clear: scanKeys().pipe(
          Effect.flatMap((keys) =>
            Effect.gen(function* clearUpstashKeys() {
              const collected = Array.fromIterable(keys);
              if (collected.length === 0) {
                return yield* Effect.void;
              }
              return yield* pipe(
                Array.chunksOf(collected, 100),
                Effect.forEach((chunk) =>
                  Effect.tryPromise({
                    try: () => client.del(...chunk),
                    catch: (cause) =>
                      new UpstashPersistenceProviderError({ cause }),
                  })
                ),
                Effect.asVoid
              );
            })
          ),
          Effect.mapError(() => error("clear")),
          Effect.withSpan("UpstashPersistence.clear")
        ),
        size: scanKeys().pipe(
          Effect.map(HashSet.size),
          Effect.mapError(() => error("size")),
          Effect.withSpan("UpstashPersistence.size")
        ),
      });
      const transact = Effect.fn("AtomicKeyValueStore.transact")(
        function* (transaction: AtomicKeyValueStoreTransaction) {
          const decoded =
            yield* decodeAtomicKeyValueStoreTransaction(transaction);
          const command = yield* serializeUpstashAtomicCommand(
            decoded,
            options.keyPrefix
          );
          const response = yield* Effect.tryPromise({
            try: () =>
              client.eval(
                upstashAtomicTransactionScript,
                Array.fromIterable(command.keys),
                Array.fromIterable(command.args)
              ),
            catch: (cause) => new UpstashPersistenceProviderError({ cause }),
          });
          const result = yield* Schema.decodeUnknownEffect(
            UpstashTransactionResponse
          )(response);
          return Match.value(result).pipe(
            Match.when(0, () => "conflict" as const),
            Match.when(1, () => "applied" as const),
            Match.exhaustive
          );
        },
        (effect) =>
          effect.pipe(
            Effect.mapError(
              () =>
                new AtomicKeyValueStoreError({
                  operation: "transact",
                  message: "Unable to apply the atomic key-value transaction.",
                })
            ),
            Effect.withSpan("AtomicKeyValueStore.transact")
          )
      );
      const atomic = AtomicKeyValueStore.of({ transact });
      return Context.empty().pipe(
        Context.add(KeyValueStore.KeyValueStore, native),
        Context.add(AtomicKeyValueStore, atomic)
      );
    })
  );
