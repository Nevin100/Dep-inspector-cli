import chalk from "chalk";
import { getLatestVersion, getLatestVersionAsync } from "./version.js";

type VulnerabilityMap = Record<string, string>;

const latestVersionMap = new Map<string, string>();

const PREFETCH_CONCURRENCY = 8;

export async function prefetchVersions(pkgNames: string[]): Promise<void> {
  const queue = [...new Set(pkgNames)].filter((p) => !latestVersionMap.has(p));
  // Bounded worker pool: 8 concurrent `npm view` calls instead of serial.
  // 200 packages ≈ 200×~300ms serial vs ~25 batches concurrent.
  const workers = Array.from(
    { length: Math.min(PREFETCH_CONCURRENCY, queue.length) },
    async () => {
      while (queue.length > 0) {
        const pkg = queue.pop()!;
        latestVersionMap.set(pkg, await getLatestVersionAsync(pkg));
      }
    }
  );
  await Promise.all(workers);
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