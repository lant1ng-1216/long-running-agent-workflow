# From discussion to an approved project plan

The workflow begins before the first code change. It can start with an idea that needs product discovery, a complete PRD ready to implement, or an existing project that needs a safe handoff.

## Idea or PRD entry

1. Discuss the problem, users, desired outcome, requirements, constraints, and trade-offs with the project owner. Use natural language; the brief template is a memory aid, not a form the owner must complete alone.
2. The agent summarizes the discussion in [`../templates/PROJECT_BRIEF.md`](../templates/PROJECT_BRIEF.md), separating confirmed decisions, assumptions, and open owner choices.
3. Resolve open choices that would materially change the product, safety boundary, or acceptance result. The agent should not begin implementation while a core decision is still ambiguous.
4. Translate the confirmed brief into [`../templates/PROJECT_PLAN.md`](../templates/PROJECT_PLAN.md): coherent phases, dependencies, observable criteria, existing checks, deferred items, and human-only boundaries.
5. The owner approves the scope and phase plan once. Then copy the approved phases into `workflow.config.json` and begin phase one.

## In-progress project entry

Use [`ADOPT_EXISTING_PROJECT.md`](ADOPT_EXISTING_PROJECT.md). First reconstruct repository state and trustworthy evidence read-only; then propose only the remaining work. Do not claim past work passed retroactively or discard existing changes.

## During delivery

At each phase boundary, the agent completes the planned work, maps criteria to implementation, runs real checks, and records limitations. The deterministic baseline and Jev review determine whether the phase may advance. An approved transition continues automatically inside the owner's approved plan. Genuine product decisions, new scope, external authorization, high-impact actions, or unresolved no-progress blockers return to the owner.

Approval of the initial brief is not blanket authorization for deployment, transactions, destructive operations, publication, or other high-impact external actions.
