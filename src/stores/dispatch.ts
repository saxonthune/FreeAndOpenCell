import type { Action } from 'engine';
import { applyAction } from 'engine';
import { isStuck, isWon } from './derived.js';
import { gameStore, setGameState } from './gameStore.js';
import {
  clearHistory,
  historyStore,
  pushHistory,
  redo,
  undo,
} from './historyStore.js';
import { resetTimer, startTimer } from './timerStore.js';
import { closeModal } from './uiStore.js';

export function doMove(from: string, count: number, to: string): void {
  const result = applyAction(gameStore(), {
    type: 'MOVE_STACK',
    from,
    count,
    to,
  });
  if (!result.ok) return;
  setGameState(result.value);
  pushHistory(result.value);
}

export function newGame(seed?: number): void {
  const action: Action = {
    type: 'NEW_GAME',
    ...(seed !== undefined ? { seed } : {}),
  };
  const result = applyAction(gameStore(), action);
  if (!result.ok) return;
  setGameState(result.value);
  clearHistory(result.value);
  resetTimer();
  startTimer();
  closeModal();
}

export function restartGame(): void {
  const result = applyAction(gameStore(), { type: 'RESTART_GAME' });
  if (!result.ok) return;
  setGameState(result.value);
  clearHistory(result.value);
  resetTimer();
  startTimer();
  closeModal();
}

export function doUndo(): void {
  if (historyStore.head <= 0) return;
  undo();
  const snap = historyStore.snapshots[historyStore.head];
  if (snap) {
    setGameState(snap);
    if (!isWon() && !isStuck()) startTimer();
  }
}

export function doRedo(): void {
  if (historyStore.head >= historyStore.snapshots.length - 1) return;
  redo();
  const snap = historyStore.snapshots[historyStore.head];
  if (snap) setGameState(snap);
}
