---
document_type: verification-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-quality-owner
last_reviewed: 2026-10-01
review_trigger: Entire setup or publication requalification
---

# Entire setup observation — 1 October 2026

The authorised change enables Codex and Claude Code recording for Bundjil,
imports available local history and publishes checkpoints through Sydney.
Cooper explicitly approved keeping Bundjil public and publishing its chat
history after live GitHub readback showed that the repository is public.
DAW was inspected only as a read-only reference; its identity and files were
not copied or modified.

Base and rollback source: `cbb0fb6045065fcd6e752c6cab629ef9e4b2835d`.
Work branch: `codex/entire-setup`. Tools: Entire CLI `0.11.3`, Codex CLI
`0.153.4`, Claude Code `2.1.269`.

## Documentation impact ledger

| Surface                               | Decision                   | Trigger, owner and exact paths                                                                                                                                         | Check and observable result                                                       | Limits                                                                    |
| ------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Durable docs and standards            | Change required            | Recording and publication behaviour belongs to `docs/architecture/testing-and-quality.md`; link this receipt there.                                                    | `bun run check:docs`; shared/local settings and publication described separately. | No runtime architecture or provider adapter changed.                      |
| Root, app and package READMEs         | Change required / Preserve | Add root `README.md` history pointer and `.entire/README.md` settings explanation; preserve inspected app/package command maps.                                        | Documentation links and final diff.                                               | No app or package boundary changed.                                       |
| API, generated references and exports | N/A                        | Root `package.json` and package export owners inspected; settings install external CLI hooks only.                                                                     | Final diff has no generated/API/export change.                                    | No new service or SDK adapter.                                            |
| Runbooks and authority                | Preserve                   | `docs/operations/authority-model.md`, static register and app-owned runbook routes remain unchanged; this task has explicit Entire setup/import/publication authority. | Exact account, repository and Sydney placement readback.                          | No infrastructure deployment, secret or webhook change.                   |
| Journeys, proof and evidence          | Change required            | This dated receipt records local and hosted results; `docs/verification/README.md` remains the runtime journey router.                                                 | Fresh sessions, normal commit/push, hosted transcript and GitHub SHA readback.    | Enabled status alone is not accepted as recording/publication proof.      |
| Skills, mirrors and instructions      | Preserve                   | `AGENTS.md` and `.agents/skills/docs-maintainer/**` used; existing `.claude/skills/**` preserved. Add agent hook files without replacing other settings.               | `bun run check:skills`, `entire doctor`, final diff.                              | No skill or agent policy change.                                          |
| Config, commands, CI and automation   | Change required / Preserve | `.entire/settings.json`, `.entire/.gitignore`, `.codex/hooks.json`, `.claude/settings.json`, `.gitignore`; preserve `package.json` and `.github/workflows/**`.         | Shared settings, absolute local Git hooks, focused checks and full verification.  | Automatic checkpoint publication is scoped to the selected Entire remote. |
| SPEC, plan and lifecycle              | N/A                        | Current SPEC/task index and active-plan router inspected; this is ordinary repository tooling setup.                                                                   | No product scope or active implementation task changed.                           | This receipt is evidence, not an active plan or a deployment approval.    |

## Observation

The Sydney mirror reports ready for `/gh/crcorbett/bundjil`, with public
visibility. GitHub `origin` remains `https://github.com/crcorbett/bundjil.git`.
The added `entire` remote is
`entire://aws-ap-southeast-2.entire.io/gh/crcorbett/bundjil`.
Shared settings have `telemetry: false`, `absolute_git_hook_path: true`,
`commit_linking: always` and the `git-refs` checkpoint backend.

The native import preview found 1,291 turns across 119 available selected
Codex transcripts. This includes compressed archives and historical worktrees.
Before the redaction correction, temporary copies adjusted only the initial
working-folder metadata; session IDs, original timestamps and original
transcript files are preserved. Another 55
indexed historical chats have no transcript file in the current local stores.
There was no earlier local Claude Code history to import.

Fresh local recording passed for Codex session
`01a0f577-1693-7a63-bf0d-093373441474` and Claude Code session
`6c8144af-30f4-4905-b205-6db5625e0c50`: each produced one turn and one pending
checkpoint through installed hooks. Codex edited `README.md`; Claude Code
created `.entire/README.md`. Neither used a manually synthesised transcript.
`entire doctor` reports Git hooks, Codex approval records and Claude Code hook
configuration present. No platform approval remains outstanding for these
installed hooks at the observation time.

