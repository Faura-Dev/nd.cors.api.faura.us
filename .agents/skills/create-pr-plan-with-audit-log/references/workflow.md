---
description: Create a PR Plan for a user submitted codebase change.
---
# Resolve the equivalents of `$OPTIMALLY_REFACTOR` and `$SUCH_THAT` before starting the flow.
# `$OPTIMALLY_REFACTOR` is the artifact(s), file(s), or scope that should be planned/refactored.
# `$SUCH_THAT` is the intended outcome, behavior, or end state.
# Treat them as explicit enough when the artifact(s), file(s), or scope and the intended outcome are named directly enough to interpret the flow without guessing.
# If either is omitted or still ambiguous, ask the user for it before starting Flow Task 1.
# Pre-flow resolution of omitted or ambiguous `$OPTIMALLY_REFACTOR` / `$SUCH_THAT` is separate from Flow Task 1.
# If the user already made both explicit enough, use them directly when interpreting the tasks below.
# You must perform each flow task independently and completely before moving on to the subsequent flow task.
# After each flow step respond to the user with your findings at that moment.
# For each PR Plan generation, you must create and maintain one run-specific audit log doc in `pr-plan-docs/`.
# If `pr-plan-docs/` does not exist, create it before starting Flow Task 1.
# The log filename must follow: `YYYYMMDD-HHMM_<slug>.md`.
# `<slug>` must be based on the initial user ask for the PR Plan and should be lowercase and hyphen-separated.
# The log file must start with: a datestamp, a title based on the ask for the PR Plan, and an overview of the initial ask by the user.
# After each flow task is completed, append a new task entry to the same log file.
# Task entries are append-only; do not pre-populate future task entries and do not write entries for tasks not yet completed.
# For each appended task entry include: task number, task-entry timestamp, comprehensive, evidenced, and detailed findings for that task, verbatim user feedback for that task (or `No user feedback received for this task.` when no user feedback was provided in that step), and your comprehensive and detailed analysis of that verbatim user feedback.

Flow (6 steps) (start subsequent tasks following a 'yes' response from the user after each subtask):

<task>The user is asking you to create a detailed and comprehensive PR Plan to 'optimally' refactor $OPTIMALLY_REFACTOR in the most minimal but 'optimal' manner such that $SUCH_THAT. In preparation for that PR Plan creation -> your first task is to do thorough due-diligence to make sure you explicitly understand the user's request within the context of the existing codebase and its architecture. Conduct said due-diligence and then determine which clarification path applies for Flow Task 1. If the request is already explicit enough to plan without guessing, ask exactly 1 lightweight confirmation question. Otherwise, gather a minimum of 3 highest-impact clarifying questions. Every clarification question asked in Task 1 must include relevant examples and a 'layman's version' for explicit question context communication. Once you determine that question list -> respond to the user with <output>the question list, followed by an ask stating "Please answer these questions to best help me understand the 'optimal' PR Plan" and then let me know if I should continue to the next task"</output>. After this task is completed, append the Task 1 entry to the log doc.</task>

<task>Using the user's provided answers to your clarifying questions as additional context -> create a detailed and comprehensive PR Plan to 'optimally' refactor $OPTIMALLY_REFACTOR in the most minimal but 'optimal' manner such that $SUCH_THAT. Afterward respond to the user with <output>the current plan, followed by an ask stating "Should I pursue the plan?"</output>. After this task is completed, append the Task 2 entry to the log doc.</task>

<task>Take a deeper look at the PR Plan and the task it outlines and analyze the codebase to flush out the the PR Plan with sub tasks adding more context and detailed instruction to the PR Plan. As you assemble the sub-tasks, if you determine a high level task is actually not 'optimal' refactor the PR Plan accordingly and then proceed. Afterward respond to the user with <output>The detailed plan, followed by an ask stating "Should I review the plan?"</output>. After this task is completed, append the Task 3 entry to the log doc.</task>

<task>Remove all bias and thoughtfully review the approved detailed PR Plan, my codebase, and my initial ask for the plan to assess if it is 'optimal'. Pay specific attention to if the implementation both adheres to my overall intended arch direction (be cautious to introduce any novel patterns). Also ensure the implementation is free of pure ceremony! If things are deemed non-‘optimal’: make any needed updates to the PR Plan, else approve it.<output>The reviewed plan (with a diff of changes), followed by an ask stating "Should I implement the plan?"</output>. After this task is completed, append the Task 4 entry to the log doc.</task>

<task>Thoughtfully and ‘optimally’ implement said plan into my codebase.<output>A success message after the plan is completely and 'optimally' implemented followed by an ask stating "Should I review the implementation?"</output>. After this task is completed, append the Task 5 entry to the log doc.</task>

<task>Truly remove all bias and review the implementation, my initial ask, my answers to the clarifying questions, my codebase, and the approved PR Plan to make sure the implementation was explicitly and defensibly 'optimal' for my needs. Pay specific attention to if the implementation both adheres to my overall intended arch direction. Also ensure that it is free of pure ceremony! Respond to the user with <output>feedback on if the implementation was 'optimal' for my needs.</output>. After this task is completed, append the Task 6 entry to the log doc.</task>
