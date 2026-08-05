import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const exportHtmlPath = join(
  process.cwd(),
  "apps",
  "web",
  "public",
  "game",
  "index.html",
);

let html = readFileSync(exportHtmlPath, "utf8");

const replacements = [
  [
    "<style>",
    `<style>
html, body {
	width: 100%;
	height: 100%;
}`,
  ],
  [
    "background-color: black;",
    "background-color: #08101d;",
  ],
  [
    "#canvas {",
    `#canvas {
	width: 100vw !important;
	height: 100vh !important;`,
  ],
];

for (const [needle, replacement] of replacements) {
  if (html.includes(replacement)) {
    continue;
  }
  if (!html.includes(needle)) {
    throw new Error(`Godot export shell patch target not found: ${needle}`);
  }
  html = html.replace(needle, replacement);
}

writeFileSync(exportHtmlPath, html);
