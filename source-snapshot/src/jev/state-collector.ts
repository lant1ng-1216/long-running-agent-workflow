import { readFile } from "node:fs/promises";
import type { GateEvidence } from "./types.js";

export type ProjectStateInput = {
  phase: string;
  nextPhase?: string;
  objective: string;
  checks: Array<{ name: string; passed: boolean; evidence?: string }>;
  deferredItems?: string[];
  blockedItems?: string[];
  externalWriteRequested?: boolean;
  highRiskActionRequested?: boolean;
};

export async function readProjectState(path: string): Promise<GateEvidence> {
  const raw = JSON.parse(await readFile(path, "utf8")) as ProjectStateInput;
  if (!raw.phase || !raw.objective || !Array.isArray(raw.checks)) {
    throw new Error("Project state must include phase, objective, and checks");
  }
  return {
    phase: raw.phase,
    nextPhase: raw.nextPhase,
    objective: raw.objective,
    checks: raw.checks,
    deferredItems: raw.deferredItems ?? [],
    blockedItems: raw.blockedItems ?? [],
    externalWriteRequested: raw.externalWriteRequested ?? false,
    highRiskActionRequested: raw.highRiskActionRequested ?? false,
  };
}
