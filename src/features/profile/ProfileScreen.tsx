import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { Card, EmptyState, ErrorState, Screen, SectionHeader, SegmentedTabs } from "@/components/common";
import { useShimmer } from "@/hooks/useShimmer";
import { colors, radius, spacing, typography } from "@/theme";
import type { MBTIType, UserPreference } from "@/types/preference";
import { usePreferenceActions, usePreferenceStore } from "@/stores/StoreProvider";
import { createNotificationScheduler } from "@/services/notification";


function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [delay, opacity, slide]);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );
}
type Personality = MBTIType | "unknown";

const personalities: Array<{ label: string; value: Personality }> = [
  { label: "INFP", value: "INFP" },
  { label: "ENFP", value: "ENFP" },
  { label: "INTJ", value: "INTJ" },
  { label: "ENTJ", value: "ENTJ" },
  { label: "不确定", value: "unknown" },
];

const adviceOptions = [
  { label: "最佳方案", value: "best_one" },
  { label: "2-3 个选项", value: "two_or_three_options" },
  { label: "全面分析", value: "full_analysis" },
] satisfies Array<{ label: string; value: UserPreference["adviceStyle"] }>;

const reminderOptions = [
  { label: "轻度", value: "light" },
  { label: "标准", value: "standard" },
  { label: "多次提醒", value: "repeated" },
] satisfies Array<{ label: string; value: UserPreference["reminderStyle"] }>;

const detailOptions = [
  { label: "简洁", value: "brief" },
  { label: "适中", value: "normal" },
  { label: "详细", value: "detailed" },
] satisfies Array<{ label: string; value: UserPreference["planDetailLevel"] }>;

const reminderDescriptions: Record<UserPreference["reminderStyle"], string> = {
  light: "重要计划前一次平和的提醒。",
  standard: "包含准备和出发提醒。",
  repeated: "重要计划前多次温馨提醒。",
};

type DietDisplay = "清淡" | "随性" | "重口";
type ExerciseDisplay = "跑步" | "瑜伽" | "力量";
type OutfitDisplay = "极简" | "休闲" | "多彩";
type CommuteDisplay = "地铁" | "步行" | "自驾";

function dietToTaste(diet: DietDisplay): UserPreference["diet"] {
  switch (diet) {
    case "清淡": return { taste: "light", avoid: [], budget: "moderate" };
    case "随性": return { taste: "medium_spicy", avoid: [], budget: "moderate" };
    case "重口": return { taste: "heavy_spicy", avoid: [], budget: "moderate" };
  }
}

function tasteToDiet(taste?: UserPreference["diet"]): DietDisplay {
  return taste?.taste === "heavy_spicy" ? "重口" : taste?.taste === "medium_spicy" ? "随性" : "清淡";
}

function exerciseToDisplay(types?: string[]): ExerciseDisplay {
  if (types?.[0] === "yoga") return "瑜伽";
  if (types?.[0] === "strength") return "力量";
  return "跑步";
}

function displayToExercise(display: ExerciseDisplay): UserPreference["exercise"] {
  return display === "瑜伽" ? { preferredTypes: ["yoga"], intensity: "moderate" }
    : display === "力量" ? { preferredTypes: ["strength"], intensity: "moderate" }
    : { preferredTypes: ["running"], intensity: "moderate" };
}

function outfitToDisplay(style?: UserPreference["outfit"]): OutfitDisplay {
  return style?.style === "casual" ? "休闲" : style?.style === "colorful" ? "多彩" : "极简";
}

function displayToOutfit(display: OutfitDisplay): UserPreference["outfit"] {
  return display === "休闲" ? { style: "casual", colorPreference: "neutral" }
    : display === "多彩" ? { style: "colorful", colorPreference: "colorful" }
    : { style: "minimal", colorPreference: "neutral" };
}

function commuteToDisplay(method?: UserPreference["commute"]): CommuteDisplay {
  return method?.preferredMethod === "walk" ? "步行" : method?.preferredMethod === "drive" ? "自驾" : "地铁";
}

function displayToCommute(display: CommuteDisplay): UserPreference["commute"] {
  return display === "步行" ? { preferredMethod: "walk", defaultBufferMinutes: 20 }
    : display === "自驾" ? { preferredMethod: "drive", defaultBufferMinutes: 20 }
    : { preferredMethod: "subway", defaultBufferMinutes: 20 };
}

