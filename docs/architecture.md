# Architecture

This document owns the **canonical target architecture and technology
selection**. Product requirements live in [`requirements.md`](requirements.md);
security decisions live in [`security.md`](security.md).

Changes here are reviewed against the criteria in
[`development.md`](development.md) §9.4, applied automatically by the local AI
review hook through `skills/architecture-review/SKILL.md`.

## 1. Context and Constraints

<!-- The system's shape: who uses it, how it is deployed, and what the
requirements' non-negotiables (requirements.md §8) demand of the architecture.
State the shape explicitly — a reviewer needs it to know which classic concerns
apply and which are "not applicable". -->

## 2. Technology Selection

<!-- Language, runtime, package manager, main framework, build tooling, storage,
and test runner. For each significant choice, record what it was chosen over and
why (see §7). -->

## 3. Process and Trust Boundaries

<!-- Which code runs in which process / privilege level, what crosses each
boundary, and in what form. Make it decidable where sensitive data may exist
(encrypted at rest / in memory / in transit) and what every egress point is. -->

## 4. Module Decomposition

<!-- The modules, their responsibilities, and the direction of their
dependencies. Keep responsibilities narrow enough that a module's access to
sensitive data matches its job. -->

## 5. Data Model

<!-- The persisted entities, their relationships, and the schema versioning /
migration story. -->

## 6. Failure Modes and Data Integrity

<!-- Crash, abrupt termination, out-of-space, and interrupted-write behavior for
the source of truth: atomic writes, versioned schema, detectable-not-silent
corruption, and how a failure is diagnosed with the observability this project
permits. -->

## 7. Decision Records

<!-- For each significant decision: context, alternatives considered,
rationale, and what would trigger reconsideration. ADR-style, whether or not in
separate ADR files. -->

## 8. Security Mapping

<!-- How each non-negotiable requirement in requirements.md §8 is satisfied by a
specific architectural element. -->
