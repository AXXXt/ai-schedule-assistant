import { Ionicons } from "@expo/vector-icons";
import { addMonths, format, getDate, getDaysInMonth, startOfMonth, subMonths } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { Card, EmptyState, ErrorState, Screen, SectionHeader } from "@/components/common";
import { colors, radius, spacing, typography } from "@/theme";
import type { Schedule } from "@/types/schedule";
import { useScheduleActions, useScheduleStore } from "@/stores/StoreProvider";

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
const GRID_CELL = Math.floor((Dimensions.get("window").width - 56) / 7);
const cnWeekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function cnWeekday(date: Date) {
  return cnWeekdays[date.getDay()];
}

function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function todayStr(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function hasRisk(schedule: Schedule, riskPlanIds: Set<string>) {
  return schedule.aiPlanId ? riskPlanIds.has(schedule.aiPlanId) : false;
}

export function CalendarScreen() {
  const router = useRouter();
  const today = useMemo(() => getTodayDate(), []);
  const todayKey = useMemo(() => todayStr(), []);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  
  const allSchedules = useScheduleStore((s) => s.allSchedules);
  const allPlans = useScheduleStore((s) => s.allPlans);
  const isLoading = useScheduleStore((s) => s.isLoading);
  const error = useScheduleStore((s) => s.error);
  const { loadAllSchedules } = useScheduleActions();

  const monthSlide = useRef(new Animated.Value(0)).current;
  const monthOpacity = useRef(new Animated.Value(1)).current;
  const gridOpacity = useRef(new Animated.Value(1)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);

  const load = useCallback(() => {
    void loadAllSchedules();
  }, [loadAllSchedules]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const riskPlanIds = useMemo(() => {
    const ids = new Set<string>();
    for (const plan of allPlans) {
      if (plan.risks.length > 0) ids.add(plan.id);
    }
    return ids;
  }, [allPlans]);

  const days = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const schedulesByDay = useMemo(() => groupSchedulesByDay(allSchedules), [allSchedules]);
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedSchedules = schedulesByDay[selectedKey] ?? [];

  const goToday = useCallback(() => {
    const t = getTodayDate();
    setCurrentMonth(startOfMonth(t));
    setSelectedDate(t);
  }, []);

  const moveMonth = (direction: "previous" | "next") => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Phase 1: fade out
    Animated.timing(gridOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      const nextMonth = direction === "previous"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);
      setCurrentMonth(startOfMonth(nextMonth));
      setSelectedDate(startOfMonth(nextMonth));

      // Phase 2: fade in
      Animated.timing(gridOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start(() => {
        setIsTransitioning(false);
      });
    });

    // Month label slide animation
    const offset = direction === "previous" ? -30 : 30;
    monthSlide.setValue(offset);
    monthOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(monthSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 2 }),
      Animated.timing(monthOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  // Error state
  if (error && allSchedules.length === 0) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  // Loading state
  if (isLoading && allSchedules.length === 0) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ShimmerMonth />
          <ShimmerAgenda count={3} />
        </View>
      </Screen>
    );
  }

  // Empty state
  if (allSchedules.length === 0) {
    return (
      <Screen>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.title}>日历</Text>
            <Text style={styles.subtitle}>一览本月的节奏。</Text>
          </View>
        <Pressable
          accessibilityLabel="返回今天"
          accessibilityRole="button"
          onPress={goToday}
          style={({ pressed }) => [styles.todayButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.todayLabel}>今天</Text>
        </Pressable>
        </View>
        <EmptyState
          icon="calendar-outline"
          title="还没有日程"
          description="创建日程后，AI 会帮你安排每一天"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.title}>日历</Text>
          <Text style={styles.subtitle}>一览本月的节奏。</Text>
        </View>
        <Pressable
          accessibilityLabel="返回今天"
          accessibilityRole="button"
          onPress={goToday}
          style={({ pressed }) => [styles.todayButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.todayLabel}>今天</Text>
        </Pressable>
      </View>

      <View style={styles.monthBar}>
        <MonthButton icon="chevron-back" label="上个月" onPress={() => moveMonth("previous")} />
        <Animated.Text
          style={[styles.monthLabel, {
            opacity: monthOpacity,
            transform: [{ translateX: monthSlide }]
          }]}
        >
          {format(currentMonth, "yyyy年M月")}
        </Animated.Text>
        <MonthButton icon="chevron-forward" label="下个月" onPress={() => moveMonth("next")} />
      </View>

      <Animated.View style={{ opacity: gridOpacity }}>
      <View style={styles.calendarGrid}>
        {weekDays.map((day) => (
          <View key={day} style={[styles.weekDayCell, { width: GRID_CELL }]}>
            <Text style={styles.weekDay}>{day}</Text>
          </View>
        ))}
        {days.map((day, index) =>
          day ? (
            <CalendarDay
              date={day}
              hasSchedule={Boolean(schedulesByDay[format(day, "yyyy-MM-dd")]?.length)}
              hasRisk={Boolean(schedulesByDay[format(day, "yyyy-MM-dd")]?.some((s) => hasRisk(s, riskPlanIds)))}
              isSelected={format(day, "yyyy-MM-dd") === selectedKey}
              isToday={format(day, "yyyy-MM-dd") === todayKey}
              key={format(day, "yyyy-MM-dd")}
              onPress={() => setSelectedDate(day)}
            delay={index * 22} />
          ) : (
            <View key={`blank-${index}`} style={[styles.dayCell, { width: GRID_CELL }]} />
          )
        )}
      </View>
      </Animated.View>
      <Text style={styles.calHint}>长按月份标题可切换视图（v1 仅支持月视图）</Text>

      <SectionHeader title={`${cnWeekday(selectedDate)} · ${format(selectedDate, "M月d日")}`} />

      {selectedSchedules.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="当天没有日程"
          description="试试选择其他日期，或添加新日程"
          style={styles.compactEmpty}
        />
      ) : (
        <View style={styles.agendaList}>
          {selectedSchedules.map((schedule, index) => (
            <AgendaCard
              hasRisk={hasRisk(schedule, riskPlanIds)}
              index={index}
              key={schedule.id}
              onPress={() => router.push(`/schedule/${schedule.id}` as any)}
              schedule={schedule}
            />
          ))}
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

// Sub-components

function MonthButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 3 })
    ]).start();
    onPress();
  };
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={handlePress}>
      <Animated.View style={[styles.iconButton, { transform: [{ scale }] }]}>
        <Ionicons color={colors.primary} name={icon} size={22} />
      </Animated.View>
    </Pressable>
  );
}

