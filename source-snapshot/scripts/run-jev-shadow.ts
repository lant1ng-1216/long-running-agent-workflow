import { resolve } from "node:path";
import { readProjectState } from "../src/jev/state-collector.js";
import { writeShadowDecisionRecord } from "../src/jev/record.js";
import { runShadowGate } from "../src/jev/shadow-gate.js";
import { appendGateReportEntry } from "../src/jev/report-sync.js";
import { advancePhaseState } from "../src/jev/phase-state.js";

const statePath = process.argv[2];
if (!statePath) {
  throw new Error("Usage: npm run jev:shadow -- <project-state.json>");
}

const evidence = await readProjectState(resolve(statePath));
const record = await runShadowGate(evidence);
const outputPath = resolve(process.env.JEV_RECORD_PATH ?? "records/jev-shadow.jsonl");
await writeShadowDecisionRecord(outputPath, record);
const phaseStatePath = resolve(process.env.JEV_PHASE_STATE_PATH ?? "records/phase-state.json");
const phaseState = await advancePhaseState(phaseStatePath, record);
await appendGateReportEntry(
  record,
  resolve("docs/TECHNICAL_RESEARCH_REPORT.md"),
  resolve("docs/PRODUCT_EXPERIENCE_REPORT.md"),
);
console.log(JSON.stringify({
  mode: record.mode,
  phase: evidence.phase,
  baseline: record.baseline,
  jevAvailable: Boolean(record.jev),
  agreement: record.agreement,
  actionTaken: record.actionTaken,
  phaseState,
  recordPath: outputPath,
}, null, 2));
