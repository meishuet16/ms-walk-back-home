# Capacitor Android Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the canonical `apps/html-prototype` production build as a maintainable Capacitor 8.5.1 Android app while preserving the web/Vercel pipeline and local-first runtime.

**Architecture:** Add root Capacitor configuration with `webDir: "apps/html-prototype/dist"`, generate the tracked Android project, and keep all UI/content/game logic in the existing web app. Add a small platform module that adapts the existing Fullscreen action to Capacitor 8 `SystemBars` on Android and forwards the official Android Back event into the app's existing close/navigation behavior.

**Tech Stack:** TypeScript, Node 22-compatible npm workspaces, Capacitor 8.5.1, Android native project, Capacitor `SystemBars`, Capacitor `App`, existing esbuild/FFmpeg/pdf-lib/PDF.js runtime.

## Global Constraints

- The canonical application remains `apps/html-prototype`; no second frontend is allowed.
- Capacitor must consume local `apps/html-prototype/dist`, never the live Vercel URL.
- Permanent Android application ID is `com.meishuet16.walkbackhome`.
- Use Capacitor 8.5.1 packages only; use the bundled Capacitor 8 `SystemBars` API and official `@capacitor/app`.
- Preserve the existing Vercel build, localStorage, IndexedDB, Blob/object URL, FFmpeg, PDF.js, Supabase, file input/export, responsive orientation, and touch architecture.
- Do not add yt-dlp, downloaders, a backend, a safe-area plugin, a storage migration, a custom native plugin, or broad asset optimization.
- Never modify the pre-existing Chapter 1029 documents in the original checkout.
- Preserve the pre-existing stale `npm run authored:check` result; do not run `npm run authored:update`.
- Android source is tracked; Gradle outputs, `local.properties`, APK/AAB files, keystores, signing credentials, and machine-specific files are ignored.

---

### Task 1: Add Capacitor dependencies, configuration, and Android project

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `capacitor.config.ts`
- Create: generated tracked `android/` source project
- Modify: generated Android ignore files or root `.gitignore` only for native build outputs

**Interfaces:**
- Produces `npx cap sync android` consuming `apps/html-prototype/dist`.
- Produces native package ID `com.meishuet16.walkbackhome`.

- [ ] **Step 1: Confirm the feature worktree is clean and on the focused branch.**

Run:

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
```

Expected: no output except the branch line, `codex/capacitor-android`, and commit `b55358e`.

- [ ] **Step 2: Install the exact Capacitor 8.5.1 packages.**

Run from the repository root:

```powershell
npm install @capacitor/core@8.5.1 @capacitor/android@8.5.1 @capacitor/app@8.5.1
npm install --save-dev @capacitor/cli@8.5.1
```

Expected: root `package.json` and `package-lock.json` contain the four packages at `8.5.1`; no existing application dependency is removed.

- [ ] **Step 3: Add `capacitor.config.ts` with the local web directory and SystemBars configuration.**

Create:

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.meishuet16.walkbackhome",
  appName: "Walk Back Home",
  webDir: "apps/html-prototype/dist",
  server: { androidScheme: "https" },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "DARK",
      hidden: false,
      animation: "NONE"
    }
  }
};

export default config;
```

Verify the installed package declarations expose `SystemBars` configuration under this exact key before syncing.

- [ ] **Step 4: Add reproducible root scripts without changing the existing build script.**

Add these entries to the root `scripts` object:

```json
"android:sync": "npm run build && npx cap sync android",
"android:assets": "node scripts/verify-capacitor-assets.mjs",
"android:build": "npm run android:sync && npx cap build android"
```

Keep `build`, `test`, `typecheck`, `authored:check`, and `verify` unchanged.

- [ ] **Step 5: Generate the Android source project from the local build.**

Run:

```powershell
npm run build
npx cap add android
npx cap sync android
```

Expected: `android/` exists, its Gradle source is tracked, its application ID is `com.meishuet16.walkbackhome`, and its synced web assets come from `apps/html-prototype/dist`.

- [ ] **Step 6: Inspect native defaults and ignore generated outputs.**

