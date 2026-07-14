import type { SqliteAdapter } from "./sqliteAdapter";

export async function initializeDatabase(db: SqliteAdapter): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT,
      location TEXT,
      category TEXT NOT NULL,
      note TEXT,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      ai_plan_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_plans (
      id TEXT PRIMARY KEY NOT NULL,
      schedule_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      confidence TEXT NOT NULL,
      timeline_json TEXT NOT NULL,
      checklist_json TEXT NOT NULL,
      risks_json TEXT NOT NULL,
      suggestions_json TEXT NOT NULL,
      follow_up_json TEXT,
      generated_at TEXT NOT NULL,
      model_version TEXT
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY NOT NULL,
      preference_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
