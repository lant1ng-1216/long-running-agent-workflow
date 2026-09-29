import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { writeShadowDecisionRecord } from "../src/jev/record.js";
import { appendGateReportEntry } from "../src/jev/report-sync.js";
import { advancePhaseState } from "../src/jev/phase-state.js";
import { runShadowGate } from "../src/jev/shadow-gate.js";

// Only read-only or deterministic checks may be launched by this gate.
const allowedChecks = new Set([
  "typecheck", "build", "web:next:typecheck", "web:next:build",
  "test:domain", "test:plan-registry", "test:signed-transaction",
  "test:input-balance", "test:gas-safety", "test:execution-dry-run", "test:guarded-sdk-executor",
  "test:agent-model", "test:asset-intent-query", "test:core-hardening", "test:presentation",
  "test:web-workspace", "test:asset-directory", "test:web-demo",
  "test:demo-mode", "test:mcp-natural-language", "test:mcp-enrichment", "test:onboarding", "test:distribution",
  "test:mcp-config", "test:sdk-example", "test:cleanroom", "test:jev-shadow", "test:retry-policy",
]);

type Options = { phase?: string; next?: string; objective?: string; checks: string[]; blocked: string[]; deferred: string[] };
const options: Options = { checks: [], blocked: [], deferred: [] };
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 2) {
  const flag = args[index];
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${flag ?? "argument"}`);
  if (flag === "--phase") options.phase = value;
  else if (flag === "--next") options.next = value;
  else if (flag === "--objective") options.objective = value;
  else if (flag === "--check") options.checks.push(value);
  else if (flag === "--blocked") options.blocked.push(value);
  else if (flag === "--deferred") options.deferred.push(value);
  else throw new Error(`Unknown option: ${flag}`);
}

if (!options.phase || !options.next || !options.objective || options.checks.length === 0) {
  throw new Error("Usage: npm run jev:gate -- --phase ID --next ID --objective TEXT --check SCRIPT [--check SCRIPT] [--blocked TEXT] [--deferred TEXT]");
}
for (const id of [options.phase, options.next]) {
  if (!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(id)) throw new Error(`Invalid phase ID: ${id}`);
}
for (const check of options.checks) {
  if (!allowedChecks.has(check)) throw new Error(`Check is not on the safe allowlist: ${check}`);
}

const checks = [];
for (const name of [...new Set(options.checks)]) {
  const exitCode = await runCheck(name);
  checks.push({ name, passed: exitCode === 0, evidence: `npm run ${name} exited ${exitCode}` });
}

const record = await runShadowGate({
  phase: options.phase,
  nextPhase: options.next,
  objective: options.objective,
  checks,
  deferredItems: options.deferred,
  blockedItems: options.blocked,
  externalWriteRequested: false,
  highRiskActionRequested: false,
});
const recordPath = resolve(process.env.JEV_RECORD_PATH ?? "records/jev-shadow.jsonl");
const phaseStatePath = resolve(process.env.JEV_PHASE_STATE_PATH ?? "records/phase-state.json");
await writeShadowDecisionRecord(recordPath, record);
const phaseState = await advancePhaseState(phaseStatePath, record);
await appendGateReportEntry(
  record,
  resolve("docs/TECHNICAL_RESEARCH_REPORT.md"),
  resolve("docs/PRODUCT_EXPERIENCE_REPORT.md"),
);
console.log(JSON.stringify({
  phase: options.phase,
  checks,
  provider: record.provider,
  jevAvailable: Boolean(record.jev),
  jevStatus: record.jev?.status,
  jevConfidence: record.jev?.confidence,
  phaseTransition: record.phaseTransition,
  nextPhase: phaseState.currentPhase,
  reason: record.transitionReason,
  actionTaken: record.actionTaken,
  recordPath,
}, null, 2));
if (record.phaseTransition !== "advance") process.exitCode = 2;

function runCheck(name: string): Promise<number> {
  return new Promise((done) => {
    const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", name], { stdio: "inherit" });
    child.once("error", () => done(1));
    child.once("exit", (code) => done(code ?? 1));
  });
}
