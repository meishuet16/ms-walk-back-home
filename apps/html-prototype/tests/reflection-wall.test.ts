import assert from "node:assert/strict";
import test from "node:test";
import {
  changeReflectionPaper,
  createChapterReflectionNote,
  createReflectionNote,
  createReflectionWallState,
  filterReflectionNotes,
  migrateLegacyReflectionWall,
  moveReflectionNote,
  searchReflectionNotes,
  sortReflectionNotes,
  updateReflectionNote,
  visibleReflectionNotes
} from "../src/systems/ReflectionWall.js";

const now = new Date("2026-08-11T11:42:00.000Z");

test("reflection note creation persists text timestamp style and wall-local coordinates", () => {
  const state = createReflectionWallState();
  const next = createReflectionNote(state, "今天突然觉得，好像没有以前那么急着知道答案。", {
    now,
    styleId: "blue-lined",
    position: { x: 42, y: 36 },
    rotation: 1.2
  });

  assert.equal(next.notes.length, 1);
  assert.equal(next.notes[0].text, "今天突然觉得，好像没有以前那么急着知道答案。");
  assert.equal(next.notes[0].createdAt, "2026-08-11T11:42:00.000Z");
  assert.equal(next.notes[0].updatedAt, undefined);
  assert.equal(next.notes[0].styleId, "blue-lined");
  assert.equal(next.notes[0].x, 42);
  assert.equal(next.notes[0].y, 36);
  assert.equal(next.notes[0].rotation, 1.2);
  assert.equal(next.notes[0].source, "manual");
});

test("editing preserves createdAt and position while setting updatedAt", () => {
  const state = createReflectionNote(createReflectionWallState(), "first", { now, position: { x: 20, y: 30 } });
  const note = state.notes[0];
  const edited = updateReflectionNote(state, note.id, "第二句", new Date("2026-08-13T00:06:00.000Z"));

  assert.equal(edited.notes[0].text, "第二句");
  assert.equal(edited.notes[0].createdAt, "2026-08-11T11:42:00.000Z");
  assert.equal(edited.notes[0].updatedAt, "2026-08-13T00:06:00.000Z");
  assert.equal(edited.notes[0].x, 20);
  assert.equal(edited.notes[0].y, 30);
});

test("dragging and paper changes preserve note identity and timestamps", () => {
  const state = createReflectionNote(createReflectionWallState(), "keep me", { now, styleId: "cream-torn" });
  const id = state.notes[0].id;
  const moved = moveReflectionNote(state, id, { x: 80, y: 76 });
  const changed = changeReflectionPaper(moved, id, "sage-memo", new Date("2026-08-12T01:00:00.000Z"));

  assert.equal(changed.notes[0].id, id);
  assert.equal(changed.notes[0].createdAt, "2026-08-11T11:42:00.000Z");
  assert.equal(changed.notes[0].updatedAt, "2026-08-12T01:00:00.000Z");
  assert.equal(changed.notes[0].styleId, "sage-memo");
  assert.equal(changed.notes[0].x, 80);
  assert.equal(changed.notes[0].y, 76);
});

test("unicode search and filters do not mutate persisted wall coordinates", () => {
  let state = createReflectionNote(createReflectionWallState(), "雨天的答案", { now, position: { x: 10, y: 15 } });
  state = createChapterReflectionNote(state, "chapter thought", "bakery-day", { now: new Date("2026-08-12T02:00:00.000Z"), position: { x: 55, y: 64 } });
  state = { ...state, notes: state.notes.map((note, index) => index === 0 ? { ...note, favorite: true } : note) };
  const before = state.notes.map((note) => ({ id: note.id, x: note.x, y: note.y }));

  assert.deepEqual(searchReflectionNotes(state.notes, "答案").map((note) => note.text), ["雨天的答案"]);
  assert.deepEqual(filterReflectionNotes(state.notes, "chapter").map((note) => note.source), ["chapter"]);
  assert.deepEqual(filterReflectionNotes(state.notes, "favorites").map((note) => note.favorite), [true]);
  assert.deepEqual(state.notes.map((note) => ({ id: note.id, x: note.x, y: note.y })), before);
});

test("sorting and alternate views never overwrite manual wall layout", () => {
  let state = createReflectionNote(createReflectionWallState(), "old", { now, position: { x: 12, y: 18 } });
  state = createReflectionNote(state, "new", { now: new Date("2026-08-12T00:00:00.000Z"), position: { x: 70, y: 72 } });
  const before = state.notes.map((note) => ({ id: note.id, x: note.x, y: note.y }));

  assert.deepEqual(sortReflectionNotes(state.notes, "newest").map((note) => note.text), ["new", "old"]);
  assert.deepEqual(sortReflectionNotes(state.notes, "oldest").map((note) => note.text), ["old", "new"]);
  assert.equal(visibleReflectionNotes(state, { view: "list", sort: "newest", search: "" })[0].text, "new");
  assert.equal(visibleReflectionNotes(state, { view: "stack", sort: "oldest", search: "" })[0].text, "old");
  assert.deepEqual(state.notes.map((note) => ({ id: note.id, x: note.x, y: note.y })), before);
});

test("legacy room reflection migrates once without deleting old journey fields", () => {
  const migrated = migrateLegacyReflectionWall(createReflectionWallState(), {
    reflectionNote: "old wall note",
    reflections: ["The lamp turns on softly.", "Reflection: second old note"]
  }, now);
  const again = migrateLegacyReflectionWall(migrated, {
    reflectionNote: "old wall note",
    reflections: ["Reflection: second old note"]
  }, now);

  assert.deepEqual(migrated.notes.map((note) => note.text), ["old wall note", "second old note"]);
  assert.equal(again.notes.length, 2);
});

test("kept chapter reflection notes remain after replaying the same ending", () => {
  const kept = createChapterReflectionNote(createReflectionWallState(), "03.30 ending", "march30-too-fated", { now });
  const replayed = createChapterReflectionNote(kept, "03.30 ending", "march30-too-fated", { now: new Date("2026-08-12T00:00:00.000Z") });

  assert.equal(replayed.notes.some((note) => note.source === "chapter" && note.chapterId === "march30-too-fated" && note.text === "03.30 ending"), true);
  assert.equal(replayed.notes.length, 2);
});
