# GitHub Operations

This document defines shared GitHub workflow rules for humans and AI coding
tools.

## 1. Development Model

- Use trunk-based development.
- Treat `main` as the only trunk.
- Create one short-lived branch per Issue.
- Avoid direct pushes to `main`.
- Use feature flags or safe incremental changes for unfinished work that must
  merge early.

## 2. Starting Work

Sync from the latest `main` before starting:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c <agent>/issue-<number>-<short-english-slug>
```

Branch examples:

- `codex/issue-123-add-user-settings`

Rules:

- Use `codex/` for Codex-authored work.
- Include the Issue number.
- Keep the English slug short and descriptive.
- Record the branch name in the GitHub Issue when useful.

## 3. Implementation Size

- Keep each PR small enough to explain the goal, main changes, and risks.
- Separate renames, refactors, and behavior changes when practical.
- Update docs before or alongside behavior changes.
- Split broad UI / API / state changes when review quality would otherwise
  degrade.

## 4. Quality Gates

Replace these placeholders with project-specific commands:

```bash
# format

# lint

# typecheck

# test
```

Rules:

- Run relevant checks before committing code.
- Documentation-only changes may skip code checks if no generated output is
  affected.
- State any skipped or unavailable checks in PR notes.

## 5. Commits

- Commit meaningful, reviewable units.
- Avoid noisy generated commits.
- Use messages that explain intent.

Recommended format:

```text
<type>: <summary>
```

Examples:

- `feat: add user settings`
- `fix: handle expired sessions`
- `docs: define github workflow`

## 6. Pull Requests

PR descriptions should include:

- what changed
- why it is needed
- how it was verified
- remaining risks or skipped checks

AI review convention:

- Codex-authored branches are reviewed by a separate read-only Codex reviewer
  sub-agent through the local Git hook.
- Fix `NEEDS_CHANGES` findings and commit again to trigger another review.
- Stop the required review/fix loop once the latest verdict is `NIT_ONLY` or
  `PASS`.
- Local AI review output under `state/ai-reviews/` is fast feedback, not a
  replacement for final judgment.

## 7. Local AI Review

Run:

```bash
bash scripts/setup-hooks.sh
```

The hook uses branch prefixes to decide whether local review should run:

- `codex/*` -> Codex review
- other branches are skipped

See `docs/local-ai-review.md` for details.

GitHub Actions based AI review is not enabled by default. If a project
adds it as fallback automation, keep PAT / secret requirements in that
fallback documentation rather than mixing them into the core workflow.

## 8. Merge Policy

- Prefer squash merge into `main`.
- Merge only after required checks pass.
- Re-run relevant checks after addressing review feedback.
- Let `Closes #<issue>` close Issues automatically when possible.
