import type { AIPlan } from "@/types/ai";
import type { UserPreference } from "@/types/preference";
import type { Schedule } from "@/types/schedule";

import { createAIPlanRepository } from "./aiPlanRepository";
import { initializeDatabase } from "./database";
import { createMemorySqliteAdapter } from "./memorySqliteAdapter";
import { createPreferenceRepository } from "./preferenceRepository";
import { createScheduleRepository } from "./scheduleRepository";

const schedule: Schedule = {
  id: "schedule-1",
  title: "Interview prep",
  startAt: "2026-07-15T09:00:00+08:00",
  endAt: "2026-07-15T10:00:00+08:00",
  location: "Home",
  category: "work_study",
  note: "Review portfolio",
  source: "manual",
  status: "upcoming",
  aiPlanId: "plan-1",
  createdAt: "2026-07-14T10:00:00+08:00",
  updatedAt: "2026-07-14T10:00:00+08:00"
};

const plan: AIPlan = {
  id: "plan-1",
  scheduleId: "schedule-1",
  summary: "Prepare notes and leave a buffer before the interview.",
  confidence: "high",
  timeline: [{ id: "timeline-1", time: "08:30", title: "Review notes", type: "preparation" }],
  checklist: [{ id: "check-1", title: "Charge phone", done: false, priority: "high" }],
  risks: [{ id: "risk-1", title: "Late start", detail: "Morning prep may run long.", level: "medium" }],
  suggestions: [{ id: "suggestion-1", type: "meeting", title: "Opening", content: "Prepare a short intro." }],
  followUp: [{ id: "follow-1", title: "Write interview recap" }],
  generatedAt: "2026-07-14T10:05:00+08:00",
  modelVersion: "mock-v1"
};

const preference: UserPreference = {
  mbti: "INFP",
  adviceStyle: "best_one",
  reminderStyle: "standard",
  planDetailLevel: "normal",
  diet: { taste: "light", avoid: ["peanuts"], budget: "moderate" },
  commute: { preferredMethod: "subway", defaultBufferMinutes: 20 }
};

describe("storage repositories", () => {
  it("persists schedules, AI plans, and preferences", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);

    const schedules = createScheduleRepository(db);
    const aiPlans = createAIPlanRepository(db);
    const preferences = createPreferenceRepository(db);

    await schedules.saveSchedule(schedule);
    await aiPlans.savePlan(plan);
    await preferences.savePreference(preference);

    expect(await schedules.listSchedulesForDate("2026-07-15")).toEqual([schedule]);
    expect(await schedules.getScheduleById("schedule-1")).toEqual(schedule);
    expect(await aiPlans.getPlanByScheduleId("schedule-1")).toEqual(plan);
    expect(await preferences.getPreference()).toEqual(preference);
  });

  it("updates checklist completion inside an AI plan", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);
    const aiPlans = createAIPlanRepository(db);

    await aiPlans.savePlan(plan);
    const updated = await aiPlans.toggleChecklistItem("plan-1", "check-1");

    expect(updated?.checklist[0].done).toBe(true);
    expect((await aiPlans.getPlanById("plan-1"))?.checklist[0].done).toBe(true);
  });
});
