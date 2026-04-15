import { execSync } from "child_process";

export function getDependencyTree() {
  const result = execSync("npm ls --json", { encoding: "utf-8" });
  return JSON.parse(result);
}