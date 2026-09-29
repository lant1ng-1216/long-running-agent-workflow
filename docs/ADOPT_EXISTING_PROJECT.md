# Adopt an existing project

This workflow can join an active codebase; it does not require a greenfield start.

1. Ask the coding agent to inspect the repository read-only first: current product behavior, architecture, tests, uncommitted changes, known defects, and the last reliable handoff.
2. Separate observed facts from assumptions. Do not treat old TODOs, a failing test, or the previous agent's summary as owner approval.
3. Draft a short current-state report and list unfinished work. Mark which work is already done, which is incomplete, and which cannot be verified.
4. Propose the remaining phase plan, acceptance criteria, dependencies, checks, and safety boundaries. Have the project owner confirm the plan once.
5. Configure the first phase as the next unfinished approved phase. Do not retroactively record earlier phases as passed.
6. Continue using the normal phase loop. Keep pre-existing changes intact and avoid modifying unrelated files.

If there is no trustworthy plan or handoff, reconstruct one before editing. If reconstruction finds a genuine owner-only decision or authorization boundary, pause with that specific question; otherwise continue with safe investigation and implementation.