function CalendarDay({ date, hasRisk, hasSchedule, isSelected, isToday, onPress, delay }: {
  date: Date; hasRisk: boolean; hasSchedule: boolean; isSelected: boolean; isToday: boolean; onPress: () => void; delay: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const enterSlide = useRef(new Animated.Value(6)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(enterSlide, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(enterOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, enterSlide, enterOpacity]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 4 })
    ]).start();
    onPress();
  };
  return (
    <Pressable onPress={handlePress} style={[styles.dayCell, { width: GRID_CELL }]}>
      <Animated.View style={[
        styles.dayNumber,
        isToday && styles.todayNumber,
        isSelected && styles.selectedDay,
        { transform: [{ scale }, { translateY: enterSlide }], opacity: enterOpacity }
      ]}>
        <Text style={[
          styles.dayText,
          isSelected && styles.selectedDayText,
          isToday && !isSelected && { color: colors.primary }
        ]}>
          {getDate(date)}
        </Text>
      </Animated.View>
      <View style={styles.dotRow}>
        {hasSchedule ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
        {hasRisk ? <View style={[styles.dot, { backgroundColor: colors.warning }]} /> : null}
      </View>
    </Pressable>
  );
}

function AgendaCard({ hasRisk, index, onPress, schedule }: {
  hasRisk: boolean; index: number; onPress: () => void; schedule: Schedule;
}) {
  const slide = useMemo(() => new Animated.Value(16), []);
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true })
      ]).start();
    }, index * 50);
  }, [index, slide, opacity]);

  return (
    <Animated.View style={{ transform: [{ translateY: slide }], opacity }}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.agendaCard, pressed ? styles.pressed : null]}>
        <View style={styles.timeColumn}>
          <Text style={styles.time}>{format(new Date(schedule.startAt), "HH:mm")}</Text>
          <View style={styles.timelineLine} />
        </View>
        <View style={styles.agendaCopy}>
          <Text style={styles.agendaTitle}>{schedule.title}</Text>
          <Text style={styles.agendaDetail}>{schedule.location ?? "未设置地点"}</Text>
          {schedule.note ? <Text style={styles.agendaNote}>{schedule.note}</Text> : null}
        </View>
        <Ionicons
          color={hasRisk ? colors.warning : colors.primary}
          name={hasRisk ? "alert-circle-outline" : "sparkles-outline"}
          size={22}
        />
      </Pressable>
    </Animated.View>
  );
}

