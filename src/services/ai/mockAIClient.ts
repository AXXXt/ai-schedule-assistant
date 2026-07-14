import type { AIClient } from "./aiClient";
import type { ParsedScheduleDraft, GeneratePlanRequest, GeneratePlanResponse, Confidence } from "@/types/ai";
import type { UserPreference } from "@/types/preference";
import type { ScheduleCategory } from "@/types/schedule";

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 模拟自然语言解析：
 * 从用户的自由文本中提取 标题/时间/地点/类型 等字段。
 */
async function mockParseScheduleDraft(
  prompt: string,
  _preference: UserPreference
): Promise<ParsedScheduleDraft> {
  // 模拟异步延迟
  await sleep(800);


  // 中文数字 → 阿拉伯数字
  const cnNums: Record<string, string> = { "一":"1","二":"2","三":"3","四":"4","五":"5","六":"6","七":"7","八":"8","九":"9","十":"10","十一":"11","十二":"12" };
  let normalized = prompt;
  // "下午六点" → "下午6点"
  normalized = normalized.replace(/[一二三四五六七八九十]+/g, (m) => cnNums[m] ?? m);
  // "下午6点" → "18:00", "上午9点半" → "09:30"
  normalized = normalized.replace(/下午\s*(\d{1,2})\s*[点:：]\s*(\d{0,2})/g, (_, h, m) => `${parseInt(h)+12}:${(m||"00").padStart(2,"0")}`);
  normalized = normalized.replace(/晚上\s*(\d{1,2})\s*[点:：]\s*(\d{0,2})/g, (_, h, m) => `${parseInt(h)+12}:${(m||"00").padStart(2,"0")}`);
  normalized = normalized.replace(/上午\s*(\d{1,2})\s*[点:：]\s*(\d{0,2})/g, (_, h, m) => `${parseInt(h).toString().padStart(2,"0")}:${(m||"00").padStart(2,"0")}`);
  normalized = normalized.replace(/早上\s*(\d{1,2})\s*[点:：]\s*(\d{0,2})/g, (_, h, m) => `${parseInt(h).toString().padStart(2,"0")}:${(m||"00").padStart(2,"0")}`);
  const timeMatch = normalized.match(/(\d{1,2})\s*[点:：]\s*(\d{0,2})/);
  const time = timeMatch ? `${timeMatch[1]!.padStart(2, "0")}:${(timeMatch[2] || "00").padStart(2, "0")}` : undefined;

  const locationKeywords = ["万象城", "万达", "公园", "家", "公司", "图书馆", "健身房", "咖啡", "餐厅", "医院", "银行"];
  let location: string | undefined;
  for (const kw of locationKeywords) {
    const idx = prompt.indexOf(kw);
    if (idx >= 0) {
      location = prompt.slice(idx, Math.min(idx + kw.length + 3, prompt.length))
        .replace(/[，。,.\s]/g, "").trim();
      break;
    }
  }

  let category: ScheduleCategory = "other";
  if (/[饭餐吃聚约见会请客派对]/.test(prompt)) category = "dating_social";
  else if (/[跑运动健身练瑜游泳球]/.test(prompt)) category = "health_fitness";
  else if (/[工作开会面试学习复习课培训]/.test(prompt)) category = "work_study";
  else if (/[出行办证看病医院银行签证]/.test(prompt)) category = "travel_errand";

  const title = prompt
    .replace(/\d{1,2}\s*[点:：]\s*\d{0,2}/, "")
    .replace(/[在去到]/, "")
    .trim()
    .slice(0, 20) || prompt.slice(0, 20);

  const missingFields: string[] = [];
  if (!time) missingFields.push("time");
  if (!location) missingFields.push("location");

  const confidence: Confidence = missingFields.length === 0 ? "high"
    : missingFields.length === 1 ? "medium" : "low";

  return {
    title,
    startAt: time ? buildISODateString(time) : undefined,
    location,
    category,
    note: undefined,
    missingFields,
    confidence
  };
}

