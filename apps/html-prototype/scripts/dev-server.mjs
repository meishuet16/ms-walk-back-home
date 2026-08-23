import { createServer } from "node:http";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { networkInterfaces } from "node:os";

const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT ?? 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".lrc": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const sceneRoot = resolve(root, "public/scene-layouts");
const servedSceneRoot = resolve(root, "dist/scene-layouts");
const distSceneRoot = resolve(root, "dist/public/scene-layouts");
const assetsRoot = resolve(root, "public/assets");

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  if (url.pathname.startsWith("/__debug/")) {
    await handleDebugRequest(req, res, url);
    return;
  }
  const cleanPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
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
  res.writeHead(200, { "content-type": mime[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  res.end(body);
}).listen(port, "0.0.0.0", () => {
  console.log(`Walk Back Home HTML prototype running at http://localhost:${port}`);
   for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        console.log(`LAN: http://${address.address}:${port}`);
      }
    }
  }
});

async function handleDebugRequest(req, res, url) {
  if (!isLocalhost(req)) return sendJson(res, 403, { error: "Debug writes are localhost-only." });
  if (process.env.NODE_ENV === "production") return sendJson(res, 403, { error: "Debug endpoints are disabled in production." });
  try {
    if (req.method === "GET" && url.pathname === "/__debug/scene-layout") {
      const sceneId = sanitizeSceneId(url.searchParams.get("sceneId") ?? "");
      const orientation = sanitizeOrientation(url.searchParams.get("orientation") ?? "");
      const file = resolveSceneFile(sceneId, orientation);
      if (!existsSync(file)) return sendJson(res, 404, { error: "Layout not saved yet." });
      return sendJson(res, 200, JSON.parse(await readFile(file, "utf8")));
    }
    if (req.method === "POST" && url.pathname === "/__debug/save-scene-layout") {
      const body = await readJson(req);
      const layout = sanitizeLayout(body?.layout);
      await writeLayout(layout);
      await upsertManifestScene(layout.sceneId, layout.label);
      return sendJson(res, 200, { ok: true, layout });
    }
    if (req.method === "GET" && url.pathname === "/__debug/assets") {
      return sendJson(res, 200, { assets: await listProjectAssets() });
    }
    if (req.method === "POST" && url.pathname === "/__debug/add-scene") {
      const body = await readJson(req);
      const sceneId = sanitizeSceneId(body?.sceneId ?? "");
      const label = sanitizeLabel(body?.label ?? sceneId);
      const orientation = sanitizeOrientation(body?.orientation ?? "landscape");
      if (!sceneId) return sendJson(res, 400, { error: "Scene ID is required." });
      const targetFile = resolveSceneFile(sceneId, orientation);
      if (existsSync(targetFile)) {
        return sendJson(res, 409, { error: "Scene identity already exists.", existing: true, sceneId, orientation });
      }
      const landscape = orientation === "landscape" ? makeDefaultLayout(sceneId, label, "landscape") : makeDefaultLayout(sceneId, label, "landscape");
      const portrait = orientation === "portrait" ? makeDefaultLayout(sceneId, label, "portrait") : makeDefaultLayout(sceneId, label, "portrait");
      await writeLayout(orientation === "landscape" ? landscape : portrait);
      await upsertManifestScene(sceneId, label);
      return sendJson(res, 200, { ok: true, scene: { id: sceneId, label }, orientation, layouts: { landscape, portrait } });
    }
    return sendJson(res, 404, { error: "Unknown debug endpoint." });
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Debug request failed." });
  }
}