function ShimmerMonth() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
  return (
    <Animated.View style={{ opacity }}>
      <View style={{ height: 16, width: "30%", backgroundColor: colors.surfaceSoft, borderRadius: radius.sm, marginBottom: spacing.md }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
        <View style={{ height: 36, width: 44, backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }} />
        <View style={{ height: 36, width: 100, backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }} />
        <View style={{ height: 36, width: 44, backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={`hdr-${i}`} style={{ width: GRID_CELL, alignItems: "center", paddingVertical: spacing.xs }}>
            <View style={{ height: 12, width: 20, backgroundColor: colors.surfaceSoft, borderRadius: 4 }} />
          </View>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <View key={`day-${i}`} style={{ width: GRID_CELL, height: 54, alignItems: "center", justifyContent: "center" }}>
            <View style={{ height: 28, width: 28, backgroundColor: colors.surfaceSoft, borderRadius: radius.round }} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function ShimmerAgenda({ count }: { count: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
  return (
    <Animated.View style={{ opacity, marginTop: spacing.lg, gap: spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={`agenda-${i}`} style={{ height: 80, backgroundColor: colors.surfaceSoft, borderRadius: radius.card }} />
      ))}
    </Animated.View>
  );
}

function buildMonthDays(month: Date): Array<Date | null> {
  const blanks = Array.from({ length: month.getDay() }, () => null);
  const dates = Array.from({ length: getDaysInMonth(month) }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1));
  return [...blanks, ...dates];
}

function groupSchedulesByDay(schedules: Schedule[]) {
  return schedules.reduce<Record<string, Schedule[]>>((groups, schedule) => {
    const key = schedule.startAt.slice(0, 10);
    groups[key] = [...(groups[key] ?? []), schedule];
    return groups;
  }, {});
}

const styles = StyleSheet.create({
  pageHeader: {
    alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg,
  },


  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xxs },
  todayButton: {
    alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radius.round,
    justifyContent: "center", minHeight: spacing.touchTarget, paddingHorizontal: spacing.md,
  },
  todayLabel: { ...typography.caption, color: colors.primary },
  monthBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  monthLabel: { ...typography.subheadline, color: colors.textPrimary },
  iconButton: { alignItems: "center", height: spacing.touchTarget, justifyContent: "center", width: spacing.touchTarget },
  pressed: { opacity: 0.64 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  weekDayCell: { alignItems: "center", paddingVertical: spacing.xs },
  weekDay: { ...typography.caption, color: colors.textMuted },
  dayCell: { alignItems: "center", height: 54, justifyContent: "center" },
  dayNumber: { alignItems: "center", borderRadius: radius.round, height: 34, justifyContent: "center", width: 34 },
  todayNumber: { borderColor: colors.primary, borderWidth: 1.5 },
  selectedDay: { backgroundColor: colors.primary },
  dayText: { ...typography.bodyStrong, color: colors.textPrimary },
  selectedDayText: { color: colors.surface },
  dotRow: { flexDirection: "row", gap: spacing.xxs, height: 6, marginTop: 2 },
  dot: { borderRadius: radius.round, height: 5, width: 5 },
  calHint: { ...typography.caption, color: colors.textMuted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.sm },
  agendaList: { gap: spacing.sm },
  agendaCard: {
    alignItems: "flex-start", backgroundColor: colors.surface, borderRadius: radius.card,
    borderColor: colors.borderSubtle, borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row", gap: spacing.sm, padding: spacing.md,
  },
  timeColumn: { alignItems: "center", width: 48 },
  time: { ...typography.caption, color: colors.primary },
  timelineLine: { backgroundColor: colors.borderSubtle, height: 42, marginTop: spacing.xs, width: 2 },
  agendaCopy: { flex: 1, gap: spacing.xxs },
  agendaTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  agendaDetail: { ...typography.caption, color: colors.textSecondary },
  agendaNote: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs },
  compactEmpty: { paddingVertical: spacing.lg },
  loadingContainer: { flex: 1, gap: spacing.lg },
  bottomSpacer: { height: spacing.xl },
});
