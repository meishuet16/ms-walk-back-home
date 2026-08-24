import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderReflection } from "../src/systems/PresentationRenderer.js";

test("ending reflection does not render identical lead and closure lines twice", () => {
  const lines = ["canonical-lead-one", "canonical-lead-two"];
  const markup = renderReflection({
    kicker: "2026-06-24 - THE STUDY TABLE",
    title: "06.24 - Only Came Here for You",
    leadLines: lines,
    closureLines: lines,
    quoteLines: ["selected-quote", lines[1]],
    lines,
    afterline: "Some places do not ask us to make them dramatic.",
    actions: ""
  });
  assert.equal(markup.match(/canonical-lead-one/g)?.length, 1);
  assert.match(markup, /class="memory-line"/);
});

test("ending reflection lead text uses a readable accent color", () => {
  const stylesSource = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");
  assert.match(stylesSource, /\.reflection \.memory-line[\s\S]*color:\s*#f0d49a/i);
});
