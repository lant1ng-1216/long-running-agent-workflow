# Configuration

The toolkit reads `workflow.config.json` from the target project root. Run `agent-workflow init` once to copy the example configuration; it refuses to overwrite an existing file.

## Project and phases

```json
{
  "schemaVersion": 1,
  "projectName": "Example project",
  "phases": [
    {
      "id": "phase-1",
      "objective": "Deliver one approved, coherent slice",
      "acceptanceCriteria": ["The behavior is implemented and verified"],
      "checks": ["typecheck", "test"]
    }
  ]
}
```

- `projectName` is a non-empty label used in status output.
- `phases` are ordered. Each phase needs a unique ID, an objective, at least one acceptance criterion, and at least one check.
- `acceptanceCriteria` are the phase contract. Keep them observable and copy them unchanged into the Agent self-review; do not weaken them to make a gate pass.
- `checks` are names of scripts already declared in the target project's `package.json`. The CLI invokes them as `npm run <name>`; configuration does not accept arbitrary shell strings.
- `deferredItems` and `blockedItems` record known work and blockers. `externalWriteRequested` and `highRiskActionRequested` make the gate pause at those boundaries.

## Local records

Optional `storage` paths configure the phase state, JSONL review log, and per-phase self-review directory. Paths must be relative to the project and may not contain `..`. Defaults are:

```json
{
  "storage": {
    "phaseStatePath": ".agent-workflow/phase-state.json",
    "reviewLogPath": ".agent-workflow/reviews.jsonl",
    "phaseReviewsDir": ".agent-workflow/phase-reviews"
  }
}
```

Keep these records in the project where they help resume work; inspect them before sharing because they may contain project-specific notes.

## Reviewer credentials

Copy `.env.example` to `.env` and provide your own `JEV_AGENT_KEY`, or configure `AI_GATEWAY_API_KEY` for the supported AI Gateway integration. `.env` is ignored by Git. The toolkit does not supply or proxy a maintainer credential. Without a working reviewer connection the gate pauses; a deterministic baseline result is not an independent Jev approval.

For installation and the full workflow, see [Quickstart](QUICKSTART.md). For failed reviews, see [Repair or stop](REPAIR_OR_STOP.md).
