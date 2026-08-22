# Muji Toolbox + Living Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete Muji Toolbox + Living Window feature inside the existing Muji Room RPG, in two verified implementation checkpoints, then commit the full scoped feature locally without pushing.

**Architecture:** Keep product logic in focused TypeScript systems and use `app.ts` only as the scene/input/persistence orchestrator. Toolbox utilities are pure and locally testable; provider/cache code is isolated behind validated adapters. Living Window weather visuals are rendered into the existing Muji Room canvas pipeline with the exact scene source-to-canvas transform and source-sized mask, while the weather information panel remains a stage-contained HTML overlay.

**Tech Stack:** TypeScript, Node built-in test runner, existing static HTML prototype, existing CSS/canvas renderer, browser `fetch`, `localStorage`, Open-Meteo Forecast/Geocoding, Frankfurter v2, supplied PNG assets.

## Global Constraints

- The current local worktree is the source of truth; do not reset, checkout, clean, revert, overwrite, or push.
- Preserve unrelated untracked `apps/html-prototype/public/assets/523/` exactly.
- Never commit `.private-spec/`, real diaries, real memory data, raw uploads, generated Memory Graphs, embeddings, scene caches, secrets, or logs containing personal content.
- The MVP remains local-first with deterministic free fallbacks and no paid dependencies, backend, Supabase, or proxy.
- Replace only the Muji Room table interaction identity `residue` with `toolbox`; preserve generic `residueIds` narrative state elsewhere.
- Preserve Landscape Toolbox coordinates `(562, 316, 62)` and Portrait Toolbox coordinates `(495.43814041564195, 890.6566972474059, 56)`.
- Toolbox slot activation selects only; Enter/E or the visible Enter button confirms.
- Open-Meteo current precipitation/condition and precipitation probability remain distinct; never derive a percentage from precipitation amount.
- Weather visuals and both source-sized masks use the exact Muji Room renderer transform in each orientation; do not independently position them against the DOM viewport.
- Reference PNGs `weather-atlas-reference.png` and `weather-sprites-reference.png` must never be referenced by runtime code.
- Do not claim browser visual correctness without performing the browser check.

## File map

Pass 1 creates focused modules under `apps/html-prototype/src/systems/`:

- `ToolboxModel.ts`: tool ids, root/subview state, selection navigation, confirm/back/close transitions.
- `SpinWheel.ts`: choice and preset model plus injectable RNG.
- `Calculator.ts`: safe everyday arithmetic model.
- `UnitConverter.ts`: conversion tables and calculations.
- `CurrencyRates.ts`: Frankfurter adapter, validation, cache semantics, and conversion.
- `TimerTool.ts`: timestamp-based timer/stopwatch state.
- `DateTool.ts`: local date-only operations.
- `ToolboxView.ts`: Toolbox and utility HTML renderer.

Pass 2 creates:

- `WeatherProvider.ts`: Open-Meteo forecast/geocoding request and response normalization.
- `WeatherCache.ts`: weather location/cache state and stale fallback helpers.
- `MoonPhase.ts`: deterministic eight-phase calculation and sprite frame mapping.
- `WeatherVisuals.ts`: WMO condition and visual-state mapping plus canvas weather-layer rendering helpers.
- `LivingWindowView.ts`: stage-contained weather panel renderer.

Existing files modified:

- `src/systems/MujiRoom.ts`: `RoomInteractionId`, label, and table interaction identity.
- `src/types.ts`: durable state types only where needed for typed persistence payloads.
- `src/systems/SaveManager.ts`: owner-scoped Toolbox and Living Window persistence namespaces.
- `src/systems/SceneLayouts.ts`: shared Muji Room transform helper only if extraction is required; preserve all authored coordinates.
- `src/app.ts`: orchestration, event dispatch, keyboard routing, overlay lifecycle, utility rendering, weather fetch actions, and canvas weather integration.
- `src/styles.css`: Toolbox/Living Window stage-contained RPG panel and responsive rules.
- `public/scene-layouts/muji-room/portrait.json`: replace only interaction id/label `residue` → `toolbox`.
- `public/assets/muji-room/weather/`: move five runtime PNGs one level up without re-exporting them.

