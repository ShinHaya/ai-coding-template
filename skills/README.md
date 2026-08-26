# Skills

Agent Skills shared by every AI coding agent used in this repository. Each
directory holds a `SKILL.md` (the instruction body) and, where the Codex CLI
needs an explicit interface, an `agents/openai.yaml`.

## Workflow skills

| Skill | Use when |
| --- | --- |
| [`create-issue`](create-issue/SKILL.md) | Filing or standardizing an Issue, including its bounded `project-metadata` block |
| [`issue-implementation`](issue-implementation/SKILL.md) | Implementing exactly one Issue end to end: worktree gate, commit, local AI review, PR |
| [`handoff-issue`](handoff-issue/SKILL.md) | Resuming an existing Issue worktree after a session limit, interruption, or agent change |

## Documentation review skills

These are wired into the local AI review hook through
`LOCAL_AI_REVIEW_DOC_UNITS` in `.githooks/config`: the hook feeds the skill's
`SKILL.md` to the reviewer as the prompt for that documentation unit.

| Skill | Review target |
| --- | --- |
| [`requirements-review`](requirements-review/SKILL.md) | `docs/requirements.md` diffs |
| [`architecture-review`](architecture-review/SKILL.md) | `docs/architecture.md` |
| [`design-doc-review`](design-doc-review/SKILL.md) | `docs/design/*.md` implementation-session design docs |

Each review skill's criteria are mirrored in `docs/development.md` §9 so a
human reader sees the same standard. When one changes, change the other in the
same commit.

## Craft skills

| Skill | Use when |
| --- | --- |
| [`writing-good-tests`](writing-good-tests/SKILL.md) | Writing or reviewing tests |

## Adding a skill

Keep `SKILL.md` self-contained and free of project-specific product detail that
belongs in `docs/`. A skill that a user should be able to invoke directly needs
`user-invocable: true` in its frontmatter.
