import chalk from "chalk";
import ora from "ora";
import { getDependencyTree } from "../utils/deps.js";
import { printTree } from "../utils/tree.js";
import { runAudit } from "../utils/audit.js";
import { getLatestVersion, detectBreaking } from "../utils/version.js";
import { getPackageInfo } from "../utils/info.js";
import { analyzeWithAI } from "../utils/ai.js";

// 🛡️ Extract vulnerabilities
function extractVulnerabilities(audit: any) {
  const map: Record<string, string> = {};
  const vulns = audit.vulnerabilities || {};

  for (const pkg in vulns) {
    map[pkg] = vulns[pkg].severity;
  }

  return map;
}

// 🔍 Find version in full tree (important fix 🔥)
function findVersion(node: any, target: string): string | null {
  if (!node.dependencies) return null;

  for (const dep in node.dependencies) {
    if (dep === target) {
      return node.dependencies[dep].version;
    }

    const found = findVersion(node.dependencies[dep], target);
    if (found) return found;
  }

  return null;
}

// 🔗 Dependency chain
function printDependencyChains(
  node: any,
  target: string,
  path: string[] = []
) {
  if (!node.dependencies) return;

  for (const dep in node.dependencies) {
    const newPath = [...path, dep];

    if (dep === target) {
      console.log(
        chalk.cyan("🔗 Chain: ") + chalk.white(newPath.join(" → "))
      );
    }

    printDependencyChains(node.dependencies[dep], target, newPath);
  }
}

// ⚠️ Risk explanation
const riskMap: Record<string, string> = {
  axios: "API requests may fail due to header changes",
  lodash: "Object behavior may change",
};

// 🔄 Alternatives
const alternatives: Record<string, string> = {
  request: "axios",
  moment: "dayjs",
};

// 🧪 Test suggestions
function suggestTests(pkg: string) {
  const tests: Record<string, string[]> = {
    axios: ["Test API calls", "Validate headers"],
  };

  return tests[pkg] || ["Run full test suite"];
}

export async function analyzeProject(options?: { ai?: boolean }) {
  const spinner = ora("🔍 Deep analyzing dependencies...").start();

  const tree = getDependencyTree();
  const audit = runAudit();

  spinner.stop();

  const vulnMap = extractVulnerabilities(audit);

  // 🌳 TREE
  console.log(chalk.blue.bold("\n🌳 Dependency Tree\n"));
  await printTree(tree, "", true, "root", vulnMap);

  // ⚠️ SUMMARY
  console.log(chalk.red.bold("\n⚠️ Vulnerability Analysis\n"));

  if (Object.keys(vulnMap).length === 0) {
    console.log(chalk.green("✅ No vulnerabilities found\n"));
    return;
  }

  // 🤖 Prepare AI batch input
  let aiInput = "";

  for (const pkg in vulnMap) {
    const severity = vulnMap[pkg];

    const current = findVersion(tree, pkg) || "unknown";
    const latest = getLatestVersion(pkg);

    const breaking = detectBreaking(current, latest);

    const info = getPackageInfo(pkg);

    console.log(chalk.yellow(`\n📦 ${pkg}`));
    console.log(`Severity: ${chalk.red(severity)}`);
    console.log(`Version: ${current} → ${latest}`);

    if (breaking) {
      console.log(chalk.red("⚠️ Breaking change possible!"));
    }

    if (riskMap[pkg]) {
      console.log(chalk.red(`💥 Risk: ${riskMap[pkg]}`));
    }

    if (info) {
      console.log(`📚 Docs: ${info.homepage || "N/A"}`);
      console.log(`👨‍💻 Author: ${info.author || "N/A"}`);
      console.log(`🔗 Repo: ${info.repo || "N/A"}`);
    }

    if (alternatives[pkg]) {
      console.log(`🔄 Alternative: ${alternatives[pkg]}`);
    }

    console.log("🧪 Suggested Tests:");
    suggestTests(pkg).forEach((t) => console.log("  - " + t));

    printDependencyChains(tree, pkg, ["root"]);

    // AI input collect
    aiInput += `
Package: ${pkg}
Severity: ${severity}
Current: ${current}
Latest: ${latest}
`;
  }

  // 🤖 AI ANALYSIS (optional)
  if (options?.ai) {
    console.log(chalk.blue.bold("\n🤖 AI Analysis\n"));

    const aiResult = await analyzeWithAI(aiInput);

    console.log(aiResult);
  }

  // 💡 FIXES
  console.log(chalk.green.bold("\n💡 Fix Suggestions\n"));

  for (const pkg in vulnMap) {
    console.log(
      `→ ${chalk.yellow(pkg)}: ${chalk.cyan(
        `npm install ${pkg}@latest`
      )}`
    );
  }

  console.log(chalk.gray("\n✨ Advanced Analysis Complete\n"));
}