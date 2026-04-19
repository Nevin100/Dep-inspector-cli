import chalk from "chalk";
import { getLatestVersion } from "./version.js";
const latestVersionMap = new Map();
export function prefetchVersions(pkgNames) {
    const unique = [...new Set(pkgNames)];
    for (const pkg of unique) {
        if (!latestVersionMap.has(pkg)) {
            latestVersionMap.set(pkg, getLatestVersion(pkg));
        }
    }
}
export function collectAllPackageNames(node, names = new Set()) {
    const deps = node.dependencies || {};
    for (const dep of Object.keys(deps)) {
        names.add(dep);
        collectAllPackageNames(deps[dep], names);
    }
    return names;
}
export async function printTree(node, prefix = "", isLast = true, pkgName = "root", vulnerabilities = {}, chain = [], depth = 0, maxDepth) {
    if (maxDepth !== undefined && depth > maxDepth)
        return;
    const version = node.version || "";
    const latest = pkgName !== "root"
        ? (latestVersionMap.get(pkgName) ?? getLatestVersion(pkgName))
        : version;
    const isOutdated = latest !== version && latest !== "unknown";
    const vuln = vulnerabilities[pkgName];
    let label = `${pkgName}@${version}`;
    if (isOutdated && pkgName !== "root") {
        label += chalk.yellow(` (latest: ${latest})`);
    }
    if (vuln) {
        label += chalk.red(` ❌ ${vuln.toUpperCase()}`);
    }
    const branch = prefix + (isLast ? "└── " : "├── ");
    console.log(branch + label);
    const deps = node.dependencies || {};
    const keys = Object.keys(deps);
    for (let i = 0; i < keys.length; i++) {
        const dep = keys[i];
        const isChildLast = i === keys.length - 1;
        await printTree(deps[dep], prefix + (isLast ? "    " : "│   "), isChildLast, dep, vulnerabilities, [...chain, dep], depth + 1, maxDepth);
    }
}
//# sourceMappingURL=tree.js.map