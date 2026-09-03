import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sourceRoot = join(appRoot, "src");

test("the native shell opts into cutout-aware viewport sizing", () => {
  const index = readFileSync(join(sourceRoot, "index.html"), "utf8");
  const styles = readFileSync(join(sourceRoot, "styles.css"), "utf8");

  assert.match(index, /viewport-fit=cover/);
  assert.match(styles, /\.game-shell\.native-fullscreen/);
});

test("safe-area env values retain Capacitor CSS-variable fallbacks", () => {
  const cssFiles = readdirSync(sourceRoot).filter((file) => file.endsWith(".css"));
  for (const file of cssFiles) {
    const css = readFileSync(join(sourceRoot, file), "utf8");
    for (const edge of ["top", "right", "bottom", "left"]) {
      if (!css.includes(`env(safe-area-inset-${edge}`)) continue;
      assert.match(css, new RegExp(`var\\(--safe-area-inset-${edge}, env\\(safe-area-inset-${edge}, 0px\\)\\)`), file);
    }
  }
});
