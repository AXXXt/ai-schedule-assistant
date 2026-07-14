# AI Schedule Assistant Data State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the phase-two local data layer and Zustand stores for schedules, AI plans, and user preferences.

**Architecture:** Storage is isolated behind a small SQL adapter so repositories can be tested without native SQLite while runtime uses `expo-sqlite`. Repositories own persistence and JSON serialization, stores own screen-facing loading, mutation, and derived state.

**Tech Stack:** Expo, TypeScript, expo-sqlite, Zustand, Jest.

---

### Task 1: SQL Adapter And Database Schema

**Files:**
- Create: `src/services/storage/sqliteAdapter.ts`
- Create: `src/services/storage/memorySqliteAdapter.ts`
- Create: `src/services/storage/database.ts`
- Test: `src/services/storage/database.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
const db = createMemorySqliteAdapter();
await initializeDatabase(db);
expect(db.tableNames()).toEqual(["ai_plans", "preferences", "schedules"]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/services/storage/database.test.ts`
Expected: FAIL because storage modules do not exist.

- [ ] **Step 3: Implement SQL adapter and schema creation**

Create `SqliteAdapter` with `execAsync`, `runAsync`, `getAllAsync`, and `getFirstAsync`. Create tables `schedules`, `ai_plans`, and `preferences`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/services/storage/database.test.ts`
Expected: PASS.

### Task 2: Repositories

**Files:**
- Create: `src/services/storage/scheduleRepository.ts`
- Create: `src/services/storage/aiPlanRepository.ts`
- Create: `src/services/storage/preferenceRepository.ts`
- Create: `src/services/storage/mockSeedData.ts`
- Create: `src/services/storage/index.ts`
- Test: `src/services/storage/repositories.test.ts`

- [ ] **Step 1: Write failing repository tests**

```ts
await schedules.saveSchedule(sampleSchedule);
await aiPlans.savePlan(samplePlan);
await preferences.savePreference(samplePreference);
expect(await schedules.listSchedulesForDate("2026-07-15")).toHaveLength(1);
expect(await aiPlans.getPlanByScheduleId(sampleSchedule.id)).toEqual(samplePlan);
expect(await preferences.getPreference()).toEqual(samplePreference);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/services/storage/repositories.test.ts`
Expected: FAIL because repositories do not exist.

- [ ] **Step 3: Implement repositories and seed data**

Use SQL rows for scalar schedule fields and JSON text for nested AI plan and preference data. Seed only when no schedules exist.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/services/storage/repositories.test.ts`
Expected: PASS.

### Task 3: Zustand Stores

**Files:**
- Create: `src/stores/createRepositories.ts`
- Create: `src/stores/scheduleStore.ts`
- Create: `src/stores/preferenceStore.ts`
- Create: `src/stores/index.ts`
- Test: `src/stores/scheduleStore.test.ts`
- Test: `src/stores/preferenceStore.test.ts`

- [ ] **Step 1: Write failing store tests**

```ts
const store = createScheduleStore({ schedules, aiPlans });
await store.getState().loadToday("2026-07-15");
await store.getState().toggleChecklistItem("plan-1", "item-1");
expect(store.getState().todayChecklist[0].done).toBe(true);
```

```ts
const store = createPreferenceStore({ preferences });
await store.getState().loadPreference();
await store.getState().updatePreference({ reminderStyle: "repeated" });
expect(store.getState().preference.reminderStyle).toBe("repeated");
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/stores/scheduleStore.test.ts src/stores/preferenceStore.test.ts`
Expected: FAIL because stores do not exist.

- [ ] **Step 3: Implement stores**

Schedule store loads schedules, plans, today timeline, and checklist items; it can save schedules, attach plans, and toggle checklist completion. Preference store loads defaults and persists preference edits.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/stores/scheduleStore.test.ts src/stores/preferenceStore.test.ts`
Expected: PASS.

### Task 4: Verification

**Files:**
- Modify only files exposed by verification failures.

- [ ] **Step 1: Run storage and store tests**

Run: `npm test -- src/services/storage/database.test.ts src/services/storage/repositories.test.ts src/stores/scheduleStore.test.ts src/stores/preferenceStore.test.ts`
Expected: PASS.

- [ ] **Step 2: Run full tests**

Run: `npm test -- --runInBand`
Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: no TypeScript errors.
