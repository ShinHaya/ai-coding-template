# Development

This document owns **local setup, commands, conventions, quality gates, and
review criteria**. GitHub workflow rules live in
[`github-operations.md`](github-operations.md).

## 1. Development Policy

- Keep changes small enough to review as one coherent behavior, document, or
  workflow update.
- Use Issue branches named `issue-<number>-<short-slug>` in matching
  `.worktrees/issue-<number>-<short-slug>` worktrees (see
  [`github-operations.md`](github-operations.md) §2).
- Keep product requirements, architecture, test strategy, and security
  assumptions in the owning docs rather than repeating them in `README.md`.
- Do not introduce frameworks, dependencies, backend services, cloud sync,
  telemetry, or AI providers without an explicit scope decision recorded in an
  Issue or in [`architecture.md`](architecture.md).

<!-- Add project-specific policy here. -->

## 2. Environment Setup

### 2.1 Required Tools

- Git
- `gh` (GitHub CLI) — required by `scripts/issue-worktree.sh` and the Issue
  orchestrator
- `jq` — required by `scripts/issue-worktree.sh` and the Claude Code guard hook
- `shellcheck` (recommended) — shell script linting
- Node.js (version in `.nvmrc`) — for orchestration and for worktree creation
  when `.ai-template/config.json` exists
- Agent CLIs used as workers or reviewers: `codex`, `claude`, `grok`, or
  `gemini` (only routes verified at run time are used)

<!-- Add the project's language runtime and package manager. -->

### 2.2 Initial Setup

```bash
# Install dependencies
# (npm ci is needed only for the issue-* orchestration scripts)
npm ci

# Install the local Git hooks (once per clone)
bash scripts/setup-hooks.sh
```

## 3. Run Locally

```bash
# Start the local app or service
```

## 4. Project Structure

```text
.
├── .agents/       # Codex / Gemini skill links and subagent definitions
├── .claude/       # Claude Code skill links, subagents, and guard hook
├── .githooks/     # pre-commit quality-gate hook and its config
├── .github/       # Issue templates, workflows, Dependabot config
├── config/        # example orchestrator configuration
├── docs/          # documentation (see docs/README.md)
├── scripts/       # Issue worktree lifecycle, hook setup, Issue orchestration
├── skills/        # repository-local Agent Skills (see skills/README.md)
├── src/
└── tests/
```

## 5. Formatting And Linting

### 5.1 Formatting

```bash
# Format command
```

### 5.2 Linting

```bash
# Lint command
```

## 6. Type Checking

```bash
# Typecheck command
```

## 7. Implementation Conventions

- Keep parsing, classification, orchestration, storage, and UI concerns isolated
  so each can be tested independently.
- Keep storage access behind a small module so future migrations or encryption
  changes do not ripple across the codebase.
- Treat externally-supplied data (file contents, API responses, page text, URL
  parameters) as untrusted input, and type it at the boundary.
- Use fake data in examples, tests, screenshots, and fixtures.
- When writing or reviewing tests, use the repo-local **`writing-good-tests`**
  skill ([`../skills/writing-good-tests/SKILL.md`](../skills/writing-good-tests/SKILL.md))
  for *how* to write them. The test **strategy** (what to test, by layer) stays
  in [`testing.md`](testing.md).
- Avoid committing generated output unless the project documents a reason to
  keep it under version control.

<!-- Add project-specific conventions here. -->

## 8. Quality Gates

Run the relevant checks before committing code:

```bash
# format
# lint
# typecheck
# test
```

Rules:

- Documentation-only changes may skip code-level gates when no generated output
  is affected.
- State any skipped or unavailable checks in PR notes.
- Do not report a gate as passing if the command does not exist yet.

### 8.1 Dependency audit gate

Add a CI step that audits the **shipped** dependency surface and fails on new
high/critical advisories, with Dependabot covering everything else as
non-blocking PRs. The two-layer rationale, the audit command, and the triage /
acceptance process live in [`dependency-security.md`](dependency-security.md).

## 9. Review

### 9.1 Code Review

Code review (human or AI) prioritizes, in this order:

1. **correctness** — bugs, off-by-one, null / empty handling, race conditions,
   error paths that swallow failures
2. **regressions** — behavior changes that break existing callers, tests, or
   documented contracts
3. **security** — input validation, auth, secrets in logs, command injection,
   path traversal, permission bits on state files
4. **missing tests** — new behavior or new branches that have no test coverage
5. **docs consistency** — documentation that contradicts the diff after the
   change

Apply the same order when acting as the independent reviewer role dispatched
by [`issue-implementation`](../skills/issue-implementation/SKILL.md) or
[`orchestrate-issues-implementation`](../skills/orchestrate-issues-implementation/SKILL.md)
(see [`github-operations.md`](github-operations.md) §8).

### 9.2 Documentation Reviews

Each documentation review skill owns its criteria; this document only points to
them so the two cannot drift:

