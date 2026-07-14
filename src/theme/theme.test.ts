import { colors, radius, shadows, spacing, typography } from "./index";

describe("theme tokens", () => {
  it("exposes semantic color tokens for the app shell", () => {
    expect(colors.background).toBeTruthy();
    expect(colors.surface).toBeTruthy();
    expect(colors.primary).toBeTruthy();
    expect(colors.success).toBeTruthy();
    expect(colors.warning).toBeTruthy();
    expect(colors.danger).toBeTruthy();
    expect(colors.textPrimary).toBeTruthy();
    expect(colors.borderSubtle).toBeTruthy();
  });

  it("keeps spacing on a predictable 4 point rhythm", () => {
    expect(Object.values(spacing).every((value) => value % 4 === 0)).toBe(true);
    expect(spacing.touchTarget).toBeGreaterThanOrEqual(44);
  });

  it("keeps card radii restrained instead of pill-like", () => {
    expect(radius.card).toBeLessThanOrEqual(20);
    expect(radius.sm).toBeLessThan(radius.card);
  });

  it("uses readable typography without negative tracking", () => {
    expect(typography.body.fontSize).toBeGreaterThanOrEqual(16);
    expect(Object.values(typography).every((style) => (style.letterSpacing ?? 0) >= 0)).toBe(true);
  });

  it("defines a subtle elevation scale for cards", () => {
    if ("shadowOpacity" in shadows.card) {
      expect(shadows.card.shadowOpacity).toBeLessThanOrEqual(0.12);
    } else if ("boxShadow" in shadows.card) {
      expect(shadows.card.boxShadow).toContain("rgba");
    } else {
      expect(shadows.card.elevation).toBeLessThanOrEqual(2);
    }

    expect(shadows.none.elevation).toBe(0);
  });
});
