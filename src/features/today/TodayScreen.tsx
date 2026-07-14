import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type DimensionValue } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Card, EmptyState, ErrorState, PrimaryButton, Screen, SectionHeader } from "@/components/common";
import { useShimmer } from "@/hooks/useShimmer";
import { colors, radius, spacing, typography } from "@/theme";
import type { ChecklistItem } from "@/types/ai";
import { useScheduleActions, useScheduleStore, usePreferenceStore } from "@/stores/StoreProvider";
import { generateReminders, getNextReminder, formatReminderTime } from "@/services/notification";
import type { ReminderEntry } from "@/services/notification";
import type { MBTIType } from "@/types/preference";
import { getCachedLocation } from "@/services/map";

function mbtiGreeting(mbti?: MBTIType | "unknown"): string {
  const map: Record<string, string> = {
    INTJ: "保持专注", INTP: "灵感闪现", ENTJ: "掌控全局", ENTP: "脑洞大开",
    INFJ: "温柔前行", INFP: "随心而行", ENFJ: "充满能量", ENFP: "拥抱可能",
    ISTJ: "踏实可靠", ISFJ: "温柔守护", ESTJ: "高效执行", ESFJ: "温暖关怀",
    ISTP: "冷静应对", ISFP: "享受当下", ESTP: "勇敢冒险", ESFP: "快乐闪耀",
  };
  return map[mbti ?? ""] ?? "今天节奏适中";
}
function formatToday() {
  const d = new Date();
  return d.toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" });
}
function todayISO() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function TodayScreen() {
  const router = useRouter();
  const todaySchedules = useScheduleStore((s) => s.todaySchedules);
  const todayPlans = useScheduleStore((s) => s.todayPlans);
  const todayChecklist = useScheduleStore((s) => s.todayChecklist);
  const todayTimeline = useScheduleStore((s) => s.todayTimeline);
  const isLoading = useScheduleStore((s) => s.isLoading);
  const error = useScheduleStore((s) => s.error);
  const [locationText, setLocationText] = useState("");
  const { loadToday, toggleChecklistItem } = useScheduleActions();
  const preference = usePreferenceStore((s) => s.preference);
  const [reminders, setReminders] = useState<ReminderEntry[]>([]);
  const [nextReminder, setNextReminder] = useState<ReminderEntry | null>(null);

  const headerAnim = useMemo(() => new Animated.Value(0), []);
  const summaryAnim = useMemo(() => new Animated.Value(0), []);

  useFocusEffect(
    useCallback(() => {
      void loadToday(todayISO());
      setTimeout(() => {
        // Reminders generated after data loads — uses closures, safe here
        const loc = getCachedLocation();
        if (loc?.city) setLocationText(loc.city);
      }, 100);
    }, [loadToday])
  );

  // Generate reminders when todayPlans/todaySchedules change
  useEffect(() => {
    if (todayPlans.length > 0) {
      const allReminders = todayPlans.flatMap((plan) => {
        const schedule = todaySchedules.find((s) => s.id === plan.scheduleId);
        return schedule ? generateReminders(plan, schedule.title, schedule.startAt, preference) : [];
      });
      setReminders(allReminders);
      setNextReminder(getNextReminder(allReminders));
    }
  }, [todayPlans, todaySchedules, preference]);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(headerAnim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(summaryAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }, 150);
    }
  }, [isLoading, headerAnim, summaryAnim]);

  const pendingItems = todayChecklist.filter((item) => !item.done);
  const plan = todayPlans[0];
  const totalRisks = todayPlans.reduce((sum, p) => sum + p.risks.length, 0);

  if (isLoading) {
    return (<Screen><ShimmerSkeleton /></Screen>);
  }
  if (error && todaySchedules.length === 0) {
    return (<Screen><ErrorState message={error} onRetry={() => { void loadToday(todayISO()); }} /></Screen>);
  }
  if (todaySchedules.length === 0) {
    return (
      <Screen>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
          <View style={styles.kickerRow}><Text style={styles.kicker}>{formatToday()}</Text>{locationText ? <Text style={styles.locationKicker}> · {locationText}</Text> : null}</View>
          <Text style={styles.title}>{mbtiGreeting(preference.mbti)}</Text>
        </Animated.View>
        <EmptyState icon="sunny-outline" title="今天没有日程" description="点击下方创建，让 AI 帮你提前准备吧">
          <PrimaryButton accessibilityLabel="添加日程" label="添加日程" onPress={() => router.push("/create" as any)} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen>
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        <View style={styles.kickerRow}><Text style={styles.kicker}>{formatToday()}</Text>{locationText ? <Text style={styles.locationKicker}> · {locationText}</Text> : null}</View>
        <Text style={styles.title}>{mbtiGreeting(preference.mbti)}</Text>
      </Animated.View>
      {plan ? (
        <Animated.View style={{ opacity: summaryAnim, transform: [{ translateY: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <LinearGradient colors={[colors.primarySoft, "#D4F1F7", colors.primarySoft]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.gradientCard}>
            <View style={styles.cardEyebrowRow}><Ionicons color={colors.primary} name="sparkles-outline" size={16} /><Text style={styles.cardEyebrow}>AI 今日摘要</Text></View>
            <Text style={styles.summary}>{plan.summary}</Text>
            <View style={styles.statsRow}>
              <AnimatedStat delay={300} label="日程" value={todaySchedules.length} />
              <AnimatedStat delay={380} label="待准备" value={pendingItems.length} />
              <AnimatedStat delay={460} label="风险提醒" value={totalRisks} />
            </View>
          </LinearGradient>
        </Animated.View>
      ) : null}
      {pendingItems.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader subtitle="AI 从建议中提取的可执行事项" title="待准备" />
          <Card style={styles.timelineCard}>
            {pendingItems.map((item, index) => (
              <ChecklistRow index={index} item={item} key={item.id} onToggle={() => toggleChecklistItem(item.planId, item.id)} />
            ))}
          </Card>
        </View>
      ) : null}
      {todayChecklist.some((item) => item.done) && pendingItems.length > 0 ? (
        <View style={styles.doneSection}>
          <View style={styles.divider} />
          <Text style={styles.doneLabel}>已完成</Text>
          {todayChecklist.filter((item) => item.done).map((item) => (
            <View key={item.id} style={styles.doneRow}><Ionicons color={colors.success} name="checkmark-circle" size={18} /><Text style={styles.doneText}>{item.title}</Text></View>
          ))}
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionHeader subtitle="今天的时间线和 AI 准备节点" title="时间轴" />
        <Card style={styles.timelineCard}>
          {todayTimeline.map((item, index) => (
            <TimelineRow index={index} isLast={index === todayTimeline.length - 1} item={item} key={`${item.time}-${item.title}`} onPress={() => { const schedule = todaySchedules.find((s) => s.id === item.scheduleId); if (schedule) router.push(`/schedule/${schedule.id}` as any); }} />
          ))}
        </Card>
      </View>
      {todayPlans.some((p) => p.risks.length > 0) ? (
        <View style={styles.section}>
          <SectionHeader title="风险提醒" />
          <Card>{todayPlans.flatMap((p) => p.risks.map((risk, ri) => (<RiskRow index={ri} key={`${p.id}-risk-${ri}`} risk={risk} />)))}</Card>
        </View>
      ) : null}
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

function AnimatedStat({ delay, label, value }: { delay: number; label: string; value: number }) {
  const anim = useMemo(() => new Animated.Value(0), []);
  useEffect(() => { const t = setTimeout(() => { Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 3 }).start(); }, delay); return () => clearTimeout(t); }, [anim, delay]);
  return (
    <Animated.View style={[styles.stat, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
      <Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function ChecklistRow({ index, item, onToggle }: { index: number; item: ChecklistItem; onToggle: () => void }) {
  const slide = useMemo(() => new Animated.Value(16), []);
  const opacity = useMemo(() => new Animated.Value(0), []);
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => { setTimeout(() => { Animated.parallel([Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }), Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true })]).start(); }, index * 70); }, [index, slide, opacity]);
  const handleToggle = () => { Animated.sequence([Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 4 })]).start(); onToggle(); };
  return (
    <Animated.View style={{ transform: [{ translateY: slide }], opacity }}>
      <Pressable onPress={handleToggle} style={({ pressed }) => [chStyles.row, pressed ? styles.pressed : null]}>
        <Animated.View style={[chStyles.iconBox, { transform: [{ scale }] }]}>
          <Ionicons color={item.done ? colors.success : colors.textMuted} name={item.done ? "checkmark-circle" : "ellipse-outline"} size={22} />
        </Animated.View>
        <View style={chStyles.copy}><Text style={[chStyles.title, item.done ? chStyles.titleDone : null]}>{item.title}</Text>{item.reason ? <Text style={chStyles.reason}>{item.reason}</Text> : null}</View>
      </Pressable>
    </Animated.View>
  );
}

function TimelineRow({ index, isLast, item, onPress }: { index: number; isLast: boolean; item: { time: string; title: string; description?: string }; onPress?: () => void }) {
  const slide = useMemo(() => new Animated.Value(20), []), opacity = useMemo(() => new Animated.Value(0), []);
  useEffect(() => { setTimeout(() => { Animated.parallel([Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }), Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true })]).start(); }, index * 70); }, [index, slide, opacity]);
  return (
    <Animated.View style={{ transform: [{ translateX: slide }], opacity }}>
      <Pressable onPress={onPress} style={({ pressed }) => [tlStyles.item, pressed ? styles.pressed : null]}>
        <View style={tlStyles.timePill}><Ionicons color={colors.primary} name="time-outline" size={15} /><Text style={tlStyles.time}>{item.time}</Text></View>
        <View style={tlStyles.copy}><Text style={tlStyles.title}>{item.title}</Text>{item.description ? <Text style={tlStyles.desc}>{item.description}</Text> : null}</View>
      </Pressable>
      {!isLast ? <View style={tlStyles.connector} /> : null}
    </Animated.View>
  );
}

