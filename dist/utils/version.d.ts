export interface PackageInfo {
    version: string;
    homepage?: string;
    author?: string;
    repo?: string;
    description?: string;
}
export declare function getLatestVersion(pkg: string): string;
export declare function getPackageFullInfo(pkg: string): PackageInfo;
export declare function detectBreaking(current: string, latest: string): boolean;
//# sourceMappingURL=version.d.ts.map