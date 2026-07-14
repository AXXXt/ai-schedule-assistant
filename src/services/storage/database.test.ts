import { initializeDatabase } from "./database";
import { createMemorySqliteAdapter } from "./memorySqliteAdapter";

describe("storage database", () => {
  it("creates the local tables for schedules, AI plans, and preferences", async () => {
    const db = createMemorySqliteAdapter();

    await initializeDatabase(db);

    expect(db.tableNames()).toEqual(["ai_plans", "preferences", "schedules"]);
  });
});