Tests extend existing files where the architecture fits and add focused test files for new pure modules.

---

## Pass 1 — Muji Toolbox + utilities

### Task 1: Lock the interaction migration and persistence contracts

**Files:**
- Modify: `apps/html-prototype/src/systems/MujiRoom.ts`
- Modify: `apps/html-prototype/public/scene-layouts/muji-room/portrait.json`
- Modify: `apps/html-prototype/tests/muji-room.test.ts`
- Modify: `apps/html-prototype/tests/scene-layouts.test.ts`
- Modify: `apps/html-prototype/tests/mobile-regressions.test.ts`
- Modify: `apps/html-prototype/src/systems/SaveManager.ts`
- Modify: `apps/html-prototype/src/types.ts`
- Test: existing files above

**Interfaces:**
- Produce `RoomInteractionId` containing `toolbox` and not `residue` for Muji Room-specific interactions.
- Preserve `RoomJourneyState.residueIds` because it is generic narrative residue state.
- Produce `SaveManager.saveToolboxState`, `loadToolboxState`, `saveLivingWindowState`, and `loadLivingWindowState`, each version-validating JSON under owner-scoped keys.

- [ ] **Step 1: Write failing assertions**

Add assertions that `roomInteractions` contains `toolbox`, not `residue`, with `(562,316,62)`; the portrait layout contains `toolbox`, not `residue`, with its existing coordinates/radius; and `SaveManager` can round-trip versioned typed payloads.

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run from `apps/html-prototype`:

```powershell
npm test -- --test-name-pattern="toolbox|scene layouts|portrait"
```

Expected: failures identify the old `residue` identity and missing persistence methods.

- [ ] **Step 3: Implement the minimum contract changes**

Change only the Muji Room interaction union/definition and the authored portrait id/label. Add typed versioned SaveManager methods using the existing `ownerKey` and `parseVersioned` pattern; do not alter existing journey migration behavior.

- [ ] **Step 4: Run the focused tests again**

Expected: the interaction and persistence contract assertions pass; unrelated existing failures remain visible rather than being hidden.

- [ ] **Step 5: Commit the checkpoint contract**

```powershell
git add apps/html-prototype/src/systems/MujiRoom.ts apps/html-prototype/public/scene-layouts/muji-room/portrait.json apps/html-prototype/tests/muji-room.test.ts apps/html-prototype/tests/scene-layouts.test.ts apps/html-prototype/tests/mobile-regressions.test.ts apps/html-prototype/src/systems/SaveManager.ts apps/html-prototype/src/types.ts
git commit -m "feat: migrate Muji Room table interaction to toolbox"
```

### Task 2: Add the Toolbox navigation model

**Files:**
- Create: `apps/html-prototype/src/systems/ToolboxModel.ts`
- Create: `apps/html-prototype/tests/toolbox-model.test.ts`

**Interfaces:**

```ts
export type ToolboxToolId = "spin-wheel" | "calculator" | "converter" | "currency" | "timer" | "date";
export type ToolboxView = { screen: "root"; selected: ToolboxToolId } | { screen: "tool"; selected: ToolboxToolId };
export type ToolboxPersistedState = { version: 1; selected: ToolboxToolId; selectedPresetId: string; converterUnits: Record<string, string>; currencyFrom: string; currencyTo: string };
export function createToolboxState(saved?: Partial<ToolboxPersistedState>): ToolboxView;
export function moveToolSelection(state: ToolboxView & { screen: "root" }, direction: "up" | "down" | "left" | "right", columns: 2 | 3): ToolboxView;
export function selectTool(state: ToolboxView, tool: ToolboxToolId): ToolboxView;
export function confirmTool(state: ToolboxView): ToolboxView;
export function backTool(state: ToolboxView): ToolboxView | null;
export function isToolboxSelection(value: unknown): value is ToolboxToolId;
```

