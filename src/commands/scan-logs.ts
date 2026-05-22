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
  };
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  const hasWinston = "winston" in allDeps;
  const hasMorgan  = "morgan" in allDeps;
  const hasPino    = "pino" in allDeps;

  if (!hasWinston && !hasMorgan && !hasPino) {
    issues.push("No logger found (winston/morgan/pino) — console.log is not production-grade");
  } else {
    if (hasWinston) passed.push("winston detected");
    if (hasMorgan)  passed.push("morgan detected");
    if (hasPino)    passed.push("pino detected");
  }

  // Check for winston transports (file rotation)
  if (hasWinston) {
    const hasRotation = "winston-daily-rotate-file" in allDeps;
    if (!hasRotation) {
      issues.push("winston-daily-rotate-file not found — logs may grow unbounded");
    } else {
      passed.push("log rotation configured");
    }
  }

  // Check for LOG_LEVEL env usage
  const envFile = fs.existsSync(".env") ? fs.readFileSync(".env", "utf-8") : "";
  if (!envFile.includes("LOG_LEVEL")) {
    issues.push("LOG_LEVEL not set in .env — logger may default to verbose in production");
  }

  if (options.json) {
    console.log(JSON.stringify({ issues, passed }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan("\n📋 Logger Health Check\n"));
  for (const p of passed)  console.log(chalk.green(`✅ ${p}`));
  for (const i of issues)  console.log(chalk.yellow(`⚠️  ${i}`));
  console.log();
}