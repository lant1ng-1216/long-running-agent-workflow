import { readFile, writeFile } from "node:fs/promises";
import type { ShadowDecisionRecord } from "./types.js";

export type PhaseState = {
  currentPhase: string;
  lastDecisionAt?: string;
  lastTransition?: ShadowDecisionRecord["phaseTransition"];
  nextPhase?: string;
  lastReason?: string;
};

export async function advancePhaseState(path: string, record: ShadowDecisionRecord): Promise<PhaseState> {
  const current = await readPhaseState(path);
  const next = record.phaseTransition === "advance" ? record.evidence.nextPhase : current.nextPhase;
  const state: PhaseState = {
    currentPhase: record.phaseTransition === "advance" && next ? next : current.currentPhase,
    lastDecisionAt: record.recordedAt,
    lastTransition: record.phaseTransition,
    nextPhase: next,
    lastReason: record.transitionReason,
  };
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

async function readPhaseState(path: string): Promise<PhaseState> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as PhaseState;
  } catch {
    return { currentPhase: "uninitialized" };
  }
}
