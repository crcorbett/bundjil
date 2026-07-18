import { Console, Effect, Exit, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import { CodexUpstashPersistenceLive } from "../src/upstash-persistence.layer.js";

declare const process: {
  exitCode: number | undefined;
};

const NamespaceProbeOutput = Schema.Struct({
  namespaceEmpty: Schema.Boolean,
});

const NamespaceProbeBlockedOutput = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const program = Effect.gen(function* probeEmptyNamespace() {
  const keyValueStore = yield* KeyValueStore.KeyValueStore;

  return NamespaceProbeOutput.make({
    namespaceEmpty: (yield* keyValueStore.size) === 0,
  });
}).pipe(Effect.provide(CodexUpstashPersistenceLive));

const main = Effect.gen(function* renderNamespaceProbe() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(NamespaceProbeOutput)
    )(exit.value);
    return yield* Console.log(output);
  }

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(NamespaceProbeBlockedOutput)
  )({
    status: "blocked",
  });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);
