import { createStore } from "zustand/vanilla";

import type { ChecklistItem, TimelineItem, AIPlan } from "@/types/ai";
import type { Schedule } from "@/types/schedule";
import type { AIPlanRepository, ScheduleRepository } from "@/services/storage";

type TodayChecklistItem = ChecklistItem & {
  planId: string;
  scheduleId: string;
  scheduleTitle: string;
};

type TodayTimelineItem = TimelineItem & {
  planId: string;
  scheduleId: string;
  scheduleTitle: string;
};

type ScheduleStoreRepositories = {
  schedules: ScheduleRepository;
  aiPlans: AIPlanRepository;
};

export type ScheduleStoreState = {
  todaySchedules: Schedule[];
  todayPlans: AIPlan[];
  todayChecklist: TodayChecklistItem[];
  todayTimeline: TodayTimelineItem[];
  allSchedules: Schedule[];
  allPlans: AIPlan[];
  selectedSchedule?: Schedule;
  selectedPlan?: AIPlan;
  isLoading: boolean;
  error?: string;
  loadToday(date: string): Promise<void>;
  loadAllSchedules(): Promise<void>;
  loadScheduleDetail(scheduleId: string): Promise<void>;
  saveSchedule(schedule: Schedule): Promise<void>;
  saveNewSchedule(schedule: Schedule): Promise<void>;
  saveAIPlan(plan: AIPlan): Promise<void>;
  toggleChecklistItem(planId: string, itemId: string): Promise<void>;
};

function buildTodayState(schedules: Schedule[], plans: AIPlan[]) {
  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const todayChecklist = plans.flatMap((plan) => {
    const schedule = scheduleById.get(plan.scheduleId);
    return plan.checklist.map((item) => ({
      ...item,
      planId: plan.id,
      scheduleId: plan.scheduleId,
      scheduleTitle: schedule?.title ?? ""
    }));
  });
  const todayTimeline = plans.flatMap((plan) => {
    const schedule = scheduleById.get(plan.scheduleId);
    return plan.timeline.map((item) => ({
      ...item,
      planId: plan.id,
      scheduleId: plan.scheduleId,
      scheduleTitle: schedule?.title ?? ""
    }));
  });

  return { todayChecklist, todayTimeline };
}

function todayISO() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function createScheduleStore(repositories: ScheduleStoreRepositories) {
  return createStore<ScheduleStoreState>((set, get) => ({
    todaySchedules: [],
    todayPlans: [],
    todayChecklist: [],
    todayTimeline: [],
    allSchedules: [],
    allPlans: [],
    isLoading: false,
    async loadToday(date) {
      set({ isLoading: true, error: undefined });
      try {
        const todaySchedules = await repositories.schedules.listSchedulesForDate(date);
        const todayPlans = (
          await Promise.all(todaySchedules.map((schedule) => repositories.aiPlans.getPlanByScheduleId(schedule.id)))
        ).filter((plan): plan is AIPlan => Boolean(plan));
        set({ todaySchedules, todayPlans, ...buildTodayState(todaySchedules, todayPlans), isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "加载日程失败", isLoading: false });
      }
    },
    async loadAllSchedules() {
      set({ isLoading: true, error: undefined });
      try {
        const allSchedules = await repositories.schedules.listSchedules();
        const allPlans = (
          await Promise.all(allSchedules.map((schedule) => repositories.aiPlans.getPlanByScheduleId(schedule.id)))
        ).filter((plan): plan is AIPlan => Boolean(plan));
        set({ allSchedules, allPlans, isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "加载日程失败", isLoading: false });
      }
    },
    async loadScheduleDetail(scheduleId) {
      set({ isLoading: true, error: undefined });
      try {
        const selectedSchedule = await repositories.schedules.getScheduleById(scheduleId);
        const selectedPlan = await repositories.aiPlans.getPlanByScheduleId(scheduleId);
        set({
          selectedSchedule: selectedSchedule ?? undefined,
          selectedPlan: selectedPlan ?? undefined,
          isLoading: false
        });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "加载详情失败", isLoading: false });
      }
    },
    async saveSchedule(schedule) {
      await repositories.schedules.saveSchedule(schedule);
      set({ selectedSchedule: schedule });
    },
    async saveNewSchedule(schedule) {
      await repositories.schedules.saveSchedule(schedule);
      const allSchedules = [...get().allSchedules, schedule];
      // 同步更新今日日程
      const today = todayISO();
      const scheduleDate = schedule.startAt.slice(0, 10);
      const todaySchedules = scheduleDate === today
        ? [...get().todaySchedules, schedule]
        : get().todaySchedules;
      set({ allSchedules, todaySchedules, selectedSchedule: schedule });
    },
    async saveAIPlan(plan) {
      await repositories.aiPlans.savePlan(plan);
      const existing = get().allPlans;
      const idx = existing.findIndex((p) => p.id === plan.id);
      const allPlans = idx >= 0 ? existing.map((p, i) => (i === idx ? plan : p)) : [...existing, plan];
      // 检查是否是今日计划
      const today = todayISO();
      const schedule = get().allSchedules.find((s) => s.id === plan.scheduleId);
      const isTodayPlan = schedule ? schedule.startAt.slice(0, 10) === today : false;
      const todayPlans = isTodayPlan
        ? get().todayPlans.some((p) => p.id === plan.id)
          ? get().todayPlans.map((p) => (p.id === plan.id ? plan : p))
          : [...get().todayPlans, plan]
        : get().todayPlans;
      const todaySchedules = get().todaySchedules;
      const todayState = isTodayPlan ? buildTodayState(todaySchedules, todayPlans) : {};
      set({ selectedPlan: plan, allPlans, todayPlans, ...todayState });
    },
    async toggleChecklistItem(planId, itemId) {
      const updatedPlan = await repositories.aiPlans.toggleChecklistItem(planId, itemId);
      if (!updatedPlan) {
        return;
      }
      const todayPlans = get().todayPlans.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan));
      const todaySchedules = get().todaySchedules;
      set({ todayPlans, ...buildTodayState(todaySchedules, todayPlans) });
    }
  }));
}
