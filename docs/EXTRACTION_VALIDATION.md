# Extraction validation record

This record covers the faithful source snapshot and the separately identified local toolkit wrapper. It does not approve package publication or a public GitHub release.

## Checks

- Mainline `npm run test:jev-shadow`: passed. The test exercises deterministic baseline handling, mocked Jev decisions, pause/advance conditions, and record persistence; it does not claim to test automatic code repair.
- The same shadow test, run against the staged verbatim snapshot in an isolated temporary directory: passed.
- Byte-for-byte comparison of all 14 extracted files against Ariadne originals: passed.
- Isolated extraction audit: passed; all 14 expected files matched, excluded project artifacts were absent, and the README/manifest described the current maturity boundary.
- Portable runtime: `npm run typecheck`, `npm run build`, `npm run test:jev-shadow`, sample two-phase progression, fresh-project CLI `init`/`status`, and `npm pack --dry-run` passed in isolated workspaces. The dry-run contained no real `.env`; the CLI entry was executable.
- The portable first gate blocks missing, failed, or unverified criterion assessments; passing samples record the exact criteria, Agent summary, evidence, and changed-file list for Jev.
- The portable tests also simulate a failed check followed by repair, rerun, and advancement, plus a low-confidence pause followed by changed evidence, focused re-review, and advancement. These are mocked gate/workflow scenarios; they do not execute an actual coding model's source edits.
- No source files, records, or reports in the Ariadne mainline were changed by this extraction task. Gate records for this side task were written only under a temporary directory.

## Jev phase decisions

| Phase | Evidence | Jev | Result |
|---|---|---|---|
| `verbatim-source-snapshot` | `test:jev-shadow` passed | `passed`, confidence `0.99` | Advanced to `extraction-inventory-documented` |
| `extraction-inventory-documented` | Isolated exact-copy/exclusion/documentation audit passed | `passed`, confidence `0.94` | Advanced to `final-extraction-audit` |
| `final-extraction-audit` | Snapshot, exclusions, maturity claims, and this validation record passed deterministic audit | `passed`, confidence `0.98` | Advanced to `packaging-boundary-review` |
| `portable-runtime-core` | Typecheck, portable runtime tests, and source shadow tests passed | `passed`, confidence `0.87` | Advanced to `agent-instructions-and-examples` |
| `agent-instructions-and-examples` | Typecheck, runtime tests, example checks, source shadow tests, and snapshot parity passed | `passed`, confidence `0.91` | Advanced to `final-clean-room-audit` |
| `final-clean-room-audit` (initial audit) | Three checks passed, but the evidence sent to Jev omitted criterion-level self-review and independent packaging/snapshot audit detail | `passed`, confidence `0.43` | Paused below `0.85`; no code failure was reported |
| `final-clean-room-audit` (focused review) | Added concrete audit detail; corrected license/publication from an in-phase deferred item to a separate owner boundary | `passed_with_deferred_items`, confidence `0.84`, then `passed`, confidence `0.57` | Both paused below `0.85`; the evidence contract still did not send structured per-criterion reports |
| `final-clean-room-audit` (portable evidence gate) | Added criterion-by-criterion self-review, sent those records to Jev, and preserved per-decision confidence | `passed`; status `0.99`, next action `0.50`, risk `0.93`; Jev selected `ask_user` | Correctly paused: the next action is the owner-controlled license/public-release decision, and confidence remains below `0.85` |
| `side-local-technical-readiness` (first review) | Local docs/tests/package evidence passed, but future license and public-release decisions were incorrectly attached as deferred items to this technical phase | `passed_with_deferred_items`; status `0.97`, next action `0.51`, risk `0.88`; Jev selected `ask_user` | Paused below `0.85`; diagnosed a phase-boundary/evidence-classification issue, not a failed code check |
| `side-local-technical-readiness` (focused re-review) | Separated the future owner-release decision into its own later phase, retained all technical criteria, and clarified that the next step is a private author-draft | `passed`; status `0.99`, next action `0.98`, risk `0.97`; Jev selected `continue` | Advanced to the safe in-scope author-draft phase. No release, license, or GitHub action was authorized |

The first network-restricted Jev attempt was unavailable and correctly paused. The same unchanged phase evidence was then reviewed through the authorized network path and passed; the failed attempt and successful review are retained only in the temporary gate record, not in the Ariadne project.

The low-confidence diagnosis exposed two concrete observability gaps in the portable wrapper: acceptance criteria were not included in reviewer state, and the minimum confidence hid which Jev decision was uncertain. The wrapper now supplies criterion evidence and stores confidence by decision dimension without changing the source snapshot or threshold. The final reviewer classified the implementation as passed/low-risk, but chose `ask_user` for the next action; that is appropriate because selecting a license or publishing a public repository is outside the approved technical phase. This is not a Jev approval to publish.

## Remaining boundary

The local wrapper builds and runs, but the work remains in a private local folder with no Git remote. License selection, public GitHub repository creation, and any publication still need the owner's explicit decision. No package or source has been published.

## Revalidation after the independent audit (2026-09-29)

- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test:jev-shadow`: passed. The portable suite passed the repair/retest and low-confidence/evidence-update simulations; the clean example passed 2/2 tests; the source shadow suite passed. The shadow test reported `jevAvailable: false` and `mockedGateDecisions: true`; the separate live gate results above are the Jev approvals for the side phase.
- `npm pack --dry-run --json`: passed after the release-boundary edits; 61 package entries, `launch/` excluded, no real `.env`, executable CLI mode retained. `LICENSE` is absent pending the owner's license choice. An explicit `.npmignore` keeps local writing notes out of the archive.
- Actual package tarball installed with its dependencies into a fresh isolated consumer under `/private/tmp`; installed `agent-workflow init` created its config/review template, and `status` returned `uninitialized`. This was a local install test only; nothing was published.
- Current package metadata and lockfile now require Node 22, matching the installed `ai@7` dependency's declared engine.
- Independent read-only subagent audit confirmed a separate local Git repository, no commits, no remote, and 14/14 byte-identical source snapshot files. It also identified and this pass corrected the Node engine mismatch and the social-draft path discrepancy. The GitHub CLI is installed but is not authenticated on this host.

These checks validate the local toolkit and its simulated decision paths. The corrected technical-readiness phase passed its live Jev gate, but that approval does not approve a social-media text, choose a license, create a GitHub repository, or authorize public release. The overall side task remains incomplete.

After that technical phase advanced, a first-person viewpoint draft was written under the ignored local `launch/` folder for author review. It is not part of Git/package output, has not passed the author's review, and is not being treated as a release deliverable.
