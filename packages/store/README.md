# @bundjil/store

Provider-neutral storage contracts for Bundjil Effect programs.

- `@bundjil/store` exports `AtomicKeyValueStore` and its canonical Schema contracts.
- `@bundjil/store/memory` exports `PersistenceMemory` for coherent deterministic tests.
- `@bundjil/store/upstash` exports `UpstashPersistenceLive(options)` and its redacted provider options.

Use Effect's native `effect/unstable/persistence/KeyValueStore` for ordinary string and binary persistence. Its import path is unstable and this package pins the behavior with contract tests. Native `KeyValueStore.modify` is not an atomic coordination primitive. Claims, locks, fencing, and concurrent transitions must use `AtomicKeyValueStore.transact`.

The Upstash adapter scopes all ordinary operations to its supplied prefix. `clear` and `size` scan that namespace and are weakly consistent under concurrent writes; they must never be used for coordination.
