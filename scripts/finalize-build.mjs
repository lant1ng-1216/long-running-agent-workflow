import { chmod } from "node:fs/promises";

await chmod(new URL("../dist/bin/agent-workflow.js", import.meta.url), 0o755);