- [ ] **Step 1: Write failing tests**

Cover default Spin Wheel, safe remembered selection, 2×3 and 3×2 arrow navigation, select-without-enter, confirm, Escape-to-root, and Escape-from-root-close (`null`).

- [ ] **Step 2: Run `node --test` against the compiled focused file and verify red**

```powershell
npm run build; node --test dist/tests/toolbox-model.test.js
```

Expected: module/function-not-found failures.

- [ ] **Step 3: Implement pure transitions**

Use ordered tool ids and row/column math. Ignore invalid saved ids and default to `spin-wheel`. `selectTool` must never change `screen` from root; `confirmTool` is the only root-to-tool transition.

- [ ] **Step 4: Run focused tests and refactor only after green**

Expected: all model assertions pass with no browser globals.

### Task 3: Add the six deterministic utility systems

**Files:**
- Create: `apps/html-prototype/src/systems/SpinWheel.ts`
- Create: `apps/html-prototype/src/systems/Calculator.ts`
- Create: `apps/html-prototype/src/systems/UnitConverter.ts`
- Create: `apps/html-prototype/src/systems/TimerTool.ts`
- Create: `apps/html-prototype/src/systems/DateTool.ts`
- Create: `apps/html-prototype/tests/toolbox-utilities.test.ts`

**Interfaces:**

```ts
export type SpinPreset = { id: string; name: string; choices: string[] };
export function spinChoice(choices: string[], rng?: () => number): string | null;
export function addSpinChoice(choices: string[], value: string): string[];
export function removeSpinChoice(choices: string[], index: number): string[];
export function evaluateCalculator(input: string): { display: string; value: number | null; error?: string };
export function convertUnit(category: string, amount: number, from: string, to: string): number | null;
export function createTimerState(): TimerState;
export function startTimer(state: TimerState, now: number): TimerState;
export function pauseTimer(state: TimerState, now: number): TimerState;
export function resetTimer(state: TimerState): TimerState;
export function timerRemaining(state: TimerState, now: number): number;
export function parseLocalDate(value: string): { year: number; month: number; day: number } | null;
export function dateDifference(start: string, end: string): number | null;
export function addDateDays(value: string, days: number): string | null;
```

- [ ] **Step 1: Write failing tests for edge cases and representative behavior**

Cover spin CRUD/presets/RNG/zero/one/duplicates/long labels; calculator operations/decimal/percentage/clear/backspace/division safety; all requested unit categories including C/F; timer timestamp progression/pause/resume/reset; and local date-only difference/add/subtract without UTC drift.

- [ ] **Step 2: Run focused tests and verify expected red**

```powershell
npm run build; node --test dist/tests/toolbox-utilities.test.js
```

Expected: missing module/function failures.

- [ ] **Step 3: Implement minimal pure logic**

Use browser crypto only in the default RNG wrapper; allow tests to inject a deterministic function. Use a shunting-yard-free calculator grammar for simple binary operations and percentage handling; never call `eval`. Normalize unit values through base units. Keep timer math timestamp-based. Construct date values with `new Date(year, month - 1, day)` and format from local getters.

- [ ] **Step 4: Run focused tests and verify green**

Expected: all utility tests pass, with no network or DOM dependencies.

### Task 4: Add currency provider and cache semantics

**Files:**
- Create: `apps/html-prototype/src/systems/CurrencyRates.ts`
- Create: `apps/html-prototype/tests/currency-rates.test.ts`
- Modify: `apps/html-prototype/src/systems/SaveManager.ts` if currency cache is nested in Living Window state

**Interfaces:**

