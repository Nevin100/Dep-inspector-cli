#!/usr/bin/env node
import { Command } from "commander";
import { analyzeProject } from "./commands/analyze.js";
const program = new Command();
// Dependency Inspector CLI
program
    .name("dep-inspector")
    .description("Advanced dependency analyzer CLI");
// Analyze command with optional AI insights
program
    .command("analyze")
    .option("--ai", "Enable AI insights")
    .action((options) => analyzeProject(options));
program.parse();
//# sourceMappingURL=index.js.map