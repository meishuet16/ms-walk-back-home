export type MediaStreamTrackLike = {
  stop(): void;
};

export type MediaStreamLike = {
  getTracks(): MediaStreamTrackLike[];
};

export type MediaRecorderEvent = {
  data?: Blob;
  error?: Error;
};

export type MediaRecorderLike = {
  state: "inactive" | "recording" | "paused";
  mimeType?: string;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  addEventListener(type: "dataavailable" | "stop" | "error", listener: (event: MediaRecorderEvent) => void): void;
};

export type JournalAudioRecorderDependencies = {
  getUserMedia: (constraints: { audio: true }) => Promise<MediaStreamLike>;
  createRecorder: (stream: MediaStreamLike, mimeType?: string) => MediaRecorderLike;
  isTypeSupported?: (mimeType: string) => boolean;
  now?: () => number;
};

const audioRecordingMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus"
];

export function selectSupportedAudioMimeType(isTypeSupported = defaultIsTypeSupported): string | undefined {
  return audioRecordingMimeTypes.find((mimeType) => isTypeSupported(mimeType));
}

export class JournalAudioRecorder {
  private stream: MediaStreamLike | null = null;
  private recorder: MediaRecorderLike | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private pausedAt: number | null = null;
  private pausedElapsed = 0;
  private stopPromise: Promise<{ blob: Blob; mimeType: string; duration: number }> | null = null;

  constructor(private readonly dependencies: JournalAudioRecorderDependencies = browserDependencies()) {}

  async start(): Promise<void> {
    if (this.isActive()) throw new Error("Audio recording is already active.");
    if (!this.dependencies.getUserMedia || !this.dependencies.createRecorder) throw new Error("Audio recording is unavailable in this browser.");
    const stream = await this.dependencies.getUserMedia({ audio: true });
    const mimeType = selectSupportedAudioMimeType(this.dependencies.isTypeSupported ?? defaultIsTypeSupported);
    try {
      const recorder = this.dependencies.createRecorder(stream, mimeType);
      this.stream = stream;
      this.recorder = recorder;
      this.chunks = [];
      this.startedAt = this.clock();
      this.pausedAt = null;
      this.pausedElapsed = 0;
      this.stopPromise = new Promise((resolve, reject) => {
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data && event.data.size > 0) this.chunks.push(event.data);
        });
        recorder.addEventListener("error", (event) => reject(event.error ?? new Error("Audio recording failed.")));
        recorder.addEventListener("stop", () => {
          const actualMimeType = recorder.mimeType || mimeType || this.chunks[0]?.type || "application/octet-stream";
          const blob = new Blob(this.chunks, { type: actualMimeType });
          resolve({ blob, mimeType: blob.type || actualMimeType, duration: this.elapsedMs() / 1000 });
        });
      });
      recorder.start();
    } catch (error) {
      stopTracks(stream);
      this.reset();
      throw error;
    }
  }

  async stop(): Promise<{ blob: Blob; mimeType: string; duration: number }> {
    const recorder = this.recorder;
    const stopPromise = this.stopPromise;
    if (!recorder || !stopPromise) throw new Error("Audio recording is not active.");
    if (recorder.state !== "inactive") recorder.stop();
    try {
      return await stopPromise;
    } finally {
      this.cleanupTracks();
      this.reset();
    }
  }

  pause(): void {
    if (!this.recorder || this.recorder.state !== "recording") return;
    this.pausedAt = this.clock();
    this.recorder.pause();
  }

  resume(): void {
    if (!this.recorder || this.recorder.state !== "paused" || this.pausedAt === null) return;
    this.pausedElapsed += this.clock() - this.pausedAt;
    this.pausedAt = null;
    this.recorder.resume();
  }

  cancel(): void {
    const recorder = this.recorder;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Track cleanup below is the important cancellation guarantee.
      }
    }
    this.cleanupTracks();
    this.reset();
  }

  isActive(): boolean {
    return Boolean(this.recorder && this.recorder.state !== "inactive");
  }

  state(): "inactive" | "recording" | "paused" {
    return this.recorder?.state ?? "inactive";
  }

  elapsedMs(): number {
    if (!this.startedAt) return 0;
    const end = this.pausedAt ?? this.clock();
    return Math.max(0, end - this.startedAt - this.pausedElapsed);
  }

  private cleanupTracks(): void {
    if (this.stream) stopTracks(this.stream);
  }

  private reset(): void {
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    this.startedAt = 0;
    this.pausedAt = null;
    this.pausedElapsed = 0;
    this.stopPromise = null;
  }

  private clock(): number {
    return this.dependencies.now?.() ?? Date.now();
  }
}

function browserDependencies(): JournalAudioRecorderDependencies {
  return {
    getUserMedia: async (constraints) => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Audio recording is unavailable in this browser.");
      return navigator.mediaDevices.getUserMedia(constraints) as Promise<MediaStreamLike>;
    },
    createRecorder: (stream, mimeType) => {
      if (typeof MediaRecorder === "undefined") throw new Error("Audio recording is unavailable in this browser.");
      const nativeStream = stream as MediaStream;
      return (mimeType ? new MediaRecorder(nativeStream, { mimeType }) : new MediaRecorder(nativeStream)) as unknown as MediaRecorderLike;
    },
    isTypeSupported: (mimeType) => typeof MediaRecorder !== "undefined" && (!MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(mimeType)),
    now: () => performance.now()
  };
}

function defaultIsTypeSupported(mimeType: string): boolean {
  return typeof MediaRecorder !== "undefined" && (!MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(mimeType));
}

function stopTracks(stream: MediaStreamLike): void {
  for (const track of stream.getTracks()) track.stop();
}
