import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type PrimaryButtonProps = {
  label: string;
} & Pick<PressableProps, "accessibilityLabel" | "disabled" | "onPress" | "testID">;

export function PrimaryButton({ accessibilityLabel, disabled, label, onPress, testID }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null
      ]}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: spacing.touchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    opacity: 0.45
  },
  label: {
    ...typography.bodyStrong,
    color: colors.surface
  }
});
