---
name: create-pr-plan-with-audit-log
description: Plan and carry out non-trivial code refactors or planned code edits through a gated PR-plan workflow and append-only audit log. Use when the work should be clarified, planned, reviewed, implemented, and validated step by step; do not use for incredibly small edits, trivial renames, formatting-only fixes, or explanation-only requests.
---

# Create PR Plan With Audit Log

## Overview

Use this skill for non-trivial code refactors or planned code edits that should go through the repository's staged PR-plan workflow before and during implementation.

Use it when the work benefits from:
- targeted clarification before implementation
- a reviewable staged plan
- explicit `yes`-gated checkpoints
- run-specific audit logging

Do not use this skill for incredibly small edits, typo fixes, trivial renames, formatting-only changes, or requests that only ask for explanation with no edit-planning workflow.

If the user explicitly asks for this workflow or explicitly invokes `$create-pr-plan-with-audit-log`, use it even if the trigger would otherwise be borderline.

## Workflow

1. Gather the minimum repository context needed to understand the requested change.
   - Inspect the task-relevant files directly.
   - Inspect repository instruction files such as `AGENTS.md` when present, plus nearby architecture docs and task-relevant docs when they are materially relevant.
   - Fetch materially relevant documentation with Context7. Do not skip documentation lookup when the plan or implementation touches a real technology, framework, library, standard, file format, metadata/frontmatter contract, authoring spec, platform behavior, or implementation detail.
2. Determine whether the user has already made the equivalents of `$OPTIMALLY_REFACTOR` and `$SUCH_THAT` explicit enough.
   - `OPTIMALLY_REFACTOR`: the artifact(s), file(s), or scope that should be planned/refactored.
   - `SUCH_THAT`: the intended outcome, behavior, or end state.
   - Treat them as explicit enough when the artifact(s), file(s), or scope and the intended outcome are named directly enough to interpret the flow without guessing.
   - If either is omitted or still ambiguous, resolve it before starting the six-step flow.
   - Once the scope and intended outcome are resolved enough to proceed, rely on `references/workflow.md` for the detailed Flow Task 1 clarification branch and the remaining step-by-step workflow contract.
3. If the prompt mentions `optimal`, `optimally`, or a close variant, judge the subject against this built-in rubric while honoring any more specific host-repo rules you find:
   - `Modern best practices`
   - `Actual documentation`
   - `Host-repo intended architecture direction` when materially relevant
   - `Narrowly focused on the task at hand`
   - `Logic`
   - `Comprehensiveness`
   - `Consistency`
   - `Freedom from pure-ceremony`
   - `Freedom from cruft`
4. Open and read `references/workflow.md`.
   - Treat that file as the canonical long-form workflow contract.
   - Use the user-provided or elicited values in place of `$OPTIMALLY_REFACTOR` and `$SUCH_THAT` when interpreting and executing the flow.
   - Read the file for each invocation instead of relying on memory or paraphrasing.
   - Do not create a second competing copy of that long-form workflow in this skill.
5. Execute the workflow from `references/workflow.md` exactly as written once the placeholders are resolved.
   - Let the workflow reference own the detailed task wording, checkpoint asks, and audit-log mechanics.
6. Keep the work narrow and non-ceremonial.
   - Use the built-in optimality rubric above and any more specific host-repo rules you find, judging them from actual evidence.
   - Prefer the minimum file set and process that fully satisfies the request.
   - Do not add helper files, duplicated prompt sources, or adjacent cleanup unless the evidence shows they are necessary.
   - Keep host-repo legacy entrypoint or template edits out of scope by default unless the user explicitly changes scope.
7. During implementation and review tasks, follow the host repo's required validation and code-quality workflow rather than inventing a parallel process.
   - Apply the host repo's required formatting, typechecking, testing, linting, and any available code-quality analysis steps after each completed iteration of code changes.
   - If a required tool is unavailable in the session, state that explicitly instead of silently skipping it.
8. Review trigger quality before considering the skill result complete.
   - This skill should fit meaningful asks such as refactoring a function, planning a staged code change, or preparing a non-trivial refactor before implementation.
   - This skill should not be the default for typo fixes, one-line edits, formatting-only changes, trivial renames, or explanation-only requests.

## Guardrails

- Allow only tightly bounded wording adjustments when they materially improve the workflow and do not change the intended contract, user interaction, or step sequence.
- Keep the skill focused on this single job instead of turning it into a general refactor framework.
- Reject any implementation that creates a second long-form prompt source of truth without necessity.
- Reject any implementation that adds helper files without a concrete deterministic need.
