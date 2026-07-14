import { fireEvent, render } from "@testing-library/react-native";

import { createAIPlanRepository, createMemorySqliteAdapter, createPreferenceRepository, createScheduleRepository, initializeDatabase } from "@/services/storage";
import { createMockAIClient } from "@/services/ai";
import { StoreProvider } from "@/stores/StoreProvider";

import { ProfileScreen } from "./ProfileScreen";

describe("ProfileScreen with store", () => {
  it("persists reminder style preference to the store", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);
    const preferences = createPreferenceRepository(db);

    const view = await render(
      <StoreProvider
        repositories={{ schedules: createScheduleRepository(db), aiPlans: createAIPlanRepository(db), preferences }}
        aiClient={createMockAIClient()}
      >
        <ProfileScreen />
      </StoreProvider>
    );

    const repeatedButton = view.getByRole("button", { name: "多次提醒" });
    fireEvent.press(repeatedButton);

    const stored = await preferences.getPreference();
    expect(stored.reminderStyle).toBe("repeated");
  });
});
