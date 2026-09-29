import { evaluateBaseline } from "./baseline.js";
import { evaluateWithJev } from "./jev-client.js";
import type { GateEvidence, ShadowDecisionRecord } from "./types.js";

export async function runShadowGate(
  evidence: GateEvidence,
  evaluator: typeof evaluateWithJev = evaluateWithJev,
): Promise<ShadowDecisionRecord> {
  const startedAt = Date.now();
  const baseline = evaluateBaseline(evidence);
  let jev;
  try {
    jev = await evaluator(evidence);
  } catch (error) {
    jev = undefined;
    console.warn(`Jev shadow call unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  return {
    recordedAt: new Date().toISOString(),
    mode: "shadow",
    evidence,
    baseline,
    jev,
    agreement: jev ? baseline.status === jev.status && baseline.nextAction === jev.nextAction : undefined,
    durationMs: Date.now() - startedAt,
    phaseTransition: canAdvance(evidence, baseline, jev) ? "advance" : "pause",
    transitionReason: transitionReason(evidence, baseline, jev),
    provider: jev ? (process.env.JEV_AGENT_KEY ? "native-jev" : "vercel-ai-gateway") : "deterministic-fallback",
    actionTaken: "none",
  };
}

export function isLowRiskContinuation(decision: ShadowDecisionRecord["baseline"] | undefined): boolean {
  return Boolean(
    decision &&
    (decision.status === "passed" || decision.status === "passed_with_deferred_items") &&
    decision.nextAction === "continue" &&
    decision.riskLevel === "low",
  );
}

function canAdvance(evidence: GateEvidence, baseline: ShadowDecisionRecord["baseline"], jev: ShadowDecisionRecord["jev"]): boolean {
  return Boolean(
    jev &&
    isLowRiskContinuation(baseline) &&
    isLowRiskContinuation(jev) &&
    jev.confidence >= Number(process.env.JEV_MIN_CONFIDENCE ?? "0.85") &&
    evidence.externalWriteRequested === false &&
    evidence.highRiskActionRequested === false,
  );
}

function transitionReason(evidence: GateEvidence, baseline: ShadowDecisionRecord["baseline"], jev: ShadowDecisionRecord["jev"]): string {
  if (!jev) return "Jev unavailable; remain paused and use the deterministic result for observation only.";
  if (!isLowRiskContinuation(baseline) || !isLowRiskContinuation(jev)) return "Both baseline and Jev must authorize low-risk continuation, allowing explicitly recorded deferred items.";
  if (baseline.nextAction !== "continue" || jev.nextAction !== "continue") return "Both baseline and Jev must authorize low-risk continuation.";
  if (baseline.riskLevel !== "low" || jev.riskLevel !== "low") return "High or medium risk requires a pause.";
  if (evidence.externalWriteRequested || evidence.highRiskActionRequested) return "External or high-risk action requires a pause.";
  if (jev.confidence < Number(process.env.JEV_MIN_CONFIDENCE ?? "0.85")) return "Jev confidence is below the configured threshold.";
  return "Baseline and Jev agree on a low-risk continuation.";
}
