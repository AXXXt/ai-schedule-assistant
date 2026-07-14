import type { AIPlan } from "@/types/ai";
import type { UserPreference } from "@/types/preference";
import type { Schedule } from "@/types/schedule";

import type { AIPlanRepository } from "./aiPlanRepository";
import { defaultPreference, type PreferenceRepository } from "./preferenceRepository";
import type { ScheduleRepository } from "./scheduleRepository";

export const mockSchedules: Schedule[] = [
  {
    id: "demo-social-1",
    title: "和小雨聚餐",
    startAt: "2026-07-15T18:30:00+08:00",
    endAt: "2026-07-15T20:30:00+08:00",
    location: "万象城",
    category: "dating_social",
    note: "日料，适中预算",
    source: "manual",
    status: "upcoming",
    aiPlanId: "demo-plan-1",
    createdAt: "2026-07-14T09:00:00+08:00",
    updatedAt: "2026-07-14T09:00:00+08:00"
  }
];

export const mockAIPlans: AIPlan[] = [
  {
    id: "demo-plan-1",
    scheduleId: "demo-social-1",
    summary: "确认餐厅位置，准备轻松话题，提前 20 分钟出门。",
    confidence: "high",
    timeline: [
      { id: "demo-timeline-1", time: "17:40", title: "开始准备", type: "preparation" },
      { id: "demo-timeline-2", time: "18:00", title: "提前出门", type: "departure" }
    ],
    checklist: [
      { id: "demo-check-1", title: "确认餐厅位置", done: false, priority: "medium" },
      { id: "demo-check-2", title: "给手机充电", done: false, priority: "high" }
    ],
    risks: [{ id: "demo-risk-1", title: "晚餐排队", detail: "高峰期可能需要等位。", level: "medium" }],
    suggestions: [{ id: "demo-suggestion-1", type: "topic", title: "话题", content: "从最近电影或周末计划聊起。" }],
    generatedAt: "2026-07-14T09:01:00+08:00",
    modelVersion: "mock-v1"
  }
];

export const mockPreference: UserPreference = defaultPreference;

export async function seedMockDataIfEmpty(repositories: {
  schedules: ScheduleRepository;
  aiPlans: AIPlanRepository;
  preferences: PreferenceRepository;
}) {
  const existingSchedules = await repositories.schedules.listSchedules();
  if (existingSchedules.length > 0) { return; }
  for (const schedule of mockSchedules) { await repositories.schedules.saveSchedule(schedule); }
  for (const plan of mockAIPlans) { await repositories.aiPlans.savePlan(plan); }
  await repositories.preferences.savePreference(mockPreference);
}
