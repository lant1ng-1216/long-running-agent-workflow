import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { advancePhaseState } from "../source-snapshot/src/jev/phase-state.js";
import { writeShadowDecisionRecord } from "../source-snapshot/src/jev/record.js";
import { runShadowGate } from "../source-snapshot/src/jev/shadow-gate.js";
import type { GateDecision, GateEvidence, ShadowDecisionRecord } from "../source-snapshot/src/jev/types.js";
import { loadWorkflowConfig, resolveProjectPath, type WorkflowConfig } from "./config.js";
import { loadPhaseReview, type CriterionAssessment } from "./phase-review.js";
import { evaluateWithDiagnostics, type DiagnosedGateDecision, type JevConfidenceBreakdown } from "./jev-adapter.js";

export type CheckResult = { exitCode: number };
export type CheckRunner = (script: string, projectRoot: string) => Promise<CheckResult>;
export type Reviewer = (evidence: GateEvidence) => Promise<GateDecision | undefined>;

export type GateResult = {
  phase: string;
  checks: Array<{ name: string; passed: boolean; evidence: string }>;
  criterionAssessments: CriterionAssessment[];
  selfReviewError?: string;
  jevConfidenceByDimension?: JevConfidenceBreakdown;
  record: ShadowDecisionRecord;
  phaseState: Awaited<ReturnType<typeof advancePhaseState>>;
};

export async function runConfiguredGate(options: {
  projectRoot: string;
  phaseId: string;
  checkRunner?: CheckRunner;
  reviewer?: Reviewer;
}): Promise<GateResult> {
  const projectRoot = resolve(options.projectRoot);
  const config = await loadWorkflowConfig(projectRoot);
  const index = config.phases.findIndex((phase) => phase.id === options.phaseId);
  if (index < 0) throw new Error(`Phase not found in workflow.config.json: ${options.phaseId}`);
  const phase = config.phases[index];
  const current = await readCurrentPhase(projectRoot, config);
  const expected = current === "uninitialized" ? config.phases[0].id : current;
  if (phase.id !== expected) throw new Error(`Cannot run ${phase.id}; the current approved phase is ${expected}`);

  const packageScripts = await readPackageScripts(projectRoot);
  const missing = phase.checks.filter((name) => typeof packageScripts[name] !== "string");
  const execute = options.checkRunner ?? runNpmScript;
  const checks = [];
  for (const name of [...new Set(phase.checks)]) {
    if (missing.includes(name)) {
      checks.push({ name, passed: false, evidence: `No npm script named ${name} exists in this project.` });
      continue;
    }
    const result = await execute(name, projectRoot);
    checks.push({ name, passed: result.exitCode === 0, evidence: `npm run ${name} exited ${result.exitCode}` });
  }

  const phaseReviewsDir = resolveProjectPath(projectRoot, config.storage?.phaseReviewsDir, ".agent-workflow/phase-reviews");
  const reviewPath = resolve(phaseReviewsDir, `${phase.id}.json`);
  const reviewLoad = await loadPhaseReview(reviewPath, phase);
  const criterionAssessments = reviewLoad.report?.criteria ?? phase.acceptanceCriteria.map((criterion) => ({
    criterion,
    status: "unverified" as const,
    evidence: reviewLoad.error ?? "No phase self-review was supplied.",
  }));
  const criteriaChecks = criterionAssessments.map((assessment, index) => ({
    name: `acceptance-criterion-${String(index + 1).padStart(2, "0")}`,
    passed: assessment.status === "pass",
    evidence: `${assessment.criterion} — ${assessment.status}. ${assessment.evidence}`,
  }));
  const selfReviewCheck = reviewLoad.error
    ? [{ name: "phase-self-review", passed: false, evidence: reviewLoad.error }]
    : [];

  const nextPhase = config.phases[index + 1]?.id ?? "complete";
  const evidence: GateEvidence & {
    acceptanceCriteria: string[];
    criterionAssessments: CriterionAssessment[];
    agentSummary: string;
    changedFiles: string[];
  } = {
    phase: phase.id,
    nextPhase,
    objective: phase.objective,
    checks: [...checks, ...criteriaChecks, ...selfReviewCheck],
    acceptanceCriteria: phase.acceptanceCriteria,
    criterionAssessments,
    agentSummary: reviewLoad.report?.summary ?? "No phase self-review was supplied.",
    changedFiles: reviewLoad.report?.changedFiles ?? [],
    deferredItems: phase.deferredItems ?? [],
    blockedItems: phase.blockedItems ?? [],
    externalWriteRequested: phase.externalWriteRequested ?? false,
    highRiskActionRequested: phase.highRiskActionRequested ?? false,
  };
  const record = await runShadowGate(evidence, options.reviewer ?? evaluateWithDiagnostics);
  const recordPath = resolveProjectPath(projectRoot, config.storage?.reviewLogPath, ".agent-workflow/reviews.jsonl");
  const phaseStatePath = resolveProjectPath(projectRoot, config.storage?.phaseStatePath, ".agent-workflow/phase-state.json");
  await writeShadowDecisionRecord(recordPath, record);
  const phaseState = await advancePhaseState(phaseStatePath, record);
  const jevConfidenceByDimension = (record.jev as DiagnosedGateDecision | undefined)?.confidenceByDimension;
  return { phase: phase.id, checks, criterionAssessments, selfReviewError: reviewLoad.error, jevConfidenceByDimension, record, phaseState };
}

export async function getWorkflowStatus(projectRoot: string): Promise<{
  projectName: string;
  currentPhase: string;
  lastTransition?: string;
  lastReason?: string;
}> {
  const config = await loadWorkflowConfig(projectRoot);
  const current = await readCurrentPhase(projectRoot, config);
  const statePath = resolveProjectPath(projectRoot, config.storage?.phaseStatePath, ".agent-workflow/phase-state.json");
  let state: { lastTransition?: string; lastReason?: string } = {};
  try {
    state = JSON.parse(await readFile(statePath, "utf8")) as typeof state;
  } catch {
    // No decision has been recorded yet.
  }
  return { projectName: config.projectName, currentPhase: current, ...state };
}

async function readCurrentPhase(projectRoot: string, config: WorkflowConfig): Promise<string> {
  const statePath = resolveProjectPath(projectRoot, config.storage?.phaseStatePath, ".agent-workflow/phase-state.json");
  try {
    const state = JSON.parse(await readFile(statePath, "utf8")) as { currentPhase?: unknown };
    if (typeof state.currentPhase === "string" && state.currentPhase) return state.currentPhase;
  } catch {
    // The first phase is current before the first gate run.
  }
  return "uninitialized";
}

async function readPackageScripts(projectRoot: string): Promise<Record<string, unknown>> {
  const packagePath = resolve(projectRoot, "package.json");
  let pkg: unknown;
  try {
    pkg = JSON.parse(await readFile(packagePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read project package.json: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof pkg !== "object" || pkg === null || Array.isArray(pkg)) throw new Error("Project package.json must be an object");
  const scripts = (pkg as { scripts?: unknown }).scripts;
  if (typeof scripts !== "object" || scripts === null || Array.isArray(scripts)) return {};
  return scripts as Record<string, unknown>;
}

function runNpmScript(script: string, projectRoot: string): Promise<CheckResult> {
  return new Promise((resolveResult) => {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(command, ["run", script], { cwd: projectRoot, stdio: "inherit" });
    child.once("error", () => resolveResult({ exitCode: 1 }));
    child.once("exit", (code) => resolveResult({ exitCode: code ?? 1 }));
  });
}
