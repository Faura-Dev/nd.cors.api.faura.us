---
name: determine-optimality
description: Evaluate whether a subject is truly optimal under this repo's optimality rubric. Use every time "optimal", "optimally", or a close variant is mentioned in a prompt or materially affects the task.
---

# Determine Optimality

## Overview

Determine whether the subject under review is truly optimal.

Use this skill every time `optimal`, `optimally`, or a close variant is mentioned in a prompt or materially affects the task.

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

Stay focused on the actual subject being judged, use the highest-quality *and* most applicable evidence needed to reach your defensible conclusion, and avoid turning the response into a generic repo audit.

`SKILL.md` defines this skill's invocation rules, workflow, and output contract. `references/optimal.md` is the canonical detailed definition of optimality and the detailed evidence standard for applying it correctly.

## Workflow

1. Run the script with `node .agents/skills/determine-optimality/scripts/log-skill-invocation.cjs`.
2. Identify the exact subject being evaluated.
   - Decide whether the subject is code, a plan, docs, architecture guidance, a prompt, or some other concrete artifact.
   - Do not evaluate adjacent work unless it materially affects the subject.
3. Gather the minimum relevant repository evidence before judging.
   - Use `references/optimal.md` as the primary detailed definition of optimality.
   - Inspect the task-relevant files directly instead of relying on memory.
   - Use actual repo-local architecture evidence when architecture is materially implicated, especially `AGENTS.md`, `README.md`, and `docs/developer-tooling-distribution-technical-design.md` when they apply.
4. Fetch actual documentation for every materially relevant technology using Context7.
   - Resolve the exact library, framework, standard, or specification involved.
   - Query only for the documentation needed to evaluate the subject at hand.
   - Do not skip documentation lookup when the task touches a real technology, library, framework, standard, file format, metadata/frontmatter contract, authoring spec, platform behavior, or implementation detail.
5. Evaluate the subject against each optimality criterion explicitly.
   - Check whether the subject follows modern best practices for the relevant technology and context.
   - Check whether the subject aligns with actual documentation gathered through Context7.
   - Check whether the subject aligns with the repository's intended explicit-architecture direction when architecture is relevant.
   - When architecture is materially implicated, use all of the architecture sources required by `references/optimal.md`, not a subset.
   - Check whether the subject is narrowly focused, logical, comprehensive enough for the task, internally consistent, free from pure ceremony, and free from cruft.
6. Build the response from the actual violations only.
   - Report a criterion only when the gathered evidence shows a real violation.
   - For each violated criterion, collect all failing examples found within the scoped subject and reviewed evidence.
   - Keep examples evidence-backed, concrete, and non-hypothetical.
   - Do not add "good" examples, remediation advice, or neighboring concerns unless the user explicitly asks for them.
7. Reject low-signal criticism.
   - Do not report speculative concerns without evidence.
   - Do not force architecture commentary into tasks where architecture is not materially implicated.
   - Do not recommend extra abstractions, layers, process, or boilerplate unless they are justified by the task, the codebase, and the documented architecture.

## Scope And Evidence

Only inspect the technologies, files, and architectural concerns that materially affect the subject under review.

Use evidence from:
- the user's actual request
- the subject being evaluated
- the relevant repository files
- the relevant architecture guidance when architecture is materially implicated
- the relevant Context7 documentation

Do not rely on generic instincts, stale memory, or broad best-practice commentary without tying it back to evidence.

Treat "all failing examples" as exhaustive within the scoped subject and the evidence you actually inspected. Do not pad the response with hypotheticals or unrelated examples just to make the array longer.

## Output Contract

If no optimality criteria are violated, respond with:

```json
[]
```

If one or more optimality criteria are violated, respond with a JSON object that contains a required `violations` array:

```json
{
  "violations": [
    {
      "criterion": "Logic",
      "examples": [
        "Claims the implementation is inconsistent without citing any contradictory files or behavior.",
        "Recommends adding a facade even though the task does not involve cross-AR orchestration."
      ]
    }
  ]
}
```

Each violation object must include:
- `criterion`: one of these exact strings only:
  - `Modern best practices`
  - `Actual documentation`
  - `My overall intended arch direction`
  - `Narrowly focused on the task at hand`
  - `Logic`
  - `Comprehensiveness`
  - `Consistency`
  - `Freedom from pure-ceremony`
  - `Freedom from cruft`
- `examples`: an array of evidence-backed failing example strings for that criterion

Only include criteria that were actually violated.
Only include failing examples that were actually found.
Include all failing examples found for each violated criterion within the scoped review.
Do not return a top-level string array for non-optimal results.

Every reported violation must be defensible from the gathered evidence, even when the response itself is compact.

## Guardrails

Prefer the minimal change or judgment that fully satisfies the defined standard of optimality.

Do not equate more process, more abstraction, or more structure with better quality.

Do not duplicate large portions of `AGENTS.md` or architecture documents in the response when a concise evidence-backed judgment will do.
Do not let the requirement for complete failing examples turn the response into a broad repo audit; stay tightly scoped to the subject under review.
