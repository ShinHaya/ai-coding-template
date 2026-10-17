# Testing

This document owns the **testing strategy**: what to test, at which layer, and
how aggressively. It is the source of truth for *what* to test; the
[`writing-good-tests`](../skills/writing-good-tests/SKILL.md) skill is the source
of truth for *how* to write a test.

Out of scope here: the manual checklist itself (see
[`manual-test.md`](manual-test.md)) and the canonical command list (see
[`development.md`](development.md)).

## 1. Test Strategy

Tests exist to give confidence that the **risk-carrying behavior** works and
that the **security non-negotiables hold** — not to maximize a coverage number.

<!-- Record, per layer or module, whether it is heavily tested, lightly tested,
or deliberately untested, and why. A reviewer should be able to tell whether a
missing test is an omission or a decision. -->

## 2. Test Types

| Type | Scope | Runs in CI |
| --- | --- | --- |
| Unit | <!-- pure logic, no I/O --> | |
| Integration | <!-- module boundaries, real storage --> | |
| End-to-end | <!-- full user flow --> | |
| Tooling (shell / Node) | Issue worktree lifecycle and Issue orchestration scripts; no agent CLI required | shell: yes |

## 3. Test Environment

<!-- Runtime versions, required services, and how to isolate a test run from
real user state. -->

## 4. Test Data And Fixtures

- Use **fake data only**. Never commit real personal information in fixtures,
  screenshots, tests, or docs.
- Keep fixtures next to the suite that uses them.

## 5. Commands

```bash
# Run the full suite

# Run one test file
```

Repository tooling tests (no agent CLI or network required; fake CLIs and
fixtures stand in for them):

```bash
bash scripts/test-issue-worktree.sh
npm ci && npm run test:orchestrator
```

## 6. Manual Testing

See [`manual-test.md`](manual-test.md). Run the relevant items when a change
affects behavior the automated suite does not cover.

## 7. CI

<!-- Which suites run on pull requests, which run on main, and what is required
to merge. -->

## 8. Strategy Decisions

<!-- Record deliberate testing decisions and what would trigger revisiting them. -->

The state-migration integration tests cover one-time file/directory moves,
no-clobber behavior, concurrent startup, dry-run reads, mode/byte preservation,
symlink refusal, valid cache reuse and rejection of old checkpoint formats.
See [the migration procedure](development.md#tooling-state-name-migration) before
merging into a checkout with active orchestration.

Repository-settings integration tests use fake configuration and local Git
remotes. They cover a non-default trunk, freshness rejection after the remote
advances, invalid configuration/ref/path rejection, and settings read as data
without running quality gates. The worktree lifecycle shell suite also creates
from a configured non-default branch with cached-remote/local fallbacks.
