import { experimental_evaluate as evaluate } from "ai";
import { fetch, ProxyAgent } from "undici";
import type { GateDecision, GateEvidence } from "../source-snapshot/src/jev/types.js";

export type JevConfidenceBreakdown = {
  status: number;
  nextAction: number;
  riskLevel: number;
  lowestDimension: "status" | "nextAction" | "riskLevel";
};

export type DiagnosedGateDecision = GateDecision & {
  confidenceByDimension?: JevConfidenceBreakdown;
};

const questions = {
  status: {
    type: "choice" as const,
    instructions: "Classify the phase gate without taking any action.",
    criteria: {
      passed: "All supplied evidence checks passed.",
      passed_with_deferred_items: "Checks passed but work is explicitly deferred.",
      needs_rework: "One or more checks failed and require repair.",
      blocked: "A blocking condition prevents safe continuation.",
    },
  },
  nextAction: {
    type: "choice" as const,
    instructions: "Choose the safest next workflow state.",
    criteria: {
      continue: "Continue with the next low-risk development step.",
      repair: "Repair failed work before continuing.",
      ask_user: "Ask the user because authorization or judgment is required.",
      stop: "Stop because the work is blocked or unsafe.",
    },
  },
  riskLevel: {
    type: "choice" as const,
    instructions: "Classify operational risk.",
    criteria: {
      low: "No material risk is present.",
      medium: "A recoverable development risk is present.",
      high: "External, financial, destructive, or authorization-sensitive risk is present.",
    },
  },
};

type JevChoice = { type?: string; choice?: string; confidence?: number; probabilities?: Record<string, number> };

export async function evaluateWithDiagnostics(evidence: GateEvidence): Promise<DiagnosedGateDecision | undefined> {
  const nativeKey = process.env.JEV_AGENT_KEY;
  if (nativeKey) {
    const payload = await requestNativeJev(evidence, nativeKey);
    return decisionFromAnswers(payload.answers ?? {}, true);
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return undefined;
  void apiKey;
  const result = await evaluate({ model: "typesafe-ai/jev", state: evidence, questions });
  return decisionFromAnswers(result.answers as Record<string, JevChoice>, false);
}

export function getConfidenceBreakdown(values: {
  status: number;
  nextAction: number;
  riskLevel: number;
}): JevConfidenceBreakdown {
  const dimensions = ["status", "nextAction", "riskLevel"] as const;
  const lowestDimension = dimensions.reduce((lowest, current) => values[current] < values[lowest] ? current : lowest);
  return { ...values, lowestDimension };
}

async function requestNativeJev(evidence: GateEvidence, apiKey: string): Promise<{ answers?: Record<string, JevChoice> }> {
  const proxyUrl = process.env.JEV_AGENT_PROXY_URL ?? process.env.BINANCE_WEB3_PROXY_URL;
  const response = await fetch(process.env.JEV_AGENT_BASE_URL ?? "https://jev-agent.com/api/v1/systemone", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.JEV_MODEL ?? "jev-latest", state: evidence, questions }),
    ...(proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {}),
  });
  if (!response.ok) throw new Error(`Native Jev request failed with HTTP ${response.status}`);
  return await response.json() as { answers?: Record<string, JevChoice> };
}

function decisionFromAnswers(answers: Record<string, JevChoice>, native: boolean): DiagnosedGateDecision {
  const status = answers.status;
  const nextAction = answers.nextAction;
  const riskLevel = answers.riskLevel;
  if (status?.type !== "choice" || nextAction?.type !== "choice" || riskLevel?.type !== "choice") {
    throw new Error("Jev returned an invalid phase-gate decision");
  }
  if (!isStatus(status.choice) || !isNextAction(nextAction.choice) || !isRiskLevel(riskLevel.choice)) {
    throw new Error("Jev returned an unknown phase-gate value");
  }

  const confidenceByDimension = getConfidenceBreakdown({
    status: confidence(status, native),
    nextAction: confidence(nextAction, native),
    riskLevel: confidence(riskLevel, native),
  });
  return {
    status: status.choice,
    nextAction: nextAction.choice,
    riskLevel: riskLevel.choice,
    confidence: Math.min(confidenceByDimension.status, confidenceByDimension.nextAction, confidenceByDimension.riskLevel),
    confidenceByDimension,
    reasons: [
      `Structured Jev decision; lowest confidence is ${confidenceByDimension.lowestDimension} (${confidenceByDimension[confidenceByDimension.lowestDimension].toFixed(3)}).`,
    ],
    automaticExecutionAllowed: false,
    source: "jev",
  };
}

function confidence(answer: JevChoice, native: boolean): number {
  if (native) return answer.confidence ?? 0;
  return answer.probabilities ? Math.max(...Object.values(answer.probabilities)) : 0;
}

const isStatus = (value: string | undefined): value is GateDecision["status"] =>
  value === "passed" || value === "passed_with_deferred_items" || value === "needs_rework" || value === "blocked";
const isNextAction = (value: string | undefined): value is GateDecision["nextAction"] =>
  value === "continue" || value === "repair" || value === "ask_user" || value === "stop";
const isRiskLevel = (value: string | undefined): value is GateDecision["riskLevel"] =>
  value === "low" || value === "medium" || value === "high";
