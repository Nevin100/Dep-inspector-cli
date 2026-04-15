import { execSync } from "child_process";
export function runAudit() {
    try {
        const res = execSync("npm audit --json", {
            encoding: "utf-8",
        });
        return JSON.parse(res);
    }
    catch (e) {
        return JSON.parse(e.stdout);
    }
}
//# sourceMappingURL=audit.js.map