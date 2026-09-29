# Jev phase gate for Ariadne development

Jev is enabled as a **review checkpoint** between already approved, low-risk development phases. It does not execute work or grant authorization by itself. Codex runs actual tests, sends only short non-sensitive evidence (check name and exit code) to Jev, records the decision, and continues the next in-scope phase only when both the deterministic baseline and Jev return a low-risk continuation at the configured confidence threshold (default `0.85`).

Example:

```bash
npm run jev:gate -- \
  --phase agent-natural-language-repair \
  --next web-consistency-repair \
  --objective "Read-only Agent research accepts a Chinese NVDA request and retains warnings" \
  --check typecheck \
  --check test:agent-model \
  --check test:demo-mode
```

Use `--blocked "..."` for a known failed acceptance criterion and `--deferred "..."` only for a genuinely non-blocking later item. The gate accepts only an allowlist of deterministic, non-transactional npm scripts. The run appends a JSONL record under `records/`, updates the phase-state file and appends a short interim note to the technical and product-experience reports. `advance` means Codex may proceed to the named next step within the user's prior authorization; `pause` means repair, diagnose or request direction. An unavailable Jev fails closed and does not silently use the deterministic baseline as approval.

The gate is invoked by the working Codex task; it is not an always-running daemon and does not schedule a new task. A passing gate certifies only the evidence supplied to it. Natural-language Agent behavior, direct web usability and subjective design quality require their own observations and cannot be inferred from typecheck alone. No gate verdict permits a live wallet transaction, public deployment, external write, scope change or irreversible action.
