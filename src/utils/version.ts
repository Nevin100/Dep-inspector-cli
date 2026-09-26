import semver from "semver";
import { spawn, spawnSync } from "child_process";

const versionCache = new Map<string, string>();
export interface PackageInfo {
  version: string;
  homepage?: string;
  author?: string;
  repo?: string;
  description?: string;
}

const infoCache = new Map<string, PackageInfo>();

function npmView(args: string[]): string | null {
  try {
    const r = spawnSync("npm", ["view", ...args], {
      encoding: "utf-8",
      timeout: 5000,
    });
    if (r.status !== 0) return null;
    return r.stdout.trim();
  } catch {
    return null;
  }
}
export function getLatestVersion(pkg: string): string {
  if (versionCache.has(pkg)) return versionCache.get(pkg)!;
  const v = npmView([pkg, "version"]) || "unknown";
  versionCache.set(pkg, v);
  return v;
}

function npmViewAsync(args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn("npm", ["view", ...args], { timeout: 8000 });
    let out = "";
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => resolve(code === 0 ? out.trim() : null));
  });
}

// Non-blocking variant for the concurrent prefetcher in tree.ts
export async function getLatestVersionAsync(pkg: string): Promise<string> {
  if (versionCache.has(pkg)) return versionCache.get(pkg)!;
  const v = (await npmViewAsync([pkg, "version"])) || "unknown";
  versionCache.set(pkg, v);
  return v;
}


export function getPackageFullInfo(pkg: string): PackageInfo {
  if (infoCache.has(pkg)) return infoCache.get(pkg)!;
  const raw = npmView([pkg, "--json"]);
  const fallback: PackageInfo = { version: "unknown" };
  if (!raw) {
    infoCache.set(pkg, fallback);
    return fallback;
  }
  try {
    const data = JSON.parse(raw);
    const info: PackageInfo = {
      version: data.version || "unknown",
      homepage: data.homepage,
      author:
        data.author?.name ||
        (typeof data.author === "string" ? data.author : undefined),
      repo: data.repository?.url,
      description: data.description,
    };
    infoCache.set(pkg, info);
    versionCache.set(pkg, info.version);
    return info;
  } catch {
    infoCache.set(pkg, fallback);
    return fallback;
  }
}

export function detectBreaking(current: string, latest: string): boolean {
  if (!semver.valid(current) || !semver.valid(latest)) return false;
  return semver.major(current) !== semver.major(latest);
}
