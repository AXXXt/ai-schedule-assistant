# One-Hour Portfolio Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a credential-free, test-verified, documented Android portfolio release that presents both product and engineering evidence.

**Architecture:** Keep the existing Expo React Native application and feature scope unchanged. Make the public build deterministic by selecting the existing mock AI client when no local environment configuration exists, remove tracked credentials, restore Jest compatibility, then add a compact evidence layer around the working app.

**Tech Stack:** Expo 57, React Native 0.86, TypeScript, Expo Router, Zustand, SQLite adapter/repositories, Jest, Gradle Android release.

---

## File Map

- Modify `src/services/ai/aiConfig.ts`: read optional local AI settings with empty credential default.
- Modify `src/services/ai/getAIClient.ts`: retain mock fallback when AI settings are absent.
- Modify `src/services/map/mapConfig.ts`: read optional local map key with empty default.
- Modify `src/stores/createRepositories.ts`: use the shared AI client factory and remove duplicate credentials.
- Modify `test/android-runtime-config.test.ts`: enforce the public credential boundary.
- Create `.env.example`: document local-only configuration names without secrets.
- Modify `.gitignore`: exclude local configuration, APKs, logs, caches, and repair scratch files.
- Modify `jest.config.js`: transform Expo Router's `standard-navigation` dependency.
- Modify `src/features/profile/ProfileScreen.test.tsx`: query the Chinese accessibility name rendered by the screen.
- Modify `src/features/create-schedule/CreateScheduleScreen.test.tsx`: query the current Chinese UI contract.
- Create `README.md`: portfolio landing page.
- Create `docs/product/product-case.md`: product and user-research evidence.
- Create `docs/engineering/architecture.md`: engineering decisions and security boundary.
- Create `docs/release/v0.1.0.md`: release notes and installation guidance.
- Create `assets/screenshots/*.png`: four portfolio screenshots.
- Create `release/AI-Schedule-Assistant-v0.1.0.apk`: rebuilt public evaluation APK.
- Create `release/SHA256SUMS.txt`: release checksum.

### Task 1: Remove Public Credentials And Default To Offline Demo

- [ ] **Step 1: Add a failing public-security test**

Add this case to `test/android-runtime-config.test.ts`:

```ts
it("does not embed service credentials in public source", () => {
  const sourceFiles = [
    "src/services/ai/aiConfig.ts",
    "src/services/map/mapConfig.ts",
    "src/stores/createRepositories.ts",
  ];
  const source = sourceFiles
    .map((file) => fs.readFileSync(path.join(projectRoot, file), "utf8"))
    .join("\n");

  expect(source).not.toMatch(/sk-[a-z0-9]{20,}/i);
  expect(source).not.toContain("127f45ccc734077b9a42f6d4f0eac5d0");
});
```

- [ ] **Step 2: Run the test and confirm the security failure**

Run: `npm.cmd test -- --runInBand test/android-runtime-config.test.ts`

Expected: FAIL because the current source contains hard-coded service credentials.

- [ ] **Step 3: Replace tracked credentials with local optional configuration**

Use empty defaults in `aiConfig.ts` and `mapConfig.ts`:

```ts
export const AI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ?? "",
  baseURL: process.env.EXPO_PUBLIC_AI_BASE_URL ?? "https://api.deepseek.com/v1",
  model: process.env.EXPO_PUBLIC_AI_MODEL ?? "deepseek-chat",
};
```

```ts
export const MAP_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_AMAP_API_KEY ?? "",
  baseURL: "https://restapi.amap.com/v3",
};
```

In `createRepositories.ts`, replace direct `createOpenAIClient` construction with `const aiClient = getAIClient();`. Create `.env.example` with empty values and a warning that Expo public variables are suitable only for local evaluation, not production secret storage.

- [ ] **Step 4: Run the targeted security test**

Run: `npm.cmd test -- --runInBand test/android-runtime-config.test.ts`

Expected: PASS.

- [ ] **Step 5: Audit the workspace for credential patterns**

Run: `rg -n "sk-[A-Za-z0-9_-]{20,}|127f45ccc734077b9a42f6d4f0eac5d0" src app test .env.example`

Expected: no matches.

- [ ] **Step 6: Commit the security boundary**

```powershell
git add .env.example .gitignore src/services/ai/aiConfig.ts src/services/map/mapConfig.ts src/stores/createRepositories.ts test/android-runtime-config.test.ts
git commit -m "security: remove mobile service credentials"
```

### Task 2: Restore The Complete Quality Gate

- [ ] **Step 1: Reproduce the current failures**

Run: `npm.cmd test -- --runInBand`

Expected: FAIL in Expo Router transformation and stale English UI queries.

- [ ] **Step 2: Apply the minimal Jest and UI-contract fixes**

Add `standard-navigation` to the allowlist inside `jest.config.js`:

