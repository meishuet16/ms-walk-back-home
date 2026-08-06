import { cp, mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
await mkdir(resolve(root, "dist/public"), { recursive: true });
await cp(resolve(root, "public"), resolve(root, "dist/public"), { recursive: true });
await copyFile(resolve(root, "src/index.html"), resolve(root, "dist/index.html"));
await copyFile(resolve(root, "src/styles.css"), resolve(root, "dist/styles.css"));
console.log("Built isolated HTML prototype to apps/html-prototype/dist");
