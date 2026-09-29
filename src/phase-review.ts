import { readFile } from "node:fs/promises";
import type { WorkflowPhase } from "./config.js";

export type CriterionAssessment = {
  criterion: string;
  status: "pass" | "fail" | "unverified";
  evidence: string;
};

export type PhaseReviewReport = {
  schemaVersion: 1;
  phaseId: string;
  summary: string;
  changedFiles: string[];
  criteria: CriterionAssessment[];
};

export type PhaseReviewLoad = {
  report?: PhaseReviewReport;
  error?: string;
};

export async function loadPhaseReview(path: string, phase: WorkflowPhase): Promise<PhaseReviewLoad> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
    return { error: code === "ENOENT" ? "No self-review file exists at the configured phase path." : `Cannot read phase self-review (filesystem error: ${code}).` };
  }

  if (!isObject(value) || value.schemaVersion !== 1) return { error: "Phase self-review must use schemaVersion 1." };
  if (value.phaseId !== phase.id) return { error: `Phase self-review is for ${String(value.phaseId)}, not ${phase.id}.` };
  if (typeof value.summary !== "string" || value.summary.trim() === "") return { error: "Phase self-review summary must be non-empty." };
  if (!Array.isArray(value.changedFiles) || value.changedFiles.some((item) => typeof item !== "string" || item.trim() === "")) {
    return { error: "Phase self-review changedFiles must be an array of non-empty strings." };
  }
  if (!Array.isArray(value.criteria)) return { error: "Phase self-review criteria must be an array." };

  const assessments = new Map<string, CriterionAssessment>();
  for (const candidate of value.criteria) {
    if (!isObject(candidate) || typeof candidate.criterion !== "string" || typeof candidate.evidence !== "string" || candidate.evidence.trim() === "") {
      return { error: "Each criterion assessment must include criterion and non-empty evidence." };
    }
    if (candidate.status !== "pass" && candidate.status !== "fail" && candidate.status !== "unverified") {
      return { error: `Invalid self-review status for criterion: ${candidate.criterion}` };
    }
    if (assessments.has(candidate.criterion)) return { error: `Duplicate criterion assessment: ${candidate.criterion}` };
    assessments.set(candidate.criterion, {
      criterion: candidate.criterion,
      status: candidate.status,
      evidence: candidate.evidence,
    });
  }

  const unknown = [...assessments.keys()].filter((criterion) => !phase.acceptanceCriteria.includes(criterion));
  if (unknown.length > 0) return { error: `Self-review contains criteria not in the approved phase: ${unknown.join("; ")}` };
  const missing = phase.acceptanceCriteria.filter((criterion) => !assessments.has(criterion));
  if (missing.length > 0) return { error: `Self-review is missing ${missing.length} acceptance criterion assessment(s).` };

  return {
    report: {
      schemaVersion: 1,
      phaseId: phase.id,
      summary: value.summary,
      changedFiles: value.changedFiles as string[],
      criteria: phase.acceptanceCriteria.map((criterion) => assessments.get(criterion)!),
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
