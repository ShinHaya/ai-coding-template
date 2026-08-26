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
| Smoke (shell) | Hook and script behavior, no reviewer CLI | yes |

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

Repository tooling smoke tests (no reviewer CLI required):

```bash
bash scripts/test-issue-worktree.sh
bash scripts/smoke-local-ai-review-branch-mapping.sh
bash scripts/smoke-local-ai-review-issue-epoch.sh
bash scripts/smoke-local-ai-review-doc-units.sh
bash scripts/smoke-local-ai-review-cli-stdin.sh
bash scripts/smoke-wait-for-local-ai-review.sh
```

These launch background processes; redirect their output rather than running
them attached to a pipe, or the shell will appear to hang after the test has
already passed.

## 6. Manual Testing

See [`manual-test.md`](manual-test.md). Run the relevant items when a change
affects behavior the automated suite does not cover.

## 7. CI

<!-- Which suites run on pull requests, which run on main, and what is required
to merge. -->

## 8. Strategy Decisions

<!-- Record deliberate testing decisions and what would trigger revisiting them. -->
