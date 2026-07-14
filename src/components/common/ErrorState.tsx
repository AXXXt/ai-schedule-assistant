import { Ionicons } from "@expo/vector-icons";
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type ErrorStateProps = PropsWithChildren<{
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}>;

export function ErrorState({ children, message = "加载失败，请重试", onRetry, style }: ErrorStateProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.iconBox}>
        <Ionicons color={colors.danger} name="cloud-offline-outline" size={48} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>出了点问题</Text>
        <Text style={styles.description}>{message}</Text>
      </View>
      <View style={styles.actions}>
        {onRetry ? (
          <Pressable
            accessibilityLabel="重试"
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}
          >
            <Ionicons color={colors.surface} name="refresh-outline" size={18} />
            <Text style={styles.retryText}>重试</Text>
          </Pressable>
        ) : null}
        {children}
      </View>
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
    backgroundColor: colors.dangerSoft,
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
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: spacing.touchTarget,
    paddingHorizontal: spacing.lg
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.surface
  },
  pressed: {
    opacity: 0.72
  }
});