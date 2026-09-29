# Open-source plan: Long-Running Agent Workflow

Status: internal planning document; not part of the Ariadne product and not yet copied to a public repository.

> **Scope correction (2026-09-29):** Not every proposal in this planning document is approved. Approved for the local toolkit: preserve the 14-file source snapshot exactly; wrap it with project-local configuration, checks, phase state, and records; include idea/PRD intake and existing-project adoption; and implement the user's explicitly described first gate (criterion-by-criterion Agent self-review) plus second Jev gate. The wrapper preserves the source threshold and safety decisions. Alternative reviewer backends, new autonomous capabilities beyond the described repair/advance process, license choice, GitHub creation, and public release remain unapproved. See [the extraction manifest](EXTRACTION_MANIFEST.md).

## 1. Goal and positioning

Extract and package the development workflow already dogfooded during Ariadne's long-running development. This is not a new proof-of-concept and not a rewrite of Ariadne. Ariadne is the source of practical workflow experience; the public repository must be a clean, independent project containing only reusable workflow assets.

### Recommended repository identity

- **Repository:** `long-running-agent-workflow` (check availability before creating the remote).
- **Project name:** Long-Running Agent Workflow.
- **Short description:** `A review-gated workflow for long-running AI-agent development: turn an approved brief or an in-progress repository into phased work with evidence, targeted repair, and safe automatic progression.`
- **Positioning:** an agent-agnostic workflow kit/framework with local tooling—not a prompt collection, not a standalone model, and not a hosted autonomous coding service.

The system takes an approved project brief/PRD or an existing project, reconstructs or defines its scope and phases, and keeps execution tied to explicit acceptance criteria. For each phase the working agent implements and self-checks, an independent reviewer checks evidence against the approved intent, repairable findings loop back for diagnosis and correction, and an approved phase advances automatically. Human input remains for genuine product decisions, changed scope, high-impact security/financial/external actions, and blockers that cannot be safely resolved within policy.

It is complementary to a goal tracker: a goal states the destination; this workflow defines the project lifecycle, phase contracts, evidence, review, repair, handoff, and advancement rules used to get there. It can also join work already underway rather than requiring every task to start from a blank repo.

## 2. Release shape

The public GitHub repository is the canonical source and the first distribution channel. The first release should be a copyable local toolkit with a small CLI/scripts package and templates. Do not make an npm publication, hosted service, dashboard, or MCP server a release prerequisite.

- **Core workflow contract:** generic `AGENTS.md` / workflow instructions and a versioned project/phase state format.
- **Local tooling:** adapt the existing phase gate, state persistence, evidence recording, and reviewer integration so it is project-configurable rather than Ariadne-specific.
- **Reviewer adapter:** Jev is supported as an adapter, not hard-wired as the system's only reviewer. The review result must preserve criterion-level findings, missing evidence, rationale, confidence per decision, and a next action.
- **Agent integration:** Codex is the first documented adapter because this is where the workflow has been exercised. A Skill/Plugin can improve installation and usage later. Other agents can adopt the core contract through their native instruction/plugin formats; do not claim universal compatibility before checking it.
- **MCP:** optional future adapter only if a real workflow needs an agent to query or operate the workflow through structured tools. It is not required for the first release.
- **Install path:** clone/download the repo and copy or initialize its workflow files in the target project. Consider a package-manager installer only after the local format stabilizes.

## 3. Proposed public repository contents

```text
long-running-agent-workflow/
├── README.md
├── LICENSE                         # select before public release
├── AGENTS.md                        # portable working contract
├── package.json                     # local scripts/tooling, if retained after extraction
├── workflow.example.yaml            # project policy and phase configuration
├── templates/
│   ├── PROJECT_BRIEF.md             # greenfield intake / PRD summary
│   ├── PHASE_PLAN.md                # phase scope, acceptance, dependencies
│   └── REVIEW_REPORT.md             # criterion-linked review and repair record
├── src/                             # generalized gate, state, and reviewer adapter
├── scripts/                         # initialize, status, check/gate commands
├── tests/                           # state, repair/stop, evidence, and progression contracts
├── examples/minimal-project/        # clean sample; no Ariadne code or data
└── docs/
    ├── WORKFLOW_MODEL.md            # lifecycle and component boundaries
    ├── QUICKSTART.md                # install and first phased task
    ├── ADOPT_EXISTING_PROJECT.md    # mid-project intake and safe resume
    ├── REVIEW_AND_EVIDENCE.md       # self-check + independent review
    ├── REPAIR_OR_STOP.md            # retry vs true escalation rules
    ├── SECURITY.md                  # credentials, write permissions, release boundaries
    ├── CONFIGURATION.md             # customize phases, checks, thresholds, adapters
    └── CONTRIBUTING.md
```

### README must explain

1. The long-horizon problem: attention drift, silent downgrade, shallow “done” claims, and repeated human handoffs.
2. The workflow at a glance, including both new-PRD and in-progress-project entry paths.
3. What it is and is not; how it differs from a goal-only tracker and from a Skill-only prompt.
4. A short quickstart that shows a project plan, one review gate, a repair loop, and an approved transition.
5. Current maturity and known limits—no claims of guaranteed correctness or unrestricted autonomy.
6. Security model, permission boundaries, license, contribution path, and supported agent adapters.

