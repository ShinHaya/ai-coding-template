# Development

This document owns **local setup, commands, conventions, quality gates, and
review criteria**. GitHub workflow rules live in
[`github-operations.md`](github-operations.md); the local AI review hook lives in
[`local-ai-review.md`](local-ai-review.md).

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
- `gh` (GitHub CLI) — required by `scripts/issue-worktree.sh`
- `jq` — required by the local AI review hook
- `shellcheck` (recommended) — hook script linting
- At least one reviewer CLI: `claude`, `codex`, `grok`, or `agy`

<!-- Add the project's language runtime and package manager. -->

### 2.2 Initial Setup

```bash
# Install dependencies

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
├── .agents/       # Gemini / Antigravity subagent definitions
├── .claude/       # Claude Code subagent definitions
├── .githooks/     # local AI review hook, config, and reviewer prompts
├── .github/       # Issue templates, workflows, Dependabot config
├── docs/          # documentation (see docs/README.md)
├── scripts/       # worktree lifecycle, hook setup, review helpers
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

This mirrors the local AI review's code-review prompts
(`.githooks/prompts/local-review-*.md`); keep them in sync if any change.

### 9.2 Requirements Review

Requirements review targets diffs to [`requirements.md`](requirements.md) and
checks, in priority order:

1. **unambiguous** — each changed statement allows exactly one interpretation
   (no vague qualifiers, undefined terms, or inconsistent naming)
2. **verifiable** — fulfillment can be objectively checked by test, inspection,
   or measurement
3. **consistent** — no contradiction with the rest of `requirements.md` or the
   product principles in `AGENTS.md`
4. **failure paths specified** — errors, external blockers, cancellation, and
   partial completion are stated, not just the happy path
5. **scope explicit** — out-of-scope items and unstated assumptions are surfaced

The criteria derive from ISO/IEC/IEEE 29148 requirement quality characteristics,
prioritized by defect impact. They mirror
[`../skills/requirements-review/SKILL.md`](../skills/requirements-review/SKILL.md);
keep the two in sync if either changes. The local AI review hook applies the
skill automatically to commits touching `docs/requirements.md` (see
[`local-ai-review.md`](local-ai-review.md) §5).

### 9.3 Design Doc Review

Design doc review targets `docs/design/*.md` implementation-session design docs
and checks, in priority order:

1. **traceability** — design elements map to requirements / Issue acceptance
   criteria, with no orphan elements and no uncovered requirements
2. **contracts and responsibilities** — component responsibilities, API /
   interface contracts, and the data model are implementable without guessing
3. **failure handling and state transitions** — error paths, interruption /
   resume, and state transitions are designed, not just the happy path
4. **alternatives considered** — rejected options and the rationale for the
   chosen approach are recorded
5. **test strategy** — how the design's behavior will be verified is stated

The criteria mirror
[`../skills/design-doc-review/SKILL.md`](../skills/design-doc-review/SKILL.md).

### 9.4 Architecture Review

Architecture review targets [`architecture.md`](architecture.md) and checks, in
priority order, judged against this project's actual context (deployment shape,
user count, operating environment):

1. **requirements and constraint fit** — choices satisfy the non-negotiables
   (`requirements.md` §8) and prioritized quality attributes, with trade-off
   points explicit
2. **system boundaries and data flow** — trust boundaries, where sensitive data
   may exist in what form, and every egress point
3. **dependencies** — justified, maintained, license-compatible, security
   surface understood, stack within the doc's own decisions
4. **failure modes and data integrity** — durability under crash / interruption,
   schema versioning / migration, diagnosability
5. **decision records** — significant decisions captured ADR-style with
   alternatives, rationale, and reconsideration triggers

A criterion that genuinely does not apply is answered "not applicable" with a
reason — that is a passing answer, not a gap. The criteria mirror
[`../skills/architecture-review/SKILL.md`](../skills/architecture-review/SKILL.md).

### 9.5 Local AI Review

See [`local-ai-review.md`](local-ai-review.md) for the hook that applies §9.1–§9.4
automatically on commit.

## 10. Issue Implementation

Use the [`issue-implementation`](../skills/issue-implementation/SKILL.md) skill
for a single Issue, and [`handoff-issue`](../skills/handoff-issue/SKILL.md) to
resume one. Both defer the worktree rules to
[`github-operations.md`](github-operations.md) §2.

## 11. Operational Notes

<!-- Document local state, migrations, generated files, and manual setup. -->

- `state/` holds local-only state (AI review artifacts, runtime config copies)
  and is git-ignored.
- `.worktrees/` holds per-Issue agent worktrees and is git-ignored.
