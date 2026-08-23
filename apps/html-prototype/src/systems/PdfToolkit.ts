export type CompressionReport = {
  originalBytes: number;
  resultBytes: number;
  changePercent: number;
  message: string;
};

export function parsePageRange(value: string, totalPages: number): number[] {
  if (!Number.isInteger(totalPages) || totalPages < 1) throw new Error("PDF has no pages");
  const pages: number[] = [];
  for (const part of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    const range = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!range) throw new Error("Use page numbers such as 1, 3-5");
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : start;
    if (start < 1 || end < start || end > totalPages) throw new Error("Page range is outside this PDF");
    for (let page = start; page <= end; page += 1) if (!pages.includes(page)) pages.push(page);
  }
  if (!pages.length) throw new Error("Choose at least one page");
  return pages;
}

export function parsePdfPageOperation(value: string, totalPages: number): { deleteMode: boolean; pages: number[] } {
  const trimmed = value.trim();
  const deleteMode = /^delete\s*:/i.test(trimmed);
  const expression = deleteMode ? trimmed.replace(/^delete\s*:/i, "").trim() : trimmed;
  return { deleteMode, pages: parsePageRange(expression, totalPages) };
}

export function pdfOutputFilename(sourceName: string, suffix: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "document";
  return `${base}-${suffix}.pdf`;
}

export function compressionReport(originalBytes: number, resultBytes: number): CompressionReport {
  const changePercent = originalBytes > 0 ? Math.round(((resultBytes - originalBytes) / originalBytes) * 100) : 0;
  return {
    originalBytes,
    resultBytes,
    changePercent,
    message: changePercent < 0 ? `Reduced by ${Math.abs(changePercent)}%` : changePercent > 0 ? `Result is ${changePercent}% larger` : "Same file size"
  };
}

export async function mergePdfFiles(files: Blob[]): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  return output.save();
}

export async function reorderOrExtractPdf(file: Blob, pageNumbers: number[]): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(await file.arrayBuffer());
  const selected = pageNumbers.map((page) => page - 1);
  if (selected.some((page) => page < 0 || page >= source.getPageCount())) throw new Error("Page range is outside this PDF");
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, selected);
  pages.forEach((page) => output.addPage(page));
  return output.save();
}

export async function deletePdfPages(file: Blob, pageNumbersToDelete: number[]): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(await file.arrayBuffer());
  const remove = new Set(pageNumbersToDelete.map((page) => page - 1));
  const keep = source.getPageIndices().filter((page) => !remove.has(page));
  if (!keep.length) throw new Error("A PDF must keep at least one page");
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, keep);
  pages.forEach((page) => output.addPage(page));
  return output.save();
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const output = await PDFDocument.create();
  for (const file of files) {
    const image = await decodeImageForPdf(file);
    const embedded = file.type === "image/jpeg" ? await output.embedJpg(image.bytes) : await output.embedPng(image.bytes);
    const scale = Math.min(1, 595 / embedded.width, 842 / embedded.height);
    const page = output.addPage([embedded.width * scale, embedded.height * scale]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width * scale, height: embedded.height * scale });
  }
  return output.save();
}

async function decodeImageForPdf(file: File): Promise<{ bytes: ArrayBuffer; type: string }> {
  if (file.type !== "image/webp") return { bytes: await file.arrayBuffer(), type: file.type };
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), "image/png"));
  return { bytes: await blob.arrayBuffer(), type: "image/png" };
}

export async function pdfToPngImages(file: Blob, scale = 1.5): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.mjs", import.meta.url).href;
  const documentTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdfDocument = await documentTask.promise;
  const images: Blob[] = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
    images.push(await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), "image/png")));
  }
  return images;
}

export async function optimizePdf(file: Blob): Promise<{ bytes: Uint8Array; report: CompressionReport }> {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(await file.arrayBuffer());
  const bytes = await source.save({ useObjectStreams: true, addDefaultPage: false });
  return { bytes, report: compressionReport(file.size, bytes.byteLength) };
}