/**
 * 模拟 AI 方案生成：
 * 基于日程信息和用户偏好，生成时间线、准备清单、风险提醒和建议。
 */
// MBTI helpers
type MBTIPersonality = {
  tone: string;
  summaryStyle: string;
  advicePrefix: string;
};

const mbtiProfiles: Record<string, MBTIPersonality> = {
  INTJ: { tone: "理性从容", summaryStyle: "系统化", advicePrefix: "从效率角度，" },
  INTP: { tone: "灵活探索", summaryStyle: "多角度", advicePrefix: "换个思路，" },
  ENTJ: { tone: "果断高效", summaryStyle: "目标导向", advicePrefix: "最优路径是，" },
  ENTP: { tone: "灵活多变", summaryStyle: "创意发散", advicePrefix: "来个脑洞，" },
  INFJ: { tone: "温和深刻", summaryStyle: "有温度", advicePrefix: "从心出发，" },
  INFP: { tone: "细腻温柔", summaryStyle: "诗意温暖", advicePrefix: "遵从内心，" },
  ENFJ: { tone: "热情周到", summaryStyle: "以人为本", advicePrefix: "为了更好的体验，" },
  ENFP: { tone: "热情自由", summaryStyle: "充满可能", advicePrefix: "试试这个，" },
  ISTJ: { tone: "可靠务实", summaryStyle: "条理清晰", advicePrefix: "按部就班，" },
  ISFJ: { tone: "温柔守护", summaryStyle: "细致周全", advicePrefix: "细心一点，" },
  ESTJ: { tone: "高效执行", summaryStyle: "干脆利落", advicePrefix: "直接行动，" },
  ESFJ: { tone: "热情关怀", summaryStyle: "贴心周到", advicePrefix: "为你着想，" },
  ISTP: { tone: "冷静实用", summaryStyle: "实用至上", advicePrefix: "化繁为简，" },
  ISFP: { tone: "艺术感性", summaryStyle: "美感优先", advicePrefix: "享受过程，" },
  ESTP: { tone: "活力冒险", summaryStyle: "行动派", advicePrefix: "放手去做，" },
  ESFP: { tone: "热情洋溢", summaryStyle: "快乐至上", advicePrefix: "嗨起来，" },
};

function getMBTIProfile(mbti?: string): MBTIPersonality {
  return mbtiProfiles[mbti ?? ""] ?? { tone: "温和", summaryStyle: "均衡", advicePrefix: "" };
}

function applyAdviceStyle<T extends { options?: string[] }>(suggestions: T[], style: UserPreference["adviceStyle"]): T[] {
  if (style === "full_analysis") return suggestions.map((s) => ({ ...s, options: s.options ?? ["方案 A", "方案 B", "方案 C"] }));
  if (style === "two_or_three_options") return suggestions.map((s) => ({ ...s, options: s.options ?? ["推荐方案", "备选方案"] }));
  return suggestions.map((s) => { const { options, ...rest } = s; return rest as T; });
}

function applyDetailLevel<T extends { title: string; reason?: string; priority?: string }>(items: T[], level: UserPreference["planDetailLevel"]): T[] {
  if (level === "brief") return items.filter((item) => item.priority === "high").map(({ reason: _r, ...rest }) => rest as T);
  if (level === "detailed") return items.map((item) => ({ ...item, reason: item.reason ?? "建议提前准备以确保顺利。" }));
  return items;
}

function getBufferByReminderStyle(style: string, defaultBuffer: number): number {
  if (style === "light") return Math.max(defaultBuffer - 10, 5);
  if (style === "repeated") return defaultBuffer + 10;
  return defaultBuffer;
}

