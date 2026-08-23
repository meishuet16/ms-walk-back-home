import { reduceAudioPeaks, visibleDuration, type TrimTimelineState, type WaveformPeak } from "./WaveformModel.js";

export type DecodedWaveform = {
  durationMs: number;
  peaks: WaveformPeak[];
};

export async function decodeMediaWaveform(file: File, sampleCount = 1200, signal?: AbortSignal): Promise<DecodedWaveform> {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) throw new Error("Waveform preview is not supported by this browser");
  const context = new AudioContextConstructor();
  try {
    throwIfAborted(signal);
    const bytes = await file.arrayBuffer();
    throwIfAborted(signal);
    const buffer = await context.decodeAudioData(bytes.slice(0));
    throwIfAborted(signal);
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    return {
      durationMs: Math.max(1, Math.round(buffer.duration * 1000)),
      peaks: reduceAudioPeaks(channels, sampleCount)
    };
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Waveform loading cancelled", "AbortError");
    throw error;
  } finally {
    await context.close().catch(() => undefined);
  }
}

export function waveformPeaksInView(peaks: WaveformPeak[], timeline: TrimTimelineState): WaveformPeak[] {
  if (!peaks.length || timeline.durationMs <= 0) return [];
  const startIndex = Math.floor((timeline.viewportStartMs / timeline.durationMs) * peaks.length);
  const endIndex = Math.ceil(((timeline.viewportStartMs + visibleDuration(timeline)) / timeline.durationMs) * peaks.length);
  return peaks.slice(Math.max(0, startIndex), Math.min(peaks.length, Math.max(startIndex + 1, endIndex)));
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Waveform loading cancelled", "AbortError");
}






