# Muji Toolbox + Living Window Design

## Goal

Add the first complete Muji Toolbox + Living Window pass to the existing Walk Back Home Muji Room RPG without creating new pages, scenes, hotspots, or persistence backends.

The work is split into two implementation checkpoints inside one feature:

1. Pass 1 — migrate the Muji Room table interaction from `residue` to `toolbox`, add the stage-contained Toolbox shell, and implement all six offline-first utilities.
2. Pass 2 — upgrade the existing `window` interaction into Living Window with Open-Meteo weather, local location controls, cache/offline fallback, moon calculation, and masked weather visuals.

## Existing constraints discovered

- The current worktree is clean on branch `mobile-layout` at commit `a831997`.
- Landscape Muji Room interactions are defined by `roomInteractions` in `src/systems/MujiRoom.ts`; the table interaction is `(562, 316, 62)`.
- Portrait Muji Room interactions are authored in `public/scene-layouts/muji-room/portrait.json`; the table interaction is `(495.43814041564195, 890.6566972474059, 56)`.
- Portrait authored layouts are loaded through the existing Scene Layout override system.
- `app.ts` owns orchestration, the frame loop, input dispatch, and stage overlay mounting; pure product logic will remain in focused systems.
- `SaveManager` owns versioned local persistence and owner-scoped keys.
- The room source is `1536 × 1024` in Landscape and `941 × 1672` in Portrait. The current renderer maps each source image into the canvas using its existing scene viewport/scaling transform; weather layers must reuse that exact scene transform.
- Runtime weather PNGs exist in `public/assets/muji-room/weather/muji-room-weather-runtime-assets/`; reference PNGs exist at the weather root and are never runtime assets.

## Architecture

### Shared state boundaries

Pure domain state is kept outside `app.ts`:

- `ToolboxModel` owns root/subview navigation, selected tool, remembered selection, and input transitions.
- Utility modules own deterministic calculations and data operations.
- `WeatherProvider` owns network request construction and strict response normalization.
- `WeatherCache` and `SaveManager` own durable local state.
- `MoonPhase` and `WeatherVisuals` own deterministic presentation mapping.
- `ToolboxView` and `LivingWindowView` render stage-contained HTML. They do not own game movement, navigation, or persistence.

`app.ts` remains the integration boundary: it opens/closes overlays, delegates `data-action` events, supplies current orientation and viewport transform, and calls the focused systems.

### Stage and input behavior

The existing `.stage-wrap` is the only host. Toolbox and Living Window are mounted in the existing `.overlay`, with an explicit stage-contained overlay class that overrides any small-screen fixed overlay rule.

When Toolbox or Living Window is open:

- room movement input is consumed;
- the current player point is not mutated;
- touch movement controls cannot move the player behind the panel;
- Enter/E, arrows, and Escape are interpreted by the active overlay;
- closing clears only the overlay and restores normal room control.

Toolbox root selection is explicit: slot activation selects only, and Enter/E or the visible Enter button confirms. Escape from a utility returns to root; Escape from root closes.

### Pass 1 systems

- `ToolboxModel.ts`: tool ids, root/subview state, grid navigation, remembered selection, and transition helpers.
- `SpinWheel.ts`: choices, presets, deterministic injectable RNG, and safe spin behavior.
- `Calculator.ts`: non-`eval` expression model for everyday arithmetic.
- `UnitConverter.ts`: length, weight, temperature, storage, and time conversions.
- `CurrencyRates.ts`: Frankfurter v2 adapter, response validation, rate conversion, and stale-cache semantics.
- `TimerTool.ts`: timestamp-based countdown and stopwatch transitions.
- `DateTool.ts`: local date-only parsing and date arithmetic.
- `ToolboxView.ts`: RPG-style root grid, footer, and utility subviews.

The six tools share the same overlay and responsive CSS. Landscape may use three columns by two rows; Portrait uses two columns by three rows. All grid children and footer content use shrink-safe sizing and wrapping.

### Pass 2 systems

- `WeatherProvider.ts`: Open-Meteo Forecast and Geocoding adapters with timeout, validation, and explicit-request behavior.
- `WeatherCache.ts`: last successful response, selected location, timestamp, and stale/offline fallback.
- `MoonPhase.ts`: deterministic synodic-month calculation and eight-frame mapping.
- `WeatherVisuals.ts`: WMO condition mapping and visual-state mapping for clear, cloudy, rain, heavy rain, thunderstorm, fog, and moon.
- `LivingWindowView.ts`: lightweight location/weather panel with supported fields only.

Open-Meteo current precipitation/condition and precipitation probability remain separate fields. Current precipitation is displayed as an amount from current/hourly data; precipitation probability is displayed as a percentage from the provider's probability field. No percentage is derived from precipitation amount.

The weather layer uses the same source-to-canvas transform as `drawMujiRoomScene` in both orientations. The renderer exposes or centralizes the exact scene viewport/scaling contract, and the weather layer receives that transform rather than computing its own DOM-relative stretch. Landscape uses `window-mask-landscape.png`; Portrait uses `window-mask-portrait.png`. The masks and weather layers share the room source coordinate system before being mapped to the canvas/stage.

## Providers

### Weather and geocoding

Use Open-Meteo's public Forecast and Geocoding endpoints. The documented API supports current weather variables, daily forecast variables, UV, sunset, timezone-aware output, and location search without exposing a private key for this local-first prototype. Requests happen when the user opens/refreshes Living Window or explicitly searches/uses geolocation.

### Currency

Use Frankfurter v2. It is a public browser-suitable API with no private secret, exposes latest working-day rates, and includes the requested MYR, SGD, USD, JPY, CNY, EUR, and GBP currencies. Conversion is calculated locally from validated rates. Successful results are cached with the provider date and local fetch timestamp; failures use a marked stale cache or an unavailable state.

## Persistence

Add owner-scoped SaveManager namespaces without changing existing fixture data or requiring migration of existing journey JSON:

- Toolbox preferences/data: presets, selected tool, selected preset, converter units, and last currency pair.
- Living Window state: selected location, last successful weather payload, weather timestamp, and last successful currency payload/timestamp.

Do not persist modal state, rain/cloud animation position, or transient timer render values.

## Assets

Move only the five runtime PNGs one level up to `public/assets/muji-room/weather/`. Keep `weather-atlas-reference.png` and `weather-sprites-reference.png` as art-direction references and ensure runtime code never references them. Do not edit or re-export runtime PNG pixels.

## Verification

Each new pure system follows red-green-refactor with focused Node tests. Verification includes:

- Muji Room interaction identity and coordinate preservation;
- Toolbox select/confirm/back/close and movement lock;
- all six utility models and persistence/cache behavior;
- provider validation, stale/offline fallback, and condition mapping;
- moon phase indices and sprite frame mapping;
- asset paths, dimensions, and runtime reference exclusion;
- existing Muji/Journal/Records/Reflection/Scene Layout/Chapter regressions;
- typecheck, build, `git diff --check`, and static asset smoke checks;
- actual Landscape and Portrait browser checks when browser tooling is available, without claiming visual correctness unless performed.
