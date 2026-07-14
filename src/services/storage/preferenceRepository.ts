import type { UserPreference } from "@/types/preference";

import type { SqliteAdapter } from "./sqliteAdapter";

const preferenceId = "local-user";

type PreferenceRow = {
  id: string;
  preference_json: string;
  updated_at: string;
};

export const defaultPreference: UserPreference = {
  mbti: "unknown",
  adviceStyle: "best_one",
  reminderStyle: "standard",
  planDetailLevel: "normal",
  diet: { taste: "light", avoid: [], budget: "moderate" },
  exercise: { preferredTypes: [], intensity: "moderate" },
  outfit: { style: "minimal", colorPreference: "neutral" },
  commute: { preferredMethod: "subway", defaultBufferMinutes: 20 }
};

export type PreferenceRepository = ReturnType<typeof createPreferenceRepository>;

export function createPreferenceRepository(db: SqliteAdapter) {
  return {
    async getPreference() {
      const row = await db.getFirstAsync<PreferenceRow>("SELECT * FROM preferences WHERE id = ?", [preferenceId]);
      return row ? (JSON.parse(row.preference_json) as UserPreference) : defaultPreference;
    },
    async savePreference(preference: UserPreference) {
      await db.runAsync("INSERT OR REPLACE INTO preferences (id, preference_json, updated_at) VALUES (?, ?, ?)", [
        preferenceId,
        JSON.stringify(preference),
        new Date().toISOString()
      ]);
    }
  };
}
