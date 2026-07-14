import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";

import type { AIClient } from "@/services/ai";
import type { AIPlanRepository, PreferenceRepository, ScheduleRepository } from "@/services/storage";

import { type PreferenceStoreState, createPreferenceStore } from "./preferenceStore";
import { type ScheduleStoreState, createScheduleStore } from "./scheduleStore";

type AppRepositories = {
  schedules: ScheduleRepository;
  aiPlans: AIPlanRepository;
  preferences: PreferenceRepository;
};

type StoreContextValue = {
  schedule: ReturnType<typeof createScheduleStore>;
  preference: ReturnType<typeof createPreferenceStore>;
  aiClient: AIClient;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  children,
  repositories,
  aiClient
}: {
  children: ReactNode;
  repositories: AppRepositories;
  aiClient: AIClient;
}) {
  const valueRef = useRef<StoreContextValue>(null!);
  if (!valueRef.current) {
    valueRef.current = {
      schedule: createScheduleStore(repositories),
      preference: createPreferenceStore(repositories),
      aiClient
    };
  }

  return <StoreContext.Provider value={valueRef.current}>{children}</StoreContext.Provider>;
}

export function useScheduleStore<T>(selector: (state: ScheduleStoreState) => T): T {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useScheduleStore must be used inside StoreProvider");
  }
  return useStore(ctx.schedule, selector);
}

export function usePreferenceStore<T>(selector: (state: PreferenceStoreState) => T): T {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("usePreferenceStore must be used inside StoreProvider");
  }
  return useStore(ctx.preference, selector);
}

/**
 * 获取注入的 AI 客户端实例。
 * 页面通过此 hook 调用 AI 能力，不感知 mock/真实实现。
 */
export function useAIClient(): AIClient {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useAIClient must be used inside StoreProvider");
  }
  return ctx.aiClient;
}

export function useScheduleActions() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useScheduleActions must be used inside StoreProvider");
  }
  return useStore(ctx.schedule, useShallow((s) => ({
    loadToday: s.loadToday,
    loadAllSchedules: s.loadAllSchedules,
    loadScheduleDetail: s.loadScheduleDetail,
    saveSchedule: s.saveSchedule,
    saveNewSchedule: s.saveNewSchedule,
    saveAIPlan: s.saveAIPlan,
    toggleChecklistItem: s.toggleChecklistItem
  })));
}

export function usePreferenceActions() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("usePreferenceActions must be used inside StoreProvider");
  }
  return useStore(ctx.preference, useShallow((s) => ({
    loadPreference: s.loadPreference,
    updatePreference: s.updatePreference
  })));
}