```ts
export type CurrencyCode = "MYR" | "SGD" | "USD" | "JPY" | "CNY" | "EUR" | "GBP";
export type CurrencyRatePayload = { base: CurrencyCode; rates: Partial<Record<CurrencyCode, number>>; date: string; fetchedAt: string };
export function parseCurrencyRateResponse(value: unknown, base: CurrencyCode, fetchedAt: string): CurrencyRatePayload | null;
export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode, payload: CurrencyRatePayload): number | null;
export async function fetchCurrencyRates(base: CurrencyCode, fetcher?: typeof fetch, now?: () => string): Promise<CurrencyRatePayload>;
```

- [ ] **Step 1: Write failing tests**

Test strict response validation, direct and inverse conversion, same-currency conversion, stale cache labeling, failed request fallback, and no fabricated rate when no cache exists.

- [ ] **Step 2: Run the focused test and confirm red**

```powershell
npm run build; node --test dist/tests/currency-rates.test.js
```

Expected: missing module/function failures.

- [ ] **Step 3: Implement adapter**

Call `https://api.frankfurter.dev/v2/rates?base=<BASE>&quotes=<TARGETS>`, use an injected fetcher in tests, require a valid ISO provider date and finite positive rates, and calculate conversions locally. Expose cache freshness as metadata rather than pretending stale data is current.

- [ ] **Step 4: Run focused tests and verify green**

Expected: network behavior is represented only through injected fetchers; failures resolve to explicit unavailable/stale states.

### Task 5: Integrate Toolbox view, controls, and room locking

