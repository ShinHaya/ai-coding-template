# Manual Test Checklist

Manual checks for behavior the automated suite does not cover. The testing
strategy lives in [`testing.md`](testing.md).

**Use fake data only.** Never enter real personal information, real
credentials, or real payment details while running this checklist.

## How to use this document

- Run the sections a change actually affects, not the whole list every time.
- Record the build / commit under test and the result of each item in the PR or
  Issue.
- A failed item is a release blocker until it is either fixed or explicitly
  accepted by the Product Owner with a recorded reason.

## 0. Pre-check (once per build)

- [ ] Build completes from a clean checkout
- [ ] Quality gates in [`development.md`](development.md) §8 pass
- [ ] `bash scripts/setup-hooks.sh` reports the hooks installed

## 1. Install / first run

Borrowed PC or undecided repository: see
[`development.md`](development.md) §12. Record results outside Git.

- [ ] `gh auth status` shows the intended identity
- [ ] `gh repo view` target matches `GITHUB_REPOSITORY` (or it is unset)
- [ ] Existing agent files, hooks and CI were inspected and left unchanged
- [ ] Posting permission recorded; if absent, no Issue/push/PR was made
- [ ] Fake-data rehearsal: worktree create, reviewer on another route, gates

## 2. Core flow

<!-- The primary user flow, step by step, with the expected result for each
step. -->

## 3. Failure and interruption paths

- [ ] After stopping a worker, `.worktrees/issue-*` WIP is intact
- [ ] `handoff` resumes it from a new session without a duplicate worktree
- [ ] After login expiry or quota exhaustion, work resumes via `handoff-issue`
- [ ] On leaving, local worktrees, `state/` and CLI logins were reviewed

## 4. Privacy and security spot checks

- [ ] No sensitive value appears in logs
- [ ] No unexpected network destination is contacted
- [ ] Local state files have the intended permission bits

## 5. Known limitations

<!-- Behavior that is known-imperfect in this build, so a tester does not file
it repeatedly. -->
