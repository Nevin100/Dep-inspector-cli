import { scanSecrets } from "./scan-secrets.js";
import { scanDocker }  from "./scan-docker.js";
import { scanCI }      from "./scan-ci.js";
import { scanPorts }   from "./scan-ports.js";
import { scanLogs }    from "./scan-logs.js";
import { analyzeProject } from "./analyze.js";
import chalk from "chalk";

export async function scanAll(options: { ai?: boolean; json?: boolean; report?: boolean }) {
  console.log(chalk.bold.magenta("\n🚀 dep-inspector v2 — Full DevOps Scan\n"));
  console.log(chalk.gray("─".repeat(50)));

  const jsonOpt = options.json ? { json: true as const } : {};
  const aiOpt   = options.ai   ? { ai: true as const }   : {};

  await analyzeProject({ ai: false, ...jsonOpt, depth: 2 });
  await scanSecrets({ dir: ".", ...jsonOpt, ...aiOpt });
  await scanDocker({ file: "Dockerfile", ...jsonOpt });
  await scanCI({ dir: ".github/workflows", ...jsonOpt });
  await scanPorts({ ...jsonOpt });
  await scanLogs({ ...jsonOpt });

  console.log(chalk.bold.magenta("\n✅ Full scan complete.\n"));
}