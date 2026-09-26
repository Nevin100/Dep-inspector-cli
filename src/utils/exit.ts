import chalk from "chalk";

// Shared --fail-on handling: exit non-zero when findings breach a severity threshold.

export type Severity = "HIGH" | "MEDIUM" | "LOW";

const ORDER: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function parseFailOn(level?: string): Severity | null {
  if (!level) return null;
  const up = level.toUpperCase() as Severity;
  if (up === "HIGH" || up === "MEDIUM" || up === "LOW") return up;
  console.error(`Invalid --fail-on level "${level}" (use high|medium|low)`);
  process.exit(2);
}

export function breachedThreshold(severities: string[], threshold: Severity | null): boolean {
  if (!threshold) return false;
  return severities.some((s) => ORDER[s as Severity] <= ORDER[threshold]);
}

// Returns true if threshold breached. Exits 1 unless exitOnFail === false
// (scan:all sets that and decides once at the end).
export function failIfBreached(
  severities: string[],
  options: { json?: boolean; failOn?: string; exitOnFail?: boolean }
): boolean {
  const breached = breachedThreshold(severities, parseFailOn(options.failOn));
  if (breached && options.exitOnFail !== false) {
    if (!options.json) console.log(chalk.red("\n❌ Failing: findings at or above --fail-on threshold"));
    process.exit(1);
  }
  return breached;
}
