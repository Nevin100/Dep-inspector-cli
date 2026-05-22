import fs from "fs";
import path from "path";
import chalk from "chalk";

// Secret patterns — no AI needed
const SECRET_PATTERNS: { name: string; pattern: RegExp; severity: "HIGH" | "MEDIUM" | "LOW" }[] = [
  { name: "AWS Access Key",        pattern: /AKIA[0-9A-Z]{16}/,                          severity: "HIGH" },
  { name: "AWS Secret Key",        pattern: /aws_secret_access_key\s*=\s*[^\s]{20,}/i,  severity: "HIGH" },
  { name: "Private Key Block",     pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,    severity: "HIGH" },
  { name: "Groq API Key",          pattern: /gsk_[a-zA-Z0-9]{40,}/,                     severity: "HIGH" },
  { name: "OpenAI API Key",        pattern: /sk-[a-zA-Z0-9]{32,}/,                      severity: "HIGH" },
  { name: "GitHub Token",          pattern: /ghp_[a-zA-Z0-9]{36}/,                      severity: "HIGH" },
  { name: "JWT Secret hardcoded",  pattern: /jwt[_-]?secret\s*[:=]\s*['"][^'"]{8,}/i,   severity: "HIGH" },
  { name: "Database URL",          pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i,        severity: "HIGH" },
  { name: "Database URL (PG)",     pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@/i,          severity: "HIGH" },
  { name: "Stripe Secret Key",     pattern: /sk_live_[a-zA-Z0-9]{24,}/,                 severity: "HIGH" },
  { name: "Razorpay Secret",       pattern: /rzp_live_[a-zA-Z0-9]{14,}/,               severity: "HIGH" },
  { name: "Generic Password",      pattern: /password\s*[:=]\s*['"][^'"]{6,}/i,         severity: "MEDIUM" },
  { name: "Generic Secret",        pattern: /secret\s*[:=]\s*['"][^'"]{6,}/i,           severity: "MEDIUM" },
  { name: ".env file committed",   pattern: /^\.env$/,                                  severity: "HIGH" }, // filename check
];

const IGNORE_DIRS = ["node_modules", ".git", "dist", ".next", "build", "coverage"];
const IGNORE_FILES = [".env", ".env.local", ".env.development", ".env.production"];
const SCAN_EXTENSIONS = [".ts", ".js", ".tsx", ".jsx", ".env", ".json", ".yaml", ".yml", ".sh"];

interface Finding {
  file: string;
  line: number;
  pattern: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  preview: string;
}

function shouldIgnore(filePath: string): boolean {
  const fileName = path.basename(filePath);
  if (IGNORE_FILES.includes(fileName)) return true;  // 👈 add this
  return IGNORE_DIRS.some((dir) => filePath.includes(`/${dir}/`));
}

function checkEnvInGitignore(): void {
  if (!fs.existsSync(".gitignore")) {
    console.log(chalk.red("[HIGH] .gitignore missing — .env may get committed to git"));
    return;
  }
  const gitignore = fs.readFileSync(".gitignore", "utf-8");
  if (!gitignore.includes(".env")) {
    console.log(chalk.red("[HIGH] .env is NOT in .gitignore — risk of secret exposure in git"));
  } else {
    console.log(chalk.green("✅ .env is gitignored"));
  }
}

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];
  const ext = path.extname(filePath);
  if (!SCAN_EXTENSIONS.includes(ext) && !filePath.endsWith(".env")) return findings;
  if (shouldIgnore(filePath)) return findings;

  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  lines.forEach((line, idx) => {
    for (const { name, pattern, severity } of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({
          file: filePath,
          line: idx + 1,
          pattern: name,
          severity,
          preview: line.trim().slice(0, 80), 
        });
        break; 
      }
    }
  });
  return findings;
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !IGNORE_DIRS.includes(entry.name)) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function scanSecrets(options: { dir: string; json?: boolean; ai?: boolean }) {
  const targetDir = path.resolve(options.dir);
  const allFiles = walkDir(targetDir);
  const allFindings: Finding[] = [];

  for (const file of allFiles) {
    allFindings.push(...scanFile(file));
  }

  if (options.json) {
    console.log(JSON.stringify({ findings: allFindings, total: allFindings.length }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan("\n🔐 Secrets Scanner\n"));

  checkEnvInGitignore();
  
  if (allFindings.length === 0) {
    console.log(chalk.green("✅ No secrets detected!"));
    return;
  }

  const highCount = allFindings.filter((f) => f.severity === "HIGH").length;
  const medCount  = allFindings.filter((f) => f.severity === "MEDIUM").length;

  console.log(chalk.red(`❌ ${highCount} HIGH`) + "  " + chalk.yellow(`⚠️  ${medCount} MEDIUM`) + "\n");

  for (const f of allFindings) {
    const color = f.severity === "HIGH" ? chalk.red : chalk.yellow;
    console.log(color(`[${f.severity}] ${f.pattern}`));
    console.log(`  File : ${f.file}:${f.line}`);
    console.log(`  Code : ${chalk.gray(f.preview)}\n`);
  }

  if (options.ai) {
    const key = process.env["GROQ_API_KEY"];
    if (!key) {
      console.log(chalk.gray("ℹ️  AI insights skipped — GROQ_API_KEY not set"));
    } else {
      // dynamic import to avoid breaking non-AI usage
      const { analyzeWithAI } = await import("../utils/ai.js");
      const summary = await analyzeWithAI(
        allFindings.map((f) => `${f.pattern} in ${f.file}:${f.line}`).join("\n")
      );
      console.log(chalk.cyan("\n💡 AI Insights\n") + summary);
    }
  }
}