**Files:**
- Create: `apps/html-prototype/src/systems/ToolboxView.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Create or modify: `apps/html-prototype/tests/toolbox-integration.test.ts`

**Interfaces:**

```ts
export function renderToolboxRoot(state: ToolboxView, context: ToolboxRenderContext): string;
export function renderToolboxTool(tool: ToolboxToolId, context: ToolboxRenderContext): string;
export function toolboxActionForKey(key: string): "up" | "down" | "left" | "right" | "confirm" | "back" | null;
```

- [ ] **Step 1: Write failing integration assertions**

Assert that opening Toolbox renders a stage-contained overlay, exact selected tool is restored/defaulted, slot click changes selection without entering, Enter button/keyboard Enter/E enters, Escape backs/closes, and player coordinates are unchanged while movement input is consumed.

- [ ] **Step 2: Run the focused test and verify red**

```powershell
npm run build; node --test dist/tests/toolbox-integration.test.js
```

Expected: missing renderer/action behavior and old app dispatch.

- [ ] **Step 3: Implement orchestration and renderers**

Add `toolboxView`/utility state to the app, `openToolbox`, `closeToolbox`, `renderToolbox`, and delegated action handlers. Add a window keydown listener that handles arrows/Enter/E/Escape only while Toolbox is open. Make the frame loop consume `InputManager.read()` without calling room movement or scene interaction while the overlay is open. Make the existing touch action call confirm when Toolbox is active, and hide touch controls through the existing `overlay-open` state.

Use `.toolbox-overlay` to force `position:absolute; inset:0` on small screens. Render root slots in `repeat(3,minmax(0,1fr))` Landscape and `repeat(2,minmax(0,1fr))` Portrait, with `min-width:0`, a real footer grid, safe wrapping, and scrollable panel height.

- [ ] **Step 4: Run focused tests, typecheck, and build**

```powershell
npm test -- --test-name-pattern="toolbox|muji room|scene layouts|mobile"
npm run typecheck
npm run build
```

Expected: Pass 1 focused tests and existing relevant regressions pass.

### Task 6: Pass 1 checkpoint verification

**Files:**
- Modify: only files required by failing verification
- Test: all Pass 1 tests and relevant existing tests

- [ ] **Step 1: Run the complete Pass 1 suite**

```powershell
npm test
```

- [ ] **Step 2: Run static checks**

```powershell
git diff --check
rg -n "residue" apps/html-prototype/src/systems/MujiRoom.ts apps/html-prototype/src/app.ts apps/html-prototype/public/scene-layouts/muji-room/portrait.json apps/html-prototype/tests
```

Expected: no Muji Room table interaction identity remains as `residue`; generic `residueIds` narrative usage may remain.

- [ ] **Step 3: Run the dev server and browser-check Pass 1**

Use the existing `npm run dev` flow and available browser tooling. Verify Landscape and Portrait Toolbox open from the table hotspot, prompt reads `E · 工具箱`, root selection/Enter/back/close works, each utility can be entered, no overflow occurs, and movement resumes at the exact pre-open position.

- [ ] **Step 4: Record the checkpoint evidence**

Do not claim visual correctness unless the browser check was actually completed. Preserve any unrelated pre-existing failure with command/output evidence.

---

## Pass 2 — Living Window

### Task 7: Add weather provider, validation, cache, and moon model

**Files:**
- Create: `apps/html-prototype/src/systems/WeatherProvider.ts`
- Create: `apps/html-prototype/src/systems/WeatherCache.ts`
- Create: `apps/html-prototype/src/systems/MoonPhase.ts`
- Create: `apps/html-prototype/src/systems/WeatherVisuals.ts`
- Create: `apps/html-prototype/tests/weather-provider.test.ts`
- Create: `apps/html-prototype/tests/moon-phase.test.ts`

**Interfaces:**

```ts
export type WeatherLocation = { id?: number; name: string; country?: string; latitude: number; longitude: number; timezone?: string };
export type WeatherSnapshot = { location: WeatherLocation; fetchedAt: string; providerTime: string; current: { conditionCode: number; temperatureC: number; feelsLikeC: number; precipitationMm: number; isDay: boolean }; currentPrecipitationProbability?: number; daily: Array<{ date: string; conditionCode?: number; precipitationProbability?: number; uvIndex?: number; sunset?: string }>; };
export function parseOpenMeteoResponse(value: unknown, location: WeatherLocation, fetchedAt: string): WeatherSnapshot | null;
export async function fetchWeather(location: WeatherLocation, fetcher?: typeof fetch, now?: () => string): Promise<WeatherSnapshot>;
export async function searchWeatherLocations(query: string, fetcher?: typeof fetch): Promise<WeatherLocation[]>;
export function moonPhaseIndex(date: Date): number;
export function moonPhaseName(index: number): string;
export function moonSpriteFrame(index: number): number;
export function mapWeatherCondition(code: number, isDay: boolean): WeatherVisualState;
```

- [ ] **Step 1: Write failing tests**

Validate Open-Meteo current/daily shape, reject malformed data, assert current precipitation amount is not reused as a probability, test stale cache/network failure/no fabricated data, test location result validation, test eight moon indices/frame mapping, and test clear/cloudy/rain/heavy-rain/thunderstorm/fog mappings.

- [ ] **Step 2: Run focused tests and verify red**

```powershell
npm run build; node --test dist/tests/weather-provider.test.js dist/tests/moon-phase.test.js
```

Expected: missing module/function failures.

- [ ] **Step 3: Implement strict adapters and models**

Request Open-Meteo with `current=temperature_2m,apparent_temperature,precipitation,rain,showers,weather_code,cloud_cover,is_day`, hourly probability data for compact upcoming values, and daily `precipitation_probability_max,uv_index_max,sunset,weather_code`. Preserve amount and percentage as separate fields and labels. Add `AbortController` timeout, `response.ok` checks, finite-number checks, and explicit unavailable errors. Keep location/geolocation state local.

Use a fixed known reference new-moon timestamp plus synodic month to calculate phase index as `Math.floor(((date - reference) / synodicMonth) * 8 + 0.5) mod 8`; map index directly to the supplied atlas order.

- [ ] **Step 4: Run focused tests and verify green**

Expected: provider parsing, cache fallback, probability distinction, condition mapping, and moon tests pass without live network calls.

### Task 8: Normalize and validate weather assets; centralize exact scene transform

**Files:**
- Move: five files from `apps/html-prototype/public/assets/muji-room/weather/muji-room-weather-runtime-assets/` to `apps/html-prototype/public/assets/muji-room/weather/`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/systems/SceneLayouts.ts` only if a reusable transform helper is extracted
- Create: `apps/html-prototype/tests/weather-assets.test.ts`
- Create: `apps/html-prototype/tests/scene-weather-transform.test.ts`

