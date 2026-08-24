export type WaveformPeak = { min: number; max: number };
export type TrimTimelineState = { durationMs: number; startMs: number; endMs: number; playheadMs: number; zoom: number; viewportStartMs: number };

export function createTrimTimeline(durationMs: number): TrimTimelineState {
  const duration = positiveMilliseconds(durationMs);
  return { durationMs: duration, startMs: 0, endMs: duration, playheadMs: 0, zoom: 1, viewportStartMs: 0 };
}

export function setTrimBoundary(state: TrimTimelineState, boundary: "start" | "end", valueMs: number): TrimTimelineState {
  const value = clampMilliseconds(valueMs, 0, state.durationMs);
  if (boundary === "start") {
    if (value >= state.endMs) throw new Error("Start must be before end");
    return { ...state, startMs: value, playheadMs: value };
  }
  if (value <= state.startMs) throw new Error("End must be after start");
  return { ...state, endMs: value, playheadMs: Math.min(state.playheadMs, value) };
}

export function setPlayhead(state: TrimTimelineState, valueMs: number): TrimTimelineState {
  return { ...state, playheadMs: clampMilliseconds(valueMs, 0, state.durationMs) };
}

export function parseTimelineTime(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a time");
  const parts = trimmed.split(":");
  const seconds = parts.length === 1 ? Number(parts[0]) : parts.length === 2 ? Number(parts[0]) * 60 + Number(parts[1]) : Number.NaN;
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error("Use mm:ss.mmm");
  return Math.round(seconds * 1000);
}

export function formatTimelineTime(valueMs: number): string {
  const total = Math.max(0, Math.round(valueMs));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const milliseconds = total % 1000;
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(milliseconds).padStart(3, "0");
}

export function reduceAudioPeaks(channels: readonly Float32Array[], bucketCount: number): WaveformPeak[] {
  const length = channels.reduce((smallest, channel) => Math.min(smallest, channel.length), Number.POSITIVE_INFINITY);
  if (!channels.length || !Number.isFinite(length) || length <= 0) return [];
  const count = Math.max(1, Math.min(Math.floor(bucketCount), length));
  return Array.from({ length: count }, (_, bucket) => {
    const from = Math.floor(bucket * length / count);
    const to = Math.max(from + 1, Math.floor((bucket + 1) * length / count));
    let min = 1;
    let max = -1;
    for (let index = from; index < to; index += 1) {
      let sample = 0;
      for (const channel of channels) sample += channel[index] ?? 0;
      sample /= channels.length;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }
    return { min, max };
  });
}

export function timeAtPixel(state: TrimTimelineState, pixel: number, width: number): number {
  const safeWidth = Math.max(1, width);
  const ratio = Math.max(0, Math.min(1, pixel / safeWidth));
  return clampMilliseconds(state.viewportStartMs + visibleDuration(state) * ratio, 0, state.durationMs);
}

export function zoomTimeline(state: TrimTimelineState, zoom: number): TrimTimelineState {
  const nextZoom = Math.max(1, Math.min(32, zoom));
  const oldVisible = visibleDuration(state);
  const relativeAnchor = oldVisible > 0 ? (state.playheadMs - state.viewportStartMs) / oldVisible : .5;
  const nextVisible = state.durationMs / nextZoom;
  const nextStart = state.playheadMs - Math.max(0, Math.min(1, relativeAnchor)) * nextVisible;
  return { ...state, zoom: nextZoom, viewportStartMs: clampViewport(nextStart, state.durationMs, nextZoom) };
}

export function panTimeline(state: TrimTimelineState, deltaMs: number): TrimTimelineState {
  return { ...state, viewportStartMs: clampViewport(state.viewportStartMs + deltaMs, state.durationMs, state.zoom) };
}

export function timelineKeyboardStep(modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): number {
  if (modifiers.ctrlKey || modifiers.metaKey) return 100;
  if (modifiers.shiftKey) return 10;
  return 1;
}

export function visibleDuration(state: TrimTimelineState): number {
  return state.durationMs / state.zoom;
}

function positiveMilliseconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error("Media duration is unavailable");
  return Math.max(1, Math.round(value));
}

function clampMilliseconds(value: number, min: number, max: number): number {
  const finite = Number.isFinite(value) ? Math.round(value) : min;
  return Math.max(min, Math.min(max, finite));
}

function clampViewport(value: number, durationMs: number, zoom: number): number {
  const max = Math.max(0, durationMs - durationMs / zoom);
  return clampMilliseconds(value, 0, max);
}
