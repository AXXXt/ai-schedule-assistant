import { routeAwareQuestions } from "./routeQuestions";
import { getCachedLocation } from "@/services/map";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common";
import { colors, radius, spacing, typography } from "@/theme";
import type { Schedule } from "@/types/schedule";
import type { SuggestionItem } from "@/types/ai";
import type { UserPreference } from "@/types/preference";
import { AI_CONFIG } from "@/services/ai/aiConfig";
import {
  geocode,
  searchNearbyRestaurants,
  searchNearbyTransitStations,
  getWeather,
  searchPOIByKeyword,
} from "@/services/map";

type ChatMessage = {
  role: "ai" | "user" | "system";
  content: string;
  id: string;
};

type Props = {
  schedule: Schedule;
  preference: UserPreference;
  onComplete: (suggestions: SuggestionItem[]) => void;
  routeMode?: string;
  destination?: string;
  destinationCoord?: { lng: number; lat: number };
  onSkip: () => void;
};

function mid() { return "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6); }

const smartQuestions: Record<string, string[]> = {
  dating_social: [
    "💡 你预计几点结束呢？",
    "💡 对餐厅有什么偏好？口味、预算？",
    "💡 出行方式？需要查看附近交通吗？",
  ],
  health_fitness: [
    "💡 你打算运动多久？需要带什么装备？",
    "💡 运动后需要补充什么？附近有合适的餐厅吗？",
    "💡 需要提前热身准备吗？",
  ],
  work_study: [
    "💡 需要提前准备什么资料或设备？",
    "💡 预计多长时间？需要休息安排吗？",
    "💡 周边有安静的咖啡厅或图书馆吗？",
  ],
  travel_errand: [
    "💡 需要带什么证件或材料？",
    "💡 交通方式有什么偏好吗？",
    "💡 办理时间大约多久？",
  ],
  other: [
    "💡 有什么特别需要准备的？",
    "💡 活动大概持续多久？",
    "💡 需要我帮你考虑什么方面？",
  ],
};

// 检测用户是否同意AI推荐
function isAffirmative(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(好的|可以|行|要|加|对|嗯|是|好|ok|yes|没错|对呀|是的|要的|行的|加吧|来吧)/.test(t) || /^(好|行|对|嗯|是|ok|yes)$/.test(t);
}

// 从AI消息中提取建议
function extractSuggestion(aiMsg: string): { title: string; content: string; type: SuggestionItem["type"] } | null {
  // 匹配 "建议/推荐 XXX" 模式
  const m1 = aiMsg.match(/(?:建议(?:选择)?|推荐|可以试试)\s*([^，。,\n]+\([^)]*\)?[^，。,\n]*)/);
  if (m1 && m1[1].length >= 2) {
    return { title: m1[1].trim().slice(0, 20), content: m1[0].trim(), type: "food" };
  }
  // 匹配 "💡推荐/建议 XXX" 模式
  const m2 = aiMsg.match(/💡\s*(?:推荐|建议)?\s*([^？?]+)/);
  if (m2 && m2[1].trim().length >= 2) {
    return { title: m2[1].trim().slice(0, 20), content: m2[0].trim(), type: "food" };
  }
  return null;
}

