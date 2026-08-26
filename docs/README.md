# Documentation Guide

This directory contains development-facing documentation. Keep this file a short
index: put detailed decisions in the document that owns the relevant topic.

## Document Responsibilities

| Document | Responsibility |
| --- | --- |
| [`requirements.md`](requirements.md) | **Canonical product direction**: reason for being, success definition, scope, milestone order, non-negotiable requirements (§8). |
| [`architecture.md`](architecture.md) | **Canonical target architecture / technology selection**: process and trust boundaries, module decomposition, data model, security mapping, decision records. |
| [`security.md`](security.md) | Security and privacy review notes, threat model, sensitive-data handling, encryption, and external-service policy. |
| [`dependency-security.md`](dependency-security.md) | Dependency / supply-chain vulnerability detection and triage (Dependabot + CI audit gate). |
| [`development.md`](development.md) | Local setup, commands, project structure, implementation conventions, quality gates, and review criteria (§9). |
| [`testing.md`](testing.md) | Testing strategy: what to test, at which layer, with which commands. |
| [`manual-test.md`](manual-test.md) | Manual test checklist. |
| [`github-operations.md`](github-operations.md) | Issue, branch, worktree, label/priority, commit, pull request, review, and merge workflow rules. §3 also owns the design-doc policy. |
| [`local-ai-review.md`](local-ai-review.md) | Local AI review hook setup, behavior, review units, budget, outputs, and troubleshooting. |
| `design/*.md` | Per-Issue detailed design docs produced by Plan mode at the start of implementation (see [`github-operations.md`](github-operations.md) §3). Session-scoped: read only the doc for the Issue being implemented. |

## Primary Sources

- Product behavior belongs in [`requirements.md`](requirements.md).
- Target architecture and technology selection belong in
  [`architecture.md`](architecture.md).
- Security decisions belong in [`security.md`](security.md).
- Agent operating rules belong in `../AGENTS.md` (canonical), `../CLAUDE.md`, and
  `../GEMINI.md`.
- Agent Skills belong in `../skills/` (see [`../skills/README.md`](../skills/README.md)).
- Issue templates belong in `../.github/ISSUE_TEMPLATE/`, including
  `../.github/ISSUE_TEMPLATE/implementation-plan.md`.

## Update Notes

When behavior, commands, architecture, or security assumptions change, update
the owning document instead of adding duplicate notes elsewhere.

Do not describe future commands, tools, or quality gates as available until the
repository actually contains the required files and scripts.
