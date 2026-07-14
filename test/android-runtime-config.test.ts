import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function readGradleProperty(source: string, name: string) {
  const match = source.match(new RegExp(`^${name}=(.+)$`, "m"));
  return match?.[1].trim();
}

function readPngDimensions(filePath: string) {
  const png = fs.readFileSync(filePath);

  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");

  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

describe("Android runtime configuration", () => {
  it("does not embed service credentials in public source", () => {
    const sourceFiles = [
      "src/services/ai/aiConfig.ts",
      "src/services/map/mapConfig.ts",
      "src/stores/createRepositories.ts",
    ];
    const source = sourceFiles
      .map((file) => fs.readFileSync(path.join(projectRoot, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/sk-[a-z0-9]{20,}/i);
    expect(source).not.toMatch(/apiKey:\s*["'][a-f0-9]{32}["']/i);
  });

  it("builds the Expo development client with Hermes and the new architecture", () => {
    const appConfig = readJson(path.join(projectRoot, "app.json"));
    const gradleProperties = fs.readFileSync(
      path.join(projectRoot, "android", "gradle.properties"),
      "utf8",
    );

    expect(appConfig.expo.jsEngine).toBe("hermes");
    expect(appConfig.expo.newArchEnabled).toBe(true);
    expect(readGradleProperty(gradleProperties, "hermesEnabled")).toBe("true");
    expect(readGradleProperty(gradleProperties, "newArchEnabled")).toBe("true");
  });

  it("uses the approved Time Slices launcher icon across Expo and Android", () => {
    const appConfig = readJson(path.join(projectRoot, "app.json"));
    const expoConfig = appConfig.expo;

    expect(expoConfig.icon).toBe("./assets/icon.png");
    expect(expoConfig.android.adaptiveIcon).toEqual({
      backgroundColor: "#EFFAFA",
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/monochrome-icon.png",
    });

    for (const asset of [
      "assets/icon.png",
      "assets/adaptive-icon.png",
      "assets/monochrome-icon.png",
    ]) {
      expect(readPngDimensions(path.join(projectRoot, asset))).toEqual({
        width: 1024,
        height: 1024,
      });
    }

    for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
      const mipmapDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        `mipmap-${density}`,
      );

      expect(fs.existsSync(path.join(mipmapDir, "ic_launcher.png"))).toBe(true);
      expect(fs.existsSync(path.join(mipmapDir, "ic_launcher_round.png"))).toBe(
        true,
      );
      expect(fs.existsSync(path.join(mipmapDir, "ic_launcher.webp"))).toBe(false);
      expect(fs.existsSync(path.join(mipmapDir, "ic_launcher_round.webp"))).toBe(
        false,
      );
    }

    const adaptiveIconDir = path.join(
      projectRoot,
      "android",
      "app",
      "src",
      "main",
      "res",
      "mipmap-anydpi-v26",
    );
    const foregroundVector = fs.readFileSync(
      path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "drawable",
        "ic_launcher_foreground.xml",
      ),
      "utf8",
    );

    expect(foregroundVector).toContain("#0F172A");
    expect(foregroundVector).toContain("#0891B2");
    expect(
      fs.readFileSync(path.join(adaptiveIconDir, "ic_launcher.xml"), "utf8"),
    ).toContain("@drawable/ic_launcher_foreground");
    expect(
      fs.readFileSync(
        path.join(adaptiveIconDir, "ic_launcher_round.xml"),
        "utf8",
      ),
    ).toContain("@drawable/ic_launcher_foreground");
  });

  it("uses the approved Time Slices mark on the splash screen", () => {
    const appConfig = readJson(path.join(projectRoot, "app.json"));

    expect(appConfig.expo.splash).toEqual({
      backgroundColor: "#EFFAFA",
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
    });
    expect(
      readPngDimensions(path.join(projectRoot, "assets", "splash-icon.png")),
    ).toEqual({ width: 1024, height: 1024 });

    for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
      expect(
        fs.existsSync(
          path.join(
            projectRoot,
            "android",
            "app",
            "src",
            "main",
            "res",
            `drawable-${density}`,
            "splashscreen_logo.png",
          ),
        ),
      ).toBe(true);
    }
  });
});
