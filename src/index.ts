#!/usr/bin/env node

import { Command } from "commander";
import { analyzeProject } from "./commands/analyze.js";
import { scanSecrets } from "./commands/scan-secrets.js";
import { scanDocker } from "./commands/scan-docker.js";
import { scanCI } from "./commands/scan-ci.js";
import { scanPorts } from "./commands/scan-ports.js";
import { scanLogs } from "./commands/scan-logs.js";
import { scanAll } from "./commands/scan-all.js";

const program = new Command();

program
  .name("dep-inspector")
  .description("DevOps-grade dependency & security toolkit")
  .version("2.1.0");

// V1 — existing
function addAnalyzeOptions(cmd: Command) {
  return cmd
    .option("--ai", "Enable AI insights via Groq (optional)")
    .option("--json", "Output as JSON")
    .option("--depth <number>", "Limit dependency tree depth", parseInt)
    .option("--fail-on <level>", "Exit 1 if findings at/above severity (high|medium|low)");
}
addAnalyzeOptions(program).action(async (options) => { await analyzeProject(options); });
addAnalyzeOptions(
  program.command("analyze").description("Analyze dependencies (V1)")
).action(async (options) => { await analyzeProject(options); });

// V2 — new scan commands
program
  .command("scan:secrets")
  .description("Scan for hardcoded secrets, API keys, .env leaks")
  .option("--dir <path>", "Directory to scan", ".")
  .option("--json", "Output as JSON")
  .option("--ai", "AI-powered explanation (optional, needs GROQ_API_KEY)")
  .option("--fail-on <level>", "Exit 1 if findings at/above severity (high|medium|low)")
  .action(async (options) => { await scanSecrets(options); });

program
  .command("scan:docker")
  .description("Analyze Dockerfile for security issues")
  .option("--file <path>", "Path to Dockerfile", "Dockerfile")
  .option("--json", "Output as JSON")
  .option("--fail-on <level>", "Exit 1 if findings at/above severity (high|medium|low)")
  .action(async (options) => { await scanDocker(options); });

program
  .command("scan:ci")
  .description("Lint GitHub Actions workflows for security & best practices")
  .option("--dir <path>", "Workflows directory", ".github/workflows")
  .option("--json", "Output as JSON")
  .option("--fail-on <level>", "Exit 1 if findings at/above severity (high|medium|low)")
  .action(async (options) => { await scanCI(options); });

program
  .command("scan:ports")
  .description("Check open ports and running processes")
  .option("--json", "Output as JSON")
  .action(async (options) => { await scanPorts(options); });

program
  .command("scan:logs")
  .description("Check Winston/Morgan logger configuration health")
  .option("--json", "Output as JSON")
  .action(async (options) => { await scanLogs(options); });

program
  .command("scan:all")
  .description("Run all scans and generate a full report")
  .option("--ai", "AI summary (optional)")
  .option("--json", "Output as JSON")
  .option("--fail-on <level>", "Exit 1 if findings at/above severity (high|medium|low)")
  .action(async (options) => { await scanAll(options); });

program.parse();
