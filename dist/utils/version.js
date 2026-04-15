import { execSync } from "child_process";
import semver from "semver";
export function getLatestVersion(pkg) {
    try {
        return execSync(`npm view ${pkg} version`, {
            encoding: "utf-8",
        }).trim();
    }
    catch {
        return "unknown";
    }
}
export function detectBreaking(current, latest) {
    if (!semver.valid(current) || !semver.valid(latest))
        return false;
    return semver.major(current) !== semver.major(latest);
}
//# sourceMappingURL=version.js.map