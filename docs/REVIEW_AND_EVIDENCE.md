# Review and evidence

The workflow separates implementation, reproducible checks, and independent review. A green test command proves only what that test covers. It does not by itself prove every acceptance criterion, visual quality, security, or production readiness.

For each phase, the working agent should:

1. Map every acceptance criterion to the changed implementation and an observable verification method.
2. Run the configured project checks and inspect their actual output.
3. Report failed, unverified, deferred, or blocked criteria explicitly; do not hide them behind a passing aggregate command.
4. Save a structured self-review at `.agent-workflow/phase-reviews/<phase-id>.json`, using `.agent-workflow/PHASE_REVIEW.example.json`. Every configured criterion must appear exactly once with a `pass`, `fail`, or `unverified` status and concrete evidence. Missing, failed, or unverified criteria become failed baseline checks.
5. Run the phase gate and read the resulting review record. Jev receives the criteria, self-review summary, changed-file list, criterion evidence, and test results—not merely the phase title. The record retains confidence by decision dimension and identifies the lowest-confidence dimension for targeted diagnosis.
6. When a concrete in-scope defect is found, repair it and rerun the affected checks. When evidence is missing or confidence is low, investigate the gap and submit a focused review only after adding or changing evidence.

The Jev adapter receives the criterion-by-criterion self-review and evidence, but does not inspect the repository diff itself or produce structured per-criterion findings. The independent classification remains a signal, not proof of correctness; the agent must still inspect actual code and test output.

`advance` records the next configured phase. The active coding agent—not the CLI or Jev—continues implementation by following the repository instructions. Failed checks and low confidence do not advance. Repeated review of unchanged evidence is not useful; if safe diagnosis cannot resolve the gap or progress is exhausted, report the exact blocker to the owner.
