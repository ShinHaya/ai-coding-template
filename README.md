# AI Coding Template

Template repository for projects developed with multiple AI coding agents
(Codex, Claude Code, Gemini, Grok) under one shared workflow.

It ships the parts that are the same in every project — the Issue workflow,
per-Issue git worktrees, independent reviewer-role review, multi-Issue
orchestration, documentation review criteria, and the Agent Skills that drive
them — so a new project starts with the operating model already in place.

## What's in here

| Area | What you get |
| --- | --- |
| Agent entry docs | `AGENTS.md` (canonical), `CLAUDE.md`, `GEMINI.md` sharing one identical instruction block |
| Subagent definitions | `.claude/agents/`, `.agents/agents/` — a reasoning subagent and a mechanical-execution subagent |
| Workflow skills | `skills/{create-issue,issue-implementation,handoff-issue,orchestrate-project-issues}`, linked from `.claude/skills/` and `.agents/skills/` |
| Issue worktrees | `scripts/issue-worktree.sh` — one guarded worktree per Issue, with session leases and handoff epochs |
| Reviewer role and orchestration | `scripts/project-issue-*.mjs` — verified agent/model route discovery, role dispatch (implementer / planner / reviewer), dependency-ordered multi-Issue plans, optional LangGraph runner |
| Documentation review | `skills/{requirements,architecture,design-doc}-review` — review criteria owned by each skill |
| Commit guards | `.githooks/pre-commit` quality gates; a Claude Code `PreToolUse` hook that blocks commits outside an Issue worktree |
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
5. `docs/development.md` — commands and quality gates (the `pre-commit` hook
   runs `npm run format`, `lint`, and `typecheck`; adjust `.githooks/pre-commit`
   to the project's real commands)

Then create the `priority:P0`–`priority:P3` labels described in
`docs/github-operations.md` §11.2.

## Setup

```bash
bash scripts/setup-hooks.sh
npm ci   # only needed for the scripts/project-issue-*.mjs orchestration tools
```

`setup-hooks.sh` sets `git config --local core.hooksPath .githooks`, which
applies to every worktree of the clone.

Required commands: `bash`, `git`, `jq`, and `gh`. Node.js (version in `.nvmrc`)
is needed for the orchestration scripts. Recommended: `shellcheck`. Agent CLIs
(`codex`, `claude`, `grok`, `gemini`) are used as worker or reviewer routes only
after a headless probe verifies them at run time.

## How the workflow fits together

1. **File an Issue** with the `create-issue` skill: one type label, an optional
   `priority:P0..P3` label, and native `Blocked by` dependencies. GitHub
   Projects are not used.
2. **Implement it** with the `issue-implementation` skill. It creates the
   Issue's worktree through `scripts/issue-worktree.sh`, so agents never commit
   on the primary clone.
3. **Review before the PR.** The implementer dispatches one reviewer on a
   different verified agent route
   (`scripts/project-issue-dispatch.mjs --role reviewer`). The verdict
   (`PASS` / `NEEDS_REVISION` / `REJECTED`) is posted as an Issue comment;
   `NEEDS_REVISION` allows one fix pass that is not re-reviewed.
4. **Open the PR and watch CI**, with at most three bounded CI fix cycles.
5. **Hand off** with the `handoff-issue` skill if the session ends or the agent
   changes. Inherited work in progress is preserved, never stashed or reset.
6. **Coordinate several Issues** with the `orchestrate-project-issues` skill:
   it plans from `Blocked by` dependencies, assigns verified routes at run
   time, and releases dependents only after the configured milestone.
7. **Merge and clean up** per `docs/github-operations.md` §9.

## Verification

```bash
shellcheck .githooks/pre-commit scripts/*.sh .claude/hooks/*.sh
bash scripts/test-issue-worktree.sh
npm run test:orchestrator
```

## Documents

- `AGENTS.md` — canonical AI coding instructions
- `docs/README.md` — documentation index and ownership guide
- `skills/README.md` — Agent Skill index and the tools each skill calls
- `docs/github-operations.md` — Issue, branch, worktree, review, and merge workflow
- `docs/development.md` — setup, commands, and orchestration usage
