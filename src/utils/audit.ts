import { execSync } from "child_process";

// npm audit exits 1 precisely when it FINDS vulnerabilities — the JSON on
// stdout is still valid. Parse it; throw a friendly error only when there's
// nothing usable (e.g. npm missing, no network).
export function runAudit() {
  try {
    const res = execSync("npm audit --json", {
      encoding: "utf-8",
    });
    return JSON.parse(res);
  } catch (e: any) {
    const stdout: string | undefined = e?.stdout?.toString();
    if (stdout) {
      try {
        return JSON.parse(stdout);
      } catch {
        // fall through to the friendly error below
      }
    }
    throw new Error("Failed to run npm audit. Run 'npm install' first.");
  }
}
