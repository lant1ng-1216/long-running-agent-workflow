import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateBaseline } from "../source-snapshot/src/jev/baseline.js";
import type { GateDecision, GateEvidence } from "../source-snapshot/src/jev/types.js";
import { validateWorkflowConfig } from "../src/config.js";
import { getConfidenceBreakdown } from "../src/jev-adapter.js";
import { runConfiguredGate } from "../src/runner.js";

type TestPhase = { id: string; objective: string; acceptanceCriteria: readonly string[]; checks: readonly string[] };
type TestConfig = {
  schemaVersion: number;
  projectName: string;
  storage: { phaseStatePath: string; reviewLogPath: string };
  phases: readonly TestPhase[];
};

const previousThreshold = process.env.JEV_MIN_CONFIDENCE;
process.env.JEV_MIN_CONFIDENCE = "0.85";
const root = await mkdtemp(join(tmpdir(), "agent-workflow-test-"));

try {
  const baseConfig = {
    schemaVersion: 1,
    projectName: "Synthetic Example",
    storage: { phaseStatePath: ".agent-workflow/state.json", reviewLogPath: ".agent-workflow/reviews.jsonl" },
    phases: [
      { id: "phase-one", objective: "Complete a bounded, read-only phase", acceptanceCriteria: ["Expected result is verified"], checks: ["typecheck", "test"] },
      { id: "phase-two", objective: "Continue to the next approved phase", acceptanceCriteria: ["Phase one was approved"], checks: ["typecheck"] },
    ],
  } as const;
  validateWorkflowConfig(baseConfig);
  assert.throws(() => validateWorkflowConfig({ ...baseConfig, storage: { phaseStatePath: "../outside.json" } }), /relative path/);
  assert.throws(() => validateWorkflowConfig({ ...baseConfig, phases: [baseConfig.phases[0], baseConfig.phases[0]] }), /Duplicate phase ID/);
  assert.throws(() => validateWorkflowConfig({ ...baseConfig, phases: [{ ...baseConfig.phases[0], acceptanceCriteria: ["same", "same"] }] }), /must not contain duplicates/);
  assert.deepEqual(
    getConfidenceBreakdown({ status: 0.92, nextAction: 0.88, riskLevel: 0.41 }),
    { status: 0.92, nextAction: 0.88, riskLevel: 0.41, lowestDimension: "riskLevel" },
  );

  await mkdir(root, { recursive: true });
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { typecheck: "true", test: "true" } }));
  await writeFile(join(root, "workflow.config.json"), JSON.stringify(baseConfig));
  await writePhaseReview(root, baseConfig.phases[0]);

  const executed: string[] = [];
  const passingReviewer = async (evidence: GateEvidence): Promise<GateDecision> => ({
    ...evaluateBaseline(evidence), source: "jev", confidence: 0.99,
  });
  const advanced = await runConfiguredGate({
    projectRoot: root,
    phaseId: "phase-one",
    checkRunner: async (script) => { executed.push(script); return { exitCode: 0 }; },
    reviewer: passingReviewer,
  });
  assert.deepEqual(executed, ["typecheck", "test"]);
  assert.equal(advanced.record.phaseTransition, "advance");
  assert.equal(advanced.phaseState.currentPhase, "phase-two");
  assert.equal(advanced.record.actionTaken, "none");
  assert.equal(advanced.criterionAssessments.every((assessment) => assessment.status === "pass"), true);
  const stored = JSON.parse(await readFile(join(root, ".agent-workflow/reviews.jsonl"), "utf8")) as {
    evidence: GateEvidence & {
      acceptanceCriteria?: string[];
      criterionAssessments?: unknown[];
      agentSummary?: string;
      changedFiles?: string[];
    };
  };
  assert.equal(stored.evidence.phase, "phase-one");
  assert.equal(stored.evidence.criterionAssessments?.length, 1);
  assert.equal(stored.evidence.acceptanceCriteria?.[0], "Expected result is verified");
  assert.equal(stored.evidence.agentSummary, "Self-review for phase-one");
  assert.equal(stored.evidence.changedFiles?.[0], "src/example.ts");

  await assert.rejects(
    runConfiguredGate({ projectRoot: root, phaseId: "phase-one", checkRunner: async () => ({ exitCode: 0 }), reviewer: passingReviewer }),
    /current approved phase is phase-two/,
  );
  const secondPhase = await runConfiguredGate({
    projectRoot: await withPhaseReview(root, baseConfig.phases[1]),
    phaseId: "phase-two",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: async (evidence) => ({ ...evaluateBaseline(evidence), source: "jev", confidence: 0.3 }),
  });
  assert.equal(secondPhase.record.phaseTransition, "pause");
  assert.equal(secondPhase.phaseState.currentPhase, "phase-two");

  const missingReviewRoot = await makeProject(root, baseConfig, false);
  const missingReview = await runConfiguredGate({
    projectRoot: missingReviewRoot,
    phaseId: "phase-one",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: passingReviewer,
  });
  assert.equal(missingReview.selfReviewError, "No self-review file exists at the configured phase path.");
  assert.equal(missingReview.record.baseline.status, "needs_rework");
  assert.equal(missingReview.criterionAssessments.every((assessment) => assessment.status === "unverified"), true);

  const unverifiedReviewRoot = await makeProject(root, baseConfig, true, "unverified");
  const unverifiedReview = await runConfiguredGate({
    projectRoot: unverifiedReviewRoot,
    phaseId: "phase-one",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: passingReviewer,
  });
  assert.equal(unverifiedReview.record.baseline.status, "needs_rework");
  assert.equal(unverifiedReview.record.phaseTransition, "pause");

  const failed = await runConfiguredGate({
    projectRoot: await makeProject(root, baseConfig),
    phaseId: "phase-one",
    checkRunner: async () => ({ exitCode: 1 }),
    reviewer: async (evidence) => ({ ...evaluateBaseline(evidence), source: "jev", confidence: 0.99 }),
  });
  assert.equal(failed.record.baseline.status, "needs_rework");
  assert.equal(failed.record.phaseTransition, "pause");

  const repairLoopRoot = await makeProject(root, baseConfig, true, "pass", "Initial implementation; the configured check failed.");
  const failedCheck = await runConfiguredGate({
    projectRoot: repairLoopRoot,
    phaseId: "phase-one",
    checkRunner: async () => ({ exitCode: 1 }),
    reviewer: async (evidence) => ({ ...evaluateBaseline(evidence), source: "jev", confidence: 0.99 }),
  });
  assert.equal(failedCheck.record.phaseTransition, "pause");
  assert.equal(failedCheck.phaseState.currentPhase, "uninitialized");
  await writePhaseReview(repairLoopRoot, baseConfig.phases[0], "pass", "Repair applied; the same configured check was rerun and passed.");
  const repairedCheck = await runConfiguredGate({
    projectRoot: repairLoopRoot,
    phaseId: "phase-one",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: async (evidence) => ({ ...evaluateBaseline(evidence), source: "jev", confidence: 0.99 }),
  });
  assert.equal(repairedCheck.record.phaseTransition, "advance");
  assert.equal(repairedCheck.phaseState.currentPhase, "phase-two");

  const confidenceLoopRoot = await makeProject(root, baseConfig, true, "pass", "Evidence before focused review.");
  const lowConfidenceReview = await runConfiguredGate({
    projectRoot: confidenceLoopRoot,
    phaseId: "phase-one",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: async (evidence) => ({ ...evaluateBaseline(evidence), source: "jev", confidence: 0.3 }),
  });
  assert.equal(lowConfidenceReview.record.phaseTransition, "pause");
  await writePhaseReview(confidenceLoopRoot, baseConfig.phases[0], "pass", "Focused follow-up added the missing verification evidence.");
  const focusedReReview = await runConfiguredGate({
    projectRoot: confidenceLoopRoot,
    phaseId: "phase-one",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: async (evidence) => ({ ...evaluateBaseline(evidence), source: "jev", confidence: 0.99 }),
  });
  assert.equal(focusedReReview.record.phaseTransition, "advance");

  const missingScriptRoot = await makeProject(root, {
    ...baseConfig,
    phases: [{ ...baseConfig.phases[0], checks: ["missing-script"] }],
  });
  const missingScript = await runConfiguredGate({
    projectRoot: missingScriptRoot,
    phaseId: "phase-one",
    reviewer: passingReviewer,
  });
  assert.equal(missingScript.checks[0].passed, false);
  assert.equal(missingScript.record.baseline.status, "needs_rework");

  const sampleRoot = await mkdtemp(join(root, "sample-project-"));
  await cp(new URL("../examples/minimal-project/", import.meta.url), sampleRoot, { recursive: true });
  const samplePhaseOne = await runConfiguredGate({
    projectRoot: sampleRoot,
    phaseId: "summary-contract",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: passingReviewer,
  });
  const samplePhaseTwo = await runConfiguredGate({
    projectRoot: sampleRoot,
    phaseId: "summary-display",
    checkRunner: async () => ({ exitCode: 0 }),
    reviewer: passingReviewer,
  });
  assert.equal(samplePhaseOne.record.phaseTransition, "advance");
  assert.equal(samplePhaseTwo.record.phaseTransition, "advance");

  console.log(JSON.stringify({ configValidation: true, checksRun: executed, advance: "phase-one -> phase-two", lowConfidence: "paused, then focused evidence re-review advanced", failedCheck: "needs_rework, then repaired check re-run advanced", missingSelfReview: "paused", unverifiedCriterion: "paused", examplePhases: "both advanced with criterion evidence", passed: true }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
  if (previousThreshold === undefined) delete process.env.JEV_MIN_CONFIDENCE;
  else process.env.JEV_MIN_CONFIDENCE = previousThreshold;
}

async function makeProject(base: string, config: TestConfig, withReview = true, status: "pass" | "unverified" = "pass"): Promise<string> {
  const project = await mkdtemp(join(base, "fixture-"));
  await writeFile(join(project, "package.json"), JSON.stringify({ scripts: { typecheck: "true", test: "true" } }));
  await writeFile(join(project, "workflow.config.json"), JSON.stringify(config));
  if (withReview) await writePhaseReview(project, config.phases[0], status);
  return project;
}

async function withPhaseReview(project: string, phase: TestPhase): Promise<string> {
  await writePhaseReview(project, phase);
  return project;
}

async function writePhaseReview(project: string, phase: TestPhase, status: "pass" | "unverified" = "pass", evidence = "Synthetic evidence"): Promise<void> {
  const directory = join(project, ".agent-workflow/phase-reviews");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `${phase.id}.json`), JSON.stringify({
    schemaVersion: 1,
    phaseId: phase.id,
    summary: `Self-review for ${phase.id}`,
    changedFiles: ["src/example.ts"],
    criteria: phase.acceptanceCriteria.map((criterion) => ({
      criterion,
      status,
      evidence: `${evidence} ${criterion}`,
    })),
  }));
}
