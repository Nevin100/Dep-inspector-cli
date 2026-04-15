import { execSync } from "child_process";
export function getPackageInfo(pkg) {
    try {
        const res = execSync(`npm view ${pkg} --json`, {
            encoding: "utf-8",
        });
        const data = JSON.parse(res);
        return {
            description: data.description,
            homepage: data.homepage,
            repo: data.repository?.url,
            author: data.author?.name || data.author,
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=info.js.map