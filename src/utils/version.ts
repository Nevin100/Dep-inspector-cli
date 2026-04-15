import { execSync } from "child_process";
import semver from "semver";

export function getLatestVersion(pkg: string): string {
  try {
    return execSync(`npm view ${pkg} version`, {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export function detectBreaking(current: string, latest: string) {
  if (!semver.valid(current) || !semver.valid(latest)) return false;

  return semver.major(current) !== semver.major(latest);
}