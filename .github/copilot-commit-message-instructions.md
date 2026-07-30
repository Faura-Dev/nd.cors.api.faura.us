# Commit Message Instructions

Use this file for VS Code Copilot commit message generation.

Goal: produce a single-line Conventional Commits (1.0.0) message.

Format (single line only):
`<type>(<scope>): <description>`

Rules:
- Use exactly one of these types: feat, fix, chore, refactor, docs, test, perf, build, ci, style, revert.
- Scope is mandatory and must be lowercase kebab-case.
- Scope selection:
  - For changes under `domains/resilience_model/<area>/...`, scope is `<area>` normalized to kebab-case
    (examples: `property_snapshot` -> `property-snapshot`, `mitigation_compliance` -> `mitigation-compliance`).
  - Otherwise use the closest top-level folder or concern: infrastructure, tests, docs, config, scripts,
    github, encore, deps, ci, build.
- Description style: imperative present tense, start lowercase, no trailing period, concise action + object.
- Breaking changes: include `!` after scope and summarize the breaking change in the description.
- Length: the entire commit message must be 100 characters or fewer.
- Do not include a body or footers. No blank lines.

Examples:
- `feat(owner): add contact phone validation`
- `fix(property-snapshot): handle missing roof age`
- `chore(ci): pin node version for workflows`
- `refactor(shared)!: rename exposure score inputs`
- `revert(docs): undo migration guide wording`