Inspect `android/app/src/main/AndroidManifest.xml`, `android/app/build.gradle`, `android/variables.gradle`, and generated ignore files. Confirm no fixed `screenOrientation` was added, confirm the Activity keyboard mode is compatible with resize behavior, and add only missing ignores for `android/.gradle/`, `android/build/`, `android/app/build/`, `android/local.properties`, `*.apk`, `*.aab`, keystores, and signing files. Do not add SDK paths or credentials.

- [ ] **Step 7: Run configuration smoke checks.**

Run:

```powershell
npx cap doctor
git diff --check
```

Record toolchain failures without claiming native build success.

- [ ] **Step 8: Commit the packaging setup.**

```powershell
git add package.json package-lock.json capacitor.config.ts android .gitignore
git diff --cached --check
git commit -m "feat: add Capacitor Android packaging"
```

---

### Task 2: Add test-first Android fullscreen and Back platform bridge

**Files:**
- Create: `apps/html-prototype/src/systems/CapacitorBridge.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/main.ts`
- Create: `apps/html-prototype/tests/capacitor-bridge.test.ts`

**Interfaces:**
- `setNativeFullscreen(shell: HTMLElement, enabled: boolean, systemBars?: NativeSystemBars): Promise<void>` toggles both Android system bars and the `.native-fullscreen` class.
- `handleNativeBack(app: NativeBackApp, canGoBack: boolean, historyBack: () => void, exitApp: () => Promise<void> | void): void` forwards to the app first, then uses history or native exit.
- `initializeCapacitorBridge(app: NativeBackApp, shell: HTMLElement): void` installs Android-only Back and resume listeners.
- `WalkBackHomeApp.handleNativeBackButton(): boolean` reuses existing app state and close/navigation methods.

- [ ] **Step 1: Write failing pure bridge tests.**

Add tests covering:

```ts
test("native fullscreen hides and shows both system bars while toggling the shell class", async () => {
  const calls: string[] = [];
  const shell = document.createElement("main");
  const systemBars = { hide: async () => { calls.push("hide"); }, show: async () => { calls.push("show"); } };
  await setNativeFullscreen(shell, true, systemBars);
  assert.deepEqual(calls, ["hide"]);
  assert.equal(shell.classList.contains("native-fullscreen"), true);
  await setNativeFullscreen(shell, false, systemBars);
  assert.deepEqual(calls, ["hide", "show"]);
  assert.equal(shell.classList.contains("native-fullscreen"), false);
});

test("native Back is consumed by the app before history or activity exit", () => {
  const calls: string[] = [];
  handleNativeBack({ handleNativeBackButton: () => { calls.push("app"); return true; } }, true, () => calls.push("history"), () => calls.push("exit"));
  assert.deepEqual(calls, ["app"]);
});

test("native Back exits only when the app and history have nothing to consume", () => {
  const calls: string[] = [];
  handleNativeBack({ handleNativeBackButton: () => false }, false, () => calls.push("history"), () => calls.push("exit"));
  assert.deepEqual(calls, ["exit"]);
});
```

Use the repository's existing Node test style and a minimal DOM shim only if the test environment lacks `document`.

- [ ] **Step 2: Run the focused test and verify it fails for missing bridge exports.**

Run:

```powershell
npm run build -w apps/html-prototype
node --test apps/html-prototype/dist/tests/capacitor-bridge.test.js
```

Expected: failure because `CapacitorBridge.ts` does not yet provide the tested exports.

- [ ] **Step 3: Implement the minimal bridge.**

Use `Capacitor.getPlatform() === "android"` to gate native behavior. Import `SystemBars` from `@capacitor/core` and `App` from `@capacitor/app`. `setNativeFullscreen` must call `SystemBars.hide()` when enabled and `SystemBars.show()` when disabled, update `.native-fullscreen` only after the native call succeeds, and on failure attempt `SystemBars.show()`, remove the class, and rethrow. `handleNativeBack` must invoke `app.handleNativeBackButton()` first, then call `historyBack()` if `canGoBack`, otherwise `exitApp()`.

Install `App.addListener("backButton", ...)` and `App.addListener("appStateChange", ...)` only on Android. On resume, re-hide bars when the shell still has `.native-fullscreen`.

- [ ] **Step 4: Add the app's narrow native-back entry point.**

