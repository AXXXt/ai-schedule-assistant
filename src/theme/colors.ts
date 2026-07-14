export const colors = {
  background: "#F8FAFC",
  backgroundWarm: "#FBF8F3",
  surface: "#FFFFFF",
  surfaceSoft: "#F1F5F9",
  surfaceGlass: "rgba(255, 255, 255, 0.82)",
  primary: "#0891B2",
  primarySoft: "#E0F7FA",
  primaryPressed: "#0E7490",
  success: "#10B981",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#CBD5E1",
  borderSubtle: "#E2E8F0",
  shadow: "#0F172A"
} as const;

export type AppColor = keyof typeof colors;
