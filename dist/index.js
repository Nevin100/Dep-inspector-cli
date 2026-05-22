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
    .version("2.0.0");
// V1 — existing
function addAnalyzeOptions(cmd) {
    return cmd
        .option("--ai", "Enable AI insights via Groq (optional)")
        .option("--json", "Output as JSON")
        .option("--depth <number>", "Limit dependency tree depth", parseInt);
}
addAnalyzeOptions(program).action((options) => analyzeProject(options));
addAnalyzeOptions(program.command("analyze").description("Analyze dependencies (V1)")).action((options) => analyzeProject(options));
// V2 — new scan commands
program
    .command("scan:secrets")
    .description("Scan for hardcoded secrets, API keys, .env leaks")
    .option("--dir <path>", "Directory to scan", ".")
    .option("--json", "Output as JSON")
    .option("--ai", "AI-powered explanation (optional, needs GROQ_API_KEY)")
    .action((options) => scanSecrets(options));
program
    .command("scan:docker")
    .description("Analyze Dockerfile and docker-compose.yml for issues")
    .option("--file <path>", "Path to Dockerfile", "Dockerfile")
    .option("--compose <path>", "Path to docker-compose file")
    .option("--json", "Output as JSON")
    .action((options) => scanDocker(options));
program
    .command("scan:ci")
    .description("Lint GitHub Actions workflows for security & best practices")
    .option("--dir <path>", "Workflows directory", ".github/workflows")
    .option("--json", "Output as JSON")
    .action((options) => scanCI(options));
program
    .command("scan:ports")
    .description("Check open ports and running processes")
    .option("--json", "Output as JSON")
    .action((options) => scanPorts(options));
program
    .command("scan:logs")
    .description("Check Winston/Morgan logger configuration health")
    .option("--json", "Output as JSON")
    .action((options) => scanLogs(options));
program
    .command("scan:all")
    .description("Run all scans and generate a full report")
    .option("--ai", "AI summary (optional)")
    .option("--json", "Output as JSON")
    .option("--report", "Save HTML report to dep-inspector-report.html")
    .action((options) => scanAll(options));
program.parse();
//# sourceMappingURL=index.js.map