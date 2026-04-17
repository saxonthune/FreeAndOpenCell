import { createMemo } from 'solid-js';
import type { Action } from 'engine';
import { gameStore } from './gameStore.js';
import { historyStore } from './historyStore.js';

export const legalActions = createMemo<Action[]>(() => {
  const _s = gameStore();
  throw new Error('not implemented');
});

export const legalTargets = createMemo<Set<string>>(() => {
  throw new Error('not implemented');
});

export const autoTarget = (_cardId: string): string | null => {
  throw new Error('not implemented');
};

export const isWon = createMemo<boolean>(() => {
  throw new Error('not implemented');
});

export const isStuck = createMemo<boolean>(() => {
  throw new Error('not implemented');
});

export const isGameOver = createMemo<boolean>(() => isWon() || isStuck());

export const canUndo = createMemo<boolean>(() => {
  if (isWon()) return false;
  return historyStore.head > 0;
});

export const canRedo = createMemo<boolean>(
  () => historyStore.head < historyStore.snapshots.length - 1,
);

export const moveCount = createMemo<number>(() => historyStore.head);

export const moveCountLifetime = createMemo<number>(() => {
  throw new Error('not implemented');
});
