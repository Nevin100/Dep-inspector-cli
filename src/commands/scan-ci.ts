import fs from "fs";
import path from "path";
import chalk from "chalk";

interface CIIssue {
  file: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
}

function analyzeWorkflow(filePath: string, content: string): CIIssue[] {
  const issues: CIIssue[] = [];

  // 1. Hardcoded secrets in YAML
  if (/password:|secret:|api_key:/i.test(content) && !content.includes("${{")) {
    issues.push({ file: filePath, severity: "HIGH", message: "Possible hardcoded secret in workflow (use ${{ secrets.X }})" });
  }

  // 2. Using deprecated set-output command
  if (content.includes("::set-output")) {
    issues.push({ file: filePath, severity: "HIGH", message: "Deprecated '::set-output' command used — replace with $GITHUB_OUTPUT" });
  }

  // 3. pull_request_target with checkout — dangerous
  if (content.includes("pull_request_target") && content.includes("actions/checkout")) {
    issues.push({ file: filePath, severity: "HIGH", message: "pull_request_target + actions/checkout is a security risk (privilege escalation)" });
  }

  // 4. Pinned action versions
  if (/uses:\s+\S+@(main|master|latest)/i.test(content)) {
    issues.push({ file: filePath, severity: "MEDIUM", message: "Actions using @main/@master/@latest — pin to a specific commit SHA or version" });
  }

  // 5. No cache step
  if (!content.includes("actions/cache") && !content.includes("cache: 'npm'")) {
    issues.push({ file: filePath, severity: "LOW", message: "No caching configured — builds will be slow (add actions/cache for node_modules)" });
  }

  // 6. No timeout-minutes
  if (!content.includes("timeout-minutes")) {
    issues.push({ file: filePath, severity: "LOW", message: "No timeout-minutes set — stuck jobs can run indefinitely" });
  }

  return issues;
}

export async function scanCI(options: { dir: string; json?: boolean }) {
  const workflowDir = options.dir;
  const allIssues: CIIssue[] = [];

  if (!fs.existsSync(workflowDir)) {
    console.log(chalk.yellow(`⚠️  No workflows directory found at ${workflowDir}`));
    return;
  }

  const files = fs.readdirSync(workflowDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  for (const file of files) {
    const fullPath = path.join(workflowDir, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    allIssues.push(...analyzeWorkflow(fullPath, content));
  }

  if (options.json) {
    console.log(JSON.stringify({ issues: allIssues, total: allIssues.length }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan("\n⚙️  CI/CD Pipeline Analysis\n"));

  if (allIssues.length === 0) {
    console.log(chalk.green("✅ All workflows look good!"));
    return;
  }

  for (const issue of allIssues) {
    const color = issue.severity === "HIGH" ? chalk.red : issue.severity === "MEDIUM" ? chalk.yellow : chalk.gray;
    console.log(color(`[${issue.severity}] ${path.basename(issue.file)}: ${issue.message}`));
  }
  console.log();
}