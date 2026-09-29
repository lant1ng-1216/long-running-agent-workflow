#!/usr/bin/env node
import "dotenv/config";
import { access, copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getWorkflowStatus, runConfiguredGate } from "../src/runner.js";

const [command, ...args] = process.argv.slice(2);
const projectRoot = process.cwd();

try {
  if (command === "init") {
    const destination = resolve(projectRoot, "workflow.config.json");
    try {
      await access(destination);
      throw new Error("workflow.config.json already exists; it was not overwritten");
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) throw error;
    }
    const packageRoot = await findPackageRoot();
    await copyFile(resolve(packageRoot, "workflow.config.example.json"), destination);
    try {
      await access(resolve(projectRoot, ".env.example"));
    } catch {
      await copyFile(resolve(packageRoot, ".env.example"), resolve(projectRoot, ".env.example"));
    }
    await mkdir(resolve(projectRoot, ".agent-workflow"), { recursive: true });
    const reviewTemplate = resolve(projectRoot, ".agent-workflow/PHASE_REVIEW.example.json");
    try {
      await access(reviewTemplate);
    } catch {
      await copyFile(resolve(packageRoot, "templates/PHASE_REVIEW.example.json"), reviewTemplate);
    }
    await mkdir(resolve(projectRoot, ".agent-workflow/phase-reviews"), { recursive: true });
    console.log("Created workflow.config.json and local workflow templates/state folders. Edit the phases and self-review evidence before running a gate.");
  } else if (command === "status") {
    console.log(JSON.stringify(await getWorkflowStatus(projectRoot), null, 2));
  } else if (command === "gate") {
    const phaseId = readFlag(args, "--phase");
    if (!phaseId) throw new Error("Usage: agent-workflow gate --phase <phase-id>");
    const result = await runConfiguredGate({ projectRoot, phaseId });
    console.log(JSON.stringify({
      phase: result.phase,
      checks: result.checks,
      criterionAssessments: result.criterionAssessments,
      selfReviewError: result.selfReviewError,
      jevAvailable: Boolean(result.record.jev),
      jevStatus: result.record.jev?.status,
      jevConfidence: result.record.jev?.confidence,
      jevConfidenceByDimension: result.jevConfidenceByDimension,
      jevReasons: result.record.jev?.reasons,
      phaseTransition: result.record.phaseTransition,
      phaseState: result.phaseState,
      transitionReason: result.record.transitionReason,
      actionTaken: result.record.actionTaken,
    }, null, 2));
    if (result.record.phaseTransition !== "advance") process.exitCode = 2;
  } else {
    printHelp();
    if (command && command !== "--help") process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
}

function printHelp(): void {
  console.log(`Agent Workflow\n\nCommands (run from the target project root):\n  agent-workflow init\n  agent-workflow status\n  agent-workflow gate --phase <phase-id>\n\nThe gate runs only configured npm scripts and requires evidence for every acceptance criterion at .agent-workflow/phase-reviews/<phase-id>.json.`);
}

async function findPackageRoot(): Promise<string> {
  const moduleDirectory = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [resolve(moduleDirectory, ".."), resolve(moduleDirectory, "../..")]) {
    try {
      await access(resolve(candidate, "workflow.config.example.json"));
      return candidate;
    } catch {
      // The compiled CLI lives one directory deeper than the source entry point.
    }
  }
  throw new Error("Cannot locate workflow.config.example.json next to the toolkit CLI");
}