The focused documentation check and full `bun run verification` passed. The
first full check caught receipt formatting; that formatting was corrected
before the successful repeat. Earlier Codex attempts with `gpt-6.1-sol` and
`gpt-5.4` were rejected by the CLI login and are not recording/publication proof;
the accepted fresh session used `gpt-5.5`.

## Hosted publication and redaction correction

The first normal commit is `2b7aa8f27ae73c1e1be91406980304529bf24fdd`,
linked automatically to checkpoint `01M3TQPZ0SEWF94B3SQD6XDZEE` containing
the two fresh sessions. A normal push through Sydney published that checkpoint
and the source branch. Independent GitHub readback matched the exact SHA.
Hosted session pages display the actual prompts, replies and tool calls:

- [Fresh Codex session](https://entire.io/gh/crcorbett/bundjil/session/01a0f577-1693-7a63-bf0d-093373441474)
- [Fresh Claude Code session](https://entire.io/gh/crcorbett/bundjil/session/6c8144af-30f4-4905-b205-6db5625e0c50)

The native import wrote 1,291 turns from 119 scanned transcripts. Of these,
115 have importable user turns; four contain none. A normal second push
uploaded all 1,291 imported checkpoint refs. A repeat native preview reported zero new turns and all 1,291 already imported. The imported working copy was verified against each original:
all 119 transcript bodies matched their original snapshots, with only the
temporary initial working folder changed; one original had newer appended
messages. Those newer messages were not part of this snapshot.

Hosted inspection then found two old Sendblue credential values inside a quoted
password-manager export. Entire's default scanner missed their nested field
shape. No credential value is reproduced in this receipt. The backfill cannot
be accepted as safe publication at that point. A shared custom redaction rule
now removes all standalone 32-character hexadecimal values, and temporary
copies are explicitly scrubbed before a replacement import. Originals remain
untouched. This masks benign identifiers with the same shape as well.

Automatic approval review initially rejected removal of the task-created
hosted imports because it needed explicit user approval. Cooper then approved
removing exactly those 1,291 imported records and replacing them with redacted
copies. Remote readback confirms all 1,291 original imported refs were removed;
the fresh-session checkpoint and source branch were preserved. The sampled
hosted session then reported that its transcript was unavailable. A native
replacement preview found all 1,291 turns ready to import, with none skipped.
The Sendblue credentials' current validity is unknown. Any provider credential
rotation is a separate action requiring its own approval.

The corrected temporary snapshot masks 4,579 standalone 32-character
hexadecimal values across 47 transcripts; all 119 copies pass the absence
check. A separate local native-import fixture confirms Entire removes a fake
nested credential using the shared rule. That fixture was never published.
The full `bun run verification` and `entire doctor` pass on the corrected
configuration.

The native replacement imported all 1,291 turns from the same 119 snapshots,
with the same record IDs. All saved full chats, transcript sections and prompts
were checked: none contain the missed 32-character credential format. A repeat
native preview reports zero new turns and all 1,291 already imported. A normal
push uploaded the replacements. Independent remote readback confirms every
replacement matches its local saved content and the fresh checkpoint is intact.

Hosted pages now display the corrected history. The main historical chat shows
606 checkpoints; the sampled old worktree chat shows five. Both displayed
transcripts contain redactions and no matches for the missed credential format.
The previously exposed API Key and Secret Key fields now show redactions.

- [Historical main chat](https://entire.io/gh/crcorbett/bundjil/session/019f3c64-2576-70c2-90c0-e6b212f79ee1)
- [Corrected historical worktree chat](https://entire.io/gh/crcorbett/bundjil/session/019fcf21-b678-79c2-9692-a14833cd77ee)

These checks establish the current published records. They do not prove that
prior downloads or provider-held copies have been erased. No Sendblue credential
was changed; validity and rotation remain separate, unverified work.

## Rollback and non-claims

Stop new recording with `entire disable`. Revert only this change's shared
settings, hook files and documentation; remove the added Entire remote and
ignored local checkpoint selection to restore this clone's original remote
configuration. Original transcripts are preserved. Already published history
is not removed by local rollback. No infrastructure was deployed and this
receipt makes no runtime, Production or future provider-state claim.
