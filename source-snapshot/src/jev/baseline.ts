import type { GateDecision, GateEvidence } from "./types.js";

export function evaluateBaseline(evidence: GateEvidence): GateDecision {
  const failed = evidence.checks.filter((check) => !check.passed);
  const hasHighRisk = evidence.highRiskActionRequested || evidence.externalWriteRequested;

  if (evidence.blockedItems.length > 0) {
    return decision("blocked", "stop", "high", ["A blocking item is present.", ...evidence.blockedItems]);
  }
  if (failed.length > 0) {
    return decision("needs_rework", "repair", "medium", failed.map((check) => `Failed check: ${check.name}`));
  }
  if (hasHighRisk) {
    return decision("passed_with_deferred_items", "ask_user", "high", [
      "Evidence checks passed, but external or high-risk action requires explicit user authorization.",
    ]);
  }
  if (evidence.deferredItems.length > 0) {
    return decision("passed_with_deferred_items", "continue", "low", [
      "Evidence checks passed with explicitly recorded deferred items.",
    ]);
  }
  return decision("passed", "continue", "low", ["All supplied evidence checks passed."]);
}

function decision(
  status: GateDecision["status"],
  nextAction: GateDecision["nextAction"],
  riskLevel: GateDecision["riskLevel"],
  reasons: string[],
): GateDecision {
  return {
    status,
    nextAction,
    riskLevel,
    confidence: 1,
    reasons,
    automaticExecutionAllowed: false,
    source: "deterministic-baseline",
  };
}
