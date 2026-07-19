import { Context, Effect, Layer, Schema } from "effect";

import {
  CodexOAuthObserverEvent,
  CodexOAuthObserverSnapshot,
} from "./contracts.js";
import type {
  CodexOAuthObserverEvent as CodexOAuthObserverEventType,
  CodexOAuthObserverSnapshot as CodexOAuthObserverSnapshotType,
} from "./contracts.js";

const emptySnapshot = CodexOAuthObserverSnapshot.make({
  counters: {
    refreshStarted: 0,
    refreshSucceeded: 0,
    refreshConflict: 0,
    refreshWinnerUsed: 0,
    reauthenticationMarked: 0,
  },
  events: [],
});

export interface CodexOAuthObserverShape {
  readonly record: (event: CodexOAuthObserverEventType) => Effect.Effect<void>;
  readonly snapshot: Effect.Effect<CodexOAuthObserverSnapshotType>;
}

export class CodexOAuthObserver extends Context.Service<
  CodexOAuthObserver,
  CodexOAuthObserverShape
>()("@bundjil/codex/CodexOAuthObserver") {}

export const CodexOAuthObserverNoop = Layer.succeed(
  CodexOAuthObserver,
  CodexOAuthObserver.of({
    record: () => Effect.void,
    snapshot: Effect.succeed(emptySnapshot),
  })
);

export const recordCodexOAuthObserverEvent = (
  event: CodexOAuthObserverEventType
) =>
  Effect.gen(function* recordCodexOAuthObserverEventOperation() {
    const observer = yield* CodexOAuthObserver;

    yield* Schema.encodeEffect(CodexOAuthObserverEvent)(event);

    return yield* observer.record(event);
  });

export const getCodexOAuthObserverSnapshot = Effect.gen(
  function* getCodexOAuthObserverSnapshotOperation() {
    const observer = yield* CodexOAuthObserver;

    return yield* observer.snapshot;
  }
);
