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
