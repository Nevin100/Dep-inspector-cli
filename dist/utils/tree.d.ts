type VulnerabilityMap = Record<string, string>;
export declare function prefetchVersions(pkgNames: string[]): void;
export declare function collectAllPackageNames(node: any, names?: Set<string>): Set<string>;
export declare function printTree(node: any, prefix?: string, isLast?: boolean, pkgName?: string, vulnerabilities?: VulnerabilityMap, chain?: string[], depth?: number, maxDepth?: number): Promise<void>;
export {};
//# sourceMappingURL=tree.d.ts.map