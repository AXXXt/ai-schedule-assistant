import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View, type DimensionValue, type ViewStyle } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Card, EmptyState, ErrorState, PrimaryButton, Screen, SectionHeader } from "@/components/common";
import { useShimmer } from "@/hooks/useShimmer";
import { colors, radius, spacing, typography } from "@/theme";
import type { AIPlan } from "@/types/ai";
import type { Schedule, ScheduleCategory } from "@/types/schedule";
import { useScheduleActions, useScheduleStore, usePreferenceStore } from "@/stores/StoreProvider";
import { getAIClient } from "@/services/ai/getAIClient";
import { AIPlanChat } from "@/features/create-schedule/AIPlanChat";
import { geocode, getCachedLocation, planRoutes, searchPOIByKeyword } from "@/services/map";
import type { RouteInfo } from "@/services/map";

function mbtiLabel(mbti?: string): string {
  const map: Record<string, string> = {
    INTJ: "理性", INTP: "探索", ENTJ: "果断", ENTP: "脑洞",
    INFJ: "温和", INFP: "细腻", ENFJ: "热情", ENFP: "自由",
    ISTJ: "务实", ISFJ: "守护", ESTJ: "高效", ESFJ: "关怀",
    ISTP: "实用", ISFP: "感性", ESTP: "行动", ESFP: "闪耀",
  };
  return map[mbti ?? ""] ?? "均衡";
}

function reminderLabel(style: string): string {
  if (style === "light") return "轻度提醒";
  if (style === "repeated") return "多次提醒";
  return "标准提醒";
}

function detailLabel(level: string): string {
  if (level === "brief") return "简洁计划";
  if (level === "detailed") return "详细计划";
  return "适中计划";
}
const categoryLabels: Record<ScheduleCategory, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  dating_social: { label: "社交", icon: "people-outline" },
  health_fitness: { label: "健康", icon: "fitness-outline" },
  work_study: { label: "工作", icon: "briefcase-outline" },
  travel_errand: { label: "出行", icon: "navigate-outline" },
  other: { label: "其他", icon: "ellipsis-horizontal" },
};

const generativeSteps = ["识别场景...", "分析上下文与偏好...", "构建时间线...", "生成准备清单...", "评估风险...", "收集建议..."];

function cnConfidence(c: string) { return c === "high" ? "高" : c === "medium" ? "中" : "低"; }
function buildPlanId() { return "plan-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8); }

type DetailStep = "locating" | "confirm_dest" | "select_route" | "generating" | "done";

const routeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  driving: "car-outline", transit: "bus-outline", biking: "bicycle-outline", taxi: "car-sport-outline",
};
const routeLabels: Record<string, string> = { driving: "自驾", transit: "公交", biking: "骑行", taxi: "打车" };

function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  return min < 60 ? min + "分钟" : Math.floor(min / 60) + "小时" + (min % 60) + "分钟";
}
function formatDistance(meters: number): string {
  return meters >= 1000 ? (meters / 1000).toFixed(1) + "km" : meters + "m";
}

