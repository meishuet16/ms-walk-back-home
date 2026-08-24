# June 24 Authored Prompt Correction Implementation Plan

> **For agentic workers:** Execute task-by-task with test-first verification. The user's pasted June 24 prompt is authoritative; the v3.12 Unified Skill is reference guidance only.

**Goal:** Replace invented Scene 624 Main Memory, Echo, and reflection copy with the exact authored beats, dialogue, guardrails, and approved assets from the user's pasted prompt while preserving shared runtime and authored layouts.

**Architecture:** Keep `resolveJune24Actions`, `june24ReflectionChoices`, and `june24EchoDialogues` as the data boundary used by the existing shared authored runtime. Do not add a new scene engine, alter SceneLayout JSON, regenerate assets, or use world coordinates for Echo Portraits.

**Tech Stack:** TypeScript, Node test runner, existing CutsceneSystem, SceneLayout JSON, shared Echo Portrait presentation.

## Global Constraints

- The pasted June 24 prompt is the source of truth for authored dialogue and choreography.
- v3.12 Unified Skill is reference only and cannot authorize invented chapter copy.
- Preserve `apps/html-prototype/public/scene-layouts/624/portrait.json`, `landscape.json`, and `public/assets/624/` byte-for-byte.
- Main Memory remains RPG_BOTTOM with historical MS/ET world actors; Muji remains present-day player.
- Echoes remain shared presentation-space overlays and do not read SceneLayout/world coordinates.
- Preserve Forest entry fix and unrelated user worktree changes; do not push or commit this correction unless explicitly requested.

### Task 1: Add failing authored-copy and beat-order tests

**Files:**
- Modify: `apps/html-prototype/tests/june24-chapter.test.ts`
- Test: `apps/html-prototype/tests/june24-chapter.test.ts`

Assert exact Beat 1/3/6/7/8/9/10/12 dialogue, all authored reflection prompts/choices/responses/effects, exact Echo dialogue, no invented phrases, and the required asset/action ordering.

### Task 2: Replace Scene 624 Main Memory data

**Files:**
- Modify: `apps/html-prototype/src/fixtures/june24Chapter.ts`

Implement only the authored 12-beat sequence and exact supplied dialogue. Preserve the existing anchor-based movement, 624 frame registry, visualScale 0.3, phone/Xiaoba/carrot-milk ownership, silence, goodbye movement, and shared action types.

### Task 3: Replace reflection and Echo copy

**Files:**
- Modify: `apps/html-prototype/src/fixtures/june24Chapter.ts`

Use the three exact reflection prompts, choices, responses, and existing tendency keys from the prompt. Use the exact three secondary Echo dialogues and stop at their approved unresolved endpoints. Keep approved portrait mappings unchanged.

### Task 4: Verify and audit boundaries

Run focused June tests, relevant shared tests, typecheck, production build, and full suite. Confirm Scene 624 JSON/assets are unchanged and only intended source/test files differ. Browser acceptance remains required; report any environment blocker without substituting another browser.