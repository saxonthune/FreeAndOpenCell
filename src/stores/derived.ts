import type { Action } from 'engine';
import {
  isStuck as engineIsStuck,
  isWon as engineIsWon,
  legalActions as engineLegalActions,
} from 'engine';
import { createEffect, createMemo } from 'solid-js';
import { gameStore } from './gameStore.js';
import { historyStore } from './historyStore.js';
import { pauseTimer } from './timerStore.js';
import { uiStore } from './uiStore.js';

export const legalActions = createMemo<Action[]>(() => {
  const s = gameStore();
  return engineLegalActions(s);
});

export const legalTargets = createMemo<Set<string>>(() => {
  const drag = uiStore.drag;
  if (drag === null) return new Set();
  const sourceId = drag.sourceId;
  const targets = new Set<string>();
  for (const a of legalActions()) {
    if (a.type === 'MOVE_STACK' && a.from === sourceId) {
      targets.add(a.to);
    }
  }
  return targets;
});

export function autoTarget(cardId: string): string | null {
  const s = gameStore();
  for (const a of engineLegalActions(s)) {
    if (
      a.type === 'MOVE_STACK' &&
      a.from === cardId &&
      a.to.startsWith('foundation.')
    ) {
      return a.to;
    }
  }
  return null;
}

export const isWon = createMemo<boolean>(() => engineIsWon(gameStore()));

export const isStuck = createMemo<boolean>(() => engineIsStuck(gameStore()));

export const isGameOver = createMemo<boolean>(() => isWon() || isStuck());

export const canUndo = createMemo<boolean>(() => {
  if (isWon()) return false;
  return historyStore.head > 0;
});

export const canRedo = createMemo<boolean>(
  () => historyStore.head < historyStore.snapshots.length - 1,
);

export const moveCount = createMemo<number>(() => historyStore.head);

export const moveCountLifetime = createMemo<number>(
  () => gameStore().moveCountLifetime,
);

// Pause timer when game reaches a terminal state
createEffect(() => {
  if (isGameOver()) pauseTimer();
});
