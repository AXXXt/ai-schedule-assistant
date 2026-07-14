import { render } from "@testing-library/react-native";

import { createAIPlanRepository, createMemorySqliteAdapter, createPreferenceRepository, createScheduleRepository, initializeDatabase } from "@/services/storage";
import { createMockAIClient } from "@/services/ai";
import { StoreProvider } from "@/stores/StoreProvider";

import { TodayScreen } from "./TodayScreen";

describe("TodayScreen with store", () => {
  it("renders empty state when no schedules exist", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);

    const view = await render(
      <StoreProvider
        repositories={{ schedules: createScheduleRepository(db), aiPlans: createAIPlanRepository(db), preferences: createPreferenceRepository(db) }}
        aiClient={createMockAIClient()}
      >
        <TodayScreen />
      </StoreProvider>
    );

    expect(view.getByText("今天没有日程")).toBeTruthy();
  });
});
