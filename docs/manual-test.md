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

- [ ] Stopping a worker with the §12.5 procedure stops only the owned process group, and `.worktrees/issue-*` WIP is intact (fake-data run only)
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

### Runtime environment configuration

- With fake data, allow a required variable for one runtime and confirm its CLI
  can start; remove it and confirm `runtime-env-required-missing` before spawn.
- For a real CLI using HOME login or a corporate proxy/CA, configure only the
  necessary variable names locally and check catalog, probe, worker and usage.
  Record outcomes only, never values or raw CLI output.
- Restart any externally managed server with the chosen environment policy;
  do not infer isolation of its tools from this wrapper's checks.