function RiskRow({ index, risk }: { index: number; risk: { title: string; detail: string } }) {
  const slide = useMemo(() => new Animated.Value(12), []), opacity = useMemo(() => new Animated.Value(0), []);
  useEffect(() => { setTimeout(() => { Animated.parallel([Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true }), Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true })]).start(); }, index * 60); }, [index, slide, opacity]);
  return (
    <Animated.View style={[styles.riskRow, { transform: [{ translateY: slide }], opacity }]}>
      <Ionicons color={colors.warning} name="alert-circle-outline" size={22} />
      <View style={styles.riskCopy}><Text style={styles.riskTitle}>{risk.title}</Text><Text style={styles.riskDetail}>{risk.detail}</Text></View>
    </Animated.View>
  );
}

function ShimmerSkeleton() {
  const opacity = useShimmer();
  return (
    <Animated.View style={[styles.shimmerContainer, { opacity }]}>
      <ShimmerBlock height={16} width="45%" /><ShimmerBlock height={32} width="70%" style={styles.shimmerGap} />
      <View style={styles.shimmerSection}><ShimmerBlock height={110} width="100%" /></View>
      <View style={styles.shimmerSection}><ShimmerBlock height={16} width="30%" /><View style={{ height: spacing.sm }} /><ShimmerBlock height={84} width="100%" /></View>
      <View style={styles.shimmerSection}><ShimmerBlock height={16} width="30%" /><View style={{ height: spacing.sm }} /><ShimmerBlock height={64} width="100%" /><View style={{ height: spacing.xs }} /><ShimmerBlock height={64} width="100%" /></View>
    </Animated.View>
  );
}