export function ProfileScreen() {
  const preference = usePreferenceStore((s) => s.preference);
  const isLoading = usePreferenceStore((s) => s.isLoading);
  const error = usePreferenceStore((s) => s.error);
  const { loadPreference, updatePreference } = usePreferenceActions();

  const [personality, setPersonality] = useState<Personality>("INFP");
  const [adviceStyle, setAdviceStyle] = useState<UserPreference["adviceStyle"]>("best_one");
  const [reminderStyle, setReminderStyle] = useState<UserPreference["reminderStyle"]>("standard");
  const [detailLevel, setDetailLevel] = useState<UserPreference["planDetailLevel"]>("normal");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [diet, setDietDisplay] = useState<DietDisplay>("清淡");
  const [exercise, setExerciseDisplay] = useState<ExerciseDisplay>("跑步");
  const [outfit, setOutfitDisplay] = useState<OutfitDisplay>("极简");
  const [commute, setCommuteDisplay] = useState<CommuteDisplay>("地铁");

  const [notifyStatus, setNotifyStatus] = useState<"" | "sending" | "sent">("");

  const handleTestNotification = async () => {
    setNotifyStatus("sending");
    try {
      const scheduler = await createNotificationScheduler();
      await scheduler.scheduleImmediate(
        "测试通知",
        "如果你看到这条消息，说明通知功能正常！"
      );
      setNotifyStatus("sent");
      setTimeout(() => setNotifyStatus(""), 2000);
    } catch {
      setNotifyStatus("");
    }
  };

  
  useEffect(() => {
    void loadPreference();
  }, [loadPreference]);

  useEffect(() => {
    if (preference) {
      setPersonality(preference.mbti ?? "unknown");
      setAdviceStyle(preference.adviceStyle);
      setReminderStyle(preference.reminderStyle);
      setDetailLevel(preference.planDetailLevel);
      setDietDisplay(tasteToDiet(preference.diet));
      setExerciseDisplay(exerciseToDisplay(preference.exercise?.preferredTypes));
      setOutfitDisplay(outfitToDisplay(preference.outfit));
      setCommuteDisplay(commuteToDisplay(preference.commute));
    }
  }, [preference]);

  const handleUpdate = (update: Partial<UserPreference>) => {
    void updatePreference(update);
    
  };

  return (
    <Screen>
      <FadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.title}>我的</Text>
          <Text style={styles.subtitle}>你的偏好塑造 AI 的建议风格。</Text>
        </View>
      </FadeIn>

            <FadeIn delay={80}>
        <Card style={styles.profileBand}>
        <View style={styles.avatar}>
          <Ionicons color={colors.primary} name="person" size={26} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileTitle}>本地演示</Text>
          <Text style={styles.profileDetail}>偏好保存在本设备上。</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoText}>v1.0</Text>
        </View>
      </Card>
      </FadeIn>

      <FadeIn delay={160}>
        <View style={styles.section}>
          <SectionHeader title="个性" />
        <Card style={styles.preferenceCard}>
          <ChoiceGroup
            selectedValue={personality}
            onSelect={(value) => { setPersonality(value as Personality); handleUpdate({ mbti: value as MBTIType | "unknown" }); }}
            options={personalities.map((p) => ({ label: p.label, value: p.value }))}
            label="MBTI 类型"
          />
        </Card>
      </View>

      </FadeIn>

      <FadeIn delay={240}>
        <View style={styles.section}>
          <SectionHeader title="AI 建议" />
        <Card style={styles.preferenceCard}>
          <ChoiceGroup
            selectedValue={adviceStyle}
            onSelect={(value) => { setAdviceStyle(value as UserPreference["adviceStyle"]); handleUpdate({ adviceStyle: value as UserPreference["adviceStyle"] }); }}
            options={adviceOptions}
            label="建议方式"
          />
          <View style={styles.divider} />
          <ChoiceGroup
            selectedValue={detailLevel}
            onSelect={(value) => { setDetailLevel(value as UserPreference["planDetailLevel"]); handleUpdate({ planDetailLevel: value as UserPreference["planDetailLevel"] }); }}
            options={detailOptions}
            label="详细程度"
          />
        </Card>
      </View>

      </FadeIn>

      <FadeIn delay={320}>
        <View style={styles.section}>
          <SectionHeader title="提醒" />
        <Card style={styles.preferenceCard}>
          <ChoiceGroup
            detail={reminderDescriptions[reminderStyle]}
            selectedValue={reminderStyle}
            onSelect={(value) => { setReminderStyle(value as UserPreference["reminderStyle"]); handleUpdate({ reminderStyle: value as UserPreference["reminderStyle"] }); }}
            options={reminderOptions}
            label="提醒方式"
          />
        </Card>
      </View>

      </FadeIn>

      <FadeIn delay={400}>
        <View style={styles.section}>
          <SectionHeader title="生活方式" />
        <Card style={styles.preferenceCard}>
          <LifestyleControl
            icon="restaurant-outline"
            label="饮食"
            onChange={(value) => { setDietDisplay(value as DietDisplay); handleUpdate({ diet: dietToTaste(value as DietDisplay) }); }}
            options={["清淡", "随性", "重口"]}
            value={diet}
          />
          <View style={styles.divider} />
          <LifestyleControl
            icon="fitness-outline"
            label="运动"
            onChange={(value) => { setExerciseDisplay(value as ExerciseDisplay); handleUpdate({ exercise: displayToExercise(value as ExerciseDisplay) }); }}
            options={["跑步", "瑜伽", "力量"]}
            value={exercise}
          />
          <View style={styles.divider} />
          <LifestyleControl
            icon="shirt-outline"
            label="穿搭"
            onChange={(value) => { setOutfitDisplay(value as OutfitDisplay); handleUpdate({ outfit: displayToOutfit(value as OutfitDisplay) }); }}
            options={["极简", "休闲", "多彩"]}
            value={outfit}
          />
          <View style={styles.divider} />
          <LifestyleControl
            icon="bus-outline"
            label="出行"
            onChange={(value) => { setCommuteDisplay(value as CommuteDisplay); handleUpdate({ commute: displayToCommute(value as CommuteDisplay) }); }}
            options={["地铁", "步行", "自驾"]}
            value={commute}
          />
        </Card>
      </View>

      </FadeIn>

      <FadeIn delay={480}>
        <View style={styles.section}>
          <SectionHeader title="设置" />
        <Card style={styles.settingsCard}>
          <SettingToggle
            detail="接收准备和出发提醒。"
            icon="notifications-outline"
            label="通知"
            onValueChange={setNotificationsEnabled}
            value={notificationsEnabled}
          />
          <View style={styles.divider} />
          <SettingToggle
            detail="在 AI 方案中包含天气信息。"
            icon="partly-sunny-outline"
            label="天气"
            onValueChange={setWeatherEnabled}
            value={weatherEnabled}
          />
        </Card>
      </View>


      {/* 测试通知按钮 */}
      <Card style={{ marginTop: spacing.lg }}>
        <Pressable
          onPress={handleTestNotification}
          style={({ pressed }) => [
            { alignItems: "center", backgroundColor: notifyStatus === "sent" ? colors.successSoft : colors.primary,
              borderRadius: radius.md, flexDirection: "row", gap: spacing.sm,
              justifyContent: "center", minHeight: spacing.touchTarget, paddingHorizontal: spacing.lg,
              opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Ionicons
            color={notifyStatus === "sent" ? colors.success : colors.surface}
            name={notifyStatus === "sent" ? "checkmark-circle" : "notifications"}
            size={20}
          />
          <Text style={{ ...typography.bodyStrong, color: notifyStatus === "sent" ? colors.success : colors.surface }}>
            {notifyStatus === "sending" ? "发送中..." : notifyStatus === "sent" ? "已发送！" : "发送测试通知"}
          </Text>
        </Pressable>
        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" }}>
          点击后在手机上立即弹出一条系统通知，用于验证通知功能是否正常。
        </Text>
      </Card>

      </FadeIn>

      <FadeIn delay={560}>
        <View style={styles.footerNote}>
        <Ionicons color={colors.textMuted} name="information-circle-outline" size={18} />
        <Text style={styles.footerText}>AI 建议在本地生成，你的数据仅保存在本设备。</Text>
      </View>
      </FadeIn>
    </Screen>
  );
}

function SavedToast() {
  const slide = useMemo(() => new Animated.Value(-20), []);
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [slide, opacity]);

  return (
    <Animated.View style={[styles.savedToast, { transform: [{ translateY: slide }], opacity }]}>
      <Ionicons color={colors.success} name="checkmark-circle" size={18} />
      <Text style={styles.savedText}>偏好已保存</Text>
    </Animated.View>
  );
}

