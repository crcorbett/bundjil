# @bundjil/core

Framework-neutral domain primitives and Effect programs for Bundjil, the
personal-agent workspace.

This package is where stable, reusable agent contracts should live: normalized
message envelopes, identities, consent state, task intents, tool contracts, and
pure or Effect-returning programs that do not depend on a specific app
framework or provider transport.

The package currently exports a small workspace summary program so the
workspace has a real Effect-backed package, test suite, and build output.
Future app code should only move logic here when it is clearly reusable across
channels or runtimes.

## String Contracts

`BundjilWorkspaceName` and `BundjilPackageName` are the canonical checked
brands for reusable workspace semantics. `BundjilDefaultWorkspacePackage` is
the named closed vocabulary for the fixed current package list.
`WorkspaceSummary` is the owner Schema and `makeWorkspaceSummary` decodes the
complete default/custom-name structure through Effect Schema, returning parse
failures through its Effect error channel. Consumers, including
`@bundjil/eve-effect`, import or re-export these contracts rather than
duplicating brands, string fields, or DTOs.
