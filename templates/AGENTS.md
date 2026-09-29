# Long-running project workflow

Use this contract only after the project owner has approved the objective, scope, phase plan, and safety boundaries. It can guide a new project from an approved brief/PRD or help continue an existing project after its current state has been reconstructed and confirmed.

## Establish the source of truth first

- For a new project, collaborate with the owner to turn the idea into a brief/PRD, preserve confirmed decisions and unresolved choices, then propose a phased plan. Do not treat assumptions as approval.
- For an existing project, reconstruct its current state read-only first, then propose the remaining phases. Never claim earlier work passed retroactively.
- Ask the owner to approve the objective, phase plan, acceptance criteria, and safety boundaries before implementation. Once approved, routine transitions inside that scope do not require another approval.

## Work one phase at a time

1. Read the approved brief, `workflow.config.json`, the project plan, and the current phase record before changing code.
2. Implement the whole current phase against its acceptance criteria. Do not replace a requirement with a smaller implementation and call it complete.
3. Review the changed work against every acceptance criterion, run the real checks listed for that phase, and inspect the resulting output.
4. Before the gate, write `.agent-workflow/phase-reviews/<phase-id>.json` using `.agent-workflow/PHASE_REVIEW.example.json`. Copy every approved criterion exactly once and mark it `pass`, `fail`, or `unverified` with concrete evidence. A missing, failed, or unverified criterion must not advance.
5. Run `agent-workflow gate --phase <current-phase-id>` and read the newest `.agent-workflow/reviews.jsonl` entry.
6. If the gate advances, continue automatically to the next phase in the already approved plan. Do not ask the owner to re-approve routine phase transitions.

## When a gate pauses

- A failed check or a concrete, in-scope implementation finding is a repair task: identify the exact criterion, fix it, rerun the relevant checks, then review again.
- If Jev returns low confidence or is unavailable, do not lower the threshold, force an advance, or resend identical evidence. Compare the approved criteria with the implementation, gather missing safe evidence, and perform one focused re-review after the evidence changes.
- Keep a short repair note with the criterion, finding, change, and retest result. After three focused repair/review cycles without progress, stop and report the remaining concrete blocker; do not loop indefinitely.
- Ask the owner only for a real product choice, a changed scope, missing owner-only information, an external prerequisite, a safety boundary, or an exhausted no-progress loop.
- A `blocked` item, external write, or high-risk action is not permission to perform it. Stop before that action and ask for explicit authorization.

The gate is a review and state-recording tool. It does not edit code, sign transactions, publish, deploy, push Git changes, or control the coding agent. An `advance` is permission to continue only within the owner's prior approval.

## Records

Keep phase state and reviewer records under `.agent-workflow/`. Do not include API keys, wallet data, personal data, private logs, or unrelated source files in reviewer evidence. Treat check names and exit codes as evidence of those checks only—not as proof of subjective visual quality or product completeness.
