import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT ?? 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const cleanPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const candidates = [
    join(root, "dist", cleanPath),
    join(root, "dist/public", cleanPath.replace(/^\/assets\//, "assets/"))
  ];
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, { "content-type": mime[extname(file)] ?? "application/octet-stream" });
  res.end(body);
}).listen(port, () => {
  console.log(`Walk Back Home HTML prototype running at http://localhost:${port}`);
});