export function AIPlanChat({ schedule, preference, onComplete, onSkip, routeMode, destination, destinationCoord }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [phase, setPhase] = useState<"ask" | "loading_location" | "chat" | "done">("loading_location");
  const [userCity, setUserCity] = useState("");
  const [eventCoord, setEventCoord] = useState<{ lng: number; lat: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // 使用 ref 传递数据给 handleSend，避免闭包过时
  const locationSummaryRef = useRef("");
  const confirmedSuggestionsRef = useRef<SuggestionItem[]>([]);
  const pendingSuggestionRef = useRef<{ title: string; content: string; type: SuggestionItem["type"] } | null>(null);
  const restaurantsRef = useRef<string[]>([]);
  const transitRef = useRef<string[]>([]);
  const eventCoordRef = useRef<{ lng: number; lat: number } | null>(null);
  const userCityRef = useRef("");

  const handleYesRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    setMessages([{
      role: "ai",
      content: "我分析了你的日程「" + schedule.title + "」" + (schedule.location ? "，地点在" + schedule.location : "") + "。让我来帮你细化方案！",
      id: mid(),
    }]);
    if (phase === "loading_location") {
      setTimeout(() => handleYesRef.current(), 100);
    }
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  // ============ handleYes ============
  const handleYes = async () => {
    console.log("HANDLE_YES START");
    setPhase("loading_location");
    const loadingMsg: ChatMessage = {
      role: "system",
      content: schedule.location
        ? "正在搜索「" + schedule.location + "」附近的餐厅和交通信息..."
        : "正在获取位置并搜索周边...",
      id: mid(),
    };
    setMessages((prev) => [...prev, loadingMsg]);
    setLoading(true);

    try {
      let _userCity = "";
      const cached = getCachedLocation();
      console.log("HANDLE_YES cached:", JSON.stringify(cached));
      if (cached && cached.city) {
        _userCity = cached.city;
        setUserCity(_userCity);
        userCityRef.current = _userCity;
      }

      let _eventCoord: { lng: number; lat: number } | null = null;
      console.log("HANDLE_YES destCoord:", JSON.stringify(destinationCoord));
      if (destinationCoord) {
        _eventCoord = { lng: destinationCoord.lng, lat: destinationCoord.lat };
        setEventCoord(_eventCoord);
        eventCoordRef.current = _eventCoord;
        console.log("using confirmed dest:", destinationCoord.lng, destinationCoord.lat);
      } else if (schedule.location) {
        console.log("geocoding:", schedule.location, "city:", _userCity);
        const geo = await geocode(schedule.location, _userCity);
        if (geo) {
          _eventCoord = { lng: geo.lng, lat: geo.lat };
          setEventCoord(_eventCoord);
          eventCoordRef.current = _eventCoord;
          console.log("geocode result:", geo.formattedAddress);
        } else {
          console.log("geocode FAILED:", schedule.location, "city:", _userCity);
        }
      }

      console.log("HANDLE_YES _eventCoord:", JSON.stringify(_eventCoord));
      const center = _eventCoord ?? (cached ? { lng: cached.longitude, lat: cached.latitude } : null);

      let restaurants: string[] = [];
      let transit: string[] = [];
      let weather: string | null = null;
      let locSummary = "";

      if (center) {
        console.log("HANDLE_YES center block entered, searching nearby...");
        const [rests, trans, wet] = await Promise.all([
          searchNearbyRestaurants(center, 3000).catch((e) => { console.log("rest search err:", e?.message || e); return []; }),
          searchNearbyTransitStations(center, 1500).catch((e) => { console.log("transit search err:", e?.message || e); return []; }),
          getWeather().catch((e) => { console.log("weather err:", e?.message || e); return null; }),
        ]);

        if (rests.length === 0 && destinationCoord) {
          restaurants = ["（已定位到目的地，搜索周边餐厅中...）"];
        } else {
          restaurants = rests.slice(0, 5).map((r) =>
            r.name + "（" + r.address + "，约" + Math.round(r.distance / 100) * 100 + "m" + (r.rating ? "，评分" + r.rating : "") + "）"
          );
        }
        transit = trans.slice(0, 3).map((s) =>
          s.name + "（约" + Math.round(s.distance / 100) * 100 + "m）"
        );
        weather = wet ? wet.weather + " " + wet.temperature + "℃ " + wet.wind : null;

        locSummary = [
          cached?.latitude ? "【GPS定位】已获取精确位置（误差" + Math.round(cached.accuracy || 0) + "m）" : "",
          _userCity ? "【用户城市】" + _userCity : "",
          schedule.location ? "【日程地点】" + schedule.location : "",
          weather ? "【天气】" + weather : "",
          restaurants.length ? "【附近餐厅】\n" + restaurants.map((r) => "- " + r).join("\n") : "",
          transit.length ? "【附近交通（仅公交，开封无地铁）】\n" + transit.map((t) => "- [公交] " + t).join("\n") : "",
        ].filter(Boolean).join("\n\n");
      } else {
        locSummary = "位置获取失败";
      }

      console.log("HANDLE_YES locSummary:", locSummary ? locSummary.slice(0, 80) + "..." : "(empty)");

      locationSummaryRef.current = locSummary;
      restaurantsRef.current = restaurants;
      transitRef.current = transit;

      setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id));

      if (restaurants.length > 0 || transit.length > 0 || weather) {
        const ctxMsg: ChatMessage = {
          role: "system",
          content: [
            locSummary ? "✅ 位置信息已获取" : "",
            weather ?? "",
            restaurants.length ? "找到 " + restaurants.length + " 家附近餐厅" : "",
            transit.length ? "找到 " + transit.length + " 个交通站点" : "",
          ].filter(Boolean).join(" · "),
          id: mid(),
        };
        if (ctxMsg.content) setMessages((prev) => [...prev, ctxMsg]);
      }

      const questions = (routeMode && routeAwareQuestions[routeMode]?.[schedule.category])
        ? routeAwareQuestions[routeMode][schedule.category]
        : (smartQuestions[schedule.category] ?? smartQuestions.other);
      const firstQuestion = questions[0] ?? "💡 有什么我可以帮你的？";

      let aiQuestion = firstQuestion;
      try {
        if (locSummary) {
          const routeLabelMap: Record<string, string> = { driving: "自驾", transit: "公交", biking: "骑行", taxi: "打车" };
          const routeHint = routeMode ? "用户已选择\"" + (routeLabelMap[routeMode] || routeMode) + "\"出行，不要问交通方式相关问题。" : "";
          const res = await fetch(AI_CONFIG.baseURL + "/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + AI_CONFIG.apiKey },
            body: JSON.stringify({
              model: AI_CONFIG.model,
              messages: [
                {
                  role: "system",
                  content: "你是体贴的AI日程规划助手。" + routeHint + "只基于下方真实数据推荐，严禁编造。当前位置已确认，你是用户身边的朋友，直接基于数据给建议，绝不能说\"无法获取位置\"。用户日程在「" + (schedule.location ?? "未知地点") + "」。只问一个最重要的问题，用\"💡\"开头，不超过25字。\n\n" + locSummary + "\n日程: " + schedule.title + "，" + schedule.startAt + "\n分类: " + schedule.category,
                },
                { role: "user", content: "请提一个细化问题" },
              ],
              temperature: 0.8,
              max_tokens: 120,
            }),
          });
          const data = await res.json() as any;
          const rawQ = data.choices?.[0]?.message?.content;
          if (rawQ) aiQuestion = rawQ;
          console.log("AI first question:", rawQ);
        }
      } catch (e) {
        console.log("AI first question failed:", (e as any)?.message || e);
      }

      setMessages((prev) => [...prev, { role: "ai", content: aiQuestion, id: mid() }]);
      setQuestionCount(1);
      setPhase("chat");

    } catch (e: any) {
      console.log("HANDLE_YES ERROR:", e?.message || e);
      setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id));
      setMessages((prev) => [...prev, {
        role: "ai",
        content: "位置获取失败，不过没关系，我们直接开始吧！\n💡 有什么我可以帮你的？",
        id: mid(),
      }]);
      locationSummaryRef.current = "";
      setQuestionCount(1);
      setPhase("chat");
    }

    setLoading(false);
    scrollToBottom();
  };

  handleYesRef.current = handleYes;
  // ============ handleDone ============
  const handleDone = async () => {
    const existing = confirmedSuggestionsRef.current;
    if (existing.length === 0) { onComplete([]); return; }
    setLoading(true);
    setMessages((prev) => [...prev, { role: "system", content: "正在总结建议...", id: mid() }]);
    const summaryCards = existing.map((sg, i) => ({
      ...sg,
      id: "sg-chat-final-" + i + "-" + Date.now(),
    }));
    confirmedSuggestionsRef.current = summaryCards;
    onComplete(summaryCards);
    setLoading(false);
  };

  // ============ handleSend ============
  const handleSend = async () => {
    const locSummary = locationSummaryRef.current;
    console.log("=== CONTEXT TO AI ===");
    console.log("locationSummary:", JSON.stringify(locSummary).slice(0, 200));
    console.log("eventCoord:", JSON.stringify(eventCoordRef.current));

    if (!input.trim() || loading) return;
    const newCount = questionCount + 1;
    setQuestionCount(newCount);

    const userText = input.trim();
    // 检测用户是否同意了AI的推荐
    const pending = pendingSuggestionRef.current;
    if (pending && isAffirmative(userText)) {
      const sg: SuggestionItem = { id: "sg-chat-" + Date.now(), ...pending };
      const existing = confirmedSuggestionsRef.current;
      if (!existing.find((s) => s.title === sg.title)) {
        confirmedSuggestionsRef.current = [...existing, sg];
        console.log("CONFIRMED suggestion:", sg.title);
      }
      pendingSuggestionRef.current = null;
    }
    setMessages((prev) => [...prev, { role: "user", content: userText, id: mid() }]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    // chat continues until user presses finish

    const questions = (routeMode && routeAwareQuestions[routeMode]?.[schedule.category])
      ? routeAwareQuestions[routeMode][schedule.category]
      : (smartQuestions[schedule.category] ?? smartQuestions.other);
    const nextQuestion = questions[newCount] ?? "还有其他需要我帮你考虑的吗？";

    let foodInfo = "";
    const foodMatch = userText.match(/([\u4e00-\u9fff]{2,8}(?:餐厅|饭店|酒楼|菜馆|小吃|火锅|烧烤|面馆|料理|食堂|美食|快餐|咖啡|奶茶|甜品|烘焙|食府|酒家|饭庄|排挡|大排档|私房菜|小馆|馆子|厨房|食馆|轩|阁|楼|亭|居|园|坊|号|记|家|院|屯|寨))/);
    if (foodMatch && eventCoordRef.current) {
      try {
        const pois = await searchPOIByKeyword(foodMatch[0], userCityRef.current || "", { lng: eventCoordRef.current.lng, lat: eventCoordRef.current.lat }, 3);
        if (pois.length > 0) {
          foodInfo = "\n\n【用户查询餐厅】" + foodMatch[0] + "\n" + pois.map(function(p) { return "- " + p.name + "（" + p.address + "，约" + Math.round(p.distance / 100) * 100 + "m" + (p.rating ? "，评分" + p.rating : "") + "）"; }).join("\n");
        }
      } catch (e) {
        console.log("food search err:", (e as any)?.message || e);
      }
    }

    try {
      const history = messages.filter((m) => m.role === "user" || m.role === "ai").slice(-6).map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const res = await fetch(AI_CONFIG.baseURL + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + AI_CONFIG.apiKey },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            {
              role: "system",
              content: (routeMode ? "用户已选择" + ({driving:"自驾",transit:"公交",biking:"骑行",taxi:"打车"} as any)[routeMode||""] + "出行，不要问交通方式及公交路线相关问题。" : "") + "你是体贴的AI规划助手。你已有用户真实位置数据。严格基于提供的数据回答，禁止推荐地铁（开封无地铁）。交通仅推荐提供的公交站。禁止编造任何不存在的信息。绝不能说\"无法获取位置\"。简洁（不超过60字）。\n\n日程: " + schedule.title + "，地点: " + (schedule.location ?? "未指定") + "，时间: " + schedule.startAt + "\n" + locSummary + foodInfo + "\n\n回复格式：先给建议，再提一个问题（💡开头，不超过20字）。。",
            },
            ...history,
            { role: "user", content: userText },
          ],
          temperature: 0.8,
          max_tokens: 250,
        }),
      });
      const data = await res.json() as any;
      console.log("=== AI CHAT RESPONSE ===");
      console.log(JSON.stringify(data.choices?.[0]?.message?.content));
      let reply = data.choices?.[0]?.message?.content ?? nextQuestion;
      
      setMessages((prev) => [...prev, { role: "ai", content: reply || nextQuestion, id: mid() }]);
      // 提取AI推荐作为待确认建议
      if (reply) pendingSuggestionRef.current = extractSuggestion(reply);
    } catch (e) {
      console.log("AI chat error:", (e as any)?.message || e);
      setMessages((prev) => [...prev, { role: "ai", content: nextQuestion, id: mid() }]);
    }

    setLoading(false);
    scrollToBottom();
  };

  // ============ RENDER ============
  if (phase === "ask") {
    return (
      <Card style={styles.askCard}>
        <View style={styles.askRow}>
          <Ionicons color={colors.primary} name="chatbubbles-outline" size={22} />
          <Text style={styles.askText}>需要 AI 个性化规划吗？</Text>
        </View>
        <Text style={styles.askDetail}>
          根据「{schedule.title}」{schedule.location ? "（" + schedule.location + "）" : ""}，
          搜索附近餐厅、交通和天气，给你真实可用的建议。
        </Text>
        <View style={styles.askButtons}>
          <Pressable onPress={handleYes} style={({ pressed }) => [styles.yesBtn, pressed ? styles.pressed : null]}>
            <Text style={styles.yesText}>需要</Text>
          </Pressable>
          <Pressable onPress={onSkip} style={({ pressed }) => [styles.noBtn, pressed ? styles.pressed : null]}>
            <Text style={styles.noText}>跳过</Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  if (phase === "loading_location") {
    return (
      <Card style={styles.loadingCard}>
        <Spinner color={colors.primary} />
        <Text style={styles.loadingText}>
          {schedule.location ? "正在搜索「" + schedule.location + "」附近..." : "正在获取位置..."}
        </Text>
      </Card>
    );
  }

  return (
    <View style={styles.chatContainer}>
      <ScrollView ref={scrollRef} style={styles.chatScroll} onContentSizeChange={scrollToBottom} showsVerticalScrollIndicator={true}>
        {messages.map((msg, i) => (
          <View key={msg.id} style={[styles.bubbleRow, msg.role === "user" ? styles.userRow : styles.aiRow]}>
            {(msg.role === "ai" || msg.role === "system") ? (
              <AnimatedBubble index={i}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Ionicons color={msg.role === "system" ? colors.textMuted : colors.primary} name={msg.role === "system" ? "information-circle-outline" : "sparkles"} size={16} style={styles.bubbleIcon} />
                  <View style={msg.role === "system" ? styles.systemBubbleBox : styles.aiBubbleBox}>
                    <Text style={msg.role === "system" ? styles.systemBubble : styles.aiBubble}>{msg.content}</Text>
                  </View>
                </View>
              </AnimatedBubble>
            ) : (
              <AnimatedBubble index={i}>
                <View style={styles.userBubbleBox}>
                  <Text style={styles.userBubble}>{msg.content}</Text>
                </View>
              </AnimatedBubble>
            )}
          </View>
        ))}
        {loading ? (
          <View style={[styles.bubbleRow, styles.aiRow]}>
            <Ionicons color={colors.primary} name="sparkles" size={16} style={styles.bubbleIcon} />
            <Text style={styles.typingText}>正在思考...</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputRow}>
          <TextInput style={styles.chatInput} value={input} onChangeText={setInput} placeholder="输入你的需求..." placeholderTextColor={colors.textMuted} multiline onSubmitEditing={handleSend} returnKeyType="send" />
          <Pressable onPress={handleSend} disabled={!input.trim() || loading} style={({ pressed }) => [styles.sendBtn, (!input.trim() || loading) ? styles.sendDisabled : null, pressed ? styles.pressed : null]}>
            <Ionicons color={colors.surface} name="send" size={18} />
          </Pressable>
        </View>
        <Pressable onPress={handleDone} style={({ pressed }) => [styles.doneBtn, pressed ? styles.pressed : null]}>
          <Text style={styles.doneText}>完成</Text>
        </Pressable>
    </View>
  );
}

function Spinner({ color }: { color: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1000, useNativeDriver: true })).start();
  }, [spin]);
  return (
    <Animated.View style={{
      width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: color,
      borderTopColor: "transparent",
      transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }],
    }} />
  );
}

