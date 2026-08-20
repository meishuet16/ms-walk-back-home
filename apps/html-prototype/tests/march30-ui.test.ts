import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const appSource = readFileSync(join(root, "src/app.ts"), "utf8");

test("March 30 keeps authored diary interactions in both orientations", () => {
  for (const orientation of ["landscape", "portrait"]) {
    const layout = JSON.parse(readFileSync(join(root, "public/scene-layouts/330-corridor", `${orientation}.json`), "utf8"));
    assert.ok(layout.interactions.some((interaction: { id: string }) => interaction.id === "diary"));
  }
});

test("March 30 renders the old books-with-MS-photo diary prop and interaction tells", () => {
  assert.match(appSource, /drawMarch30InteractionTells/);
  assert.match(appSource, /book-with-ms-photos\.png/);
  assert.match(appSource, /activeObject === "diary"/);
  assert.match(appSource, /showDiaryMemory\(\)/);
});

test("March 30 dialogue includes a speaker portrait on the left", () => {
  assert.match(appSource, /march30PortraitMarkup/);
  assert.match(appSource, /march30-portrait/);
});

test("March 30 material scale defaults to 1.2x with water gun and candied haw keychain at 2x", () => {
  assert.match(appSource, /MARCH30_MATERIAL_SCALE\s*=\s*1\.2/);
  assert.match(appSource, /MARCH30_LARGE_MATERIAL_SCALE\s*=\s*2/);
  assert.match(appSource, /march30ScaleForAsset/);
  assert.match(appSource, /march30ScaleForProp/);
  assert.match(appSource, /waterSpraying|keychains/);
  assert.match(appSource, /waterGun|ordinaryKeychain/);
});

test("March 30 diary is editable from Journal and its corridor reading uses the saved entry", () => {
  assert.match(appSource, /chapterId === chapterId/);
  assert.match(appSource, /showDiaryEditor/);
  assert.match(appSource, /journal-edit-current/);
  assert.match(appSource, /chapterId: memoryKind === "chapter"/);
});

test("March 30 keeps action sheets at 1.2x and only standalone prop exceptions at 2x", () => {
  assert.match(appSource, /assetId === "waterSpraying"|assetId === "keychains"/);
  assert.match(appSource, /propId === "waterGun"/);
  assert.match(appSource, /propId === "ordinaryKeychain"/);
  assert.match(appSource, /propId === "phoneCharm"/);
  assert.match(appSource, /march30-prop-portrait/);
});

test("March 30 mobile overlays and interaction tells stay compact and visible", () => {
  const stylesSource = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.match(stylesSource, /\.overlay\.dialogue-open \.vn/);
  assert.match(stylesSource, /\.reflection-choice/);
  assert.match(stylesSource, /\.ending-quote/);
  assert.match(appSource, /globalAlpha = active \? 0\.86 : 0\.58/);
});

test("March 30 water VFX derives its nozzle and target geometry from scaled actors", () => {
  assert.match(appSource, /actorMaterialScale = actor\.sprite \? this\.march30ScaleForAsset/);
  assert.match(appSource, /targetMaterialScale = target\.sprite \? this\.march30ScaleForAsset/);
  assert.match(appSource, /nozzleOriginByFrame/);
});

test("March 30 portrait prop portraits crop transparent sheets to their visible source bounds", () => {
  assert.match(appSource, /march30PropPortraitCrop/);
  assert.match(appSource, /source\.x/);
  assert.match(appSource, /source\.y/);
  assert.match(appSource, /propPortraitSheetDimensions/);
});

test("March 30 portrait overlays center within the stage and short content does not stretch", () => {
  const stylesSource = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.match(stylesSource, /#app\[data-orientation="portrait"\] \.overlay/);
  assert.match(stylesSource, /place-items: center/);
  assert.match(stylesSource, /#app\[data-orientation="portrait"\] \.diary-memory/);
  assert.match(stylesSource, /height: auto/);
});

test("March 30 applies the large scale to the standalone gift and clips actor frames to alpha bounds", () => {
  const stylesSource = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.match(appSource, /propId === "gift"/);
  assert.match(appSource, /visible = spriteAsset\.visibleBounds\?\.\[sprite\.frame\]/);
  assert.match(appSource, /frame\.source\.x \+ visible\.x/);
  assert.match(stylesSource, /\.march30-portrait[\s\S]*overflow: hidden/);
});

test("March 30 replay still presents reflection choices and ending quote can be kept", () => {
  const finish = appSource.slice(appSource.indexOf("private finishMarch30Cutscene"), appSource.indexOf("private showMarch30ReflectionChoice"));
  assert.match(finish, /this\.showMarch30ReflectionChoice\(1\)/);
  assert.match(finish, /this\.showMarch30ReflectionChoice\(2\)/);
  assert.doesNotMatch(finish, /if \(!replay\) this\.showMarch30ReflectionChoice/);
  const ending = appSource.slice(appSource.indexOf("private advanceMarch30Reflection"), appSource.indexOf("private updateLabis"));
  assert.match(ending, /reflection-keep-chapter/);
});

test("March 30 mobile overlays remain centered and compact", () => {
  const stylesSource = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.match(stylesSource, /\.overlay\.dialogue-open[\s\S]*place-items: center/);
  assert.match(stylesSource, /\.overlay\.dialogue-open \.vn[\s\S]*max-height/);
  assert.match(stylesSource, /\.overlay \.modal\.reflection-choice[\s\S]*max-height/);
});
