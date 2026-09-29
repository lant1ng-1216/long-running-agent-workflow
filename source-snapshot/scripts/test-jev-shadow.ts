import assert from "node:assert/strict";
import { evaluateBaseline } from "../src/jev/baseline.js";
import { isLowRiskContinuation, runShadowGate } from "../src/jev/shadow-gate.js";
import { writeShadowDecisionRecord } from "../src/jev/record.js";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const safe = {
  phase: "test-phase",
  objective: "Validate a safe read-only phase",
  checks: [{ name: "typecheck", passed: true, evidence: "pass" }],
  deferredItems: [],
  blockedItems: [],
  externalWriteRequested: false,
  highRiskActionRequested: false,
};
const unsafe = { ...safe, highRiskActionRequested: true };
const deferred = { ...safe, deferredItems: ["UI polish remains a later phase"] };

assert.equal(evaluateBaseline(safe).status, "passed");
assert.equal(evaluateBaseline(unsafe).nextAction, "ask_user");
assert.equal(evaluateBaseline(deferred).status, "passed_with_deferred_items");
assert.equal(isLowRiskContinuation(evaluateBaseline(deferred)), true);
const record = await runShadowGate(safe, async () => undefined);
assert.equal(record.mode, "shadow");
assert.equal(record.actionTaken, "none");
assert.equal(record.phaseTransition, "pause");
assert.equal(record.baseline.automaticExecutionAllowed, false);
const approved = await runShadowGate(safe, async () => ({
  ...evaluateBaseline(safe),
  source: "jev",
  confidence: 0.99,
}));
assert.equal(approved.phaseTransition, "advance");
const lowConfidence = await runShadowGate(safe, async () => ({
  ...evaluateBaseline(safe),
  source: "jev",
  confidence: 0.1,
}));
assert.equal(lowConfidence.phaseTransition, "pause");
const highRisk = await runShadowGate(unsafe, async () => ({
  ...evaluateBaseline(safe),
  source: "jev",
  confidence: 0.99,
}));
assert.equal(highRisk.phaseTransition, "pause");
const tempDir = await mkdtemp(join(tmpdir(), "ariadne-jev-shadow-"));
const recordPath = join(tempDir, "shadow.jsonl");
await writeShadowDecisionRecord(recordPath, record);
const persisted = JSON.parse((await readFile(recordPath, "utf8")).trim()) as typeof record;
assert.equal(persisted.actionTaken, "none");
assert.equal(persisted.evidence.phase, "test-phase");
assert.equal(typeof persisted.durationMs, "number");

console.log(JSON.stringify({
  mode: record.mode,
  baselineStatus: record.baseline.status,
  jevAvailable: Boolean(record.jev),
  mockedGateDecisions: true,
  actionTaken: record.actionTaken,
  passed: true,
}, null, 2));