function AnimatedBubble({ children, index }: { children: React.ReactNode; index: number }) {
  const slide = useMemo(() => new Animated.Value(10), []);
  const opacity = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [slide, opacity]);
  return <Animated.View style={{ transform: [{ translateY: slide }], opacity, flexShrink: 1 }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  askCard: { gap: spacing.md, marginTop: spacing.md },
  askRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  askText: { ...typography.subheadline, color: colors.textPrimary },
  askDetail: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  askButtons: { flexDirection: "row", gap: spacing.sm },
  yesBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  yesText: { ...typography.bodyStrong, color: colors.surface },
  noBtn: { flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget },
  noText: { ...typography.bodyStrong, color: colors.textSecondary },
  pressed: { opacity: 0.64 },
  loadingCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md, padding: spacing.lg },
  loadingText: { ...typography.body, color: colors.textSecondary },
  chatContainer: { flex: 1, marginTop: spacing.md },
  chatScroll: { flex: 1, maxHeight: 320 },
  bubbleRow: { flexDirection: "row", marginBottom: spacing.sm, alignItems: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  aiRow: { justifyContent: "flex-start" },
  bubbleIcon: { marginRight: spacing.xs, marginTop: 4 },
  aiBubble: { ...typography.body, color: colors.textPrimary },
  aiBubbleBox: { backgroundColor: colors.surfaceSoft, borderRadius: radius.md, padding: spacing.sm, maxWidth: "85%" },
  userBubble: { ...typography.body, color: "#1E293B", fontWeight: "500" },
  userBubbleBox: { backgroundColor: "#E0E7FF", borderRadius: radius.md, padding: spacing.sm, maxWidth: "85%", alignSelf: "flex-end" },
  systemBubble: { ...typography.caption, color: colors.textMuted, fontStyle: "italic" },
  systemBubbleBox: { backgroundColor: colors.surfaceSoft, borderRadius: radius.md, padding: spacing.xs, paddingHorizontal: spacing.sm, maxWidth: "85%", borderStyle: "dashed" as any, borderWidth: 1, borderColor: colors.borderSubtle },
  typingText: { ...typography.caption, color: colors.textMuted },
  inputRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm, alignItems: "flex-end" },
  chatInput: { flex: 1, ...typography.body, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, color: colors.textPrimary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, maxHeight: 80 },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.round, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  sendDisabled: { backgroundColor: colors.border },
  doneBtn: { backgroundColor: colors.primary, borderRadius: radius.md, alignItems: "center", justifyContent: "center", minHeight: spacing.touchTarget, marginTop: spacing.sm },
  doneText: { ...typography.bodyStrong, color: colors.surface },
});