# Security

This document owns **security and privacy decisions**: threat model, sensitive
data handling, encryption, external-service policy, and the checklist applied
before release. Requirement-level statements live in
[`requirements.md`](requirements.md) §8; dependency / supply-chain handling lives
in [`dependency-security.md`](dependency-security.md).

## 1. Security Principles

<!-- The rules that are not up for negotiation in a code review. Each should be
concrete enough to check. -->

- Do not commit secrets, local state, or real personal data.
- Do not log decrypted values or secrets.
- Do not add network egress beyond the documented targets.
- Do not add telemetry, analytics, or crash reporting.

## 2. Threat Model

<!-- Who the adversary is, what they can reach, and what would count as a
compromise. State explicitly what is out of the model. -->

## 3. Sensitive Data Handling

<!-- Which data is sensitive, at what level, and what each level permits:
storage form, display, logging, and whether it may be sent to an AI provider. -->

## 4. Encryption

<!-- Algorithms, key derivation, key lifetime, and where the derived key is
allowed to exist. -->

## 5. AI Provider Disclosure Policy

<!-- What may be sent to an AI model, what must never be, and whether provider
stateful features (prompt caching, stored threads, memory) are permitted. -->

## 6. Network And External Services

<!-- Every allowed egress target and why it is allowed. -->

### Read-only cloud observation

A repository that deploys to a cloud provider investigates a failed deploy
with a keyless read-only identity. Operators impersonate it and receive a
short-lived token. The identity must not read secret values, datastore
documents, analytics rows, storage objects, or data-access audit logs. Do not
grant a role that includes those reads. On GCP,
`roles/iam.securityReviewer` is one such role. Do not create a
service-account key. Do not write tokens, secret values, or cloud logs to CI
logs or the repository. The operator's own credentials remain on the machine,
so write commands still require approval.

This template has no cloud project. The procedure is
[`cloud-observer.md`](../skills/issue-implementation/references/cloud-observer.md)
and the `Deploy failure diagnosis` section of
[`development.md`](development.md).

### Worker execution permissions

Orchestrated workers run AI agent CLIs on the operator's own machine. The
template distinguishes three levels and does not present one as another:

- **Prompt-level rules** (for example "do not modify anything" in a reviewer
  prompt) are instructions, not enforcement.
- **CLI-enforced profiles** (`enforcement: cli`) make the agent CLI refuse
  file-edit tools and commands outside an allow list. They do not isolate the
  machine: an allowed command runs with the user's own file and credential
  access, and allowed commands such as `gh ... comment`, `git push` or
  `issue-worktree.sh` write or post by themselves.
- **OS-level isolation** is not implemented. An Issue worktree is not a sandbox.
  Only Codex `read-only` uses the CLI's OS sandbox.

Bypass profiles are never a default and need an explicit repository-config
opt-in per runtime. `inherited` profiles leave the decision to the user's CLI
settings, and `requireEnforcement` can exclude them. A probe whose tool calls
are denied fails (`permission-denied`), and an approval wait in a probe or a
worker run hits the timeout. A dispatched worker run does not check its own
output for denials: a CLI can refuse a tool call and still exit 0, so a denied
write is caught only downstream (quality gates, PR checks, the milestone gate).
The template never retries with looser permissions. Workers can still read project settings such as
`.claude/settings.json`, and a `workspace-write` implementer can edit them;
review such changes in the PR. Details: `development.md`, "Worker permissions".

## 7. Input And DOM Safety

<!-- How externally-supplied data is validated and escaped at each boundary. -->

## 8. Dependency And Supply Chain

See [`dependency-security.md`](dependency-security.md) for the two-layer
detection and triage process (Dependabot + CI audit gate).

## 9. Security Checklist

Run before a release, and whenever a change touches an item above:

- [ ] No secrets, credentials, or real personal data in the diff
- [ ] No decrypted values or secrets in logs
- [ ] No new network egress targets
- [ ] No new telemetry, analytics, or crash reporting
- [ ] Dependency audit gate green, or every finding triaged and recorded
- [ ] Permission bits on state files and directories are as intended
- [ ] Cloud investigation uses the read-only observer; no service-account key
      files; CI does not print cloud logs or tokens

<!-- Add project-specific checklist items. -->
