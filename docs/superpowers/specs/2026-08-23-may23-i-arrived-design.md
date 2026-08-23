# May 23 “我到了，你呢” Chapter Design

## Scope

Implement the approved may23-i-arrived authored chapter in runtime scene 523, with the supplied Portrait and Landscape scene-debug exports, the authored diary entry, separate historical actors MS, ET, and Tung Ern, and the full reflection/echo lifecycle.

## Source of truth

- Chapter identity: may23-i-arrived; date 2026-05-23; title 05.23 · 我到了，你呢.
- Canonical event and trigger: may23-hostel-memory / hostel-lobby-arrival.
- Player identity is present-day Muji. Historical speakers remain MS, ET, and Tung Ern.
- The two JSON layouts under public/scene-layouts/523/ provide the authored coordinate systems and background assets.
- The individual PNG frames under public/assets/523/base/ are runtime assets; no runtime sheet slicing is used.
- The diary fixture is fictional and concise so no private diary content is committed.

## Runtime design

may23Chapter.ts owns the fixture chapter, frame registries, reflection choices, echo dialogue, and a layout-driven action resolver. The resolver preserves the approved Portrait facing semantics and derives Landscape-facing rows from each movement’s authored geometry.

CutsceneSystem owns generic actor movement. Move and group actions interpolate visualScale and cycle walkA → passing → walkB → passing; sprite actions restore idle frames. SceneActorRenderer multiplies authored scene scale by actor visual scale and uses each frame’s stable feet anchor.

app.ts registers scene 523, preloads all individual frames, consumes the visit-scoped trigger, routes diary-memory, supports manual replay, and exposes the three echo anchors only after the canonical event completes. ET and Tung Ern are always separate actors, including the paired movement and return-to-stairs sequence.

## Lifecycle

A new visit automatically consumes the one-shot hostel trigger and runs the main cutscene. Completion records may23-hostel-memory, presents the existing reflection flow, and unlocks replay plus the three echo interactions. Replay runs the complete cutscene and reflection flow without re-consuming the visit trigger. Exiting the scene leaves the completion state intact.

## Verification

Focused tests cover chapter registration, diary linkage, both layout assets and trigger types, all directional frame registries, Portrait ownership/facing, 19:29 physical return ordering, Landscape routing, paired actor identity, walk cycles, and scale interpolation. Typecheck, production build, the full prototype suite, and browser checks are run before handoff.

