import assert from "node:assert/strict";
import test from "node:test";
import { parsePageRange, pdfOutputFilename, compressionReport } from "../src/systems/PdfToolkit.js";

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
