# .entire

Entire records Codex and Claude Code sessions in this repository via hooks
configured in `.codex/hooks.json` and `.claude/settings.json`.

- `settings.json` — shared Entire configuration, checked into Git.
- `settings.local.json` — machine-specific Entire configuration, ignored by Git.
- `logs/`, `metadata/`, `tmp/` — local recording data, ignored by Git.

Recordings are published as separate checkpoint Git references when pushed
through the Sydney `entire` remote. Ending a chat alone does not publish it.