Add `public handleNativeBackButton(): boolean` to `WalkBackHomeApp`. It must use the existing state/methods in this order: visible Capsule close action, Journal editor back, Living Window close, full Lyrics close, Records close, Toolbox Back action, existing generic overlay close action, active non-Forest scene `returnToForest()`, then `false`. It must not create a second state stack.

Update `toggleFullscreen()` so the Android path calls `setNativeFullscreen` on the existing `.game-shell` and keeps the browser Fullscreen API path unchanged. Pass the existing shell and app into `initializeCapacitorBridge` from `main.ts`.

- [ ] **Step 5: Run focused tests and typecheck.**

```powershell
npm run build -w apps/html-prototype
node --test apps/html-prototype/dist/tests/capacitor-bridge.test.js
npm run typecheck
```

Expected: focused bridge tests pass and both workspaces typecheck.

- [ ] **Step 6: Commit the bridge.**

```powershell
git add apps/html-prototype/src/systems/CapacitorBridge.ts apps/html-prototype/src/app.ts apps/html-prototype/src/main.ts apps/html-prototype/tests/capacitor-bridge.test.ts
git diff --cached --check
git commit -m "feat: bridge Android fullscreen and Back behavior"
```

---

### Task 3: Preserve safe-area and fullscreen layout behavior

**Files:**
- Modify: `apps/html-prototype/src/index.html`
- Modify: `apps/html-prototype/src/styles.css` and only existing source CSS files containing safe-area expressions
- Modify: `apps/html-prototype/tests/ui-policy.test.ts` or create `apps/html-prototype/tests/capacitor-layout.test.ts`

**Interfaces:**
- Browser layout continues to use `env(safe-area-inset-*)` as a fallback.
- Android layout prefers Capacitor-injected `--safe-area-inset-*` values.
- `.native-fullscreen` mirrors the existing `.game-shell:fullscreen` rules without adding a second control.

- [ ] **Step 1: Add failing layout assertions.**

Test that `index.html` contains `viewport-fit=cover`, styles contain `var(--safe-area-inset-top` and `var(--safe-area-inset-bottom` fallbacks, and existing fullscreen rules include `.native-fullscreen` for shell padding, stage sizing, canvas, top controls, and touch controls.

- [ ] **Step 2: Run the layout test and verify it fails on the untouched CSS/HTML.**

```powershell
npm run build -w apps/html-prototype
node --test apps/html-prototype/dist/tests/capacitor-layout.test.js
```

Expected: failure because the viewport metadata, injected-variable fallbacks, or native fullscreen selectors are absent.

- [ ] **Step 3: Make the smallest layout changes.**

Change the viewport to:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Mirror only the existing `.game-shell:fullscreen` layout selectors with `.game-shell.native-fullscreen`. Replace existing safe-area expressions with `var(--safe-area-inset-*, env(safe-area-inset-*, 0px))` while retaining the same values and spacing. Do not change chapter/UI/content/assets.

- [ ] **Step 4: Run focused layout tests and web typecheck.**

```powershell
npm run build -w apps/html-prototype
node --test apps/html-prototype/dist/tests/capacitor-layout.test.js
npm run typecheck
```

Expected: all focused layout tests pass.

- [ ] **Step 5: Commit the safe-area/layout compatibility changes.**

```powershell
git add apps/html-prototype/src/index.html apps/html-prototype/src/styles.css apps/html-prototype/src/*.css apps/html-prototype/tests/ui-policy.test.ts apps/html-prototype/tests/capacitor-layout.test.ts
git diff --cached --check
git commit -m "fix: preserve safe areas in Capacitor fullscreen"
```

Only include CSS files that actually changed; do not stage unrelated files.

---

### Task 4: Add physical synced-asset verification

**Files:**
- Create: `scripts/verify-capacitor-assets.mjs`
- Create: `apps/html-prototype/tests/capacitor-assets.test.ts`
- Modify: `package.json` if the script entry was not added in Task 1

**Interfaces:**
- `scripts/verify-capacitor-assets.mjs` discovers the Android synced asset root containing both `index.html` and `browser/main.js` beneath `android/`, then verifies required relative files.
- The verifier exits non-zero and names every missing file; it never fetches remote URLs.

- [ ] **Step 1: Write failing verifier tests.**

