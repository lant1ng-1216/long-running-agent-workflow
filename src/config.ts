import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

export type WorkflowPhase = {
  id: string;
  objective: string;
  acceptanceCriteria: string[];
  checks: string[];
  deferredItems?: string[];
  blockedItems?: string[];
  externalWriteRequested?: boolean;
  highRiskActionRequested?: boolean;
};

export type WorkflowConfig = {
  schemaVersion: 1;
  projectName: string;
  storage?: {
    phaseStatePath?: string;
    reviewLogPath?: string;
    phaseReviewsDir?: string;
  };
  phases: WorkflowPhase[];
};

export async function loadWorkflowConfig(projectRoot: string): Promise<WorkflowConfig> {
  const path = resolve(projectRoot, "workflow.config.json");
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read workflow.config.json: ${message(error)}`);
  }
  return validateWorkflowConfig(value);
}

export function validateWorkflowConfig(value: unknown): WorkflowConfig {
  if (!isObject(value) || value.schemaVersion !== 1) {
    throw new Error("workflow.config.json must use schemaVersion 1");
  }
  if (typeof value.projectName !== "string" || value.projectName.trim().length === 0) {
    throw new Error("projectName must be a non-empty string");
  }
  if (!Array.isArray(value.phases) || value.phases.length === 0) {
    throw new Error("phases must contain at least one approved phase");
  }

  const ids = new Set<string>();
  for (const [index, candidate] of value.phases.entries()) {
    if (!isObject(candidate)) throw new Error(`phases[${index}] must be an object`);
    const phase = candidate as Record<string, unknown>;
    if (typeof phase.id !== "string" || !/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(phase.id)) {
      throw new Error(`phases[${index}].id is invalid`);
    }
    if (ids.has(phase.id)) throw new Error(`Duplicate phase ID: ${phase.id}`);
    ids.add(phase.id);
    if (typeof phase.objective !== "string" || phase.objective.trim().length === 0) {
      throw new Error(`phases[${index}].objective must be a non-empty string`);
    }
    requireStringArray(phase.acceptanceCriteria, `phases[${index}].acceptanceCriteria`, false);
    if (new Set(phase.acceptanceCriteria as string[]).size !== (phase.acceptanceCriteria as string[]).length) {
      throw new Error(`phases[${index}].acceptanceCriteria must not contain duplicates`);
    }
    requireStringArray(phase.checks, `phases[${index}].checks`, false);
    requireStringArray(phase.deferredItems, `phases[${index}].deferredItems`, true, true);
    requireStringArray(phase.blockedItems, `phases[${index}].blockedItems`, true, true);
    for (const flag of ["externalWriteRequested", "highRiskActionRequested"]) {
      if (phase[flag] !== undefined && typeof phase[flag] !== "boolean") {
        throw new Error(`phases[${index}].${flag} must be a boolean`);
      }
    }
  }

  const storage = isObject(value.storage) ? value.storage : {};
  for (const key of ["phaseStatePath", "reviewLogPath", "phaseReviewsDir"]) {
    const path = storage[key];
    if (path !== undefined && (typeof path !== "string" || !isSafeRelativePath(path))) {
      throw new Error(`storage.${key} must be a relative path inside the project`);
    }
  }

  return value as WorkflowConfig;
}

export function resolveProjectPath(projectRoot: string, configuredPath: string | undefined, fallback: string): string {
  const path = configuredPath ?? fallback;
  if (!isSafeRelativePath(path)) throw new Error(`Path must stay inside the project: ${path}`);
  const absolute = resolve(projectRoot, path);
  const rel = relative(resolve(projectRoot), absolute);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Path must stay inside the project: ${path}`);
  return absolute;
}

function requireStringArray(value: unknown, label: string, allowEmpty: boolean, optional = false): void {
  if (optional && value === undefined) return;
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${label} must be ${allowEmpty ? "an array of strings" : "a non-empty array of strings"}`);
  }
}

function isSafeRelativePath(path: string): boolean {
  return path.length > 0 && !isAbsolute(path) && !path.split(/[\\/]/).includes("..");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