export function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const selectedSchedule = useScheduleStore((s) => s.selectedSchedule);
  const selectedPlan = useScheduleStore((s) => s.selectedPlan);
  const isLoading = useScheduleStore((s) => s.isLoading);
  const error = useScheduleStore((s) => s.error);
  const { loadScheduleDetail, toggleChecklistItem, saveAIPlan } = useScheduleActions();
  const preference = usePreferenceStore((s) => s.preference);

  const [step, setStep] = useState<DetailStep>("locating");
  const [geocodeResult, setGeocodeResult] = useState<{ lng: number; lat: number; formattedAddress: string; city: string } | null>(null);
  const [geocodeError, setGeocodeError] = useState(false);
  const [destOverride, setDestOverride] = useState("");
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [showGenerating, setShowGenerating] = useState(false);
  const [genStepIndex, setGenStepIndex] = useState(-1);
  const [genComplete, setGenComplete] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState<import("@/types/ai").SuggestionItem[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [locatingText, setLocatingText] = useState("正在定位目的地...");
  const [userCoords, setUserCoords] = useState<{ lng: number; lat: number } | null>(null);
  const planIntroAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => { if (id) { void loadScheduleDetail(id); } }, [id, loadScheduleDetail]));

  const schedule: Schedule | undefined = selectedSchedule;
  const plan: AIPlan | undefined = selectedPlan;

  useEffect(() => {
    if (!schedule || plan || step !== "locating") return;
    if (!schedule.location) { setStep("done"); return; }

    let cancelled = false;
    async function locate() {
      try {
        const cached = getCachedLocation();
        let city: string = cached?.city ?? ""; if (!city) { try { const loc = await require("@/services/map").getCurrentPosition(); city = loc.city ?? ""; } catch {} }
        let result = null; const pois = await searchPOIByKeyword(schedule!.location!, city!, undefined, 3); if (pois.length > 0) { const p = pois[0]!; const [plng, plat] = p.location.split(",").map(Number); result = { lng: plng!, lat: plat!, formattedAddress: p.name + "（" + p.address + "）" }; } if (!result) { result = await geocode(schedule!.location!, city!); } console.log("LOCATE RESULT:", result?.formattedAddress);
        if (cancelled) return;
        if (result) {
          setGeocodeResult({ ...result, city });
          setLocatingText("已找到目的地");
          setTimeout(() => { if (!cancelled) setStep("confirm_dest"); }, 600);
        } else {
          setGeocodeError(true);
          setLocatingText("未找到目的地，请输入完整地址");
          setStep("confirm_dest");
        }
      } catch {
        if (!cancelled) { setGeocodeError(true); setStep("confirm_dest"); }
      }
    }
    locate();
    return () => { cancelled = true; };
  }, [schedule, plan, step]);

  const handleDestConfirm = async () => {
    if (!geocodeResult) return;
    const cached = getCachedLocation();
    if (!cached) { setStep("done"); return; }
    setStep("select_route");
    try {
      const routeList = await planRoutes(
        { lng: cached.longitude, lat: cached.latitude },
        { lng: geocodeResult.lng, lat: geocodeResult.lat }
      );
      setRoutes(routeList);
    } catch { setStep("done"); }
  };

  const handleDestRetry = async () => {
    if (!schedule?.location) return;
    const addr = destOverride.trim() || schedule.location;
    setGeocodeError(false);
    setLocatingText("正在重新定位...");
    setStep("locating");
    try {
      const cached = getCachedLocation();
      let city: string = cached?.city ?? ""; if (!city) { try { const loc = await require("@/services/map").getCurrentPosition(); city = loc.city ?? ""; } catch {} }
      let result = null; const pois = await searchPOIByKeyword(addr, city!, undefined, 3); if (pois.length > 0) { const p = pois[0]!; const [plng, plat] = p.location.split(",").map(Number); result = { lng: plng!, lat: plat!, formattedAddress: p.name + "（" + p.address + "）" }; } if (!result) { result = await geocode(addr, city!); }
      if (result) {
        setGeocodeResult({ ...result, city });
        setStep("confirm_dest");
      } else {
        setGeocodeError(true);
        setStep("confirm_dest");
      }
    } catch { setGeocodeError(true); setStep("confirm_dest"); }
  };

  const handleRouteSelect = async (route: RouteInfo) => {
    setSelectedRoute(route);
    setStep("generating");
    setShowGenerating(true);
    setGenStepIndex(-1);
    setGenComplete(false);

    const ai = getAIClient();
    const delay = 400;
    generativeSteps.forEach((_, i) => { setTimeout(() => setGenStepIndex(i), (i + 1) * delay); });

    try {
      const routeCtx = "【出行方式】" + routeLabels[route.mode] + " " + formatDuration(route.duration) + " " + formatDistance(route.distance) + (route.cost > 0 ? " 约" + route.cost + "元" : "") + (route.detail ? " " + route.detail : "");
      const destAddr = geocodeResult?.formattedAddress ?? schedule?.location ?? "";
      const response = await ai.generatePlan({
        schedule: schedule!,
        userPreference: preference,
        context: {
          currentTime: new Date().toISOString(),
          destination: destAddr,
          route: routeCtx,
        },
      });
      const aiPlan: AIPlan = {
        id: buildPlanId(), scheduleId: schedule!.id, summary: response.summary, confidence: "high",
        timeline: response.timeline.map((t, i) => ({ ...t, id: "tl-" + i })),
        checklist: response.checklist.map((c, i) => ({ ...c, id: "ch-" + i, done: false })),
        risks: response.risks.map((r, i) => ({ ...r, id: "rk-" + i })),
        suggestions: response.suggestions.map((s, i) => ({ ...s, id: "sg-" + i })),
        followUp: response.followUp?.map((f, i) => ({ ...f, id: "fu-" + i })),
        generatedAt: new Date().toISOString(), modelVersion: "ai-v1",
      };
      await saveAIPlan(aiPlan);
      setGenComplete(true);
      setStep("done");
    } catch { setShowGenerating(false); setGenComplete(false); setStep("done"); }
  };

  const startTime = schedule?.startAt ? formatTimeRange(schedule.startAt, schedule.endAt) : "";

  if (isLoading) return (<Screen><View style={styles.loadingContainer}><ShimmerBlock height={28} width="70%" /><ShimmerBlock height={18} width="45%" style={styles.shimmerGap} /><View style={styles.shimmerSection}><ShimmerBlock height={120} width="100%" /></View></View></Screen>);
  if (!schedule) return (<Screen><View style={styles.loadingContainer}><Ionicons color={colors.textMuted} name="document-text-outline" size={40} /><Text style={styles.emptyTitle}>未找到该日程</Text></View></Screen>);

  const cat = categoryLabels[schedule.category] ?? categoryLabels.other;

  return (
    <Screen>
      <View style={styles.navBar}><Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={() => router.replace("/")} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}><Ionicons color={colors.primary} name="chevron-back" size={24} /><Text style={styles.backText}>返回</Text></Pressable></View>

      <View style={styles.header}>
        <Text style={styles.title}>{schedule.title}</Text>
        <View style={styles.metaRow}>
          {startTime ? <View style={styles.metaChip}><Ionicons color={colors.textPrimary} name="time-outline" size={14} /><Text style={styles.metaText}>{startTime}</Text></View> : null}
          {schedule.location ? <View style={styles.metaChip}><Ionicons color={colors.textPrimary} name="location-outline" size={14} /><Text style={styles.metaText}>{schedule.location}</Text></View> : null}
        </View>
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}><Ionicons color={colors.primary} name={cat.icon} size={16} /><Text style={styles.categoryLabel}>{cat.label}</Text></View>
          {schedule.note ? <View style={styles.noteBox}><Ionicons color={colors.textMuted} name="create-outline" size={14} /><Text style={styles.noteText}>{schedule.note}</Text></View> : null}
        {/* 个性化策略徽标 */}
        <View style={styles.personalizationRow}>
          <View style={styles.personalizationBadge}>
            <Ionicons color={colors.primary} name="person-outline" size={12} />
            <Text style={styles.personalizationText}>MBTI {mbtiLabel(preference.mbti)}</Text>
          </View>
          <View style={styles.personalizationBadge}>
            <Ionicons color={colors.primary} name="notifications-outline" size={12} />
            <Text style={styles.personalizationText}>{reminderLabel(preference.reminderStyle)}</Text>
          </View>
          <View style={styles.personalizationBadge}>
            <Ionicons color={colors.primary} name="options-outline" size={12} />
            <Text style={styles.personalizationText}>{detailLabel(preference.planDetailLevel)}</Text>
          </View>
        </View>
        </View>
      </View>

      {step === "locating" && !plan ? (
        <Card style={styles.stepCard}>
          <View style={styles.stepRow}>
            <Spinner color={colors.primary} />
            <Text style={styles.stepText}>{locatingText}</Text>
          </View>
        </Card>
      ) : null}

      {step === "confirm_dest" && !plan ? (
        <Card style={styles.stepCard}>
          {geocodeError ? (
            <>
              <View style={styles.stepRow}>
                <Ionicons color={colors.warning} name="warning-outline" size={24} />
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <Text style={styles.stepTitle}>未找到「{schedule.location}」</Text>
                  <Text style={styles.stepDesc}>请手动输入完整地址（如：河南省开封市万达广场）</Text>
                </View>
              </View>
              <View style={styles.destInputRow}>
                <TextInput style={styles.destInput} value={destOverride} onChangeText={setDestOverride} placeholder="输入完整地址..." placeholderTextColor={colors.textMuted} />
                <Pressable onPress={handleDestRetry} style={({ pressed }) => [styles.retryBtn, pressed ? styles.pressed : null]}><Text style={styles.retryText}>搜索</Text></Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.stepRow}>
                <Ionicons color={colors.success} name="location-outline" size={24} />
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <Text style={styles.stepTitle}>找到目的地</Text>
                  <Text style={styles.stepDesc}>{geocodeResult?.formattedAddress}</Text>
                </View>
              </View>
              <View style={styles.stepButtons}>
                <Text style={styles.stepHint}>这是你要去的地方吗？</Text>
                <View style={styles.stepBtnRow}>
                  <Pressable onPress={handleDestConfirm} style={({ pressed }) => [styles.primaryBtn, pressed ? styles.pressed : null]}><Text style={styles.primaryBtnText}>是的</Text></Pressable>
                  <Pressable onPress={() => { setGeocodeError(true); }} style={({ pressed }) => [styles.secondaryBtn, pressed ? styles.pressed : null]}><Text style={styles.secondaryBtnText}>不对，重新输入</Text></Pressable>
                </View>
              </View>
              <Text style={styles.stepHintSmall}>如果地点不正确，可以手动输入完整地址：</Text>
              <View style={styles.destInputRow}>
                <TextInput style={styles.destInput} value={destOverride} onChangeText={setDestOverride} placeholder="输入完整地址..." placeholderTextColor={colors.textMuted} />
                <Pressable onPress={handleDestRetry} style={({ pressed }) => [styles.retryBtn, pressed ? styles.pressed : null]}><Text style={styles.retryText}>搜索</Text></Pressable>
              </View>
            </>
          )}
        </Card>
      ) : null}

      {step === "select_route" && !plan ? (
        <>
          <Card style={styles.routeCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
              <Ionicons color={colors.primary} name="navigate-outline" size={20} />
              <Text style={styles.stepTitle}>选择出行方式</Text>
            </View>
            {routes.length === 0 ? (
              <View style={styles.stepRow}><Spinner color={colors.primary} /><Text style={styles.stepText}>正在规划路线...</Text></View>
            ) : (
              routes.map((r) => (
                <Pressable key={r.mode} onPress={() => handleRouteSelect(r)} style={({ pressed }) => [styles.routeItem, pressed ? styles.pressed : null]}>
                  <Ionicons color={colors.primary} name={routeIcons[r.mode] ?? "ellipse-outline"} size={28} />
                  <View style={{ flex: 1, gap: spacing.xxs }}>
                    <Text style={styles.routeLabel}>{routeLabels[r.mode]}</Text>
                    <Text style={styles.routeDetail}>{formatDuration(r.duration)} · {formatDistance(r.distance)}{r.cost > 0 ? " · 约" + r.cost + "元" : " · 免费"}{r.detail ? " · " + r.detail : ""}</Text>
                  </View>
                  <Ionicons color={colors.border} name="chevron-forward" size={20} />
                </Pressable>
              ))
            )}
          </Card>
          <Pressable onPress={() => { setStep("done"); }} style={({ pressed }) => [styles.skipLink, pressed ? styles.pressed : null]}><Text style={styles.skipText}>跳过，直接生成方案</Text></Pressable>
        </>
      ) : null}

      {!plan && !showGenerating && step === "done" ? (
        <Card style={styles.generateCard}>
          <View style={styles.generateCopy}>
            <Text style={styles.generateTitle}>AI 智能规划</Text>
            <Text style={styles.generateDetail}>基于时间和偏好，生成时间线、准备清单和个性化建议。</Text>
          </View>
          <Pressable onPress={async () => {
            setStep("generating"); setShowGenerating(true); setGenStepIndex(-1); setGenComplete(false);
            const ai = getAIClient();
            const delay = 400;
            generativeSteps.forEach((_, i) => { setTimeout(() => setGenStepIndex(i), (i + 1) * delay); });
            try {
              const response = await ai.generatePlan({ schedule, userPreference: preference, context: { currentTime: new Date().toISOString() } });
              const aiPlan: AIPlan = {
                id: buildPlanId(), scheduleId: schedule.id, summary: response.summary, confidence: "high",
                timeline: response.timeline.map((t, i) => ({ ...t, id: "tl-" + i })),
                checklist: response.checklist.map((c, i) => ({ ...c, id: "ch-" + i, done: false })),
                risks: response.risks.map((r, i) => ({ ...r, id: "rk-" + i })),
                suggestions: response.suggestions.map((s, i) => ({ ...s, id: "sg-" + i })),
                followUp: response.followUp?.map((f, i) => ({ ...f, id: "fu-" + i })),
                generatedAt: new Date().toISOString(), modelVersion: "ai-v1",
              };
              await saveAIPlan(aiPlan); setGenComplete(true);
            } catch { setShowGenerating(false); setGenComplete(false); }
          }} style={({ pressed }) => [styles.generateButton, pressed ? styles.pressed : null]}>
            <Text style={styles.generateButtonText}>生成方案</Text>
          </Pressable>
        </Card>
      ) : null}

      {showGenerating && !genComplete ? (
        <Card style={styles.generatingCard}>
          {generativeSteps.map((s, i) => (
            <View key={s} style={styles.genStepRow}>
              {i < genStepIndex ? <Ionicons color={colors.success} name="checkmark-circle" size={20} /> : i === genStepIndex ? <View style={styles.genSpinner}><View style={styles.genSpinnerDot} /></View> : <Ionicons color={colors.border} name="ellipse-outline" size={20} />}
              <Text style={[styles.genStepText, i < genStepIndex ? styles.genStepDone : null, i === genStepIndex ? styles.genStepActive : null]}>{s}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {plan ? (
        <View style={styles.planSection}>
          <Card style={{ backgroundColor: colors.primarySoft, borderRadius: radius.card, padding: spacing.md }}>
            <View style={{ alignItems: "center", flexDirection: "row", gap: spacing.sm }}>
              <Ionicons color={colors.primary} name="sparkles" size={20} />
              <Text style={summaryStyles.summary}>{plan.summary}</Text>
            </View>
            {selectedRoute ? (
              <View style={{ marginTop: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Ionicons color={colors.primary} name={routeIcons[selectedRoute.mode] ?? "ellipse-outline"} size={14} />
                <Text style={confidenceStyles.text}>{routeLabels[selectedRoute.mode]} · {formatDuration(selectedRoute.duration)} · {formatDistance(selectedRoute.distance)}{selectedRoute.cost > 0 ? " · 约" + selectedRoute.cost + "元" : ""}</Text>
              </View>
            ) : null}
            <View style={{ alignItems: "center", flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm }}>
              <View style={confidenceStyles.badge}><Text style={confidenceStyles.text}>{cnConfidence(plan.confidence)}置信度</Text></View>
            </View>
          </Card>

          {genComplete && !showChat ? (
            <Card style={styles.askCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Ionicons color={colors.primary} name="chatbubbles-outline" size={24} />
                <View style={styles.askCopy}>
                  <Text style={styles.askTitle}>需要 AI 个性化推荐吗？</Text>
                  <Text style={styles.askDetail}>基于真实位置，推荐附近餐厅、交通和天气提醒。</Text>
                </View>
              </View>
              <View style={styles.askButtons}>
                <Pressable onPress={() => setShowChat(true)} style={({ pressed }) => [styles.chatYes, pressed ? styles.pressed : null]}><Text style={styles.chatYesText}>需要</Text></Pressable>
                <Pressable onPress={() => setGenComplete(false)} style={({ pressed }) => [styles.chatNo, pressed ? styles.pressed : null]}><Text style={styles.chatNoText}>不需要</Text></Pressable>
              </View>
            </Card>
          ) : null}

          {showChat ? (
            <View style={{ marginTop: spacing.md }}>
              <AIPlanChat schedule={schedule} preference={preference} routeMode={selectedRoute?.mode} destination={geocodeResult?.formattedAddress} destinationCoord={geocodeResult ? { lng: geocodeResult.lng, lat: geocodeResult.lat } : undefined} onComplete={(suggestions) => { setShowChat(false); if (suggestions && suggestions.length > 0) { setChatSuggestions(suggestions); try { const updatedPlan = { ...plan!, suggestions: [...(plan?.suggestions ?? []), ...suggestions] }; saveAIPlan(updatedPlan); } catch {} } }} onSkip={() => setShowChat(false)} />
            </View>
          ) : null}

          {plan.timeline.length > 0 ? (
            <><SectionHeader subtitle={plan.timeline.length + " 个节点"} title="时间线" />
            <Card style={styles.timelineCard}>
              {plan.timeline.map((item, i) => (
                <View key={item.id} style={timelineStyles.row}>
                  <View style={timelineStyles.timeCol}>
                    <View style={timelineStyles.timePill}><Ionicons color={colors.primary} name="time-outline" size={13} /><Text style={timelineStyles.time}>{item.time}</Text></View>
                    {i < plan.timeline.length - 1 ? <View style={timelineStyles.connector} /> : null}
                  </View>
                  <View style={timelineStyles.copy}>
                    <Text style={timelineStyles.title}>{item.title}</Text>
                    {item.description ? <Text style={timelineStyles.desc}>{item.description}</Text> : null}
                  </View>
                </View>
              ))}
            </Card></>
          ) : null}

          {plan.checklist.length > 0 ? (
            <><SectionHeader subtitle={plan.checklist.length + " 项"} title="准备清单" />
            <Card>
              {plan.checklist.map((item) => (
                <Pressable key={item.id} onPress={() => toggleChecklistItem(plan.id, item.id)} style={checkStyles.row}>
                  <View style={checkStyles.iconBox}><Ionicons color={item.done ? colors.success : colors.border} name={item.done ? "checkmark-circle" : "ellipse-outline"} size={22} /></View>
                  <View style={checkStyles.copy}>
                    <Text style={[checkStyles.title, item.done ? checkStyles.titleDone : null]}>{item.title}</Text>
                    {item.reason ? <Text style={checkStyles.reason}>{item.reason}</Text> : null}
                  </View>
                </Pressable>
              ))}
            </Card></>
          ) : null}

          {plan.risks.length > 0 ? (
            <><SectionHeader subtitle={plan.risks.length + " 项"} title="风险提醒" />
            <Card>
              {plan.risks.map((risk) => (
                <View key={risk.id} style={riskStyles.row}>
                  <Ionicons color={risk.level === "high" ? colors.danger : risk.level === "medium" ? colors.warning : colors.textMuted} name="alert-circle-outline" size={20} />
                  <View style={riskStyles.copy}>
                    <Text style={riskStyles.title}>{risk.title}</Text>
                    <Text style={riskStyles.detail}>{risk.detail}</Text>
                    {risk.action ? <View style={riskStyles.actionRow}><Ionicons color={colors.primary} name="bulb-outline" size={14} /><Text style={riskStyles.action}>{risk.action}</Text></View> : null}
                  </View>
                </View>
              ))}
            </Card></>
          ) : null}

          {plan.suggestions.length > 0 ? (
            <><SectionHeader subtitle={plan.suggestions.length + " 条"} title="个性化建议" />
            <View style={styles.suggestionGrid}>
              {plan.suggestions.map((sugg) => (
                <Card key={sugg.id} style={suggStyles.card}>
                  <Ionicons color={colors.primary} name={sugg.type === "food" ? "restaurant-outline" : sugg.type === "route" ? "navigate-outline" : sugg.type === "topic" ? "chatbubbles-outline" : sugg.type === "outfit" ? "shirt-outline" : "bulb-outline"} size={20} />
                  <View style={suggStyles.copy}>
                    <Text style={suggStyles.title}>{sugg.title}</Text>
                    <Text style={suggStyles.content}>{sugg.content}</Text>
                  </View>
                </Card>
              ))}
            </View></>
          ) : null}

        </View>
      ) : null}
    </Screen>
  );
}

function formatTimeRange(startAt: string, endAt?: string) {
  const fmt = (iso: string) => { try { const d = new Date(iso); const pad = (n: number) => n.toString().padStart(2, "0"); return (d.getMonth() + 1) + "月" + d.getDate() + "日 " + pad(d.getHours()) + ":" + pad(d.getMinutes()); } catch { return iso; } };
  if (!endAt) return fmt(startAt);
  return fmt(startAt) + " - " + new Date(endAt).getHours() + ":" + new Date(endAt).getMinutes().toString().padStart(2, "0");
}
function ShimmerBlock({ height, style, width }: { height: number; style?: ViewStyle; width: DimensionValue }) {
  return <View style={[{ backgroundColor: colors.surfaceSoft, borderRadius: radius.md, height, width }, style]} />;
}
function Spinner({ color: c }: { color: string }) {
  const spin = useMemo(() => new Animated.Value(0), []);
  useEffect(() => { Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1000, useNativeDriver: true })).start(); }, [spin]);
  return <Animated.View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: c, borderTopColor: "transparent", transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }} />;
}

const summaryStyles = StyleSheet.create({ summary: { ...typography.body, color: colors.textPrimary, flex: 1 } });
const confidenceStyles = StyleSheet.create({ badge: { backgroundColor: colors.successSoft, borderRadius: radius.round, flexDirection: "row", gap: spacing.xxs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs }, text: { ...typography.caption, color: colors.success } });
const timelineStyles = StyleSheet.create({ row: { flexDirection: "row", gap: spacing.sm, minHeight: 52 }, timeCol: { alignItems: "center", width: 64 }, timePill: { alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: radius.round, flexDirection: "row", gap: spacing.xxs, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs }, time: { ...typography.caption, color: colors.primary }, connector: { backgroundColor: colors.borderSubtle, flex: 1, marginTop: spacing.xs, width: 2 }, copy: { flex: 1, gap: spacing.xxs, paddingBottom: spacing.sm }, title: { ...typography.bodyStrong, color: colors.textPrimary }, desc: { ...typography.caption, color: colors.textSecondary } });
const checkStyles = StyleSheet.create({ row: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: spacing.touchTarget, paddingVertical: spacing.sm }, iconBox: { alignItems: "center", justifyContent: "center", minHeight: 32, minWidth: 32 }, copy: { flex: 1, gap: spacing.xxs }, title: { ...typography.bodyStrong, color: colors.textPrimary }, titleDone: { color: colors.textMuted, textDecorationLine: "line-through" }, reason: { ...typography.caption, color: colors.textSecondary } });
const riskStyles = StyleSheet.create({ row: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, minHeight: 48, paddingVertical: spacing.sm }, copy: { flex: 1, gap: spacing.xxs }, title: { ...typography.bodyStrong, color: colors.textPrimary }, detail: { ...typography.caption, color: colors.textSecondary }, actionRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.xxs, marginTop: spacing.xxs }, action: { ...typography.caption, color: colors.textSecondary, flex: 1 } });
const suggStyles = StyleSheet.create({ card: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, minHeight: 70 }, copy: { flex: 1, gap: spacing.xxs }, title: { ...typography.bodyStrong, color: colors.textPrimary }, content: { ...typography.caption, color: colors.textSecondary } });
const styles = StyleSheet.create({
  navBar: { flexDirection: "row", marginBottom: spacing.md }, backButton: { alignItems: "center", flexDirection: "row", gap: spacing.xxs, minHeight: spacing.touchTarget, paddingRight: spacing.md }, backText: { ...typography.body, color: colors.primary },
  header: { gap: spacing.xs, marginBottom: spacing.md }, title: { ...typography.headline, color: colors.textPrimary },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, metaChip: { alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: radius.round, flexDirection: "row", gap: spacing.xxs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs }, metaText: { ...typography.caption, color: colors.textPrimary },
  categoryRow: { gap: spacing.sm, marginBottom: spacing.lg }, categoryBadge: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.primarySoft, borderRadius: radius.round, flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, categoryLabel: { ...typography.caption, color: colors.primary },
  noteBox: { alignItems: "flex-start", flexDirection: "row", gap: spacing.xxs }, noteText: { ...typography.caption, color: colors.textMuted, flex: 1 }, pressed: { opacity: 0.64 },
  loadingContainer: { flex: 1, gap: spacing.md }, shimmerGap: { marginTop: spacing.xs }, shimmerSection: { marginTop: spacing.lg }, emptyTitle: { ...typography.bodyStrong, color: colors.textMuted, marginTop: spacing.md },
  stepCard: { gap: spacing.md }, stepRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepText: { ...typography.body, color: colors.textSecondary }, stepTitle: { ...typography.subheadline, color: colors.textPrimary }, stepDesc: { ...typography.body, color: colors.textSecondary, flex: 1 },
  stepHint: { ...typography.caption, color: colors.textMuted }, stepHintSmall: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  stepButtons: { gap: spacing.sm }, stepBtnRow: { flexDirection: "row", gap: spacing.sm },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  primaryBtnText: { ...typography.bodyStrong, color: colors.surface },
  secondaryBtn: { flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  secondaryBtnText: { ...typography.bodyStrong, color: colors.textSecondary },
  destInputRow: { flexDirection: "row", gap: spacing.xs }, destInput: { flex: 1, ...typography.body, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, color: colors.textPrimary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  retryText: { ...typography.bodyStrong, color: colors.surface },
  routeCard: { gap: 0 }, routeItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  routeLabel: { ...typography.bodyStrong, color: colors.textPrimary }, routeDetail: { ...typography.caption, color: colors.textSecondary },
  skipLink: { alignSelf: "center", paddingVertical: spacing.md }, skipText: { ...typography.caption, color: colors.textMuted, textDecorationLine: "underline" },
  generateCard: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, generateCopy: { flex: 1, gap: spacing.xxs, minWidth: 180 }, generateTitle: { ...typography.bodyStrong, color: colors.textPrimary }, generateDetail: { ...typography.caption, color: colors.textSecondary },
  generateButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.round, justifyContent: "center", minHeight: spacing.touchTarget, paddingHorizontal: spacing.lg }, generateButtonText: { ...typography.bodyStrong, color: colors.surface },
  generatingCard: { gap: spacing.sm }, genStepRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 36 }, genSpinner: { alignItems: "center", height: 20, justifyContent: "center", width: 20 }, genSpinnerDot: { backgroundColor: colors.primary, borderRadius: radius.round, height: 8, opacity: 0.5, width: 8 },
  genStepText: { ...typography.body, color: colors.textMuted }, genStepDone: { color: colors.textSecondary }, genStepActive: { color: colors.textPrimary, fontWeight: "600" },
  planSection: { gap: spacing.sm, marginTop: spacing.lg }, timelineCard: { gap: 0 }, suggestionGrid: { gap: spacing.sm },
  askCard: { gap: spacing.md, marginTop: 0 }, askCopy: { flex: 1, gap: spacing.xxs }, askTitle: { ...typography.subheadline, color: colors.textPrimary }, askDetail: { ...typography.caption, color: colors.textSecondary },
  askButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  chatYes: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  chatYesText: { ...typography.bodyStrong, color: colors.surface },
  chatNo: { flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  chatNoText: { ...typography.bodyStrong, color: colors.textSecondary },
  personalizationRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm, flexWrap: "wrap" },
  personalizationBadge: {
    alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: 8,
    flexDirection: "row", gap: 4, paddingHorizontal: spacing.xs, paddingVertical: 3,
  },
  personalizationText: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
});
