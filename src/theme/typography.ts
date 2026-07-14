import type { TextStyle } from "react-native";

export const typography = {
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: 0
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: 0
  },
  subheadline: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: 0
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 0
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: 0
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    letterSpacing: 0
  }
} satisfies Record<string, TextStyle>;

export type TypographyRole = keyof typeof typography;
