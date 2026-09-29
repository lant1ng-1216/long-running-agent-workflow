import { appendFile } from "node:fs/promises";
import type { ShadowDecisionRecord } from "./types.js";

export async function appendGateReportEntry(
  record: ShadowDecisionRecord,
  technicalReportPath: string,
  productReportPath: string,
): Promise<void> {
  const entry = [
    "",
    `### Jev phase-gate record — ${record.recordedAt}`,
    `- Phase: \`${record.evidence.phase}\``,
    `- Jev provider: \`${record.provider}\``,
    `- Baseline: \`${record.baseline.status}\` / \`${record.baseline.nextAction}\` / risk \`${record.baseline.riskLevel}\``,
    `- Jev: ${record.jev ? `\`${record.jev.status}\` / \`${record.jev.nextAction}\` / risk \`${record.jev.riskLevel}\` / confidence \`${record.jev.confidence.toFixed(3)}\`` : "unavailable"}`,
    `- Agreement: \`${record.agreement ?? "unknown"}\``,
    `- Latency: \`${record.durationMs} ms\``,
    `- Phase transition: \`${record.phaseTransition}\``,
    `- Transition reason: ${record.transitionReason}`,
    `- Action taken: \`${record.actionTaken}\``,
    "- Safety note: Jev does not control Codex and no external write was authorized.",
    "",
  ].join("\n");
  await appendFile(technicalReportPath, entry, "utf8");
  await appendFile(productReportPath, entry, "utf8");
}
