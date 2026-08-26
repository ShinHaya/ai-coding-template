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

<!-- Add project-specific checklist items. -->
