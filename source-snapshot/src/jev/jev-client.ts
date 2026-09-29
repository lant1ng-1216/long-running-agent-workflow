import { experimental_evaluate as evaluate } from "ai";
import { fetch, ProxyAgent } from "undici";
import type { GateDecision, GateEvidence } from "./types.js";

export async function evaluateWithJev(evidence: GateEvidence): Promise<GateDecision | undefined> {
  const nativeKey = process.env.JEV_AGENT_KEY;
  if (nativeKey) return evaluateNativeJev(evidence, nativeKey);

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return undefined;
  void apiKey;

  const result = await evaluate({
    model: "typesafe-ai/jev",
    state: evidence,
    questions: {
      status: {
        type: "choice",
        instructions: "Classify the phase gate without taking any action.",
        criteria: {
          passed: "All supplied evidence checks passed.",
          passed_with_deferred_items: "Checks passed but work is explicitly deferred.",
          needs_rework: "One or more checks failed and require repair.",
          blocked: "A blocking condition prevents safe continuation.",
        },
      },
      nextAction: {
        type: "choice",
        instructions: "Choose the safest next workflow state.",
        criteria: {
          continue: "Continue with the next low-risk development step.",
          repair: "Repair failed work before continuing.",
          ask_user: "Ask the user because authorization or judgment is required.",
          stop: "Stop because the work is blocked or unsafe.",
        },
      },
      riskLevel: {
        type: "choice",
        instructions: "Classify operational risk.",
        criteria: {
          low: "No material risk is present.",
          medium: "A recoverable development risk is present.",
          high: "External, financial, destructive, or authorization-sensitive risk is present.",
        },
      },
    },
  });

  const statusAnswer = result.answers.status;
  const nextActionAnswer = result.answers.nextAction;
  const riskAnswer = result.answers.riskLevel;
  if (statusAnswer.type !== "choice" || nextActionAnswer.type !== "choice" || riskAnswer.type !== "choice") {
    throw new Error("Jev returned a non-choice answer for a choice question");
  }
  const status = statusAnswer.choice;
  const nextAction = nextActionAnswer.choice;
  const riskLevel = riskAnswer.choice;
  if (!isStatus(status) || !isNextAction(nextAction) || !isRiskLevel(riskLevel)) {
    throw new Error("Jev returned an invalid phase-gate decision");
  }

  return {
    status,
    nextAction,
    riskLevel,
    confidence: Math.min(
      maxProbability(statusAnswer.probabilities),
      maxProbability(nextActionAnswer.probabilities),
      maxProbability(riskAnswer.probabilities),
    ),
    reasons: ["Structured Jev shadow decision; no action was taken."],
    automaticExecutionAllowed: false,
    source: "jev",
  };
}

async function evaluateNativeJev(evidence: GateEvidence, apiKey: string): Promise<GateDecision> {
  const proxyUrl = process.env.JEV_AGENT_PROXY_URL ?? process.env.BINANCE_WEB3_PROXY_URL;
  const response = await fetch(process.env.JEV_AGENT_BASE_URL ?? "https://jev-agent.com/api/v1/systemone", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.JEV_MODEL ?? "jev-latest",
      state: evidence,
      questions: {
        status: {
          type: "choice",
          instructions: "Classify the phase gate without taking any action.",
          criteria: {
            passed: "All supplied evidence checks passed.",
            passed_with_deferred_items: "Checks passed but work is explicitly deferred.",
            needs_rework: "One or more checks failed and require repair.",
            blocked: "A blocking condition prevents safe continuation.",
          },
        },
        nextAction: {
          type: "choice",
          instructions: "Choose the safest next workflow state.",
          criteria: {
            continue: "Continue with the next low-risk development step.",
            repair: "Repair failed work before continuing.",
            ask_user: "Ask the user because authorization or judgment is required.",
            stop: "Stop because the work is blocked or unsafe.",
          },
        },
        riskLevel: {
          type: "choice",
          instructions: "Classify operational risk.",
          criteria: {
            low: "No material risk is present.",
            medium: "A recoverable development risk is present.",
            high: "External, financial, destructive, or authorization-sensitive risk is present.",
          },
        },
      },
    }),
    ...(proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {}),
  });
  if (!response.ok) throw new Error(`Native Jev request failed with HTTP ${response.status}`);
  const payload = (await response.json()) as { answers?: Record<string, { type?: string; choice?: string; confidence?: number }> };
  const status = payload.answers?.status;
  const nextAction = payload.answers?.nextAction;
  const riskLevel = payload.answers?.riskLevel;
  if (status?.type !== "choice" || nextAction?.type !== "choice" || riskLevel?.type !== "choice") {
    throw new Error("Native Jev returned an invalid phase-gate decision");
  }
  if (!isStatus(status.choice) || !isNextAction(nextAction.choice) || !isRiskLevel(riskLevel.choice)) {
    throw new Error("Native Jev returned an unknown phase-gate value");
  }
  return {
    status: status.choice,
    nextAction: nextAction.choice,
    riskLevel: riskLevel.choice,
    confidence: Math.min(status.confidence ?? 0, nextAction.confidence ?? 0, riskLevel.confidence ?? 0),
    reasons: ["Native Jev shadow decision; no action was taken."],
    automaticExecutionAllowed: false,
    source: "jev",
  };
}

function maxProbability(probabilities: Record<string, number> | undefined): number {
  return probabilities ? Math.max(...Object.values(probabilities)) : 0;
}

const isStatus = (value: string | undefined): value is GateDecision["status"] =>
  value === "passed" || value === "passed_with_deferred_items" || value === "needs_rework" || value === "blocked";
const isNextAction = (value: string | undefined): value is GateDecision["nextAction"] =>
  value === "continue" || value === "repair" || value === "ask_user" || value === "stop";
const isRiskLevel = (value: string | undefined): value is GateDecision["riskLevel"] =>
  value === "low" || value === "medium" || value === "high";