Test the exported pure helpers with a temporary directory: one fixture with all required paths returns no missing assets, and one fixture missing `browser/ffmpeg/ffmpeg-core.wasm` reports that exact relative path. Required paths are:

```text
index.html
browser/main.js
assets/forest.png
assets/muji-room.png
assets/1029/1029-landscape.png
assets/1029/memory-portrait/main-arrival.png
scene-layouts/1029/landscape.json
assets/audio/forest.mp3
lrc/manifest.json
browser/ffmpeg/ffmpeg-core.js
browser/ffmpeg/ffmpeg-core.wasm
browser/worker.js
browser/pdf.worker.mjs
```

- [ ] **Step 2: Run the focused verifier test and verify it fails because the module is missing.**

```powershell
npm run build -w apps/html-prototype
node --test apps/html-prototype/dist/tests/capacitor-assets.test.js
```

Expected: failure due missing verifier exports.

- [ ] **Step 3: Implement discovery and verification helpers.**

Walk only existing directories under `android/` to find the first directory whose immediate contents include `index.html` and `browser/main.js`. Verify each required path with `fs.access`. Print the discovered absolute root and each present path with byte size. Exit with code 1 for missing files or no discovered root.

- [ ] **Step 4: Run the verifier after a fresh build and sync.**

```powershell
npm run android:sync
npm run android:assets
```

Expected: the command prints the actual synced web asset directory and confirms every representative local asset is physically present. If sync fails, report the exact toolchain error and do not infer packaging success.

- [ ] **Step 5: Commit the verifier.**

```powershell
git add scripts/verify-capacitor-assets.mjs apps/html-prototype/tests/capacitor-assets.test.ts package.json
git diff --cached --check
git commit -m "test: verify Capacitor bundles local web assets"
```

---

### Task 5: Full web regression, native build attempt, and final audit

**Files:**
- Modify only files shown by the final diff audit; no authored chapter/content/assets changes are permitted.

- [ ] **Step 1: Run all web validation commands.**

```powershell
npm run authored:check
npm run typecheck
npm test
npm run build
npm run verify
```

Record `authored:check` as the known pre-existing stale failure if it remains; do not run `npm run authored:update`. Require the other commands to pass, or diagnose and fix only milestone-caused failures.

- [ ] **Step 2: Rebuild and inspect local `dist`.**

Confirm `apps/html-prototype/dist/index.html` and the representative Forest, Muji Room, 1029 background/portrait, scene JSON, BGM, lyrics, FFmpeg, worker, and PDF worker files are present. Confirm `apps/html-prototype/vercel.json` is unchanged and still points to `dist`.

- [ ] **Step 3: Attempt native Gradle verification with the actual available toolchain.**

Run:

```powershell
npm run android:sync
npm run android:assets
cd android
./gradlew assembleDebug
cd ..
```

On PowerShell use `.\gradlew.bat assembleDebug`. Before claiming success, inspect the command exit code and full output. If Android SDK, JDK, Gradle, or network dependencies are unavailable, report the exact reason and provide the same commands for local completion.

- [ ] **Step 4: If a debug APK is produced, inspect its archive contents.**

Use `jar tf android/app/build/outputs/apk/debug/app-debug.apk` or an equivalent read-only archive listing and confirm representative local assets are inside the APK. Do not add the APK to Git.

- [ ] **Step 5: Inspect status and complete diff audit.**

```powershell
git status --short
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- package.json package-lock.json capacitor.config.ts apps/html-prototype/src apps/html-prototype/tests scripts/verify-capacitor-assets.mjs .gitignore
git diff --check origin/main...HEAD
git ls-files android | Select-String -Pattern 'build|local.properties|\.apk$|\.aab$|keystore|\.jks$|\.p12$'
```

Confirm no generated junk, secrets, SDK paths, signing files, APK/AAB outputs, or unrelated authored/UI/content/assets changes are tracked. Confirm the two pre-existing Chapter 1029 files in the original checkout were never touched.

- [ ] **Step 6: Commit any final focused verification/documentation changes.**

Only commit changes that are necessary to satisfy this plan. Use `git diff --cached --check` before each commit.

- [ ] **Step 7: Push the focused branch normally after verification.**

```powershell
git push -u origin codex/capacitor-android
```

Do not merge into `main` and do not force push. Report the pushed branch and whether a PR was created.
