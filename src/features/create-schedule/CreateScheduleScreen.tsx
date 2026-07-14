import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Card, ErrorState, PrimaryButton, Screen, SegmentedTabs } from "@/components/common";
import { colors, radius, spacing, typography } from "@/theme";
import type { Schedule, ScheduleCategory } from "@/types/schedule";
import type { ParsedScheduleDraft } from "@/types/ai";
import { useScheduleActions, usePreferenceStore } from "@/stores/StoreProvider";
import { getAIClient } from "@/services/ai/getAIClient";

type CreateMode = "ai" | "manual";

const modes = [
  { label: "AI 辅助", value: "ai" },
  { label: "手动", value: "manual" },
] satisfies Array<{ label: string; value: CreateMode }>;

const promptExamples = ["明天下午3点和小雨在万象城吃饭", "周六早上7点半去滨江公园跑步"];

const parseSteps = [
  "解析时间信息...",
  "识别场景类型...",
  "提取地点信息...",
  "生成草稿...",
];

const categoryOptions: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: ScheduleCategory }> = [
  { icon: "people-outline", label: "社交", value: "dating_social" },
  { icon: "fitness-outline", label: "健康", value: "health_fitness" },
  { icon: "briefcase-outline", label: "工作", value: "work_study" },
  { icon: "navigate-outline", label: "出行", value: "travel_errand" },
  { icon: "ellipsis-horizontal", label: "其他", value: "other" },
];

const categoryLabels: Record<ScheduleCategory, string> = {
  dating_social: "社交", health_fitness: "健康", work_study: "工作", travel_errand: "出行", other: "其他",
};

// useEntrance hook: returns animated style for staggered fade-in
function useEntrance(delay = 0) {
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
  return { opacity, transform: [{ translateY: slide }] };
}

