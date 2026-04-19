import chalk from "chalk";
import { getLatestVersion } from "./version.js";

type VulnerabilityMap = Record<string, string>;

const latestVersionMap = new Map<string, string>();

export function prefetchVersions(pkgNames: string[]): void {
  const unique = [...new Set(pkgNames)];
  for (const pkg of unique) {
    if (!latestVersionMap.has(pkg)) {
      latestVersionMap.set(pkg, getLatestVersion(pkg));
    }
  }
}

export function collectAllPackageNames(
  node: any,
  names: Set<string> = new Set()
): Set<string> {
  const deps: Record<string, any> = node.dependencies || {};
  for (const dep of Object.keys(deps)) {
    names.add(dep);
    collectAllPackageNames(deps[dep], names);
  }
  return names;
}

export async function printTree(
  node: any,
  prefix = "",
  isLast = true,
  pkgName = "root",
  vulnerabilities: VulnerabilityMap = {},
  chain: string[] = [],
  depth = 0,
  maxDepth?: number
): Promise<void> {
  if (maxDepth !== undefined && depth > maxDepth) return;

  const version: string = node.version || "";
  const latest: string =
    pkgName !== "root"
      ? (latestVersionMap.get(pkgName) ?? getLatestVersion(pkgName))
      : version;

  const isOutdated = latest !== version && latest !== "unknown";
  const vuln: string | undefined = vulnerabilities[pkgName];

  let label = `${pkgName}@${version}`;

  if (isOutdated && pkgName !== "root") {
    label += chalk.yellow(` (latest: ${latest})`);
  }

  if (vuln) {
    label += chalk.red(` ❌ ${vuln.toUpperCase()}`);
  }

  const branch = prefix + (isLast ? "└── " : "├── ");
  console.log(branch + label);

  const deps: Record<string, any> = node.dependencies || {};
  const keys: string[] = Object.keys(deps);

  for (let i = 0; i < keys.length; i++) {
    const dep = keys[i] as string;
    const isChildLast = i === keys.length - 1;
    await printTree(
      deps[dep],
      prefix + (isLast ? "    " : "│   "),
      isChildLast,
      dep,
      vulnerabilities,
      [...chain, dep],
      depth + 1,
      maxDepth
    );
  }
}