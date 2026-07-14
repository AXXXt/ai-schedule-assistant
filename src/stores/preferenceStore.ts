import { createStore } from "zustand/vanilla";

import { defaultPreference, type PreferenceRepository } from "@/services/storage";
import type { UserPreference } from "@/types/preference";

type PreferenceStoreRepositories = {
  preferences: PreferenceRepository;
};

export type PreferenceStoreState = {
  preference: UserPreference;
  isLoading: boolean;
  error?: string;
  loadPreference(): Promise<void>;
  updatePreference(update: Partial<UserPreference>): Promise<void>;
};

export function createPreferenceStore(repositories: PreferenceStoreRepositories) {
  return createStore<PreferenceStoreState>((set, get) => ({
    preference: defaultPreference,
    isLoading: false,
    async loadPreference() {
      set({ isLoading: true, error: undefined });
      try {
        const preference = await repositories.preferences.getPreference();
        set({ preference, isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to load preferences", isLoading: false });
      }
    },
    async updatePreference(update) {
      const preference = { ...get().preference, ...update };
      await repositories.preferences.savePreference(preference);
      set({ preference });
    }
  }));
}
