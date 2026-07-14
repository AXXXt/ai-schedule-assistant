import { Ionicons } from "@expo/vector-icons";
import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type EmptyStateProps = PropsWithChildren<{
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  style?: ViewStyle;
}>;

export function EmptyState({ children, description, icon = "calendar-outline", style, title }: EmptyStateProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.iconBox}>
        <Ionicons color={colors.textMuted} name={icon} size={48} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {children ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.round,
    height: 88,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 88
  },
  copy: {
    alignItems: "center",
    gap: spacing.xs
  },
  title: {
    ...typography.subheadline,
    color: colors.textPrimary,
    textAlign: "center"
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22
  },
  action: {
    marginTop: spacing.lg
  }
});