## 4. What to extract and what to exclude

### Candidate reusable material in the current project

- The project-level workflow contract currently expressed in `AGENTS.md`.
- Phase-gate policy and reviewer concepts in `docs/JEV_PHASE_GATE.md` and `docs/JEV_SHADOW_MODE.md`.
- Generalizable Jev decision types, deterministic baseline, gate evaluation, phase-state persistence, and record writing in `src/jev/`.
- The gate runner and its safety allowlist in `scripts/run-jev-gate.ts`, plus relevant tests/fixtures such as `test-jev-shadow` and retry-policy coverage.
- The observed operating practices: approved scope first; real checks; independent review; advance only on an accepted gate; repair safe in-scope findings; record unresolved limitations.

These are extraction candidates, not a promise to copy every file unchanged. The implementation must be reviewed for hard-coded Ariadne paths, npm script assumptions, logging behavior, credentials, and stale or contradictory rules.

### Explicit exclusions

- Ariadne's product code, website, SDK/MCP business capabilities, branding, assets, product-specific PRD, and project-specific records/log history.
- `.env` files, API keys, wallet material, personal data, private conversations, and raw chat screenshots.
- Ariadne's Git history or a nested/submodule link back to its repository.
- Claims that a passing Jev score alone proves product correctness or authorizes a high-impact action.

The public repository should be initialized with clean history. The social-media drafts are separate launch material and are not automatically included in the public code repository.

## 5. Development-system workflow for this side task

The task itself will use the same phase discipline. A passing Jev review advances automatically to the next in-scope phase; a repairable finding returns to focused work and re-review. No routine phase-by-phase user approval is planned. The following remain explicit human boundaries: final license choice, any substantive change to the agreed scope, and the actual public release/content approval.

| Phase | Work | Acceptance evidence | If review does not pass |
|---|---|---|---|
| 0. Charter and inventory | Freeze purpose, boundaries, repo identity, file inventory, and release criteria. | This plan and the mainline checkpoint agree; no Ariadne product files are in scope. | Fix the plan or resolve a genuine user-owned choice. |
| 1. Clean extraction | Create the independent local repo and generalize only the reusable workflow contract, state/gate/reviewer code, and relevant tests. | Clean repository; no Ariadne implementation, history, secrets, or product data; scripts run from the new repo. | Trace the failing criterion to the source and repair; do not weaken the criterion to get a pass. |
| 2. Usability and workflow validation | Add quickstart, config template, new-project and in-progress adoption paths, and concise examples. | A clean sample project can initialize, record phase evidence, represent repair/stop/advance distinctly, and resume state. | Repair docs/tooling and rerun the affected checks. |
| 3. Review-loop hardening | Ensure reviewer output exposes actionable reasons and routes low confidence to diagnosis/evidence collection rather than a silent dead end. | Tests cover fixable review findings, unresolved user/safety blockers, no-progress/retry bounds, and phase advancement only after acceptance. | Diagnose missing evidence or decision ambiguity; use a true stop only for a user-only decision, unsafe action, external prerequisite, or exhausted safe repair. |
| 4. Release preparation | Draft README, security/contribution docs, license file after the user's choice, and launch copy. | Typecheck/tests/build as applicable; clean-install/quickstart check; secret and project-contamination review; all public claims trace to evidence. | Repair and repeat review. No threshold lowering or fabricated evidence. |
| 5. Public release | Create the separate public GitHub repo and publish the reviewed files. | User has approved the exact repository identity, license, and public release candidate; remote contains only the intended toolkit. | Do not publish until the release boundary is explicitly satisfied. |
| 6. Return to Ariadne | Resume the saved mainline checkpoint. | Ariadne remains on Phase 6 until its own reviewer/evidence issue is resolved and its gate advances. | Continue safe diagnosis on Phase 6; do not mistake the side-track release for Phase 7 approval. |

For any confidence-only gate pause, capture per-question confidence and criterion-level rationale, inspect what evidence the reviewer actually saw, then diagnose or repair within scope. Do not resubmit unchanged evidence and do not interpret low confidence alone as a code defect. This corrects the exact observability gap found in Ariadne's latest 0.300 result.

## 6. Communications document to prepare

Create a separate Chinese master narrative based on the user's screenshots and explanation, then adapt it into an X/Twitter thread, a long-form article, and shorter LinkedIn/WeChat/social posts. The story should cover the problem, the complete lifecycle, the two-stage review, targeted self-correction, automatic phase advancement, mid-project adoption, human safety boundaries, and the distinction from a goal tracker. Do not publish the source screenshots or mention Ariadne/product details without a separate explicit review. A local, unapproved draft is in `launch/DEV_WORKFLOW_ORIGIN_STORY.zh-CN.md`; `launch/` is excluded from the public repository and package until the author approves a final text.

## 7. Decisions still needed before public release

- Confirm the proposed repo name or choose an alternative if unavailable.
- Choose the open-source license; do not publish without an explicit license.
- Approve the final public README and launch copy, including whether to name Jev and whether to disclose the dogfooding project.
- Approve the public release candidate. This is one release boundary, not a request for routine approval at every development phase.
