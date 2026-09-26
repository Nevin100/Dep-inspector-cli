import fs from "fs";
import chalk from "chalk";

export async function scanLogs(options: { json?: boolean }) {
  const issues: string[] = [];
  const passed: string[] = [];

  // Check if Winston or Morgan installed
  const pkgPath = "package.json";
  if (!fs.existsSync(pkgPath)) {
    console.log(chalk.yellow("⚠️  package.json not found"));
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    bin?: Record<string, string> | string;
  };

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  const hasWinston = "winston" in allDeps;
  const hasMorgan  = "morgan" in allDeps;
  const hasPino    = "pino" in allDeps;
  const hasLogger  = hasWinston || hasMorgan || hasPino;

  const isContainerized =
    fs.existsSync("Dockerfile") ||
    fs.existsSync("docker-compose.yml") ||
    fs.existsSync("compose.yaml");

  if (!hasLogger) {
    if (pkg.bin !== undefined) {
      passed.push("CLI tool detected — console output is fine, no logger required");
    } else {
      issues.push("No logger found (winston/morgan/pino) — console.log is not production-grade");
    }
  } else {
    if (hasWinston) passed.push("winston detected");
    if (hasMorgan)  passed.push("morgan detected");
    if (hasPino)    passed.push("pino detected");

    // LOG_LEVEL only matters when a real logger exists (no false positive for CLI tools)
    const envFile = fs.existsSync(".env") ? fs.readFileSync(".env", "utf-8") : "";
    if (!envFile.includes("LOG_LEVEL") && !process.env["LOG_LEVEL"]) {
      issues.push("LOG_LEVEL not set — logger may default to verbose in production");
    }
  }

  // Rotation advice is environment-aware: in containers, file transports are
  // an anti-pattern — log JSON to stdout and let the platform collect it.
  if (hasWinston) {
    if (isContainerized) {
      passed.push("containerized setup — prefer stdout JSON logs over file transports");
    } else if (!("winston-daily-rotate-file" in allDeps)) {
      issues.push("winston-daily-rotate-file not found — logs may grow unbounded");
    } else {
      passed.push("log rotation configured");
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ issues, passed, containerized: isContainerized }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan("\n📋 Logger Health Check\n"));
  for (const p of passed)  console.log(chalk.green(`✅ ${p}`));
  for (const i of issues)  console.log(chalk.yellow(`⚠️  ${i}`));
  console.log();
}
