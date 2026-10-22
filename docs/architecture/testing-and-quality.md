# Checks and tests

Run `bun run verification` from the repository root. It needs no Doppler login or
live credentials. The wrapper supplies a synthetic Executor URL and key for
building; these values do not grant access and verification makes no live model
or messaging request.

The five normal check categories are:

| Check       | Command and purpose                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Lint        | `bun run check`: formatting, strict Oxlint rules and type-aware boundary checks in `lint/boundary-audit.ts`.       |
| Unused code | `bun run knip`: unused dependencies, exports and files.                                                            |
| Types       | `bun run check-types`: Effect diagnostics, lint/tooling types and all workspace types.                             |
| Tests       | `bun run test`: lint fixtures, workflow safety and all workspace tests.                                            |
| Build       | `bun run build`: workspace outputs. The test command also builds through Turbo before inspecting generated routes. |

`verification:internal` runs lint, Knip, types and the combined build/test graph.
Turbo runs each build task once in that graph. Agent tests depend on the ordinary
Eve build and then the Vercel build, so generated-route tests inspect fresh
outputs. The standalone build/test commands need the same synthetic Executor
settings or the operator's intended build settings. CI runs the same
`verification` wrapper as local development.

## Compiler

All workspace type checks and declaration builds use TypeScript `7.0.2`.
`@effect/tsgo` `0.38.0` patches that compiler and Oxlint; its published support
matrix covers TypeScript `7.0.2`, Oxlint `1.80.0` and `oxlint-tsgolint` `7.0.2001`.
`bun install` applies the patch, and `check:effect-setup` reapplies it before
type checking. The existing `@effect/language-service` configuration name is
also the documented configuration key for this native compiler integration.

`tooling/compiler.test.ts` compiles positive and negative examples with the
installed compiler, including an unrun Effect that must fail. Existing strict
Effect settings remain enabled. Advisory suggestions are not new blocking lint
rules.

The lint boundary checker uses `typescript-compiler-api`, a pinned alias for
TypeScript `6.0.3`. TypeScript 7 removed the compatible JavaScript compiler API;
the new API is marked unstable and is not a drop-in replacement. This alias
only supports source inspection and its fixtures. It is not the application
compiler and does not weaken any boundary rule. Retire it after a separately
tested port of those rules to the new API.

Boundary checks remain type-aware and retain their negative fixtures and exact
host exceptions. They inspect public contracts, Schema encode/decode use, safe
errors and configuration, outbound writes and package boundaries. An exception
that no longer matches is an error. Effect diagnostics remain part of type
checking. There are no separate documentation, control, approval-register or
proof-packet audits.

`tooling/workflows.test.ts` checks the actual workflow files: only successful
main-push CI can deploy, the exact commit is checked out, writes are serial,
credentials and permissions are narrow, actions are pinned, and rollback has
time to finish. Infrastructure tests retain project/source checks, promotion
order, callback binding and rollback on failures, interruption and defects.

Keep tests for authentication, message replay and continuity, streaming terminal
states, credential refresh concurrency, encryption, atomic storage and safe
error output. Test time-based behaviour with Effect TestClock and coordinate
concurrent tests explicitly; do not raise timeouts to hide a race.

Production and live probes are separate, explicitly authorised operations.
Use the app runbook; local checks alone cannot prove provider access or delivery.
The scheduled/manual drift workflow remains read-only and does not run on PRs.
All packages are private, so there is no Changesets release-PR workflow.

Entire's hooks record work and remain enabled. They are not code-quality checks.

## AI work history

Entire records local Codex and Claude Code chats using
[shared settings](../../.entire/settings.json),
[Codex hooks](../../.codex/hooks.json), and
[Claude Code hooks](../../.claude/settings.json). Install Entire CLI on each
machine and run `entire enable --agent codex --telemetry=false --absolute-git-hook-path`
then `entire agent add claude-code` from that clone. `entire doctor` checks the
installed hooks; approve Codex hooks using `/hooks` if it reports missing
approval records. Start fresh chats after installing hooks.

The shared settings turn off Entire's anonymous usage reporting and link
commits to chats automatically. A shared custom redaction rule removes
standalone 32-character hexadecimal values, including the old credential
format found inside quoted password-manager exports. This also masks benign
identifiers with that shape. Built-in scanning alone did not catch those
quoted credentials; verify redaction before publishing historical chats. Local Git hooks contain the installed binary's
absolute path; that path is machine-specific and is not committed. Only
`.codex/hooks.json` is tracked under `.codex`; Entire's local settings, logs,
working transcripts and metadata stay ignored. Original agent transcripts
remain in their owning local stores.

The hosted repository is [Bundjil on Entire](https://entire.io/gh/crcorbett/bundjil).
This clone keeps its direct GitHub `origin` and uses a separate `entire` remote
on `aws-ap-southeast-2.entire.io`. The shared
`strategy_options.checkpoint_push_remote` selects `entire`, so new working
copies inherit that upload destination. An ignored `.entire/settings.local.json`
override takes priority; keep it set to `entire` too. Check that `entire status`
names `entire`. To connect another
clone, use `entire repo remote add entire /gh/crcorbett/bundjil --cluster aws-ap-southeast-2.entire.io`,
then `entire enable --agent codex --telemetry=false --absolute-git-hook-path --checkpoint-push-remote entire`.
This adds a remote without replacing an existing one. A normal commit
and `git push entire HEAD` upload the chat checkpoints and send source changes
through to GitHub. A push only to `origin`, or ending a chat, does not prove
checkpoint publication. Verify hosted transcripts and the exact GitHub commit
separately from `entire status`.
New chat activity after a push waits for the next push through `entire`.

The native Codex and Claude Code importers support `--dry-run`, `--path` and
`--session`. Preview before importing; repeat previews after import to check
that existing turns are skipped. Codex's default importer matches the current
working folder and the last 30 days of file modification times. Older worktree
and compressed history needs temporary, decompressed copies selected by the
original repository identity; only the temporary initial working-folder field
is adjusted to this checkout. Preserve originals, session IDs and timestamps.
Imported chats are read-only and cannot be resumed. Ordinary Claude web and
desktop chats have no native importer in Entire CLI 0.11.3.

`entire disable` stops local recording without removing existing checkpoints.
Reverting the shared settings and hook files restores the source configuration;
remove only the added `entire` remote and its local checkpoint selection when
undoing this clone's connection. Neither action removes already published
history. Hosted deletion is a separate operation requiring fresh authority.
The [dated setup receipt (historical)](https://github.com/crcorbett/bundjil/blob/334f93c1c696fef2911fa564b4dcd83f43c7754c/docs/documentation-audit/ENTIRE-setup-2026-10-01.md)
records this setup's checks and limits; it is not standing provider state.
