# Workflow model

```text
Approved PRD or confirmed in-progress project
  -> phase plan and safety boundaries
  -> agent implements one coherent phase
  -> agent checks each acceptance criterion, records criterion-linked evidence, and runs configured npm scripts
  -> deterministic baseline rejects failed/unverified criteria; Jev reviews the detailed evidence
       -> advance: persist next phase; agent continues inside approved scope
       -> repair/pause: diagnose and retest, or collect changed evidence
       -> user-only decision / safety boundary / no progress: ask the owner
```

The responsibilities are deliberately separate:

- **Coding agent:** understands the project context, implements work, performs criterion-level self-review, repairs safe findings, and continues after an approved transition.
- **CLI:** validates project configuration, runs the phase's named npm scripts, calls the existing review gate, and writes local JSONL/state records.
- **Jev:** supplies an independent structured review signal. It does not edit files or control the agent.
- **Project owner:** approves the objective and phase plan up front, then re-enters for material choices, scope changes, safety/authorization boundaries, and unresolved no-progress cases.

The CLI records phase transitions; it is not a daemon that wakes an agent. Automatic continuation depends on the active agent following the repository's agent instructions. A goal tracker can record a destination, but this workflow adds phase contracts, checks, reviewer decisions, repair rules, durable state, and handoff evidence.

## Fidelity and current limits

The `source-snapshot/` directory is a byte-identical reference to the selected workflow source files. The runtime in `src/` wraps those decision and persistence modules with project-local configuration and paths; it does not edit the snapshot.

The Jev response is limited to status, next action, risk, and confidence; the runtime supplies the criterion-level evidence Jev needs to assess the phase but does not claim that Jev inspects a code diff or produces structured findings. Agent repair behavior is specified in `templates/AGENTS.md` and is bounded; low confidence never becomes an automatic pass.
