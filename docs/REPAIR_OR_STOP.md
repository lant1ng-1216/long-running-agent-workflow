# Repair, re-review, or stop

The workflow should keep a repairable phase moving without turning a failed review into a pass. The active coding agent performs the diagnosis and code changes; the CLI and Jev do not edit the project.

## Route the result

| Evidence / decision | What the coding agent does next |
|---|---|
| A configured check failed | Inspect the failure, repair within the approved phase, rerun the affected check, update the criterion evidence, and run the gate again. |
| A criterion is `fail` or `unverified` | Identify the exact unmet criterion. Implement or verify it; do not mark it passed without evidence. |
| Jev confidence is below threshold | Do not treat the score alone as proof of a code defect. Inspect the lowest-confidence decision dimension and the evidence Jev received; gather missing evidence or clarify the phase record, then submit a focused re-review with changed evidence. |
| Jev and the deterministic baseline disagree | Inspect the disagreement and the evidence. Repair a concrete issue or improve the evidence before re-review; do not override the gate manually. |
| Jev is unavailable | Keep the phase paused. Check local configuration/connection safely; do not interpret baseline-only output as Jev approval. |
| The result requires owner judgment or crosses a reserved boundary | Pause and state the exact decision or authorization needed. Do not guess or perform the action. |

## Repair loop

1. Read the latest `.agent-workflow/reviews.jsonl` record and map every failed or uncertain result to an approved criterion.
2. Decide whether the gap is an implementation defect, missing verification, ambiguous evidence, a real owner decision, or a safety/external prerequisite.
3. For a safe in-scope defect, repair it and run the relevant real checks. For an evidence gap, add concrete evidence from the existing implementation and checks; do not resubmit unchanged evidence.
4. Update `.agent-workflow/phase-reviews/<phase-id>.json` with the actual result, changed files, and criterion-level evidence.
5. Re-run the same phase gate. The phase remains current until the gate records `advance`.
6. If the gate advances, continue to the next already approved phase without routine owner confirmation.

After three focused repair/review cycles with no meaningful progress, stop and report the concrete unresolved cause and the evidence examined. This is a no-progress bound, not permission to stop at the first low score. The owner should be involved only for an owner-only decision, changed scope, authorization/safety boundary, missing external prerequisite, or exhausted no-progress loop.

The test suite simulates failed-check repair and low-confidence evidence re-review to verify that a paused phase can be retried and only advances after a later passing gate. It does not run a real LLM coding agent through source edits; that behavior is performed by the connected agent following `templates/AGENTS.md`.
