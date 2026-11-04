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

### Borrowed machines and undecided repositories

Do not post company Issue content to personal or public repositories, and do
not send company data to a model provider the company has not allowed.
Real-model probes send prompts externally and consume quota; run them with
fake data only. Check `GITHUB_REPOSITORY` against `gh repo view` before any
Issue or PR is created. Never auto-delete credentials or unmerged work when
leaving. Procedure: [`development.md`](development.md) §12.

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

## Runtime environment boundary

AI runtime children receive OS basics and exact per-runtime environment opt-ins
(see development.md, Runtime child environments). Unrelated parent credentials,
TypeSafe credentials and parent worktree leases are excluded. Required settings
fail before spawn, with closed reasons and no environment values in diagnostics.
Allowing a name explicitly trusts that runtime with its value, including proxy
credentials. Environment objects are never added to orchestration state.

This is an environment inheritance boundary, not a sandbox: HOME authentication
files, PATH executables, runtime configuration files, existing external servers
and independently launched tools remain outside its protection. It neither
rotates credentials nor guarantees that a malicious CLI cannot disclose an
explicitly allowed value. Vendor authentication names have no default allowlist.
