# AI Schedule Assistant Skeleton And Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Expo React Native TypeScript project skeleton and reusable Apple-clean design system foundation for the AI schedule assistant.

**Architecture:** Expo Router owns navigation in `app/`, while reusable UI primitives, theme tokens, and domain types live in `src/`. This first slice creates a runnable app shell with four tabs, one schedule detail route, typed theme tokens, and test-covered utility/style helpers.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, Jest, React Native Testing Library, lucide-react-native, expo-linear-gradient.

---

### Task 1: Project Skeleton

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `jest.config.js`
- Create: `.gitignore`
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/today.tsx`
- Create: `app/(tabs)/calendar.tsx`
- Create: `app/(tabs)/create.tsx`
- Create: `app/(tabs)/profile.tsx`
- Create: `app/schedule/[id].tsx`

- [ ] **Step 1: Create Expo configuration and scripts**

Create `package.json` with Expo scripts, TypeScript, testing, routing, icons, gradients, and safe-area dependencies.

- [ ] **Step 2: Create root Expo config**

Create `app.json` with app name `AI Schedule Assistant`, package slug `ai-schedule-assistant`, typed routes enabled, and light UI style.

- [ ] **Step 3: Create TypeScript, Babel, Jest, and ignore files**

Create `tsconfig.json`, `babel.config.js`, `jest.config.js`, and `.gitignore` so the project can typecheck and test from the first slice.

- [ ] **Step 4: Create Expo Router layouts and placeholder routes**

Create tab routes for Today, Calendar, Create, Profile, plus `schedule/[id]`. Use simple route entry components at first; detailed UI moves into feature files after tokens exist.

- [ ] **Step 5: Run install if dependencies are missing**

Run: `npm install`
Expected: dependencies install and `node_modules` appears. If the sandbox blocks network access, rerun with escalation approval.

### Task 2: Theme Tokens

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/spacing.ts`
- Create: `src/theme/radius.ts`
- Create: `src/theme/typography.ts`
- Create: `src/theme/shadows.ts`
- Create: `src/theme/index.ts`
- Create: `src/theme/theme.test.ts`

- [ ] **Step 1: Write failing token tests**

Create tests that assert semantic colors exist, spacing follows a 4/8 rhythm, card radius is restrained, and type styles have no negative letter spacing.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/theme/theme.test.ts`
Expected: FAIL because `src/theme` modules do not exist yet.

- [ ] **Step 3: Implement theme tokens**

Create semantic tokens for light Apple-clean UI: warm white background, white surfaces, cyan primary, green success, amber warning, red danger, slate text, soft borders, 4/8 spacing, restrained radii, subtle shadows, and readable typography.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/theme/theme.test.ts`
Expected: PASS.

### Task 3: Core UI Components

**Files:**
- Create: `src/components/common/Screen.tsx`
- Create: `src/components/common/Card.tsx`
- Create: `src/components/common/SectionHeader.tsx`
- Create: `src/components/common/PrimaryButton.tsx`
- Create: `src/components/common/ListRow.tsx`
- Create: `src/components/common/SegmentedTabs.tsx`
- Create: `src/components/common/index.ts`
- Create: `src/components/common/common-components.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create tests for `PrimaryButton` disabled behavior, `SegmentedTabs` selection callback, `SectionHeader` subtitle rendering, and `ListRow` accessibility labels.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/common/common-components.test.tsx`
Expected: FAIL because common components do not exist yet.

- [ ] **Step 3: Implement components with theme tokens**

Implement reusable primitives with React Native accessibility roles, stable 44px+ touch targets, and token-based styling.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/common/common-components.test.tsx`
Expected: PASS.

### Task 4: Domain Types And Home Shell

**Files:**
- Create: `src/types/schedule.ts`
- Create: `src/types/ai.ts`
- Create: `src/types/preference.ts`
- Create: `src/features/today/sampleTodayData.ts`
- Create: `src/features/today/TodayScreen.tsx`
- Modify: `app/(tabs)/today.tsx`

- [ ] **Step 1: Write failing Today screen smoke test**

Create a test that renders the Today screen and expects the AI summary heading, a checklist item, and a timeline item.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/today/TodayScreen.test.tsx`
Expected: FAIL because the Today feature module does not exist yet.

- [ ] **Step 3: Implement domain types and Today feature shell**

Create TypeScript types from the product spec and a static Today screen using the design system. Keep data local and mock-only in this step.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/today/TodayScreen.test.tsx`
Expected: PASS.

### Task 5: Verification

**Files:**
- Modify only if verification exposes a concrete issue in files from Tasks 1-4.

- [ ] **Step 1: Run full test suite**

Run: `npm test -- --runInBand`
Expected: all tests pass.

- [ ] **Step 2: Run TypeScript check**

Run: `npm run typecheck`
Expected: no TypeScript errors.

- [ ] **Step 3: Run Expo config check**

Run: `npx expo config --type public`
Expected: Expo resolves the app config without errors.

- [ ] **Step 4: Summarize next slice**

Report the skeleton/design-system status and name the next implementation slice: SQLite data layer and Zustand stores.

