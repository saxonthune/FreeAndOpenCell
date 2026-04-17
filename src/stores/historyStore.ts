import type { GameState } from 'engine';
import { createStore } from 'solid-js/store';

export interface HistoryState {
  snapshots: GameState[];
  head: number;
}

export const [historyStore, setHistoryStore] = createStore<HistoryState>({
  snapshots: [],
  head: 0,
});

export function pushHistory(state: GameState): void {
  const tip = historyStore.head;
  const truncated = historyStore.snapshots.slice(0, tip + 1);
  truncated.push(state);
  setHistoryStore({ snapshots: truncated, head: truncated.length - 1 });
}

export function undo(): void {
  if (historyStore.head > 0) {
    setHistoryStore('head', historyStore.head - 1);
  }
}

export function redo(): void {
  if (historyStore.head < historyStore.snapshots.length - 1) {
    setHistoryStore('head', historyStore.head + 1);
  }
}

export function clearHistory(initialState?: GameState): void {
  if (initialState !== undefined) {
    setHistoryStore({ snapshots: [initialState], head: 0 });
  } else {
    setHistoryStore({ snapshots: [], head: 0 });
  }
}
