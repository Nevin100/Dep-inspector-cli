#!/usr/bin/env node
import { Command } from "commander";
import { analyzeProject } from "./commands/analyze.js";
const program = new Command();
program
    .name("dep-inspector")
    .description("Advanced dependency analyzer with AI-powered insights")
    .version("1.0.0");
// Shared options for both default and analyze command
function addOptions(cmd) {
    return cmd
        .option("--ai", "Enable AI insights via Groq")
        .option("--json", "Output results as JSON (useful for CI/CD)")
        .option("--depth <number>", "Limit dependency tree depth", parseInt);
}
// Default action — runs when user just types: dep-inspector
addOptions(program).action((options) => analyzeProject(options));
// Explicit analyze subcommand — dep-inspector analyze
addOptions(program.command("analyze").description("Analyze project dependencies")).action((options) => analyzeProject(options));
program.parse();
//# sourceMappingURL=index.js.map