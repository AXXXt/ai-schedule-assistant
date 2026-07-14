import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedTabsProps<T extends string> = {
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  value: T;
};

export function SegmentedTabs<T extends string>({ onChange, options, value }: SegmentedTabsProps<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.root}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.selectedSegment : null,
              pressed ? styles.pressed : null
            ]}
          >
            <Text style={[styles.label, selected ? styles.selectedLabel : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xxs
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: "center",
    minHeight: spacing.touchTarget,
    paddingHorizontal: spacing.sm
  },
  selectedSegment: {
    backgroundColor: colors.surface
  },
  pressed: {
    opacity: 0.76
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center"
  },
  selectedLabel: {
    color: colors.primary
  }
});
