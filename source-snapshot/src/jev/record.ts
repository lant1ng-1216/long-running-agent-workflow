import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { ShadowDecisionRecord } from "./types.js";

export async function writeShadowDecisionRecord(path: string, record: ShadowDecisionRecord): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(record)}\n`, "utf8");
}
