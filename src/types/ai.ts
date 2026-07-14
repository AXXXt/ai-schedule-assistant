import type { Schedule } from "./schedule";
import type { UserPreference } from "./preference";

export type Confidence = "low" | "medium" | "high";

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  type: "preparation" | "departure" | "event" | "follow_up";
};

export type ChecklistItem = {
  id: string;
  title: string;
  reason?: string;
  done: boolean;
  priority: "low" | "medium" | "high";
};

export type RiskItem = {
  id: string;
  title: string;
  detail: string;
  level: "low" | "medium" | "high";
  action?: string;
};

export type SuggestionItem = {
  id: string;
  type: "outfit" | "food" | "topic" | "route" | "study" | "meeting" | "exercise" | "general";
  title: string;
  content: string;
  options?: string[];
};

export type FollowUpItem = {
  id: string;
  title: string;
  description?: string;
};

export type AIPlan = {
  id: string;
  scheduleId: string;
  summary: string;
  confidence: Confidence;
  timeline: TimelineItem[];
  checklist: ChecklistItem[];
  risks: RiskItem[];
  suggestions: SuggestionItem[];
  followUp?: FollowUpItem[];
  generatedAt: string;
  modelVersion?: string;
};

export type ParsedScheduleDraft = {
  title: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  category: Schedule["category"];
  note?: string;
  missingFields: string[];
  confidence: Confidence;
};

export type GeneratePlanRequest = {
  schedule: Schedule;
  userPreference: UserPreference;
  context?: {
    currentTime: string;
    destination?: string;
    route?: string;
    weather?: {
      condition: string;
      temperature: number;
      precipitationChance?: number;
    };
  };
};

export type GeneratePlanResponse = {
  summary: string;
  timeline: Omit<TimelineItem, "id">[];
  checklist: Omit<ChecklistItem, "id" | "done">[];
  risks: Omit<RiskItem, "id">[];
  suggestions: Omit<SuggestionItem, "id">[];
  followUp?: Omit<FollowUpItem, "id">[];
};
