export type LocalJobPhase =
  | "idle"
  | "validating"
  | "loading-engine"
  | "processing"
  | "success"
  | "error"
  | "cancelled";

export type LocalJobState = {
  id: number;
  phase: LocalJobPhase;
  progress: number;
  message: string;
};

export function createLocalJobState(): LocalJobState {
  return { id: 0, phase: "idle", progress: 0, message: "" };
}

export function beginLocalJob(
  previous: LocalJobState,
  phase: "validating" | "loading-engine",
  message: string
): LocalJobState {
  return { id: previous.id + 1, phase, progress: 0, message };
}

export function advanceLocalJob(
  state: LocalJobState,
  id: number,
  phase: "loading-engine" | "processing",
  message: string,
  progress = state.progress
): LocalJobState {
  if (id !== state.id) return state;
  return { ...state, phase, message, progress: clampProgress(progress) };
}

export function settleLocalJob(
  state: LocalJobState,
  id: number,
  phase: "success" | "error" | "cancelled",
  message: string
): LocalJobState {
  if (id !== state.id) return state;
  return { ...state, phase, message, progress: phase === "success" ? 1 : state.progress };
}

export function localJobIsCurrent(state: LocalJobState, id: number): boolean {
  return state.id === id;
}

export async function runAbortableStage<T>(options: {
  label: string;
  timeoutMs: number;
  parentSignal?: AbortSignal;
  run: (signal: AbortSignal) => Promise<T>;
}): Promise<T> {
  const controller = new AbortController();
  const relay = (): void => controller.abort(
    options.parentSignal?.reason ?? new DOMException("Cancelled", "AbortError")
  );
  options.parentSignal?.addEventListener("abort", relay, { once: true });
  if (options.parentSignal?.aborted) relay();
  const timer = setTimeout(
    () => controller.abort(new Error(options.label + " timed out")),
    options.timeoutMs
  );
  try {
    return await options.run(controller.signal);
  } finally {
    clearTimeout(timer);
    options.parentSignal?.removeEventListener("abort", relay);
  }
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