```js
"node_modules/(?!((jest-)?react-native|@react-native(-community)?)|standard-navigation|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)"
```

Change the profile query to `name: "多次提醒"`. Change the create screen test to press the `手动` button, query the input whose placeholder text is `日程标题`, and verify the `保存日程` button.

- [ ] **Step 3: Run the complete test suite**

Run: `npm.cmd test -- --runInBand`

Expected: all 13 test suites and all tests PASS.

- [ ] **Step 4: Run static type checking**

Run: `npm.cmd run typecheck`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 5: Commit the quality fixes**

```powershell
git add jest.config.js src/features/profile/ProfileScreen.test.tsx src/features/create-schedule/CreateScheduleScreen.test.tsx
git commit -m "test: restore Expo screen quality gate"
```

### Task 3: Create Product And Engineering Evidence

- [ ] **Step 1: Write the repository landing page**

Create `README.md` with a product-first opening, screenshot grid, real-device video recording instructions, APK section, core workflow, product decisions, architecture summary, test commands, demo-mode disclosure, and setup instructions. State measured facts only; do not claim completed user interviews, iOS publication, or production-scale deployment.

- [ ] **Step 2: Write the product case**

Create `docs/product/product-case.md` with the target user, problem statement, current assumptions, end-to-end scenario, prioritization rationale, proposed success metrics, lightweight interview script, validation plan, and explicit non-goals.

- [ ] **Step 3: Write the engineering note**

Create `docs/engineering/architecture.md` with the page/store/repository flow, AI client boundary, persistence choices, map and notification integration, test strategy, public demo behavior, production proxy requirement, and known limitations.

- [ ] **Step 4: Write release notes**

Create `docs/release/v0.1.0.md` with highlights, installation steps, public demo behavior, tested commands, known limitations, and checksum instructions.

- [ ] **Step 5: Check documentation for unsupported claims and secrets**

Run: `rg -n "1\.8 亿|亿级|已上线|App Store|已访谈|sk-[A-Za-z0-9_-]{20,}" README.md docs/product docs/engineering docs/release`

Expected: no unsupported scale, publication, interview, or credential claims.

- [ ] **Step 6: Commit the evidence layer**

```powershell
git add README.md docs/product docs/engineering docs/release
git commit -m "docs: add product and engineering case study"
```

### Task 4: Capture Four Mobile Screenshots

- [ ] **Step 1: Start the Expo web preview**

Run: `npm.cmd run web -- --port 8082`

Expected: Expo serves the app at `http://127.0.0.1:8082`.

- [ ] **Step 2: Capture the four evidence states**

At a 390 x 844 viewport, capture Today, AI Create, Schedule Detail, and Calendar/Profile persistence states. Save them as:

```text
assets/screenshots/01-today.png
assets/screenshots/02-ai-create.png
assets/screenshots/03-action-plan.png
assets/screenshots/04-calendar.png
```

- [ ] **Step 3: Verify image dimensions and README references**

Run a file inspection confirming every PNG exists, is non-empty, and is referenced from `README.md`.

- [ ] **Step 4: Commit screenshots**

```powershell
git add assets/screenshots README.md
git commit -m "docs: add mobile product walkthrough"
```

### Task 5: Build And Verify The Public Android Artifact

- [ ] **Step 1: Build without public service credentials**

Run from `android/` with the repository-local JDK and Android SDK:

```powershell
$env:JAVA_HOME = (Resolve-Path "..\.jdk\jdk-17.0.19+10")
$env:ANDROID_HOME = (Resolve-Path "..\.android-sdk")
.\gradlew.bat assembleRelease --no-daemon
```

Expected: `BUILD SUCCESSFUL` and `android/app/build/outputs/apk/release/app-release.apk` exists.

- [ ] **Step 2: Copy the artifact into the ignored release directory**

Create `release/` and copy the APK to `release/AI-Schedule-Assistant-v0.1.0.apk`. Keep `release/*.apk` ignored so it is attached to the hosted Release rather than normal source history.

- [ ] **Step 3: Verify package metadata**

Run:

```powershell
.\.android-sdk\build-tools\35.0.0\aapt.exe dump badging release\AI-Schedule-Assistant-v0.1.0.apk
```

Expected: package `com.codex.aischeduleassistant`, version `0.1.0`, minimum SDK 24, target SDK 36.

- [ ] **Step 4: Generate the release checksum**

Run `Get-FileHash release\AI-Schedule-Assistant-v0.1.0.apk -Algorithm SHA256` and store the hash plus filename in `release/SHA256SUMS.txt`.

- [ ] **Step 5: Run final credential, test, and type checks**

Run the credential audit, `npm.cmd test -- --runInBand`, and `npm.cmd run typecheck` again after the build.

- [ ] **Step 6: Prepare the HR handoff**

Provide the exact README links the user updates after publishing, Release upload steps, the 60-90 second phone recording shot list, and a concise HR message ending with `备注：1125`.
