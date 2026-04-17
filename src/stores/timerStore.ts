import { createStore } from 'solid-js/store';

export interface TimerState {
  elapsedMs: number;
  running: boolean;
}

export const [timerStore, setTimerStore] = createStore<TimerState>({
  elapsedMs: 0,
  running: false,
});

export function startTimer(): void {
  setTimerStore('running', true);
}

export function pauseTimer(): void {
  setTimerStore('running', false);
}

export function resetTimer(): void {
  setTimerStore({ elapsedMs: 0, running: false });
}