- [ ] **Step 1: Write failing asset/transform tests**

Assert root runtime files, exact dimensions/modes, absence of runtime reference-image imports, and equality between Muji Room canvas mapping and weather-layer mapping in both orientations.

- [ ] **Step 2: Run the tests and verify red**

```powershell
npm run build; node --test dist/tests/weather-assets.test.js dist/tests/scene-weather-transform.test.js
```

Expected: root asset path failures and no shared transform contract.

- [ ] **Step 3: Move only the runtime assets and implement the transform contract**

Use explicit validated paths for the five PNG moves. Remove the nested directory only after verifying it contains no remaining runtime files. Extract a pure `MujiRoomRenderTransform` containing source size, viewport, camera, and canvas scale, and make both `drawMujiRoomScene` and weather rendering consume it. For current Muji Room Landscape, preserve the existing full-source-to-canvas draw behavior; for Portrait, preserve the existing full source viewport draw behavior. Do not independently use DOM width/height for mask positioning.

- [ ] **Step 4: Run asset and transform tests, then verify paths**

```powershell
npm run build; node --test dist/tests/weather-assets.test.js dist/tests/scene-weather-transform.test.js
rg -n "weather-atlas-reference|weather-sprites-reference" apps/html-prototype/src
```

Expected: dimension/path tests pass and runtime source has no reference-image match.

### Task 9: Integrate Living Window panel and weather state

**Files:**
- Create: `apps/html-prototype/src/systems/LivingWindowView.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/systems/SaveManager.ts`
- Create or modify: `apps/html-prototype/tests/living-window.test.ts`

**Interfaces:**

```ts
export function renderLivingWindow(snapshot: WeatherSnapshot | null, state: LivingWindowUiState): string;
export function weatherPanelActionForKey(key: string): "close" | "refresh" | null;
```

- [ ] **Step 1: Write failing integration assertions**

Assert Window prompt `E · 看看窗外`, open/close without moving the player, manual location search, explicit geolocation permission action, valid current fields, accurate precipitation/probability labels, stale/unavailable states, and local selected-location persistence.

- [ ] **Step 2: Run the focused test and verify red**

```powershell
npm run build; node --test dist/tests/living-window.test.js
```

Expected: missing panel and dispatch behavior.

- [ ] **Step 3: Implement view and app orchestration**

Replace `roomWindow`’s toggle-only behavior with an async `openLivingWindow` that renders the panel immediately, loads the saved location/cache, fetches only on open/refresh, and catches errors into stale/unavailable UI. Add manual search and a one-shot geolocation button that calls `navigator.geolocation.getCurrentPosition` only from the user action. Do not persist precise coordinates remotely. Keep `room.windowFocus` compatibility state only if existing saves/tests require it, but do not use it as the weather source of truth.

- [ ] **Step 4: Run focused tests and relevant regressions**

```powershell
npm test -- --test-name-pattern="living window|muji room|save manager|scene layouts|mobile"
npm run typecheck
```

### Task 10: Render masked weather visuals with shared transforms and responsive CSS

**Files:**
- Modify: `apps/html-prototype/src/systems/WeatherVisuals.ts`
- Modify: `apps/html-prototype/src/app.ts`
- Modify: `apps/html-prototype/src/styles.css`
- Modify: `apps/html-prototype/tests/weather-visuals.test.ts`

- [ ] **Step 1: Write failing visual-state/render-contract tests**

Assert visual layer choices for controlled snapshots, selected mask path by orientation, source-sized layer dimensions, reduced-motion handling, and that the renderer receives the same transform object used for Muji Room.

- [ ] **Step 2: Run focused tests and verify red**

```powershell
npm run build; node --test dist/tests/weather-visuals.test.js
```

Expected: missing visual mapping and transform assertions.

