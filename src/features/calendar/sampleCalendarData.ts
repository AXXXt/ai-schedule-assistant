import type { Schedule } from "@/types/schedule";

export type CalendarSchedule = Schedule & { hasRisk?: boolean };

export const calendarSchedules: CalendarSchedule[] = [
  {
    id: "schedule-social-1",
    title: "和小雨聚餐",
    startAt: "2026-07-15T15:00:00+08:00",
    endAt: "2026-07-15T17:00:00+08:00",
    location: "万象城",
    category: "dating_social",
    note: "日料，轻松夜晚。",
    source: "ai_chat",
    status: "upcoming",
    aiPlanId: "plan-social-1",
    hasRisk: true,
    createdAt: "2026-07-14T09:00:00+08:00",
    updatedAt: "2026-07-14T09:00:00+08:00",
  },
  {
    id: "schedule-run-1",
    title: "晨跑",
    startAt: "2026-07-18T07:30:00+08:00",
    endAt: "2026-07-18T08:20:00+08:00",
    location: "滨江公园",
    category: "health_fitness",
    note: "轻松配速，然后十分钟拉伸。",
    source: "manual",
    status: "upcoming",
    createdAt: "2026-07-12T18:00:00+08:00",
    updatedAt: "2026-07-12T18:00:00+08:00",
  },
  {
    id: "schedule-review-1",
    title: "作品集复盘",
    startAt: "2026-07-22T19:30:00+08:00",
    endAt: "2026-07-22T20:30:00+08:00",
    location: "家",
    category: "work_study",
    note: "回顾产品故事和移动端演示流程。",
    source: "manual",
    status: "upcoming",
    createdAt: "2026-07-13T20:00:00+08:00",
    updatedAt: "2026-07-13T20:00:00+08:00",
  },
];
