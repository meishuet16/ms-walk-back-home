import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { exportBlob, nativeExportStatus, type BlobExportDependencies } from "../src/systems/BlobExport.js";

const repoRoot = resolve(process.cwd(), "..", "..");

test("Android manifest declares microphone permission for WebView audio capture", () => {
  const manifest = readFileSync(resolve(repoRoot, "android", "app", "src", "main", "AndroidManifest.xml"), "utf8");
  assert.match(manifest, /android\.permission\.RECORD_AUDIO/);
});

test("native Blob export completes the native handoff before reporting ready-to-save", async () => {
  const calls: string[] = [];
  const dependencies: BlobExportDependencies = {
    isNativeAndroid: () => true,
    saveOrShareNative: async (blob, filename) => {
      calls.push(`native:${filename}:${blob.type}`);
    },
    downloadInBrowser: () => calls.push("browser")
  };

  const result = await exportBlob(new Blob(["audio"], { type: "audio/mp4" }), "voice.mp4", dependencies);

  assert.deepEqual(calls, ["native:voice.mp4:audio/mp4"]);
  assert.deepEqual(result, { native: true, filename: "voice.mp4" });
  assert.equal(nativeExportStatus(result.filename), "Ready to save or share voice.mp4");
});

test("web Blob export keeps the browser download path", async () => {
  const calls: string[] = [];
  const dependencies: BlobExportDependencies = {
    isNativeAndroid: () => false,
    saveOrShareNative: async () => { calls.push("native"); },
    downloadInBrowser: (blob, filename) => calls.push(`browser:${filename}:${blob.type}`)
  };

  const result = await exportBlob(new Blob(["pdf"], { type: "application/pdf" }), "journal.pdf", dependencies);

  assert.deepEqual(calls, ["browser:journal.pdf:application/pdf"]);
  assert.deepEqual(result, { native: false, filename: "journal.pdf" });
});

test("native Blob export propagates a failed save/share handoff", async () => {
  await assert.rejects(
    exportBlob(new Blob(["data"]), "failed.bin", {
      isNativeAndroid: () => true,
      saveOrShareNative: async () => { throw new Error("share unavailable"); },
      downloadInBrowser: () => undefined
    }),
    /share unavailable/
  );
});
