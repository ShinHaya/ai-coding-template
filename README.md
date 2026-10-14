# AI Coding Template

Template repository for projects developed with multiple AI coding agents
(Codex, Claude Code, Gemini / Antigravity, Grok) under one shared workflow.

It ships the parts that are the same in every project — the Issue workflow,
per-Issue git worktrees, local AI review, documentation review criteria, and the
Agent Skills that drive them — so a new project starts with the operating model
already in place.

## What's in here

| Area | What you get |
| --- | --- |
| Agent entry docs | `AGENTS.md` (canonical), `CLAUDE.md`, `GEMINI.md` sharing one identical instruction block |
| Subagent definitions | `.claude/agents/`, `.agents/agents/` — a reasoning subagent and a mechanical-execution subagent |
| Issue worktrees | `scripts/issue-worktree.sh` — one guarded worktree per Issue, with session leases, handoff epochs, and review budgets |
| Local AI review | `.githooks/` — a `post-commit` hook that reviews the branch diff with `claude`, `codex`, `grok`, or `agy` |
| Documentation review | `skills/{requirements,architecture,design-doc}-review` — criteria that double as reviewer prompts for the hook |
| Workflow skills | `skills/{create-issue,issue-implementation,handoff-issue}` |
| Docs | `docs/` — requirements, architecture, development, testing, security, dependency security, GitHub operations |
| CI | `shellcheck` for the hook and helper scripts; Dependabot config |

## First edits

After creating a repository from this template:

1. `README.md` — project name, setup, and usage
2. `AGENTS.md` — fill in the shared sections (Project Overview, Product
   Principles, Scope, Out of Scope, Tech Stack, Security), then mirror the
   **same** block into `CLAUDE.md` and `GEMINI.md`
3. `docs/requirements.md` — product requirements, with the non-negotiables in §8
4. `docs/architecture.md` — technology selection and boundaries
5. `docs/development.md` — commands and quality gates
6. `.githooks/config` — `LOCAL_AI_REVIEW_TARGET_PATHS` for the paths this
   project actually ships

Then create the `priority:P0`–`priority:P3` labels described in
`docs/github-operations.md` §11.2.

## Setup

```bash
bash scripts/setup-hooks.sh
```

This sets `git config --local core.hooksPath .githooks`, which applies to every
worktree of the clone.

Required commands: `bash`, `git`, `jq`, `gh`, and a checksum tool (`shasum` on
macOS). Recommended: `shellcheck`. At least one reviewer CLI (`claude`,
`codex`, `grok`, or `agy`) is needed for local AI review; `setup-hooks.sh` warns
about missing ones but does not fail.

## How the workflow fits together

1. **File an Issue** with the `create-issue` skill and the implementation-plan
   template.
2. **Implement it** with the `issue-implementation` skill. It creates the
   Issue's worktree through `scripts/issue-worktree.sh`, so agents never commit
   on the primary clone.
3. **Every commit is reviewed locally.** The `post-commit` hook resolves the
   reviewer from the Issue's lifecycle metadata and reviews the branch-wide diff
   — as a `code` unit, plus a separate unit per canonical document, each with its
   own review criteria. Results land in `state/ai-reviews/` (git-ignored).
4. **Wait for a review** with `scripts/wait-for-local-ai-review.sh`, which exits
   the moment the result exists.
5. **Hand off** with the `handoff-issue` skill if the session ends or the agent
   changes. Inherited work in progress is preserved, never stashed or reset.
6. **Merge and clean up** per `docs/github-operations.md` §9.

Each Issue's review allowance is two runs per handoff epoch, so a review/fix
loop cannot run open-ended.

## Verification

```bash
shellcheck .githooks/post-commit .githooks/pre-commit .githooks/lib/*.sh scripts/*.sh
bash scripts/test-issue-worktree.sh
bash scripts/smoke-local-ai-review-branch-mapping.sh
```

The smoke tests launch background processes; redirect their output rather than
running them attached to a pipe.

Then make a small commit on an `issue-<n>-<slug>` branch and check
`state/ai-reviews/`.

## Documents

- `AGENTS.md` — canonical AI coding instructions
- `docs/README.md` — documentation index and ownership guide
- `skills/README.md` — Agent Skill index
- `docs/github-operations.md` — Issue, branch, worktree, and merge workflow
- `docs/local-ai-review.md` — hook setup and operations

GitHub Actions based AI review is intentionally not included as a default
workflow. If needed, document and add it as an optional fallback.
