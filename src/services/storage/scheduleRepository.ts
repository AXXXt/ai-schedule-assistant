import type { Schedule } from "@/types/schedule";

import type { SqliteAdapter } from "./sqliteAdapter";

type ScheduleRow = {
  id: string;
  title: string;
  start_at: string;
  end_at?: string;
  location?: string;
  category: Schedule["category"];
  note?: string;
  source: Schedule["source"];
  status: Schedule["status"];
  ai_plan_id?: string;
  created_at: string;
  updated_at: string;
};

export type ScheduleRepository = ReturnType<typeof createScheduleRepository>;

function fromRow(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    category: row.category,
    note: row.note,
    source: row.source,
    status: row.status,
    aiPlanId: row.ai_plan_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createScheduleRepository(db: SqliteAdapter) {
  return {
    async saveSchedule(schedule: Schedule) {
      await db.runAsync(
        `INSERT OR REPLACE INTO schedules (
          id, title, start_at, end_at, location, category, note, source, status, ai_plan_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule.id,
          schedule.title,
          schedule.startAt,
          schedule.endAt,
          schedule.location,
          schedule.category,
          schedule.note,
          schedule.source,
          schedule.status,
          schedule.aiPlanId,
          schedule.createdAt,
          schedule.updatedAt
        ]
      );
    },
    async getScheduleById(id: string) {
      const row = await db.getFirstAsync<ScheduleRow>("SELECT * FROM schedules WHERE id = ?", [id]);
      return row ? fromRow(row) : null;
    },
    async listSchedules() {
      const rows = await db.getAllAsync<ScheduleRow>("SELECT * FROM schedules ORDER BY start_at ASC");
      return rows.map(fromRow);
    },
    async listSchedulesForDate(date: string) {
      const rows = await db.getAllAsync<ScheduleRow>(
        "SELECT * FROM schedules WHERE date(start_at) = date(?) ORDER BY start_at ASC",
        [date]
      );
      return rows.map(fromRow);
    },
    async deleteSchedule(id: string) {
      await db.runAsync("DELETE FROM schedules WHERE id = ?", [id]);
    }
  };
}