function buildScheduleId() { return `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function todayISO() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreateScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const calendarDate = params.date ?? todayISO();
  const [mode, setMode] = useState<CreateMode>("ai");
  const [prompt, setPrompt] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseStepIndex, setParseStepIndex] = useState(-1);
  const [draftVisible, setDraftVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<ParsedScheduleDraft | null>(null);
  const [dateConflict, setDateConflict] = useState<{ aiDate: string; calDate: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [manual, setManual] = useState({
    title: "", date: calendarDate, time: "09:00", location: "", note: "", category: "other" as ScheduleCategory,
  });

  const { saveNewSchedule } = useScheduleActions();
  const preference = usePreferenceStore((s) => s.preference);

  const draftAnim = useRef(new Animated.Value(0)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const headerEntrance = useEntrance(0);
  const tabsEntrance = useEntrance(80);
  const contentEntrance = useEntrance(160);

  useFocusEffect(useCallback(() => {
    setPrompt(""); setDraftVisible(false); setDraftData(null);
    setParsing(false); setSuccessMessage(null); setParseError(null);
    setDateConflict(null);
    setManual({ title: "", date: calendarDate, time: "09:00", location: "", note: "", category: "other" });
    draftAnim.setValue(0);
    successFade.setValue(0);
  }, [calendarDate]));

  const changeMode = (value: CreateMode) => { setMode(value); setSuccessMessage(null); setParseError(null); };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setParseError("请输入日程描述，例如「明天下午3点和小雨在万象城吃饭」");
      return;
    }
    setParseError(null);
    const ai = getAIClient();
    setParsing(true); setParseStepIndex(-1); setDraftVisible(false); draftAnim.setValue(0);
    const delay = 320;
    parseSteps.forEach((_, i) => { setTimeout(() => setParseStepIndex(i), (i + 1) * delay); });
    try {
      const draft = await ai.parseScheduleDraft(prompt, preference);
      setDraftData(draft);
      if (draft.startAt) {
        const aiDate = draft.startAt.slice(0, 10);
        if (aiDate !== calendarDate && calendarDate !== todayISO()) {
          setDateConflict({ aiDate, calDate: calendarDate });
        }
      }
    } catch {
      setParseError("AI 解析失败，请检查网络后重试");
    }
    finally {
      setParsing(false);
      if (!parseError) {
        setDraftVisible(true);
        setTimeout(() => {
          Animated.spring(draftAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 3 }).start();
        }, 100);
      }
    }
  };

  const handleSaveDraft = useCallback(() => {
    if (!draftData) return;
    const schedule: Schedule = {
      id: buildScheduleId(),
      title: draftData.title,
      startAt: draftData.startAt ?? `${calendarDate}T09:00:00+08:00`,
      endAt: draftData.endAt ?? undefined,
      location: draftData.location ?? undefined,
      note: draftData.note ?? undefined,
      category: draftData.category ?? "other",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "ai_chat" as const,
      status: "upcoming" as const,
      aiPlanId: undefined,
    };
    saveNewSchedule(schedule);
    setSuccessMessage("日程已创建");
    Animated.timing(successFade, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(successFade, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        setSuccessMessage(null);
      }, 1800);
    });
    setTimeout(() => { router.replace("/"); }, 800);
  }, [draftData, calendarDate, saveNewSchedule, router, draftAnim, successFade]);

  const handleSaveManual = useCallback(() => {
    if (!manual.title.trim()) {
      setParseError("请填写日程标题");
      return;
    }
    const schedule: Schedule = {
      id: buildScheduleId(),
      title: manual.title,
      startAt: `${manual.date}T${manual.time}:00+08:00`,
      location: manual.location || undefined,
      note: manual.note || undefined,
      category: manual.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "manual" as const,
      status: "upcoming" as const,
    };
    saveNewSchedule(schedule);
    setSuccessMessage("日程已创建");
    Animated.timing(successFade, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(successFade, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        setSuccessMessage(null);
      }, 1800);
    });
    setTimeout(() => { router.replace("/"); }, 800);
  }, [manual, saveNewSchedule, router, successFade]);

  // Error state
  if (parseError && !draftVisible && !parsing) {
    return (
      <Screen>
        <Animated.View style={headerEntrance}>
          <View style={styles.header}>
            <Text style={styles.title}>添加日程</Text>
            <Text style={styles.subtitle}>
              {mode === "ai" ? "用自然语言描述，AI 帮你结构化创建" : "手动填写日程信息"}
            </Text>
          </View>
        </Animated.View>
        <Animated.View style={tabsEntrance}>
          <SegmentedTabs onChange={changeMode} options={modes} value={mode} />
        </Animated.View>
        <ErrorState message={parseError} onRetry={mode === "ai" ? handleAnalyze : () => setParseError(null)} style={styles.inlineError} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Animated.View style={headerEntrance}>
        <View style={styles.header}>
          <Text style={styles.title}>添加日程</Text>
          <Text style={styles.subtitle}>
            {mode === "ai" ? "用自然语言描述，AI 帮你结构化创建" : "手动填写日程信息"}
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={tabsEntrance}>
        <SegmentedTabs onChange={changeMode} options={modes} value={mode} />
      </Animated.View>

      <Animated.View key={mode} style={contentEntrance}>
        {mode === "ai" ? (
          <View style={styles.modeContent}>
            <View style={styles.aiIntro}>
              <LinearGradient
                colors={[colors.primarySoft, "#D4F1F7"]}
                style={styles.aiIcon}
              >
                <Ionicons color={colors.primary} name="sparkles" size={22} />
              </LinearGradient>
              <View style={styles.aiCopy}>
                <Text style={styles.sectionTitle}>AI 智能解析</Text>
                <Text style={styles.sectionDetail}>一句话描述你的日程，我来帮你填好一切</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <TextInput
                editable={!parsing}
                multiline
                onChangeText={setPrompt}
                placeholder="比如：明天下午3点和小雨在万象城吃饭..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.promptInput]}
                textAlignVertical="top"
                value={prompt}
              />
              {!prompt ? (
                <View style={styles.exampleRow}>
                  {promptExamples.map((example) => (
                    <Pressable
                      key={example}
                      onPress={() => setPrompt(example)}
                      style={({ pressed }) => [styles.exampleChip, pressed ? styles.pressed : null]}
                    >
                      <Text style={styles.exampleText}>{example}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {parsing ? (
              <Card style={styles.parsingCard}>
                {parseSteps.map((step, i) => (
                  <View key={step} style={styles.parseStepRow}>
                    <View style={styles.parseSpinner}>
                      {i <= parseStepIndex ? (
                        <Ionicons color={colors.success} name="checkmark-circle" size={20} />
                      ) : i === parseStepIndex + 1 ? (
                        <Animated.View style={styles.parseSpinnerDot} />
                      ) : (
                        <View style={[styles.parseSpinnerDot, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                    <Text style={[
                      styles.parseStepText,
                      i < parseStepIndex && styles.parseStepDone,
                      i === parseStepIndex && styles.parseStepActive,
                    ]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {draftVisible && draftData ? (
              <Animated.View style={[
                styles.draftCard,
                {
                  opacity: draftAnim,
                  transform: [{ translateY: draftAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                }
              ]}>
                <Card>
                  <View style={styles.draftHeader}>
                    <View style={styles.draftHeaderContent}>
                      <Text style={styles.draftEyebrow}>AI 解析结果</Text>
                      <Text style={styles.draftTitle}>{draftData.title}</Text>
                    </View>
                    {draftData.confidence !== undefined ? (
                      <View style={styles.confidenceBadge}>
                        <Ionicons color={colors.success} name="shield-checkmark-outline" size={14} />
                        <Text style={styles.confidenceText}>{draftData.confidence === "high" ? "高" : draftData.confidence === "medium" ? "中" : "低"} 置信度</Text>
                      </View>
                    ) : null}
                  </View>
                  {draftData.startAt ? (
                    <View style={styles.draftRow}>
                      <Ionicons color={colors.textMuted} name="time-outline" size={18} />
                      <Text style={styles.draftRowText}>{draftData.startAt}</Text>
                    </View>
                  ) : null}
                  {draftData.location ? (
                    <View style={styles.draftRow}>
                      <Ionicons color={colors.textMuted} name="location-outline" size={18} />
                      <Text style={styles.draftRowText}>{draftData.location}</Text>
                    </View>
                  ) : null}
                  {draftData.note ? (
                    <View style={styles.draftRow}>
                      <Ionicons color={colors.textMuted} name="document-text-outline" size={18} />
                      <Text style={styles.draftRowText}>{draftData.note}</Text>
                    </View>
                  ) : null}
                  {dateConflict ? (
                    <Text style={styles.reviewNote}>
                      AI 识别的日期是 {dateConflict.aiDate}，与当前选择的 {dateConflict.calDate} 不同，请确认
                    </Text>
                  ) : null}
                  <Text style={styles.reviewNote}>请检查以上信息，确认无误后保存</Text>
                </Card>
                <View style={styles.draftActions}>
                  <Pressable
                    onPress={() => { setDraftVisible(false); setDraftData(null); }}
                    style={({ pressed }) => [styles.draftCancel, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.draftCancelText}>重新输入</Text>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton label="保存日程" onPress={handleSaveDraft} />
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {!draftVisible && !parsing ? (
              <PrimaryButton disabled={!prompt.trim()} label="AI 智能解析" onPress={handleAnalyze} />
            ) : null}
          </View>
        ) : (
          <View style={styles.modeContent}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>标题</Text>
              <TextInput
                onChangeText={(text) => setManual((prev) => ({ ...prev, title: text }))}
                placeholder="日程标题"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={manual.title}
              />
            </View>
            <View style={styles.inlineFields}>
              <View style={[styles.fieldGroup, styles.inlineField]}>
                <Text style={styles.fieldLabel}>日期</Text>
                <TextInput
                  onChangeText={(text) => setManual((prev) => ({ ...prev, date: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={manual.date}
                />
              </View>
              <View style={[styles.fieldGroup, styles.inlineField]}>
                <Text style={styles.fieldLabel}>时间</Text>
                <TextInput
                  onChangeText={(text) => setManual((prev) => ({ ...prev, time: text }))}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={manual.time}
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>地点</Text>
              <TextInput
                onChangeText={(text) => setManual((prev) => ({ ...prev, location: text }))}
                placeholder="地点（选填）"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={manual.location}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>备注</Text>
              <TextInput
                multiline
                onChangeText={(text) => setManual((prev) => ({ ...prev, note: text }))}
                placeholder="备注（选填）"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.noteInput]}
                textAlignVertical="top"
                value={manual.note}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>分类</Text>
              <View style={styles.categoryGrid}>
                {categoryOptions.map((cat) => (
                  <Pressable
                    key={cat.value}
                    onPress={() => setManual((prev) => ({ ...prev, category: cat.value }))}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      manual.category === cat.value && styles.selectedCategory,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Ionicons
                      color={manual.category === cat.value ? colors.primary : colors.textMuted}
                      name={cat.icon}
                      size={18}
                    />
                    <Text style={[
                      styles.categoryLabel,
                      manual.category === cat.value && styles.selectedCategoryLabel,
                    ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <PrimaryButton disabled={!manual.title.trim()} label="保存日程" onPress={handleSaveManual} />
          </View>
        )}
      </Animated.View>

      {successMessage ? (
        <Animated.View style={[styles.successBanner, { opacity: successFade }]}>
          <Ionicons color={colors.success} name="checkmark-circle" size={20} />
          <Text style={styles.successText}>{successMessage}</Text>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

// Sub-components

const styles = StyleSheet.create({
  header: { gap: spacing.xxs, marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  modeContent: { gap: spacing.md, marginTop: spacing.lg },
  aiIntro: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  aiIcon: { alignItems: "center", borderRadius: radius.round, height: 46, justifyContent: "center", width: 46 },
  aiCopy: { flex: 1, gap: spacing.xxs },
  sectionTitle: { ...typography.subheadline, color: colors.textPrimary },
  sectionDetail: { ...typography.caption, color: colors.textSecondary },
  fieldGroup: { gap: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.textSecondary },
  input: { ...typography.body, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, color: colors.textPrimary, minHeight: spacing.touchTarget, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  promptInput: { minHeight: 116 },
  noteInput: { minHeight: 92 },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  exampleChip: { backgroundColor: colors.surfaceSoft, borderRadius: radius.round, minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md },
  exampleText: { ...typography.caption, color: colors.textSecondary },
  pressed: { opacity: 0.66 },
  parsingCard: { gap: spacing.sm },
  parseStepRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 32 },
  parseSpinner: { alignItems: "center", height: 20, justifyContent: "center", width: 20 },
  parseSpinnerDot: { backgroundColor: colors.primary, borderRadius: radius.round, height: 8, width: 8 },
  parseStepText: { ...typography.body, color: colors.textMuted },
  parseStepDone: { color: colors.textSecondary },
  parseStepActive: { color: colors.textPrimary, fontWeight: "600" },
  draftCard: { gap: spacing.md },
  draftHeader: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  draftHeaderContent: { flex: 1, minWidth: 0 },
  draftEyebrow: { ...typography.caption, color: colors.primary },
  draftTitle: { ...typography.subheadline, color: colors.textPrimary, flexWrap: "wrap", marginTop: spacing.xxs },
  confidenceBadge: { alignItems: "center", backgroundColor: colors.successSoft, borderRadius: radius.round, flexDirection: "row", flexShrink: 0, gap: spacing.xxs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
  confidenceText: { ...typography.caption, color: colors.success },
  draftRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  draftRowText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  reviewNote: { ...typography.caption, color: colors.textMuted },
  draftActions: { flexDirection: "row", gap: spacing.sm },
  draftCancel: { alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: radius.md, justifyContent: "center", minHeight: spacing.touchTarget, paddingHorizontal: spacing.lg },
  draftCancelText: { ...typography.bodyStrong, color: colors.textSecondary },
  successBanner: { alignItems: "center", backgroundColor: colors.successSoft, borderRadius: radius.md, flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, minHeight: spacing.touchTarget, paddingHorizontal: spacing.md },
  successText: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  inlineFields: { flexDirection: "row", gap: spacing.sm },
  inlineField: { flex: 1, minWidth: 0 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  categoryChip: { alignItems: "center", backgroundColor: colors.surfaceSoft, borderColor: colors.borderSubtle, borderRadius: radius.round, borderWidth: 1, flexDirection: "row", gap: spacing.xs, minHeight: spacing.touchTarget, paddingHorizontal: spacing.md },
  selectedCategory: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  categoryLabel: { ...typography.caption, color: colors.textSecondary },
  selectedCategoryLabel: { color: colors.primary },
  askCard: { gap: spacing.md, marginTop: spacing.md },
  askCopy: { flex: 1, gap: spacing.xxs },
  askTitle: { ...typography.subheadline, color: colors.textPrimary },
  askDetail: { ...typography.caption, color: colors.textSecondary },
  askButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  chatYes: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  chatYesText: { ...typography.bodyStrong, color: colors.surface },
  chatNo: { flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  chatNoText: { ...typography.bodyStrong, color: colors.textSecondary },
  inlineError: { paddingVertical: spacing.md, paddingHorizontal: 0 },
});
