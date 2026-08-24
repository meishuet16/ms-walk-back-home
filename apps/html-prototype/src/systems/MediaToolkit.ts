import { runAbortableStage } from "./LocalJob.js";
export type MediaProcessingState = { status: "idle" | "processing" | "cancelled" | "complete" | "error"; progress: number; message: string };

export function normalizeTrimRange(start: number, end: number, duration: number): { start: number; end: number } {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Media duration is unavailable");
  if (Number(start) > duration || Number(end) > duration) throw new Error("Trim range exceeds media duration");
  const a = Math.max(0, Number(start) || 0);
  const b = Math.max(0, Math.min(duration, Number(end) || 0));
  const normalized = a <= b ? { start: a, end: b } : { start: b, end: a };
  if (normalized.end <= normalized.start) throw new Error("End must be after start");
  return normalized;
}

export function mediaOutputFilename(sourceName: string, suffix: string, extension: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "media";
  return `${base}-${suffix}.${extension.replace(/^\./, "")}`;
}

export function createMediaProcessingState(): MediaProcessingState {
  return { status: "idle", progress: 0, message: "" };
}

export function cancelMediaProcessing(state: MediaProcessingState): MediaProcessingState {
  return { ...state, status: "cancelled", message: "Cancelled" };
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}

export type MediaOperation = "extract-audio" | "convert-audio" | "trim-audio" | "trim-video";

async function processMediaFileLegacy(
  file: File,
  operation: MediaOperation,
  options: { start?: number; end?: number; duration?: number; format?: "mp3" | "wav" | "ogg"; signal?: AbortSignal; onProgress?: (progress: number) => void } = {}
): Promise<{ blob: Blob; extension: string }> {
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
  const ffmpeg = new FFmpeg();
  const coreBase = new URL("./ffmpeg/", import.meta.url).href;
  await ffmpeg.load({
    coreURL: await toBlobURL(`${coreBase}ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${coreBase}ffmpeg-core.wasm`, "application/wasm")
  });
  const inputName = `input-${Date.now()}${extensionFor(file.name)}`;
  const extension = options.format ?? (operation === "trim-video" ? "webm" : "mp3");
  const outputName = `output.${extension}`;
  const onProgress = (event: { progress: number }) => options.onProgress?.(Math.max(0, Math.min(1, event.progress)));
  ffmpeg.on("progress", onProgress);
  options.signal?.addEventListener("abort", () => ffmpeg.terminate(), { once: true });
  try {
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    const range = options.start !== undefined && options.end !== undefined ? normalizeTrimRange(options.start, options.end, options.duration ?? options.end) : null;
    const args = operation === "extract-audio"
      ? ["-i", inputName, "-vn", "-acodec", codecFor(extension), outputName]
      : operation === "convert-audio"
        ? ["-i", inputName, "-acodec", codecFor(extension), outputName]
        : operation === "trim-audio"
          ? ["-ss", String(range?.start ?? 0), "-to", String(range?.end ?? 1), "-i", inputName, "-vn", "-acodec", codecFor(extension), outputName]
          : ["-ss", String(range?.start ?? 0), "-to", String(range?.end ?? 1), "-i", inputName, "-c:v", "libvpx", "-c:a", "libvorbis", outputName];
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return { blob: new Blob([bytes.buffer as ArrayBuffer], { type: mimeFor(extension) }), extension };
  } finally {
    ffmpeg.terminate();
  }
}

export function mediaCommandArgs(
  inputName: string,
  outputName: string,
  operation: MediaOperation,
  extension: string,
  range?: { start: number; end: number }
): string[] {
  if ((operation === "trim-audio" || operation === "trim-video") && !range) throw new Error("Choose a valid trim range");
  const seek = range
    ? ["-ss", formatMediaSeconds(range.start), "-t", formatMediaSeconds(range.end - range.start)]
    : [];
  if (operation === "extract-audio") return [...seek, "-i", inputName, "-vn", "-acodec", codecFor(extension), outputName];
  if (operation === "convert-audio") return [...seek, "-i", inputName, "-acodec", codecFor(extension), outputName];
  if (operation === "trim-audio") {
    return [...seek, "-i", inputName, "-vn", "-acodec", codecFor(extension), outputName];
  }
  return [...seek, "-i", inputName, "-c:v", "libvpx", "-c:a", "libvorbis", outputName];
}

