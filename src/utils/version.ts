import { execSync } from "child_process";
import semver from "semver";

const versionCache = new Map<string, string>();
export interface PackageInfo {
  version: string;
  homepage?: string;
  author?: string;
  repo?: string;
  description?: string;
}

const infoCache = new Map<string, PackageInfo>();

export function getLatestVersion(pkg: string): string {
  if (versionCache.has(pkg)) return versionCache.get(pkg)!;
  try {
    const v = execSync(`npm view ${pkg} version`, {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    versionCache.set(pkg, v);
    return v;
  } catch {
    versionCache.set(pkg, "unknown");
    return "unknown";
  }
}

export function getPackageFullInfo(pkg: string): PackageInfo {
  if (infoCache.has(pkg)) return infoCache.get(pkg)!;
  try {
    const res = execSync(`npm view ${pkg} --json`, {
      encoding: "utf-8",
      timeout: 5000,
    });
    const data = JSON.parse(res);
    const info: PackageInfo = {
      version: data.version || "unknown",
      homepage: data.homepage,
      author: data.author?.name || (typeof data.author === "string" ? data.author : undefined),
      repo: data.repository?.url,
      description: data.description,
    };
    infoCache.set(pkg, info);
    versionCache.set(pkg, info.version);
    return info;
  } catch {
    const fallback: PackageInfo = { version: "unknown" };
    infoCache.set(pkg, fallback);
    return fallback;
  }
}

export function detectBreaking(current: string, latest: string): boolean {
  if (!semver.valid(current) || !semver.valid(latest)) return false;
  return semver.major(current) !== semver.major(latest);
}