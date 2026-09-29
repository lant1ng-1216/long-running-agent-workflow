# Faithful extraction manifest

Status: the source inventory records Ariadne's workflow as it existed at extraction time. `source-snapshot/` remains byte-identical; the separate portable wrapper is documented below and does not rewrite that source.

## Operating model in Ariadne

The workflow begins with a user-approved objective. That objective may be a new brief/PRD or work already in progress. The working agent establishes or follows a phased plan with acceptance criteria, dependencies, and safety boundaries. The agent implements one coherent phase and runs its real checks.

The phase gate then evaluates the supplied evidence in two ways:

1. A deterministic baseline classifies failed checks, explicit blockers, deferred items, and high-risk/external actions.
2. Jev independently returns a structured status, next action, risk level, and confidence when the configured reviewer is available.

The gate records `advance` only when both decisions permit low-risk continuation, Jev confidence meets the configured threshold (default `0.85`), and there is no external-write or high-risk request. The runner records the review, updates the local phase state, and reports the result. Under the already approved scope, the working agent follows the project instructions and continues after `advance` without routine module-by-module user approval.

When checks fail, the project instructions direct the agent to diagnose, repair, and rerun the relevant checks. This repair is performed by the working agent; the gate itself does not edit code. If the reviewer is unavailable, confidence is below threshold, risk is not low, or the gate pauses, the phase is not marked approved. The instructions call for safe diagnosis/repair where possible and escalation only at a real user-decision, safety, external-prerequisite, or no-progress boundary.

Human approval remains required for work outside the approved scope and for material product decisions, public release, financial actions, destructive changes, sensitive-data disclosure, and other explicitly reserved boundaries. Jev is a review signal, not an execution controller.

## What the current implementation does not do

- The gate does not autonomously edit or repair source code; it returns evidence and a transition decision to the working agent.
- The Jev client currently asks for structured `status`, `nextAction`, and `riskLevel` answers. It does not preserve criterion-by-criterion findings, missing-evidence lists, or repair instructions.
- The current Jev `reasons` value is a generic message. A low confidence such as `0.300` is compared with the `0.85` threshold and results in `pause`; the current contract does not explain which specific criterion caused that uncertainty.
- `test-jev-shadow.ts` covers baseline decisions, mocked reviewer outcomes, pause/advance behavior, and record persistence. It does not prove an end-to-end autonomous repair loop.
- The gate command has an Ariadne-specific check allowlist and writes to Ariadne report paths. The snapshot is therefore not yet an independent, drop-in toolkit.

These are maturity boundaries, not features to silently invent during extraction.

## Separate portable wrapper

The toolkit layer outside `source-snapshot/` adapts the existing phase order, named project checks, local record paths, and CLI startup without changing the source gate's confidence threshold or safety decisions. It also adds a structured Agent self-review for every configured acceptance criterion. Missing, failed, or unverified criterion evidence is represented as a failed baseline check; the criterion list, self-review, evidence summary, and changed-file list are passed to the unchanged reviewer logic as additional state. This responds to the explicitly requested two-gate workflow (Agent self-check plus Jev review) while preserving the extraction as provenance.

The portable adapter also retains Jev's confidence for each of the three decisions (status, next action, risk) and identifies which one set the minimum. The overall confidence remains that exact minimum, so the source threshold and advance rule are unchanged. This makes a confidence-only pause diagnosable without weakening it.

The reviewer still does not inspect source diffs or edit/repair code. The working Agent analyzes findings, performs safe in-scope repairs, updates the criterion evidence, reruns checks, and re-enters the gate.

## Verbatim files copied

The following files are under `source-snapshot/`. They were compared with their Ariadne originals; the selected files match byte-for-byte.

| Ariadne source | Snapshot destination | Role |
|---|---|---|
| `AGENTS.md` | `source-snapshot/AGENTS.md` | Working-agent operating contract, repair/recheck behavior, and human authorization boundaries |
| `docs/JEV_PHASE_GATE.md` | `source-snapshot/docs/JEV_PHASE_GATE.md` | Gate invocation, acceptance requirements, and pause/advance policy |
| `docs/JEV_SHADOW_MODE.md` | `source-snapshot/docs/JEV_SHADOW_MODE.md` | Reviewer boundary, data passed to Jev, and shadow-mode behavior |
| `src/jev/types.ts` | `source-snapshot/src/jev/types.ts` | Evidence and decision data types |
| `src/jev/baseline.ts` | `source-snapshot/src/jev/baseline.ts` | Deterministic baseline classification |
| `src/jev/jev-client.ts` | `source-snapshot/src/jev/jev-client.ts` | Jev/Gateway structured review adapter |
| `src/jev/shadow-gate.ts` | `source-snapshot/src/jev/shadow-gate.ts` | Agreement, confidence, safety, and transition decision |
| `src/jev/state-collector.ts` | `source-snapshot/src/jev/state-collector.ts` | Read and validate phase evidence |
| `src/jev/phase-state.ts` | `source-snapshot/src/jev/phase-state.ts` | Persist phase transition state |
| `src/jev/record.ts` | `source-snapshot/src/jev/record.ts` | Append review records |
| `src/jev/report-sync.ts` | `source-snapshot/src/jev/report-sync.ts` | Append gate summaries to Ariadne interim reports (project-coupled) |
| `scripts/run-jev-gate.ts` | `source-snapshot/scripts/run-jev-gate.ts` | Run allowlisted checks, review evidence, persist and print decision |
| `scripts/run-jev-shadow.ts` | `source-snapshot/scripts/run-jev-shadow.ts` | Shadow-mode review runner |
| `scripts/test-jev-shadow.ts` | `source-snapshot/scripts/test-jev-shadow.ts` | Deterministic and mocked gate contract tests |

## Deliberately excluded from this snapshot

- Ariadne product implementation, website, SDK/MCP business logic, brand assets, and product data.
- `.env`, API keys, wallet material, personal data, private conversation contents, and raw screenshots.
- `records/phase-state.json`, `records/jev-shadow.jsonl`, phase fixtures, and other live or product-specific execution records.
- Ariadne's phase roadmap and full technical, product-experience, and developer logs. They contain project-specific history and are not generic workflow source files.
- The full root `package.json`, because it mixes workflow commands with Ariadne product scripts and dependencies.
- Ariadne's Git history or a nested link to its repository.

The exclusion of these files does not mean their information may be paraphrased into the public project. Any generic example must be clearly synthetic and must not expose Ariadne-specific product or private data.

## Packaging boundary

The local wrapper is independently identified rather than spliced into the verbatim snapshot. Its package and CLI have passed local checks; the repository remains private and no public repository, license, package publication, or deployment has been selected or created. Those are separate release decisions.

Social-media copy is not part of the public release tree and will be delivered in the chat for review. Local draft notes under `launch/` are ignored by Git and excluded from package output. Nothing from this side task should be added to the Ariadne mainline project.
