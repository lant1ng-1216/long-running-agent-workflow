# Quickstart

This is a local command-line workflow. It does not run as a background service and does not replace the coding agent. The agent implements the approved phase; the CLI runs named checks, asks the configured reviewer, and records the gate result.

## 1. Set up the toolkit

Use Node.js 22 or newer. The current Jev SDK dependency requires Node 22; the package metadata and lockfile both declare that minimum.

From a clone of this repository:

```bash
npm install
npm run build
```

Until a public package release exists, keep the toolkit clone available locally. If it is at `../Long-Running-Agent-Workflow`, call the built CLI directly from your target project:

```bash
cd /path/to/your-project
node ../Long-Running-Agent-Workflow/dist/bin/agent-workflow.js init
```

Alternatively, install that local folder as a development dependency and invoke its `agent-workflow` binary through `npx`.

## 2. Establish the approved plan

For a new idea, work with the owner to capture the approved requirements in `templates/PROJECT_BRIEF.md`, then turn that brief into a phase plan using `templates/PROJECT_PLAN.md`. For an existing project, follow [Adopt an existing project](ADOPT_EXISTING_PROJECT.md) and configure only the remaining approved phases. See [Project intake](PROJECT_INTAKE.md) for the full handoff from discussion to implementation.

The owner approves the scope, phase order, acceptance criteria, and safety boundaries once. Do not start implementation with unresolved product decisions that materially affect the outcome.

## 3. Configure the project

Edit `workflow.config.json` to reflect the approved brief or the confirmed state of the in-progress project. Define the phase order, one objective per phase, acceptance criteria, and names of existing npm scripts to run. Do not put arbitrary shell commands in this file.

Copy `.env.example` to `.env` and set your own `JEV_AGENT_KEY`. `.env` is ignored by Git. Alternatively, configure `AI_GATEWAY_API_KEY` if using the supported AI Gateway route. Never commit either key.

Copy the toolkit's `templates/AGENTS.md` into the target repository's `AGENTS.md` (or merge the contract into existing agent instructions without replacing project-specific safety rules). Use the toolkit's `templates/PROJECT_PLAN.md` to preserve the full approved intent in readable form.

## 4. Start or resume work

Ask the coding agent to either turn the approved PRD into a phase plan or inspect the current repository and propose a phase plan for confirmation. Once the owner approves that plan, record it in `workflow.config.json`. For an in-progress project, set the first configured phase to the next unfinished approved phase; do not pretend earlier work passed this gate retroactively.

`init` places a review template at `.agent-workflow/PHASE_REVIEW.example.json`. Before the gate, have the agent write `.agent-workflow/phase-reviews/<phase-id>.json` from that template. It must assess every approved acceptance criterion exactly once and cite concrete code/test evidence. `fail` or `unverified` criteria are treated as failed checks, even if the npm scripts pass.

Run:

```bash
node ../Long-Running-Agent-Workflow/dist/bin/agent-workflow.js status
node ../Long-Running-Agent-Workflow/dist/bin/agent-workflow.js gate --phase phase-1
```

If a gate advances, the agent continues to the next configured phase within the approved scope. If it pauses, inspect `.agent-workflow/reviews.jsonl`; repair a concrete in-scope failure, gather changed evidence for low confidence, or ask the owner only at a genuine decision or safety boundary.

## What the current reviewer sees

Jev receives the phase ID, objective, named check results, every acceptance criterion, the agent's criterion-by-criterion assessment, its evidence summary, changed-file list, and safety flags. The record preserves confidence for status, next action, and risk separately, so a low-confidence pause has a diagnostic starting point. The reviewer still does not inspect the repository diff directly or perform code repair. Low confidence pauses the gate; the agent should diagnose the evidence gap and make a focused update before review again.
