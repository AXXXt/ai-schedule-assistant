import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";

import { colors, spacing, typography } from "@/theme";

type ListRowProps = {
  accessibilityLabel?: string;
  detail?: string;
  left?: React.ReactNode;
  title: string;
} & Pick<PressableProps, "disabled" | "onPress" | "testID">;

export function ListRow({ accessibilityLabel, detail, disabled, left, onPress, testID, title }: ListRowProps) {
  const interactive = Boolean(onPress) || Boolean(accessibilityLabel);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={interactive ? "button" : undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && !disabled ? styles.pressed : null]}
      testID={testID}
    >
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {interactive ? <Ionicons color={colors.textMuted} name="chevron-forward" size={20} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: spacing.touchTarget,
    paddingVertical: spacing.sm
  },
  pressed: {
    opacity: 0.72
  },
  left: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    minWidth: 32
  },
  copy: {
    flex: 1,
    gap: spacing.xxs
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary
  }
});
