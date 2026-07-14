import { Platform } from "react-native";

import { colors } from "./colors";

export const shadows = {
  none: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  card:
    Platform.OS === "web"
      ? {
          boxShadow: `0 8px 18px rgba(15, 23, 42, 0.08)`
        }
      : Platform.select({
          ios: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 18
          },
          android: {
            elevation: 2
          },
          default: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 18,
            elevation: 2
          }
        })!
} as const;
