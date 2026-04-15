import chalk from "chalk";
import { getLatestVersion } from "./version.js";
export async function printTree(node, prefix = "", isLast = true, pkgName = "root", vulnerabilities = {}, chain = []) {
    const version = node.version || "";
    const latest = pkgName !== "root" ? getLatestVersion(pkgName) : version;
    const isOutdated = latest !== version;
    const vuln = vulnerabilities[pkgName];
    let label = `${pkgName}@${version}`;
    // Outdated Dependency :
    if (isOutdated && pkgName !== "root") {
        label += chalk.yellow(` (latest: ${latest})`);
    }
    // Vulnerability :
    if (vuln) {
        label += chalk.red(` ❌ ${vuln.toUpperCase()}`);
    }
    const branch = prefix + (isLast ? "└── " : "├── ");
    console.log(branch + label);
    const deps = node.dependencies || {};
    const keys = Object.keys(deps);
    keys.forEach((dep, index) => {
        const isChildLast = index === keys.length - 1;
        printTree(deps[dep], prefix + (isLast ? "    " : "│   "), isChildLast, dep, vulnerabilities, [...chain, dep]);
    });
}
//# sourceMappingURL=tree.js.map