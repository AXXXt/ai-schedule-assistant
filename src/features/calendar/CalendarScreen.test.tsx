import { fireEvent, render } from "@testing-library/react-native";

import type { Schedule } from "@/types/schedule";
import { createAIPlanRepository, createMemorySqliteAdapter, createPreferenceRepository, createScheduleRepository, initializeDatabase } from "@/services/storage";
import { createMockAIClient } from "@/services/ai";
import { StoreProvider } from "@/stores/StoreProvider";

import { CalendarScreen } from "./CalendarScreen";

const seedSchedule: Schedule = {
  id: "cal-1",
  title: "Morning run",
  startAt: "2026-07-15T07:00:00+08:00",
  category: "health_fitness",
  source: "manual",
  status: "upcoming",
  createdAt: "2026-07-14T10:00:00+08:00",
  updatedAt: "2026-07-14T10:00:00+08:00"
};

describe("CalendarScreen with store", () => {
  it("renders schedule dots for dates that have schedules", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);
    const schedules = createScheduleRepository(db);
    await schedules.saveSchedule(seedSchedule);

    const view = await render(
      <StoreProvider
        repositories={{ schedules, aiPlans: createAIPlanRepository(db), preferences: createPreferenceRepository(db) }}
        aiClient={createMockAIClient()}
      >
        <CalendarScreen />
      </StoreProvider>
    );

    expect(view.getByText("Morning run")).toBeTruthy();
  });
});