function ChoiceGroup({ detail, label, onSelect, options, selectedValue }: {
  detail?: string;
  label: string;
  onSelect: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
}) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.controlLabel}>{label}</Text>
      {detail ? <Text style={styles.controlDetail}>{detail}</Text> : null}
      <View style={styles.chipGrid}>
        {options.map((option) => (
          <AnimatedChoiceChip
            key={option.value}
            label={option.label}
            onPress={() => onSelect(option.value)}
            selected={selectedValue === option.value}
          />
        ))}
      </View>
    </View>
  );
}

function AnimatedChoiceChip({ label, onPress, selected }: {
  label: string; onPress: () => void; selected: boolean;
}) {
  const scale = useMemo(() => new Animated.Value(0), []);

  const handlePress = () => {
    if (selected) return;
    scale.setValue(0);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [styles.choiceChip, selected ? styles.selectedChip : null, pressed ? styles.pressed : null]}
    >
      <Animated.View style={{ transform: [{ scale: scale.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] }) }] }}>
        <Text style={[styles.choiceText, selected ? styles.selectedChoiceText : null]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function LifestyleControl({ icon, label, onChange, options, value }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onChange: (value: string) => void; options: string[]; value: string;
}) {
  return (
    <View style={styles.lifestyleGroup}>
      <View style={styles.lifestyleLabelRow}>
        <Ionicons color={colors.primary} name={icon} size={20} />
        <Text style={styles.controlLabel}>{label}</Text>
      </View>
      <View style={styles.chipGrid}>
        {options.map((option) => (
          <AnimatedChoiceChip
            key={option}
            label={option}
            onPress={() => onChange(option)}
            selected={value === option}
          />
        ))}
      </View>
    </View>
  );
}

