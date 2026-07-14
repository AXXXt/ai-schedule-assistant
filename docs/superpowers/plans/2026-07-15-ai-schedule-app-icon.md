# AI Schedule Assistant App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default Android launcher icon with the approved minimalist Time Slices mark and keep Expo and native Android resources synchronized.

**Architecture:** Store canonical icon sources under `assets/`, reference them from `app.json`, and generate native Android bitmap and adaptive-vector resources from the same geometry. A Jest configuration test verifies paths, PNG dimensions, density coverage, and adaptive XML declarations.

**Tech Stack:** Expo 57, React Native 0.86, Android adaptive icons, Jest, PowerShell System.Drawing for deterministic local raster generation.

---

### Task 1: Lock the icon contract with a failing test

**Files:**
- Modify: `test/android-runtime-config.test.ts`

- [ ] **Step 1: Add assertions for Expo icon paths, 1024px PNG dimensions, density-specific launcher PNGs, and adaptive XML files.**
- [ ] **Step 2: Run `npm test -- --runInBand test/android-runtime-config.test.ts`; expect failure because the approved assets do not exist yet.**

### Task 2: Add canonical source assets and Expo configuration

**Files:**
- Create: `assets/app-icon-source.svg`
- Create: `assets/icon.png`
- Create: `assets/adaptive-icon.png`
- Create: `assets/monochrome-icon.png`
- Modify: `app.json`

- [ ] **Step 1: Define the approved three-bar and three-node geometry in the SVG source.**
- [ ] **Step 2: Generate 1024px full, transparent foreground, and monochrome PNG assets.**
- [ ] **Step 3: Configure `expo.icon` and Android adaptive icon paths and background color.**

### Task 3: Replace native Android launcher resources

**Files:**
- Replace: `android/app/src/main/res/mipmap-*/ic_launcher.*`
- Replace: `android/app/src/main/res/mipmap-*/ic_launcher_round.*`
- Create: `android/app/src/main/res/drawable/ic_launcher_foreground.xml`
- Create: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- Create: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- Modify: `android/app/src/main/res/values/colors.xml`

- [ ] **Step 1: Generate legacy square and round PNGs for mdpi through xxxhdpi.**
- [ ] **Step 2: Add adaptive foreground vector and launcher declarations.**
- [ ] **Step 3: Run the focused Jest test; expect all icon contract assertions to pass.**

### Task 4: Verify the installable Android artifact

**Files:**
- Output: `android/app/build/outputs/apk/debug/app-debug.apk`
- Output: `AI-Schedule-Assistant-demo.apk`

- [ ] **Step 1: Run `npm run typecheck` and the complete Jest suite.**
- [ ] **Step 2: Run the Android debug APK build with the bundled JDK and SDK.**
- [ ] **Step 3: Inspect APK badging and launcher resources, then copy the verified APK to the project root.**

