import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { deletePdfPages, parsePageRange, parsePdfPageOperation, pdfOutputFilename, compressionReport } from "../src/systems/PdfToolkit.js";

test("PDF page ranges preserve requested order and reject unsafe input", () => {
  assert.deepEqual(parsePageRange("3, 1-2", 4), [3, 1, 2]);
  assert.throws(() => parsePageRange("0", 4));
  assert.throws(() => parsePageRange("2-9", 4));
  assert.throws(() => parsePageRange("wat", 4));
});

test("PDF filenames and compression reporting stay honest", () => {
  assert.equal(pdfOutputFilename("report.pdf", "merged"), "report-merged.pdf");
  assert.deepEqual(compressionReport(1000, 1200), { originalBytes: 1000, resultBytes: 1200, changePercent: 20, message: "Result is 20% larger" });
});

test("PDF delete commands strip the operation prefix before parsing", () => {
  assert.deepEqual(parsePdfPageOperation("delete:2", 3), { deleteMode: true, pages: [2] });
  assert.deepEqual(parsePdfPageOperation("DELETE: 1, 3-4", 4), { deleteMode: true, pages: [1, 3, 4] });
  assert.deepEqual(parsePdfPageOperation("1, 3", 3), { deleteMode: false, pages: [1, 3] });
});

test("PDF delete exports an openable document with one or multiple pages removed", async () => {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.create();
  source.addPage([100, 100]);
  source.addPage([100, 100]);
  source.addPage([100, 100]);
  const sourceBytes = await source.save();
  const file = new Blob([sourceBytes as unknown as ArrayBuffer], { type: "application/pdf" });
  const oneRemoved = await deletePdfPages(file, parsePdfPageOperation("delete:2", 3).pages);
  const twoRemoved = await deletePdfPages(file, parsePdfPageOperation("delete:1,3", 3).pages);
  assert.equal((await PDFDocument.load(oneRemoved)).getPageCount(), 2);
  assert.equal((await PDFDocument.load(twoRemoved)).getPageCount(), 1);
});

test("PDF.js worker is configured locally and emitted by the browser build", () => {
  const source = readFileSync(resolve(process.cwd(), "src/systems/PdfToolkit.ts"), "utf8");
  assert.match(source, /GlobalWorkerOptions\.workerSrc/);
  assert.match(source, /new URL\("\.\/pdf\.worker\.mjs", import\.meta\.url\)/);
  assert.ok(existsSync(resolve(process.cwd(), "dist/browser/pdf.worker.mjs")));
});

test("PDF processing is cancellable, bounded, and protected from stale jobs", () => {
  const source = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");
  assert.match(source, /pdfAbortController\?\.abort/);
  assert.match(source, /label: "PDF processing"/);
  assert.match(source, /timeoutMs: 120_000/);
  assert.match(source, /this\.pdfAbortController !== controller/);
  assert.match(source, /PDF processing cancelled/);
});
