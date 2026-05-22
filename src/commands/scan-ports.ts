import { execSync } from "child_process";
import chalk from "chalk";

const KNOWN_SAFE_PORTS = [22, 80, 443, 3000, 3001, 4000, 5000, 8080, 8443];
const SUSPICIOUS_PORTS = [21, 23, 25, 445, 1433, 3306, 5432, 6379, 27017]; // ftp, telnet, smtp, smb, mssql, mysql, pg, redis, mongo

export async function scanPorts(options: { json?: boolean }) {
  let output = "";
  try {
    const isWindows = process.platform === "win32";
    output = isWindows
      ? execSync("netstat -ano", { encoding: "utf-8" })
      : execSync("ss -tulnp 2>/dev/null || netstat -tulnp 2>/dev/null", {
          encoding: "utf-8",
        });
  } catch {
    console.log(chalk.yellow("⚠️  Could not read port info"));
    return;
  }

  const lines = output
    .split("\n")
    .filter((l) => l.includes("LISTEN") || l.includes("0.0.0.0"));
  const openPorts: { port: number; process: string; warning?: string }[] = [];

  for (const line of lines) {
    const portMatch = line.match(/:(\d+)\s/);
    if (!portMatch) continue;
    const port = parseInt(portMatch[1] ?? "0");
    const isExposed = line.includes("0.0.0.0") || line.includes("*:");
    const isSuspicious = SUSPICIOUS_PORTS.includes(port) && isExposed;

    const entry: { port: number; process: string; warning?: string } = {
      port,
      process: line.split(/\s+/).pop() ?? "unknown",
    };
    if (isSuspicious)
      entry.warning = `Port ${port} is publicly exposed — restrict to localhost`;
    openPorts.push(entry);
  }

  if (options.json) {
    console.log(JSON.stringify({ openPorts }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan("\n🔌 Port & Process Monitor\n"));

  for (const p of openPorts) {
    if (p.warning) {
      console.log(chalk.red(`[WARN] :${p.port} — ${p.warning}`));
    } else {
      console.log(chalk.green(`[OK]   :${p.port}`));
    }
  }
  console.log();
}
