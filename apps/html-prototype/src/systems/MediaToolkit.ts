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

export async function processMediaFile(
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
    try { await ffmpeg.deleteFile(inputName); } catch {}
    try { await ffmpeg.deleteFile(outputName); } catch {}
    ffmpeg.terminate();
  }
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
