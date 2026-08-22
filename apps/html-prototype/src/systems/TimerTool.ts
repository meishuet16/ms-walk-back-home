export type TimerMode = "timer" | "stopwatch";
export type TimerState = { mode: TimerMode; durationMs: number; startedAt: number | null; accumulatedMs: number; paused: boolean };

export function createTimerState(mode: TimerMode = "timer", durationMs = 0): TimerState {
  return { mode, durationMs: Math.max(0, durationMs), startedAt: null, accumulatedMs: 0, paused: true };
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (!state.paused) return state;
  return { ...state, startedAt: now, paused: false };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.paused || state.startedAt === null) return state;
  return { ...state, accumulatedMs: state.accumulatedMs + Math.max(0, now - state.startedAt), startedAt: null, paused: true };
}

export function resetTimer(state: TimerState): TimerState {
  return { ...state, startedAt: null, accumulatedMs: 0, paused: true };
}

export function elapsedMs(state: TimerState, now: number): number {
  return state.accumulatedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}

export function stopwatchElapsed(state: TimerState, now: number): number {
  return elapsedMs(state, now);
}

export function timerRemaining(state: TimerState, now: number): number {
  return Math.max(0, state.durationMs - elapsedMs(state, now));
}