- [ ] **Step 3: Implement canvas weather rendering**

Create a reusable offscreen canvas sized to the active Muji Room canvas. Draw tint, moon atlas frame, tiled/positioned cloud sprites, rain atlas frames, fog, and optional lightning into the offscreen buffer. Apply the source-sized mask using `destination-in`, then draw the masked buffer into the main canvas using the exact `MujiRoomRenderTransform`. Use `window-mask-landscape.png` for Landscape and `window-mask-portrait.png` for Portrait. Do not attach an independently stretched DOM weather layer. Keep weather rendering below Muji and UI, and render only when the Living Window/weather state is active.

- [ ] **Step 4: Add responsive panel CSS and run focused tests**

Ensure Toolbox and Living Window panels remain stage-contained, have safe max-width/max-height, internal vertical scrolling, no horizontal overflow, safe `min-width:0`, reachable close/back controls, usable touch targets, and footer reflow. Respect reduced motion by freezing or shortening cloud/rain/wheel animation.

### Task 11: Full final verification and browser checks

**Files:**
- Modify: only files required by verification failures
- Test: entire `apps/html-prototype/tests` suite plus static checks

- [ ] **Step 1: Run full automated tests**

```powershell
npm test
```

Expected: all existing and new tests pass; if a pre-existing failure remains, record its exact name/output and leave unrelated code untouched.

- [ ] **Step 2: Run typecheck/build/diff checks**

```powershell
npm run typecheck
npm run build
git diff --check
rg -n "weather-atlas-reference|weather-sprites-reference" apps/html-prototype/src apps/html-prototype/public
```

Expected: typecheck/build exit 0, diff check empty, and reference images absent from runtime references.

- [ ] **Step 3: Run static asset smoke checks**

Verify the built `apps/html-prototype/dist` or copied static output contains `moon-phases.png`, `clouds.png`, `rain-vfx.png`, `window-mask-landscape.png`, and `window-mask-portrait.png`, and does not embed image bodies into generated JavaScript.

- [ ] **Step 4: Perform actual Landscape and Portrait browser verification**

Verify the table prompt/identity, Toolbox selection and all six tools, exact-position close behavior, Window prompt/panel, manual location and cached/unavailable states, masked clear/cloud/rain/heavy-rain/new-moon visuals, touch controls, keyboard controls, software-keyboard input scenarios where available, and absence of horizontal overflow. Use controlled/mock provider data for visual states.

- [ ] **Step 5: Review the final diff against the source-of-truth constraints**

```powershell
git status --short
git diff --stat
git diff -- apps/html-prototype/src apps/html-prototype/public/scene-layouts/muji-room apps/html-prototype/public/assets/muji-room/weather
```

Confirm unrelated `apps/html-prototype/public/assets/523/` remains untracked and unchanged.

### Task 12: Commit the complete scoped feature locally

**Files:** all scoped changed files from Pass 1 and Pass 2; do not stage unrelated files.

- [ ] **Step 1: Stage only the feature and approved design/plan docs**

```powershell
git add docs/superpowers/specs/2026-08-23-muji-toolbox-living-window-design.md docs/superpowers/plans/2026-08-23-muji-toolbox-living-window-plan.md apps/html-prototype/src apps/html-prototype/tests apps/html-prototype/public/scene-layouts/muji-room/portrait.json apps/html-prototype/public/assets/muji-room/weather
```

- [ ] **Step 2: Verify staged diff and whitespace**

```powershell
git diff --cached --check
git diff --cached --stat
```

- [ ] **Step 3: Commit locally without pushing**

```powershell
git commit -m "feat: add Muji Toolbox and Living Window"
```

- [ ] **Step 4: Capture final evidence**

```powershell
git rev-parse HEAD
git status --short
git log -3 --oneline --decorate
```

Report the final commit SHA, exact files changed, provider choices, coordinates/radii, asset paths, behavior, test/typecheck/build/diff/static results, browser verification status, and any pre-existing failures.