function ShimmerBlock({ height, style, width }: { height: number; style?: object; width: DimensionValue }) {
  return <View style={[{ backgroundColor: colors.surfaceSoft, borderRadius: radius.md, height, width }, style]} />;
}

const chStyles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: spacing.touchTarget, paddingVertical: spacing.sm },
  iconBox: { alignItems: "center", justifyContent: "center", minHeight: 32, minWidth: 32 },
  copy: { flex: 1, gap: spacing.xxs },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  titleDone: { color: colors.textMuted, textDecorationLine: "line-through" },
  reason: { ...typography.caption, color: colors.textSecondary },
});

const tlStyles = StyleSheet.create({
  item: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.xs },
  timePill: { alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: 12, flexDirection: "row", gap: spacing.xxs, height: 34, paddingHorizontal: spacing.xs },
  time: { ...typography.caption, color: colors.primary },
  copy: { flex: 1, gap: spacing.xxs },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  desc: { ...typography.caption, color: colors.textSecondary },
  connector: { backgroundColor: colors.borderSubtle, height: 16, marginLeft: 36, width: 2 },
});

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  kicker: { ...typography.caption, color: colors.textSecondary },
  kickerRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  locationKicker: { ...typography.caption, color: colors.primary },
  title: { ...typography.title, color: colors.textPrimary },
  gradientCard: { borderRadius: radius.card, marginBottom: spacing.lg, padding: spacing.md, borderColor: "rgba(8, 145, 178, 0.1)", borderWidth: StyleSheet.hairlineWidth },
  cardEyebrowRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  cardEyebrow: { ...typography.caption, color: colors.primary },
  summary: { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs, lineHeight: 22 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  stat: { backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 14, flex: 1, padding: spacing.sm, borderColor: "rgba(8, 145, 178, 0.08)", borderWidth: StyleSheet.hairlineWidth },
  statValue: { ...typography.subheadline, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  section: { marginTop: spacing.lg },
  timelineCard: { gap: 0 },
  pressed: { opacity: 0.64 },
  doneSection: { marginTop: spacing.sm },
  divider: { backgroundColor: colors.borderSubtle, height: StyleSheet.hairlineWidth, marginBottom: spacing.sm },
  doneLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  doneRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xxs },
  doneText: { ...typography.caption, color: colors.textMuted },
  riskRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, minHeight: 48, paddingVertical: spacing.sm },
  riskCopy: { flex: 1, gap: spacing.xxs },
  riskTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  riskDetail: { ...typography.caption, color: colors.textSecondary },
  shimmerContainer: { flex: 1, gap: spacing.md },
  shimmerGap: { marginTop: spacing.xs },
  shimmerSection: { marginTop: spacing.lg },
  bottomSpacer: { height: spacing.xl },
});
