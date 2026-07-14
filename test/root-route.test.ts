import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

describe("root route", () => {
  it("opens the Today tab after native launch", () => {
    const routePath = join(process.cwd(), "app", "index.tsx");
    const routeSource = readFileSync(routePath, "utf8");

    expect(existsSync(routePath)).toBe(true);
    expect(routeSource).toContain('href="/(tabs)/today"');
    expect(routeSource).not.toContain("Phone diagnostic screen is rendering.");
  });

  it("keeps test files out of Expo Router's app directory", () => {
    expect(findTestFiles(join(process.cwd(), "app"))).toEqual([]);
  });
});

function findTestFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      return findTestFiles(fullPath);
    }

    return /\.test\.[tj]sx?$/.test(entry) ? [fullPath] : [];
  });
}