async function mockGeneratePlan(request: GeneratePlanRequest): Promise<GeneratePlanResponse> {
  await sleep(1200);

  const { schedule, userPreference } = request;
  const hour = parseInt(schedule.startAt.slice(11, 13), 10);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const mbti = getMBTIProfile(userPreference.mbti);
  const buffer = getBufferByReminderStyle(userPreference.reminderStyle, userPreference.commute?.defaultBufferMinutes ?? 15);

  const prepareMinute = hour > 0 ? 20 : 0;
  const prepareHour = prepareMinute < 60 ? hour - 1 : hour - 2;

  const summaryTemplates = [
    "提前 " + (60 - prepareMinute) + " 分钟从容准备，确认关键事项，预留缓冲时间从容出发。",
    mbti.summaryStyle + "风格提醒：" + mbti.advicePrefix + "从细节开始，AI 已为你梳理好时间线和待办。",
    mbti.tone + "视角：一个值得期待的安排，从现在的准备开始。",
  ];
  const summary = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)]!;

  const timeline: GeneratePlanResponse["timeline"] = [
    {
      time: pad(prepareHour) + ":" + pad(prepareMinute),
      title: "开始准备",
      description: "检查需要携带的物品和路线。",
      type: "preparation"
    },
    {
      time: pad(hour) + ":00",
      title: "提前出发",
      description: "预留 " + buffer + " 分钟缓冲应对交通。",
      type: "departure"
    }
  ];

  const rawChecklist = buildChecklistByCategory(schedule.category);
  const checklist = applyDetailLevel(rawChecklist, userPreference.planDetailLevel);
  const risks = buildRisksByCategory(schedule.category);
  const rawSuggestions = buildSuggestionsByCategory(schedule.category, userPreference);
  const suggestions = applyAdviceStyle(rawSuggestions, userPreference.adviceStyle);

  const detailLevel = userPreference.planDetailLevel;
  const followUp = schedule.category === "work_study"
    ? [{ title: "及时复盘", description: "记录学习笔记或会议要点。" }]
    : schedule.category === "health_fitness"
      ? [{ title: "记录运动数据", description: "方便追踪进步。" }]
      : (detailLevel === "detailed" ? [{ title: "简单记录", description: "随手记下今天的感受。" }] : undefined);

  return { summary, timeline, checklist, risks, suggestions, followUp };
}

function buildChecklistByCategory(category: ScheduleCategory): GeneratePlanResponse["checklist"] {
  switch (category) {
    case "dating_social":
      return [
        { title: "确认地点和时间", reason: "避免临时出错。", priority: "medium" },
        { title: "给手机充电", reason: "方便导航和支付。", priority: "high" },
        { title: "准备话题", reason: "让聊天更自然。", priority: "low" },
        { title: "准备小礼物（可选）", reason: "增加好感。", priority: "low" }
      ];
    case "health_fitness":
      return [
        { title: "准备运动装备", reason: "合适的装备提升效果。", priority: "high" },
        { title: "补充水分", reason: "运动前30分钟喝水。", priority: "high" },
        { title: "确认运动前饮食", reason: "空腹或饱腹都不适合。", priority: "medium" }
      ];
    case "work_study":
      return [
        { title: "准备相关资料", reason: "提前阅读提高效率。", priority: "high" },
        { title: "列出重点问题", reason: "有目标更聚焦。", priority: "high" },
        { title: "检查设备/工具", reason: "避免技术故障。", priority: "medium" },
        { title: "准备好水和小食", reason: "保持精力集中。", priority: "low" }
      ];
    case "travel_errand":
      return [
        { title: "准备证件/材料", reason: "出行必备。", priority: "high" },
        { title: "查看路线和交通", reason: "避开拥堵。", priority: "medium" },
        { title: "查看天气", reason: "下雨带伞，天冷加衣。", priority: "medium" }
      ];
    default:
      return [
        { title: "确认时间和地点", reason: "避免临时出错。", priority: "medium" },
        { title: "给手机充电", reason: "方便导航和支付。", priority: "high" }
      ];
  }
}