function formatMediaSeconds(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export async function processMediaFile(
  file: File,
  operation: MediaOperation,
  options: { start?: number; end?: number; duration?: number; format?: "mp3" | "wav" | "ogg"; signal?: AbortSignal; onProgress?: (progress: number) => void } = {}
): Promise<{ blob: Blob; extension: string }> {
  throwIfAborted(options.signal);
  const [{ FFmpeg }, { toBlobURL }] = await runAbortableStage({
    label: "Media engine modules",
    timeoutMs: 15_000,
    parentSignal: options.signal,
    run: async () => Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")])
  });
  const ffmpeg = new FFmpeg();
  const terminate = (): void => ffmpeg.terminate();
  options.signal?.addEventListener("abort", terminate, { once: true });
  const token = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  const inputName = `input-${token}${extensionFor(file.name)}`;
  const extension = options.format ?? (operation === "trim-video" ? "webm" : "mp3");
  const outputName = `output-${token}.${extension}`;
  const onProgress = (event: { progress: number }) => options.onProgress?.(Math.max(0, Math.min(1, event.progress)));
  ffmpeg.on("progress", onProgress);
  try {
    const coreBase = new URL("./ffmpeg/", import.meta.url).href;
    await runAbortableStage({
      label: "Media engine",
      timeoutMs: 45_000,
      parentSignal: options.signal,
      run: async (signal) => {
        signal.addEventListener("abort", terminate, { once: true });
        try {
          const [coreURL, wasmURL] = await Promise.all([
            toBlobURL(`${coreBase}ffmpeg-core.js`, "text/javascript"),
            toBlobURL(`${coreBase}ffmpeg-core.wasm`, "application/wasm")
          ]);
          throwIfAborted(signal);
          await ffmpeg.load({ coreURL, wasmURL });
        } finally {
          signal.removeEventListener("abort", terminate);
        }
      }
    });
    const inputBytes = await runAbortableStage({
      label: "Reading media",
      timeoutMs: 30_000,
      parentSignal: options.signal,
      run: async () => new Uint8Array(await file.arrayBuffer())
    });
    await runAbortableStage({
      label: "Writing media",
      timeoutMs: 30_000,
      parentSignal: options.signal,
      run: async (signal) => {
        signal.addEventListener("abort", terminate, { once: true });
        try {
          await ffmpeg.writeFile(inputName, inputBytes);
        } finally {
          signal.removeEventListener("abort", terminate);
        }
      }
    });
    const range = options.start !== undefined && options.end !== undefined
      ? normalizeTrimRange(options.start, options.end, options.duration ?? options.end)
      : undefined;
    const args = mediaCommandArgs(inputName, outputName, operation, extension, range);
    const exitCode = await runAbortableStage({
      label: "Media export",
      timeoutMs: 300_000,
      parentSignal: options.signal,
      run: async (signal) => {
        signal.addEventListener("abort", terminate, { once: true });
        try {
          return await ffmpeg.exec(args);
        } finally {
          signal.removeEventListener("abort", terminate);
        }
      }
    });
    if (exitCode !== 0) throw new Error("Media export failed with code " + exitCode);
    const data = await runAbortableStage({
      label: "Reading exported media",
      timeoutMs: 30_000,
      parentSignal: options.signal,
      run: async () => ffmpeg.readFile(outputName)
    });
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return { blob: new Blob([bytes.buffer as ArrayBuffer], { type: mimeFor(extension) }), extension };
  } finally {
    options.signal?.removeEventListener("abort", terminate);
    ffmpeg.off("progress", onProgress);
    ffmpeg.terminate();
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw signal.reason ?? new DOMException("Cancelled", "AbortError");
}

function extensionFor(name: string): string {
  const match = /\.[a-z0-9]+$/i.exec(name);
  return match?.[0] ?? ".bin";
}

function codecFor(extension: string): string {
  return extension === "wav" ? "pcm_s16le" : extension === "ogg" ? "libvorbis" : "libmp3lame";
}

function mimeFor(extension: string): string {
  return extension === "wav" ? "audio/wav" : extension === "ogg" ? "audio/ogg" : extension === "webm" ? "video/webm" : "audio/mpeg";
}
