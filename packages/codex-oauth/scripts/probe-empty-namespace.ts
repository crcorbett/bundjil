import { Effect, Exit, Schema } from "effect";
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

const encodeNamespaceProbeOutput = Schema.encodeSync(
  Schema.fromJsonString(NamespaceProbeOutput)
);
const encodeNamespaceProbeBlockedOutput = Schema.encodeSync(
  Schema.fromJsonString(NamespaceProbeBlockedOutput)
);

const program = Effect.gen(function* probeEmptyNamespace() {
  const keyValueStore = yield* KeyValueStore.KeyValueStore;

  return NamespaceProbeOutput.make({
    namespaceEmpty: (yield* keyValueStore.size) === 0,
  });
}).pipe(Effect.provide(CodexUpstashPersistenceLive));

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(encodeNamespaceProbeOutput(exit.value));
} else {
  console.error(encodeNamespaceProbeBlockedOutput({ status: "blocked" }));
  process.exitCode = 1;
}