function buildRisksByCategory(category: ScheduleCategory): GeneratePlanResponse["risks"] {
  switch (category) {
    case "dating_social":
      return [
        { title: "晚餐排队", detail: "高峰期可能需要等位，提前取号。", level: "medium", action: "提前出发或电话预约。" },
        { title: "天气变化", detail: "如遇雨天可能影响出行。", level: "low", action: "出门前看一眼天气预报。" }
      ];
    case "health_fitness":
      return [
        { title: "运动不适", detail: "如果感到不适立即停止。", level: "medium", action: "运动前充分热身。" },
        { title: "天气影响", detail: "雨天或高温不适合户外运动。", level: "low", action: "准备好室内备选方案。" }
      ];
    case "work_study":
      return [
        { title: "时间超时", detail: "讨论可能超时影响后续安排。", level: "medium", action: "提前设定时间边界。" },
        { title: "信息遗漏", detail: "可能忘记重要细节。", level: "medium", action: "做好笔记或录音（征得同意）。" }
      ];
    case "travel_errand":
      return [
        { title: "交通拥堵", detail: "高峰期可能堵车延误。", level: "high", action: "提前查看实时路况，预留更多缓冲时间。" },
        { title: "证件遗漏", detail: "忘带必需证件无法办理。", level: "high", action: "出门前逐一核对材料清单。" }
      ];
    default:
      return [
        { title: "关注天气", detail: "提前查看是否需要带伞或外套。", level: "low", action: "出门前看一眼天气预报。" }
      ];
  }
}

function buildSuggestionsByCategory(category: ScheduleCategory, pref: UserPreference): GeneratePlanResponse["suggestions"] {
  const mbti = getMBTIProfile(pref.mbti);
  switch (category) {
    case "dating_social":
      return [
        { type: "outfit", title: "穿搭建议", content: mbti.advicePrefix + (pref.outfit?.style === "casual" ? "休闲舒适的搭配即可。" : pref.outfit?.style === "colorful" ? "可以尝试亮色搭配，更有活力。" : "简约清新的搭配，给人好印象。") },
        { type: "topic", title: "话题准备", content: mbti.advicePrefix + "从最近的电影、旅行经历或共同兴趣聊起。" },
        { type: "food", title: "饮食建议", content: mbti.advicePrefix + (pref.diet?.taste === "heavy_spicy" ? "可以尝试川菜或湘菜。" : "清淡日料或粤菜是不错的选择。") }
      ];
    case "health_fitness":
      return [
        { type: "food", title: "运动饮食", content: mbti.advicePrefix + "运动前 1 小时吃根香蕉或全麦面包，补充碳水。" },
        { type: "exercise", title: "强度建议", content: mbti.advicePrefix + (pref.exercise?.intensity === "high" ? "先做好热身，逐步提升强度。" : "保持当前强度，注意动作标准。") }
      ];
    case "work_study":
      return [
        { type: "meeting", title: "效率建议", content: mbti.advicePrefix + "用 25 分钟专注学习法（番茄钟），提高效率。" },
        { type: "study", title: "学习节奏", content: mbti.advicePrefix + (pref.planDetailLevel === "detailed" ? "建议每 45 分钟休息 5 分钟，保持大脑清醒。" : "保持舒适节奏，不必过度疲劳。") }
      ];
    case "travel_errand":
      return [
        { type: "route", title: "路线建议", content: mbti.advicePrefix + (pref.commute?.preferredMethod === "drive" ? "提前查看停车场位置。" : "地铁+步行是最稳妥的选择。") }
      ];
    default:
      return [{ type: "general", title: "从容出发", content: mbti.advicePrefix + "提前规划，一切都在掌控之中。" }];
  }
}

function buildISODateString(time: string): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${date}T${time}:00+08:00`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建 mock AI 客户端实例。
 * 模拟真实 AI 的行为：
 * - 有一定延迟（模拟网络请求）
 * - 基于规则 + 随机化生成结果
 * - 考虑用户偏好
 *
 * 切换到真实客户端只需替换此工厂方法。
 */
export function createMockAIClient(): AIClient {
  return {
    parseScheduleDraft: mockParseScheduleDraft,
    generatePlan: mockGeneratePlan
  };
}