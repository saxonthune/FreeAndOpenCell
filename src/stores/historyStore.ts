import { createStore } from 'solid-js/store';
import type { GameState } from 'engine';

export interface HistoryState {
  snapshots: GameState[];
  head: number;
}

export const [historyStore, setHistoryStore] = createStore<HistoryState>({
  snapshots: [],
  head: 0,
});

export function pushHistory(_state: GameState): void {
  throw new Error('not implemented');
}

export function undo(): void {
  throw new Error('not implemented');
}

export function redo(): void {
  throw new Error('not implemented');
}

export function clearHistory(): void {
  setHistoryStore({ snapshots: [], head: 0 });
}