function SettingToggle({ detail, icon, label, onValueChange, value }: {
  detail: string; icon: keyof typeof Ionicons.glyphMap; label: string; onValueChange: (value: boolean) => void; value: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons color={colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{label}</Text>
        <Text style={styles.settingDetail}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        onValueChange={onValueChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );
}


function ShimmerProfile() {
  const opacity = useShimmer();
  return (
    <Animated.View style={{ opacity, gap: spacing.md }}>
      <View style={{ height: 24, width: "40%", backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }} />
      <View style={{ height: 16, width: "60%", backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }} />
      <View style={{ height: spacing.md }} />
      <View style={{ height: 80, backgroundColor: colors.surfaceSoft, borderRadius: radius.card }} />
      <View style={{ height: spacing.md }} />
      <View style={{ height: 16, width: "30%", backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }} />
      <View style={{ height: 52, backgroundColor: colors.surfaceSoft, borderRadius: radius.md }} />
      <View style={{ height: 52, backgroundColor: colors.surfaceSoft, borderRadius: radius.md }} />
      <View style={{ height: spacing.md }} />
      <View style={{ height: 16, width: "30%", backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }} />
      <View style={{ height: 100, backgroundColor: colors.surfaceSoft, borderRadius: radius.card }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xxs, marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  savedToast: {
    alignItems: "center", alignSelf: "center", backgroundColor: colors.successSoft,
    borderRadius: radius.round, flexDirection: "row", gap: spacing.xs,
    marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  savedText: { ...typography.caption, color: colors.textPrimary },
  profileBand: {
    alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radius.card,
    flexDirection: "row", gap: spacing.sm, padding: spacing.md,
  },
  avatar: {
    alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.round,
    height: 52, justifyContent: "center", width: 52,
  },
  profileCopy: { flex: 1, gap: spacing.xxs },
  profileTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  profileDetail: { ...typography.caption, color: colors.textSecondary },
  demoBadge: {
    backgroundColor: colors.surfaceGlass, borderRadius: radius.round,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  demoText: { ...typography.caption, color: colors.primary },
  section: { marginTop: spacing.xl },
  preferenceCard: { gap: spacing.md },
  controlGroup: { gap: spacing.sm },
  controlLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  controlDetail: { ...typography.caption, color: colors.textSecondary },
  divider: { backgroundColor: colors.borderSubtle, height: StyleSheet.hairlineWidth },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  choiceChip: {
    alignItems: "center", backgroundColor: colors.surfaceSoft, borderColor: colors.borderSubtle,
    borderRadius: radius.round, borderWidth: 1, justifyContent: "center",
    minHeight: spacing.touchTarget, paddingHorizontal: spacing.md,
  },
  selectedChip: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  choiceText: { ...typography.caption, color: colors.textSecondary },
  selectedChoiceText: { color: colors.primary },
  pressed: { opacity: 0.64 },
  lifestyleGroup: { gap: spacing.sm },
  lifestyleLabelRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  settingsCard: { gap: spacing.sm },
  settingRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 58 },
  settingIcon: {
    alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radius.sm,
    height: 38, justifyContent: "center", width: 38,
  },
  settingCopy: { flex: 1, gap: spacing.xxs },
  settingTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  settingDetail: { ...typography.caption, color: colors.textSecondary },
  footerNote: {
    alignItems: "center", flexDirection: "row", gap: spacing.xs,
    justifyContent: "center", marginBottom: spacing.lg, marginTop: spacing.xl,
  },
  footerText: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
});
