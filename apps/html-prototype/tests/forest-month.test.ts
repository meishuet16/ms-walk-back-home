import assert from "node:assert/strict";
import test from "node:test";
import { forestEntries, type AuthoredForestEntry } from "../src/systems/ChapterRegistry.js";
import { createDiaryLibrary, forestNodesForMonth, upsertDiaryEntry } from "../src/systems/DiaryLibrary.js";
import { makeDiaryEntry } from "../src/systems/DiaryImport.js";

test("forest month filter applies to public chapter doors and private fragment lights", () => {
  const julyFragment = makeDiaryEntry("2026-07-23", "July glow", "A private July light.", undefined, "fragment");
  const augustFragment = makeDiaryEntry("2026-08-11", "August glow", "A private August light.", undefined, "fragment");
  const library = upsertDiaryEntry(upsertDiaryEntry(createDiaryLibrary(), julyFragment), augustFragment);

  const publicEntries: AuthoredForestEntry[] = [
    ...forestEntries,
    { id: "august-public", date: "08.11", title: "August Door", x: 100, y: 100, chapterId: "august-door" }
  ];
  const julyNodes = forestNodesForMonth(publicEntries, library, "2026-07");

  assert.deepEqual(julyNodes.map((node) => node.id), [
    "labis-motor",
    "july21-one-more-day",
    "segamat",
    "yumido",
    "night",
    "palapes",
    julyFragment.id
  ]);
  assert.equal(julyNodes.some((node) => node.title === "August glow"), false);
  assert.equal(julyNodes.some((node) => node.id === "august-public"), false);
});
