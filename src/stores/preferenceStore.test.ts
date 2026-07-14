import { createMemorySqliteAdapter, createPreferenceRepository, initializeDatabase } from "@/services/storage";

import { createPreferenceStore } from "./preferenceStore";

describe("preference store", () => {
  it("loads default preferences and persists partial updates", async () => {
    const db = createMemorySqliteAdapter();
    await initializeDatabase(db);
    const preferences = createPreferenceRepository(db);
    const store = createPreferenceStore({ preferences });

    await store.getState().loadPreference();
    await store.getState().updatePreference({ reminderStyle: "repeated" });

    expect(store.getState().preference.reminderStyle).toBe("repeated");
    expect((await preferences.getPreference()).reminderStyle).toBe("repeated");
  });
});
