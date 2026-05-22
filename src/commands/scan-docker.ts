import fs from "fs";
import chalk from "chalk";

interface DockerIssue {
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
}

function analyzeDockerfile(content: string): DockerIssue[] {
  const issues: DockerIssue[] = [];
  const lines = content.split("\n");

  // 1. Running as root
  const hasUser = lines.some((l) => l.trim().startsWith("USER ") && !l.includes("root"));
  if (!hasUser) issues.push({ severity: "HIGH", message: "No non-root USER defined — container runs as root" });

  // 2. HEALTHCHECK missing
  if (!content.includes("HEALTHCHECK")) {
    issues.push({ severity: "MEDIUM", message: "No HEALTHCHECK instruction — Docker can't auto-restart unhealthy containers" });
  }

  // 3. latest tag usage
  if (/FROM\s+\S+:latest/i.test(content)) {
    issues.push({ severity: "MEDIUM", message: "Using ':latest' tag — not reproducible, pin a specific version" });
  }

  // 4. Secrets in ENV/ARG
  const secretPattern = /(?:ENV|ARG)\s+(?:PASSWORD|SECRET|KEY|TOKEN|API_KEY)\s*=/i;
  if (secretPattern.test(content)) {
    issues.push({ severity: "HIGH", message: "Sensitive variable (PASSWORD/SECRET/KEY) hardcoded in ENV/ARG" });
  }

  // 5. No .dockerignore warning (check file exists)
  if (!fs.existsSync(".dockerignore")) {
    issues.push({ severity: "LOW", message: ".dockerignore missing — may include node_modules or .env in image" });
  }

  // 6. npm install without --omit=dev in production
  if (content.includes("npm install") && !content.includes("--omit=dev") && !content.includes("--only=production")) {
    issues.push({ severity: "LOW", message: "'npm install' without --omit=dev — devDependencies included in image" });
  }

  // 7. Multi-stage — good practice check
  const fromCount = (content.match(/^FROM\s/gim) ?? []).length;
  if (fromCount === 1) {
    issues.push({ severity: "LOW", message: "Single-stage build — consider multi-stage to reduce image size" });
  }

  return issues;
}

export async function scanDocker(options: { file: string; compose?: string; json?: boolean }) {
  const issues: DockerIssue[] = [];

  if (fs.existsSync(options.file)) {
    const content = fs.readFileSync(options.file, "utf-8");
    issues.push(...analyzeDockerfile(content));
  } else {
    console.log(chalk.yellow(`⚠️  Dockerfile not found at ${options.file}`));
  }

  if (options.json) {
    console.log(JSON.stringify({ issues, total: issues.length }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan("\n🐳 Docker Analysis\n"));

  if (issues.length === 0) {
    console.log(chalk.green("✅ Dockerfile looks good!"));
    return;
  }

  for (const issue of issues) {
    const color = issue.severity === "HIGH" ? chalk.red : issue.severity === "MEDIUM" ? chalk.yellow : chalk.gray;
    console.log(color(`[${issue.severity}] ${issue.message}`));
  }
  console.log();
}