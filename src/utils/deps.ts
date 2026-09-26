import { execSync } from "child_process";

// npm ls exits non-zero on peer-dep problems but still prints usable JSON on
// stdout. Parse stdout first — throw only when there's genuinely nothing to parse.
export function getDependencyTree() {
  try {
    const result = execSync("npm ls --json", { encoding: "utf-8" });
    return JSON.parse(result);
  } catch (error: any) {
    const stdout: string | undefined = error?.stdout?.toString();
    if (stdout) {
      try {
        return JSON.parse(stdout);
      } catch {
      }
    }
    throw new Error("Failed to get dependency tree. Run 'npm install' first.");
  }
}
