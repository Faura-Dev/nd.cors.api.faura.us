# Optimality Reference

This file is the canonical detailed definition of optimality for the `determine-optimality` skill.

Use `SKILL.md` for invocation rules, workflow, and output contract.
Use this reference for the full meaning of "optimal" and for the detailed evidence standards required to judge it correctly.

## Canonical Criteria

Treat "optimal" as a strict evaluation against all of the following exact criteria:

- `Modern best practices`
- `Actual documentation`
- `My overall intended arch direction`
- `Narrowly focused on the task at hand`
- `Logic`
- `Comprehensiveness`
- `Consistency`
- `Freedom from pure-ceremony`
- `Freedom from cruft`

## Required Evidence Standards

- Use the user's actual request and the concrete subject being evaluated.
- Inspect the task-relevant repository files directly instead of relying on memory.
- Use Context7 to fetch actual documentation for every materially relevant technology, framework, library, standard, specification, file format, metadata/frontmatter contract, authoring spec, platform behavior, or implementation detail touched by the subject.
- Do not rely on generic best-practice instincts unless they are tied back to the gathered evidence.
- Keep the review scoped to what materially affects the subject under evaluation.

## Architecture Evidence Standard

When architecture, layering, boundaries, orchestration, abstraction placement, or responsibility placement are materially implicated, evaluate using actual repo-local architecture evidence in the following order:

- Repository architecture guidance:
  - `AGENTS.md` defines the current repo-local identity, source-of-truth files, working constraints, and validation expectations.
  - `README.md` defines the current managed surface, safety model, and implemented behavior.
  - `docs/developer-tooling-distribution-technical-design.md` defines the intended implementation shape, architecture boundaries, and staged direction.

Do not force architecture commentary into tasks where architecture is not materially implicated.

## Criterion Guidance

### `Modern best practices`

- Check whether the subject follows current recommended patterns for the relevant technology and context.
- Judge this criterion from concrete evidence gathered for the subject under review, not from generic stylistic preference.

### `Actual documentation`

- Check whether the subject aligns with the documentation gathered through Context7.
- If the task materially touches any documentation-trigger case covered by the required evidence standard above, documentation lookup is required.

### `My overall intended arch direction`

- Check whether the subject aligns with the repository's intended explicit-architecture direction.
- Use the ordered architecture evidence standard from this reference when that direction is materially implicated.
- Focus on boundaries, responsibilities, orchestration, abstraction placement, and dependency direction when relevant.

### `Narrowly focused on the task at hand`

- Check whether the subject stays focused on the actual task rather than drifting into adjacent cleanup, abstraction, or policy.
- More change does not mean more optimality.

### `Logic`

- Check whether conclusions actually follow from the gathered evidence.
- Report contradictions, reasoning gaps, or unsupported conclusions only when they are concrete.

### `Comprehensiveness`

- Check whether the subject covers the material constraints needed for the task at hand.
- Do not confuse comprehensiveness with broadness. Missing key constraints fails this criterion; padding does not satisfy it.

### `Consistency`

- Check whether the subject is internally consistent and consistent with the nearby task-relevant repo guidance and files.
- Only count contradictions that materially affect the subject under review.

### `Freedom from pure-ceremony`

- Check whether process, structure, or abstraction exists to improve the actual outcome rather than to satisfy formality.
- Do not reward extra layers, process, or boilerplate unless the evidence shows they are justified.

### `Freedom from cruft`

- Check whether the subject contains stale, duplicative, misleading, or unnecessary content that does not earn its keep.
- Prefer the minimum content and structure that fully satisfies the task.

## Example Assembly Rules

Use these rules when you need help assembling exhaustive failing examples for a violated criterion.

- Keep examples tied to the scoped subject under review.
- Use only failing examples that are supported by the evidence you actually gathered.
- Prefer short, specific example strings over broad commentary.
- Group examples under the single criterion they most directly violate.
- Do not duplicate the same underlying failure across multiple criteria unless the evidence independently supports both.

## Criterion-Specific Example Prompts

- `Modern best practices`
  - Capture concrete places where the subject materially departs from current recommended patterns for the relevant technology.
- `Actual documentation`
  - Capture concrete places where the subject conflicts with the documentation gathered through Context7.
- `My overall intended arch direction`
  - Capture concrete places where boundaries, responsibilities, or abstraction placement conflict with the repository's explicit architecture guidance.
- `Narrowly focused on the task at hand`
  - Capture concrete scope creep, adjacent cleanup, or unnecessary abstraction that does not improve the actual subject.
- `Logic`
  - Capture concrete reasoning gaps, contradictions, or conclusions that do not follow from the evidence.
- `Comprehensiveness`
  - Capture concrete missing coverage of material constraints or decisions needed to judge the subject correctly.
- `Consistency`
  - Capture concrete contradictions with nearby files, stated behavior, or repo conventions that matter for this task.
- `Freedom from pure-ceremony`
  - Capture concrete process, structure, or abstraction that exists mainly for formality rather than outcome.
- `Freedom from cruft`
  - Capture concrete stale, duplicative, misleading, or unnecessary content that does not earn its keep.

## Exclusion Heuristics

- Do not add examples for criteria that were not actually violated.
- Do not pad example arrays with hypotheticals.
- Do not turn remediation advice into examples.
- Do not convert one vague concern into several repetitive examples.
- Do not let the requirement for complete failing examples turn the response into a broad repo audit.
