import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { createAIPlanRepository, createMemorySqliteAdapter, createPreferenceRepository, createScheduleRepository, initializeDatabase } from "@/services/storage";
import { act } from "react";
import { createMockAIClient } from "@/services/ai";
import { StoreProvider } from "@/stores/StoreProvider";

import { CreateScheduleScreen } from "./CreateScheduleScreen";

describe("CreateScheduleScreen with store", () => {
  it("renders the manual creation form after tab switch", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);

    const view = await render(
      <StoreProvider
        repositories={{ schedules: createScheduleRepository(db), aiPlans: createAIPlanRepository(db), preferences: createPreferenceRepository(db) }}
        aiClient={createMockAIClient()}
      >
        <CreateScheduleScreen />
      </StoreProvider>
    );

    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: "手动" }));
    });
    expect(view.getByPlaceholderText("日程标题")).toBeTruthy();
    expect(view.getByRole("button", { name: "保存日程" })).toBeTruthy();
  });
});
