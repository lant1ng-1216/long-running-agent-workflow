# Long-Running Agent Workflow

> **Status:** private local candidate; the CLI/runtime, project templates, and synthetic example passed local checks. No license, public GitHub repository, or publication has been selected or created.

A review-gated workflow for long-running AI-agent development: turn an approved brief or an in-progress repository into phased work with evidence, targeted repair, and safe automatic progression.

## The problem

Large development tasks span many modules and phases. As work continues, an agent can lose the original intent, silently simplify requirements, or declare a shallow implementation complete. At the other extreme, it may stop after every module and require a person to repeat instructions even though the overall plan and acceptance criteria were already approved.

## The workflow

```text
Approved project brief / existing project
  -> scope, phases, dependencies, acceptance criteria, and safety boundaries
  -> implement one phase and run its real checks
  -> agent self-review + independent evidence-based review
       -> repairable finding: diagnose, repair, retest, and review again
       -> accepted phase: record evidence and continue to the next approved phase
       -> user-only decision or safety boundary: pause with the exact reason
  -> integration review and final handoff
```

The process can start from a new PRD or join work that is already underway. It aims to remove routine phase-by-phase prompting, not to remove human judgment from product decisions, security, financial actions, destructive changes, or public release.

## What this project is—and is not

- A reusable project workflow, phase contract, evidence/review loop, and local tooling for coding agents.
- Not only a Skill or prompt: those can teach an agent how to follow a process, while this project also needs durable phase state, repeatable checks, and review records.
- Not a goal tracker: a goal describes the destination; this workflow governs how a multi-phase project is delivered and verified.
- Not an unrestricted autonomous coding service. Agent and reviewer decisions remain bounded by approved scope and explicit safety policy.

## Current working materials

- [Open-source extraction plan](docs/OPEN_SOURCE_DEV_WORKFLOW_PLAN.md)
- [Source extraction manifest](docs/EXTRACTION_MANIFEST.md)
- [Extraction validation record](docs/EXTRACTION_VALIDATION.md)
- [Quickstart](docs/QUICKSTART.md)
- [Project intake: idea/PRD to approved phases](docs/PROJECT_INTAKE.md)
- [Workflow model](docs/WORKFLOW_MODEL.md)
- [Adopting an existing project](docs/ADOPT_EXISTING_PROJECT.md)
- [Review and evidence](docs/REVIEW_AND_EVIDENCE.md)
- [Security boundaries](docs/SECURITY.md)
- [Configuration reference](docs/CONFIGURATION.md)
- [Repair or stop](docs/REPAIR_OR_STOP.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Minimal runnable example](examples/minimal-project/README.md)

`source-snapshot/` preserves the selected Ariadne workflow files byte-for-byte. It is an evidence/source snapshot, not a claim that the code already runs independently: some paths and check names still refer to Ariadne. No Ariadne product implementation, project records, secrets, private screenshots, or Git history are included.

The local runtime adapts project root, named checks, phase ordering, and local record paths around unchanged source decision logic. It requires the working agent to submit a structured assessment for every acceptance criterion and passes that evidence into the reviewer state; missing or failed criteria block advancement. It also records Jev's separate confidence for status, next action, and risk, while keeping the same minimum-score threshold. Jev still does not inspect source diffs or repair code. See the validation record for scope and limits.

The CLI does not launch or edit a coding agent. The active coding agent performs implementation and any in-scope repair by following the project instructions; the CLI runs configured checks, requests the review decision, and records whether the approved phase may advance. The tests use synthetic projects and mocked review decisions to verify these boundaries and state transitions. They are not an end-to-end evaluation of an LLM independently changing code.

The `launch/` folder is intentionally excluded from Git and package output. It contains local, unapproved writing notes; they are not part of the public toolkit or an approved social-media deliverable.

## Release boundary

The proposed repository name is `long-running-agent-workflow`. Before any public release, the repository identity, open-source license, final README, and clean-room contents must be reviewed. No package has been published and no public repository has been created.
