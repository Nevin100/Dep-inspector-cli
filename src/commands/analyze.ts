import chalk from "chalk";
import ora from "ora";
import { getDependencyTree } from "../utils/deps.js";
import {
  printTree,
  prefetchVersions,
  collectAllPackageNames,
} from "../utils/tree.js";
import { runAudit } from "../utils/audit.js";
import { getPackageFullInfo, detectBreaking } from "../utils/version.js";
import { analyzeWithAI } from "../utils/ai.js";

// Extract vulnerabilities from audit output
function extractVulnerabilities(audit: any) {
  const map: Record<string, string> = {};
  const vulns = audit.vulnerabilities || {};
  for (const pkg in vulns) {
    map[pkg] = vulns[pkg].severity;
  }
  return map;
}

// Find version in full tree recursively
function findVersion(node: any, target: string): string | null {
  if (!node.dependencies) return null;
  for (const dep in node.dependencies) {
    if (dep === target) return node.dependencies[dep].version;
    const found = findVersion(node.dependencies[dep], target);
    if (found) return found;
  }
  return null;
}

// Print dependency chain
function printDependencyChains(node: any, target: string, path: string[] = []) {
  if (!node.dependencies) return;
  for (const dep in node.dependencies) {
    const newPath = [...path, dep];
    if (dep === target) {
      console.log(chalk.cyan("🔗 Chain: ") + chalk.white(newPath.join(" → ")));
    }
    printDependencyChains(node.dependencies[dep], target, newPath);
  }
}

// Alternatives map
const alternatives: Record<string, string> = {
  request: "axios",
  moment: "dayjs",
  underscore: "lodash",
  "node-fetch": "axios or native fetch",
};

// Test suggestions
function suggestTests(pkg: string): string[] {
  const tests: Record<string, string[]> = {
    axios: ["Test API calls", "Validate request/response headers"],
    lodash: ["Test utility functions", "Check object mutation behavior"],
    express: ["Test route handlers", "Validate middleware chain"],
  };
  return tests[pkg] || ["Run full test suite", "Check integration tests"];
}

export interface AnalyzeOptions {
  ai?: boolean;
  json?: boolean;
  depth?: number;
}

export async function analyzeProject(options?: AnalyzeOptions) {
  const spinner = ora("🔍 Analyzing dependencies...").start();

  let tree: any;
  let audit: any;

  try {
    tree = getDependencyTree();
    audit = runAudit();
  } catch (err: any) {
    spinner.fail("Failed to analyze project");
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  spinner.text = "📦 Fetching latest versions...";

  // Collect all package names and prefetch versions in batch
  const allPkgNames = [...collectAllPackageNames(tree)];
  prefetchVersions(allPkgNames);

  spinner.stop();

  const vulnMap = extractVulnerabilities(audit);

  // JSON output mode
  if (options?.json) {
    const jsonOutput: any = {
      name: tree.name,
      version: tree.version,
      vulnerabilities: vulnMap,
      packages: {} as Record<string, any>,
    };

    for (const pkg in vulnMap) {
      const current = findVersion(tree, pkg) || "unknown";
      const info = getPackageFullInfo(pkg);
      const breaking = detectBreaking(current, info.version);

      jsonOutput.packages[pkg] = {
        severity: vulnMap[pkg],
        current,
        latest: info.version,
        breaking,
        homepage: info.homepage,
        author: info.author,
        repo: info.repo,
        alternative: alternatives[pkg] || null,
        suggestedTests: suggestTests(pkg),
      };
    }

    console.log(JSON.stringify(jsonOutput, null, 2));
    return;
  }

  // Normal output mode
  console.log(chalk.blue.bold("\n🌳 Dependency Tree\n"));
  await printTree(tree, "", true, "root", vulnMap, [], 0, options?.depth);

  console.log(chalk.red.bold("\n  ⚠️  Vulnerability Analysis\n"));

  if (Object.keys(vulnMap).length === 0) {
    console.log(chalk.green("✅ No vulnerabilities found\n"));
    return;
  }

  let aiInput = "";

  for (const pkg in vulnMap) {
    const severity = vulnMap[pkg];
    const current = findVersion(tree, pkg) || "unknown";

    // Single npm view call per package (version + info together)
    const info = getPackageFullInfo(pkg);
    const breaking = detectBreaking(current, info.version);

    console.log(chalk.yellow(`\n📦 ${pkg}`));
    console.log(`  Severity  : ${chalk.red(severity)}`);
    console.log(`  Version   : ${current} → ${info.version}`);

    if (breaking) {
      console.log(chalk.red("  ⚠️  Breaking change possible!"));
    }

    if (info.description) {
      console.log(`  About     : ${info.description}`);
    }

    if (info.homepage) {
      console.log(`  Docs      : ${info.homepage}`);
    }

    if (info.author) {
      console.log(`  Author    : ${info.author}`);
    }

    if (info.repo) {
      console.log(`  Repo      : ${info.repo}`);
    }

    if (alternatives[pkg]) {
      console.log(`  Alternative: ${chalk.cyan(alternatives[pkg])}`);
    }

    console.log(`  Tests     :`);
    suggestTests(pkg).forEach((t) => console.log(`    - ${t}`));

    printDependencyChains(tree, pkg, ["root"]);

    aiInput += `\nPackage: ${pkg}\nSeverity: ${severity}\nCurrent: ${current}\nLatest: ${info.version}\n`;
  }

  // AI analysis
  if (options?.ai) {
    console.log(chalk.blue.bold("\n🤖 AI Analysis\n"));
    const aiResult = await analyzeWithAI(aiInput);
    console.log(aiResult);
  }

  // Fix suggestions
  console.log(chalk.green.bold("\n💡 Fix Suggestions\n"));
  for (const pkg in vulnMap) {
    console.log(
      `  → ${chalk.yellow(pkg)}: ${chalk.cyan(`npm install ${pkg}@latest`)}`,
    );
  }

  console.log(chalk.gray("\n✨ Analysis Complete\n"));
}
