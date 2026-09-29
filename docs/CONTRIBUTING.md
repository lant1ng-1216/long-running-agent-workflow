# Contributing

This project is intended to preserve a complete, evidence-based development workflow—not to reward a green status label. Changes should keep approved requirements, real checks, review decisions, repair behavior, safe pauses, and durable phase state aligned.

## Before changing behavior

- Read [the workflow model](WORKFLOW_MODEL.md), [repair-or-stop rules](REPAIR_OR_STOP.md), [security boundaries](SECURITY.md), and the exact source snapshot manifest.
- Describe the behavior being changed and its acceptance evidence. Do not silently change the source snapshot or the meaning of a phase transition.
- Keep Ariadne product code, private project records, credentials, private conversations, and raw screenshots out of this repository.

## Verification

Run before proposing a change:

```bash
npm run typecheck
npm run build
npm run test:jev-shadow
npm pack --dry-run
```

Add or update tests for both the accepted transition and the relevant failure/pause path. Tests using mocked Jev decisions must be labeled as simulations; they do not replace a live reviewer call or prove that an LLM will follow repair instructions.

## Review expectations

- Keep `source-snapshot/` byte-identical to the recorded source version. Changes to the portable wrapper belong outside that directory unless a separately approved provenance update is made.
- Never weaken an acceptance criterion, lower a confidence threshold, or fabricate evidence to obtain an `advance` result.
- Document what the CLI enforces versus what the connected coding agent is instructed to do.
- Do not add a license, publish a package, or create a public repository on behalf of a contributor without the repository owner's explicit decision.

Until the owner selects a license and approves a public release candidate, this local candidate is not an open-source release.