| Review | Target | Skill |
| --- | --- | --- |
| Requirements | diffs to [`requirements.md`](requirements.md) | [`requirements-review`](../skills/requirements-review/SKILL.md) |
| Architecture | [`architecture.md`](architecture.md) or its diff | [`architecture-review`](../skills/architecture-review/SKILL.md) |
| Issue design | a detailed design in a GitHub Issue or PR | [`design-doc-review`](../skills/design-doc-review/SKILL.md) |

Record review results in the Issue or PR, not in repository files.

## 10. Issue Implementation

Use GitHub Issues, labels, and native `Blocked by` relations only; GitHub
Projects and Project tokens are not used. File Issues with
[`create-issue`](../skills/create-issue/SKILL.md). Use the
[`issue-implementation`](../skills/issue-implementation/SKILL.md) skill for a
single Issue, and [`handoff-issue`](../skills/handoff-issue/SKILL.md) to resume
one. Both defer the worktree rules to
[`github-operations.md`](github-operations.md) §2.

Coordinate several Issues with
[`orchestrate-issues-implementation`](../skills/orchestrate-issues-implementation/SKILL.md).

```bash
npm ci
# Discover verified worker routes (codex / claude / grok / gemini CLIs)
node scripts/issue-capabilities.mjs
# Plan explicit Issues without writing anything
node scripts/issue-orchestrator.mjs --issues 12,13 --dry-run \
  --max-parallel 2 --release-policy merged \
  --parent-agent <agent> --parent-model <model>
# Orchestration tests
npm run test:orchestrator
```

The orchestrator reads the repository from `GITHUB_REPOSITORY` (`owner/name`)
when set, otherwise from `gh repo view` in the current checkout. Copy
`config/issue-orchestrator.example.yaml` to
`state/issue-orchestrator.yaml` for run defaults.

Development Issue triage is optional and `off` by default. When an operator
enables it, an isolated child process may send a reviewed Issue title and body
to the external TypeSafe classification API (`TYPESAFE_API_KEY`); private
repositories additionally require `run.triage.allowPrivateIssues: true`. Never
enable it for Issues that contain secrets or personal data.

## 11. Operational Notes

<!-- Document local state, migrations, generated files, and manual setup. -->

- `state/` holds local-only state (orchestrator run state, capability cache,
  runtime config copies, triage evaluation records) and is git-ignored.
- Issue worktree lifecycle metadata lives under the shared Git common directory
  (`.git/issue-worktrees/`), not in the worktree.
- `.worktrees/` holds per-Issue agent worktrees and is git-ignored.

## Tooling state name migration

The orchestration tools and skill now use the `issue-` prefix and
`orchestrate-issues-implementation` name. Tests live under `tests/ai-template/`.
At startup, previous-prefix config, capability cache and graph state paths are
moved to the new names only when the destination is absent. A message is written
to stderr. When both paths exist, neither is overwritten; inspect and reconcile
them manually. Config/cache dry runs read the old paths without moving them.

YAML configuration accepts only the `run` section; remove former board
owner/name settings before loading old configuration files.

The graph checkpoint format and node names have changed. Finish active
orchestrations before merging this migration. Existing checkpoint bytes are
preserved, but old-format checkpoints cannot resume; start a new graph run.

## Repository settings

Shared scripts read optional, repo-owned `.ai-template/config.json` using only
Node standard libraries. Copy [the example](../config/ai-template.example.json)
and set values for this repository; do not add a template overlay or edit
shared scripts to customize them.

- `repository.baseBranch` selects the worktree base and freshness target. Without
  configuration it is `main`. Creation prefers `origin/<baseBranch>`, falling
  back only to that same local branch when remote state is unavailable.
  Worktree creation reads settings from the primary checkout (identified by
  `--repo`, or discovered from Git), regardless of the helper's own location.
  The Product Owner must keep that checkout's settings current before creation;
  an absent config is reported before using the `main` default. Freshness checks
  read settings in the Issue checkout being checked. Keep the same settings in
  both checkouts. PR creation must explicitly target the configured base branch
  even when GitHub's default branch differs.
- `repository.qualityGates` is a list of command strings. The reader prints
  them as data and never executes them. Workflow skills use the list; when it
  is omitted or empty, they read `AGENTS.md` for the actual commands.
- `repository.documents` maps `requirements`, `architecture`, `development`,
  `testing`, `security`, `githubOperations`, and `manualTest` to relative paths
  within the repository. Omitted locations are resolved through `AGENTS.md`,
  rather than guessed from a fixed directory or section number.

Inspect settings with `node scripts/repository-config.mjs`, or select a value
with `--get baseBranch`, `--get qualityGates`, or `--get documents`. `--root`
selects another checkout. Malformed settings, invalid branch names, unknown
repository/document fields, and escaping document paths fail before Git fetch
or branch creation. Agent/runtime and local-skill settings are left to their
own registration validator in the next phase.

`.githooks/pre-commit`, product CI and package scripts remain repo-owned. The
configuration reader does not replace or rewrite those files. Configure their
actual checks in the adopting repository. Role instructions and review skills
refer to `AGENTS.md`; their models and discovery formats remain unchanged here.
