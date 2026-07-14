# Complete Tab Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Calendar, Create, and Profile route placeholders with polished, interactive React Native screens backed by deterministic mock data and local component state.

**Architecture:** Keep `app/(tabs)` as thin route adapters and place each screen, its mock data, and its tests under a focused `src/features` directory. Reuse the current theme and common components; keep temporary interaction state local so SQLite and Zustand can be introduced later without pretending persistence already exists.

**Tech Stack:** Expo SDK 57, React Native 0.86, Expo Router, TypeScript, date-fns, `@expo/vector-icons`, Jest, React Native Testing Library.

---

### Task 1: Calendar month view and selected-day agenda

**Files:**
- Create: `src/features/calendar/sampleCalendarData.ts`
- Create: `src/features/calendar/CalendarScreen.tsx`
- Create: `src/features/calendar/CalendarScreen.test.tsx`
- Modify: `app/(tabs)/calendar.tsx`

- [ ] **Step 1: Write the failing Calendar test**

Render `CalendarScreen`, assert that `July 2026`, `Dinner with Xiaoyu`, and the selected date label are visible, press date `18`, and assert that `Morning run` replaces the selected agenda.

- [ ] **Step 2: Run the Calendar test and verify RED**

Run: `npm.cmd test -- --runInBand src/features/calendar/CalendarScreen.test.tsx`

Expected: FAIL because `CalendarScreen` does not exist.

- [ ] **Step 3: Implement mock data and interactive month grid**

Create fixed July 2026 schedules using the existing `Schedule` type. Build a seven-column grid with weekday headers, selected/today states, status dots, previous/next month icon buttons, a Today command, and an agenda card for the selected date. Use `Pressable` with accessibility labels such as `Select July 18` and keep each date target at least 48dp.

- [ ] **Step 4: Mount CalendarScreen in the route**

```tsx
import { CalendarScreen } from "@/features/calendar/CalendarScreen";

export default function CalendarRoute() {
  return <CalendarScreen />;
}
```

- [ ] **Step 5: Run Calendar tests and typecheck**

Run: `npm.cmd test -- --runInBand src/features/calendar/CalendarScreen.test.tsx`

Expected: PASS.

### Task 2: AI and manual schedule creation modes

**Files:**
- Create: `src/features/create-schedule/CreateScheduleScreen.tsx`
- Create: `src/features/create-schedule/CreateScheduleScreen.test.tsx`
- Modify: `app/(tabs)/create.tsx`

- [ ] **Step 1: Write the failing Create test**

Assert that AI mode accepts natural-language input, `Analyze schedule` reveals a structured draft containing `Dinner with Xiaoyu`, and switching to Manual reveals labeled title, date/time, location, category, and note fields. Assert Save stays disabled until a title exists and then shows a local confirmation banner.

- [ ] **Step 2: Run the Create test and verify RED**

Run: `npm.cmd test -- --runInBand src/features/create-schedule/CreateScheduleScreen.test.tsx`

Expected: FAIL because the screen does not exist.

- [ ] **Step 3: Implement AI draft interaction**

Use `SegmentedTabs` for `AI assist` and `Manual`. AI mode contains a multiline `TextInput`, example prompt chips, an Analyze command, and a structured draft card. Analysis is deterministic local state and never claims a real network request. A Confirm command shows a success banner.

- [ ] **Step 4: Implement manual form interaction**

Provide visible labels and accessible inputs for title, date/time, location, and notes. Add five schedule category chips using the `ScheduleCategory` values. Keep Save disabled without a title and show `Schedule ready for your plan` after a valid local save.

- [ ] **Step 5: Mount CreateScheduleScreen and verify**

```tsx
import { CreateScheduleScreen } from "@/features/create-schedule/CreateScheduleScreen";

export default function CreateRoute() {
  return <CreateScheduleScreen />;
}
```

Run: `npm.cmd test -- --runInBand src/features/create-schedule/CreateScheduleScreen.test.tsx`

Expected: PASS.

### Task 3: Profile and AI preference controls

**Files:**
- Create: `src/features/profile/ProfileScreen.tsx`
- Create: `src/features/profile/ProfileScreen.test.tsx`
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Write the failing Profile test**

Assert the screen shows the active MBTI value, advice style, reminder style, plan detail, lifestyle preferences, and notification/weather switches. Press `ENFP`, select `Multiple reminders`, toggle weather reminders, and assert selected/accessibility state changes.

- [ ] **Step 2: Run the Profile test and verify RED**

Run: `npm.cmd test -- --runInBand src/features/profile/ProfileScreen.test.tsx`

Expected: FAIL because the screen does not exist.

- [ ] **Step 3: Implement preference sections**

Use a quiet profile summary band, section headers, compact selectable chips for MBTI and lifestyle values, `SegmentedTabs` for advice/reminder/detail choices, and native `Switch` controls for notifications and weather. Keep all values in local state and label the page `Preferences saved on this device` without claiming persistence.

- [ ] **Step 4: Mount ProfileScreen and verify**

```tsx
import { ProfileScreen } from "@/features/profile/ProfileScreen";

export default function ProfileRoute() {
  return <ProfileScreen />;
}
```

Run: `npm.cmd test -- --runInBand src/features/profile/ProfileScreen.test.tsx`

Expected: PASS.

### Task 4: Cross-page verification and responsive QA

**Files:**
- Modify only files found defective during verification.

- [ ] **Step 1: Run the full automated suite**

Run: `npm.cmd test -- --runInBand`

Expected: all suites pass.

- [ ] **Step 2: Run TypeScript verification**

Run: `npm.cmd run typecheck`

Expected: exit code 0.

- [ ] **Step 3: Verify routes in the browser**

Open Calendar, Create, and Profile through the bottom tabs. Check small-phone and desktop-width browser viewports for overflow, hidden controls, unstable tab height, and inaccessible touch targets.

- [ ] **Step 4: Verify the Android development build**

Keep `npx.cmd expo start --dev-client` running, load the project in the installed development build, and confirm all three tabs render and interact without `FATAL EXCEPTION` or React Native redbox output.