function isLocalhost(req) {
  const remote = req.socket.remoteAddress ?? "";
  const host = req.headers.host ?? "";
  return ["::1", "127.0.0.1", "::ffff:127.0.0.1"].includes(remote) || host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sanitizeSceneId(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

function sanitizeOrientation(value) {
  if (value !== "landscape" && value !== "portrait") throw new Error("Invalid orientation.");
  return value;
}

function sanitizeLabel(value) {
  return String(value ?? "").trim().replace(/[<>]/g, "").slice(0, 80);
}

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function rect(value) {
  return { x: finite(value?.x, 0), y: finite(value?.y, 0), w: Math.max(1, finite(value?.w, 1)), h: Math.max(1, finite(value?.h, 1)) };
}

function point(value, fallback = { x: 0, y: 0 }) {
  return { x: finite(value?.x, fallback.x), y: finite(value?.y, fallback.y) };
}

function placementSlot(value) {
  const kind = value?.kind === "fragment" ? "fragment" : "chapter";
  return {
    id: sanitizeSceneId(value?.id ?? `${kind}-slot`),
    kind,
    x: finite(value?.x, 0),
    y: finite(value?.y, 0),
    radius: Math.max(1, finite(value?.radius, kind === "fragment" ? 44 : 86))
  };
}

function echoAnchor(value) {
  return {
    x: finite(value?.x, 0),
    y: finite(value?.y, 0),
    radius: Math.max(1, finite(value?.radius, 56))
  };
}

function sanitizeLayout(value) {
  const sceneId = sanitizeSceneId(value?.sceneId ?? "");
  const orientation = sanitizeOrientation(value?.orientation);
  if (!sceneId) throw new Error("Scene ID is required.");
  return {
    sceneId,
    label: sanitizeLabel(value?.label ?? sceneId),
    orientation,
    asset: sanitizeAsset(value?.asset ?? ""),
    size: { w: Math.max(1, finite(value?.size?.w, orientation === "portrait" ? 941 : 960)), h: Math.max(1, finite(value?.size?.h, orientation === "portrait" ? 1672 : 540)) },
    spawn: point(value?.spawn, { x: 0, y: 0 }),
    obstacles: Array.isArray(value?.obstacles) ? value.obstacles.map(rect) : [],
    interactions: Array.isArray(value?.interactions) ? value.interactions.map((item) => ({
      id: sanitizeSceneId(item?.id ?? "interaction"),
      label: sanitizeLabel(item?.label ?? item?.id ?? "Interaction"),
      x: finite(item?.x, 0),
      y: finite(item?.y, 0),
      radius: Math.max(1, finite(item?.radius, 48))
    })) : [],
    triggers: Array.isArray(value?.triggers) ? value.triggers.map((item) => ({
      id: sanitizeSceneId(item?.id ?? "trigger"),
      rect: rect(item?.rect),
      chapterId: sanitizeSceneId(item?.chapterId ?? ""),
      eventId: sanitizeSceneId(item?.eventId ?? ""),
      once: Boolean(item?.once)
    })) : [],
    placementSlots: Array.isArray(value?.placementSlots) ? value.placementSlots.map(placementSlot) : [],
    echoAnchors: value?.echoAnchors && typeof value.echoAnchors === "object"
      ? Object.fromEntries(Object.entries(value.echoAnchors).map(([key, val]) => [sanitizeSceneId(key), echoAnchor(val)]))
      : {},
    anchors: value?.anchors && typeof value.anchors === "object"
      ? Object.fromEntries(Object.entries(value.anchors).map(([key, val]) => [sanitizeSceneId(key), point(val)]))
      : {}
  };
}

function sanitizeAsset(value) {
  const asset = String(value ?? "").trim().replace(/\\/g, "/");
  if (!asset || asset.includes("..") || asset.startsWith("/") || /^[a-z]+:/i.test(asset)) throw new Error("Invalid asset path.");
  return asset;
}

function resolveSceneFile(sceneId, orientation, base = sceneRoot) {
  const file = resolve(base, sceneId, `${orientation}.json`);
  if (!file.startsWith(resolve(base))) throw new Error("Invalid layout path.");
  return file;
}

async function writeLayout(layout) {
  for (const base of [sceneRoot, servedSceneRoot, distSceneRoot]) {
    const file = resolveSceneFile(layout.sceneId, layout.orientation, base);
    await mkdir(resolve(base, layout.sceneId), { recursive: true });
    await writeFile(file, `${JSON.stringify(layout, null, 2)}\n`);
  }
}

async function upsertManifestScene(sceneId, label) {
  const manifest = existsSync(resolve(sceneRoot, "manifest.json"))
    ? JSON.parse(await readFile(resolve(sceneRoot, "manifest.json"), "utf8"))
    : { scenes: [] };
  const scenes = Array.isArray(manifest.scenes) ? manifest.scenes.filter((scene) => sanitizeSceneId(scene.id) !== sceneId) : [];
  scenes.push({ id: sceneId, label });
  scenes.sort((a, b) => a.label.localeCompare(b.label));
  const next = { scenes };
  for (const base of [sceneRoot, servedSceneRoot, distSceneRoot]) {
    await mkdir(base, { recursive: true });
    await writeFile(resolve(base, "manifest.json"), `${JSON.stringify(next, null, 2)}\n`);
  }
}

function makeDefaultLayout(sceneId, label, orientation) {
  const size = orientation === "portrait" ? { w: 941, h: 1672 } : { w: 960, h: 540 };
  return {
    sceneId,
    label,
    orientation,
    asset: `assets/scenes/${sceneId}-${orientation}.png`,
    size,
    spawn: { x: size.w / 2, y: size.h / 2 },
    obstacles: [],
    interactions: [],
    triggers: [],
    placementSlots: [],
    echoAnchors: {},
    anchors: {}
  };
}

async function listProjectAssets() {
  const results = [];
  async function visit(directory, prefix) {
    if (!existsSync(directory)) return;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);
      const relative = prefix ? prefix + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await visit(absolute, relative);
      else if (/\.(png|webp|jpg|jpeg)$/i.test(entry.name)) results.push("assets/" + relative.replace(/\\/g, "/"));
    }
  }
  await visit(assetsRoot, "");
  return results.sort();
}
function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
