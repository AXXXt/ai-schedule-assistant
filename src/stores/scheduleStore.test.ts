import type { AIPlan } from "@/types/ai";
import type { Schedule } from "@/types/schedule";

import { createAIPlanRepository, createMemorySqliteAdapter, createScheduleRepository, initializeDatabase } from "@/services/storage";

import { createScheduleStore } from "./scheduleStore";

const schedule: Schedule = {
  id: "schedule-1",
  title: "Dinner",
  startAt: "2026-07-15T18:00:00+08:00",
  category: "dating_social",
  source: "manual",
  status: "upcoming",
  aiPlanId: "plan-1",
  createdAt: "2026-07-14T10:00:00+08:00",
  updatedAt: "2026-07-14T10:00:00+08:00"
};

const plan: AIPlan = {
  id: "plan-1",
  scheduleId: "schedule-1",
  summary: "Confirm the place and leave with enough buffer.",
  confidence: "high",
  timeline: [{ id: "timeline-1", time: "17:20", title: "Leave with buffer", type: "departure" }],
  checklist: [{ id: "check-1", title: "Confirm reservation", done: false, priority: "medium" }],
  risks: [],
  suggestions: [],
  generatedAt: "2026-07-14T10:05:00+08:00"
};

describe("schedule store", () => {
  it("loads today schedules with derived timeline and checklist data", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);
    const schedules = createScheduleRepository(db);
    const aiPlans = createAIPlanRepository(db);
    await schedules.saveSchedule(schedule);
    await aiPlans.savePlan(plan);

    const store = createScheduleStore({ schedules, aiPlans });
    await store.getState().loadToday("2026-07-15");

    expect(store.getState().todaySchedules).toEqual([schedule]);
    expect(store.getState().todayTimeline[0].title).toBe("Leave with buffer");
    expect(store.getState().todayChecklist[0].title).toBe("Confirm reservation");
  });

  it("persists checklist toggles and refreshes derived checklist state", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);
    const schedules = createScheduleRepository(db);
    const aiPlans = createAIPlanRepository(db);
    await schedules.saveSchedule(schedule);
    await aiPlans.savePlan(plan);

    const store = createScheduleStore({ schedules, aiPlans });
    await store.getState().loadToday("2026-07-15");
    await store.getState().toggleChecklistItem("plan-1", "check-1");

    expect(store.getState().todayChecklist[0].done).toBe(true);
    expect((await aiPlans.getPlanById("plan-1"))?.checklist[0].done).toBe(true);
  });
});
