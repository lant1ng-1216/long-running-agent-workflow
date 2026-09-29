export type GateStatus = "passed" | "passed_with_deferred_items" | "needs_rework" | "blocked";
export type NextAction = "continue" | "repair" | "ask_user" | "stop";
export type RiskLevel = "low" | "medium" | "high";

export type GateEvidence = {
  phase: string;
  nextPhase?: string;
  objective: string;
  checks: Array<{ name: string; passed: boolean; evidence?: string }>;
  deferredItems: string[];
  blockedItems: string[];
  externalWriteRequested: boolean;
  highRiskActionRequested: boolean;
};

export type GateDecision = {
  status: GateStatus;
  nextAction: NextAction;
  riskLevel: RiskLevel;
  confidence: number;
  reasons: string[];
  automaticExecutionAllowed: false;
  source: "deterministic-baseline" | "jev";
};

export type ShadowDecisionRecord = {
  recordedAt: string;
  mode: "shadow";
  evidence: GateEvidence;
  baseline: GateDecision;
  jev?: GateDecision;
  agreement?: boolean;
  durationMs: number;
  phaseTransition: "advance" | "pause";
  transitionReason: string;
  provider: "native-jev" | "vercel-ai-gateway" | "deterministic-fallback";
  actionTaken: "none";
};
