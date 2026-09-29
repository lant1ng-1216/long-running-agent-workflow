# Minimal project example

This tiny project demonstrates how an approved two-phase plan, criterion-by-criterion evidence, executable checks, and local workflow state fit together. Its data is synthetic; it makes no network requests and performs no external writes.

From this directory, run `npm test` and `npm run typecheck`. To try the CLI, first build the toolkit, then initialize or run the gate from this project root as described in [`../../docs/QUICKSTART.md`](../../docs/QUICKSTART.md). A Jev key is required for an independent Jev review; the automated tests use an injected deterministic reviewer and do not require a key.
