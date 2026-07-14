export type ScheduleCategory = "dating_social" | "health_fitness" | "work_study" | "travel_errand" | "other";

export type ScheduleStatus = "upcoming" | "completed" | "cancelled";

export type Schedule = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  location?: string;
  category: ScheduleCategory;
  note?: string;
  source: "manual" | "ai_chat";
  status: ScheduleStatus;
  aiPlanId?: string;
  createdAt: string;
  updatedAt: string;
};
