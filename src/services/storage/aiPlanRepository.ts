import type { AIPlan } from "@/types/ai";

import type { SqliteAdapter } from "./sqliteAdapter";

type AIPlanRow = {
  id: string;
  schedule_id: string;
  summary: string;
  confidence: AIPlan["confidence"];
  timeline_json: string;
  checklist_json: string;
  risks_json: string;
  suggestions_json: string;
  follow_up_json?: string;
  generated_at: string;
  model_version?: string;
};

export type AIPlanRepository = ReturnType<typeof createAIPlanRepository>;

function parseJson<T>(value: string | undefined, fallback: T): T {
  return value ? (JSON.parse(value) as T) : fallback;
}

function fromRow(row: AIPlanRow): AIPlan {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    summary: row.summary,
    confidence: row.confidence,
    timeline: parseJson(row.timeline_json, []),
    checklist: parseJson(row.checklist_json, []),
    risks: parseJson(row.risks_json, []),
    suggestions: parseJson(row.suggestions_json, []),
    followUp: parseJson(row.follow_up_json, undefined),
    generatedAt: row.generated_at,
    modelVersion: row.model_version
  };
}

export function createAIPlanRepository(db: SqliteAdapter) {
  const savePlan = async (plan: AIPlan) => {
    await db.runAsync(
      `INSERT OR REPLACE INTO ai_plans (
        id, schedule_id, summary, confidence, timeline_json, checklist_json, risks_json,
        suggestions_json, follow_up_json, generated_at, model_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plan.id,
        plan.scheduleId,
        plan.summary,
        plan.confidence,
        JSON.stringify(plan.timeline),
        JSON.stringify(plan.checklist),
        JSON.stringify(plan.risks),
        JSON.stringify(plan.suggestions),
        plan.followUp ? JSON.stringify(plan.followUp) : undefined,
        plan.generatedAt,
        plan.modelVersion
      ]
    );
  };

  return {
    savePlan,
    async getPlanById(id: string) {
      const row = await db.getFirstAsync<AIPlanRow>("SELECT * FROM ai_plans WHERE id = ?", [id]);
      return row ? fromRow(row) : null;
    },
    async getPlanByScheduleId(scheduleId: string) {
      const row = await db.getFirstAsync<AIPlanRow>("SELECT * FROM ai_plans WHERE schedule_id = ?", [scheduleId]);
      return row ? fromRow(row) : null;
    },
    async listPlans() {
      const rows = await db.getAllAsync<AIPlanRow>("SELECT * FROM ai_plans");
      return rows.map(fromRow);
    },
    async toggleChecklistItem(planId: string, itemId: string) {
      const plan = await this.getPlanById(planId);
      if (!plan) {
        return null;
      }
      const updatedPlan: AIPlan = {
        ...plan,
        checklist: plan.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
      };
      await savePlan(updatedPlan);
      return updatedPlan;
    }
  };
}
