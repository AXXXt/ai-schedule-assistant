import type { AIPlan } from "@/types/ai";
import type { Schedule } from "@/types/schedule";

export const todaySchedules: Schedule[] = [
  {
    id: "schedule-social-1",
    title: "和小雨聚餐",
    startAt: "2026-07-15T15:00:00+08:00",
    endAt: "2026-07-15T17:00:00+08:00",
    location: "万象城",
    category: "dating_social",
    note: "日料，保持轻松愉快的氛围。",
    source: "ai_chat",
    status: "upcoming",
    aiPlanId: "plan-social-1",
    createdAt: "2026-07-14T09:00:00+08:00",
    updatedAt: "2026-07-14T09:00:00+08:00"
  }
];

export const todayPlans: AIPlan[] = [
  {
    id: "plan-social-1",
    scheduleId: "schedule-social-1",
    summary: "下午保持从容。从容准备，提前 40 分钟出门，备一个轻松话题。",
    confidence: "high",
    timeline: [
      { id: "timeline-prepare", time: "14:00", title: "开始准备", description: "检查穿搭、手机电量和餐厅地址。", type: "preparation" },
      { id: "timeline-leave", time: "14:20", title: "预留缓冲时间出门", description: "预留 15 分钟应对交通或找入口。", type: "departure" },
      { id: "timeline-event", time: "15:00", title: "和小雨聚餐", type: "event" }
    ],
    checklist: [
      { id: "check-phone", title: "出门前给手机充电", reason: "方便聊天、导航和支付。", done: false, priority: "high" },
      { id: "check-location", title: "确认餐厅位置", reason: "避免临时寻找。", done: false, priority: "medium" }
    ],
    risks: [
      { id: "risk-wait", title: "可能需要等位", detail: "热门晚餐地点可能人多。", level: "medium", action: "提前备选一个附近餐厅。" }
    ],
    suggestions: [
      { id: "suggest-topic", type: "topic", title: "轻松开场话题", content: "从周末计划、最近电影或共同兴趣聊起。" }
    ],
    generatedAt: "2026-07-14T09:01:00+08:00",
    modelVersion: "mock-v1"
  }
];
